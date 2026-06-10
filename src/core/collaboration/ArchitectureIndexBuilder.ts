import * as path from 'path';
import { Logger } from '../../utils/Logger';
import { SubmissionSnapshot, SubmissionFile } from '../../types/schema';

export type SourceLanguage = 'python' | 'typescript' | 'javascript' | 'rust' | 'cpp' | 'c' | 'go' | 'java' | 'kotlin' | 'swift' | 'unknown';

export interface ProjectNode {
    id: string;
    name: string;
    type: 'project';
}

export interface FolderTreeNode {
    path: string;
    name: string;
    children: FolderTreeNode[];
    fileCount: number;
}

export interface SourceFileEntry {
    filePath: string;
    fileName: string;
    extension: string;
    size: number;
    language: SourceLanguage;
    functionCount: number;
    classCount: number;
}

export interface FunctionEntry {
    functionId: string;
    functionName: string;
    filePath: string;
    className: string | null;
    lineNumber: number;
}

export interface ArchitectureIndex {
    submissionId: string;
    projectUUID: string;
    generatedAt: number;
    projectTree: ProjectNode;
    folderTree: FolderTreeNode;
    sourceFileRegistry: SourceFileEntry[];
    functionCatalog: FunctionEntry[];
}

const SOURCE_EXTENSIONS = new Set(['.py', '.ts', '.js', '.rs', '.cpp', '.c', '.go', '.java', '.kt', '.swift']);

const EXCLUDED_EXTENSIONS = new Set(['.md', '.mdx', '.rst', '.txt', '.log', '.report']);

const EXTENSION_LANGUAGE_MAP: Record<string, SourceLanguage> = {
    '.py': 'python',
    '.ts': 'typescript',
    '.js': 'javascript',
    '.rs': 'rust',
    '.cpp': 'cpp',
    '.c': 'c',
    '.go': 'go',
    '.java': 'java',
    '.kt': 'kotlin',
    '.swift': 'swift',
};

function generateFunctionId(name: string, filePath: string, className: string | null): string {
    const base = className ? `${className}.${name}` : name;
    return `fn_${Buffer.from(`${base}@${filePath}`).toString('base64').replace(/[/+=]/g, '_')}`;
}

function extractFunctions(content: string, extension: string): { name: string; className: string | null; lineNumber: number }[] {
    const result: { name: string; className: string | null; lineNumber: number }[] = [];
    const lines = content.split('\n');

    let currentClass: string | null = null;
    const classRegex = /(?:class|trait|struct|interface)\s+(\w+)/;
    const language = EXTENSION_LANGUAGE_MAP[extension.toLowerCase()] || 'unknown';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const classMatch = line.match(classRegex);
        if (classMatch) {
            currentClass = classMatch[1];
            continue;
        }

        let fnMatch: RegExpMatchArray | null = null;

        switch (language) {
            case 'python':
                fnMatch = line.match(/^\s*def\s+(\w+)\s*\(/);
                break;
            case 'typescript':
            case 'javascript':
                fnMatch = line.match(/(?:function\s+(\w+)\s*\(|(\w+)\s*\([^)]*\)\s*{)/);
                break;
            case 'rust':
                fnMatch = line.match(/^\s*(?:pub\s+)?fn\s+(\w+)\s*\(/);
                break;
            case 'go':
                fnMatch = line.match(/^\s*func\s+(?:\([^)]*\)\s+)?(\w+)\s*\(/);
                break;
            case 'java':
            case 'kotlin':
                fnMatch = line.match(/\b(?!if|for|while|switch|catch|return|import|package|interface|extends|implements|new)(\w+)\s*\([^)]*\)\s*\{/);
                break;
            case 'cpp':
            case 'c':
                fnMatch = line.match(/(?:\w+\s+)?(\w+)\s*\([^)]*\)\s*{/);
                break;
            case 'swift':
                fnMatch = line.match(/^\s*(?:public|private|internal|static|func)\s+(\w+)\s*\(/);
                break;
        }

        if (!fnMatch && language === 'typescript') {
            const methodMatch = line.match(/^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/);
            if (methodMatch && currentClass) {
                fnMatch = methodMatch;
            }
        }

        if (fnMatch) {
            const fnName = fnMatch[1] || fnMatch[2] || '';
            if (fnName && !fnName.startsWith('_')) {
                result.push({ name: fnName, className: currentClass, lineNumber: i + 1 });
            }
        }

        if (language !== 'python' && !/^\s/.test(line)) {
            currentClass = null;
        }
    }

    return result;
}

export class ArchitectureIndexBuilder {
    private static instance: ArchitectureIndexBuilder;

    static getInstance(): ArchitectureIndexBuilder {
        if (!ArchitectureIndexBuilder.instance) {
            ArchitectureIndexBuilder.instance = new ArchitectureIndexBuilder();
        }
        return ArchitectureIndexBuilder.instance;
    }

    build(snapshot: SubmissionSnapshot, projectName: string = 'project'): ArchitectureIndex {
        Logger.info(`[v0.3.30] Building ArchitectureIndex for submission: ${snapshot.id}`);

        const sourceFiles: SourceFileEntry[] = [];
        const functionCatalog: FunctionEntry[] = [];

        for (const file of snapshot.files) {
            const ext = path.extname(file.filePath).toLowerCase();
            const fileName = path.basename(file.filePath);

            if (!SOURCE_EXTENSIONS.has(ext)) continue;
            if (EXCLUDED_EXTENSIONS.has(ext)) continue;
            if (file.filePath.startsWith('external://') || file.filePath.startsWith('ghost://')) continue;

            const language = EXTENSION_LANGUAGE_MAP[ext] || 'unknown';
            const functions = extractFunctions(file.content, ext);

            let classCount = 0;
            for (const fn of functions) {
                if (fn.className) {
                    classCount++;
                }
                functionCatalog.push({
                    functionId: generateFunctionId(fn.name, file.filePath, fn.className),
                    functionName: fn.name,
                    filePath: file.filePath,
                    className: fn.className,
                    lineNumber: fn.lineNumber,
                });
            }

            sourceFiles.push({
                filePath: file.filePath,
                fileName,
                extension: ext,
                size: file.content.length,
                language,
                functionCount: functions.filter(f => !f.className).length,
                classCount,
            });
        }

        const folderTree = this.buildFolderTree(sourceFiles.map(f => f.filePath), projectName);

        const index: ArchitectureIndex = {
            submissionId: snapshot.id,
            projectUUID: snapshot.projectUUID,
            generatedAt: Date.now(),
            projectTree: {
                id: `proj_${snapshot.projectUUID}`,
                name: projectName,
                type: 'project',
            },
            folderTree,
            sourceFileRegistry: sourceFiles,
            functionCatalog,
        };

        Logger.info(`[v0.3.30] ArchitectureIndex built: ${sourceFiles.length} source files, ${functionCatalog.length} functions`);
        return index;
    }

    private buildFolderTree(filePaths: string[], projectName: string): FolderTreeNode {
        const root: FolderTreeNode = {
            path: '',
            name: projectName,
            children: [],
            fileCount: 0,
        };

        for (const fp of filePaths) {
            const parts = fp.split('/').filter(p => p);
            let current = root;
            let currentPath = '';
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                const isLast = i === parts.length - 1;
                let child = current.children.find(c => c.name === part);
                if (!child && !isLast) {
                    child = { path: currentPath, name: part, children: [], fileCount: 0 };
                    current.children.push(child);
                }
                current = child || current;
                if (!isLast && child) {
                    current = child;
                }
            }
        }

        const countFiles = (node: FolderTreeNode): number => {
            for (const child of node.children) {
                node.fileCount += countFiles(child);
            }
            return node.fileCount;
        };
        countFiles(root);

        return root;
    }
}
