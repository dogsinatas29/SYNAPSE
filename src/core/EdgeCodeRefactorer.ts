import * as fs from 'fs';
import * as path from 'path';

export interface RefactorResult {
    success: boolean;
    importLine: string;
    skipped?: boolean; // already existed
    message: string;
}

export class EdgeCodeRefactorer {
    /**
     * Adds an import from `fromFile` to `toFile` in the actual source.
     * Only supports .ts / .js files in v0.2.17.
     */
    public applyEdgeToSource(fromFile: string, toFile: string, projectRoot: string): RefactorResult {
        const ext = path.extname(fromFile).toLowerCase();
        if (!['.ts', '.js', '.tsx', '.jsx', '.py'].includes(ext)) {
            return { success: false, importLine: '', message: `확장자가 없는 파일은 소스 코드 연동(import)이 불가능합니다. (.py, .ts, .js 등 지원 필수)` };
        }

        const absFrom = path.join(projectRoot, fromFile);
        const absTo = path.join(projectRoot, toFile);

        if (!fs.existsSync(absFrom)) {
            return { success: false, importLine: '', message: `Source file not found: ${fromFile}` };
        }

        const fromDir = path.dirname(absFrom);
        const relPath = path.relative(fromDir, absTo)
            .replace(/\\/g, '/')
            .replace(/\.(ts|tsx|js|jsx)$/, '');
        const importPath = relPath.startsWith('.') ? relPath : `./${relPath}`;

        const baseName = path.basename(toFile, path.extname(toFile));
        const importName = baseName.replace(/[-_](.)/g, (_, c) => c.toUpperCase())
            .replace(/^./, c => c.toUpperCase());

        const importLine = `import * as ${importName} from '${importPath}';`;
        const content = fs.readFileSync(absFrom, 'utf8');
        const lines = content.split('\n');

        // Python Support
        if (ext === '.py') {
            const pyModule = path.basename(toFile, '.py');
            const pyImport = `import ${pyModule}`;

            // 1. Check if already exists (active)
            if (lines.some(l => l.trim() === pyImport || l.includes(`import ${pyModule}  # [SYNAPSE]`))) {
                return { success: true, importLine: pyImport, skipped: true, message: `Already imported: ${pyModule}` };
            }

            // 2. Check if exists but commented out by SYNAPSE
            const deletedIdx = lines.findIndex(l => l.includes('[SYNAPSE_DELETED]') && l.includes(`import ${pyModule}`));
            if (deletedIdx !== -1) {
                // Restore it: Remove the comment prefix
                lines[deletedIdx] = lines[deletedIdx].replace(/^#\s*\[SYNAPSE_DELETED\]\s*/, '').replace('// [SYNAPSE_DELETED] ', '');
                fs.writeFileSync(absFrom, lines.join('\n'), 'utf8');
                return { success: true, importLine: pyImport, message: `Restored (Uncommented): ${pyModule}` };
            }

            // 3. New import: Always at the TOP (after shebang if present)
            let insertAt = 0;
            if (lines.length > 0 && lines[0].startsWith('#!')) {
                insertAt = 1;
            }
            lines.splice(insertAt, 0, pyImport + '  # [SYNAPSE] auto-imported');
            fs.writeFileSync(absFrom, lines.join('\n'), 'utf8');
            return { success: true, importLine: pyImport, message: `Added: ${pyImport}` };
        }

        // TS/JS Support
        // 1. Check if active
        if (content.includes(`from '${importPath}'`) || content.includes(`from "${importPath}"`)) {
            // But ensure it's not the commented one
            const activeLine = lines.find(l => !l.includes('[SYNAPSE_DELETED]') && (l.includes(`from '${importPath}'`) || l.includes(`from "${importPath}"`)));
            if (activeLine) {
                return { success: true, importLine, skipped: true, message: `Already imported: ${importPath}` };
            }
        }

        // 2. Check if commented
        const deletedIdx = lines.findIndex(l => l.includes('[SYNAPSE_DELETED]') && (l.includes(`from '${importPath}'`) || l.includes(`from "${importPath}"`)));
        if (deletedIdx !== -1) {
            lines[deletedIdx] = lines[deletedIdx].replace(/^\/\/\s*\[SYNAPSE_DELETED\]\s*/, '');
            fs.writeFileSync(absFrom, lines.join('\n'), 'utf8');
            return { success: true, importLine, message: `Restored (Uncommented): ${importPath}` };
        }

        // 3. New import: Always at the very TOP for TS/JS
        lines.splice(0, 0, importLine);
        fs.writeFileSync(absFrom, lines.join('\n'), 'utf8');
        return { success: true, importLine, message: `Added: ${importLine}` };
    }

    /**
     * Removes the import for `toFile` from `fromFile`.
     * Used in Logic Edit Mode (WYSIWYG destructive delete).
     */
    public removeEdgeFromSource(fromFile: string, toFile: string, projectRoot: string): RefactorResult {
        const ext = path.extname(fromFile).toLowerCase();
        if (!['.ts', '.js', '.tsx', '.jsx', '.py'].includes(ext)) {
            return { success: false, importLine: '', message: `Not supported file type: ${ext}` };
        }

        const absFrom = path.join(projectRoot, fromFile);
        const absTo = path.join(projectRoot, toFile);

        if (!fs.existsSync(absFrom)) {
            return { success: false, importLine: '', message: `Source file not found: ${fromFile}` };
        }

        const fromDir = path.dirname(absFrom);
        const relPath = path.relative(fromDir, absTo)
            .replace(/\\/g, '/')
            .replace(/\.(ts|tsx|js|jsx)$/, '');
        const importPath = relPath.startsWith('.') ? relPath : `./${relPath}`;

        const content = fs.readFileSync(absFrom, 'utf8');
        const lines = content.split('\n');

        let removedLine = '';
        const newLines = lines.map(line => {
            const trimmed = line.trim();
            // If already commented by SYNAPSE, don't double-comment
            if (trimmed.includes('[SYNAPSE_DELETED]')) {
                // If it's a match for our target, we've "found" it but don't need to change it
                if (ext === '.py') {
                    const pyModule = path.basename(toFile, '.py');
                    if (trimmed.includes(`import ${pyModule}`)) {
                        removedLine = trimmed;
                        return line;
                    }
                } else if (line.includes(`'${importPath}'`) || line.includes(`"${importPath}"`)) {
                    removedLine = trimmed;
                    return line;
                }
            }

            // TS/JS Match
            if ((trimmed.startsWith('import ') || trimmed.includes('= require(')) && (line.includes(`'${importPath}'`) || line.includes(`"${importPath}"`))) {
                removedLine = trimmed;
                return `// [SYNAPSE_DELETED] ${line}`;
            }
            // Python Match
            if (ext === '.py') {
                const pyModule = path.basename(toFile, '.py');
                // Allow matches like "import module_name" or "import module_name  # comment"
                const pyRegex = new RegExp(`^(import|from)\\s+${pyModule}\\b`);
                if (pyRegex.test(trimmed) || trimmed.includes(`import ${pyModule} `) || trimmed === `import ${pyModule}`) {
                    removedLine = trimmed;
                    return `# [SYNAPSE_DELETED] ${line}`;
                }
            }
            return line;
        });

        if (!removedLine) {
            return { success: false, importLine: '', message: `Match not found: ${importPath} (or ${path.basename(toFile, '.py')})` };
        }

        fs.writeFileSync(absFrom, newLines.join('\n'), 'utf8');
        return { success: true, importLine: removedLine, message: `Skipped execution logic removal, only commented out module reference: ${removedLine}` };
    }

    /**
     * [v0.2.17] Project-wide cleanup: Scans all source files and comments out imports to targetNodeName.
     */
    public pruneReferencesToNode(targetNodeName: string, projectRoot: string): { affectedFiles: string[] } {
        const affectedFiles: string[] = [];
        const supportedExts = ['.ts', '.js', '.tsx', '.jsx', '.py'];

        const scanAndPrune = (dir: string) => {
            if (!fs.existsSync(dir)) return;
            const entries = fs.readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (['node_modules', '.git', 'dist', 'out', 'data'].includes(entry.name)) continue;
                    scanAndPrune(fullPath);
                } else {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (supportedExts.includes(ext)) {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        if (content.includes(targetNodeName)) {
                            const relPath = path.relative(projectRoot, fullPath).replace(/\\/g, '/');
                            const result = this.removeEdgeFromSource(relPath, targetNodeName, projectRoot);
                            if (result.success) {
                                affectedFiles.push(relPath);
                            }
                        }
                    }
                }
            }
        };

        scanAndPrune(projectRoot);
        return { affectedFiles };
    }
}
