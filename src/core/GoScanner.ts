import { LanguageScanner, CodeSummary } from '../types/schema';

export class GoScanner implements LanguageScanner {
    supportsExtension(ext: string): boolean {
        return ext === '.go';
    }

    parse(content: string, summary: CodeSummary, filePath?: string): void {
        const lines = content.split('\n');
        let inImportBlock = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('package ')) {
                const pkgMatch = line.match(/^package\s+([a-zA-Z0-9_]+)/);
                if (pkgMatch && pkgMatch[1]) {
                    summary.package = pkgMatch[1];
                }
                continue;
            }

            if (line.startsWith('import (')) {
                inImportBlock = true;
                continue;
            }

            if (inImportBlock) {
                if (line === ')') {
                    inImportBlock = false;
                    continue;
                }
                if (line && !line.startsWith('//')) {
                    const match = line.match(/"(.*?)"/);
                    if (match && match[1]) {
                        this.addImport(match[1], summary);
                    }
                }
            } else if (line.startsWith('import ')) {
                const match = line.match(/"(.*?)"/);
                if (match && match[1]) {
                    this.addImport(match[1], summary);
                }
            }
        }
    }
    
    private addImport(target: string, summary: CodeSummary) {
        // [v0.3.34.47 P1] Go Scanner - Extract raw import string
        if (!summary.references.some(r => r.target === target)) {
            summary.references.push({ 
                target: target, 
                type: 'dependency',
                isApproved: true
            });
        }
    }
}
