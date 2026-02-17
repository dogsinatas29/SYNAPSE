import * as vscode from 'vscode';
import * as path from 'path';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';
import { CanvasPanel } from './webview/CanvasPanel';
import { BootstrapEngine } from './bootstrap/BootstrapEngine';

import { client, setClient } from './client';
import { PromptLogger } from './core/PromptLogger';

export function activate(context: vscode.ExtensionContext) {
    try {
        console.log('[SYNAPSE] Extension activation started');

        // The server is implemented in node
        const serverModule = context.asAbsolutePath(
            path.join('dist', 'server', 'server.js')
        );
        // The debug options for the server
        // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
        const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

        // If the extension is launched in debug mode then the debug server options are used
        // Otherwise the run options are used
        const serverOptions: ServerOptions = {
            run: { module: serverModule, transport: TransportKind.ipc },
            debug: {
                module: serverModule,
                transport: TransportKind.ipc,
                options: debugOptions
            }
        };

        // Options to control the language client
        const clientOptions: LanguageClientOptions = {
            // Register the server for plain text documents
            documentSelector: [{ scheme: 'file', language: 'markdown' }],
            synchronize: {
                // Notify the server about file changes to '.clientrc files contained in the workspace
                fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
            }
        };

        // Create the language client and start the client.
        const languageClient = new LanguageClient(
            'synapseLanguageServer',
            'SYNAPSE Language Server',
            serverOptions,
            clientOptions
        );
        setClient(languageClient);

        // Start the client. This will also launch the server
        client.start();

        // Register commands
        context.subscriptions.push(
            vscode.commands.registerCommand('synapse.openCanvas', () => {
                let workspaceFolder: vscode.WorkspaceFolder | undefined;

                if (vscode.window.activeTextEditor) {
                    workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
                }

                if (!workspaceFolder) {
                    workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                }

                if (workspaceFolder) {
                    CanvasPanel.createOrShow(context.extensionUri, workspaceFolder);
                } else {
                    vscode.window.showErrorMessage('No workspace folder found to open SYNAPSE Canvas.');
                }
            })
        );

        context.subscriptions.push(
            vscode.commands.registerCommand('synapse.bootstrap', async (uri: vscode.Uri | undefined) => {
                let targetFolder: vscode.WorkspaceFolder | undefined;

                if (uri) {
                    targetFolder = vscode.workspace.getWorkspaceFolder(uri);
                } else if (vscode.window.activeTextEditor) {
                    targetFolder = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
                    if (vscode.window.activeTextEditor.document.fileName.endsWith('GEMINI.md')) {
                        uri = vscode.window.activeTextEditor.document.uri;
                    }
                }

                if (!targetFolder) {
                    targetFolder = vscode.workspace.workspaceFolders?.[0];
                }

                if (!targetFolder) {
                    vscode.window.showErrorMessage('Please open a folder first.');
                    return;
                }

                if (uri && uri.fsPath.endsWith('GEMINI.md')) {
                    await bootstrapFromGemini(uri, context);
                } else {
                    // Find GEMINI.md in target folder
                    const geminiUri = vscode.Uri.joinPath(targetFolder.uri, 'GEMINI.md');
                    try {
                        await vscode.workspace.fs.stat(geminiUri);
                        await bootstrapFromGemini(geminiUri, context);
                    } catch (e) {
                        // GEMINI.md doesn't exist, offer Lite Bootstrap
                        const action = await vscode.window.showInformationMessage(
                            `GEMINI.md not found in ${targetFolder.name}. Would you like to use Lite Bootstrap to auto-discover the project?`,
                            'Lite Bootstrap'
                        );
                        if (action === 'Lite Bootstrap') {
                            await liteBootstrap(context, targetFolder);
                            return;
                        }
                    }
                }
            })
        );
        context.subscriptions.push(
            vscode.commands.registerCommand('synapse.fitView', () => {
                CanvasPanel.currentPanel?.fitView();
            })
        );

        // Command to log prompts (accessible from Canvas or other extensions)
        const promptLogger = PromptLogger.getInstance();
        context.subscriptions.push(
            vscode.commands.registerCommand('synapse.logPrompt', async (args?: { prompt: string, title?: string, workspacePath?: string }) => {
                let promptContent = args?.prompt;
                let title = args?.title;
                let projectRoot = args?.workspacePath;

                // 1. Interactive Mode (Keybinding triggered)
                if (!promptContent) {
                    // Get Prompt Content
                    promptContent = await vscode.window.showInputBox({
                        placeHolder: 'Enter your design decision, goal, or reasoning...',
                        prompt: 'Log Prompt to Architecture History',
                        ignoreFocusOut: true
                    }) || '';

                    if (!promptContent) {
                        return; // User cancelled
                    }

                    // Get Title (Optional)
                    const config = vscode.workspace.getConfiguration('synapse');
                    const autoSave = config.get<boolean>('prompt.autoSave');

                    if (!autoSave && !title) {
                        title = await vscode.window.showInputBox({
                            placeHolder: 'Enter a title (optional)...',
                            prompt: 'Title for this log (Press Enter to skip)',
                            ignoreFocusOut: true
                        });
                    }
                }

                if (!projectRoot) {
                    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                    projectRoot = workspaceFolder?.uri.fsPath;
                }

                if (projectRoot && promptContent) {
                    await promptLogger.logPrompt(projectRoot, promptContent, title);
                    vscode.window.showInformationMessage('Prompt logged successfully.');
                } else if (!projectRoot) {
                    vscode.window.showErrorMessage('No workspace open to log prompt');
                }
            })
        );

        // Auto-open canvas and sync logic
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            workspaceFolders.forEach(folder => {
                checkProjectStatus(folder, context);
                setupFileWatcher(folder, context);
            });
        }
        console.log('[SYNAPSE] Extension activation completed');
    } catch (e) {
        console.error('[SYNAPSE] Extension activation failed:', e);
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
                CanvasPanel.createOrShow(context.extensionUri, workspaceFolder);
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
            await bootstrapFromGemini(geminiUri, context);
        }
    });

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
