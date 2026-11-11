import { LanguageScanner, CodeSummary } from '../types/schema';

export class KotlinScanner implements LanguageScanner {
    supportsExtension(ext: string): boolean {
        return ['.kt', '.kts'].includes(ext);
    }

    parse(content: string, summary: CodeSummary, filePath?: string): void {
        console.log('[KOTLIN_SCANNER_ENTER]', filePath || 'unknown');
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

        // Clean comments and strings for accurate top-level declaration extraction
        const cleaned = this.cleanCommentsAndStrings(content);
        const lines = cleaned.split('\n');
        let braceDepth = 0;
        let parenDepth = 0;

        for (const line of lines) {
            if (braceDepth === 0 && parenDepth === 0) {
                // Top-level val / var / const val -> register as symbol identifier
                const propMatch = line.match(/^\s*(?:public\s+|private\s+|protected\s+|internal\s+)?(?:const\s+)?(?:val|var)\s+([a-zA-Z0-9_]+)/);
                if (propMatch) {
                    const name = propMatch[1];
                    if (name && !summary.classes.includes(name)) {
                        summary.classes.push(name);
                    }
                }

                // Top-level fun / @Composable fun / extension fun
                const funMatch = line.match(/^\s*(?:@[a-zA-Z0-9_.]+(?:\([^)]*\))?\s*)*(?:public\s+|private\s+|protected\s+|internal\s+|inline\s+|suspend\s+|operator\s+)*fun\s+(?:<[^>]+>\s+)?(?:(?:[a-zA-Z0-9_<>*?.,\s]+)\.)?([a-zA-Z0-9_]+)\s*\(/);
                if (funMatch) {
                    const name = funMatch[1];
                    if (name && !summary.functions.includes(name)) {
                        summary.functions.push(name);
                    }
                }
            }

            for (const ch of line) {
                if (ch === '{') braceDepth++;
                else if (ch === '}') braceDepth = Math.max(0, braceDepth - 1);
                else if (ch === '(') parenDepth++;
                else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
            }
        }

        // Kotlin inheritance (extends/implements using ':')
        let inheritanceCount = 0;
        const inheritRegex = /(?:class|interface|object)\s+\w+(?:<[^>]+>)?(?:\([^)]*\))?\s*:\s*([^{]+)/g;
        while ((match = inheritRegex.exec(content)) !== null) {
            const interfaces = match[1].split(',').map(s => s.trim());
            for (let iface of interfaces) {
                // Remove constructor calls if it's a class
                iface = iface.split('(')[0].trim();
                const cleanIface = iface.split('<')[0].trim();
                if (cleanIface) {
                    // We don't know if it's extends or implements, so we default to IMPLEMENTS
                    // since interfaces are more commonly listed
                    summary.references.push({ target: cleanIface, type: 'IMPLEMENTS', provenance: 'INHERITANCE' as any });
                    inheritanceCount++;
                }
            }
        }
        if (inheritanceCount > 0) {
            console.log('[KOTLIN_INHERITANCE]', { found: inheritanceCount });
        }
    }

    private cleanCommentsAndStrings(src: string): string {
        let out = '';
        let i = 0;
        const n = src.length;
        let inBlockComment = 0;
        let inLineComment = false;
        let inString = false;
        let inRawString = false;

        while (i < n) {
            if (inLineComment) {
                if (src[i] === '\n') {
                    inLineComment = false;
                    out += '\n';
                } else {
                    out += ' ';
                }
                i++;
            } else if (inBlockComment > 0) {
                if (src[i] === '/' && src[i + 1] === '*') {
                    inBlockComment++;
                    out += '  ';
                    i += 2;
                } else if (src[i] === '*' && src[i + 1] === '/') {
                    inBlockComment--;
                    out += '  ';
                    i += 2;
                } else {
                    out += (src[i] === '\n') ? '\n' : ' ';
                    i++;
                }
            } else if (inRawString) {
                if (src[i] === '"' && src[i + 1] === '"' && src[i + 2] === '"') {
                    inRawString = false;
                    out += '   ';
                    i += 3;
                } else {
                    out += (src[i] === '\n') ? '\n' : ' ';
                    i++;
                }
            } else if (inString) {
                if (src[i] === '\\' && i + 1 < n) {
                    out += '  ';
                    i += 2;
                } else if (src[i] === '"') {
                    inString = false;
                    out += ' ';
                    i++;
                } else {
                    out += (src[i] === '\n') ? '\n' : ' ';
                    i++;
                }
            } else {
                if (src[i] === '/' && src[i + 1] === '/') {
                    inLineComment = true;
                    out += '  ';
                    i += 2;
                } else if (src[i] === '/' && src[i + 1] === '*') {
                    inBlockComment = 1;
                    out += '  ';
                    i += 2;
                } else if (src[i] === '"' && src[i + 1] === '"' && src[i + 2] === '"') {
                    inRawString = true;
                    out += '   ';
                    i += 3;
                } else if (src[i] === '"') {
                    inString = true;
                    out += ' ';
                    i++;
                } else {
                    out += src[i];
                    i++;
                }
            }
        }
        return out;
    }
}
