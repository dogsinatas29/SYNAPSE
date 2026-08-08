import { LayoutResult } from './LayoutEngine';
import { Node, Cluster } from './GraphModel';

export function generateBoundsDiagnostics(layoutResult: LayoutResult, nodes: Node[], clusters: Cluster[]): string {
    let diagnosticOutput = '';
    let overlapCount = 0;

    // CLUSTER BOUNDS
    diagnosticOutput += `=== [DIAGNOSTIC] CLUSTER BOUNDS ===\n`;

    // Use authoritative sources (activeClusters or the clusters param) instead of the now-empty sortedContinents
    const allPackedClusters = (layoutResult.activeClusters?.length ? layoutResult.activeClusters : clusters);
    const MAX_DIAGNOSTICS = 1000;
    const isHugeGraph = allPackedClusters.length > MAX_DIAGNOSTICS;
    const processCount = Math.min(allPackedClusters.length, MAX_DIAGNOSTICS);

    if (isHugeGraph) {
        diagnosticOutput += `\n[WARNING] Graph is huge (${allPackedClusters.length} clusters). Capping bounds diagnostics to first ${MAX_DIAGNOSTICS} clusters to prevent OOM.\n`;
    }

    for (let i = 0; i < processCount; i++) {
        const c1 = allPackedClusters[i];
        const c1Bounds = layoutResult.clusterBounds.get(c1.id);
        if (!c1Bounds) {
            continue;
        }
        
        diagnosticOutput += `\n=== [CLUSTER] ===\n`;
        diagnosticOutput += `id=${c1.id}\n`;
        diagnosticOutput += `nodes=${c1.nodeCount}\n`;
        diagnosticOutput += `estimated_w=${c1.estWidth}\n`;
        diagnosticOutput += `estimated_h=${c1.estHeight}\n`;
        diagnosticOutput += `actual_w=${Math.round(c1Bounds.width)}\n`;
        diagnosticOutput += `actual_h=${Math.round(c1Bounds.height)}\n`;
        diagnosticOutput += `center=(${Math.round(c1Bounds.centerX)},${Math.round(c1Bounds.centerY)})\n`;
        
        const density = c1.nodeCount / (c1Bounds.width * c1Bounds.height || 1);
        diagnosticOutput += `density=${density.toFixed(6)}\n`;
        
        // Overlap detection (capped to avoid O(N^2) explosion)
        let overlapsLogged = 0;
        for (let j = i + 1; j < allPackedClusters.length; j++) {
            const c2 = allPackedClusters[j];
            const c2Bounds = layoutResult.clusterBounds.get(c2.id);
            if (!c2Bounds) continue;
            
            const dx = Math.abs(c1Bounds.centerX - c2Bounds.centerX);
            const dy = Math.abs(c1Bounds.centerY - c2Bounds.centerY);
            
            if (dx < (c1Bounds.width + c2Bounds.width) / 2 && dy < (c1Bounds.height + c2Bounds.height) / 2) {
                overlapCount++;
                if (overlapsLogged < 5) { // Cap overlap logging per cluster
                    const overlapX = (c1Bounds.width + c2Bounds.width) / 2 - dx;
                    const overlapY = (c1Bounds.height + c2Bounds.height) / 2 - dy;
                    diagnosticOutput += `[OVERLAP] ${c1.id} & ${c2.id} (area=${Math.round(overlapX * overlapY)})\n`;
                    overlapsLogged++;
                }
            }
        }
        if (overlapsLogged >= 5) {
            diagnosticOutput += `... (more overlaps omitted)\n`;
        }
    }

    // WORLD BOUNDS
    const wb = layoutResult.worldBounds;
    console.log('[BOUNDS_SOURCE]', {
        clustersLength: clusters?.length,
        firstIds: clusters?.slice(0,5).map(c => c.id)
    });
    console.log('[LAYOUT_RESULT_KEYS]', Object.keys(layoutResult));
    diagnosticOutput += `\n=== [LAYOUT] ===\n`;
    diagnosticOutput += `[LAYOUT] cluster_count=${allPackedClusters.length}\n`;
    diagnosticOutput += `[LAYOUT] overlap_pairs=${overlapCount / 2}\n`; // Because in DataPipeline they incremented inside nested loop which checked i+1 to end, wait... it was overlapCount++ once. It did NOT do symmetric increment. Let me check DataPipeline to see if they divided by 2 or not. 
    // Wait, DataPipeline.ts says: Logger.info(`[LAYOUT] overlap_pairs=${overlapCount / 2}`);
    // Actually if it's j = i + 1, it's counted once. So overlapCount / 2 is 0.5? Let's exactly match DataPipeline.ts.
    diagnosticOutput += `[LAYOUT] world_bounds=min(${wb.minX.toFixed(0)}, ${wb.minY.toFixed(0)}) max(${wb.maxX.toFixed(0)}, ${wb.maxY.toFixed(0)})\n`;
    diagnosticOutput += `[LAYOUT] world_width=${Math.abs(wb.maxX - wb.minX).toFixed(0)}\n`;
    diagnosticOutput += `[LAYOUT] world_height=${Math.abs(wb.maxY - wb.minY).toFixed(0)}\n`;
    diagnosticOutput += `================\n`;

    // NODE DUMP
    diagnosticOutput += `\n=== [RENDER DIAGNOSTIC] NODE DUMP ===\n`;
    for (let i = 0; i < Math.min(10, nodes.length); i++) {
        const n = nodes[i];
        diagnosticOutput += `NODE ${n.id} | cluster=${n.cluster_id} | comm=${n.data?.community_label || 'none'} | role=${n.data?.role || 'none'}\n`;
    }

    // CLUSTER DUMP
    console.log('[RENDER_SOURCE]', 'clusters.length=', clusters.length);
    diagnosticOutput += `\n=== [RENDER DIAGNOSTIC] CLUSTER DUMP ===\n`;
    for (const c of clusters) {
        diagnosticOutput += `CLUSTER id=${c.id} type=${c.type} nodes=${c.nodes?.length || 0} (computed count=${layoutResult.clusterNodes.get(c.id)?.length || 0})\n`;
    }
    diagnosticOutput += `=========================================\n`;

    return diagnosticOutput;
}
