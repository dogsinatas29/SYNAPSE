import { IAnswer, IAnswerAggregator, IAnswerItem } from '../Answer';
import { Finding } from '../../rules/Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';

export class Q7DataFlowAggregator implements IAnswerAggregator {
    public readonly questionId = 'Q7';

    public aggregate(snapshot: ReasoningSnapshot, findings: Finding[]): IAnswer | null {
        const dataPipes = findings.filter(f => f.type === 'DATA_PIPELINE');
        if (dataPipes.length === 0) return null;

        dataPipes.sort((a, b) => b.confidence - a.confidence);

        const items: IAnswerItem[] = dataPipes.map(pipe => {
            const pathStr = pipe.targetIds.join(' -> ');
            return {
                targetId: pathStr,
                score: pipe.confidence,
                explanation: `Traces explicit state and payload transfer across ${pipe.targetIds.length} nodes with a confidence of ${(pipe.confidence * 100).toFixed(1)}%.`,
                supportingFindings: [pipe.id],
                supportingEvidence: pipe.evidenceIds
            };
        });

        return {
            questionId: this.questionId,
            questionText: '데이터는 어떻게 흐르는가? (Data Flow)',
            summary: `Identified ${items.length} primary data pipelines tracing state movement.`,
            items: items.slice(0, 15), // Return top 15 paths
            confidence: items[0].score
        };
    }
}
