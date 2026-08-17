import { GraphModel, Node } from '../../GraphModel';
import { ISemanticCandidate, NotCandidateReport } from '../models/SemanticTypes';
import { ICandidateGenerator } from '../models/GeneratorInterfaces';

export class StateOwnerCandidateGenerator implements ICandidateGenerator {
    public readonly generatorName = 'StateOwnerCandidateGenerator';

    public generate(graph: GraphModel): { candidates: ISemanticCandidate[], notCandidates: NotCandidateReport[] } {
        const candidates: ISemanticCandidate[] = [];
        const notCandidates: NotCandidateReport[] = [];
        const snapshot = graph.createSnapshot();

        for (const node of snapshot.nodes) {
            if (this.isStateOwnerCandidate(node)) {
                candidates.push({
                    id: `cand-stateowner-${node.id}`,
                    sourceId: node.id,
                    targetId: '*', 
                    proposedEdgeType: 'MANAGES_STATE',
                    baseConfidence: 0.3
                });
            } else {
                notCandidates.push({
                    subjectId: node.id,
                    generatorName: 'StateOwnerCandidateGenerator',
                    reason: 'No StateOwner Linguistic Hint Match (manager, provider, registry, store, cache, state)'
                });
            }
        }

        return { candidates, notCandidates };
    }

    private isStateOwnerCandidate(node: Node): boolean {
        const label = (node.data?.label || node.id || '').toLowerCase();
        
        // Exclude test files
        if (label.includes('.test.') || label.includes('mock') || label.includes('spec')) {
            return false;
        }

        // Active state controllers/managers
        if (
            label.includes('manager') || 
            label.includes('controller') || 
            label.includes('session') ||
            label.includes('identity') ||
            label.includes('store') ||
            label.includes('context')
        ) {
            return true;
        }

        return false;
    }
}
