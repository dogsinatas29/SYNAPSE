import { GraphModel } from '../GraphModel';
import { Node, Edge, Cluster } from '../../types/schema';
import { ClusterBridgeAnalyzer } from './ClusterBridgeAnalyzer';
import { TarjanSCC } from './reasoning/TarjanSCC';
import { CriticalBridge } from './types';

export interface DemolitionTarget {
    tier: 0 | 1 | 2 | 3;
    reason: string;
    targetEdgeIds: string[];
    rootCauseId: string;
}

export class TargetSelector {
    /**
     * 100만 개의 엣지 중 시뮬레이터에 던져줄 핵심 급소(Demolition Targets) 20~50개를 선별합니다.
     */
    public static selectTargets(nodes: Node[], edges: Edge[], clusters: Cluster[], criticalBridges?: CriticalBridge[], visibleClusterIds?: string[]): DemolitionTarget[] {
        const targets: DemolitionTarget[] = [];

        // 1. Tier 1: Cluster Bridges (모듈 간 강결합 지점)
        // [v0.3.35] Fix falsy bug: empty array means 0 visible clusters, not fallback to all
        const targetClusterIds = visibleClusterIds !== undefined 
            ? visibleClusterIds 
            : (clusters ? clusters.map(c => c.id) : []);
        console.log('[TARGET_SELECTOR_SCOPE]', { visibleClusters: visibleClusterIds?.length || 0, targetClusters: targetClusterIds.length });
        const bridges = ClusterBridgeAnalyzer.analyzeVisibleClusters(targetClusterIds, nodes, edges, clusters);
        // 결합도(Strength)가 가장 높은 상위 10개 브릿지 선별
        const topBridges = bridges.sort((a: any, b: any) => b.couplingStrength - a.couplingStrength).slice(0, 10);
        
        console.log(`[T1] bridgeCount=${topBridges.length}`);
        
        topBridges.forEach((bridge: any) => {
            // [v0.3.34.8] Bridge edgeIds 제한: 상위 10개만 포함 (전체 연결 제거 방지)
            const limitedEdgeIds = (bridge.edgeIds || []).slice(0, 10);
            console.log('[T1_BRIDGE]', { source: bridge.sourceCluster, target: bridge.targetCluster, totalEdges: bridge.edgeIds?.length || 0, limitedEdges: limitedEdgeIds.length });
            targets.push({
                tier: 1,
                reason: `Strong Cluster Bridge: ${bridge.sourceCluster} -> ${bridge.targetCluster} (Strength: ${bridge.couplingStrength})`,
                targetEdgeIds: limitedEdgeIds,
                rootCauseId: `bridge:${bridge.sourceCluster}↔${bridge.targetCluster}`
            });
        });

        // 2. Tier 2: SCC Chokepoints (순환 참조 핵심 고리)
        // 기존 InterventionEngine이 발견한 확실한 Chokepoint들을 우선적으로 타겟팅
        if (criticalBridges && criticalBridges.length > 0) {
            console.log(`[T2] criticalCount=${criticalBridges.length}`);
            criticalBridges.slice(0, 10).forEach(cb => {
                // Find the exact edge ID between sourceId and targetId
                const edge = edges.find(e => e.from === cb.sourceId && e.to === cb.targetId);
                if (edge) {
                    targets.push({
                        tier: 2,
                        reason: `Proven SCC Chokepoint: ${cb.structuralRole} (Impact: ${cb.impact}%)`,
                        targetEdgeIds: [edge.id],
                        rootCauseId: `scc_chokepoint:${cb.sourceId}↔${cb.targetId}`
                    });
                }
            });
        } else {
            const sccs = TarjanSCC.extract({ nodes, edges } as any);
            const largestSccs = sccs.filter((s: any) => s.nodeIds.length > 2).sort((a: any, b: any) => b.nodeIds.length - a.nodeIds.length).slice(0, 5);
            
            largestSccs.forEach((scc: any) => {
                const sccNodeSet = new Set(scc.nodeIds);
                const internalEdges = edges.filter(e => sccNodeSet.has(e.from) && sccNodeSet.has(e.to));
                internalEdges.slice(0, 5).forEach(edge => {
                    targets.push({
                        tier: 2,
                        reason: `SCC Chokepoint Candidate in SCC of size ${scc.nodeIds.length}`,
                        targetEdgeIds: [edge.id],
                        rootCauseId: `scc:${scc.nodeIds.length}_chokepoint`
                    });
                });
            });
        }

        // 3. Tier 3: Hub Fan-out (대형 허브의 외부 발신 엣지)
        const fanOutMap = new Map<string, string[]>();
        edges.forEach(e => {
            if (!fanOutMap.has(e.from)) fanOutMap.set(e.from, []);
            fanOutMap.get(e.from)!.push(e.id);
        });

        const sortedFanOuts = Array.from(fanOutMap.entries()).sort((a, b) => b[1].length - a[1].length).slice(0, 5);
        sortedFanOuts.forEach(([nodeId, edgeIds]) => {
            // Fan-out이 비정상적으로 큰 허브의 엣지 묶음을 타겟팅
            targets.push({
                tier: 3,
                reason: `Massive Hub Fan-out from ${nodeId} (${edgeIds.length} edges)`,
                targetEdgeIds: edgeIds,
                rootCauseId: `hub:${nodeId}`
            });
        });

        return targets;
    }
}
