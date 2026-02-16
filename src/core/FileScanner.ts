import * as fs from 'fs';
import * as path from 'path';

export interface CodeSummary {
    classes: string[];
    functions: string[];
    references: string[]; // 추가: 임포트 및 참조 관계
}

export class FileScanner {
    /**
     * 파일 내용을 읽고 클래스와 함수 목록을 추출
     */
    public scanFile(filePath: string): CodeSummary {
        const summary: CodeSummary = {
            classes: [],
            functions: [],
            references: []
        };

        if (!fs.existsSync(filePath)) {
            return summary;
        }

        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const ext = path.extname(filePath);

            if (ext === '.py') {
                this.parsePython(content, summary);
            } else if (['.ts', '.js'].includes(ext)) {
                this.parseJavaScript(content, summary);
            }
        } catch (error) {
            console.error(`[SYNAPSE] Failed to scan file ${filePath}:`, error);
        }

        return summary;
    }

    private parsePython(content: string, summary: CodeSummary) {
        // Python 클래스
        const classRegex = /^class\s+([a-zA-Z0-9_]+)[\s(:]/gm;
        let match;
        while ((match = classRegex.exec(content)) !== null) {
            summary.classes.push(match[1]);
        }

        // Python 함수
        const funcRegex = /^\s*def\s+([a-zA-Z0-9_]+)\s*\(/gm;
        while ((match = funcRegex.exec(content)) !== null) {
            summary.functions.push(match[1]);
        }

        // Python 임포트 (references)
        // import os, from board import Board 등 (더 유연하게 ^ 제거)
        const importRegex = /(?:from\s+([a-zA-Z0-9_.]+)\s+import|import\s+([a-zA-Z0-9_.,\s]+))/g;
        while ((match = importRegex.exec(content)) !== null) {
            const ref = match[1] || match[2];
            if (ref) {
                ref.split(',').forEach(r => {
                    const trimmed = r.trim().split(' ')[0]; // 'as' 제거
                    if (trimmed && !summary.references.includes(trimmed)) {
                        summary.references.push(trimmed);
                    }
                });
            }
        }
    }

    private parseJavaScript(content: string, summary: CodeSummary) {
        // JS/TS 클래스
        const classRegex = /export\s+class\s+([a-zA-Z0-9_]+)|class\s+([a-zA-Z0-9_]+)/g;
        let match;
        while ((match = classRegex.exec(content)) !== null) {
            summary.classes.push(match[1] || match[2]);
        }

        // JS/TS 함수 및 메서드
        const funcRegex = /export\s+function\s+([a-zA-Z0-9_]+)|function\s+([a-zA-Z0-9_]+)|async\s+([a-zA-Z0-9_]+)\s*\(|public\s+([a-zA-Z0-9_]+)\s*\(|private\s+([a-zA-Z0-9_]+)\s*\(/g;
        while ((match = funcRegex.exec(content)) !== null) {
            const name = match[1] || match[2] || match[3] || match[4] || match[5];
            if (name && !summary.functions.includes(name)) {
                summary.functions.push(name);
            }
        }

        // JS/TS 임포트 (references)
        // import { x } from './y', const x = require('z')
        const importRegex = /import\s+.*from\s+['"](.+)['"]|require\s*\(\s*['"](.+)['"]\s*\)|import\s*\(\s*['"](.+)['"]\s*\)/g;
        while ((match = importRegex.exec(content)) !== null) {
            const ref = match[1] || match[2] || match[3];
            if (ref && !summary.references.includes(ref)) {
                // 경로에서 파일명 추출 (예: ./utils -> utils)
                const cleanRef = path.basename(ref, path.extname(ref));
                if (cleanRef && !summary.references.includes(cleanRef)) {
                    summary.references.push(cleanRef);
                }
            }
        }
    }
}
