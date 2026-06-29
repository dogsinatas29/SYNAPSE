import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/Logger';
import { SynapseIgnore } from './SynapseIgnore';

export interface FolderTree {
    path: string;
    name: string;
    children: FolderTree[];
    fileCount: number;
}

export interface FileEntry {
    filePath: string;
    fileName: string;
    extension: string;
    size: number;
    lastModified: number;
    isSource: boolean;
    isDocumentation: boolean;
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

export interface SymbolIndexSchema {
    projectName: string;
    projectRoot: string;
    createdAt: number;
    folderTree: FolderTree | null;
    fileRegistry: Map<string, FileEntry>;
    functionCatalog: FunctionEntry[];
    symbolCatalog: Map<string, string>;
}

function generateFunctionId(name: string, filePath: string, className: string | null): string {
    const base = className ? `${className}.${name}` : name;
    return `fn_${Buffer.from(`${base}@${filePath}`).toString('base64').replace(/[/+=]/g, '_')}`;
}

export class SymbolIndex {
    private static instance: SymbolIndex;
    private index: SymbolIndexSchema | null = null;
    private ignore: SynapseIgnore | null = null;

    static getInstance(): SymbolIndex {
        if (!SymbolIndex.instance) {
            SymbolIndex.instance = new SymbolIndex();
        }
        return SymbolIndex.instance;
    }

    setIgnore(ignore: SynapseIgnore): void {
        this.ignore = ignore;
    }

    initialize(projectName: string, projectRoot: string): void {
        this.index = {
            projectName,
            projectRoot,
            createdAt: Date.now(),
            folderTree: null,
            fileRegistry: new Map(),
            functionCatalog: [],
            symbolCatalog: new Map()
        };
    }

    rebuildFromFiles(files: string[]): void {
        if (!this.index) throw new Error('[v0.3.30] SymbolIndex: not initialized');
        const root = this.index.projectRoot;
        const fileRegistry = new Map<string, FileEntry>();
        const functionCatalog: FunctionEntry[] = [];

        const sourceExtensions = new Set(['.py', '.ts', '.js', '.rs', '.cpp', '.c', '.go', '.java', '.kt', '.kts', '.swift']);
        const docExtensions = new Set(['.md', '.mdx', '.rst', '.txt']);

        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            const relPath = path.relative(root, file).replace(/\\/g, '/');
            if (this.ignore && this.ignore.isIgnored(relPath)) continue;
            const fileName = path.basename(file);
            let fileSize = 0;
            let lastModified = 0;
            try {
                const stat = require('fs').statSync(file);
                fileSize = stat.size;
                lastModified = stat.mtimeMs;
            } catch {}

            const entry: FileEntry = {
                filePath: relPath,
                fileName,
                extension: ext,
                size: fileSize,
                lastModified,
                isSource: sourceExtensions.has(ext),
                isDocumentation: docExtensions.has(ext),
                functionCount: 0,
                classCount: 0
            };
            fileRegistry.set(relPath, entry);
        }

        this.index.fileRegistry = fileRegistry;
        this.index.functionCatalog = functionCatalog;
        this.index.folderTree = this.buildFolderTree(Array.from(fileRegistry.keys()));
        this.index.createdAt = Date.now();

        Logger.info(`[v0.3.30] SymbolIndex rebuilt: ${fileRegistry.size} files`);

        // [v0.3.32.2] Diagnostic: Targeted SymbolIndex Verification
        const targets = ['FeedItem', 'feeditem', 'FEEDITEM', 'DownloadRequester', 'PlaybackService', 'Episode'];
        for (const t of targets) {
            const found = this.lookupSymbol(t) ? 'FOUND' : 'NOT FOUND';
            Logger.info(`[SYMBOL_INDEX_LOOKUP] ${t} -> ${found}`);
        }
    }

    addFunction(filePath: string, functionName: string, className: string | null, lineNumber: number): void {
        if (!this.index) return;
        const fnId = generateFunctionId(functionName, filePath, className);
        this.index.functionCatalog.push({
            functionId: fnId,
            functionName,
            filePath,
            className,
            lineNumber
        });
        const entry = this.index.fileRegistry.get(filePath);
        if (entry) {
            if (className) entry.classCount++;
            else entry.functionCount++;
        }
    }

    addSymbol(filePath: string, symbolName: string): void {
        if (!this.index || !symbolName) return;
        if (!this.index.symbolCatalog.has(symbolName)) {
            this.index.symbolCatalog.set(symbolName, filePath);
        }
    }

    lookupSymbol(symbolName: string): string | undefined {
        if (!this.index) return undefined;
        return this.index.symbolCatalog.get(symbolName);
    }

    getFileRegistry(): Map<string, FileEntry> {
        if (!this.index) return new Map();
        return new Map(this.index.fileRegistry);
    }

    getFunctionCatalog(): FunctionEntry[] {
        if (!this.index) return [];
        return [...this.index.functionCatalog];
    }

    getFolderTree(): FolderTree | null {
        if (!this.index) return null;
        return this.index.folderTree ? JSON.parse(JSON.stringify(this.index.folderTree)) : null;
    }

    getProjectName(): string {
        return this.index?.projectName || 'unknown';
    }

    getProjectRoot(): string {
        return this.index?.projectRoot || '';
    }

    resolveFile(relativePath: string): FileEntry | undefined {
        return this.index?.fileRegistry.get(relativePath);
    }

    private buildFolderTree(filePaths: string[]): FolderTree {
        const root: FolderTree = {
            path: '',
            name: this.index?.projectName || 'root',
            children: [],
            fileCount: 0
        };

        for (const fp of filePaths) {
            const parts = fp.split('/').filter(p => p);
            let current = root;
            let currentPath = '';
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                let child = current.children.find(c => c.name === part);
                if (!child) {
                    child = { path: currentPath, name: part, children: [], fileCount: 0 };
                    current.children.push(child);
                }
                current = child;
                if (i === parts.length - 1) current.fileCount++;
            }
        }

        const countFiles = (node: FolderTree): number => {
            for (const child of node.children) {
                node.fileCount += countFiles(child);
            }
            return node.fileCount;
        };
        countFiles(root);

        return root;
    }
}
