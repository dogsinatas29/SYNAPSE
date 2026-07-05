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
import * as cp from 'child_process';
import * as http from 'http';
import { Node, Edge, ProjectState, EdgeType, NodeType } from '../types/schema';
import { FileScanner } from '../core/FileScanner';
import { LogicAnalyzer } from '../core/LogicAnalyzer';
import { EdgeCodeRefactorer } from '../core/EdgeCodeRefactorer';
import { GeminiParser } from '../core/GeminiParser';
import { FlowchartGenerator } from '../core/FlowchartGenerator';
import { BootstrapEngine } from '../bootstrap/BootstrapEngine';
import { client } from '../client';
import { Logger } from '../utils/Logger';
import { VirtualDebugger, DiagnosticsStore } from '../core/VirtualDebugger';
import { SynapseIgnore } from '../core/SynapseIgnore';
import { RuleEngine } from '../core/RuleEngine';
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

    public pushTask(task: () => Promise<void>) {
        return this._taskQueue.push(task);
    }

    // [v0.3.30] Collaboration Server Process
    private _serverProcess: cp.ChildProcess | null = null;
    private _externalServer: boolean = false;
    private _isServerOwner: boolean = false;
    private _adminSecret?: string;

    // [v0.3.30] Connection info for account management
    private _connHost: string = 'localhost';
    private _connPort: number = 3000;
    private _connUserId: string = '';
    private _connUsername: string = '';
    private _sessionToken: string | null = null;

    // [v0.3.30] Client Push Watcher
    private _pushWatcher: vscode.FileSystemWatcher | null = null;
    private _pushDebounceTimer: NodeJS.Timeout | null = null;
    private _pushInFlight: boolean = false;
    private _synapseIgnore: SynapseIgnore | null = null;

    // 관리자 version polling (클라이언트 접속 감지용)
    private _versionPollTimer: NodeJS.Timeout | null = null;
    private _lastStateVersion: number = 0;

    // [Phase 1/2] Connection Lock & Remote Save
    private _isLocked: boolean = false;
    private _cachePathMap: Map<string, { clientUsername: string, originalFilePath: string }> = new Map();
    private _saveListenerDisposable: vscode.Disposable | null = null;
    private _isSessionLocked: boolean = false; // [v0.3.30] Harvest Session Lock

    // [v0.3.31] Network-Aware Virtual Debugger
    private _diagnosticDebounceTimer: NodeJS.Timeout | null = null;
    private _lastDiagnosticHash: string = '';


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

        // Remote Save Listener
        this._saveListenerDisposable = vscode.workspace.onDidSaveTextDocument(this._handleDocumentSave.bind(this));

        // [v0.3.31] Diagnostics Exporter
        this._disposables.push(vscode.languages.onDidChangeDiagnostics(() => {
            if (!this._sessionToken) return; // Not connected
            if (this._diagnosticDebounceTimer) clearTimeout(this._diagnosticDebounceTimer);
            this._diagnosticDebounceTimer = setTimeout(() => {
                this._pushDiagnostics();
            }, 2000);
        }));

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
                    await this._taskQueue.push(async () => {
                        try {
                            await this._handleMessage(message);
                        } catch (e: any) {
                            console.error('[SYNAPSE-DEBUG] Unhandled error in _handleMessage task:', e);
                            vscode.window.showErrorMessage(`[SYNAPSE] 메시지 처리 중 치명적 에러: ${e.message}`);
                        }
                    });
                } else {
                    try {
                        await this._handleMessage(message);
                    } catch (e: any) {
                        console.error('[SYNAPSE-DEBUG] Unhandled error in _handleMessage (direct):', e);
                        vscode.window.showErrorMessage(`[SYNAPSE] 메시지 직접 처리 중 치명적 에러: ${e.message}`);
                    }
                }
            },
            null,
            this._disposables
        );
    }

    public async runWebviewBenchmark(phase: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Benchmark Webview Timeout')), 10000);
            (this as any)._benchmarkCallback = (result: any) => {
                clearTimeout(timeout);
                delete (this as any)._benchmarkCallback;
                resolve(result);
            };
            this._panel.webview.postMessage({ command: 'startBenchmark', phase });
        });
    }

    private async _handleMessage(message: any) {
        if (message.command !== 'contextData' && message.command !== 'log') {
            Logger.info(`[CanvasPanel] Received command: ${message.command}`);
        }

        switch (message.command) {
            case 'setEditLogicMode':
                (this as any)._isEditLogicMode = message.enabled;
                try {
                    await vscode.workspace.getConfiguration('synapse').update('editLogicMode', message.enabled, vscode.ConfigurationTarget.Global);
                } catch (e: any) {
                    Logger.warn(`[CanvasPanel] Failed to save editLogicMode to settings: ${e.message}`);
                }
                Logger.info(`[CanvasPanel] Updated editLogicMode configuration to: ${message.enabled}`);
                return;
            case 'alert':
                vscode.window.showInformationMessage(message.text);
                return;
            case 'benchmarkResult':
                if ((this as any)._benchmarkCallback) {
                    (this as any)._benchmarkCallback(message.result);
                }
                return;
            case 'nodeSelected':
                this.handleNodeSelected(message.node);
                return;
            case 'openFile':
                await this.openFile(message.filePath, message.createIfNotExists, message.clientUsername);
                return;
            case 'getProjectState':
                // [v0.3.11] 롤백 직후 2초간 재요청 차단 (롤백 데이터 덮어쓰기 방지)
                if (this._rollbackGuardUntil && Date.now() < this._rollbackGuardUntil) {
                    Logger.info('[CanvasPanel] getProjectState blocked by rollback guard.');
                    return;
                }
                await this._taskQueue.push(() => this.sendProjectState());
                return;
            case 'saveState':
                await this._taskQueue.push(() => this.handleSaveState(message.data || message.state));
                return;
            case 'readFile':
                await this.handleReadFile(message.filePath, message.clientUsername);
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
            case 'saveWorkspace':
                await this.handleSaveWorkspace(message.data);
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
                await this._taskQueue.push(() => this.handleDeleteEdge(message.edgeId));
                return;
            case 'deleteNodes':
                await this._taskQueue.push(() => this.handleDeleteNodes(message));
                return;
            case 'updateEdge':
                await this._taskQueue.push(() => this.handleUpdateEdge(message.edgeId, message.updates));
                return;
            case 'approveNode':
                await this._taskQueue.push(() => this.handleApproveNode(message.nodeId));
                return;
            case 'rejectNode':
                await this.handleRejectNode(message.nodeId);
                return;
            case 'generateFlow':
                await this.handleGenerateFlow(message.nodeId, message.filePath);
                return;
            case 'updateNodeDTR':
                canvasEngine.dispatch('UPDATE_NODE', { id: message.nodeId, updates: { dtr: message.dtr }});
                await this.sendProjectState();
                return;
            case 'requestDeleteEdgeSource':
                await this.handleRequestDeleteEdgeSource(message.edgeId, message.fromFile, message.toFile);
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
                    
                    const nodeFromMessage = message.node || message.data || message.payload || {};
                    if (message.filePath) {
                        nodeFromMessage.filePath = message.filePath;
                    }
                    
                    await this.handleCreateManualNode(nodeFromMessage);
                } catch (e: any) {
                    vscode.window.showErrorMessage(`[v0.3.29] Node creation failed: ${e.message || e}`);
                    Logger.error(`[v0.3.29] CRITICAL_FAIL: ${e}`);
                }
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
                await this._taskQueue.push(() => this.handleReBootstrap());
                return;
            case 'requestConfirmEdge':
                await this._taskQueue.push(() => this.handleRequestConfirmEdge(message.edgeId, message.fromFile, message.toFile));
                return;
            case 'resetProjectState':
                await this._taskQueue.push(() => this.handleResetProjectState());
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
            case 'startServer':
                this.handleStartServer(message.host, message.port, message.username, message.password);
                return;
            case 'stopServer':
                this.handleStopServer();
                return;
            case 'login':
                const projectRoot = this._workspaceFolder ? this._workspaceFolder.uri.fsPath : this._extensionUri.fsPath;
                this.handleLogin(message.host, message.port, message.username, message.password, projectRoot);
                return;
            case 'createAccount':
                await this.handleCreateAccount(message);
                return;
            case 'harvestStart':
                await this.handleHarvestStart(message);
                return;
            case 'harvestCompare':
                await this.handleHarvestCompare(message);
                return;
            case 'harvestExecute':
                await this.handleHarvestExecute(message);
                return;
            case 'openHarvestFolder':
                vscode.window.showInformationMessage(`수확이 완료되었습니다. 클라이언트별 수확 폴더를 여시겠습니까?`, '폴더 열기').then(selection => {
                    if (selection === '폴더 열기' && message.path) {
                        vscode.env.openExternal(vscode.Uri.file(message.path));
                    }
                });
                return;
            case 'deleteAccount':
                await this.handleDeleteAccount(message);
                return;
            case 'loadAccounts':
                await this.handleLoadAccounts(message);
                return;
            case 'changePassword':
                await this.handleChangePassword(message);
                return;
            case 'serverInfo':
                this.handleServerInfo(message.host, message.port);
                return;
            case 'logout':
                await this.handleLogout();
                return;
            case 'getConnectedClients':
                await this.handleGetConnectedClients();
                return;
            case 'getSessions':
                await this.handleGetSessions();
                return;
            case 'refreshServerState':
                this._fetchServerState(this._connHost || 'localhost', String(this._connPort || 3000));
                return;
            case 'submit':
                await this.handleSubmit(message.projectUUID, message.sessionId, message.filePaths);
                return;
            case 'getSubmissions':
                await this.handleGetSubmissions(message.projectUUID);
                return;
            case 'startReview':
                await this.handleStartReview(message.submissionId, message.leadId);
                return;
            case 'approveSubmission':
                await this.handleApproveSubmission(message.submissionId, message.leadId, message.notes);
                return;
            case 'rejectSubmission':
                await this.handleRejectSubmission(message.submissionId, message.leadId, message.reason);
                return;
            case 'buildIndex':
                await this.handleBuildIndex(message.submissionId);
                return;
            case 'verify':
                await this.handleVerify(message.submissionId);
                return;
        }
    }

    private async handleSubmit(projectUUID: string, sessionId: string, filePaths: string[]): Promise<void> {
        const host = this._connHost || 'localhost';
        const port = this._connPort || 3000;
        const data = JSON.stringify({ projectUUID, sessionId, clientId: this._connUserId, filePaths, clientUsername: this._connUsername });
        const opts: http.RequestOptions = {
            hostname: host, port, path: '/api/collab/submission', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...this._getAuthHeaders() },
            timeout: 30000,
        };
        const req = http.request(opts, (res) => {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    this._panel.webview.postMessage({ command: 'submitResult', ...result });
                } catch { this._panel.webview.postMessage({ command: 'submitResult', success: false, error: 'Invalid response' }); }
            });
        });
        req.on('error', (e) => this._panel.webview.postMessage({ command: 'submitResult', success: false, error: e.message }));
        req.write(data);
        req.end();
    }

    private async handleGetSubmissions(projectUUID: string): Promise<void> {
        const host = this._connHost || 'localhost';
        const port = this._connPort || 3000;
        const opts: http.RequestOptions = {
            hostname: host, port, path: `/api/collab/submissions?projectUUID=${encodeURIComponent(projectUUID)}`, method: 'GET',
            headers: { ...this._getAuthHeaders() }, timeout: 10000,
        };
        const req = http.request(opts, (res) => {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    this._panel.webview.postMessage({ command: 'submissionsResult', ...result });
                } catch { this._panel.webview.postMessage({ command: 'submissionsResult', success: false, error: 'Invalid response' }); }
            });
        });
        req.on('error', (e) => this._panel.webview.postMessage({ command: 'submissionsResult', success: false, error: e.message }));
        req.end();
    }

    private async handleStartReview(submissionId: string, leadId: string): Promise<void> {
        const host = this._connHost || 'localhost';
        const port = this._connPort || 3000;
        const data = JSON.stringify({ submissionId, leadId });
        const opts: http.RequestOptions = {
            hostname: host, port, path: '/api/collab/review', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...this._getAuthHeaders() },
            timeout: 10000,
        };
        const req = http.request(opts, (res) => {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    this._panel.webview.postMessage({ command: 'reviewResult', ...result });
                } catch { this._panel.webview.postMessage({ command: 'reviewResult', success: false, error: 'Invalid response' }); }
            });
        });
        req.on('error', (e) => this._panel.webview.postMessage({ command: 'reviewResult', success: false, error: e.message }));
        req.write(data);
        req.end();
    }

    private async handleApproveSubmission(submissionId: string, leadId: string, notes?: string): Promise<void> {
        const host = this._connHost || 'localhost';
        const port = this._connPort || 3000;
        const data = JSON.stringify({ submissionId, leadId, notes });
        const opts: http.RequestOptions = {
            hostname: host, port, path: '/api/collab/approve', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...this._getAuthHeaders() },
            timeout: 10000,
        };
        const req = http.request(opts, (res) => {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    this._panel.webview.postMessage({ command: 'approveResult', ...result });
                } catch { this._panel.webview.postMessage({ command: 'approveResult', success: false, error: 'Invalid response' }); }
            });
        });
        req.on('error', (e) => this._panel.webview.postMessage({ command: 'approveResult', success: false, error: e.message }));
        req.write(data);
        req.end();
    }

    private async handleRejectSubmission(submissionId: string, leadId: string, reason: string): Promise<void> {
        const host = this._connHost || 'localhost';
        const port = this._connPort || 3000;
        const data = JSON.stringify({ submissionId, leadId, reason });
        const opts: http.RequestOptions = {
            hostname: host, port, path: '/api/collab/reject', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...this._getAuthHeaders() },
            timeout: 10000,
        };
        const req = http.request(opts, (res) => {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    this._panel.webview.postMessage({ command: 'rejectResult', ...result });
                } catch { this._panel.webview.postMessage({ command: 'rejectResult', success: false, error: 'Invalid response' }); }
            });
        });
        req.on('error', (e) => this._panel.webview.postMessage({ command: 'rejectResult', success: false, error: e.message }));
        req.write(data);
        req.end();
    }

    private async handleBuildIndex(submissionId: string): Promise<void> {
        const host = this._connHost || 'localhost';
        const port = this._connPort || 3000;
        const data = JSON.stringify({ submissionId });
        const opts: http.RequestOptions = {
            hostname: host, port, path: '/api/collab/index', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...this._getAuthHeaders() },
            timeout: 30000,
        };
        const req = http.request(opts, (res) => {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    this._panel.webview.postMessage({ command: 'indexResult', ...result });
                } catch { this._panel.webview.postMessage({ command: 'indexResult', success: false, error: 'Invalid response' }); }
            });
        });
        req.on('error', (e) => this._panel.webview.postMessage({ command: 'indexResult', success: false, error: e.message }));
        req.write(data);
        req.end();
    }

    private async handleVerify(submissionId: string): Promise<void> {
        const host = this._connHost || 'localhost';
        const port = this._connPort || 3000;
        const data = JSON.stringify({ submissionId });
        const opts: http.RequestOptions = {
            hostname: host, port, path: '/api/collab/verify', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...this._getAuthHeaders() },
            timeout: 60000,
        };
        const req = http.request(opts, (res) => {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    this._panel.webview.postMessage({ command: 'verifyResult', ...result });
                } catch { this._panel.webview.postMessage({ command: 'verifyResult', success: false, error: 'Invalid response' }); }
            });
        });
        req.on('error', (e) => this._panel.webview.postMessage({ command: 'verifyResult', success: false, error: e.message }));
        req.write(data);
        req.end();
    }

    private async handleCreateManualNode(node: any) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');

            // 1. [v0.3.11] Sync Physical File if requested (Fast Check)
            if (node.createPhysicalFile && node.data?.label) {
                let targetFileName = node.data.label;
                if (!targetFileName.includes('.')) {
                    // [v0.3.32.3] Prompt user for extension instead of auto-inferring
                    const extSelection = await vscode.window.showQuickPick(
                        ['.ts', '.js', '.py', '.rs', '.cpp', '.java', '.go', '.md', 'No Extension'],
                        { placeHolder: `Select extension for new node: ${targetFileName}` }
                    );
                    
                    if (extSelection && extSelection !== 'No Extension') {
                        targetFileName += extSelection;
                    }
                }
                let fileUri: vscode.Uri;
                let manualPath = node.filePath || '';
                if (manualPath) {
                    let safeManualPath = manualPath.replace(/\\/g, '/');
                    const wsPathUnix = workspaceFolder.uri.fsPath.replace(/\\/g, '/');
                    if (safeManualPath.startsWith(wsPathUnix)) {
                        safeManualPath = safeManualPath.substring(wsPathUnix.length).replace(/^[\\/]+/g, '');
                    } else if (safeManualPath.startsWith('/') || safeManualPath.match(/^[a-zA-Z]:[\\/]/)) {
                        safeManualPath = safeManualPath.replace(/^([a-zA-Z]:)?[\\/]+/g, '');
                    }
                    const relPath = path.posix.join(safeManualPath, targetFileName);
                    fileUri = vscode.Uri.joinPath(workspaceFolder.uri, relPath);
                } else {
                    fileUri = vscode.Uri.joinPath(workspaceFolder.uri, targetFileName);
                }

                try {
                    await vscode.workspace.fs.stat(fileUri);
                    node.data.file = vscode.workspace.asRelativePath(fileUri);
                } catch {
                    // Create empty file (Background-ish)
                    const dirUri = vscode.Uri.joinPath(fileUri, '..');
                    await vscode.workspace.fs.createDirectory(dirUri);
                    const ext = path.extname(targetFileName).toLowerCase();
                    let commentPrefix = '//';
                    if (['.py', '.rb', '.sh', '.yaml', '.yml'].includes(ext)) {
                        commentPrefix = '#';
                    } else if (['.html', '.xml'].includes(ext)) {
                        commentPrefix = '<!--';
                    } else if (ext === '.sql') {
                        commentPrefix = '--';
                    }
                    const contentStr = `${commentPrefix} [SYNAPSE] Atomic Logic Entry\n`;
                    if (commentPrefix === '<!--') {
                        await vscode.workspace.fs.writeFile(fileUri, Buffer.from(`${contentStr} -->\n`, 'utf8'));
                    } else {
                        await vscode.workspace.fs.writeFile(fileUri, Buffer.from(contentStr, 'utf8'));
                    }
                    Logger.info(`[CanvasPanel] Physical file auto-created: ${targetFileName}`);
                    node.data.file = vscode.workspace.asRelativePath(fileUri);
                }
                node.filePath = node.data.file; // Sync top-level filePath
                delete node.createPhysicalFile;
            }

            // 2. Dispatch to Engine
            let rawFile = node.filePath || node.data?.file || '';
            if (rawFile) {
                const wsPathUnix = workspaceFolder.uri.fsPath.replace(/\\/g, '/');
                let safeFile = rawFile.replace(/\\/g, '/');
                if (safeFile.startsWith(wsPathUnix)) {
                    safeFile = safeFile.substring(wsPathUnix.length).replace(/^\/+/, '');
                } else if (safeFile.startsWith('/') || safeFile.match(/^[a-zA-Z]:\//)) {
                    safeFile = safeFile.replace(/^([a-zA-Z]:)?\/+/, '');
                }
                rawFile = safeFile;
            }
            const normalizedFilePath = (rawFile && !rawFile.startsWith('http') && !rawFile.startsWith('external'))
                ? vscode.workspace.asRelativePath(rawFile, false)
                : rawFile;

            const nodeId = node.id || crypto.randomUUID();
            // If we appended .py in step 1, use that as the display label to match reality
            const finalLabel = node.filePath ? path.basename(node.filePath) : (node.data?.label || nodeId);

            const result = canvasEngine.dispatch('ADD_NODE', {
                id: nodeId,
                label: finalLabel,
                type: node.type || 'file',
                layer: 'user',
                clientLayer: this._isServerOwner ? undefined : this._connUserId,
                clientUsername: this._isServerOwner ? undefined : this._connUsername,
                filePath: normalizedFilePath,
                cluster_id: 'sys_cluster_buffer',
                status: 'pending',
                data: {
                    ...node.data,
                    label: finalLabel,
                    layer: 'user',
                    clientLayer: this._isServerOwner ? undefined : this._connUserId,
                    clientUsername: this._isServerOwner ? undefined : this._connUsername,
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
            // await this.sendProjectState(false, true); // [v0.3.30] Prevent UI overwrite that deletes client nodes

            // 3. Persistence & SSoT (v0.3.11: Atomic Save)
            const finalState = canvasEngine.getFinalSnapshot();
            
            // Ensure the new node is definitely in the persistence block
            const finalStateNodes = Array.isArray(finalState.nodes) ? finalState.nodes : Object.values(finalState.nodes || {});
            const existingNode = finalStateNodes.find((n: any) => n.id === nodeId);
            if (!existingNode) {
                const rawEngineSnap = canvasEngine.getRawSnapshot();
                const rawNode = Object.values(rawEngineSnap.nodes).find((n: any) => n.id === nodeId);
                if (rawNode) {
                    if (Array.isArray(finalState.nodes)) {
                        finalState.nodes.push(rawNode);
                    } else {
                        finalState.nodes[nodeId] = rawNode;
                    }
                }
            }

            // [v0.3.11] Use the hardened saveState pipeline for consistent normalization
            await this.handleSaveState(finalState);

            Logger.info(`[CanvasPanel] Manual node persisted and synced: ${nodeId}`);
            vscode.window.showInformationMessage(`Node created: ${node.data?.label || node.id}`);

            // Update UI immediately without waiting for full sync
            this._panel.webview.postMessage({
                command: 'updateNode',
                data: {
                    id: nodeId,
                    updates: {
                        label: finalLabel,
                        file: normalizedFilePath,
                        status: 'solid',
                        cluster_id: 'sys_cluster_buffer',
                        layer: 'user',
                        data: {
                            label: finalLabel,
                            file: normalizedFilePath,
                            status: 'solid',
                            cluster_id: 'sys_cluster_buffer',
                            layer: 'user'
                        }
                    }
                }
            });

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
                // await this.sendProjectState(false, true); // [v0.3.30] Prevent UI overwrite that deletes client nodes
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

    private _resolveFileUri(workspaceFolderUri: vscode.Uri, filePath: string, clientUsername?: string): vscode.Uri | null {
        const normalizedPath = filePath.trim();
        let targetPath = normalizedPath.replace(/^[\\\/]+/, '').trim();
        
        if (clientUsername && clientUsername !== this._connUsername) {
            // [Cross-Client Remote File Open] Route to mounted path securely
            const MountManager = require('../core/collaboration/MountManager').MountManager;
            const mountConfig = MountManager.getInstance().getMountConfig(clientUsername);
            
            if (mountConfig && mountConfig.remotePath) {
                // Rule 1: Strip absolute path securely based on segment boundaries
                let normalizedTarget = path.posix.normalize(normalizedPath.replace(/\\/g, '/'));
                let normalizedRoot = path.posix.normalize(mountConfig.remotePath.replace(/\\/g, '/'));
                
                // Ensure both have leading slashes for absolute path comparison
                if (!normalizedTarget.startsWith('/')) normalizedTarget = '/' + normalizedTarget;
                if (!normalizedRoot.startsWith('/')) normalizedRoot = '/' + normalizedRoot;
                
                if (normalizedTarget === normalizedRoot) {
                    targetPath = '';
                } else if (normalizedTarget.startsWith(normalizedRoot + '/')) {
                    targetPath = normalizedTarget.substring(normalizedRoot.length).replace(/^[\\\/]+/, '');
                }
            }

            // Rule 2: Path Traversal Protection
            if (targetPath.includes('../') || targetPath.includes('..\\') || targetPath === '..') {
                vscode.window.showErrorMessage(`[SYNAPSE] 보안 에러: 경로 이탈(Path Traversal) 공격 의심 (${targetPath})`);
                return null;
            }

            const fileUri = vscode.Uri.joinPath(workspaceFolderUri, '.synapse', 'mnt', clientUsername, targetPath);
            
            // Rule 3: Verify the resolved path is strictly inside the mount root
            const mountRoot = path.resolve(workspaceFolderUri.fsPath, '.synapse', 'mnt', clientUsername);
            const resolvedPath = path.resolve(fileUri.fsPath);
            if (resolvedPath !== mountRoot && !resolvedPath.startsWith(mountRoot + path.sep)) {
                vscode.window.showErrorMessage(`[SYNAPSE] 보안 에러: 마운트 범위를 이탈했습니다 (${targetPath})`);
                return null;
            }

            Logger.info(`[CanvasPanel] Cross-Client File Open: routing to mount path ${fileUri.fsPath}`);
            return fileUri;
        } else {
            if (normalizedPath.startsWith('/') || (normalizedPath.length > 1 && normalizedPath[1] === ':')) {
                return vscode.Uri.file(normalizedPath);
            }
            // Normalize path to prevent double slash errors for relative paths
            targetPath = normalizedPath.replace(/^[\\\/]+/, '').trim();
            return vscode.Uri.joinPath(workspaceFolderUri, targetPath);
        }
    }

    private async openFile(filePath: string, createIfNotExists: boolean = false, clientUsername?: string) {
        console.log(`[SYNAPSE-DEBUG] Extension Host received openFile for: ${filePath}, create=${createIfNotExists}, client=${clientUsername}`);
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) {
            console.log(`[SYNAPSE-DEBUG] _workspaceFolder is undefined!`);
            return;
        }

        // [v0.3.30] SSE On-demand File Fetch
        if (clientUsername && clientUsername !== this._connUsername && this._connHost) {
            try {
                Logger.info(`[CanvasPanel] Requesting file '${filePath}' from client '${clientUsername}' via SSE...`);
                vscode.window.showInformationMessage(`[SYNAPSE] 파일 전송을 요청 중입니다... (${clientUsername})`);
                
                const content = await this._requestFileViaSSE(clientUsername, filePath);
                if (content !== null) {
                    Logger.info(`[CanvasPanel] Received file content via SSE: ${filePath}`);
                    
                    const cacheDir = vscode.Uri.joinPath(workspaceFolder.uri, '.synapse', 'cache', clientUsername);
                    try {
                        await vscode.workspace.fs.createDirectory(cacheDir);
                    } catch (e) { /* ignore */ }
                    
                    // Replace slashes with underscores to preserve unique paths and prevent basename collisions
                    const safeName = filePath.replace(/[/\\]/g, '_');
                    const tempFileUri = vscode.Uri.joinPath(cacheDir, safeName);
                    
                    // Register the path in the map for Remote Save
                    this._cachePathMap.set(tempFileUri.fsPath, { clientUsername, originalFilePath: filePath });
                    
                    await vscode.workspace.fs.writeFile(tempFileUri, Buffer.from(content, 'utf8'));
                    
                    const doc = await vscode.workspace.openTextDocument(tempFileUri);
                    await vscode.window.showTextDocument(doc);
                    return;
                }
            } catch (e: any) {
                Logger.error(`[CanvasPanel] SSE Fetch failed: ${e.message}`, e);
                vscode.window.showErrorMessage(`[SYNAPSE] 타 클라이언트 파일 요청 실패: ${e.message}`);
                return; // Do not fallback to MountManager for cross-client files
            }
        }

        let fileUri: vscode.Uri | null = null;
        try {
            fileUri = this._resolveFileUri(workspaceFolder.uri, filePath, clientUsername);
        } catch (resolveError: any) {
            console.error(`[SYNAPSE-DEBUG] _resolveFileUri threw an error:`, resolveError);
            vscode.window.showErrorMessage(`[SYNAPSE] 경로 분석 중 치명적 에러: ${resolveError.message}`);
            return;
        }
        if (!fileUri) return; // Security check failed

        console.log(`[SYNAPSE-DEBUG] Resolved fileUri: ${fileUri.fsPath}`);
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

    private async _handleDocumentSave(document: vscode.TextDocument) {
        if (this._isSessionLocked) {
            vscode.window.showWarningMessage(`Workspace is LOCKED due to an active Harvest Session. Edit is ignored.`);
            return;
        }
        if (!document.uri.fsPath.includes('.synapse')) return;
        const cacheInfo = this._cachePathMap.get(document.uri.fsPath);
        if (cacheInfo) {
            const { clientUsername, originalFilePath } = cacheInfo;
            await this._pushFileSaveViaSSE(clientUsername, originalFilePath, document.getText());
        }
    }

    private _pushFileSaveViaSSE(clientUsername: string, originalFilePath: string, content: string): Promise<void> {
        return new Promise((resolve) => {
            const postData = JSON.stringify({
                targetUserId: clientUsername,
                filePath: originalFilePath,
                content
            });

            const opts: http.RequestOptions = {
                hostname: this._connHost,
                port: this._connPort,
                path: '/api/collab/save-file',
                method: 'POST',
                headers: {
                    ...this._getAuthHeaders(),
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = http.request(opts, (res) => {
                let body = '';
                res.on('data', d => body += d);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(body);
                        if (parsed.success) {
                            vscode.window.showInformationMessage(`[SYNAPSE] 원격 저장 성공: ${originalFilePath}`);
                        } else {
                            vscode.window.showErrorMessage(`[SYNAPSE] 원격 저장 실패: ${parsed.error}`);
                        }
                    } catch (e) {
                        vscode.window.showErrorMessage(`[SYNAPSE] 원격 저장 응답 파싱 실패`);
                    }
                    resolve();
                });
            });

            req.on('error', (err) => {
                vscode.window.showErrorMessage(`[SYNAPSE] 원격 저장 요청 실패: ${err.message}`);
                resolve();
            });

            req.write(postData);
            req.end();
        });
    }

    private async handleReadFile(filePath: string, clientUsername?: string) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        // [v0.3.30] SSE On-demand File Fetch
        if (clientUsername && clientUsername !== this._connUsername && this._connHost) {
            try {
                Logger.info(`[CanvasPanel] Requesting file content '${filePath}' from client '${clientUsername}' via SSE...`);
                
                const content = await this._requestFileViaSSE(clientUsername, filePath);
                if (content !== null) {
                    this._panel.webview.postMessage({
                        command: 'fileContent',
                        filePath: filePath,
                        content: content
                    });
                    return;
                }
            } catch (e: any) {
                Logger.error(`[CanvasPanel] SSE Read Fetch failed: ${e.message}`, e);
                this._panel.webview.postMessage({
                    command: 'fileContent',
                    filePath: filePath,
                    error: `Failed to fetch file from client: ${e.message}`
                });
                return; // Do not fallback to MountManager for cross-client files
            }
        }

        const fileUri = this._resolveFileUri(workspaceFolder.uri, filePath, clientUsername);
        if (!fileUri) {
            this._panel.webview.postMessage({
                command: 'fileContent',
                filePath: filePath,
                error: `Security error: Path access denied.`
            });
            return;
        }

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

    // [v0.3.30] Collaboration Server
    private _serverPort: number = parseInt(process.env.SYNAPSE_PORT || '3000', 10);
    private _serverBindHost: string = '0.0.0.0';
    private get _internalApiHost(): string { return this._serverBindHost === '0.0.0.0' ? '127.0.0.1' : this._serverBindHost; }
    private _pendingUsername: string = '';
    private _pendingPassword: string = '';

    private async handleStartServer(host?: string, port?: number, username?: string, password?: string): Promise<void> {
        if (host) {
            this._serverBindHost = host;
        }
        if (port && port >= 1024 && port <= 65535) {
            this._serverPort = port;
        }
        this._pendingUsername = username || '';
        this._pendingPassword = password || '';

        if (this._serverProcess && !this._serverProcess.killed) {
            await this._onServerReady();
            return;
        }

        // _startServerProcess()가 4단계 탐색 (attach → attach → kill → spawn) 수행
        await this._startServerProcess();
    }

    private _restartServerProcess(): void {
        this._externalServer = false;
        this._panel.webview.postMessage({ command: 'serverStatus', text: '🔄 구버전 서버를 새 버전으로 재시작 중...' });
        cp.execFile('pkill', ['-f', 'standalone.js'], () => {
            setTimeout(() => this._startServerProcess(), 1500);
        });
    }

    private async _startServerProcess(): Promise<void> {
        this._externalServer = false;
        this._isServerOwner = true;

        // ① _serverPort(3000) 직접 탐색
        const serverInfo = await this._readServerInfo();
        if (await this._discoverExistingServer(this._serverPort, serverInfo?.adminSecret)) {
            Logger.info(`[Collaboration Server] Reusing server on port ${this._serverPort}`);
            this._panel.webview.postMessage({ command: 'serverStarted', port: this._serverPort });
            await this._onServerReady();
            return;
        }

        // ② .server_info의 다른 포트 탐색
        if (serverInfo?.port && serverInfo.port !== this._serverPort) {
            const attachedPort = serverInfo.port;
            if (await this._discoverExistingServer(attachedPort, serverInfo.adminSecret)) {
                Logger.info(`[Collaboration Server] Reusing server on port ${attachedPort}`);
                this._panel.webview.postMessage({ command: 'serverStarted', port: attachedPort });
                await this._onServerReady();
                return;
            }
        }

        // ③ .server_info 기반 kill
        await this._killServerFromServerInfo();

        // ④ 새 서버 생성
        await this._spawnNewServer();
    }

    // ping + admin auth로 기존 서버 탐색 (attach)
    private async _discoverExistingServer(port: number, adminSecret?: string): Promise<boolean> {
        try {
            const pingResult = await this._pingServer(port);
            if (!pingResult.ok) return false;

            const serverInfo = await this._readServerInfo();
            if (serverInfo?.projectUUID && pingResult.projectUUID !== serverInfo.projectUUID) {
                Logger.warn(`[Collaboration Server] UUID mismatch on port ${port}: expected ${serverInfo.projectUUID}, got ${pingResult.projectUUID}`);
            }

            const secret = adminSecret || serverInfo?.adminSecret || '';
            const token = await this._authenticateAdmin(port, secret);
            if (!token) return false;

            this._sessionToken = token;
            this._adminSecret = secret;
            this._serverPort = port;
            this._connHost = 'localhost';
            this._connPort = port;
            this._connUserId = '_server_admin_';
            this._connUsername = 'Server Admin';
            this._isServerOwner = true;
            return true;
        } catch {
            return false;
        }
    }

    // .server_info 기반 다른 포트의 서버 kill
    private async _killServerFromServerInfo(): Promise<void> {
        const serverInfo = await this._readServerInfo();
        if (!serverInfo?.pid || !serverInfo?.port) return;
        if (serverInfo.port === this._serverPort) return;

        const targetPort = serverInfo.port;
        const targetUUID = serverInfo.projectUUID;

        let serverAlive = false;
        try {
            const pingResult = await this._pingServer(targetPort);
            if (pingResult.ok && pingResult.projectUUID === targetUUID) serverAlive = true;
        } catch {}

        if (!serverAlive) return;

        Logger.info(`[Collaboration Server] Killing server PID=${serverInfo.pid} port=${targetPort} uuid=${targetUUID}`);
        try { process.kill(serverInfo.pid, 'SIGTERM'); } catch {}

        await this._waitForProcessExit(serverInfo.pid);
        try {
            process.kill(serverInfo.pid, 0);
            process.kill(serverInfo.pid, 'SIGKILL');
            Logger.warn(`[Collaboration Server] SIGKILL sent to PID ${serverInfo.pid}`);
            await new Promise(r => setTimeout(r, 500));
        } catch {}

        const freed = await this._waitForPortFree(targetPort);
        if (!freed) {
            Logger.warn(`[Collaboration Server] Port ${targetPort} not freed after kill, spawn may fallback`);
        }
    }

    // 프로세스 종료 대기 (최대 3초)
    private _waitForProcessExit(pid: number): Promise<void> {
        return new Promise((resolve) => {
            let elapsed = 0;
            const check = () => {
                try { process.kill(pid, 0); } catch { resolve(); return; }
                elapsed += 500;
                if (elapsed >= 3000) { resolve(); return; }
                setTimeout(check, 500);
            };
            setTimeout(check, 500);
        });
    }

    // 포트 해제 대기 (최대 5초, boolean 반환)
    private _waitForPortFree(port: number): Promise<boolean> {
        const net = require('net');
        const deadline = Date.now() + 5000;
        return new Promise((resolve) => {
            const attempt = () => {
                if (Date.now() > deadline) {
                    Logger.warn(`[Collaboration Server] Port ${port} still occupied after 5s`);
                    resolve(false);
                    return;
                }
                const tester = net.createServer();
                tester.once('error', () => {
                    try { tester.close(); } catch {}
                    setTimeout(attempt, 500);
                });
                tester.once('listening', () => {
                    tester.close(() => resolve(true));
                });
                tester.listen(port, '127.0.0.1');
            };
            attempt();
        });
    }

    private async _spawnNewServer(): Promise<void> {
        const workspaceRoot = this._workspaceFolder ? this._workspaceFolder.uri.fsPath : this._extensionUri.fsPath;
        // [SYN-SEC-040] 안전한 프로세스 종료 (pkill 정규식 범위 축소 및 PID 기반 종료)
        const serverInfoPath = path.join(workspaceRoot, 'data', '.server_info');
        if (fs.existsSync(serverInfoPath)) {
            try {
                const info = JSON.parse(fs.readFileSync(serverInfoPath, 'utf-8'));
                if (info && info.pid) {
                    process.kill(info.pid, 'SIGTERM');
                }
            } catch (e) {
                // Fallback: strict pkill
                await new Promise<void>((resolve) => {
                    cp.execFile('pkill', ['-f', `node.*standalone\\.js.*--port ${this._serverPort}`], { timeout: 3000 }, () => resolve());
                });
            }
        } else {
            await new Promise<void>((resolve) => {
                cp.execFile('pkill', ['-f', `node.*standalone\\.js.*--port ${this._serverPort}`], { timeout: 3000 }, () => resolve());
            });
        }
        await new Promise(r => setTimeout(r, 500));

        const serverPath = path.join(
            this._extensionUri.fsPath,
            'dist',
            'server',
            'standalone.js'
        );

        if (!fs.existsSync(serverPath)) {
            vscode.window.showErrorMessage(`[SYNAPSE] Server not found: ${serverPath}`);
            this._panel.webview.postMessage({ command: 'serverError', error: `Server not found: ${serverPath}` });
            return;
        }

        const crypto = require('crypto');
        this._adminSecret = crypto.randomBytes(32).toString('hex');

        this._serverProcess = cp.spawn('node', [serverPath, '--root', workspaceRoot, '--port', String(this._serverPort), '--host', this._serverBindHost], {
            cwd: workspaceRoot,
            stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
        });

        this._serverProcess.on('message', (msg: any) => {
            if (msg && msg.type === 'READY') {
                if (msg.port) {
                    this._serverPort = msg.port;
                    this._panel.webview.postMessage({ command: 'serverPortUpdated', port: msg.port });
                }
                this._serverProcess?.send({ type: 'ADMIN_SECRET', secret: this._adminSecret });
            }
        });

        this._serverProcess.stdout?.on('data', (data: Buffer) => {
            Logger.info(`[Collaboration Server] ${data.toString().trim()}`);
        });

        this._serverProcess.stderr?.on('data', (data: Buffer) => {
            const msg = data.toString().trim();
            Logger.warn(`[Collaboration Server] ${msg}`);
            if (msg.includes('EADDRINUSE') || msg.includes('already in use') || msg.includes('listen')) {
                this._panel.webview.postMessage({ command: 'serverError', error: `포트 ${this._serverPort}가 이미 사용 중입니다. 기존 서버를 먼저 중지해주세요.` });
            }
        });

        this._serverProcess.on('error', (err: Error) => {
            Logger.error(`[Collaboration Server] Failed to start: ${err.message}`);
            this._serverProcess = null;
            this._panel.webview.postMessage({ command: 'serverError', error: err.message });
        });

        this._serverProcess.on('exit', (code: number | null) => {
            Logger.info(`[Collaboration Server] exited with code ${code}`);
            this._serverProcess = null;
            if (code !== 0 && code !== null) {
                this._panel.webview.postMessage({ command: 'serverError', error: `서버가 비정상 종료되었습니다 (exit code: ${code})` });
            } else {
                this._panel.webview.postMessage({ command: 'serverStopped' });
            }
        });

        // 서버가 준비될 때까지 health 폴링
        this._waitForServerReady();
    }

    private _waitForServerReady(): void {
        let attempts = 0;
        const poll = setInterval(async () => {
            attempts++;
            const req = http.get(`http://${this._internalApiHost}:${this._serverPort}/health`, async (res) => {
                let body = '';
                res.on('data', (c) => { body += c; });
                res.on('end', async () => {
                    try {
                        const data = JSON.parse(body);
                        if (data.status === 'ok') {
                            clearInterval(poll);
                            // 새 서버 시작 시 admin auth로 토큰 획득
                            const serverInfo = await this._readServerInfo();
                            if (serverInfo?.adminSecret) {
                                const token = await this._authenticateAdmin(this._serverPort, serverInfo.adminSecret);
                                if (token) {
                                    this._sessionToken = token;
                                    this._connHost = 'localhost';
                                    this._connPort = this._serverPort;
                                    this._connUserId = '_server_admin_';
                                    this._connUsername = 'Server Admin';
                                    this._isServerOwner = true;
                                }
                            }
                            await this._onServerReady();
                            return;
                        }
                    } catch {}
                    if (attempts >= 30) {
                        clearInterval(poll);
                        this._panel.webview.postMessage({ command: 'serverError', error: '서버가 시작되지 않았습니다.' });
                    }
                });
            });
            req.on('error', () => {
                if (attempts >= 30) {
                    clearInterval(poll);
                    this._panel.webview.postMessage({ command: 'serverError', error: '서버가 시작되지 않았습니다.' });
                }
            });
            req.setTimeout(1000, () => { req.destroy(); });
        }, 500);
    }

    private async _onServerReady(): Promise<void> {
        // _sessionToken은 _discoverExistingServer() 또는 _waitForServerReady()에서 이미 설정됨
        this._panel.webview.postMessage({
            command: 'loginResult',
            success: true,
            user: { userId: '_server_admin_', username: 'Server Admin' },
            server: { serverName: '' },
            host: 'localhost',
            port: String(this._serverPort)
        });
        // 서버 자신의 물리적 상태를 VSCode가 직접 파일 읽어서 다이렉트 주입
        // await this.sendProjectState(false, true); // [v0.3.30] Prevent UI overwrite that deletes client nodes
        this.handleGetConnectedClients();
        this._fetchClientLayers('localhost', String(this._serverPort));
        this._panel.webview.postMessage({ command: 'serverStarted', port: this._serverPort });

        // 관리자 호스트용 실시간 폴링 활성화 (Phase 1A Fix)
        this._startSSEChannel();
        this._startVersionPolling();
        // 클라이언트 접속/레이어 상태도 주기적으로 갱신 (10초 간격)
        setInterval(() => {
            this.handleGetConnectedClients();
            this._fetchClientLayers('localhost', String(this._serverPort));
        }, 10000);
    }

    private async _readServerInfo(): Promise<{port: number; pid: number; projectUUID: string; serverName: string; adminSecret?: string} | null> {
        try {
            const workspaceRoot = this._workspaceFolder ? this._workspaceFolder.uri.fsPath : this._extensionUri.fsPath;
            const filePath = path.join(workspaceRoot, 'data', '.server_info');
            if (fs.existsSync(filePath)) {
                const info = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                if (this._adminSecret) {
                    info.adminSecret = this._adminSecret; // Inject memory secret
                }
                return info;
            }
        } catch {}
        return null;
    }

    private _pingServer(port: number): Promise<{ok: boolean; projectUUID: string; serverName: string; version: string}> {
        return new Promise((resolve, reject) => {
            const req = http.get(`http://127.0.0.1:${port}/api/ping`, { timeout: 3000 }, (res) => {
                let data = '';
                res.on('data', (c) => { data += c; });
                res.on('end', () => {
                    try { resolve(JSON.parse(data)); } catch { reject(new Error('Invalid ping response')); }
                });
            });
            req.on('error', () => reject(new Error('Server not reachable')));
            req.on('timeout', () => { req.destroy(); reject(new Error('Ping timeout')); });
        });
    }

    private _authenticateAdmin(port: number, adminSecret: string): Promise<string | null> {
        return new Promise((resolve) => {
            const body = JSON.stringify({ adminSecret });
            const opts: http.RequestOptions = {
                hostname: '127.0.0.1', port, path: '/api/admin/auth', method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
                timeout: 5000,
            };
            const req = http.request(opts, (res) => {
                let data = '';
                res.on('data', (c) => { data += c; });
                res.on('end', () => {
                    try {
                        const r = JSON.parse(data);
                        resolve(r.success ? r.token : null);
                    } catch { resolve(null); }
                });
            });
            req.on('error', () => resolve(null));
            req.on('timeout', () => { req.destroy(); resolve(null); });
            req.write(body);
            req.end();
        });
    }

    private handleStopServer(): void {
        this._stopPushWatcher();
        this._stopVersionPolling();
        if (this._serverProcess && !this._serverProcess.killed) {
            this._serverProcess.kill('SIGTERM');
            return;
        }
        if (this._externalServer) {
            this._externalServer = false;
            cp.execFile('pkill', ['-f', 'standalone.js'], (err) => {
                if (err) {
                    Logger.warn(`[Collaboration Server] pkill failed: ${err.message}`);
                }
                // 서버가 실제로 중지될 때까지 폴링
                let attempts = 0;
                const poll = setInterval(() => {
                    attempts++;
                    const req = http.get(`http://${this._internalApiHost}:${this._serverPort}/health`, (res) => {
                        res.resume();
                        if (attempts >= 10) {
                            clearInterval(poll);
                            this._panel.webview.postMessage({ command: 'serverStopped' });
                        }
                    });
                    req.on('error', () => {
                        clearInterval(poll);
                        this._panel.webview.postMessage({ command: 'serverStopped' });
                    });
                    req.setTimeout(1000, () => {
                        req.destroy();
                        if (attempts >= 10) {
                            clearInterval(poll);
                            this._panel.webview.postMessage({ command: 'serverStopped' });
                        }
                    });
                }, 500);
            });
        }
    }

    private handleLogin(host: string, port: string, username: string, password: string, projectRoot?: string): void {
        const body: any = { username, password };
        if (projectRoot) body.clientProjectRoot = projectRoot;
        const data = JSON.stringify(body);
        const options: http.RequestOptions = {
            hostname: host,
            port: parseInt(port, 10),
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
            },
            timeout: 5000,
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    if (result.success && result.user && result.token) {
                        this._connHost = host;
                        this._connPort = parseInt(port, 10);
                        this._connUserId = result.user.userId || '';
                        this._connUsername = result.user.username || '';
                        this._sessionToken = result.token || null;
                        if (!result.mountSuccess) {
                            Logger.warn(`[Login] SSH mount failed: ${result.mountError || 'unknown'}`);
                        }
                        this._fetchAccountsForLayer(); // fire & forget: layer 등록
                        this._panel.webview.postMessage({
                            command: 'loginResult',
                            success: true,
                            mountSuccess: result.mountSuccess,
                            mountError: result.mountError,
                            user: result.user,
                            server: result.server
                        });
                        // 로그인 성공 후 접속자 현황
                        this.handleGetConnectedClients();
                        // 클라이언트 workspaceFolder 스캔 → 서버에 푸시
                        this._pushClientState(host, parseInt(port, 10));
                        // 자동 재푸시 watcher 시작
                        this._startPushWatcher();
                        this._fetchServerState(host, port);
                        
                        // 모든 접속자는 SSE 채널을 개방해야 함
                        this._startSSEChannel();

                        // 관리자: 클라이언트 접속 감지용 version polling
                        if (this._isServerOwner) {
                            this._startVersionPolling();
                        } else {
                            // 클라이언트도 주기적으로 접속자 현황과 레이어 가시성 정보를 갱신 (10초 간격)
                            setInterval(() => {
                                this.handleGetConnectedClients();
                                this._fetchClientLayers(host, String(port));
                            }, 10000);
                        }
                    } else {
                        this._panel.webview.postMessage({ command: 'loginResult', success: false, error: result.error || 'Login failed' });
                    }
                } catch {
                    this._panel.webview.postMessage({ command: 'loginResult', success: false, error: 'Invalid response from server' });
                }
            });
        });

        req.on('error', (err) => {
            this._panel.webview.postMessage({ command: 'loginResult', success: false, error: err.message });
        });

        req.on('timeout', () => {
            req.destroy();
            this._panel.webview.postMessage({ command: 'loginResult', success: false, error: 'Connection timeout' });
        });

        req.write(data);
        req.end();
    }

    // [v0.3.30] 로그인 후 client layer 등록을 위해 계정 목록 fetch
    private _fetchAccountsForLayer(): void {
        this.handleLoadAccounts();
    }

    // 로그인 후 서버 state를 fetch하여 webview에 전송
    private _getAuthHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'x-admin-secret': this._adminSecret || ''
        };
        if (this._sessionToken) {
            headers['Authorization'] = `Bearer ${this._sessionToken}`;
        }
        return headers;
    }

    private _fetchServerState(host: string, port: string, forceReset: boolean = true): void {
        const opts: http.RequestOptions = {
            hostname: host,
            port: parseInt(port, 10),
            path: '/api/state',
            method: 'GET',
            headers: { ...this._getAuthHeaders() },
            timeout: 5000,
        };
        const req = http.request(opts, (res) => {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    if (result.success && result.state) {
                        Logger.info(`[StateApply] nodes=${result.state.nodes?.length || 0}, edges=${result.state.edges?.length || 0}, clusters=${result.state.clusters?.length || 0}`);

                        const clientNodes = (result.state.nodes || []).filter((n: any) => n.id && n.id.startsWith("client::"));
                        console.log(`[Diagnostic] Total client:: nodes received by _fetchServerState: ${clientNodes.length}`);
                        if (clientNodes.length > 0) {
                            console.log(`[Diagnostic] First client node:`, JSON.stringify(clientNodes[0], null, 2));
                        }
                        
                        // Perspective Swap: 각자는 자신의 노드를 메인(user)으로, 남의 노드는 고스트(external)로 본다
                        if (this._connUserId) {
                            const myUserId = this._connUserId;
                            const isAdmin = myUserId === '_server_admin_';

                            for (const n of result.state.nodes || []) {
                                const ownerId = n.data?.clientLayer;
                                const isMyNode = isAdmin ? !ownerId : ownerId === myUserId;
                                
                                if (isMyNode) {
                                    n.layer = 'user';
                                } else if (ownerId && ownerId !== myUserId) {
                                    // Other client's node -> External (Ghost)
                                    n.layer = 'external';
                                    n.status = 'ghost';
                                    n.data = n.data || {};
                                    n.data.layer = 'external';
                                } else {
                                    // Server base node (!ownerId) -> Keep original layer (usually 'ai' or 'base')
                                    // Do not force it to 'external' so that the Base toggle controls it, not External.
                                }
                            }
                            
                            for (const c of result.state.clusters || []) {
                                const ownerId = c.data?.clientLayer;
                                const isMyCluster = isAdmin ? !ownerId : ownerId === myUserId;
                                
                                if (isMyCluster) {
                                    c.layer = 'user';
                                } else if (ownerId && ownerId !== myUserId) {
                                    c.layer = 'external';
                                }
                            }
                        }

                        this._panel.webview.postMessage({
                            command: 'projectState',
                            data: result.state,
                            forceReset: forceReset
                        });
                    } else {
                        Logger.warn(`[FetchState] Error: Success is false or state is missing`);
                    }
                } catch (e: any) {
                    Logger.warn(`[FetchState] Error parsing JSON: ${e.message}`);
                }
            });
        });
        req.on('error', (e) => { Logger.warn(`[FetchState] Request error: ${e.message}`); });
        req.on('timeout', () => { Logger.warn(`[FetchState] Timeout`); req.destroy(); });
        req.end();
    }

    private _fetchClientLayers(host: string, port: string): void {
        const opts: http.RequestOptions = {
            hostname: host,
            port: parseInt(port, 10),
            path: '/api/admin/connected-clients',
            method: 'GET',
            headers: { ...this._getAuthHeaders() },
            timeout: 5000,
        };
        const req = http.request(opts, (res) => {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    if (result.success && result.clients) {
                        const layers = result.clients.map((c: any) => ({
                            clientId: c.userId,
                            username: c.username
                        }));
                        if (layers.length > 0) {
                            this._panel.webview.postMessage({
                                command: 'clientLayerUpdate',
                                layers
                            });
                        }
                    }
                } catch {}
            });
        });
        req.on('error', () => {});
        req.on('timeout', () => { req.destroy(); });
        req.end();
    }

    // 클라이언트 workspaceFolder 스캔 → 서버에 푸시 (HTTP push 방식)
    private async _pushClientState(host: string, port: number): Promise<void> {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            const rootPath = workspaceFolder.uri.fsPath;
            const sourceExtensions = new Set(['.py', '.ts', '.js', '.rs', '.cpp', '.c', '.go', '.java', '.kt', '.kts', '.swift', '.tsx', '.jsx']);
            const userId = this._connUserId || 'unknown';
            const username = this._connUsername || 'unknown';
            const nodes: any[] = [];
            const edges: any[] = [];
            const clusters: any[] = [];

            // SynapseIgnore 로드 (최초 1회)
            if (!this._synapseIgnore) {
                this._synapseIgnore = new SynapseIgnore();
                this._synapseIgnore.load(rootPath);
            }

            const scanner = new FileScanner();
            const summaries: { fullPath: string; normPath: string; summary: any }[] = [];
            const clientNodeIds = new Set<string>();

            const walk = (dir: string) => {
                let entries: fs.Dirent[];
                try {
                    entries = fs.readdirSync(dir, { withFileTypes: true });
                } catch { return; }
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    const relPath = path.relative(rootPath, fullPath);
                    const normPath = relPath.replace(/[\/\\]/g, '/');
                    if (entry.name.startsWith('.') && entry.name !== '.') continue;
                    if (entry.isDirectory()) {
                        if (['node_modules', 'target', '.git', '.synapse', 'data'].includes(entry.name)) continue;
                        if (this._synapseIgnore?.isIgnored(normPath + '/')) continue;
                        clusters.push({
                            id: `client::${userId}::folder::${normPath}`,
                            label: entry.name,
                            path: normPath,
                            data: { label: entry.name, clientLayer: userId, clientUsername: username }
                        });
                        walk(fullPath);
                    } else if (entry.isFile()) {
                        if (this._synapseIgnore?.isIgnored(normPath)) continue;
                        const ext = path.extname(entry.name).toLowerCase();
                        const isSource = sourceExtensions.has(ext);
                        const parentDir = path.dirname(normPath);
                        const clusterId = parentDir === '.' ? '' : `client::${userId}::folder::${parentDir}`;
                        const nodeId = `client::${userId}::${normPath}`;
                        clientNodeIds.add(nodeId);

                        let summary: any = { classes: [], functions: [], references: [] };
                        if (isSource) {
                            summary = scanner.scanFile(fullPath);
                        }
                        summaries.push({ fullPath, normPath, summary });

                        nodes.push({
                            id: nodeId,
                            label: entry.name,
                            type: isSource ? 'file' : 'doc',
                            layer: 'user',
                            cluster_id: clusterId,
                            position: { x: 0, y: 0 }, // Assigned later deterministically
                            data: { 
                                label: entry.name, 
                                file: normPath, 
                                path: normPath, 
                                extension: ext, 
                                clientLayer: userId, 
                                clientUsername: username,
                                hasAtomicSignature: !!summary.hasAtomicSignature,
                                hasImportSignature: !!summary.hasImportSignature,
                                icon: isSource ? (summary.hasAtomicSignature ? '⚡' : '📄') : '📚'
                            }
                        });
                    }
                }
            };

            walk(rootPath);

            // [v0.3.30] 추가: project_state.json에서 manual node 가져와서 포함
            try {
                const uri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
                const data = await vscode.workspace.fs.readFile(uri);
                let projectState: any = JSON.parse(Buffer.from(data).toString('utf-8'));
                if (typeof projectState === 'string') projectState = JSON.parse(projectState);

                if (projectState && projectState.nodes) {
                    projectState.nodes.forEach((n: any) => {
                        if (n.id && n.id.startsWith('node_manual_')) {
                            // 클라이언트 레이어 정보 주입
                            const manualNode = { ...n, clientLayer: userId, data: { ...n.data, clientLayer: userId, clientUsername: username } };
                            nodes.push(manualNode);
                            clientNodeIds.add(n.id);
                        }
                    });
                }
            } catch (e) {
                Logger.warn(`[ClientPush] Failed to append manual nodes: ${e}`);
            }

            if (nodes.length === 0) return;

            // Deterministic position layout for nodes
            const clusterNodeCounts = new Map<string, number>();
            const clusterNodeIdx = new Map<string, number>();
            for (const n of nodes) {
                const cid = n.cluster_id || '__unclustered__';
                clusterNodeCounts.set(cid, (clusterNodeCounts.get(cid) || 0) + 1);
            }
            
            for (const n of nodes) {
                const cid = n.cluster_id || '__unclustered__';
                const cluster = clusters.find(c => c.id === n.cluster_id);
                const idx = clusterNodeIdx.get(cid) || 0;
                clusterNodeIdx.set(cid, idx + 1);
                
                // For client clusters, we don't have predefined positions here, so we generate a hash-based center
                let centerX = 0;
                let centerY = 0;
                if (cluster) {
                    let hash = 0x811c9dc5;
                    for (let k = 0; k < cluster.id.length; k++) { hash ^= cluster.id.charCodeAt(k); hash = Math.imul(hash, 0x01000193); }
                    const angle = ((hash >>> 0) % 1000) / 1000 * 2 * Math.PI;
                    const radius = 500 + (((hash >>> 16) % 500));
                    centerX = Math.cos(angle) * radius;
                    centerY = Math.sin(angle) * radius;
                    cluster.position = { x: centerX, y: centerY };
                }

                const total = clusterNodeCounts.get(cid) || 1;
                const cols = Math.min(3, total);
                const col = idx % cols;
                const row = Math.floor(idx / cols);
                const rows = Math.ceil(total / cols);
                n.position = {
                    x: centerX + (col - (cols - 1) / 2) * 80,
                    y: centerY + (row - rows / 2) * 50
                };
            }

            // Reference processing and Edge extraction
            for (const item of summaries) {
                const sourceId = `client::${userId}::${item.normPath}`;
                for (const ref of item.summary.references) {
                    let targetNodeId = ref.target;

                    // Attempt to resolve targetNodeId to an existing client node
                    if (!clientNodeIds.has(targetNodeId)) {
                        const matchedId = Array.from(clientNodeIds).find(id => {
                            const nodeStem = path.basename(id, path.extname(id)).toLowerCase();
                            const targetStem = path.basename(targetNodeId, path.extname(targetNodeId)).toLowerCase();
                            return nodeStem === targetStem;
                        });
                        if (matchedId) targetNodeId = matchedId;
                    }

                    // If still unresolved, create a ghost node
                    if (!clientNodeIds.has(targetNodeId)) {
                        const lowerId = targetNodeId.toLowerCase();
                        const ghostBlacklist = ['os', 'sys', 'math', 'json', 'datetime', 'vscode', 'path', 'fs'];
                        const isBlacklisted = ghostBlacklist.some(b => lowerId === b || lowerId.startsWith(b + '.'));
                        if (isBlacklisted) continue;

                        const isDocRef = targetNodeId.toLowerCase().endsWith('.md');
                        const isExternal = ref.type === 'api_call' || !targetNodeId.includes('.');
                        const ghostClusterId = isDocRef ? 'doc_shelf' : (isExternal ? 'cluster_ghosts' : 'sys_cluster_reserved');
                        const ghostId = `client::${userId}::ghost::${targetNodeId}`;

                        const ghostNode = {
                            id: ghostId,
                            label: targetNodeId,
                            type: isDocRef ? 'doc' : (isExternal ? 'external' : 'symbol'),
                            layer: 'external',
                            cluster_id: ghostClusterId,
                            status: 'ghost',
                            position: { x: isDocRef ? 2000 : -2000, y: (Math.random() - 0.5) * 1000 },
                            data: {
                                label: targetNodeId,
                                clientLayer: userId,
                                clientUsername: username,
                                icon: isDocRef ? '📚' : (isExternal ? '☁️' : '👻')
                            }
                        };
                        nodes.push(ghostNode);
                        clientNodeIds.add(ghostId);
                        targetNodeId = ghostId;
                    }

                    edges.push({
                        id: crypto.randomUUID(),
                        from: sourceId,
                        to: targetNodeId,
                        type: ref.type,
                        weight: 1,
                        status: 'confirmed',
                        is_approved: true,
                        data: { clientLayer: userId, clientUsername: username }
                    });
                }
            }

            if (nodes.length === 0) return;

            const body = JSON.stringify({ nodes, edges, clusters });
            const opts: http.RequestOptions = {
                hostname: host,
                port,
                path: '/api/client/push',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                    ...this._getAuthHeaders()
                },
                timeout: 10000,
            };
            const req = http.request(opts, (res) => {
                let data = '';
                res.on('data', (c) => { data += c; });
                res.on('end', () => {
                    try {
                        const r = JSON.parse(data);
                        if (r.success) {
                            Logger.info(`[ClientPush] Pushed ${r.nodeCount} nodes from ${username} (${userId})`);
                        }
                    } catch {}
                });
            });
            req.on('error', (err) => { Logger.warn(`[ClientPush] Failed: ${err.message}`); });
            req.on('timeout', () => { req.destroy(); });
            req.write(body);
            req.end();
            if (!this._pushInFlight) {
                this._pushClientState(this._connHost, this._connPort);
            }
        } catch (err: any) {
            Logger.warn(`[ClientPush] Scan failed: ${err.message}`);
        }
    }

    private async _pushDiagnostics() {
        if (!this._sessionToken || !this._connHost) return;

        const allDiags = vscode.languages.getDiagnostics();
        const diagnostics: any[] = [];
        const workspacePath = this._workspaceFolder.uri.fsPath;

        for (const [uri, diags] of allDiags) {
            // Only care about files in this workspace
            if (uri.fsPath.startsWith(workspacePath)) {
                let relativePath = vscode.workspace.asRelativePath(uri, false);
                relativePath = relativePath.replace(/\\/g, '/');
                for (const diag of diags) {
                    diagnostics.push({
                        relativePath,
                        severity: diag.severity,
                        message: diag.message,
                        line: diag.range.start.line,
                        source: diag.source
                    });
                }
            }
        }

        const hashPayload = JSON.stringify(diagnostics);
        const hash = require('crypto').createHash('sha256').update(hashPayload).digest('hex');

        if (hash === this._lastDiagnosticHash) {
            return; // No changes
        }

        const data = JSON.stringify({ hash, diagnostics });
        const opts: http.RequestOptions = {
            hostname: this._connHost,
            port: this._connPort || 3000,
            path: '/api/client/diagnostics',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                ...this._getAuthHeaders()
            },
            timeout: 5000,
        };

        const req = http.request(opts, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    if (result.success && result.updated) {
                        this._lastDiagnosticHash = hash;
                        Logger.info(`[Diagnostics] Pushed ${diagnostics.length} diagnostics successfully.`);
                    }
                } catch {}
            });
        });
        req.on('error', (e) => Logger.warn(`[Diagnostics] Push failed: ${e.message}`));
        req.write(data);
        req.end();
    }

    // FileSystemWatcher 시작 (자동 재푸시)
    private _startPushWatcher(): void {
        if (!this._workspaceFolder || this._pushWatcher) return;

        const pattern = new vscode.RelativePattern(this._workspaceFolder, '**/*');
        this._pushWatcher = vscode.workspace.createFileSystemWatcher(pattern);

        const scheduleRepush = (uri: vscode.Uri) => {
            const relPath = path.relative(this._workspaceFolder!.uri.fsPath, uri.fsPath);
            const normalized = relPath.replace(/[\/\\]/g, '/');

            // 무한 루프 방지
            if (normalized.startsWith('data/') || normalized.startsWith('.synapse/')) return;
            if (this._synapseIgnore?.isIgnored(normalized)) return;

            if (this._pushDebounceTimer) clearTimeout(this._pushDebounceTimer);
            this._pushDebounceTimer = setTimeout(() => {
                this._pushClientStateSafe();
            }, 3000);
        };

        this._pushWatcher.onDidCreate(scheduleRepush);
        this._pushWatcher.onDidChange(scheduleRepush);
        this._pushWatcher.onDidDelete(scheduleRepush);
        Logger.info('[ClientPush] File watcher started');
    }

    // 중복 push 방지 래퍼
    private _pushClientStateSafe(): void {
        if (this._pushInFlight) return;
        if (!this._connHost || !this._connPort) return;
        this._pushInFlight = true;
        try {
            this._pushClientState(this._connHost, this._connPort);
        } finally {
            // push는 비동기이므로 즉시 해제하지 않고 약간의 딜레이 후 해제
            setTimeout(() => { this._pushInFlight = false; }, 1000);
        }
    }

    // FileSystemWatcher 정리
    private _stopPushWatcher(): void {
        if (this._pushWatcher) {
            this._pushWatcher.dispose();
            this._pushWatcher = null;
        }
        if (this._pushDebounceTimer) {
            clearTimeout(this._pushDebounceTimer);
            this._pushDebounceTimer = null;
        }
        this._synapseIgnore = null;
        Logger.info('[ClientPush] File watcher stopped');
    }

    // 관리자 version polling (60초 간격)
    private _startVersionPolling(): void {
        if (this._versionPollTimer) return;
        this._versionPollTimer = setInterval(async () => {
            if (!this._sessionToken || !this._connHost) return;
            try {
                Logger.info(`[VersionPoll] Tick: session=${!!this._sessionToken}, host=${this._connHost}`);
                const version = await this._fetchStateVersion();
                if (version > 0 && version !== this._lastStateVersion) {
                    this._lastStateVersion = version;
                    this._fetchServerState(this._connHost, String(this._connPort), false);
                }

                if (this._isServerOwner) {
                    await this._fetchRemoteDiagnostics();
                }
            } catch (e: any) {
                Logger.warn(`[VersionPoll] Tick error: ${e.message}`);
            }
        }, 10000); // 10초 간격 (임시 — 추후 이벤트 기반으로 전환)
        Logger.info('[VersionPoll] Started (10s interval)');
    }

    private async _fetchRemoteDiagnostics() {
        if (!this._connHost) return;
        return new Promise<void>((resolve) => {
            const opts: http.RequestOptions = {
                hostname: this._connHost,
                port: this._connPort || 3000,
                path: '/api/client/diagnostics',
                method: 'GET',
                headers: { ...this._getAuthHeaders() },
                timeout: 5000,
            };
            const req = http.request(opts, (res) => {
                let body = '';
                res.on('data', c => body += c);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(body);
                        if (result.success && result.diagnostics) {
                            const store = DiagnosticsStore.getInstance();
                            for (const [userId, snap] of Object.entries(result.diagnostics)) {
                                const snapshot = snap as any;
                                store.updateSnapshot(userId, snapshot.timestamp, snapshot.diagnostics);
                            }
                        }
                    } catch {}
                    resolve();
                });
            });
            req.on('error', () => resolve());
            req.end();
        });
    }

    private _stopVersionPolling(): void {
        if (this._versionPollTimer) {
            clearInterval(this._versionPollTimer);
            this._versionPollTimer = null;
            this._lastStateVersion = 0;
            this._stopSSEChannel();
        }
    }

    private _sseReq: http.ClientRequest | null = null;

    private _startSSEChannel(): void {
        if (this._sseReq) return;
        if (!this._connHost) return;

        const opts: http.RequestOptions = {
            hostname: this._connHost,
            port: this._connPort,
            path: '/api/collab/stream',
            method: 'GET',
            headers: { ...this._getAuthHeaders() }
        };

        this._sseReq = http.request(opts, (res) => {
            this._isLocked = true;
            this._panel.webview.postMessage({ command: 'lockStateChanged', locked: true });

            let buffer = '';
            res.on('data', async (chunk) => {
                buffer += chunk.toString();
                const parts = buffer.split('\n\n');
                buffer = parts.pop() || '';

                for (const part of parts) {
                    if (part.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(part.substring(6));
                            if (data.command === 'send_file_content' && data.filePath && data.ticketId) {
                                await this._handleFileContentRequest(data.filePath, data.ticketId);
                            } else if (data.command === 'save_file_content' && data.filePath && data.content !== undefined) {
                                if (!this._isLocked) {
                                    Logger.warn(`[SSE] Rejected save_file_content for ${data.filePath} because client is unlocked`);
                                    return;
                                }
                                const absPath = vscode.Uri.joinPath(this._workspaceFolder.uri, data.filePath);
                                await vscode.workspace.fs.writeFile(absPath, Buffer.from(data.content, 'utf8'));
                                Logger.info(`[SSE] Remotely saved file: ${data.filePath}`);
                            } else if (data.command === 'request_hashes' && data.ticketId) {
                                this._handleHashesRequest(data.ticketId);
                            } else if (data.command === 'session_locked') {
                                this._isSessionLocked = data.locked;
                                this._panel.webview.postMessage({ command: 'harvestLockStateChanged', locked: data.locked });
                                if (data.locked) {
                                    vscode.window.showWarningMessage('Harvest Session is ACTIVE. Your workspace is currently LOCKED. File changes will not be synced.');
                                } else {
                                    vscode.window.showInformationMessage('Harvest Session ended. Workspace UNLOCKED.');
                                }
                            }
                        } catch (e) {
                            Logger.warn(`[SSE] Failed to parse message: ${e}`);
                        }
                    }
                }
            });

            res.on('end', () => {
                Logger.info('[SSE] Stream ended');
                this._sseReq = null;
                this._isLocked = false;
                this._panel.webview.postMessage({ command: 'lockStateChanged', locked: false });
            });
        });

        this._sseReq.on('error', (err) => {
            Logger.warn(`[SSE] Error: ${err.message}`);
            this._sseReq = null;
            this._isLocked = false;
            this._panel.webview.postMessage({ command: 'lockStateChanged', locked: false });
        });

        this._sseReq.end();
        Logger.info('[SSE] Channel opened');
    }

    private _stopSSEChannel(): void {
        if (this._sseReq) {
            this._sseReq.destroy();
            this._sseReq = null;
            Logger.info('[SSE] Channel closed');
        }
        this._isLocked = false;
        this._panel.webview.postMessage({ command: 'lockStateChanged', locked: false });
    }

    private async _handleHashesRequest(ticketId: string): Promise<void> {
        try {
            if (!this._workspaceFolder) throw new Error('Workspace folder not set');
            
            const crypto = require('crypto');
            const ruleEngine = RuleEngine.getInstance();
            ruleEngine.loadRules(this._workspaceFolder.uri.fsPath);

            const uris = await vscode.workspace.findFiles('**/*');
            const hashes: {filePath: string, hash: string}[] = [];

            for (const uri of uris) {
                const fsPath = uri.fsPath;
                if (ruleEngine.shouldIgnoreFile(fsPath)) {
                    continue;
                }

                let ignore = false;
                const parts = fsPath.split(path.sep);
                for (let i = 0; i < parts.length; i++) {
                    const currentFolder = parts.slice(0, i + 1).join(path.sep);
                    if (ruleEngine.shouldIgnoreFolder(currentFolder)) {
                        ignore = true;
                        break;
                    }
                }
                if (ignore) continue;

                try {
                    const content = fs.readFileSync(fsPath);
                    const hash = crypto.createHash('sha256').update(content).digest('hex');
                    const relPath = path.relative(this._workspaceFolder.uri.fsPath, fsPath).replace(/\\/g, '/');
                    hashes.push({ filePath: relPath, hash });
                } catch (e) {
                    // Ignore unreadable files
                }
            }

            await this._sendSSEResponse(ticketId, JSON.stringify(hashes), null);
        } catch (error: any) {
            await this._sendSSEResponse(ticketId, null, error.message);
        }
    }

    private async _handleFileContentRequest(filePath: string, ticketId: string): Promise<void> {
        try {
            if (!this._workspaceFolder) throw new Error('Workspace folder not set');
            const fullPath = path.join(this._workspaceFolder.uri.fsPath, filePath);
            if (!fs.existsSync(fullPath)) throw new Error('File not found locally');
            
            const content = fs.readFileSync(fullPath, 'utf-8');
            await this._sendSSEResponse(ticketId, content, null);
        } catch (error: any) {
            await this._sendSSEResponse(ticketId, null, error.message);
        }
    }

    private _sendSSEResponse(ticketId: string, content: string | null, error: string | null): Promise<void> {
        return new Promise((resolve) => {
            const body = JSON.stringify({ ticketId, content, error });
            const opts: http.RequestOptions = {
                hostname: this._connHost,
                port: this._connPort,
                path: '/api/collab/response',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                    ...this._getAuthHeaders()
                }
            };
            const req = http.request(opts, (res) => {
                res.on('data', () => {});
                res.on('end', () => resolve());
            });
            req.on('error', (err) => {
                Logger.warn(`[SSE] Failed to send response: ${err.message}`);
                resolve();
            });
            req.write(body);
            req.end();
        });
    }

    private _requestFileViaSSE(targetUserId: string, filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const body = JSON.stringify({ targetUserId, filePath });
            const opts: http.RequestOptions = {
                hostname: this._connHost,
                port: this._connPort,
                path: '/api/collab/request-file',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                    ...this._getAuthHeaders()
                }
            };
            const req = http.request(opts, (res) => {
                let data = '';
                res.on('data', (c) => { data += c; });
                res.on('end', () => {
                    if (res.statusCode !== 200) {
                        try {
                            const err = JSON.parse(data);
                            reject(new Error(err.error || 'Server error'));
                        } catch {
                            reject(new Error(`Server error: ${res.statusCode}`));
                        }
                    } else {
                        try {
                            const result = JSON.parse(data);
                            if (result.success) {
                                resolve(result.content);
                            } else {
                                reject(new Error(result.error));
                            }
                        } catch {
                            reject(new Error('Failed to parse response'));
                        }
                    }
                });
            });
            req.on('error', (err) => reject(err));
            req.write(body);
            req.end();
        });
    }

    private _fetchStateVersion(): Promise<number> {
        return new Promise((resolve) => {
            const opts: http.RequestOptions = {
                hostname: this._connHost,
                port: this._connPort,
                path: '/api/version',
                method: 'GET',
                headers: { ...this._getAuthHeaders() },
                timeout: 3000,
            };
            const req = http.request(opts, (res) => {
                let data = '';
                res.on('data', (c) => { data += c; });
                res.on('end', () => {
                    try {
                        const r = JSON.parse(data);
                        Logger.info(`[FetchVersion] version=${r.version}, success=${r.success}`);
                        resolve(r.success ? r.version : 0);
                    } catch (e: any) {
                        Logger.warn(`[FetchVersion] JSON parse error: ${e.message}`);
                        resolve(0);
                    }
                });
            });
            req.on('error', (e) => {
                Logger.warn(`[FetchVersion] Request error: ${e.message}`);
                resolve(0);
            });
            req.on('timeout', () => {
                Logger.warn(`[FetchVersion] Timeout`);
                req.destroy();
                resolve(0);
            });
            req.end();
        });
    }

    private async handleCreateAccount(message: any): Promise<void> {
        const { username, password } = message;
        if (!username || !password) {
            this._panel.webview.postMessage({ command: 'createAccountResult', success: false, error: 'Username and password required' });
            return;
        }
        if (!await this._ensureServerReady('createAccountResult')) return;
        const body = JSON.stringify({ username, password });
        const opts: http.RequestOptions = {
            hostname: this._internalApiHost, port: this._serverPort, path: '/api/admin/create-account', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...this._getAuthHeaders() },
            timeout: 5000,
        };
        this._httpRequest(opts, body, 'createAccountResult');
    }

    private async handleHarvestStart(message: any): Promise<void> {
        if (!await this._ensureServerReady('harvestResult')) return;
        const body = JSON.stringify({ visibleClientIds: message.visibleClientIds });
        const opts: http.RequestOptions = {
            hostname: this._internalApiHost, port: this._serverPort, path: '/api/harvest/start', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...this._getAuthHeaders() },
            timeout: 5000,
        };
        this._httpRequest(opts, body, 'harvestStartResult');
    }

    private async handleHarvestCompare(message: any): Promise<void> {
        if (!await this._ensureServerReady('harvestResult')) return;
        const body = JSON.stringify({ visibleClientIds: message.visibleClientIds });
        const opts: http.RequestOptions = {
            hostname: this._internalApiHost, port: this._serverPort, path: '/api/harvest/compare', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...this._getAuthHeaders() },
            timeout: 10000,
        };
        this._httpRequest(opts, body, 'harvestCompareResult');
    }

    private async handleHarvestExecute(message: any): Promise<void> {
        if (!await this._ensureServerReady('harvestResult')) return;
        const candidates = message.candidates || [];
        const body = JSON.stringify({ candidates }); 
        const opts: http.RequestOptions = {
            hostname: this._internalApiHost, port: this._serverPort, path: '/api/harvest/execute', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...this._getAuthHeaders() },
            timeout: 15000,
        };
        this._httpRequest(opts, body, 'harvestExecuteResult');
    }

    private async handleDeleteAccount(message: any): Promise<void> {
        const { username } = message;
        if (!username) {
            this._panel.webview.postMessage({ command: 'deleteAccountResult', success: false, error: 'Username required' });
            return;
        }
        if (!await this._ensureServerReady('deleteAccountResult')) return;
        const body = JSON.stringify({ username });
        const opts: http.RequestOptions = {
            hostname: this._internalApiHost, port: this._serverPort, path: '/api/admin/delete-account', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...this._getAuthHeaders() },
            timeout: 5000,
        };
        this._httpRequest(opts, body, 'deleteAccountResult');
    }

    private async handleLoadAccounts(_message?: any): Promise<void> {
        if (!await this._ensureServerReady('accountListResult')) return;
        const opts: http.RequestOptions = {
            hostname: this._internalApiHost, port: this._serverPort, path: '/api/admin/accounts', method: 'GET',
            headers: { ...this._getAuthHeaders() }, timeout: 5000,
        };
        this._httpRequest(opts, undefined, 'accountListResult');
    }

    private async handleChangePassword(message: any): Promise<void> {
        const { username, newPassword } = message;
        if (!username || !newPassword) {
            this._panel.webview.postMessage({ command: 'changePasswordResult', success: false, error: 'Username and newPassword required' });
            return;
        }
        if (!await this._ensureServerReady('changePasswordResult')) return;
        const body = JSON.stringify({ username, newPassword });
        const opts: http.RequestOptions = {
            hostname: this._internalApiHost, port: this._serverPort, path: '/api/admin/change-password', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...this._getAuthHeaders() },
            timeout: 5000,
        };
        this._httpRequest(opts, body, 'changePasswordResult');
    }

    private async _ensureServerReady(resultCommand: string): Promise<boolean> {
        // health check로 서버 생존 확인 (프로세스 참조와 무관)
        try {
            await this._healthCheck();
            return true;
        } catch {
            // health check 실패 시 프로세스 참조도 초기화
            this._serverProcess = null;
            this._panel.webview.postMessage({ command: resultCommand, success: false, error: '서버가 실행 중이 아닙니다. 먼저 서버를 시작하세요.' });
            return false;
        }
    }

    private _healthCheck(): Promise<void> {
        return new Promise((resolve, reject) => {
            const req = http.get(`http://${this._internalApiHost}:${this._serverPort}/health`, { timeout: 3000 }, (res) => {
                res.resume();
                if (res.statusCode === 200) resolve();
                else reject(new Error('Health check failed'));
            });
            req.on('error', () => reject(new Error('Server not reachable')));
            req.on('timeout', () => { req.destroy(); reject(new Error('Health check timeout')); });
        });
    }

    private _httpRequest(opts: http.RequestOptions, body: string | undefined, resultCommand: string): void {
        const req = http.request(opts, (res) => {
            let data = '';
            res.on('data', (c) => { data += c; });
            res.on('end', () => {
                try {
                    const r = JSON.parse(data);
                    this._panel.webview.postMessage({ command: resultCommand, ...r });
                } catch {
                    this._panel.webview.postMessage({ command: resultCommand, success: false, error: 'Invalid response' });
                }
            });
        });
        req.on('error', (e) => this._panel.webview.postMessage({ command: resultCommand, success: false, error: e.message }));
        req.on('timeout', () => { req.destroy(); this._panel.webview.postMessage({ command: resultCommand, success: false, error: 'Timeout' }); });
        if (body) req.write(body);
        req.end();
    }

    private handleServerInfo(host: string, port: string): void {
        const opts: http.RequestOptions = {
            hostname: host,
            port: parseInt(port, 10),
            path: '/api/server/info',
            method: 'GET',
            headers: { ...this._getAuthHeaders() },
            timeout: 5000,
        };
        const req = http.request(opts, (res) => {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    if (data.serverName) {
                        this._panel.webview.postMessage({ command: 'serverInfoResult', success: true, data });
                    } else {
                        this._panel.webview.postMessage({ command: 'serverInfoResult', success: false, error: 'Invalid server response' });
                    }
                } catch {
                    this._panel.webview.postMessage({ command: 'serverInfoResult', success: false, error: 'Invalid response' });
                }
            });
        });
        req.on('error', (e) => this._panel.webview.postMessage({ command: 'serverInfoResult', success: false, error: e.message }));
        req.on('timeout', () => { req.destroy(); this._panel.webview.postMessage({ command: 'serverInfoResult', success: false, error: 'Timeout' }); });
        req.end();
    }

    private async handleLogout(): Promise<void> {
        if (!this._sessionToken || !this._connHost) {
            this._panel.webview.postMessage({ command: 'logoutResult', success: true });
            return;
        }
        const opts: http.RequestOptions = {
            hostname: this._connHost,
            port: this._connPort,
            path: '/api/auth/logout',
            method: 'POST',
            headers: { ...this._getAuthHeaders() },
            timeout: 5000,
        };
        const req = http.request(opts, (res) => {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => {
                this._sessionToken = null;
                this._connUserId = '';
                this._connUsername = '';
                this._stopPushWatcher();
                this._stopVersionPolling();
                this._panel.webview.postMessage({ command: 'logoutResult', success: true });
            });
        });
        req.on('error', () => {
            this._sessionToken = null;
            this._connUserId = '';
            this._connUsername = '';
            this._stopPushWatcher();
            this._stopVersionPolling();
            this._panel.webview.postMessage({ command: 'logoutResult', success: true });
        });
        req.on('timeout', () => { req.destroy(); });
        req.end();
    }

    private async handleGetConnectedClients(): Promise<void> {
        if (!this._sessionToken) return;
        const opts: http.RequestOptions = {
            hostname: this._connHost || 'localhost',
            port: this._connPort || 3000,
            path: '/api/admin/connected-clients',
            method: 'GET',
            headers: { ...this._getAuthHeaders() },
            timeout: 5000,
        };
        const req = http.request(opts, (res) => {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => {
                try {
                    const r = JSON.parse(body);
                    if (r.success && r.clients) {
                        this._panel.webview.postMessage({ command: 'connectedClientsResult', clients: r.clients });
                    }
                } catch {}
            });
        });
        req.on('error', () => {});
        req.on('timeout', () => { req.destroy(); });
        req.end();
    }

    private async handleGetSessions(): Promise<void> {
        const opts: http.RequestOptions = {
            hostname: this._connHost || 'localhost',
            port: this._connPort || 3000,
            path: '/api/collab/sessions',
            method: 'GET',
            headers: { ...this._getAuthHeaders() },
            timeout: 5000,
        };
        const req = http.request(opts, (res) => {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => {
                try {
                    const r = JSON.parse(body);
                    this._panel.webview.postMessage({ command: 'sessionsResult', ...r });
                } catch {}
            });
        });
        req.on('error', () => {});
        req.on('timeout', () => { req.destroy(); });
        req.end();
    }

    public dispose() {
        if (this._saveListenerDisposable) {
            this._saveListenerDisposable.dispose();
            this._saveListenerDisposable = null;
        }
        CanvasPanel.currentPanel = undefined;

        if (this._serverProcess && !this._serverProcess.killed) {
            this._serverProcess.kill('SIGTERM');
            this._serverProcess = null;
        } else if (this._externalServer) {
            cp.execFile('pkill', ['-f', 'standalone.js']);
        }

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
    private async _getMergedState(workspaceFolder: vscode.WorkspaceFolder): Promise<any> {
        if (this._connHost) {
            return new Promise<any>((resolve) => {
                const opts = {
                    hostname: this._connHost,
                    port: this._connPort || 3000,
                    path: '/api/state',
                    method: 'GET',
                    headers: { ...this._getAuthHeaders() },
                    timeout: 5000
                };
                const req = http.request(opts, res => {
                    let body = '';
                    res.on('data', c => body += c);
                    res.on('end', () => {
                        try {
                            const result = JSON.parse(body);
                            if (result.success && result.state) {
                                resolve(result.state);
                            } else {
                                resolve(null);
                            }
                        } catch { resolve(null); }
                    });
                });
                req.on('error', () => resolve(null));
                req.end();
            }).then(async (netState) => {
                if (netState) return netState;
                const uri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
                const data = await vscode.workspace.fs.readFile(uri);
                return JSON.parse(data.toString());
            });
        }
        const uri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
        const data = await vscode.workspace.fs.readFile(uri);
        return JSON.parse(data.toString());
    }

    private async handleTestLogic() {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            const state = await this._getMergedState(workspaceFolder);

            const analyzer = new LogicAnalyzer();
            const issues = analyzer.analyze(state);
            analyzer.generateReport(issues, workspaceFolder.uri.fsPath, state.nodes);

            this._panel.webview.postMessage({
                command: 'analysisResults',
                issues: issues
            });

            vscode.window.showInformationMessage(`[SYNAPSE] Logic analysis complete. 'LOGIC_REPORT.md' generated.`);
            
            // Auto-open LOGIC_REPORT.md
            const reportUri = vscode.Uri.joinPath(workspaceFolder.uri, 'LOGIC_REPORT.md');
            try {
                const doc = await vscode.workspace.openTextDocument(reportUri);
                await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside, preview: true });
            } catch (e) {
                Logger.warn(`[SYNAPSE] Failed to open LOGIC_REPORT.md: ${e}`);
            }
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
            // 1. Get current project state (Network Merged if connected)
            const state = await this._getMergedState(workspaceFolder);

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

                // [v0.3.31] Generate and open markdown report
                const reportContent = [
                    '# SYNAPSE Virtual Debug Report',
                    '',
                    `**Generated At:** ${new Date().toLocaleString()}`,
                    `**Total Errors:** ${errorCount}`,
                    `**Total Warnings:** ${impact.reports.length - errorCount}`,
                    '',
                    '## Details',
                    ''
                ];

                const reportsByFile = new Map<string, any[]>();
                impact.reports.forEach(r => {
                    const node = state.nodes.find((n: any) => n.id === r.nodeId);
                    const file = node?.data?.file || 'Unknown File';
                    if (!reportsByFile.has(file)) reportsByFile.set(file, []);
                    reportsByFile.get(file)!.push(r);
                });

                for (const [file, reports] of reportsByFile.entries()) {
                    reportContent.push(`### ${file}`);
                    reports.forEach(r => {
                        const sevType = r.severity === vscode.DiagnosticSeverity.Error ? '❌ Error' : '⚠️ Warning';
                        reportContent.push(`- **${sevType}** (Line ${r.line + 1}): ${r.message}`);
                    });
                    reportContent.push('');
                }

                const synapseDir = vscode.Uri.joinPath(workspaceFolder.uri, '.synapse');
                try {
                    await vscode.workspace.fs.stat(synapseDir);
                } catch {
                    await vscode.workspace.fs.createDirectory(synapseDir);
                }

                const reportUri = vscode.Uri.joinPath(synapseDir, 'virtual_debug_report.md');
                await vscode.workspace.fs.writeFile(reportUri, Buffer.from(reportContent.join('\n'), 'utf8'));

                // Open in split view
                const doc = await vscode.workspace.openTextDocument(reportUri);
                await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside, preview: true });

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

        // [v0.3.32.4] False Positive Fix: Skip graph array checks if it is a Workspace State object
        if (state.workspace_state && !state.nodes) {
            return true;
        }

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

        console.log('[SYNAPSE] handleCreateManualEdge received (routing to Engine):', JSON.stringify(edge, null, 2));

        try {
            // 1. 필요한 메타데이터(프로젝트 경로, 모드)를 인텐트 페이로드에 주입
            const isEditLogicMode = (this as any)._isEditLogicMode || vscode.workspace.getConfiguration('synapse').get('editLogicMode', false);
            
            // [v0.3.32] SSoT 의도 기반 처리
            const addEdgeResult = canvasEngine.dispatch('CONNECT_EDGE', {
                ...edge,
                id: edge.id || `${edge.from}->${edge.to}`,
                status: edge.status || 'pending_confirm',
                is_approved: false, // 수동 엣지는 일단 pending 상태 유지
                projectRoot: workspaceFolder.uri.fsPath,
                isEditLogicMode: isEditLogicMode
            });

            if (!addEdgeResult.ok) {
                Logger.warn(`[CanvasPanel] CONNECT_EDGE intent blocked: ${addEdgeResult.verdict.reasons?.join(', ')}`);
                vscode.window.showErrorMessage(`[SYNAPSE] 연결 실패: ${addEdgeResult.verdict.reasons?.join(', ')}`);
                return;
            }

            // 2. 확정된 최종 상태(Snapshot)를 로컬 디스크에 저장 (Persistence)
            const finalState = canvasEngine.getFinalSnapshot();
            await this.handleSaveState(finalState);
            console.log('[SYNAPSE] Manual edge persisted successfully via StateManager.');

            // 3. RenderProtocol (단일 Edge 및 관련된 갱신만 UI로 브로드캐스트)
            // (낙관적 UI 업데이트가 제거되었으므로 여기서만 UI 렌더링 지시)
            this._panel.webview.postMessage({
                command: 'updateEdge',
                data: {
                    id: edge.id || `${edge.from}->${edge.to}`,
                    updates: edge
                }
            });
            // Buffer에서 Reserved로 이동한 노드에 대한 브로드캐스트
            this._panel.webview.postMessage({ command: 'updateNode', data: { id: edge.from, updates: { cluster_id: 'sys_cluster_reserved' } }});
            this._panel.webview.postMessage({ command: 'updateNode', data: { id: edge.to, updates: { cluster_id: 'sys_cluster_reserved' } }});

            let notificationMsg = `Edge connected: ${edge.type}`;
            if (isEditLogicMode) {
                notificationMsg += ` (Import code updated)`;
            }
            vscode.window.setStatusBarMessage(notificationMsg, 5000);

        } catch (error) {
            console.error('[SYNAPSE] Failed to execute manual edge transaction:', error);
            vscode.window.showErrorMessage(`Failed to connect edge: ${error}`);
        }
    }

    // [v0.2.17] Handle edge confirmation request: show warning dialog, apply import to source
    private async handleRequestDeleteEdgeSource(edgeId: string, fromFile: string | null, toFile: string | null) {
        const choice = await vscode.window.showWarningMessage(
            `[SYNAPSE] 진짜로 소스 코드에서 연결을 끊으시겠습니까?\n\n` +
            `소스의 import 구문이 완전히 삭제(주석 처리)됩니다.\n` +
            `⚠️ 이 작업은 되돌릴 수 없습니다.`,
            { modal: true },
            '💣 삭제 (파괴적)', '❌ 취소'
        );

        if (choice !== '💣 삭제 (파괴적)') {
            this._panel.webview.postMessage({ command: 'edgeDeletedSource', edgeId, success: false });
            return;
        }

        await this.handleDeleteEdge(edgeId, fromFile, toFile);
    }

    private async handleDeleteEdge(edgeId: string, fromFile: string | null = null, toFile: string | null = null) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            // 1. Dispatch DELETE_EDGE Intent
            const parts = edgeId.split('->');
            if (parts.length !== 2) {
                console.error('[SYNAPSE] Invalid edgeId format for deletion:', edgeId);
                return;
            }

            const from = parts[0];
            const to = parts[1];
            const isEditLogicMode = (this as any)._isEditLogicMode || vscode.workspace.getConfiguration('synapse').get('editLogicMode', false);

            const result = canvasEngine.dispatch('DELETE_EDGE', { 
                id: edgeId,
                from, 
                to,
                fromFile,
                toFile,
                projectRoot: workspaceFolder.uri.fsPath,
                isEditLogicMode: isEditLogicMode
            });

            if (!result.ok) {
                vscode.window.showErrorMessage(`[SYNAPSE] Edge deletion blocked: ${result.verdict.reasons?.join(', ')}`);
                this._panel.webview.postMessage({ command: 'edgeDeletedSource', edgeId, success: false });
                return;
            }

            // 2. Persistence
            const finalState = canvasEngine.getFinalSnapshot();
            await this.handleSaveState(finalState);

            // 3. UI 갱신 브로드캐스트
            this._panel.webview.postMessage({ command: 'edgeDeletedSource', edgeId, success: true });
            this._panel.webview.postMessage({ command: 'deleteEdge', id: edgeId });
            
            vscode.window.setStatusBarMessage(`Edge deleted via pipeline`, 3000);
            await this.handleTakeSnapshot({ label: `Auto Backup (After Edge Deletion)` });

        } catch (error) {
            console.error('Failed to execute edge deletion transaction:', error);
            vscode.window.showErrorMessage(`Failed to delete edge: ${error}`);
            this._panel.webview.postMessage({ command: 'edgeDeletedSource', edgeId, success: false });
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
                    const nodeLabel = node.label || (node.data && node.data.label);
                    if (nodeLabel) {
                        const cleanLabel = nodeLabel.replace(/^[📄📁]\s*/, '');
                        deletedNodeLabels.push(cleanLabel);
                    }
                    const effectivePath = node.filePath || (node.data && (node.data.file || node.data.filePath));
                    if (effectivePath) {
                        filesToDelete.push(effectivePath);
                    }
                }
                
                // Dispatch Intent
                const result = canvasEngine.dispatch('DELETE_NODE', { id });
                if (result.ok) deletedCount++;
            }

            // 🔥 [IMMEDIATE REACTION] 노드 삭제를 엔진에 반영한 직후 즉시 화면 갱신
            // await this.sendProjectState(false, true); // [v0.3.30] Prevent UI overwrite that deletes client nodes

            // 2. Persistence
            const rawSnap = canvasEngine.getRawSnapshot();
            projectState.nodes = Object.values(rawSnap.nodes).filter((n: any) => !n.id.startsWith('client::'));
            projectState.edges = Object.values(rawSnap.edges).filter((e: any) => !(e.id.startsWith('edge_client::') || e.from.startsWith('client::') || e.to.startsWith('client::')));
            projectState.clusters = (rawSnap.clusters || []).filter((c: any) => !c.id.startsWith('client::'));
            projectState.deletedNodeIds = rawSnap.deletedNodeIds || [];
            projectState.deletedPaths = rawSnap.deletedPaths || [];
            
            const finalNormalizedJson = JSON.stringify(projectState, null, 2);
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
                                const fileUri = path.isAbsolute(relPath) ? vscode.Uri.file(relPath) : vscode.Uri.joinPath(workspaceFolder.uri, relPath);
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
            // await this.sendProjectState(false, true); // [v0.3.30] Prevent UI overwrite that deletes client nodes
        } catch (e) {
            vscode.window.showErrorMessage(`[SYNAPSE] 확정 실패: ${e}`);
        } finally {
            this._isProcessingConfirm = false;
        }
    }


    private async handleResetProjectState() {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        const confirm = await vscode.window.showWarningMessage(
            '🔄 project_state.json을 빈 상태로 초기화하시겠습니까?\n\n노드, 엣지, 클러스터 등 저장된 모든 캔버스 상태가 삭제됩니다.\n(소스 코드는 변경되지 않습니다.)',
            { modal: true },
            '초기화'
        );

        if (confirm !== '초기화') {
            return;
        }

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
        canvasEngine.loadInitialState(emptyState);
        Logger.info('[CanvasPanel] STEP 2: Memory Flush complete.');

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
                        clientLayer: this._isServerOwner ? undefined : this._connUserId,
                        clientUsername: this._isServerOwner ? undefined : this._connUsername,
                        data: {
                            ...pn.data,
                            layer: 'user',
                            clientLayer: this._isServerOwner ? undefined : this._connUserId,
                            clientUsername: this._isServerOwner ? undefined : this._connUsername
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

    private _sendClientPositionUpdates(updates: any[]) {
        if (!this._connHost || !this._serverPort) return;
        
        const payload = JSON.stringify({ updates });
        const opts = {
            hostname: this._connHost,
            port: this._serverPort,
            path: '/api/client/position',
            method: 'POST',
            headers: {
                ...this._getAuthHeaders(),
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            },
            timeout: 5000,
        };

        const req = http.request(opts, (res) => {
            let body = '';
            res.on('data', (c) => { body += c; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    Logger.info(`[CanvasPanel] Sent ${updates.length} client position updates.`);
                } else {
                    Logger.warn(`[CanvasPanel] Failed to send position updates: HTTP ${res.statusCode}`);
                }
            });
        });

        req.on('error', (e) => Logger.error(`[CanvasPanel] HTTP Error sending position updates`, e));
        req.write(payload);
        req.end();
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

            // 2. [v0.3.11] Clusters & Nodes Bridge
            if (newState.clusters && Array.isArray(newState.clusters)) {
                for (const uiCluster of newState.clusters) {
                    // [v0.3.27] Dynamically resolve cluster layer: scanned folders and system clusters are 'ai', others are 'user'
                    const isScanFolder = uiCluster.id.startsWith('cluster_') && !/^\d+$/.test(uiCluster.id.replace('cluster_', ''));
                    const isSystemAI = uiCluster.id === 'sys_cluster_reserved' || uiCluster.id === 'doc_shelf';
                    const isExternal = uiCluster.id === 'cluster_ghosts';
                    const defaultLayer = isExternal ? 'external' : ((isScanFolder || isSystemAI) ? 'ai' : 'user');

                    // Sync cluster structure to engine if not already present
                    canvasEngine.dispatch('ADD_CLUSTER', {
                        id: uiCluster.id,
                        label: uiCluster.label,
                        type: uiCluster.type || 'folder',
                        position: uiCluster.position, // [v0.3.11 Fix] Preserving cluster positions
                        collapsed: uiCluster.collapsed,
                        data: {
                            ...(uiCluster.data || {}),
                            layer: (uiCluster.data && uiCluster.data.layer) || defaultLayer
                        }
                    });
                }
            }

            // 1. Dispatch UPDATE_NODE for each node with a new position, cluster, and layer info
            // [v0.3.11] 🛡️ Hybrid Support: Handle both Array (UI) and Object (Internal Snapshot)
            const incomingNodes = Array.isArray(newState.nodes) ? newState.nodes : Object.values(newState.nodes || {});
            
            const positionUpdates: any[] = [];
            const now = Date.now();

            if (incomingNodes.length > 0) {
                for (const uiNode of (incomingNodes as any[])) {
                    const uiLayer = uiNode.layer || (uiNode.data && uiNode.data.layer);
                    
                    // [v0.3.15] Apply Snap-to-Grid during save (Grid Sovereignty)
                    let snappedPosition = uiNode.position;
                    if (snappedPosition) {
                        snappedPosition = gridSystem.snapToGrid(snappedPosition.x, snappedPosition.y);
                    }

                    // Phase 1B.3B: 클라이언트 노드 이동 감지 및 업데이트 큐 추가
                    const cl = uiNode.clientLayer || (uiNode.data && uiNode.data.clientLayer);
                    if (cl && snappedPosition) {
                        positionUpdates.push({
                            id: uiNode.id,
                            clientLayer: cl,
                            position: snappedPosition,
                            updatedAt: now
                        });
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

            if (positionUpdates.length > 0) {
                this._sendClientPositionUpdates(positionUpdates);
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
                nodes: finalNodesList.filter((n: any) => !n.id.startsWith('client::')),
                edges: Object.values(rawSnap.edges).filter((e: any) => !(e.id.startsWith('edge_client::') || e.from.startsWith('client::') || e.to.startsWith('client::'))),
                clusters: (rawSnap.clusters || []).filter((c: any) => !c.id.startsWith('client::')),
                deletedNodeIds: rawSnap.deletedNodeIds || [],
                deletedPaths: rawSnap.deletedPaths || []
            };

            const normalizedJson = this.normalizeProjectState(persistenceState);
            try {
                console.log(`[STATE_SAVE_START] Output path: ${projectStateUri.fsPath} (handleSaveState)`);
                console.log(`[STATE_SAVE] Nodes: ${persistenceState.nodes.length}, Edges: ${persistenceState.edges.length}`);
                await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf8'));
                console.log(`[STATE_SAVE_COMPLETE] project_state.json successfully written.`);
            } catch (err) {
                console.error(`[STATE_SAVE_ERROR] Failed to write project_state.json in handleSaveState:`, err);
            }

            console.log(`[SYNAPSE] State synchronized: ${persistenceState.nodes.length} nodes saved to disk.`);
            
            // 🔥 [v0.3.11] IMMEDIATE REACTION: Ensure UI reflects backend identity sorting (AI vs User)
            // await this.sendProjectState(false, true); // [v0.3.30] Prevent UI overwrite that deletes client nodes
        } catch (error) {
            console.error('[SYNAPSE] Failed to save state:', error);
        }
    }
    private async handleSaveWorkspace(workspaceData: any) {
        const workspaceFolder = this._workspaceFolder;
        if (!workspaceFolder) return;

        try {
            const workspaceUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'synapse_workspace.json');
            
            // Try to load existing to preserve things like graphFingerprint if only updating a subset
            let existingWorkspace: any = {
                version: 1,
                graphFingerprint: workspaceData.graphFingerprint || '',
                layout_state: {
                    version: 1,
                    nodePositions: {},
                    clusterPositions: {},
                    layerAssignments: {},
                    layers: []
                },
                workspace_state: {
                    version: 1,
                    camera: { zoom: 1.0, x: 0, y: 0 },
                    visibility: { visibleLayers: [], hiddenClusters: [] },
                    filters: {},
                    bookmarks: {}
                },
                bookmark_state: {
                    version: 1,
                    bookmarks: []
                }
            };

            try {
                const data = await vscode.workspace.fs.readFile(workspaceUri);
                const parsed = JSON.parse(Buffer.from(data).toString('utf-8'));
                existingWorkspace = { ...existingWorkspace, ...parsed };
            } catch (e) {}

            // Merge new data
            if (workspaceData.layout_state) {
                existingWorkspace.layout_state = { ...existingWorkspace.layout_state, ...workspaceData.layout_state };
            }
            if (workspaceData.workspace_state) {
                existingWorkspace.workspace_state = { ...existingWorkspace.workspace_state, ...workspaceData.workspace_state };
            }

            const normalizedJson = this.normalizeProjectState(existingWorkspace);
            await vscode.workspace.fs.writeFile(workspaceUri, Buffer.from(normalizedJson, 'utf-8'));
            // console.log(`[SYNAPSE] Workspace state synchronized to disk.`);
        } catch (error) {
            console.error('[SYNAPSE] Failed to save workspace state:', error);
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
                id: crypto.randomUUID(),
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
                    id: crypto.randomUUID(),
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
                version: 1,
                project_name: workspaceFolder.name,
                nodes: Object.values(engineSnap.nodes),
                edges: Object.values(engineSnap.edges),
                clusters: engineSnap.clusters || [],
                userCount: engineSnap.userCount,
                aiCount: engineSnap.aiCount,
                externalCount: engineSnap.externalCount
            };

            // Load Workspace / Layout State
            const workspaceUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'synapse_workspace.json');
            let synapseWorkspace: any = null;
            try {
                const wsData = await vscode.workspace.fs.readFile(workspaceUri);
                synapseWorkspace = JSON.parse(wsData.toString());
                
                // Fingerprint Verification
                const currentNodeIds = projectState.nodes.map((n:any) => n.id).sort().join(',');
                const currentFingerprint = require('crypto').createHash('sha256').update(currentNodeIds).digest('hex');
                
                if (synapseWorkspace.graphFingerprint && synapseWorkspace.graphFingerprint !== currentFingerprint) {
                    Logger.warn(`[CanvasPanel] Workspace fingerprint mismatch! Proceeding with caution.`);
                    // Send warning to UI?
                }
            } catch(e) {}
            
            projectState.synapse_workspace = synapseWorkspace;

            // [v0.3.11] 2. Boot-Sync: If Engine is new OR incomplete, load from persistence file
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            
            // [v0.3.11 HARD SSOT] Reality check: If engine is empty OR significantly differs from disk, sync it.
            try {
                const data = await vscode.workspace.fs.readFile(projectStateUri);
                const fileState = JSON.parse(data.toString());
                
                // [v0.3.21 Fix] Use RAW snapshot for count comparison to avoid infinite loop from projected view merging
                const rawEngineSnap = canvasEngine.getRawSnapshot();
                const rawNodeCount = Object.keys(rawEngineSnap.nodes).length;

                // [v0.3.32.2 FIX] If forceReset is true (e.g. after a fresh Bootstrap scan), we MUST reload from disk!
                if (forceReset || rawNodeCount === 0 || rawNodeCount < (fileState.nodes || []).length) {
                    Logger.info(`\n[CACHE] loaded_from_cache=true`);
                    Logger.info(`[CACHE] nodes=${fileState.nodes?.length || 0} edges=${fileState.edges?.length || 0}`);
                    Logger.info(`[CanvasPanel] Syncing backend engine from project_state.json (File: ${fileState.nodes?.length || 0} vs Engine: ${rawNodeCount})`);
                    canvasEngine.loadInitialState(fileState);
                    
                    // [v0.3.21.5] Force authoritative reload on initial sync
                    isAuthoritative = true; 
                    
                    const refreshedSnap = canvasEngine.getFinalSnapshot();
                    projectState.nodes = Object.values(refreshedSnap.nodes);
                    projectState.edges = Object.values(refreshedSnap.edges);
                    projectState.clusters = refreshedSnap.clusters || [];
                    projectState.userCount = refreshedSnap.userCount;
                    projectState.aiCount = refreshedSnap.aiCount;
                    projectState.externalCount = refreshedSnap.externalCount;
                }
            } catch (e) {
                Logger.info(`\n[CACHE] loaded_from_cache=false`);
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

                            try {
                                const normalizedJson = this.normalizeProjectState(finalSnap);
                                console.log(`[STATE_SAVE_START] Output path: ${projectStateUri.fsPath} (autoDiscover)`);
                                console.log(`[STATE_SAVE] Nodes: ${projectState.nodes.length}, Edges: ${projectState.edges.length}`);
                                await vscode.workspace.fs.writeFile(projectStateUri, Buffer.from(normalizedJson, 'utf-8'));
                                console.log(`[STATE_SAVE_COMPLETE] project_state.json successfully written.`);
                            } catch (writeErr) {
                                console.error(`[STATE_SAVE_ERROR] Failed to write project_state.json in autoDiscover:`, writeErr);
                            }
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

            console.log(`[FLOW_DEBUG] webview payload nodes ${projectState.nodes.length} edges ${projectState.edges.length}`);

            this._panel.webview.postMessage({
                command: 'projectState',
                data: { ...projectState, _ipcTimestamp: Date.now() }, // [v0.3.33 Phase 0] Baseline: IPC send timestamp
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
        ).toString();
        const engineCoreUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'ui', 'engine-core.js')
        ).toString();
        const webglRendererUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'ui', 'webgl-renderer.js')
        ).toString();

        const themeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'ui', 'synapse-theme.js')
        ).toString();

        // [v0.3.31] HTML Tooltip Localization
        const isKo = vscode.env.language.startsWith('ko');
        
        const translationsKo: Record<string, string> = {
            'Show all edges and badges': '모든 엣지와 뱃지 표시',
            'Hide badges, show edges': '뱃지 숨기기, 엣지만 표시',
            'Hide all edges': '모든 엣지 숨기기',
            'Fit All Nodes in View': '화면에 모든 노드 맞추기',
            'Reset Zoom/Offset': '확대/이동 상태 초기화',
            'Group Selected Nodes': '선택된 노드 그룹화',
            'Ungroup Selected Cluster': '선택된 클러스터 그룹 해제',
            'Toggle Destructive Source Editing': '파괴적 소스 편집 모드 토글',
            'Add New Node': '새 노드 추가',
            'Connect Nodes (Alt+Click)': '노드 연결 (Alt+클릭)',
            'Delete Selected Nodes/Edges': '선택된 노드/엣지 삭제',
            'Run AI-Driven Semantic Analysis': 'AI 기반 시맨틱 분석 실행',
            'Runtime Simulation Debug': '런타임 시뮬레이션 디버그',
            'Simulate Necrosis on Selection': '선택 영역 괴사 시뮬레이션',
            'Simulate Tombstone on Selection': '선택 영역 툼스톤 시뮬레이션',
            'Clear Debug Visuals': '디버그 시각 효과 초기화',
            'v0.2.28: Determinism Bootstrap': 'v0.2.28: 결정론적 부트스트랩',
            'Deep Reset: Re-scan complete project': '심층 리셋: 프로젝트 전체 재검사',
            'Toggle Edge Animations': '엣지 애니메이션 토글',
            'View Architecture Rules': '아키텍처 규칙 보기',
            'Open Master Hub (Architecture.md)': '마스터 허브 열기 (Architecture.md)',
            'Open Modular Specs': '모듈 스펙 열기',
            'Take Manual Snapshot': '수동 스냅샷 생성'
        };

        const translationsEn: Record<string, string> = {
            '서버 관리 패널을 열어 마스터 서버를 시작하거나 종료합니다.': 'Open the server management panel to start or stop the Master Server.',
            '원격 서버 관리 패널을 열어 다른 마스터 서버에 접속합니다.': 'Open the remote server management panel to connect to another Master Server.',
            '계정 관리 패널을 열어 새로운 사용자를 생성하거나 관리합니다.': 'Open the account management panel to create or manage users.',
            '로컬 머신에 시냅스 마스터 서버를 구동하여 다른 클라이언트들이 접속할 수 있도록 합니다.': 'Run the SYNAPSE Master Server on the local machine to allow clients to connect.',
            '실행 중인 마스터 서버를 강제로 종료하고 모든 클라이언트의 연결을 끊습니다.': 'Force stop the running Master Server and disconnect all clients.',
            '[수확 1단계] 현재 접속 중인 모든 클라이언트의 에디터를 락(Lock) 걸어 수정을 차단하고 수확 세션을 시작합니다.': '[Harvest Phase 1] Lock all connected clients editors to prevent modifications and start the harvest session.',
            '[수확 2단계] 레이어가 켜져 있는(가시성 ON) 클라이언트들의 로컬 파일 상태를 분석하여 마스터(서버) 레이어와의 변경점을 비교합니다.': '[Harvest Phase 2] Compare local file changes of clients with visible layers against the master server.',
            '[수확 3단계] 비교를 통해 발견된 변경된 파일들을 실제 마스터(서버) 레이어로 복사(동기화)하고 락을 해제합니다.': '[Harvest Phase 3] Sync detected changes to the master server layer and unlock editors.',
            'Context 레코딩 토글 (CTRL+ALT+M)': 'Toggle Context Recording (CTRL+ALT+M)',
            'project_state.json을 빈 상태로 초기화': 'Reset project_state.json to an empty state',
            '0.0.0.0으로 설정 시 외부망 접속이 허용됩니다 (Public Mode)': 'Setting to 0.0.0.0 allows external network access (Public Mode)'
        };

        if (isKo) {
            for (const [en, ko] of Object.entries(translationsKo)) {
                html = html.replace(`title="${en}"`, `title="${ko}"`);
            }
        } else {
            for (const [ko, en] of Object.entries(translationsEn)) {
                html = html.replace(`title="${ko}"`, `title="${en}"`);
            }
        }

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
