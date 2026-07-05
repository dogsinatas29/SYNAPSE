import { LanguageScanner, CodeSummary } from '../types/schema';

export class PythonScanner implements LanguageScanner {
    supportsExtension(ext: string): boolean {
        return ext === '.py';
    }

    parse(content: string, summary: CodeSummary): void {
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
                        rootMod = parts[parts.length - 1] || fromPart;
                    }

                    if (rootMod && !summary.references.some(r => r.target === rootMod)) {
                        let type = 'dependency';
                        if (rootMod.match(/api|http|fetch|request/i)) type = 'api_call';
                        else if (rootMod.match(/db|sql|database|query/i)) type = 'db_query';

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
                    if (!importPart) continue;
                    
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

                                summary.references.push({ target: rootMod, type, nodeId, isApproved: !isPendingOrDeleted });
                            }
                        }
                    });
                }
            } catch (err) {
                console.error(`[SYNAPSE] Python line parse error:`, err);
                continue;
            }
        }
    }
}
