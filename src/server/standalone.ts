import express from 'express';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import { GeminiParser } from '../core/GeminiParser';
import { FlowScanner } from '../core/FlowScanner';
import { ProjectMetadata } from '../core/ProjectMetadata';
import { SymbolIndex } from '../core/SymbolIndex';
import { RuntimeInitializer } from '../core/collaboration/RuntimeInitializer';
import { AccountManager } from '../core/collaboration/AccountManager';
import { RestCollaborationTransport } from '../core/collaboration/RestCollaborationTransport';
import { SubmissionManager } from '../core/collaboration/SubmissionManager';
import { HarvestEngine, HarvestInput } from '../core/collaboration/HarvestEngine';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 프로젝트 루트 경로 설정 (demo 폴더 기준)
const projectRoot = path.resolve(__dirname, '../../demo');
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
RuntimeInitializer.getInstance().initialize(projectRoot, 'synapse-demo').catch(e => {
    console.warn('[Standalone] Runtime init deferred:', e.message);
});
AccountManager.getInstance().initialize(projectRoot);
const transport = new RestCollaborationTransport();

// 정적 파일 서빙 (UI & Data)
app.use('/', express.static(uiRoot)); // UI 메인
app.use('/data', express.static(path.join(projectRoot, 'data'))); // 데이터 폴더

console.log('🚀 SYNAPSE Standalone Dev Server starting...');
console.log(`📂 Project Root: ${projectRoot}`);
console.log(`📄 State File: ${stateFilePath}`);

// 1. 노드 승인 및 분석 (V 버튼)
app.post('/api/analyze', async (req, res) => {
    const { filePath } = req.body;
    console.log(`[API] analyze: ${filePath}`);

    try {
        // 경로 해결: 루트 또는 src 폴더 확인
        let fullPath = path.join(projectRoot, filePath);
        if (!fs.existsSync(fullPath)) {
            const srcPath = path.join(projectRoot, 'src', filePath);
            if (fs.existsSync(srcPath)) {
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
        const fullPath = path.isAbsolute(filePath) ? filePath : path.join(projectRoot, filePath);
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

// 7. Authentication
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) { res.status(400).json({ success: false, error: 'username and password required' }); return; }
        const user = await transport.login(username, password);
        if (!user) { res.status(401).json({ success: false, error: 'Invalid credentials' }); return; }
        res.json({ success: true, user });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 7b. Admin (localhost only — server operator assigns project roles)
import { IdentityManager, Permission } from '../core/collaboration/IdentityManager';
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

// 7c. Account Management (localhost only)
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

app.post('/api/collab/submission', async (req, res) => {
    try {
        const { projectUUID, sessionId, clientId, filePaths } = req.body;
        if (!projectUUID || !sessionId || !clientId || !filePaths) {
            res.status(400).json({ success: false, error: 'projectUUID, sessionId, clientId, filePaths required' }); return;
        }
        const snapshot = await transport.createSubmission(projectUUID, sessionId, clientId, filePaths);
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

app.post('/api/collab/harvest', async (req, res) => {
    try {
        const { submissionId, projectUUID, approvedFiles, filePaths } = req.body;
        if (!submissionId || !projectUUID) {
            res.status(400).json({ success: false, error: 'submissionId and projectUUID required' });
            return;
        }

        let files: { filePath: string; content: string; encoding?: string }[];

        if (approvedFiles && Array.isArray(approvedFiles)) {
            files = approvedFiles;
            for (const f of files) {
                if (!f.filePath || f.content === undefined) {
                    res.status(400).json({ success: false, error: 'Each approvedFile must have filePath and content' });
                    return;
                }
            }
        } else if (filePaths && Array.isArray(filePaths)) {
            const snapshot = SubmissionManager.getInstance().getSubmission(submissionId);
            if (snapshot) {
                files = snapshot.files.filter(f => filePaths.includes(f.filePath));
            } else {
                files = filePaths.map(fp => ({
                    filePath: fp,
                    content: fs.readFileSync(path.resolve(projectRoot, fp), 'utf8'),
                    encoding: 'utf8',
                }));
            }
        } else {
            res.status(400).json({ success: false, error: 'Provide approvedFiles[] or filePaths[]' });
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
            originalSnapshot: {
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

app.listen(port, () => {
    console.log(`\n✅ Standalone API server running at http://localhost:${port}`);
    console.log(`ℹ️  Browser UI should now send requests to this server.`);
});
