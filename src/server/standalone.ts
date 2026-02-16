import express from 'express';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import { GeminiParser } from '../core/GeminiParser';
import { FlowScanner } from '../core/FlowScanner';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// 프로젝트 루트 경로 설정 (demo 폴더 기준)
const projectRoot = path.resolve(__dirname, '../../demo');
const uiRoot = path.resolve(__dirname, '../../ui');
const stateFilePath = path.join(projectRoot, 'data', 'project_state.json');

app.use(cors());
app.use(express.json());

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

app.listen(port, () => {
    console.log(`\n✅ Standalone API server running at http://localhost:${port}`);
    console.log(`ℹ️  Browser UI should now send requests to this server.`);
});
