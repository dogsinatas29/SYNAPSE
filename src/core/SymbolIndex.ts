import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/Logger';
import { SynapseIgnore } from './SynapseIgnore';
import { isBuildOrPackagingAsset } from '../utils/exclusionRules';

// [v0.3.34.74 Rule 3 & 4] System/SDK & ubiquitous lifecycle identifiers that must NOT bind globally
// without explicit path/module context, preventing Secondary Hijack across unrelated files.
const SYSTEM_AND_UBIQUITOUS_SYMBOLS = new Set([
    // COM / Win32 / POSIX / Standard lifecycle & system APIs
    'Release', 'AddRef', 'QueryInterface', 'Sleep', 'GetLastError', 'SetLastError',
    'CloseHandle', 'CreateFile', 'CreateFileW', 'CreateFileA', 'ReadFile', 'WriteFile',
    'VirtualAlloc', 'VirtualFree', 'LocalFree', 'GlobalFree', 'CoInitialize', 'CoUninitialize',
    'RegOpenKeyEx', 'RegOpenKeyExW', 'RegCloseKey', 'GetProcAddress', 'LoadLibrary', 'LoadLibraryW',
    'FreeLibrary', 'ExitProcess', 'TerminateProcess', 'WaitForSingleObject', 'GetCurrentProcess',
    // Ubiquitous generic entry/lifecycle function names
    'main', 'wmain', 'WinMain', 'wWinMain', 'DllMain',
    'init', 'Init', 'initialize', 'Initialize', 'close', 'Close', 'open', 'Open',
    'start', 'Start', 'stop', 'Stop', 'run', 'Run', 'reset', 'Reset', 'clear', 'Clear',
    'destroy', 'Destroy', 'dispose', 'Dispose', 'free', 'Free', 'clone', 'Clone',
    'default', 'Default', 'new', 'drop', 'fmt', 'from', 'into', 'try_from', 'try_into'
]);

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
    symbolCatalog: Map<string, Set<string>>;
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
            if (isBuildOrPackagingAsset(relPath)) continue;
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
        if (isBuildOrPackagingAsset(filePath)) return;
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
        
        // [v0.3.34] Register function names in symbol catalog to resolve C/C++ function calls directly to implementation files
        this.addSymbol(filePath, functionName);
    }

    addSymbol(filePath: string, symbolName: string): void {
        if (!this.index || !symbolName || !filePath) return;
        if (isBuildOrPackagingAsset(filePath)) return;
        
        let candidates = this.index.symbolCatalog.get(symbolName);
        if (!candidates) {
            candidates = new Set<string>();
            this.index.symbolCatalog.set(symbolName, candidates);
        }
        candidates.add(filePath);
    }

    lookupSymbol(symbolName: string): string | undefined {
        if (!this.index || !symbolName) return undefined;
        // [v0.3.34.74 Rule 3 & 4] Prevent Secondary Hijack on ubiquitous/OS SDK identifiers
        if (SYSTEM_AND_UBIQUITOUS_SYMBOLS.has(symbolName)) return undefined;
        const candidates = this.index.symbolCatalog.get(symbolName);
        if (!candidates || candidates.size === 0) return undefined;
        if (candidates.size === 1) {
            for (const p of candidates) {
                return isBuildOrPackagingAsset(p) ? undefined : p;
            }
        }

        // [Gate 2 V1] Multiple candidates: evaluate justified selection
        // Fixed extensions: definitions (.c, .cpp, .cc, .rs) vs declarations (.h, .hpp, .hxx)
        const defs: string[] = [];
        let nonHeaderNonDefCount = 0;

        for (const candidate of candidates) {
            if (candidate.endsWith('.c') || candidate.endsWith('.cpp') || candidate.endsWith('.cc') || candidate.endsWith('.rs')) {
                defs.push(candidate);
            } else if (candidate.endsWith('.h') || candidate.endsWith('.hpp') || candidate.endsWith('.hxx')) {
                // Header (declaration) candidate
            } else {
                nonHeaderNonDefCount++;
            }
        }

        // Exactly 1 definition and 0 unclassified candidates -> justified selection
        if (defs.length === 1 && nonHeaderNonDefCount === 0) {
            return defs[0];
        }

        // Ambiguous: multiple definitions, multiple headers only, or unclassified candidates -> safe fail (undefined)
        return undefined;
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
