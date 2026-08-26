import { ArchitecturalReasoningModelBuilder } from '../core/reasoning/builders/ArchitecturalReasoningModelBuilder';
import { ArchitectReportBuilder } from '../core/reporting/ArchitectReportBuilder';
import * as crypto from 'crypto';

/**
 * v0.3.34.32 Phase 11.5: Gate O Series Audit
 * 
 * Render Purity Gate.
 * ArchitectReportBuilder가 마크다운을 직렬화할 때,
 * 1. 모델이 같으면 리포트 해시가 동일한지 (Determinism)
 * 2. 리포트 내 렌더링된 요소들이 [REF] 태그를 보존하는지 (Traceability)
 * 3. 템플릿 엔진 차원에서 환각 단어(HEALTHY, SHOULD 등)를 주입하지 않는지 (Vocabulary)
 * 를 철저히 검증합니다.
 */
export class GateOSeriesAudit {

    private readonly FORBIDDEN_TOKENS = [
        'HEALTHY', 'UNHEALTHY', 'GOOD', 'BAD', 'BEST', 
        'CRITICAL', 'IMPORTANT', 'SHOULD', 'RECOMMENDED', 
        'WILL', 'LIKELY', 'SUMMARY', 'CONCLUSION'
    ];

    public runAudit(): string {
        let report = '# Phase 11.5: Gate O Series (Render Purity Report)\n\n';

        const modelBuilder = new ArchitecturalReasoningModelBuilder();
        
        // Mock Model Assembly
        modelBuilder.setAuthority([{
            nodeId: 'MockAuthNode', signals: [{ type: 'HIGH_INBOUND', description: 'Mock', evidenceReferences: ['fanIn'] }]
        }]);
        modelBuilder.setConstraints([{
            nodeId: 'MockConstraintNode', constraints: [{ type: 'HIGH_PROPAGATION', description: 'Mock' }], evidenceReferences: ['blastRadius']
        }]);
        modelBuilder.setTransitions([{
            from: 'DISCOVERED', event: 'AUTHORITY_SIGNAL_FOUND', to: 'AUTHORITY_IDENTIFIED'
        }]);

        const model1 = modelBuilder.build();
        model1.timestamp = 0; // Hash 비교를 위한 타임스탬프 고정

        const reportBuilder = new ArchitectReportBuilder();
        
        const reportA = reportBuilder.renderReport(model1);
        const reportB = reportBuilder.renderReport(model1);

        let testOPass = true;
        let testO5Pass = true;
        let testO75Pass = true;
        let failureReasons: string[] = [];

        // =====================================
        // Gate O: Render Determinism Audit
        // =====================================
        const hashA = crypto.createHash('sha256').update(reportA).digest('hex');
        const hashB = crypto.createHash('sha256').update(reportB).digest('hex');

        if (hashA !== hashB) {
            testOPass = false;
            failureReasons.push(`Gate O FAIL: Identical model produced different markdown output (Hash mismatch).`);
        }

        // =====================================
        // Gate O.5: Render Traceability Audit
        // =====================================
        const dataLines = reportA.split('\\n').filter(l => l.trim().startsWith('- Node:'));
        dataLines.forEach(line => {
            if (!line.includes('[REF:')) {
                testO5Pass = false;
                failureReasons.push(`Gate O.5 FAIL: Line missing evidence reference binding. Line: "${line}"`);
            }
        });

        // =====================================
        // Gate O.75: Render Vocabulary Audit
        // =====================================
        const upperReport = reportA.toUpperCase();
        this.FORBIDDEN_TOKENS.forEach(token => {
            if (upperReport.includes(token)) {
                testO75Pass = false;
                failureReasons.push(`Gate O.75 FAIL: Found forbidden interpretation token "${token}" injected by template engine.`);
            }
        });

        // =====================================
        // Formatting Report
        // =====================================
        report += `### Gate O: Render Determinism (Markdown Hash 동일성)\n`;
        report += testOPass ? `> **Result: PASS** (Hash strictly matches across multiple renders)\n\n` : `> **Result: FAIL**\n\n`;

        report += `### Gate O.5: Render Traceability (모든 문장 역추적)\n`;
        report += testO5Pass ? `> **Result: PASS** (All rendered statements properly inject [REF: Source])\n\n` : `> **Result: FAIL**\n\n`;

        report += `### Gate O.75: Render Vocabulary (템플릿 환각 차단)\n`;
        report += testO75Pass ? `> **Result: PASS** (Template engine does not contain subjective/recommendation words)\n\n` : `> **Result: FAIL**\n\n`;

        if (failureReasons.length > 0) {
            report += `### Failure Details\n`;
            failureReasons.forEach(r => report += `- ${r}\n`);
        }

        return report;
    }
}

if (require.main === module) {
    const auditor = new GateOSeriesAudit();
    console.log(auditor.runAudit());
}
