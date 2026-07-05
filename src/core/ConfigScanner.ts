import { LanguageScanner, CodeSummary } from '../types/schema';

export class ConfigScanner implements LanguageScanner {
    supportsExtension(ext: string): boolean {
        return ['.json', '.yaml', '.yml', '.toml'].includes(ext);
    }

    parse(content: string, summary: CodeSummary): void {
        const refRegex = /"(?:extends|import|using|include|source)"\s*:\s*"([^"]+)"|extends\s*:\s*([^\n]+)|import\s+([^\n]+)/gi;
        let match;
        while ((match = refRegex.exec(content)) !== null) {
            const ref = (match[1] || match[2] || match[3] || '').trim();
            if (ref && !summary.references.some(r => r.target === ref)) {
                const cleanRefActual = ref.replace(/['"]/g, '');
                summary.references.push({ target: cleanRefActual, type: 'dependency' });
            }
        }
    }
}
