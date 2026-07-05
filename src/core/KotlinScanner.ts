import { LanguageScanner, CodeSummary } from '../types/schema';

export class KotlinScanner implements LanguageScanner {
    supportsExtension(ext: string): boolean {
        return ['.kt', '.kts'].includes(ext);
    }

    parse(content: string, summary: CodeSummary): void {
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
}
