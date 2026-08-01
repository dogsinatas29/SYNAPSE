import { EvidenceIR } from './EvidenceIR';
import { IntentEdge } from './IntentEdge';

export interface EvidenceKey {
    source: string; // File level
    target: string; // File level
    evidenceType: string;
}

export class EvidenceAggregator {
    /**
     * V0.3.34.11 MVP Rule: File-Level Aggregation
     * Source and target are normalized to file paths.
     */
    aggregate(evidenceList: EvidenceIR[]): IntentEdge[] {
        const edgeMap = new Map<string, IntentEdge>();

        for (const evidence of evidenceList) {
            // MVP: We assume source and target in EvidenceIR are file paths.
            // If they are symbol level, they must be mapped to file level before this phase, 
            // or we use the `file` property for the target and somehow resolve source file.
            // Actually, based on the blueprint, the EvidenceKey uses the `source` and `target`.
            // In v0.3.34.11, we treat `source` and `target` as files for IntentEdge.
            const key = this.generateKey(evidence);

            if (!edgeMap.has(key)) {
                edgeMap.set(key, {
                    source: evidence.source,
                    target: evidence.target,
                    intent: evidence.evidenceType, // e.g., FunctionCall, Dependency
                    confidence: 0, // Calculated later by ConfidenceEngine
                    evidenceCount: 0,
                    providers: []
                });
            }

            const edge = edgeMap.get(key)!;
            edge.evidenceCount++;
            
            if (!edge.providers.includes(evidence.provider)) {
                edge.providers.push(evidence.provider);
            }
        }

        return Array.from(edgeMap.values());
    }

    private generateKey(evidence: EvidenceIR): string {
        return `${evidence.source}|${evidence.target}|${evidence.evidenceType}`;
    }
}
