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

/**
 * SequentialTaskQueue - Asynchronous task serializer
 * Prevents race conditions by ensuring only one state-modifying task runs at a time.
 */
class SequentialTaskQueue {
    private queue: (() => Promise<any>)[] = [];
    private running = false;

    async push<T>(task: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await task();
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            });
            this.runNext();
        });
    }

    private async runNext() {
        if (this.running || this.queue.length === 0) return;
        this.running = true;
        const task = this.queue.shift();
        if (task) {
            try {
                await task();
            } catch (e) {
                console.error('[SequentialTaskQueue] Task failed:', e);
            }
        }
        this.running = false;
        this.runNext();
    }
}


export class CanvasPanel {
    public static currentPanel: CanvasPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _workspaceFolder: vscode.WorkspaceFolder;
    private _disposables: vscode.Disposable[] = [];
    private proposedNodes: any[] = [];
    private proposedEdges: any[] = [];
    private _contextRequestCallback: ((data: any) => void) | undefined;
    private _isProcessingConfirm: boolean = false; // [v0.2.17 Patch 13.2] Prevent duplicate dialogs
    private _taskQueue = new SequentialTaskQueue();


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
                const stateModifyingCommands = [
                    'saveState', 'ungroup', 'takeSnapshot', 'rollback',
                    'createManualEdge', 'deleteEdge', 'deleteNodes',
                    'updateEdge', 'approveNode', 'rejectNode',
                    'requestDeleteEdgeSource', 'createManualNode',
                    'reBootstrap', 'requestConfirmEdge', 'setBaseline',
                    'resetProjectState'
                ];

                if (stateModifyingCommands.includes(message.command)) {
                    // [v0.2.17 Patch 13.2] Strict Guard for confirm dialog
                    if (message.command === 'requestConfirmEdge' && this._isProcessingConfirm) {
                        Logger.warn('[CanvasPanel] Confirmation already in progress, ignoring duplicate request.');
                        return;
                    }
                    await this._taskQueue.push(() => this._handleMessage(message));
                } else {
                    await this._handleMessage(message);
                }
            },
            null,
            this._disposables
        );
    }

    private async _handleMessage(message: any) {
        if (message.command !== 'contextData' && message.command !== 'log') {
            Logger.info(`[CanvasPanel] Received command: ${message.command}`);
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
                await this.handleSaveState(message.data || message.state);
                return;
            case 'readFile':
                await this.handleReadFile(message.filePath);
                return;
            case 'ungroup':
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
            case 'showWarning':
                vscode.window.showWarningMessage(`[SYNAPSE] ${message.message}`);
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
                    await this.handleTakeSnapshot({ label });
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
                await vscode.commands.executeCommand('synapse.logPrompt');
                return;
            case 'contextData':
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

            // Add new node (with duplicate check)
            if (!currentState.nodes) currentState.nodes = [];

            const isDuplicate = currentState.nodes.some((n: any) =>
                n.data?.label === node.data?.label && n.type === node.type
            );

            if (isDuplicate) {
                Logger.warn(`[CanvasPanel] Blocked duplicate node creation: ${node.data?.label}`);
                vscode.window.showWarningMessage(`Node with name '${node.data?.label}' already exists.`);
                return;
            }

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

    /**
     * [v0.2.18.1] Lightweight Schema Guard
     * Validates that the state has the essential structure before persisting.
     */
    private validateProjectState(state: any): boolean {
        if (!state || typeof state !== 'object') return false;

        // Essential keys check
        const essentialKeys = ['nodes', 'edges', 'clusters'];
        for (const key of essentialKeys) {
            if (!Array.isArray(state[key])) {
                Logger.error(`[SYNAPSE:v0.2.18.1] Schema Validation Failed: ${key} must be an array.`);
                return false;
            }
        }

        // Basic Node integrity
        for (const node of state.nodes) {
            if (!node.id || !node.type) {
                Logger.error(`[SYNAPSE:v0.2.18.1] Schema Validation Failed: Node ${node.id || 'unknown'} missing essential properties.`);
                return false;
            }
        }

        return true;
    }

    private normalizeProjectState(state: any): string {
        // [v0.2.18.1] Pre-save Validation
        if (!this.validateProjectState(state)) {
            Logger.warn('[SYNAPSE:v0.2.18.1] State normalization halted due to validation failure.');
        }

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

        // [v0.2.18.1] UTF8 & Byte-Oriented Header Logic
        // Calculate total byte size of the state for the header
        const stateString = JSON.stringify(safeState);
        const byteSize = Buffer.byteLength(stateString, 'utf8');
        console.log(`[SYNAPSE:v0.2.18.1] Exporting state - Size: ${byteSize} bytes (UTF-8)`);

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
            // [v0.2.18.1] Memory Alignment Simulation: Sort keys to ensure predictable layout
            Object.keys(obj).sort().forEach(key => {
                sorted[key] = sortKeys(obj[key]);
            });
            return sorted;
        };

        // 3. 정규화 적용
        const prunedState = pruneDefaults(safeState, {});
        const sortedState = sortKeys(prunedState);

        // 5. [v0.2.20] Edge Deduplication (Cleanup existing duplicates)
        if (sortedState && sortedState.edges && Array.isArray(sortedState.edges)) {
            const seen = new Set<string>();
            sortedState.edges = sortedState.edges.filter((e: any) => {
                const key = `${e.from}|${e.to}|${e.type}|${e.fromCluster}|${e.toCluster}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        }

        // [v0.2.18.1] Add Byte-Oriented Metadata for Iron Guard Protocol
        if (sortedState && typeof sortedState === 'object') {
            sortedState._iron_guard = {
                version: '0.2.18.1',
                byte_size: byteSize,
                encoding: 'UTF-8',
                alignment: 8
            };
        }

        // 4. 정렬된 JSON 문자열 반환
        return JSON.stringify(sortedState, null, 2);
    }

    private async handleCreateManualEdge(edge: any) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        console.log('[SYNAPSE] handleCreateManualEdge received:', JSON.stringify(edge, null, 2));

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            const data = await vscode.workspace.fs.readFile(projectStateUri);
            const projectState = JSON.parse(data.toString());

            console.log(`[SYNAPSE] Current project_state has ${projectState.nodes?.length} nodes and ${projectState.edges?.length} edges.`);

            // Resolve missing file paths dynamically before saving
            const fromNode = (projectState.nodes || []).find((n: any) => n.id === edge.from);
            const toNode = (projectState.nodes || []).find((n: any) => n.id === edge.to);

            if (!fromNode) console.warn(`[SYNAPSE] Source node NOT found in project_state: ${edge.from}`);
            if (!toNode) console.warn(`[SYNAPSE] Target node NOT found in project_state: ${edge.to}`);

            if (!edge._fromFile && fromNode?.data) {
                edge._fromFile = fromNode.data.file || fromNode.data.label || null;
            }
            if (!edge._toFile && toNode?.data) {
                edge._toFile = toNode.data.file || toNode.data.label || null;
            }

            // [v0.2.17 Patch 7] Strict Extension Validation (Pre-validation)
            const filesToCheck = [edge._fromFile, edge._toFile];
            for (const file of filesToCheck) {
                if (file) {
                    const ext = path.extname(file).toLowerCase();
                    const supportedExts = ['.ts', '.js', '.tsx', '.jsx', '.py', '.c', '.h', '.cpp', '.hpp', '.rs'];
                    if (!supportedExts.includes(ext) || ext === '') {
                        vscode.window.showWarningMessage(`[SYNAPSE] ⚠️ ${file}: 연결할 수 없는 파일 형식입니다. (확장자가 필요합니다)`);
                        return; // Block edge creation
                    }
                }
            }

            // [v0.2.20 Fix] Ensure we don't duplicate edges or add edges with non-existent nodes in state
            if (!projectState.edges) projectState.edges = [];

            // Check if this exact edge ID already exists OR if a logically identical edge exists
            const duplicate = projectState.edges.find((e: any) =>
                e.id === edge.id ||
                (e.from === edge.from && e.to === edge.to && e.type === edge.type && e.fromCluster === edge.fromCluster && e.toCluster === edge.toCluster)
            );

            if (duplicate) {
                console.log(`[SYNAPSE] Logically identical edge already exists (ID: ${duplicate.id}), skipping push.`);
                // If the new edge has more info (e.g. coordinates or metadata), we could merge, but for now just skip to prevent "10-20 times delete" issue
            } else {
                // [v0.2.18.1.1] Force is_approved: false for manual edges to show "?" badge
                edge.is_approved = false;
                projectState.edges.push(edge);
                console.log(`[SYNAPSE] Pushed new manual edge (is_approved: false) to projectState. Current count: ${projectState.edges.length}`);
            }

            // [v0.2.18] Move from Buffer to Reserved Cluster on Connection
            if (fromNode && (fromNode.cluster_id === 'sys_cluster_buffer' || fromNode.data?.cluster_id === 'sys_cluster_buffer')) {
                fromNode.cluster_id = 'sys_cluster_reserved';
                if (fromNode.data) fromNode.data.cluster_id = 'sys_cluster_reserved';
                fromNode.position = { x: -1500 + Math.random() * 200, y: 1000 + Math.random() * 200 };
            }
            if (toNode && (toNode.cluster_id === 'sys_cluster_buffer' || toNode.data?.cluster_id === 'sys_cluster_buffer')) {
                toNode.cluster_id = 'sys_cluster_reserved';
                if (toNode.data) toNode.data.cluster_id = 'sys_cluster_reserved';
                toNode.position = { x: -1500 + Math.random() * 200, y: 1000 + Math.random() * 200 };
            }

            // [v0.2.17-patch4] Proactive commented import injection (Logic Edit Mode)
            const isEditLogicMode = vscode.workspace.getConfiguration('synapse').get('editLogicMode', false);
            if (isEditLogicMode && edge._fromFile && edge._toFile) {
                const refactorer = new EdgeCodeRefactorer();
                const result = refactorer.applyEdgeToSource(edge._fromFile, edge._toFile, workspaceFolder.uri.fsPath, { commented: true });
                if (result.success) {
                    Logger.info(`[CanvasPanel] Manual edge created with PENDING import: ${result.message}`);
                }
            }

            // 저장 (정규화 적용)
            const normalizedJson = this.normalizeProjectState(projectState);
            await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf8'));
            console.log('[SYNAPSE] Manual edge persisted successfully.');

            // [v0.2.18] Explicit Edge Direction Notification
            let notificationMsg = `Edge created: ${edge.type} (Pending Confirmation)`;
            if (edge._fromFile && edge._toFile) {
                const bFrom = edge._fromFile.split(/[\\/]/).pop();
                const bTo = edge._toFile.split(/[\\/]/).pop();
                notificationMsg = `Edge ${bFrom} ➔ ${bTo} connected: Injecting pending import.`;
            }
            vscode.window.setStatusBarMessage(notificationMsg, 5000);

            // 캔버스 새로고침
            await this.sendProjectState();
        } catch (error) {
            console.error('[SYNAPSE] Failed to create manual edge:', error);
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
            
            // [v0.2.18.1.1] Pass toNodeId for precise tagging
            const toNodeId = edge?.to;
            const result = refactorer.removeEdgeFromSource(actualFromFile, actualToFile, projectRoot, toNodeId);

            if (!result.success) {
                Logger.warn(`[SYNAPSE] Source removal unsuccessful: ${result.message} (File: ${actualFromFile})`);
                // Even if source removal fails, we might want to continue deleting logically if the user insists
                // But for now, let's keep the existing hotfix behavior
                vscode.window.showWarningMessage(`[SYNAPSE] 소스 내 import 검색 실패 (캔버스 연결만 끊습니다): ${result.message}`);
            }

            // Remove from project_state and UI regardless of source file success
            await this.handleDeleteEdge(edgeId);

            this._panel.webview.postMessage({ command: 'edgeDeletedSource', edgeId, success: true });

            if (result.success) {
                vscode.window.showInformationMessage(`[SYNAPSE] ✅ 소스 코드 주석처리 완료: ${result.importLine}`);
            }
        } catch (e) {
            vscode.window.showErrorMessage(`[SYNAPSE] 엣지 삭제 중 오류 발생: ${e}`);
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
            console.log('[SYNAPSE] Edge deleted from state:', deletedEdge);

            // 2. 소스 코드 동기화 (Hibernate 로직)
            const fromNode = projectState.nodes.find((n: any) => n.id === deletedEdge.from);
            const toNode = projectState.nodes.find((n: any) => n.id === deletedEdge.to);

            if (fromNode && toNode) {
                const refactorer = new EdgeCodeRefactorer();
                const result = refactorer.removeEdgeFromSource(fromNode.data.file, toNode.data.file, workspaceFolder.uri.fsPath, toNode.id);
                console.log(`[SYNAPSE] Source refactor result:`, result.message);
                if (result.success) {
                    vscode.window.setStatusBarMessage(`Edge hibernated in source: ${path.basename(fromNode.data.file)}`, 3000);
                }
            }

            vscode.window.setStatusBarMessage(`Edge deleted`, 3000);

            // [v0.2.26 Bugfix] Auto-snapshot on edge deletion to seal the state
            // handleTakeSnapshot internally calls sendProjectState, so we don't need duplicate call
            await this.handleTakeSnapshot({ label: `Auto Backup (After Edge Deletion)` });

            // await this.sendProjectState(); // REMOVED to prevent double refresh
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
            const deletedNodeLabels: string[] = [];

            let deletedCount = 0;
            const filesToDelete: string[] = [];

            // 1. Remove Nodes & collect files to delete
            projectState.nodes = projectState.nodes.filter((n: any) => {
                if (nodeIdSet.has(n.id)) {
                    deletedCount++;
                    if (n.data && n.data.label) {
                        // Extract label name without icons (📄 Label -> Label)
                        const cleanLabel = n.data.label.replace(/^[📄📁]\s*/, '');
                        deletedNodeLabels.push(cleanLabel);
                    }
                    if (n.data && n.data.file) {
                        filesToDelete.push(n.data.file);
                    }
                    return false;
                }
                return true;
            });

            // [v0.2.26 Bugfix] Handle dynamic Ghost Nodes deletion
            // Ghost nodes are not in projectState.nodes, so we must manually trap them.
            for (const id of targetIds) {
                if (id.startsWith('ghost_')) {
                    const cleanLabel = id.replace('ghost_', '');
                    if (!deletedNodeLabels.includes(cleanLabel)) {
                        deletedNodeLabels.push(cleanLabel);
                        deletedCount++;
                    }
                }
            }

            // [v0.2.17] Cascading Cleanup: Ask if user wants to prune imports to deleted nodes
            if (deletedNodeLabels.length > 0) {
                const pruneChoice = await vscode.window.showInformationMessage(
                    `[SYNAPSE] 삭제된 노드(${deletedNodeLabels.length}개)를 참조하는 다른 파일의 import 문도 정리하시겠습니까?`,
                    '🧹 소스 코드 정리 (Cascading Prune)', '아니오'
                );

                if (pruneChoice === '🧹 소스 코드 정리 (Cascading Prune)') {
                    const refactorer = new EdgeCodeRefactorer();
                    let affectedTotal = 0;
                    for (const label of deletedNodeLabels) {
                        const { affectedFiles } = refactorer.pruneReferencesToNode(label, workspaceFolder.uri.fsPath);
                        affectedTotal += affectedFiles.length;
                    }
                    if (affectedTotal > 0) {
                        vscode.window.showInformationMessage(`[SYNAPSE] 총 ${affectedTotal}개의 파일에서 유령 임포트를 정리했습니다.`);
                    }
                }
            }

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

            // [v0.2.26 Bugfix] Auto-snapshot on node deletion to seal the state
            await this.handleTakeSnapshot({ label: `Auto Backup (After Node Deletion: ${deletedCount} items)` });

            await this.sendProjectState();
        } catch (error) {
            Logger.error('Failed to delete nodes:', error);
            vscode.window.showErrorMessage(`Failed to delete nodes: ${error}`);
        }
    }

    private async handleRequestConfirmEdge(edgeId: string, fromFile: string | null, toFile: string | null) {
        if (this._isProcessingConfirm) return;
        this._isProcessingConfirm = true;

        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            // 1. project_state.json 로드
            const stateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            const stateData = await vscode.workspace.fs.readFile(stateUri);
            const projectState = JSON.parse(Buffer.from(stateData).toString('utf-8'));
            const edge = (projectState.edges || []).find((e: any) => e.id === edgeId);

            // [v0.2.17 Patch 13.2] SSOT: Focus on Node IDs, derived names should match IDs
            const fNode = (projectState.nodes || []).find((n: any) => n.id === edge?.from);
            const tNode = (projectState.nodes || []).find((n: any) => n.id === edge?.to);

            let actualFromFile = fromFile;
            let actualToFile = toFile;

            // [v0.2.17 Patch 13.3] SSoT Enforcement
            // ALWAYS override with Backend data if available, ignoring webview labels
            if (fNode?.data?.file) {
                if (fromFile && fromFile !== fNode.data.file) {
                    Logger.warn(`[CanvasPanel] Source name mismatch overridden: Param '${fromFile}' vs Node '${fNode.data.file}'. Using Node data.`);
                }
                actualFromFile = fNode.data.file;
            } else if (!actualFromFile) {
                actualFromFile = fNode?.data?.path || fNode?.data?.label || edge?._fromFile;
            }

            if (tNode?.data?.file) {
                if (toFile && toFile !== tNode.data.file) {
                    Logger.warn(`[CanvasPanel] Target name mismatch overridden: Param '${toFile}' vs Node '${tNode.data.file}'. Using Node data.`);
                }
                actualToFile = tNode.data.file;
            } else if (!actualToFile) {
                actualToFile = tNode?.data?.path || tNode?.data?.label || edge?._toFile;
            }

            // Cleanup Manual Labels
            actualFromFile = actualFromFile?.replace(/^[📄📁]\s*/, '').trim() ?? null;
            actualToFile = actualToFile?.replace(/^[📄📁]\s*/, '').trim() ?? null;

            // [v0.2.23] Extension Guard: 확정 시점에 확장자 체크하여 가상 노드 연결 차단
            if (actualFromFile) {
                const ext = path.extname(actualFromFile).toLowerCase();
                const supportedExts = ['.ts', '.js', '.tsx', '.jsx', '.py', '.c', '.h', '.cpp', '.hpp', '.rs'];

                if (!supportedExts.includes(ext) || ext === '') {
                    vscode.window.showWarningMessage(`[SYNAPSE] ⚠️ ${actualFromFile}: 연결할 수 없는 노드 타입입니다. (확장자가 없는 파일은 소스 연결 지원 불가)`);

                    // 강제 종료 및 임시 엣지 파기
                    if (edge) {
                        projectState.edges = projectState.edges.filter((e: any) => e.id !== edgeId);
                        await vscode.workspace.fs.writeFile(stateUri, Buffer.from(this.normalizeProjectState(projectState), 'utf8'));
                        // UI에서도 삭제
                        this._panel.webview.postMessage({ command: 'deleteEdgeUI', edgeId: edgeId });
                    }
                    return; // 프로세스 중단
                }
            }

            const choice = await vscode.window.showInformationMessage(
                `[SYNAPSE] 이 엣지를 확정하시겠습니까?\n${actualFromFile || '?'} → ${actualToFile || '?'}\n\n확정 시 ${actualFromFile || '상위 모듈'} 최상단에 import 문이 삽입됩니다.`,
                { modal: true }, '✅ 확정', '❌ 취소'
            );
            if (choice !== '✅ 확정') return;

            // status 업데이트 및 저장
            if (edge) edge.status = 'confirmed';

            // [v0.2.22 Fix] Promote Reserved nodes to Buffer Cluster
            const promoteToBuffer = (nodeId: string) => {
                const node = (projectState.nodes || []).find((n: any) => n.id === nodeId);
                if (node && (node.cluster_id === 'sys_cluster_reserved' || node.data?.cluster_id === 'sys_cluster_reserved')) {
                    node.cluster_id = 'sys_cluster_buffer';
                    if (!node.data) node.data = {};
                    node.data.cluster_id = 'sys_cluster_buffer';
                    node.data.priority_cluster = 'sys_cluster_buffer'; // [v0.2.17 Patch 7] Lock this cluster
                    Logger.info(`[CanvasPanel] Promoted node ${node.id} to Buffer Cluster with priority lock.`);
                }
            };
            if (edge) {
                promoteToBuffer(edge.from);
                promoteToBuffer(edge.to);
            }

            await vscode.workspace.fs.writeFile(stateUri, Buffer.from(this.normalizeProjectState(projectState), 'utf8'));

            // 2. fromFile 최상단에 import 문 삽입
            if (actualFromFile && actualToFile) {
                // [v0.2.20 Fix] Proactive extension check
                const ext = path.extname(actualFromFile).toLowerCase();
                const supportedExts = ['.ts', '.js', '.tsx', '.jsx', '.py', '.c', '.h', '.cpp', '.hpp', '.rs'];

                if (!supportedExts.includes(ext)) {
                    vscode.window.showErrorMessage(`[SYNAPSE] ⚠️ ${actualFromFile}: 확장자가 없는 파일(가상 노드)은 코드 주입을 지원하지 않습니다. (.py, .ts, .js 파일만 가능)`);
                    return;
                }

                const refactorer = new EdgeCodeRefactorer();
                const toNodeId = edge?.to;
                const result = refactorer.applyEdgeToSource(actualFromFile, actualToFile, workspaceFolder.uri.fsPath, {
                    commented: false,
                    toNodeId: toNodeId
                });

                if (result.success) {
                    if (result.skipped) {
                        Logger.info(`[CanvasPanel] Import already exists for ${actualToFile} in ${actualFromFile}`);
                    } else {
                        vscode.window.showInformationMessage(`[SYNAPSE] ✅ ${result.message}`);
                    }
                } else {
                    vscode.window.showWarningMessage(`[SYNAPSE] ⚠️ ${result.message}`);
                }
            } else {
                vscode.window.showWarningMessage('[SYNAPSE] 파일 경로를 찾을 수 없어 코드 주입을 건너뜁니까.');
            }

            this._panel.webview.postMessage({ command: 'edgeConfirmed', edgeId });
            Logger.info(`[CanvasPanel] Edge ${edgeId} confirmed.`);
        } catch (e) {
            vscode.window.showErrorMessage(`[SYNAPSE] 확정 실패: ${e}`);
        } finally {
            this._isProcessingConfirm = false;
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
        } else if (fileName.endsWith('.rs')) {
            return `// ${fileName}\n// Created by SYNAPSE\n\npub fn main() {\n    println!("Hello from ${fileName}");\n}\n`;
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
                        // [v0.2.21 Fix] Preserve intentional ungrouping
                        if (uiNode._ungrouped === true) {
                            if (backendNode.data) backendNode.data.cluster_id = null;
                            backendNode.cluster_id = null;
                            // Optionally keep a flag so future state builds know not to autogroup
                            backendNode._ungrouped = true;
                        }
                    } else {
                        // [v0.2.18 Policy] Stop resurrecting nodes from UI state!
                        // New nodes MUST be added via the 'createManualNode' command only.
                        // This prevents race conditions where a deleted node is re-added by a concurrent save message.
                        Logger.info(`[CanvasPanel] handleSaveState: Skipping unknown UI node ${uiNode.id} to prevent Ghost Node resurrection.`);
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

            // [v0.2.20 Fix] Merge Edges from UI (Important for manual edge persistence)
            if (newState.edges && Array.isArray(newState.edges)) {
                if (!currentState.edges) currentState.edges = [];
                for (const uiEdge of newState.edges) {
                    const backendEdge = currentState.edges.find((e: any) => e.id === uiEdge.id);
                    if (backendEdge) {
                        // Update existing edge properties if needed (e.g. status)
                        if (uiEdge.status) backendEdge.status = uiEdge.status;
                        if (uiEdge.type) backendEdge.type = uiEdge.type;
                    } else {
                        // [v0.2.18.2 Validation] Ensure both nodes exist before adding a new UI edge
                        const fromExists = currentState.nodes.some((n: any) => n.id === uiEdge.from);
                        const toExists = currentState.nodes.some((n: any) => n.id === uiEdge.to);

                        if (fromExists && toExists) {
                            currentState.edges.push(uiEdge);
                            Logger.info(`[CanvasPanel] handleSaveState: Appended valid new UI edge ${uiEdge.id}`);
                        } else {
                            Logger.warn(`[CanvasPanel] handleSaveState: DROPPING Ghost Edge ${uiEdge.id} (From: ${uiEdge.from} [${fromExists}], To: ${uiEdge.to} [${toExists}])`);
                        }
                    }
                }

                // Also handle edge deletions if UI sent fewer edges? (Optional - maybe too dangerous)
            }

            // 3. 파일 저장 (정규화 적용)
            const normalizedJson = this.normalizeProjectState(currentState);
            await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf8'));

            // [v0.2.26] Auto-Snapshot on every state change
            await this.handleTakeSnapshot({ label: `Auto Backup (Auto-Save)`, data: currentState });
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

            // 2. 각 노드에 대해 실제 파일 분석 수행 (Parallelized with Concurrency Limit for v0.2.18.1)
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

                            // If file was previously marked missing, clear it
                            if (node.status === 'missing') node.status = 'proposed';
                            if (node.isError) delete node.isError;
                        } catch (e: any) {
                            console.error(`[SYNAPSE] Error scanning ${relativePath}:`, e.message);
                            // [v0.2.26 Bugfix] Clear summary if file scanning fails (e.g., file deleted externally)
                            // This prevents stale references from resurrecting edges and ghost nodes.
                            node.data.summary = { references: [], exports: [], error: true };
                            node.status = 'missing';
                            node.isError = true;
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
            const nodeMap = new Map<string, string>(); // 파일명/경로 -> 노드 ID
            const ambiguousNames = new Set<string>(); // [v0.2.17 Patch 12] Track name-only collisions

            projectState.nodes.forEach((n: any) => {
                const fullPath = n.data.path || n.data.file || '';
                const fileName = path.basename(fullPath);
                const fileNameNoExt = path.parse(fileName).name;

                // Priority 1: Full Path (Always Safe)
                nodeMap.set(fullPath, n.id);

                // Priority 2: Filename with extension (Safe if unique)
                if (nodeMap.has(fileName) && nodeMap.get(fileName) !== n.id) {
                    // Collision even with extension? (Extremely rare but possible in different folders)
                    nodeMap.delete(fileName);
                } else {
                    nodeMap.set(fileName, n.id);
                }

                // Priority 3: Name-only (Prone to collisions like TEST.py vs TEST.c)
                if (fileNameNoExt && fileNameNoExt.length > 0) {
                    if (nodeMap.has(fileNameNoExt) && nodeMap.get(fileNameNoExt) !== n.id) {
                        Logger.info(`[CanvasPanel] nodeMap: Ambiguity detected for name '${fileNameNoExt}'. Disabling auto-resolve for this name.`);
                        nodeMap.delete(fileNameNoExt);
                        ambiguousNames.add(fileNameNoExt);
                    } else if (!ambiguousNames.has(fileNameNoExt)) {
                        nodeMap.set(fileNameNoExt, n.id);
                    }
                }

                // Add sub-parts for better matching (e.g. "Namespace::Class" -> "Class")
                if (n.data.label && n.data.label.includes('::')) {
                    const parts = n.data.label.split('::');
                    const leaf = parts[parts.length - 1];
                    if (!ambiguousNames.has(leaf)) nodeMap.set(leaf, n.id);
                }

                // [v0.2.21 Fix] Handle manual nodes
                if (n.data.label) {
                    const cleanLabel = n.data.label.replace(/^[📄📁]\s*/, '').trim();
                    const labelNoExt = path.parse(cleanLabel).name;

                    // Priority 4: Clean Label (extension-aware)
                    if (nodeMap.has(cleanLabel) && nodeMap.get(cleanLabel) !== n.id) {
                        const existingId = nodeMap.get(cleanLabel);
                        const existingNode = projectState.nodes.find((nn: any) => nn.id === existingId);

                        // Collision resolution: Real file > Manual Label
                        if (existingNode && existingNode.id.startsWith('node_manual_') && !n.id.startsWith('node_manual_')) {
                            nodeMap.set(cleanLabel, n.id);
                        } else if (existingNode && !existingNode.id.startsWith('node_manual_') && n.id.startsWith('node_manual_')) {
                            // Keep file-based node
                        } else {
                            nodeMap.delete(cleanLabel);
                            ambiguousNames.add(cleanLabel);
                        }
                    } else if (!ambiguousNames.has(cleanLabel)) {
                        nodeMap.set(cleanLabel, n.id);
                    }

                    // Priority 5: Label No Extension (Collision prone)
                    if (labelNoExt && labelNoExt.length > 0) {
                        if (nodeMap.has(labelNoExt) && nodeMap.get(labelNoExt) !== n.id) {
                            nodeMap.delete(labelNoExt);
                            ambiguousNames.add(labelNoExt);
                        } else if (!ambiguousNames.has(labelNoExt)) {
                            nodeMap.set(labelNoExt, n.id);
                        }
                    }
                }
            });

            // [v0.2.17 Fix] Also map clusters (folders) by label so "import folder" maps to the cluster
            if (projectState.clusters) {
                projectState.clusters.forEach((c: any) => {
                    nodeMap.set(c.id, c.id);
                    nodeMap.set(c.label, c.id);
                    // Standardize: "📄 inputs" / "📁 inputs" -> "inputs"
                    const cleanLabel = c.label.replace(/^[📄📁]\s*/, '').trim();
                    nodeMap.set(cleanLabel, c.id);
                });
            }
            console.log(`[SYNAPSE] Node/Cluster map built with ${nodeMap.size} keys.`);

            // 4. 웹뷰용 상태 객체 초기 생성 (v0.2.17 Fix: Initialize before use in loops)
            const stateForWebview = {
                ...projectState,
                nodes: [...(projectState.nodes || [])],
                edges: [...(projectState.edges || [])]
            };

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
            const discoveredEdges: any[] = [];
            const IGNORE_GHOST_TARGETS = new Set([
                'os', 'sys', 'sqlite3', 'math', 'pandas', 'numpy', 'rich', 'datetime', 'json', 'time', 're',
                'unittest', 'path', 'fs', 'vscode', 'react', 'pathlib', 'dateutil', 'relativedelta', 'abc', 'typing'
            ]);

            let ghostCount = 0;
            projectState.nodes.forEach((sourceNode: any) => {
                const summary = sourceNode.data?.summary;
                if (summary && summary.references) {
                    for (const ref of summary.references) {
                        const targetName = typeof ref === 'string' ? ref : ref.target;
                        const edgeType = typeof ref === 'string' ? 'dependency' : ref.type;
                        const refNodeId = (ref as any).nodeId; // [v0.2.17 Patch 13]

                        const cleanRef = targetName.replace(/^\.\//, '').replace(/^\.\.\//, '');
                        // [v0.2.17 Patch 13] Priority 0: ID-based match (Guarantees precision)
                        let targetNodeId = refNodeId;
                        let resolutionMethod = 'ID_TAG';

                        // [v0.2.17 Patch 13.2] Verify ID existence before using it
                        if (targetNodeId && !projectState.nodes.some((n: any) => n.id === targetNodeId)) {
                            Logger.warn(`[CanvasPanel] Stale Node ID found in comment: ${targetNodeId}. Falling back to name-based resolution.`);
                            targetNodeId = undefined;
                        }

                        // Priority 1: EXACT match (with extension)
                        if (!targetNodeId) {
                            targetNodeId = nodeMap.get(targetName) || nodeMap.get(cleanRef);
                            resolutionMethod = 'EXACT_NAME';
                        }

                        // Fallback to name-only match ONLY if an exact match was not found
                        if (!targetNodeId) {
                            const baseName = path.parse(cleanRef).name;
                            targetNodeId = nodeMap.get(baseName);
                            resolutionMethod = 'BASE_NAME';

                            // [v0.2.17 Patch 12] Context-Aware Fallback: 
                            // If name-only fails (due to ambiguity guard), try source-compatible extensions.
                            if (!targetNodeId && baseName) {
                                const sourceExt = path.extname(sourceNode.data?.file || '').toLowerCase();
                                if (sourceExt === '.py') {
                                    targetNodeId = nodeMap.get(`${baseName}.py`);
                                } else if (['.ts', '.js'].includes(sourceExt)) {
                                    targetNodeId = nodeMap.get(`${baseName}.ts`) || nodeMap.get(`${baseName}.js`);
                                }
                                if (targetNodeId) resolutionMethod = 'CONTEXT_FALLBACK';
                            }
                        }

                        // [v0.2.17 Fix] Folder-module resolution fallback (e.g. "import inputs" -> "inputs" cluster/folder)
                        if (!targetNodeId) {
                            // First check if targetName is a known cluster in our map
                            targetNodeId = nodeMap.get(targetName) || nodeMap.get(`${targetName}/`);
                            if (targetNodeId) resolutionMethod = 'CLUSTER_FOLDER';
                        }

                        // Second, if it's a python import of a folder, it might refer to __init__.py inside it
                        if (!targetNodeId && sourceNode.data?.file?.endsWith('.py')) {
                            const initNodeId = nodeMap.get(path.join(targetName, '__init__.py'));
                            if (initNodeId) {
                                targetNodeId = initNodeId;
                                resolutionMethod = 'PYTHON_INIT';
                            }
                        }

                        if (targetNodeId) {
                            Logger.info(`[CanvasPanel] Edge Resolved: ${sourceNode.data?.file || sourceNode.id} -> ${targetName} (${targetNodeId}) via ${resolutionMethod}`);
                        } else {
                            Logger.warn(`[CanvasPanel] Edge Failed to Resolve: ${sourceNode.data?.file || sourceNode.id} -> ${targetName} (Ambiguous or Missing)`);
                        }

                        // [v0.2.18] Smart Ghost Node Fallback
                        if (!targetNodeId && targetName.length > 1 && !IGNORE_GHOST_TARGETS.has(targetName.toLowerCase())) {
                            const ghostId = `ghost_${targetName}`;
                            // Check if we already created this ghost node for the current webview update
                            if (!stateForWebview.nodes.some((n: any) => n.id === ghostId)) {
                                ghostCount++;
                                Logger.info(`[CanvasPanel] Creating Ghost Node for missing import: ${targetName}`);

                                // Offset positioning (spiral-ish) to prevent overlap
                                const angle = ghostCount * 0.5;
                                const distance = 150 + (ghostCount * 10);
                                const offsetX = Math.cos(angle) * distance;
                                const offsetY = Math.sin(angle) * distance;

                                stateForWebview.nodes.push({
                                    id: ghostId,
                                    type: 'external',
                                    data: {
                                        label: `📄 ${targetName}`,
                                        description: 'Ghost Node: Import found in code, but physical file is missing.',
                                        file: targetName,
                                        isGhost: true,
                                        cluster_id: 'cluster_ghosts', // [v0.2.17] Add to ghost cluster
                                        dtr: 0 // Auto-confirmed
                                    },
                                    position: {
                                        x: (sourceNode.position?.x || 0) + offsetX,
                                        y: (sourceNode.position?.y || 0) - offsetY
                                    },
                                    visual: { opacity: 0.5 }
                                });
                                // [v0.2.17] Update cluster children
                                const ghostCluster = stateForWebview.clusters?.find((c: any) => c.id === 'cluster_ghosts');
                                if (ghostCluster) {
                                    if (!ghostCluster.children) ghostCluster.children = [];
                                    ghostCluster.children.push(ghostId);
                                }
                            }
                            targetNodeId = ghostId;
                        }

                        if (targetNodeId && targetNodeId !== sourceNode.id) {
                            const edgeKey = `${sourceNode.id}->${targetNodeId}`;
                            if (!existingEdgeKeys.has(edgeKey)) {
                                // [v0.2.17 Patch 6] Cross-Language Edge Styling (External Bridge)
                                const sourceExt = path.extname(sourceNode.data?.file || '').toLowerCase();
                                const targetNode = stateForWebview.nodes.find((n: any) => n.id === targetNodeId);
                                const targetExt = path.extname(targetNode?.data?.file || '').toLowerCase();

                                const isCrossLanguage = sourceExt !== '' && targetExt !== '' && sourceExt !== targetExt;

                                const newEdge = {
                                    id: `edge_auto_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
                                    from: sourceNode.id,
                                    to: targetNodeId,
                                    type: edgeType,
                                    is_approved: (ref as any).isApproved !== false, // [v0.2.18.1.1] Sync with scanner results
                                    label: edgeType === 'dependency' ? 'ref' : edgeType,
                                    data: {
                                        dtr: 0 // [v0.2.18] Auto-confirmed (Removes "?" badge)
                                    },
                                    visual: {
                                        opacity: targetNodeId.startsWith('ghost_') ? 0 : 0.8,
                                        style: targetNodeId.startsWith('ghost_') || isCrossLanguage ? 'dashed' : 'solid',
                                        color: isCrossLanguage ? '#d3869b' : '#888' // Purple-ish for cross-lang bridges
                                    }
                                };
                                discoveredEdges.push(newEdge);
                                stateForWebview.edges.push(newEdge); // Add to current state directly
                                existingEdgeKeys.add(edgeKey);
                            }
                        }
                    }
                }
            });
            console.timeEnd('[SYNAPSE] Edge Discovery Time');

            console.log(`[SYNAPSE] Edge discovery complete. Found ${discoveredEdges.length} auto-edges.`);

            // 5. Context Vault 클러스터 주입 (read-only, volatile — 저장하지 않음)
            const contextVaultCluster = await this.buildContextVaultCluster(workspaceFolder.uri.fsPath);
            if (contextVaultCluster.nodes.length > 0) {
                // 기존 context vault 노드/클러스터 제거 후 새로 주입
                stateForWebview.nodes = stateForWebview.nodes.filter(
                    (n: any) => !n.id.startsWith('ctx_vault_node_')
                );
                stateForWebview.clusters = (stateForWebview.clusters || []).filter(
                    (c: any) => c.id !== 'ctx_vault_cluster'
                );

                stateForWebview.nodes.push(...contextVaultCluster.nodes);
                stateForWebview.clusters = [...(stateForWebview.clusters || []), contextVaultCluster.cluster];
            }

            // [v0.2.17 Patch 3] Resilient Documentation Discovery
            // Check if doc_shelf already exists and has children. If not, perform emergency scan.
            let docShelf = stateForWebview.clusters?.find((c: any) => c.id === 'doc_shelf');
            if (!docShelf || !docShelf.children || docShelf.children.length === 0) {
                Logger.info('[CanvasPanel] Documentation Shelf empty or missing. Performing specific scan for core documents...');
                const coreFiles = ['GEMINI.md', 'RULES.md', 'architecture_report.md', 'README.md', 'INTERFACE.md'];
                const discoveredDocIds: string[] = [];

                coreFiles.forEach((fileName, idx) => {
                    const fullPath = path.join(workspaceFolder.uri.fsPath, fileName);
                    if (fs.existsSync(fullPath)) {
                        const nodeId = `node_${fileName.replace(/\./g, '_')}`;
                        discoveredDocIds.push(nodeId);

                        if (!stateForWebview.nodes.some((n: any) => n.id === nodeId)) {
                            stateForWebview.nodes.push({
                                id: nodeId,
                                type: 'documentation',
                                status: 'proposed',
                                // Position relative to where source nodes usually are
                                position: { x: (idx % 4) * 200, y: 1200 + Math.floor(idx / 4) * 150 },
                                data: {
                                    label: fileName,
                                    file: fileName,
                                    description: `${fileName} (Resilient Discovery)`,
                                    cluster_id: 'doc_shelf',
                                    color: '#fabd2f'
                                },
                                visual: { opacity: 0.5, dashArray: '5,5' }
                            });
                        }
                    }
                });

                // Ensure doc_shelf exists and has these children
                if (!docShelf) {
                    docShelf = {
                        id: 'doc_shelf',
                        label: '📚 Documentation Shelf',
                        collapsed: true, // Only collapse on creation
                        bounds: { x: -100, y: 1150, width: 1000, height: 600 },
                        children: discoveredDocIds
                    };
                    stateForWebview.clusters.push(docShelf);
                } else {
                    docShelf.children = [...new Set([...(docShelf.children || []), ...discoveredDocIds])];
                    docShelf.bounds = { x: -100, y: 1150, width: 1000, height: 600 };
                }
            }

            // [v0.2.17] UI Polish: Ensure special clusters exist
            if (!stateForWebview.clusters) stateForWebview.clusters = [];

            // 1. Ensure cluster_ghosts exists
            if (!stateForWebview.clusters.some((c: any) => c.id === 'cluster_ghosts')) {
                stateForWebview.clusters.push({
                    id: 'cluster_ghosts',
                    label: '👻 External Ghosts',
                    collapsed: true,
                    bounds: { x: 0, y: -800, width: 600, height: 400 },
                    children: stateForWebview.nodes.filter((n: any) => n.id.startsWith('ghost_')).map((n: any) => n.id)
                });
            } else {
                const ghostCluster = stateForWebview.clusters.find((c: any) => c.id === 'cluster_ghosts');
                ghostCluster.children = stateForWebview.nodes.filter((n: any) => n.id.startsWith('ghost_') || n.data?.cluster_id === 'cluster_ghosts').map((n: any) => n.id);
            }

            // [v0.2.17 Patch 5] 2. Ensure cluster_external exists (for non-primary language nodes like .c)
            if (!stateForWebview.clusters.some((c: any) => c.id === 'cluster_external')) {
                stateForWebview.clusters.push({
                    id: 'cluster_external',
                    label: '⚙️ External Modules',
                    collapsed: false,
                    bounds: { x: 1200, y: 0, width: 600, height: 400 },
                    children: []
                });
            }

            // Categorize external nodes (.c, .cpp, etc. in a presumed python/ts project)
            const externalCluster = stateForWebview.clusters.find((c: any) => c.id === 'cluster_external');
            const externalNodeIds = stateForWebview.nodes.filter((n: any) => {
                // [v0.2.17 Patch 7] Hierarchical Clustering: Respect priority_cluster
                if (n.data?.priority_cluster) return false;

                const file = n.data?.file || '';
                const ext = path.extname(file).toLowerCase();
                // [v0.2.17-patch5] Categorize .c, .h, etc. as external if the project is primarily something else
                // For now, let's explicitly include .c and .h as external candidates
                return ['.c', '.h', '.cpp', '.hpp', '.rs'].includes(ext) || n.data?.cluster_id === 'cluster_external';
            }).map((n: any) => n.id);

            if (externalCluster) {
                externalCluster.children = [...new Set([...(externalCluster.children || []), ...externalNodeIds])];
                // Update node data to reflect cluster membership if not already set
                stateForWebview.nodes.forEach((n: any) => {
                    if (externalNodeIds.includes(n.id) && !n.data.cluster_id) {
                        n.data.cluster_id = 'cluster_external';
                    }
                });
            }

            // Schema Migration & Cleanup
            // NOTE: We don't force collapse here anymore to preserve user interaction state
            stateForWebview.clusters = stateForWebview.clusters.map((c: any) => {
                // Ensure 'children' array exists for all clusters
                if (!c.children) {
                    c.children = [];
                }
                // Ensure 'bounds' object exists for all clusters
                if (!c.bounds) {
                    c.bounds = { x: 0, y: 0, width: 100, height: 100 }; // Default bounds
                }
                // Ensure 'collapsed' property exists
                if (c.collapsed === undefined) {
                    c.collapsed = false; // Default to not collapsed
                }
                return c;
            });

            // [v0.2.17 Patch] Schema Migration & Data Hygiene
            // 1. Map old 'style' to 'visual' for edges + Cross-Language Styling
            stateForWebview.edges = stateForWebview.edges.map((edge: any) => {
                // Resolve nodes to check extensions
                const fromNode = stateForWebview.nodes.find((n: any) => n.id === edge.from);
                const toNode = stateForWebview.nodes.find((n: any) => n.id === edge.to);

                if (fromNode && toNode) {
                    const fromExt = path.extname(fromNode.data?.file || '').toLowerCase();
                    const toExt = path.extname(toNode.data?.file || '').toLowerCase();
                    const isCrossLanguage = fromExt !== '' && toExt !== '' && fromExt !== toExt;

                    if (isCrossLanguage) {
                        if (!edge.visual) edge.visual = {};
                        edge.visual.color = '#d3869b'; // Purple-ish
                        edge.visual.style = 'dashed';
                    }
                }

                if (edge.style && !edge.visual) {
                    edge.visual = {
                        thickness: edge.style.thickness || 1,
                        color: edge.style.color || '#888',
                        style: edge.style.style || 'solid',
                        opacity: (edge.style.opacity !== undefined) ? edge.style.opacity :
                            (edge.visual?.opacity !== undefined ? edge.visual.opacity : 1)
                    };
                }
                return edge;
            });

            // 2. Ensure all nodes have basic visual properties
            stateForWebview.nodes = stateForWebview.nodes.map((node: any) => {
                if (!node.visual) {
                    node.visual = {
                        opacity: node.status === 'proposed' ? 0.5 : 1,
                        glow_intensity: 0
                    };
                }
                return node;
            });

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
