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
        const graphB = runExperiment('Graph B (No TYPE_ONLY)', GraphViewBuilder.build(edges, GraphPolicy.TYPE_FILTERED));
        const graphC = runExperiment('Graph C (Runtime Resolved)', GraphViewBuilder.build(edges, GraphPolicy.RUNTIME_RESOLVED));
        const graphD = runExperiment('Graph D (Strong Coupling)', GraphViewBuilder.build(edges, GraphPolicy.STRONG_COUPLING));
        const graphE = runExperiment('Graph E (Executable Coupling)', GraphViewBuilder.build(edges, GraphPolicy.EXECUTABLE_COUPLING));

        console.log('[GRAPH_VIEW_EDGE_COUNTS]', {
            A: graphA.edgeCount,
            B: graphB.edgeCount,
            C: graphC.edgeCount,
            D: graphD.edgeCount,
            E: graphE.edgeCount
        });

        // 3. Provenance Stats
        const provStats: Record<string, number> = {};
        for (const e of edges) {
            const p = e.provenance || EdgeProvenance.UNKNOWN_RUNTIME;
            provStats[p] = (provStats[p] || 0) + 1;
        }
        console.log('[PROVENANCE_STATS]', provStats);

        console.log('[RUNTIME_GRAPH_AUDIT]', {
            runtimeNodes: logicNodesMap.size,
            sccSize_A: graphA.sccs.length > 0 ? graphA.sccs[0].nodeIds.length : 0,
            sccSize_B: graphB.sccs.length > 0 ? graphB.sccs[0].nodeIds.length : 0,
            sccSize_C: graphC.sccs.length > 0 ? graphC.sccs[0].nodeIds.length : 0,
            sccSize_D: graphD.sccs.length > 0 ? graphD.sccs[0].nodeIds.length : 0,
            sccSize_E: graphE.sccs.length > 0 ? graphE.sccs[0].nodeIds.length : 0
        });

        // Hub Stability Index (Top 5 hubs of Graph A)
        const topHubsA = Array.from(graphA.degrees.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
        console.log('[HUB_STABILITY_INDEX]');
        const topHubsOutput = [];
        for (const [hubId, degA] of topHubsA) {
            const degE = graphE.degrees.get(hubId) || 0;
            const stability = degA > 0 ? (degE / degA * 100).toFixed(1) : '0.0';
            console.log(`- ${hubId.split('/').pop()}: ${degA} -> ${degE} (${stability}%)`);
            topHubsOutput.push({ id: hubId, degA, degE, stability });
        }

        TarjanSCC.lastAuditLog = {
            runtimeNodes: logicNodesMap.size,
            sccSize_A: graphA.sccs.length > 0 ? graphA.sccs[0].nodeIds.length : 0,
            sccSize_B: graphB.sccs.length > 0 ? graphB.sccs[0].nodeIds.length : 0,
            sccSize_C: graphC.sccs.length > 0 ? graphC.sccs[0].nodeIds.length : 0,
            sccSize_D: graphD.sccs.length > 0 ? graphD.sccs[0].nodeIds.length : 0,
            sccSize_E: graphE.sccs.length > 0 ? graphE.sccs[0].nodeIds.length : 0,
            topHubsA: topHubsOutput
        };

        // Return Graph A as default to preserve current App behavior
        // Or if we want to clean up UI, we could return Graph C. For now we return A.
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

        function strongConnect(v: string) {
            indices.set(v, index);
            lowLink.set(v, index);
            index++;
            stack.push(v);
            onStack.add(v);

            const neighbors = adjacency.get(v) || [];
            for (const w of neighbors) {
                if (!indices.has(w)) {
                    strongConnect(w);
                    lowLink.set(v, Math.min(lowLink.get(v)!, lowLink.get(w)!));
                } else if (onStack.has(w)) {
                    lowLink.set(v, Math.min(lowLink.get(v)!, indices.get(w)!));
                }
            }

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

        for (const id of nodeIds) {
            if (!indices.has(id)) strongConnect(id);
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
