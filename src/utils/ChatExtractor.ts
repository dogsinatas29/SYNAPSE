import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

/**
 * Parses VS Code's hidden workspaceStorage to extract the full Copilot Chat interaction history.
 */
export class ChatExtractor {

    /**
     * Extracts the full transcript of the most recent chat session.
     */
    public static async getFullChatHistory(context: vscode.ExtensionContext): Promise<ChatMessage[] | null> {
        try {
            const workspaceStoragePath = this.getWorkspaceStoragePath(context);
            if (!workspaceStoragePath) return null;

            const chatSessionsPath = path.join(workspaceStoragePath, 'chatSessions');
            if (!fs.existsSync(chatSessionsPath)) {
                console.warn(`[SYNAPSE] chatSessions path not found: ${chatSessionsPath}`);
                return null;
            }

            const files = fs.readdirSync(chatSessionsPath)
                .filter(f => f.endsWith('.jsonl'))
                .map(f => path.join(chatSessionsPath, f));

            if (files.length === 0) return null;

            // Find the most recently modified session
            const latestFile = files.reduce((latest, current) => {
                const latestStat = fs.statSync(latest);
                const currentStat = fs.statSync(current);
                return latestStat.mtimeMs > currentStat.mtimeMs ? latest : current;
            });

            console.log(`[SYNAPSE] Extracting full history from: ${latestFile}`);
            const content = fs.readFileSync(latestFile, 'utf-8');
            const lines = content.split('\n').filter(l => l.trim() !== '');

            const history: ChatMessage[] = [];
            const requestMap = new Map<number, { user: string, assistant: string[] }>();

            lines.forEach(line => {
                try {
                    const parsed = JSON.parse(line);

                    // User Message (kind 2, v contains requests)
                    if (parsed.kind === 2 && Array.isArray(parsed.v)) {
                        parsed.v.forEach((req: any, index: number) => {
                            if (req.message && req.message.text) {
                                requestMap.set(index, { user: req.message.text, assistant: [] });
                            }
                        });
                    }

                    // Assistant Response (k starts with ['requests', index, 'response'])
                    if (parsed.k && Array.isArray(parsed.k) && parsed.k[0] === 'requests' && parsed.k[2] === 'response') {
                        const index = parsed.k[1];
                        const entry = requestMap.get(index);
                        if (entry && parsed.v && Array.isArray(parsed.v)) {
                            const texts = parsed.v
                                .filter((r: any) => r.value && r.kind !== 'thinking' && !r.kind?.includes('progressTask') && !r.kind?.includes('mcpServers'))
                                .map((r: any) => r.value);
                            if (texts.length > 0) {
                                entry.assistant.push(texts.join(''));
                            }
                        }
                    }
                } catch { }
            });

            // Convert map to sorted history
            const sortedIndices = Array.from(requestMap.keys()).sort((a, b) => a - b);
            sortedIndices.forEach(idx => {
                const entry = requestMap.get(idx)!;
                history.push({ role: 'user', content: entry.user });
                if (entry.assistant.length > 0) {
                    history.push({ role: 'assistant', content: entry.assistant.join('\n') });
                }
            });

            return history.length > 0 ? history : null;
        } catch (e) {
            console.error('[SYNAPSE] Chat extraction error:', e);
            return null;
        }
    }

    public static getChatSessionsFolderPath(context: vscode.ExtensionContext): string | null {
        const wsPath = this.getWorkspaceStoragePath(context);
        return wsPath ? path.join(wsPath, 'chatSessions') : null;
    }

    private static getWorkspaceStoragePath(context: vscode.ExtensionContext): string | null {
        // Standard extension storage path: .../workspaceStorage/<hash>/<extension-id>
        if (context.storageUri) {
            return path.dirname(context.storageUri.fsPath);
        }
        
        // Fallback for some forks or specific environments
        // Try searching up from global storage if workspaceStorage is nearby
        if (context.globalStorageUri) {
            const userDir = path.dirname(path.dirname(context.globalStorageUri.fsPath));
            const wsStorage = path.join(userDir, 'workspaceStorage');
            if (fs.existsSync(wsStorage)) {
                 // But we need the <hash>. This is hard to guess without storageUri.
                 // So we return null if storageUri is missing.
            }
        }
        
        return null;
    }
}

