/**
 * Canvas Webview Panel
 * Manages the SYNAPSE canvas webview
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class CanvasPanel {
    public static currentPanel: CanvasPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (CanvasPanel.currentPanel) {
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

        CanvasPanel.currentPanel = new CanvasPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

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
                        // Prepend 'src/' to file path if it doesn't start with a path separator
                        const filePath = message.filePath.startsWith('/') || message.filePath.startsWith('src/')
                            ? message.filePath
                            : `src/${message.filePath}`;
                        await this.openFile(filePath);
                        return;
                    case 'getProjectState':
                        await this.sendProjectState();
                        return;
                    case 'saveState':
                        await this.handleSaveState(message.data);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public fitView() {
        this._panel.webview.postMessage({ command: 'fitView' });
    }

    private handleNodeSelected(node: any) {
        console.log('Node selected:', node);
        // TODO: Update sidebar, show node details
    }

    private async openFile(filePath: string) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
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

    private async handleSaveState(newState: any) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
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

            // 3. 파일 저장
            const data = Buffer.from(JSON.stringify(MergedState, null, 2), 'utf8');
            await vscode.workspace.fs.writeFile(projectStateUri, data);
            console.log('[SYNAPSE] State merged and saved successfully');
        } catch (error) {
            console.error('Failed to save project state:', error);
            vscode.window.showErrorMessage(`Failed to save project state: ${error}`);
        }
    }

    private async sendProjectState() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            console.error('No workspace folder found');
            return;
        }

        try {
            const projectStateUri = vscode.Uri.joinPath(workspaceFolder.uri, 'data', 'project_state.json');
            const data = await vscode.workspace.fs.readFile(projectStateUri);
            const projectState = JSON.parse(data.toString());

            console.log('Sending project state to webview:', projectState);

            this._panel.webview.postMessage({
                command: 'projectState',
                data: projectState
            });
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

        // Get URIs for resources
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
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval'; img-src ${webview.cspSource} https:;">
            `
        );

        // Add nonce to script tag
        html = html.replace(
            '<script',
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
