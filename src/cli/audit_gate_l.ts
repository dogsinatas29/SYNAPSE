import { StateTransitionAnalyzer } from '../core/reasoning/analyzers/StateTransitionAnalyzer';
import { ArchitecturalState, ArchitecturalEvent } from '../core/reasoning/analyzers/ArchitecturalVocabulary';

/**
 * v0.3.34.32 Phase 9.5: Gate L Audit
 * 
 * No Interpretation Audit.
 * StateTransitionAnalyzer가 "가치 판단", "해석", "권고사항"을 배출하지 않는지,
 * 오로지 (from, event, to) 트리플만 반환하는 순수 FSM 실행기로 동작하는지 검증합니다.
 */
export class GateLAudit {
    
    private readonly INTERPRETIVE_TOKENS = [
        'HEALTHY', 'UNHEALTHY', 'GOOD', 'BAD', 'CRITICAL', 
        'SAFE', 'RISKY', 'OPTIMAL', 'SUBOPTIMAL'
    ];

    private readonly RECOMMENDATION_TOKENS = [
        'SHOULD', 'RECOMMENDED', 'MUST', 'BETTER', 
        'IMPROVE', 'OPTIMIZE', 'REFACTOR'
    ];

    public runAudit(): string {
        let report = '# Phase 9.5: Gate L (No Interpretation Report)\n\n';

        const analyzer = new StateTransitionAnalyzer();

        // 시뮬레이션 샘플
        const samples: { from: ArchitecturalState, event: ArchitecturalEvent }[] = [
            { from: 'AUTHORITY_IDENTIFIED', event: 'PROPAGATION_DETECTED' },
            { from: 'DISCOVERED', event: 'AUTHORITY_SIGNAL_FOUND' }
        ];

        let test1Pass = true;
        let test2Pass = true;
        let test3Pass = true;
        let failureReasons: string[] = [];

        samples.forEach(sample => {
            const result = analyzer.simulateTransition(sample.from, sample.event);
            const resultString = JSON.stringify(result).toUpperCase();

            // =====================================
            // Test 1: Forbidden Vocabulary
            // =====================================
            this.INTERPRETIVE_TOKENS.forEach(token => {
                if (resultString.includes(token)) {
                    test1Pass = false;
                    failureReasons.push(`Test 1 FAIL: Found interpretive token "${token}" in output.`);
                }
            });

            // =====================================
            // Test 2: Recommendation Vocabulary
            // =====================================
            this.RECOMMENDATION_TOKENS.forEach(token => {
                if (resultString.includes(token)) {
                    test2Pass = false;
                    failureReasons.push(`Test 2 FAIL: Found recommendation token "${token}" in output.`);
                }
            });

            // =====================================
            // Test 3: Transition Traceability (구조 검증)
            // =====================================
            const keys = Object.keys(result);
            const hasUnexpectedKeys = keys.some(k => k !== 'from' && k !== 'event' && k !== 'to');
            
            if (hasUnexpectedKeys || !result.from || !result.event) {
                test3Pass = false;
                failureReasons.push(`Test 3 FAIL: Output structure contains properties other than (from, event, to) or is missing required fields.`);
            }
        });

        report += `### Test 1: Forbidden Interpretive Vocabulary\n`;
        report += test1Pass ? `> **Result: PASS** (No interpretive state judgments found)\n\n` : `> **Result: FAIL**\n\n`;

        report += `### Test 2: Forbidden Recommendation Vocabulary\n`;
        report += test2Pass ? `> **Result: PASS** (No architecture recommendations/suggestions found)\n\n` : `> **Result: FAIL**\n\n`;

        report += `### Test 3: Strict Triple Traceability\n`;
        report += test3Pass ? `> **Result: PASS** (Output is strictly constrained to FROM, EVENT, TO)\n\n` : `> **Result: FAIL**\n\n`;

        if (failureReasons.length > 0) {
            report += `### Failure Details\n`;
            failureReasons.forEach(r => report += `- ${r}\n`);
        }

        return report;
    }
}

if (require.main === module) {
    const auditor = new GateLAudit();
    console.log(auditor.runAudit());
}
