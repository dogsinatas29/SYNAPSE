import { IAnswer, IAnswerAggregator, IAnswerItem } from '../Answer';
import { Finding } from '../../rules/Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';
import { EvidenceCategory, IExtensionEvidence } from '../../evidence/Evidence';

export class Q4ExtensionAggregator implements IAnswerAggregator {
    public readonly questionId = 'Q4';

    public aggregate(snapshot: ReasoningSnapshot, findings: Finding[]): IAnswer | null {
        const extEvidence = snapshot.getEvidenceByCategory<IExtensionEvidence>(EvidenceCategory.EXTENSION);
        
        console.error('[Q4_INPUT]', {
            extensionPoints: extEvidence.length
        });
        
        console.log('[Q4]', extEvidence.length);
        if (extEvidence.length === 0) return null;

        const items: IAnswerItem[] = [];

        for (const ev of extEvidence) {
            const meta = ev.metadata;
            let explanation = `- ${meta.implementationCount} implementations\n`;
            
            if ((meta as any).reasons && (meta as any).reasons.length > 0) {
                explanation += (meta as any).reasons.map((r: string) => `- ${r}`).join('\n');
            } else {
                if (meta.hasRegistry) {
                    explanation += `- Registered in ${meta.registryIds?.join(', ')}\n`;
                }
                if (meta.injectedIntoCount > 0) {
                    explanation += `- Consumed by ${meta.consumerIds?.join(', ')}`;
                }
            }

            items.push({
                targetId: ev.nodeId,
                score: meta.confidence, // Strong signals bubble up
                explanation: explanation.trim(),
                supportingFindings: [],
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
