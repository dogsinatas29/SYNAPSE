import { PropagationTraceEdge } from '../PropagationTraceEdge';
import { SimulationSnapshot } from '../../SimulationSnapshot';

export interface CompressedTraceEdge {
    sourceCluster: string;
    targetCluster: string;
    count: number;
}

export interface DominantPath {
    path: string[];
    weight: number;
}

export class TraceCompressor {
    public compress(traces: PropagationTraceEdge[], snapshot: SimulationSnapshot): CompressedTraceEdge[] {
        const clusterEdges = new Map<string, number>();

        for (const trace of traces) {
            let sourceCluster = 'ROOT_CAUSE';
            let targetCluster = 'UNKNOWN';

            if (trace.sourceType === 'NODE') {
                const node = snapshot.getNode(trace.sourceId);
                if (node) sourceCluster = node.cluster_id + '/*';
            } else {
                sourceCluster = `[EDGE] ${trace.sourceId}`;
            }

            if (trace.targetType === 'NODE') {
                const node = snapshot.getNode(trace.targetId);
                if (node) targetCluster = node.cluster_id + '/*';
            }

            // Skip self-loops in compressed graph
            if (sourceCluster === targetCluster) continue;

            const key = `${sourceCluster} -> ${targetCluster}`;
            clusterEdges.set(key, (clusterEdges.get(key) || 0) + 1);
        }

        const compressed: CompressedTraceEdge[] = [];
        for (const [key, count] of clusterEdges.entries()) {
            const [source, target] = key.split(' -> ');
            compressed.push({ sourceCluster: source, targetCluster: target, count });
        }

        // Sort by volume descending
        return compressed.sort((a, b) => b.count - a.count);
    }

    public extractDominantPaths(compressed: CompressedTraceEdge[], topN: number = 5): DominantPath[] {
        // Find top N heaviest edges and treat them as 1-hop dominant paths for simplicity in Phase 9.5
        // A full graph traversal could find longer paths, but 1-hop cluster-to-cluster shows the major flows.
        return compressed.slice(0, topN).map(edge => ({
            path: [edge.sourceCluster, edge.targetCluster],
            weight: edge.count
        }));
    }
}
