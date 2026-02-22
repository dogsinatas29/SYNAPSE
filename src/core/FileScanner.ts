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

        // Python 임포트 (references) - 줄 단위로 파싱하여 더 정확하게 추출
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            // 1. from a.b import c
            const fromMatch = trimmed.match(/^from\s+([a-zA-Z0-9_.]+)\s+import/);
            if (fromMatch) {
                const fromPart = fromMatch[1];
                const rootMod = fromPart.startsWith('.') ? fromPart : fromPart.split('.')[0];
                if (rootMod && !summary.references.includes(rootMod)) {
                    console.log(`  [DEP] Added reference (from): ${rootMod}`);
                    summary.references.push(rootMod);
                }
                continue; // from ... import 라인인 경우 처리 완료
            }

            // 2. import a, b as bb
            const importMatch = trimmed.match(/^import\s+([a-zA-Z0-9_.,\s]+)/);
            if (importMatch) {
                const importPart = importMatch[1];
                importPart.split(',').forEach(r => {
                    const parts = r.trim().split(/\s+/);
                    const name = parts[0];
                    if (name) {
                        const rootMod = name.startsWith('.') ? name : name.split('.')[0];
                        if (rootMod && !summary.references.includes(rootMod)) {
                            console.log(`  [DEP] Added reference (import): ${rootMod}`);
                            summary.references.push(rootMod);
                        }
                    }
                });
            }
        }
    }

    private parseJavaScript(content: string, summary: CodeSummary) {
        // JS/TS 클래스, 인터페이스, 타입, 열거형
        const classRegex = /(?:export\s+)?(?:class|interface|type|enum)\s+([a-zA-Z0-9_]+)/g;
        let match;
        while ((match = classRegex.exec(content)) !== null) {
            const name = match[1];
            if (name && !summary.classes.includes(name)) {
                summary.classes.push(name);
            }
        }

        // JS/TS 함수 및 메서드 (TS 접근 제어자 및 async 지원 강화)
        const funcRegex = /(?:export\s+)?(?:async\s+)?(?:function\s+([a-zA-Z0-9_]+)|([a-zA-Z0-9_]+)\s*\(|public\s+([a-zA-Z0-9_]+)|private\s+([a-zA-Z0-9_]+)|protected\s+([a-zA-Z0-9_]+))/g;
        while ((match = funcRegex.exec(content)) !== null) {
            const name = match[1] || match[2] || match[3] || match[4] || match[5];
            // 키워드 제외
            if (name && !['if', 'while', 'for', 'switch', 'return', 'catch', 'export', 'class', 'interface', 'type', 'enum', 'async', 'await'].includes(name)) {
                if (!summary.functions.includes(name)) {
                    summary.functions.push(name);
                }
            }
        }

        // JS/TS 임포트 (references, import type 지원)
        const importRegex = /(?:import|require)\s+(?:type\s+)?(?:.*from\s+)?['"](.+)['"]|import\s*\(\s*['"](.+)['"]\s*\)/g;
        while ((match = importRegex.exec(content)) !== null) {
            const ref = match[1] || match[2];
            if (ref) {
                // 상대 경로인 경우 파일명만 추출, 아니면 패키지명
                const cleanRef = ref.startsWith('.') ? path.basename(ref, path.extname(ref)) : ref.split('/')[0];
                if (cleanRef && !['react', 'vscode', 'path', 'fs'].includes(cleanRef) && !summary.references.includes(cleanRef)) {
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

        // C/C++ 인클루드 (references) - 시스템 헤더와 로컬 헤더 구분 강화
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('#include')) continue;

            const includeMatch = trimmed.match(/#include\s+(["<])([^">]+)([">])/);
            if (includeMatch) {
                const type = includeMatch[1]; // " 또는 <
                const ref = includeMatch[2];

                // 로컬 헤더("")는 프로젝트 내 의존성으로 처리, 시스템 헤더(<>)는 필터링하거나 별도 처리
                if (type === '"') {
                    const cleanRef = path.basename(ref, path.extname(ref));
                    if (cleanRef && !summary.references.includes(cleanRef)) {
                        console.log(`  [DEP] Added C++ local reference: ${cleanRef}`);
                        summary.references.push(cleanRef);
                    }
                } else if (type === '<') {
                    // 표준 라이브러리나 외부 라이브러리 (필요 시 external 노드로 활용 가능)
                    const systemLib = ref.split('/')[0];
                    // 흔한 표준 라이브러리 제외
                    if (!['iostream', 'vector', 'string', 'map', 'set', 'algorithm', 'stdio.h', 'stdlib.h'].includes(systemLib)) {
                        if (!summary.references.includes(systemLib)) {
                            // summary.references.push(systemLib); // 일단 보류하거나 주석으로 남김
                        }
                    }
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

        // Rust use statements (references) - 정밀 분석
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('use ')) continue;

            const useMatch = trimmed.match(/^use\s+([a-zA-Z0-9_:]+)/);
            if (useMatch) {
                const fullPath = useMatch[1];
                const parts = fullPath.split('::');
                const rootMod = parts[0];

                // crate, self, super 등 내부 참조 처리
                if (['crate', 'self', 'super'].includes(rootMod)) {
                    // 내부 모듈 의존성으로 처리 (실제 매핑을 위해 더 상세한 분석 가능)
                    const targetMod = parts[1] || rootMod;
                    if (targetMod && !summary.references.includes(targetMod)) {
                        console.log(`  [DEP] Added Rust internal reference: ${targetMod}`);
                        summary.references.push(targetMod);
                    }
                } else if (rootMod) {
                    // 외부 크레이트 또는 표준 라이브러리
                    if (!['std', 'core', 'alloc', 'prelude'].includes(rootMod)) {
                        if (!summary.references.includes(rootMod)) {
                            console.log(`  [DEP] Added Rust external reference: ${rootMod}`);
                            summary.references.push(rootMod);
                        }
                    }
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
        const refRegex = /(?:\.|\.\/|source\s+|bash\s+|sh\s+)([a-zA-Z0-9_-]+)(?:\.sh)?/g;
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
