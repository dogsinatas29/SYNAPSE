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
            return { success: false, importLine: '', message: `Not supported file type: ${ext}` };
        }

        const absFrom = path.join(projectRoot, fromFile);
        const absTo = path.join(projectRoot, toFile);

        if (!fs.existsSync(absFrom)) {
            return { success: false, importLine: '', message: `Source file not found: ${fromFile}` };
        }

        // Calculate relative path from fromFile's dir to toFile (strip extension)
        const fromDir = path.dirname(absFrom);
        const relPath = path.relative(fromDir, absTo)
            .replace(/\\/g, '/')
            .replace(/\.(ts|tsx|js|jsx)$/, '');
        const importPath = relPath.startsWith('.') ? relPath : `./${relPath}`;

        // Derive a simple import name from the filename (PascalCase basename)
        const baseName = path.basename(toFile, path.extname(toFile));
        const importName = baseName.replace(/[-_](.)/g, (_, c) => c.toUpperCase())
            .replace(/^./, c => c.toUpperCase());

        const importLine = `import * as ${importName} from '${importPath}';`;

        const content = fs.readFileSync(absFrom, 'utf8');

        // Python Support
        if (ext === '.py') {
            const pyModule = path.basename(toFile, '.py');
            const pyImport = `import ${pyModule}`;
            if (content.includes(pyImport)) {
                return { success: true, importLine: pyImport, skipped: true, message: `Already imported: ${pyModule}` };
            }
            const lines = content.split('\n');
            let lastImportIdx = -1;
            for (let i = 0; i < lines.length; i++) {
                if (/^(import|from)\s+/.test(lines[i].trim())) lastImportIdx = i;
            }
            lines.splice(lastImportIdx + 1, 0, pyImport);
            fs.writeFileSync(absFrom, lines.join('\n'), 'utf8');
            return { success: true, importLine: pyImport, message: `Added: ${pyImport}` };
        }

        // TS/JS Support
        if (content.includes(`from '${importPath}'`) || content.includes(`from "${importPath}"`)) {
            return { success: true, importLine, skipped: true, message: `Already imported: ${importPath}` };
        }

        const lines = content.split('\n');
        let lastImportIdx = -1;
        for (let i = 0; i < lines.length; i++) {
            if (/^import\s+/.test(lines[i].trim())) lastImportIdx = i;
        }

        const insertAt = lastImportIdx + 1; // insert after last import
        lines.splice(insertAt, 0, importLine);

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
            // TS/JS Match
            if ((trimmed.startsWith('import ') || trimmed.includes('= require(')) && (line.includes(`'${importPath}'`) || line.includes(`"${importPath}"`))) {
                removedLine = trimmed;
                return `// [SYNAPSE_DELETED] ${line}`;
            }
            // Python Match
            if (ext === '.py') {
                const pyModule = path.basename(toFile, '.py');
                const pyRegex = new RegExp(`^(import|from)\\s+${pyModule}\\b`);
                if (pyRegex.test(trimmed)) {
                    removedLine = trimmed;
                    return `# [SYNAPSE_DELETED] ${line}`;
                }
            }
            return line;
        });

        if (!removedLine) {
            return { success: false, importLine: '', message: `Match not found: ${importPath}` };
        }

        fs.writeFileSync(absFrom, newLines.join('\n'), 'utf8');
        return { success: true, importLine: removedLine, message: `Skipped execution logic removal, only commented out module reference: ${removedLine}` };
    }
}
