import { ArchitecturalEvidence } from '../evidence/ArchitecturalEvidence';

export interface DominanceFinding {
    nodeId: string;
    dominanceSignals: string[];
    confidenceReasoning: string[];
    evidenceReferences: string[];
}

/**
 * v0.3.34.32 Architectural Reasoning Layer
 * 
 * Dominance Analyzer
 * 목표: "이 노드가 미치는 구조적 확산 범위(영향력)는 어떠한가?"에 대한 시그널 수집.
 * 주의: "DOMINANCE 95점"과 같이 PageRank식 점수화나 결론(Conclusion)을 내리지 않으며,
 * 오직 발견된 지배력/제약 시그널(Signal)과 근거(Evidence References)만을 반환합니다.
 */
export class DominanceAnalyzer {
    public analyze(evidences: ArchitecturalEvidence[]): DominanceFinding[] {
        const findings: DominanceFinding[] = [];

        for (const evidence of evidences) {
            const signals: string[] = [];
            const reasoning: string[] = [];
            const references: string[] = [];

            // 1. Blast Radius & Propagation
            if (evidence.blastRadius && evidence.blastRadius >= 5) {
                signals.push('Wide Blast Radius');
                reasoning.push(`Node blast radius propagates to ${evidence.blastRadius} downstream dependents.`);
                references.push(`blastRadius: ${evidence.sources['blastRadius'] || 'Graph Engine'}`);
            }

            // 2. Structural Dependency Density
            const dependencyDensity = evidence.fanIn + evidence.fanOut;
            if (dependencyDensity >= 10) {
                signals.push('High Structural Dependency Density');
                reasoning.push(`Node has ${dependencyDensity} total dependency edges.`);
                references.push(`fanIn/fanOut: Graph Engine`);
            }

            // 3. Boundary Spanning Presence
            if (evidence.boundaryInboundPressure && evidence.boundaryInboundPressure > 0) {
                signals.push('Boundary Spanning Presence');
                reasoning.push(`Node inbound boundary pressure is ${evidence.boundaryInboundPressure}.`);
                references.push(`boundaryInboundPressure: ${evidence.sources['boundaryInboundPressure'] || 'Boundary Engine'}`);
            }

            // 4. Low Replacement Availability (Dominance through lack of alternatives)
            if (evidence.constraintHints.replacementCandidates === 0 && (evidence.fanIn > 0 || (evidence.blastRadius && evidence.blastRadius > 0))) {
                signals.push('High Dependency Lock-In');
                reasoning.push('Node has structural influence with 0 replacement candidates.');
                references.push(`replacementCandidates: ${evidence.sources['replacementCandidates'] || 'Boundary Engine'}`);
            }

            if (signals.length > 0) {
                findings.push({
                    nodeId: evidence.nodeId,
                    dominanceSignals: signals,
                    confidenceReasoning: reasoning,
                    evidenceReferences: references
                });
            }
        }

        return findings;
    }
}
