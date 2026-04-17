/**
 * 🛠️ SYNAPSE Diagnostic Hint Engine (v0.3.19)
 * 
 * 분석된 노드 통계를 기반으로 아키텍처 개선을 위한 힌트를 생성합니다.
 * '응집도'와 '결합도'를 수치화하여 문제 노드를 식별합니다.
 */

export const RuleId = {
    MULTI_DOMAIN: 'R1',
    CONCENTRATION_STRONG: 'R2_S',
    CONCENTRATION_MODERATE: 'R2_M',
    HIGH_FAN_OUT: 'R3',
    HIGH_FAN_IN: 'R4',
    SUPER_NODE: 'R5',
    ORCHESTRATOR: 'R6'
} as const;

export type RuleId = typeof RuleId[keyof typeof RuleId];

export interface NodeStats {
    in: number;
    out: number;
    connectedNodes: number;
    distribution: Record<string, number>;
}

export const RULE_THRESHOLDS = {
    MULTI_DOMAIN_LIMIT: 3,
    CONCENTRATION_STRONG: 0.8,
    CONCENTRATION_MODERATE: 0.6,
    FAN_OUT_RATIO: 0.7,
    FAN_IN_RATIO: 0.7,
    SUPER_NODE_LIMIT: 30,
    MIN_CONNECTION_FOR_SIGNIFICANCE: 5
};

export const HINT_MESSAGES: Record<string, { ko: string; en: string; severity: number }> = {
    [RuleId.MULTI_DOMAIN]: {
        ko: "다중 도메인 분산 소통 ({count}개 그룹). 책임 분리 검토 권장.",
        en: "Dispersed communication across {count} domains. Consider separation.",
        severity: 2
    },
    [RuleId.CONCENTRATION_STRONG]: {
        ko: "{group} 레이어 집중 결합 ({ratio}%). 강력한 종속성 형성.",
        en: "Strongly coupled with {group} ({ratio}%). Formed high dependency.",
        severity: 2
    },
    [RuleId.CONCENTRATION_MODERATE]: {
        ko: "{group} 레이어 중심 결합 ({ratio}%).",
        en: "Centered coupling with {group} ({ratio}%).",
        severity: 1
    },
    [RuleId.HIGH_FAN_OUT]: {
        ko: "높은 출력 비율 ({ratio}%).",
        en: "High outbound ratio ({ratio}%).",
        severity: 1
    },
    [RuleId.HIGH_FAN_IN]: {
        ko: "높은 입력 비율 ({ratio}%). 시스템 핫스팟 가능성.",
        en: "High inbound ratio ({ratio}%). Potential system hotspot.",
        severity: 1
    },
    [RuleId.SUPER_NODE]: {
        ko: "슈퍼 노드 감지 ({count}/30). 로직 분해 권장.",
        en: "Super node detected ({count}/30). Decomposition recommended.",
        severity: 3
    },
    [RuleId.ORCHESTRATOR]: {
        ko: "중앙 제어형 오케스트레이터 패턴 식별.",
        en: "Centralized Orchestrator pattern identified.",
        severity: 2
    }
};

export interface NodeDiagnostics {
    roles: string[];
    hints: string[];
    priority: number;
}

/**
 * [v0.3.19] Simple Priority Scoring (0-4)
 */
export function calculatePriority(stats: NodeStats): number {
    const { connectedNodes, in: inCount, out } = stats;
    const total = inCount + out;
    let score = 0;

    if (connectedNodes >= 20) score += 2;
    if (total > 0 && out / total >= 0.8) score += 1;
    if (total > 0 && inCount / total >= 0.8) score += 1;

    return Math.min(score, 4);
}

/**
 * [v0.3.19] Single Role Principle: Only one identity per node.
 * Priority: Leaf -> Orchestrator -> Controller -> Hub
 */
export function detectRole(stats: NodeStats): string | null {
    const { in: inCount, out, connectedNodes } = stats;
    const total = inCount + out;
    const outRatio = total > 0 ? out / total : 0;
    const inRatio = total > 0 ? inCount / total : 0;

    // 1. Leaf node (Lowest Priority 1)
    if (connectedNodes <= 2) {
        return "Leaf node";
    }

    // 2. Orchestrator (Priority 2)
    if (outRatio >= 0.8 && connectedNodes >= 10) {
        return "Orchestrator (fan-out)";
    }

    // 3. Controller (Priority 3)
    if (inRatio >= 0.8 && connectedNodes >= 10) {
        return "Controller (fan-in)";
    }

    // 4. Hub (Priority 4)
    if (connectedNodes >= 20) {
        return "Hub (high connectivity)";
    }

    return null;
}

export function generateHints(stats: NodeStats, lang: 'ko' | 'en' = 'ko'): NodeDiagnostics {
    const hints: string[] = [];
    const role = detectRole(stats);
    const roles = role ? [role] : [];
    const priority = calculatePriority(stats);
    
    const { in: inCount, out, connectedNodes, distribution } = stats;
    const total = inCount + out;
    const groups = Object.keys(distribution);
    const values = Object.values(distribution);

    if (connectedNodes < RULE_THRESHOLDS.MIN_CONNECTION_FOR_SIGNIFICANCE) {
        return { roles, hints, priority };
    }

    const getMsg = (id: string, context: Record<string, string | number>) => {
        const entry = (HINT_MESSAGES as any)[id];
        if (!entry) return "";
        let msg = entry[lang];
        Object.entries(context).forEach(([key, val]) => {
            msg = msg.replace(`{${key}}`, val.toString());
        });
        const prefix = entry.severity >= 3 ? "!!! " : (entry.severity >= 2 ? "!! " : "! ");
        return prefix + msg;
    };

    // Rule 1: Multi-Domain
    const maxVal = Math.max(...values, 0);
    const maxRatio = total > 0 ? maxVal / total : 0;
    
    if (groups.length >= RULE_THRESHOLDS.MULTI_DOMAIN_LIMIT && maxRatio < 0.6) {
        hints.push(getMsg(RuleId.MULTI_DOMAIN, { count: groups.length }));
    }

    // Rule 2: Concentration
    if (total > 0) {
        const ratioVal = Math.round((maxVal / total) * 100);
        const dominant = groups[values.indexOf(maxVal)];
        
        if (maxRatio >= RULE_THRESHOLDS.CONCENTRATION_STRONG) {
            hints.push(getMsg(RuleId.CONCENTRATION_STRONG, { group: dominant, ratio: ratioVal }));
        } else if (maxRatio >= RULE_THRESHOLDS.CONCENTRATION_MODERATE) {
            hints.push(getMsg(RuleId.CONCENTRATION_MODERATE, { group: dominant, ratio: ratioVal }));
        }
    }

    // Rule 3: High Outbound
    const outRatio = total > 0 ? out / total : 0;
    if (total > 0 && outRatio >= RULE_THRESHOLDS.FAN_OUT_RATIO) {
        const ratio = Math.round(outRatio * 100);
        hints.push(getMsg(RuleId.HIGH_FAN_OUT, { ratio }));
    }

    // Rule 6: Orchestrator Pattern (Hint form)
    if (outRatio >= 0.9 && connectedNodes >= 10) {
        hints.push(getMsg(RuleId.ORCHESTRATOR, {}));
    }

    // Rule 4: High Fan-in
    if (total > 0 && (inCount / total >= RULE_THRESHOLDS.FAN_IN_RATIO)) {
        const ratio = Math.round((inCount / total) * 100);
        hints.push(getMsg(RuleId.HIGH_FAN_IN, { ratio }));
    }

    // Rule 5: Super Node
    if (connectedNodes >= RULE_THRESHOLDS.SUPER_NODE_LIMIT) {
        hints.push(getMsg(RuleId.SUPER_NODE, { count: connectedNodes }));
    }

    return { roles, hints, priority };
}
