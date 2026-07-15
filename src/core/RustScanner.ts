import { LanguageScanner, CodeSummary } from '../types/schema';

export class RustScanner implements LanguageScanner {
    supportsExtension(ext: string): boolean {
        return ext === '.rs';
    }

    parse(content: string, summary: CodeSummary): void {
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

        // [v0.3.34 Fix] Restrict use target to valid Rust path characters to prevent capturing paragraphs of natural language before a semicolon
        const useRegex = /(?:^|\n)\s*(?:\/\/\s*)?(?:\[SYNAPSE(?:_PENDING|_DELETED)?:([^\]]+)\]\s*)?use\s+([a-zA-Z0-9_:{},\s]+);/g;
        while ((match = useRegex.exec(content)) !== null) {
            const idMatch = match[1];
            const rawPath = match[2].trim();

            const firstSegment = rawPath.split('::')[0];
            if (firstSegment && !['std', 'core', 'alloc', 'prelude', 'crate', 'super', 'self'].includes(firstSegment.toLowerCase())) {
                if (!summary.references.some(r => r.target === firstSegment)) {
                    summary.references.push({ target: firstSegment, type: 'dependency', nodeId: idMatch, isApproved: true });
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
                }
            }
        }
    }
}
