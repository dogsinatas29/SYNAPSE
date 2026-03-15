import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import * as vscode from 'vscode';

export class PromptLogger {
    private static instance: PromptLogger;

    private constructor() { }

    public static getInstance(): PromptLogger {
        if (!PromptLogger.instance) {
            PromptLogger.instance = new PromptLogger();
        }
        return PromptLogger.instance;
    }

    /**
     * 사용자 명령(입력)과 그 결과로 변경된 내용(git diff)을 맥락 파일로 저장
     */
    public async appendLog(projectRoot: string, fileName: string, userCommand: string, aiResponse?: string): Promise<string> {
        const contextDir = path.join(projectRoot, '.synapse_contexts');
        if (!fs.existsSync(contextDir)) {
            fs.mkdirSync(contextDir, { recursive: true });
        }

        const filePath = path.join(contextDir, fileName);
        const timestamp = new Date().toLocaleString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });

        // git diff로 변경 요약 수집
        const diffSummary = await this.getGitDiffSummary(projectRoot);

        let contentToAppend = '';
        if (!fs.existsSync(filePath)) {
            contentToAppend += `# SYNAPSE Context Log\n\n`;
        }

        contentToAppend += `\n---\n\n`;
        contentToAppend += `## 📅 ${timestamp}\n\n`;
        contentToAppend += `### 💬 명령\n${userCommand}\n\n`;

        if (aiResponse) {
            contentToAppend += `### 🤖 답변 요약\n${this.cleanAiResponse(aiResponse)}\n\n`;
        }

        contentToAppend += `### 📝 변경 요약\n`;

        if (diffSummary.trim()) {
            contentToAppend += `\`\`\`diff\n${diffSummary}\n\`\`\`\n`;
        } else {
            contentToAppend += `_변경된 파일 없음_\n`;
        }

        fs.appendFileSync(filePath, contentToAppend, 'utf-8');
        console.log(`[SYNAPSE] Context log appended to: ${filePath}`);

        this.gitStageFile(projectRoot, filePath);
        return filePath;
    }

    /**
     * 레코딩 시작 시 즉시 파일 생성 (GEMINI.md 기준: YYYY-MM-DD_HHMM.md)
     * 파일을 미리 열어두고 나중에 내용을 채움
     */
    public startSession(projectRoot: string): string {
        const contextDir = path.join(projectRoot, '.synapse_contexts');
        if (!fs.existsSync(contextDir)) {
            fs.mkdirSync(contextDir, { recursive: true });
        }

        const now = new Date();
        const datePart = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timePart = now.toTimeString().slice(0, 5).replace(':', ''); // HHMM
        const fileName = `${datePart}_${timePart}.md`;
        const filePath = path.join(contextDir, fileName);

        const timestamp = now.toLocaleString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });

        // 파일 즉시 생성 (헤더만, 내용은 endSession에서 추가)
        const header = `# 🧠 Session: ${timestamp}\n\n> 레코딩 중... (CTRL+ALT+M으로 완료)\n\n`;
        fs.writeFileSync(filePath, header, 'utf-8');
        console.log(`[SYNAPSE] Session file created: ${filePath}`);
        return filePath;
    }

    /**
     * 레코딩 종료 시 해당 파일에 명령 + 답변 + git diff를 추가
     */
    public async endSession(projectRoot: string, filePath: string, command: string, aiResponse?: string): Promise<void> {
        const diffSummary = await this.getGitDiffSummary(projectRoot);

        let content = `## 💬 명령\n${command}\n\n`;

        if (aiResponse) {
            content += `## 🤖 답변 요약\n${this.cleanAiResponse(aiResponse)}\n\n`;
        }

        content += `## 📝 변경 요약\n`
            + (diffSummary.trim()
                ? `\`\`\`diff\n${diffSummary}\n\`\`\`\n`
                : `_변경된 파일 없음_\n`)
            + `\n---\n*SYNAPSE Context Vault*\n`;

        const now = new Date();
        const timestamp = now.toLocaleString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });

        // 파일 읽기 및 헤더 교체
        let existingContent = '';
        try {
            existingContent = fs.readFileSync(filePath, 'utf-8');
            // 헤더의 "레코딩 중..." 텍스트를 정규식으로 안전하게 제거
            existingContent = existingContent.replace(/> 레코딩 중\.\.\. \(CTRL\+ALT\+M으로 완료\)\n*/g, '');
        } catch (e) {
            existingContent = `# 🧠 Session: ${timestamp}\n\n`; // 파일이 없을 경우 기본 헤더
        }

        fs.writeFileSync(filePath, existingContent + content, 'utf-8');
        this.gitStageFile(projectRoot, filePath);
        console.log(`[SYNAPSE] Session completed: ${filePath}`);
    }

    /**
     * 별도 파일로 저장 (새 파일 모드)

     */
    public async logPrompt(projectRoot: string, userCommand: string, title?: string, aiResponse?: string): Promise<string> {
        const contextDir = path.join(projectRoot, '.synapse_contexts');
        if (!fs.existsSync(contextDir)) {
            fs.mkdirSync(contextDir, { recursive: true });
        }

        const now = new Date();
        const datePart = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timePart = now.toTimeString().slice(0, 5).replace(':', ''); // HHMM
        const safeTitle = title
            ? title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_가-힣]/g, '')
            : `context`;
        const fileName = `${datePart}_${timePart}_${safeTitle}.md`;
        const filePath = path.join(contextDir, fileName);

        const timestamp = now.toLocaleString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });

        const diffSummary = await this.getGitDiffSummary(projectRoot);

        let content = `# Context: ${title || '작업 기록'}\n\n`
            + `**시각**: ${timestamp}\n\n`
            + `---\n\n`
            + `## 💬 명령\n${userCommand}\n\n`;

        if (aiResponse) {
            content += `## 🤖 답변 요약\n${this.cleanAiResponse(aiResponse)}\n\n`;
        }

        content += `## 📝 변경 요약\n`
            + (diffSummary.trim()
                ? `\`\`\`diff\n${diffSummary}\n\`\`\`\n`
                : `_변경된 파일 없음_\n`)
            + `\n---\n*SYNAPSE Context Vault*\n`;

        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`[SYNAPSE] Context logged to: ${filePath}`);

        this.gitStageFile(projectRoot, filePath);
        return filePath;
    }

    /**
     * AI 답변에서 코드 블록과 불필요한 마크다운 노이즈 제거
     */
    private cleanAiResponse(text: string): string {
        if (!text) return '';
        
        // 1. 코드 블록 제거 (``` ... ```)
        let cleaned = text.replace(/```[\s\S]*?```/g, '\n> [Code Block Excluded]\n');
        
        // 2. 인라인 코드 제거
        cleaned = cleaned.replace(/`[^`]+`/g, (match) => match.length > 30 ? '[...]' : match);
        
        // 3. 다중 줄바꿈 정리
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
        
        return cleaned.trim();
    }

    /**
     * git diff --stat 출력(스테이징+언스테이징 포함)
     */
    private getGitDiffSummary(rootPath: string): Promise<string> {
        return new Promise((resolve) => {
            if (!fs.existsSync(path.join(rootPath, '.git'))) {
                resolve('(git 저장소 없음)');
                return;
            }

            // staged + unstaged diff stat을 모두 수집
            cp.exec(
                'git diff --stat HEAD 2>/dev/null || git diff --stat 2>/dev/null',
                { cwd: rootPath },
                (err, stdout) => {
                    if (err || !stdout.trim()) {
                        // HEAD가 없는 경우(초기 커밋 전) staged만 확인
                        cp.exec('git diff --cached --stat', { cwd: rootPath }, (e2, out2) => {
                            resolve(out2.trim() || '');
                        });
                    } else {
                        resolve(stdout.trim());
                    }
                }
            );
        });
    }

    /**
     * 파일을 git staging area에 추가
     */
    private gitStageFile(rootPath: string, filePath: string) {
        try {
            if (!fs.existsSync(path.join(rootPath, '.git'))) {
                return;
            }
            cp.exec(`git add "${filePath}"`, { cwd: rootPath }, (error) => {
                if (error) {
                    console.error(`[SYNAPSE] Git add failed: ${error.message}`);
                } else {
                    vscode.window.setStatusBarMessage(`✅ Context saved: ${path.basename(filePath)}`, 3000);
                }
            });
        } catch (e) {
            console.error('[SYNAPSE] Git operation error:', e);
        }
    }
}
