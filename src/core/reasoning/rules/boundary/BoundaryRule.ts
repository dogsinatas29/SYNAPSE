import { IRule, Finding } from '../Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';
import { EvidenceCategory, ICommunityEvidence } from '../../evidence/Evidence';

export class BoundaryRule implements IRule {
    public readonly id = 'rule-boundary';
    public readonly name = 'Boundary Rule';
    public readonly purpose = 'Identifies structural boundaries and islands based on modularity evidence.';

    public evaluate(snapshot: ReasoningSnapshot): Finding[] {
        const findings: Finding[] = [];
        
        const communityEvidence = snapshot.getAllEvidence().filter(
            (e): e is ICommunityEvidence => e.category === EvidenceCategory.COMMUNITY
        );

        for (const comm of communityEvidence) {
            const isIsland = comm.metadata.externalEdgeCount <= 1 && comm.metadata.internalEdgeCount > 0;
            const isHighModularity = comm.metadata.modularityScore >= 0.5;

            if (isIsland) {
                findings.push({
                    id: `f-bound-isl-${comm.metadata.communityId}`,
                    type: 'BOUNDARY_ISLAND',
                    confidence: 1.0,
                    evidenceIds: [comm.id],
                    ruleId: this.id,
                    summary: `Community ${comm.metadata.communityId} is an isolated Island.`,
                    explanation: `Has high internal cohesion but <= 1 external edge.`,
                    targetType: 'GROUP',
                    targetIds: comm.metadata.nodeIds
                });
            } else if (isHighModularity) {
                findings.push({
                    id: `f-bound-${comm.metadata.communityId}`,
                    type: 'BOUNDARY',
                    confidence: comm.metadata.modularityScore,
                    evidenceIds: [comm.id],
                    ruleId: this.id,
                    summary: `Community ${comm.metadata.communityId} acts as a cohesive Architectural Boundary.`,
                    explanation: `Modularity score is ${(comm.metadata.modularityScore * 100).toFixed(1)}%.`,
                    targetType: 'GROUP',
                    targetIds: comm.metadata.nodeIds
                });
            }
        }

        return findings;
    }
}
