import { IntentEdge } from './IntentEdge';

export class ConfidenceEngine {
    // Defined by v0.3.34.11 Bootstrapping documents
    private readonly providerScores: Record<string, number> = {
        'RegexProvider': 0.30,
        'DefinitionProvider': 0.40,
        'ReferenceProvider': 0.20,
        'SymbolProvider': 0.10
    };

    /**
     * Calculates confidence based on Positive Evidence.
     * Negative Evidence (Penalties) is disabled behind a feature flag for MVP.
     */
    calculate(edge: IntentEdge): number {
        let score = 0;

        for (const provider of edge.providers) {
            const providerScore = this.providerScores[provider] || 0.0;
            score += providerScore;
        }

        // Cap at 1.0 (100%)
        edge.confidence = Math.min(1.0, score);
        return edge.confidence;
    }

    calculateAll(edges: IntentEdge[]): IntentEdge[] {
        for (const edge of edges) {
            this.calculate(edge);
        }
        return edges;
    }
}
