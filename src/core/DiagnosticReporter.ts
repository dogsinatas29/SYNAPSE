import { Node, NodeType } from './GraphModel';
import { GraphAnalysis } from './GraphAnalyzer';

export interface DiagnosticContext {
    nodeCount: number;
    edgeCount: number;
    edgeTypeCount: Map<string, number>;
    packageRemoved: number;
    exactRemoved: number;
    nodeMap: Map<string, Node>;
}

export function generateDiagnosticReport(
    analysis: GraphAnalysis,
    context: DiagnosticContext
): string {
    const lines: string[] = [];

    lines.push(renderBranchCompression());
    lines.push(renderClusterSummary(analysis));
    lines.push(renderEdgeSummary(analysis));
    lines.push(renderPipelineSummary(context));
    lines.push(renderEdgeBreakdown(context));
    lines.push(renderClusterSizeDistribution(analysis));
    lines.push(renderTopHubFiles(analysis, context));
    lines.push(renderClusterDistribution(analysis));
    lines.push(renderHubRanking(analysis));
    lines.push(renderClusterMatrix(analysis));
    lines.push(renderClusterEdgeList(analysis));
    lines.push(renderGhostImpactMatrix(analysis));
    lines.push(renderGhostTraffic(analysis));
    lines.push(renderInternalContinents(analysis));
    lines.push(renderExternalContinents(analysis));
    lines.push(renderTopContinentPairs(analysis));
    lines.push(renderContinentMatrix(analysis));
    lines.push(renderContinentGraph(analysis));

    return lines.join('');
}

function renderBranchCompression(): string {
    return `\n=== BRANCH COMPRESSION ===\n(moved to NodeBuilder)\n\n`;
}

function renderClusterSummary(analysis: GraphAnalysis): string {
    console.log('[SUMMARY_SOURCE]', 'clusterTraffic.size=', analysis.clusterTraffic.size);
    let out = `=== CLUSTER SUMMARY ===\n`;
    for (const [cId, cCount] of Array.from(analysis.clusterTraffic.entries())
        .map(([id, data]) => [id, data.nodes] as [string, number])
        .sort((a, b) => b[1] - a[1])) {
        out += `${cId.padEnd(25)} nodes=${cCount}\n`;
    }
    out += `TOTAL_CLUSTERS=${analysis.clusterTraffic.size}\n\n`;
    return out;
}

function renderEdgeSummary(analysis: GraphAnalysis): string {
    return `=== EDGE SUMMARY ===\nInternal Edges: ${analysis.stats.internalEdges}\nExternal/Ghost Edges: ${analysis.stats.externalEdges}\n\n`;
}

function renderPipelineSummary(context: DiagnosticContext): string {
    return `======================================================\n[PIPELINE] Nodes=${context.nodeCount} Edges=${context.edgeCount}\n[FILTER] package_removed=${context.packageRemoved} exact_removed=${context.exactRemoved}\n======================================================\n`;
}

function renderEdgeBreakdown(context: DiagnosticContext): string {
    let out = `=== EDGE BREAKDOWN ===\n`;
    for (const [type, count] of context.edgeTypeCount.entries()) {
        out += `  - ${type}: ${count}\n`;
    }
    out += `======================================================\n\n`;
    return out;
}

function renderGhostTraffic(analysis: GraphAnalysis): string {
    return `=== GHOST TRAFFIC ===\nghost_nodes=${analysis.stats.ghostNodes}\nghost_edges=${analysis.stats.ghostEdges}\nghost_ratio=${analysis.stats.ghostRatio.toFixed(1)}%\n\n`;
}

function renderClusterSizeDistribution(analysis: GraphAnalysis): string {
    return `=== CLUSTER SIZE DISTRIBUTION ===\n1 node   : ${analysis.clusterSizes['1 node']} clusters\n2-5 nodes: ${analysis.clusterSizes['2-5 nodes']} clusters\n6-10     : ${analysis.clusterSizes['6-10']} clusters\n11-20    : ${analysis.clusterSizes['11-20']} clusters\n20+      : ${analysis.clusterSizes['20+']} clusters\n======================================================\n\n`;
}

function renderClusterDistribution(analysis: GraphAnalysis): string {
    let out = `=== CLUSTER DISTRIBUTION ===\n`;
    const sortedClustersByNodes = Array.from(analysis.clusterTraffic.entries())
        .filter(([id]) => !id.startsWith('cluster_ghost'))
        .sort((a, b) => b[1].nodes - a[1].nodes).slice(0, 15);
    for (const [id, data] of sortedClustersByNodes) {
        out += `${id}\n`;
        out += `  nodes: ${data.nodes}\n`;
        out += `  internal_edges: ${data.internal_edges}\n`;
        out += `  external_edges: ${data.external_edges}\n\n`;
    }
    return out;
}

function renderHubRanking(analysis: GraphAnalysis): string {
    let out = `=== HUB RANKING ===\n`;
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
    return out;
}

function renderTopHubFiles(analysis: GraphAnalysis, context: DiagnosticContext): string {
    let out = `=== TOP HUB FILES ===\n`;
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
    return out;
}

function renderClusterMatrix(analysis: GraphAnalysis): string {
    let out = `=== CLUSTER MATRIX ===\n`;
    const sortedHubs = Array.from(analysis.clusterTraffic.entries())
        .map(([id, data]) => ({ id, ...data, traffic_score: data.internal_edges + data.external_edges }))
        .filter(c => !c.id.startsWith('cluster_ghost'))
        .sort((a, b) => b.traffic_score - a.traffic_score)
        .slice(0, 15);
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
    return out;
}

function renderClusterEdgeList(analysis: GraphAnalysis): string {
    let out = `=== CLUSTER EDGE LIST ===\n`;
    const sortedClusterEdges = Array.from(analysis.interClusterTraffic.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30);
    for (const [pair, traffic] of sortedClusterEdges) {
        const [c1, c2] = pair.split(' <-> ');
        out += `${c1.padEnd(20)} ──(${traffic})── ${c2}\n`;
    }
    out += `\n`;
    return out;
}

function renderGhostImpactMatrix(analysis: GraphAnalysis): string {
    let out = `=== GHOST IMPACT MATRIX ===\n`;
    const sortedGhostImpact = Array.from(analysis.ghostImpactTraffic.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);
    for (const [key, traffic] of sortedGhostImpact) {
        const [ghost, internal] = key.split(' -> ');
        out += `${ghost.padEnd(25)} -> ${internal.padEnd(35)} = ${traffic}\n`;
    }
    out += `\n`;
    return out;
}

function renderInternalContinents(analysis: GraphAnalysis): string {
    let out = `=== INTERNAL CONTINENTS ===\n`;
    const sortedContinents = Array.from(analysis.continentInfo.entries())
        .sort((a, b) => b[1].nodeCount - a[1].nodeCount);
    for (const [cont, info] of sortedContinents) {
        if (info.type === 'INTERNAL') {
            out += `${cont.padEnd(15)} nodes=${info.nodeCount} clusters=${info.clusterCount}\n`;
        }
    }
    out += `\n`;
    return out;
}

function renderExternalContinents(analysis: GraphAnalysis): string {
    let out = `=== EXTERNAL CONTINENTS ===\n`;
    const sortedContinents = Array.from(analysis.continentInfo.entries())
        .sort((a, b) => b[1].nodeCount - a[1].nodeCount);
    for (const [cont, info] of sortedContinents) {
        if (info.type === 'EXTERNAL') {
            out += `${cont.padEnd(15)} nodes=${info.nodeCount} clusters=${info.clusterCount}\n`;
        }
    }
    out += `\n`;
    return out;
}

function renderTopContinentPairs(analysis: GraphAnalysis): string {
    let out = `=== TOP CONTINENT PAIRS ===\n`;
    const sortedInterTraffic = Array.from(analysis.interContinentTraffic.entries()).sort((a, b) => b[1] - a[1]);
    for (const [pair, rawTraffic] of sortedInterTraffic.slice(0, 15)) {
        out += `${pair.padEnd(30)} ${rawTraffic}\n`;
    }
    out += `\n`;
    return out;
}

function renderContinentMatrix(analysis: GraphAnalysis): string {
    let out = `=== CONTINENT MATRIX ===\n`;
    const sortedContinents = Array.from(analysis.continentInfo.entries())
        .sort((a, b) => b[1].nodeCount - a[1].nodeCount);
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
    return out;
}

function renderContinentGraph(analysis: GraphAnalysis): string {
    let out = `=== CONTINENT GRAPH (Top 20 Edges) ===\n`;
    const sortedInterTraffic = Array.from(analysis.interContinentTraffic.entries()).sort((a, b) => b[1] - a[1]);
    for (const [pair, rawTraffic] of sortedInterTraffic.slice(0, 20)) {
        const [contA, contB] = pair.split(' <-> ');
        out += `${contA} ──(${rawTraffic})── ${contB}\n`;
    }
    out += `\n`;
    return out;
}
