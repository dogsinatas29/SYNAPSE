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

        // Set the webview's initial html content
        this._update();

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
                        await this.openFile(message.filePath);
                        return;
                    case 'getProjectState':
                        await this.sendProjectState();
                        return;
                    case 'saveState':
                        await this.handleSaveState(message.data);
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
                currentState = JSON.parse(data.toString());
            } catch (e) {
                // Create file if it doesn't exist
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

    private async openFile(filePath: string) {
        const workspaceFolder = this._workspaceFolder;
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

            vscode.window.showInformationMessage(`[SYNAPSE] Logic analysis complete. '리포트.md' generated.`);
        } catch (error) {
            console.error('[SYNAPSE] Logic Analysis failed:', error);
            vscode.window.showErrorMessage(`Logic Analysis failed: ${error}`);
        }
    }

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
        const workspaceFolder = this._workspaceFolder;
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

    private async handleDeleteEdge(edgeId: string) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            const data = await vscode.workspace.fs.readFile(projectStateUri);
            const projectState = JSON.parse(data.toString());

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
            const projectState = JSON.parse(data.toString());

            if (!projectState.nodes) projectState.nodes = [];

            const nodeIdSet = new Set(targetIds);
            const initialNodeCount = projectState.nodes.length;

            let deletedCount = 0;

            // 1. Remove Nodes
            projectState.nodes = projectState.nodes.filter((n: any) => {
                if (nodeIdSet.has(n.id)) {
                    deletedCount++;
                    return false;
                }
                return true;
            });

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
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            let currentProjectState = state.data;

            // If state data is missing (e.g. called from requestSnapshot), read it from disk
            if (!currentProjectState) {
                try {
                    const data = await vscode.workspace.fs.readFile(projectStateUri);
                    currentProjectState = JSON.parse(data.toString());
                } catch (e) {
                    vscode.window.showErrorMessage('Cannot take snapshot: Project state is empty or invalid.');
                    return;
                }
            }

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
                data: currentProjectState // nodes, edges, clusters
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
            console.log(`[SYNAPSE] Reading project state from: ${projectStateUri.fsPath}`);

            let projectState;
            try {
                const data = await vscode.workspace.fs.readFile(projectStateUri);
                projectState = JSON.parse(data.toString());
                console.log(`[SYNAPSE] Successfully loaded project state with ${projectState.nodes?.length || 0} nodes.`);
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
                    ...(projectState.edges || []).filter((e: any) => !e.id.startsWith('edge_auto_')), // 수동 엣지만
                    ...discoveredEdges // 자동 발견 엣지 (휘발성)
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

            console.log(`[SYNAPSE] Discovered ${discoveredEdges.length} auto edges (volatile, not persisted)`);

            // 6. 웹뷰로 전송
            console.log('[SYNAPSE] Sending projectState to webview:', JSON.stringify(stateForWebview).substring(0, 200) + '...');
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
