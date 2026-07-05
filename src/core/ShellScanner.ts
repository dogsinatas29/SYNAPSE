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
}
