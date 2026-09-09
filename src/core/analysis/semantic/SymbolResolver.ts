export interface SymbolEvidence {
    source: string;
    score: number;
    details: string;
}

export interface SymbolCandidate {
    symbolId: string; // Node ID or file path or actual symbol
    confidence: number;
    evidence: SymbolEvidence[];
}

export interface SymbolResolutionResult {
    status: 'RESOLVED' | 'UNKNOWN';
    symbol?: string;
    confidence: number;
    evidence: SymbolEvidence[];
    candidates: SymbolCandidate[]; // Top N candidates
}

export class SymbolResolver {
    private static CONFIDENCE_THRESHOLD = 0.5;

    static resolve(
        nodes: any[], 
        profile: any | null,
        degreeMap?: Map<string, { in: number, out: number, total: number }>
    ): SymbolResolutionResult {
        const candidates: SymbolCandidate[] = [];

        for (const node of nodes) {
            const nodeId = node.id || '';
            const filePath = node.filePath || nodeId;
            let confidence = 0;
            const evidence: SymbolEvidence[] = [];

            // 1. Search Zone Evidence (Strong indicator for entry points)
            if (profile && profile.entryPointSearchZones.length > 0) {
                const inSearchZone = profile.entryPointSearchZones.some((zone: string) => filePath.includes(zone));
                if (inSearchZone) {
                    confidence += 0.4;
                    evidence.push({ source: 'SEARCH_ZONE', score: 0.4, details: 'Located in known entry search zone' });
                }
            }

            // 2. Profile Expected Symbol Evidence (Heuristic Boost)
            if (profile && profile.evidenceSymbols.length > 0) {
                // In a file-level graph, check if filename matches symbol, or we can assume it's extracted elsewhere
                const matchesSymbol = profile.evidenceSymbols.some((sym: string) => filePath.includes(sym));
                if (matchesSymbol) {
                    confidence += 0.3;
                    evidence.push({ source: 'SYMBOL_MATCH', score: 0.3, details: 'Matches profile evidence symbol' });
                }
            }

            // 3. Topology Evidence (Root-like characteristics)
            if (degreeMap) {
                const degree = degreeMap.get(nodeId);
                if (degree) {
                    // Entry points often have high Fan-Out (calling many things to initialize)
                    if (degree.out > 10) {
                        confidence += 0.15;
                        evidence.push({ source: 'TOPOLOGY_FAN_OUT', score: 0.15, details: `High fan-out (${degree.out})` });
                    }
                    
                    // True roots have very low or zero internal Fan-In (except from global platforms)
                    // If Fan-in is massively high like blk-core.c, it's a utility/platform, NOT an entry point.
                    if (degree.in === 0) {
                        confidence += 0.2;
                        evidence.push({ source: 'TOPOLOGY_ROOT', score: 0.2, details: 'Zero inbound edges (Root)' });
                    } else if (degree.in < 5) {
                        confidence += 0.1;
                        evidence.push({ source: 'TOPOLOGY_LOW_IN', score: 0.1, details: `Low fan-in (${degree.in})` });
                    } else if (degree.in > 50) {
                        // Penalty for being a massive utility hub
                        confidence -= 0.3;
                        evidence.push({ source: 'TOPOLOGY_HUB_PENALTY', score: -0.3, details: `Massive fan-in (${degree.in}) implies utility, not entry point` });
                    }
                }
            }

            if (confidence > 0) {
                candidates.push({
                    symbolId: nodeId,
                    confidence: Math.max(0, Math.min(1.0, confidence)), // Clamp 0-1
                    evidence
                });
            }
        }

        // Sort by highest confidence
        candidates.sort((a, b) => b.confidence - a.confidence);

        const topN = candidates.slice(0, 5);
        const bestCandidate = topN.length > 0 ? topN[0] : null;

        if (bestCandidate && bestCandidate.confidence >= this.CONFIDENCE_THRESHOLD) {
            return {
                status: 'RESOLVED',
                symbol: bestCandidate.symbolId,
                confidence: bestCandidate.confidence,
                evidence: bestCandidate.evidence,
                candidates: topN
            };
        }

        return {
            status: 'UNKNOWN',
            confidence: bestCandidate ? bestCandidate.confidence : 0,
            evidence: bestCandidate ? bestCandidate.evidence : [{ source: 'NONE', score: 0, details: 'No candidates reached threshold' }],
            candidates: topN
        };
    }
}
