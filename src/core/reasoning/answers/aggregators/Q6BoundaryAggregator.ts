import { IAnswer, IAnswerAggregator, IAnswerItem } from '../Answer';
import { Finding } from '../../rules/Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';

export class Q6BoundaryAggregator implements IAnswerAggregator {
    public readonly questionId = 'Q6';

    public aggregate(snapshot: ReasoningSnapshot, findings: Finding[]): IAnswer | null {
        const boundaryFindings = findings.filter(f => f.type === 'BOUNDARY' || f.type === 'BOUNDARY_ISLAND');
        const crosserFindings = findings.filter(f => f.type === 'BOUNDARY_CROSSER');

        if (boundaryFindings.length === 0 && crosserFindings.length === 0) return null;

        const items: IAnswerItem[] = [];

        // Aggregate Boundaries
        for (const b of boundaryFindings) {
            const isIsland = b.type === 'BOUNDARY_ISLAND';
            items.push({
                targetId: `Group[${b.targetIds.length} nodes]`,
                score: b.confidence,
                explanation: isIsland 
                    ? `Isolated Island with ${b.targetIds.length} nodes. Highly decoupled.`
                    : `Cohesive structural Boundary with ${b.targetIds.length} nodes (Modularity: ${(b.confidence * 100).toFixed(1)}%).`,
                supportingFindings: [b.id],
                supportingEvidence: b.evidenceIds
            });
        }

        // Aggregate Crossers
        for (const c of crosserFindings) {
            items.push({
                targetId: c.targetIds.join(', '),
                score: c.confidence,
                explanation: `Acts as a Boundary Crosser (Adapter/Bridge). ${c.explanation}`,
                supportingFindings: [c.id],
                supportingEvidence: c.evidenceIds
            });
        }

        // Sort by confidence
        items.sort((a, b) => b.score - a.score);

        return {
            questionId: this.questionId,
            questionText: '시스템 경계는 어디인가? (Where are the boundaries?)',
            summary: `Identified ${boundaryFindings.length} Boundaries and ${crosserFindings.length} Crossers based on structural topology.`,
            items,
            confidence: items.length > 0 ? items[0].score : 0
        };
    }
}
