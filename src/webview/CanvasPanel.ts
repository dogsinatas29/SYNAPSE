/**
 * Canvas Webview Panel
 * Manages the SYNAPSE canvas webview
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { FileScanner } from './FileScanner';
import * as fs from 'fs';

export class CanvasPanel {
    public static currentPanel: CanvasPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (CanvasPanel.currentPanel) {
            CanvasPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            'synapseCanvas',
            'SYNAPSE Canvas',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'ui'),
                    vscode.Uri.joinPath(extensionUri, 'data')
                ]
            }
        );

        CanvasPanel.currentPanel = new CanvasPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showInformationMessage(message.text);
                        return;
                    case 'nodeSelected':
                        this.handleNodeSelected(message.node);
                        return;
                    case 'openFile':
                        await this.openFile(message.filePath);
                        return;
                    case 'getProjectState':
                        await this.sendProjectState();
                        return;
                    case 'saveState':
                        await this.handleSaveState(message.data);
                        return;
                    case 'takeSnapshot':
                        await this.handleTakeSnapshot(message.data);
                        return;
                    case 'getHistory':
                        await this.sendHistory();
                        return;
                    case 'rollback':
                        await this.handleRollback(message.snapshotId);
                        return;
                    case 'setBaseline':
                        await this.handleSetBaseline(message.snapshotId);
                        return;
                    case 'clearBaseline':
                        this._panel.webview.postMessage({ command: 'clearBaseline' });
                        return;
                    case 'createManualEdge':
                        await this.handleCreateManualEdge(message.edge);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    private async handleSetBaseline(snapshotId: string) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return;

        try {
            const historyUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'synapse_history.json');
            const data = await vscode.workspace.fs.readFile(historyUri);
            const history = JSON.parse(data.toString());
            const snapshot = history.find((s: any) => s.id === snapshotId);

            if (snapshot) {
                this._panel.webview.postMessage({
                    command: 'setBaseline',
                    data: snapshot.data
                });
                vscode.window.showInformationMessage(`Visual baseline set: ${snapshot.label}`);
            }
        } catch (e) {
            vscode.window.showErrorMessage(`Failed to set baseline: ${e}`);
        }
    }

    public fitView() {
        this._panel.webview.postMessage({ command: 'fitView' });
    }

    public async refreshState() {
        await this.sendProjectState();
    }

    private handleNodeSelected(node: any) {
        console.log('Node selected:', node);
        // TODO: Update sidebar, show node details
    }

    private async openFile(filePath: string) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return;

        const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, filePath);
        try {
            const doc = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open file: ${filePath}`);
        }
    }

    public dispose() {
        CanvasPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    /**
     * 데이터 위생 원칙 2: 자동 정규화 (Auto-Normalization)
     * - 기본값과 동일한 속성 제거 (Pruning)
     * - JSON 키를 알파벳 순으로 정렬하여 Git Diff 최소화
     */
    private normalizeProjectState(state: any): string {
        // 1. 기본값 제거 (Pruning)
        const pruneDefaults = (obj: any, defaults: any): any => {
            if (!obj || typeof obj !== 'object') return obj;

            const pruned: any = Array.isArray(obj) ? [] : {};
            for (const key in obj) {
                const value = obj[key];
                const defaultValue = defaults?.[key];

                // 기본값과 동일하면 제거
                if (defaultValue !== undefined && JSON.stringify(value) === JSON.stringify(defaultValue)) {
                    continue;
                }

                // 재귀적으로 처리
                if (typeof value === 'object' && value !== null) {
                    pruned[key] = pruneDefaults(value, defaultValue);
                } else {
                    pruned[key] = value;
                }
            }
            return pruned;
        };

        // 기본값 정의
        const defaults = {
            visual: {
                color: '#458588',
                dashArray: undefined
            }
        };

        // 2. 키 정렬 함수
        const sortKeys = (obj: any): any => {
            if (!obj || typeof obj !== 'object') return obj;
            if (Array.isArray(obj)) return obj.map(sortKeys);

            const sorted: any = {};
            Object.keys(obj).sort().forEach(key => {
                sorted[key] = sortKeys(obj[key]);
            });
            return sorted;
        };

        // 3. 정규화 적용
        const prunedState = pruneDefaults(state, {});
        const sortedState = sortKeys(prunedState);

        // 4. 정렬된 JSON 문자열 반환
        return JSON.stringify(sortedState, null, 2);
    }

    private async handleCreateManualEdge(edge: any) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return;

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            const data = await vscode.workspace.fs.readFile(projectStateUri);
            const projectState = JSON.parse(data.toString());

            // 엣지 추가
            if (!projectState.edges) projectState.edges = [];
            projectState.edges.push(edge);

            // 저장 (정규화 적용)
            const normalizedJson = this.normalizeProjectState(projectState);
            await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf8'));
            console.log('[SYNAPSE] Manual edge saved:', edge);
            vscode.window.showInformationMessage(`Edge created: ${edge.type}`);

            // 캔버스 새로고침
            await this.sendProjectState();
        } catch (error) {
            console.error('Failed to create manual edge:', error);
            vscode.window.showErrorMessage(`Failed to create edge: ${error}`);
        }
    }

    private async handleSaveState(newState: any) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return;

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');

            // 1. 기존 상태 읽기
            let currentState: any = {};
            try {
                const existingData = await vscode.workspace.fs.readFile(projectStateUri);
                currentState = JSON.parse(existingData.toString());
            } catch (e) {
                console.warn('[SYNAPSE] No existing project state to merge');
            }

            // 2. 새로운 데이터 병합 (노드, 엣지, 클러스터만 교체)
            const MergedState = {
                ...currentState,
                nodes: newState.nodes,
                edges: newState.edges,
                clusters: newState.clusters
            };

            // 3. 파일 저장 (정규화 적용)
            const normalizedJson = this.normalizeProjectState(MergedState);
            await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf8'));
            console.log('[SYNAPSE] State merged and saved successfully');
        } catch (error) {
            console.error('Failed to save project state:', error);
            vscode.window.showErrorMessage(`Failed to save project state: ${error}`);
        }
    }

    private async handleTakeSnapshot(state: any) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return;

        try {
            const historyUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'synapse_history.json');
            let history: any[] = [];

            try {
                const existingHistory = await vscode.workspace.fs.readFile(historyUri);
                history = JSON.parse(existingHistory.toString());
            } catch (e) {
                // History file doesn't exist yet
            }

            const snapshot = {
                id: `snap_${Date.now()}`,
                timestamp: Date.now(),
                label: state.label || `Snapshot ${history.length + 1}`,
                data: state.data // nodes, edges, clusters
            };

            history.unshift(snapshot); // Newest first
            if (history.length > 50) history.pop(); // Limit history size

            await vscode.workspace.fs.writeFile(historyUri, Buffer.from(JSON.stringify(history, null, 2), 'utf8'));
            this.sendHistory(); // Update UI
            vscode.window.showInformationMessage(`Snapshot saved: ${snapshot.label}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to take snapshot: ${error}`);
        }
    }

    private async sendHistory() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return;

        try {
            const historyUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'synapse_history.json');
            const data = await vscode.workspace.fs.readFile(historyUri);
            const history = JSON.parse(data.toString());

            this._panel.webview.postMessage({
                command: 'history',
                data: history
            });
        } catch (error) {
            // history file may not exist
            this._panel.webview.postMessage({
                command: 'history',
                data: []
            });
        }
    }

    private async handleRollback(snapshotId: string) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return;

        try {
            const historyUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'synapse_history.json');
            const historyData = await vscode.workspace.fs.readFile(historyUri);
            const history = JSON.parse(historyData.toString());

            const snapshot = history.find((s: any) => s.id === snapshotId);
            if (!snapshot) {
                throw new Error('Snapshot not found');
            }

            // 1. Safety backup: Take snapshot of current state before rollback
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            try {
                const currentData = await vscode.workspace.fs.readFile(projectStateUri);
                const currentState = JSON.parse(currentData.toString());

                const backupSnapshot = {
                    id: `snap_pre_rollback_${Date.now()}`,
                    timestamp: Date.now(),
                    label: `Auto Backup (Before Rollback)`,
                    data: {
                        nodes: currentState.nodes,
                        edges: currentState.edges,
                        clusters: currentState.clusters
                    }
                };
                history.unshift(backupSnapshot);
                await vscode.workspace.fs.writeFile(historyUri, Buffer.from(JSON.stringify(history, null, 2), 'utf8'));
            } catch (e) {
                console.warn('[SYNAPSE] Failed to create safety backup:', e);
            }

            // 2. Overwrite with selected snapshot
            let existingState: any = {};
            try {
                const data = await vscode.workspace.fs.readFile(projectStateUri);
                existingState = JSON.parse(data.toString());
            } catch (e) { }

            const newState = {
                ...existingState,
                nodes: snapshot.data.nodes,
                edges: snapshot.data.edges,
                clusters: snapshot.data.clusters
            };

            await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(JSON.stringify(newState, null, 2), 'utf8'));

            // 3. Notify webview to reload
            await this.sendProjectState();
            await this.sendHistory(); // Update history list with backup
            vscode.window.showInformationMessage(`Rolled back to: ${snapshot.label}. Current state backed up.`);
        } catch (error) {
            vscode.window.showErrorMessage(`Rollback failed: ${error}`);
        }
    }

    private async sendProjectState() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            console.error('No workspace folder found');
            return;
        }

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            const data = await vscode.workspace.fs.readFile(projectStateUri);
            const projectState = JSON.parse(data.toString());

            // 1. FileScanner 인스턴스 생성
            const scanner = new FileScanner();

            // 2. 각 노드에 대해 실제 파일 분석 수행
            for (const node of projectState.nodes) {
                if (node.data && (node.data.path || node.data.file)) {
                    const relativePath = node.data.path || node.data.file;
                    const filePath = path.join(workspaceFolder.uri.fsPath, relativePath);
                    const summary = scanner.scanFile(filePath);

                    // 노드 데이터에 요약본 추가
                    node.data.summary = summary;
                }
            }

            // 3. 자동 엣지(의존성) 발견 로직 - 실시간 생성, 저장하지 않음!
            const discoveredEdges: any[] = [];
            const nodeMap = new Map<string, string>(); // 파일명/경로 -> 노드 ID

            projectState.nodes.forEach((n: any) => {
                const fullPath = n.data.path || n.data.file || '';
                const fileName = path.basename(fullPath);
                const fileNameNoExt = path.parse(fileName).name;

                nodeMap.set(fullPath, n.id);
                nodeMap.set(fileName, n.id);
                nodeMap.set(fileNameNoExt, n.id);
            });

            projectState.nodes.forEach((sourceNode: any) => {
                if (sourceNode.data.summary && sourceNode.data.summary.references) {
                    sourceNode.data.summary.references.forEach((ref: string) => {
                        // 다양한 매칭 시도 (상대 경로 제거 등)
                        const cleanRef = ref.replace(/^\.\//, '').replace(/^\.\.\//, '');
                        const targetNodeId = nodeMap.get(ref) || nodeMap.get(cleanRef) || nodeMap.get(path.parse(cleanRef).name);

                        if (targetNodeId && targetNodeId !== sourceNode.id) {
                            // 중복 체크 및 엣지 추가 (메모리에만)
                            const alreadyDiscovered = discoveredEdges.some((e: any) => e.from === sourceNode.id && e.to === targetNodeId);

                            if (!alreadyDiscovered) {
                                discoveredEdges.push({
                                    id: `edge_auto_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                                    from: sourceNode.id,
                                    to: targetNodeId,
                                    type: 'dependency',
                                    label: 'ref'
                                });
                            }
                        }
                    });
                }
            });

            // 4. 웹뷰로 전송할 때만 자동 발견된 엣지 포함 (저장하지 않음!)
            const stateForWebview = {
                ...projectState,
                edges: [
                    ...(projectState.edges || []).filter((e: any) => !e.id.startsWith('edge_auto_')), // 수동 엣지만
                    ...discoveredEdges // 자동 발견 엣지 (휘발성)
                ]
            };

            console.log(`[SYNAPSE] Discovered ${discoveredEdges.length} auto edges (volatile, not persisted)`);

            // 5. 웹뷰로 전송
            this._panel.webview.postMessage({
                command: 'projectState',
                data: stateForWebview
            });

            // The original projectState (without auto-discovered edges) is not sent directly anymore.
            // The stateForWebview is sent instead.
            // The original line `this._panel.webview.postMessage({ command: 'projectState', data: projectState });`

        } catch (error) {
            console.error('Failed to load project state:', error);
            vscode.window.showErrorMessage(`Failed to load project state: ${error}`);
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Read the HTML file
        const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'ui', 'index.html');
        let html = fs.readFileSync(htmlPath.fsPath, 'utf8');

        // Get URIs for resources with cache busting
        const timestamp = Date.now();
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'ui', 'canvas-engine.js')
        );

        // Replace script src with webview URI + cache busting
        html = html.replace(
            'src="canvas-engine.js"',
            `src="${scriptUri}?v=${timestamp}"`
        );

        // Add CSP - relaxed for webview compatibility
        const nonce = getNonce();
        html = html.replace(
            '<head>',
            `<head>
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval'; img-src ${webview.cspSource} https:;">
            `
        );

        // Add nonce to all script tags
        html = html.replace(
            /<script/g,
            `<script nonce="${nonce}"`
        );

        // Inject VS Code API
        html = html.replace(
            '</head>',
            `<script nonce="${nonce}">
                const vscode = acquireVsCodeApi();
                window.vscode = vscode;
            </script>
            </head>`
        );

        return html;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
