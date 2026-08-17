import { Finding } from '../rules/Rule';
import { ReasoningSnapshot } from '../snapshot/ReasoningSnapshot';
import { EvidenceCategory, IExtensionEvidence } from '../evidence/Evidence';
import { GraphModel, Edge } from '../../GraphModel';
import { ExtensionPointCandidateGenerator } from '../../ir/generators/ExtensionPointCandidateGenerator';
import { ExtensionPointEvidenceEvaluator } from '../../ir/evaluators/ExtensionPointEvidenceEvaluator';

export class ExtensionAnalyzer {
    public analyze(snapshot: ReasoningSnapshot, findings: Finding[], graph: GraphModel): ReasoningSnapshot {
        const newSnapshot = snapshot.clone();
        const graphSnapshot = graph.createSnapshot();

        // 1. Generate Candidates
        const generator = new ExtensionPointCandidateGenerator();
        const { candidates } = generator.generate(graph);
        console.log('[EXT] candidates', candidates.length);

        // 2. Evaluate Evidence
        const evaluator = new ExtensionPointEvidenceEvaluator();
        const facts = candidates.map(c => evaluator.evaluate(c, graph));
        console.log('[EXT] evidences', facts.length);

        // 3. Emit Evidence with Strong/Medium/Weak signals
        for (const fact of facts) {
            const candidate = candidates.find(c => c.id === fact.candidateId);
            if (!candidate) continue;

            const ev: IExtensionEvidence = {
                id: `ev-ext-${candidate.nodeId}`,
                category: EvidenceCategory.EXTENSION,
                nodeId: candidate.nodeId,
                description: `Extension Point Evidence for ${candidate.nodeId}`,
                metadata: {
                    interfaceId: candidate.nodeId,
                    implementationCount: fact.evidence.find((e: any) => e.kind === 'EXTENSION_DENSITY')?.score ? Math.round(fact.evidence.find((e: any) => e.kind === 'EXTENSION_DENSITY')!.score * 10) : 0,
                    confidence: fact.finalConfidence,
                    // Mocking these to avoid breaking Q4 aggregator for now
                    implementationIds: [],
                    consumerIds: [],
                    injectedIntoCount: 0,
                    registryIds: [],
                    hasRegistry: false
                }
            };

            // Add the rich promotion reasons for context
            if (fact.evidence && fact.evidence.length > 0) {
                 (ev.metadata as any).reasons = fact.evidence.map((e: any) => `[${e.kind}] ${e.description}`);
            }

            newSnapshot.addEvidence(ev);
        }

        return newSnapshot;
    }
}
