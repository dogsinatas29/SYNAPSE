import { ArchitecturalEvidence } from '../evidence/ArchitecturalEvidence';
import { AuthorityAnalyzer } from '../analyzers/AuthorityAnalyzer';
import { OwnershipAnalyzer } from '../analyzers/OwnershipAnalyzer';
import { DominanceAnalyzer } from '../analyzers/DominanceAnalyzer';
import { ArchitecturalReasoningModel, ReasoningNode } from '../model/ArchitecturalReasoningModel';

/**
 * v0.3.34.32 Architectural Reasoning Layer
 * 
 * Pipeline Control
 * 목표: Evidence를 소비하여 3대 핵심 추론기(Authority, Ownership, Dominance)를 가동하고,
 * 그 결과를 단순 취합(Assembly)하여 ReasoningModel을 반환합니다.
 * 주의: 이 파이프라인은 절대 시그널들을 융합하여 새로운 합성 결론(예: SYSTEM_HEART)을 만들지 않습니다.
 */
export class ArchitecturalReasoningPipeline {
    private authorityAnalyzer = new AuthorityAnalyzer();
    private ownershipAnalyzer = new OwnershipAnalyzer();
    private dominanceAnalyzer = new DominanceAnalyzer();

    public run(evidences: ArchitecturalEvidence[]): ArchitecturalReasoningModel {
        // 1. 개별 Signal Collector 가동
        const authorityFindings = this.authorityAnalyzer.analyze(evidences);
        const ownershipFindings = this.ownershipAnalyzer.analyze(evidences);
        const dominanceFindings = this.dominanceAnalyzer.analyze(evidences);

        // 2. 조립(Assembly) - 합성 판단 없이 순수 취합
        const nodes: Record<string, ReasoningNode> = {};

        for (const evidence of evidences) {
            nodes[evidence.nodeId] = {
                nodeId: evidence.nodeId,
                authority: null,
                ownership: null,
                dominance: null
            };
        }

        for (const finding of authorityFindings) {
            nodes[finding.nodeId].authority = finding;
        }
        for (const finding of ownershipFindings) {
            nodes[finding.nodeId].ownership = finding;
        }
        for (const finding of dominanceFindings) {
            nodes[finding.nodeId].dominance = finding;
        }

        return {
            timestamp: Date.now(),
            nodes
        };
    }
}
