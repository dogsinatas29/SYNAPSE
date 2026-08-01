import { HtmlReportGenerator } from '../../../../src/core/analysis/intent/HtmlReportGenerator';
import { ReasonedReportBundle } from '../../../../src/core/analysis/intent/ReasonedReportBundle';

describe('HtmlReportGenerator', () => {
    it('should generate a standalone HTML report without computation logic', () => {
        const generator = new HtmlReportGenerator();
        
        const mockBundle: ReasonedReportBundle = {
            generatedAt: '2023-10-10T12:00:00Z',
            evidenceCount: 2,
            intentEdgeCount: 1,
            averageConfidence: 0.90,
            evidence: [
                {
                    id: 'ev-1',
                    file: 'src/App.ts',
                    line: 1,
                    source: 'src/App.ts',
                    target: 'src/Logger.ts',
                    evidenceType: 'Dependency',
                    provider: 'RegexProvider',
                    reason: 'import found',
                    metadata: { symbol: 'Logger' }
                }
            ],
            intentEdges: [
                {
                    source: 'src/App.ts',
                    target: 'src/Logger.ts',
                    intent: 'Dependency',
                    confidence: 0.90,
                    evidenceCount: 2,
                    providers: ['RegexProvider', 'DefinitionProvider']
                }
            ],
            findings: [
                {
                    title: 'Solid Architecture',
                    description: 'No problematic loops detected.',
                    confidence: 1.0
                }
            ]
        };

        const html = generator.generate(mockBundle);

        // Core constraints checks
        expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
        expect(html).toContain('<style>'); // Inline CSS
        expect(html).toContain('Generated At: <strong>2023-10-10T12:00:00Z</strong>');
        
        // Findings mapping
        expect(html).toContain('Solid Architecture');
        expect(html).toContain('Confidence: 100.00%');
        expect(html).toContain('No problematic loops detected.');

        // Intent Edge mapping
        expect(html).toContain('src/App.ts &rarr; src/Logger.ts');
        expect(html).toContain('90.00%'); // avg confidence & edge confidence
        expect(html).toContain('RegexProvider, DefinitionProvider');

        // Evidence mapping
        expect(html).toContain('provider-badge">RegexProvider');
        expect(html).toContain('<code>src/App.ts:1</code>');
    });
});
