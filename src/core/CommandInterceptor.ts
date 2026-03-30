import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PromptLogger } from './PromptLogger';

/**
 * [v0.2.45] CommandInterceptor: Wildcard Memory 요격 시스템
 * 특정 ID에 의존하지 않고 모든 antigravity.* 명령어를 전수 조사하여 대화를 추출함.
 */
export class CommandInterceptor {
    private static instance: CommandInterceptor;
    private originalExecuteCommand: any;
    private isArmed = false;

    private constructor() {
        this.originalExecuteCommand = vscode.commands.executeCommand;
    }

    public static getInstance(): CommandInterceptor {
        if (!CommandInterceptor.instance) {
            CommandInterceptor.instance = new CommandInterceptor();
        }
        return CommandInterceptor.instance;
    }

    public activate(context: vscode.ExtensionContext) {
        if (this.isArmed) return;
        
        console.log('[SYNAPSE] CommandInterceptor: Arming memory sniffer (WILDCARD MODE)...');
        
        // [Debug] Confirming File System Access
        const projectRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (projectRoot) {
            const debugLog = path.join(projectRoot, '.synapse_contexts', 'interceptor_debug.log');
            fs.writeFileSync(debugLog, `[${new Date().toISOString()}] CommandInterceptor Activated (v0.2.45)\n`, 'utf-8');
        }

        this.patchExecuteCommand(context);
        this.observeChatEvents(context);

        this.registerDiagnosticDump();
        
        this.isArmed = true;
        console.log('[SYNAPSE] CommandInterceptor: Memory sniffer ARMED (v0.2.45).');
        
        // [v0.2.45 Update] Status Bar Indicator
        const interceptorStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1002);
        interceptorStatus.text = '$(shield) WILDCARD';
        interceptorStatus.tooltip = 'SYNAPSE: Wildcard Memory Interceptor Active (v0.2.45)';
        interceptorStatus.color = '#FFD700'; // Gold for wildcard active
        interceptorStatus.show();
        context.subscriptions.push(interceptorStatus);
    }

    private async registerDiagnosticDump() {
        const projectRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!projectRoot) return;

        const allCommands = await vscode.commands.getCommands(true);
        const relevant = allCommands.filter(c => c.includes('gemini') || c.includes('antigravity') || c.includes('chat.'));
        
        const diagPath = path.join(projectRoot, '.synapse_contexts', 'commands_diagnostics.json');
        const data = {
            version: 'v0.2.45',
            timestamp: new Date().toISOString(),
            total: allCommands.length,
            relevant: relevant,
            all: allCommands
        };
        fs.writeFileSync(diagPath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`[SYNAPSE][INTERCEPT] Diagnostic list updated for v0.2.45: ${diagPath}`);
    }

    private patchExecuteCommand(context: vscode.ExtensionContext) {
        const self = this;
        const original = this.originalExecuteCommand;

        // [v0.2.45 Wildcard] Capture ALL antigravity, gemini, and chat prefix commands
        (vscode.commands as any).executeCommand = async function(commandId: string, ...args: any[]) {
            const projectRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (projectRoot) {
                const debugLog = path.join(projectRoot, '.synapse_contexts', 'interceptor_debug.log');
                try {
                    fs.appendFileSync(debugLog, `[${new Date().toISOString()}] EXEC: ${commandId} (args: ${args.length})\n`, 'utf-8');
                } catch (e) {}
            }

            const isRelevant = commandId.startsWith('antigravity.') || 
                               commandId.includes('gemini') || 
                               commandId.includes('chat.');
            
            if (isRelevant && commandId !== 'synapse.logPrompt') {
                console.log(`[SYNAPSE][INTERCEPT] Wildcard Hit: ${commandId}`);
                
                try {
                    // [v0.2.45 Wildcard Diagnostic]
                    vscode.commands.executeCommand('synapse.logPrompt', {
                        prompt: `[WILDCARD DIAG] Hooked: ${commandId}`,
                        source: 'Interceptor:Wildcard',
                        isDiagnostic: true
                    });

                    // Deep Extraction
                    self.extractAndLogChat(commandId, args);
                } catch (err) {}
            }
            return original.apply(this, [commandId, ...args]);
        };
    }

    private extractAndLogChat(commandId: string, args: any[]) {
        const foundStrings = this.recursiveScan(args);
        if (foundStrings.length === 0) return;

        const koreanRegex = /[가-힣]/;
        const candidates = foundStrings.filter(s => koreanRegex.test(s) || s.length > 5);

        if (candidates.length > 0) {
            const projectRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (projectRoot) {
                const diagLog = path.join(projectRoot, '.synapse_contexts', 'intercept_hits.log');
                const timestamp = new Date().toISOString();
                
                for (const content of candidates) {
                    if (koreanRegex.test(content)) {
                        const clean = content.replace(/\n/g, ' ').substring(0, 150);
                        try {
                            // [v0.2.45 Senior Edition] ONLY log if Hangeul is present - the "Golden Key"
                            fs.appendFileSync(diagLog, `[${timestamp}] HIT [${commandId}] -> [GOLDEN_DATA] ${clean}\n`, 'utf-8');
                        } catch (e) {}
                    }
                }

                // Log the most likely "Main Prompt" (longest Korean or longest string)
                const mainPrompt = candidates.sort((a, b) => {
                    if (koreanRegex.test(a) && !koreanRegex.test(b)) return -1;
                    if (!koreanRegex.test(a) && koreanRegex.test(b)) return 1;
                    return b.length - a.length;
                })[0];

                vscode.commands.executeCommand('synapse.logPrompt', {
                    prompt: mainPrompt,
                    sessionId: 'wildcard-session',
                    workspacePath: projectRoot,
                    source: `Interceptor:Wildcard:${commandId}`
                });
            }
        }
    }

    private recursiveScan(obj: any, depth = 0): string[] {
        if (depth > 5 || !obj) return [];
        const results: string[] = [];

        if (typeof obj === 'string' && obj.trim().length > 1) {
            results.push(obj.trim());
        } else if (Array.isArray(obj)) {
            for (const item of obj) {
                results.push(...this.recursiveScan(item, depth + 1));
            }
        } else if (typeof obj === 'object') {
            for (const key in obj) {
                try {
                    results.push(...this.recursiveScan(obj[key], depth + 1));
                } catch (e) {}
            }
        }
        return results;
    }

    private observeChatEvents(context: vscode.ExtensionContext) {
        try {
            const chatNamespace = (vscode as any).chat;
            if (chatNamespace) {
                if (chatNamespace.onDidSendMessage) {
                    context.subscriptions.push(chatNamespace.onDidSendMessage((e: any) => {
                        this.handleApiChatEvent(e, 'user');
                    }));
                }
                if (chatNamespace.onDidReceiveChatResponse) {
                    context.subscriptions.push(chatNamespace.onDidReceiveChatResponse((e: any) => {
                        this.handleApiChatEvent(e, 'assistant');
                    }));
                }
                console.log('[SYNAPSE][INTERCEPT] Chat API listeners registered.');
            }
        } catch (e) {
            console.warn('[SYNAPSE][INTERCEPT] Chat API not available.');
        }
    }

    private handleApiChatEvent(event: any, role: 'user' | 'assistant') {
        const projectRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!projectRoot) return;

        const sessionId = event.sessionId || 'chat-api';
        const text = event.prompt || (event.message ? event.message.text : null) || event.text || event.response?.text;

        if (text) {
            // [v0.2.45 Update] Also log to intercept_hits.log for chat API events
            const diagLog = path.join(projectRoot, '.synapse_contexts', 'intercept_hits.log');
            const timestamp = new Date().toISOString();
            const koreanRegex = /[가-힣]/;
            
            if (koreanRegex.test(text)) {
                const clean = text.replace(/\n/g, ' ').substring(0, 150);
                try {
                    fs.appendFileSync(diagLog, `[${timestamp}] API [${role}] -> [GOLDEN_DATA] ${clean}\n`, 'utf-8');
                } catch (e) {}
            }

            vscode.commands.executeCommand('synapse.logPrompt', {
                prompt: role === 'user' ? text : undefined,
                chunk: role === 'assistant' ? text : undefined,
                sessionId: sessionId,
                workspacePath: projectRoot,
                finish: role === 'assistant' ? (event.isDone || event.settled || false) : true
            });
        }
    }
}
