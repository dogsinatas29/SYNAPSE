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
import { IdentityManager } from '../core/collaboration/IdentityManager';
import { SessionManager } from '../core/collaboration/SessionManager';
import { HarvestEngine } from '../core/collaboration/HarvestEngine';
import { HarvestSessionManager } from '../core/collaboration/HarvestSessionManager';
import { CompareEngine } from '../core/collaboration/CompareEngine';
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
    if (req.path === '/auth/login' || req.path === '/admin/auth') return next();
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
let httpServer: any = null;
const uiRoot = path.resolve(__dirname, '../../ui');
const stateFilePath = path.join(projectRoot, 'data', 'project_state.json');
const ADMIN_SECRET = crypto.randomBytes(32).toString('hex');
const SERVER_VERSION = '0.3.30';

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
MountManager.getInstance().setIgnore(ignore);
const transport = new RestCollaborationTransport();

// Session token store: token → user info
const sessions = new Map<string, { userId: string; username: string; connectedSince: number }>();
// Client-pushed data store: userId → { nodes, edges, clusters }
const clientPushData = new Map<string, { nodes: any[]; edges: any[]; clusters: any[]; pushedAt: number }>();

// SSE Client stream store: userId -> express.Response
const sseClients = new Map<string, any>();
const lockedClients = new Map<string, { lockedAt: number, lockedBy: 'server' }>();
function isLocked(userId: string): boolean {
    return lockedClients.has(userId);
}
// Pending File Requests: ticketId -> { resolve: function, reject: function, timeout: NodeJS.Timeout }
const pendingRequests = new Map<string, { resolve: (val: any) => void, reject: (err: any) => void, timeout: NodeJS.Timeout }>();

// Node 정규화: position 등 필수 필드 보장
function normalizeNode(node: any): any {
    return {
        ...node,
        position: node.position ?? { x: 0, y: 0 }
    };
}

// clientPushData 영속화
const clientPushDir = path.join(projectRoot, 'data', 'client_push');
if (!fs.existsSync(clientPushDir)) fs.mkdirSync(clientPushDir, { recursive: true });
const PUSH_TTL_MS = 24 * 60 * 60 * 1000;
for (const file of fs.readdirSync(clientPushDir)) {
    if (!file.endsWith('.json')) continue;
    const filePath = path.join(clientPushDir, file);
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (Date.now() - data.pushedAt > PUSH_TTL_MS) {
            fs.unlinkSync(filePath);
            Logger.info(`[ClientPush] Removed stale cache: ${file}`);
            continue;
        }
        const userId = file.replace('.json', '');
        data.nodes = data.nodes.map(normalizeNode);
        clientPushData.set(userId, data);
    } catch {}
}
Logger.info(`[ClientPush] Restored ${clientPushData.size} client push cache(s)`);

// State version tracking (경량 갱신 감지용)
let stateVersion = 1;
const getStateVersion = () => stateVersion;
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

// Client push: 클라이언트가 자신의 파일 데이터를 서버에 전송
app.post('/api/client/push', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'Unauthorized' }); return;
    }
    const token = authHeader.slice(7);
    const session = sessions.get(token);
    if (!session) {
        res.status(401).json({ success: false, error: 'Invalid session' }); return;
    }
    const { nodes, edges, clusters } = req.body;
    if (!Array.isArray(nodes)) {
        res.status(400).json({ success: false, error: 'nodes array required' }); return;
    }
    const userId = session.userId;
    const username = session.username;
    const pushData = {
        nodes: nodes.map((n: any) => ({ ...n, clientLayer: userId, data: { ...n.data, clientLayer: userId, clientUsername: username } })),
        edges: edges || [],
        clusters: (clusters || []).map((c: any) => ({ ...c, clientLayer: userId, data: { ...c.data, clientLayer: userId, clientUsername: username } })),
        pushedAt: Date.now()
    };
    clientPushData.set(userId, pushData);

    // 영속화
    try {
        fs.writeFileSync(path.join(clientPushDir, `${userId}.json`), JSON.stringify(pushData, null, 2));
    } catch {}

    stateVersion++;

    Logger.info(`[ClientPush] Received ${nodes.length} nodes from ${username} (${userId}), stateVersion=${stateVersion}`);
    res.json({ success: true, userId, username, nodeCount: nodes.length });
});

// Phase 1B.3B: 클라이언트 노드 실시간 위치 영속화 (LWW 방식)
app.post('/api/client/position', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'Unauthorized' }); return;
    }
    const token = authHeader.slice(7);
    const session = sessions.get(token);
    if (!session) {
        res.status(401).json({ success: false, error: 'Invalid session' }); return;
    }
    const { updates } = req.body;
    if (!Array.isArray(updates)) {
        res.status(400).json({ success: false, error: 'updates array required' }); return;
    }
    
    let updatedCount = 0;
    const dirtyUsers = new Set<string>();

    for (const update of updates) {
        const { id, clientLayer, position, updatedAt } = update;
        if (!id || !clientLayer || !position || !updatedAt) continue;
        
        const pushData = clientPushData.get(clientLayer);
        if (!pushData) continue;
        
        const node = pushData.nodes.find((n: any) => n.id === id);
        if (!node) continue;
        
        if (!node.data) node.data = {};
        const existingState = node.data.positionState;
        
        // LWW (Last-Write-Wins) 충돌 해결
        if (!existingState || updatedAt > existingState.updatedAt) {
            node.position = position;
            node.data.positionState = {
                x: position.x,
                y: position.y,
                updatedAt: updatedAt,
                updatedBy: session.userId
            };
            updatedCount++;
            dirtyUsers.add(clientLayer);
        }
    }

    for (const userId of dirtyUsers) {
        const pushData = clientPushData.get(userId);
        if (pushData) {
            try {
                fs.writeFileSync(path.join(clientPushDir, `${userId}.json`), JSON.stringify(pushData, null, 2));
            } catch (e) {
                Logger.error(`Failed to save client push data for ${userId}`, e as Error);
            }
        }
    }

    if (updatedCount > 0) {
        stateVersion++;
    }

    res.json({ success: true, updatedCount });
});

// State API (static file + client-pushed data)
app.get('/api/state', (req, res) => {
    if (fs.existsSync(stateFilePath)) {
        try {
            const state = JSON.parse(fs.readFileSync(stateFilePath, 'utf-8'));
            if (!state.nodes) state.nodes = [];
            if (!state.edges) state.edges = [];
            if (!state.clusters) state.clusters = [];
            state.nodes = state.nodes.filter((n: any) => !isNodeFileIgnored(n));
            // Client-pushed data: Map 기반 병합 (ID 중복 시 클라이언트 데이터로 덮어쓰기)
            const nodeMap = new Map<string, any>();
            for (const n of state.nodes) nodeMap.set(n.id, n);
            const edgeMap = new Map<string, any>();
            for (const e of state.edges) edgeMap.set(e.id, e);
            const clusterMap = new Map<string, any>();
            for (const c of state.clusters) clusterMap.set(c.id, c);

            // Phase 1B.3: 오직 '현재 접속 중'인 클라이언트의 노드만 병합
            const activeUserIds = new Set(sseClients.keys());

            for (const [userId, clientData] of clientPushData.entries()) {
                if (!activeUserIds.has(userId)) continue;
                for (const n of clientData.nodes) nodeMap.set(n.id, n);
                for (const e of clientData.edges) edgeMap.set(e.id, e);
                for (const c of clientData.clusters) clusterMap.set(c.id, c);
                Logger.info(`[ClientPush] Merged ${clientData.nodes.length} nodes from ${userId}`);
            }
            state.nodes = Array.from(nodeMap.values()).map(normalizeNode);
            state.edges = Array.from(edgeMap.values());
            state.clusters = Array.from(clusterMap.values());
            res.json({ success: true, state });
        } catch (e: any) {
            res.status(500).json({ success: false, error: 'Failed to parse state file: ' + e.message });
        }
    } else {
        res.status(404).json({ success: false, error: 'State file not found' });
    }
});

// State version 엔드포인트 (경량 갱신 감지)
app.get('/api/version', (_req, res) => {
    res.json({ success: true, version: getStateVersion() });
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

// Ping (인증 불필요, 서버 식별용)
app.get('/api/ping', (_req, res) => {
    const schema = ProjectMetadata.getInstance().get();
    res.json({ ok: true, projectUUID: schema.projectUUID, serverName, version: SERVER_VERSION });
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

// Admin Auth (adminSecret → session token)
app.post('/api/admin/auth', (req, res) => {
    const { adminSecret } = req.body;
    if (!adminSecret || adminSecret !== ADMIN_SECRET) {
        res.status(401).json({ success: false, error: 'Invalid admin secret' });
        return;
    }
    const token = crypto.randomUUID();
    sessions.set(token, { userId: '_server_admin_', username: 'Server Admin', connectedSince: Date.now() });
    res.json({ success: true, token });
});

// 7. Authentication
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password, clientProjectRoot } = req.body;
        if (!username || !password) { res.status(400).json({ success: false, error: 'username and password required' }); return; }

        // 1. 인증
        const user = await transport.login(username, password);
        if (!user) { res.status(401).json({ success: false, error: 'Invalid credentials' }); return; }

        // 2. 세션 생성 (항상 — 마운트와 독립)
        const token = crypto.randomUUID();
        sessions.set(token, { userId: user.userId || '', username: user.username || '', connectedSince: Date.now() });

        const schema = ProjectMetadata.getInstance().get();

        // 3. 마운트 시도 (선택적 후처리)
        const clientIp = (req as any).ip || req.socket?.remoteAddress || (req as any).connection?.remoteAddress || '127.0.0.1';
        const cleanedIp = clientIp.replace(/^::ffff:/, '');

        let mountSuccess = false;
        let mountError: string | undefined;

        if (clientProjectRoot && validateMountPath(clientProjectRoot)) {
            const mountConfig: MountConfig = {
                username: user.username,
                sshHost: cleanedIp,
                sshPort: 22,
                sshUser: user.username,
                remotePath: clientProjectRoot,
            };
            // [v0.3.30] HARVEST ENGINE: SSHFS 마운트는 HTTP Push로 대체되었으므로 생략 (레거시 에러 방지)
            // try {
            //     await MountManager.getInstance().mount(mountConfig);
            //     mountSuccess = true;
            //     Logger.info(`[Auth] Mounted client workspace: ${user.username}@${cleanedIp}:${clientProjectRoot}`);
            // } catch (err: any) {
            //     mountError = err.message;
            //     Logger.warn(`[Auth] Mount failed for ${user.username}: ${err.message}`);
            // }
            mountSuccess = true;
            Logger.info(`[Auth] Client workspace registered (SSHFS Disabled): ${user.username}@${cleanedIp}:${clientProjectRoot}`);
        } else if (clientProjectRoot) {
            mountError = `Invalid project root: "${clientProjectRoot}"`;
        }

        // 4. 응답
        res.json({
            success: true,
            user,
            token,
            mountSuccess,
            mountError,
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
        const { username, password } = req.body;
        if (!username || !password) { res.status(400).json({ success: false, error: 'username and password required' }); return; }
        const account = AccountManager.getInstance().createAccount(username, password);
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
    const clients = Array.from(sessions.values())
        .filter(s => s.userId !== '_server_admin_')
        .map(s => ({
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

// 8b. SSE On-demand File Fetch Routes
app.get('/api/collab/stream', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'Unauthorized' }); return;
    }
    const token = authHeader.slice(7);
    const session = sessions.get(token);
    if (!session) {
        res.status(401).json({ success: false, error: 'Invalid session' }); return;
    }
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    const userId = session.userId;
    sseClients.set(userId, res);
    lockedClients.set(userId, { lockedAt: Date.now(), lockedBy: 'server' });
    Logger.info(`[SSE] Client ${session.username} connected and locked`);
    
    req.on('close', () => {
        if (sseClients.get(userId) === res) {
            sseClients.delete(userId);
            lockedClients.delete(userId);
            Logger.info(`[SSE] Client ${session.username} disconnected and unlocked`);
            // [v0.3.30] Force state refresh for all clients so ghost nodes disappear
            if (typeof (global as any).stateVersion !== 'undefined') {
                (global as any).stateVersion++;
            } else {
                // If it's a file-scoped variable, increment it directly. Let's see how it's defined.
                // Assuming stateVersion is in the same file scope:
                stateVersion++;
            }
        }
    });
});

app.post('/api/collab/request-file', (req, res) => {
    const { targetUserId, filePath } = req.body;
    if (!targetUserId || !filePath) { res.status(400).json({ success: false, error: 'targetUserId and filePath required' }); return; }
    
    const account = AccountManager.getInstance().getAccount(targetUserId);
    const resolvedUserId = account ? account.userId : targetUserId;
    
    const targetSse = sseClients.get(resolvedUserId);
    if (!targetSse) { res.status(404).json({ success: false, error: 'Target client is not connected' }); return; }
    
    const ticketId = crypto.randomUUID();
    
    const timeout = setTimeout(() => {
        if (pendingRequests.has(ticketId)) {
            pendingRequests.delete(ticketId);
            res.status(504).json({ success: false, error: 'File request timed out' });
        }
    }, 15000);
    
    pendingRequests.set(ticketId, {
        resolve: (content: string) => {
            clearTimeout(timeout);
            pendingRequests.delete(ticketId);
            res.json({ success: true, content });
        },
        reject: (error: string) => {
            clearTimeout(timeout);
            pendingRequests.delete(ticketId);
            res.status(500).json({ success: false, error });
        },
        timeout
    });
    
    targetSse.write(`data: ${JSON.stringify({ command: 'send_file_content', filePath, ticketId })}\n\n`);
});

app.post('/api/collab/save-file', (req, res) => {
    const { targetUserId, filePath, content } = req.body;
    if (!targetUserId || !filePath || content === undefined) { 
        res.status(400).json({ success: false, error: 'targetUserId, filePath, and content required' }); 
        return; 
    }
    
    const account = AccountManager.getInstance().getAccount(targetUserId);
    const resolvedUserId = account ? account.userId : targetUserId;
    
    if (!isLocked(resolvedUserId)) {
        res.status(403).json({ success: false, error: 'Client not locked — write rejected' });
        return;
    }
    
    const targetSse = sseClients.get(resolvedUserId);
    if (!targetSse) { 
        res.status(409).json({ success: false, error: 'Client connection lost' }); 
        return; 
    }
    
    targetSse.write(`data: ${JSON.stringify({ command: 'save_file_content', filePath, content })}\n\n`);
    res.json({ success: true });
});

app.post('/api/collab/response', (req, res) => {
    const { ticketId, content, error } = req.body;
    if (!ticketId) { res.status(400).json({ success: false, error: 'ticketId required' }); return; }
    
    const pending = pendingRequests.get(ticketId);
    if (pending) {
        if (error) {
            pending.reject(error);
        } else {
            pending.resolve(content);
        }
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, error: 'Ticket not found or expired' });
    }
});



app.post('/api/harvest/start', async (req, res) => {
    try {
        const { visibleClientIds } = req.body;
        const projectUUID = ProjectMetadata.getInstance().get().projectUUID;
        if (!visibleClientIds || !Array.isArray(visibleClientIds)) {
            res.status(400).json({ success: false, error: 'visibleClientIds[] required' });
            return;
        }

        const hsm = HarvestSessionManager.getInstance();
        const success = hsm.startSession(projectUUID, visibleClientIds);
        
        if (!success) {
            res.status(400).json({ success: false, error: 'Session already active or invalid state' });
            return;
        }

        // [v0.3.30] Broadcast Lock UI to clients
        visibleClientIds.forEach((userId: string) => {
            const targetSse = sseClients.get(userId);
            if (targetSse) {
                targetSse.write(`data: ${JSON.stringify({ command: 'session_locked', locked: true })}\n\n`);
            }
        });
        
        res.json({ success: true, state: hsm.getState() });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/harvest/compare', async (req, res) => {
    try {
        const { visibleClientIds } = req.body;
        if (!visibleClientIds) {
            res.status(400).json({ success: false, error: 'Missing visibleClientIds' });
            return;
        }

        const hsm = HarvestSessionManager.getInstance();
        if (hsm.getState() !== 'Locked' && hsm.getState() !== 'Comparing') {
            res.status(400).json({ success: false, error: 'Session must be Locked first' });
            return;
        }
        hsm.setState('Comparing');

        const requestClientHashes = (userId: string): Promise<any[]> => {
            return new Promise((resolve, reject) => {
                const targetSse = sseClients.get(userId);
                if (!targetSse) { reject('Client is not connected'); return; }
                
                const ticketId = crypto.randomUUID();
                const timeout = setTimeout(() => {
                    if (pendingRequests.has(ticketId)) {
                        pendingRequests.delete(ticketId);
                        reject('Hash request timed out (30s)');
                    }
                }, 30000);
                
                pendingRequests.set(ticketId, {
                    resolve: (data: any) => {
                        clearTimeout(timeout);
                        pendingRequests.delete(ticketId);
                        try {
                            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                            resolve(parsed);
                        } catch (e) {
                            reject('Invalid hash data received');
                        }
                    },
                    reject: (err: string) => {
                        clearTimeout(timeout);
                        pendingRequests.delete(ticketId);
                        reject(err);
                    },
                    timeout
                });
                
                targetSse.write(`data: ${JSON.stringify({ command: 'request_hashes', ticketId })}\n\n`);
            });
        };

        const results = await CompareEngine.getInstance().compare(visibleClientIds, requestClientHashes);
        
        hsm.setState('Approving');
        res.json({ success: true, results });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/harvest/execute', async (req, res) => {
    try {
        const { candidates } = req.body;
        const projectUUID = ProjectMetadata.getInstance().get().projectUUID;
        if (!candidates || !Array.isArray(candidates)) {
            res.status(400).json({ success: false, error: 'Missing candidates' });
            return;
        }

        const hsm = HarvestSessionManager.getInstance();
        if (hsm.getState() !== 'Approving') {
            res.status(400).json({ success: false, error: 'Session must be in Approving state' });
            return;
        }

        hsm.setState('Harvesting');

        const requestClientFile = (userId: string, filePath: string): Promise<string> => {
            return new Promise((resolve, reject) => {
                const targetSse = sseClients.get(userId);
                if (!targetSse) { reject('Client is not connected'); return; }
                
                const ticketId = crypto.randomUUID();
                const timeout = setTimeout(() => {
                    if (pendingRequests.has(ticketId)) {
                        pendingRequests.delete(ticketId);
                        reject('File request timed out (15s)');
                    }
                }, 15000);
                
                pendingRequests.set(ticketId, {
                    resolve: (data: any) => {
                        clearTimeout(timeout);
                        pendingRequests.delete(ticketId);
                        resolve(data);
                    },
                    reject: (err: string) => {
                        clearTimeout(timeout);
                        pendingRequests.delete(ticketId);
                        reject(err);
                    },
                    timeout
                });
                
                targetSse.write(`data: ${JSON.stringify({ command: 'send_file_content', filePath, ticketId })}\n\n`);
            });
        };

        let result;
        try {
            result = await HarvestEngine.getInstance().harvest(candidates, requestClientFile);
            res.json({ success: true, result });
        } finally {
            // [v0.3.30] Broadcast Unlock UI to clients before clearing them
            const lockedClients = hsm.getLockedClients();
            lockedClients.forEach((userId: string) => {
                const targetSse = sseClients.get(userId);
                if (targetSse) {
                    targetSse.write(`data: ${JSON.stringify({ command: 'session_locked', locked: false })}\n\n`);
                }
            });

            hsm.unlockSession();
        }
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});


// Mount management
app.get('/api/admin/mounts', (_req, res) => {
    res.json({ success: true, mounts: MountManager.getInstance().getAllMounts() });
});

// @deprecated — 로그인 시 자동 마운트. 수동 마운트가 필요하면 로그아웃 후 재로그인.
app.post('/api/admin/mount', async (_req, res) => {
    res.status(410).json({ success: false, error: 'Deprecated. Login triggers auto-mount.' });
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
        server.on('listening', () => {
            httpServer = server;
            resolve(port);
        });
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
        fs.writeFileSync(serverInfoPath, JSON.stringify({
            port: actualPort,
            pid: process.pid,
            projectUUID: schema.projectUUID,
            serverName,
            adminSecret: ADMIN_SECRET  // TODO: security risk — plaintext on disk. Replace with challenge-response auth.
        }, null, 2));
        console.log(`\n✅ Standalone API server running at http://0.0.0.0:${actualPort}`);
        console.log(`ℹ️  API only — no browser UI served.`);

        // Graceful Shutdown
        let shuttingDown = false;
        const gracefulShutdown = async (signal: string) => {
            if (shuttingDown) return;
            shuttingDown = true;
            console.log(`\n🛑 [SYNAPSE] Received ${signal}. Shutting down gracefully...`);

            try { await MountManager.getInstance().unmountAll(); } catch {}

            if (httpServer) {
                const watchdog = setTimeout(() => process.exit(1), 3000);
                httpServer.closeAllConnections?.();
                httpServer.close(() => {
                    clearTimeout(watchdog);
                    console.log('[SYNAPSE] HTTP server closed.');
                    process.exit(0);
                });
            } else {
                process.exit(0);
            }
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    } catch (err: any) {
        console.error(`❌ Failed to start server: ${err.message}`);
        process.exit(1);
    }
})();
