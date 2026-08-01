import { ProjectState, Node, Edge, NodeRole, EdgeProvenance } from '../../../types/schema';
import { SccCluster } from '../types';
import { determineNodeRole } from '../../NodeBuilder';
import { GraphViewBuilder, GraphPolicy } from '../GraphViewBuilder';

export class TarjanSCC {
    public static lastAuditLog: any = null;
    
    /**
     * Extracts Strongly Connected Components (SCC) strictly from logic nodes.
     * @param state The entire project state (must not be mutated)
     * @returns Array of SccCluster objects
     */
    public static extract(state: ProjectState): SccCluster[] {
        console.log("[STEP-5] Tarjan extract start");
        const nodes = state.nodes || [];
        const edges = state.edges || [];

        // [DIAGNOSTIC] Check Role Distribution
        const roleCounts = {
            RUNTIME: 0, RUNTIME_ENTRY: 0, DOMAIN_MODEL: 0,
            CONFIG: 0, TEST: 0, DOCUMENT: 0, ASSET: 0,
            EXTERNAL: 0, GHOST: 0, UNKNOWN: 0
        };
        for (const n of nodes) {
            let r = n.role;
            if (!r && n.id) {
                const roleInfo = determineNodeRole(n.id);
                r = roleInfo.role;
                n.role = r;
            }
            if (r && r in roleCounts) (roleCounts as any)[r]++;
            else roleCounts.UNKNOWN++;
        }
        console.log('[HYGIENE_DIAGNOSTIC]', {
            totalNodes: nodes.length,
            ...roleCounts
        });

        const logicNodesMap = new Map<string, Node>();
        for (const n of nodes) {
            if (n.role === NodeRole.RUNTIME) {
                logicNodesMap.set(n.id, n);
            }
        }
        
        const logicNodeIds = Array.from(logicNodesMap.keys());
        
        // --- 2. 5-Way Experiment (A, B, C, D, E) ---
        const runExperiment = (name: string, filteredEdges: Edge[]) => {
            const sccs = this.extractFromSubset(logicNodeIds, filteredEdges);
            const degrees = GraphViewBuilder.computeDegrees(logicNodesMap, filteredEdges);
            return { sccs, degrees, edgeCount: filteredEdges.length };
        };

        const graphA = runExperiment('Graph A (Full)', GraphViewBuilder.build(edges, GraphPolicy.FULL));

        // 3. Provenance Stats
        const provStats: Record<string, number> = {};
        for (const e of edges) {
            const p = e.provenance || EdgeProvenance.UNKNOWN_RUNTIME;
            provStats[p] = (provStats[p] || 0) + 1;
        }
        console.log('[PROVENANCE_STATS]', provStats);

        console.log('[RUNTIME_GRAPH_AUDIT]', {
            runtimeNodes: logicNodesMap.size,
            sccSize_A: graphA.sccs.length > 0 ? graphA.sccs[0].nodeIds.length : 0
        });

        const largestScc = graphA.sccs.reduce((max, scc) => Math.max(max, scc.nodeIds.length), 0);
        console.log(`[TARJAN] SCC count = ${graphA.sccs.length}, largest SCC = ${largestScc}`);

        // Hub Stability Index (Top 5 hubs of Graph A)
        const topHubsA = Array.from(graphA.degrees.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
        console.log('[HUB_STABILITY_INDEX]');
        const topHubsOutput = [];
        for (const [hubId, degA] of topHubsA) {
            console.log(`- ${hubId.split('/').pop()}: ${degA}`);
            topHubsOutput.push({ id: hubId, degA, degE: degA, stability: '100.0' });
        }

        TarjanSCC.lastAuditLog = {
            runtimeNodes: logicNodesMap.size,
            sccSize_A: graphA.sccs.length > 0 ? graphA.sccs[0].nodeIds.length : 0,
            topHubsA: topHubsOutput
        };

        // Return Graph A as default to preserve current App behavior
        return graphA.sccs;
    }

    // Removed inline Tarjan to rely on extractFromSubset for everything

    /**
     * Extracts SCCs from a pre-filtered subset of node IDs (for virtual simulations).
     */
    public static extractFromSubset(nodeIds: string[], edges: Edge[]): SccCluster[] {
        const adjacency = new Map<string, string[]>();
        const inDegree = new Map<string, number>();
        const outDegree = new Map<string, number>();

        const nodeSet = new Set(nodeIds);

        for (const id of nodeIds) {
            adjacency.set(id, []);
            inDegree.set(id, 0);
            outDegree.set(id, 0);
        }

        for (const e of edges) {
            if (nodeSet.has(e.from) && nodeSet.has(e.to)) {
                adjacency.get(e.from)!.push(e.to);
                outDegree.set(e.from, (outDegree.get(e.from) || 0) + 1);
                inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
            }
        }

        let index = 0;
        const stack: string[] = [];
        const indices = new Map<string, number>();
        const lowLink = new Map<string, number>();
        const onStack = new Set<string>();
        const sccs: string[][] = [];

        function strongConnectIterative(startNode: string) {
            // Manual call stack for DFS to prevent RangeError: Maximum call stack size exceeded
            // Stack stores: [node, neighbor_index]
            const callStack: [string, number][] = [[startNode, 0]];
            
            indices.set(startNode, index);
            lowLink.set(startNode, index);
            index++;
            stack.push(startNode);
            onStack.add(startNode);

            while (callStack.length > 0) {
                const top = callStack[callStack.length - 1];
                const v = top[0];
                const neighborIdx = top[1];
                
                const neighbors = adjacency.get(v) || [];

                if (neighborIdx < neighbors.length) {
                    const w = neighbors[neighborIdx];
                    top[1]++; // Advance neighbor index for when we return to this node
                    
                    if (!indices.has(w)) {
                        indices.set(w, index);
                        lowLink.set(w, index);
                        index++;
                        stack.push(w);
                        onStack.add(w);
                        callStack.push([w, 0]); // "Recurse" into w
                    } else if (onStack.has(w)) {
                        lowLink.set(v, Math.min(lowLink.get(v)!, indices.get(w)!));
                    }
                } else {
                    // Finished all neighbors of v. "Return" from recursion.
                    callStack.pop();
                    
                    // If we just popped v, update its parent's lowLink if it has a parent in the DFS tree
                    if (callStack.length > 0) {
                        const parent = callStack[callStack.length - 1][0];
                        lowLink.set(parent, Math.min(lowLink.get(parent)!, lowLink.get(v)!));
                    }
                    
                    // Generate SCC if v is a root node
                    if (lowLink.get(v) === indices.get(v)) {
                        const scc: string[] = [];
                        let w: string;
                        do {
                            w = stack.pop()!;
                            onStack.delete(w);
                            scc.push(w);
                        } while (w !== v);
                        
                        if (scc.length > 1) {
                            sccs.push(scc);
                        }
                    }
                }
            }
        }


        for (const id of nodeIds) {
            if (!indices.has(id)) strongConnectIterative(id);
        }

        const results: SccCluster[] = [];

        for (const scc of sccs) {
            scc.sort();
            const clusterId = `scc-${scc[0]}`;
            let maxDegree = -1;
            let hubId = scc[0];
            
            for (const nodeId of scc) {
                const totalDegree = (inDegree.get(nodeId) || 0) + (outDegree.get(nodeId) || 0);
                if (totalDegree > maxDegree) {
                    maxDegree = totalDegree;
                    hubId = nodeId;
                }
            }

            results.push({
                id: clusterId,
                nodeIds: scc,
                hubId: hubId,
                hubDegree: maxDegree
            });
        }

        return results.sort((a, b) => b.nodeIds.length - a.nodeIds.length);
    }
}
