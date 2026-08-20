/**
 * AnomalyCollector — v0.3.34.24 Architecture State Model
 *
 * 역할: 상태 판정기 (Classifier), 분석기가 아님
 *
 * 허용:
 *   classifyNode(node) → NodeState
 *   classifyReference(edge) → ReferenceState
 *   validateTransition(nodeState) → TransitionValidation
 *   summarize() → AnomalySummary
 *
 * 금지:
 *   아키텍처 패턴 추론 (MVC, EventDriven, ServiceHub 등)
 *   설계 의도(Why) 해석
 */

import {
    LifecycleState,
    HealthState,
    ViewState,
    ReferenceState,
    FSMCompleteness,
    NodeState,
    TransitionValidation,
    AnomalySummary,
} from '../types/schema';

export class AnomalyCollector {

    private readonly nodeIndex: Map<string, any>;      // 전체 그래프 노드 (id → node)
    private readonly rawStateIds: Set<string>;          // 현재 뷰 범위 노드 ID set

    private readonly nodeResults     = new Map<string, NodeState>();
    private readonly refResults      = new Map<string, ReferenceState>();
    private readonly validationResults = new Map<string, TransitionValidation>();

    constructor(allNodes: any[], rawStateNodes: any[]) {
        this.nodeIndex   = new Map(allNodes.map((n: any) => [n.id, n]));
        this.rawStateIds = new Set(rawStateNodes.map((n: any) => n.id));
    }

    // ─── 1. 노드 상태 판정 ───────────────────────────────────────────────────

    classifyNode(node: any): NodeState {
        const cached = this.nodeResults.get(node.id);
        if (cached) return cached;

        const state: NodeState = {
            lifecycle : this._inferLifecycle(node),
            health    : this._inferHealth(node),
            view      : this._inferView(node),
        };

        this.nodeResults.set(node.id, state);
        return state;
    }

    /** LifecycleState: 가용 데이터로 도달 가능한 최고 단계 추론 */
    private _inferLifecycle(node: any): LifecycleState {
        if (node.role)       return LifecycleState.CLASSIFIED;
        if (node.cluster_id) return LifecycleState.CLUSTERED;
        if (node.id)         return LifecycleState.REGISTERED;
        return LifecycleState.DISCOVERED;
    }

    /** HealthState: 실패 판정 */
    private _inferHealth(node: any): HealthState {
        if (!node || !node.id)         return HealthState.CORRUPTED;
        if (!node.cluster_id)          return HealthState.UNCLUSTERED;
        if (!node.role)                return HealthState.UNCLASSIFIED;
        return HealthState.HEALTHY;
    }

    /** ViewState: rawStateIds 기준 뷰 상태 판정 */
    private _inferView(node: any): ViewState {
        if (!this.rawStateIds.has(node.id)) return ViewState.OUT_OF_SCOPE;
        // COLLAPSED / FILTERED 는 뷰 렌더러 정보가 없으면 판정 불가 → VISIBLE
        return ViewState.VISIBLE;
    }

    // ─── 2. 참조 상태 판정 ─────────────────────────────────────────────────

    classifyReference(edge: any): ReferenceState {
        const key = `${edge.from}→${edge.to}`;
        const cached = this.refResults.get(key);
        if (cached) return cached;

        const result = this.nodeIndex.has(edge.to)
            ? ReferenceState.RESOLVED
            : ReferenceState.GHOST;

        this.refResults.set(key, result);
        return result;
    }

    // ─── 3. 전이 완전성 검증 ────────────────────────────────────────────────

    /**
     * 상태가 아닌 검증 결과.
     *
     * INCOMPLETE: lifecycle 단계가 health 상태와 모순
     *   예) HealthState.UNCLUSTERED인데 lifecycle이 CLUSTERED 이상
     *
     * INVALID: 논리적으로 불가능한 조합
     *   예) HealthState.HEALTHY인데 lifecycle이 DISCOVERED (미등록)
     */
    validateTransition(nodeState: NodeState): TransitionValidation {
        const { lifecycle, health } = nodeState;

        // INVALID: HEALTHY인데 CLUSTERED 미만 (등록도 안 된 노드가 Healthy 판정 불가)
        if (
            health === HealthState.HEALTHY &&
            (lifecycle === LifecycleState.DISCOVERED || lifecycle === LifecycleState.PARSED)
        ) {
            return { completeness: FSMCompleteness.INVALID_TRANSITION, reason: 'HEALTHY but pre-REGISTERED' };
        }

        // INCOMPLETE: UNCLUSTERED인데 lifecycle이 CLUSTERED 이상을 주장
        if (
            health === HealthState.UNCLUSTERED &&
            this._lifecycleOrdinal(lifecycle) >= this._lifecycleOrdinal(LifecycleState.CLUSTERED)
        ) {
            return { completeness: FSMCompleteness.INCOMPLETE_TRANSITION, reason: 'lifecycle=CLUSTERED+ but cluster_id missing' };
        }

        // NOTE: UNCLASSIFIED (role 없음)는 Soft Anomaly — FSM Completeness 판정 제외
        // "UNKNOWN Role = 허용" 원칙에 따라 전이 완전성 위반으로 취급하지 않음

        return { completeness: FSMCompleteness.KNOWN };
    }

    /** LifecycleState 순서 비교용 */
    private _lifecycleOrdinal(s: LifecycleState): number {
        const ORDER: Record<LifecycleState, number> = {
            [LifecycleState.DISCOVERED] : 0,
            [LifecycleState.PARSED]     : 1,
            [LifecycleState.REGISTERED] : 2,
            [LifecycleState.CLUSTERED]  : 3,
            [LifecycleState.CLASSIFIED] : 4,
        };
        return ORDER[s] ?? -1;
    }

    // ─── 4. 전체 집계 ───────────────────────────────────────────────────────

    summarize(): AnomalySummary {
        let unclustered = 0, unclassified = 0, corrupted = 0,
            outOfScope  = 0, ghost        = 0,
            missing     = 0, invalid      = 0;

        for (const state of this.nodeResults.values()) {
            if (state.health === HealthState.UNCLUSTERED)  unclustered++;
            if (state.health === HealthState.UNCLASSIFIED) unclassified++;
            if (state.health === HealthState.CORRUPTED)    corrupted++;
            if (state.view   === ViewState.OUT_OF_SCOPE)   outOfScope++;

            const v = this.validateTransition(state);
            if (v.completeness === FSMCompleteness.INCOMPLETE_TRANSITION) missing++;
            if (v.completeness === FSMCompleteness.INVALID_TRANSITION)    invalid++;
        }

        for (const ref of this.refResults.values()) {
            if (ref === ReferenceState.GHOST) ghost++;
        }

        return { missingTransitions: missing, invalidTransitions: invalid,
                 unclustered, unclassified, corrupted, outOfScope, ghost };
    }

    /** 전체 노드를 일괄 분류 (Step 3 연결용) */
    classifyAll(nodes: any[], edges: any[]): void {
        for (const node of nodes)  this.classifyNode(node);
        for (const edge of edges)  this.classifyReference(edge);
    }
}
