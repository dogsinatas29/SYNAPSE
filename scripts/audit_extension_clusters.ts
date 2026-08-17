import * as fs from 'fs';
import * as path from 'path';

interface Edge {
    id: string;
    sourceId: string;
    targetId: string;
    type: string;
}

interface Node {
    id: string;
    cluster_id?: string;
    type: string;
}

interface GraphData {
    nodes: Node[];
    edges: Edge[];
}

function main() {
    const dataPath = path.resolve(__dirname, '../demo/data/project_state.json');
    if (!fs.existsSync(dataPath)) {
        console.error('project_state.json not found');
        return;
    }

    const data: GraphData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    // index nodes
    const nodesMap = new Map<string, Node>();
    data.nodes.forEach(n => nodesMap.set(n.id, n));

    // get implements/extends
    const extEdges = data.edges.filter(e => e.type === 'IMPLEMENTS' || e.type === 'EXTENDS');

    const counts = new Map<string, {
        implementors: Set<string>,
        clusters: Set<string>
    }>();

    for (const edge of extEdges as any) {
        const target = edge.to;
        const source = edge.from;
        const sourceNode = nodesMap.get(source);

        if (!counts.has(target)) {
            counts.set(target, { implementors: new Set(), clusters: new Set() });
        }

        const stats = counts.get(target)!;
        stats.implementors.add(source);
        if (sourceNode && sourceNode.cluster_id) {
            stats.clusters.add(sourceNode.cluster_id);
        }
    }

    // sort by implementor count desc
    const sorted = Array.from(counts.entries())
        .filter(([_, stats]) => stats.implementors.size >= 2)
        .sort((a, b) => b[1].implementors.size - a[1].implementors.size);

    console.log(`\n=== Extension Point Cluster Audit ===\n`);

    let i = 0;
    for (const [interfaceId, stats] of sorted) {
        if (i >= 10) break;
        console.log(`${interfaceId}`);
        console.log(`  Implementors: ${stats.implementors.size}`);
        console.log(`  Clusters: ${stats.clusters.size}`);
        console.log(`  Files:`);
        
        for (const impl of stats.implementors) {
            const node = nodesMap.get(impl);
            const cluster = node?.cluster_id || 'unknown';
            console.log(`    - ${impl} (Cluster: ${cluster})`);
        }
        console.log();
        i++;
    }
}

main();
