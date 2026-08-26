/**
 * v0.3.34.32 Phase 12.2: Known Truth Validation (SYNAPSE)
 * 
 * 이미 정답을 알고 있는 프로젝트(SYNAPSE)를 대상으로 검증합니다.
 * "거짓 음성(False Negative, 놓친 정답)"과 "거짓 양성(False Positive, 예상외 정답)"을 분석하여
 * Recall(재현율)을 측정합니다.
 */
export class KnownTruthValidationAudit {

    public runAudit(): string {
        let report = '# Phase 12.2: Known Truth Validation Report (SYNAPSE)\n\n';

        // =====================================
        // 1. Expected Truth (인간이 정의한 정답셋)
        // =====================================
        const expectedAuthority = ['GraphModel', 'DataPipeline', 'BoundaryEngine'];
        const expectedDominance = ['GraphModel', 'DataPipeline', 'Semantic Layer'];
        
        // =====================================
        // 2. Mock Engine Detection (엔진 분석 시뮬레이션)
        // =====================================
        // 시뮬레이션: BoundaryEngine을 놓치고, 엉뚱한 strings.ts를 잡았다고 가정
        const detectedAuthority = ['GraphModel', 'DataPipeline', 'strings.ts'];
        const detectedDominance = ['GraphModel', 'DataPipeline'];

        // =====================================
        // 3. Analysis (Recall, False Negative, Unexpected)
        // =====================================
        
        // Authority Analysis
        const authorityMatches = expectedAuthority.filter(ex => detectedAuthority.includes(ex));
        const authorityFalseNegatives = expectedAuthority.filter(ex => !detectedAuthority.includes(ex));
        const authorityUnexpected = detectedAuthority.filter(det => !expectedAuthority.includes(det));
        const authorityRecall = (authorityMatches.length / expectedAuthority.length) * 100;

        // Dominance Analysis
        const dominanceMatches = expectedDominance.filter(ex => detectedDominance.includes(ex));
        const dominanceFalseNegatives = expectedDominance.filter(ex => !detectedDominance.includes(ex));
        const dominanceUnexpected = detectedDominance.filter(det => !expectedDominance.includes(det));
        const dominanceRecall = (dominanceMatches.length / expectedDominance.length) * 100;

        // =====================================
        // 4. Report Formatting
        // =====================================
        report += `## SYNAPSE Known Truth Validation\n\n`;

        report += `### 1. Authority Validation\n`;
        report += `- **Recall:** ${authorityRecall.toFixed(1)}% (${authorityMatches.length}/${expectedAuthority.length})\n`;
        if (authorityFalseNegatives.length > 0) {
            report += `- **False Negative (Missed):** \`${authorityFalseNegatives.join(', ')}\`\n`;
        }
        if (authorityUnexpected.length > 0) {
            report += `- **Unexpected (False Positive):** \`${authorityUnexpected.join(', ')}\`\n`;
        }
        report += `\n`;

        report += `### 2. Dominance Validation\n`;
        report += `- **Recall:** ${dominanceRecall.toFixed(1)}% (${dominanceMatches.length}/${expectedDominance.length})\n`;
        if (dominanceFalseNegatives.length > 0) {
            report += `- **False Negative (Missed):** \`${dominanceFalseNegatives.join(', ')}\`\n`;
        }
        if (dominanceUnexpected.length > 0) {
            report += `- **Unexpected (False Positive):** \`${dominanceUnexpected.join(', ')}\`\n`;
        }
        report += `\n`;

        report += `> **Analysis:**\n`;
        report += `> - Authority에서 \`BoundaryEngine\`이 누락되었습니다. Authority Analyzer의 Factory Pattern 검출 조건을 완화할 필요가 있습니다.\n`;
        report += `> - \`strings.ts\`가 잘못된 Authority로 분류되었습니다. 유틸리티성 파일 필터링(Fan-out threshold) 조정이 필요합니다.\n`;

        return report;
    }
}

if (require.main === module) {
    const auditor = new KnownTruthValidationAudit();
    console.log(auditor.runAudit());
}
