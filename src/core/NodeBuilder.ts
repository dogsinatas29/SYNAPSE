import * as path from 'path';
import { Node, NodeRole } from '../types/schema';
import { NodeType } from './GraphModel';
import { CodeSummary } from './FileScanner';
import { DirNode, buildDirectoryTree, isDocFile } from './DirectoryTreeBuilder';
import { isBuildOrPackagingAsset } from '../utils/exclusionRules';

const BOILERPLATE = new Set(['src', 'main', 'test', 'java', 'kotlin', 'androidTest', 'resources', 'assets']);
const MAX_CLUSTER_DEPTH = 4;

function getClusterIdForPath(relPath: string, rootDir: DirNode): string {
    const normalizedDir = relPath.replace(/\\/g, '/');
    return `folder_${normalizedDir.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

/**
 * [Phase B v1.0.15 Canonical] Robust Path Normalizer
 * Preserves POSIX absolute paths, strict UNC (//server/share), Windows drive root (C:/) & drive relative (C:foo),
 * and parent directories (..), while removing redundant dots and collapsing consecutive slashes.
 */
export function normalizePath(rawPath: string): string {
    if (!rawPath) return rawPath;
    if (rawPath.startsWith('ghost://') || rawPath.startsWith('external://') || rawPath.startsWith('builtin://')) {
        return rawPath;
    }

    let p = rawPath.replace(/\\/g, '/');

    // Strict UNC detection: Starts with exactly two slashes and valid segments
    const isStrictUNC = /^\/\/[^\/\s]+\/[^\/\s]+(?:\/|$)/.test(p) && !p.startsWith('///');

    let prefix = '';
    let isDriveWithSlash = false;

    if (isStrictUNC) {
        prefix = '//';
        p = p.substring(2);
    } else if (/^[a-zA-Z]:\//.test(p)) {
        // Windows drive with slash root/path (e.g. C:/ or C:/foo)
        prefix = p.substring(0, 2) + '/';
        p = p.substring(3);
        isDriveWithSlash = true;
    } else if (/^[a-zA-Z]:/.test(p)) {
        // Windows drive-relative (e.g. C:foo)
        prefix = p.substring(0, 2);
        p = p.substring(2);
    } else if (p.startsWith('/')) {
        prefix = '/';
        p = p.replace(/^\/+/, '');
    }

    p = p.replace(/\/+/g, '/');

    const parts = p.split('/');
    const resolvedParts: string[] = [];
    for (const part of parts) {
        if (part === '' || part === '.') continue;
        resolvedParts.push(part);
    }
    const resolved = resolvedParts.join('/');

    // Preserve drive root C:/ when remaining segments are empty
    if (isDriveWithSlash && resolvedParts.length === 0) {
        return prefix;
    }

    if (prefix.endsWith('/')) {
        return prefix + resolved;
    }
    if (prefix) {
        return resolved ? prefix + (prefix.endsWith(':') ? '' : '/') + resolved : prefix;
    }
    return resolved;
}

export function determineNodeRole(filePath: string): { role: NodeRole, category: string } {
    const relPath = filePath.replace(/\\/g, '/');
    const basename = path.posix.basename(relPath);
    const ext = path.posix.extname(relPath).toLowerCase();
    const baseNameLower = basename.toLowerCase();

    // Priority 1: Grammar
    if (ext === '.json' && basename.includes('.tmLanguage')) {
        return { role: NodeRole.GRAMMAR, category: 'Grammar' };
    }

    // Priority 2: Config
    if (['package.json', 'tsconfig.json', 'webpack.config.js', 'vite.config.ts', '.eslintrc.js', '.prettierrc'].includes(basename) || ext === '.yaml' || ext === '.yml' || ext === '.json' || ext === '.toml') {
        return { role: NodeRole.CONFIG, category: 'Config' };
    }

    // Priority 3: Build or Packaging Asset
    if (isBuildOrPackagingAsset(relPath)) {
        return { role: NodeRole.TOOLING, category: 'Tooling' };
    }
    
    // Priority 4: Document
    if (ext === '.md' || ext === '.txt') {
        return { role: NodeRole.DOCUMENT, category: 'Document' };
    }
    
    // Priority 5: Asset
    if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot'].includes(ext)) {
        return { role: NodeRole.ASSET, category: 'Asset' };
    }
    
    // Priority 6: Test Code & Runner (Includes test, tests, unit_tests, specs, __tests__)
    const isTestSegment = /(^|\/)(test|tests|unit_tests|specs|__tests__)(\/|$)/i.test(relPath);
    const isTestFile = (
        baseNameLower.includes('.test.') ||
        baseNameLower.includes('.spec.') ||
        baseNameLower.startsWith('test_') ||
        baseNameLower.endsWith('_test.cpp') ||
        baseNameLower.endsWith('_test.h') ||
        baseNameLower.endsWith('_test.py') ||
        baseNameLower === 'test-utils.ts'
    );
    if (isTestSegment || isTestFile) {
        return { role: NodeRole.TEST, category: 'Test' };
    }
    
    // Priority 7: Tooling Scripts (Preserve exact NodeBuilder.ts rule)
    if (relPath.includes('/scripts/') || relPath.includes('/build/') || relPath.includes('/tools/')) {
        return { role: NodeRole.TOOLING, category: 'Tooling' };
    }
    
    // Priority 8: Domain Model
    if (['schema.ts', 'types.ts', 'interfaces.ts', 'constants.ts'].includes(basename) || basename.endsWith('.d.ts')) {
        return { role: NodeRole.DOMAIN_MODEL, category: 'Domain' };
    }
    
    // Priority 9: Runtime Entry
    if (['extension.ts', 'main.ts', 'index.ts', 'activate.ts'].includes(basename)) {
        return { role: NodeRole.RUNTIME_ENTRY, category: 'Entry' };
    }
    
    // Priority 10: Runtime Default
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
        if (item.filePath.includes('.synapse_contexts') || (fileName.startsWith('session_') && (item.filePath.endsWith('.json') || item.filePath.endsWith('.txt')))) continue;
        if (isBuildOrPackagingAsset(item.filePath)) continue;

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

        if (item.filePath.includes('/report/')) {
            console.error(
                "[REPORT_FILES]",
                item.filePath,
                clusterId,
                "doc:", doc,
                "relPath:", relPath
            );
        }

        let nodeContinent = 'doc';
        let nodeSubcontinent = 'doc';
        if (!doc) {
            const { continent, subcontinent } = getNodeContinent(relPath, directoryTree);
            nodeContinent = continent;
            nodeSubcontinent = subcontinent;
        }
        
        const normalizedFilePath = normalizePath(item.filePath);
        const roleInfo = determineNodeRole(normalizedFilePath);

        const newNode: Node = {
            id: normalizedFilePath,
            filePath: normalizedFilePath,
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
                file: normalizedFilePath,
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
            visual: { opacity: 1.0 },
            parseStatus: item.summary.parseStatus,
            parseReason: item.summary.parseReason,
            parseCoverage: item.summary.parseCoverage
        };

        nodes.push(newNode);
        nodeIds.add(normalizedFilePath);
    }

    return { nodes, nodeIds, directoryTree, internalNamespace };
}
