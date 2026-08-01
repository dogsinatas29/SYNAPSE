import { EvidenceAggregator } from '../../../../src/core/analysis/intent/EvidenceAggregator';
import { ConfidenceEngine } from '../../../../src/core/analysis/intent/ConfidenceEngine';
import { EvidenceIR } from '../../../../src/core/analysis/intent/EvidenceIR';

describe('Provider Integration & Core Engine Tests', () => {
    let aggregator: EvidenceAggregator;
    let confidenceEngine: ConfidenceEngine;

    beforeEach(() => {
        aggregator = new EvidenceAggregator();
        confidenceEngine = new ConfidenceEngine();
    });

    it('Case 1: Regex alone yields IntentEdge with confidence 0.30', () => {
        const evidenceList: EvidenceIR[] = [
            {
                id: 'ev-1',
                file: 'A.ts',
                line: 2,
                source: 'A.ts',
                target: 'B.ts',
                evidenceType: 'Dependency',
                provider: 'RegexProvider',
                reason: 'import B'
            }
        ];

        const edges = aggregator.aggregate(evidenceList);
        expect(edges.length).toBe(1);

        const edge = edges[0];
        confidenceEngine.calculate(edge);

        expect(edge.evidenceCount).toBe(1);
        expect(edge.providers).toEqual(['RegexProvider']);
        expect(edge.confidence).toBeCloseTo(0.30);
    });

    it('Case 2: Regex + Definition yields IntentEdge with confidence 0.70', () => {
        const evidenceList: EvidenceIR[] = [
            {
                id: 'ev-2a',
                file: 'A.ts',
                line: 2,
                source: 'A.ts',
                target: 'B.ts',
                evidenceType: 'Dependency',
                provider: 'RegexProvider',
                reason: 'import B'
            },
            {
                id: 'ev-2b',
                file: 'A.ts',
                line: 5,
                source: 'A.ts',
                target: 'B.ts',
                evidenceType: 'Dependency',
                provider: 'DefinitionProvider',
                reason: 'resolved definition in B.ts'
            }
        ];

        const edges = aggregator.aggregate(evidenceList);
        expect(edges.length).toBe(1);

        const edge = edges[0];
        confidenceEngine.calculate(edge);

        expect(edge.evidenceCount).toBe(2);
        expect(edge.providers).toContain('RegexProvider');
        expect(edge.providers).toContain('DefinitionProvider');
        expect(edge.confidence).toBeCloseTo(0.70); // 0.30 + 0.40
    });

    it('Case 3: Regex only (LSP missing environment) yields IntentEdge with confidence 0.30', () => {
        const regexEvidence: EvidenceIR[] = [
            {
                id: 'ev-3',
                file: 'LinuxKernel.c',
                line: 10,
                source: 'LinuxKernel.c',
                target: 'stdio.h',
                evidenceType: 'Dependency',
                provider: 'RegexProvider',
                reason: '#include <stdio.h>'
            }
        ];
        
        const edges = aggregator.aggregate(regexEvidence);
        const edge = edges[0];
        confidenceEngine.calculate(edge);
        expect(edge.confidence).toBeCloseTo(0.30);
    });

    it('Case 4: Definition only yields confidence 0.40', () => {
        const edges = aggregator.aggregate([{
            id: 'ev-4', file: 'A.ts', line: 1, source: 'A.ts', target: 'B.ts', 
            evidenceType: 'Dependency', provider: 'DefinitionProvider', reason: '',
            metadata: { symbol: 'Logger.info' }
        }]);
        confidenceEngine.calculate(edges[0]);
        expect(edges[0].confidence).toBeCloseTo(0.40);
    });

    it('Case 5: Reference only yields confidence 0.20', () => {
        const edges = aggregator.aggregate([{
            id: 'ev-5', file: 'A.ts', line: 1, source: 'A.ts', target: 'B.ts', 
            evidenceType: 'Dependency', provider: 'ReferenceProvider', reason: '',
            metadata: { symbol: 'Logger.info' }
        }]);
        confidenceEngine.calculate(edges[0]);
        expect(edges[0].confidence).toBeCloseTo(0.20);
    });

    it('Case 6: Symbol only yields confidence 0.10', () => {
        const edges = aggregator.aggregate([{
            id: 'ev-6', file: 'A.ts', line: 1, source: 'A.ts', target: 'B.ts', 
            evidenceType: 'Dependency', provider: 'SymbolProvider', reason: '',
            metadata: { symbol: 'Logger.info' }
        }]);
        confidenceEngine.calculate(edges[0]);
        expect(edges[0].confidence).toBeCloseTo(0.10);
    });

    it('Case 7: Definition + Reference (No Regex) yields confidence 0.60', () => {
        const edges = aggregator.aggregate([
            { id: 'ev-7a', file: 'A.ts', line: 1, source: 'A.ts', target: 'B.ts', evidenceType: 'Dependency', provider: 'DefinitionProvider', reason: '' },
            { id: 'ev-7b', file: 'A.ts', line: 2, source: 'A.ts', target: 'B.ts', evidenceType: 'Dependency', provider: 'ReferenceProvider', reason: '' }
        ]);
        confidenceEngine.calculate(edges[0]);
        expect(edges[0].confidence).toBeCloseTo(0.60);
    });
});
