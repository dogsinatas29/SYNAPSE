import { IRule, Finding } from '../Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';
import { EvidenceCategory, IBoundaryStrengthEvidence } from '../../evidence/Evidence';

export class BoundaryCrosserRule implements IRule {
    public readonly id = 'rule-boundary-crosser';
    public readonly name = 'Boundary Crosser Rule';
    public readonly purpose = 'Identifies nodes that act as structural bridges between distinct boundaries.';

    public evaluate(snapshot: ReasoningSnapshot): Finding[] {
        const findings: Finding[] = [];
        
        const strengthEvidence = snapshot.getAllEvidence().filter(
            (e): e is IBoundaryStrengthEvidence => e.category === EvidenceCategory.BOUNDARY_STRENGTH
        );

        // Find bottlenecks: If two communities communicate through a very small number of nodes, those are crossers.
        for (const strength of strengthEvidence) {
            const meta = strength.metadata;
            // If there's a strong boundary (many edges) but very few nodes facilitating it, they are adapters/bridges.
            // Or if there's any crossing at all, the nodes responsible are crossing the boundary.
            if (meta.crossingEdgeCount > 0 && meta.bridgeNodeIds.length > 0) {
                // If the number of bridge nodes is small compared to the edge count, it's a structural bottleneck (Adapter)
                const isBottleneck = meta.bridgeNodeIds.length <= 3 && meta.crossingEdgeCount >= meta.bridgeNodeIds.length;
                
                // We emit a finding for the bridge nodes
                findings.push({
                    id: `f-cross-${meta.communityA}-${meta.communityB}`,
                    type: 'BOUNDARY_CROSSER',
                    confidence: isBottleneck ? 0.9 : 0.6,
                    evidenceIds: [strength.id],
                    ruleId: this.id,
                    summary: `Identified bridge nodes between ${meta.communityA} and ${meta.communityB}.`,
                    explanation: `These nodes facilitate ${meta.crossingEdgeCount} edges crossing the boundary.`,
                    targetType: 'NODE',
                    targetIds: meta.bridgeNodeIds
                });
            }
        }

        return findings;
    }
}
