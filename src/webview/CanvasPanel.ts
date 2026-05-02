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
import { Node, Edge, ProjectState, EdgeType, NodeType } from '../types/schema';
import { FileScanner } from '../core/FileScanner';
import { LogicAnalyzer } from '../core/LogicAnalyzer';
import { EdgeCodeRefactorer } from '../core/EdgeCodeRefactorer';
import { GeminiParser } from '../core/GeminiParser';
import { FlowchartGenerator } from '../core/FlowchartGenerator';
import { BootstrapEngine } from '../bootstrap/BootstrapEngine';
import { client } from '../client';
import { Logger } from '../utils/Logger';
import { VirtualDebugger } from '../core/VirtualDebugger';

// [v0.3.1 Bootstrap Locked] Core Systems
import { phaseManager, Phase } from '../core/PhaseManager';
import { gridSystem } from '../core/GridSystem';
import { rendererCore } from '../core/RendererCore';
import { controlSystem } from '../core/ControlSystem';
import { debuggerSystem } from '../core/DebuggerSystem';
import { graphModel } from '../core/GraphModel';
import { snapshotSystem } from '../core/SnapshotSystem';
import { canvasEngine } from '../core/canvas-engine/CanvasEngine';
import { RenderProtocol } from '../core/canvas-engine/RenderProtocol';

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
    private readonly _context: vscode.ExtensionContext;
    private _workspaceFolder: vscode.WorkspaceFolder;
    private _rollbackGuardUntil: number = 0; // [v0.3.11] 롤백 직후 getProjectState 차단 타임스탬프
    private _disposables: vscode.Disposable[] = [];
    private proposedNodes: any[] = [];
    private proposedEdges: any[] = [];
    private _contextRequestCallback: ((data: any) => void) | undefined;
    private _isProcessingConfirm: boolean = false; // [v0.2.17 Patch 13.2] Prevent duplicate dialogs
    private _taskQueue = new SequentialTaskQueue();


    public static createOrShow(context: vscode.ExtensionContext, workspaceFolder: vscode.WorkspaceFolder) {
        const extensionUri = context.extensionUri;
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (CanvasPanel.currentPanel) {
            if (CanvasPanel.currentPanel._workspaceFolder.uri.fsPath !== workspaceFolder.uri.fsPath) {
                console.log(`[SYNAPSE] Switching canvas context to: ${workspaceFolder.name}`);
                CanvasPanel.currentPanel._workspaceFolder = workspaceFolder;
                CanvasPanel.currentPanel._taskQueue.push(() => CanvasPanel.currentPanel!.refreshState());
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

        CanvasPanel.currentPanel = new CanvasPanel(panel, context, workspaceFolder);
    }

    public static revive(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, workspaceFolder: vscode.WorkspaceFolder) {
        CanvasPanel.currentPanel = new CanvasPanel(panel, context, workspaceFolder);
    }

    private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, workspaceFolder: vscode.WorkspaceFolder) {
        this._panel = panel;
        this._extensionUri = context.extensionUri;
        this._context = context;
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

        // [v0.3.09_fix] Rendering Isolation - send clearCanvas when Phase changes
        phaseManager.onPhaseAdvance = (phase: Phase) => {
            if (this._panel && this._panel.webview) {
                this._panel.webview.postMessage({ command: 'clearCanvas', phase });
            }
        };

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async message => {
                const stateModifyingCommands = [
                    'saveState', 'ungroup', 'takeSnapshot', 'rollback',
                    'createManualEdge', 'deleteEdge', 'deleteNodes',
                    'updateEdge', 'approveNode', 'rejectNode',
                    'requestDeleteEdgeSource', 'createManualNode',
                    'reBootstrap', 'requestConfirmEdge', 'setBaseline',
                    'resetProjectState', 'virtualDebug', 'updateNodeData'
                ];

                if (stateModifyingCommands.includes(message.command)) {
                    // [v0.3.1 Bootstrap Locked] Phase 3: CONTROL Interaction Check
                    // [v0.3.09_fix] Allow interaction in RENDER (Phase 5) and DEBUG (Phase 6) as well.
                    const currentPhase = phaseManager.getCurrentPhase();
                    if (!controlSystem.verifyInteraction(message.command) && currentPhase < Phase.RENDER) {
                        vscode.window.showErrorMessage(`[SYNAPSE] 명령 거부: Phase ${currentPhase} 상태에서는 '${message.command}'이(가) 금지됩니다.`);
                        return;
                    }

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
                // [v0.3.11] 롤백 직후 2초간 재요청 차단 (롤백 데이터 덮어쓰기 방지)
                if (this._rollbackGuardUntil && Date.now() < this._rollbackGuardUntil) {
                    Logger.info('[CanvasPanel] getProjectState blocked by rollback guard.');
                    return;
                }
                await this.sendProjectState();
                return;
            case 'saveState':
                await this.handleSaveState(message.data || message.state);
                return;
            case 'readFile':
                await this.handleReadFile(message.filePath);
                return;
            case 'group':
                await this.handleGroupNodes(message.nodeIds, message.label);
                return;
            case 'ungroup':
                await this.handleUngroupNodes(message.nodeIds);
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
                // [v0.2.20 Fix] Support both 'message' and 'text' for warning consistency
                vscode.window.showWarningMessage(`[SYNAPSE] ${message.message || message.text || 'Unknown warning'}`);
                return;
            case 'validateEdge':
                await this.handleValidateEdge(message.edgeId, message.fromNode, message.toNode, message.type);
                return;
            case 'validateEdgesBatch': // [v0.2.24] IPC & I/O Optimization
                await this.handleValidateEdgesBatch(message.batch);
                return;
            case 'analyzeGemini':
                await this.handleAnalyzeGemini(message.filePath);
                return;
            case 'createManualNode':
                try {
                    const workspaceFolder = this._workspaceFolder;
                    if (!workspaceFolder) return;
                    
                    // [Phase 2: Intent Validation] - Direct hit on nested label structure
                    const nodeFromMessage = message.node || message.data || message.payload || {};
                    const nodeData = nodeFromMessage.data || {};
                    const nodeLabel = nodeData.label || nodeFromMessage.label || message.label || (message.data && message.data.label);
                    
                    const nodeId = nodeFromMessage.id || message.nodeId || `node_manual_${Date.now()}`;
                    
                    if (!nodeLabel) {
                        Logger.error(`[v0.3.10-LOCK] ERR: Label missing in intent. Raw: ${JSON.stringify(message)}`);
                        return;
                    }
                    Logger.info(`[v0.3.10-LOCK] Validated Intent for Label: ${nodeLabel} (ID: ${nodeId})`);

                    let fileName = nodeLabel;
                    if (!fileName.includes('.')) fileName = `${nodeLabel}.py`;

                    const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, fileName);
                    const filePath = fileUri.fsPath;

                    // [Phase 6: Reality-First Write]
                    try {
                        const content = Buffer.from('# [SYNAPSE] Atomic Logic Entry\n', 'utf8');
                        await vscode.workspace.fs.writeFile(fileUri, content);
                        
                        // [v0.3.10-LOCK] Reality Verification
                        await vscode.workspace.fs.stat(fileUri);
                        
                        // [Phase 10: Host Pressure] Force VS Code to recognize the new reality
                        await vscode.commands.executeCommand('workbench.action.files.saveAll');
                        
                        Logger.info(`[v0.3.10-LOCK] ID: ${nodeLabel}, Path: ${filePath}, Status: ACTIVE`);
                    } catch (fsErr) {
                        vscode.window.showErrorMessage(`[v0.3.10-LOCK] 물리 파일 생성 거부: ${fsErr}`);
                        return;
                    }

                    // [Phase 3: Spatial Lock]
                    const forcePosX = 100; 
                    const forcePosY = 200; 
                    
                    // [v0.3.10-LOCK] Partial Confirmation Only: DO NOT RE-SEND FULL STATE
                    this._panel.webview.postMessage({
                        command: 'updateNode',
                        data: { 
                            id: nodeId,
                            updates: {
                                label: nodeLabel,
                                name: nodeLabel, // [v0.3.11] 호환성 필드 추가
                                text: nodeLabel, // [v0.3.11] 호환성 필드 추가
                                file: filePath, 
                                status: 'solid', 
                                cluster_id: 'sys_cluster_buffer',
                                layer: 'user', 
                                x: forcePosX,
                                y: forcePosY,
                                data: {
                                    label: nodeLabel,
                                    name: nodeLabel,
                                    file: filePath, 
                                    status: 'solid',
                                    cluster_id: 'sys_cluster_buffer',
                                    priority_cluster: 'sys_cluster_buffer',
                                    layer: 'user'
                                }
                            }
                        }
                    });

                    Logger.info(`[v0.3.10-LOCK] Confirmation dispatched for ID: ${nodeId} at (${forcePosX}, ${forcePosY})`);
                } catch (e) {
                    Logger.error(`[v0.3.10-LOCK] CRITICAL_FAIL: ${e}`);
                }
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
            case 'openModularSpecs':
                await this.handleOpenModularSpecs();
                return;
            case 'testLogic':
                await this.handleTestLogic();
                break;
            case 'virtualDebug':
                await this.handleVirtualDebug();
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
            case 'updateNodeData':
                await this.handleUpdateNodeData(message.node);
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

            // 1. [v0.3.11] Sync Physical File if requested (Fast Check)
            if (node.createPhysicalFile && node.data?.label) {
                const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, node.data.label);
                try {
                    await vscode.workspace.fs.stat(fileUri);
                    node.data.file = vscode.workspace.asRelativePath(fileUri);
                } catch {
                    // Create empty file (Background-ish)
                    await vscode.workspace.fs.writeFile(fileUri, Buffer.from('', 'utf8'));
                    Logger.info(`[CanvasPanel] Physical file auto-created: ${node.data.label}`);
                    node.data.file = vscode.workspace.asRelativePath(fileUri);
                }
                delete node.createPhysicalFile;
            }

            // 2. Dispatch to Engine
            const rawFile = node.data?.file || '';
            const normalizedFilePath = (rawFile && !rawFile.startsWith('http') && !rawFile.startsWith('external'))
                ? vscode.workspace.asRelativePath(rawFile, false)
                : rawFile;

            const nodeId = node.id || `node_manual_${Date.now()}`;
            const result = canvasEngine.dispatch('ADD_NODE', {
                id: nodeId,
                label: node.data?.label || nodeId,
                type: node.type || 'file',
                layer: 'user',
                filePath: normalizedFilePath,
                cluster_id: 'sys_cluster_buffer',
                status: 'pending',
                data: {
                    ...node.data,
                    label: node.data?.label || nodeId,
                    layer: 'user',
                    filePath: normalizedFilePath,
                    file: normalizedFilePath,
                    cluster_id: 'sys_cluster_buffer'
                }
            });

            if (!result.ok) {
                const reasons = result.verdict.reasons?.join(', ') || 'Unknown logic violation';
                vscode.window.showErrorMessage(`[SYNAPSE] Node creation blocked: ${reasons}`);
                return;
            }

            // 🔥 [IMMEDIATE REACTION] 노드가 엔진에 추가되었으므로 즉시 화면 갱신
            await this.sendProjectState(false, true);

            // 3. Persistence & SSoT (v0.3.11: Atomic Save)
            const finalState = canvasEngine.getFinalSnapshot();
            
            // Ensure the new node is definitely in the persistence block
            if (!finalState.nodes[nodeId]) {
                const rawEngineSnap = canvasEngine.getRawSnapshot();
                finalState.nodes[nodeId] = rawEngineSnap.nodes[nodeId];
            }

            // [v0.3.11] Use the hardened saveState pipeline for consistent normalization
            await this.handleSaveState(finalState);

            Logger.info(`[CanvasPanel] Manual node persisted and synced: ${nodeId}`);
            vscode.window.showInformationMessage(`Node created: ${node.data?.label || node.id}`);

        } catch (error) {
            console.error('Failed to create manual node:', error);
            vscode.window.showErrorMessage(`Failed to create manual node: ${error}`);
        }
    }

    private async handleUpdateNodeData(node: any) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            
            // Dispatch update intent (currently using ADD_NODE logic for update if exists)
            // [TODO: v0.3.11] Introduce UPDATE_NODE_DATA intent specifically
            const result = canvasEngine.dispatch('ADD_NODE', node);
            
            if (result.ok) {
                const finalState = canvasEngine.getFinalSnapshot();
                const normalizedJson = this.normalizeProjectState(finalState);
                await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf8'));
                console.log(`[SYNAPSE] Node ${node.id} data updated via pipeline.`);
                
                // 🔥 [v0.3.11] IMMEDIATE REACTION
                await this.sendProjectState(false, true);
            }
        } catch (error) {
            console.error('[SYNAPSE] Failed to update node data:', error);
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

    public toggleSearch() {
        this._panel.webview.postMessage({ command: 'toggleSearch' });
    }

    public fitView() {
        this._panel.webview.postMessage({ command: 'fitView' });
    }

    public async refreshState() {
        await this._taskQueue.push(() => this.sendProjectState());
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

    private async handleOpenModularSpecs() {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            const mdFiles = await vscode.workspace.findFiles('**/*.md', '**/node_modules/**');
            
            const specFiles = mdFiles.filter(uri => {
                const name = uri.path.split('/').pop() || '';
                const lowerName = name.toLowerCase();
                return !lowerName.startsWith('gemini') && 
                       lowerName !== 'architecture.md' && 
                       lowerName !== 'readme.md' && 
                       lowerName !== 'readme.ko.md';
            });

            if (specFiles.length === 0) {
                vscode.window.showInformationMessage('[SYNAPSE] No modular spec files (.md) found.');
                return;
            }

            const items = specFiles.map(uri => ({
                label: `$(markdown) ${uri.path.split('/').pop()}`,
                description: vscode.workspace.asRelativePath(uri),
                uri: uri
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a Modular Spec to open (e.g., core_synapse.md)'
            });

            if (selected) {
                const doc = await vscode.workspace.openTextDocument(selected.uri);
                await vscode.window.showTextDocument(doc);
            }
        } catch (error) {
            Logger.error('Failed to open modular specs quick pick', error);
            vscode.window.showErrorMessage('Failed to load Modular Specs list.');
        }
    }

    private async openFile(filePath: string, createIfNotExists: boolean = false) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        // [v0.3.10-LOCK] Robust Path Handling: Absolute paths from webview can have leading slashes on Linux
        let fileUri: vscode.Uri;
        const normalizedPath = filePath.trim();
        
        if (normalizedPath.startsWith('/') || (normalizedPath.length > 1 && normalizedPath[1] === ':')) {
            fileUri = vscode.Uri.file(normalizedPath);
        } else {
            // Normalize path to prevent double slash errors for relative paths
            let targetPath = normalizedPath.replace(/^[\\\/]/, '').trim();
            fileUri = vscode.Uri.joinPath(workspaceFolder.uri, targetPath);
        }

        Logger.info(`[v0.3.10-LOCK] Attempting to open file: ${fileUri.fsPath}`);
        try {
            let stat;
            try {
                stat = await vscode.workspace.fs.stat(fileUri);
            } catch (err: any) {
                if (createIfNotExists) {
                    Logger.info(`[CanvasPanel] Creating missing file: ${filePath}`);
                    await vscode.workspace.fs.writeFile(fileUri, Buffer.from('', 'utf8'));
                    stat = await vscode.workspace.fs.stat(fileUri);
                    vscode.window.showInformationMessage(`[SYNAPSE] File created: ${filePath}`);
                } else {
                    throw err;
                }
            }

            if ((stat.type & vscode.FileType.Directory) !== 0) {
                // If it's a directory, reveal in explorer instead of opening as text document
                await vscode.commands.executeCommand('revealInExplorer', fileUri);
                return;
            }

            // [v0.2.36] Warn for extensionless files that may fail to open
            const ext = path.extname(filePath);
            if (!ext) {
                vscode.window.showWarningMessage(`[SYNAPSE] '${path.basename(filePath)}' 파일은 확장자가 없습니다. 가상 노드이거나 열 수 없는 파일일 수 있습니다.`);
            }

            Logger.info(`[CanvasPanel] Opening file: ${fileUri.fsPath}`);
            const doc = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            if (createIfNotExists) {
                 try {
                    await vscode.workspace.fs.writeFile(fileUri, Buffer.from('', 'utf8'));
                    const doc = await vscode.workspace.openTextDocument(fileUri);
                    await vscode.window.showTextDocument(doc);
                    return;
                 } catch (e) {
                    Logger.error(`Failed to create file: ${filePath}`, e);
                 }
            }
            Logger.error(`Failed to open/create file: ${filePath}`, error);
            vscode.window.showErrorMessage(`[SYNAPSE] 파일 열기 실패: ${filePath} (${error instanceof Error ? error.message : 'Unknown error'})`);
        }
    }

    private async handleReadFile(filePath: string) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        const fileUri = path.isAbsolute(filePath) 
            ? vscode.Uri.file(filePath)
            : vscode.Uri.joinPath(workspaceFolder.uri, filePath);
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

            vscode.window.showInformationMessage(`[SYNAPSE] Logic analysis complete. 'LOGIC_REPORT.md' generated.`);
        } catch (error) {
            console.error('[SYNAPSE] Logic Analysis failed:', error);
            vscode.window.showErrorMessage(`Logic Analysis failed: ${error}`);
        }
    }
    
    /**
     * [v0.2.20] Virtual Debugging: Static Analysis visualization
     */
    private async handleVirtualDebug() {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            // 1. Get current project state
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            const data = await vscode.workspace.fs.readFile(projectStateUri);
            const state = JSON.parse(data.toString());

            // 2. Perform Virtual Debug scan
            const vDebugger = new VirtualDebugger();
            const impact = await vDebugger.performVirtualDebug(state, workspaceFolder.uri.fsPath);

            // 3. Send results to WebView
            this._panel.webview.postMessage({
                command: 'virtualDebugImpact',
                impact: impact
            });

            // Optional: Log results for traceability
            Logger.info(`[SYNAPSE] Virtual Debug Impact sent: ${impact.necrosisNodeIds.length} nodes influenced.`);
            
            // Show a summary message
            if (impact.reports.length > 0) {
                const errorCount = impact.reports.filter(r => r.severity === vscode.DiagnosticSeverity.Error).length;
                vscode.window.showWarningMessage(`[SYNAPSE] Virtual Debugging found ${errorCount} Errors and ${impact.reports.length - errorCount} Warnings.`);
            } else {
                vscode.window.showInformationMessage(`[SYNAPSE] Virtual Debugging complete: No physical errors found.`);
            }

        } catch (error) {
            Logger.error('[SYNAPSE] Virtual Debug failed:', error);
            vscode.window.showErrorMessage(`Virtual Debugging failed: ${error}`);
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
        // [v0.3.10] Handle Engine State (Record-based) to UI/File State (Array-based) translation
        let processingState = state;
        if (state && state.nodes && !Array.isArray(state.nodes)) {
            processingState = {
                ...state,
                nodes: Object.values(state.nodes),
                edges: Object.values(state.edges),
                clusters: state.clusters || []
            };
        }

        // [v0.3.10] Final Data Hygiene: ensure data.label exists for LogicAnalyzer
        if (processingState && processingState.nodes) {
            processingState.nodes = processingState.nodes.map((n: any) => ({
                ...n,
                data: n.data || { label: n.label || n.id, file: n.filePath }
            }));
        }

        // [v0.2.18.1] Pre-save Validation
        if (!this.validateProjectState(processingState)) {
            Logger.warn('[SYNAPSE:v0.2.18.1] State normalization halted due to validation failure.');
        }

        const stateToSave = processingState;
        const decycle = (obj: any, stack = new Set()): any => {
            if (!obj || typeof obj !== 'object') return obj;
            if (stack.has(obj)) return '[Circular]';
            stack.add(obj);

            let res: any = Array.isArray(obj) ? [] : {};
            for (const key in obj) {
                // [v0.2.23] Allow _ungrouped for persistent manual state
                // [v0.3.10] Protect _fromFile/_toFile for edge confirmation context
                const allowedLegacyKeys = ['_ungrouped', '_fromFile', '_toFile'];
                if (key.startsWith('_') && !allowedLegacyKeys.includes(key)) continue;
                res[key] = decycle(obj[key], stack);
            }
            stack.delete(obj);
            return res;
        };

        const safeState = decycle(stateToSave);

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

        // 5. [v0.3.10] Aggressive Edge Deduplication
        if (sortedState && sortedState.edges && Array.isArray(sortedState.edges)) {
            const seen = new Set<string>();
            sortedState.edges = sortedState.edges.filter((e: any) => {
                // Ignore type and cluster metadata for primary identity to collapse duplicates
                const key = `${e.from}|${e.to}`;
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

            // [v0.3.10 Patch] Proactive extension check
            const filesToCheck = [edge._fromFile, edge._toFile];
            for (const file of filesToCheck) {
                if (file) {
                    const ext = path.extname(file).toLowerCase();
                    const supportedExts = ['.ts', '.js', '.tsx', '.jsx', '.py', '.c', '.h', '.cpp', '.hpp', '.rs', '.csv', '.md', '.json', '.yml', '.yaml', '.txt', '.csv'];
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
                
                // [v0.3.10] 🛡️ SYNC MEMORY ENGINE: Dispatch intent to update in-memory snapshot
                const addEdgeResult = canvasEngine.dispatch('CONNECT_EDGE', {
                    id: edge.id,
                    from: edge.from,
                    to: edge.to,
                    type: edge.type,
                    status: edge.status || 'pending_confirm',
                    ...edge
                });

                if (!addEdgeResult.ok) {
                    Logger.warn(`[CanvasPanel] ADD_EDGE intent blocked: ${addEdgeResult.verdict.reasons?.join(', ')}`);
                    // Even if blocked by rules, we still push to projectState for manual persistence
                }

                // [v0.3.10 Fix] Move from Buffer to Reserved Cluster via ENGINE dispatch (SSOT)
                const promoteToReserved = (nodeId: string) => {
                    const snap = canvasEngine.getFinalSnapshot();
                    const nodeObj = snap.nodes[nodeId];
                    if (nodeObj && (nodeObj.cluster_id === 'sys_cluster_buffer' || nodeObj.data?.cluster_id === 'sys_cluster_buffer')) {
                        // [v0.3.10 Fix] Update BOTH memory engine and local projectState object
                        // Memory Engine update (for UI sync)
                        canvasEngine.dispatch('UPDATE_NODE', {
                            id: nodeId,
                            updates: {
                                cluster_id: 'sys_cluster_reserved',
                                data: {
                                    ...(nodeObj.data || {}),
                                    cluster_id: 'sys_cluster_reserved',
                                    priority_cluster: 'sys_cluster_reserved'
                                }
                            }
                        });

                        // Local state update (for File Persistence)
                        const nodeInState = projectState.nodes.find((n: any) => n.id === nodeId);
                        if (nodeInState) {
                            nodeInState.cluster_id = 'sys_cluster_reserved';
                            if (!nodeInState.data) nodeInState.data = {};
                            nodeInState.data.cluster_id = 'sys_cluster_reserved';
                            nodeInState.data.priority_cluster = 'sys_cluster_reserved';
                        }
                        
                        Logger.info(`[CanvasPanel] Promoted node ${nodeId} to Reserved (Engine & File sync).`);
                    }
                };

                if (edge.from) promoteToReserved(edge.from);
                if (edge.to) promoteToReserved(edge.to);

                // [v0.3.10 Fix] Immediately sync webview engine to prevent stale 'saveState' from reverting cluster status
                this._panel.webview.postMessage({
                    command: 'updateNode',
                    data: {
                        id: edge.from,
                        updates: { cluster_id: 'sys_cluster_reserved' }
                    }
                });
                this._panel.webview.postMessage({
                    command: 'updateNode',
                    data: {
                        id: edge.to,
                        updates: { cluster_id: 'sys_cluster_reserved' }
                    }
                });

                projectState.edges.push(edge);
                console.log(`[SYNAPSE] Pushed new manual edge and dispatched intent. Current count: ${projectState.edges.length}`);
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
            await this.sendProjectState(false, true);
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
            
            // 1. Dispatch DELETE_EDGE Intent
            const parts = edgeId.split('->');
            if (parts.length !== 2) {
                console.error('[SYNAPSE] Invalid edgeId format for deletion:', edgeId);
                return;
            }

            const from = parts[0];
            const to = parts[1];

            const result = canvasEngine.dispatch('DELETE_EDGE', { from, to });
            if (!result.ok) {
                vscode.window.showErrorMessage(`[SYNAPSE] Edge deletion blocked: ${result.verdict.reasons?.join(', ')}`);
                return;
            }

            // 2. Persistence
            const finalState = canvasEngine.getFinalSnapshot();
            const normalizedJson = this.normalizeProjectState(finalState);
            await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf8'));

            // 3. 소스 코드 동기화 (Hibernate 로직)
            const refactorer = new EdgeCodeRefactorer();
            const nodesArr = Object.values(finalState.nodes);
            const fromNode = nodesArr.find((n: any) => n.id === from);
            const toNode = nodesArr.find((n: any) => n.id === to);
            
            if (fromNode?.filePath && toNode?.filePath) {
                const refactorResult = refactorer.removeEdgeFromSource(fromNode.filePath, toNode.filePath, workspaceFolder.uri.fsPath, toNode.id);
                console.log(`[SYNAPSE] Source refactor result:`, refactorResult.message);
            }

            vscode.window.setStatusBarMessage(`Edge deleted via pipeline`, 3000);
            await this.handleTakeSnapshot({ label: `Auto Backup (After Edge Deletion)` });
            await this.sendProjectState(false, true);

        } catch (error) {
            console.error('Failed to delete edge:', error);
            vscode.window.showErrorMessage(`Failed to delete edge: ${error}`);
        }
    }

    private async handleDeleteNode(nodeId: string) {
        await this.handleDeleteNodes([nodeId]);
    }

    private async handleGroupNodes(nodeIds: string[], label: string) {
        if (!nodeIds || nodeIds.length === 0) return;
        const result = canvasEngine.dispatch('GROUP', { nodeIds, label });
        if (result.ok) {
            console.log(`[SYNAPSE] nodes grouped into: ${label}`);
            await this.sendProjectState();
        }
    }

    private async handleUngroupNodes(nodeIds: string[]) {
        if (!nodeIds || nodeIds.length === 0) return;
        const result = canvasEngine.dispatch('UNGROUP', { nodeIds });
        if (result.ok) {
            console.log(`[SYNAPSE] nodes ungrouped: ${nodeIds.length} items`);
            await this.sendProjectState();
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

            // 1. Dispatch DELETE_NODE Intents & collect files to delete
            let deletedCount = 0;
            const deletedNodeLabels: string[] = [];
            const filesToDelete: string[] = [];

            const currentStateSnap = canvasEngine.getFinalSnapshot();
            const currentNodesArr = Object.values(currentStateSnap.nodes);
            
            for (const id of targetIds) {
                // [v0.3.11] 🛡️ Multi-Identity Lookup: Find node by ID or Path to ensure we get the filePath
                const node = currentNodesArr.find((n: any) => n.id === id || n.filePath === id);
                
                if (node) {
                    if (node.label) {
                        const cleanLabel = node.label.replace(/^[📄📁]\s*/, '');
                        deletedNodeLabels.push(cleanLabel);
                    }
                    if (node.filePath) {
                        filesToDelete.push(node.filePath);
                    }
                }
                
                // Dispatch Intent
                const result = canvasEngine.dispatch('DELETE_NODE', { id });
                if (result.ok) deletedCount++;
            }

            // 🔥 [IMMEDIATE REACTION] 노드 삭제를 엔진에 반영한 직후 즉시 화면 갱신
            await this.sendProjectState(false, true);

            // 2. Persistence
            const finalState = canvasEngine.getFinalSnapshot();
            const finalNormalizedJson = JSON.stringify(finalState, null, 2);
            await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(finalNormalizedJson, 'utf8'));

            // 3. Cascading Cleanup & Physical Deletion (Keep existing UI logic)
            if (deletedNodeLabels.length > 0) {
                const pruneChoice = await vscode.window.showInformationMessage(
                    `[SYNAPSE] 삭제된 노드(${deletedNodeLabels.length}개)에 대한 물리적 파일과 참조(Import)를 모두 정리하시겠습니까?`,
                    '🧹 완전 정리 (File + References)', '아니오'
                );

                if (pruneChoice === '🧹 완전 정리 (File + References)') {
                    // Part A: Prune References
                    const refactorer = new EdgeCodeRefactorer();
                    let affectedTotal = 0;
                    for (const label of deletedNodeLabels) {
                        const { affectedFiles } = refactorer.pruneReferencesToNode(label, workspaceFolder.uri.fsPath);
                        affectedTotal += affectedFiles.length;
                    }

                    // Part B: Physical Deletion (Atomic Transaction)
                    if (filesToDelete.length > 0) {
                        for (const relPath of filesToDelete) {
                            try {
                                const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, relPath);
                                // Move to trash instead of permanent delete for safety
                                await vscode.workspace.fs.delete(fileUri, { useTrash: true });
                                Logger.info(`[CanvasPanel] Physically deleted file: ${relPath}`);
                            } catch (e) {
                                Logger.error(`[CanvasPanel] Failed to delete file: ${relPath}`, e);
                            }
                        }
                    }

                    if (affectedTotal > 0 || filesToDelete.length > 0) {
                        vscode.window.showInformationMessage(`[SYNAPSE] ${filesToDelete.length}개의 파일을 삭제하고 ${affectedTotal}개의 참조를 정리했습니다.`);
                    }
                }
            }

            // 4. Update UI & Feedback
            console.log(`[SYNAPSE] ${deletedCount} nodes deleted via pipeline.`);
            vscode.window.setStatusBarMessage(`${deletedCount} nodes deleted`, 3000);

            // [v0.2.26 Bugfix] Auto-snapshot on node deletion to seal the state
            await this.handleTakeSnapshot({ label: `Auto Backup (After Node Deletion: ${deletedCount} items)` });
        } catch (error) {
            console.error('Failed to delete nodes:', error);
            vscode.window.showErrorMessage(`Failed to delete nodes: ${error}`);
        }
    }

    private async handleRequestConfirmEdge(edgeId: string, fromFile: string | null, toFile: string | null) {
        if (this._isProcessingConfirm) return;
        this._isProcessingConfirm = true;

        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            // [v0.3.10] SSOT Strategy: Use Engine snapshot directly
            const engineState = canvasEngine.getFinalSnapshot();
            const stateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            
            // Convert Records to Arrays for search logic consistency with legacy code
            const allEdges = Object.values(engineState.edges || {});
            const allNodes = Object.values(engineState.nodes || {});

            // 1. First Attempt: Exact ID lookup
            let edge: any = allEdges.find((e: any) => e.id === edgeId);
            
            // 2. Second Attempt (v0.3.11): Deep Fuzzy Matching (Labels & IDs)
            if (!edge && (fromFile || toFile)) {
                Logger.warn(`[CanvasPanel] ID Mismatch for Edge: ${edgeId}. Performing deep identity search...`);
                const normFrom = fromFile?.trim().toLowerCase();
                const normTo = toFile?.trim().toLowerCase();
                
                edge = allEdges.find((e: any) => {
                    const eFromNode: any = allNodes.find((n: any) => n.id === e.from);
                    const eToNode: any = allNodes.find((n: any) => n.id === e.to);
                    
                    // Match by IDs OR Labels OR FilePaths
                    const matchFrom = (e.from?.toLowerCase() === normFrom) || 
                                     (eFromNode?.label?.toLowerCase() === normFrom) ||
                                     (eFromNode?.data?.label?.toLowerCase() === normFrom) ||
                                     (eFromNode?.filePath?.toLowerCase() === normFrom) ||
                                     (eFromNode?.data?.file?.toLowerCase() === normFrom);
                                     
                    const matchTo = (e.to?.toLowerCase() === normTo) || 
                                   (eToNode?.label?.toLowerCase() === normTo) ||
                                   (eToNode?.data?.label?.toLowerCase() === normTo) ||
                                   (eToNode?.filePath?.toLowerCase() === normTo) ||
                                   (eToNode?.data?.file?.toLowerCase() === normTo);
                                   
                    return matchFrom && matchTo;
                });
            }

            if (!edge) {
                Logger.error(`[CanvasPanel] requestConfirmEdge FAILED: Edge ${edgeId} (from: ${fromFile}, to: ${toFile}) not found.`);
                vscode.window.showErrorMessage(`[SYNAPSE] 확정 실패: 엣지 데이터를 찾을 수 없습니다. (ID: ${edgeId})`);
                this._isProcessingConfirm = false; 
                return;
            }

            // [v0.2.17 Patch 13.2] SSOT: Focus on Node IDs
            const fNode: any = allNodes.find((n: any) => n.id === edge?.from);
            const tNode: any = allNodes.find((n: any) => n.id === edge?.to);

            let actualFromFile = fromFile;
            let actualToFile = toFile;

            // [v0.2.17 Patch 13.3] SSoT Enforcement
            // ALWAYS override with Backend data if available, ignoring webview labels
            if (fNode?.data?.file) {
                if (fromFile && fromFile !== fNode.data.file) {
                    Logger.warn(`[CanvasPanel] Source name mismatch overridden: Param '${fromFile}' vs Node '${fNode.data.file}'. Using Node data.`);
                }
                actualFromFile = fNode.data.file;
            } else if (!actualFromFile || actualFromFile.startsWith('node_manual_') || actualFromFile.startsWith('sys_')) {
                actualFromFile = fNode?.data?.path || fNode?.data?.label || edge?._fromFile;
            }

            if (tNode?.data?.file) {
                if (toFile && toFile !== tNode.data.file) {
                    Logger.warn(`[CanvasPanel] Target name mismatch overridden: Param '${toFile}' vs Node '${tNode.data.file}'. Using Node data.`);
                }
                actualToFile = tNode.data.file;
            } else if (!actualToFile || actualToFile.startsWith('node_manual_') || actualToFile.startsWith('sys_')) {
                actualToFile = tNode?.data?.path || tNode?.data?.label || edge?._toFile;
            }

            // Cleanup Manual Labels
            actualFromFile = actualFromFile?.replace(/^[📄📁]\s*/, '').trim() ?? null;
            actualToFile = actualToFile?.replace(/^[📄📁]\s*/, '').trim() ?? null;

            // [v0.2.23] Extension Guard: 확정 시점에 확장자 체크하여 가상 노드 연결 차단
            if (actualFromFile) {
                const ext = path.extname(actualFromFile).toLowerCase();
                const supportedExts = ['.ts', '.js', '.tsx', '.jsx', '.py', '.c', '.h', '.cpp', '.hpp', '.rs'];

                // [v0.3.10] Ignore ext check for manual proxy files if they don't have classical source extensions
                if (actualFromFile.includes('.') && (!supportedExts.includes(ext) || ext === '')) {
                    vscode.window.showWarningMessage(`[SYNAPSE] ⚠️ ${actualFromFile}: 연결할 수 없는 노드 타입입니다. (확장자가 없는 파일은 소스 연결 지원 불가)`);

                    // 강제 종료 및 임시 엣지 파기
                    if (edge) {
                        // Create a NEW snapshot for deletion to avoid mutating direct engine state
                        const finalSnap = canvasEngine.getFinalSnapshot();
                        const updatedEdges = Object.values(finalSnap.edges || {}).filter((e: any) => e.id !== edgeId);
                        // [CRITICAL FIX] Must convert nodes Record to Array for UI-style saving!
                        const newState = { 
                            ...finalSnap, 
                            nodes: Object.values(finalSnap.nodes || {}),
                            edges: updatedEdges 
                        };
                        
                        await vscode.workspace.fs.writeFile(stateUri, Buffer.from(this.normalizeProjectState(newState), 'utf8'));
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

            // 1. Update Edge Status via Engine
            canvasEngine.dispatch('UPDATE_EDGE', { 
                from: edge.from, 
                to: edge.to, 
                updates: { status: 'confirmed' } 
            });

            // 3. Persistence (Normalized for UI compatibility)
            const finalSnap = canvasEngine.getFinalSnapshot();
            const projectStateArr = {
                ...finalSnap,
                nodes: Object.values(finalSnap.nodes || {}),
                edges: Object.values(finalSnap.edges || {}),
                clusters: finalSnap.clusters || []
            };
            await vscode.workspace.fs.writeFile(stateUri, Buffer.from(this.normalizeProjectState(projectStateArr), 'utf8'));

            // [v0.3.10] 🛡️ UI TRIGGER: Inform Webview to remove the "?" badge immediately
            this._panel.webview.postMessage({ 
                command: 'edgeConfirmed', 
                edgeId: edgeId,
                from: edge.from,
                to: edge.to 
            });

            // 2. fromFile 최상단에 import 문 삽입
            if (actualFromFile && actualToFile) {
                const ext = path.extname(actualFromFile).toLowerCase();
                const supportedExts = ['.ts', '.js', '.tsx', '.jsx', '.py', '.c', '.h', '.cpp', '.hpp', '.rs'];

                if (!supportedExts.includes(ext)) {
                    vscode.window.showErrorMessage(`[SYNAPSE] ⚠️ ${actualFromFile}: 확장자가 없는 파일(가상 노드)은 코드 주입을 지원하지 않습니다. (.py, .ts, .js 파일만 가능)`);
                    return;
                }

                // [v0.3.11] 🛡️ Pre-emptive File Creation: Ensure files exist before refactoring
                const absFrom = path.isAbsolute(actualFromFile) ? actualFromFile : path.join(workspaceFolder.uri.fsPath, actualFromFile);
                const absTo = path.isAbsolute(actualToFile) ? actualToFile : path.join(workspaceFolder.uri.fsPath, actualToFile);

                if (!fs.existsSync(absFrom)) {
                    Logger.info(`[CanvasPanel] Creating missing source file: ${absFrom}`);
                    fs.writeFileSync(absFrom, `# SYNAPSE Generated Header for ${path.basename(absFrom)}\n`, 'utf8');
                }
                if (!fs.existsSync(absTo)) {
                    Logger.info(`[CanvasPanel] Creating missing target file: ${absTo}`);
                    fs.writeFileSync(absTo, `# SYNAPSE Generated Header for ${path.basename(absTo)}\n`, 'utf8');
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
            
            // 🔥 [v0.3.11] FORCE SYNC: Ensure the UI has the latest 'confirmed' status
            // Authoritative: true to bypass interaction lock
            await this.sendProjectState(false, true);
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
                // 1. Bootstrap
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
                    // 2. Reload Engine
                    canvasEngine.loadInitialState({
                        nodes: result.initial_nodes,
                        edges: result.initial_edges,
                        clusters: []
                    });
                    
                    const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
                    const newState = {
                        project_name: path.basename(workspaceFolder.uri.fsPath),
                        nodes: result.initial_nodes,
                        edges: result.initial_edges,
                        clusters: []
                    };
                    const normalizedJson = this.normalizeProjectState(newState);
                    await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf8'));

                    vscode.window.showInformationMessage('Project maps re-generated successfully.');
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
            
            // 1. Dispatch UPDATE_EDGE Intent
            const parts = edgeId.split('->');
            if (parts.length !== 2) {
                console.error('[SYNAPSE] Invalid edgeId format for update:', edgeId);
                return;
            }

            const result = canvasEngine.dispatch('UPDATE_EDGE', { 
                from: parts[0], 
                to: parts[1], 
                updates 
            });

            if (!result.ok) {
                vscode.window.showErrorMessage(`[SYNAPSE] Edge update blocked: ${result.verdict.reasons?.join(', ')}`);
                return;
            }

            // 2. Persistence
            const finalState = canvasEngine.getFinalSnapshot();
            const normalizedJson = this.normalizeProjectState(finalState);
            await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf8'));
            
            console.log('[SYNAPSE] Edge updated via pipeline:', edgeId);
            vscode.window.showInformationMessage(`Edge updated`);

            // 3. UI Update
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

        try {
            // 1. Find node (from engine or proposal)
            const snap = canvasEngine.getFinalSnapshot();
            let node = snap.nodes[nodeId];
            
            if (!node) {
                const pIndex = this.proposedNodes.findIndex(n => n.id === nodeId);
                if (pIndex !== -1) {
                    const pn = this.proposedNodes[pIndex];
                    // Dispatch ADD_NODE
                    canvasEngine.dispatch('ADD_NODE', {
                        id: pn.id,
                        filePath: pn.data.file,
                        type: pn.type,
                        label: pn.data.label,
                        status: 'active',
                        layer: 'user',
                        data: {
                            ...pn.data,
                            layer: 'user'
                        }
                    });
                    this.proposedNodes.splice(pIndex, 1);
                } else {
                    console.warn(`[SYNAPSE] Node ${nodeId} not found for approval.`);
                    return;
                }
            } else {
                // Already in engine, just update status
                canvasEngine.dispatch('UPDATE_NODE', {
                    id: nodeId,
                    updates: { status: 'active', visual: { opacity: 1.0, dashArray: undefined } }
                });
            }

            // 2. Persistence
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            const finalState = canvasEngine.getFinalSnapshot();
            await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(this.normalizeProjectState(finalState), 'utf8'));

            console.log('[SYNAPSE] Node approved via pipeline:', nodeId);
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
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            // 1. Remove from engine if exists
            canvasEngine.dispatch('DELETE_NODE', { id: nodeId });

            // 2. Remove from proposals if exists
            const pIndex = this.proposedNodes.findIndex(n => n.id === nodeId);
            if (pIndex !== -1) {
                this.proposedNodes.splice(pIndex, 1);
                this.proposedEdges = this.proposedEdges.filter(e => e.from !== nodeId && e.to !== nodeId);
            }

            // 3. Persistence
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            const finalState = canvasEngine.getFinalSnapshot();
            await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(this.normalizeProjectState(finalState), 'utf8'));

            console.log('[SYNAPSE] Node rejected via pipeline:', nodeId);
            await this.sendProjectState();
        } catch (error) {
            console.error('Failed to reject node:', error);
        }
    }

    /**
     * [v0.2.24] Batched Edge Validation
     * Optimized to read project_state once for multiple edges, preventing I/O flood.
     */
    private async handleValidateEdgesBatch(batch: any[]) {
        try {
            if (!this._workspaceFolder || !batch || batch.length === 0) return;
            Logger.info(`[CanvasPanel] Batch validating ${batch.length} edges...`);

            // 1. Read project state ONLY ONCE
            const projectStateUri = vscode.Uri.joinPath(this._workspaceFolder.uri, 'data', 'project_state.json');
            let baseState: any = { nodes: [], edges: [], clusters: [] };
            try {
                const data = await vscode.workspace.fs.readFile(projectStateUri);
                baseState = JSON.parse(data.toString());
            } catch (e) {}

            const analyzer = new LogicAnalyzer();
            
            // 2. Build a single TEMP STATE containing all new edges for a single-pass analysis
            const tempNodes = [...(baseState.nodes || [])];
            const tempEdges = [...(baseState.edges || [])];
            
            for (const item of batch) {
                const { edgeId, fromNode, toNode, type } = item;
                // Ensure nodes exist in state
                if (!tempNodes.find(n => n.id === fromNode.id)) tempNodes.push(fromNode);
                if (!tempNodes.find(n => n.id === toNode.id)) tempNodes.push(toNode);
                
                // Add proposed edge
                tempEdges.push({
                    id: edgeId,
                    from: fromNode.id,
                    to: toNode.id,
                    type: type as any,
                    is_approved: false
                });
            }

            const tempNodesNormalized = tempNodes.map(n => ({
                ...n,
                data: n.data || { label: n.label || n.id, file: n.filePath }
            }));
            const tempState = { ...baseState, nodes: tempNodesNormalized, edges: tempEdges };
            
            // 3. RUN ANALYSIS ONCE
            const issues = analyzer.analyze(tempState as any, this._workspaceFolder.uri.fsPath);

            const resultsBatch: any[] = [];
            for (const item of batch) {
                const { edgeId, fromNode, toNode } = item;
                const relevantIssues = issues.filter(issue =>
                    issue.nodeIds.includes(fromNode.id) && issue.nodeIds.includes(toNode.id)
                );

                let isValid = true;
                let validationMessage = '연결이 유효합니다. (LogicAnalyzer ✅)';
                let visualStyle: any = { color: '#b8bb26', style: 'solid', thickness: 2 }; // Pass

                if (relevantIssues.length > 0) {
                    const critical = relevantIssues.find(i => i.severity === 'critical');
                    const warning = relevantIssues.find(i => i.severity === 'high' || i.severity === 'medium' || i.severity === 'low');

                    if (critical) {
                        isValid = false;
                        validationMessage = critical.message;
                        visualStyle = { color: '#fb4934', style: 'solid', thickness: 3 }; // Fail
                    } else if (warning) {
                        isValid = true;
                        validationMessage = warning.message;
                        visualStyle = { color: '#fabd2f', style: 'dashed', thickness: 2, dashArray: '5,5' }; // Warning
                    }
                }

                resultsBatch.push({
                    edgeId: edgeId,
                    result: {
                        valid: isValid,
                        reason: validationMessage,
                        confidence: 1.0,
                        visual: visualStyle,
                        isAi: false
                    }
                });
            }

            this._panel.webview.postMessage({
                command: 'edgeValidationResultsBatch',
                results: resultsBatch
            });

            Logger.info(`[CanvasPanel] Batch validation for ${batch.length} edges complete. Results sent.`);
        } catch (error) {
            Logger.error('[CanvasPanel] handleValidateEdgesBatch error:', error);
        }
    }

    private async handleValidateEdge(edgeId: string, fromNode: any, toNode: any, edgeType: string) {
        try {
            if (!this._workspaceFolder || !fromNode || !toNode) {
                this._panel.webview.postMessage({
                    command: 'edgeValidationResult',
                    edgeId: edgeId,
                    result: { valid: true, reason: 'Insufficient context', confidence: 1.0 }
                });
                return;
            }

            // 1. 기존 프로젝트 상태 읽기
            const projectStateUri = vscode.Uri.joinPath(this._workspaceFolder.uri, 'data', 'project_state.json');
            let state: any = { nodes: [], edges: [], clusters: [] };
            try {
                const data = await vscode.workspace.fs.readFile(projectStateUri);
                state = JSON.parse(data.toString());
            } catch (e) {
                // Ignore missing file, use empty state
            }

            const analyzer = new LogicAnalyzer();
            
            // 2. 현재 엣지를 임시로 추가하여 검사 (상태에 없는 새 엣지일 수 있으므로)
            const tempEdge = {
                id: edgeId,
                from: fromNode.id,
                to: toNode.id,
                type: edgeType as any,
                is_approved: false,
                visual: { thickness: 2, style: 'solid', color: '#665c54' }
            };

            // 노드 리스트에 from/to가 최신 상태로 들어있도록 덮어쓰기
            const existingNodes = state.nodes || [];
            const tempNodes = existingNodes.filter((n: any) => n.id !== fromNode.id && n.id !== toNode.id);
            tempNodes.push(fromNode, toNode);

            const tempState = {
                ...state,
                nodes: tempNodes,
                edges: [...(state.edges || []), tempEdge]
            };

            // 3. LogicAnalyzer 가동
            const issues = analyzer.analyze(tempState as any, this._workspaceFolder.uri.fsPath);

            // 해당 엣지와 연관된 이슈만 필터링
            const relevantIssues = issues.filter(issue =>
                issue.nodeIds.includes(fromNode.id) && issue.nodeIds.includes(toNode.id)
            );

            let isValid = true;
            let validationMessage = '연결이 유효합니다. (LogicAnalyzer ✅)';
            let visualStyle = undefined;

            if (relevantIssues.length > 0) {
                const critical = relevantIssues.find(i => i.severity === 'critical');
                const warning = relevantIssues.find(i => i.severity === 'high' || i.severity === 'medium' || i.severity === 'low');

                if (critical) {
                    isValid = false;
                    validationMessage = critical.message;
                    visualStyle = { color: '#fb4934', style: 'solid', thickness: 3 }; // Gruvbox Red
                } else if (warning) {
                    isValid = true; // Warning doesn't hard-block yet
                    validationMessage = warning.message;
                    visualStyle = { color: '#fabd2f', style: 'dashed', thickness: 2, dashArray: '5,5' }; // Gruvbox Yellow
                }
            } else {
                // 통과 시 녹색
                visualStyle = { color: '#b8bb26', style: 'solid', thickness: 2 };
            }

            // 4. 결과 전송 (Canvas 측에서는 edgeValidationResult를 수신 처리)
            this._panel.webview.postMessage({
                command: 'edgeValidationResult',
                edgeId: edgeId,
                result: {
                    valid: isValid,
                    reason: validationMessage,
                    confidence: 1.0,
                    visual: visualStyle
                }
            });

            // 피드백 알림
            if (!isValid) {
                vscode.window.showErrorMessage(`[Architecture Violation] ${validationMessage}`);
            } else if (validationMessage !== '연결이 유효합니다. (LogicAnalyzer ✅)') {
                vscode.window.showWarningMessage(`[Architecture Warning] ${validationMessage}`);
            }

        } catch (error) {
            console.error('Failed to validate edge:', error);
            this._panel.webview.postMessage({
                command: 'edgeValidationResult',
                edgeId: edgeId,
                result: { valid: true, reason: 'Validation error fallback', confidence: 0 }
            });
        }
    }

    private async handleSaveState(newState: any) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');

            // [v0.3.11] Anti-Wipe Safety: If UI sends empty state but engine/disk has data, block the save.
            const engineSnap = canvasEngine.getFinalSnapshot();
            const uiNodesCount = newState.nodes?.length || 0;
            const engineNodesCount = Object.keys(engineSnap.nodes).length;

            if (uiNodesCount === 0 && engineNodesCount > 0) {
                Logger.warn(`[CanvasPanel] saveState BLOCKED: Attempted to save 0 nodes while engine has ${engineNodesCount}. Probable initialization race condition.`);
                return;
            }

            // 1. Dispatch UPDATE_NODE for each node with a new position, cluster, and layer info
            // [v0.3.11] 🛡️ Hybrid Support: Handle both Array (UI) and Object (Internal Snapshot)
            const incomingNodes = Array.isArray(newState.nodes) ? newState.nodes : Object.values(newState.nodes || {});
            
            if (incomingNodes.length > 0) {
                for (const uiNode of (incomingNodes as any[])) {
                    const uiLayer = uiNode.layer || (uiNode.data && uiNode.data.layer);
                    
                    // [v0.3.15] Apply Snap-to-Grid during save (Grid Sovereignty)
                    let snappedPosition = uiNode.position;
                    if (snappedPosition) {
                        snappedPosition = gridSystem.snapToGrid(snappedPosition.x, snappedPosition.y);
                    }

                    canvasEngine.dispatch('UPDATE_NODE', {
                        id: uiNode.id,
                        updates: {
                            position: snappedPosition,
                            cluster_id: uiNode.cluster_id || (uiNode.data && uiNode.data.cluster_id),
                            ...(uiLayer ? { layer: uiLayer, data: { ...uiNode.data, layer: uiLayer } } : {})
                        }
                    });
                }
            }

            // 2. [v0.3.11 HARD SSOT] Clusters & Nodes Bridge
            if (newState.clusters && Array.isArray(newState.clusters)) {
                for (const uiCluster of newState.clusters) {
                    // Sync cluster structure to engine if not already present
                    canvasEngine.dispatch('ADD_CLUSTER', {
                        id: uiCluster.id,
                        label: uiCluster.label,
                        type: uiCluster.type || 'folder',
                        position: uiCluster.position, // [v0.3.11 Fix] Preserving cluster positions
                        collapsed: uiCluster.collapsed,
                        data: uiCluster.data || { layer: 'user' }
                    });
                }
            }

            const rawSnap = canvasEngine.getRawSnapshot();
            
            // [v0.3.11] 🛡️ Identity Protection: 
            // If the UI sends a snapshot missing nodes that were JUST created in the buffer, 
            // we must preserve them to prevent race-condition wipeouts.
            const finalNodesList = Object.values(rawSnap.nodes);
            
            const persistenceState: any = {
                project_name: workspaceFolder.name,
                canvas_state: {
                    zoom_level: (newState.view ? newState.view.zoom : newState.zoom) || 1.0, 
                    offset: (newState.view ? { x: newState.view.offsetX, y: newState.view.offsetY } : (newState.offset || { x: 0, y: 0 })),
                    visible_layers: newState.visible_layers || (newState.data && newState.data.visible_layers) || ['source', 'documentation', 'user']
                },
                // [v0.3.11] Backend Master Copy (SSoT) - Protects against incomplete UI payloads
                nodes: finalNodesList,
                edges: Object.values(rawSnap.edges),
                clusters: rawSnap.clusters || [],
                deletedNodeIds: rawSnap.deletedNodeIds || []
            };

            const normalizedJson = this.normalizeProjectState(persistenceState);
            await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf8'));

            console.log(`[SYNAPSE] State synchronized: ${persistenceState.nodes.length} nodes saved to disk.`);
            
            // 🔥 [v0.3.11] IMMEDIATE REACTION: Ensure UI reflects backend identity sorting (AI vs User)
            await this.sendProjectState(false, true);
        } catch (error) {
            console.error('[SYNAPSE] Failed to save state:', error);
        }
    }


    private async handleTakeSnapshot(state: any) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            let currentProjectState = state.data;

            // [v0.3.11 HARD SSOT] Priority: State in message -> Raw Engine Snapshot (merged with Disk metadata)
            if (!currentProjectState) {
                const engineSnap = canvasEngine.getRawSnapshot(); // Use RAW snapshot to prevent data loss
                // Also try to get camera/visibility state from current file if not in engine
                let existingCanvasState = { 
                    zoom_level: 1.0, 
                    offset: { x: 0, y: 0 },
                    visible_layers: ['source', 'documentation', 'user']
                };
                try {
                    const data = await vscode.workspace.fs.readFile(projectStateUri);
                    const diskState = JSON.parse(Buffer.from(data).toString('utf-8'));
                    if (diskState.canvas_state) {
                        existingCanvasState = {
                            ...existingCanvasState,
                            ...diskState.canvas_state
                        };
                    }
                } catch (e) {}

                currentProjectState = {
                    project_name: workspaceFolder.name,
                    canvas_state: existingCanvasState,
                    nodes: Object.values(engineSnap.nodes),
                    edges: Object.values(engineSnap.edges),
                    clusters: engineSnap.clusters || []
                };
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

            // [v0.2.20 Fix] Only record to Context Vault when it's a user-triggered snapshot,
            // NOT for auto-save events which just produce meaningless empty files
            const isAutoSave = !state.label || 
                state.label.startsWith('Auto Backup') || 
                state.label.startsWith('auto_') ||
                state.label === 'Auto-Save';
            if (state.label && !isAutoSave) {
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
                canvas_state: snapshot.data.canvas_state || existingState.canvas_state || { zoom_level: 1.0, offset: { x: 0, y: 0 } },
                nodes: snapshot.data.nodes,
                edges: snapshot.data.edges,
                clusters: snapshot.data.clusters
            };

            await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(JSON.stringify(newState, null, 2), 'utf8'));

            // [v0.3.11 HARD SSOT] Sync BACKEND ENGINE immediately
            // This prevents the engine from overwriting the disk with old state on next interaction
            canvasEngine.loadInitialState(newState);

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

            // 3. Notify webview to reload with Force Reset
            // [v0.3.11] 롤백 후 2초간 getProjectState 차단
            this._rollbackGuardUntil = Date.now() + 2000;
            await this.sendProjectState(true);
            await this.sendHistory();

            this._panel.webview.postMessage({ command: 'rollbackComplete' });

            vscode.window.showInformationMessage(`Rolled back to: ${snapshot.label}. Current state backed up.`);
        } catch (error) {
            console.error('[SYNAPSE] Rollback failed:', error);
            vscode.window.showErrorMessage(`Rollback failed: ${error}`);
        }
    }

    /** 특정 노드 포커스 요청 (그리드 스냅 반영) */
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

    private _isSyncing: boolean = false;

    public async sendProjectState(forceReset: boolean = false, isAuthoritative: boolean = false) {
        if (!this._panel || this._isSyncing) return;
        this._isSyncing = true;
        
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) {
            this._isSyncing = false;
            return;
        }

        try {
            // [v0.3.11] 1. Load Current SSOT (Engine Snapshot)
            const engineSnap = canvasEngine.getFinalSnapshot();
            let projectState: any = {
                project_name: workspaceFolder.name,
                canvas_state: {
                    zoom_level: 1.0,
                    offset: { x: 0, y: 0 },
                    visible_layers: ['source', 'documentation']
                },
                nodes: Object.values(engineSnap.nodes),
                edges: Object.values(engineSnap.edges),
                clusters: engineSnap.clusters || []
            };

            // [v0.3.11] 2. Boot-Sync: If Engine is new OR incomplete, load from persistence file
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            
            // [v0.3.11 HARD SSOT] Reality check: If engine is empty OR significantly differs from disk, sync it.
            try {
                const data = await vscode.workspace.fs.readFile(projectStateUri);
                const fileState = JSON.parse(data.toString());
                
                // [v0.3.21 Fix] Use RAW snapshot for count comparison to avoid infinite loop from projected view merging
                const rawEngineSnap = canvasEngine.getRawSnapshot();
                const rawNodeCount = Object.keys(rawEngineSnap.nodes).length;

                if (rawNodeCount === 0 || rawNodeCount < (fileState.nodes || []).length) {
                    Logger.info(`[CanvasPanel] Syncing backend engine from project_state.json (File: ${fileState.nodes?.length || 0} vs Engine: ${rawNodeCount})`);
                    canvasEngine.loadInitialState(fileState);
                    
                    // [v0.3.21.5] Force authoritative reload on initial sync
                    isAuthoritative = true; 
                    
                    const refreshedSnap = canvasEngine.getFinalSnapshot();
                    projectState.nodes = Object.values(refreshedSnap.nodes);
                    projectState.edges = Object.values(refreshedSnap.edges);
                    projectState.clusters = refreshedSnap.clusters || [];
                }
            } catch (e) {
                Logger.warn(`[CanvasPanel] Boot-Sync: No project_state.json found or failed to parse.`);
            }

            // [v0.3.11] 3. 🛡️ Self-Healing: Background Reality-Check (Find roaming files)
            try {
                const engine = new BootstrapEngine();
                const discoveredState = await engine.autoDiscover(workspaceFolder.uri.fsPath);
                if (discoveredState.nodes!.length > 0) {
                    const currentEngineNodes = canvasEngine.getFinalSnapshot().nodes;
                    const existingNodeIds = new Set(Object.keys(currentEngineNodes));
                    
                    // Filter for files existing on disk but NOT in graph (Roamers)
                    const roamers = discoveredState.nodes!.filter(n => !existingNodeIds.has(n.id));
                    
                    if (roamers.length > 0) {
                        // [v0.3.11 HARD SSOT] Non-destructive merge
                        canvasEngine.mergeFromScan({
                            nodes: roamers,
                            edges: []
                        });
                        
                        const finalSnap = canvasEngine.getFinalSnapshot();
                        
                        // [v0.3.21.4 Amnesia Guard] NEVER overwrite if we somehow ended up with 0 nodes
                        if (Object.keys(finalSnap.nodes).length > 0) {
                            projectState.nodes = Object.values(finalSnap.nodes);
                            projectState.edges = Object.values(finalSnap.edges);
                            projectState.clusters = finalSnap.clusters || [];

                            const normalizedJson = this.normalizeProjectState(finalSnap);
                            await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf-8'));
                        }
                    }
                }
            } catch (err) {
                Logger.warn(`[CanvasPanel] Self-healing sync failed: ${err}`);
            }

            // [v0.3.11] 4. Phase & Broadcast
            try {
                if (phaseManager.isLocked() || phaseManager.getCurrentPhase() <= Phase.DATA) {
                    phaseManager.reset(); 
                    if (projectState.nodes.length > 0) phaseManager.advancePhase(Phase.CONTROL);
                }
            } catch (e) { /* ignore phase sync errors */ }

            // [v0.3.21.4] Amnesia Guard: WebView filter
            // If the state we are about to send is EMPTY, but we were NOT asked for a forceReset,
            // we skip the broadcast to prevent the UI from clearing out valid existing data.
            if (projectState.nodes.length === 0 && !forceReset) {
                Logger.warn('[CanvasPanel] Aborting projectState broadcast: Nodes count is 0. Protecting UI state.');
                this._isSyncing = false;
                return;
            }

            this._panel.webview.postMessage({
                command: 'projectState',
                data: projectState,
                workspaceFolder: workspaceFolder.uri.fsPath,
                forceReset: forceReset,
                isAuthoritative: isAuthoritative // 🔥 [v0.3.11] Interaction Bypass
            });

        } catch (error) {
            Logger.error(`[CanvasPanel] sendProjectState failed: ${error}`);
        } finally {
            this._isSyncing = false;
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
        const engineCoreUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'ui', 'engine-core.js')
        );
        const webglRendererUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'ui', 'webgl-renderer.js')
        );

        const themeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'ui', 'synapse-theme.js')
        );

        // Replace script src with webview URI
        html = html.replace(
            'src="synapse-theme.js"',
            `src="${themeUri}"`
        );
        html = html.replace(
            'src="canvas-engine.js"',
            `src="${scriptUri}"`
        );
        html = html.replace(
            'src="engine-core.js"',
            `src="${engineCoreUri}"`
        );
        html = html.replace(
            'src="webgl-renderer.js"',
            `src="${webglRendererUri}"`
        );

        // Inject actual webgl renderer URI for dynamic loader fallback
        html = html.replace(
            '__SYNAPSE_WEBGL_RENDERER_URI__',
            `${webglRendererUri}`
        );

        // Add nonce first, before any inline script insertion
        const nonce = getNonce();

        // Add CSP - relaxed for webview compatibility
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
