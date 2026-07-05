import * as assert from 'assert';
import { applyLayout, LayoutInput } from './src/core/LayoutEngine';
import { Node, Cluster } from './src/core/GraphModel';
import { GraphAnalysis } from './src/core/GraphAnalyzer';

function clone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

async function main() {
    console.log('=== Step 2g-3 Determinism Verification ===');

    const nodes: Node[] = [
        { id: 'node1', label: 'file1', type: 'file', cluster_id: 'c1', position: {x:0, y:0}, data: {}, edges: [] },
        { id: 'node2', label: 'file2', type: 'file', cluster_id: 'c1', position: {x:0, y:0}, data: {}, edges: [] },
        { id: 'node3', label: 'file3', type: 'file', cluster_id: 'c2', position: {x:0, y:0}, data: {}, edges: [] }
    ];

    const clusters: Cluster[] = [
        { id: 'c1', label: 'Cluster 1', type: 'folder', collapsed: false, position: {x:0, y:0}, bounds: {x:0,y:0,width:0,height:0}, children: [], nodes: [], data: {continent: 'cont1'} },
        { id: 'c2', label: 'Cluster 2', type: 'folder', collapsed: false, position: {x:0, y:0}, bounds: {x:0,y:0,width:0,height:0}, children: [], nodes: [], data: {continent: 'cont2'} }
    ];

    const analysis: GraphAnalysis = {
        degreeMap: new Map(),
        clusterTraffic: new Map(),
        interClusterTraffic: new Map([['c1 <-> c2', 5]]),
        ghostImpactTraffic: new Map(),
        directionalClusterTraffic: new Map(),
        continentTraffic: new Map([['cont1', {internal: 10, external: 5}], ['cont2', {internal: 5, external: 5}]]),
        interContinentTraffic: new Map(),
        clusterSizes: {},
        continentInfo: new Map([['cont1', {nodeCount: 2, clusterCount: 1, type: 'INTERNAL'}], ['cont2', {nodeCount: 1, clusterCount: 1, type: 'INTERNAL'}]]),
        stats: { internalEdges: 0, externalEdges: 0, ghostNodes: 0, ghostEdges: 0, ghostRatio: 0 }
    };

    const input1 = { nodes: clone(nodes), clusters: clone(clusters), analysis };
    const input2 = { nodes: clone(nodes), clusters: clone(clusters), analysis };

    const res1 = applyLayout(input1);
    const res2 = applyLayout(input2);

    let diffs = 0;
    for (let i = 0; i < input1.nodes.length; i++) {
        if (input1.nodes[i].position?.x !== input2.nodes[i].position?.x || input1.nodes[i].position?.y !== input2.nodes[i].position?.y) {
            console.error(`Node mismatch: ${input1.nodes[i].id}`); diffs++;
        }
    }
    for (let i = 0; i < input1.clusters.length; i++) {
        if (input1.clusters[i].position?.x !== input2.clusters[i].position?.x || input1.clusters[i].position?.y !== input2.clusters[i].position?.y) {
            console.error(`Cluster mismatch: ${input1.clusters[i].id}`); diffs++;
        }
    }

    if (diffs === 0) {
        console.log('✅ Determinism verification passed: 0 differences between consecutive runs.');
    } else {
        console.log(`❌ FAILED: ${diffs} differences found.`);
        process.exit(1);
    }
}

main().catch(e => { console.error(e); process.exit(1); });
