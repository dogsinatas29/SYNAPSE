import { PropagationTraceEdge } from '../PropagationTraceEdge';
import { SimulationTransition } from '../../state/SimulationTransition';

export interface PositionStats {
    rootAdjacent: number;
    intermediate: number;
    leaf: number;
}

export class PropagationPositionAnalyzer {
    public analyze(traces: PropagationTraceEdge[], transitions: SimulationTransition[]): PositionStats {
        const outDegree = new Map<string, number>();
        const depthMap = new Map<string, number>();
        const nodesAffected = new Set<string>();

        // Count out-degrees and record depths
        for (const trace of traces) {
            if (trace.targetType === 'NODE') {
                nodesAffected.add(trace.targetId);
                // Record the minimum depth reached for this node
                const currentDepth = depthMap.get(trace.targetId) || Infinity;
                if (trace.depth < currentDepth) {
                    depthMap.set(trace.targetId, trace.depth);
                }
            }

            if (trace.sourceType === 'NODE') {
                nodesAffected.add(trace.sourceId);
                outDegree.set(trace.sourceId, (outDegree.get(trace.sourceId) || 0) + 1);
            }
        }

        let rootAdjacent = 0;
        let intermediate = 0;
        let leaf = 0;

        for (const nodeId of nodesAffected) {
            const depth = depthMap.get(nodeId) || 0;
            const outEdges = outDegree.get(nodeId) || 0;

            if (depth === 1) {
                rootAdjacent++;
            } else if (outEdges === 0) {
                leaf++;
            } else {
                intermediate++;
            }
        }

        return { rootAdjacent, intermediate, leaf };
    }
}
