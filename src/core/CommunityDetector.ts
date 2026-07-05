import { Node, Edge, NodeType } from './GraphModel';

export interface CommunityDetectionResult {
    nodeCommunityMap: Map<string, string>;
    communityCount: number;
    communitySizes: Map<string, number>;
}

export function detectCommunities(
    nodes: readonly Node[],
    edges: readonly Edge[],
    maxIterations: number = 5
): CommunityDetectionResult {
    const lpaLabels = new Map<string, string>();
    const neighbors = new Map<string, string[]>();
    
    // Initialize labels & neighbors
    const validNodes = nodes.filter(n => n.type === NodeType.FILE || n.type === NodeType.SYMBOL);
    for (const n of validNodes) {
        lpaLabels.set(n.id, n.id);
        neighbors.set(n.id, []);
    }
    
    // Build undirected adjacency list for LPA
    for (const e of edges) {
        if (neighbors.has(e.from) && neighbors.has(e.to)) {
            neighbors.get(e.from)!.push(e.to);
            neighbors.get(e.to)!.push(e.from);
        }
    }
    
    // Run LPA
    for (let iter = 0; iter < maxIterations; iter++) {
        let changed = false;
        // Randomize node order
        const nodeIds = Array.from(lpaLabels.keys()).sort(() => Math.random() - 0.5);
        
        for (const id of nodeIds) {
            const currentLabel = lpaLabels.get(id)!;
            const neighborLabels = neighbors.get(id)!.map(nId => lpaLabels.get(nId)!);
            if (neighborLabels.length === 0) continue;
            
            // Find most frequent neighbor label
            const counts = new Map<string, number>();
            let maxCount = 0;
            let bestLabel = currentLabel;
            
            for (const nl of neighborLabels) {
                const count = (counts.get(nl) || 0) + 1;
                counts.set(nl, count);
                if (count > maxCount) {
                    maxCount = count;
                    bestLabel = nl;
                } else if (count === maxCount && Math.random() < 0.5) {
                    bestLabel = nl; // Break ties randomly
                }
            }
            
            if (bestLabel !== currentLabel) {
                lpaLabels.set(id, bestLabel);
                changed = true;
            }
        }
        if (!changed) break;
    }
    
    // Rebuild Clusters based on LPA (Downgraded)
    const communityMap = new Map<string, string[]>();
    for (const [nId, cLabel] of lpaLabels.entries()) {
        if (!communityMap.has(cLabel)) communityMap.set(cLabel, []);
        communityMap.get(cLabel)!.push(nId);
    }
    
    const nodeCommunityMap = new Map<string, string>();
    const communitySizes = new Map<string, number>();
    
    let commIdx = 1;
    for (const [cLabel, memberIds] of communityMap.entries()) {
        if (memberIds.length < 2) continue; // Skip single-node communities
        const commClusterId = `community_${commIdx++}`;
        
        communitySizes.set(commClusterId, memberIds.length);
        
        for (const mId of memberIds) {
            nodeCommunityMap.set(mId, commClusterId);
        }
    }
    
    return {
        nodeCommunityMap,
        communityCount: commIdx - 1,
        communitySizes
    };
}
