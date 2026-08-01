import { EvidenceAggregator } from '../../../../src/core/analysis/intent/EvidenceAggregator';
import { EvidenceIR } from '../../../../src/core/analysis/intent/EvidenceIR';
import { ConfidenceEngine } from '../../../../src/core/analysis/intent/ConfidenceEngine';

describe('EvidenceAggregator & ConfidenceEngine', () => {
    it('should normalize and aggregate multiple evidences into a single IntentEdge', () => {
        const aggregator = new EvidenceAggregator();
        const confidenceEngine = new ConfidenceEngine();
        
        const evidenceList: EvidenceIR[] = [
            {
                id: '1',
                file: 'src/service/UserService.ts',
                line: 10,
                source: 'src/service/UserService.ts',
                target: 'src/repository/UserRepository.ts',
                evidenceType: 'FunctionCall',
                provider: 'RegexProvider',
                reason: 'Found import statement'
            },
            {
                id: '2',
                file: 'src/service/UserService.ts',
                line: 15,
                source: 'src/service/UserService.ts',
                target: 'src/repository/UserRepository.ts',
                evidenceType: 'FunctionCall',
                provider: 'DefinitionProvider',
                reason: 'Resolved definition of findById'
            },
            {
                id: '3',
                file: 'src/service/UserService.ts',
                line: 15,
                source: 'src/service/UserService.ts',
                target: 'src/repository/UserRepository.ts',
                evidenceType: 'FunctionCall',
                provider: 'ReferenceProvider',
                reason: 'Found reference to findById'
            }
        ];

        const edges = aggregator.aggregate(evidenceList);
        expect(edges.length).toBe(1);

        const edge = edges[0];
        expect(edge.source).toBe('src/service/UserService.ts');
        expect(edge.target).toBe('src/repository/UserRepository.ts');
        expect(edge.intent).toBe('FunctionCall');
        expect(edge.evidenceCount).toBe(3);
        expect(edge.providers).toContain('RegexProvider');
        expect(edge.providers).toContain('DefinitionProvider');
        expect(edge.providers).toContain('ReferenceProvider');

        // Test Confidence Calculation
        confidenceEngine.calculate(edge);
        // Regex (0.30) + Definition (0.40) + Reference (0.20) = 0.90
        expect(edge.confidence).toBeCloseTo(0.90);
    });

    it('should aggregate separate evidence pairs into separate edges', () => {
        const aggregator = new EvidenceAggregator();
        
        const evidenceList: EvidenceIR[] = [
            {
                id: '1',
                file: 'A.ts',
                line: 1,
                source: 'A.ts',
                target: 'B.ts',
                evidenceType: 'Dependency',
                provider: 'RegexProvider',
                reason: ''
            },
            {
                id: '2',
                file: 'A.ts',
                line: 2,
                source: 'A.ts',
                target: 'C.ts',
                evidenceType: 'Dependency',
                provider: 'RegexProvider',
                reason: ''
            }
        ];

        const edges = aggregator.aggregate(evidenceList);
        expect(edges.length).toBe(2);
    });
});
