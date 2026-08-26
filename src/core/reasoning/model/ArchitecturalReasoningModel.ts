import { AuthorityFinding } from '../analyzers/AuthorityAnalyzer';
import { OwnershipFinding } from '../analyzers/OwnershipAnalyzer';
import { DominanceFinding } from '../analyzers/DominanceAnalyzer';

export interface ReasoningNode {
    nodeId: string;
    authority: AuthorityFinding | null;
    ownership: OwnershipFinding | null;
    dominance: DominanceFinding | null;
}

export interface ArchitecturalReasoningModel {
    timestamp: number;
    nodes: Record<string, ReasoningNode>;
}
