import { ArchitecturalEvidence } from '../evidence/ArchitecturalEvidence';

export interface OwnershipFinding {
    nodeId: string;
    ownershipSignals: string[];
    confidenceReasoning: string[];
    evidenceReferences: string[];
}

/**
 * v0.3.34.32 Architectural Reasoning Layer
 * 
 * Ownership Analyzer
 * 목표: "어디에 소속되어 어떠한 역할/책임을 지는가?"에 대한 시그널 수집.
 * 주의: "PRIMARY_OWNER"와 같은 최종 결론(Conclusion)은 내리지 않으며,
 * 오직 발견된 시그널(Signal)과 근거(Evidence References)만을 반환합니다.
 */
export class OwnershipAnalyzer {
    public analyze(evidences: ArchitecturalEvidence[]): OwnershipFinding[] {
        const findings: OwnershipFinding[] = [];

        for (const evidence of evidences) {
            const signals: string[] = [];
            const reasoning: string[] = [];
            const references: string[] = [];

            // 1. Boundary Alignment Signals
            if (evidence.boundaryId) {
                if (evidence.constraintHints.boundaryRootCount && evidence.constraintHints.boundaryRootCount > 0) {
                    signals.push('Boundary Root Participation');
                    reasoning.push('Node matches Boundary Root heuristic.');
                    references.push(`boundaryRootCount: ${evidence.sources['boundaryRootCount'] || 'Boundary Engine'}`);
                } else {
                    signals.push('Boundary Internal Alignment');
                    reasoning.push('Node has no outbound boundary interfaces.');
                    references.push(`boundaryId: ${evidence.sources['boundaryId'] || 'Boundary Engine'}`);
                }
            }

            // 2. Cross Boundary Coordination
            if (evidence.crossBoundaryDependencies && evidence.crossBoundaryDependencies.length > 0) {
                signals.push('Cross Boundary Coordination');
                reasoning.push(`Node has cross-boundary dependencies with ${evidence.crossBoundaryDependencies.length} boundaries.`);
                references.push(`crossBoundaryDependencies: ${evidence.sources['crossBoundaryDependencies'] || 'Boundary Engine'}`);
            }

            // 3. Semantic Role Concentration
            let activeRoleCount = 0;
            for (const value of Object.values(evidence.roleHints)) {
                if (value === true) activeRoleCount++;
            }
            if (activeRoleCount >= 2) {
                signals.push('Boundary Responsibility Concentration');
                reasoning.push(`Node matches ${activeRoleCount} distinct semantic role heuristics.`);
                references.push(`roleHints: ${evidence.sources['hasLifecycleControl'] || 'Semantic Engine'}`);
            }

            if (signals.length > 0) {
                findings.push({
                    nodeId: evidence.nodeId,
                    ownershipSignals: signals,
                    confidenceReasoning: reasoning,
                    evidenceReferences: references
                });
            }
        }

        return findings;
    }
}
