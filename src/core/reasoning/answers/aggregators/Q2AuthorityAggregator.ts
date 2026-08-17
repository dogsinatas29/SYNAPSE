import { IAnswer, IAnswerAggregator, IAnswerItem } from '../Answer';
import { Finding } from '../../rules/Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';

export class Q2AuthorityAggregator implements IAnswerAggregator {
    public readonly questionId = 'Q2';

    public aggregate(snapshot: ReasoningSnapshot, findings: Finding[]): IAnswer | null {
        const authorities = findings.filter(f => f.type === 'DOMINANT_AUTHORITY' || f.type === 'MAJOR_AUTHORITY');
        if (authorities.length === 0) return null;

        // Sort by confidence (score)
        authorities.sort((a, b) => b.confidence - a.confidence);

        const items: IAnswerItem[] = authorities.map(auth => {
            const nodeId = auth.targetIds[0];
            
            // Reconstruct semantic explanation from base findings
            const nodeFindings = findings.filter(f => f.targetIds.includes(nodeId));
            const roles = nodeFindings.filter(f => f.type.endsWith('_OWNER') || f.type === 'CONTROLLER' || f.type === 'VIEW' || f.type === 'ADAPTER').map(f => f.type);
            
            let explanation = `Classified as ${auth.type}. `;
            if (roles.length > 0) {
                explanation += `Plays structural roles: ${roles.join(', ')}. `;
            }
            
            // In a real system, we would parse reachability/density evidence here to add strings like "Reachability: 52".
            // Since we rely on the AuthorityRule's raw score logic, we reflect that score semantically.
            explanation += `Overall Authority Score: ${(auth.confidence * 100).toFixed(1)}.`;

            return {
                targetId: nodeId,
                score: auth.confidence * 100,
                explanation,
                supportingFindings: [auth.id, ...nodeFindings.map(f => f.id)],
                supportingEvidence: auth.evidenceIds
            };
        });

        return {
            questionId: this.questionId,
            questionText: '누가 시스템을 지배하는가? (Who dominates?)',
            summary: `Identified ${items.length} authorities shaping the architecture.`,
            items: items.slice(0, 10),
            confidence: items.length > 0 ? items[0].score / 100 : 0
        };
    }
}
