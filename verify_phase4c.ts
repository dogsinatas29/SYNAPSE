import { Cluster, Node, GraphSnapshot } from './src/types/schema';
import { ClusterHierarchy } from './src/core/ClusterHierarchy';
import { resolveVisibleGraph } from './src/core/VisibleGraphResolver';

function makeCluster(id: string, label: string, parentId?: string): Cluster {
    return {
        id, label, type: 'folder',
        collapsed: false, position: { x: 0, y: 0 },
        bounds: { x: 0, y: 0, width: 0, height: 0 },
        children: [], nodes: [], data: {},
        parent_id: parentId
    };
}

function makeNode(id: string, clusterId: string): Node {
    return { id, cluster_id: clusterId, filePath: id, position: { x: 0, y: 0 } };
}

function makeEdge(id: string, from: string, to: string, weight = 1): any {
    return { id, from, to, weight };
}

const CLUSTERS = [
    makeCluster('folder_src', 'src'),
    makeCluster('folder_src_core', 'core', 'folder_src'),
    makeCluster('folder_src_core_analysis', 'analysis', 'folder_src_core'),
    makeCluster('folder_src_core_parser', 'parser', 'folder_src_core'),
    makeCluster('folder_src_core_benchmark', 'benchmark', 'folder_src_core'),
    makeCluster('folder_src_bootstrap', 'bootstrap', 'folder_src'),
];

const NODES = [
    makeNode('analysis.ts', 'folder_src_core_analysis'),
    makeNode('parser.ts', 'folder_src_core_parser'),
    makeNode('bench.ts', 'folder_src_core_benchmark'),
    makeNode('boot.ts', 'folder_src_bootstrap'),
];

function run(label: string, edges: any[], expanded: Set<string>): void {
    const hierarchy = new ClusterHierarchy(CLUSTERS);
    const graph: GraphSnapshot = { nodes: NODES, edges, clusters: CLUSTERS, timestamp: Date.now() };
    const result = resolveVisibleGraph(graph, hierarchy, expanded);
    console.log(`\n${label}`);
    console.log(`  expanded: {${Array.from(expanded).map(id => hierarchy.get(id)?.cluster.label || id).join(', ')}}`);
    console.log(`  visibleClusters: ${result.visibleClusters.length}`);
    for (const c of result.visibleClusters) {
        const node = hierarchy.get(c.id);
        const d = node ? node.depth : 0;
        console.log(`    ${'  '.repeat(d)}${c.label}`);
    }
    console.log(`  visibleEdges: ${result.visibleEdges.length}`);
    for (const e of result.visibleEdges) {
        const fromL = hierarchy.get(e.from)?.cluster.label || e.from;
        const toL = hierarchy.get(e.to)?.cluster.label || e.to;
        console.log(`    ${fromL} → ${toL} (weight=${e.weight})`);
    }
}

let allPass = true;
function check(label: string, edges: any[], expanded: Set<string>, expected: string): void {
    const hierarchy = new ClusterHierarchy(CLUSTERS);
    const graph: GraphSnapshot = { nodes: NODES, edges, clusters: CLUSTERS, timestamp: Date.now() };
    const result = resolveVisibleGraph(graph, hierarchy, expanded);
    const actual = result.visibleEdges.map(e =>
        `${hierarchy.get(e.from)?.cluster.label || e.from}→${hierarchy.get(e.to)?.cluster.label || e.to} w=${e.weight}`
    ).join(', ') || '(none)';
    const pass = actual === expected;
    if (!pass) allPass = false;
    console.log(`  ${pass ? '✅' : '❌'} ${label}: expected="${expected}", actual="${actual}"`);
}

console.log('=== Phase 4-C: Aggregate Edge Validation ===\n');
console.log('Tree: src { core { analysis, parser, benchmark }, bootstrap }\n');

// ============================================================
// Phase 4-C-1: Promotion Validation
// expanded = { src } → core's children NOT visible
// Hidden descendants promote to core
// ============================================================
console.log('--- Phase 4-C-1: Promotion Validation (expanded={src}) ---');

check('Case 1: internal edge (same cluster → skip)',
    [makeEdge('e1', 'analysis.ts', 'parser.ts')],
    new Set(['folder_src']),
    '(none)');

check('Case 4: hidden descendant promotion (bench → boot)',
    [makeEdge('e4', 'bench.ts', 'boot.ts')],
    new Set(['folder_src']),
    'core→bootstrap w=1');

check('Case 5a: weight merge at promotion level (3× analysis→boot)',
    [
        makeEdge('e5a', 'analysis.ts', 'boot.ts', 1),
        makeEdge('e5b', 'analysis.ts', 'boot.ts', 1),
        makeEdge('e5c', 'analysis.ts', 'boot.ts', 1),
    ],
    new Set(['folder_src']),
    'core→bootstrap w=3');

// ============================================================
// Phase 4-C-2: Visible Child Validation
// expanded = { src, core } → core's children visible
// Same edges now resolve to more specific clusters
// ============================================================
console.log('\n--- Phase 4-C-2: Visible Child Validation (expanded={src, core}) ---');

check('Case 2: cross-child (analysis → bootstrap)',
    [makeEdge('e2', 'analysis.ts', 'boot.ts')],
    new Set(['folder_src', 'folder_src_core']),
    'analysis→bootstrap w=1');

check('Case 3: child → parent (analysis → src_index)',
    [makeEdge('e3', 'analysis.ts', 'boot.ts')],
    new Set(['folder_src', 'folder_src_core']),
    'analysis→bootstrap w=1');

check('Case 5b: weight merge at child level (3× analysis→boot)',
    [
        makeEdge('e5a', 'analysis.ts', 'boot.ts', 1),
        makeEdge('e5b', 'analysis.ts', 'boot.ts', 1),
        makeEdge('e5c', 'analysis.ts', 'boot.ts', 1),
    ],
    new Set(['folder_src', 'folder_src_core']),
    'analysis→bootstrap w=3');

// Case 3 needs a node directly in src
const NODES_WITH_SRC = [
    ...NODES,
    makeNode('src_index.ts', 'folder_src'),
];
function runWithExtra(label: string, edges: any[], expanded: Set<string>, expected: string): void {
    const hierarchy = new ClusterHierarchy(CLUSTERS);
    const graph: GraphSnapshot = { nodes: NODES_WITH_SRC, edges, clusters: CLUSTERS, timestamp: Date.now() };
    const result = resolveVisibleGraph(graph, hierarchy, expanded);
    const actual = result.visibleEdges.map(e =>
        `${hierarchy.get(e.from)?.cluster.label || e.from}→${hierarchy.get(e.to)?.cluster.label || e.to} w=${e.weight}`
    ).join(', ') || '(none)';
    const pass = actual === expected;
    if (!pass) allPass = false;
    console.log(`  ${pass ? '✅' : '❌'} ${label}: expected="${expected}", actual="${actual}"`);
}

runWithExtra('Case 3a: child→parent promotion level (analysis → src_index, expanded={src})',
    [makeEdge('e3', 'analysis.ts', 'src_index.ts')],
    new Set(['folder_src']),
    'core→src w=1');

runWithExtra('Case 3b: child→parent child level (analysis → src_index, expanded={src,core})',
    [makeEdge('e3', 'analysis.ts', 'src_index.ts')],
    new Set(['folder_src', 'folder_src_core']),
    'analysis→src w=1');

// ============================================================
console.log('\n=== Summary ===');
const sameEdge = (a: string, b: string) =>
    a === 'core→bootstrap w=1' && b === 'analysis→bootstrap w=1' ? 'PROMOTED' :
    a === 'core→src w=1' && b === 'analysis→src w=1' ? 'PROMOTED' : 'SAME';
console.log(`Telescope Resolution: same edge → different aggregate at different depths:`);
console.log(`  bench→boot:  expanded={src}       → core→bootstrap`);
console.log(`  bench→boot:  expanded={src,core}   → analysis→bootstrap`);
console.log(`  analysis.ts→src_index.ts:  expanded={src}     → core→src`);
console.log(`  analysis.ts→src_index.ts:  expanded={src,core} → analysis→src`);

console.log(`\nOverall: ${allPass ? '✅ ALL PASS' : '❌ SOME FAILED'}`);
process.exit(allPass ? 0 : 1);
