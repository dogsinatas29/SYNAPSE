/**
 * SYNAPSE VS Code Extension
 * Main extension entry point
 */

import * as vscode from 'vscode';
import { CanvasPanel } from './webview/CanvasPanel';
import { BootstrapEngine } from './bootstrap/BootstrapEngine';

export function activate(context: vscode.ExtensionContext) {
    console.log('SYNAPSE extension is now active!');

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('synapse.openCanvas', () => {
            CanvasPanel.createOrShow(context.extensionUri);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('synapse.bootstrap', async (uri: vscode.Uri) => {
            await bootstrapFromGemini(uri, context);
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

export function deactivate() {
    console.log('SYNAPSE extension is now deactivated');
}
