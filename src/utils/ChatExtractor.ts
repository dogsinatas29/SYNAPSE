import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Parses VS Code's hidden workspaceStorage to extract the most recent Copilot Chat interaction.
 * This saves the user from having to copy/paste context manually.
 */
export class ChatExtractor {

    /**
     * Extracts the most recent user prompt and LLM response.
     */
    public static async getLatestChatContext(context: vscode.ExtensionContext): Promise<string> {
        try {
            // Extension Context storageUri points to the workspace-specific storage:
            // e.g. ~/.config/Code/User/workspaceStorage/<hash>/dogsinatas.synapse-visual-architecture
            if (!context.storageUri) {
                return '';
            }

            // Go up one level to the workspace hash root
            // ~/.config/Code/User/workspaceStorage/<hash>/
            const workspaceStoragePath = path.dirname(context.storageUri.fsPath);
            const chatSessionsPath = path.join(workspaceStoragePath, 'chatSessions');

            if (!fs.existsSync(chatSessionsPath)) {
                return '';
            }

            // Find all .jsonl files in chatSessions
            const files = fs.readdirSync(chatSessionsPath)
                .filter(f => f.endsWith('.jsonl'))
                .map(f => path.join(chatSessionsPath, f));

            if (files.length === 0) {
                return '';
            }

            // Find the most recently modified file
            const latestFile = files.reduce((latest, current) => {
                const latestStat = fs.statSync(latest);
                const currentStat = fs.statSync(current);
                return latestStat.mtimeMs > currentStat.mtimeMs ? latest : current;
            });

            console.log(`[SYNAPSE] Reading latest chat session from: ${latestFile}`);
            const content = fs.readFileSync(latestFile, 'utf-8');
            const lines = content.split('\n').filter(l => l.trim() !== '');

            let latestUserMessage = '';
            let latestLLMResponse = '';

            let maxRequestIndex = -1;

            // Iterate forwards through all lines to track the latest state properly
            lines.forEach(line => {
                try {
                    const parsed = JSON.parse(line);

                    // Case 1: Initial payload containing the message ("kind":2, "k":["requests"], "v": [...])
                    if (parsed.kind === 2 && Array.isArray(parsed.v)) {
                        parsed.v.forEach((req: any, index: number) => {
                            if (req.message && req.message.text) {
                                // Array length might imply index, but let's just always take the last one in the array
                                maxRequestIndex = Math.max(maxRequestIndex, index);
                                latestUserMessage = req.message.text;
                                latestLLMResponse = ''; // Reset response for the new message
                            }
                        });
                    }

                    // Case 2: Update payload for a specific request index ("k":["requests", IDX, "response"])
                    if (parsed.k && Array.isArray(parsed.k) && parsed.k[0] === 'requests' && parsed.k[2] === 'response') {
                        const reqIndex = parsed.k[1];
                        if (typeof reqIndex === 'number' && reqIndex >= maxRequestIndex) {
                            maxRequestIndex = reqIndex;
                            if (parsed.v && Array.isArray(parsed.v)) {
                                const texts = parsed.v
                                    .filter((r: any) => r.value && r.kind !== 'thinking' && !r.kind?.includes('progressTaskSerialized') && !r.kind?.includes('mcpServersStarting'))
                                    .map((r: any) => r.value);
                                if (texts.length > 0) {
                                    latestLLMResponse = texts.join('');
                                }
                            }
                        }
                    }
                } catch {
                    // Ignore parsing errors for partial lines
                }
            });

            if (latestUserMessage) {
                let contextStr = `👤 질문:\n${latestUserMessage}\n`;
                if (latestLLMResponse) {
                    contextStr += `\n🤖 답변:\n${latestLLMResponse}`;
                }
                return contextStr;
            }

            return '';
        } catch (e: any) {
            console.error('[SYNAPSE] Failed to extract chat context:', e);
            return '';
        }
    }
}
