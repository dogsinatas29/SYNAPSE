import { ProjectAnalyzer } from './ProjectAnalyzer';
import { SummaryGenerator } from './SummaryGenerator';
import { MarkdownExporter } from '../core/analysis/intent/MarkdownExporter';
import { HtmlReportGenerator } from '../core/analysis/intent/HtmlReportGenerator';
import { ReportVerifier } from './ReportVerifier';
import * as fs from 'fs';
import * as path from 'path';

export class BatchRunner {
    private readonly timeoutMs = 30 * 60 * 1000; // 30 minutes

    async run(projectsJsonPath?: string): Promise<void> {
        const targetConfig = projectsJsonPath || path.resolve(process.cwd(), 'projects.json');
        
        if (!fs.existsSync(targetConfig)) {
            console.error(`ERROR: Cannot find config file at ${targetConfig}`);
            process.exit(1);
        }

        const projects: string[] = JSON.parse(fs.readFileSync(targetConfig, 'utf8'));
        const outputDir = path.resolve(process.cwd(), 'synapse-test');
        
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const analyzer = new ProjectAnalyzer();
        const mdExporter = new MarkdownExporter();
        const htmlExporter = new HtmlReportGenerator();

        console.log(`Starting Batch Analysis for ${projects.length} projects...\n`);

        for (const projectPath of projects) {
            const projectName = path.basename(projectPath);
            const projectOutDir = path.join(outputDir, projectName);
            
            if (!fs.existsSync(projectOutDir)) {
                fs.mkdirSync(projectOutDir, { recursive: true });
            }

            console.log(`Analyzing [${projectName}]...`);

            try {
                // Orchestrate execution with 30-minute timeout
                const timeoutPromise = new Promise<any>((_, reject) => {
                    setTimeout(() => reject(new Error('TIMEOUT')), this.timeoutMs);
                });

                const result = await Promise.race([
                    analyzer.analyze(projectPath),
                    timeoutPromise
                ]);

                // Write analysis_result.json
                const { bundle, ...resultWithoutBundle } = result;
                fs.writeFileSync(
                    path.join(projectOutDir, 'analysis_result.json'), 
                    JSON.stringify(resultWithoutBundle, null, 2), 
                    'utf8'
                );

                if (result.status === 'PASS' && bundle && result.metrics) {
                    // Save SSOT Metrics
                    fs.writeFileSync(
                        path.join(projectOutDir, 'metrics.json'),
                        JSON.stringify(result.metrics, null, 2),
                        'utf8'
                    );

                    // Generate Reports
                    const mdReport = mdExporter.export(bundle);
                    fs.writeFileSync(path.join(projectOutDir, 'logic_report.md'), mdReport, 'utf8');

                    const htmlReport = htmlExporter.generate(bundle);
                    fs.writeFileSync(path.join(projectOutDir, 'logic_report.html'), htmlReport, 'utf8');

                    // Write raw data to data/ subdir (Machine-readable, full fidelity)
                    const dataDir = path.join(projectOutDir, 'synapse_data');
                    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
                    fs.writeFileSync(path.join(dataDir, 'intent_edges.json'), JSON.stringify(bundle.intentEdges, null, 2), 'utf8');
                    fs.writeFileSync(path.join(dataDir, 'onboarding_map.json'), JSON.stringify(bundle.onboardingMap, null, 2), 'utf8');
                    // evidence.json deferred to v0.3.34.12 (volume too large for MVP)

                    // Verify output
                    const verifier = new ReportVerifier();
                    const verifyResult = verifier.verify(projectOutDir);
                    
                    fs.writeFileSync(
                        path.join(projectOutDir, 'verification.json'),
                        JSON.stringify(verifyResult, null, 2),
                        'utf8'
                    );

                    if (verifyResult.verificationStatus === 'PASS') {
                        console.log(`✅ [${projectName}] PASS (${result.durationMs}ms)`);
                    } else {
                        console.log(`⚠️ [${projectName}] PASS (Verification Failed: ${verifyResult.reason})`);
                    }
                } else {
                    console.error(`❌ [${projectName}] ${result.status} - ${result.error}`);
                }

            } catch (err: any) {
                // Handle hard timeout exception or outer crash
                const status = err.message === 'TIMEOUT' ? 'TIMEOUT' : 'FAIL';
                const errorStr = err.message || String(err);
                
                const failResult = {
                    version: '0.3.34.11',
                    projectName,
                    status: status,
                    durationMs: this.timeoutMs,
                    error: errorStr
                };

                fs.writeFileSync(
                    path.join(projectOutDir, 'analysis_result.json'), 
                    JSON.stringify(failResult, null, 2), 
                    'utf8'
                );

                console.error(`❌ [${projectName}] ${status} - ${errorStr}`);
            }
        }

        console.log(`\nGenerating Summary...`);
        const summaryGen = new SummaryGenerator();
        summaryGen.generate(outputDir);
        console.log(`Summary generated at: ${path.join(outputDir, 'summary.md')}`);
    }
}
