import * as path from 'path';
import * as fs from 'fs';
import { buildDirectoryTree } from './src/core/DirectoryTreeBuilder';
import { buildNodes } from './src/core/NodeBuilder';
import { buildClusters } from './src/core/ClusterBuilder';
import { CodeSummary, FileScanner } from './src/core/FileScanner';
import { ClusterHierarchy } from './src/core/ClusterHierarchy';
import { resolveVisibleGraph } from './src/core/VisibleGraphResolver';

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

console.log('\n=== Phase 4-A Probe: VisibleGraphResolver ===\n');
console.log(`Input: ${summaries.length} files`);

const directoryTree = buildDirectoryTree(summaries);
const nodeResult = buildNodes(summaries, directoryTree);
const clusterResult = buildClusters(nodeResult.nodes);

console.log(`Clusters: ${clusterResult.clusters.length}`);
console.log(`Nodes:    ${nodeResult.nodes.length}`);

const hierarchy = new ClusterHierarchy(clusterResult.clusters);
const roots = hierarchy.getRoots();
console.log(`Roots:    ${roots.length}`);
const projectRoots = hierarchy.getProjectRoots();
console.log(`Project Roots: ${projectRoots.length} (system excluded)`);
console.log(`Depth:    ${Math.max(...hierarchy.getAllNodes().map(n => n.depth), 0)}`);

console.log('\n--- LOD1 (Roots only, no expansion) ---');
const lod1 = resolveVisibleGraph(
    { nodes: nodeResult.nodes, edges: [], clusters: clusterResult.clusters, timestamp: Date.now() },
    hierarchy,
    new Set()
);
console.log(`[VISIBLE_GRAPH] LOD1: ${lod1.visibleClusters.length} clusters (all roots)`);
console.log(`  System clusters: ${lod1.visibleClusters.filter(c => c.type === 'system').length}`);
console.log(`  Project clusters: ${lod1.visibleClusters.filter(c => c.type !== 'system').length}`);
for (const c of lod1.visibleClusters) {
    const node = hierarchy.get(c.id);
    const tag = c.type === 'system' ? '[SYS]' : '[PRJ]';
    const childCount = node ? node.children.length : 0;
    console.log(`  ${tag} ${c.label || c.id} (children: ${childCount})`);
}

// Find a root with children to test expansion
const expandableRoot = roots.find(r => r.children.length > 0);
if (expandableRoot) {
    console.log(`\n--- LOD2: expand "${expandableRoot.cluster.label || expandableRoot.id}" ---`);
    const expanded = new Set([expandableRoot.id]);
    const lod2 = resolveVisibleGraph(
        { nodes: nodeResult.nodes, edges: [], clusters: clusterResult.clusters, timestamp: Date.now() },
        hierarchy,
        expanded
    );
    console.log(`[VISIBLE_GRAPH] LOD2: ${lod2.visibleClusters.length} clusters, ${lod2.visibleEdges.length} edges`);
    for (const c of lod2.visibleClusters) {
        const node = hierarchy.get(c.id);
        const childCount = node ? node.children.length : 0;
        console.log(`  ${c.label || c.id} (depth: ${node?.depth}, children: ${childCount})`);
    }

    // Expand one child too (LOD3)
    const children = hierarchy.getChildren(expandableRoot.id);
    if (children.length > 0) {
        const firstChild = children[0];
        const expanded3 = new Set([expandableRoot.id, firstChild.id]);
        console.log(`\n--- LOD3: expand "${expandableRoot.cluster.label}" + child "${firstChild.cluster.label}" ---`);
        const lod3 = resolveVisibleGraph(
            { nodes: nodeResult.nodes, edges: [], clusters: clusterResult.clusters, timestamp: Date.now() },
            hierarchy,
            expanded3
        );
        console.log(`[VISIBLE_GRAPH] LOD3: ${lod3.visibleClusters.length} clusters, ${lod3.visibleEdges.length} edges`);
        for (const c of lod3.visibleClusters) {
            const node = hierarchy.get(c.id);
            const childCount = node ? node.children.length : 0;
            console.log(`  ${c.label || c.id} (depth: ${node?.depth}, children: ${childCount})`);
        }
    }
}

console.log('\n--- Edge Aggregation Test (LOD1) ---');
const syntheticEdges: any[] = [];
if (nodeResult.nodes.length >= 2) {
    const n1 = nodeResult.nodes[0];
    const n2 = nodeResult.nodes[1];
    syntheticEdges.push({ id: 'e1', from: n1.id, to: n2.id, weight: 1 });
    if (nodeResult.nodes.length >= 3) {
        const n3 = nodeResult.nodes[2];
        syntheticEdges.push({ id: 'e2', from: n1.id, to: n3.id, weight: 1 });
    }
}
const edgeGraph = {
    nodes: nodeResult.nodes,
    edges: syntheticEdges,
    clusters: clusterResult.clusters,
    timestamp: Date.now()
};
const edgeResultLOD1 = resolveVisibleGraph(edgeGraph, hierarchy, new Set());
console.log(`[VISIBLE_GRAPH_EDGES] LOD1 (roots): ${edgeResultLOD1.visibleEdges.length} aggregated edges`);
for (const e of edgeResultLOD1.visibleEdges) {
    const fromLabel = hierarchy.get(e.from)?.cluster.label || e.from;
    const toLabel = hierarchy.get(e.to)?.cluster.label || e.to;
    console.log(`  ${fromLabel} → ${toLabel} (weight: ${e.weight})`);
}

if (expandableRoot) {
    console.log('\n--- Edge Aggregation Test (LOD2, src expanded) ---');
    const edgeResultLOD2 = resolveVisibleGraph(edgeGraph, hierarchy, new Set([expandableRoot.id]));
    console.log(`[VISIBLE_GRAPH_EDGES] LOD2: ${edgeResultLOD2.visibleEdges.length} aggregated edges`);
    for (const e of edgeResultLOD2.visibleEdges) {
        const fromLabel = hierarchy.get(e.from)?.cluster.label || e.from;
        const toLabel = hierarchy.get(e.to)?.cluster.label || e.to;
        console.log(`  ${fromLabel} → ${toLabel} (weight: ${e.weight})`);
    }
}

console.log('\n=== Phase 4-A Probe Complete ===');
