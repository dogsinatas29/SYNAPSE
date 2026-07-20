import * as assert from 'assert';
import { generateLayoutDiagnostics } from './src/core/LayoutDiagnosticReporter';
import { LayoutResult, ContinentData } from './src/core/LayoutEngine';
import { Node, Cluster } from './src/core/GraphModel';

function createMockFixture() {
    const nodes: Node[] = [
        { id: 'n1', cluster_id: 'c1', position: { x: 10, y: 10 }, type: 'file' },
        { id: 'n2', cluster_id: 'c1', position: { x: 20, y: 20 }, type: 'file' },
        { id: 'n3', cluster_id: 'c2', position: { x: 100, y: 100 }, type: 'file' },
    ];
    
    const clusters: Cluster[] = [
        { id: 'c1', label: 'C1', type: 'directory', position: { x: 15, y: 15 } },
        { id: 'c2', label: 'C2', type: 'directory', position: { x: 100, y: 100 } },
    ];

    const clusterNodes = new Map<string, Node[]>([
        ['c1', [nodes[0], nodes[1]]],
        ['c2', [nodes[2]]],
    ]);

    const sortedContinents: ContinentData[] = [
        {
            id: 'continent_1',
            clusters: [
                { ...clusters[0], estWidth: 50, estHeight: 50, area: 2500, nodeCount: 2 }
            ],
            nodeCount: 2,
            edgeCount: 1,
            hubTraffic: 10,
            weight: 5.5,
            estWidth: 100,
            estHeight: 100,
            centerX: 50,
            centerY: 50
        },
        {
            id: 'continent_2',
            clusters: [
                { ...clusters[1], estWidth: 30, estHeight: 30, area: 900, nodeCount: 1 }
            ],
            nodeCount: 1,
            edgeCount: 0,
            hubTraffic: 2,
            weight: 1.2,
            estWidth: 50,
            estHeight: 50,
            centerX: 200,
            centerY: 200
        }
    ];

    const layoutResult: LayoutResult = {
        continentMap: new Map(),
        sortedContinents,
        clusterNodes,
        activeClusters: clusters
    };

    return { layoutResult, clusters, clusterNodes };
}

function legacyGenerateLayoutDiagnostics(layoutResult: LayoutResult, clusters: Cluster[], clusterNodes: Map<string, Node[]>): string {
    let diagnosticOutput = '';
    
    diagnosticOutput += `=== CONTINENT LAYOUT ===\n`;
    for (const cont of layoutResult.sortedContinents) {
        diagnosticOutput += `${cont.id}\n`;
        diagnosticOutput += `  clusters: ${cont.clusters.length}\n`;
        diagnosticOutput += `  nodes: ${cont.nodeCount}\n`;
        diagnosticOutput += `  weight: ${cont.weight.toFixed(1)}\n`;
        diagnosticOutput += `  bbox: ${Math.round(cont.estWidth)}x${Math.round(cont.estHeight)}\n`;
        diagnosticOutput += `  center: (${Math.round(cont.centerX)}, ${Math.round(cont.centerY)})\n\n`;
    }

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

    // Phase 2B.12: CLUSTER CENTROIDS
    diagnosticOutput += `=== CLUSTER CENTROIDS ===\n`;
    const centroidTopClusters = [...clusters].filter(c => c.type !== 'system' && c.id !== 'doc_shelf')
        .sort((a, b) => (clusterNodes.get(b.id)?.length || 0) - (clusterNodes.get(a.id)?.length || 0))
        .slice(0, 15);
        
    for (const c of centroidTopClusters) {
        const cNodes = clusterNodes.get(c.id) || [];
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

function verifyStep2g4() {
    const { layoutResult, clusters, clusterNodes } = createMockFixture();

    const legacyOutput = legacyGenerateLayoutDiagnostics(layoutResult, clusters, clusterNodes);
    const newOutput = generateLayoutDiagnostics(layoutResult);

    assert.strictEqual(legacyOutput, newOutput, "Layout Diagnostics mismatch!");
    
    console.log("=== Step 2g-4 Regression Verification ===");
    console.log("Layout diagnostic diff: 0");
    console.log("Verification PASSED!");
}

verifyStep2g4();
