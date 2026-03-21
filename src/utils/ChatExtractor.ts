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
        // [v0.2.22] Robust Storage Path Discovery
        if (context.storageUri) {
            const potentialPath = path.dirname(context.storageUri.fsPath);
            if (fs.existsSync(path.join(potentialPath, 'chatSessions'))) {
                return potentialPath;
            }
        }
        
        // Fallback: Linux Standard Path Search
        const homeDir = process.env.HOME || process.env.USERPROFILE;
        if (homeDir) {
            const wsStorageRoot = path.join(homeDir, '.config', 'Code', 'User', 'workspaceStorage');
            if (fs.existsSync(wsStorageRoot)) {
                try {
                    const folders = fs.readdirSync(wsStorageRoot);
                    for (const folder of folders) {
                        const wsJsonPath = path.join(wsStorageRoot, folder, 'workspace.json');
                        if (fs.existsSync(wsJsonPath)) {
                            const content = fs.readFileSync(wsJsonPath, 'utf-8');
                            // Check if this storage folder belongs to the current workspace
                            const workspaceFolders = vscode.workspace.workspaceFolders;
                            if (workspaceFolders && workspaceFolders.length > 0) {
                                const currentWsPath = workspaceFolders[0].uri.toString();
                                if (content.includes(currentWsPath)) {
                                    return path.join(wsStorageRoot, folder);
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error('[SYNAPSE] Failed to crawl workspaceStorage:', e);
                }
            }
        }
        
        return null;
    }
}

