import * as path from 'path';
import * as fs from 'fs';
import { buildDirectoryTree } from './src/core/DirectoryTreeBuilder';
import { buildNodes } from './src/core/NodeBuilder';
import { buildClusters } from './src/core/ClusterBuilder';
import { CodeSummary, FileScanner } from './src/core/FileScanner';
import { ClusterHierarchy } from './src/core/ClusterHierarchy';
import { resolveVisibleGraph, VisibleGraph } from './src/core/VisibleGraphResolver';

const testDir = '/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src';
const projectRoot = '/home/dogsinatas/TypeScript_project/antigravity-extension-vis';
const scanner = new FileScanner();

function collectTsFiles(dir: string, files: string[] = []): string[] {
    for (const entry of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !entry.startsWith('node_modules') && !entry.startsWith('.')) {
            collectTsFiles(fullPath, files);
        } else if (entry.endsWith('.ts')) {
            files.push(path.relative(projectRoot, fullPath));
        }
    }
    return files;
}

const tsFiles = collectTsFiles(testDir);
const summaries: { filePath: string; summary: CodeSummary }[] = [];
for (const f of tsFiles) {
    const fullPath = path.join(projectRoot, f);
    const summary = scanner.scanFile(fullPath);
    summaries.push({ filePath: f, summary });
}

console.log('\n=== Phase 4-B: Position Inheritance ===\n');

const directoryTree = buildDirectoryTree(summaries);
const nodeResult = buildNodes(summaries, directoryTree);
const clusterResult = buildClusters(nodeResult.nodes);

const hierarchy = new ClusterHierarchy(clusterResult.clusters);
const projectRoots = hierarchy.getProjectRoots();
let srcRoot = projectRoots.find(r => r.cluster.id.includes('folder_src'));

if (!srcRoot) {
    console.log('No project roots found, aborting.');
    process.exit(1);
}

// Simulate LayoutEngine: assign deterministic positions to all clusters
const clustersWithPositions = clusterResult.clusters.map(c => {
    const node = hierarchy.get(c.id);
    const depth = node ? node.depth : 0;
    const idx = node && node.parentId
        ? (hierarchy.getSiblings(c.id).length + 1)
        : projectRoots.indexOf(projectRoots.find(r => r.id === c.id)!);
    return {
        ...c,
        position: { x: 200 + depth * 400, y: 200 + (idx >= 0 ? idx : 0) * 150 }
    };
});
const rawGraph = {
    nodes: nodeResult.nodes,
    edges: [] as any[],
    clusters: clustersWithPositions,
    timestamp: Date.now()
};

function savePositions(graph: VisibleGraph): Record<string, { x: number; y: number }> {
    const pos: Record<string, { x: number; y: number }> = {};
    for (const c of graph.visibleClusters) {
        pos[c.id] = { x: c.position!.x, y: c.position!.y };
    }
    return pos;
}

function checkInvariant(
    prev: Record<string, { x: number; y: number }>,
    curr: Record<string, { x: number; y: number }>,
    label: string
): boolean {
    let ok = true;
    for (const id of Object.keys(prev)) {
        if (!curr[id]) continue; // cluster no longer visible (collapse)
        const a = prev[id];
        const b = curr[id];
        if (a.x !== b.x || a.y !== b.y) {
            console.log(`  ❌ Position changed: ${id} (${a.x},${a.y}) → (${b.x},${b.y})`);
            ok = false;
        }
    }
    if (ok) console.log(`  ✅ ${label}: all persistent cluster positions unchanged`);
    return ok;
}

// LOD1: no expansion
console.log('--- LOD1 (roots only) ---');
const lod1 = resolveVisibleGraph(rawGraph, hierarchy, new Set());
console.log(`visibleClusters: ${lod1.visibleClusters.length}`);
for (const c of lod1.visibleClusters) {
    const tag = c.type === 'system' ? '[SYS]' : '[PRJ]';
    console.log(`  ${tag} ${c.label} @ (${c.position?.x}, ${c.position?.y})`);
}
const pos1 = savePositions(lod1);

// LOD2: expand src
console.log('\n--- LOD2 (expand src) ---');
const lod2 = resolveVisibleGraph(rawGraph, hierarchy, new Set([srcRoot.id]));
console.log(`visibleClusters: ${lod2.visibleClusters.length}`);
for (const c of lod2.visibleClusters) {
    const node = hierarchy.get(c.id);
    console.log(`  ${c.label} @ (${c.position?.x}, ${c.position?.y}) depth=${node?.depth}`);
}
const pos2 = savePositions(lod2);

// ASSERT: LOD1 clusters should have same positions in LOD2
console.log('\n--- Invariant Check: LOD1 → LOD2 ---');
checkInvariant(pos1, pos2, 'LOD1→LOD2');

// LOD3: expand src + child
const srcChildren = hierarchy.getChildren(srcRoot.id);
if (srcChildren.length > 0) {
    const firstChild = srcChildren[0];
    console.log(`\n--- LOD3 (expand src + ${firstChild.cluster.label}) ---`);
    const lod3 = resolveVisibleGraph(rawGraph, hierarchy, new Set([srcRoot.id, firstChild.id]));
    console.log(`visibleClusters: ${lod3.visibleClusters.length}`);
    for (const c of lod3.visibleClusters) {
        const node = hierarchy.get(c.id);
        console.log(`  ${c.label} @ (${c.position?.x}, ${c.position?.y}) depth=${node?.depth}`);
    }
    const pos3 = savePositions(lod3);

    // ASSERT: LOD2 clusters have same positions in LOD3
    console.log('\n--- Invariant Check: LOD2 → LOD3 ---');
    checkInvariant(pos2, pos3, 'LOD2→LOD3');
}

// Collapse back to LOD1
console.log('\n--- Collapse: back to LOD1 ---');
const lod1b = resolveVisibleGraph(rawGraph, hierarchy, new Set());
console.log(`visibleClusters: ${lod1b.visibleClusters.length}`);
for (const c of lod1b.visibleClusters) {
    console.log(`  ${c.label} @ (${c.position?.x}, ${c.position?.y})`);
}
const pos1b = savePositions(lod1b);

console.log('\n--- Invariant Check: LOD1 → LOD1 (collapse) ---');
checkInvariant(pos1, pos1b, 'LOD1→LOD1 after collapse');

console.log('\n=== Phase 4-B Complete ===');
