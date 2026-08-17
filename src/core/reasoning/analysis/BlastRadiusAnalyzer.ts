import { Finding } from '../rules/Rule';
import { ReasoningSnapshot } from '../snapshot/ReasoningSnapshot';
import { EvidenceCategory, IBlastRadiusEvidence } from '../evidence/Evidence';

export class BlastRadiusAnalyzer {
    public analyze(snapshot: ReasoningSnapshot, findings: Finding[]): ReasoningSnapshot {
        // Collect all distinct nodes
        const allNodes = new Set<string>();
        findings.forEach(f => f.targetIds.forEach(id => allNodes.add(id)));

        const nodeData = new Map<string, {
            boundaries: Set<string>,
            cores: Set<string>,
            pipelines: Set<string>,
            extensions: Set<string>,
            criticality: 'CORE' | 'SUPPORTING' | 'UTILITY',
            isBoundaryCrosser: boolean,
            isPipelineOwner: boolean,
            isPipelinePayloadDefinition: boolean,
            extensionImplementationCount: number
        }>();

        for (const node of allNodes) {
            nodeData.set(node, {
                boundaries: new Set(),
                cores: new Set(),
                pipelines: new Set(),
                extensions: new Set(),
                criticality: 'UTILITY', // Default
                isBoundaryCrosser: false,
                isPipelineOwner: false,
                isPipelinePayloadDefinition: false,
                extensionImplementationCount: 0
            });
        }

        // 1. Map node criticality
        findings.filter(f => f.type === 'CORE' || f.type === 'SUPPORTING' || f.type === 'UTILITY').forEach(f => {
            f.targetIds.forEach(id => {
                if (nodeData.has(id)) nodeData.get(id)!.criticality = f.type as any;
            });
        });

        // 2. Map structural flags from previous findings
        findings.filter(f => f.type === 'BOUNDARY_CROSSER').forEach(f => {
            f.targetIds.forEach(id => {
                if (nodeData.has(id)) {
                    nodeData.get(id)!.boundaries.add('bound-a');
                    nodeData.get(id)!.boundaries.add('bound-b');
                    nodeData.get(id)!.isBoundaryCrosser = true;
                }
            });
        });

        // Use criticality evidence or specific findings to determine pipeline ownership/payload definition.
        // For synthesis, we can look for specific pipeline root findings or rely on criticality evidence.
        // As an approximation for the analyzer logic, we'll mark them if they are CORE and participate heavily.
        // (In a full implementation, this comes directly from Phase 4/6 findings).
        snapshot.getAllEvidence().filter(e => e.category === EvidenceCategory.CRITICALITY).forEach(e => {
            const ev = e as any;
            if (nodeData.has(ev.nodeId)) {
                if (ev.metadata.isPolicyOwner) nodeData.get(ev.nodeId)!.isPipelineOwner = true;
                if (ev.metadata.isStateOwner) nodeData.get(ev.nodeId)!.isPipelinePayloadDefinition = true;
            }
        });

        // A node affects pipelines if it participates in them
        findings.filter(f => f.type === 'DATA_PIPELINE' || f.type === 'CONTROL_PIPELINE').forEach(f => {
            f.targetIds.forEach(id => {
                if (nodeData.has(id)) nodeData.get(id)!.pipelines.add(f.id);
            });
        });

        // A node affects extension points if it IS one (shatters it) or is a Registry that manages it.
        findings.filter(f => f.type === 'EXTENSION_POINT').forEach(f => {
            f.targetIds.forEach(id => {
                if (nodeData.has(id)) {
                    nodeData.get(id)!.extensions.add(f.id);
                    // Extract implementation count from the finding's evidence if available.
                    // For the analyzer approximation, we find the backing evidence:
                    const extEv = snapshot.getAllEvidence().find(e => e.id === f.evidenceIds[0]) as any;
                    if (extEv && extEv.metadata && extEv.metadata.implementationCount) {
                        nodeData.get(id)!.extensionImplementationCount += extEv.metadata.implementationCount;
                    }
                }
            });
        });

        const newSnapshot = snapshot.clone();

        for (const [nodeId, data] of nodeData.entries()) {
            const ev: IBlastRadiusEvidence = {
                id: `ev-blast-${nodeId}`,
                category: EvidenceCategory.BLAST_RADIUS,
                nodeId,
                description: `Blast radius analysis for ${nodeId}`,
                metadata: {
                    nodeId,
                    affectedBoundaryIds: Array.from(data.boundaries),
                    affectedCoreNodeIds: Array.from(data.cores),
                    affectedPipelineIds: Array.from(data.pipelines),
                    affectedExtensionPointIds: Array.from(data.extensions),
                    affectedBoundaryCount: data.boundaries.size,
                    affectedCoreCount: data.cores.size,
                    affectedPipelineCount: data.pipelines.size,
                    affectedExtensionPointCount: data.extensions.size,
                    affectedExtensionImplementationCount: data.extensionImplementationCount,
                    isBoundaryCrosser: data.isBoundaryCrosser,
                    isPipelineOwner: data.isPipelineOwner,
                    isPipelinePayloadDefinition: data.isPipelinePayloadDefinition,
                    criticality: data.criticality,
                    confidence: 0.9
                }
            };
            newSnapshot.addEvidence(ev);
        }

        return newSnapshot;
    }
}
