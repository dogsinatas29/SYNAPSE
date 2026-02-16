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

export let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
    console.log('SYNAPSE extension is now active!');

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
    client = new LanguageClient(
        'synapseLanguageServer',
        'SYNAPSE Language Server',
        serverOptions,
        clientOptions
    );

    // Start the client. This will also launch the server
    client.start();

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('synapse.openCanvas', () => {
            CanvasPanel.createOrShow(context.extensionUri);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('synapse.bootstrap', async (uri: vscode.Uri | undefined) => {
            if (!uri) {
                // Determine URI from context if not provided (e.g. Command Palette)
                if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.fileName.endsWith('GEMINI.md')) {
                    uri = vscode.window.activeTextEditor.document.uri;
                } else {
                    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                    if (workspaceFolder) {
                        uri = vscode.Uri.joinPath(workspaceFolder.uri, 'GEMINI.md');
                    }
                }
            }

            if (uri) {
                await bootstrapFromGemini(uri, context);
            } else {
                vscode.window.showErrorMessage('Could not determine GEMINI.md path. Please open the file or right-click it in Explorer.');
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('synapse.fitView', () => {
            CanvasPanel.currentPanel?.fitView();
        })
    );

    // Auto-open canvas and sync logic
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        checkProjectStatus(workspaceFolder, context);
        setupFileWatcher(workspaceFolder, context);
    }
}

async function checkProjectStatus(workspaceFolder: vscode.WorkspaceFolder, context: vscode.ExtensionContext) {
    const geminiUri = vscode.Uri.joinPath(workspaceFolder.uri, 'GEMINI.md');
    const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');

    try {
        const geminiStat = await vscode.workspace.fs.stat(geminiUri);
        let projectStateStat: vscode.FileStat | undefined;

        try {
            projectStateStat = await vscode.workspace.fs.stat(projectStateUri);
        } catch (e) {
            // project_state.json doesn't exist
        }

        if (!projectStateStat) {
            // Case 1: GEMINI.md exists but no project_state.json
            const config = vscode.workspace.getConfiguration('synapse');
            const autoBootstrap = config.get<boolean>('autoBootstrap', false);

            if (autoBootstrap) {
                console.log('[SYNAPSE] Auto-bootstrapping project...');
                await bootstrapFromGemini(geminiUri, context);
            } else {
                const action = await vscode.window.showInformationMessage(
                    'GEMINI.md detected. Would you like to initialize the SYNAPSE canvas?',
                    'Initialize'
                );
                if (action === 'Initialize') {
                    await bootstrapFromGemini(geminiUri, context);
                }
            }
        } else {
            // Case 2: Both exist, compare timestamps for sync
            if (geminiStat.mtime > projectStateStat.mtime) {
                const action = await vscode.window.showInformationMessage(
                    'GEMINI.md has been updated. Would you like to sync the architecture canvas?',
                    'Sync Now'
                );
                if (action === 'Sync Now') {
                    await bootstrapFromGemini(geminiUri, context);
                }
            }
            // Auto-open if project state exists
            vscode.commands.executeCommand('synapse.openCanvas');
        }
    } catch (e) {
        // GEMINI.md doesn't exist, do nothing
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

    sourceWatcher.onDidChange(async () => {
        console.log('[SYNAPSE] Source file changed, refreshing canvas state...');
        if (CanvasPanel.currentPanel) {
            await CanvasPanel.currentPanel.refreshState();
        }
    });

    context.subscriptions.push(watcher, sourceWatcher);
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
