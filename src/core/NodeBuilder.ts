import * as path from 'path';
import { Node, NodeRole } from '../types/schema';
import { NodeType } from './GraphModel';
import { CodeSummary } from './FileScanner';
import { DirNode, buildDirectoryTree, isDocFile } from './DirectoryTreeBuilder';

const BOILERPLATE = new Set(['src', 'main', 'test', 'java', 'kotlin', 'androidTest', 'resources', 'assets']);
const MAX_CLUSTER_DEPTH = 4;

function getClusterIdForPath(relPath: string, rootDir: DirNode): string {
    const normalizedDir = relPath.replace(/\\/g, '/');
    return `folder_${normalizedDir.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

export function determineNodeRole(filePath: string): { role: NodeRole, category: string } {
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath);
    const relPath = filePath.replace(/\\/g, '/');

    if (['package.json', 'tsconfig.json', 'webpack.config.js', 'vite.config.ts', '.eslintrc.js', '.prettierrc'].includes(basename) || ext === '.yaml' || ext === '.yml' || ext === '.json' || ext === '.toml') {
        return { role: NodeRole.CONFIG, category: 'Config' };
    }
    
    if (ext === '.md' || ext === '.txt') {
        return { role: NodeRole.DOCUMENT, category: 'Document' };
    }
    
    if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot'].includes(ext)) {
        return { role: NodeRole.ASSET, category: 'Asset' };
    }
    
    if (relPath.includes('/test/') || relPath.includes('/tests/') || basename.includes('.test.') || basename.includes('.spec.') || basename === 'test-utils.ts') {
        return { role: NodeRole.TEST, category: 'Test' };
    }
    
    if (relPath.includes('/scripts/') || relPath.includes('/build/') || relPath.includes('/tools/')) {
        return { role: NodeRole.TOOLING, category: 'Tooling' };
    }
    
    if (['schema.ts', 'types.ts', 'interfaces.ts', 'constants.ts'].includes(basename) || basename.endsWith('.d.ts')) {
        return { role: NodeRole.DOMAIN_MODEL, category: 'Domain' };
    }
    
    if (['extension.ts', 'main.ts', 'index.ts', 'activate.ts'].includes(basename)) {
        return { role: NodeRole.RUNTIME_ENTRY, category: 'Entry' };
    }
    
    return { role: NodeRole.RUNTIME, category: 'Source' };
}

function getNodeContinent(relPath: string, rootDir: DirNode): { continent: string; subcontinent: string } {
    const rawParts = relPath.split(/[\\/]/).filter(p => p && p !== '.' && p !== '..');
    const parts = rawParts.filter(p => !BOILERPLATE.has(p));
    let curr = rootDir;
    for (const p of parts) curr = curr.children.get(p) || curr;
    const continent = curr.semanticPath[0] || 'root';
    const subcontinent = curr.semanticPath.slice(0, 2).join('/') || continent;
    return { continent, subcontinent };
}

function discoverNamespace(summaries: { filePath: string; summary: CodeSummary }[]): string {
    const packageFrequencies = new Map<string, number>();
    let totalPackages = 0;

    for (const item of summaries) {
        if (item.summary && item.summary.package) {
            packageFrequencies.set(item.summary.package, (packageFrequencies.get(item.summary.package) || 0) + 1);
            totalPackages++;
        }
    }

    if (totalPackages === 0) return '';

    const prefixFrequencies = new Map<string, number>();
    for (const [pkg, count] of packageFrequencies.entries()) {
        const segments = pkg.split('.');
        let currentPrefix = '';
        for (const seg of segments) {
            currentPrefix = currentPrefix ? `${currentPrefix}.${seg}` : seg;
            prefixFrequencies.set(currentPrefix, (prefixFrequencies.get(currentPrefix) || 0) + count);
        }
    }

    let bestPrefix = '';
    let maxScore = -1;
    for (const [prefix, count] of prefixFrequencies.entries()) {
        if (count >= totalPackages * 0.5) {
            if (prefix.length > maxScore) {
                maxScore = prefix.length;
                bestPrefix = prefix;
            }
        }
    }

    return bestPrefix;
}

export interface NodeBuildResult {
    nodes: Node[];
    nodeIds: Set<string>;
    directoryTree: DirNode;
    internalNamespace: string;
}

export function buildNodes(
    summaries: { filePath: string; summary: CodeSummary }[],
    directoryTree: DirNode
): NodeBuildResult {
    const internalNamespace = discoverNamespace(summaries);

    const nodes: Node[] = [];
    const nodeIds = new Set<string>();

    for (const item of summaries) {
        const fileName = path.basename(item.filePath, path.extname(item.filePath));
        if (item.filePath.includes('.synapse_contexts') || fileName.startsWith('session_')) continue;

        const doc = isDocFile(item.filePath);
        const relPath = path.dirname(item.filePath);

        let clusterId = '';
        if (doc) {
            clusterId = 'doc_shelf';
        } else if (relPath === '.' || relPath === '') {
            clusterId = 'folder_root';
        } else if (relPath && relPath !== '/') {
            clusterId = getClusterIdForPath(relPath, directoryTree);
        }

        let nodeContinent = 'doc';
        let nodeSubcontinent = 'doc';
        if (!doc) {
            const { continent, subcontinent } = getNodeContinent(relPath, directoryTree);
            nodeContinent = continent;
            nodeSubcontinent = subcontinent;
        }
        
        const roleInfo = determineNodeRole(item.filePath);

        const newNode: Node = {
            id: item.filePath,
            filePath: item.filePath,
            type: doc ? NodeType.DOCUMENTATION : NodeType.FILE,
            label: fileName,
            cluster_id: clusterId,
            status: 'confirmed' as any,
            position: { x: 0, y: 0 },
            degree: 0,
            createdBy: 'NodeBuilder',
            role: roleInfo.role,
            category: roleInfo.category,
            data: {
                label: fileName,
                file: item.filePath,
                cluster_id: clusterId,
                icon: doc ? '📚' : (item.summary.hasAtomicSignature ? '⚡' : '📄'),
                hiddenOnCanvas: doc,
                hasAtomicSignature: !!item.summary.hasAtomicSignature,
                hasImportSignature: !!item.summary.hasImportSignature,
                continent: nodeContinent,
                subcontinent: nodeSubcontinent,
                continent_type: 'INTERNAL'
            },
            intelligence: {},
            visual: { opacity: 1.0 }
        };

        nodes.push(newNode);
        nodeIds.add(item.filePath);
    }

    return { nodes, nodeIds, directoryTree, internalNamespace };
}
