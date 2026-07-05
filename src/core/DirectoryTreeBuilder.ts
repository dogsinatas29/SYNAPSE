import * as path from 'path';
import { CodeSummary } from './FileScanner';

export interface DirNode {
    name: string;
    path: string;
    children: Map<string, DirNode>;
    files: number;
    semanticPath: string[];
}

const BOILERPLATE = new Set(['src', 'main', 'test', 'java', 'kotlin', 'androidTest', 'resources', 'assets']);

function isContextVault(filePath: string, fileName: string): boolean {
    return filePath.includes('.synapse_contexts') || fileName.startsWith('session_');
}

function isDoc(filePath: string, fileName: string): boolean {
    const fName = fileName.toLowerCase();
    return filePath.endsWith('.md') ||
        fName.includes('report') ||
        fName.startsWith('session_') ||
        filePath.includes('.synapse_contexts') ||
        filePath.toLowerCase().includes('mile_stone') ||
        filePath.toLowerCase().includes('release_note') ||
        filePath.toLowerCase().includes('milestone');
}

export function buildDirectoryTree(summaries: { filePath: string; summary: CodeSummary }[]): DirNode {
    const rootDir: DirNode = { name: 'root', path: '', children: new Map(), files: 0, semanticPath: [] };

    for (const item of summaries) {
        const fileName = path.basename(item.filePath, path.extname(item.filePath));
        if (isContextVault(item.filePath, fileName)) continue;
        if (isDoc(item.filePath, fileName)) continue;

        const relPath = path.dirname(item.filePath);
        if (relPath && relPath !== '.' && relPath !== '/' && !path.isAbsolute(relPath)) {
            const rawParts = relPath.split(/[\\/]/).filter(p => p && p !== '.' && p !== '..');
            const parts = rawParts.filter(p => !BOILERPLATE.has(p));

            let curr = rootDir;
            for (const p of parts) {
                if (!curr.children.has(p)) {
                    curr.children.set(p, { name: p, path: curr.path ? `${curr.path}/${p}` : p, children: new Map(), files: 0, semanticPath: [] });
                }
                curr = curr.children.get(p)!;
            }
            curr.files++;
        }
    }

    computeSemanticPaths(rootDir, []);
    return rootDir;
}

export function computeSemanticPaths(node: DirNode, currentPath: string[]): void {
    const isPassthrough = node.children.size === 1 && node.files === 0 && node.name !== 'root';
    let nextPath = [...currentPath];

    if (!isPassthrough && node.name !== 'root') {
        nextPath.push(node.name);
    }

    node.semanticPath = nextPath;

    for (const child of node.children.values()) {
        computeSemanticPaths(child, nextPath);
    }
}

export function isDocFile(filePath: string): boolean {
    const fileName = path.basename(filePath, path.extname(filePath));
    return isDoc(filePath, fileName);
}
