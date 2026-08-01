import { MarkdownExporter } from '../../../../src/core/analysis/intent/MarkdownExporter';
import { ReasonedReportBundle } from '../../../../src/core/analysis/intent/ReasonedReportBundle';

describe('MarkdownExporter', () => {
    it('should generate markdown report without computation logic', () => {
        const exporter = new MarkdownExporter();
        
        const mockBundle: ReasonedReportBundle = {
            generatedAt: '2023-10-10T12:00:00Z',
            evidenceCount: 1,
            intentEdgeCount: 1,
            averageConfidence: 0.75,
            evidence: [
                {
                    id: 'ev-1',
                    file: 'src/App.ts',
                    line: 1,
                    source: 'src/App.ts',
                    target: 'src/Logger.ts',
                    evidenceType: 'Dependency',
                    provider: 'RegexProvider',
                    reason: 'import found'
                }
            ],
            intentEdges: [
                {
                    source: 'src/App.ts',
                    target: 'src/Logger.ts',
                    intent: 'Dependency',
                    confidence: 0.75,
                    evidenceCount: 1,
                    providers: ['RegexProvider']
                }
            ],
            findings: [
                {
                    title: 'High Coupling Detected',
                    description: 'App.ts is tightly coupled to Logger.ts.',
                    confidence: 0.8
                }
            ]
        };

        const markdown = exporter.export(mockBundle);

        expect(markdown).toContain('# Architecture Intelligence Report');
        expect(markdown).toContain('Generated At: 2023-10-10T12:00:00Z');
        expect(markdown).toContain('- **Evidence Count**: 1');
        expect(markdown).toContain('- **Intent Edge Count**: 1');
        expect(markdown).toContain('- **Average Confidence**: 75.00%');
        expect(markdown).toContain('### High Coupling Detected');
        expect(markdown).toContain('- **Confidence**: 80.00%');
        expect(markdown).toContain('App.ts is tightly coupled to Logger.ts.');
        expect(markdown).toContain('- **src/App.ts** -> **src/Logger.ts**');
        expect(markdown).toContain('  - Intent: Dependency');
        expect(markdown).toContain('  - Confidence: 75.00%');
        expect(markdown).toContain('- [RegexProvider] **src/App.ts** -> **src/Logger.ts** (Dependency)');
    });
});
