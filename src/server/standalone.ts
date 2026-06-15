import express from 'express';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { GeminiParser } from '../core/GeminiParser';
import { FlowScanner } from '../core/FlowScanner';
import { ProjectMetadata } from '../core/ProjectMetadata';
import { SymbolIndex } from '../core/SymbolIndex';
import { RuntimeInitializer } from '../core/collaboration/RuntimeInitializer';
import { AccountManager } from '../core/collaboration/AccountManager';
import { RestCollaborationTransport } from '../core/collaboration/RestCollaborationTransport';
import { SubmissionManager } from '../core/collaboration/SubmissionManager';
import { IdentityManager } from '../core/collaboration/IdentityManager';
import { SessionManager } from '../core/collaboration/SessionManager';
import { HarvestEngine, HarvestInput, LayerHarvestInput } from '../core/collaboration/HarvestEngine';
import { ArchitectureIndexBuilder } from '../core/collaboration/ArchitectureIndexBuilder';
import { ReferenceVerifier } from '../core/collaboration/ReferenceVerifier';
import { SynapseIgnore } from '../core/SynapseIgnore';
import { BoundaryGuard, BoundaryError } from '../core/collaboration/BoundaryGuard';
import { MountManager, MountConfig, validateMountPath } from '../core/collaboration/MountManager';
import { Logger } from '../utils/Logger';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Auth middleware: 모든 /api/* 요청에 대해 bearer token 검증 (단, /api/auth/login 제외)
app.use('/api', (req, res, next) => {
    if (req.path === '/auth/login') return next();
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
    }
    const token = authHeader.slice(7);
    const session = sessions.get(token);
    if (!session) {
        res.status(401).json({ success: false, error: 'Invalid or expired token' });
        return;
    }
    (req as any).userId = session.userId;
    (req as any).username = session.username;
    next();
});

// 프로젝트 루트 경로 설정
// 우선순위: --root CLI 인자 > SYNAPSE_PROJECT_ROOT 환경변수 > process.cwd()
const projectRootArgIndex = process.argv.indexOf('--root');
const projectRoot = projectRootArgIndex !== -1
    ? path.resolve(process.argv[projectRootArgIndex + 1])
    : (process.env.SYNAPSE_PROJECT_ROOT
        ? path.resolve(process.env.SYNAPSE_PROJECT_ROOT)
        : process.cwd());

// 포트 설정: --port CLI 인자 > PORT 환경변수 > 3000 기본값
const portArgIndex = process.argv.indexOf('--port');
const port = portArgIndex !== -1
    ? parseInt(process.argv[portArgIndex + 1], 10)
    : (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);

if (isNaN(port) || port < 1024 || port > 65535) {
    console.error(`[SYNAPSE] Invalid port: ${port}. Must be 1024-65535.`);
    process.exit(1);
}

const serverName = path.basename(projectRoot);
let actualPort: number = port;
const uiRoot = path.resolve(__dirname, '../../ui');
const stateFilePath = path.join(projectRoot, 'data', 'project_state.json');

// Collaboration Transport 초기화
const dataDir = path.join(projectRoot, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
const meta = ProjectMetadata.getInstance();
meta.initialize(projectRoot, 'synapse-demo');
meta.loadSync();
SymbolIndex.getInstance().initialize('synapse-demo', projectRoot);
const ignore = new SynapseIgnore();
ignore.load(projectRoot);
SymbolIndex.getInstance().setIgnore(ignore);
RuntimeInitializer.getInstance().initialize(projectRoot, 'synapse-demo').catch(e => {
    console.warn('[Standalone] Runtime init deferred:', e.message);
});
AccountManager.getInstance().initialize(projectRoot);
MountManager.getInstance().initialize(projectRoot);
const transport = new RestCollaborationTransport();

// Session token store: token → user info
const sessions = new Map<string, { userId: string; username: string; connectedSince: number }>();
console.log('🚀 SYNAPSE Standalone Dev Server starting...');
console.log(`📂 Root: ${projectRoot}`);
console.log(`🏷️  Server: ${serverName}`);
console.log(`🆔 UUID: ${ProjectMetadata.getInstance().get().projectUUID}`);
console.log(`🔌 Port: ${port}`);
console.log(`📄 State: ${stateFilePath}`);

function isNodeFileIgnored(node: any): boolean {
    const fp = node?.data?.file || node?.data?.path || node?.filePath || '';
    if (!fp) return false;
    return ignore.isIgnored(fp);
}

// State API (static file + mounted client directories)
app.get('/api/state', (req, res) => {
    if (fs.existsSync(stateFilePath)) {
        try {
            const state = JSON.parse(fs.readFileSync(stateFilePath, 'utf-8'));
            if (!state.nodes) state.nodes = [];
            if (!state.edges) state.edges = [];
            if (!state.clusters) state.clusters = [];
            state.nodes = state.nodes.filter((n: any) => !isNodeFileIgnored(n));
            // Mounted client directories: scan and merge
            for (const m of MountManager.getInstance().getAllMounts()) {
                const scanned = MountManager.getInstance().scanMount(m.username);
                if (scanned.nodes.length > 0) {
                    for (const n of scanned.nodes) {
                        state.nodes.push({ ...n, clientLayer: m.username, data: { ...n.data, clientLayer: m.username } });
                    }
                    for (const e of scanned.edges) state.edges.push(e);
                    for (const c of scanned.clusters) {
                        state.clusters.push({ ...c, clientLayer: m.username, data: { ...c.data, clientLayer: m.username } });
                    }
                    Logger.info(`[MountManager] Scanned ${scanned.nodes.length} nodes from mounted client: ${m.username}`);
                }
            }
            res.json({ success: true, state });
        } catch (e: any) {
            res.status(500).json({ success: false, error: 'Failed to parse state file: ' + e.message });
        }
    } else {
        res.status(404).json({ success: false, error: 'State file not found' });
    }
});

// 1. 노드 승인 및 분석 (V 버튼)
app.post('/api/analyze', async (req, res) => {
    const { filePath } = req.body;
    console.log(`[API] analyze: ${filePath}`);

    try {
        // Ignore 체크
        if (ignore.isIgnored(filePath)) {
            res.status(403).json({ success: false, error: 'File is ignored by .synapseignore' });
            return;
        }
        // 경로 해결: 루트 또는 src 폴더 확인
        let fullPath = path.join(projectRoot, filePath);
        if (!meta.validatePath(fullPath)) {
            res.status(403).json({ success: false, error: 'File outside project boundary' });
            return;
        }
        if (!fs.existsSync(fullPath)) {
            const srcPath = path.join(projectRoot, 'src', filePath);
            if (fs.existsSync(srcPath) && meta.validatePath(srcPath)) {
                fullPath = srcPath;
            }
        }

        console.log(`  - Resolving path: ${fullPath}`);
        if (!fs.existsSync(fullPath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const ext = path.extname(fullPath);
        let summaryResult: any = null;

        if (ext === '.md') {
            const parser = new GeminiParser();
            summaryResult = await parser.parseGeminiMd(fullPath);
        } else {
            // 소스 파일이면 FlowScanner 사용
            const scanner = new FlowScanner();
            const flowData = scanner.scanForFlow(fullPath);
            summaryResult = {
                functions: flowData.steps.filter((s: any) => s.type === 'process' || s.type === 'decision').map((s: any) => s.label),
                classes: [] // TODO: 클래스 추출 로직 추가 가능
            };
        }

        // 현재 상태 업데이트
        if (fs.existsSync(stateFilePath)) {
            const currentState = JSON.parse(fs.readFileSync(stateFilePath, 'utf-8'));
            const node = currentState.nodes.find((n: any) => n.data.file === filePath || n.data.path === filePath);
            if (node) {
                console.log(`  - Updating node ${node.id} to active`);
                node.status = 'active';
                node.state = 'active';
                node.data.summary = summaryResult;
                fs.writeFileSync(stateFilePath, JSON.stringify(currentState, null, 2), 'utf-8');
            }
        }

        res.json({ success: true, summary: summaryResult });
    } catch (error) {
        console.error('[API] analyze error:', error);
        res.status(500).json({ success: false, error: String(error) });
    }
});

// 2. 흐름 스캔
app.post('/api/scan', async (req, res) => {
    const { filePath } = req.body;
    console.log(`[API] scanFlow: ${filePath}`);

    const scanner = new FlowScanner();
    try {
        if (ignore.isIgnored(filePath)) {
            res.status(403).json({ success: false, error: 'File is ignored by .synapseignore' });
            return;
        }
        const rawPath = path.isAbsolute(filePath) ? filePath : path.join(projectRoot, filePath);
        if (!meta.validatePath(rawPath)) {
            res.status(403).json({ success: false, error: 'File outside project boundary' });
            return;
        }
        const fullPath = rawPath;
        const flowData = scanner.scanForFlow(fullPath);
        res.json({ success: true, flowData });
    } catch (error) {
        console.error('[API] scanFlow error:', error);
        res.status(500).json({ success: false, error: String(error) });
    }
});

// 3. 상태 저장 (UI에서 호출)
app.post('/api/save-state', (req, res) => {
    try {
        const state = req.body;
        fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf-8');
        console.log('✅ Project state saved to file system');
        res.json({ success: true });
    } catch (error) {
        console.error('[API] saveState error:', error);
        res.status(500).json({ success: false, error: String(error) });
    }
});

// 4. 히스토리 조회
app.get('/api/history', (req, res) => {
    try {
        const historyPath = path.join(projectRoot, 'data', 'synapse_history.json');
        if (fs.existsSync(historyPath)) {
            const history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
            res.json({ success: true, history });
        } else {
            res.json({ success: true, history: [] });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// 5. 스냅샷 저장
app.post('/api/snapshot', (req, res) => {
    try {
        const { label, data } = req.body;
        const historyPath = path.join(projectRoot, 'data', 'synapse_history.json');
        let history = [];
        if (fs.existsSync(historyPath)) {
            history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
        }

        const snapshot = {
            id: `snap_${Date.now()}`,
            timestamp: Date.now(),
            label: label || `Snapshot ${history.length + 1}`,
            data: data
        };

        history.unshift(snapshot);
        fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8');
        res.json({ success: true, snapshot });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// 6. 롤백
app.post('/api/rollback', (req, res) => {
    try {
        const { snapshotId } = req.body;
        const historyPath = path.join(projectRoot, 'data', 'synapse_history.json');
        if (!fs.existsSync(historyPath)) throw new Error('History not found');

        const history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
        const snapshot = history.find((s: any) => s.id === snapshotId);

        if (snapshot) {
            fs.writeFileSync(stateFilePath, JSON.stringify(snapshot.data, null, 2), 'utf-8');
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, error: 'Snapshot not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Server Info (서버 식별 정보)
app.get('/api/server/info', (_req, res) => {
    const schema = ProjectMetadata.getInstance().get();
    res.json({
        serverName,
        projectUUID: schema.projectUUID,
        projectRoot,
        port
    });
});

// 7. Authentication
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password, sshHost, sshPort, sshUser, sshMountPath, sshKey } = req.body;
        if (!username || !password) { res.status(400).json({ success: false, error: 'username and password required' }); return; }
        const user = await transport.login(username, password);
        if (!user) { res.status(401).json({ success: false, error: 'Invalid credentials' }); return; }
        const schema = ProjectMetadata.getInstance().get();
        const token = crypto.randomUUID();
        sessions.set(token, { userId: user.userId || '', username: user.username || '', connectedSince: Date.now() });
        // 로그인 시 SSH 정보가 함께 전달되면 계정에 저장
        if (sshHost || sshMountPath) {
            try {
                AccountManager.getInstance().updateSSHInfo(username, { sshHost, sshPort, sshUser, sshMountPath, sshKey });
                // 계정에 저장된 SSH 정보로 user 객체 갱신
                const updated = AccountManager.getInstance().login(username, password);
                if (updated) {
                    user.sshHost = updated.sshHost;
                    user.sshPort = updated.sshPort;
                    user.sshUser = updated.sshUser;
                    user.sshMountPath = updated.sshMountPath;
                    user.sshKey = updated.sshKey;
                }
            } catch (err: any) {
                Logger.warn(`[Auth] Failed to update SSH info for ${username}: ${err.message}`);
            }
        }
        // SSH 마운트 정보가 있으면 자동 마운트 (백그라운드, 실패해도 로그인은 성공)
        if (user.sshHost && user.sshMountPath) {
            const mountConfig: MountConfig = {
                username: user.username,
                sshHost: user.sshHost,
                sshPort: user.sshPort || 22,
                sshUser: user.sshUser || user.username,
                remotePath: user.sshMountPath,
                sshKey: user.sshKey,
            };
            MountManager.getInstance().mount(mountConfig).then(() => {
                Logger.info(`[Auth] Mounted client workspace: ${user.username} → ${user.sshHost}:${user.sshMountPath}`);
            }).catch((err: Error) => {
                Logger.warn(`[Auth] Mount failed for ${user.username}: ${err.message}`);
            });
        }
        res.json({
            success: true,
            user,
            token,
            server: {
                serverName,
                projectUUID: schema.projectUUID,
                projectRoot,
                port
            }
        });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const session = sessions.get(token);
        if (session) {
            MountManager.getInstance().unmount(session.username);
        }
        sessions.delete(token);
    }
    res.json({ success: true });
});

// 7b. Admin
app.post('/api/admin/assign-role', async (req, res) => {
    try {
        const { projectUUID, userId, role } = req.body;
        if (!projectUUID || !userId || !role) { res.status(400).json({ success: false, error: 'projectUUID, userId, role required' }); return; }
        const result = IdentityManager.getInstance().assignRole(projectUUID, userId, role);
        res.json({ success: true, role: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/admin/create-account', async (req, res) => {
    try {
        const { username, password, sshHost, sshPort, sshUser, sshMountPath, sshKey } = req.body;
        if (!username || !password) { res.status(400).json({ success: false, error: 'username and password required' }); return; }
        if (sshMountPath && !validateMountPath(sshMountPath)) {
            res.status(400).json({ success: false, error: `Invalid sshMountPath: "${sshMountPath}". Must be an absolute project path (not "/", no "../", no "~").` });
            return;
        }
        const account = AccountManager.getInstance().createAccount(username, password, { sshHost, sshPort, sshUser, sshMountPath, sshKey });
        res.json({ success: true, user: { userId: account.userId, username: account.username, createdAt: account.createdAt } });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/admin/delete-account', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) { res.status(400).json({ success: false, error: 'username required' }); return; }
        const deleted = AccountManager.getInstance().deleteAccount(username);
        if (!deleted) { res.status(404).json({ success: false, error: 'Account not found' }); return; }
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/admin/change-password', async (req, res) => {
    try {
        const { username, newPassword } = req.body;
        if (!username || !newPassword) { res.status(400).json({ success: false, error: 'username and newPassword required' }); return; }
        const changed = AccountManager.getInstance().changePassword(username, newPassword);
        if (!changed) { res.status(404).json({ success: false, error: 'Account not found' }); return; }
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.get('/api/admin/accounts', async (_req, res) => {
    try {
        const accounts = AccountManager.getInstance().getAllAccounts();
        res.json({ success: true, accounts });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/admin/connected-clients', (_req, res) => {
    const clients = Array.from(sessions.values()).map(s => ({
        userId: s.userId,
        username: s.username,
        connectedSince: s.connectedSince
    }));
    res.json({ success: true, clients });
});

const synapseignorePath = path.join(projectRoot, '.synapseignore');

app.get('/api/admin/synapseignore', async (_req, res) => {
    try {
        if (fs.existsSync(synapseignorePath)) {
            const content = fs.readFileSync(synapseignorePath, 'utf-8');
            res.json({ success: true, content });
        } else {
            res.json({ success: true, content: '' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/admin/synapseignore', async (req, res) => {
    try {
        const { content } = req.body;
        if (content === undefined) { res.status(400).json({ success: false, error: 'content required' }); return; }
        fs.writeFileSync(synapseignorePath, content, 'utf-8');
        ignore.load(projectRoot);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 8. Collaboration Transport Routes
app.post('/api/collab/session', async (req, res) => {
    try {
        const { projectUUID, leadId } = req.body;
        if (!projectUUID) { res.status(400).json({ success: false, error: 'projectUUID required' }); return; }
        const session = await transport.createSession(projectUUID, leadId);
        res.json({ success: true, session });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/collab/session/join', async (req, res) => {
    try {
        const { sessionId, userId } = req.body;
        if (!sessionId || !userId) { res.status(400).json({ success: false, error: 'sessionId and userId required' }); return; }
        const session = await transport.joinSession(sessionId, userId);
        res.json({ success: true, session });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.get('/api/collab/sessions', async (_req, res) => {
    try {
        const sessions = SessionManager.getInstance().getAllSessions();
        res.json({ success: true, sessions });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/collab/session/close', async (req, res) => {
    try {
        const { sessionId, userId } = req.body;
        if (!sessionId || !userId) { res.status(400).json({ success: false, error: 'sessionId and userId required' }); return; }
        const sm = SessionManager.getInstance();
        const session = sm.getSession(sessionId);
        if (!session) { res.status(404).json({ success: false, error: 'Session not found' }); return; }
        const memberIds = [...session.members];
        sm.closeSession(sessionId, userId);
        res.json({ success: true, sessionId, closedMemberIds: memberIds });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/collab/session/leave', async (req, res) => {
    try {
        const { sessionId, userId } = req.body;
        if (!sessionId || !userId) { res.status(400).json({ success: false, error: 'sessionId and userId required' }); return; }
        const sm = SessionManager.getInstance();
        const session = sm.leaveSession(sessionId, userId);
        res.json({ success: true, session, leftUserId: userId });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/collab/submission', async (req, res) => {
    try {
        const { projectUUID, sessionId, clientId, filePaths, clientUsername } = req.body;
        if (!projectUUID || !sessionId || !clientId || !filePaths) {
            res.status(400).json({ success: false, error: 'projectUUID, sessionId, clientId, filePaths required' }); return;
        }
        const username = clientUsername || AccountManager.getInstance().getUsernameByUserId(clientId) || clientId;
        const snapshot = await transport.createSubmission(projectUUID, sessionId, clientId, filePaths, username);
        res.json({ success: true, submission: snapshot });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.get('/api/collab/submission/:id', async (req, res) => {
    try {
        const reviewState = await transport.getReviewState(req.params.id);
        if (!reviewState) { res.status(404).json({ success: false, error: 'Submission not found' }); return; }
        res.json({ success: true, reviewState });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.get('/api/collab/submissions', async (req, res) => {
    try {
        const { projectUUID } = req.query;
        if (!projectUUID) { res.status(400).json({ success: false, error: 'projectUUID required' }); return; }
        const submissions = SubmissionManager.getInstance().getSubmissionsByProject(projectUUID as string);
        const result = submissions.map(s => ({
            ...s,
            reviewState: SubmissionManager.getInstance().getReviewState(s.id),
        }));
        res.json({ success: true, submissions: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/collab/review', async (req, res) => {
    try {
        const { submissionId, leadId } = req.body;
        if (!submissionId || !leadId) { res.status(400).json({ success: false, error: 'submissionId and leadId required' }); return; }
        const reviewState = SubmissionManager.getInstance().startReview(submissionId, leadId);
        res.json({ success: true, reviewState });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/collab/approve', async (req, res) => {
    try {
        const { submissionId, leadId, notes } = req.body;
        if (!submissionId || !leadId) { res.status(400).json({ success: false, error: 'submissionId and leadId required' }); return; }
        const reviewState = SubmissionManager.getInstance().approveSubmission(submissionId, leadId, notes);
        res.json({ success: true, reviewState });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/collab/reject', async (req, res) => {
    try {
        const { submissionId, leadId, reason } = req.body;
        if (!submissionId || !leadId) { res.status(400).json({ success: false, error: 'submissionId and leadId required' }); return; }
        if (!reason) { res.status(400).json({ success: false, error: 'reason required' }); return; }
        const reviewState = SubmissionManager.getInstance().rejectSubmission(submissionId, leadId, reason);
        res.json({ success: true, reviewState });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/collab/index', async (req, res) => {
    try {
        const { submissionId } = req.body;
        if (!submissionId) { res.status(400).json({ success: false, error: 'submissionId required' }); return; }
        const snapshot = SubmissionManager.getInstance().getSubmission(submissionId);
        if (!snapshot) { res.status(404).json({ success: false, error: 'Submission not found' }); return; }
        const index = ArchitectureIndexBuilder.getInstance().build(snapshot, 'synapse-demo');
        res.json({ success: true, index });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/collab/verify', async (req, res) => {
    try {
        const { submissionId } = req.body;
        if (!submissionId) { res.status(400).json({ success: false, error: 'submissionId required' }); return; }
        const snapshot = SubmissionManager.getInstance().getSubmission(submissionId);
        if (!snapshot) { res.status(404).json({ success: false, error: 'Submission not found' }); return; }
        const index = ArchitectureIndexBuilder.getInstance().build(snapshot, 'synapse-demo');
        const report = ReferenceVerifier.getInstance().verify(index, snapshot);
        const candidates = ReferenceVerifier.getInstance().generateCandidates(report, 'prepare_harvest', submissionId, snapshot.projectUUID);
        res.json({ success: true, report, candidates });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/collab/harvest', async (req, res) => {
    try {
        const { submissionId, projectUUID, approvedFiles, filePaths, clientId } = req.body;
        if (!submissionId || !projectUUID) {
            res.status(400).json({ success: false, error: 'submissionId and projectUUID required' });
            return;
        }

        // BoundaryGuard: Harvest 권한 확인 (clientId가 제공된 경우에만)
        if (clientId) {
            try {
                BoundaryGuard.getInstance().assertHarvestAuth(projectUUID, clientId);
            } catch (e) {
                res.status(403).json({ success: false, error: e instanceof BoundaryError ? e.message : 'Harvest authorization denied' });
                return;
            }
        }

        let files: { filePath: string; content: string; encoding?: string }[];

        // 우선: SubmissionManager에서 승인된 submission 조회
        const snapshot = SubmissionManager.getInstance().getSubmission(submissionId);
        if (snapshot) {
            console.log(`[HARVEST] Using submission snapshot: ${submissionId}`);
            files = snapshot.files.map(f => ({ filePath: f.filePath, content: f.content, encoding: f.encoding }));
        } else if (approvedFiles && Array.isArray(approvedFiles)) {
            console.warn(`[HARVEST_DEPRECATED] approvedFiles input will be removed in v0.3.32. Use submissionId-based harvest instead.`);
            files = approvedFiles;
            for (const f of files) {
                if (!f.filePath || f.content === undefined) {
                    res.status(400).json({ success: false, error: 'Each approvedFile must have filePath and content' });
                    return;
                }
            }
        } else if (filePaths && Array.isArray(filePaths)) {
            console.warn(`[HARVEST_DEPRECATED] filePaths input will be removed in v0.3.32. Use submissionId-based harvest instead.`);
            files = filePaths.map(fp => {
                const resolvedPath = path.resolve(projectRoot, fp);
                if (!ProjectMetadata.getInstance().validatePath(resolvedPath)) {
                    throw new Error(`File outside project boundary: ${fp}`);
                }
                return {
                    filePath: fp,
                    content: fs.readFileSync(resolvedPath, 'utf8'),
                    encoding: 'utf8',
                };
            });
        } else {
            res.status(400).json({ success: false, error: 'No files found for submissionId' });
            return;
        }

        if (files.length === 0) {
            res.status(400).json({ success: false, error: 'No matching files found for harvest' });
            return;
        }

        const input: HarvestInput = {
            submissionId,
            projectUUID,
            approvedFiles: files,
            originalSnapshot: snapshot || {
                id: submissionId,
                projectUUID,
                sessionId: req.body.sessionId || 'harvest',
                clientId: 'server',
                files,
                timestamp: Date.now(),
                immutable: true,
            },
            verificationReport: {
                generatedAt: Date.now(),
                graph: { fileNodes: [], ghostNodes: [], edges: [], clusters: [] },
                findings: [],
                stats: {
                    totalFiles: files.length,
                    totalEdges: 0,
                    totalGhosts: 0,
                    resolvedReferences: 0,
                    unresolvedReferences: 0,
                    disconnectedFiles: 0,
                },
            },
        };

        const result = HarvestEngine.getInstance().harvest(input);
        res.json({ success: true, result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/collab/harvest-layers', async (req, res) => {
    try {
        const { projectUUID, sessionId, clientLayerIds, username } = req.body;
        if (!projectUUID || !sessionId || !clientLayerIds || !Array.isArray(clientLayerIds) || clientLayerIds.length === 0) {
            res.status(400).json({ success: false, error: 'projectUUID, sessionId, and clientLayerIds[] are required' });
            return;
        }

        const input: LayerHarvestInput = { projectUUID, sessionId, clientLayerIds, username };
        const results = HarvestEngine.getInstance().harvestLayers(input);
        res.json({ success: true, results });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mount management
app.get('/api/admin/mounts', (_req, res) => {
    res.json({ success: true, mounts: MountManager.getInstance().getAllMounts() });
});

app.post('/api/admin/mount', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) { res.status(400).json({ success: false, error: 'username required' }); return; }
        const account = AccountManager.getInstance().getAccount(username);
        if (!account || !account.sshHost || !account.sshMountPath) {
            res.status(400).json({ success: false, error: `Account ${username} has no SSH mount configuration` });
            return;
        }
        const mountConfig: MountConfig = {
            username: account.username,
            sshHost: account.sshHost,
            sshPort: account.sshPort || 22,
            sshUser: account.sshUser || account.username,
            remotePath: account.sshMountPath,
            sshKey: account.sshKey,
        };
        const mountPoint = await MountManager.getInstance().mount(mountConfig);
        res.json({ success: true, mountPoint, username });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/admin/unmount', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) { res.status(400).json({ success: false, error: 'username required' }); return; }
        await MountManager.getInstance().unmount(username);
        res.json({ success: true, username });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/admin/mount-scan/:username', (req, res) => {
    try {
        const { username } = req.params;
        const result = MountManager.getInstance().scanMount(username);
        res.json({ success: true, username, ...result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 브라우저 UI는 제공하지 않음 — VS Code 전용
app.get('{*path}', (_req, res) => {
    const effectivePort = typeof actualPort !== 'undefined' ? actualPort : port;
    res.type('html').send(`<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"><title>Synapse</title></head>
<body style="background:#1d2021;color:#ebdbb2;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
<div style="text-align:center">
<h1>🔌 Synapse</h1>
<p style="color:#928374;">VS Code &#x1FA7E; extension &#xC73C;&#xB85C; &#xC811;&#xC18D;&#xD558;&#xC138;&#xC694;.</p>
<pre style="color:#504945;font-size:12px;margin-top:24px;">${serverName} — port ${effectivePort}</pre>
</div></body></html>`);
});

function tryListen(port: number, maxAttempts: number = 10): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = app.listen(port, '0.0.0.0');
        server.on('listening', () => resolve(port));
        server.on('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'EADDRINUSE' && maxAttempts > 0) {
                server.close(() => {
                    tryListen(port + 1, maxAttempts - 1).then(resolve, reject);
                });
            } else {
                reject(err);
            }
        });
    });
}

(async () => {
    try {
        actualPort = await tryListen(port);
        const serverInfoPath = path.join(projectRoot, 'data', '.server_info');
        const schema = ProjectMetadata.getInstance().get();
        const adminToken = crypto.randomUUID();
        sessions.set(adminToken, {
            userId: '_server_admin_',
            username: 'Server Admin',
            connectedSince: Date.now()
        });
        fs.writeFileSync(serverInfoPath, JSON.stringify({
            port: actualPort,
            projectUUID: schema.projectUUID,
            serverName,
            adminToken
        }, null, 2));
        console.log(`\n✅ Standalone API server running at http://0.0.0.0:${actualPort}`);
        console.log(`ℹ️  API only — no browser UI served.`);
    } catch (err: any) {
        console.error(`❌ Failed to start server: ${err.message}`);
        process.exit(1);
    }
})();
