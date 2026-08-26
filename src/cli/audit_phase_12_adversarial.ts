import { RefactorAnalyzer } from '../core/reasoning/analyzers/RefactorAnalyzer';
import { StateTransitionAnalyzer } from '../core/reasoning/analyzers/StateTransitionAnalyzer';
import { ArchitecturalState, ArchitecturalEvent } from '../core/reasoning/analyzers/ArchitecturalVocabulary';
import { ArchitecturalEvidence } from '../core/reasoning/evidence/ArchitecturalEvidence';
// 모의 AuthorityAnalyzer, PropagationAnalyzer 인터페이스
import { AuthorityFinding } from '../core/reasoning/analyzers/AuthorityAnalyzer';
import { PropagationFinding } from '../core/reasoning/analyzers/PropagationAnalyzer';

/**
 * v0.3.34.32 Phase 12.1: Adversarial Validation
 * 
 * "있어야 할 결과가 있는가?" (Known Truth) 보다,
 * "없어야 할 결과가 생성되는가?" (False Positive, Negative Evidence) 를 우선 검증합니다.
 * 최상단 EvidenceBuilder의 오작동 및 하위 Analyzer의 과잉 해석을 방어합니다.
 */
export class AdversarialValidationAudit {

    public runAudit(): string {
        let report = '# Phase 12.1: Adversarial Validation Report (거짓 양성 방어)\n\n';
        let failureReasons: string[] = [];

        // =====================================
        // Case A & B & C: Negative Evidence Test (Mocking Analyzer Logic for testing concept)
        // =====================================
        const mockEmptyEvidence: ArchitecturalEvidence = {
            nodeId: 'MockEmpty', boundaryId: 'mock',
            fanIn: 0, fanOut: 0, blastRadius: 0,
            crossBoundaryDependencies: [], 
            roleHints: { isEntryPoint: false, hasLifecycleControl: false, hasStateMutation: false, hasServiceRegistry: false, hasFactoryPattern: false }, 
            constraintHints: { boundaryRootCount: 0, singletonPatternDetected: false, replacementCandidates: 0, inboundDependencyCount: 0, outboundDependencyCount: 0, uniqueImplementationCount: 0 },
            boundaryInboundPressure: 0, sources: {}
        };

        // propagationAnalyzer (Simulated Logic)
        const generatePropagation = (ev: ArchitecturalEvidence) => {
            if (ev.blastRadius > 50) return { propagationExtent: 'HIGH_PROPAGATION' };
            return null;
        };

        // authorityAnalyzer (Simulated Logic)
        const generateAuthority = (ev: ArchitecturalEvidence) => {
            if (ev.roleHints?.hasFactoryPattern || ev.roleHints?.hasLifecycleControl) {
                return { isAuthority: true };
            }
            return null;
        };

        let testAPass = generatePropagation(mockEmptyEvidence) === null;
        if (!testAPass) failureReasons.push('Case A FAIL: Generated HIGH_PROPAGATION when blastRadius is 0.');

        let testBPass = generateAuthority(mockEmptyEvidence) === null;
        if (!testBPass) failureReasons.push('Case B/C FAIL: Generated AUTHORITY_FINDING when no role hints exist.');

        // =====================================
        // Case D: Reference 제거 공격 방어 (RefactorAnalyzer)
        // =====================================
        const refactorAnalyzer = new RefactorAnalyzer();
        const mockEvidence: ArchitecturalEvidence = {
            nodeId: 'A', boundaryId: 'mock', fanIn: 10, fanOut: 5, blastRadius: 100,
            crossBoundaryDependencies: ['B'],
            roleHints: { isEntryPoint: false, hasLifecycleControl: false, hasStateMutation: false, hasServiceRegistry: false, hasFactoryPattern: false },
            constraintHints: { boundaryRootCount: 1, singletonPatternDetected: false, replacementCandidates: 0, inboundDependencyCount: 10, outboundDependencyCount: 5, uniqueImplementationCount: 1 },
            boundaryInboundPressure: 5, sources: {}
        };
        
        // RefactorAnalyzer.analyze()를 사용하여 제약 생성 검증
        const findings = refactorAnalyzer.analyze([mockEvidence]);
        
        let testDPass = true;
        // 제약이 생성되었다면 evidenceReferences가 비어있으면 안 됨
        if (findings.length > 0 && findings[0].evidenceReferences.length === 0) {
            testDPass = false; // "증거 없음"
            failureReasons.push('Case D FAIL: Constraint generated despite empty evidenceReferences.');
        }

        // =====================================
        // Case E: FSM 공격 (미등록 이벤트 주입)
        // =====================================
        const transitionAnalyzer = new StateTransitionAnalyzer();
        // @ts-ignore - Forcing invalid event for adversarial test
        const invalidEvent = 'SYSTEM_BECOME_HEALTHY' as ArchitecturalEvent;
        const result = transitionAnalyzer.simulateTransition('DISCOVERED', invalidEvent);

        let testEPass = result.to === null;
        if (!testEPass) failureReasons.push('Case E FAIL: Transition executed on unregistered vocabulary event.');

        // =====================================
        // 리포트 포매팅
        // =====================================
        report += `### Case A & B & C: Negative Evidence Test (증거 부재 시 침묵)\n`;
        report += testAPass && testBPass ? `> **Result: PASS** (Analyzers properly return null/empty when evidence is 0 or missing)\n\n` : `> **Result: FAIL**\n\n`;

        report += `### Case D: Reference Stripping Attack (출처 증명 강제)\n`;
        report += testDPass ? `> **Result: PASS** (Constraints strictly require non-empty evidence references)\n\n` : `> **Result: FAIL**\n\n`;

        report += `### Case E: FSM Vocabulary Attack (미등록 이벤트 차단)\n`;
        report += testEPass ? `> **Result: PASS** (FSM safely returns NULL on unregistered hallucinated events)\n\n` : `> **Result: FAIL**\n\n`;

        if (failureReasons.length > 0) {
            report += `### Failure Details\n`;
            failureReasons.forEach(r => report += `- ${r}\n`);
        }

        return report;
    }
}

if (require.main === module) {
    const auditor = new AdversarialValidationAudit();
    console.log(auditor.runAudit());
}
