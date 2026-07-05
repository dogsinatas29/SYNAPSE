import { LanguageScanner, CodeSummary } from '../types/schema';

export class JavaScanner implements LanguageScanner {
    supportsExtension(ext: string): boolean {
        return ext === '.java';
    }

    parse(content: string, summary: CodeSummary): void {
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
                const parts = importPath.split('.');
                const className = parts[parts.length - 1];
                if (className !== '*') {
                    if (!summary.references.some(r => r.target === className)) {
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
}
