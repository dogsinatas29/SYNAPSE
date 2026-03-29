import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { PromptLogger } from './PromptLogger';
import { VscdbAdapter, TrajectoryEntry } from './VscdbAdapter';
import { RawTextMiner } from './RawTextMiner';
import { ChatExtractor } from '../utils/ChatExtractor';

/**
 * [v0.2.37] DirectChatScraper (Senior's Intervention Edition)
 * Principle: API Sniffing & WAL Conquer - Bypassing all unreliable layers.
 */
export class DirectChatScraper {
    private static isScraping = false;
    private static seenMessageHashes = new Set<string>();

    /**
     * Direct extraction sequence
     * [v0.2.38] Precision Sniper: Supports sessionId for targeted PB scanning.
     */
    public static async scrapeActiveChat(auditLogFilePath: string, sessionId?: string) {
        if (this.isScraping) return;
        this.isScraping = true;

        const promptLogger = PromptLogger.getInstance();
        const projectRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "";

        try {
            promptLogger.appendAction(auditLogFilePath, 'system_msg', 'Scraper: v0.2.37 Final Intervention sequence initiated...', projectRoot);

            // [Action 1] API Sniffing (Memory-Direct Extraction)
            // Senior's Choice: Attempting to access VS Code's internal chat session state
            try {
                const apiMessages = await this.sniffApiChat();
                if (apiMessages.length > 0) {
                    promptLogger.appendAction(auditLogFilePath, 'system_msg', 'Scraper: Successfully sniffed API responses directly.', projectRoot);
                    await this.processMessages(apiMessages, auditLogFilePath, projectRoot);
                    // Do not return yet, continue to DB scan as a sync measure
                }
            } catch (apiErr) {
                console.warn('[SYNAPSE] API Sniffing failed:', apiErr);
            }

            // [Precision Focus] 1. UI Focus for rendering (Trigger DB Write)
            const focusCommands = [
                'workbench.panel.chat.view.copilot.focus',
                'antigravity.toggleChatFocus'
            ];

            let focused = false;
            for (const cmd of focusCommands) {
                try {
                    await vscode.commands.executeCommand(cmd);
                    focused = true;
                    break;
                } catch (e) {}
            }

            if (!focused) {
                promptLogger.appendAction(auditLogFilePath, 'system_msg', 'Scraper: Focus failed, attempting silent VSCDB scan.', projectRoot);
            }

            // [Action 2] Commit Latency Retry (Senior's 2s Wait)
            // 브리지 어댑터 등에서 추가 지연이 있을 수 있으므로, 총합 2000ms를 넘지 않도록 조정
            promptLogger.appendAction(auditLogFilePath, 'system_msg', 'Scraper: Ensuring WAL commit sync...', projectRoot);
            await new Promise(resolve => setTimeout(resolve, 1200)); // Adjusted to account for extension.ts delay

            // [Direct Reading] 2. VSCDB 기반 데이터 탈취
            let capturedMessages: TrajectoryEntry[] = [];
            
            const vscdbPath = this.getVscdbPath();
            if (vscdbPath && fs.existsSync(vscdbPath)) {
                promptLogger.appendAction(auditLogFilePath, 'system_msg', `Scraper: Scanning VSCDB at ${vscdbPath}`, projectRoot);
                const adapter = new VscdbAdapter();
                const opened = await adapter.openReadOnly(vscdbPath);
                if (opened) {
                    const entries = await adapter.fetchTrajectorySummaries();
                    capturedMessages = entries;
                    adapter.close();
                }
            }

            // [Action 3] RawTextMiner Fallback (PB & Binary Sniffing)
            if (capturedMessages.length === 0) {
                promptLogger.appendAction(auditLogFilePath, 'system_msg', 'Scraper: All direct methods failed. Initiating RawTextMiner (Hangeul Scouter).', projectRoot);
                const minedStrings = await this.runRawTextMiner(projectRoot, sessionId);
                if (minedStrings.length > 0) {
                    capturedMessages = minedStrings.map(s => ({ 
                        role: this.detectRole(s), 
                        content: s 
                    }));
                }
            }

            if (capturedMessages.length === 0) {
                promptLogger.appendAction(auditLogFilePath, 'system_msg', 'Scraper: v0.2.37 fail-safe also failed to capture new data.', projectRoot);
                this.isScraping = false;
                return;
            }

            // [Deduplicate & Log] 4. 메시지 처리
            await this.processMessages(capturedMessages, auditLogFilePath, projectRoot);

        } catch (error: any) {
            promptLogger.appendAction(auditLogFilePath, 'system_msg', `Scraper: v0.2.37 Error - ${error.message || error}`, projectRoot);
        } finally {
            this.isScraping = false;
        }
    }

    /**
     * Internal API Sniffing for Chat Sessions
     */
    private static async sniffApiChat(): Promise<TrajectoryEntry[]> {
        const results: TrajectoryEntry[] = [];
        
        // Strategy A: Standard (Proposed) Chat API
        const chatApi = (vscode as any).chat;
        if (chatApi && typeof chatApi.listSessions === 'function') {
            const sessions = await chatApi.listSessions();
            for (const session of sessions) {
                if (session.requests) {
                    for (const req of session.requests) {
                        if (req.prompt) results.push({ role: 'user', content: req.prompt });
                        if (req.response && Array.isArray(req.response)) {
                            const responseText = req.response
                                .map((frag: any) => typeof frag === 'string' ? frag : (frag.value || ''))
                                .join('');
                            if (responseText) results.push({ role: 'assistant', content: responseText });
                        }
                    }
                }
            }
        }

        // Strategy B: Interactive Session API (Legacy/Alternative)
        const interactive = (vscode as any).interactive;
        if (interactive && interactive.sessions) {
            // ... similar logic
        }

        return results;
    }

    /**
     * PB 파일 및 VSCDB-WAL 파일에서 한글 문자열 스니핑
     * [v0.2.38] Specific sessionId prioritization.
     */
    private static async runRawTextMiner(projectRoot: string, sessionId?: string): Promise<string[]> {
        const vscdbPath = this.getVscdbPath();
        const targets: (string | Buffer)[] = [];
        
        if (vscdbPath) {
            const walPath = vscdbPath + '-wal';
            if (fs.existsSync(walPath)) targets.push(walPath);
            targets.push(vscdbPath);
        }

        const antigravityPath = ChatExtractor.getAntigravityConversationsPath();
        if (antigravityPath && fs.existsSync(antigravityPath)) {
            try {
                // [v0.2.38] Prioritize the active session PB file
                if (sessionId) {
                    const targetPb = path.join(antigravityPath, `${sessionId}.pb`);
                    if (fs.existsSync(targetPb)) {
                        targets.unshift(targetPb); // Put at the front
                    }
                }

                const pbFiles = fs.readdirSync(antigravityPath)
                    .filter(f => f.endsWith('.pb') && f !== `${sessionId}.pb`)
                    .map(f => path.join(antigravityPath, f));
                
                // Limit background PB files to 5 to avoid noise/OOM
                targets.push(...pbFiles.slice(0, 5));
            } catch (e) {}
        }
        
        // Fallback: Check .pb in project root as well
        const localPbDir = path.join(projectRoot, '.pb');
        if (fs.existsSync(localPbDir)) {
            try {
                const localPbs = fs.readdirSync(localPbDir).filter(f => f.endsWith('.pb')).map(f => path.join(localPbDir, f));
                targets.push(...localPbs);
            } catch (e) {}
        }

        return RawTextMiner.mine(targets);
    }

    /**
     * [v0.2.38] Enhanced Role Detection
     */
    private static detectRole(content: string): 'user' | 'assistant' {
        const text = content.trim();
        const userMarkers = ['?', '왜', '어떻게', '해줘', '보여줘', '코드', 'fix', 'how', 'why', 'explain'];
        const hasUserMarker = userMarkers.some(m => text.toLowerCase().includes(m));
        
        // If it's a short question-like string, it's likely the user
        if (hasUserMarker && text.length < 200) return 'user';
        
        // Default to assistant for long explanations
        return 'assistant';
    }

    /**
     * 공통 메시지 처리 로직
     */
    private static async processMessages(messages: TrajectoryEntry[], auditLogFilePath: string, projectRoot: string) {
        const promptLogger = PromptLogger.getInstance();
        let insertedCount = 0;

        for (const entry of messages) {
            const text = entry.content.trim();
            const role = entry.role;
            if (!text) continue;

            const msgHash = crypto.createHash('md5').update(`${role}:${text}`).digest('hex');
            if (this.seenMessageHashes.has(msgHash)) continue;

            this.seenMessageHashes.add(msgHash);
            insertedCount++;

            if (role === 'user') {
                promptLogger.appendUser(auditLogFilePath, text);
            } else {
                promptLogger.appendAssistant(auditLogFilePath, text);
            }
        }

        if (insertedCount > 0) {
            promptLogger.appendAction(auditLogFilePath, 'system_msg', `Scraper: Successfully ingested ${insertedCount} new messages.`, projectRoot);
        }
    }

    /**
     * 리눅스 환경 기준 state.vscdb 경로 탐색
     */
    private static getVscdbPath(): string | null {
        // [v0.2.37] Leverage ChatExtractor's logic
        const context = (ChatExtractor as any)._context;
        if (context) {
            const globalPath = ChatExtractor.getGlobalVscdbPath(context);
            if (globalPath) return globalPath;
        }

        const home = os.homedir();
        const linuxPaths = [
            path.join(home, '.config', 'Antigravity', 'User', 'globalStorage', 'state.vscdb'),
            path.join(home, '.config', 'Code', 'User', 'globalStorage', 'state.vscdb'),
            path.join(home, '.config', 'Code - Insiders', 'User', 'globalStorage', 'state.vscdb'),
            path.join(home, 'snap', 'code', 'common', '.config', 'Code', 'User', 'globalStorage', 'state.vscdb'),
            path.join(home, '.var', 'app', 'com.visualstudio.code', 'config', 'Code', 'User', 'globalStorage', 'state.vscdb')
        ];

        for (const p of linuxPaths) {
            if (fs.existsSync(p)) return p;
        }
        
        const macPath = path.join(home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'state.vscdb');
        if (fs.existsSync(macPath)) return macPath;

        return null;
    }
}
