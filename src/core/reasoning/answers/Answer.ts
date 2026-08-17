import { Finding } from '../rules/Rule';
import { ReasoningSnapshot } from '../snapshot/ReasoningSnapshot';

export interface IAnswer {
    questionId: string;
    questionText: string;
    summary: string;
    items: IAnswerItem[];
    confidence: number;
}

export interface IAnswerItem {
    targetId: string;
    score: number;
    explanation: string;
    supportingFindings: string[];
    supportingEvidence: string[];
}

export interface IAnswerAggregator {
    readonly questionId: string;
    aggregate(snapshot: ReasoningSnapshot, findings: Finding[]): IAnswer | null;
}
