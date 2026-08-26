import { ArchitecturalReasoningModelBuilder } from '../core/reasoning/builders/ArchitecturalReasoningModelBuilder';
import { ArchitecturalEvidence } from '../core/reasoning/evidence/ArchitecturalEvidence';
import { AuthorityFinding } from '../core/reasoning/analyzers/AuthorityAnalyzer';
import * as crypto from 'crypto';

/**
 * v0.3.34.32 Phase 10.5: Gate M Audit
 * 
 * Assembly Purity Gate.
 * Builder가 단순히 여러 엔진의 결과를 "담는" 역할을 넘어,
 * 스스로 평가(riskLevel), 채점, 해석을 수행하는 "조립 오염"을 일으키지 않는지 검증합니다.
 */
export class GateMAudit {
    
    public runAudit(): string {
        let report = '# Phase 10.5: Gate M (Assembly Purity Report)\n\n';

        const builder = new ArchitecturalReasoningModelBuilder();
        
        // Mock Inputs
        const mockEvidences: ArchitecturalEvidence[] = [{
            nodeId: 'MockNode', boundaryId: 'mock', fanIn: 1, fanOut: 1, blastRadius: 1, crossBoundaryDependencies: [], 
            roleHints: { isEntryPoint: false, hasLifecycleControl: false, hasStateMutation: false, hasServiceRegistry: false, hasFactoryPattern: false }, 
            constraintHints: { boundaryRootCount: 0, singletonPatternDetected: false, replacementCandidates: 0, inboundDependencyCount: 1, outboundDependencyCount: 1, uniqueImplementationCount: 1 }, 
            boundaryInboundPressure: 0, sources: {}
        }];
        const mockAuthority: AuthorityFinding[] = [{
            nodeId: 'MockNode', signals: [{ type: 'HIGH_INBOUND', description: 'Mock', evidenceReferences: ['fanIn'] }]
        }];

        builder.setEvidences(mockEvidences).setAuthority(mockAuthority);
        const model1 = builder.build();

        // 재생성을 통한 Determinism 체크용
        const builder2 = new ArchitecturalReasoningModelBuilder();
        builder2.setEvidences(mockEvidences).setAuthority(mockAuthority);
        const model2 = builder2.build();

        let test1Pass = true;
        let test2Pass = true;
        let test3Pass = true;
        let test4Pass = true;
        let failureReasons: string[] = [];

        // =====================================
        // Test 1 & 2: 신규 토큰 생성 불가 및 순수 병합 검사
        // =====================================
        const allowedKeys = [
            'timestamp', 'evidences', 'authority', 'ownership', 
            'dominance', 'corridors', 'propagation', 'constraints', 'transitions'
        ];
        
        const modelKeys = Object.keys(model1);
        modelKeys.forEach(k => {
            if (!allowedKeys.includes(k)) {
                test1Pass = false;
                test2Pass = false;
                failureReasons.push(`Test 1/2 FAIL: Builder generated unauthorized key "${k}" (Possible interpretation/scoring hallucination).`);
            }
        });

        const forbiddenCalculations = ['riskLevel', 'health', 'criticality', 'recommendation', 'score'];
        forbiddenCalculations.forEach(badKey => {
            if (model1.hasOwnProperty(badKey)) {
                test2Pass = false;
                failureReasons.push(`Test 2 FAIL: Builder generated subjective calculation "${badKey}".`);
            }
        });

        // =====================================
        // Test 3: 합집합 및 Reference 생존 검사
        // =====================================
        if (model1.evidences.length !== mockEvidences.length || model1.authority.length !== mockAuthority.length) {
            test3Pass = false;
            failureReasons.push(`Test 3 FAIL: Builder dropped some input elements during assembly.`);
        }
        if (model1.authority[0].signals[0].evidenceReferences.length === 0) {
            test3Pass = false;
            failureReasons.push(`Test 3 FAIL: Builder stripped out evidenceReferences during assembly.`);
        }

        // =====================================
        // Test 4: Determinism (Hash)
        // =====================================
        const hash1 = crypto.createHash('sha256').update(JSON.stringify({...model1, timestamp: 0})).digest('hex');
        const hash2 = crypto.createHash('sha256').update(JSON.stringify({...model2, timestamp: 0})).digest('hex');
        
        if (hash1 !== hash2) {
            test4Pass = false;
            failureReasons.push(`Test 4 FAIL: Builder output is not deterministic given the same inputs.`);
        }

        report += `### Test 1 & 2: No New Tokens / No Inference (조립 오염 차단)\n`;
        report += test1Pass && test2Pass ? `> **Result: PASS** (Builder acts strictly as a DTO container without generating subjective fields)\n\n` : `> **Result: FAIL**\n\n`;

        report += `### Test 3: Union & Reference Preservation (합집합 보존)\n`;
        report += test3Pass ? `> **Result: PASS** (All inputs and references perfectly survived the assembly process)\n\n` : `> **Result: FAIL**\n\n`;

        report += `### Test 4: Assembly Determinism (해시 동일성)\n`;
        report += test4Pass ? `> **Result: PASS** (Assembly produces identical deterministic output for identical inputs)\n\n` : `> **Result: FAIL**\n\n`;

        if (failureReasons.length > 0) {
            report += `### Failure Details\n`;
            failureReasons.forEach(r => report += `- ${r}\n`);
        }

        return report;
    }
}

if (require.main === module) {
    const auditor = new GateMAudit();
    console.log(auditor.runAudit());
}
