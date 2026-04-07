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
     * Only supports .ts / .js / .py / .c files in v0.2.17.
     */
    public applyEdgeToSource(fromFile: string, toFile: string, projectRoot: string, options?: { commented?: boolean, toNodeId?: string }): RefactorResult {
        const ext = path.extname(fromFile).toLowerCase();
        // [v0.2.18.1] Expanded Polyglot support (C/C++, Rust)
        if (!['.ts', '.js', '.tsx', '.jsx', '.py', '.c', '.cpp', '.h', '.hpp', '.rs'].includes(ext)) {
            return { success: false, importLine: '', message: `지원하지 않는 파일 타입입니다: ${ext}` };
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

        const isCommented = options?.commented === true;
        const nodeId = options?.toNodeId;
        const tag = isCommented ? (nodeId ? `[SYNAPSE_PENDING:${nodeId}]` : '[SYNAPSE_PENDING]') : (nodeId ? `[SYNAPSE:${nodeId}]` : '[SYNAPSE]');
        const jsImportLine = isCommented ? `// ${tag} import * as ${importName} from '${importPath}';` : `import * as ${importName} from '${importPath}'; // ${tag}`;

        const content = fs.readFileSync(absFrom, 'utf8');
        const lines = content.split('\n');

        // Python Support
        if (ext === '.py') {
            const pyModule = path.basename(toFile, '.py');
            // [v0.3.10] Precision Import: Use the module name but keep the full filename in the comment for clarity
            const pyImport = `import ${pyModule}`;
            const fullImportLine = isCommented 
                ? `# ${tag} ${pyImport}  # Reference to ${toFile}` 
                : `${pyImport}  # ${tag} auto-imported from ${toFile}`;

            // 1. Check if truly active (not a comment)
            const isActive = (line: string) => {
                const trimmed = line.trim();
                // [v0.2.17 Patch 13] Use strict regex with optional ID tagging
                const pyImportStrictRegex = new RegExp(`^(import|from)\\s+${pyModule}(\\s+|#|$)`);
                const hasMatch = pyImportStrictRegex.test(trimmed);

                if (hasMatch && nodeId && line.includes(`[SYNAPSE:${nodeId}]`)) {
                    return true;
                }
                return hasMatch && !nodeId; // If no nodeId provided, fallback to standard matching
            };

            if (lines.some(isActive)) {
                return { success: true, importLine: pyImport, skipped: true, message: `Already active: ${pyModule}` };
            }

            // 2. Check if exists but commented out by SYNAPSE
            const deletedIdx = lines.findIndex(l => (l.includes('[SYNAPSE_DELETED]') || l.includes('[SYNAPSE_PENDING]')) &&
                l.includes(`import ${pyModule}`) &&
                (!nodeId || l.includes(`:${nodeId}]`)));
            if (deletedIdx !== -1) {
                if (isCommented) {
                    // Update to PENDING if it was DELETED?
                    lines[deletedIdx] = `# [SYNAPSE_PENDING] ${pyImport}`;
                    fs.writeFileSync(absFrom, lines.join('\n'), 'utf8');
                    return { success: true, importLine: pyImport, message: `Updated to Pending: ${pyModule}` };
                } else {
                    // Restore it: Remove the comment prefix
                    lines[deletedIdx] = lines[deletedIdx].replace(/^#\s*\[SYNAPSE_DELETED\]\s*/, '')
                        .replace(/^#\s*\[SYNAPSE_PENDING\]\s*/, '')
                        .replace('// [SYNAPSE_DELETED] ', '')
                        .replace('// [SYNAPSE_PENDING] ', '');
                    if (!lines[deletedIdx].includes('# [SYNAPSE]')) {
                        lines[deletedIdx] = lines[deletedIdx].trim() + '  # [SYNAPSE] restored';
                    }
                    fs.writeFileSync(absFrom, lines.join('\n'), 'utf8');
                    return { success: true, importLine: pyImport, message: `Restored (Uncommented): ${pyModule}` };
                }
            }

            // 3. New import: Always at the TOP (after shebang if present)
            let insertAt = 0;
            if (lines.length > 0 && lines[0].startsWith('#!')) {
                insertAt = 1;
            }
            lines.splice(insertAt, 0, fullImportLine);
            fs.writeFileSync(absFrom, lines.join('\n'), 'utf8');
            return { success: true, importLine: pyImport, message: `Added: ${fullImportLine}` };
        }

        // C/C++ Support (v0.2.18.1 Extended)
        if (['.c', '.cpp', '.h', '.hpp'].includes(ext)) {
            const fileName = path.basename(toFile);
            const cInclude = `#include "${fileName}"`;
            const fullIncludeLine = isCommented ? `// ${tag} ${cInclude}` : `${cInclude} // ${tag}`;

            if (lines.some(l => l.trim().includes(cInclude))) {
                return { success: true, importLine: cInclude, skipped: true, message: `Already included: ${cInclude}` };
            }

            lines.splice(0, 0, fullIncludeLine);
            fs.writeFileSync(absFrom, lines.join('\n'), 'utf8');
            return { success: true, importLine: cInclude, message: `Added: ${fullIncludeLine}` };
        }

        // Rust Support (v0.2.18.1 New)
        if (ext === '.rs') {
            const modName = path.basename(toFile, '.rs');
            const rustLine = `mod ${modName};`;
            const fullRustLine = isCommented ? `// ${tag} ${rustLine}` : `${rustLine} // ${tag}`;

            if (lines.some(l => l.trim().includes(rustLine))) {
                return { success: true, importLine: rustLine, skipped: true, message: `Already declared: ${rustLine}` };
            }

            lines.splice(0, 0, fullRustLine);
            fs.writeFileSync(absFrom, lines.join('\n'), 'utf8');
            return { success: true, importLine: rustLine, message: `Added: ${fullRustLine}` };
        }

        // TS/JS Support
        // 1. Check if truly active (not a comment)
        const isJsActive = (line: string) => {
            const trimmed = line.trim();
            return (trimmed.startsWith('import ') || trimmed.includes('= require(')) &&
                !trimmed.startsWith('/') &&
                (trimmed.includes(`'${importPath}'`) || trimmed.includes(`"${importPath}"`));
        };

        if (lines.some(isJsActive)) {
            return { success: true, importLine: jsImportLine, skipped: true, message: `Already active: ${importPath}` };
        }

        // 2. Check if commented
        const deletedIdx = lines.findIndex(l => (l.includes('[SYNAPSE_DELETED]') || l.includes('[SYNAPSE_PENDING]')) && (l.includes(`from '${importPath}'`) || l.includes(`from "${importPath}"`)));
        if (deletedIdx !== -1) {
            if (isCommented) {
                lines[deletedIdx] = `// [SYNAPSE_PENDING] import * as ${importName} from '${importPath}';`;
                fs.writeFileSync(absFrom, lines.join('\n'), 'utf8');
                return { success: true, importLine: jsImportLine, message: `Updated to Pending: ${importPath}` };
            } else {
                lines[deletedIdx] = lines[deletedIdx].replace(/^\/\/\s*\[SYNAPSE_DELETED\]\s*/, '').replace(/^\/\/\s*\[SYNAPSE_PENDING\]\s*/, '');
                if (!lines[deletedIdx].includes('// [SYNAPSE]')) {
                    lines[deletedIdx] = lines[deletedIdx].trim() + ' // [SYNAPSE] restored';
                }
                fs.writeFileSync(absFrom, lines.join('\n'), 'utf8');
                return { success: true, importLine: jsImportLine, message: `Restored (Uncommented): ${importPath}` };
            }
        }

        // 3. New import: Always at the very TOP for TS/JS
        lines.splice(0, 0, jsImportLine);
        fs.writeFileSync(absFrom, lines.join('\n'), 'utf8');
        return { success: true, importLine: jsImportLine, message: `Added: ${jsImportLine}` };
    }

    /**
     * Removes the import for `toFile` from `fromFile`.
     * Used in Logic Edit Mode (WYSIWYG destructive delete).
     */
    public removeEdgeFromSource(fromFile: string, toFile: string, projectRoot: string, toNodeId?: string): RefactorResult {
        const ext = path.extname(fromFile).toLowerCase();
        // [v0.2.18.1] Expanded removal support
        if (!['.ts', '.js', '.tsx', '.jsx', '.py', '.c', '.cpp', '.h', '.hpp', '.rs'].includes(ext)) {
            return { success: false, importLine: '', message: `지원하지 않는 파일 타입입니다: ${ext}` };
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
            if (trimmed.includes('[SYNAPSE_DELETED]') || trimmed.includes('[SYNAPSE_PENDING]')) {
                // If it's a match for our target, we've "found" it but don't need to change it
                if (ext === '.py') {
                    const pyModule = path.basename(toFile, '.py');
                    if (trimmed.includes(`import ${pyModule}`) && (!toNodeId || trimmed.includes(`:${toNodeId}]`))) {
                        removedLine = trimmed;
                        return line;
                    }
                } else if (ext === '.c') {
                    const cInclude = `#include "${path.basename(toFile)}"`;
                    if (trimmed.includes(cInclude)) {
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
                // [v0.2.17 Patch 13] Strict regex + ID check for removal
                const pyImportStrictRegex = new RegExp(`^(import|from)\\s+${pyModule}(\\s+|#|$)`);
                const isMatch = pyImportStrictRegex.test(trimmed);
                const hasIdMatch = toNodeId ? line.includes(`:${toNodeId}]`) : true;

                if (isMatch && hasIdMatch) {
                    removedLine = trimmed;
                    const cleanLine = line.trim().startsWith('#')
                        ? line.replace(/^#\s*\[SYNAPSE_PENDING(:[^\]]*)?\]\s*/, '').replace(/^#\s*\[SYNAPSE_DELETED(:[^\]]*)?\]\s*/, '')
                        : line;
                    const deleteTag = toNodeId ? `[SYNAPSE_DELETED:${toNodeId}]` : '[SYNAPSE_DELETED]';
                    return `# ${deleteTag} ${cleanLine}`;
                }
            }
            // C/C++ Match
            if (['.c', '.cpp', '.h', '.hpp'].includes(ext)) {
                // [v0.2.18.1.1] Enhanced matching with ID support
                const cInclude = `#include "${path.basename(toFile)}"`;
                const hasIdMatch = toNodeId ? line.includes(`[SYNAPSE:${toNodeId}]`) : true;

                if (trimmed.includes(cInclude) && hasIdMatch) {
                    removedLine = trimmed;
                    const cleanLine = line.trim().startsWith('/')
                        ? line.replace(/^\/\/\s*\[SYNAPSE_PENDING(:[^\]]*)?\]\s*/, '').replace(/^\/\/\s*\[SYNAPSE_DELETED(:[^\]]*)?\]\s*/, '')
                        : line;
                    const deleteTag = toNodeId ? `[SYNAPSE_DELETED:${toNodeId}]` : '[SYNAPSE_DELETED]';
                    return `// ${deleteTag} ${cleanLine}`;
                }
            }
            // Rust Match
            if (ext === '.rs') {
                const modName = path.basename(toFile, '.rs');
                const rustMod = `mod ${modName};`;
                const rustUse = `use ${modName}`; // Matches 'use modName' or 'use modName::...'
                const hasIdMatch = toNodeId ? line.includes(`[SYNAPSE:${toNodeId}]`) : true;

                if ((trimmed.includes(rustMod) || trimmed.includes(rustUse)) && hasIdMatch) {
                    removedLine = trimmed;
                    const cleanLine = line.trim().startsWith('/')
                        ? line.replace(/^\/\/\s*\[SYNAPSE_PENDING(:[^\]]*)?\]\s*/, '').replace(/^\/\/\s*\[SYNAPSE_DELETED(:[^\]]*)?\]\s*/, '')
                        : line;
                    const deleteTag = toNodeId ? `[SYNAPSE_DELETED:${toNodeId}]` : '[SYNAPSE_DELETED]';
                    return `// ${deleteTag} ${cleanLine}`;
                }
            }
            return line;
        });

        if (!removedLine) {
            return { success: false, importLine: '', message: `Match not found: ${importPath} (or ${path.basename(toFile, '.py')})` };
        }

        fs.writeFileSync(absFrom, newLines.join('\n'), 'utf8');
        return { success: true, importLine: removedLine, message: `[v0.2.18.1] 엣지를 가수면 상태로 전환: ${removedLine}` };
    }

    /**
     * [v0.2.17] Project-wide cleanup: Scans all source files and comments out imports to targetNodeName.
     */
    public pruneReferencesToNode(targetNodeName: string, projectRoot: string): { affectedFiles: string[] } {
        const affectedFiles: string[] = [];
        const supportedExts = ['.ts', '.js', '.tsx', '.jsx', '.py', '.c', '.cpp', '.h', '.hpp', '.rs'];

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
