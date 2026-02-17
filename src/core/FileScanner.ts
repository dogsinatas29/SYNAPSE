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
                console.log(`[SYNAPSE] Parsing Python: ${filePath}`);
                this.parsePython(content, summary);
            } else if (['.ts', '.js'].includes(ext)) {
                console.log(`[SYNAPSE] Parsing JavaScript/TypeScript: ${filePath}`);
                this.parseJavaScript(content, summary);
            } else if (['.cpp', '.h', '.c', '.hpp', '.cc'].includes(ext)) {
                console.log(`[SYNAPSE] Parsing C/C++: ${filePath}`);
                this.parseCpp(content, summary);
            } else if (ext === '.rs') {
                console.log(`[SYNAPSE] Parsing Rust: ${filePath}`);
                this.parseRust(content, summary);
            } else if (ext === '.sh') {
                console.log(`[SYNAPSE] Parsing Shell Script: ${filePath}`);
                this.parseShell(content, summary);
            } else if (ext === '.sql') {
                console.log(`[SYNAPSE] Parsing SQL: ${filePath}`);
                this.parseSql(content, summary);
            } else if (['.json', '.yaml', '.yml', '.toml'].includes(ext)) {
                console.log(`[SYNAPSE] Parsing Configuration: ${filePath}`);
                this.parseConfig(content, summary);
            } else if (ext === '.md') {
                console.log(`[SYNAPSE] Parsing Markdown: ${filePath}`);
                this.parseMarkdown(content, summary);
            }
            console.log(`[SYNAPSE] Finished parsing: ${path.basename(filePath)}`);
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

        // C/C++ 함수 (정의 { 와 선언 ; 모두 지원, ReDoS 방지를 위해 단순화)
        // 기본 구조: 반환타입 [공백] 함수명 (인자) [const] { 또는 ;
        const funcRegex = /^\s*(?:[\w\s:*&<>]+\s+)?([\w::]+)\s*\([^)]*\)\s*(?:const)?\s*(?={|;)/gm;
        while ((match = funcRegex.exec(content)) !== null) {
            const funcName = match[1];
            // 키워드 제외
            if (funcName && !['if', 'while', 'for', 'switch', 'return', 'catch', 'template', 'using', 'static', 'explicit'].includes(funcName)) {
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

    private parseShell(content: string, summary: CodeSummary) {
        // Shell functions: function name() or name()
        const funcRegex = /^(?:function\s+)?([a-zA-Z0-9_-]+)\s*\(\s*\)/gm;
        let match;
        while ((match = funcRegex.exec(content)) !== null) {
            summary.functions.push(match[1]);
        }

        // References (scripts calling other scripts or bins)
        const refRegex = /(?:\.|\.\/|source\s+|bash\s+|sh\s+)([a-zA-Z0-9_-]+\.sh)/g;
        while ((match = refRegex.exec(content)) !== null) {
            const ref = match[1];
            if (ref && !summary.references.includes(ref)) {
                summary.references.push(ref);
            }
        }
    }

    private parseSql(content: string, summary: CodeSummary) {
        // SQL Tables
        const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_."]+)/gi;
        let match;
        while ((match = tableRegex.exec(content)) !== null) {
            summary.classes.push(match[1]);
        }

        // SQL Views/Procedures
        const procRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?(?:VIEW|PROCEDURE|FUNCTION)\s+([a-zA-Z0-9_."]+)/gi;
        while ((match = procRegex.exec(content)) !== null) {
            summary.functions.push(match[1]);
        }
    }

    private parseConfig(content: string, summary: CodeSummary) {
        // Config files (JSON/YAML/TOML) - look for key names that look like imports/extends
        const refRegex = /"(?:extends|import|using|include|source)"\s*:\s*"([^"]+)"|extends\s*:\s*([^\n]+)|import\s+([^\n]+)/gi;
        let match;
        while ((match = refRegex.exec(content)) !== null) {
            const ref = (match[1] || match[2] || match[3] || '').trim();
            if (ref && !summary.references.includes(ref)) {
                // Remove quotes if present
                const cleanRef = ref.replace(/['"]/g, '');
                summary.references.push(cleanRef);
            }
        }
    }

    private parseMarkdown(content: string, summary: CodeSummary) {
        // MD Headers (# Header) as classes/sections
        const headerRegex = /^(#{1,6})\s+(.+)$/gm;
        let match;
        while ((match = headerRegex.exec(content)) !== null) {
            summary.classes.push(match[2].trim());
        }

        // MD Links ([label](path/to/file)) as references
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        while ((match = linkRegex.exec(content)) !== null) {
            const ref = match[2].trim();
            if (ref && !ref.startsWith('http') && !ref.startsWith('#')) {
                // Clean path to file basename
                const cleanRef = path.basename(ref, path.extname(ref));
                if (cleanRef && !summary.references.includes(cleanRef)) {
                    summary.references.push(cleanRef);
                }
            }
        }
    }
}
