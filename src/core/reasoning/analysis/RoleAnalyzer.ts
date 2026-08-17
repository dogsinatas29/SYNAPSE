import { ReasoningSnapshot } from '../snapshot/ReasoningSnapshot';
import { Finding } from '../rules/Rule';
import { GraphModel } from '../../GraphModel';
import { EvidenceCategory, IStorageEvidence } from '../evidence/Evidence';

export class RoleAnalyzer {
    public analyze(snapshot: ReasoningSnapshot, findings: Finding[], graph?: GraphModel): ReasoningSnapshot {
        const newSnapshot = snapshot.clone();

        if (graph) {
            const graphSnapshot = graph.createSnapshot();
            const nodes = graphSnapshot.nodes;
            const edges = graphSnapshot.edges;

            for (const node of nodes) {
                // Determine if node acts as a payload owner (storage) by checking outgoing DEFINES_PAYLOAD edges
                const payloadEdges = edges.filter((e: any) => (e.source || e.from) === node.id && (e.type === 'DEFINES_PAYLOAD' || e.type === 'MANAGES_STATE'));
                
                if (payloadEdges.length > 0) {
                    newSnapshot.addEvidence({
                        id: `ev-storage-${node.id}`,
                        category: EvidenceCategory.STORAGE,
                        nodeId: node.id,
                        description: `Storage / Payload definition detected for ${node.id}`,
                        metadata: {
                            fieldCount: payloadEdges.length // dynamically bound to architecture, no longer hardcoded
                        }
                    } as IStorageEvidence);
                }
            }
        }

        return newSnapshot;
    }
}
