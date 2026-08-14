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

    console.log('[LAYOUT_INVOCATION]', Date.now(), 'activeClusters=', clusters.length, 'clusterNodes=', nodes.length);

    console.log('[LAYOUT_CLUSTER_TYPES]', clusters.map(c => ({
        id: c.id,
        type: c.type,
        nodeCount: c.nodeCount ?? c.nodes?.length ?? 0
    })));
    
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

    // [v0.3.34] Minimal cluster bounds calculation (was missing)
    const clusterBounds = new Map<string, BoundingBox>();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const [cid, cNodes] of clusterNodes) {
        if (cNodes.length === 0) continue;

        let cMinX = Infinity, cMinY = Infinity, cMaxX = -Infinity, cMaxY = -Infinity;
        for (const n of cNodes) {
            const p = n.position || { x: 0, y: 0 };
            if (p.x < cMinX) cMinX = p.x;
            if (p.y < cMinY) cMinY = p.y;
            if (p.x > cMaxX) cMaxX = p.x;
            if (p.y > cMaxY) cMaxY = p.y;
        }

        const width = Math.max(140, cMaxX - cMinX + 120);
        const height = Math.max(80, cMaxY - cMinY + 80);
        const bbox: BoundingBox = {
            minX: cMinX, minY: cMinY, maxX: cMaxX, maxY: cMaxY,
            width, height,
            centerX: (cMinX + cMaxX) / 2,
            centerY: (cMinY + cMaxY) / 2
        };
        clusterBounds.set(cid, bbox);

        if (cMinX < minX) minX = cMinX;
        if (cMinY < minY) minY = cMinY;
        if (cMaxX > maxX) maxX = cMaxX;
        if (cMaxY > maxY) maxY = cMaxY;

        // also write back to the Cluster object if present
        const clusterObj = activeClusters.find(c => c.id === cid);
        if (clusterObj) {
            clusterObj.bounds = { x: cMinX, y: cMinY, width, height };
            if (!clusterObj.position) clusterObj.position = { x: bbox.centerX, y: bbox.centerY };
        }
    }

    const worldBounds: BoundingBox = {
        minX: minX === Infinity ? 0 : minX,
        minY: minY === Infinity ? 0 : minY,
        maxX: maxX === -Infinity ? 0 : maxX,
        maxY: maxY === -Infinity ? 0 : maxY,
        width: maxX === -Infinity ? 0 : maxX - minX + 200,
        height: maxY === -Infinity ? 0 : maxY - minY + 160,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2
    };

    // Critical diagnostic: compare the two sources of truth at return time
    console.log('[CLUSTER_BOUNDS_MAP]', Array.from(clusterBounds.entries()));
    console.log('[ACTIVE_CLUSTER_BOUNDS]', activeClusters.map(c => ({
        id: c.id,
        bounds: c.bounds
    })));

    console.log('[LAYOUT_RESULT_HASH]', {
        clusters: activeClusters.length,
        worldWidth: worldBounds.width,
        worldHeight: worldBounds.height,
        nonZeroBounds: activeClusters.filter(
            c => c.bounds && (c.bounds.width > 0 || c.bounds.height > 0)
        ).length
    });

    const dtTotalMs = Number(process.hrtime.bigint() - tStart) / 1e6;

    return {
        continentMap: new Map(),
        sortedContinents: [],
        clusterNodes: new Map(Array.from(clusterNodes.entries()).map(([k, v]) => [k, v as readonly Node[]])),
        activeClusters: [...activeClusters],
        clusterBounds,
        worldBounds,
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
