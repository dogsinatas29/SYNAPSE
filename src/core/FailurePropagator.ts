/**
 * FailurePropagator — v0.3.34.26
 *
 * 역할: 정적 의존성(Edge)을 통한 결함 전파 영향(Impact) 계산.
 * Invariant: 상태 변화 시뮬레이션 금지. 
 *            "A가 제거되면 누가 영향을 받는가?"만 답한다.
 *            (v0.3.34.27 Topology Mutation의 책임을 침범하지 않음)
 */

import {
    HealthState,
    FailureImpact,
    FailurePropagationReport,
    MAX_PROPAGATION_DEPTH,
    MAX_IMPACT_NODES
} from '../types/schema';

export class FailurePropagator {

    /**
     * 노드 리스트와 엣지 정보를 바탕으로 결함 전파 보고서를 생성한다.
     * @param nodeStates 현재 상태가 매핑된 노드 목록
     * @param edges 그래프 엣지 목록
     */
    propagate(nodeStates: { nodeId: string; state: any }[], edges: any[]): FailurePropagationReport {
        const stateMap = new Map<string, HealthState>();
        for (const n of nodeStates) {
            stateMap.set(n.nodeId, n.state.health);
        }

        // 인접 리스트 (source가 무너지면 target이 영향을 받음. 즉 의존성의 역방향이거나, Owns 등)
        // Failure 전파는 의존성 그래프의 특정 방향을 따라가지만, 
        // 여기서는 단순화를 위해 A->B 엣지가 있으면 A가 B에게 영향을 줄 수 있다고 가정.
        const adj = new Map<string, string[]>();
        for (const e of edges) {
            if (!adj.has(e.source)) adj.set(e.source, []);
            adj.get(e.source)!.push(e.target);
        }

        let totalDirect = 0;
        let totalIndirect = 0;
        let totalCascade = 0;
        const impacts: FailureImpact[] = [];

        // 이미 결함이 있는 노드를 출발점(Source)으로 삼아 파급력을 BFS 계산
        for (const [sourceNodeId, health] of stateMap.entries()) {
            if (health === HealthState.HEALTHY) continue;

            const impact = this._calculateImpact(sourceNodeId, adj, stateMap);
            if (impact.impactedNodes.length > 0) {
                impacts.push(impact);
                totalDirect += impact.directImpact;
                totalIndirect += impact.indirectImpact;
                totalCascade += impact.cascadeImpact;
            }
        }

        return {
            totalDirect,
            totalIndirect,
            totalCascade,
            totalNodes: nodeStates.length,
            impacts
        };
    }

    private _calculateImpact(sourceNodeId: string, adj: Map<string, string[]>, stateMap: Map<string, HealthState>): FailureImpact {
        const visited = new Set<string>();
        visited.add(sourceNodeId);

        let directImpact = 0;
        let indirectImpact = 0;
        let cascadeImpact = 0;
        const impactedNodes: string[] = [];

        // BFS 큐 { nodeId, depth }
        const queue: { nodeId: string; depth: number }[] = [];
        queue.push({ nodeId: sourceNodeId, depth: 0 });

        let head = 0;
        while (head < queue.length) {
            if (impactedNodes.length >= MAX_IMPACT_NODES) break;

            const curr = queue[head++];
            if (curr.depth >= MAX_PROPAGATION_DEPTH) continue;

            const outgoing = adj.get(curr.nodeId) || [];
            for (const targetNode of outgoing) {
                if (impactedNodes.length >= MAX_IMPACT_NODES) break;
                if (visited.has(targetNode)) continue;
                
                // 타겟 노드가 이미 결함 상태라면 전파 영향으로 세지 않음 (순수 전파만 추적)
                if (stateMap.get(targetNode) !== HealthState.HEALTHY) continue;

                visited.add(targetNode);
                impactedNodes.push(targetNode);
                const nextDepth = curr.depth + 1;

                if (nextDepth === 1) directImpact++;
                else if (nextDepth === 2) indirectImpact++;
                else cascadeImpact++;

                queue.push({ nodeId: targetNode, depth: nextDepth });
            }
        }

        return {
            sourceNodeId,
            directImpact,
            indirectImpact,
            cascadeImpact,
            impactedNodes
        };
    }
}
