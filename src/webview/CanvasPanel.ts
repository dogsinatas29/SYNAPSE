/*
 * SYNAPSE - Visual Architecture Engine
 * Copyright (C) 2024 synapse-team (and contributors)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ProjectStructure, Node, Edge, ProjectState, EdgeType, NodeType } from '../types/schema';
import { FileScanner } from '../core/FileScanner';
import { LogicAnalyzer } from '../core/LogicAnalyzer';
import { EdgeCodeRefactorer } from '../core/EdgeCodeRefactorer';
import { GeminiParser } from '../core/GeminiParser';
import { FlowchartGenerator } from '../core/FlowchartGenerator';
import { BootstrapEngine } from '../bootstrap/BootstrapEngine';
import { client } from '../client';
import { Logger } from '../utils/Logger';

export class CanvasPanel {
    public static currentPanel: CanvasPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _workspaceFolder: vscode.WorkspaceFolder;
    private _disposables: vscode.Disposable[] = [];
    private proposedNodes: any[] = [];
    private proposedEdges: any[] = [];
    private _contextRequestCallback: ((context: any) => void) | undefined;

    public static createOrShow(extensionUri: vscode.Uri, workspaceFolder: vscode.WorkspaceFolder) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (CanvasPanel.currentPanel) {
            if (CanvasPanel.currentPanel._workspaceFolder.uri.fsPath !== workspaceFolder.uri.fsPath) {
                console.log(`[SYNAPSE] Switching canvas context to: ${workspaceFolder.name}`);
                CanvasPanel.currentPanel._workspaceFolder = workspaceFolder;
                CanvasPanel.currentPanel.refreshState();
            }
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

        CanvasPanel.currentPanel = new CanvasPanel(panel, extensionUri, workspaceFolder);
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, workspaceFolder: vscode.WorkspaceFolder) {
        CanvasPanel.currentPanel = new CanvasPanel(panel, extensionUri, workspaceFolder);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, workspaceFolder: vscode.WorkspaceFolder) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._workspaceFolder = workspaceFolder;

        // [v0.2.17 Fix] Delay initial update to allow Webview host to stabilize
        // This addresses "ServiceWorker: InvalidStateError" in certain environments
        setTimeout(() => {
            if (this._panel && this._panel.webview) {
                Logger.info(`[CanvasPanel] Performing initial update...`);
                this._update();
            }
        }, 100);

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async message => {
                if (message.command !== 'contextData') {
                    Logger.info(`[CanvasPanel] Received command: ${message.command}`);
                    if (message.command === 'deleteNodes') {
                        Logger.info(`[CanvasPanel] Payload:`, message);
                    }
                }
                switch (message.command) {
                    case 'alert':
                        vscode.window.showInformationMessage(message.text);
                        return;
                    case 'nodeSelected':
                        this.handleNodeSelected(message.node);
                        return;
                    case 'openFile':
                        await this.openFile(message.filePath, message.createIfNotExists);
                        return;
                    case 'getProjectState':
                        await this.sendProjectState();
                        return;
                    case 'saveState':
                        await this.handleSaveState(message.data);
                        return;
                    case 'readFile':
                        await this.handleReadFile(message.filePath);
                        return;
                    case 'ungroup':
                        // [New] Ungroup command
                        await this.handleUngroup(message.nodeIds);
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
                    case 'deleteEdge':
                        await this.handleDeleteEdge(message.edgeId);
                        return;
                    case 'deleteNodes':
                        // Pass the entire message object to let handleDeleteNodes extract IDs robustly
                        await this.handleDeleteNodes(message);
                        return;
                    case 'updateEdge':
                        await this.handleUpdateEdge(message.edgeId, message.updates);
                        return;
                    case 'approveNode':
                        await this.handleApproveNode(message.nodeId);
                        return;
                    case 'rejectNode':
                        await this.handleRejectNode(message.nodeId);
                        return;
                    case 'generateFlow':
                        await this.handleGenerateFlow(message.nodeId, message.filePath);
                        return;
                    case 'updateNodeDTR':
                        await this.handleUpdateNodeDTR(message.nodeId, message.dtr);
                        return;
                    case 'requestDeleteEdgeSource':
                        await this.handleRequestDeleteEdgeSource(message.edgeId, message.fromFile, message.toFile);
                        return;
                    case 'requestDeleteEdgeUI':
                        await this.handleRequestDeleteEdgeUI(message.edgeId);
                        return;
                    case 'showMessage':
                        vscode.window.showInformationMessage(`[SYNAPSE] ${message.text}`);
                        return;
                    case 'validateEdge':
                        await this.handleValidateEdge(message.edgeId, message.fromNode, message.toNode, message.type);
                        return;
                    case 'analyzeGemini':
                        await this.handleAnalyzeGemini(message.filePath);
                        return;
                    case 'createManualNode':
                        await this.handleCreateManualNode(message.node);
                        return;
                    case 'requestSnapshot':
                        const label = await vscode.window.showInputBox({
                            placeHolder: 'Enter snapshot label',
                            prompt: 'Snapshot Name',
                            value: `Snapshot ${new Date().toLocaleTimeString()}`
                        });
                        if (label) {
                            await this.handleTakeSnapshot({ label }); // Pass label wrapper, logic needs adjustment or use existing
                        }
                        return;
                    case 'requestRollback':
                        const answer = await vscode.window.showWarningMessage(
                            `Are you sure you want to rollback to "${message.label}"?`,
                            { modal: true },
                            'Rollback'
                        );
                        if (answer === 'Rollback') {
                            await this.handleRollback(message.snapshotId);
                        }
                        return;
                    case 'reBootstrap':
                        await this.handleReBootstrap();
                        return;
                    case 'requestConfirmEdge':
                        await this.handleRequestConfirmEdge(message.edgeId, message.fromFile, message.toFile);
                        return;
                    case 'resetProjectState':
                        await this.handleResetProjectState();
                        return;
                    case 'logPrompt':
                        await this.handleLogPrompt(message.prompt, message.title);
                        return;
                    case 'requestLogPrompt':
                        await this.handleRequestLogPrompt();
                        return;
                    case 'openRules':
                        await vscode.commands.executeCommand('synapse.openRules');
                        return;
                    case 'testLogic':
                        await this.handleTestLogic();
                        break;
                    case 'triggerLogPrompt':
                        // REC/STOP 버튼 클릭 → synapse.logPrompt 토글 트리거
                        await vscode.commands.executeCommand('synapse.logPrompt');
                        return;
                    case 'contextData': // Restored contextData case
                        if (this._contextRequestCallback) {
                            this._contextRequestCallback(message.data);
                            this._contextRequestCallback = undefined;
                        }
                        return;
                    case 'ready':
                        console.log('[SYNAPSE] WebView Ready signal received. Starting initial analysis...');
                        await this.sendProjectState();
                        return;
                    case 'log':
                        if (message.level === 'error') {
                            Logger.error(`[WebView] ${message.text}`, message.data);
                        } else if (message.level === 'warn') {
                            Logger.warn(`[WebView] ${message.text}`);
                        } else {
                            Logger.info(`[WebView] ${message.text}`);
                        }
                        return;
                }
            },
            null,
            this._disposables
        );
    }


    private async handleCreateManualNode(node: any) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');

            // Read existing state
            let currentState: any = { nodes: [], edges: [], clusters: [] };
            try {
                const data = await vscode.workspace.fs.readFile(projectStateUri);
                currentState = JSON.parse(Buffer.from(data).toString('utf-8'));
                if (typeof currentState === 'string') {
                    currentState = JSON.parse(currentState); // Auto-heal double encoded state
                }
            } catch (e) {
                // Create file if it doesn't exist
            }

            // Try to create physical file if requested
            if (node.createPhysicalFile && node.data?.label) {
                try {
                    const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, node.data.label);
                    await vscode.workspace.fs.stat(fileUri);
                    // File exists, just link it
                    node.data.file = vscode.workspace.asRelativePath(fileUri);
                } catch {
                    // Create empty file
                    const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, node.data.label);
                    await vscode.workspace.fs.writeFile(fileUri, Buffer.from('', 'utf8'));
                    Logger.info(`[CanvasPanel] Physical file auto-created: ${node.data.label}`);
                    node.data.file = vscode.workspace.asRelativePath(fileUri);
                }
                // Cleanup temp flag
                delete node.createPhysicalFile;
            }

            // Add new node
            if (!currentState.nodes) currentState.nodes = [];
            currentState.nodes.push(node);

            // Save state (using normalization)
            const normalizedJson = this.normalizeProjectState(currentState);
            await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf8'));

            console.log('[SYNAPSE] Manual node created and saved:', node.id);
            vscode.window.showInformationMessage(`Node created: ${node.data.label}`);

            // Refresh view
            await this.sendProjectState();

        } catch (error) {
            console.error('Failed to create manual node:', error);
            vscode.window.showErrorMessage(`Failed to create manual node: ${error}`);
        }
    }

    private async handleSetBaseline(snapshotId: string) {
        const workspaceFolder = this._workspaceFolder;
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

    /**
     * [v0.2.17] Notify webview about DTR (Deep-Thinking Ratio) change
     */
    public notifyDTRChange(value: number) {
        this._panel.webview.postMessage({
            command: 'dtrChanged',
            value: value
        });
    }

    /**
     * Get current canvas context (selection, view state)
     */
    public async getCanvasContext(): Promise<any> {
        return new Promise<any>((resolve) => {
            // Set up one-time callback
            this._contextRequestCallback = resolve;

            // Timeout to prevent hanging
            setTimeout(() => {
                if (this._contextRequestCallback) {
                    console.warn('[SYNAPSE] Context request timed out');
                    this._contextRequestCallback(null);
                    this._contextRequestCallback = undefined;
                }
            }, 1000);

            // Request context from webview
            this._panel.webview.postMessage({ command: 'requestContext' });
        });
    }

    private handleNodeSelected(node: any) {
        console.log('Node selected:', node);
        // TODO: Update sidebar, show node details
    }

    private async openFile(filePath: string, createIfNotExists: boolean = false) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, filePath);
        try {
            // Check if file exists
            try {
                await vscode.workspace.fs.stat(fileUri);
            } catch (err: any) {
                // File does not exist
                if (createIfNotExists) {
                    Logger.info(`[CanvasPanel] Creating missing file: ${filePath}`);
                    await vscode.workspace.fs.writeFile(fileUri, Buffer.from('', 'utf8'));
                    vscode.window.showInformationMessage(`[SYNAPSE] File created: ${filePath}`);
                } else {
                    throw err; // Re-throw if we shouldn't create it
                }
            }

            const doc = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            Logger.error(`Failed to open/create file: ${filePath}`, error);
            vscode.window.showErrorMessage(`Failed to open file: ${filePath}`);
        }
    }

    private async handleReadFile(filePath: string) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, filePath);
        try {
            const data = await vscode.workspace.fs.readFile(fileUri);
            this._panel.webview.postMessage({
                command: 'fileContent',
                filePath: filePath,
                content: Buffer.from(data).toString('utf8')
            });
        } catch (error) {
            Logger.error(`Failed to read file for preview: ${filePath}`, error);
            this._panel.webview.postMessage({
                command: 'fileContent',
                filePath: filePath,
                error: `Could not read file: ${filePath}`
            });
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
    private async handleTestLogic() {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            const data = await vscode.workspace.fs.readFile(projectStateUri);
            const state = JSON.parse(data.toString());

            const analyzer = new LogicAnalyzer();
            const issues = analyzer.analyze(state);
            analyzer.generateReport(issues, workspaceFolder.uri.fsPath, state.nodes);

            this._panel.webview.postMessage({
                command: 'analysisResults',
                issues: issues
            });

            vscode.window.showInformationMessage(`[SYNAPSE] Logic analysis complete. 'architecture_report.md' generated.`);
        } catch (error) {
            console.error('[SYNAPSE] Logic Analysis failed:', error);
            vscode.window.showErrorMessage(`Logic Analysis failed: ${error}`);
        }
    }

    private normalizeProjectState(state: any): string {
        // 0. Circular Reference Prevention & Plain Data Extraction
        const decycle = (obj: any, stack = new Set()): any => {
            if (!obj || typeof obj !== 'object') return obj;
            if (stack.has(obj)) return '[Circular]';
            stack.add(obj);

            let res: any = Array.isArray(obj) ? [] : {};
            for (const key in obj) {
                // Ignore DOM nodes or internal VSCode specific heavy objects if any creep in
                if (key.startsWith('_')) continue;
                res[key] = decycle(obj[key], stack);
            }
            stack.delete(obj);
            return res;
        };

        const safeState = decycle(state);

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
                if (typeof value === 'object' && value !== null && value !== '[Circular]') {
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
        const prunedState = pruneDefaults(safeState, {});
        const sortedState = sortKeys(prunedState);

        // 4. 정렬된 JSON 문자열 반환
        return JSON.stringify(sortedState, null, 2);
    }

    private async handleCreateManualEdge(edge: any) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            const data = await vscode.workspace.fs.readFile(projectStateUri);
            const projectState = JSON.parse(data.toString());

            // Resolve missing file paths dynamically before saving
            // (Newly approved nodes in the UI might not have synced their data.file back to the edge Source)
            const fromNode = (projectState.nodes || []).find((n: any) => n.id === edge.from);
            const toNode = (projectState.nodes || []).find((n: any) => n.id === edge.to);

            if (!edge._fromFile && fromNode?.data) {
                edge._fromFile = fromNode.data.file || fromNode.data.label || null;
            }
            if (!edge._toFile && toNode?.data) {
                edge._toFile = toNode.data.file || toNode.data.label || null;
            }

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

    // [v0.2.17] Handle edge confirmation request: show warning dialog, apply import to source
    // [v0.2.17] Handle edge source deletion (Logic Edit Mode)
    private async handleRequestDeleteEdgeSource(edgeId: string, fromFile: string | null, toFile: string | null) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        // Dynamic File Resolution Check
        const uri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
        let projectState: any = { nodes: [], edges: [] };
        try {
            const data = await vscode.workspace.fs.readFile(uri);
            projectState = JSON.parse(Buffer.from(data).toString('utf-8'));
            if (typeof projectState === 'string') projectState = JSON.parse(projectState);
        } catch (e) { }

        const edge = (projectState.edges || []).find((e: any) => e.id === edgeId);
        let actualFromFile = fromFile || edge?._fromFile;
        let actualToFile = toFile || edge?._toFile;

        if (!actualFromFile || !actualToFile) {
            const fromNode = (projectState.nodes || []).find((n: any) => n.id === edge?.from);
            const toNode = (projectState.nodes || []).find((n: any) => n.id === edge?.to);
            if (!actualFromFile && fromNode?.data?.file) actualFromFile = fromNode.data.file;
            if (!actualToFile && toNode?.data?.file) actualToFile = toNode.data.file;
        }

        if (!actualFromFile || !actualToFile) {
            // No source files available to edit physically, so tell UI and backend to just visibly delete it
            await this.handleDeleteEdge(edgeId);
            this._panel.webview.postMessage({ command: 'edgeDeletedSource', edgeId, success: true });
            return;
        }

        const choice = await vscode.window.showWarningMessage(
            `[SYNAPSE] 진짜로 소스 코드에서 연결을 끊으시겠습니까?\n\n` +
            `"${actualFromFile}" 파일에 있는 "${actualToFile}" 의 import 구문이 완전히 삭제됩니다.\n` +
            `⚠️ 이 작업은 되돌릴 수 없습니다.`,
            { modal: true },
            '💣 삭제 (파괴적)', '❌ 취소'
        );

        if (choice !== '💣 삭제 (파괴적)') {
            this._panel.webview.postMessage({ command: 'edgeDeletedSource', edgeId, success: false });
            return;
        }

        try {
            const projectRoot = workspaceFolder.uri.fsPath;
            const refactorer = new EdgeCodeRefactorer();
            const result = refactorer.removeEdgeFromSource(actualFromFile, actualToFile, projectRoot);

            if (!result.success) {
                vscode.window.showErrorMessage(`[SYNAPSE] 소스 삭제 중 문제 발생: ${result.message}`);
                // Proceed with UI delete or not? Yes, the edge from UI can be deleted still, or let the user decide.
                this._panel.webview.postMessage({ command: 'edgeDeletedSource', edgeId, success: false });
                return;
            }

            // Also remove from project_state and UI
            await this.handleDeleteEdge(edgeId);

            this._panel.webview.postMessage({ command: 'edgeDeletedSource', edgeId, success: true });
            vscode.window.showInformationMessage(`[SYNAPSE] ✅ 소스 코드 삭제됨: ${result.importLine}`);
        } catch (e) {
            vscode.window.showErrorMessage(`[SYNAPSE] 소스 삭제 실패: ${e}`);
            this._panel.webview.postMessage({ command: 'edgeDeletedSource', edgeId, success: false });
        }
    }

    // [v0.2.17] Handle edge deletion initiated by the trash badge on the UI
    private async handleRequestDeleteEdgeUI(edgeId: string) {
        const choice = await vscode.window.showWarningMessage(
            `[SYNAPSE] 이 엣지를 휴지통으로 지우시겠습니까? \n\n` +
            `(로직 편집 모드가 활성화되어 있다면 소스 코드 참조도 함께 주석 처리됩니다.)`,
            { modal: true },
            '💣 삭제', '❌ 취소'
        );

        if (choice === '💣 삭제') {
            const isEditLogicMode = this._workspaceFolder && vscode.workspace.getConfiguration('synapse').get('editLogicMode', false);
            // We just let the backend decide whether to prune source based on the mode or just blindly remove it from state
            // since we don't have fromFile/toFile passed directly, we'll try to resolve it dynamically from handleRequestDeleteEdgeSource if needed
            // Actually, handleRequestDeleteEdgeSource will resolve it dynamically from project_state.
            await this.handleRequestDeleteEdgeSource(edgeId, null, null);
            // It will call edgeDeletedSource, from there we should trigger actual edge state removal if it wasn't aborted
        }
    }

    // [v0.2.17] Persist per-node DTR change from the canvas slider
    private async handleUpdateNodeDTR(nodeId: string, dtr: number) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;
        try {
            const uri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            const data = await vscode.workspace.fs.readFile(uri);
            const projectState = JSON.parse(data.toString());
            const node = (projectState.nodes || []).find((n: any) => n.id === nodeId);
            if (!node) return;
            if (!node.intelligence) node.intelligence = {};
            node.intelligence.dtr = dtr;
            if (!node.data) node.data = {};
            if (!node.data.intelligence) node.data.intelligence = {};
            node.data.intelligence.dtr = dtr;
            const normalized = this.normalizeProjectState(projectState);
            await vscode.workspace.fs.writeFile(uri, Buffer.from(normalized, 'utf8'));
        } catch (e) {
            console.error('[SYNAPSE] Failed to update node DTR:', e);
        }
    }

    private async handleDeleteEdge(edgeId: string) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            let projectState: any = { nodes: [], edges: [], clusters: [] };
            try {
                const data = await vscode.workspace.fs.readFile(projectStateUri);
                projectState = JSON.parse(Buffer.from(data).toString('utf-8'));
                if (typeof projectState === 'string') {
                    projectState = JSON.parse(projectState); // Auto-heal double encoded state
                }
            } catch (e) {
                // Ignore missing file
            }

            // 엣지 제거
            if (!projectState.edges) projectState.edges = [];
            const edgeIndex = projectState.edges.findIndex((e: any) => e.id === edgeId);

            if (edgeIndex === -1) {
                console.warn('[SYNAPSE] Edge not found in project state:', edgeId);
                return;
            }

            const deletedEdge = projectState.edges[edgeIndex];
            projectState.edges.splice(edgeIndex, 1);

            // 저장 (정규화 적용)
            const normalizedJson = this.normalizeProjectState(projectState);
            await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf8'));
            console.log('[SYNAPSE] Edge deleted:', deletedEdge);
            vscode.window.setStatusBarMessage(`Edge deleted`, 3000);

            // 캔버스 새로고침
            await this.sendProjectState();
        } catch (error) {
            console.error('Failed to delete edge:', error);
            vscode.window.showErrorMessage(`Failed to delete edge: ${error}`);
        }
    }

    private async handleDeleteNode(nodeId: string) {
        await this.handleDeleteNodes([nodeId]);
    }

    private async handleUngroup(nodeIds: string[]) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder || !nodeIds || nodeIds.length === 0) return;

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            const data = await vscode.workspace.fs.readFile(projectStateUri);
            const projectState = JSON.parse(data.toString());

            if (!projectState.nodes) return;

            const nodeIdSet = new Set(nodeIds);
            let updatedCount = 0;

            // 1. Clear cluster_id for target nodes
            projectState.nodes.forEach((n: any) => {
                if (nodeIdSet.has(n.id)) {
                    if (n.cluster_id) {
                        n.cluster_id = null;
                        updatedCount++;
                    }
                    if (n.data && n.data.cluster_id) {
                        n.data.cluster_id = null;
                    }
                }
            });

            if (updatedCount === 0) {
                console.log('[SYNAPSE] No nodes needed ungrouping.');
                return;
            }

            // 2. Cleanup empty clusters
            if (projectState.clusters) {
                const activeClusterIds = new Set(projectState.nodes.map((n: any) => n.cluster_id || (n.data && n.data.cluster_id)).filter((id: string) => id));
                const initialClusterCount = projectState.clusters.length;
                projectState.clusters = projectState.clusters.filter((c: any) => activeClusterIds.has(c.id));
                const removedClusters = initialClusterCount - projectState.clusters.length;
                if (removedClusters > 0) {
                    console.log(`[SYNAPSE] Cleaned up ${removedClusters} empty clusters (Ungroup)`);
                }
            }

            // 3. Save state (Atomic)
            const normalizedJson = this.normalizeProjectState(projectState);
            await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf8'));
            console.log(`[SYNAPSE] Ungrouped ${updatedCount} nodes.`);

            // 4. Broadcast update
            await this.sendProjectState();

        } catch (error) {
            console.error('Failed to ungroup nodes:', error);
            vscode.window.showErrorMessage(`Failed to ungroup nodes: ${error}`);
        }
    }

    // [Updated] Robust Delete Handler
    private async handleDeleteNodes(rawInput: any) {
        // [HOT-FIX] Force show output channel and log immediately
        Logger.show();
        Logger.info(`[CanvasPanel] handleDeleteNodes CALLED. Raw Input:`, rawInput);

        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        // [Bulletproof ID Extraction]
        let targetIds: string[] = [];

        if (Array.isArray(rawInput)) {
            targetIds = rawInput;
        } else if (typeof rawInput === 'object' && rawInput !== null) {
            // Handle "Proxy" or "Array-like" objects by forcing conversion
            // Check if it's the message object wrapping nodeIds
            if (rawInput.nodeIds) {
                if (Array.isArray(rawInput.nodeIds)) {
                    targetIds = rawInput.nodeIds;
                } else {
                    targetIds = Object.values(rawInput.nodeIds);
                }
            } else if (rawInput.nodeId) {
                targetIds = [rawInput.nodeId];
            } else {
                // Try to convert the object itself if it looks like an array
                targetIds = Object.values(rawInput);
            }
        } else if (typeof rawInput === 'string') {
            targetIds = [rawInput];
        }

        // Filter valid strings only
        targetIds = targetIds.filter((id: any) => typeof id === 'string' && id.length > 0);

        Logger.info(`[CanvasPanel] Target IDs for deletion:`, targetIds);

        if (targetIds.length === 0) {
            Logger.warn('[CanvasPanel] No valid node IDs extracted for deletion from input:', JSON.stringify(rawInput));
            return;
        }

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            const data = await vscode.workspace.fs.readFile(projectStateUri);
            let projectState = JSON.parse(Buffer.from(data).toString('utf-8'));
            if (typeof projectState === 'string') {
                projectState = JSON.parse(projectState); // Auto-heal double encoded state
            }

            if (!projectState.nodes) projectState.nodes = [];

            const nodeIdSet = new Set(targetIds);
            const initialNodeCount = projectState.nodes.length;

            let deletedCount = 0;
            const filesToDelete: string[] = [];

            // 1. Remove Nodes & collect files to delete
            projectState.nodes = projectState.nodes.filter((n: any) => {
                if (nodeIdSet.has(n.id)) {
                    deletedCount++;
                    if (n.data && n.data.file) {
                        filesToDelete.push(n.data.file);
                    }
                    return false;
                }
                return true;
            });

            // [v0.2.18] Physical File Deletion (Logic Edit Mode)
            const isPhysicalDelete = rawInput.deleteFiles === true;
            if (isPhysicalDelete && filesToDelete.length > 0) {
                const choice = await vscode.window.showWarningMessage(
                    `[SYNAPSE] 진짜로 소스 파일을 삭제하시겠습니까?\n\n` +
                    `${filesToDelete.length}개의 실제 파일이 물리적으로 삭제됩니다.\n` +
                    `⚠️ 삭제 전 자동 스냅샷(백업)이 생성됩니다.`,
                    { modal: true },
                    '💣 삭제 (파괴적)', '❌ 취소'
                );

                if (choice !== '💣 삭제 (파괴적)') {
                    return; // Abort entirely
                }

                // Create safety backup with current state (before node removal is saved)
                try {
                    const backupState = JSON.parse(data.toString());
                    await this.handleTakeSnapshot({ label: `Auto Backup (Before File Deletion)`, data: backupState });
                } catch (e) {
                    Logger.warn('[CanvasPanel] Failed to take pre-deletion snapshot', e);
                }

                // Delete physical files
                for (const relPath of filesToDelete) {
                    try {
                        const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, relPath);
                        await vscode.workspace.fs.delete(fileUri, { useTrash: true });
                        Logger.info(`[CanvasPanel] Physically deleted file: ${relPath}`);
                    } catch (e) {
                        Logger.error(`[CanvasPanel] Failed to delete file: ${relPath}`, e);
                    }
                }
            }

            // 2. Remove connected edges
            if (projectState.edges) {
                const initialEdgeCount = projectState.edges.length;
                projectState.edges = projectState.edges.filter((e: any) => !nodeIdSet.has(e.from) && !nodeIdSet.has(e.to));
                console.log(`[SYNAPSE] Removed ${initialEdgeCount - projectState.edges.length} edges connected to deleted nodes`);
            }

            // 3. Remove from cluster children & cleanup empty clusters
            if (projectState.clusters) {
                projectState.clusters.forEach((c: any) => {
                    if (c.children) {
                        c.children = c.children.filter((id: string) => !nodeIdSet.has(id));
                    }
                });

                const activeClusterIds = new Set(projectState.nodes.map((n: any) => n.data?.cluster_id || n.cluster_id).filter((id: string) => id));
                const initialClusterCount = projectState.clusters.length;
                projectState.clusters = projectState.clusters.filter((c: any) => activeClusterIds.has(c.id));
                const removedClusters = initialClusterCount - projectState.clusters.length;
                if (removedClusters > 0) {
                    console.log(`[SYNAPSE] Cleaned up ${removedClusters} empty clusters`);
                }
            }

            const normalizedJson = this.normalizeProjectState(projectState);
            await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf8'));

            console.log(`[SYNAPSE] ${deletedCount} nodes deleted.`);
            Logger.info(`[CanvasPanel] Successfully deleted ${deletedCount} nodes.`);
            vscode.window.setStatusBarMessage(`${deletedCount} nodes deleted`, 3000);

            await this.sendProjectState();
        } catch (error) {
            Logger.error('Failed to delete nodes:', error);
            vscode.window.showErrorMessage(`Failed to delete nodes: ${error}`);
        }
    }

    private async handleRequestConfirmEdge(edgeId: string, fromFile: string | null, toFile: string | null) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            // 1. project_state.json 로드
            const stateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            const stateData = await vscode.workspace.fs.readFile(stateUri);
            const projectState = JSON.parse(Buffer.from(stateData).toString('utf-8'));
            const edge = (projectState.edges || []).find((e: any) => e.id === edgeId);

            // [v0.2.17] Dynamic File Resolution (새로 생성된 노드의 경우 파라미터가 누락될 수 있음)
            let actualFromFile = fromFile || edge?._fromFile;
            let actualToFile = toFile || edge?._toFile;

            if (!actualFromFile || !actualToFile) {
                const fNode = (projectState.nodes || []).find((n: any) => n.id === edge?.from);
                const tNode = (projectState.nodes || []).find((n: any) => n.id === edge?.to);
                if (!actualFromFile && fNode?.data?.file) actualFromFile = fNode.data.file;
                else if (!actualFromFile && fNode?.data?.label) actualFromFile = fNode.data.label; // Fallback

                if (!actualToFile && tNode?.data?.file) actualToFile = tNode.data.file;
                else if (!actualToFile && tNode?.data?.label) actualToFile = tNode.data.label; // Fallback
            }

            const choice = await vscode.window.showInformationMessage(
                `[SYNAPSE] 이 엣지를 확정하시겠습니까?\n${actualFromFile || '?'} → ${actualToFile || '?'}\n\n확정 시 ${actualFromFile || '상위 모듈'} 최상단에 import 문이 삽입됩니다.`,
                { modal: true }, '✅ 확정', '❌ 취소'
            );
            if (choice !== '✅ 확정') return;

            // status 업데이트 및 저장
            if (edge) edge.status = 'confirmed';
            await vscode.workspace.fs.writeFile(stateUri, Buffer.from(this.normalizeProjectState(projectState), 'utf8'));

            // 2. fromFile 최상단에 import 문 삽입
            if (actualFromFile && actualToFile) {
                await this.injectImportStatement(workspaceFolder.uri.fsPath, actualFromFile, actualToFile, edge?.type);
            } else {
                vscode.window.showWarningMessage('[SYNAPSE] 파일 경로를 찾을 수 없어 코드 주입을 건너뜁니다.');
            }

            this._panel.webview.postMessage({ command: 'edgeConfirmed', edgeId });
            Logger.info(`[CanvasPanel] Edge ${edgeId} confirmed.`);
        } catch (e) {
            vscode.window.showErrorMessage(`[SYNAPSE] 확정 실패: ${e}`);
        }
    }

    /**
     * fromFile 최상단에 toFile에 대한 import 문 삽입 (언어별 자동 감지)
     */
    private async injectImportStatement(rootPath: string, fromFile: string, toFile: string, edgeType?: string) {
        const path = require('path');
        const fromAbs = path.join(rootPath, fromFile);
        const toBase = path.parse(toFile).name; // 확장자 제거
        const toExt = path.extname(toFile).toLowerCase();
        const fromDir = path.dirname(fromFile);
        const toRelDir = path.dirname(toFile);

        // 비-코드 파일(.csv, .json, .db, .md 등)은 Import 문장을 강제로 주입하지 않음
        const nonCodeExts = ['.csv', '.json', '.md', '.txt', '.db', '.sql', '.yaml', '.yml'];
        if (nonCodeExts.includes(toExt) || toExt === '') {
            // 확장자가 없는 가상 노드(예: TEST_DB_CONVERTER)이거나 데이터 파일인 경우
            // 사용자의 파이썬 코드 문법을 깨트리지 않기 위해 주입을 생략하거나 단순히 주석만 남깁니다.
            if (edgeType !== 'dependency' && edgeType !== 'call') {
                Logger.info(`[CanvasPanel] injectImport: Skipping auto-import for non-code target ${toFile} (type: ${edgeType})`);
                return;
            }
        }

        // 상대 경로 계산
        let relPath = path.relative(fromDir, path.join(toRelDir, toBase));
        if (!relPath.startsWith('.')) relPath = './' + relPath;

        const ext = path.extname(fromFile).toLowerCase();
        let importLine: string;
        if (ext === '.py') {
            importLine = `import ${toBase}  # [SYNAPSE] auto-imported`;
        } else if (ext === '.ts' || ext === '.tsx') {
            importLine = `import { ${toBase} } from '${relPath}';  // [SYNAPSE] auto-imported`;
        } else if (ext === '.js' || ext === '.jsx') {
            importLine = `const ${toBase} = require('${relPath}');  // [SYNAPSE] auto-imported`;
        } else {
            Logger.info(`[CanvasPanel] injectImport: unsupported extension ${ext}, skipping.`);
            return;
        }

        try {
            const fileUri = vscode.Uri.file(fromAbs);
            let existing = '';
            try {
                existing = Buffer.from(await vscode.workspace.fs.readFile(fileUri)).toString('utf-8');
            } catch (readErr) {
                Logger.info(`[CanvasPanel] injectImport: Source file ${fromFile} not found or empty, creating new.`);
            }

            // 이미 import 되어 있으면 중복 삽입 방지 (단어 단위 정확히 일치)
            const regex = new RegExp(`\\b${toBase}\\b`);
            if (existing && regex.test(existing)) {
                Logger.info(`[CanvasPanel] injectImport: '${toBase}' already referenced in ${fromFile}, skipping.`);
                return;
            }

            const newContent = importLine + (existing ? '\n' + existing : '\n');
            Logger.info(`[CanvasPanel] injectImport: Writing to ${fromAbs}`);
            await vscode.workspace.fs.writeFile(fileUri, Buffer.from(newContent, 'utf-8'));
            Logger.info(`[CanvasPanel] injectImport: Successfully inserted '${importLine}' into ${fromFile}`);
            vscode.window.showInformationMessage(`[SYNAPSE] ✅ import 삽입 완료: ${fromFile} 최상단에 '${toBase}' 추가됨`);
        } catch (e) {
            Logger.error(`[CanvasPanel] injectImport failed for ${fromFile}:`, e);
        }
    }

    private async handleResetProjectState() {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        // STEP 1: Disk Purge - project_state.json 물리적 초기화
        const emptyState = { nodes: [], edges: [], clusters: [] };
        const uri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
        try {
            await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(emptyState, null, 2), 'utf8'));
            Logger.info('[CanvasPanel] STEP 1: Disk Purge complete.');
        } catch (e) {
            Logger.error('[CanvasPanel] Failed to reset project state:', e);
            vscode.window.showErrorMessage(`[SYNAPSE] 초기화 실패: ${e}`);
            return;
        }

        // STEP 2: Memory Flush - 익스텐션 호스트 내 상태 변수 초기화
        // (sendProjectState는 파일을 다시 읽으므로 별도 초기화 불필요, 파일이 이미 비어있음)
        Logger.info('[CanvasPanel] STEP 2: Memory Flush complete (state will be re-read from empty file).');

        // STEP 3: Visual Reset - 웹뷰에 RESET_CANVAS 신호 전송
        this._panel.webview.postMessage({ command: 'resetCanvas' });
        Logger.info('[CanvasPanel] STEP 3: Visual Reset signal sent to webview.');

        // STEP 4: Re-Bootstrap Prompt
        const choice = await vscode.window.showInformationMessage(
            '🧹 캔버스가 깨끗해졌습니다. 이제 GEMINI.md를 불러올까요?',
            'Bootstrap', '닫기'
        );
        if (choice === 'Bootstrap') {
            await this.handleReBootstrap();
        }
    }

    private async handleReBootstrap() {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        const confirm = await vscode.window.showWarningMessage(
            '프로젝트 지도를 초기화하고 다시 스캔하시겠습니까? (수동으로 작업한 내용은 삭제됩니다)',
            { modal: true },
            'Deep Reset'
        );

        if (confirm === 'Deep Reset') {
            try {
                // Decision logging via command (Modular Extension Communication)
                vscode.commands.executeCommand('synapse.logPrompt', {
                    prompt: "User triggered a Deep Reset (Re-bootstrap) to refresh the visualization map.",
                    title: "Deep Reset Triggered",
                    workspacePath: workspaceFolder.uri.fsPath
                });

                const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');

                // 1. 기존 데이터 삭제 (또는 백업 후 생성)
                if (fs.existsSync(projectStateUri.fsPath)) {
                    fs.unlinkSync(projectStateUri.fsPath);
                }

                console.log('[SYNAPSE] Re-bootstrapping project...');

                // 2. 새로운 메커니즘으로 부트스트랩 재실행
                const engine = new BootstrapEngine();
                const result = await engine.liteBootstrap(
                    workspaceFolder.uri.fsPath,
                    (msg) => {
                        this._panel.webview.postMessage({
                            command: 'analysisProgress',
                            message: msg
                        });
                    }
                );

                if (result.success) {
                    vscode.window.showInformationMessage('Project maps re-generated successfully with folder clustering.');
                    await this.sendProjectState();
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                console.error('Failed to re-bootstrap:', error);
                vscode.window.showErrorMessage(`Re-bootstrap failed: ${error}`);
            }
        }
    }

    private async handleUpdateEdge(edgeId: string, updates: any) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            const data = await vscode.workspace.fs.readFile(projectStateUri);
            const projectState = JSON.parse(data.toString());

            // 엣지 찾기
            if (!projectState.edges) projectState.edges = [];
            const edge = projectState.edges.find((e: any) => e.id === edgeId);

            if (!edge) {
                console.warn('[SYNAPSE] Edge not found in project state:', edgeId);
                return;
            }

            // 엣지 업데이트
            Object.assign(edge, updates);

            // 저장 (정규화 적용)
            const normalizedJson = this.normalizeProjectState(projectState);
            await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf8'));
            console.log('[SYNAPSE] Edge updated:', edge);
            vscode.window.showInformationMessage(`Edge updated: ${edge.type}`);

            // 캔버스 새로고침
            await this.sendProjectState();
        } catch (error) {
            console.error('Failed to update edge:', error);
            vscode.window.showErrorMessage(`Failed to update edge: ${error}`);
        }
    }



    private async handleGenerateFlow(nodeId: string, filePath: string) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            console.log(`[SYNAPSE] Generating flow for ${filePath}...`);

            // Request flow analysis from LSP server
            const result: any = await client.sendRequest('synapse/scanFlow', {
                filePath: path.join(workspaceFolder.uri.fsPath, filePath)
            });

            if (result.success) {
                // 캔버스에 플로우 데이터 전송
                this._panel.webview.postMessage({
                    command: 'flowData',
                    data: result.flowData
                });
                console.log(`[SYNAPSE] Flow data sent for ${nodeId}`);
            } else {
                throw new Error(result.error || 'Unknown error during flow scan');
            }
        } catch (error) {
            console.error('Failed to generate flow:', error);
            vscode.window.showErrorMessage(`Flow generation failed: ${error}`);
        }
    }

    private async handleAnalyzeGemini(filePath: string) {
        // AI 분석 시작 알림
        console.log(`[SYNAPSE] Analyzing GEMINI.md: ${filePath}`);

        try {
            // Request GEMINI analysis from LSP server
            const result: any = await client.sendRequest('synapse/analyzeGemini', { filePath });

            if (!result.success) {
                throw new Error(result.error || 'Unknown error during GEMINI analysis');
            }

            const structure = result.structure;

            // 3. 순서도 생성 (제안 상태의 노드/엣지 반환)
            const generator = new FlowchartGenerator();
            const { nodes: allProposedNodes, edges } = generator.generateInitialFlowchart(structure);

            // 3.5. 기존 노드와 대조하여 중복 필터링
            const workspaceFolder = this._workspaceFolder;
            let currentState: any = { nodes: [] };
            if (workspaceFolder) {
                const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
                try {
                    const data = await vscode.workspace.fs.readFile(projectStateUri);
                    currentState = JSON.parse(data.toString());
                } catch (e) { /* ignore */ }
            }

            const activeFiles = new Set(currentState.nodes.map((n: any) => n.data?.file).filter(Boolean));
            const filteredNodes = allProposedNodes.filter(n => !activeFiles.has(n.data?.file));

            // Store for approval
            this.proposedNodes = filteredNodes;
            this.proposedEdges = edges;

            // 4. 제안(Proposal) 상태로 웹뷰에 전송
            // 이 데이터는 아직 저장되지 않은 상태이며, 사용자가 승인해야 저장됨
            this._panel.webview.postMessage({
                command: 'projectProposal',
                data: {
                    nodes: filteredNodes,
                    edges: edges,
                    structure: structure
                }
            });

            const skippedCount = allProposedNodes.length - filteredNodes.length;
            vscode.window.showInformationMessage(
                `GEMINI.md analyzed. ${filteredNodes.length} nodes proposed.` +
                (skippedCount > 0 ? ` (${skippedCount} existing nodes skipped)` : '')
            );

        } catch (error) {
            console.error('Failed to analyze GEMINI.md:', error);
            vscode.window.showErrorMessage(`Failed to analyze GEMINI.md: ${error}`);
        }
    }

    private async handleApproveNode(nodeId: string) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');

        try {
            // Read existing state
            let currentState: any = { nodes: [], edges: [], clusters: [] };
            try {
                const data = await vscode.workspace.fs.readFile(projectStateUri);
                currentState = JSON.parse(data.toString());
            } catch (e) { /* ignore */ }

            // Find the node (check both proposedNodes and currentState)
            let node = currentState.nodes.find((n: any) => n.id === nodeId);
            let isFromProposal = false;

            if (!node) {
                // Try to find in proposedNodes (from Gemini analysis)
                const nodeIndex = this.proposedNodes.findIndex(n => n.id === nodeId);
                if (nodeIndex !== -1) {
                    const proposedNode = this.proposedNodes[nodeIndex];

                    // CRITICAL: Check if a node with the same file path already exists in currentState
                    const existingNode = currentState.nodes.find((n: any) => n.data && n.data.file === proposedNode.data.file);
                    if (existingNode) {
                        console.log(`[SYNAPSE] Node for ${proposedNode.data.file} already exists. Skipping duplicate approval.`);
                        this.proposedNodes.splice(nodeIndex, 1);
                        return;
                    }

                    node = proposedNode;
                    isFromProposal = true;
                    currentState.nodes.push(node); // Add to state
                    this.proposedNodes.splice(nodeIndex, 1); // Remove from proposal queue
                }
            }

            if (!node) {
                console.warn(`[SYNAPSE] Node ${nodeId} not found for approval.`);
                return;
            }

            // Update status
            node.status = 'active';
            if (node.visual && node.visual.opacity) {
                delete node.visual.opacity;
            }
            if (node.visual && node.visual.dashArray) {
                delete node.visual.dashArray;
            }

            // FILE CREATION LOGIC
            const label = node.data?.label || '';
            // Simple check for file extension
            if (label.includes('.')) {
                const fileName = label;
                // Determine path: default to src/ if it exists, otherwise root
                // For now, let's look for known folders or just put in src/ if checking 'logic' type
                let targetDir = workspaceFolder.uri;

                // Simple heuristic for folder placement
                if (node.type === 'logic' || node.type === 'service' || node.type === 'ui') {
                    try {
                        const srcUri = vscode.Uri.joinPath(workspaceFolder.uri, 'src');
                        await vscode.workspace.fs.stat(srcUri);
                        targetDir = srcUri;
                    } catch { /* src doesn't exist, stay in root */ }
                }

                const fileUri = vscode.Uri.joinPath(targetDir, fileName);

                try {
                    await vscode.workspace.fs.stat(fileUri);
                    console.log(`[SYNAPSE] File already exists: ${fileName}`);
                } catch {
                    // File doesn't exist, create it
                    const boilerplate = this.getBoilerplate(fileName, node.type);
                    await vscode.workspace.fs.writeFile(fileUri, Buffer.from(boilerplate, 'utf8'));
                    console.log(`[SYNAPSE] Created file: ${fileName}`);
                    vscode.window.showInformationMessage(`Created file: ${fileName}`);

                    // Update node data with file path
                    if (!node.data.file) {
                        node.data.file = vscode.workspace.asRelativePath(fileUri);
                    }
                }
            }

            // Save state
            await this.handleSaveState(currentState);

            // Send updated state to view
            await this.sendProjectState();
        } catch (error) {
            console.error('Failed to approve node:', error);
            vscode.window.showErrorMessage(`Failed to approve node: ${error}`);
        }
    }

    private getBoilerplate(fileName: string, type: string): string {
        if (fileName.endsWith('.py')) {
            return `# ${fileName}\n# Created by SYNAPSE\n\ndef main():\n    pass\n`;
        } else if (fileName.endsWith('.ts')) {
            return `/**\n * ${fileName}\n * Created by SYNAPSE\n */\n\nexport class ${fileName.replace('.ts', '')} {\n    constructor() {}\n}\n`;
        } else if (fileName.endsWith('.js')) {
            return `/**\n * ${fileName}\n * Created by SYNAPSE\n */\n\nmodule.exports = {};\n`;
        } else if (fileName.endsWith('.md')) {
            return `# ${fileName.replace('.md', '')}\n\nCreated by SYNAPSE\n`;
        } else if (fileName.endsWith('.sql')) {
            return `-- ${fileName}\n-- Created by SYNAPSE\n`;
        }
        return `// ${fileName}\n// Created by SYNAPSE\n`;
    }

    private async handleRejectNode(nodeId: string) {
        const nodeIndex = this.proposedNodes.findIndex(n => n.id === nodeId);
        if (nodeIndex !== -1) {
            this.proposedNodes.splice(nodeIndex, 1);
            // Also remove related edges
            this.proposedEdges = this.proposedEdges.filter(e => e.from !== nodeId && e.to !== nodeId);

            console.log(`[SYNAPSE] Node ${nodeId} rejected and removed from proposal.`);
        }
    }

    private async handleValidateEdge(edgeId: string, fromNode: any, toNode: any, edgeType: string) {
        try {
            console.log(`[SYNAPSE] Validating edge ${edgeId}: ${fromNode.data.label} -> ${toNode.data.label} (${edgeType})`);

            // 1. 컨텍스트 수집 (간단한 버전)
            const fromContext = fromNode.type + (fromNode.data.description ? `: ${fromNode.data.description}` : '');
            const toContext = toNode.type + (toNode.data.description ? `: ${toNode.data.description}` : '');

            // 2. AI 검증 시뮬레이션 (Phase 4의 핵심 - 실제 LLM 연동 포인트)
            // 실제 구현에서는 여기서 AI 서비스를 호출합니다.
            let result = {
                valid: true,
                reason: 'Appropriate architectural relationship.',
                confidence: 0.95
            };

            // 간단한 규칙 기반 시뮬레이션 (AI 대신)
            if (fromNode.type === 'config' && (toNode.type === 'logic' || toNode.type === 'source')) {
                // Config가 로직으로 흐르는 것은 정상
            } else if ((fromNode.type === 'logic' || fromNode.type === 'source') && fromNode.data.label.toLowerCase().includes('ui') && toNode.type === 'data') {
                result = {
                    valid: false,
                    reason: 'Potential bypass: UI components should not directly access Data stores. Consider using an API or Service layer.',
                    confidence: 0.88
                };
            } else if (fromNode.id === toNode.id) {
                result = {
                    valid: false,
                    reason: 'Circular dependency: Self-reference is not allowed in this layer.',
                    confidence: 1.0
                };
            }

            // 3. 결과 전송
            this._panel.webview.postMessage({
                command: 'edgeValidationResult',
                edgeId: edgeId,
                result: result
            });
        } catch (error) {
            console.error('Failed to validate edge:', error);
        }
    }

    private async handleSaveState(newState: any) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');

            // 1. 기존 상태 읽기
            let currentState: any = {};
            try {
                const existingData = await vscode.workspace.fs.readFile(projectStateUri);
                currentState = JSON.parse(Buffer.from(existingData).toString('utf-8'));
                if (typeof currentState === 'string') currentState = JSON.parse(currentState);
            } catch (e) {
                console.warn('[SYNAPSE] No existing project state to update positions');
                return;
            }

            // 2. 안전한 좌표 병합 및 신규 노드 추가 (기존 데이터를 전혀 파괴하지 않음)
            if (newState.nodes && Array.isArray(newState.nodes)) {
                if (!currentState.nodes) currentState.nodes = [];
                for (const uiNode of newState.nodes) {
                    const backendNode = currentState.nodes.find((n: any) => n.id === uiNode.id);
                    if (backendNode) {
                        if (uiNode.position) backendNode.position = uiNode.position;
                        // Synchronize label updates from UI (like renaming new nodes)
                        if (uiNode.data?.label && backendNode.data) {
                            backendNode.data.label = uiNode.data.label;
                        }
                    } else {
                        // [v0.2.18] This is a brand new node created from the UI! Add it to the backend.
                        currentState.nodes.push(uiNode);
                        Logger.info(`[CanvasPanel] handleSaveState: Appended new UI node ${uiNode.id}`);
                    }
                }
            }

            if (newState.clusters && Array.isArray(newState.clusters)) {
                for (const uiCluster of newState.clusters) {
                    const backendCluster = (currentState.clusters || []).find((c: any) => c.id === uiCluster.id);
                    if (backendCluster) {
                        if (uiCluster.position) backendCluster.position = uiCluster.position;
                        if (uiCluster.width) backendCluster.width = uiCluster.width;
                        if (uiCluster.height) backendCluster.height = uiCluster.height;
                    }
                }
            }

            // 3. 파일 저장 (정규화 적용)
            const normalizedJson = this.normalizeProjectState(currentState);
            await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf8'));
        } catch (error) {
            console.error('Failed to safely save project state positions:', error);
        }
    }

    private async handleTakeSnapshot(state: any) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            let currentProjectState = state.data;

            // If state data is missing (e.g. called from requestSnapshot), read it from disk
            if (!currentProjectState) {
                try {
                    const data = await vscode.workspace.fs.readFile(projectStateUri);
                    currentProjectState = JSON.parse(Buffer.from(data).toString('utf-8'));
                } catch (e) {
                    vscode.window.showErrorMessage('Cannot take snapshot: Project state is empty or invalid.');
                    return;
                }
            }

            const historyUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'synapse_history.json');
            let history: any[] = [];

            try {
                const existingHistory = await vscode.workspace.fs.readFile(historyUri);
                history = JSON.parse(Buffer.from(existingHistory).toString('utf-8'));
            } catch (e) {
                // History file doesn't exist yet
            }

            // [v0.2.18 Rollback - Phase 3 CPR] Temporarily disabled file backups to prevent RangeError
            /*
            const fileBackups: Record<string, string> = {};
            if (currentProjectState.nodes && Array.isArray(currentProjectState.nodes)) {
                for (const node of currentProjectState.nodes) {
                    if (node.data && node.data.file) {
                        try {
                            const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, node.data.file);
                            const fileData = await vscode.workspace.fs.readFile(fileUri);
                            fileBackups[node.data.file] = fileData.toString();
                        } catch (e) {
                            Logger.warn(`[CanvasPanel] Snapshot: failed to backup file ${node.data.file}`, e);
                        }
                    }
                }
            }
            */
            const fileBackups = {}; // Emergency fallback

            const snapshot = {
                id: `snap_${Date.now()}`,
                timestamp: Date.now(),
                label: state.label || `Snapshot ${history.length + 1}`,
                data: currentProjectState, // nodes, edges, clusters
                fileBackups // [v0.2.18] Storing file contents
            };

            history.unshift(snapshot); // Newest first
            if (history.length > 50) history.pop(); // Limit history size

            await vscode.workspace.fs.writeFile(historyUri, Buffer.from(JSON.stringify(history, null, 2), 'utf8'));

            // Record decision if label is provided
            if (state.label) {
                vscode.commands.executeCommand('synapse.logPrompt', {
                    prompt: `Snapshot taken: ${state.label}`,
                    title: state.label,
                    workspacePath: workspaceFolder.uri.fsPath
                });
            }

            this.sendHistory(); // Update UI
            vscode.window.showInformationMessage(`Snapshot saved: ${snapshot.label}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to take snapshot: ${error}`);
        }
    }

    private async handleLogPrompt(prompt: string, title?: string) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder || !prompt) return;

        try {
            await vscode.commands.executeCommand('synapse.logPrompt', {
                prompt,
                title,
                workspacePath: workspaceFolder.uri.fsPath
            });
            vscode.window.showInformationMessage(`Prompt logged: ${title || 'Untitled'}`);
            await this.sendProjectState(); // Refresh to show the new history node
        } catch (e) {
            vscode.window.showErrorMessage(`Failed to log prompt: ${e}`);
        }
    }

    private async handleRequestLogPrompt() {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            // 1. Check Auto-Save Setting
            const config = vscode.workspace.getConfiguration('synapse');
            const autoSave = config.get<boolean>('prompt.autoSave', false);

            // 2. Ask for Prompt Content (always required)
            const prompt = await vscode.window.showInputBox({
                placeHolder: 'Enter the prompt or design decision to log',
                prompt: 'Prompt Content'
            });

            if (!prompt) return; // User cancelled

            let title: string | undefined;

            // 3. Ask for Title (if Auto-Save is OFF)
            if (!autoSave) {
                title = await vscode.window.showInputBox({
                    placeHolder: 'Enter a filename/title (optional)',
                    prompt: 'Prompt Title'
                });
            }

            // 4. Log the prompt
            await this.handleLogPrompt(prompt, title);

        } catch (e) {
            vscode.window.showErrorMessage(`Error handling log prompt request: ${e}`);
        }
    }

    private async sendHistory() {
        const workspaceFolder = this._workspaceFolder;
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
        const workspaceFolder = this._workspaceFolder;
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
                    },
                    fileBackups: {} // We could back up files here too, but skipping for speed unless strictly needed
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
                existingState = JSON.parse(Buffer.from(data).toString('utf-8'));
            } catch (e) { }

            const newState = {
                ...existingState,
                nodes: snapshot.data.nodes,
                edges: snapshot.data.edges,
                clusters: snapshot.data.clusters
            };

            await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(JSON.stringify(newState, null, 2), 'utf8'));

            // [v0.2.18] Restore File Backups physically to disk
            if (snapshot.fileBackups) {
                let restoredCount = 0;
                for (const [relPath, content] of Object.entries(snapshot.fileBackups)) {
                    try {
                        const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, relPath);
                        await vscode.workspace.fs.writeFile(fileUri, Buffer.from(content as string, 'utf8'));
                        restoredCount++;
                    } catch (e) {
                        Logger.error(`[CanvasPanel] Rollback: Failed to restore file ${relPath}`, e);
                    }
                }
                if (restoredCount > 0) {
                    Logger.info(`[CanvasPanel] Rollback: Restored ${restoredCount} physical files from snapshot.`);
                }
            }

            // 3. Notify webview to reload
            await this.sendProjectState();
            await this.sendHistory(); // Update history list with backup

            this._panel.webview.postMessage({ command: 'rollbackComplete' });

            vscode.window.showInformationMessage(`Rolled back to: ${snapshot.label}. Current state backed up.`);
        } catch (error) {
            console.error('[SYNAPSE] Rollback failed:', error);
            vscode.window.showErrorMessage(`Rollback failed: ${error}`);
        }
    }

    /**
     * .synapse_contexts/ 디렉터리를 스캔하여 '기억의 성단' 클러스터를 빌드.
     * - GEMINI.md 정의: "./.synapse_contexts/" | "YYYY-MM-DD_HHMM.md"
     * - 휘발성 (project_state.json에 저장하지 않음)
     * - Read-Only: 삭제·수정 불가
     */
    private async buildContextVaultCluster(projectRoot: string): Promise<{ cluster: any; nodes: any[] }> {
        const contextDir = path.join(projectRoot, '.synapse_contexts');
        const CLUSTER_ID = 'ctx_vault_cluster';
        const emptyResult = { cluster: null as any, nodes: [] };
        console.log(`[SYNAPSE] Checking Context Vault at: ${contextDir}`);

        try {
            if (!fs.existsSync(contextDir)) return emptyResult;

            const files = fs.readdirSync(contextDir)
                .filter(f => f.endsWith('.md'))
                .sort()
                .reverse(); // 최신 파일 위로 (YYYY-MM-DD 정렬)

            if (files.length === 0) return emptyResult;

            // 클러스터 우측 상단에 배치 (Document Shelf와 분리된 공간)
            const VAULT_X = 1400;
            const VAULT_Y = 80;
            const NODE_SPACING = 55;

            const nodes = files.map((fileName, i) => ({
                id: `ctx_vault_node_${fileName}`,
                type: 'documentation',
                status: 'read_only',
                position: { x: VAULT_X, y: VAULT_Y + i * NODE_SPACING },
                cluster_id: CLUSTER_ID,
                data: {
                    label: fileName,
                    file: `.synapse_contexts/${fileName}`,
                    description: '기억의 성단 — 맥락 기록 (read-only)',
                    color: '#d79921',
                    readOnly: true
                }
            }));

            const cluster = {
                id: CLUSTER_ID,
                label: '🧠 Intelligent Context Vault',
                collapsed: false,
                readOnly: true,
                style: {
                    borderColor: '#d79921',
                    backgroundColor: 'rgba(215, 153, 33, 0.07)'
                }
            };

            return { cluster, nodes };
        } catch (e) {
            console.warn('[SYNAPSE] Failed to build Context Vault cluster:', e);
            return emptyResult;
        }
    }

    /** 레코딩 상태를 캔버스 웹뷰로 전달 (REC 버튼 동기화) */
    public focusNode(nodeId: string) {
        if (!this._panel) return;
        this._panel.webview.postMessage({
            command: 'focusNode',
            nodeId: nodeId
        });
    }

    public postRecordingState(isRecording: boolean) {
        if (!this._panel) return;
        this._panel.webview.postMessage({
            command: 'recordingState',
            isRecording
        });
    }

    public async sendProjectState() {
        if (!this._panel) return;
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) {
            console.error('No workspace folder found');
            return;
        }

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            Logger.info(`[CanvasPanel] sendProjectState: Reading state from ${projectStateUri.fsPath}`);

            let projectState;
            try {
                const data = await vscode.workspace.fs.readFile(projectStateUri);
                projectState = JSON.parse(data.toString());
                Logger.info(`[CanvasPanel] sendProjectState: Loaded ${projectState.nodes?.length || 0} nodes and ${projectState.edges?.length || 0} edges.`);
            } catch (e: any) {
                // Only create default if file truly doesn't exist
                const fileDoesNotExist = e.code === 'FileNotFound' || e.message.includes('EntryNotFound');

                if (fileDoesNotExist) {
                    console.log('[SYNAPSE] project_state.json not found, initializing default state...');

                    // Ensure data directory exists
                    const dataDirUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data');
                    try {
                        await vscode.workspace.fs.createDirectory(dataDirUri);
                    } catch (dirError) { /* ignore */ }

                    projectState = {
                        project_name: workspaceFolder.name,
                        canvas_state: {
                            zoom_level: 1.0,
                            offset: { x: 0, y: 0 },
                            visible_layers: ['source', 'documentation']
                        },
                        nodes: [
                            {
                                id: 'node_entry',
                                type: 'source',
                                status: 'proposed',
                                position: { x: 400, y: 300 },
                                data: {
                                    label: 'Entrypoint (Template)',
                                    description: 'System Entry Point (Auto-generated template)',
                                    color: '#b8bb26'
                                },
                                visual: {
                                    opacity: 0.5,
                                    dashArray: '5,5'
                                }
                            }
                        ],
                        edges: [],
                        clusters: []
                    };

                    // Save default state
                    const normalizedJson = this.normalizeProjectState(projectState);
                    await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf-8'));
                } else {
                    // Critical error reading existing file (e.g. JSON parse error or permissions)
                    console.error(`[SYNAPSE] Failed to read project_state.json: ${e.message}`);
                    vscode.window.showErrorMessage(`Failed to load architecture state: ${e.message}`);
                    return;
                }
            }

            // 고도화: 노드가 전혀 없는 경우 (신규 프로젝트) 자동 발견 시도
            if (!projectState.nodes || projectState.nodes.length === 0) {
                console.log('[SYNAPSE] Project state is empty, triggering auto-discovery...');
                const engine = new BootstrapEngine();
                const discoveredState = await engine.autoDiscover(
                    workspaceFolder.uri.fsPath,
                    undefined,
                    (msg) => {
                        this._panel.webview.postMessage({
                            command: 'analysisProgress',
                            message: msg
                        });
                    }
                );

                if (discoveredState.nodes.length > 0) {
                    projectState = discoveredState;
                    // 자동 발견된 상태 저장
                    const normalizedJson = this.normalizeProjectState(projectState);
                    await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf-8'));
                }
            }

            // 1. FileScanner 인스턴스 생성
            const scanner = new FileScanner();

            // 2. 각 노드에 대해 실제 파일 분석 수행 (Parallelized with Concurrency Limit for v0.2.16)
            console.log(`[SYNAPSE] Starting throttled file scan for ${projectState.nodes.length} nodes...`);
            console.time('[SYNAPSE] Total Scan Time');

            this._panel.webview.postMessage({
                command: 'analysisProgress',
                progress: 0,
                total: projectState.nodes.length,
                message: 'Analyzing file contents...'
            });

            const CONCURRENCY_LIMIT = 5;
            const nodesToScan = projectState.nodes;

            for (let i = 0; i < nodesToScan.length; i += CONCURRENCY_LIMIT) {
                const chunk = nodesToScan.slice(i, i + CONCURRENCY_LIMIT);
                await Promise.all(chunk.map(async (node: any, chunkIndex: number) => {
                    const actualIndex = i + chunkIndex;
                    if (node.data && (node.data.path || node.data.file)) {
                        const relativePath = node.data.path || node.data.file;
                        const filePath = path.join(workspaceFolder.uri.fsPath, relativePath);

                        try {
                            // Diagnostics: log start of scan for large/suspicious files
                            if (actualIndex % 10 === 0) console.log(`[SYNAPSE] Scanning [${actualIndex}/${nodesToScan.length}]: ${relativePath}`);
                            const summary = scanner.scanFile(filePath);
                            node.data.summary = summary;
                        } catch (e) {
                            console.error(`[SYNAPSE] Error scanning ${relativePath}:`, e);
                        }
                    }

                    // Send progress update periodically
                    // Throttled UI Progress: Only update every 10% or at significant milestones
                    const progressPercent = Math.round((actualIndex / nodesToScan.length) * 100);
                    const lastProgressPercent = Math.round(((actualIndex - 1) / nodesToScan.length) * 100);

                    if (progressPercent % 10 === 0 && progressPercent !== lastProgressPercent || actualIndex === nodesToScan.length - 1) {
                        this._panel.webview.postMessage({
                            command: 'analysisProgress',
                            progress: actualIndex,
                            total: nodesToScan.length,
                            message: `Analyzing file contents... (${progressPercent}%)`
                        });
                    }
                }));
            }
            console.timeEnd('[SYNAPSE] Total Scan Time');

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

                // Add sub-parts for better matching (e.g. "Namespace::Class" -> "Class")
                if (n.data.label && n.data.label.includes('::')) {
                    const parts = n.data.label.split('::');
                    nodeMap.set(parts[parts.length - 1], n.id);
                }
            });
            console.log(`[SYNAPSE] Node map built with ${nodeMap.size} keys.`);

            console.log(`[SYNAPSE] Discovering edges for ${projectState.nodes.length} nodes...`);
            console.time('[SYNAPSE] Edge Discovery Time');
            this._panel.webview.postMessage({
                command: 'analysisProgress',
                message: 'Discovering high-level connections...'
            });

            const existingEdgeKeys = new Set();
            if (projectState.edges) {
                projectState.edges.forEach((e: any) => existingEdgeKeys.add(`${e.from}->${e.to}`));
            }

            projectState.nodes.forEach((sourceNode: any) => {
                const summary = sourceNode.data?.summary;
                if (summary && summary.references) {
                    for (const ref of summary.references) {
                        const targetName = typeof ref === 'string' ? ref : ref.target;
                        const edgeType = typeof ref === 'string' ? 'dependency' : ref.type;

                        const cleanRef = targetName.replace(/^\.\//, '').replace(/^\.\.\//, '');
                        const targetNodeId = nodeMap.get(targetName) || nodeMap.get(cleanRef) || nodeMap.get(path.parse(cleanRef).name);

                        if (targetNodeId && targetNodeId !== sourceNode.id) {
                            const edgeKey = `${sourceNode.id}->${targetNodeId}`;
                            if (!existingEdgeKeys.has(edgeKey)) {
                                discoveredEdges.push({
                                    id: `edge_auto_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
                                    from: sourceNode.id,
                                    to: targetNodeId,
                                    type: edgeType,
                                    label: edgeType === 'dependency' ? 'ref' : edgeType
                                });
                                existingEdgeKeys.add(edgeKey); // Prevent duplicate auto-edges
                            }
                        }
                    }
                }
            });
            console.timeEnd('[SYNAPSE] Edge Discovery Time');

            console.log(`[SYNAPSE] Edge discovery complete. Found ${discoveredEdges.length} auto-edges.`);

            // 4. 웹뷰로 전송할 때만 자동 발견된 엣지 포함 (저장하지 않음!)
            console.log('[SYNAPSE] Preparing state for webview...');
            const stateForWebview = {
                ...projectState,
                edges: [
                    ...(projectState.edges || []), // 저장된 엣지 전부 (수동 + 이전 자동 발견)
                    ...discoveredEdges.filter((de: any) => !(projectState.edges || []).some((e: any) => e.from === de.from && e.to === de.to)) // 중복 방지
                ]
            };

            // 5. Context Vault 클러스터 주입 (read-only, volatile — 저장하지 않음)
            const contextVaultCluster = await this.buildContextVaultCluster(workspaceFolder.uri.fsPath);
            if (contextVaultCluster.nodes.length > 0) {
                // 기존 context vault 노드/클러스터 제거 후 새로 주입
                stateForWebview.nodes = (stateForWebview.nodes || []).filter(
                    (n: any) => !n.id.startsWith('ctx_vault_node_')
                );
                stateForWebview.clusters = (stateForWebview.clusters || []).filter(
                    (c: any) => c.id !== 'ctx_vault_cluster'
                );

                stateForWebview.nodes.push(...contextVaultCluster.nodes);
                stateForWebview.clusters = [...(stateForWebview.clusters || []), contextVaultCluster.cluster];
            }

            // 6. 웹뷰로 전송
            const payload = {
                command: 'projectState',
                data: stateForWebview
            };
            const payloadSize = JSON.stringify(payload).length;
            Logger.info(`[CanvasPanel] sendProjectState: Sending projectState to webview (${stateForWebview.nodes.length} nodes, ${stateForWebview.edges.length} edges). Payload size: ${(payloadSize / 1024).toFixed(2)} KB`);

            // Log a small sample for debugging
            if (stateForWebview.nodes.length > 0) {
                Logger.info(`[CanvasPanel] Sample Node [0]:`, stateForWebview.nodes[0]);
            }

            this._panel.webview.postMessage(payload);

        } catch (error) {
            Logger.error('[CanvasPanel] sendProjectState failed:', error);
            vscode.window.showErrorMessage(`Failed to load project state: ${error}`);
        }
    }

    private _update() {
        if (!this._panel.visible) {
            return;
        }
        const webview = this._panel.webview;
        Logger.info(`[CanvasPanel] Updating Webview HTML...`);
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Read the HTML file
        const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'ui', 'index.html');
        let html = fs.readFileSync(htmlPath.fsPath, 'utf8');

        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'ui', 'canvas-engine.js')
        );

        // Replace script src with webview URI
        html = html.replace(
            'src="canvas-engine.js"',
            `src="${scriptUri}"`
        );

        // Add CSP - relaxed for webview compatibility
        const nonce = getNonce();
        html = html.replace(
            '<head>',
            `<head>
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval'; img-src ${webview.cspSource} https:; connect-src ${webview.cspSource} https:; worker-src ${webview.cspSource} blob:;">
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
