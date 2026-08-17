import { GraphModel, Node } from '../../GraphModel';
import { ISemanticCandidate, ICandidateEvaluation, ISemanticEvidence } from '../models/SemanticTypes';
import { IEvidenceEvaluator } from '../models/GeneratorInterfaces';

export class PayloadEvidenceEvaluator implements IEvidenceEvaluator {
    public readonly evaluatorName = 'PayloadEvidenceEvaluator';
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

        // 1. Language Evidence
        this.evaluateLanguageEvidence(node, evidence);

        // 2. Structural Evidence
        this.evaluateStructuralEvidence(node, snapshot, evidence);

        // 3. Negative Evidence
        this.evaluateNegativeEvidence(node, snapshot, evidence);

        // Calculate counts and final score
        let structuralEvidenceCount = 0;
        let languageEvidenceCount = 0;
        let finalConfidence = candidate.baseConfidence;

        for (const ev of evidence) {
            finalConfidence += ev.score;
            if (ev.score > 0) { // Only count positive evidence for thresholds
                if (ev.category === 'STRUCTURAL') structuralEvidenceCount++;
                if (ev.category === 'LANGUAGE') languageEvidenceCount++;
            }
        }

        return {
            candidateId: candidate.id,
            evidence,
            structuralEvidenceCount,
            languageEvidenceCount,
            finalConfidence
        };
    }

    private evaluateLanguageEvidence(node: Node, evidence: ISemanticEvidence[]) {
        const label = (node.data?.label || node.id || '').toLowerCase();
        const classes = (node.data as any)?.classes as string[];

        let hasLanguageEvidence = false;

        if (classes && classes.length > 0) {
            if (classes.some(c => c.toLowerCase().includes('schema') || c.toLowerCase().includes('model'))) {
                evidence.push({
                    id: `ev-lang-decl-${node.id}`,
                    kind: 'interface_declaration',
                    score: 0.4,
                    category: 'LANGUAGE',
                    description: 'Node contains explicit interface or schema declarations.'
                });
                hasLanguageEvidence = true;
            }
        }

        if (!hasLanguageEvidence && (label.includes('types') || label.includes('schema'))) {
            evidence.push({
                id: `ev-lang-name-${node.id}`,
                kind: 'type_naming_convention',
                score: 0.3,
                category: 'LANGUAGE',
                description: 'Node name strongly implies type definitions.'
            });
        }
    }

    private evaluateStructuralEvidence(node: Node, snapshot: any, evidence: ISemanticEvidence[]) {
        // Find incoming dependencies
        const incomingEdges = snapshot.edges.filter((e: any) => e.to === node.id || e.target === node.id);
        const incomingCount = incomingEdges.length;

        if (incomingCount >= 3) {
            evidence.push({
                id: `ev-struct-fanin-${node.id}`,
                kind: 'high_fan_in',
                score: 0.3,
                category: 'STRUCTURAL',
                description: `Node is referenced by ${incomingCount} other nodes.`
            });
        }

        // Check if referenced by core pipeline or orchestrator components
        let referencedByPipeline = false;
        for (const edge of incomingEdges) {
            const sourceNode = snapshot.nodes.find((n: any) => n.id === edge.from || n.id === edge.source);
            if (sourceNode) {
                const sourceLabel = (sourceNode.data?.label || sourceNode.id || '').toLowerCase();
                if (sourceLabel.includes('pipeline') || sourceLabel.includes('engine') || sourceLabel.includes('orchestrator')) {
                    referencedByPipeline = true;
                }
            }
        }

        if (referencedByPipeline) {
            evidence.push({
                id: `ev-struct-pipeline-${node.id}`,
                kind: 'referenced_by_pipeline',
                score: 0.4,
                category: 'STRUCTURAL',
                description: 'Node is directly referenced by a pipeline or engine component.'
            });
        }
    }

    private evaluateNegativeEvidence(node: Node, snapshot: any, evidence: ISemanticEvidence[]) {
        const label = (node.data?.label || node.id || '').toLowerCase();
        
        if (label.includes('config') || label.includes('options') || label.includes('settings')) {
            evidence.push({
                id: `ev-neg-config-${node.id}`,
                kind: 'config_suffix_detected',
                score: -0.2,
                category: 'LANGUAGE',
                description: 'Node appears to be a simple configuration rather than core payload.'
            });
        }

        if (label.includes('logger') || label.includes('theme') || label.includes('util')) {
            evidence.push({
                id: `ev-neg-util-${node.id}`,
                kind: 'utility_suffix_detected',
                score: -0.4,
                category: 'LANGUAGE',
                description: 'Node is a utility or infrastructure component, not business payload.'
            });
        }

        if (label.includes('manager') || label.includes('controller') || label.includes('service') || label.includes('handler')) {
            evidence.push({
                id: `ev-neg-behavior-${node.id}`,
                kind: 'behavior_suffix_detected',
                score: -0.4,
                category: 'LANGUAGE',
                description: 'Node name implies active behavior (Manager, Controller, etc), not passive Payload/State.'
            });
        }

        const incomingEdges = snapshot.edges.filter((e: any) => e.to === node.id || e.target === node.id);
        if (incomingEdges.length === 0) {
            evidence.push({
                id: `ev-neg-isolated-${node.id}`,
                kind: 'no_incoming_dependencies',
                score: -0.3,
                category: 'STRUCTURAL',
                description: 'Node has no incoming dependencies; likely unused or purely external.'
            });
        }

        // Check if ONLY used by a logger/utility
        if (incomingEdges.length > 0) {
            let onlyUsedByUtils = true;
            for (const edge of incomingEdges) {
                const sourceNode = snapshot.nodes.find((n: any) => n.id === edge.from || n.id === edge.source);
                if (sourceNode) {
                    const sourceLabel = (sourceNode.data?.label || sourceNode.id || '').toLowerCase();
                    if (!sourceLabel.includes('logger') && !sourceLabel.includes('util') && !sourceLabel.includes('theme')) {
                        onlyUsedByUtils = false;
                        break;
                    }
                }
            }
            
            if (onlyUsedByUtils) {
                evidence.push({
                    id: `ev-neg-util-usage-${node.id}`,
                    kind: 'only_used_by_utility',
                    score: -0.4,
                    category: 'STRUCTURAL',
                    description: 'Node is only referenced by utility or infrastructure components.'
                });
            }
        }
    }
}
