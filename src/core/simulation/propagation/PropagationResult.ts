import { PropagationImpact } from './PropagationImpact';
import { PropagationTraceEdge } from './PropagationTraceEdge';

export interface PropagationResult {
    impacts: PropagationImpact[];
    traces: PropagationTraceEdge[];
    stats?: {
        maxDepthReached: number;
        visitedNodes: number;
        visitedEdges: number;
        traceCount: number;
    };
}
