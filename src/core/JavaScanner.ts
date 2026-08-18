import { LanguageScanner, CodeSummary } from '../types/schema';

export class JavaScanner implements LanguageScanner {
    supportsExtension(ext: string): boolean {
        return ext === '.java';
    }

    parse(content: string, summary: CodeSummary, filePath?: string): void {
        console.log('[JAVA_SCANNER_ENTER]', filePath || 'unknown');
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
        // Java implements
        let inheritanceCount = 0;
        const implementsRegex = /class\s+\w+(?:<[^>]+>)?(?:[^{]*?)\bimplements\s+([^{]+)/g;
        while ((match = implementsRegex.exec(content)) !== null) {
            const interfaces = match[1].split(',').map(s => s.trim());
            for (let iface of interfaces) {
                // Ignore if it's part of a generic bound or something weird that got caught
                iface = iface.split('<')[0].trim();
                // Avoid accidental words
                if (iface && !iface.includes(' ') && !iface.includes('\n')) {
                    summary.references.push({ target: iface, type: 'IMPLEMENTS', provenance: 'INHERITANCE' as any });
                    inheritanceCount++;
                }
            }
        }

        // Java extends
        const extendsRegex = /(?:class|interface)\s+\w+(?:<[^>]+>)?(?:[^{]*?)\bextends\s+([^{]+)/g;
        while ((match = extendsRegex.exec(content)) !== null) {
            const baseClassRaw = match[1].split('implements')[0].split(',')[0].trim();
            const cleanBase = baseClassRaw.split('<')[0].trim();
            if (cleanBase && !cleanBase.includes(' ') && !cleanBase.includes('\n')) {
                summary.references.push({ target: cleanBase, type: 'EXTENDS', provenance: 'INHERITANCE' as any });
                inheritanceCount++;
            }
        }
        
        console.error(
            '[JAVA_SCAN_RESULT]',
            {
                references: summary.references.length,
                implements: summary.references.filter(r => r.type === 'IMPLEMENTS').length,
                extends: summary.references.filter(r => r.type === 'EXTENDS').length
            }
        );
    }
}
