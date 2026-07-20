import * as assert from 'assert';
import { generateBoundsDiagnostics } from './src/core/BoundsDiagnosticReporter';
import { LayoutResult, ContinentData, BoundingBox } from './src/core/LayoutEngine';
import { Node, Cluster } from './src/core/GraphModel';
import { ClusterWithBBox } from './src/core/LayoutEngine';

function createMockFixture() {
    const nodes: Node[] = [
        { id: 'n1', cluster_id: 'c1', position: { x: 10, y: 10 }, type: 'file' },
        { id: 'n2', cluster_id: 'c1', position: { x: 20, y: 20 }, type: 'file' },
        { id: 'n3', cluster_id: 'c2', position: { x: 100, y: 100 }, type: 'file' },
        { id: 'n4', cluster_id: 'c2', position: { x: 150, y: 150 }, type: 'file' },
    ];
    
    const clusters: Cluster[] = [
        { id: 'c1', label: 'C1', type: 'directory', position: { x: 15, y: 15 }, nodes: ['a', 'b'] },
        { id: 'c2', label: 'C2', type: 'directory', position: { x: 100, y: 100 }, nodes: ['c'] },
    ];

    const clusterNodes = new Map<string, Node[]>([
        ['c1', [nodes[0], nodes[1]]],
        ['c2', [nodes[2], nodes[3]]],
    ]);

    const sortedContinents: ContinentData[] = [
        {
            id: 'continent_1',
            clusters: [
                { ...clusters[0], estWidth: 50, estHeight: 50, area: 2500, nodeCount: 2, localX: 0, localY: 0 },
                { ...clusters[1], estWidth: 30, estHeight: 30, area: 900, nodeCount: 2, localX: 100, localY: 100 }
            ],
            nodeCount: 4,
            edgeCount: 1,
            hubTraffic: 10,
            weight: 5.5,
            estWidth: 200,
            estHeight: 200,
            centerX: 100,
            centerY: 100
        }
    ];

    const clusterBounds = new Map<string, BoundingBox>([
        ['c1', { minX: 10, minY: 10, maxX: 20, maxY: 20, width: 210, height: 210, centerX: 15, centerY: 15 }],
        ['c2', { minX: 100, minY: 100, maxX: 150, maxY: 150, width: 250, height: 250, centerX: 125, centerY: 125 }]
    ]);

    const worldBounds: BoundingBox = {
        minX: 10, minY: 10, maxX: 150, maxY: 150, width: 140, height: 140, centerX: 80, centerY: 80
    };

    const layoutResult: LayoutResult = {
        continentMap: new Map(),
        sortedContinents,
        clusterNodes,
        activeClusters: clusters,
        clusterBounds,
        worldBounds
    };

    return { layoutResult, nodes, clusters, clusterNodes };
}

function legacyGenerateBoundsDiagnostics(layoutResult: LayoutResult, nodes: Node[], clusters: Cluster[], clusterNodes: Map<string, Node[]>): string {
    let diagnosticOutput = '';
    
    diagnosticOutput += `=== [DIAGNOSTIC] CLUSTER BOUNDS ===\n`;
    let overlapCount = 0;
    const allPackedClusters: ClusterWithBBox[] = [];
    for (const cont of layoutResult.sortedContinents) {
        allPackedClusters.push(...cont.clusters);
    }

    for (let i = 0; i < allPackedClusters.length; i++) {
        const c1 = allPackedClusters[i];
        
        // Compute actual BBox from nodes
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        const c1Nodes = clusterNodes.get(c1.id) || [];
        for (const n of c1Nodes) {
            if (n.position) {
                minX = Math.min(minX, n.position.x);
                maxX = Math.max(maxX, n.position.x);
                minY = Math.min(minY, n.position.y);
                maxY = Math.max(maxY, n.position.y);
            }
        }
        
        // Actual BBox (with 200px padding for rendering)
        const actualWidth = maxX === -Infinity ? 200 : (maxX - minX) + 200;
        const actualHeight = maxY === -Infinity ? 200 : (maxY - minY) + 200;
        const actualCenterX = minX === -Infinity ? c1.position!.x : minX + (maxX - minX) / 2;
        const actualCenterY = minY === -Infinity ? c1.position!.y : minY + (maxY - minY) / 2;
        
        diagnosticOutput += `\n=== [CLUSTER] ===\n`;
        diagnosticOutput += `id=${c1.id}\n`;
        diagnosticOutput += `nodes=${c1.nodeCount}\n`;
        diagnosticOutput += `estimated_w=${c1.estWidth}\n`;
        diagnosticOutput += `estimated_h=${c1.estHeight}\n`;
        diagnosticOutput += `actual_w=${actualWidth.toFixed(0)}\n`;
        diagnosticOutput += `actual_h=${actualHeight.toFixed(0)}\n`;
        diagnosticOutput += `center=(${actualCenterX.toFixed(0)},${actualCenterY.toFixed(0)})\n`;
        
        const density = c1.nodeCount / (actualWidth * actualHeight || 1);
        diagnosticOutput += `density=${density.toFixed(6)}\n`;
        
        // Overlap detection using ACTUAL bounds (what is actually rendered)
        for (let j = i + 1; j < allPackedClusters.length; j++) {
            const c2 = allPackedClusters[j];
            
            let c2MinX = Infinity, c2MaxX = -Infinity, c2MinY = Infinity, c2MaxY = -Infinity;
            const c2Nodes = clusterNodes.get(c2.id) || [];
            for (const n of c2Nodes) {
                if (n.position) {
                    c2MinX = Math.min(c2MinX, n.position.x);
                    c2MaxX = Math.max(c2MaxX, n.position.x);
                    c2MinY = Math.min(c2MinY, n.position.y);
                    c2MaxY = Math.max(c2MaxY, n.position.y);
                }
            }
            const c2ActualWidth = c2MaxX === -Infinity ? 200 : (c2MaxX - c2MinX) + 200;
            const c2ActualHeight = c2MaxY === -Infinity ? 200 : (c2MaxY - c2MinY) + 200;
            const c2ActualCenterX = c2MinX === -Infinity ? c2.position!.x : c2MinX + (c2MaxX - c2MinX) / 2;
            const c2ActualCenterY = c2MinY === -Infinity ? c2.position!.y : c2MinY + (c2MaxY - c2MinY) / 2;
            
            const dx = Math.abs(actualCenterX - c2ActualCenterX);
            const dy = Math.abs(actualCenterY - c2ActualCenterY);
            
            // Checking intersection
            if (dx < (actualWidth + c2ActualWidth) / 2 && dy < (actualHeight + c2ActualHeight) / 2) {
                const overlapX = (actualWidth + c2ActualWidth) / 2 - dx;
                const overlapY = (actualHeight + c2ActualHeight) / 2 - dy;
                const overlapArea = overlapX * overlapY;
                diagnosticOutput += `[OVERLAP] ${c1.id} ↔ ${c2.id} area=${overlapArea.toFixed(0)}\n`;
                overlapCount++;
            }
        }
    }
    
    // World Bounds & Diagnostic Logging
    let globalMinX = Infinity, globalMinY = Infinity, globalMaxX = -Infinity, globalMaxY = -Infinity;
    nodes.forEach(n => {
        if (n.position) {
            globalMinX = Math.min(globalMinX, n.position.x);
            globalMinY = Math.min(globalMinY, n.position.y);
            globalMaxX = Math.max(globalMaxX, n.position.x);
            globalMaxY = Math.max(globalMaxY, n.position.y);
        }
    });
    
    diagnosticOutput += `\n=== [LAYOUT] ===\n`;
    diagnosticOutput += `[LAYOUT] cluster_count=${allPackedClusters.length}\n`;
    diagnosticOutput += `[LAYOUT] overlap_pairs=${overlapCount / 2}\n`;
    diagnosticOutput += `[LAYOUT] world_bounds=min(${globalMinX.toFixed(0)}, ${globalMinY.toFixed(0)}) max(${globalMaxX.toFixed(0)}, ${globalMaxY.toFixed(0)})\n`;
    diagnosticOutput += `[LAYOUT] world_width=${Math.abs(globalMaxX - globalMinX).toFixed(0)}\n`;
    diagnosticOutput += `[LAYOUT] world_height=${Math.abs(globalMaxY - globalMinY).toFixed(0)}\n`;
    diagnosticOutput += `================\n`;

    diagnosticOutput += `\n=== [RENDER DIAGNOSTIC] NODE DUMP ===\n`;
    for (let i = 0; i < Math.min(10, nodes.length); i++) {
        const n = nodes[i];
        diagnosticOutput += `NODE ${n.id} | cluster=${n.cluster_id} | comm=${n.data?.community_label || 'none'} | role=${n.data?.role || 'none'}\n`;
    }
    
    diagnosticOutput += `\n=== [RENDER DIAGNOSTIC] CLUSTER DUMP ===\n`;
    for (const c of clusters) {
        diagnosticOutput += `CLUSTER id=${c.id} type=${c.type} nodes=${c.nodes!.length} (computed count=${clusterNodes.get(c.id)?.length || 0})\n`;
    }
    diagnosticOutput += `=========================================\n`;
    
    return diagnosticOutput;
}

function verifyStep2g5() {
    const { layoutResult, nodes, clusters, clusterNodes } = createMockFixture();

    const legacyOutput = legacyGenerateBoundsDiagnostics(layoutResult, nodes, clusters, clusterNodes);
    const newOutput = generateBoundsDiagnostics(layoutResult, nodes, clusters);

    assert.strictEqual(legacyOutput, newOutput, "Bounds Diagnostics mismatch!");
    
    console.log("=== Step 2g-5 Regression Verification ===");
    console.log("Bounds diagnostic diff: 0");
    console.log("Verification PASSED!");
}

verifyStep2g5();
