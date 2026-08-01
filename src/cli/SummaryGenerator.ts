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
            const resultPath = path.join(resultsDir, `${project}_result.json`);
            const metricsPath = path.join(resultsDir, `${project}_metrics.json`);
            
            if (!fs.existsSync(resultPath)) continue;

            const result: AnalysisResult = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
            const statusStr = result.status;
            let timeStr = `${Math.round(result.durationMs / 1000)}s`;
            let reasonStr = '-';
            let evStr = '-';
            let edgeStr = '-';
            let confStr = '-';
            let filesStr = '-';

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
        const files = fs.readdirSync(resultsDir);
        const projects: string[] = [];
        
        for (const file of files) {
            if (file.endsWith('_result.json')) {
                projects.push(file.replace('_result.json', ''));
            }
        }
        return projects;
    }
}
