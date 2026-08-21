import { FailurePropagator } from '../FailurePropagator';
import { FailurePropagationReport, HealthState } from '../../types/schema';
import { TopologyOverlay } from './TopologyOverlay';
import { SimulationTargetSelector } from './SimulationTargetSelector';
import { SimulationTargetPolicy, TargetPolicyType } from '../../types/schema';

export interface TopologyMutationReport {
    targetNodeId: string;
    mutatedReport: FailurePropagationReport;
    deltaImpact: number; // 변이로 인해 증가/감소한 임팩트 수
}

export class TopologyMutator {
    private propagator: FailurePropagator;

    constructor() {
        this.propagator = new FailurePropagator();
    }

    /**
     * Top N 임팩트 노드들을 각각 하나씩 제거(REMOVE_NODE)해보면서 파급력의 변화를 측정한다.
     * Graph Clone 원칙에 따라, 원본 배열을 변형하지 않고 Overlay를 사용한다.
     */
    simulateNodeRemovals(
        nodes: any[], 
        edges: any[], 
        baseReport: FailurePropagationReport,
        nodeStates: { nodeId: string; state: any }[],
        policy: SimulationTargetPolicy
    ): TopologyMutationReport[] {
        if (!policy) {
            throw new Error("SimulationTargetPolicy is required. The Simulation Layer cannot run without an explicit policy.");
        }

        const targetNodes = SimulationTargetSelector.getTopImpactNodes(baseReport, policy);
        const mutationReports: TopologyMutationReport[] = [];

        const baseTotalImpact = baseReport.totalDirect + baseReport.totalIndirect + baseReport.totalCascade;

        for (const targetId of targetNodes) {
            // Compute: 오버레이 생성 후 대상 노드 삭제 시뮬레이션
            const overlay = new TopologyOverlay();
            overlay.removedNodes.add(targetId);

            const mutatedReport = this.propagator.propagate(nodeStates, edges, overlay);
            
            const mutatedTotalImpact = mutatedReport.totalDirect + mutatedReport.totalIndirect + mutatedReport.totalCascade;
            const deltaImpact = mutatedTotalImpact - baseTotalImpact;

            // Report: 결과 저장
            mutationReports.push({
                targetNodeId: targetId,
                mutatedReport,
                deltaImpact
            });
            // Discard: overlay 참조는 루프가 끝나면 버려지므로 GC 타겟이 됨. (Compute -> Report -> Discard)
        }

        return mutationReports;
    }
}
