import { RefactorAnalyzer, RefactorConstraintFinding } from '../core/reasoning/analyzers/RefactorAnalyzer';
import { ArchitecturalEvidence } from '../core/reasoning/evidence/ArchitecturalEvidence';

/**
 * v0.3.34.32 Phase 7.5: Gate I Audit
 * 
 * Constraint Traceability Gate.
 * RefactorAnalyzer가 생성한 제약(Constraint)이 100% Evidence 기반의 팩트인지, 
 * 환각이나 주관적 해석(Recommendation)을 포함하지 않는지 철저히 검증합니다.
 */
export class GateIAudit {
    private analyzer = new RefactorAnalyzer();

    // Test 4: 강제 매핑 테이블 (이외의 Constraint 생성 시 FAIL)
    private readonly ALLOWED_MAPPINGS: Record<string, keyof ArchitecturalEvidence | 'singletonPatternDetected' | 'replacementCandidates'> = {
        'HIGH_PROPAGATION': 'blastRadius',
        'HIGH_INBOUND_DEPENDENCY': 'fanIn',
        'HIGH_CORRIDOR_PARTICIPATION': 'crossBoundaryDependencies',
        'SINGLETON_CONSTRAINT': 'singletonPatternDetected',
        'ZERO_REPLACEMENT_CANDIDATES': 'replacementCandidates'
    };

    // Test 3: 환각 및 주관적 평가 금지 토큰
    private readonly FORBIDDEN_TOKENS = [
        'CRITICAL_MODULE', 'CORE_COMPONENT', 'HEART_OF_SYSTEM', 
        'ARCHITECTURAL_CENTER', 'HIGH_RISK', 'DANGEROUS', 
        'IMPORTANT', 'MISSION_CRITICAL', 'SHOULD_NOT_BE_SPLIT',
        'REFACTOR THIS', 'SPLIT THIS', 'MOVE THIS'
    ];

    private mockEvidences: ArchitecturalEvidence[] = [
        // 1. 대동맥 노드 (모든 제약 발동 기대)
        {
            nodeId: 'GraphModel',
            boundaryId: 'core',
            fanIn: 10, fanOut: 5, blastRadius: 100,
            crossBoundaryDependencies: ['DataPipeline', 'RuleEngine'],
            roleHints: { isEntryPoint: false, hasLifecycleControl: false, hasStateMutation: false, hasServiceRegistry: false, hasFactoryPattern: false },
            constraintHints: { boundaryRootCount: 1, singletonPatternDetected: true, replacementCandidates: 0, inboundDependencyCount: 10, outboundDependencyCount: 5, uniqueImplementationCount: 1 },
            boundaryInboundPressure: 5,
            sources: {}
        },
        // 2. 단일 역할 유틸리티 (제약 미발동 기대)
        {
            nodeId: 'UtilityCluster',
            boundaryId: 'util',
            fanIn: 1, fanOut: 1, blastRadius: 0,
            crossBoundaryDependencies: [],
            roleHints: { isEntryPoint: false, hasLifecycleControl: false, hasStateMutation: false, hasServiceRegistry: false, hasFactoryPattern: false },
            constraintHints: { boundaryRootCount: 0, singletonPatternDetected: false, replacementCandidates: 5, inboundDependencyCount: 1, outboundDependencyCount: 1, uniqueImplementationCount: 1 },
            boundaryInboundPressure: 0,
            sources: {}
        },
        // 3. 고립된 거대 유틸리티 (팬인은 높으나 확산/통로 없음)
        {
            nodeId: 'src/vs/base/common/strings.ts',
            boundaryId: 'util',
            fanIn: 5000, fanOut: 0, blastRadius: 0,
            crossBoundaryDependencies: [],
            roleHints: { isEntryPoint: false, hasLifecycleControl: false, hasStateMutation: false, hasServiceRegistry: false, hasFactoryPattern: false },
            constraintHints: { boundaryRootCount: 0, singletonPatternDetected: false, replacementCandidates: 1, inboundDependencyCount: 5000, outboundDependencyCount: 0, uniqueImplementationCount: 1 },
            boundaryInboundPressure: 0,
            sources: {}
        }
    ];

    public runAudit(): string {
        let report = '# Phase 7.5: Gate I (Constraint Traceability Report)\n\n';
        
        const findings = this.analyzer.analyze(this.mockEvidences);

        let test1Pass = true;
        let test2WarnCount = 0;
        let test3Pass = true;
        let test4Pass = true;
        let failureReasons: string[] = [];

        findings.forEach(finding => {
            const evidence = this.mockEvidences.find(e => e.nodeId === finding.nodeId)!;

            // =====================================
            // Test 1: Constraint Source Completeness
            // =====================================
            finding.constraints.forEach(c => {
                const mappedField = this.ALLOWED_MAPPINGS[c.type];
                let hasEvidence = false;
                
                if (mappedField === 'singletonPatternDetected' || mappedField === 'replacementCandidates') {
                    if (evidence.constraintHints && evidence.constraintHints[mappedField] !== undefined) hasEvidence = true;
                } else if (mappedField) {
                    const val = evidence[mappedField];
                    if (Array.isArray(val) ? val.length > 0 : (typeof val === 'number' && val > 0)) hasEvidence = true;
                }

                if (!hasEvidence) {
                    test1Pass = false;
                    failureReasons.push(`Test 1 FAIL: Emitted ${c.type} for ${finding.nodeId} but source evidence is missing or 0.`);
                }
            });

            // =====================================
            // Test 2: Orphan Evidence Detection
            // =====================================
            if (evidence.blastRadius && evidence.blastRadius >= 5 && !finding.constraints.some(c => c.type === 'HIGH_PROPAGATION')) {
                test2WarnCount++;
                report += `> [!WARNING]\n> Test 2 WARN: ${finding.nodeId} has blastRadius=${evidence.blastRadius} but HIGH_PROPAGATION constraint was not emitted.\n\n`;
            }
            if (evidence.fanIn >= 3 && !finding.constraints.some(c => c.type === 'HIGH_INBOUND_DEPENDENCY')) {
                test2WarnCount++;
                report += `> [!WARNING]\n> Test 2 WARN: ${finding.nodeId} has fanIn=${evidence.fanIn} but HIGH_INBOUND_DEPENDENCY constraint was not emitted.\n\n`;
            }

            // =====================================
            // Test 3: Forbidden Vocabulary Scan
            // =====================================
            finding.constraints.forEach(c => {
                const fullText = (c.type + ' ' + c.description).toUpperCase();
                this.FORBIDDEN_TOKENS.forEach(token => {
                    if (fullText.includes(token)) {
                        test3Pass = false;
                        failureReasons.push(`Test 3 FAIL: Forbidden token "${token}" found in constraint for ${finding.nodeId}.`);
                    }
                });
            });

            // =====================================
            // Test 4: Bidirectional Mapping Audit
            // =====================================
            finding.constraints.forEach(c => {
                if (!this.ALLOWED_MAPPINGS[c.type]) {
                    test4Pass = false;
                    failureReasons.push(`Test 4 FAIL: Constraint type "${c.type}" is NOT in the allowed mapping whitelist.`);
                }
            });
        });

        report += `### Test 1: Constraint Source Completeness (환각 차단)\n`;
        report += test1Pass ? `> **Result: PASS** (All constraints are backed by hard evidence)\n\n` : `> **Result: FAIL**\n\n`;

        report += `### Test 2: Orphan Evidence Detection (제약 탐지 누락 방지)\n`;
        report += test2WarnCount === 0 ? `> **Result: PASS** (No orphan evidence detected)\n\n` : `> **Result: WARN** (${test2WarnCount} orphan evidence cases found)\n\n`;

        report += `### Test 3: Forbidden Vocabulary Scan (주관적 해석 배제)\n`;
        report += test3Pass ? `> **Result: PASS** (No subjective/interpretive tokens found)\n\n` : `> **Result: FAIL**\n\n`;

        report += `### Test 4: Bidirectional Mapping Audit (화이트리스트 통제)\n`;
        report += test4Pass ? `> **Result: PASS** (All generated constraints perfectly match the allowed vocabulary mapping)\n\n` : `> **Result: FAIL**\n\n`;

        if (failureReasons.length > 0) {
            report += `### Failure Details\n`;
            failureReasons.forEach(r => report += `- ${r}\n`);
        }

        return report;
    }
}

if (require.main === module) {
    const auditor = new GateIAudit();
    console.log(auditor.runAudit());
}
