import { IAnswer, IAnswerAggregator, IAnswerItem } from '../Answer';
import { Finding } from '../../rules/Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';
import { EvidenceCategory, IExtensionEvidence } from '../../evidence/Evidence';

export class Q4ExtensionAggregator implements IAnswerAggregator {
    public readonly questionId = 'Q4';

    public aggregate(snapshot: ReasoningSnapshot, findings: Finding[]): IAnswer | null {
        const extFindings = findings.filter(f => f.type === 'EXTENSION_POINT');
        if (extFindings.length === 0) return null;

        const items: IAnswerItem[] = [];

        for (const f of extFindings) {
            // Find the backing evidence to extract the rich data
            const ev = snapshot.getAllEvidence().find(
                e => e.id === f.evidenceIds[0] && e.category === EvidenceCategory.EXTENSION
            ) as IExtensionEvidence | undefined;

            if (!ev) continue;

            const meta = ev.metadata;
            let explanation = `- ${meta.implementationCount} implementations\n`;
            
            if (meta.hasRegistry) {
                explanation += `- Registered in ${meta.registryIds.join(', ')}\n`;
            }
            if (meta.injectedIntoCount > 0) {
                explanation += `- Consumed by ${meta.consumerIds.join(', ')}`;
            }

            items.push({
                targetId: f.targetIds[0],
                score: meta.confidence, // Strong signals bubble up
                explanation: explanation.trim(),
                supportingFindings: [f.id],
                supportingEvidence: [ev.id]
            });
        }

        // Sort by confidence (Registry > Collection Injection > Weak)
        items.sort((a, b) => b.score - a.score);

        return {
            questionId: this.questionId,
            questionText: '어디서 확장해야 하나? (Where are the Extension Points?)',
            summary: `Identified ${items.length} Designed Extension Points.`,
            items,
            confidence: items.length > 0 ? items[0].score : 0
        };
    }
}
