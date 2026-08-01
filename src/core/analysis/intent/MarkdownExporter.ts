import { ReasonedReportBundle } from './ReasonedReportBundle';

export class MarkdownExporter {
    export(bundle: ReasonedReportBundle): string {
        const lines: string[] = [];

        lines.push('# Architecture Intelligence Report');
        lines.push(`Generated At: ${bundle.generatedAt}`);
        lines.push('');

        lines.push('## Executive Summary');
        lines.push(`- **Evidence Count**: ${bundle.evidenceCount}`);
        lines.push(`- **Intent Edge Count**: ${bundle.intentEdgeCount}`);
        lines.push(`- **Average Confidence**: ${(bundle.averageConfidence * 100).toFixed(2)}%`);
        lines.push('');

        lines.push('## Findings');
        if (bundle.findings.length === 0) {
            lines.push('*No findings recorded.*');
        } else {
            for (const finding of bundle.findings) {
                lines.push(`### ${finding.title}`);
                lines.push(`- **Confidence**: ${(finding.confidence * 100).toFixed(2)}%`);
                lines.push('');
                lines.push(finding.description);
                lines.push('');
            }
        }
        lines.push('');

        lines.push('## Intent Graph Summary');
        if (bundle.intentEdges.length === 0) {
            lines.push('*No intent edges found.*');
        } else {
            for (const edge of bundle.intentEdges) {
                lines.push(`- **${edge.source}** -> **${edge.target}**`);
                lines.push(`  - Intent: ${edge.intent}`);
                lines.push(`  - Confidence: ${(edge.confidence * 100).toFixed(2)}%`);
                lines.push(`  - Evidence Count: ${edge.evidenceCount}`);
                lines.push(`  - Providers: ${edge.providers.join(', ')}`);
            }
        }
        lines.push('');

        lines.push('## Evidence Inventory');
        if (bundle.evidence.length === 0) {
            lines.push('*No evidence found.*');
        } else {
            for (const ev of bundle.evidence) {
                lines.push(`- [${ev.provider}] **${ev.source}** -> **${ev.target}** (${ev.evidenceType})`);
                lines.push(`  - File: ${ev.file}:${ev.line}`);
                lines.push(`  - Reason: ${ev.reason}`);
            }
        }

        return lines.join('\n');
    }
}
