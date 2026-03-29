import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { PromptLogger } from './PromptLogger';

/**
 * [v0.2.40] DirectChatScraper - Restored State & Precision Fallback
 *
 * PB 트리거 수신 시 채팅 UI에서 하드카피(Clipboard)로 대화 내용을 직접 가져옵니다.
 * - Copilot 포커스로 인한 빈 화면 복사 버그 해결
 * - antigravity.toggleChatFocus / Gemini 우선 타격으로 변경
 * - Blind Copy Fallback (Select All + Copy) 로직 포함
 */
export class DirectChatScraper {
    private static isScraping = false;
    private static lastScrapedHash = '';
    private static seenMessageHashes = new Set<string>();

    public static async scrapeActiveChat(auditLogFilePath: string, sessionId?: string) {
        if (this.isScraping) return;
        this.isScraping = true;

        const promptLogger = PromptLogger.getInstance();
        const projectRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';

        try {
            promptLogger.appendAction(auditLogFilePath, 'system_msg',
                `Scraper: UI HardCopy initiated (session: ${sessionId || 'unknown'})`, projectRoot);

            // [Diagnostic Probe] 0. 관련 명령어 조사
            const allCommands = await vscode.commands.getCommands(true);
            const geminiCommands = allCommands.filter(cmd => /gemini/i.test(cmd)).sort();
            if (geminiCommands.length > 0) {
                 promptLogger.appendAction(auditLogFilePath, 'system_msg',
                     `Diagnostic: Found gemini commands: [${geminiCommands.join(', ')}]`, projectRoot);
            }

            // [Step 1] 채팅 패널 포커스 (비토글 방식 우선)
            // 1순위: 제미나이 강제 활성화 (non-toggling)
            // 주의: toggle 커맨드는 창이 열려있을 때 창을 닫아버리므로 제외/후순위 처리
            const focusCommands = [
                'workbench.view.extension.google-gemini',
                'workbench.view.extension.gemini',
                'gemini.focus',
                'workbench.action.chat.focus',
                'workbench.panel.chat.view.copilot.focus', // 최후의 보루
                'workbench.action.focusChat',
            ];

            let focusedCmd = '';
            for (const cmd of focusCommands) {
                try {
                    await vscode.commands.executeCommand(cmd);
                    focusedCmd = cmd;
                    promptLogger.appendAction(auditLogFilePath, 'system_msg',
                        `Scraper: Focused via ${cmd}`, projectRoot);
                    break;
                } catch (e) {}
            }

            if (!focusedCmd) {
                promptLogger.appendAction(auditLogFilePath, 'system_msg',
                    'Scraper: Focus commands failed. Attempting blind fallback.', projectRoot);
            }

            // 포커스 후 UI 렌더링 / Linux X11 컨텍스트 딜레이 대기 (충분한 시간 확보)
            await new Promise(resolve => setTimeout(resolve, 800));

            // [Step 2] 클립보드 백업
            const backupText = (await vscode.env.clipboard.readText()) || '';
            let copiedChat = '';
            let retryCount = 0;
            const MAX_RETRIES = 5;

            // [Step 3] 채팅 전체 복사 명령 시도
            const copyCommands = [
                'antigravity.action.chat.copyAll',
                'google.gemini.chat.copyAll',
                'google-gemini.chat.copyAll',
                'gemini.chat.copyAll',
                'workbench.action.chat.copyAll',
                'github.copilot.chat.copyAll',
                'workbench.action.chat.export',
                'BLIND_COPY_FALLBACK' // 'Select All' + 'Copy'
            ];

            while (retryCount < MAX_RETRIES) {
                for (const cmd of copyCommands) {
                    try {
                        if (cmd === 'BLIND_COPY_FALLBACK') {
                             // Blind Copy: 전체 선택 후 복사 액션 시뮬레이션
                             await vscode.commands.executeCommand('editor.action.selectAll');
                             await new Promise(resolve => setTimeout(resolve, 150));
                             await vscode.commands.executeCommand('editor.action.clipboardCopyAction');
                        } else {
                             await vscode.commands.executeCommand(cmd);
                        }

                        // Linux 클립보드 동기화 딜레이 대기
                        await new Promise(resolve => setTimeout(resolve, 700));
                        const candidate = await vscode.env.clipboard.readText();

                        if (candidate && candidate.trim().length > 0 && candidate.trim() !== backupText.trim()) {
                            copiedChat = candidate;
                            promptLogger.appendAction(auditLogFilePath, 'system_msg',
                                `Scraper: Copy success via ${cmd} (len: ${copiedChat.length})`, projectRoot);
                            break;
                        }
                    } catch (e) {}
                }

                if (copiedChat && copiedChat.trim() !== backupText.trim()) break;

                retryCount++;
                await new Promise(resolve => setTimeout(resolve, 400 * retryCount));
            }

            // [Step 4] 클립보드 원상 복구 (에디터 클립보드 파손 방지)
            await vscode.env.clipboard.writeText(backupText);

            if (!copiedChat || copiedChat.trim().length === 0) {
                promptLogger.appendAction(auditLogFilePath, 'system_msg',
                    'Scraper: No text captured from UI clipboard.', projectRoot);
                return;
            }

            // [Step 5] 중복 체크
            const currentHash = crypto.createHash('sha256').update(copiedChat).digest('hex');
            if (currentHash === this.lastScrapedHash) {
                promptLogger.appendAction(auditLogFilePath, 'system_msg',
                    'Scraper: Content unchanged, skipping.', projectRoot);
                return;
            }
            this.lastScrapedHash = currentHash;

            const snippet = copiedChat.trim().substring(0, 80).replace(/\n/g, ' ');
            promptLogger.appendAction(auditLogFilePath, 'system_msg',
                `Scraper: Snippet: "${snippet}..."`, projectRoot);

            // [Step 6] 화자 레이블 기반 파싱
            await this.parseAndLog(copiedChat, auditLogFilePath, projectRoot);

        } catch (error: any) {
            promptLogger.appendAction(auditLogFilePath, 'system_msg',
                `Scraper: Error - ${error.message || error}`, projectRoot);
        } finally {
            this.isScraping = false;
        }
    }

    private static async parseAndLog(text: string, auditLogFilePath: string, projectRoot: string) {
        const promptLogger = PromptLogger.getInstance();
        const speakerPatternStr = '(?:User|You|Gemini|Assistant|Antigravity|Secretary|System|AI|Copilot|Github Copilot|Antigravity AI)';
        const speakerRegex = new RegExp(`^[\\s\\*\\(\\[]*(${speakerPatternStr})[\\s\\*\\)\\]]*[:\\-\\s]*`, 'i');

        const blocks = text.split(new RegExp(
            `\\n(?=[\\s\\*\\(\\[]*${speakerPatternStr}[\\s\\*\\)\\]]*[:\\-\\s]|\\n[\\s\\*\\(\\[]*${speakerPatternStr})`, 'i'
        ));

        let insertedCount = 0;

        for (const block of blocks) {
            const content_raw = block.trim();
            if (!content_raw) continue;

            const speakerMatch = content_raw.match(speakerRegex);
            if (!speakerMatch) continue;

            const speakerName = speakerMatch[1];
            const content = content_raw.substring(speakerMatch[0].length).trim();
            if (!content) continue;

            const msgHash = crypto.createHash('md5').update(`${speakerName}:${content}`).digest('hex');
            if (this.seenMessageHashes.has(msgHash)) continue;

            this.seenMessageHashes.add(msgHash);
            insertedCount++;

            if (/^(User|You)$/i.test(speakerName)) {
                promptLogger.appendUser(auditLogFilePath, content);
            } else if (/^System$/i.test(speakerName)) {
                promptLogger.appendAction(auditLogFilePath, 'system_msg', content, projectRoot);
            } else {
                promptLogger.appendAssistant(auditLogFilePath, content);
            }
        }

        if (insertedCount > 0) {
            promptLogger.appendAction(auditLogFilePath, 'system_msg',
                `Scraper: Ingested ${insertedCount} new messages.`, projectRoot);
        } else {
            promptLogger.appendAction(auditLogFilePath, 'system_msg',
                'Scraper: No new parseable messages found.', projectRoot);
        }
    }
}
