import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import * as vscode from 'vscode';
import { SensitiveInfoMasker } from '../utils/SensitiveInfoMasker';

export class PromptLogger {
    private static instance: PromptLogger;
    private masker = new SensitiveInfoMasker();
    private lastAction: string = '';
    private lastLogContent: string = '';
    private currentSessionPath: string | null = null;
    private currentProjectRoot: string | null = null;

    private constructor() { }

    public static getInstance(): PromptLogger {
        if (!PromptLogger.instance) {
            PromptLogger.instance = new PromptLogger();
        }
        return PromptLogger.instance;
    }

    public initializeSession(projectRoot: string): string {
        // [v0.3.14 Lockdown] Context Vault is DEPRECATED and REMOVED.
        // No more .synapse_contexts/ creation or persistent audit logging.
        console.log('[SYNAPSE][PROMPT] Context Vault is removed. Persistent logging suppressed.');
        this.currentSessionPath = null;
        this.currentProjectRoot = projectRoot;
        return ''; 
    }

    public appendUser(filePath: string, content: string) {
        if (!content.trim()) return;
        
        let entry = '';
        const maskedContent = this.masker.mask(content);
        
        if (maskedContent.startsWith('[GHOST]')) {
            const cleanContent = maskedContent.substring(7).trim();
            entry = `\n### 👻 Ghost Spy (DOM Capture)\n${cleanContent}\n`;
        } else {
            entry = `\n## User\n${maskedContent.trim()}\n`;
        }

        if (this.lastLogContent === entry) return;
        this.lastLogContent = entry;
        console.log(`[SYNAPSE][PROMPT] Appending ${content.startsWith('[GHOST]') ? 'Ghost' : 'User'} content (${maskedContent.length} chars)`);
        this.write(filePath, entry);
    }

    public appendAssistant(filePath: string, content: string) {
        if (!content.trim()) return;
        const cleaned = this.cleanAiResponse(content);
        const entry = `\n## Assistant\n${cleaned}\n`;
        if (this.lastLogContent === entry) return;
        this.lastLogContent = entry;
        console.log(`[SYNAPSE][PROMPT] Appending Assistant content (${content.length} chars)`);
        this.write(filePath, entry);
    }

    public appendAction(filePath: string, type: string, file: string, projectRoot: string) {
        const actionStr = `- ${type}: ${file}`;
        
        // 중복 방지 (바로 직전 액션과 동일하면 스킵)
        if (this.lastAction === actionStr) return;
        this.lastAction = actionStr;

        // Actions 섹션이 이미 있는지 확인 후 처리
        let logContent = '';
        try { 
            if (fs.existsSync(filePath)) {
                logContent = fs.readFileSync(filePath, 'utf-8'); 
            }
        } catch(e) {}

        let entry = '';
        if (!logContent.includes('\n## Actions\n')) {
            entry = `\n## Actions\n${actionStr}\n`;
        } else {
            entry = `${actionStr}\n`;
        }
        
        this.write(filePath, entry);
        console.log(`[SYNAPSE][PROMPT] Appending Action: ${type} ${file}`);
        this.gitStageFile(projectRoot, filePath);
    }

    public resetSession() {
        console.log(`[SYNAPSE][PROMPT] Resetting session. Current was: ${this.currentSessionPath}`);
        this.currentSessionPath = null;
        this.lastAction = '';
        this.lastLogContent = '';
    }

    public clearAllLogs(projectRoot: string) {
        const contextDir = path.join(projectRoot, '.synapse_contexts');
        if (fs.existsSync(contextDir)) {
            const files = fs.readdirSync(contextDir);
            files.forEach(f => {
                const p = path.join(contextDir, f);
                if (fs.statSync(p).isFile()) {
                    fs.unlinkSync(p);
                }
            });
            console.log(`[SYNAPSE][PROMPT] Purged all files in ${contextDir}`);
        }
        this.resetSession();
    }

    private write(filePath: string, content: string) {
        if (!filePath) return; // [v0.3.14] Guard for removed vault
        
        try {
            // [v0.2.45.2] Isolation Filter: Block strings containing internal module names
            const internalKeywords = ['LogicAnalyzer', 'PromptLogger', 'ChatExtractor', 'StreamAdapter', 'VscdbAdapter'];
            const blockLog = internalKeywords.some(k => content.includes(k) && content.includes('Boundary Violation'));
            
            if (blockLog) {
                console.log(`[SYNAPSE][PROMPT] Blocked boundary violation noise from log.`);
                return;
            }

            // [v0.3.14 Lockdown] Extra check to ensure we don't accidentally write to .synapse_contexts
            if (filePath.includes('.synapse_contexts')) {
                return;
            }

            console.log(`[SYNAPSE][PROMPT] Writing to: ${filePath}`);
            fs.appendFileSync(filePath, content, 'utf-8');
            // 새 대화가 시작되면 액션 중복 체크 초기화
            this.lastAction = ''; 
        } catch (e) {
            console.error(`[SYNAPSE] Failed to write to audit log: ${filePath}`, e);
        }
    }

    private cleanAiResponse(text: string): string {
        if (!text) return '';
        // [v0.2.22] Full Content Preservation - Do not exclude code blocks
        // [SYN-SEC-051] Mask Sensitive Info
        return this.masker.mask(text.trim());
    }

    private gitStageFile(rootPath: string, filePath: string) {
        if (!filePath) return; // [v0.3.14] No file to stage
        try {
            if (!fs.existsSync(path.join(rootPath, '.git'))) return;
            cp.execFile('git', ['add', filePath], { cwd: rootPath });
        } catch (e) {}
    }
}

