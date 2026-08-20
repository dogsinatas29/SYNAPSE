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
import { AnomalySummary, FSMAuditSummary } from '../types/schema';

export interface StateAuditResult {
    anomalySummary : AnomalySummary;
    fsmAudit       : FSMAuditSummary;
}

export class StateAuditPipeline {

    private readonly collector : AnomalyCollector;
    private readonly grammar   : TransitionGrammar;

    constructor(allNodes: any[], rawStateNodes: any[]) {
        this.collector = new AnomalyCollector(allNodes, rawStateNodes);
        this.grammar   = new TransitionGrammar();
    }

    run(nodes: any[], edges: any[]): StateAuditResult {
        // 1. State 생산
        this.collector.classifyAll(nodes, edges);
        const anomalySummary = this.collector.summarize();

        // 2. State 소비 — NodeState[] 추출 후 일관성 검사
        const nodeStates = nodes.map((n: any) => ({
            nodeId: n.id as string,
            state : this.collector.classifyNode(n),
        }));
        const fsmAudit = this.grammar.auditStateConsistency(nodeStates);

        return { anomalySummary, fsmAudit };
    }
}
