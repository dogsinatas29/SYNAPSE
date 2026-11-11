import { LanguageScanner, CodeSummary } from '../types/schema';

export class ShellScanner implements LanguageScanner {
    supportsExtension(ext: string): boolean {
        return ext === '.sh';
    }

    parse(content: string, summary: CodeSummary): void {
        try {
            const funcRegex = /^(?:function\s+)?([a-zA-Z0-9_-]+)\s*\(\s*\)/gm;
            let match;
            while ((match = funcRegex.exec(content)) !== null) {
                summary.functions.push(match[1]);
            }

            const refRegex = /(?:^|[;&|]\s*)(?:\.\s+|source\s+|bash\s+|sh\s+|\.\/)([a-zA-Z0-9_./-]+\.sh)\b/g;
            const lines = content.split('\n');
            for (const rawLine of lines) {
                const line = rawLine.replace(/#.*$/, '').trim();
                if (!line) continue;
                refRegex.lastIndex = 0;
                while ((match = refRegex.exec(line)) !== null) {
                    const ref = match[1].replace(/^\.\//, '');
                    if (ref && !ref.startsWith('-') && !summary.references.some(r => r.target === ref)) {
                        summary.references.push({ target: ref, type: 'dependency' });
                    }
                }
            }
        } catch (error) {
            console.error('[SYNAPSE] Shell parse error:', error);
        }
    }
}
