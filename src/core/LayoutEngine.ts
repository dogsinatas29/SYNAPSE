import { Node, Cluster } from './GraphModel';
import { GraphAnalysis } from './GraphAnalyzer';

export const NODE_SPACING_X = 140; 
export const NODE_SPACING_Y = 80;  

export interface ClusterWithBBox extends Cluster {
    estWidth: number;
    estHeight: number;
    area: number;
    nodeCount: number;
    localX?: number;
    localY?: number;
}

export interface ContinentData {
    id: string;
    clusters: ClusterWithBBox[];
    nodeCount: number;
    edgeCount: number;
    hubTraffic: number;
    weight: number;
    estWidth: number;
    estHeight: number;
    centerX: number;
    centerY: number;
}

export interface LayoutInput {
    nodes: Node[];
    clusters: Cluster[];
    analysis: GraphAnalysis;
}

export interface BoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
}

export interface LayoutResult {
    continentMap: Map<string, ContinentData>;
    sortedContinents: readonly ContinentData[];
    clusterNodes: Map<string, readonly Node[]>;
    activeClusters: readonly Cluster[];
    clusterBounds: Map<string, BoundingBox>;
    worldBounds: BoundingBox;
    profile?: {
        continentPackingMs: number;
        forceLayoutMs: number;
        worldPackingMs: number;
        nodePlacementMs: number;
        boundsCalculationMs: number;
        totalMs: number;
    };
}

export function applyLayout(input: LayoutInput): LayoutResult {
    const tStart = process.hrtime.bigint();
    const { nodes, clusters, analysis } = input;
    
    const clusterNodes = new Map<string, Node[]>();
    for (const n of nodes) {
        const cid = n.cluster_id || '__unclustered__';
        if (!clusterNodes.has(cid)) clusterNodes.set(cid, []);
        clusterNodes.get(cid)!.push(n);
    }

    const activeClusterIds = new Set(clusterNodes.keys());
    const clusterMap = new Map(clusters.map(c => [c.id, c]));
    for (const cid of Array.from(activeClusterIds)) {
        let curr = clusterMap.get(cid);
        while (curr && curr.parent_id) {
            activeClusterIds.add(curr.parent_id);
            curr = clusterMap.get(curr.parent_id);
        }
    }

    const activeClusters = clusters.filter(c => activeClusterIds.has(c.id));

    if (activeClusterIds.has('__unclustered__') && !clusters.find(c => c.id === '__unclustered__')) {
        const rootCluster: Cluster = {
            id: '__unclustered__',
            label: '📁 Project Root',
            type: 'folder',
            collapsed: false,
            position: { x: 0, y: 0 },
            bounds: { x: 0, y: 0, width: 0, height: 0 },
            children: [],
            nodes: [],
            data: { continent: 'root', subcontinent: 'root' }
        };
        activeClusters.push(rootCluster);
        clusters.push(rootCluster);
    }

    // [v0.3.34] Fallback Seed Layout (10x10 Grid per Cluster)
    // - NO D3 Force Simulation
    // - NO Cluster Overlap Solvers
    // - Simple visual separation to prevent 100% stack on (0,0) if Frontend fails

    for (const [cid, cNodes] of clusterNodes) {
        if (cNodes.length === 0) continue;

        cNodes.sort((a, b) => a.id.localeCompare(b.id));

        const cols = Math.ceil(Math.sqrt(cNodes.length));
        
        for (let i = 0; i < cNodes.length; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            cNodes[i].position = {
                x: col * NODE_SPACING_X,
                y: row * NODE_SPACING_Y
            };
        }
    }

    const dtTotalMs = Number(process.hrtime.bigint() - tStart) / 1e6;

    return {
        continentMap: new Map(),
        sortedContinents: [],
        clusterNodes: new Map(Array.from(clusterNodes.entries()).map(([k, v]) => [k, v as readonly Node[]])),
        activeClusters: [...activeClusters],
        clusterBounds: new Map(),
        worldBounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 },
        profile: {
            continentPackingMs: 0,
            forceLayoutMs: 0,
            worldPackingMs: 0,
            nodePlacementMs: dtTotalMs,
            boundsCalculationMs: 0,
            totalMs: dtTotalMs
        }
    };
}
