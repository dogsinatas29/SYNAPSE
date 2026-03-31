import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import * as vscode from 'vscode';

export class PromptLogger {
    private static instance: PromptLogger;
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

    /**
     * 세션 파일 초기화
     * 파일 형식: session_YYYY-MM-DD_HH-mm.md
     */
    public initializeSession(projectRoot: string): string {
        // [v0.2.29] Session Guard: 이미 활성화된 세션이 있다면 해당 경로 반환
        if (this.currentSessionPath && fs.existsSync(this.currentSessionPath) && this.currentProjectRoot === projectRoot) {
            return this.currentSessionPath;
        }

        const contextDir = path.join(projectRoot, '.synapse_contexts');
        if (!fs.existsSync(contextDir)) {
            fs.mkdirSync(contextDir, { recursive: true });
        }

        const now = new Date();
        const datePart = now.toISOString().split('T')[0];
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        // 초 단위까지 정밀하게 세션명 생성하여 충돌 방지
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const fileName = `session_${datePart}_${hours}-${minutes}-${seconds}.md`;
        const filePath = path.join(contextDir, fileName);

        const timestampStr = `${datePart} ${hours}:${minutes}:${seconds}`;

        if (!fs.existsSync(filePath)) {
            const header = `# Session — ${timestampStr}\n\n*Pure Event Channel Audit Log Activated (v0.2.53 Persistent Mode)*\n\n---\n`;
            fs.writeFileSync(filePath, header, 'utf-8');
            this.gitStageFile(projectRoot, filePath);
        }
        
        this.currentSessionPath = filePath;
        this.currentProjectRoot = projectRoot;
        return filePath;
    }

    public appendUser(filePath: string, content: string) {
        if (!content.trim()) return;
        
        let entry = '';
        if (content.startsWith('[GHOST]')) {
            const cleanContent = content.substring(7).trim();
            entry = `\n### 👻 Ghost Spy (DOM Capture)\n${cleanContent}\n`;
        } else {
            entry = `\n## User\n${content.trim()}\n`;
        }

        if (this.lastLogContent === entry) return;
        this.lastLogContent = entry;
        console.log(`[SYNAPSE][PROMPT] Appending ${content.startsWith('[GHOST]') ? 'Ghost' : 'User'} content (${content.length} chars)`);
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
        try {
            // [v0.2.45.2] Isolation Filter: Block strings containing internal module names
            const internalKeywords = ['LogicAnalyzer', 'PromptLogger', 'ChatExtractor', 'StreamAdapter', 'VscdbAdapter'];
            const blockLog = internalKeywords.some(k => content.includes(k) && content.includes('Boundary Violation'));
            
            if (blockLog) {
                console.log(`[SYNAPSE][PROMPT] Blocked boundary violation noise from log.`);
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
        return text.trim();
    }

    private gitStageFile(rootPath: string, filePath: string) {
        try {
            if (!fs.existsSync(path.join(rootPath, '.git'))) return;
            cp.exec(`git add "${filePath}"`, { cwd: rootPath });
        } catch (e) {}
    }
}

