import { Node, Cluster } from './GraphModel';
import { GraphAnalysis } from './GraphAnalyzer';

// [v0.3.33.2] Tightened spacing based on user feedback
export const NODE_SPACING_X = 140; // Reduced from 200
export const NODE_SPACING_Y = 80;  // Reduced from 120

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
    console.error('LAYOUT_ENGINE_ALIVE', '2026-07-14-TEST');

    const tStart = process.hrtime.bigint();
    const { nodes, clusters, analysis } = input;
    console.log('[LAYOUT_ENTER] applyLayout called', {nodeCount: nodes.length, clusterCount: clusters.length});

    // 1. Group nodes by cluster
    const clusterNodes = new Map<string, Node[]>();
    for (const n of nodes) {
        const cid = n.cluster_id || '__unclustered__';
        if (!clusterNodes.has(cid)) clusterNodes.set(cid, []);
        clusterNodes.get(cid)!.push(n);
    }

    // [v0.3.33] Cluster forensics: node-to-cluster mapping health
    {
        console.log('[CLUSTER_NODE_MAP]',
            `nodes=${nodes.length}`,
            `clusterKeys=${clusterNodes.size}`,
            `unclustered=${clusterNodes.get('__unclustered__')?.length || 0}`);
        let assigned = 0;
        for (const [, cNodes] of clusterNodes) {
            assigned += cNodes.length;
        }
        console.log('[CLUSTER_NODE_TOTAL]', `assigned=${assigned}`);
        const top = Array.from(clusterNodes.entries())
            .filter(([id]) => id !== '__unclustered__')
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 50);
        for (const [cid, cNodes] of top) {
            console.log('[CLUSTER_ASSIGNMENT]', cid, cNodes.length);
        }
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

    // [v0.3.33] Cluster Forensics: empty leaf detection in layout pipeline
    {
        const childMap = new Map<string, string[]>();
        for (const c of clusters) {
            if (c.parent_id) {
                if (!childMap.has(c.parent_id)) childMap.set(c.parent_id, []);
                childMap.get(c.parent_id)!.push(c.id);
            }
        }
        const emptyLeaf = activeClusters.filter(c => {
            const hasNodes = clusterNodes.has(c.id) && clusterNodes.get(c.id)!.length > 0;
            const hasChildren = childMap.has(c.id) && childMap.get(c.id)!.length > 0;
            return !hasNodes && !hasChildren;
        });
        console.log('[LAYOUT_CLUSTER_COUNT]',
            `totalIn=${clusters.length}`,
            `active=${activeClusters.length}`,
            `emptyLeaf=${emptyLeaf.length}`);
        emptyLeaf.slice(0, 20).forEach((c: any) =>
            console.log('[EMPTY_LEAF]', `id="${c.id}"`, `label="${c.label || c.id}"`));
    }

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
    // [v0.3.33] Cluster forensics: active cluster space estimation
    {
        console.log('[ACTIVE_CLUSTER_SUMMARY]', `active=${activeClusters.length}`);
        let totalSpace = 0;
        const spaceDetails: { id: string; nodes: number; space: number }[] = [];
        for (const c of activeClusters) {
            const count = clusterNodes.get(c.id)?.length || 1;
            const estimated = Math.max(1200, Math.sqrt(count) * 2500);
            totalSpace += estimated;
            spaceDetails.push({ id: c.id, nodes: count, space: Math.round(estimated) });
        }
        console.log('[ACTIVE_CLUSTER_SPACE]', `total=${Math.round(totalSpace)}`);
        spaceDetails.sort((a, b) => b.space - a.space).slice(0, 30).forEach(d =>
            console.log('[ACTIVE_CLUSTER]', d.id, `nodes=${d.nodes}`, `space=${d.space}`));
    }

    // Build childMap for ancestor detection
    const _childMap = new Map<string, string[]>();
    for (const c of clusters) {
        if (c.parent_id) {
            if (!_childMap.has(c.parent_id)) _childMap.set(c.parent_id, []);
            _childMap.get(c.parent_id)!.push(c.id);
        }
    }

    // [v0.3.33] Cluster forensics: space breakdown by ancestor vs leaf
    {
        let ancestorCount = 0, ancestorSpace = 0, leafCount = 0, leafSpace = 0;
        for (const c of activeClusters) {
            const nodeCount = clusterNodes.get(c.id)?.length || 0;
            const hasChildren = _childMap.has(c.id);
            const estimated = Math.max(1200, Math.sqrt(Math.max(nodeCount, 1)) * 2500);
            if (hasChildren) {
                ancestorCount++;
                ancestorSpace += estimated;
            } else {
                leafCount++;
                leafSpace += estimated;
            }
        }
        console.log('[SPACE_BREAKDOWN]',
            `ancestor=${ancestorCount}`, `ancestorSpace=${Math.round(ancestorSpace)}`,
            `leaf=${leafCount}`, `leafSpace=${Math.round(leafSpace)}`);
    }

    // [v0.3.34] User Requested Debug Log: EMPTY_LAYOUT_SAMPLE
    const empties = activeClusters.filter(c => {
        const count = clusterNodes.get(c.id)?.length || 0;
        return count === 0;
    });
    console.log('[EMPTY_LAYOUT_SAMPLE]', {
        count: empties.length,
        sample: empties.slice(0, 20).map(c => ({
            id: c.id,
            nodeCount: clusterNodes.get(c.id)?.length || 0,
            childCount: _childMap.get(c.id)?.length || 0,
            parentId: c.parent_id
        }))
    });

    const continentMap = new Map<string, ContinentData>();
    for (const c of activeClusters) {
        const count = clusterNodes.get(c.id)?.length || 0;
        const cols = Math.ceil(Math.sqrt(Math.max(count, 1)));
        const rows = Math.ceil(Math.max(count, 1) / cols);

        // [v0.3.34] Layout Fix: DO NOT pack empty clusters (ancestors or empty leaves)
        if (count === 0) {
            continue;
        }

        const gridWidth = cols * NODE_SPACING_X + 100;
        const labelWidth = c.label ? c.label.length * 15 + 100 : 150;
        const estWidth = Math.max(gridWidth, labelWidth);
        const estHeight = Math.max(rows * NODE_SPACING_Y + 100, 100);

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

    // [v0.3.33] Verify unknown continent cluster/node ratio
    const unknownCont = continentMap.get('unknown');
    if (unknownCont) {
        const unknownClusterNodes = unknownCont.clusters.slice(0, 30).map(c => {
            const actualNodes = clusterNodes.get(c.id)?.length ?? 0;
            return { id: (c.id ?? '').substring(0, 50), actualNodes };
        });
        const totalActualNodes = unknownCont.clusters.reduce((sum, c) => sum + (clusterNodes.get(c.id)?.length ?? 0), 0);
        const hasNodes = unknownCont.clusters.filter(c => (clusterNodes.get(c.id)?.length ?? 0) > 0).length;
        const zeroNodes = unknownCont.clusters.filter(c => (clusterNodes.get(c.id)?.length ?? 0) === 0).length;
        console.log(`[UNKNOWN_VERIFY] totalClusters=${unknownCont.clusters.length} clusterNodesWithContent=${hasNodes} clusterNodesEmpty=${zeroNodes} sumActualNodes=${totalActualNodes}`);
        console.log(`[UNKNOWN_VERIFY_SAMPLE] ${JSON.stringify(unknownClusterNodes)}`);
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

        const totalClusterArea = data.clusters.reduce((sum, c) => sum + c.area, 0);
        console.log(`[PACK_ENTER] cont="${cont}" clusters=${data.clusters.length} nodes=${data.nodeCount} totalClusterArea=${totalClusterArea} sqrtArea=${Math.round(Math.sqrt(totalClusterArea))} clusterGap=${Math.round(Math.max(Math.sqrt(totalClusterArea)*0.15,200))} idealWidth=${Math.round(Math.max(Math.sqrt(totalClusterArea)*1.5,1000))}`);

        if (cont === 'unknown' || cont === 'Unknown') {
            const hist = new Map<string, number>();
            for (const c of data.clusters) {
                const key = `${c.data?.continent ?? '?'}/${c.data?.subcontinent ?? '?'}`;
                hist.set(key, (hist.get(key) || 0) + 1);
            }
            const top = [...hist.entries()].sort((a,b) => b[1] - a[1]).slice(0, 15);
            const sample = data.clusters.slice(0, 15).map(c => ({
                id: (c.id ?? '').substring(0, 50),
                parent: c.parent_id?.substring(0, 30) ?? '',
                cont: c.data?.continent,
                sub: c.data?.subcontinent
            }));
            console.log(`[UNKNOWN_HISTOGRAM] cont="${cont}" total=${data.clusters.length} top15=${JSON.stringify(top)}`);
            console.log(`[UNKNOWN_SAMPLE] ${JSON.stringify(sample)}`);
        }

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
        let rowCount = 1;
        let maxClusterW = 0;
        let sumClusterW = 0;
        let sumClusterH = 0;
        let maxClusterEstWidth = 0;
        for (const c of data.clusters) {
            maxClusterEstWidth = Math.max(maxClusterEstWidth, c.estWidth);
        }
        
        const estAvgW = Math.sqrt(totalClusterArea / data.clusters.length);
        const dynamicClusterGap = Math.max(Math.min(estAvgW * 0.3, 150), 60); // Tighter cluster gaps
        const idealWidth = Math.max(Math.sqrt(totalClusterArea) * 1.5, maxClusterEstWidth * 1.2, 1500);

        console.log(`[WORLD_PACK]\ncontinent=${cont}\nclusterCount=${data.clusters.length}\nmaxClusterWidth=${maxClusterEstWidth}\nidealWidth=${idealWidth}`);

        for (const c of data.clusters) {
            if (currentX + c.estWidth > idealWidth && currentX > 0) {
                currentX = 0;
                currentY += rowMaxHeight + dynamicClusterGap;
                rowMaxHeight = 0;
                rowCount++;
            }
            c.localX = currentX + c.estWidth / 2;
            c.localY = currentY + c.estHeight / 2;
            console.log(`[LAYOUT_TRACE] PLACE ${c.id} row=${rowCount} x=${Math.round(c.localX)} y=${Math.round(c.localY)} height=${Math.round(c.estHeight)}`);
            
            currentX += c.estWidth + dynamicClusterGap;
            rowMaxHeight = Math.max(rowMaxHeight, c.estHeight);
            maxW = Math.max(maxW, currentX - dynamicClusterGap);
            maxClusterW = Math.max(maxClusterW, c.estWidth);
            sumClusterW += c.estWidth;
            sumClusterH += c.estHeight;
        }
        
        const dynamicContinentGap = Math.max(Math.sqrt(totalClusterArea) * 0.3, 200); // Tighter continent gaps
        data.estWidth = maxW + dynamicContinentGap;
        data.estHeight = currentY + rowMaxHeight + dynamicContinentGap;
        console.log(`[PACK_BIN] cont="${cont}" currentY=${Math.round(currentY)} rowMaxH=${Math.round(rowMaxHeight)} clusterGap=${Math.round(dynamicClusterGap)} continentGap=${Math.round(dynamicContinentGap)} idealW=${Math.round(idealWidth)} estH1=${Math.round(data.estHeight)}`);
        const fillRatio = maxW / idealWidth;
        const avgClusterH = sumClusterH / data.clusters.length;
        console.log(`[PACK_BIN_STATS] cont="${cont}" clusters=${data.clusters.length} rows=${rowCount} avgPerRow=${(data.clusters.length/rowCount).toFixed(1)} maxClusterW=${Math.round(maxClusterW)} avgClusterW=${Math.round(sumClusterW/data.clusters.length)} avgClusterH=${Math.round(avgClusterH)} maxW=${Math.round(maxW)} idealW=${Math.round(idealWidth)} fillRatio=${(fillRatio*100).toFixed(1)}%`);
        console.log(`[PACK_GAP] cont="${cont}" gap=${Math.round(dynamicClusterGap)} avgW=${Math.round(sumClusterW/data.clusters.length)} avgH=${Math.round(avgClusterH)} gap/avgW=${(dynamicClusterGap/(sumClusterW/data.clusters.length)).toFixed(1)}x gap/avgH=${(dynamicClusterGap/avgClusterH).toFixed(1)}x`);

        // Cluster depth distribution for large continents
        if (data.clusters.length > 50) {
            const clusterMapForDepth = new Map(data.clusters.map(c => [c.id, c]));
            const depths: number[] = [];
            for (const c of data.clusters) {
                let d = 0, cur: string | undefined = c.id;
                while (cur && clusterMapForDepth.has(cur)) {
                    cur = clusterMapForDepth.get(cur)!.parent_id;
                    d++;
                }
                depths.push(d);
            }
            const depthHist = new Map<number, number>();
            for (const d of depths) depthHist.set(d, (depthHist.get(d) || 0) + 1);
            const sorted = [...depthHist.entries()].sort((a,b) => a[0]-b[0]);
            console.log(`[CLUSTER_DEPTH] cont="${cont}" total=${data.clusters.length} depthDist=${JSON.stringify(sorted)}`);
        }

        // Phase 2B.11: Cluster Force Layout (within each continent)
        const tForceStart = process.hrtime.bigint();
        const cNodes = data.clusters;
        
        // [v0.3.34] Dynamic iteration cap to prevent O(C^2) Extension Host freeze
        // For C > 1000, C^2 * 150 = 150M operations, taking > 5000ms and blocking the event loop.
        const C = cNodes.length;
        let ITERATIONS = 150;
        if (C > 50) {
            // Target max 500,000 iterations total to stay under 50ms
            ITERATIONS = Math.max(0, Math.floor(500000 / (C * C)));
        }
        
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
            console.log(`[PACK_FORCE] cont="${cont}" minY=${Math.round(minY)} maxY=${Math.round(maxY)} span=${Math.round(maxY-minY)} gap=${Math.round(dynamicContinentGap)} ITER=${ITERATIONS} estH2=${Math.round(data.estHeight)}`);
        }
        
        if (!(data as any).forceLayoutMs) (data as any).forceLayoutMs = 0;
        (data as any).forceLayoutMs += Number(process.hrtime.bigint() - tForceStart) / 1e6;

        // [USER PROBE] CONTINENT_STATS
        console.log('[CONTINENT_STATS]', {
            continent: cont,
            clusterCount: data.clusters.length,
            nodeCount: data.nodeCount,
            width: data.estWidth,
            height: data.estHeight
        });
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

    let totalWorldArea = 0;
    for (const cont of sortedContinentsArr) {
        totalWorldArea += cont.estWidth * cont.estHeight;
    }
    // [v0.3.33.7] Fix "Jack and the Beanstalk" vertical layout bug.
    // Instead of a hardcoded 12000, use a dynamic width to form a 16:9-ish layout.
    let maxContWidth = 0;
    for (const cont of sortedContinentsArr) {
        maxContWidth = Math.max(maxContWidth, cont.estWidth);
    }
    const MAX_WORLD_WIDTH = Math.max(20000, Math.sqrt(totalWorldArea) * 1.8, maxContWidth * 1.2);

    for (const cont of sortedContinentsArr) {
        if (worldX + cont.estWidth > MAX_WORLD_WIDTH && worldX > 0) {
            worldX = 0;
            worldY += worldRowMaxHeight;
            worldRowMaxHeight = 0;
        }

        console.log(`[WORLD_PACK] cont="${cont.id}" idx=${sortedContinentsArr.indexOf(cont)} worldX=${Math.round(worldX)} worldY=${Math.round(worldY)} estW=${Math.round(cont.estWidth)} estH=${Math.round(cont.estHeight)} rowMaxH=${Math.round(worldRowMaxHeight)} nodes=${cont.nodeCount}`);
        
        // [USER PROBE] CONTINENT_PLACEMENT
        console.log('[CONTINENT_PLACEMENT]', {
            continent: cont.id,
            x: worldX,
            y: worldY,
            width: cont.estWidth,
            height: cont.estHeight,
            rowMaxHeight: worldRowMaxHeight
        });

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
    console.log(`[WORLD_PACK_FINAL] maxY=${Math.round(worldY)} totalContinents=${sortedContinentsArr.length}`);
    const top10 = sortedContinentsArr.slice().sort((a,b)=>b.estHeight-a.estHeight).slice(0,10).map(c=>({id: c.id, h: Math.round(c.estHeight), w: Math.round(c.estWidth), nodes: c.nodeCount}));
    console.log(`[WORLD_PACK_TOP] ${JSON.stringify(top10)}`);

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
                
                if (!n.position) {
                    n.position = { x: 0, y: 0 };
                }
                n.position.x = cx + (col - (cols - 1) / 2) * NODE_SPACING_X;
                n.position.y = cy + (row - (rows - 1) / 2) * NODE_SPACING_Y;
            }
        }
    }
    const nodePlacementMs = Number(process.hrtime.bigint() - tNodeStart) / 1e6;

    // 6. Calculate Cluster Bounds and World Bounds
    const tBoundsStart = process.hrtime.bigint();
    console.time('bounds');
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

        if (cNodes.length > 0) {
            // Actual BBox for leaf clusters with nodes
            const width = maxX === -Infinity ? 150 : (maxX - minX) + 150;
            const height = maxY === -Infinity ? 150 : (maxY - minY) + 150;
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
    }

    // [USER PROBE] TOP_20_LARGEST_CLUSTERS
    console.log('[TOP_20_LARGEST_CLUSTERS]',
       activeClusters
          .map(c => ({ id: c.id, nodeCount: clusterNodes.get(c.id)?.length || 0, bounds: clusterBounds.get(c.id) }))
          .sort((a,b) => b.nodeCount - a.nodeCount)
          .slice(0, 20)
    );

    // [USER PROBE] WORLD_BOUNDS
    console.log('[WORLD_BOUNDS]', {
        minX: worldMinX,
        maxX: worldMaxX,
        minY: worldMinY,
        maxY: worldMaxY,
        width: worldMaxX - worldMinX,
        height: worldMaxY - worldMinY
    });

    // Post-pass: recursively compute bounds and positions for empty ancestor clusters
    let changed = true;
    let passes = 0;
    while (changed && passes < 100) {
        changed = false;
        passes++;
        for (const c of activeClusters) {
            const count = clusterNodes.get(c.id)?.length || 0;
            const hasCh = _childMap.has(c.id);
            if (count === 0 && hasCh) {
                const childrenIds = _childMap.get(c.id) || [];
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                for (const childId of childrenIds) {
                    const cb = clusterBounds.get(childId);
                    if (cb) {
                        minX = Math.min(minX, cb.minX);
                        minY = Math.min(minY, cb.minY);
                        maxX = Math.max(maxX, cb.maxX);
                        maxY = Math.max(maxY, cb.maxY);
                    }
                }
                
                if (minX !== Infinity) {
                    // Give ancestor a 60px padding around children
                    minX -= 60;
                    minY -= 60;
                    maxX += 60;
                    maxY += 60;
                    
                    const width = maxX - minX;
                    const height = maxY - minY;
                    const centerX = minX + width / 2;
                    const centerY = minY + height / 2;
                    
                    const oldCb = clusterBounds.get(c.id);
                    if (!oldCb || oldCb.minX !== minX || oldCb.minY !== minY || oldCb.maxX !== maxX || oldCb.maxY !== maxY) {
                        clusterBounds.set(c.id, {
                            minX, minY, maxX, maxY, width, height, centerX, centerY
                        });
                        c.position = { x: centerX, y: centerY };
                        changed = true;
                    }
                }
            }
        }
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

    console.log(`[WORLD_PACK_FINAL]\nworldWidth=${Math.round(worldBounds.width)}\nworldHeight=${Math.round(worldBounds.height)}`);
    console.timeEnd('bounds');
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
