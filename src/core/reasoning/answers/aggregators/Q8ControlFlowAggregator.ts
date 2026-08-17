import { IAnswer, IAnswerAggregator, IAnswerItem } from '../Answer';
import { Finding } from '../../rules/Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';

export class Q8ControlFlowAggregator implements IAnswerAggregator {
    public readonly questionId = 'Q8';

    public aggregate(snapshot: ReasoningSnapshot, findings: Finding[]): IAnswer | null {
        const ctrlPipes = findings.filter(f => f.type === 'CONTROL_PIPELINE');
        if (ctrlPipes.length === 0) return null;

        ctrlPipes.sort((a, b) => b.confidence - a.confidence);

        const items: IAnswerItem[] = ctrlPipes.map(pipe => {
            const pathStr = pipe.targetIds.join(' -> ');
            return {
                targetId: pathStr,
                score: pipe.confidence,
                explanation: `Traces execution delegation and orchestration across ${pipe.targetIds.length} nodes with a confidence of ${(pipe.confidence * 100).toFixed(1)}%.`,
                supportingFindings: [pipe.id],
                supportingEvidence: pipe.evidenceIds
            };
        });

        return {
            questionId: this.questionId,
            questionText: '제어권은 어떻게 흐르는가? (Control Flow)',
            summary: `Identified ${items.length} primary control pipelines driving system execution.`,
            items: items.slice(0, 15),
            confidence: items[0].score
        };
    }
}
