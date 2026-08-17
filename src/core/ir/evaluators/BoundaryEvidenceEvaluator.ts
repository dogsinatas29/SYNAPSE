import { GraphModel } from '../../GraphModel';
import { IEvidenceEvaluator } from '../models/GeneratorInterfaces';
import { ISemanticCandidate, ICandidateEvaluation, ISemanticEvidence } from '../models/SemanticTypes';

export class BoundaryEvidenceEvaluator implements IEvidenceEvaluator {
    public readonly evaluatorName = 'BoundaryEvidenceEvaluator';

    public evaluate(candidate: ISemanticCandidate, graph: GraphModel): ICandidateEvaluation {
        const evidence: ISemanticEvidence[] = [];
        let finalConfidence = candidate.baseConfidence;
        let structuralCount = 0;
        let languageCount = 0;

        const snapshot = graph.createSnapshot();
        const sourceNode = snapshot.nodes.find((n: any) => n.id === candidate.sourceId);
        const targetNode = snapshot.nodes.find((n: any) => n.id === candidate.targetId);

        if (!sourceNode || !targetNode) {
            return { 
                candidateId: candidate.id,
                evidence, 
                finalConfidence: 0, 
                structuralEvidenceCount: 0,
                languageEvidenceCount: 0 
            };
        }

        const sourcePath = (sourceNode.data?.filePath || sourceNode.id).toLowerCase();
        const targetPath = (targetNode.data?.filePath || targetNode.id).toLowerCase();

        // ---------------------------------------------------------
        // 1. Tier 1: Strong API Crossings (+0.8) [STRUCTURAL]
        // ---------------------------------------------------------
        const apiKeywords = ['vscode', 'window', 'document', 'child_process', 'ipc', 'postmessage', 'ffi'];
        const isExternalApi = targetPath.startsWith('external://') || apiKeywords.some(k => targetPath.includes(k));
        
        if (isExternalApi) {
            evidence.push({
                id: `ev-bound-api-${candidate.id}`,
                kind: 'api_crossing',
                category: 'STRUCTURAL',
                score: 0.8,
                description: `Edge targets a recognized external API or system boundary: ${targetPath}`
            });
            structuralCount++;
        }

        // ---------------------------------------------------------
        // 2. Tier 2: Cross-Domain Imports (+0.6) [STRUCTURAL]
        // ---------------------------------------------------------
        // Extract root domain from path (e.g. src/ui/foo.ts -> ui)
        const getDomain = (p: string) => {
            const match = p.match(/src\/([^\/]+)\//);
            return match ? match[1] : null;
        };
        const sourceDomain = getDomain(sourcePath);
        const targetDomain = getDomain(targetPath);

        if (sourceDomain && targetDomain && sourceDomain !== targetDomain) {
            evidence.push({
                id: `ev-bound-crossdomain-${candidate.id}`,
                kind: 'cross_domain_import',
                category: 'STRUCTURAL',
                score: 0.6,
                description: `Import crosses top-level domains: ${sourceDomain} -> ${targetDomain}`
            });
            structuralCount++;
        }

        // ---------------------------------------------------------
        // 3. Tier 3: Directory Hints (+0.1) [LINGUISTIC]
        // ---------------------------------------------------------
        const boundaryHints = ['webview', 'adapter', 'infra', 'client', 'server', 'extension'];
        let hasHint = false;
        
        if (boundaryHints.some(h => sourcePath.includes(h)) && !boundaryHints.some(h => targetPath.includes(h))) {
            hasHint = true;
        } else if (!boundaryHints.some(h => sourcePath.includes(h)) && boundaryHints.some(h => targetPath.includes(h))) {
            hasHint = true;
        }

        if (hasHint) {
            evidence.push({
                id: `ev-bound-hint-${candidate.id}`,
                kind: 'directory_boundary_hint',
                category: 'LANGUAGE',
                score: 0.1,
                description: `Path names hint at a boundary crossing between source and target`
            });
            languageCount++;
        }

        // Tally up
        for (const ev of evidence) {
            finalConfidence += ev.score;
        }

        return {
            candidateId: candidate.id,
            evidence,
            finalConfidence,
            structuralEvidenceCount: structuralCount,
            languageEvidenceCount: languageCount
        };
    }
}
