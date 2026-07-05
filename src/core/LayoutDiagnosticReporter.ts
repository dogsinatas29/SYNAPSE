import { Cluster } from './GraphModel';
import { LayoutResult } from './LayoutEngine';

export function generateLayoutDiagnostics(layoutResult: LayoutResult): string {
    let diagnosticOutput = '';

    // CONTINENT LAYOUT
    diagnosticOutput += `=== CONTINENT LAYOUT ===\n`;
    for (const cont of layoutResult.sortedContinents) {
        diagnosticOutput += `${cont.id}\n`;
        diagnosticOutput += `  clusters: ${cont.clusters.length}\n`;
        diagnosticOutput += `  nodes: ${cont.nodeCount}\n`;
        diagnosticOutput += `  weight: ${cont.weight.toFixed(1)}\n`;
        diagnosticOutput += `  bbox: ${Math.round(cont.estWidth)}x${Math.round(cont.estHeight)}\n`;
        diagnosticOutput += `  center: (${Math.round(cont.centerX)}, ${Math.round(cont.centerY)})\n\n`;
    }

    // CONTINENT DISTANCE
    diagnosticOutput += `\n=== CONTINENT DISTANCE ===\n`;
    const distanceList: { pair: string, dist: number }[] = [];
    for (let i = 0; i < layoutResult.sortedContinents.length; i++) {
        for (let j = i + 1; j < layoutResult.sortedContinents.length; j++) {
            const a = layoutResult.sortedContinents[i];
            const b = layoutResult.sortedContinents[j];
            const dx = a.centerX - b.centerX;
            const dy = a.centerY - b.centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            distanceList.push({
                pair: `${a.id} <-> ${b.id}`,
                dist
            });
        }
    }
    distanceList.sort((a, b) => a.dist - b.dist).slice(0, 20).forEach(d => {
        diagnosticOutput += `${d.pair} = ${Math.round(d.dist)}\n`;
    });
    diagnosticOutput += `\n`;

    // CLUSTER CENTROIDS
    diagnosticOutput += `=== CLUSTER CENTROIDS ===\n`;
    const centroidTopClusters = [...layoutResult.activeClusters]
        .filter(c => c.type !== 'system' && c.id !== 'doc_shelf')
        .sort((a, b) => (layoutResult.clusterNodes.get(b.id)?.length || 0) - (layoutResult.clusterNodes.get(a.id)?.length || 0))
        .slice(0, 15);
        
    for (const c of centroidTopClusters) {
        const cNodes = layoutResult.clusterNodes.get(c.id) || [];
        if (cNodes.length === 0) continue;
        
        let sumX = 0, sumY = 0;
        let validNodes = 0;
        for (const n of cNodes) {
            if (n.position) {
                sumX += n.position.x;
                sumY += n.position.y;
                validNodes++;
            }
        }
        const nodeCenterX = validNodes > 0 ? sumX / validNodes : 0;
        const nodeCenterY = validNodes > 0 ? sumY / validNodes : 0;
        
        diagnosticOutput += `${c.id}\n`;
        diagnosticOutput += `bbox_center=(${Math.round(c.position!.x)}, ${Math.round(c.position!.y)})\n`;
        diagnosticOutput += `node_center=(${Math.round(nodeCenterX)}, ${Math.round(nodeCenterY)})\n`;
        diagnosticOutput += `node_count=${cNodes.length}\n\n`;
    }

    return diagnosticOutput;
}
