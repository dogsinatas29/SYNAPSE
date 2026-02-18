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
import { GeminiParser } from '../core/GeminiParser';
import { FlowchartGenerator } from '../core/FlowchartGenerator';
import { BootstrapEngine } from '../bootstrap/BootstrapEngine';
import { client } from '../client';

export class CanvasPanel {
    public static currentPanel: CanvasPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _workspaceFolder: vscode.WorkspaceFolder;
    private _disposables: vscode.Disposable[] = [];
    private proposedNodes: any[] = [];
    private proposedEdges: any[] = [];

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
                    case 'deleteEdge':
                        await this.handleDeleteEdge(message.edgeId);
                        return;
                    case 'deleteNode':
                        await this.handleDeleteNode(message.nodeId);
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
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            const data = await vscode.workspace.fs.readFile(projectStateUri);
            const projectState = JSON.parse(data.toString());

            // 1. 노드 제거
            if (!projectState.nodes) projectState.nodes = [];
            const nodeIndex = projectState.nodes.findIndex((n: any) => n.id === nodeId);

            if (nodeIndex === -1) {
                console.warn('[SYNAPSE] Node not found in project state:', nodeId);
                return;
            }

            const deletedNode = projectState.nodes[nodeIndex];
            projectState.nodes.splice(nodeIndex, 1);

            // 2. 연결된 엣지 제거
            if (projectState.edges) {
                const initialEdgeCount = projectState.edges.length;
                projectState.edges = projectState.edges.filter((e: any) => e.from !== nodeId && e.to !== nodeId);
                console.log(`[SYNAPSE] Removed ${initialEdgeCount - projectState.edges.length} edges connected to node ${nodeId}`);
            }

            // 3. 클러스터 자식 목록에서 제거
            if (projectState.clusters) {
                projectState.clusters.forEach((c: any) => {
                    if (c.children) {
                        c.children = c.children.filter((id: string) => id !== nodeId);
                    }
                });
            }

            // 저장 (정규화 적용)
            const normalizedJson = this.normalizeProjectState(projectState);
            await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf8'));

            console.log('[SYNAPSE] Node deleted:', deletedNode.id);
            vscode.window.setStatusBarMessage(`Node deleted: ${deletedNode.data?.label || nodeId}`, 3000);

            // 캔버스 새로고침
            await this.sendProjectState();
        } catch (error) {
            console.error('Failed to delete node:', error);
            vscode.window.showErrorMessage(`Failed to delete node: ${error}`);
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
                const result = await engine.liteBootstrap(workspaceFolder.uri.fsPath);

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
            const { nodes, edges } = generator.generateInitialFlowchart(structure);

            // Store for approval
            this.proposedNodes = nodes;
            this.proposedEdges = edges;

            // 4. 제안(Proposal) 상태로 웹뷰에 전송
            // 이 데이터는 아직 저장되지 않은 상태이며, 사용자가 승인해야 저장됨
            this._panel.webview.postMessage({
                command: 'projectProposal',
                data: {
                    nodes: nodes,
                    edges: edges,
                    structure: structure
                }
            });

            vscode.window.showInformationMessage(`GEMINI.md analyzed. ${nodes.length} nodes proposed.`);

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
                    node = this.proposedNodes[nodeIndex];
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
            if (projectState.nodes.length === 0) {
                console.log('[SYNAPSE] Project state is empty, triggering auto-discovery...');
                const engine = new BootstrapEngine();
                const discoveredState = await engine.autoDiscover(workspaceFolder.uri.fsPath);

                if (discoveredState.nodes.length > 0) {
                    projectState = discoveredState;
                    // 자동 발견된 상태 저장
                    const normalizedJson = this.normalizeProjectState(projectState);
                    await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf-8'));
                }
            }

            // 1. FileScanner 인스턴스 생성
            const scanner = new FileScanner();

            // 2. 각 노드에 대해 실제 파일 분석 수행
            console.log(`[SYNAPSE] Starting file scan for ${projectState.nodes.length} nodes...`);
            for (const node of projectState.nodes) {
                if (node.data && (node.data.path || node.data.file)) {
                    const relativePath = node.data.path || node.data.file;
                    const filePath = path.join(workspaceFolder.uri.fsPath, relativePath);

                    console.log(`[SYNAPSE] Scanning node: ${node.id} (${relativePath})`);
                    const summary = scanner.scanFile(filePath);
                    console.log(`[SYNAPSE] Scan complete for ${node.id}: ${summary.classes.length} classes, ${summary.functions.length} functions, ${summary.references.length} refs`);

                    // 노드 데이터에 요약본 추가
                    node.data.summary = summary;
                }
            }
            console.log('[SYNAPSE] All nodes scanned successfully.');

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
