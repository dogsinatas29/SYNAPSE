import { AnalysisMetrics, AnalysisResult } from './ProjectAnalyzer';
import * as fs from 'fs';
import * as path from 'path';

export class SummaryGenerator {
    generate(resultsDir: string): void {
        const projects = this.findProjects(resultsDir);
        const rows: string[] = [];
        
        // Header
        rows.push('| Project | Status | Reason | Evidence | Edge | Avg Conf | Time | Files |');
        rows.push('| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |');

        for (const project of projects) {
            const projectDir = path.join(resultsDir, project);
            const resultPath = path.join(projectDir, 'analysis_result.json');
            const metricsPath = path.join(projectDir, 'metrics.json');
            const verifyPath = path.join(projectDir, 'verification.json');
            
            if (!fs.existsSync(resultPath)) continue;

            const result: AnalysisResult = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
            let statusStr: string = result.status;
            let timeStr = `${Math.round(result.durationMs / 1000)}s`;
            let reasonStr = '-';
            let evStr = '-';
            let edgeStr = '-';
            let confStr = '-';
            let filesStr = '-';

            // Also read verify status
            if (result.status === 'PASS' && fs.existsSync(verifyPath)) {
                const verifyResult = JSON.parse(fs.readFileSync(verifyPath, 'utf8'));
                if (verifyResult.verificationStatus === 'FAIL') {
                    statusStr = 'PASS (V-FAIL)';
                    reasonStr = `Verification: ${verifyResult.reason}`;
                }
            }

            if (result.status === 'PASS' && fs.existsSync(metricsPath)) {
                const metrics: AnalysisMetrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
                evStr = metrics.evidenceCount.toString();
                edgeStr = metrics.intentEdgeCount.toString();
                confStr = metrics.averageConfidence.toFixed(2);
                filesStr = metrics.filesScanned.toString();
            } else {
                // Display error cause
                reasonStr = result.error ? result.error : 'Unknown failure';
            }

            rows.push(`| ${result.projectName} | ${statusStr} | ${reasonStr} | ${evStr} | ${edgeStr} | ${confStr} | ${timeStr} | ${filesStr} |`);
        }

        const summaryContent = `# Architecture Intelligence Engine (v0.3.34.11) - Batch Summary\n\n${rows.join('\n')}\n`;
        fs.writeFileSync(path.join(resultsDir, 'summary.md'), summaryContent, 'utf8');
    }

    private findProjects(resultsDir: string): string[] {
        if (!fs.existsSync(resultsDir)) return [];
        return fs.readdirSync(resultsDir).filter(f => {
            const full = path.join(resultsDir, f);
            return fs.statSync(full).isDirectory();
        });
    }
}
