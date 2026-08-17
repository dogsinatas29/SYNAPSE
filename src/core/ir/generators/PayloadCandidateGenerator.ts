import { GraphModel, Node } from '../../GraphModel';
import { ISemanticCandidate, NotCandidateReport } from '../models/SemanticTypes';
import { ICandidateGenerator } from '../models/GeneratorInterfaces';

export class PayloadCandidateGenerator implements ICandidateGenerator {
    public readonly generatorName = 'PayloadCandidateGenerator';
    /**
     * Finds potential payload candidates based on node naming conventions and AST hints.
     */
    public generate(graph: GraphModel): { candidates: ISemanticCandidate[], notCandidates: NotCandidateReport[] } {
        const candidates: ISemanticCandidate[] = [];
        const notCandidates: NotCandidateReport[] = [];
        const snapshot = graph.createSnapshot();

        for (const node of snapshot.nodes) {
            if (this.isPayloadCandidate(node)) {
                candidates.push({
                    id: `cand-payload-${node.id}`,
                    sourceId: node.id,
                    targetId: '*', // Target will be resolved by evaluator or it's a node property
                    proposedEdgeType: 'DEFINES_PAYLOAD',
                    baseConfidence: 0.3 // Initial low confidence
                });
            } else {
                notCandidates.push({
                    subjectId: node.id,
                    generatorName: 'PayloadCandidateGenerator',
                    reason: 'No Payload Heuristic Match (schema, model, state, types, config, payload)'
                });
            }
        }

        return { candidates, notCandidates };
    }

    private isPayloadCandidate(node: Node): boolean {
        const label = (node.data?.label || node.id || '').toLowerCase();
        
        // 1. Language/AST hints (if available in runtime graph)
        const classes = (node.data as any)?.classes as string[];
        if (classes && classes.length > 0) {
            // If the file exports classes/interfaces that look like schemas
            const hasSchemaClass = classes.some(c => 
                c.toLowerCase().includes('schema') || 
                c.toLowerCase().includes('model') || 
                c.toLowerCase().includes('state') ||
                c.toLowerCase().includes('config') ||
                c.toLowerCase().includes('options')
            );
            if (hasSchemaClass) return true;
        }

        // 2. Name-based heuristics (Fallback for serialized graphs or C structs)
        if (
            label.includes('schema') || 
            label.includes('model') || 
            label.includes('state') ||
            label.includes('types') ||
            label.includes('config') ||
            label.includes('options') ||
            label.includes('payload')
        ) {
            return true;
        }

        return false;
    }
}
