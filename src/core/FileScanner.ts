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
            } else if (['.cpp', '.h', '.c', '.hpp', '.cc'].includes(ext)) {
                this.parseCpp(content, summary);
            } else if (ext === '.rs') {
                this.parseRust(content, summary);
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
        const importRegex = /import\s+.*from\s+['"](.+)['"]|require\s*\(\s*['"](.+)['"]\s*\)|import\s*\(\s*['"](.+)['"]\s*\)/g;
        while ((match = importRegex.exec(content)) !== null) {
            const ref = match[1] || match[2] || match[3];
            if (ref && !summary.references.includes(ref)) {
                const cleanRef = path.basename(ref, path.extname(ref));
                if (cleanRef && !summary.references.includes(cleanRef)) {
                    summary.references.push(cleanRef);
                }
            }
        }
    }

    private parseCpp(content: string, summary: CodeSummary) {
        // C++ 클래스 및 구조체
        // Namespace::ClassName 등 지원
        const classRegex = /(?:class|struct)\s+([a-zA-Z0-9_:]+)[\s{:]/gm;
        let match;
        while ((match = classRegex.exec(content)) !== null) {
            const className = match[1];
            if (className && !summary.classes.includes(className)) {
                summary.classes.push(className);
            }
        }

        // C/C++ 함수 (반환 타입, 포인터, 레퍼런스, 네임스페이스 포함)
        const funcRegex = /^\s*[\w\s:*&<>]+?\s+([\w::]+)\s*\((?:[^()]*|\([^()]*\))*\)\s*(?:const)?\s*{/gm;
        while ((match = funcRegex.exec(content)) !== null) {
            const funcName = match[1];
            // 키워드 제외
            if (funcName && !['if', 'while', 'for', 'switch', 'return', 'catch'].includes(funcName)) {
                if (!summary.functions.includes(funcName)) {
                    summary.functions.push(funcName);
                }
            }
        }

        // C/C++ 인클루드 (references)
        const includeRegex = /#include\s+["<]([^">]+)[">]/g;
        while ((match = includeRegex.exec(content)) !== null) {
            const ref = match[1];
            if (ref) {
                const cleanRef = path.basename(ref, path.extname(ref));
                if (cleanRef && !summary.references.includes(cleanRef)) {
                    summary.references.push(cleanRef);
                }
            }
        }
    }

    private parseRust(content: string, summary: CodeSummary) {
        // Rust structs, enums, and traits
        const typeRegex = /^\s*(?:pub(?:\([^)]+\))?\s+)?(?:struct|enum|trait)\s+([a-zA-Z0-9_]+)/gm;
        let match;
        while ((match = typeRegex.exec(content)) !== null) {
            const typeName = match[1];
            if (typeName && !summary.classes.includes(typeName)) {
                summary.classes.push(typeName);
            }
        }

        // Rust impl blocks (extract type name)
        const implRegex = /^\s*impl(?:\s+<[^>]+>)?\s+([a-zA-Z0-9_]+)(?:\s+for\s+([a-zA-Z0-9_]+))?/gm;
        while ((match = implRegex.exec(content)) !== null) {
            const traitName = match[1];
            const forType = match[2];
            const target = forType || traitName;
            if (target && !summary.classes.includes(target)) {
                summary.classes.push(target);
            }
        }

        // Rust functions
        const funcRegex = /^\s*(?:pub(?:\([^)]+\))?\s+)?(?:async\s+)?fn\s+([a-zA-Z0-9_]+)/gm;
        while ((match = funcRegex.exec(content)) !== null) {
            const funcName = match[1];
            if (funcName && !summary.functions.includes(funcName)) {
                summary.functions.push(funcName);
            }
        }

        // Rust use statements (references)
        const useRegex = /^\s*use\s+([^;]+);/gm;
        while ((match = useRegex.exec(content)) !== null) {
            const ref = match[1].trim();
            if (ref) {
                // Get the last part of the path
                const parts = ref.split('::');
                const lastPart = parts[parts.length - 1].replace(/[{}]/g, '').split(',')[0].trim();

                if (lastPart && lastPart !== '*' && !summary.references.includes(lastPart)) {
                    summary.references.push(lastPart);
                }
            }
        }
    }
}
