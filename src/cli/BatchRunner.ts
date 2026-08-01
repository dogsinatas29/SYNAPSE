import { ProjectAnalyzer } from './ProjectAnalyzer';
import { SummaryGenerator } from './SummaryGenerator';
import { MarkdownExporter } from '../core/analysis/intent/MarkdownExporter';
import { HtmlReportGenerator } from '../core/analysis/intent/HtmlReportGenerator';
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
        const outputDir = path.resolve(process.cwd(), '.synapse-test');
        
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const analyzer = new ProjectAnalyzer();
        const mdExporter = new MarkdownExporter();
        const htmlExporter = new HtmlReportGenerator();

        console.log(`Starting Batch Analysis for ${projects.length} projects...\n`);

        for (const projectPath of projects) {
            const projectName = path.basename(projectPath);
            
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
                    path.join(outputDir, `${projectName}_result.json`), 
                    JSON.stringify(resultWithoutBundle, null, 2), 
                    'utf8'
                );

                if (result.status === 'PASS' && bundle && result.metrics) {
                    // Save SSOT Metrics
                    fs.writeFileSync(
                        path.join(outputDir, `${projectName}_metrics.json`),
                        JSON.stringify(result.metrics, null, 2),
                        'utf8'
                    );

                    // Generate Reports
                    const mdReport = mdExporter.export(bundle);
                    fs.writeFileSync(path.join(outputDir, `${projectName}.md`), mdReport, 'utf8');

                    const htmlReport = htmlExporter.generate(bundle);
                    fs.writeFileSync(path.join(outputDir, `${projectName}.html`), htmlReport, 'utf8');

                    console.log(`✅ [${projectName}] PASS (${result.durationMs}ms)`);
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
                    path.join(outputDir, `${projectName}_result.json`), 
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
