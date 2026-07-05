import { Node, Cluster } from './GraphModel';
import { GraphAnalysis } from './GraphAnalyzer';

export const NODE_SPACING_X = 80;
export const NODE_SPACING_Y = 50;

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

    // 1. Group nodes by cluster
    const clusterNodes = new Map<string, Node[]>();
    for (const n of nodes) {
        const cid = n.cluster_id || '__unclustered__';
        if (!clusterNodes.has(cid)) clusterNodes.set(cid, []);
        clusterNodes.get(cid)!.push(n);
    }

    const activeClusterIds = new Set(clusterNodes.keys());
    
    // Ensure all ancestors of active clusters are also active
    const clusterMap = new Map(clusters.map(c => [c.id, c]));
    for (const cid of Array.from(activeClusterIds)) {
        let curr = clusterMap.get(cid);
        while (curr && curr.parent_id) {
            activeClusterIds.add(curr.parent_id);
            curr = clusterMap.get(curr.parent_id);
        }
    }

    const activeClusters = clusters.filter(c => activeClusterIds.has(c.id));

    // Fix: Unclustered nodes are skipped by layout because '__unclustered__' is not in clusters list
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

    // 2. Prepare clusters and group by continent
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

    // 3. Continent Packing (Local Cluster Packing)
    const tContinentPackingStart = process.hrtime.bigint();
    for (const [cont, data] of continentMap.entries()) {
        const traffic = analysis.continentTraffic.get(cont) || { internal: 0, external: 0 };
        data.nodeCount = analysis.continentInfo.get(cont)?.nodeCount || 0;
        data.edgeCount = traffic.internal + traffic.external;
        data.hubTraffic = traffic.external;
        // Continent Weight Formula
        data.weight = data.nodeCount * 0.3 + data.edgeCount * 0.4 + data.hubTraffic * 0.3;

        // Sort clusters inside continent by Subcontinent, then Area
        data.clusters.sort((a, b) => {
            const subA = a.data?.subcontinent || '';
            const subB = b.data?.subcontinent || '';
            if (subA !== subB) return subA.localeCompare(subB);
            return b.area - a.area;
        });

        // Flow Bin Pack clusters locally to form the Continent BBox
        let currentX = 0;
        let currentY = 0;
        let rowMaxHeight = 0;
        let maxW = 0;
        
        const totalClusterArea = data.clusters.reduce((sum, c) => sum + c.area, 0);
        const dynamicClusterGap = Math.max(Math.sqrt(totalClusterArea) * 0.15, 200); // Dynamic gap between clusters
        const idealWidth = Math.max(Math.sqrt(totalClusterArea) * 1.5, 1000); // Make continent slightly wider than tall

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

        // Phase 2B.11: Cluster Force Layout (within each continent)
        const tForceStart = process.hrtime.bigint();
        const cNodes = data.clusters;
        const ITERATIONS = 150;
        const SPRING_K = 0.05; 
        const REPULSION_K = 100000; 

        for (let iter = 0; iter < ITERATIONS; iter++) {
            const forces = new Map<string, { fx: number, fy: number }>();
            for (const c of cNodes) forces.set(c.id, { fx: 0, fy: 0 });

            for (let i = 0; i < cNodes.length; i++) {
                for (let j = i + 1; j < cNodes.length; j++) {
                    const c1 = cNodes[i];
                    const c2 = cNodes[j];
                    const dx = c1.localX! - c2.localX!;
                    const dy = c1.localY! - c2.localY!;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < 1) dist = 1;
                    
                    const min_dist = (c1.estWidth + c2.estWidth) / 2 + 100;

                    if (dist < min_dist) {
                        const overlap = min_dist - dist;
                        const force = overlap * 1.5; 
                        const fx = (dx / dist) * force;
                        const fy = (dy / dist) * force;
                        forces.get(c1.id)!.fx += fx;
                        forces.get(c1.id)!.fy += fy;
                        forces.get(c2.id)!.fx -= fx;
                        forces.get(c2.id)!.fy -= fy;
                    } else {
                        const force = REPULSION_K / (dist * dist);
                        const fx = (dx / dist) * force;
                        const fy = (dy / dist) * force;
                        forces.get(c1.id)!.fx += fx;
                        forces.get(c1.id)!.fy += fy;
                        forces.get(c2.id)!.fx -= fx;
                        forces.get(c2.id)!.fy -= fy;
                    }
                }
            }

            for (let i = 0; i < cNodes.length; i++) {
                for (let j = i + 1; j < cNodes.length; j++) {
                    const c1 = cNodes[i];
                    const c2 = cNodes[j];
                    const keys = [c1.id, c2.id].sort();
                    const key = `${keys[0]} <-> ${keys[1]}`;
                    const traffic = analysis.interClusterTraffic.get(key) || 0;
                    
                    if (traffic > 0) {
                        const dx = c2.localX! - c1.localX!;
                        const dy = c2.localY! - c1.localY!;
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        if (dist < 1) dist = 1;
                        
                        const force = Math.log(traffic + 1) * SPRING_K * dist; 
                        const fx = (dx / dist) * force;
                        const fy = (dy / dist) * force;
                        
                        forces.get(c1.id)!.fx += fx;
                        forces.get(c1.id)!.fy += fy;
                        forces.get(c2.id)!.fx -= fx;
                        forces.get(c2.id)!.fy -= fy;
                    }
                }
            }

            for (const c of cNodes) {
                const f = forces.get(c.id)!;
                const maxV = 100;
                f.fx = Math.max(-maxV, Math.min(maxV, f.fx));
                f.fy = Math.max(-maxV, Math.min(maxV, f.fy));
                c.localX! += f.fx;
                c.localY! += f.fy;
            }
        }

        // Re-center after force layout
        if (cNodes.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const c of cNodes) {
                minX = Math.min(minX, c.localX! - c.estWidth / 2);
                minY = Math.min(minY, c.localY! - c.estHeight / 2);
                maxX = Math.max(maxX, c.localX! + c.estWidth / 2);
                maxY = Math.max(maxY, c.localY! + c.estHeight / 2);
            }
            for (const c of cNodes) {
                c.localX! -= minX;
                c.localY! -= minY;
            }
            data.estWidth = (maxX - minX) + dynamicContinentGap;
            data.estHeight = (maxY - minY) + dynamicContinentGap;
        }
        
        if (!(data as any).forceLayoutMs) (data as any).forceLayoutMs = 0;
        (data as any).forceLayoutMs += Number(process.hrtime.bigint() - tForceStart) / 1e6;
    }

    let continentPackingMs = Number(process.hrtime.bigint() - tContinentPackingStart) / 1e6;
    const forceLayoutMs = Array.from(continentMap.values()).reduce((sum, d) => sum + (d as any).forceLayoutMs, 0);
    continentPackingMs -= forceLayoutMs; // Deduct Force Layout time from Continent Packing time

    // 4. World Packing (Global Continent Packing)
    const tWorldStart = process.hrtime.bigint();
    const sortedContinentsArr = Array.from(continentMap.values()).sort((a, b) => b.weight - a.weight);
    
    let worldX = 0;
    let worldY = 0;
    let worldRowMaxHeight = 0;
    const MAX_WORLD_WIDTH = 12000;

    for (const cont of sortedContinentsArr) {
        if (worldX + cont.estWidth > MAX_WORLD_WIDTH && worldX > 0) {
            worldX = 0;
            worldY += worldRowMaxHeight;
            worldRowMaxHeight = 0;
        }
        
        cont.centerX = worldX + cont.estWidth / 2;
        cont.centerY = worldY + cont.estHeight / 2;

        // Map cluster absolute positions
        for (const c of cont.clusters) {
            c.position = {
                x: worldX + c.localX!,
                y: worldY + c.localY!
            };
            const originalC = clusters.find(orig => orig.id === c.id);
            if (originalC) {
                originalC.position = { ...c.position };
            }
        }

        worldX += cont.estWidth;
        worldRowMaxHeight = Math.max(worldRowMaxHeight, cont.estHeight);
    }
    const worldPackingMs = Number(process.hrtime.bigint() - tWorldStart) / 1e6;

    // 5. Place Nodes inside Clusters
    const tNodeStart = process.hrtime.bigint();
    for (const cont of sortedContinentsArr) {
        for (const c of cont.clusters) {
            const cNodes = clusterNodes.get(c.id) || [];
            const cols = Math.ceil(Math.sqrt(cNodes.length));
            const rows = Math.ceil(cNodes.length / cols);
            
            const cx = c.position!.x;
            const cy = c.position!.y;
            
            for (let i = 0; i < cNodes.length; i++) {
                const n = cNodes[i];
                const col = i % cols;
                const row = Math.floor(i / cols);
                
                if (n.position) {
                    n.position.x = cx + (col - (cols - 1) / 2) * NODE_SPACING_X;
                    n.position.y = cy + (row - (rows - 1) / 2) * NODE_SPACING_Y;
                }
            }
        }
    }
    const nodePlacementMs = Number(process.hrtime.bigint() - tNodeStart) / 1e6;

    // 6. Calculate Cluster Bounds and World Bounds
    const tBoundsStart = process.hrtime.bigint();
    const clusterBounds = new Map<string, BoundingBox>();
    let worldMinX = Infinity, worldMinY = Infinity, worldMaxX = -Infinity, worldMaxY = -Infinity;

    for (const c of activeClusters) {
        const cNodes = clusterNodes.get(c.id) || [];
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        for (const n of cNodes) {
            if (n.position) {
                minX = Math.min(minX, n.position.x);
                minY = Math.min(minY, n.position.y);
                maxX = Math.max(maxX, n.position.x);
                maxY = Math.max(maxY, n.position.y);

                // Update world bounds
                worldMinX = Math.min(worldMinX, n.position.x);
                worldMinY = Math.min(worldMinY, n.position.y);
                worldMaxX = Math.max(worldMaxX, n.position.x);
                worldMaxY = Math.max(worldMaxY, n.position.y);
            }
        }

        // Actual BBox (with 200px padding for rendering parity with Legacy)
        const width = maxX === -Infinity ? 200 : (maxX - minX) + 200;
        const height = maxY === -Infinity ? 200 : (maxY - minY) + 200;
        const centerX = minX === -Infinity ? c.position!.x : minX + (maxX - minX) / 2;
        const centerY = minY === -Infinity ? c.position!.y : minY + (maxY - minY) / 2;

        clusterBounds.set(c.id, {
            minX: minX === -Infinity ? c.position!.x : minX,
            minY: minY === -Infinity ? c.position!.y : minY,
            maxX: maxX === -Infinity ? c.position!.x : maxX,
            maxY: maxY === -Infinity ? c.position!.y : maxY,
            width,
            height,
            centerX,
            centerY
        });
    }

    const worldBounds: BoundingBox = {
        minX: worldMinX,
        minY: worldMinY,
        maxX: worldMaxX,
        maxY: worldMaxY,
        width: worldMaxX === -Infinity ? 0 : Math.abs(worldMaxX - worldMinX),
        height: worldMaxY === -Infinity ? 0 : Math.abs(worldMaxY - worldMinY),
        centerX: worldMinX === -Infinity ? 0 : worldMinX + (worldMaxX - worldMinX) / 2,
        centerY: worldMinY === -Infinity ? 0 : worldMinY + (worldMaxY - worldMinY) / 2
    };

    const boundsCalculationMs = Number(process.hrtime.bigint() - tBoundsStart) / 1e6;
    const totalMs = Number(process.hrtime.bigint() - tStart) / 1e6;

    return {
        continentMap,
        sortedContinents: sortedContinentsArr,
        clusterNodes: new Map(Array.from(clusterNodes.entries()).map(([k, v]) => [k, v as readonly Node[]])),
        activeClusters: [...activeClusters],
        clusterBounds,
        worldBounds,
        profile: {
            continentPackingMs,
            forceLayoutMs,
            worldPackingMs,
            nodePlacementMs,
            boundsCalculationMs,
            totalMs
        }
    };
}
