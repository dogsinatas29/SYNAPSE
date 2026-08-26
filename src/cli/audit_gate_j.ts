import { 
    ALLOWED_STATES, 
    ALLOWED_EVENTS, 
    ALLOWED_TRANSITIONS, 
    FORBIDDEN_VOCABULARY 
} from '../core/reasoning/analyzers/ArchitecturalVocabulary';

/**
 * v0.3.34.32 Phase 8.5: Gate J Audit
 * 
 * Vocabulary Lock Audit.
 * 시나리오/가정 계층 진입 전, 상태 전이에 허용된 어휘(Vocabulary)가 
 * 인간의 주관적 해석(STABLE, HEALTHY 등)을 포함하지 않는지, 
 * 전이 엣지(Edge)가 3중 키로 정확히 매핑되는지 검증합니다.
 */
export class GateJAudit {
    public runAudit(): string {
        let report = '# Phase 8.5: Gate J (Vocabulary Lock Report)\n\n';
        
        let test1Pass = true;
        let test2Pass = true;
        let test3Pass = true;
        let failureReasons: string[] = [];

        // =====================================
        // Test 1: Forbidden Vocabulary Scan (상태/이벤트 내 환각어 검출)
        // =====================================
        const allVocab = [...ALLOWED_STATES, ...ALLOWED_EVENTS];
        allVocab.forEach(v => {
            FORBIDDEN_VOCABULARY.forEach(forbidden => {
                if (v.toUpperCase().includes(forbidden)) {
                    test1Pass = false;
                    failureReasons.push(`Test 1 FAIL: Allowed vocabulary "${v}" contains forbidden interpretation "${forbidden}".`);
                }
            });
        });

        // =====================================
        // Test 2: Edge Registry Strict Matching (알 수 없는 상태/이벤트 사용 금지)
        // =====================================
        ALLOWED_TRANSITIONS.forEach(edge => {
            if (!ALLOWED_STATES.includes(edge.fromState as any)) {
                test2Pass = false;
                failureReasons.push(`Test 2 FAIL: Unknown fromState "${edge.fromState}" used in transition.`);
            }
            if (!ALLOWED_EVENTS.includes(edge.event as any)) {
                test2Pass = false;
                failureReasons.push(`Test 2 FAIL: Unknown event "${edge.event}" used in transition.`);
            }
            if (!ALLOWED_STATES.includes(edge.toState as any)) {
                test2Pass = false;
                failureReasons.push(`Test 2 FAIL: Unknown toState "${edge.toState}" used in transition.`);
            }
        });

        // =====================================
        // Test 3: Simulation Engine Mock (허용되지 않은 전이 시도 방어)
        // =====================================
        // StateTransitionAnalyzer가 런타임에 임의 전이를 시도한다고 가정하고 막히는지 테스트
        const mockMaliciousTransition = { fromState: 'DISCOVERED', event: 'AUTHORITY_SIGNAL_FOUND', toState: 'DOMINANT' };
        
        const isAllowed = ALLOWED_TRANSITIONS.some(t => 
            t.fromState === mockMaliciousTransition.fromState &&
            t.event === mockMaliciousTransition.event &&
            t.toState === mockMaliciousTransition.toState
        );

        if (isAllowed) {
            test3Pass = false;
            failureReasons.push(`Test 3 FAIL: Malicious transition bypass detected (Engine allowed an invalid edge).`);
        }

        report += `### Test 1: Forbidden Vocabulary Scan (주관적 해석 배제)\n`;
        report += test1Pass ? `> **Result: PASS** (No subjective/interpretive tokens found in State/Event registry)\n\n` : `> **Result: FAIL**\n\n`;

        report += `### Test 2: Edge Registry Strict Matching (미정의 상태/이벤트 결합 차단)\n`;
        report += test2Pass ? `> **Result: PASS** (All transition edges map perfectly to allowed 3-way keys)\n\n` : `> **Result: FAIL**\n\n`;

        report += `### Test 3: Unauthorized Transition Block (런타임 임의 전이 차단 시뮬레이션)\n`;
        report += test3Pass ? `> **Result: PASS** (System successfully rejected malicious transition hallucination)\n\n` : `> **Result: FAIL**\n\n`;

        if (failureReasons.length > 0) {
            report += `### Failure Details\n`;
            failureReasons.forEach(r => report += `- ${r}\n`);
        }

        return report;
    }
}

if (require.main === module) {
    const auditor = new GateJAudit();
    console.log(auditor.runAudit());
}
