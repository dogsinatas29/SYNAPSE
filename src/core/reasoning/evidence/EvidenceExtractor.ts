import { GraphModel } from '../../GraphModel';
import { ReasoningSnapshot } from '../snapshot/ReasoningSnapshot';
import { 
    EvidenceCategory, 
    IStructuralEvidence, 
    IDependencyEvidence,
    IReachabilityEvidence
} from './Evidence';

/**
 * EvidenceExtractor acts strictly as an adapter/observer.
 * It reads facts from the GraphModel and outputs Evidence.
 * It MUST NOT perform reasoning or classification.
 */
export class EvidenceExtractor {
    
    public extract(graph: GraphModel): ReasoningSnapshot {
        const snapshot = new ReasoningSnapshot();
        
        // 1. Extract Structural Evidence
        this.extractStructuralEvidence(graph, snapshot);
        
        // 2. Extract Dependency & Reachability (Base facts)
        this.extractDependencyAndReachability(graph, snapshot);

        // 3. Extract Flow Segments
        this.extractFlowSegments(graph, snapshot);

        return snapshot;
    }


    private extractStructuralEvidence(graph: GraphModel, snapshot: ReasoningSnapshot): void {
        const nodes = graph.getNodes();
        const edges = graph.getEdges();

        for (const node of nodes) {
            // Count purely structural connections
            const incoming = edges.filter(e => e.target === node.id);
            const outgoing = edges.filter(e => e.source === node.id);
            
            snapshot.addEvidence({
                id: `ev-struct-${node.id}`,
                category: EvidenceCategory.STRUCTURAL,
                nodeId: node.id,
                description: `Structural metrics for ${node.id}`,
                metadata: {
                    inDegree: incoming.length,
                    outDegree: outgoing.length,
                    degree: incoming.length + outgoing.length
                }
            } as IStructuralEvidence);
        }
    }

    private extractDependencyAndReachability(graph: GraphModel, snapshot: ReasoningSnapshot): void {
        const nodes = graph.getNodes();
        const edges = graph.getEdges();

        for (const node of nodes) {
            const incoming = edges.filter(e => e.target === node.id);
            const outgoing = edges.filter(e => e.source === node.id);

            snapshot.addEvidence({
                id: `ev-dep-${node.id}`,
                category: EvidenceCategory.DEPENDENCY,
                nodeId: node.id,
                description: `Dependency metrics for ${node.id}`,
                metadata: {
                    inboundDependencyCount: incoming.length,
                    outboundDependencyCount: outgoing.length,
                    fanIn: incoming.length, // Simplified for this implementation
                    fanOut: outgoing.length
                }
            } as IDependencyEvidence);

            // Mock reachability values since we don't have a real graph traversal engine in this stub
            snapshot.addEvidence({
                id: `ev-reach-${node.id}`,
                category: EvidenceCategory.REACHABILITY,
                nodeId: node.id,
                description: `Reachability metrics for ${node.id}`,
                metadata: {
                    mutationReach: outgoing.length * 2,
                    decisionReach: outgoing.length * 3
                }
            } as IReachabilityEvidence);
        }
    }

    private extractFlowSegments(graph: GraphModel, snapshot: ReasoningSnapshot): void {
        const edges = graph.getEdges();

        for (const edge of edges) {
            if (edge.type === 'return' || edge.type === 'inject') {
                snapshot.addEvidence({
                    id: `ev-data-seg-${edge.id}`,
                    category: EvidenceCategory.DATA_FLOW_SEGMENT,
                    nodeId: edge.source, // Bind to source conceptually
                    description: `Data segment from ${edge.source} to ${edge.target}`,
                    metadata: {
                        sourceId: edge.source,
                        targetId: edge.target,
                        edgeType: edge.type,
                        confidence: edge.type === 'return' ? 0.9 : 0.7
                    }
                } as IDataFlowSegmentEvidence);
            } else if (edge.type === 'call' || edge.type === 'dispatch' || edge.type === 'import') {
                let confidence = 0.7;
                if (edge.type === 'dispatch') confidence = 0.9;
                if (edge.type === 'import') confidence = 0.3;

                snapshot.addEvidence({
                    id: `ev-ctrl-seg-${edge.id}`,
                    category: EvidenceCategory.CONTROL_FLOW_SEGMENT,
                    nodeId: edge.source,
                    description: `Control segment from ${edge.source} to ${edge.target}`,
                    metadata: {
                        sourceId: edge.source,
                        targetId: edge.target,
                        edgeType: edge.type,
                        confidence
                    }
                } as IControlFlowSegmentEvidence);
            }
        }
    }
}


