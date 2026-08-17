import { ReasoningSnapshot } from '../snapshot/ReasoningSnapshot';

export interface Finding {
    id: string;
    type: string;
    confidence: number;
    evidenceIds: string[];
    ruleId: string;
    summary: string;
    explanation: string;
    
    // Extensibility for Path-based and Group-based reasoning
    targetType: 'NODE' | 'PATH' | 'GROUP';
    targetIds: string[];
}


export interface IRule {
    readonly id: string;
    readonly name: string;
    readonly purpose: string;

    evaluate(snapshot: ReasoningSnapshot): Finding[];
}
