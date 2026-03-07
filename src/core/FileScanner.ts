import * as fs from 'fs';
import * as path from 'path';

export interface CodeSummary {
    classes: string[];
    functions: string[];
    references: { target: string, type: string, nodeId?: string, isApproved?: boolean }[]; // [v0.2.18.1.2] Keep track of approval state
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
            // [v0.2.18.1 Opt] Skip files larger than 1MB to prevent hangs
            const stats = fs.statSync(filePath);
            if (stats.size > 1024 * 1024) {
                console.warn(`[SYNAPSE] Skipping large file: ${filePath} (${Math.round(stats.size / 1024)} KB)`);
                return summary;
            }

            const content = fs.readFileSync(filePath, 'utf-8');

            // Basic binary check (look for null chars)
            if (content.includes('\0')) {
                console.warn(`[SYNAPSE] Skipping potential binary file: ${filePath}`);
                return summary;
            }

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
            // console.log(`[SYNAPSE] Finished parsing: ${path.basename(filePath)}`);
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
            if (!trimmed) continue;

            // [v0.2.18.1.2] Support parsing commented (pending/deleted) edges
            const isCommented = trimmed.startsWith('#');
            const isPendingOrDeleted = /\[SYNAPSE_(?:PENDING|DELETED)/.test(line);
            
            if (isCommented && !isPendingOrDeleted) continue;

            // 1. from a.b import c (Handles dots as path delimiters or extensions)
            const fromMatch = trimmed.match(/^(?:#\s*)?(?:\[SYNAPSE(?:_PENDING|_DELETED)?:[^\]]+\]\s*)?from\s+([a-zA-Z0-9_.]+)\s+import/);
            if (fromMatch) {
                const fromPart = fromMatch[1];
                // [v0.2.17 Patch 10] Recognize extensions for non-Python bridges (e.g., TEST.c)
                const knownExts = ['.c', '.ts', '.js', '.rs', '.sql', '.cpp', '.h', '.hpp', '.cc'];
                let rootMod = fromPart;

                const hasKnownExt = knownExts.some(ext => fromPart.toLowerCase().endsWith(ext));
                if (!hasKnownExt && !fromPart.startsWith('.')) {
                    rootMod = fromPart.split('.')[0];
                }

                if (rootMod && !summary.references.some(r => r.target === rootMod)) {
                    let type = 'dependency';
                    if (rootMod.match(/api|http|fetch|request/i)) type = 'api_call';
                    else if (rootMod.match(/db|sql|database|query/i)) type = 'db_query';

                    // [v0.2.17 Patch 13] Check for ID tag in the same line
                    const idMatch = line.match(/\[SYNAPSE(?:_PENDING|_DELETED)?:([^\]]+)\]/);
                    const nodeId = idMatch ? idMatch[1] : undefined;

                    // [v0.2.18.1] Infer Edge Type from syntax
                    if (trimmed.startsWith('from ')) type = 'reference';
                    else if (line.includes(' # static')) type = 'static_unidirectional';

                    console.log(`  [DEP] Added reference (from): ${rootMod} (ID: ${nodeId || 'none'}, Type: ${type}, Approved: ${!isPendingOrDeleted})`);
                    summary.references.push({ target: rootMod, type, nodeId, isApproved: !isPendingOrDeleted });
                }
                continue;
            }

            // 2. import a, b as bb
            const importMatch = trimmed.match(/^(?:#\s*)?(?:\[SYNAPSE(?:_PENDING|_DELETED)?:([^\]]+)\]\s*)?import\s+([a-zA-Z0-9_.,\s]+)/);
            if (importMatch) {
                const importPart = importMatch[1];
                importPart.split(',').forEach(r => {
                    const parts = r.trim().split(/\s+/);
                    const name = parts[0];
                    if (name) {
                        // [v0.2.17 Patch 10] Preserve extensions in import name
                        const knownExts = ['.c', '.ts', '.js', '.rs', '.sql', '.cpp', '.h', '.hpp', '.cc'];
                        let rootMod = name;

                        const hasKnownExt = knownExts.some(ext => name.toLowerCase().endsWith(ext));
                        if (!hasKnownExt && !name.startsWith('.')) {
                            rootMod = name.split('.')[0];
                        }

                        if (rootMod && !summary.references.some(r => r.target === rootMod)) {
                            let type = 'dependency';
                            if (rootMod.match(/api|http|fetch|request/i)) type = 'api_call';
                            else if (rootMod.match(/db|sql|database|query/i)) type = 'db_query';

                            // [v0.2.17 Patch 13] Check for ID tag in the same line
                            const idMatch = line.match(/\[SYNAPSE(?:_PENDING|_DELETED)?:([^\]]+)\]/);
                            const nodeId = idMatch ? idMatch[1] : undefined;

                            console.log(`  [DEP] Added reference (import): ${rootMod} (ID: ${nodeId || 'none'}, Type: ${type}, Approved: ${!isPendingOrDeleted})`);
                            summary.references.push({ target: rootMod, type, nodeId, isApproved: !isPendingOrDeleted });
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
        // [v0.2.18.2 Opt] Prevent matching inside template literals or dynamic requires with variables
        const importRegex = /(?:import|require)\s+(?:type\s+)?(?:.*from\s+)?['"]([^'"`${}]+)['"]|import\s*\(\s*['"]([^'"`${}]+)['"]\s*\)/g;
        while ((match = importRegex.exec(content)) !== null) {
            const ref = match[1] || match[2];
            if (ref) {
                // Ignore dynamic paths or very long non-file strings
                if (ref.includes('${') || ref.length > 100) continue;

                const cleanRef = ref.startsWith('.') ? path.basename(ref, path.extname(ref)) : ref.split('/')[0];
                if (cleanRef && !['react', 'vscode', 'path', 'fs', 'os', 'child_process'].includes(cleanRef) && !summary.references.some(r => r.target === cleanRef)) {
                    let type = 'dependency';
                    if (cleanRef.match(/api|http|fetch|axios/i)) type = 'api_call';
                    else if (cleanRef.match(/db|sql|database|query/i)) type = 'db_query';

                    summary.references.push({ target: cleanRef, type });
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
            if (!trimmed) continue;

            const isCommented = trimmed.startsWith('//') || trimmed.startsWith('/*');
            const isPendingOrDeleted = /\[SYNAPSE_(?:PENDING|DELETED)/.test(line);
            
            if (isCommented && !isPendingOrDeleted) continue;

            // Search for include in both active and commented lines
            const includeMatch = trimmed.match(/(?:#\s*include|#include)\s+(["<])([^">]+)([">])/);
            if (includeMatch) {
                const quoteType = includeMatch[1]; // " 또는 <
                const ref = includeMatch[2];

                // 로컬 헤더("")는 프로젝트 내 의존성으로 처리
                if (quoteType === '"') {
                    const cleanRef = path.basename(ref, path.extname(ref));
                    if (cleanRef && !summary.references.some(r => r.target === cleanRef)) {
                        let type = 'dependency';
                        
                        // [v0.2.18.1.2] Extract metadata from C++ comment line
                        const idMatch = line.match(/\[SYNAPSE(?:_PENDING|_DELETED)?:([^\]]+)\]/);
                        const nodeId = idMatch ? idMatch[1] : undefined;

                        console.log(`  [DEP] Added C++ reference: ${cleanRef} (Approved: ${!isPendingOrDeleted})`);
                        summary.references.push({ target: cleanRef, type, nodeId, isApproved: !isPendingOrDeleted });
                    }
                } else if (quoteType === '<') {
                    // 표준 라이브러리나 외부 라이브러리 (시스템 헤더)
                    const systemLib = ref.split('/')[0];
                    // 흔한 표준 라이브러리는 노이즈 방지를 위해 제외
                    const standardLibs = ['iostream', 'vector', 'string', 'map', 'set', 'algorithm', 'stdio.h', 'stdlib.h', 'stdint.h', 'stdbool.h', 'cmath', 'cstdio'];
                    if (!standardLibs.includes(systemLib)) {
                        if (!summary.references.some(r => r.target === systemLib)) {
                            console.log(`  [DEP] Added C++ system/external reference: ${systemLib}`);
                            summary.references.push({ target: systemLib, type: 'api_call' });
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

        // Rust use & mod statements (references) - 정밀 분석
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            const isCommented = trimmed.startsWith('//');
            const isPendingOrDeleted = /\[SYNAPSE_(?:PENDING|DELETED)/.test(line);

            if (isCommented && !isPendingOrDeleted) continue;

            // 1. Rust use statements
            const useMatch = trimmed.match(/^(?:\/\/\s*)?(?:\[SYNAPSE(?:_PENDING|_DELETED)?:[^\]]+\]\s*)?use\s+([a-zA-Z0-9_:]+)/);
            if (useMatch) {
                const fullPath = useMatch[1];
                const parts = fullPath.split('::');
                const rootMod = parts[0];

                // crate, self, super 등 내부 참조 처리
                if (['crate', 'self', 'super'].includes(rootMod)) {
                    const targetMod = parts[1] || rootMod;
                    if (targetMod && !summary.references.some(r => r.target === targetMod)) {
                        const idMatch = line.match(/\[SYNAPSE(?:_PENDING|_DELETED)?:([^\]]+)\]/);
                        const nodeId = idMatch ? idMatch[1] : undefined;
                        summary.references.push({ target: targetMod, type: 'dependency', nodeId, isApproved: !isPendingOrDeleted });
                    }
                } else if (rootMod) {
                    if (!['std', 'core', 'alloc', 'prelude'].includes(rootMod)) {
                        if (!summary.references.some(r => r.target === rootMod)) {
                            const idMatch = line.match(/\[SYNAPSE(?:_PENDING|_DELETED)?:([^\]]+)\]/);
                            const nodeId = idMatch ? idMatch[1] : undefined;
                            summary.references.push({ target: rootMod, type: 'api_call', nodeId, isApproved: !isPendingOrDeleted });
                        }
                    }
                }
            }

            // 2. Rust mod statements
            const modMatch = trimmed.match(/^(?:\/\/\s*)?(?:\[SYNAPSE(?:_PENDING|_DELETED)?:[^\]]+\]\s*)?mod\s+([a-zA-Z0-9_]+);/);
            if (modMatch) {
                const modName = modMatch[1];
                if (modName && !summary.references.some(r => r.target === modName)) {
                    const idMatch = line.match(/\[SYNAPSE(?:_PENDING|_DELETED)?:([^\]]+)\]/);
                    const nodeId = idMatch ? idMatch[1] : undefined;
                    summary.references.push({ target: modName, type: 'dependency', nodeId, isApproved: !isPendingOrDeleted });
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
        // [v0.2.18.2 Opt] Ignore common shell keywords and prevent matching bash variables as files
        const refRegex = /(?:\.|\.\/|source\s+|bash\s+|sh\s+)([a-zA-Z0-9_-]+)(?:\.sh)?(?:\s|$)/g;
        const shellKeywords = ['then', 'else', 'done', 'fi', 'exit', 'true', 'false', 'echo', 'grep', 'sed', 'awk', 'cat'];
        
        while ((match = refRegex.exec(content)) !== null) {
            const ref = match[1];
            if (ref && !shellKeywords.includes(ref) && !summary.references.some(r => r.target === ref)) {
                summary.references.push({ target: ref, type: 'dependency' });
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
            if (ref && !summary.references.some(r => r.target === ref)) {
                // Remove quotes if present
                const cleanRefActual = ref.replace(/['"]/g, '');
                summary.references.push({ target: cleanRefActual, type: 'dependency' });
            }
        }
    }

    private parseMarkdown(content: string, summary: CodeSummary) {
        // MD Headers (# Header) as classes/sections
        const headerRegex = /^(#{1,6})\s+(.+)$/gm;
        let match;
        let count = 0;
        const LIMIT = 20;

        while ((match = headerRegex.exec(content)) !== null) {
            if (count < LIMIT) {
                summary.classes.push(match[2].trim());
            } else if (count === LIMIT) {
                summary.classes.push('... (too many headers, truncated)');
            }
            count++;
        }

        // MD Links ([label](path/to/file)) as references
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        while ((match = linkRegex.exec(content)) !== null) {
            const ref = match[2].trim();
            if (ref && !ref.startsWith('http') && !ref.startsWith('#')) {
                // Clean path to file basename
                const cleanRef = path.basename(ref, path.extname(ref));
                if (cleanRef && !summary.references.some(r => r.target === cleanRef)) {
                    summary.references.push({ target: cleanRef, type: 'dependency' });
                }
            }
        }
    }
}
