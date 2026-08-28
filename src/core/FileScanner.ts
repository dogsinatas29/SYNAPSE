import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/Logger';
import { ScannerRegistry } from './ScannerRegistry';
import { CodeSummary, EdgeProvenance } from '../types/schema';

export { CodeSummary };

export class FileScanner {
    private static cache: Map<string, { summary: CodeSummary, mtime: number }> = new Map();
    private static readonly MAX_FULL_SCAN_BYTES = 1024 * 1024; // 1MB
    private static readonly DEFAULT_HEADER_SCAN_BYTES = 128 * 1024; // 128KB

    constructor() {
        console.log('[FILE_SCANNER_CONSTRUCTOR]');
        const registry = ScannerRegistry.getInstance();
        if (!registry.isInitialized()) {
            const { JsTsScanner } = require('./JsTsScanner');
            const { PythonScanner } = require('./PythonScanner');
            const { JavaScanner } = require('./JavaScanner');
            const { KotlinScanner } = require('./KotlinScanner');
            const { MarkdownScanner } = require('./MarkdownScanner');
            const { ShellScanner } = require('./ShellScanner');
            const { SqlScanner } = require('./SqlScanner');
            const { ConfigScanner } = require('./ConfigScanner');
            const { CppScanner } = require('./CppScanner');
            const { RustScanner } = require('./RustScanner');
            
            registry.register(new JsTsScanner());
            registry.register(new PythonScanner());
            registry.register(new JavaScanner());
            registry.register(new KotlinScanner());
            registry.register(new MarkdownScanner());
            registry.register(new ShellScanner());
            registry.register(new SqlScanner());
            registry.register(new ConfigScanner());
            registry.register(new CppScanner());
            registry.register(new RustScanner());
            
            registry.markInitialized();
        }
    }

    /**
     * 파일 내용을 읽고 클래스와 함수 목록을 추출
     * [v0.3.11] Intelligence: Sovereignty signature detection
     */
    public scanFile(filePath: string): CodeSummary {
        let stats: fs.Stats;
        try {
            stats = fs.statSync(filePath);
        } catch {
            return { classes: [], functions: [], references: [] };
        }

        try {
            const mtime = stats.mtimeMs;

            // 캐시 확인
            const cached = FileScanner.cache.get(filePath);
            if (cached && cached.mtime === mtime) {
                return cached.summary;
            }

            const summary: CodeSummary = {
                classes: [],
                functions: [],
                references: [],
                hasAtomicSignature: false,
                hasImportSignature: false
            };

            const ext = path.extname(filePath).toLowerCase();
            const isLargeFile = stats.size > FileScanner.MAX_FULL_SCAN_BYTES;
            const headerBytes = this.getHeaderScanBytes(ext);
            const content = isLargeFile
                ? this.readFileHeaderUtf8(filePath, headerBytes)
                : fs.readFileSync(filePath, 'utf-8');

            if (isLargeFile) {
                console.warn(
                    `[SYNAPSE] Large file header scan: ${filePath} (${Math.round(stats.size / 1024)} KB, head=${Math.round(headerBytes / 1024)} KB, ext=${ext || 'unknown'})`
                );
            }

            // 🧬 Rugged Signature Detection (Regex Based)
            summary.hasAtomicSignature = /\[SYNAPSE\]\s+Atomic\s+Logic\s+Entry/i.test(content);
            summary.hasImportSignature = /auto-imported\s+from/i.test(content);

            if (summary.hasAtomicSignature) {
                console.log(`[SYNAPSE] SIGNATURE FOUND (Atomic) in ${filePath}`);
            }

            // Basic binary check (look for null chars)
            if (content.includes('\0')) {
                console.warn(`[SYNAPSE] Skipping potential binary file: ${filePath}`);
                return summary;
            }

            // [v0.3.32.2] Universal Cross-Project / Network Link Parser
            const networkLinkRegex = /\[SYNAPSE_NETWORK_LINK\][\s\S]*?Target:\s*([^\r\n]+)/gi;
            let netMatch;
            while ((netMatch = networkLinkRegex.exec(content)) !== null) {
                const rawPath = netMatch[1].trim();
                if (rawPath) {
                    // [v0.3.33 Fix] Keep the extension and path so ReferenceVerifier can actually find the real file
                    const cleanRef = rawPath.replace(/\\/g, '/');
                    if (cleanRef && !summary.references.some(r => r.target === cleanRef)) {
                        summary.references.push({ target: cleanRef, type: 'network_link' });
                    }
                }
            }

            // [v0.3.32.4] Delegate to ScannerRegistry for language-specific parsing
            const delegated = ScannerRegistry.getInstance().scan(ext, content, summary);
            
            // Fallback to built-in parsers if no scanner handled it
            if (!delegated) {
                if (ext === '.py') {
                    this.parsePython(content, summary);
                } else if (['.ts', '.js'].includes(ext)) {
                    this.parseJavaScript(content, summary);
                } else if (['.cpp', '.h', '.c', '.hpp', '.cc'].includes(ext)) {
                    this.parseCpp(content, summary);
                } else if (ext === '.rs') {
                    this.parseRust(content, summary);
                } else if (ext === '.sh') {
                    this.parseShell(content, summary);
                } else if (ext === '.sql') {
                    this.parseSql(content, summary);
                } else if (['.json', '.yaml', '.yml', '.toml'].includes(ext)) {
                    this.parseConfig(content, summary);
                } else if (ext === '.md') {
                    this.parseMarkdown(content, summary);
                } else if (ext === '.java') {
                    this.parseJava(content, summary);
                } else if (['.kt', '.kts'].includes(ext)) {
                    this.parseKotlin(content, summary);
                }
            }

            // [v0.3.32.2] Diagnostic: Import extraction proof
            if (ext === '.java' || ext === '.kt' || ext === '.kts') {
                const targetRefs = summary.references.map(r => r.target);
                Logger.info(`[IMPORT_DEBUG] lang=${ext.replace('.', '')} | file=${path.basename(filePath)} | references=[${targetRefs.join(', ')}] | count=${targetRefs.length}`);
            }

            // [v0.3.34] Confidence-based Early Ghost Rejection
            summary.references = summary.references.filter(ref => {
                let confidence = 100;
                const t = ref.target;
                
                if (/[!@#$%^&*()_+={}\[\]|\\:;"'<>,?~]/.test(t)) confidence -= 50;
                if (t.includes('||') || t.includes('&&') || t.includes('=>') || t.includes('==')) confidence -= 80;
                if (/\s/.test(t)) confidence -= 40;
                if (t.startsWith('.')) confidence += 10;
                if (/^[a-zA-Z0-9_.-]+$/.test(t)) confidence = 100; // Clean alphanumeric/path
                
                ref.confidence = Math.max(0, Math.min(100, Math.round(confidence)));
                
                if (ref.confidence < 20) {
                    // Silently drop very noisy regex artifacts before they pollute the pipeline
                    return false;
                }
                return true;
            });

            // 캐시 저장
            FileScanner.cache.set(filePath, { summary, mtime });
            return summary;

        } catch (error) {
            console.error(`[SYNAPSE] Failed to scan file ${filePath}:`, error);
            return { classes: [], functions: [], references: [] };
        }
    }

    private readFileHeaderUtf8(filePath: string, byteLimit: number): string {
        const fd = fs.openSync(filePath, 'r');
        try {
            const buffer = Buffer.alloc(byteLimit);
            const bytesRead = fs.readSync(fd, buffer, 0, byteLimit, 0);
            return buffer.subarray(0, bytesRead).toString('utf8');
        } finally {
            fs.closeSync(fd);
        }
    }

    private getHeaderScanBytes(ext: string): number {
        if (['.ts', '.js', '.py'].includes(ext)) return 192 * 1024;
        if (['.java', '.kt', '.kts', '.rs', '.c', '.cc', '.cpp', '.h', '.hpp'].includes(ext)) return 128 * 1024;
        if (['.json', '.yaml', '.yml', '.toml', '.md', '.sql', '.sh'].includes(ext)) return 64 * 1024;
        return FileScanner.DEFAULT_HEADER_SCAN_BYTES;
    }

    private parseJava(content: string, summary: CodeSummary) {
        console.log('[LEGACY_PARSE_JAVA]', summary.package || 'unknown');
        // Java package
        const pkgMatch = content.match(/^\s*package\s+([a-zA-Z0-9_.]+)\s*;/m);
        if (pkgMatch && pkgMatch[1]) {
            summary.package = pkgMatch[1];
        }

        // Java imports
        const importRegex = /^\s*import\s+(?:static\s+)?([a-zA-Z0-9_.]+)\s*;/gm;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            if (importPath) {
                // e.g. "java.util.List", we might want the last part "List", 
                // but for package resolving we keep the full path or class name
                const parts = importPath.split('.');
                const className = parts[parts.length - 1];
                if (className !== '*') {
                    if (!summary.references.some(r => r.target === className)) {
                        // Store the full path in a property if possible, but the schema uses `target` as basename mostly.
                        // However, SymbolIndex might need the full path. Let's just push className for now.
                        summary.references.push({ target: className, type: 'dependency', fullPath: importPath });
                    }
                }
            }
        }

        // Java classes & interfaces
        const classRegex = /(?:public\s+|private\s+|protected\s+|abstract\s+|final\s+)*(?:class|interface|enum|record)\s+([a-zA-Z0-9_]+)/g;
        while ((match = classRegex.exec(content)) !== null) {
            const name = match[1];
            if (name && !summary.classes.includes(name)) {
                summary.classes.push(name);
            }
        }
    }

    private parseKotlin(content: string, summary: CodeSummary) {
        // Kotlin package
        const pkgMatch = content.match(/^\s*package\s+([a-zA-Z0-9_.]+)/m);
        if (pkgMatch && pkgMatch[1]) {
            summary.package = pkgMatch[1];
        }

        // Kotlin imports
        const importRegex = /^\s*import\s+([a-zA-Z0-9_.]+)/gm;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            if (importPath) {
                const parts = importPath.split('.');
                const className = parts[parts.length - 1];
                if (className !== '*') {
                    if (!summary.references.some(r => r.target === className)) {
                        summary.references.push({ target: className, type: 'dependency', fullPath: importPath });
                    }
                }
            }
        }

        // Kotlin classes, objects, interfaces
        const classRegex = /(?:public\s+|private\s+|protected\s+|internal\s+|abstract\s+|final\s+|sealed\s+|data\s+|value\s+)*(?:class|interface|object|enum class)\s+([a-zA-Z0-9_]+)/g;
        while ((match = classRegex.exec(content)) !== null) {
            const name = match[1];
            if (name && !summary.classes.includes(name)) {
                summary.classes.push(name);
            }
        }
        
        // Kotlin top-level functions (basic extraction)
        const funRegex = /^\s*(?:public\s+|private\s+|protected\s+|internal\s+|inline\s+|suspend\s+)*fun\s+(?:<[^>]+>\s+)?([a-zA-Z0-9_]+)/gm;
        while ((match = funRegex.exec(content)) !== null) {
            const name = match[1];
            if (name && !summary.functions.includes(name)) {
                summary.functions.push(name);
            }
        }
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
            try {
                const trimmed = line.trim();
                if (!trimmed) continue;

                // [v0.2.18.1.2] Support parsing commented (pending/deleted) edges
                const isCommented = trimmed.startsWith('#');
                const isPendingOrDeleted = /\[SYNAPSE_(?:PENDING|DELETED)/.test(line);
                
                if (isCommented && !isPendingOrDeleted) continue;

                // 1. from a.b import c (Handles dots as path delimiters or extensions)
                const fromMatch = trimmed.match(/^(?:#\s*)?(?:\[SYNAPSE(?:_PENDING|_DELETED)?:([^\]]+)\]\s*)?from\s+([a-zA-Z0-9_.]+)\s+import/);
                if (fromMatch) {
                    const nodeId = fromMatch[1];
                    let fromPart = fromMatch[2];
                    if (!fromPart) continue;

                    // [v0.3.21.4] Python Relative Import Fix: Strip leading dots
                    fromPart = fromPart.replace(/^\.+/, '');
                    if (!fromPart) continue;

                    // [v0.2.17 Patch 10] Recognize extensions for non-Python bridges (e.g., TEST.c)
                    const knownExts = ['.c', '.ts', '.js', '.rs', '.sql', '.cpp', '.h', '.hpp', '.cc'];
                    let rootMod = fromPart;

                    const hasKnownExt = knownExts.some(ext => fromPart.toLowerCase().endsWith(ext));
                    if (!hasKnownExt && !fromPart.startsWith('.')) {
                        const parts = fromPart.split('.');
                        rootMod = parts[0] || fromPart;
                    }

                    if (rootMod && !summary.references.some(r => r.target === rootMod)) {
                        let type = 'dependency';
                        if (rootMod.match(/api|http|fetch|request/i)) type = 'api_call';
                        else if (rootMod.match(/db|sql|database|query/i)) type = 'db_query';

                        // [v0.2.17 Patch 13] Check for ID tag already extracted
                        // const nodeId = nodeId; // Taken from capture group 1

                        // [v0.2.18.1] Infer Edge Type from syntax
                        if (trimmed.startsWith('from ')) type = 'reference';
                        else if (line.includes(' # static')) type = 'static_unidirectional';

                        summary.references.push({ target: rootMod, type, nodeId, isApproved: !isPendingOrDeleted });
                    }
                    continue;
                }

                // 2. import a, b as bb
                const importMatch = trimmed.match(/^(?:#\s*)?(?:\[SYNAPSE(?:_PENDING|_DELETED)?:([^\]]+)\]\s*)?import\s+([a-zA-Z0-9_.,\s]+)/);
                if (importMatch) {
                    const importPart = importMatch[2];
                    const nodeId = importMatch[1];
                    if (!importPart) continue; // Safety check
                    
                    importPart.split(',').forEach(r => {
                        const parts = r.trim().split(/\s+/);
                        if (!parts || parts.length === 0) return;
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

                                // [v0.2.17 Patch 13] Check for ID tag already extracted
                                // const nodeId = nodeId;

                                summary.references.push({ target: rootMod, type, nodeId, isApproved: !isPendingOrDeleted });
                            }
                        }
                    });
                }
            } catch (err) {
                console.error(`[SYNAPSE] Python line parse error:`, err);
                continue; // Skip faulty line
            }
        }
    }

    private parseJavaScript(content: string, summary: CodeSummary) {
        try {
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

            // JS/TS 임포트 (references, import type 지원) - 줄 단위 파싱
            const lines = content.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                const isCommented = trimmed.startsWith('//') || trimmed.startsWith('/*');
                const isPendingOrDeleted = /\[SYNAPSE_(?:PENDING|DELETED)/.test(line);

                if (isCommented && !isPendingOrDeleted) continue;

                // import * as X from 'Y', import { X } from 'Y', require('Y')
                const importMatch = trimmed.match(/(?:(?:#|\/\/|\/\*)\s*)?(?:\[SYNAPSE(?:_PENDING|_DELETED)?:?([^\]]*)\]\s*)?(?:import\s+(?:type\s+)?[^'"`]+from\s+['"]([^'"`${}]+)['"]|import\s*\(\s*['"]([^'"`${}]+)['"]\s*\)|require\s*\(\s*['"]([^'"`${}]+)['"]\s*\))/);
                
                if (importMatch) {
                    const nodeId = importMatch[1] || undefined;
                    const ref = importMatch[2] || importMatch[3] || importMatch[4];
                    
                    if (ref && !ref.includes('${') && ref.length <= 100) {
                        const cleanRef = path.basename(ref, path.extname(ref));
                        if (cleanRef && !['react', 'vscode', 'path', 'fs', 'os', 'child_process'].includes(cleanRef) && !summary.references.some(r => r.target === cleanRef)) {
                            let type = 'dependency';
                            if (cleanRef.match(/api|http|fetch|axios/i)) type = 'api_call';
                            else if (cleanRef.match(/db|sql|database|query/i)) type = 'db_query';

                            summary.references.push({ target: cleanRef, type, nodeId, isApproved: !isPendingOrDeleted });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[SYNAPSE] JS/TS parse error:', error);
        }
    }

    private parseCpp(content: string, summary: CodeSummary) {
        // C++ 클래스 및 구조체
        const classRegex = /(?:class|struct)\s+([a-zA-Z0-9_:]+)[\s{:]/gm;
        let match;
        while ((match = classRegex.exec(content)) !== null) {
            const className = match[1];
            if (className && !summary.classes.includes(className)) {
                summary.classes.push(className);
            }
        }

        // C/C++ 함수 (Catastrophic backtracking 완전 차단)
        const funcRegex = /\b([a-zA-Z0-9_]+)\s*\([^)]*\)\s*(?:const)?\s*(?={|;)/g;
        while ((match = funcRegex.exec(content)) !== null) {
            const funcName = match[1];
            if (funcName && !['if', 'while', 'for', 'switch', 'return', 'catch', 'template', 'using', 'static', 'explicit'].includes(funcName)) {
                if (!summary.functions.includes(funcName)) {
                    summary.functions.push(funcName);
                }
            }
        }

        // C/C++ 인클루드
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            const isCommented = trimmed.startsWith('//') || trimmed.startsWith('/*');
            const isPendingOrDeleted = /\[SYNAPSE_(?:PENDING|DELETED)/.test(line);
            
            if (isCommented && !isPendingOrDeleted) continue;

            const includeMatch = trimmed.match(/(?:#\s*include|#include)\s+(["<])([^">]+)([">])/);
            if (includeMatch) {
                summary.hasImportSignature = true;
                const quoteType = includeMatch[1];
                const ref = includeMatch[2];

                // [v0.3.34 Fix] Keep path and extension for C/C++ includes to preserve subsystem hierarchy
                const cleanRef = ref;
                
                if (quoteType === '"') {
                    if (cleanRef && !summary.references.some(r => r.target === cleanRef)) {
                        let type = 'dependency';
                        const idMatch = line.match(/\[SYNAPSE(?:_PENDING|_DELETED)?:([^\]]+)\]/);
                        const nodeId = idMatch ? idMatch[1] : undefined;
                        summary.references.push({ target: cleanRef, type, nodeId, isApproved: !isPendingOrDeleted, provenance: EdgeProvenance.INCLUDE_DIRECTIVE });
                    }
                } else if (quoteType === '<') {
                    const systemLib = ref.split('/')[0];
                    const standardLibs = ['iostream', 'vector', 'string', 'map', 'set', 'algorithm', 'stdio.h', 'stdlib.h', 'stdint.h', 'stdbool.h', 'cmath', 'cstdio', 'memory', 'thread', 'mutex', 'future', 'chrono'];
                    
                    if (!standardLibs.includes(systemLib)) {
                        // [v0.3.21] If not a standard lib, treat as a potential internal dependency (common in CMake)
                        if (cleanRef && !summary.references.some(r => r.target === cleanRef)) {
                            summary.references.push({ target: cleanRef, type: 'dependency', provenance: EdgeProvenance.INCLUDE_DIRECTIVE });
                        }
                    } else {
                        // Standard library call
                        if (!summary.references.some(r => r.target === systemLib)) {
                            summary.references.push({ target: systemLib, type: 'api_call', provenance: EdgeProvenance.INCLUDE_DIRECTIVE });
                        }
                    }
                }
            }
        }
    }

    private parseRust(content: string, summary: CodeSummary) {
        const typeRegex = /^\s*(?:pub(?:\([^)]+\))?\s+)?(?:struct|enum|trait)\s+([a-zA-Z0-9_]+)/gm;
        let match;
        while ((match = typeRegex.exec(content)) !== null) {
            const typeName = match[1];
            if (typeName && !summary.classes.includes(typeName)) {
                summary.classes.push(typeName);
            }
        }

        const implRegex = /^\s*impl(?:\s+<[^>]+>)?\s+([a-zA-Z0-9_]+)(?:\s+for\s+([a-zA-Z0-9_]+))?/gm;
        while ((match = implRegex.exec(content)) !== null) {
            const target = match[2] || match[1];
            if (target && !summary.classes.includes(target)) {
                summary.classes.push(target);
            }
        }

        const funcRegex = /^\s*(?:pub(?:\([^)]+\))?\s+)?(?:async\s+)?fn\s+([a-zA-Z0-9_]+)/gm;
        while ((match = funcRegex.exec(content)) !== null) {
            const funcName = match[1];
            if (funcName && !summary.functions.includes(funcName)) {
                summary.functions.push(funcName);
            }
        }

        // [v0.3.34 Fix] Change (?:\/\/.*)? to (?:\/\/\s*)? to prevent matching 'use' inside natural language comments
        // [v0.3.34 Fix] Restrict use target to valid Rust path characters to prevent capturing paragraphs of natural language before a semicolon
        const useRegex = /(?:^|\n)\s*(?:\/\/\s*)?(?:\[SYNAPSE(?:_PENDING|_DELETED)?:([^\]]+)\]\s*)?use\s+([a-zA-Z0-9_:{},\s]+);/g;
        while ((match = useRegex.exec(content)) !== null) {
            const idMatch = match[1];
            const rawPath = match[2].trim();
            
            const firstSegment = rawPath.split('::')[0];
            if (firstSegment && !['std', 'core', 'alloc', 'prelude', 'crate', 'super', 'self'].includes(firstSegment.toLowerCase())) {
                if (!summary.references.some(r => r.target === firstSegment)) {
                    summary.references.push({ target: firstSegment, type: 'dependency', nodeId: idMatch, isApproved: true });
                    console.log(`[FLOW_DEBUG] RUST_USE parsed: ${firstSegment} from ${rawPath}`);
                }
            }
        }

        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            const isCommented = trimmed.startsWith('//');
            const isPendingOrDeleted = /\[SYNAPSE_(?:PENDING|DELETED)/.test(line);

            if (isCommented && !isPendingOrDeleted) continue;

            const modMatch = trimmed.match(/^(?:\/\/\s*)?(?:\[SYNAPSE(?:_PENDING|_DELETED)?:([^\]]+)\]\s*)?(?:pub\s+)?mod\s+([a-zA-Z0-9_]+);/);
            if (modMatch) {
                const idMatch = modMatch[1];
                const modName = modMatch[2];
                if (modName && !summary.references.some(r => r.target === modName)) {
                    summary.references.push({ target: modName, type: 'dependency', nodeId: idMatch, isApproved: !isPendingOrDeleted });
                    console.log(`[FLOW_DEBUG] RUST_MOD parsed: ${modName} from line: ${trimmed.substring(0, 50)}`);
                }
            }
        }
    }

    private parseShell(content: string, summary: CodeSummary) {
        try {
            const funcRegex = /^(?:function\s+)?([a-zA-Z0-9_-]+)\s*\(\s*\)/gm;
            let match;
            while ((match = funcRegex.exec(content)) !== null) {
                summary.functions.push(match[1]);
            }

            const refRegex = /(?:\.|\.\/|source\s+|bash\s+|sh\s+)([a-zA-Z0-9_-]+)(?:\.sh)?(?:\s|$)/g;
            const shellKeywords = ['then', 'else', 'done', 'fi', 'exit', 'true', 'false', 'echo', 'grep', 'sed', 'awk', 'cat'];
            
            while ((match = refRegex.exec(content)) !== null) {
                const ref = match[1];
                if (ref && !shellKeywords.includes(ref) && !summary.references.some(r => r.target === ref)) {
                    summary.references.push({ target: ref, type: 'dependency' });
                }
            }
        } catch (error) {
            console.error('[SYNAPSE] Shell parse error:', error);
        }
    }

    private parseSql(content: string, summary: CodeSummary) {
        try {
            const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_."]+)/gi;
            let match;
            while ((match = tableRegex.exec(content)) !== null) {
                summary.classes.push(match[1]);
            }

            const procRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?(?:VIEW|PROCEDURE|FUNCTION)\s+([a-zA-Z0-9_."]+)/gi;
            while ((match = procRegex.exec(content)) !== null) {
                summary.functions.push(match[1]);
            }
        } catch (error) {
            console.error('[SYNAPSE] SQL parse error:', error);
        }
    }

    private parseConfig(content: string, summary: CodeSummary) {
        // [v0.3.34 Fix] Restrict import regex to prevent capturing natural language comments
        const refRegex = /"(?:extends|import|using|include|source)"\s*:\s*"([^"]+)"|extends\s*:\s*([^\n]+)|import\s+['"]([^'"]+)['"]/gi;
        let match;
        while ((match = refRegex.exec(content)) !== null) {
            const ref = (match[1] || match[2] || match[3] || '').trim();
            if (ref && !summary.references.some(r => r.target === ref)) {
                const cleanRefActual = ref.replace(/['"]/g, '');
                summary.references.push({ target: cleanRefActual, type: 'dependency' });
            }
        }
    }

    private parseMarkdown(content: string, summary: CodeSummary) {
        try {
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

            // [v0.3.34 Fix] Prevent capturing natural language sentences in markdown links by disallowing spaces in URL
            const linkRegex = /\[([^\]]+)\]\(([^)\s]+)\)/g;
            while ((match = linkRegex.exec(content)) !== null) {
                const ref = match[2].trim();
                if (ref && !ref.startsWith('http') && !ref.startsWith('#') && !ref.startsWith('mailto:')) {
                    // Ignore command/data/custom scheme links. They are navigational actions, not file dependencies.
                    // Keep file:// for explicit local file links.
                    const hasUriScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(ref);
                    if (hasUriScheme && !ref.startsWith('file://')) {
                        continue;
                    }

                    // [v0.3.33 Fix] Keep the extension for markdown links so ReferenceVerifier can find the file
                    let cleanRef = ref.replace(/^file:\/\//, '').replace(/\\/g, '/');
                    // Remove url hash like #L123 if present
                    if (cleanRef.includes('#')) {
                        cleanRef = cleanRef.split('#')[0];
                    }
                    if (cleanRef && !summary.references.some(r => r.target === cleanRef)) {
                        summary.references.push({ target: cleanRef, type: 'dependency' });
                    }
                }
            }
        } catch (error) {
            console.error('[SYNAPSE] Markdown parse error:', error);
        }
    }
}
