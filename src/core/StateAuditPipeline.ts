/**
 * StateAuditPipeline — v0.3.34.25
 *
 * 역할: 파이프 조율자. 로직 없음.
 *
 *   AnomalyCollector  →  NodeState[]        (State 생산)
 *   TransitionGrammar →  FSMAuditSummary    (State 소비)
 *
 * AnomalyCollector와 TransitionGrammar는 서로를 모른다.
 * 이 파일만 둘을 연결한다.
 */

import { AnomalyCollector } from './AnomalyCollector';
import { TransitionGrammar } from './TransitionGrammar';
import { FailurePropagator } from './FailurePropagator';
import { AnomalySummary, FSMAuditSummary, FailurePropagationReport, TargetPolicyType, SimulationTargetPolicy } from '../types/schema';
import { TopologyMutator, TopologyMutationReport } from './simulation/TopologyMutator';

export interface StateAuditResult {
    anomalySummary     : AnomalySummary;
    fsmAudit           : FSMAuditSummary;
    failurePropagation : FailurePropagationReport;
    topologyMutations  : TopologyMutationReport[];
    memoryMetrics      : {
        baseline         : number;
        afterAnomaly     : number;
        afterFsmAudit    : number;
        afterPropagation : number;
        afterMutation    : number;
    };
}

export class StateAuditPipeline {

    private readonly collector  : AnomalyCollector;
    private readonly grammar    : TransitionGrammar;
    private readonly propagator : FailurePropagator;
    private readonly mutator    : TopologyMutator;

    constructor(allNodes: any[], rawStateNodes: any[]) {
        this.collector  = new AnomalyCollector(allNodes, rawStateNodes);
        this.grammar    = new TransitionGrammar();
        this.propagator = new FailurePropagator();
        this.mutator    = new TopologyMutator();
    }

    run(nodes: any[], edges: any[]): StateAuditResult {
        const getHeapMB = () => process.memoryUsage().heapUsed / 1024 / 1024;
        const memoryMetrics = { 
            baseline: getHeapMB(), 
            afterAnomaly: 0, 
            afterFsmAudit: 0, 
            afterPropagation: 0,
            afterMutation: 0
        };

        // 1. 상태 분류 (생성)
        this.collector.classifyAll(nodes, edges);
        const anomalySummary = this.collector.summarize();
        memoryMetrics.afterAnomaly = getHeapMB();

        // 2. State 소비 — NodeState[] 추출 후 일관성 검사
        const nodeStates = nodes.map((n: any) => ({
            nodeId: n.id as string,
            state : this.collector.classifyNode(n),
        }));
        const fsmAudit = this.grammar.auditStateConsistency(nodeStates);
        memoryMetrics.afterFsmAudit = getHeapMB();

        // 3. 결함 전파 계산 (계산 후 즉시 폐기 원칙에 따라 Report만 반환)
        const failurePropagation = this.propagator.propagate(nodeStates, edges);
        memoryMetrics.afterPropagation = getHeapMB();

        // 4. 가상 토폴로지 시뮬레이션 (Clone 금지, Overlay 적용)
        const policy: SimulationTargetPolicy = { type: TargetPolicyType.TOP_N, value: 5 };
        const topologyMutations = this.mutator.simulateNodeRemovals(
            nodes, edges, failurePropagation, nodeStates, policy
        );
        memoryMetrics.afterMutation = getHeapMB();

        return { anomalySummary, fsmAudit, failurePropagation, topologyMutations, memoryMetrics };
    }
}
