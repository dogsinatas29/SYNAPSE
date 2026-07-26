import { Node, Edge } from '../../../types/schema';
import { SccCluster } from '../types';

/**
 * Implements the Label Propagation Algorithm (LPA) to detect communities within an SCC.
 * Extremely fast and works on memory O(V+E) time, perfect for large graphs.
 */
export class CommunityDetector {
    
    /**
     * Detects subcommunities inside a given SCC using Label Propagation Algorithm.
     * @returns A Map of nodeId to communityLabel string
     */
    public static detect(scc: SccCluster, edges: Edge[]): Map<string, string> {
        const labels = new Map<string, string>();
        const sccNodeSet = new Set(scc.nodeIds);
        
        // 1. Initialize labels (each node is its own community)
        for (const nodeId of scc.nodeIds) {
            labels.set(nodeId, nodeId);
        }

        // 2. Build adjacency for undirected traversal within the SCC
        const adjacency = new Map<string, string[]>();
        for (const id of scc.nodeIds) {
            adjacency.set(id, []);
        }

        for (const e of edges) {
            if (sccNodeSet.has(e.from) && sccNodeSet.has(e.to)) {
                adjacency.get(e.from)!.push(e.to);
                adjacency.get(e.to)!.push(e.from); // undirected for LPA
            }
        }

        // 3. Label Propagation (max 5 iterations for convergence stability without infinite loops)
        const maxIterations = 5;
        let changed = true;
        let iter = 0;

        while (changed && iter < maxIterations) {
            changed = false;
            iter++;

            // Deterministic traversal: Sort nodes by ID to ensure 100% reproducible results
            const nodes = [...scc.nodeIds].sort((a, b) => a.localeCompare(b));

            for (const nodeId of nodes) {
                const neighbors = adjacency.get(nodeId) || [];
                if (neighbors.length === 0) continue;

                const labelCounts = new Map<string, number>();
                let maxCount = -1;
                let maxLabel = labels.get(nodeId)!;

                for (const neighbor of neighbors) {
                    const neighborLabel = labels.get(neighbor)!;
                    const count = (labelCounts.get(neighborLabel) || 0) + 1;
                    labelCounts.set(neighborLabel, count);

                    if (count > maxCount) {
                        maxCount = count;
                        maxLabel = neighborLabel;
                    }
                }

                if (labels.get(nodeId) !== maxLabel) {
                    labels.set(nodeId, maxLabel);
                    changed = true;
                }
            }
        }

        return labels;
    }
}
