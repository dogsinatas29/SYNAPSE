import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('synapse.testWebview', () => {
        const panel = vscode.window.createWebviewPanel(
            'testWebview',
            'Test Webview',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );
        panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test</title>
</head>
<body>
    <h1>Test Webview</h1>
</body>
</html>`;
    });
    context.subscriptions.push(disposable);
}
