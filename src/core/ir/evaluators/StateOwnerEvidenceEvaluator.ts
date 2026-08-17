import { GraphModel } from '../../GraphModel';
import { ISemanticCandidate, ICandidateEvaluation, ISemanticEvidence } from '../models/SemanticTypes';
import { IEvidenceEvaluator } from '../models/GeneratorInterfaces';

export class StateOwnerEvidenceEvaluator implements IEvidenceEvaluator {
    public readonly evaluatorName = 'StateOwnerEvidenceEvaluator';

    public evaluate(candidate: ISemanticCandidate, graph: GraphModel): ICandidateEvaluation {
        const evidence: ISemanticEvidence[] = [];
        const snapshot = graph.createSnapshot();
        const node = snapshot.nodes.find(n => n.id === candidate.sourceId);

        if (!node) {
            return {
                candidateId: candidate.id,
                evidence: [],
                structuralEvidenceCount: 0,
                languageEvidenceCount: 0,
                finalConfidence: 0
            };
        }

        const label = (node.data?.label || node.id || '').toLowerCase();

        // --- 1. Positive Language Evidence ---
        let hasStateOwnershipLinguistic = false;
        if (
            label.includes('registry') || 
            label.includes('store') || 
            label.includes('cache') || 
            label.includes('state') ||
            label.includes('map') ||
            label.includes('pool') ||
            label.includes('context')
        ) {
            hasStateOwnershipLinguistic = true;
            evidence.push({
                id: `ev-lang-owns-state-${node.id}`,
                kind: 'owns_state',
                score: 0.4,
                category: 'LANGUAGE',
                description: 'Node name implies ownership of a collection or persistent state.'
            });
        }

        if (!hasStateOwnershipLinguistic && (
            label.includes('manager') || 
            label.includes('controller') || 
            label.includes('session') || 
            label.includes('identity') ||
            label.includes('handler') ||
            label.includes('writer') ||
            label.includes('updater')
        )) {
            evidence.push({
                id: `ev-lang-mutates-state-${node.id}`,
                kind: 'mutates_state',
                score: 0.4,
                category: 'LANGUAGE',
                description: 'Node name implies active mutation or lifecycle control of state.'
            });
        }

        evidence.push({
            id: `ev-lang-stateowner-${node.id}`,
            kind: 'stateowner_naming_convention',
            score: 0.1,
            category: 'LANGUAGE',
            description: 'Node name matches general manager/controller pattern.'
        });

        // --- 2. Positive Structural Evidence ---
        const incomingEdges = snapshot.edges.filter((e: any) => e.to === node.id || e.target === node.id);
        const outgoingEdges = snapshot.edges.filter((e: any) => e.from === node.id || e.source === node.id);

        if (incomingEdges.length >= 3) {
            evidence.push({
                id: `ev-struct-fanin-${node.id}`,
                kind: 'high_fan_in',
                score: 0.2, // Reduced from 0.3
                category: 'STRUCTURAL',
                description: 'Node is depended upon by multiple other components.'
            });
        }

        // Managers typically coordinate other things, so having outgoing dependencies is normal, 
        // but if they are referenced by pipelines, that's strong proof.
        let isReferencedByPipeline = false;
        for (const edge of incomingEdges) {
            const sourceNode = snapshot.nodes.find((n: any) => n.id === edge.from || n.id === edge.source);
            if (sourceNode) {
                const sourceLabel = (sourceNode.data?.label || sourceNode.id || '').toLowerCase();
                if (sourceLabel.includes('pipeline') || sourceLabel.includes('engine') || sourceLabel.includes('orchestrator')) {
                    isReferencedByPipeline = true;
                    break;
                }
            }
        }

        if (isReferencedByPipeline) {
            evidence.push({
                id: `ev-struct-pipeline-${node.id}`,
                kind: 'referenced_by_pipeline',
                score: 0.4, // Reduced from 0.6 because mutation/ownership takes more weight
                category: 'STRUCTURAL',
                description: 'State owner is directly orchestrated by a pipeline or engine.'
            });
        }

        // --- 3. Negative Evidence ---
        // False positive prevention: Config/Theme/Settings/Logger are not active session/state owners
        if (label.includes('config') || label.includes('setting') || label.includes('theme') || label.includes('logger') || label.includes('util')) {
            evidence.push({
                id: `ev-neg-config-${node.id}`,
                kind: 'static_config_or_util_detected',
                score: -0.6, // Strong penalty to kill ConfigManager, ThemeManager
                category: 'LANGUAGE',
                description: 'Node appears to be static configuration or utility, not dynamic state.'
            });
        }

        if (incomingEdges.length === 0) {
            evidence.push({
                id: `ev-neg-isolated-${node.id}`,
                kind: 'no_incoming_dependencies',
                score: -0.3,
                category: 'STRUCTURAL',
                description: 'Manager has no incoming dependencies; likely unused or isolated.'
            });
        }

        let structuralCount = 0;
        let languageCount = 0;
        let finalConfidence = candidate.baseConfidence;

        for (const ev of evidence) {
            finalConfidence += ev.score;
            if (ev.score > 0) { // Only count positive evidence for thresholds
                if (ev.category === 'STRUCTURAL') structuralCount++;
                if (ev.category === 'LANGUAGE') languageCount++;
            }
        }

        return {
            candidateId: candidate.id,
            evidence,
            structuralEvidenceCount: structuralCount,
            languageEvidenceCount: languageCount,
            finalConfidence
        };
    }
}
