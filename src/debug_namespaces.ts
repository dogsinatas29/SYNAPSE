import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
    console.log('[DEBUG] VS Code Namespaces:');
    for (const key of Object.keys(vscode)) {
        console.log(`- ${key}`);
    }
    
    // Check Chat
    const chat: any = (vscode as any).chat;
    if (chat) {
        console.log('[DEBUG] Chat API Keys:', Object.keys(chat));
    }
    
    // Check Interactive
    const interactive: any = (vscode as any).interactive;
    if (interactive) {
        console.log('[DEBUG] Interactive API Keys:', Object.keys(interactive));
    }
}
