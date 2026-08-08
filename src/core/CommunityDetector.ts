import { Node, Edge, NodeType } from './GraphModel';

export interface CommunityDetectionResult {
    nodeCommunityMap: Map<string, string>;
    communityCount: number;
    communitySizes: Map<string, number>;
}

export function detectCommunities(
    nodes: readonly Node[],
    edges: readonly Edge[]
): CommunityDetectionResult {
    const validNodes = nodes.filter(n => n.type === NodeType.FILE || n.type === NodeType.SYMBOL);
    const validNodeIds = new Set(validNodes.map(n => n.id));
    
    // Initial tracing: node -> its current internal representation (which starts as the node itself)
    let nodeToCurrent = new Map<string, string>();
    let currentNodes: string[] = [];
    for (const id of validNodeIds) {
        nodeToCurrent.set(id, id);
        currentNodes.push(id);
    }
    
    // Adjacency map: adj[from][to] = weight
    let adj = new Map<string, Map<string, number>>();
    let m2 = 0; // 2 * total edge weight
    
    for (const n of currentNodes) {
        adj.set(n, new Map());
    }
    
    for (const e of edges) {
        if (!validNodeIds.has(e.from) || !validNodeIds.has(e.to)) continue;
        const w = e.weight || 1.0;
        
        const mapFrom = adj.get(e.from)!;
        mapFrom.set(e.to, (mapFrom.get(e.to) || 0) + w);
        
        if (e.from !== e.to) {
            const mapTo = adj.get(e.to)!;
            mapTo.set(e.from, (mapTo.get(e.from) || 0) + w);
        }
        
        m2 += (e.from === e.to ? w : 2 * w);
    }
    
    if (m2 === 0) {
        const map = new Map<string, string>();
        const sizes = new Map<string, number>();
        let idx = 1;
        for (const n of validNodeIds) {
            const c = `community_${idx++}`;
            map.set(n, c);
            sizes.set(c, 1);
        }
        return { nodeCommunityMap: map, communityCount: validNodeIds.size, communitySizes: sizes };
    }

    let nodeToComm = new Map<string, string>();
    for (const n of currentNodes) {
        nodeToComm.set(n, n);
    }
    
    const resolution = 1.0;
    let pass = 0;
    let improvement = true;
    
    while (improvement && pass < 10) {
        pass++;
        improvement = false;
        console.log(`  -> [Louvain] Pass ${pass} started...`);
        
        // Phase 1: Local optimization
        let localImprovement = true;
        let iter = 0;
        while (localImprovement && iter < 10) {
            localImprovement = false;
            iter++;
            console.log(`    -> Local Iteration ${iter}...`);
            
            const sumTot = new Map<string, number>();
            const k = new Map<string, number>();
            
            for (const n of currentNodes) {
                let degree = 0;
                for (const w of adj.get(n)!.values()) degree += w;
                k.set(n, degree);
                
                const comm = nodeToComm.get(n)!;
                sumTot.set(comm, (sumTot.get(comm) || 0) + degree);
            }
            
            const shuffledNodes = [...currentNodes];
            
            // [v0.3.34.13 Fix] Deterministic PRNG to avoid Canvas flapping
            let seed = 123456789 + pass * 1000 + iter;
            const random = () => {
                seed = (1103515245 * seed + 12345) % 2147483648;
                return seed / 2147483648;
            };

            for (let i = shuffledNodes.length - 1; i > 0; i--) {
                const j = Math.floor(random() * (i + 1));
                [shuffledNodes[i], shuffledNodes[j]] = [shuffledNodes[j], shuffledNodes[i]];
            }
            
            const nbrCommsArr: string[] = [];
            const ki_in_c = new Map<string, number>();
            
            for (const n of shuffledNodes) {
                const currentComm = nodeToComm.get(n)!;
                const nodeDegree = k.get(n)!;
                
                let ki_in = 0;
                for (const [nbr, w] of adj.get(n)!.entries()) {
                    if (nodeToComm.get(nbr) === currentComm) {
                        ki_in += w;
                    }
                }
                
                sumTot.set(currentComm, sumTot.get(currentComm)! - nodeDegree);
                nodeToComm.delete(n);
                
                let bestComm = currentComm;
                let maxDeltaQ = 0;
                
                nbrCommsArr.length = 0;
                ki_in_c.clear();
                
                nbrCommsArr.push(currentComm);
                ki_in_c.set(currentComm, 0);
                
                for (const [nbr, w] of adj.get(n)!.entries()) {
                    const nc = nodeToComm.get(nbr);
                    if (nc) {
                        if (!ki_in_c.has(nc)) {
                            nbrCommsArr.push(nc);
                            ki_in_c.set(nc, 0);
                        }
                        ki_in_c.set(nc, ki_in_c.get(nc)! + w);
                    }
                }
                
                for (const c of nbrCommsArr) {
                    const inC = ki_in_c.get(c) || 0;
                    const totC = sumTot.get(c) || 0;
                    const deltaQ = inC - (resolution * totC * nodeDegree) / m2;
                    
                    if (deltaQ > maxDeltaQ) {
                        maxDeltaQ = deltaQ;
                        bestComm = c;
                    }
                }
                
                nodeToComm.set(n, bestComm);
                sumTot.set(bestComm, (sumTot.get(bestComm) || 0) + nodeDegree);
                
                if (bestComm !== currentComm) {
                    localImprovement = true;
                    improvement = true;
                }
            }
        }
        
        // Phase 2: Aggregation
        if (improvement) {
            // Update tracing so original nodes point to their new aggregated community
            for (const [origNode, currNode] of nodeToCurrent.entries()) {
                nodeToCurrent.set(origNode, nodeToComm.get(currNode)!);
            }
            
            const newAdj = new Map<string, Map<string, number>>();
            const comms = new Set(nodeToComm.values());
            const commList = Array.from(comms);
            
            for (const c of commList) {
                newAdj.set(c, new Map());
            }
            
            for (const u of currentNodes) {
                const commU = nodeToComm.get(u)!;
                const mapU = newAdj.get(commU)!;
                
                for (const [v, w] of adj.get(u)!.entries()) {
                    const commV = nodeToComm.get(v)!;
                    mapU.set(commV, (mapU.get(commV) || 0) + w);
                }
            }
            
            currentNodes = commList;
            adj = newAdj;
            
            const newNodeToComm = new Map<string, string>();
            for (const c of currentNodes) {
                newNodeToComm.set(c, c);
            }
            nodeToComm = newNodeToComm;
        }
    }
    
    // Finalize clusters mapping
    const communityMap = new Map<string, string[]>();
    for (const [origNode, finalComm] of nodeToCurrent.entries()) {
        if (!communityMap.has(finalComm)) {
            communityMap.set(finalComm, []);
        }
        communityMap.get(finalComm)!.push(origNode);
    }
    
    const nodeCommunityMap = new Map<string, string>();
    const communitySizes = new Map<string, number>();
    
    let commIdx = 1;
    for (const memberIds of communityMap.values()) {
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
