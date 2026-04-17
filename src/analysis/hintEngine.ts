/**
 * 🛠️ SYNAPSE Diagnostic Hint Engine (v0.3.18)
 * 
 * 분석된 노드 통계를 기반으로 아키텍처 개선을 위한 힌트를 생성합니다.
 * '응집도'와 '결합도'를 수치화하여 문제 노드를 식별합니다.
 */

export enum RuleId {
    MULTI_DOMAIN = 'R1',
    CONCENTRATION = 'R2',
    HIGH_FAN_OUT = 'R3',
    HIGH_FAN_IN = 'R4',
    SUPER_NODE = 'R5'
}

export interface NodeStats {
    in: number;
    out: number;
    connectedNodes: number;
    distribution: Record<string, number>;
}

export const RULE_THRESHOLDS = {
    MULTI_DOMAIN_LIMIT: 3,
    CONCENTRATION_RATIO: 0.7,
    FAN_OUT_RATIO: 0.7,
    FAN_IN_RATIO: 0.7,
    SUPER_NODE_LIMIT: 30,
    MIN_CONNECTION_FOR_SIGNIFICANCE: 5
};

export const HINT_MESSAGES: Record<string, { ko: string; en: string; severity: number }> = {
    [RuleId.MULTI_DOMAIN]: {
        ko: "다중 도메인 감지. 책임 분리 검토 필요.",
        en: "Multiple domains detected. Consider splitting by responsibility.",
        severity: 2 // !!
    },
    [RuleId.CONCENTRATION]: {
        ko: "{group} 레이어에 강결합됨. 의존성 격리 권장.",
        en: "Highly coupled with {group}. Consider isolating.",
        severity: 1 // !
    },
    [RuleId.HIGH_FAN_OUT]: {
        ko: "출력 의존성 높음. 책임 과다 가능성.",
        en: "High outbound dependency. Too many responsibilities.",
        severity: 1 // !
    },
    [RuleId.HIGH_FAN_IN]: {
        ko: "입력 의존성 높음. 인터페이스 추상화 검토.",
        en: "High inbound dependency. Consider abstraction layer.",
        severity: 1 // !
    },
    [RuleId.SUPER_NODE]: {
        ko: "슈퍼 노드 감지. 로직 분해 시급.",
        en: "Super node detected. Consider decomposition.",
        severity: 3 // !!!
    }
};

export function generateHints(stats: NodeStats, lang: 'ko' | 'en' = 'ko'): string[] {
    const hints: string[] = [];
    const { in: inCount, out, connectedNodes, distribution } = stats;
    const total = inCount + out;
    const groups = Object.keys(distribution);
    const values = Object.values(distribution);

    if (connectedNodes < RULE_THRESHOLDS.MIN_CONNECTION_FOR_SIGNIFICANCE) {
        return hints;
    }

    const getMsg = (id: RuleId, group?: string) => {
        const entry = HINT_MESSAGES[id];
        const msg = entry[lang];
        const prefix = entry.severity >= 3 ? "!!! " : (entry.severity >= 2 ? "!! " : "! ");
        return prefix + msg.replace("{group}", group || "");
    };

    // Rule 1: Multi-Domain
    if (groups.length >= RULE_THRESHOLDS.MULTI_DOMAIN_LIMIT) {
        hints.push(getMsg(RuleId.MULTI_DOMAIN));
    }

    // Rule 2: Concentration
    const maxVal = Math.max(...values, 0);
    if (total > 0 && (maxVal / total >= RULE_THRESHOLDS.CONCENTRATION_RATIO)) {
        const dominant = groups[values.indexOf(maxVal)];
        hints.push(getMsg(RuleId.CONCENTRATION, dominant));
    }

    // Rule 3: High Fan-out
    if (total > 0 && (out / total >= RULE_THRESHOLDS.FAN_OUT_RATIO)) {
        hints.push(getMsg(RuleId.HIGH_FAN_OUT));
    }

    // Rule 4: High Fan-in
    if (total > 0 && (inCount / total >= RULE_THRESHOLDS.FAN_IN_RATIO)) {
        hints.push(getMsg(RuleId.HIGH_FAN_IN));
    }

    // Rule 5: Super Node
    if (connectedNodes >= RULE_THRESHOLDS.SUPER_NODE_LIMIT) {
        hints.push(getMsg(RuleId.SUPER_NODE));
    }

    return hints;
}
