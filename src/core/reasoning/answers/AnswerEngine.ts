import { IAnswer, IAnswerAggregator } from './Answer';
import { Finding } from '../rules/Rule';
import { ReasoningSnapshot } from '../snapshot/ReasoningSnapshot';

export class AnswerEngine {
    private aggregators: Map<string, IAnswerAggregator> = new Map();

    public register(aggregator: IAnswerAggregator): void {
        this.aggregators.set(aggregator.questionId, aggregator);
    }

    public execute(snapshot: ReasoningSnapshot, findings: Finding[]): IAnswer[] {
        const answers: IAnswer[] = [];

        for (const aggregator of this.aggregators.values()) {
            try {
                const answer = aggregator.aggregate(snapshot, findings);
                if (answer) {
                    answers.push(answer);
                }
            } catch (error) {
                console.error(`Error aggregating answer for ${aggregator.questionId}:`, error);
            }
        }

        return answers;
    }
}
