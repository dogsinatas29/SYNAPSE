import * as assert from 'assert';
import { applyLayout, LayoutInput, NODE_SPACING_X, NODE_SPACING_Y, ClusterWithBBox, ContinentData } from './src/core/LayoutEngine';
import { Node, Cluster } from './src/core/GraphModel';
import { GraphAnalysis } from './src/core/GraphAnalyzer';

function clone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

// ================= Legacy Layout Implementation (Inline) =================
function applyLayoutLegacy(nodes: Node[], clusters: Cluster[], analysis: GraphAnalysis) {
    const clusterNodes = new Map<string, Node[]>();
    for (const n of nodes) {
        const cid = n.cluster_id || '__unclustered__';
        if (!clusterNodes.has(cid)) clusterNodes.set(cid, []);
        clusterNodes.get(cid)!.push(n);
    }

    const activeClusterIds = new Set(clusterNodes.keys());
    const activeClusters = clusters.filter(c => activeClusterIds.has(c.id));

    if (activeClusterIds.has('__unclustered__') && !clusters.find(c => c.id === '__unclustered__')) {
        const rootCluster: Cluster = {
            id: '__unclustered__', label: '📁 Root', type: 'folder', collapsed: false,
            position: { x: 0, y: 0 }, bounds: { x: 0, y: 0, width: 0, height: 0 },
            children: [], nodes: [], data: { continent: 'root', subcontinent: 'root' }
        };
        activeClusters.push(rootCluster);
        clusters.push(rootCluster);
    }

    const continentMap = new Map<string, ContinentData>();
    for (const c of activeClusters) {
        const count = clusterNodes.get(c.id)?.length || 1;
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);

        const gridWidth = cols * NODE_SPACING_X + 150;
        const labelWidth = c.label ? c.label.length * 15 + 150 : 200;
        const estWidth = Math.max(gridWidth, labelWidth);
        const estHeight = Math.max(rows * NODE_SPACING_Y + 150, 150);

        const packedC: ClusterWithBBox = {
            ...c, estWidth, estHeight, area: estWidth * estHeight, nodeCount: count
        };

        const cont = c.data?.continent || 'unknown';
        if (!continentMap.has(cont)) {
            continentMap.set(cont, {
                id: cont, clusters: [], nodeCount: 0, edgeCount: 0, hubTraffic: 0, weight: 0, estWidth: 0, estHeight: 0, centerX: 0, centerY: 0
            });
        }
        continentMap.get(cont)!.clusters.push(packedC);
    }

    for (const [cont, data] of continentMap.entries()) {
        const traffic = analysis.continentTraffic.get(cont) || { internal: 0, external: 0 };
        data.nodeCount = analysis.continentInfo.get(cont)?.nodeCount || 0;
        data.edgeCount = traffic.internal + traffic.external;
        data.hubTraffic = traffic.external;
        data.weight = data.nodeCount * 0.3 + data.edgeCount * 0.4 + data.hubTraffic * 0.3;

        data.clusters.sort((a, b) => {
            const subA = a.data?.subcontinent || '';
            const subB = b.data?.subcontinent || '';
            if (subA !== subB) return subA.localeCompare(subB);
            return b.area - a.area;
        });

        let currentX = 0, currentY = 0, rowMaxHeight = 0, maxW = 0;
        const totalClusterArea = data.clusters.reduce((sum, c) => sum + c.area, 0);
        const dynamicClusterGap = Math.max(Math.sqrt(totalClusterArea) * 0.15, 200);
        const idealWidth = Math.max(Math.sqrt(totalClusterArea) * 1.5, 1000);

        for (const c of data.clusters) {
            if (currentX + c.estWidth > idealWidth && currentX > 0) {
                currentX = 0;
                currentY += rowMaxHeight + dynamicClusterGap;
                rowMaxHeight = 0;
            }
            c.localX = currentX + c.estWidth / 2;
            c.localY = currentY + c.estHeight / 2;
            currentX += c.estWidth + dynamicClusterGap;
            rowMaxHeight = Math.max(rowMaxHeight, c.estHeight);
            maxW = Math.max(maxW, currentX - dynamicClusterGap);
        }
        
        const dynamicContinentGap = Math.max(Math.sqrt(totalClusterArea) * 0.6, 1000);
        data.estWidth = maxW + dynamicContinentGap;
        data.estHeight = currentY + rowMaxHeight + dynamicContinentGap;

        const cNodes = data.clusters;
        const ITERATIONS = 150, SPRING_K = 0.05, REPULSION_K = 100000; 

        for (let iter = 0; iter < ITERATIONS; iter++) {
            const forces = new Map<string, { fx: number, fy: number }>();
            for (const c of cNodes) forces.set(c.id, { fx: 0, fy: 0 });

            for (let i = 0; i < cNodes.length; i++) {
                for (let j = i + 1; j < cNodes.length; j++) {
                    const c1 = cNodes[i], c2 = cNodes[j];
                    const dx = c1.localX! - c2.localX!, dy = c1.localY! - c2.localY!;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < 1) dist = 1;
                    
                    const min_dist = (c1.estWidth + c2.estWidth) / 2 + 100;
                    if (dist < min_dist) {
                        const overlap = min_dist - dist;
                        const force = overlap * 1.5; 
                        const fx = (dx / dist) * force, fy = (dy / dist) * force;
                        forces.get(c1.id)!.fx += fx; forces.get(c1.id)!.fy += fy;
                        forces.get(c2.id)!.fx -= fx; forces.get(c2.id)!.fy -= fy;
                    } else {
                        const force = REPULSION_K / (dist * dist);
                        const fx = (dx / dist) * force, fy = (dy / dist) * force;
                        forces.get(c1.id)!.fx += fx; forces.get(c1.id)!.fy += fy;
                        forces.get(c2.id)!.fx -= fx; forces.get(c2.id)!.fy -= fy;
                    }
                }
            }

            for (let i = 0; i < cNodes.length; i++) {
                for (let j = i + 1; j < cNodes.length; j++) {
                    const c1 = cNodes[i], c2 = cNodes[j];
                    const keys = [c1.id, c2.id].sort();
                    const key = `${keys[0]} <-> ${keys[1]}`;
                    const traffic = analysis.interClusterTraffic.get(key) || 0;
                    if (traffic > 0) {
                        const dx = c2.localX! - c1.localX!, dy = c2.localY! - c1.localY!;
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        if (dist < 1) dist = 1;
                        const force = Math.log(traffic + 1) * SPRING_K * dist; 
                        const fx = (dx / dist) * force, fy = (dy / dist) * force;
                        forces.get(c1.id)!.fx += fx; forces.get(c1.id)!.fy += fy;
                        forces.get(c2.id)!.fx -= fx; forces.get(c2.id)!.fy -= fy;
                    }
                }
            }

            for (const c of cNodes) {
                const f = forces.get(c.id)!;
                const maxV = 100;
                f.fx = Math.max(-maxV, Math.min(maxV, f.fx));
                f.fy = Math.max(-maxV, Math.min(maxV, f.fy));
                c.localX! += f.fx; c.localY! += f.fy;
            }
        }

        if (cNodes.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const c of cNodes) {
                minX = Math.min(minX, c.localX! - c.estWidth / 2);
                minY = Math.min(minY, c.localY! - c.estHeight / 2);
                maxX = Math.max(maxX, c.localX! + c.estWidth / 2);
                maxY = Math.max(maxY, c.localY! + c.estHeight / 2);
            }
            for (const c of cNodes) {
                c.localX! -= minX; c.localY! -= minY;
            }
            data.estWidth = (maxX - minX) + dynamicContinentGap;
            data.estHeight = (maxY - minY) + dynamicContinentGap;
        }
    }

    const sortedContinentsArr = Array.from(continentMap.values()).sort((a, b) => b.weight - a.weight);
    let worldX = 0, worldY = 0, worldRowMaxHeight = 0;
    const MAX_WORLD_WIDTH = 12000;

    for (const cont of sortedContinentsArr) {
        if (worldX + cont.estWidth > MAX_WORLD_WIDTH && worldX > 0) {
            worldX = 0;
            worldY += worldRowMaxHeight;
            worldRowMaxHeight = 0;
        }
        cont.centerX = worldX + cont.estWidth / 2;
        cont.centerY = worldY + cont.estHeight / 2;

        for (const c of cont.clusters) {
            c.position = { x: worldX + c.localX!, y: worldY + c.localY! };
            const originalC = clusters.find(orig => orig.id === c.id);
            if (originalC) originalC.position = { ...c.position };
        }
        worldX += cont.estWidth;
        worldRowMaxHeight = Math.max(worldRowMaxHeight, cont.estHeight);
    }

    for (const cont of sortedContinentsArr) {
        for (const c of cont.clusters) {
            const cNodes = clusterNodes.get(c.id) || [];
            const cols = Math.ceil(Math.sqrt(cNodes.length));
            const rows = Math.ceil(cNodes.length / cols);
            const cx = c.position!.x, cy = c.position!.y;
            for (let i = 0; i < cNodes.length; i++) {
                const n = cNodes[i];
                const col = i % cols, row = Math.floor(i / cols);
                if (n.position) {
                    n.position.x = cx + (col - (cols - 1) / 2) * NODE_SPACING_X;
                    n.position.y = cy + (row - (rows - 1) / 2) * NODE_SPACING_Y;
                }
            }
        }
    }

    return { sortedContinents: sortedContinentsArr, activeClusters, clusterNodes, continentMap };
}

// Layout Diagnostics 
function generateLayoutDiagnostics(sortedContinents: any[], clusterNodes: Map<string, Node[]>, clusters: Cluster[]): string {
    let out = `=== CONTINENT LAYOUT ===\n`;
    for (const cont of sortedContinents) {
        out += `${cont.id}\n  clusters: ${cont.clusters.length}\n  nodes: ${cont.nodeCount}\n  weight: ${cont.weight.toFixed(1)}\n  bbox: ${Math.round(cont.estWidth)}x${Math.round(cont.estHeight)}\n  center: (${Math.round(cont.centerX)}, ${Math.round(cont.centerY)})\n\n`;
    }

    out += `\n=== CONTINENT DISTANCE ===\n`;
    const distanceList: { pair: string, dist: number }[] = [];
    for (let i = 0; i < sortedContinents.length; i++) {
        for (let j = i + 1; j < sortedContinents.length; j++) {
            const a = sortedContinents[i], b = sortedContinents[j];
            const dx = a.centerX - b.centerX, dy = a.centerY - b.centerY;
            distanceList.push({ pair: `${a.id} <-> ${b.id}`, dist: Math.sqrt(dx * dx + dy * dy) });
        }
    }
    distanceList.sort((a, b) => a.dist - b.dist).slice(0, 20).forEach(d => {
        out += `${d.pair} = ${Math.round(d.dist)}\n`;
    });
    out += `\n=== CLUSTER CENTROIDS ===\n`;
    const centroidTopClusters = [...clusters].filter(c => c.type !== 'system' && c.id !== 'doc_shelf')
        .sort((a, b) => (clusterNodes.get(b.id)?.length || 0) - (clusterNodes.get(a.id)?.length || 0))
        .slice(0, 15);
        
    for (const c of centroidTopClusters) {
        const cNodes = clusterNodes.get(c.id) || [];
        if (cNodes.length === 0) continue;
        let sumX = 0, sumY = 0, validNodes = 0;
        for (const n of cNodes) {
            if (n.position) {
                sumX += n.position.x; sumY += n.position.y; validNodes++;
            }
        }
        const nodeCenterX = validNodes > 0 ? sumX / validNodes : 0;
        const nodeCenterY = validNodes > 0 ? sumY / validNodes : 0;
        out += `${c.id}\nbbox_center=(${Math.round(c.position!.x)}, ${Math.round(c.position!.y)})\nnode_center=(${Math.round(nodeCenterX)}, ${Math.round(nodeCenterY)})\nnode_count=${cNodes.length}\n\n`;
    }
    return out;
}

async function main() {
    console.log('=== Step 2g-3 Regression Verification ===');

    const nodes: Node[] = [
        { id: 'node1', label: 'file1', type: 'file', cluster_id: 'c1', position: {x:0, y:0}, data: {}, edges: [] },
        { id: 'node2', label: 'file2', type: 'file', cluster_id: 'c1', position: {x:0, y:0}, data: {}, edges: [] },
        { id: 'node3', label: 'file3', type: 'file', cluster_id: 'c2', position: {x:0, y:0}, data: {}, edges: [] },
        { id: 'node4', label: 'file4', type: 'file', cluster_id: 'c2', position: {x:0, y:0}, data: {}, edges: [] }
    ];

    const clusters: Cluster[] = [
        { id: 'c1', label: 'Cluster 1', type: 'folder', collapsed: false, position: {x:0, y:0}, bounds: {x:0,y:0,width:0,height:0}, children: [], nodes: [], data: {continent: 'contA'} },
        { id: 'c2', label: 'Cluster 2', type: 'folder', collapsed: false, position: {x:0, y:0}, bounds: {x:0,y:0,width:0,height:0}, children: [], nodes: [], data: {continent: 'contB'} }
    ];

    const analysis: GraphAnalysis = {
        degreeMap: new Map(),
        clusterTraffic: new Map(),
        interClusterTraffic: new Map([['c1 <-> c2', 2]]),
        ghostImpactTraffic: new Map(),
        directionalClusterTraffic: new Map(),
        continentTraffic: new Map([['contA', {internal: 5, external: 2}], ['contB', {internal: 3, external: 2}]]),
        interContinentTraffic: new Map(),
        clusterSizes: {},
        continentInfo: new Map([['contA', {nodeCount: 2, clusterCount: 1, type: 'INTERNAL'}], ['contB', {nodeCount: 2, clusterCount: 1, type: 'INTERNAL'}]]),
        stats: { internalEdges: 0, externalEdges: 0, ghostNodes: 0, ghostEdges: 0, ghostRatio: 0 }
    };

    const legacyNodes = clone(nodes);
    const legacyClusters = clone(clusters);
    const legacyRes = applyLayoutLegacy(legacyNodes, legacyClusters, analysis);
    const legacyDiag = generateLayoutDiagnostics(legacyRes.sortedContinents, legacyRes.clusterNodes as any, legacyClusters);
    
    const newNodes = clone(nodes);
    const newClusters = clone(clusters);
    const newRes = applyLayout({ nodes: newNodes, clusters: newClusters, analysis });
    const newDiag = generateLayoutDiagnostics(newRes.sortedContinents as any, newRes.clusterNodes as any, newClusters);

    let nodeDiffs = 0;
    for (let i = 0; i < legacyNodes.length; i++) {
        if (legacyNodes[i].position?.x !== newNodes[i].position?.x || legacyNodes[i].position?.y !== newNodes[i].position?.y) {
            console.error(`❌ Node ${legacyNodes[i].id} mismatch: Legacy(${legacyNodes[i].position?.x}, ${legacyNodes[i].position?.y}) vs New(${newNodes[i].position?.x}, ${newNodes[i].position?.y})`);
            nodeDiffs++;
        }
    }

    let clusterDiffs = 0;
    for (let i = 0; i < legacyClusters.length; i++) {
        if (legacyClusters[i].position?.x !== newClusters[i].position?.x || legacyClusters[i].position?.y !== newClusters[i].position?.y) {
            console.error(`❌ Cluster ${legacyClusters[i].id} mismatch: Legacy(${legacyClusters[i].position?.x}, ${legacyClusters[i].position?.y}) vs New(${newClusters[i].position?.x}, ${newClusters[i].position?.y})`);
            clusterDiffs++;
        }
    }

    const legacyDiagLines = legacyDiag.trim().split('\n');
    const newDiagLines = newDiag.trim().split('\n');
    let diagDiffs = 0;
    for (let i = 0; i < Math.max(legacyDiagLines.length, newDiagLines.length); i++) {
        if (legacyDiagLines[i] !== newDiagLines[i]) {
            console.error(`❌ Diagnostic mismatch at line ${i+1}:\nLegacy: ${legacyDiagLines[i]}\nNew: ${newDiagLines[i]}`);
            diagDiffs++;
        }
    }

    console.log(`\nResults:`);
    console.log(`Node position diff:    ${nodeDiffs}`);
    console.log(`Cluster position diff: ${clusterDiffs}`);
    console.log(`Layout diagnostic diff: ${diagDiffs}`);
    
    if (nodeDiffs === 0 && clusterDiffs === 0 && diagDiffs === 0) {
        console.log(`\n✅ ALL PASS: Legacy and New implementations are perfectly identical.`);
    } else {
        console.log(`\n❌ FAILED: Implementations diverged.`);
        process.exit(1);
    }
}

main().catch(e => { console.error(e); process.exit(1); });
