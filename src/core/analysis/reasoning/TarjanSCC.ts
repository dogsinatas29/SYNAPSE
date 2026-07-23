import { ProjectState, Node, Edge } from '../../../types/schema';
import { SccCluster } from '../types';

export class TarjanSCC {
    
    /**
     * Extracts Strongly Connected Components (SCC) strictly from logic nodes.
     * @param state The entire project state (must not be mutated)
     * @returns Array of SccCluster objects
     */
    public static extract(state: ProjectState): SccCluster[] {
        const nodes = state.nodes || [];
        const edges = state.edges || [];

        // 1. Filter strictly for logic nodes to prevent directory/cluster hubs
        const logicNodes = new Map<string, Node>();
        for (const n of nodes) {
            // Include nodes that are logic or don't explicitly declare themselves as non-logic clusters
            if (n.type !== 'folder' && n.type !== 'cluster' && n.type !== 'document' && n.type !== 'asset') {
                logicNodes.set(n.id, n);
            }
        }

        // 2. Build adjacency list specifically for logic nodes
        const adjacency = new Map<string, string[]>();
        const inDegree = new Map<string, number>();
        const outDegree = new Map<string, number>();

        for (const [id] of logicNodes) {
            adjacency.set(id, []);
            inDegree.set(id, 0);
            outDegree.set(id, 0);
        }

        for (const e of edges) {
            if (logicNodes.has(e.source) && logicNodes.has(e.target)) {
                adjacency.get(e.source)!.push(e.target);
                
                // Track degrees for Hub calculation
                outDegree.set(e.source, (outDegree.get(e.source) || 0) + 1);
                inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
            }
        }

        // 3. Tarjan's Algorithm
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
                
                // Only consider SCCs with > 1 node (actual cycles)
                if (scc.length > 1) {
                    sccs.push(scc);
                }
            }
        }

        for (const [id] of logicNodes) {
            if (!indices.has(id)) {
                strongConnect(id);
            }
        }

        // 4. Construct SccCluster objects
        const results: SccCluster[] = [];

        for (const scc of sccs) {
            scc.sort(); // Stable ID
            const clusterId = `scc-${scc[0]}`;

            // Find Degree Hub inside this SCC
            let maxDegree = -1;
            let hubId = scc[0];
            
            // Scalability: If SCC > 500, we still compute degree but we don't do deep betweenness
            // Actually, Betweenness was removed. We only do Degree Centrality for all scales.
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

        // Sort SCCs by size descending
        return results.sort((a, b) => b.nodeIds.length - a.nodeIds.length);
    }
}
