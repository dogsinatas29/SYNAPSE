import { ArchitecturalEvidence } from '../evidence/ArchitecturalEvidence';

export interface PropagationFinding {
    nodeId: string;
    affectedNodeCount: number;
    affectedBoundaryCount: number;
    propagationPaths: string[][];
    evidenceReferences: string[];
}

/**
 * v0.3.34.32 Architectural Reasoning Layer
 * 
 * Propagation Analyzer
 * 목표: 특정 노드의 변경이 아키텍처 상으로 어디까지 영향을 미치는지(Propagation)를 관찰합니다.
 * 주의: "이 변경은 치명적이다"와 같은 주관적 위험도 평가는 절대 하지 않으며, 
 * 오직 영향 노드 수, Boundary 수, 전파 경로(Path)만을 건조하게 추출합니다.
 */
export class PropagationAnalyzer {
    public analyze(evidences: ArchitecturalEvidence[]): PropagationFinding[] {
        const findings: PropagationFinding[] = [];
        
        // 검색을 위한 매핑
        const evidenceMap = new Map<string, ArchitecturalEvidence>();
        for (const e of evidences) {
            evidenceMap.set(e.nodeId, e);
        }

        for (const evidence of evidences) {
            // 영향력이 없는 노드는 배제 (fanOut 0 이거나 blastRadius 0)
            if (evidence.fanOut === 0 && (!evidence.blastRadius || evidence.blastRadius === 0)) continue;

            const affectedNodes = new Set<string>();
            const affectedBoundaries = new Set<string>();
            const propagationPaths: string[][] = [];

            // 1차 영향 범위 추적 (모의 시뮬레이션: 실제로는 GraphSnapshot Edge 탐색 필요)
            // 여기서는 crossBoundaryDependencies를 기반으로 1-Depth 확산을 경로로 조립합니다.
            if (evidence.crossBoundaryDependencies && evidence.crossBoundaryDependencies.length > 0) {
                for (const targetId of evidence.crossBoundaryDependencies) {
                    const targetEvidence = evidenceMap.get(targetId);
                    
                    affectedNodes.add(targetId);
                    
                    const path = [evidence.nodeId, targetId];
                    if (targetEvidence) {
                        if (targetEvidence.boundaryId) {
                            affectedBoundaries.add(targetEvidence.boundaryId);
                        }
                        
                        // 2-Depth 연쇄 확산 시뮬레이션
                        if (targetEvidence.crossBoundaryDependencies && targetEvidence.crossBoundaryDependencies.length > 0) {
                            const deeperTarget = targetEvidence.crossBoundaryDependencies[0];
                            affectedNodes.add(deeperTarget);
                            path.push(deeperTarget);
                            
                            const deeperEvidence = evidenceMap.get(deeperTarget);
                            if (deeperEvidence && deeperEvidence.boundaryId) {
                                affectedBoundaries.add(deeperEvidence.boundaryId);
                            }
                        }
                    }
                    propagationPaths.push(path);
                }
            }

            // Evidence에 명시된 blastRadius가 있을 경우 합산
            const totalAffectedNodes = Math.max(affectedNodes.size, evidence.blastRadius || 0);

            // 유의미한 전파 경로가 존재할 때만 리포트
            if (totalAffectedNodes > 0 || propagationPaths.length > 0) {
                findings.push({
                    nodeId: evidence.nodeId,
                    affectedNodeCount: totalAffectedNodes,
                    affectedBoundaryCount: affectedBoundaries.size,
                    propagationPaths: propagationPaths,
                    evidenceReferences: [
                        `blastRadius: ${evidence.sources['blastRadius'] || 'Graph Engine'}`,
                        `crossBoundaryDependencies: ${evidence.sources['crossBoundaryDependencies'] || 'Boundary Engine'}`
                    ]
                });
            }
        }

        return findings;
    }
}
