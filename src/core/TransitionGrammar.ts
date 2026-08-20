/**
 * TransitionGrammar — v0.3.34.25 Transition Grammar Engine
 *
 * Invariant: 현재 상태의 정합성 검증.
 *            과거 상태 저장/재구성 없음.
 *
 * ViewState는 전이 Rule 대상 제외 — 축 오염 방지.
 */

import {
    LifecycleState,
    HealthState,
    FSMCompleteness,
    NodeState,
    TransitionValidation,
    TransitionRule,
    TransitionChain,
    TransitionViolation,
    FSMAuditSummary,
    MAX_VIOLATIONS,
} from '../types/schema';

// ─── 정규 LifecycleState 경로 순서 ─────────────────────────────────────────
const LIFECYCLE_ORDER: LifecycleState[] = [
    LifecycleState.DISCOVERED,
    LifecycleState.PARSED,
    LifecycleState.REGISTERED,
    LifecycleState.CLUSTERED,
    LifecycleState.CLASSIFIED,
];

const LIFECYCLE_ORDINAL = new Map<LifecycleState, number>(
    LIFECYCLE_ORDER.map((s, i) => [s, i])
);

// ─── Transition Rules (선언형 상수, 런타임 불변) ───────────────────────────
// ViewState는 포함하지 않음 — 축 오염 방지
export const TRANSITION_RULES: readonly TransitionRule[] = Object.freeze([
    // ── LifecycleState 정방향 (정상 경로)
    { from: LifecycleState.DISCOVERED,  to: LifecycleState.PARSED,      allowed: true,  reason: 'normal lifecycle' },
    { from: LifecycleState.PARSED,      to: LifecycleState.REGISTERED,  allowed: true,  reason: 'normal lifecycle' },
    { from: LifecycleState.REGISTERED,  to: LifecycleState.CLUSTERED,   allowed: true,  reason: 'normal lifecycle' },
    { from: LifecycleState.CLUSTERED,   to: LifecycleState.CLASSIFIED,  allowed: true,  reason: 'normal lifecycle' },

    // ── LifecycleState 단계 건너뜀 (금지)
    { from: LifecycleState.DISCOVERED,  to: LifecycleState.CLASSIFIED,  allowed: false, reason: 'skips PARSED/REGISTERED/CLUSTERED' },
    { from: LifecycleState.DISCOVERED,  to: LifecycleState.CLUSTERED,   allowed: false, reason: 'skips PARSED/REGISTERED' },
    { from: LifecycleState.PARSED,      to: LifecycleState.CLASSIFIED,  allowed: false, reason: 'skips REGISTERED/CLUSTERED' },

    // ── LifecycleState 역방향 (직접 역행 금지)
    { from: LifecycleState.CLASSIFIED,  to: LifecycleState.DISCOVERED,  allowed: false, reason: 'no direct backward transition' },
    { from: LifecycleState.CLUSTERED,   to: LifecycleState.DISCOVERED,  allowed: false, reason: 'no direct backward transition' },
    { from: LifecycleState.REGISTERED,  to: LifecycleState.DISCOVERED,  allowed: false, reason: 'no direct backward transition' },

    // ── HealthState 전이 (허용)
    { from: HealthState.HEALTHY,      to: HealthState.UNCLUSTERED,   allowed: true,  reason: 'cluster removed' },
    { from: HealthState.HEALTHY,      to: HealthState.UNCLASSIFIED,  allowed: true,  reason: 'role removed (soft anomaly)' },
    { from: HealthState.HEALTHY,      to: HealthState.CORRUPTED,     allowed: true,  reason: 'data corruption detected' },
    { from: HealthState.UNCLUSTERED,  to: HealthState.HEALTHY,       allowed: true,  reason: 'cluster assigned' },
    { from: HealthState.UNCLUSTERED,  to: HealthState.CORRUPTED,     allowed: true,  reason: 'data corruption during clustering' },
    { from: HealthState.UNCLASSIFIED, to: HealthState.HEALTHY,       allowed: true,  reason: 'role assigned' },

    // ── 크로스 축 전이 (금지) — LifecycleState ↔ HealthState
    { from: LifecycleState.CLASSIFIED, to: HealthState.CORRUPTED,    allowed: false, reason: 'cross-axis: lifecycle → health requires explicit event' },
    { from: HealthState.HEALTHY,       to: LifecycleState.CLASSIFIED,  allowed: false, reason: 'cross-axis: health → lifecycle not permitted' },
]);

// ─── Rule index (O(1) 조회) ────────────────────────────────────────────────
const RULE_INDEX = new Map<string, TransitionRule>();
for (const r of TRANSITION_RULES) {
    RULE_INDEX.set(`${r.from}→${r.to}`, r);
}

// ─── TransitionGrammar ─────────────────────────────────────────────────────

export class TransitionGrammar {

    /**
     * 단일 전이 A→B 유효성 판정.
     * ViewState 인자를 받으면 cross-axis로 즉시 INVALID.
     */
    validate(from: NodeState, to: NodeState): TransitionValidation {
        // lifecycle 전이
        const lcFrom = from.lifecycle;
        const lcTo   = to.lifecycle;

        if (lcFrom !== lcTo) {
            const rule = RULE_INDEX.get(`${lcFrom}→${lcTo}`);
            if (!rule) {
                return { completeness: FSMCompleteness.INVALID_TRANSITION, reason: `uncharted lifecycle transition: ${lcFrom}→${lcTo}` };
            }
            if (!rule.allowed) {
                return { completeness: FSMCompleteness.INVALID_TRANSITION, reason: rule.reason };
            }
        }

        // health 전이
        const hFrom = from.health;
        const hTo   = to.health;

        if (hFrom !== hTo) {
            const rule = RULE_INDEX.get(`${hFrom}→${hTo}`);
            if (!rule) {
                return { completeness: FSMCompleteness.INVALID_TRANSITION, reason: `uncharted health transition: ${hFrom}→${hTo}` };
            }
            if (!rule.allowed) {
                return { completeness: FSMCompleteness.INVALID_TRANSITION, reason: rule.reason };
            }
        }

        return { completeness: FSMCompleteness.KNOWN };
    }

    /**
     * NodeState[] 전체의 FSM 일관성 검사.
     * 전이 이력 불필요 — 현재 상태만으로 경로 일관성 판정.
     */
    auditStateConsistency(nodes: { nodeId: string; state: NodeState }[]): FSMAuditSummary {
        let missing = 0, invalid = 0, uncharted = 0;
        const violations: TransitionViolation[] = [];

        for (const { nodeId, state } of nodes) {
            const chain = this._buildChain(nodeId, state);
            if (chain.valid) continue;

            const type = this._classifyViolation(chain);
            if (type === 'MISSING')   missing++;
            else if (type === 'INVALID')   invalid++;
            else                           uncharted++;

            if (violations.length < MAX_VIOLATIONS) {
                violations.push({
                    nodeId,
                    path  : chain.path.join('→'),
                    type,
                    reason: chain.reason ?? 'unknown',
                });
            }
        }

        return { missing, invalid, uncharted, violations };
    }

    /**
     * 현재 NodeState로부터 예상 경로 추론 후 일관성 판정.
     * DISCOVERED→PARSED→REGISTERED→CLUSTERED→CLASSIFIED 정상 경로 기준.
     */
    private _buildChain(nodeId: string, state: NodeState): TransitionChain {
        const lcOrdinal = LIFECYCLE_ORDINAL.get(state.lifecycle) ?? -1;

        // 정상 경로상 CLUSTERED(3) 이상인데 health=UNCLUSTERED → MISSING
        if (
            state.health === HealthState.UNCLUSTERED &&
            lcOrdinal >= (LIFECYCLE_ORDINAL.get(LifecycleState.CLUSTERED) ?? 99)
        ) {
            return {
                nodeId,
                path: [state.lifecycle, state.health],
                valid: false,
                reason: 'lifecycle claims CLUSTERED+ but cluster_id absent (MISSING transition)',
            };
        }

        // HEALTHY 상태인데 lifecycle이 REGISTERED 미만 → INVALID
        if (
            state.health === HealthState.HEALTHY &&
            lcOrdinal < (LIFECYCLE_ORDINAL.get(LifecycleState.REGISTERED) ?? 99)
        ) {
            return {
                nodeId,
                path: [state.lifecycle, state.health],
                valid: false,
                reason: 'HEALTHY but lifecycle pre-REGISTERED (INVALID transition)',
            };
        }

        return { nodeId, path: [state.lifecycle, state.health], valid: true };
    }

    private _classifyViolation(chain: TransitionChain): 'MISSING' | 'INVALID' | 'UNCHARTED' {
        const r = chain.reason ?? '';
        if (r.includes('MISSING'))  return 'MISSING';
        if (r.includes('INVALID'))  return 'INVALID';
        return 'UNCHARTED';
    }
}
