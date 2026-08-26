import { ArchitecturalEvidence } from '../evidence/ArchitecturalEvidence';

export interface Constraint {
    type: string;
    description: string;
}

export interface RefactorConstraintFinding {
    nodeId: string;
    constraints: Constraint[];
    evidenceReferences: string[];
}

/**
 * v0.3.34.32 Architectural Reasoning Layer
 * 
 * Refactor Constraint Engine
 * 목표: 대상 노드를 "리팩토링/분리해도 되는지" 묻지 않고, "왜 분리하면 안 되는지(Constraints)"를 도출합니다.
 * 주의: "CORE_COMPONENT", "CRITICAL_MODULE" 등의 해석적(주관적) 토큰 생성을 엄격히 금지하며,
 * 반드시 Evidence의 특정 지표에 1:1 대응하는 팩트 토큰(예: HIGH_PROPAGATION)만을 추출합니다.
 */
export class RefactorAnalyzer {
    public analyze(evidences: ArchitecturalEvidence[]): RefactorConstraintFinding[] {
        const findings: RefactorConstraintFinding[] = [];

        for (const evidence of evidences) {
            const constraints: Constraint[] = [];
            const references: string[] = [];

            // 1. High Propagation Constraint
            // 기준: blastRadius가 존재하고 5 이상일 경우
            if (evidence.blastRadius && evidence.blastRadius >= 5) {
                constraints.push({
                    type: 'HIGH_PROPAGATION',
                    description: `blastRadius is ${evidence.blastRadius}`
                });
                references.push(`blastRadius: ${evidence.sources['blastRadius'] || 'Graph Engine'}`);
            }

            // 2. High Inbound Dependency Constraint
            // 기준: fanIn이 3 이상일 경우
            if (evidence.fanIn >= 3) {
                constraints.push({
                    type: 'HIGH_INBOUND_DEPENDENCY',
                    description: `fanIn is ${evidence.fanIn}`
                });
                references.push(`fanIn: ${evidence.sources['fanIn'] || 'Graph Engine'}`);
            }

            // 3. High Corridor Participation Constraint
            // 기준: crossBoundaryDependencies가 있고 fanIn/fanOut 모두 존재할 때 (임시 추정)
            // 실제로는 Phase 5의 CorridorBuilder 출력을 주입받아 판별하는 것이 정확하나, 
            // 현재 독립 실행을 위해 Evidence에서 직접 유추합니다.
            if (evidence.fanIn > 0 && evidence.fanOut > 0 && evidence.crossBoundaryDependencies && evidence.crossBoundaryDependencies.length > 0) {
                constraints.push({
                    type: 'HIGH_CORRIDOR_PARTICIPATION',
                    description: `Node participates in cross-boundary structural flows`
                });
                references.push(`crossBoundaryDependencies: ${evidence.sources['crossBoundaryDependencies'] || 'Boundary Engine'}`);
            }

            // 4. Singleton Constraint
            if (evidence.constraintHints && evidence.constraintHints.singletonPatternDetected) {
                constraints.push({
                    type: 'SINGLETON_CONSTRAINT',
                    description: `singletonPatternDetected is true`
                });
                references.push(`singletonPatternDetected: ${evidence.sources['singletonPatternDetected'] || 'Boundary Engine'}`);
            }

            // 5. No Replacement Availability Constraint
            if (evidence.constraintHints && evidence.constraintHints.replacementCandidates === 0 && evidence.fanIn > 0) {
                constraints.push({
                    type: 'ZERO_REPLACEMENT_CANDIDATES',
                    description: `replacementCandidates is 0 with active dependents`
                });
                references.push(`replacementCandidates: ${evidence.sources['replacementCandidates'] || 'Boundary Engine'}`);
            }

            findings.push({
                nodeId: evidence.nodeId,
                constraints: constraints,
                evidenceReferences: references
            });
        }

        return findings;
    }
}
