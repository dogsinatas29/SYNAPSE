import { GraphModel } from '../../GraphModel';
import { INodeFactCandidate, NotCandidateReport } from '../models/SemanticTypes';
import { INodeFactCandidateGenerator } from '../models/GeneratorInterfaces';

export class ExtensionPointCandidateGenerator implements INodeFactCandidateGenerator {
    public readonly generatorName = 'ExtensionPointCandidateGenerator';
    
    public generate(graph: GraphModel): {
        candidates: INodeFactCandidate[];
        notCandidates: NotCandidateReport[];
    } {
        const candidates: INodeFactCandidate[] = [];
        const notCandidates: NotCandidateReport[] = [];
        
        const snapshot = graph.createSnapshot();
        
        const targetImplementorCount = new Map<string, number>();
        
        for (const edge of snapshot.edges) {
            if (edge.type === 'IMPLEMENTS' || edge.type === 'EXTENDS') {
                const targetSymbol = edge.data?.originalTarget || edge.to || edge.targetId;
                if (targetSymbol) {
                    targetImplementorCount.set(targetSymbol, (targetImplementorCount.get(targetSymbol) || 0) + 1);
                }
            }
        }
        
        for (const [targetSymbol, count] of targetImplementorCount.entries()) {
            if (count >= 2) {
                candidates.push({
                    id: `cand_extension_point_${targetSymbol}`,
                    nodeId: targetSymbol,
                    proposedFactType: 'IS_EXTENSION_POINT',
                    baseConfidence: 0.5
                });
            } else {
                notCandidates.push({
                    subjectId: targetSymbol,
                    generatorName: this.generatorName,
                    reason: `Only ${count} implementor(s) detected. Minimum extension density is 2.`
                });
            }
        }
        
        return { candidates, notCandidates };
    }
}
