import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { PromptLogger } from './PromptLogger';

export class ClipboardScraperAdapter {
    private static isScraping = false;
    private static lastScrapedHash: string = '';
    private static seenMessageHashes = new Set<string>();

    /**
     * [v0.2.35] Precision Scraping Pipeline based on Diagnostic Data
     */
    public static async scrapeActiveChat(auditLogFilePath: string) {
        if (this.isScraping) {
            console.log('[SYNAPSE] Scraper already running, skipping.');
            return;
        }
        this.isScraping = true;

        const promptLogger = PromptLogger.getInstance();
        const projectRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "";

        try {
            // [Diagnostic Probe] 0. 명령어 전수 조사 (기능 수행 전 1회)
            // 이를 통해 실제 로드된 '정확한' 포커스/복사 명령어를 찾아냄
            const allCommands = await vscode.commands.getCommands(true);
            const filteredCommands = allCommands.filter(cmd => 
                /gemini|chat|google|ai|anthropic/i.test(cmd)
            ).sort();
            
            promptLogger.appendAction(auditLogFilePath, 'system_msg', 
                `Diagnostic: Found ${filteredCommands.length} related commands: [${filteredCommands.join(', ')}]`, 
                projectRoot
            );

            promptLogger.appendAction(auditLogFilePath, 'system_msg', 'Scraper: Start probe...', projectRoot);

            // [Precision Focus] 1. 진단 로그 기반 정밀 타격 리스트 (v0.2.35)
            const focusCommands = [
                'antigravity.toggleChatFocus',             // 1순위: 전용 커맨드
                'workbench.panel.chat.view.copilot.focus', // 2순위: 챗 패널 직접 타격
                'workbench.action.chat.focus',             // 3순위: 표준 챗 포커스
                'workbench.view.extension.google-gemini',   // 4순위: 뷰 컨테이너 강제 활성화
                'inlineChat.focus',                        // 5순위: 인라인 챗 대응
                'workbench.action.focusChat',
                'workbench.action.focusSideBar'
            ];
            
            let focused = false;
            for (const cmd of focusCommands) {
                try { 
                    await vscode.commands.executeCommand(cmd); 
                    focused = true;
                    promptLogger.appendAction(auditLogFilePath, 'system_msg', `Scraper: Focused via ${cmd}`, projectRoot);
                    break; 
                } catch (e) {}
            }
            if (!focused) {
                promptLogger.appendAction(auditLogFilePath, 'system_msg', 'Scraper: Focus commands failed. Attempting blind copy.', projectRoot);
            }

            // Linux 환경 대응: 포커싱 후 컨텍스트 로딩 대기 시간 약간 상향
            await new Promise(resolve => setTimeout(resolve, 500)); 

            // [Backup] 2. 기존 클립보드 데이터 백업
            const backupText = (await vscode.env.clipboard.readText()) || "";
            let copiedChat = "";
            let retryCount = 0;
            const MAX_RETRIES = 5; // 리눅스 환경 감안하여 재시도 횟수 상향

            // [Scrape Probe] 3. 전체 채팅 복사 명령 수행 (다중 커맨드 시도)
            const copyCommands = [
                'google.gemini.chat.copyAll',
                'google-gemini.chat.copyAll',
                'gemini.chat.copyAll',
                'workbench.action.chat.copyAll',
                'workbench.action.chat.export',
                'antigravity.action.chat.copyAll',
                'cursor.action.chat.copyAll',
                'github.copilot.chat.copyAll'
            ];

            while (retryCount < MAX_RETRIES) {
                for (const cmd of copyCommands) {
                    try {
                        await vscode.commands.executeCommand(cmd);
                        // 복사 명령 후 클립보드 동기화 대기 시간 (리눅스 지연 대응)
                        await new Promise(resolve => setTimeout(resolve, 600));
                        copiedChat = await vscode.env.clipboard.readText();
                        
                        // 백업과 다르거나 내용이 있으면 성공으로 간주
                        if (copiedChat && copiedChat.trim().length > 0 && copiedChat.trim() !== backupText.trim()) {
                            promptLogger.appendAction(auditLogFilePath, 'system_msg', `Scraper: Copy success via ${cmd} (len: ${copiedChat.length})`, projectRoot);
                            break;
                        }
                    } catch (e) {}
                }
                
                if (copiedChat && copiedChat.trim().length > 0 && (copiedChat.trim() !== backupText.trim() || backupText.trim() === "")) break;

                retryCount++;
                // 실패 시 점진적 재시도 지연 (Exponential-ish Backoff)
                await new Promise(resolve => setTimeout(resolve, 400 * retryCount));
            }

            // [Restore] 4. 클립보드 원상복구
            await vscode.env.clipboard.writeText(backupText);

            if (!copiedChat || copiedChat.trim().length === 0) {
                promptLogger.appendAction(auditLogFilePath, 'system_msg', 'Scraper: No text captured from clipboard', projectRoot);
                this.isScraping = false;
                return;
            }

            // Snippet log for debugging (first 60 chars)
            const snippet = copiedChat.trim().substring(0, 60).replace(/\n/g, ' ');
            promptLogger.appendAction(auditLogFilePath, 'system_msg', `Scraper: Captured snippet: "${snippet}..."`, projectRoot);

            // 전체 내용 해시 체크
            const currentHash = crypto.createHash('sha256').update(copiedChat).digest('hex');
            if (currentHash === this.lastScrapedHash) {
                promptLogger.appendAction(auditLogFilePath, 'system_msg', 'Scraper: Content hash unchanged, skipping parse', projectRoot);
                this.isScraping = false;
                return;
            }
            this.lastScrapedHash = currentHash;

            // [Parse] 5. 화자 레이블 기반 파싱
            const speakerPatternStr = '(?:User|You|Gemini|Assistant|Antigravity|Secretary|System|AI|Copilot|Github Copilot|Antigravity AI)';
            const speakerRegex = new RegExp(`^[\\s\\*\\(\\[]*(${speakerPatternStr})[\\s\\*\\)\\]]*[:\\-\\s]*`, 'i');
            
            // 블록 분할
            const blocks = copiedChat.split(new RegExp(`\\n(?=[\\s\\*\\(\\[]*${speakerPatternStr}[\\s\\*\\)\\]]*[:\\-\\s]|\\n[\\s\\*\\(\\[]*${speakerPatternStr})`, 'i'));
            
            promptLogger.appendAction(auditLogFilePath, 'system_msg', `Scraper: Split into ${blocks.length} raw blocks`, projectRoot);

            let insertedCount = 0;

            for (const block of blocks) {
                const text = block.trim();
                if (!text) continue;
                
                const speakerMatch = text.match(speakerRegex);
                if (!speakerMatch) continue;

                const speakerName = speakerMatch[1];
                const content = text.substring(speakerMatch[0].length).trim();
                
                if (!content) continue;

                const msgHash = crypto.createHash('md5').update(`${speakerName}:${content}`).digest('hex');
                if (this.seenMessageHashes.has(msgHash)) continue;
                
                this.seenMessageHashes.add(msgHash);
                insertedCount++;

                if (/^(?:User|You)$/i.test(speakerName)) {
                    promptLogger.appendUser(auditLogFilePath, content);
                } else if (/^System$/i.test(speakerName)) {
                    promptLogger.appendAction(auditLogFilePath, 'system_msg', content, projectRoot);
                } else {
                    promptLogger.appendAssistant(auditLogFilePath, content);
                }
            }

            if (insertedCount > 0) {
                promptLogger.appendAction(auditLogFilePath, 'system_msg', `Scraper: Successfully ingested ${insertedCount} new messages.`, projectRoot);
            } else {
                promptLogger.appendAction(auditLogFilePath, 'system_msg', 'Scraper: No new messages found after parsing.', projectRoot);
            }

        } catch (error: any) {
            promptLogger.appendAction(auditLogFilePath, 'system_msg', `Scraper: Critical error - ${error.message || error}`, projectRoot);
            console.error('[SYNAPSE] Clipboard scraping critical error:', error);
        } finally {
            this.isScraping = false;
        }
    }
}
