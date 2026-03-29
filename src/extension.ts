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
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { CanvasPanel } from './webview/CanvasPanel';
import { BootstrapEngine } from './bootstrap/BootstrapEngine';
import { LogicAnalyzer } from './core/LogicAnalyzer';
import { GeminiParser } from './core/GeminiParser';


import { client, setClient } from './client';
import { PromptLogger } from './core/PromptLogger';
import { ChatExtractor, StreamAdapter } from './utils/ChatExtractor';
import { Logger } from './utils/Logger';
import { BillingManager } from './core/BillingManager';
import { ReportExporter } from './core/ReportExporter';
import { AiOrchestrator } from './core/AiOrchestrator';
import { ArchitectureExplorerProvider } from './explorer/ArchitectureExplorer';

export async function activate(context: vscode.ExtensionContext) {
    Logger.initialize(context);
    Logger.info('Extension activation started');

    try {
        console.log('[SYNAPSE] Starting activation sequence...');
        const version = context.extension.packageJSON.version;
        vscode.window.showInformationMessage(`SYNAPSE: Initializing (v${version})...`);

        // [v0.2.20] Mandatory Principle Load
        const firstFolder = vscode.workspace.workspaceFolders?.[0];
        if (firstFolder) {
            await loadSovereignPrinciples(context, firstFolder);
        }

        // [v0.2.18.1 Monetization Lock] All monetization logic is strictly disabled
        console.log('[SYNAPSE] BillingManager initialization skipped (Lock Active)');
        // BillingManager.initialize(context);
        // BillingManager.getInstance().trackSessionStart();

        console.log('[SYNAPSE] Initializing context vault directory...');
        // 시작 시 .synapse_contexts/ 디렉터리 자동 생성
        {
            const folders = vscode.workspace.workspaceFolders;
            if (folders) {
                for (const folder of folders) {
                    const contextDir = path.join(folder.uri.fsPath, '.synapse_contexts');
                    if (!require('fs').existsSync(contextDir)) {
                        require('fs').mkdirSync(contextDir, { recursive: true });
                        console.log(`[SYNAPSE] Created .synapse_contexts: ${contextDir}`);
                    }
                }
            }
        }

        console.log('[SYNAPSE] Registering WebviewPanelSerializer...');
        if (vscode.window.registerWebviewPanelSerializer) {
            vscode.window.registerWebviewPanelSerializer('synapseCanvas', {
                async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
                    console.log(`[SYNAPSE] Reviving webview panel`);
                    // Reset the webview options so we use latest uri for `localResourceRoots`.
                    webviewPanel.webview.options = {
                        enableScripts: true,
                        localResourceRoots: [
                            vscode.Uri.joinPath(context.extensionUri, 'ui'),
                            vscode.Uri.joinPath(context.extensionUri, 'data')
                        ]
                    };
                    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                    if (workspaceFolder) {
                        CanvasPanel.revive(webviewPanel, context, workspaceFolder);
                    }
                }
            });
        }
        console.log('[SYNAPSE] WebviewPanelSerializer registered');



        console.log('[SYNAPSE] Registering synapse.openCanvas command...');
        context.subscriptions.push(
            vscode.commands.registerCommand('synapse.openCanvas', async () => {
                // [v0.2.20 Lockdown Check & Auto-Refresh]
                let workspaceFolder: vscode.WorkspaceFolder | undefined = vscode.workspace.workspaceFolders?.[0];
                if (workspaceFolder) {
                    await loadSovereignPrinciples(context, workspaceFolder);
                }

                const principles = context.globalState.get<string[]>('synapse.sovereign_principles', []);
                if (principles.length === 0) {
                    vscode.window.showInformationMessage(
                        '💡 설계 규칙을 추가하면 더 정밀한 분석이 가능합니다.',
                        'GEMINI.md 열기'
                    ).then(selection => {
                        if (selection === 'GEMINI.md 열기') {
                            vscode.commands.executeCommand('synapse.openRules');
                        }
                    });
                }

                if (vscode.window.activeTextEditor) {
                    const activeFolder = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
                    if (activeFolder) {
                        workspaceFolder = activeFolder;
                    }
                }

                if (!workspaceFolder) {
                    workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                }

                if (workspaceFolder) {
                    CanvasPanel.createOrShow(context, workspaceFolder);
                } else {
                    vscode.window.showErrorMessage('No workspace folder found to open SYNAPSE Canvas.');
                }
            })
        );

        context.subscriptions.push(
            vscode.commands.registerCommand('synapse.openRules', async () => {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (workspaceFolder) {
                    const rulesUri = vscode.Uri.joinPath(workspaceFolder.uri, 'RULES.md');
                    try {
                        await vscode.workspace.fs.stat(rulesUri);
                        const doc = await vscode.workspace.openTextDocument(rulesUri);
                        await vscode.window.showTextDocument(doc);
                    } catch (e) {
                        vscode.window.showErrorMessage('RULES.md not found in the project root.');
                    }
                }
            })
        );

        context.subscriptions.push(
            vscode.commands.registerCommand('synapse.exportReport', async () => {
                if (!CanvasPanel.currentPanel) {
                    vscode.window.showErrorMessage('Please open SYNAPSE Canvas first to generate a report.');
                    return;
                }

                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                const projectName = workspaceFolder ? workspaceFolder.name : 'Unknown Project';

                // Get active context from canvas to calculate complexity
                const canvasCtx = await CanvasPanel.currentPanel.getCanvasContext();
                const activeNodes = canvasCtx?.nodes?.length || 0;
                const activeEdges = canvasCtx?.edges?.length || 0;

                await ReportExporter.exportExecutiveSummary(context, projectName, activeNodes, activeEdges);
            })
        );

        context.subscriptions.push(
            vscode.commands.registerCommand('synapse.bootstrap', async (uri: vscode.Uri | undefined) => {
                const targetFolder = uri
                    ? vscode.workspace.getWorkspaceFolder(uri)
                    : (vscode.window.activeTextEditor
                        ? vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri)
                        : undefined)
                    ?? vscode.workspace.workspaceFolders?.[0];

                if (!targetFolder) {
                    vscode.window.showErrorMessage('Please open a folder first.');
                    return;
                }

                // uri가 직접 .md 파일을 가리키는 경우 (우클릭 컨텍스트 등) → 바로 부트스트랩
                if (uri && uri.fsPath.endsWith('.md')) {
                    await bootstrapFromGemini(uri, context);
                    return;
                }

                // 워크스페이스 루트의 .md 파일 목록 수집
                const mdFiles = await vscode.workspace.findFiles(
                    new vscode.RelativePattern(targetFolder, '*.md'),
                    '**/node_modules/**',
                    20 // 최대 20개
                );

                // QuickPick 아이템 구성
                const items: vscode.QuickPickItem[] = mdFiles.map(f => {
                    const fileName = path.basename(f.fsPath);
                    const isGemini = fileName === 'GEMINI.md';
                    return {
                        label: `$(file) ${fileName}`,
                        description: isGemini ? '기본 아키텍처 설계 문서' : '',
                        detail: vscode.workspace.asRelativePath(f),
                        // 선택 후 사용하기 위해 uri를 패키징
                        _uri: f
                    } as any;
                });

                // GEMINI.md가 있으면 맨 앞으로 정렬
                items.sort((a: any, b: any) => {
                    if (a._uri.fsPath.endsWith('GEMINI.md')) return -1;
                    if (b._uri.fsPath.endsWith('GEMINI.md')) return 1;
                    return a.label.localeCompare(b.label);
                });

                // Lite Bootstrap 옵션 항상 추가
                items.push({
                    label: '$(zap) Lite Bootstrap',
                    description: 'MD 파일 없이 프로젝트 구조 자동 탐색',
                    detail: 'GEMINI.md 없이도 파일 스캔으로 캔버스를 초기화합니다',
                    _isLite: true
                } as any);

                if (items.length === 1) {
                    // md 파일이 없고 Lite Bootstrap만 있는 경우
                    const action = await vscode.window.showInformationMessage(
                        `No .md files found in ${targetFolder.name}.`,
                        'Lite Bootstrap'
                    );
                    if (action === 'Lite Bootstrap') {
                        await liteBootstrap(context, targetFolder);
                    }
                    return;
                }

                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: `Bootstrap할 MD 파일 선택 (${targetFolder.name})`,
                    matchOnDetail: true
                }) as any;

                if (!selected) return; // 취소

                if (selected._isLite) {
                    await liteBootstrap(context, targetFolder);
                } else {
                    await bootstrapFromGemini(selected._uri, context);
                }
            })
        );


        context.subscriptions.push(
            vscode.commands.registerCommand('synapse.focusNode', (nodeId: string) => {
                if (CanvasPanel.currentPanel) {
                    CanvasPanel.currentPanel.focusNode(nodeId);
                }
            })
        );

        context.subscriptions.push(
            vscode.commands.registerCommand('synapse.fitView', () => {
                CanvasPanel.currentPanel?.fitView();
            })
        );

        context.subscriptions.push(
            vscode.commands.registerCommand('synapse.logPrompt', async (data: any) => {
                const adapter = ChatExtractor.getAdapter();
                if (!(adapter instanceof StreamAdapter)) return;

                const { sessionId, prompt, chunk, finish, workspacePath } = data;
                
                if (!sessionId && (chunk || finish)) {
                    console.warn("[SYNAPSE] Missing sessionId in logPrompt call. Skipping stream data.");
                    return;
                }

                const sid = sessionId || 'default';

                const projectRoot = workspacePath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (projectRoot && !auditLogFilePath) {
                    auditLogFilePath = promptLogger.initializeSession(projectRoot);
                }

                if (!auditLogFilePath) return;

                if (prompt) {
                    adapter.pushUser(sid, prompt);
                }
                if (chunk) {
                    adapter.pushChunk(sid, chunk);
                }
                if (finish) {
                    adapter.commitAssistant(sid);
                }
            })
        );

        // CTRL+ALT+M — 토글 레코딩 모드
        // 1번째 누름: 레코딩 시작 (입력창 없음, 상태바 표시)
        // 2번째 누름: 레코딩 종료 + git diff 자동 캡처 + .synapse_contexts/ 저장
        console.log('[SYNAPSE] Initializing PromptLogger...');
        const promptLogger = PromptLogger.getInstance();

        // 레코딩 상태
        let auditLogFilePath: string | null = null;
        let lastChatFilePos = 0;
        let currentChatFile: string | null = null;

        // [Pure Event Channel] Audit Log Initialization
        const initAuditLog = async () => {
            if (auditLogFilePath) return; // [v0.2.29] Already initialized guard

            const projectRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!projectRoot) return;

            auditLogFilePath = promptLogger.initializeSession(projectRoot);
            console.log(`[SYNAPSE] Audit Log initialized: ${auditLogFilePath}`);

            // Initialize Adapter based collection (Forensic / Stream / File)
            const adapter = ChatExtractor.initialize(context);
            adapter.start((msg) => {
                if (auditLogFilePath) {
                    if (msg.role === 'user') {
                        promptLogger.appendUser(auditLogFilePath, msg.content);
                    } else {
                        promptLogger.appendAssistant(auditLogFilePath, msg.content);
                    }
                }
            });
        };

        initAuditLog();

        // [Pure Event Channel] Real-time File Action Tracking
        context.subscriptions.push(
            vscode.workspace.onDidOpenTextDocument(doc => {
                if (auditLogFilePath && doc.uri.scheme === 'file') {
                    const relPath = vscode.workspace.asRelativePath(doc.uri);
                    if (!relPath.startsWith('.synapse_contexts') && !relPath.includes('node_modules')) {
                        promptLogger.appendAction(auditLogFilePath, 'read', relPath, vscode.workspace.asRelativePath(doc.uri));
                    }
                }
            }),
            vscode.workspace.onDidSaveTextDocument(doc => {
                if (auditLogFilePath && doc.uri.scheme === 'file') {
                    promptLogger.appendAction(auditLogFilePath, 'modify', vscode.workspace.asRelativePath(doc.uri), vscode.workspace.workspaceFolders![0].uri.fsPath);
                }
            }),
            vscode.workspace.onDidCreateFiles(e => {
                if (auditLogFilePath) {
                    e.files.forEach(uri => {
                        promptLogger.appendAction(auditLogFilePath!, 'create', vscode.workspace.asRelativePath(uri), vscode.workspace.workspaceFolders![0].uri.fsPath);
                    });
                }
            })
        );

        // [v0.2.17] DTR Inference Pressure Gauge
        const dtrStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1001);
        dtrStatusBar.text = '$(dashboard) DTR: 0.30';
        dtrStatusBar.tooltip = 'SYNAPSE: Inference Pressure (Shallow)';
        dtrStatusBar.command = 'synapse.toggleDTRValve';
        dtrStatusBar.show();
        context.subscriptions.push(dtrStatusBar);


        console.log('[SYNAPSE] Commands registered successfully');

        // Auto-open canvas and sync logic
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            workspaceFolders.forEach(folder => {
                checkProjectStatus(folder, context);
                setupFileWatcher(folder, context);
            });
        }

        // Language Client Setup
        console.log('[SYNAPSE] Starting Language Server...');
        const serverModule = context.asAbsolutePath(path.join('dist', 'server', 'server.js'));
        const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
        const serverOptions: ServerOptions = {
            run: { module: serverModule, transport: TransportKind.ipc },
            debug: {
                module: serverModule,
                transport: TransportKind.ipc,
                options: debugOptions
            }
        };

        const clientOptions: LanguageClientOptions = {
            documentSelector: [{ scheme: 'file', language: 'markdown' }],
            synchronize: {
                fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
            }
        };

        const languageClient = new LanguageClient(
            'synapseLanguageServer',
            'SYNAPSE Language Server',
            serverOptions,
            clientOptions
        );
        setClient(languageClient);
        await languageClient.start();
        console.log('[SYNAPSE] Language Server started successfully');

        // Architecture Explorer Setup
        const architectureExplorerProvider = new ArchitectureExplorerProvider(
            vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
        );
        vscode.window.registerTreeDataProvider('synapseExplorer', architectureExplorerProvider);

        // [v0.2.22] Final Audit Log Initialization - Force start after UI is ready
        setTimeout(() => {
            console.log('[SYNAPSE] Triggering final audit log sync sequence...');
            initAuditLog();
        }, 2000);

        context.subscriptions.push(
            vscode.commands.registerCommand('synapse.refreshExplorer', () => {
                architectureExplorerProvider.refresh();
            })
        );

        vscode.window.setStatusBarMessage(`SYNAPSE Engine Ready (v${version})`, 5000);

        // [v0.2.17] Register DTR Control Command
        context.subscriptions.push(
            vscode.commands.registerCommand('synapse.toggleDTRValve', async () => {
                const modes = ['Shallow (0.2)', 'Balanced (0.5)', 'Deep (0.9)'];
                const selected = await vscode.window.showQuickPick(modes, {
                    placeHolder: 'Select DTR Inference Mode'
                });

                if (selected) {
                    const value = selected.includes('0.2') ? 0.2 : (selected.includes('0.5') ? 0.5 : 0.9);
                    const color = value < 0.4 ? '#87CEEB' : (value < 0.8 ? '#50C878' : '#8A2BE2');
                    const label = value < 0.4 ? 'Shallow' : (value < 0.8 ? 'Balanced' : 'Deep');

                    dtrStatusBar.text = `$(dashboard) DTR: ${value.toFixed(2)}`;
                    dtrStatusBar.color = color;
                    dtrStatusBar.tooltip = `SYNAPSE: Inference Pressure (${label})`;

                    // Sync with AiOrchestrator
                    AiOrchestrator.getInstance().setDTR(value);

                    // Notify CanvasPanel to update visual tension
                    if (CanvasPanel.currentPanel) {
                        CanvasPanel.currentPanel.notifyDTRChange(value);
                    }
                }
            })
        );

        console.log('[SYNAPSE] Extension activation completed');

        // [v0.2.18.2] Architecture Guardrail - Debounced AST validation on Save
        const diagnosticCollection = vscode.languages.createDiagnosticCollection('synapse-architecture');
        context.subscriptions.push(diagnosticCollection);

        let validationTimeout: NodeJS.Timeout | null = null;
        context.subscriptions.push(
            vscode.workspace.onDidSaveTextDocument(async (document) => {
                // Ignore non-supported files (just skip ones that don't match typical source)
                if (document.uri.scheme !== 'file') return;
                
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
                if (!workspaceFolder) return;

                if (validationTimeout) {
                    clearTimeout(validationTimeout);
                }

                // Debounce to avoid spamming
                validationTimeout = setTimeout(async () => {
                    try {
                        const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
                        let stateStr = '';
                        try {
                            const data = await vscode.workspace.fs.readFile(projectStateUri);
                            stateStr = data.toString();
                        } catch (e) {
                            return; // No project state, no validation
                        }

                        const state = JSON.parse(stateStr);
                        const analyzer = new LogicAnalyzer();
                        const issues = analyzer.analyze(state, workspaceFolder.uri.fsPath);

                        // Clear previous diagnostics
                        diagnosticCollection.clear();

                        const diagnosticsMap = new Map<string, vscode.Diagnostic[]>();

                        issues.forEach(issue => {
                            if (issue.type === 'architecture-violation') {
                                issue.nodeIds.forEach(nodeId => {
                                    const node = state.nodes.find((n: any) => n.id === nodeId);
                                    if (node && node.data && node.data.file) {
                                        const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, node.data.file);
                                        const uriStr = fileUri.toString();

                                        let diagSeverity = vscode.DiagnosticSeverity.Error;
                                        if (issue.severity === 'medium' || issue.severity === 'low') {
                                            diagSeverity = vscode.DiagnosticSeverity.Warning;
                                        }

                                        const diagnostic = new vscode.Diagnostic(
                                            new vscode.Range(0, 0, 0, 0), // Top of file by default 
                                            `[SYNAPSE Guardrail] ${issue.message}`,
                                            diagSeverity
                                        );

                                        if (!diagnosticsMap.has(uriStr)) {
                                            diagnosticsMap.set(uriStr, []);
                                        }
                                        diagnosticsMap.get(uriStr)!.push(diagnostic);
                                    }
                                });
                            }
                        });

                        // Apply new diagnostics
                        diagnosticsMap.forEach((diags, uriStr) => {
                            // Find the corresponding URI object from our map keys or reconstruction
                            // Better: use the URI object directly if we stored it
                            const targetUri = vscode.Uri.parse(uriStr); 
                            diagnosticCollection.set(targetUri, diags);
                        });

                    } catch (e) {
                        console.error('[SYNAPSE] Architecture validation on save failed:', e);
                    }
                }, 1000); // 1-second debounce
            })
        );
    } catch (e: any) {
        console.error('[SYNAPSE] Extension activation failed:', e);
        vscode.window.showErrorMessage(`SYNAPSE: Activation Failed! Error: ${e.message || e}`);
    }
}

/**
 * [v0.2.20] GEMINI.md에서 원칙을 로드하여 GlobalState에 주입
 */
async function loadSovereignPrinciples(context: vscode.ExtensionContext, folder: vscode.WorkspaceFolder) {
    try {
        const geminiUri = vscode.Uri.joinPath(folder.uri, 'GEMINI.md');
        const parser = new GeminiParser();
        const principles = await parser.extractPrinciples(geminiUri.fsPath);
        
        if (principles.length === 0) {
            Logger.warn('🏛️ Sovereign Principles Not Found: GEMINI.md must contain a # Principles section.');
            await context.globalState.update('synapse.sovereign_principles', []);
            return false;
        }
        
        await context.globalState.update('synapse.sovereign_principles', principles);
        
        // IDE 전역 법칙으로 인지시키기 위한 환경 변수 주입 (현재 프로세스 레벨)
        process.env.SYNAPSE_PRINCIPLES = JSON.stringify(principles);
        
        Logger.info(`🏛️ Sovereign Principles Grafted: ${principles.length} rules loaded into GlobalState.`);
        return true;
    } catch (e) {
        Logger.error('Failed to load sovereign principles:', e);
        return false;
    }
}

async function checkProjectStatus(workspaceFolder: vscode.WorkspaceFolder, context: vscode.ExtensionContext) {
    const geminiUri = vscode.Uri.joinPath(workspaceFolder.uri, 'GEMINI.md');
    const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');

    try {
        let geminiExists = false;
        try {
            await vscode.workspace.fs.stat(geminiUri);
            geminiExists = true;
        } catch (e) {
            // GEMINI.md doesn't exist
        }

        let projectStateStat: vscode.FileStat | undefined;
        try {
            projectStateStat = await vscode.workspace.fs.stat(projectStateUri);
        } catch (e) {
            // project_state.json doesn't exist
        }

        if (!projectStateStat) {
            if (geminiExists) {
                // Case 1: GEMINI.md exists but no project_state.json
                const config = vscode.workspace.getConfiguration('synapse');
                const autoBootstrap = config.get<boolean>('autoBootstrap', false);

                if (autoBootstrap) {
                    console.log(`[SYNAPSE] Auto-bootstrapping project: ${workspaceFolder.name}`);
                    await bootstrapFromGemini(geminiUri, context);
                } else {
                    const action = await vscode.window.showInformationMessage(
                        `GEMINI.md detected in ${workspaceFolder.name}. Would you like to initialize the SYNAPSE canvas?`,
                        'Initialize'
                    );
                    if (action === 'Initialize') {
                        await bootstrapFromGemini(geminiUri, context);
                    }
                }
            } else {
                // Case 3: No GEMINI.md and no project_state.json -> Offer Lite Bootstrap
                const action = await vscode.window.showInformationMessage(
                    `No architecture state found for ${workspaceFolder.name}. Would you like to auto-discover project structure?`,
                    'Lite Bootstrap'
                );
                if (action === 'Lite Bootstrap') {
                    await liteBootstrap(context, workspaceFolder);
                }
            }
        } else {
            // Case 2: project_state.json exists
            if (geminiExists) {
                const geminiStat = await vscode.workspace.fs.stat(geminiUri);
                if (geminiStat.mtime > projectStateStat.mtime) {
                    const action = await vscode.window.showInformationMessage(
                        `GEMINI.md in ${workspaceFolder.name} has been updated. Would you like to sync the architecture canvas?`,
                        'Sync Now'
                    );
                    if (action === 'Sync Now') {
                        await bootstrapFromGemini(geminiUri, context);
                    }
                }
            }
            // Auto-open if project state exists (only if this is the active workspace or first one)
            const activeWorkspace = vscode.window.activeTextEditor
                ? vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri)
                : vscode.workspace.workspaceFolders?.[0];

            if (activeWorkspace?.uri.fsPath === workspaceFolder.uri.fsPath) {
                // [v0.2.20] Soft Binding: Auto-open even without principles
                CanvasPanel.createOrShow(context, workspaceFolder);
                
                const principles = context.globalState.get<string[]>('synapse.sovereign_principles', []);
                if (principles.length === 0) {
                    Logger.info('[Secretary\'s Suggestion] Canvas opened in Unbound Mode.');
                }
            }
        }
    } catch (e) {
        console.error('[SYNAPSE] checkProjectStatus error:', e);
    }
}

function setupFileWatcher(workspaceFolder: vscode.WorkspaceFolder, context: vscode.ExtensionContext) {
    const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(workspaceFolder, 'GEMINI.md')
    );

    watcher.onDidChange(async () => {
        const action = await vscode.window.showInformationMessage(
            'GEMINI.md changed. Sync architecture?',
            'Sync'
        );
        if (action === 'Sync') {
            const geminiUri = vscode.Uri.joinPath(workspaceFolder.uri, 'GEMINI.md');
            await loadSovereignPrinciples(context, workspaceFolder); // 원칙 최우선 갱신
            await bootstrapFromGemini(geminiUri, context);
        }
    });

    // Principles 실시간 원칙 감시 (Sync 버튼 없이도 로드)
    watcher.onDidCreate(() => loadSovereignPrinciples(context, workspaceFolder));

    // Source files watcher (auto-refresh canvas state)
    const sourceWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(workspaceFolder, 'src/**/*.{py,ts,js}')
    );

    // Prompt files watcher (auto-refresh canvas state for history nodes)
    const promptWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(workspaceFolder, 'prompts/**/*.md')
    );

    const refreshCanvas = async () => {
        console.log('[SYNAPSE] File changed, refreshing canvas state...');
        if (CanvasPanel.currentPanel) {
            await CanvasPanel.currentPanel.refreshState();
        }
        // Also refresh the explorer
        vscode.commands.executeCommand('synapse.refreshExplorer');
    };

    sourceWatcher.onDidChange(refreshCanvas);
    sourceWatcher.onDidCreate(refreshCanvas);
    sourceWatcher.onDidDelete(refreshCanvas);

    promptWatcher.onDidCreate(refreshCanvas);
    promptWatcher.onDidChange(refreshCanvas);
    promptWatcher.onDidDelete(refreshCanvas);

    context.subscriptions.push(watcher, sourceWatcher, promptWatcher);
}

async function liteBootstrap(context: vscode.ExtensionContext, folder?: vscode.WorkspaceFolder) {
    const workspaceFolder = folder || (vscode.window.activeTextEditor
        ? vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri)
        : vscode.workspace.workspaceFolders?.[0]);

    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found for Lite Bootstrap');
        return;
    }

    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'SYNAPSE Lite Bootstrap',
                cancellable: false
            },
            async (progress) => {
                progress.report({ message: 'Auto-discovering project structure...' });

                const engine = new BootstrapEngine();
                const result = await engine.liteBootstrap(workspaceFolder.uri.fsPath);

                if (result.success) {
                    progress.report({ message: 'Opening canvas...' });
                    await vscode.commands.executeCommand('synapse.openCanvas');

                    if (CanvasPanel.currentPanel) {
                        await CanvasPanel.currentPanel.sendProjectState();
                    }

                    vscode.window.showInformationMessage(
                        `✅ Lite Bootstrap complete! Discovered ${result.initial_nodes.length} nodes.`
                    );
                } else {
                    vscode.window.showErrorMessage(`❌ Lite Bootstrap failed: ${result.error}`);
                }
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(`Lite Bootstrap error: ${error}`);
    }
}

async function bootstrapFromGemini(uri: vscode.Uri, context: vscode.ExtensionContext) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'SYNAPSE Bootstrap',
                cancellable: false
            },
            async (progress) => {
                progress.report({ message: 'Analyzing GEMINI.md...' });

                const engine = new BootstrapEngine();
                const result = await engine.bootstrap(
                    uri.fsPath,
                    workspaceFolder.uri.fsPath,
                    true
                );

                if (result.success) {
                    progress.report({ message: 'Opening canvas...' });
                    await vscode.commands.executeCommand('synapse.openCanvas');

                    // Force refresh the canvas to load the new state
                    if (CanvasPanel.currentPanel) {
                        await CanvasPanel.currentPanel.sendProjectState();
                    }

                    vscode.window.showInformationMessage(
                        `✅ Bootstrap complete! Created ${result.initial_nodes.length} nodes.`
                    );
                } else {
                    vscode.window.showErrorMessage(`❌ Bootstrap failed: ${result.error}`);
                }
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(`Bootstrap error: ${error}`);
    }
}

export function deactivate(): Thenable<void> | undefined {
    console.log('SYNAPSE extension is now deactivated');
    if (!client) {
        return undefined;
    }
    return client.stop();
}
