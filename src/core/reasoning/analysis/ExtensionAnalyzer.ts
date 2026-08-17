import { Finding } from '../rules/Rule';
import { ReasoningSnapshot } from '../snapshot/ReasoningSnapshot';
import { EvidenceCategory, IExtensionEvidence } from '../evidence/Evidence';
import { GraphModel, Edge } from '../../GraphModel';

export class ExtensionAnalyzer {
    public analyze(snapshot: ReasoningSnapshot, findings: Finding[], graph: GraphModel): ReasoningSnapshot {
        const newSnapshot = snapshot.clone();
        const graphSnapshot = graph.createSnapshot();
        const edges = graphSnapshot.edges;

        // 1. Find all interfaces (nodes that have 'implements' or 'realizes' edges incoming)
        // Or in standard syntax, nodes with incoming "implement" edges.
        const interfaceCandidates = new Map<string, { 
            implementationIds: Set<string>, 
            consumerIds: Set<string>,
            registryIds: Set<string> 
        }>();

        for (const edge of edges) {
            // Note: edge.type in SYNAPSE could be 'implements', 'extends', 'injects', 'uses', 'registers'
            // We assume standard terminology for these structural links
            if (edge.type === 'implements' || edge.type === 'realizes' || edge.type === 'IMPLEMENTS') {
                const to = (edge as any).target || (edge as any).to;
                const from = (edge as any).source || (edge as any).from;
                if (!interfaceCandidates.has(to)) {
                    interfaceCandidates.set(to, { implementationIds: new Set(), consumerIds: new Set(), registryIds: new Set() });
                }
                interfaceCandidates.get(to)!.implementationIds.add(from);
            }
        }

        // 2. For each interface, find who consumes it and if it's registered
        for (const edge of edges) {
            const to = (edge as any).target || (edge as any).to;
            const from = (edge as any).source || (edge as any).from;
            const isConsumerEdge = edge.type === 'injects' || edge.type === 'uses' || edge.type === 'call' || edge.type === 'DEPENDS_ON';
            const isRegistryEdge = edge.type === 'registers' || to.toLowerCase().includes('registry');

            if (interfaceCandidates.has(to)) {
                if (isRegistryEdge) {
                    interfaceCandidates.get(to)!.registryIds.add(from);
                } else if (isConsumerEdge) {
                    interfaceCandidates.get(to)!.consumerIds.add(from);
                }
            }
        }

        // 3. Emit Evidence with Strong/Medium/Weak signals
        for (const [interfaceId, data] of interfaceCandidates.entries()) {
            const implCount = data.implementationIds.size;
            const hasRegistry = data.registryIds.size > 0;
            const hasConsumers = data.consumerIds.size > 0;

            let confidence = 0.1; // Weak Signal (e.g. 1 impl)
            
            if (implCount >= 2) {
                if (hasRegistry) {
                    confidence = 0.95; // Strong Signal: Multiple impls + Registry
                } else if (hasConsumers) {
                    confidence = 0.8; // Medium Signal: Multiple impls + Direct Injection
                } else {
                    confidence = 0.4; // Weak Signal: Multiple impls but no active consumers/registries found
                }
            }

            const ev: IExtensionEvidence = {
                id: `ev-ext-${interfaceId}`,
                category: EvidenceCategory.EXTENSION,
                nodeId: interfaceId,
                description: `Extension Point Evidence for ${interfaceId}`,
                metadata: {
                    interfaceId,
                    implementationIds: Array.from(data.implementationIds),
                    implementationCount: implCount,
                    consumerIds: Array.from(data.consumerIds),
                    injectedIntoCount: data.consumerIds.size,
                    registryIds: Array.from(data.registryIds),
                    hasRegistry,
                    confidence
                }
            };
            newSnapshot.addEvidence(ev);
        }

        return newSnapshot;
    }
}
