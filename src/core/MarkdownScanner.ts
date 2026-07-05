import { LanguageScanner, CodeSummary } from '../types/schema';

export class MarkdownScanner implements LanguageScanner {
    supportsExtension(ext: string): boolean {
        return ext === '.md';
    }

    parse(content: string, summary: CodeSummary): void {
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

            const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
            while ((match = linkRegex.exec(content)) !== null) {
                const ref = match[2].trim();
                if (ref && !ref.startsWith('http') && !ref.startsWith('#')) {
                    let cleanRef = ref.replace(/^file:\/\//, '').replace(/\\/g, '/');
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
