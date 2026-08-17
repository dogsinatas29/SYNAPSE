import { IAnswer, IAnswerAggregator, IAnswerItem } from '../Answer';
import { Finding } from '../../rules/Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';

export class Q3CriticalityAggregator implements IAnswerAggregator {
    public readonly questionId = 'Q3';

    public aggregate(snapshot: ReasoningSnapshot, findings: Finding[]): IAnswer | null {
        const coreFindings = findings.filter(f => f.type === 'CORE');
        const suppFindings = findings.filter(f => f.type === 'SUPPORTING');
        const utilFindings = findings.filter(f => f.type === 'UTILITY');

        if (coreFindings.length === 0 && suppFindings.length === 0 && utilFindings.length === 0) return null;

        const items: IAnswerItem[] = [];

        for (const c of coreFindings) {
            items.push({
                targetId: c.targetIds[0],
                score: 3, // Sort priority
                explanation: `[CORE PILLAR] ${c.explanation}`,
                supportingFindings: [c.id],
                supportingEvidence: c.evidenceIds
            });
        }

        for (const s of suppFindings) {
            items.push({
                targetId: s.targetIds[0],
                score: 2,
                explanation: `[SUPPORTING] ${s.explanation}`,
                supportingFindings: [s.id],
                supportingEvidence: s.evidenceIds
            });
        }

        for (const u of utilFindings) {
            items.push({
                targetId: u.targetIds[0],
                score: 1,
                explanation: `[UTILITY] ${u.explanation}`,
                supportingFindings: [u.id],
                supportingEvidence: u.evidenceIds
            });
        }

        items.sort((a, b) => b.score - a.score);

        return {
            questionId: this.questionId,
            questionText: '무엇이 핵심이고 무엇이 부수적인가? (Core vs Utility)',
            summary: `Identified ${coreFindings.length} Core Pillars, ${suppFindings.length} Supporting nodes, and ${utilFindings.length} Utilities.`,
            items,
            confidence: items.length > 0 ? 0.9 : 0
        };
    }
}
