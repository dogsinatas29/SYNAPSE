import * as fs from 'fs';
import * as crypto from 'crypto';
import { PromptLogger } from './PromptLogger';

/**
 * [v0.2.42] DirectPbExtractor - The Island Finder (UTF-16LE & UTF-8 Deep Miner)
 * 
 * Bypasses UI webview sandboxing by directly mining strings from binary .pb files.
 * Uses a multi-offset 'Island Finder' algorithm to catch strings in various encodings.
 */
export class DirectPbExtractor {
    private static seenMessageHashes = new Set<string>();

    public static async extractAndLog(auditLogFilePath: string, pbFilePath: string, sessionId: string, projectRoot: string) {
        const promptLogger = PromptLogger.getInstance();

        if (!fs.existsSync(pbFilePath)) {
            promptLogger.appendAction(auditLogFilePath, 'system_msg', `PB Miner: File NOT found - ${pbFilePath}`, projectRoot);
            return;
        }
        
        try {
            const buffer = fs.readFileSync(pbFilePath);
            promptLogger.appendAction(auditLogFilePath, 'system_msg', `PB Miner: Reading ${pbFilePath} (${buffer.length} bytes)`, projectRoot);
            const discoveredMessages: { text: string; role: 'user' | 'assistant' }[] = [];
            
            // [Action 1] Multi-Encoding/Offset "Island Finder"
            // We probe UTF-16LE (even/odd offsets) and UTF-8
            const candidates: string[] = [];
            
            // 1. Try UTF-16LE (Offset 0)
            candidates.push(...this.findIslands(buffer, 'utf16le', 0));
            // 2. Try UTF-16LE (Offset 1 - for staggered strings)
            candidates.push(...this.findIslands(buffer, 'utf16le', 1));
            // 3. Try UTF-8
            candidates.push(...this.findIslands(buffer, 'utf8', 0));

            for (const text of candidates) {
                const cleaned = this.cleanText(text);
                
                // [v0.2.43 DEBUG] Force Log Raw Islands
                if (cleaned.length > 5) {
                    promptLogger.appendAction(auditLogFilePath, 'system_msg', `DEBUG: Raw Island Candidate: ${cleaned.substring(0, 100)}${cleaned.length > 100 ? '...' : ''}`, projectRoot);
                }

                if (!cleaned || cleaned.length < 5) continue;

                // [Action 2] Hangeul Density & Legitimacy Heuristic
                if (!this.isLegitConversation(cleaned)) {
                    // Log why it was rejected if it looks like it might be something
                    if (cleaned.length > 20) {
                         promptLogger.appendAction(auditLogFilePath, 'system_msg', `DEBUG: Rejected Island (Filter): ${cleaned.substring(0, 50)}...`, projectRoot);
                    }
                    continue;
                }

                const msgHash = crypto.createHash('sha256').update(cleaned).digest('hex');
                if (this.seenMessageHashes.has(msgHash)) continue;
                this.seenMessageHashes.add(msgHash);

                // [Action 3] Advanced Role Detection
                const role = this.detectRole(cleaned);
                discoveredMessages.push({ text: cleaned, role });
            }

            if (discoveredMessages.length > 0) {
                promptLogger.appendAction(auditLogFilePath, 'system_msg', `PB Miner: Extracted ${discoveredMessages.length} new messages using Island Finder.`, projectRoot);
                for (const msg of discoveredMessages) {
                    if (msg.role === 'user') {
                        promptLogger.appendUser(auditLogFilePath, msg.text);
                    } else {
                        promptLogger.appendAssistant(auditLogFilePath, msg.text);
                    }
                }
            }
        } catch (e: any) {
             promptLogger.appendAction(auditLogFilePath, 'system_msg', `PB Miner Error: ${e.message}`, projectRoot);
        }
    }

    private static findIslands(buffer: Buffer, encoding: BufferEncoding, offset: number): string[] {
        const islands: string[] = [];
        const decoded = buffer.slice(offset).toString(encoding);
        
        // Split by null characters or common binary noise patterns
        // We use a regex that identifies continuous "readable" blocks
        // Alphanumeric + Hangeul + Symbols + Whitespace
        // [v0.2.43] Relaxed regex for broad extraction
        const islandRegex = /[\t\n\r\u0020-\u007E\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]{5,}/g;
        const matches = decoded.match(islandRegex) || [];
        
        return matches;
    }

    private static cleanText(text: string): string {
        let cleaned = text.trim();
        // Remove noise artifacts like isolated single chars or system dots
        cleaned = cleaned.replace(/\s+/g, ' ');
        
        // [v0.2.46] Mirror Loop Suppression: Exclude internal module names and architecture keywords
        const internalKeywords = [
            'LogicAnalyzer', 'PromptLogger', 'ChatExtractor', 'StreamAdapter', 'VscdbAdapter',
            'BootstrapEngine', 'WebviewInterceptor', 'ArchitectureDSL', 'SYNAPSE',
            'Sovereign Principles', 'GEMINI.md', 'RULES.md', '코딩 전 사고', '단순성 우선', '최소한의 변경'
        ];
        
        if (internalKeywords.some(k => cleaned.includes(k))) return '';

        // Filtering out common system strings
        if (cleaned.includes('workbench.')) return ''; // Only exclude workbench stuff
        if (cleaned.includes('ItemTable') || cleaned.startsWith('SQLITE')) return '';
        return cleaned;
    }

    private static isLegitConversation(text: string): boolean {
        // [v0.2.43] Relaxed Hangeul Density: 1%
        const hangeulMatches = text.match(/[\uAC00-\uD7A3]/g) || [];
        const hangeulRatio = hangeulMatches.length / text.length;
        
        // English sentence check: Relaxed
        const spaceCount = (text.match(/ /g) || []).length;
        
        if (hangeulRatio < 0.01 && spaceCount < 1 && text.length < 50) return false;
        
        // Length check: Relaxed to 5
        if (text.length < 5) return false;
        
        // Filter out hex-like or path-like noise
        if (/^[a-fA-F0-9\-\\\/]{20,}$/.test(text)) return false;

        return true;
    }

    private static detectRole(text: string): 'user' | 'assistant' {
        const userMarkers = ['?', '해줘', '알려줘', '보여줘', '설명해', 'fix', 'how', 'why', 'what', '코드', '작성', '수정', '의문', '요청'];
        const isUserIntent = userMarkers.some(marker => text.toLowerCase().includes(marker));
        
        // Heuristic: User prompts are usually shorter than Assistant responses
        if (isUserIntent && text.length < 800) {
            return 'user';
        }
        return 'assistant';
    }
}

