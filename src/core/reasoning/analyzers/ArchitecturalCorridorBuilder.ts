import { ArchitecturalEvidence } from '../evidence/ArchitecturalEvidence';

export interface CorridorFinding {
    corridorId: string;
    path: string[];
    crossedBoundaries: string[];
    evidenceReferences: string[];
}

/**
 * v0.3.34.32 Architectural Reasoning Layer
 * 
 * Architectural Corridor Builder
 * 목표: 아키텍처 내부의 "구조적 교통량 + Boundary 관통" 경로를 찾아냅니다.
 * 주의: 단순한 고빈도 호출(Utility)을 배제하며, 노드의 단순 나열이 아닌 흐름(Path)으로 출력합니다.
 */
export class ArchitecturalCorridorBuilder {
    public analyze(evidences: ArchitecturalEvidence[]): CorridorFinding[] {
        const findings: CorridorFinding[] = [];
        const potentialCorridorNodes = new Map<string, ArchitecturalEvidence>();

        // 1. 1차 필터링: 단순 Utility 배제 및 잠재적 병목 노드 수집
        for (const evidence of evidences) {
            const hasSemanticRole = Object.values(evidence.roleHints).some(val => val === true);
            const crossesBoundary = evidence.crossBoundaryDependencies && evidence.crossBoundaryDependencies.length > 0;
            const hasTraffic = evidence.fanIn > 0 && evidence.fanOut > 0; // 유틸리티(fanOut=0) 배제

            if (hasSemanticRole && crossesBoundary && hasTraffic) {
                potentialCorridorNodes.set(evidence.nodeId, evidence);
            }
        }

        // 2. 경로(Path) 재구성 (모의 로직: 실제로는 Graph Edges를 통한 위상 정렬 필요)
        // 여기서는 필터링된 노드들의 crossBoundary 연결망을 바탕으로 Corridor 병합을 시뮬레이션합니다.
        const visited = new Set<string>();

        for (const [nodeId, evidence] of potentialCorridorNodes.entries()) {
            if (visited.has(nodeId)) continue;

            const path: string[] = [nodeId];
            const crossedBoundaries = new Set<string>();
            if (evidence.boundaryId) crossedBoundaries.add(evidence.boundaryId);
            visited.add(nodeId);

            // 단순 연결 추적 (Forward)
            let currentEvidence = evidence;
            while (currentEvidence && currentEvidence.crossBoundaryDependencies) {
                const nextNodeId = currentEvidence.crossBoundaryDependencies.find(target => 
                    potentialCorridorNodes.has(target) && !visited.has(target)
                );

                if (nextNodeId) {
                    const nextEvidence = potentialCorridorNodes.get(nextNodeId)!;
                    path.push(nextNodeId);
                    if (nextEvidence.boundaryId) crossedBoundaries.add(nextEvidence.boundaryId);
                    visited.add(nextNodeId);
                    currentEvidence = nextEvidence;
                } else {
                    break;
                }
            }

            // Path가 성립하는지 확인 (2개 이상의 Boundary를 관통하는가?)
            if (path.length >= 2 && crossedBoundaries.size >= 2) {
                findings.push({
                    corridorId: `CORRIDOR_${findings.length + 1}`,
                    path: path,
                    crossedBoundaries: Array.from(crossedBoundaries),
                    evidenceReferences: [
                        `crossBoundaryDependencies: Boundary Engine`,
                        `fanIn/fanOut Traffic: Graph Engine`,
                        `roleHints (Utility Exclusion): Semantic Engine`
                    ]
                });
            }
        }

        return findings;
    }
}
