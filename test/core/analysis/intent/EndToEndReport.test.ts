import { RegexProvider } from '../../../../src/core/analysis/intent/RegexProvider';
import { VSCodeProvider } from '../../../../src/core/analysis/intent/VSCodeProvider';
import { EvidenceAggregator } from '../../../../src/core/analysis/intent/EvidenceAggregator';
import { ConfidenceEngine } from '../../../../src/core/analysis/intent/ConfidenceEngine';
import { ReasonedReportBundle } from '../../../../src/core/analysis/intent/ReasonedReportBundle';
import { MarkdownExporter } from '../../../../src/core/analysis/intent/MarkdownExporter';
import { HtmlReportGenerator } from '../../../../src/core/analysis/intent/HtmlReportGenerator';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('End-to-End Report Generation', () => {
    it('should successfully pass data through the entire pipeline and generate reports', async () => {
        // We simulate a small workspace with A.ts and B.ts.
        // RegexProvider will use a stub FileScanner for this test to avoid real FS operations.
        
        // 1. Providers Collection
        const regexProvider = new RegexProvider([]);
        const vscodeProvider = new VSCodeProvider([]);
        
        // Mock the collect to return some static evidence simulating file reading
        jest.spyOn(regexProvider, 'collect').mockResolvedValue([
            { id: '1', file: 'A.ts', line: 1, source: 'A.ts', target: 'B.ts', evidenceType: 'Dependency', provider: 'RegexProvider', reason: 'import found' }
        ]);
        jest.spyOn(vscodeProvider, 'collect').mockResolvedValue([
            { id: '2', file: 'A.ts', line: 1, source: 'A.ts', target: 'B.ts', evidenceType: 'Dependency', provider: 'DefinitionProvider', reason: 'def resolved', metadata: { symbol: 'foo' } },
            { id: '3', file: 'A.ts', line: 5, source: 'A.ts', target: 'B.ts', evidenceType: 'Dependency', provider: 'ReferenceProvider', reason: 'ref found', metadata: { symbol: 'foo' } }
        ]);

        const evidence1 = await regexProvider.collect();
        const evidence2 = await vscodeProvider.collect();
        const allEvidence = [...evidence1, ...evidence2];

        // 2. Aggregation
        const aggregator = new EvidenceAggregator();
        const intentEdges = aggregator.aggregate(allEvidence);

        // 3. Confidence Calculation
        const confidenceEngine = new ConfidenceEngine();
        confidenceEngine.calculateAll(intentEdges);

        // 4. Bundle Construction
        const bundle: ReasonedReportBundle = {
            generatedAt: new Date().toISOString(),
            evidenceCount: allEvidence.length,
            intentEdgeCount: intentEdges.length,
            averageConfidence: intentEdges.reduce((acc, edge) => acc + edge.confidence, 0) / (intentEdges.length || 1),
            evidence: allEvidence,
            intentEdges: intentEdges,
            findings: [
                {
                    title: 'System Analysis Complete',
                    description: 'Successfully parsed dependencies using mixed providers.',
                    confidence: 0.95
                }
            ]
        };

        // 5. Export to Markdown
        const mdExporter = new MarkdownExporter();
        const mdResult = mdExporter.export(bundle);
        expect(mdResult).toContain('A.ts');
        expect(mdResult).toContain('B.ts');
        expect(mdResult).toContain('90.00%'); // Regex(0.3) + Def(0.4) + Ref(0.2) = 0.9

        // 6. Export to HTML
        const htmlExporter = new HtmlReportGenerator();
        const htmlResult = htmlExporter.export ? htmlExporter.export(bundle) : (htmlExporter as any).generate(bundle);
        expect(htmlResult).toContain('A.ts &rarr; B.ts');
        expect(htmlResult).toContain('System Analysis Complete');

        // Optional: Ensure files can be written to disk (simulated by tmpdir)
        const tmpDir = os.tmpdir();
        const mdPath = path.join(tmpDir, 'logic_report.md');
        const htmlPath = path.join(tmpDir, 'logic_report.html');
        
        fs.writeFileSync(mdPath, mdResult);
        fs.writeFileSync(htmlPath, htmlResult);
        
        expect(fs.existsSync(mdPath)).toBe(true);
        expect(fs.existsSync(htmlPath)).toBe(true);
        
        // cleanup
        fs.unlinkSync(mdPath);
        fs.unlinkSync(htmlPath);
    });
});
