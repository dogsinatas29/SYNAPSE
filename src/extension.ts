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

    // Auto-open canvas if project_state.json exists
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        const projectStatePath = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
        vscode.workspace.fs.stat(projectStatePath).then(
            () => {
                // File exists, auto-open canvas
                vscode.commands.executeCommand('synapse.openCanvas');
            },
            () => {
                // File doesn't exist, do nothing
            }
        );
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
