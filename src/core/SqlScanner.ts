import { LanguageScanner, CodeSummary } from '../types/schema';

export class SqlScanner implements LanguageScanner {
    supportsExtension(ext: string): boolean {
        return ext === '.sql';
    }

    parse(content: string, summary: CodeSummary): void {
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
}
