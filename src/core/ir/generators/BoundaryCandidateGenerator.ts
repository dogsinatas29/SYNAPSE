import { GraphModel } from '../../GraphModel';
import { ICandidateGenerator } from '../models/GeneratorInterfaces';
import { ISemanticCandidate, NotCandidateReport } from '../models/SemanticTypes';

export class BoundaryCandidateGenerator implements ICandidateGenerator {
    public readonly generatorName = 'BoundaryCandidateGenerator';

    public generate(graph: GraphModel): { candidates: ISemanticCandidate[], notCandidates: NotCandidateReport[] } {
        const candidates: ISemanticCandidate[] = [];
        const notCandidates: NotCandidateReport[] = [];

        const snapshot = graph.createSnapshot();

        for (const edge of snapshot.edges) {
            // We only look for dependencies crossing boundaries (AST 'include' edges)
            if (edge.type !== 'include') {
                notCandidates.push({
                    subjectId: edge.id,
                    generatorName: this.generatorName,
                    reason: `Edge type is ${edge.type}, not 'include'`
                });
                continue;
            }

            candidates.push({
                id: `cand-boundary-${edge.id}`,
                sourceId: edge.from,
                targetId: edge.to,
                proposedEdgeType: 'CROSSES_BOUNDARY',
                baseConfidence: 0.1 // Base assumption: any dependency might be a boundary, but very low confidence
            });
        }

        return { candidates, notCandidates };
    }
}
