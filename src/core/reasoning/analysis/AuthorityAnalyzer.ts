import { ReasoningSnapshot } from '../snapshot/ReasoningSnapshot';
import { Finding } from '../rules/Rule';
import { GraphModel } from '../../GraphModel';

export class AuthorityAnalyzer {
    public analyze(snapshot: ReasoningSnapshot, findings: Finding[], graph?: GraphModel): ReasoningSnapshot {
        return snapshot;
    }
}
