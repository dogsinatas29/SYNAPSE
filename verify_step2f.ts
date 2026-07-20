/**
 * Step 2f Verification: DiagnosticReporter output matches original DataPipeline logic.
 * 
 * Uses the same fixture as verify_step2e.ts for deterministic comparison.
 * 
 * Usage: npx ts-node verify_step2f.ts
 */

import { analyzeGraph, GraphAnalysis } from './src/core/GraphAnalyzer';
import { generateDiagnosticReport, DiagnosticContext } from './src/core/DiagnosticReporter';
import { Node, Edge, NodeType } from './src/core/GraphModel';

// Same fixture as verify_step2e.ts
const nodes: Node[] = [
    { id: 'a1', cluster_id: 'cluster_core', status: 'confirmed', type: NodeType.FILE, data: { continent: 'core', continent_type: 'INTERNAL', role: 'component' } },
    { id: 'a2', cluster_id: 'cluster_core', status: 'confirmed', type: NodeType.FILE, data: { continent: 'core', continent_type: 'INTERNAL', role: 'service' } },
    { id: 'b1', cluster_id: 'cluster_canvas', status: 'confirmed', type: NodeType.FILE, data: { continent: 'ui', continent_type: 'INTERNAL', role: 'component' } },
    { id: 'b2', cluster_id: 'cluster_canvas', status: 'confirmed', type: NodeType.FILE, data: { continent: 'ui', continent_type: 'INTERNAL', role: 'view' } },
    { id: 'g1', cluster_id: 'cluster_ghost_android', status: 'ghost', type: NodeType.EXTERNAL, data: { continent: 'android', continent_type: 'EXTERNAL' } },
    { id: 'external://com.example.Foo', status: 'ghost', type: NodeType.EXTERNAL, data: { continent: 'android', continent_type: 'EXTERNAL' } }
];

const edges: Edge[] = [
    { id: 'e1', from: 'a1', to: 'a2', type: 'CALL' },
    { id: 'e2', from: 'a1', to: 'b1', type: 'REFERENCE' },
    { id: 'e3', from: 'a2', to: 'g1', type: 'CALL' },
    { id: 'e4', from: 'b1', to: 'g1', type: 'CALL' },
    { id: 'e5', from: 'a1', to: 'external://com.example.Foo', type: 'DEPENDENCY' }
];

const clusterIds = new Set(['cluster_core', 'cluster_canvas', 'cluster_ghost_android']);
const nodeIds = new Set(['a1', 'a2', 'b1', 'b2', 'g1', 'external://com.example.Foo']);
const edgeTypeCount = new Map<string, number>([['CALL', 3], ['REFERENCE', 1], ['DEPENDENCY', 1]]);

console.log('\n=== Step 2f DiagnosticReporter Verification ===\n');
console.log(`Fixture: ${nodes.length} nodes, ${edges.length} edges`);

const analysis = analyzeGraph({ nodes, edges, clusterIds, nodeIds });

const nodeMap = new Map<string, Node>(nodes.map(n => [n.id, n]));
const context: DiagnosticContext = {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    edgeTypeCount,
    packageRemoved: 5,
    exactRemoved: 3,
    nodeMap
};

// Generate new output
const newReport = generateDiagnosticReport(analysis, context);

// Generate legacy output (original DataPipeline logic, inline)
const legacyReport = generateLegacyReport(analysis, context, nodes, clusterIds);

// Compare
console.log(`New report length:    ${newReport.length} chars`);
console.log(`Legacy report length: ${legacyReport.length} chars`);

if (newReport === legacyReport) {
    console.log(`\n✅ OUTPUT IDENTICAL: ${newReport.length} chars, 0 differences`);
    console.log(`\n=== Result: ALL PASS ✅ ===\n`);
    process.exit(0);
} else {
    console.log(`\n❌ OUTPUT DIFFERS`);
    
    // Find first difference
    const maxLen = Math.max(newReport.length, legacyReport.length);
    for (let i = 0; i < maxLen; i++) {
        if (newReport[i] !== legacyReport[i]) {
            const contextLen = 40;
            const start = Math.max(0, i - contextLen);
            const end = Math.min(maxLen, i + contextLen);
            console.log(`\nFirst difference at position ${i}:`);
            console.log(`  New:    "${newReport.slice(start, end)}"`);
            console.log(`  Legacy: "${legacyReport.slice(start, end)}"`);
            console.log(`  New char:    '${newReport[i]}' (code ${newReport.charCodeAt(i)})`);
            console.log(`  Legacy char: '${legacyReport[i]}' (code ${legacyReport.charCodeAt(i)})`);
            break;
        }
    }
    
    // Write files for manual diff
    const fs = require('fs');
    fs.writeFileSync('/tmp/diagnostic_new.txt', newReport, 'utf8');
    fs.writeFileSync('/tmp/diagnostic_legacy.txt', legacyReport, 'utf8');
    console.log(`\nWritten to /tmp/diagnostic_new.txt and /tmp/diagnostic_legacy.txt`);
    console.log(`Run: diff -u /tmp/diagnostic_legacy.txt /tmp/diagnostic_new.txt`);
    
    console.log(`\n=== Result: SOME FAILED ❌ ===\n`);
    process.exit(1);
}

function generateLegacyReport(
    analysis: GraphAnalysis,
    context: DiagnosticContext,
    nodes: Node[],
    clusterIds: Set<string>
): string {
    let out = '';
    
    out += `\n=== BRANCH COMPRESSION ===\n(moved to NodeBuilder)\n\n`;
    
    out += `=== CLUSTER SUMMARY ===\n`;
    for (const [cId, cCount] of Array.from(analysis.clusterTraffic.entries())
        .map(([id, data]) => [id, data.nodes] as [string, number])
        .sort((a, b) => b[1] - a[1])) {
        out += `${cId.padEnd(25)} nodes=${cCount}\n`;
    }
    out += `TOTAL_CLUSTERS=${clusterIds.size}\n\n`;
    
    out += `=== EDGE SUMMARY ===\nInternal Edges: ${analysis.stats.internalEdges}\nExternal/Ghost Edges: ${analysis.stats.externalEdges}\n\n`;
    
    out += `======================================================\n[PIPELINE] Nodes=${context.nodeCount} Edges=${context.edgeCount}\n[FILTER] package_removed=${context.packageRemoved} exact_removed=${context.exactRemoved}\n======================================================\n`;
    
    out += `=== EDGE BREAKDOWN ===\n`;
    for (const [type, count] of context.edgeTypeCount.entries()) {
        out += `  - ${type}: ${count}\n`;
    }
    out += `======================================================\n\n`;
    
    out += `=== CLUSTER SIZE DISTRIBUTION ===\n1 node   : ${analysis.clusterSizes['1 node']} clusters\n2-5 nodes: ${analysis.clusterSizes['2-5 nodes']} clusters\n6-10     : ${analysis.clusterSizes['6-10']} clusters\n11-20    : ${analysis.clusterSizes['11-20']} clusters\n20+      : ${analysis.clusterSizes['20+']} clusters\n======================================================\n\n`;
    
    out += `=== TOP HUB FILES ===\n`;
    const sortedDegrees = Array.from(analysis.degreeMap.entries()).sort((a, b) => b[1].total - a[1].total);
    const top20Detailed = sortedDegrees.slice(0, 20);
    let rank = 1;
    for (const [id, deg] of top20Detailed) {
        const node = context.nodeMap.get(id);
        const clusterId = node ? node.cluster_id : 'unknown';
        const role = node?.data?.role || 'none';
        const isExternal = id.startsWith('external://') || id.startsWith('ghost://') || node?.type === NodeType.EXTERNAL;
        out += `rank=${rank++}\n`;
        out += `id=${id}\n`;
        out += `cluster=${clusterId}\n`;
        out += `role=${role}\n`;
        out += `external=${isExternal}\n`;
        out += `degree=${deg.total} (in=${deg.in}, out=${deg.out})\n\n`;
    }
    out += `========================\n\n`;
    
    out += `=== CLUSTER DISTRIBUTION ===\n`;
    const sortedClustersByNodes = Array.from(analysis.clusterTraffic.entries())
        .filter(([id]) => !id.startsWith('cluster_ghost'))
        .sort((a, b) => b[1].nodes - a[1].nodes).slice(0, 15);
    for (const [id, data] of sortedClustersByNodes) {
        out += `${id}\n`;
        out += `  nodes: ${data.nodes}\n`;
        out += `  internal_edges: ${data.internal_edges}\n`;
        out += `  external_edges: ${data.external_edges}\n\n`;
    }
    
    out += `=== HUB RANKING ===\n`;
    const sortedHubs = Array.from(analysis.clusterTraffic.entries())
        .map(([id, data]) => ({ id, ...data, traffic_score: data.internal_edges + data.external_edges }))
        .filter(c => !c.id.startsWith('cluster_ghost'))
        .sort((a, b) => b.traffic_score - a.traffic_score)
        .slice(0, 15);
    for (const c of sortedHubs) {
        out += `${c.id}\n`;
        out += `  traffic: ${c.traffic_score}\n`;
        out += `  degree: ${c.external_edges}\n`;
        out += `  nodes: ${c.nodes}\n\n`;
    }
    
    out += `=== CLUSTER MATRIX ===\n`;
    const topClusters = sortedHubs.map(c => c.id).slice(0, 10);
    out += `                    ${topClusters.map(c => c.split('/').pop()?.substring(0, 9).padEnd(10) || c.substring(0, 9).padEnd(10)).join(' ')}\n`;
    for (const c1 of topClusters) {
        let row = `${c1.padEnd(19)} `;
        for (const c2 of topClusters) {
            if (c1 === c2) {
                row += `-         `;
            } else {
                const keys = [c1, c2].sort();
                const key = `${keys[0]} <-> ${keys[1]}`;
                const traffic = analysis.interClusterTraffic.get(key) || 0;
                row += `${traffic.toString().padEnd(10)}`;
            }
        }
        out += `${row}\n`;
    }
    out += `\n`;
    
    out += `=== CLUSTER EDGE LIST ===\n`;
    const sortedClusterEdges = Array.from(analysis.interClusterTraffic.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30);
    for (const [pair, traffic] of sortedClusterEdges) {
        const [c1, c2] = pair.split(' <-> ');
        out += `${c1.padEnd(20)} ──(${traffic})── ${c2}\n`;
    }
    out += `\n`;
    
    out += `=== GHOST IMPACT MATRIX ===\n`;
    const sortedGhostImpact = Array.from(analysis.ghostImpactTraffic.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);
    for (const [key, traffic] of sortedGhostImpact) {
        const [ghost, internal] = key.split(' -> ');
        out += `${ghost.padEnd(25)} -> ${internal.padEnd(35)} = ${traffic}\n`;
    }
    out += `\n`;
    
    out += `=== GHOST TRAFFIC ===\nghost_nodes=${analysis.stats.ghostNodes}\nghost_edges=${analysis.stats.ghostEdges}\nghost_ratio=${analysis.stats.ghostRatio.toFixed(1)}%\n\n`;
    
    const sortedContinents = Array.from(analysis.continentInfo.entries())
        .sort((a, b) => b[1].nodeCount - a[1].nodeCount);
    
    out += `=== INTERNAL CONTINENTS ===\n`;
    for (const [cont, info] of sortedContinents) {
       if (info.type === 'INTERNAL') {
           out += `${cont.padEnd(15)} nodes=${info.nodeCount} clusters=${info.clusterCount}\n`;
       }
    }
    out += `\n`;
    
    out += `=== EXTERNAL CONTINENTS ===\n`;
    for (const [cont, info] of sortedContinents) {
       if (info.type === 'EXTERNAL') {
           out += `${cont.padEnd(15)} nodes=${info.nodeCount} clusters=${info.clusterCount}\n`;
       }
    }
    out += `\n`;
    
    out += `=== TOP CONTINENT PAIRS ===\n`;
    const sortedInterTraffic = Array.from(analysis.interContinentTraffic.entries()).sort((a, b) => b[1] - a[1]);
    for (const [pair, rawTraffic] of sortedInterTraffic.slice(0, 15)) {
       out += `${pair.padEnd(30)} ${rawTraffic}\n`;
    }
    out += `\n`;
    
    out += `=== CONTINENT MATRIX ===\n`;
    const topInternal = sortedContinents
        .filter(([, info]) => info.type === 'INTERNAL')
        .slice(0, 8)
        .map(([cont]) => cont);
    out += `            ${topInternal.map(c => c.padEnd(10)).join(' ')}\n`;
    for (const c1 of topInternal) {
        let row = `${c1.padEnd(11)} `;
        for (const c2 of topInternal) {
            if (c1 === c2) {
                row += `-         `;
            } else {
                const keys = [c1, c2].sort();
                const key = `${keys[0]} <-> ${keys[1]}`;
                const traffic = analysis.interContinentTraffic.get(key) || 0;
                row += `${traffic.toString().padEnd(10)}`;
            }
        }
        out += `${row}\n`;
    }
    out += `\n`;
    
    out += `=== CONTINENT GRAPH (Top 20 Edges) ===\n`;
    for (const [pair, rawTraffic] of sortedInterTraffic.slice(0, 20)) {
       const [contA, contB] = pair.split(' <-> ');
       out += `${contA} ──(${rawTraffic})── ${contB}\n`;
    }
    out += `\n`;
    
    return out;
}
