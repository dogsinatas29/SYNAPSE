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
    MAX_IMPACT_NODES,
    IGraphView
} from '../types/schema';

export class FailurePropagator {

    /**
     * 노드 리스트와 엣지 정보를 바탕으로 결함 전파 보고서를 생성한다.
     * @param nodeStates 현재 상태가 매핑된 노드 목록
     * @param edges 그래프 엣지 목록
     * @param overlay 가상 그래프 레이어 (Topology Mutation 시 적용)
     */
    propagate(nodeStates: { nodeId: string; state: any }[], edges: any[], overlay?: IGraphView): FailurePropagationReport {
        const stateMap = new Map<string, HealthState>();
        for (const n of nodeStates) {
            stateMap.set(n.nodeId, n.state.health);
        }

        // 인접 리스트 (source가 무너지면 target이 영향을 받음)
        const adj = new Map<string, string[]>();
        for (const e of edges) {
            if (overlay && !overlay.isEdgeActive(e.source, e.target)) continue;
            
            if (!adj.has(e.source)) adj.set(e.source, []);
            adj.get(e.source)!.push(e.target);
        }
        
        // 추가된 가상 엣지가 있다면 반영
        if (overlay) {
            for (const added of overlay.addedEdges) {
                if (!adj.has(added.source)) adj.set(added.source, []);
                adj.get(added.source)!.push(added.target);
            }
        }

        let totalDirect = 0;
        let totalIndirect = 0;
        let totalCascade = 0;
        const impacts: FailureImpact[] = [];

        // 이미 결함이 있는 노드를 출발점(Source)으로 삼아 파급력을 BFS 계산
        for (const [sourceNodeId, health] of stateMap.entries()) {
            if (health === HealthState.HEALTHY) continue;
            if (overlay && !overlay.isNodeAlive(sourceNodeId)) continue; // 폭파된 노드는 시발점이 되지 않음

            const impact = this._calculateImpact(sourceNodeId, adj, stateMap, overlay);
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

    private _calculateImpact(sourceNodeId: string, adj: Map<string, string[]>, stateMap: Map<string, HealthState>, overlay?: IGraphView): FailureImpact {
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
                
                // Overlay에서 지워진 노드라면 영향 전파 경로 단절
                if (overlay && !overlay.isNodeAlive(targetNode)) continue;

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
