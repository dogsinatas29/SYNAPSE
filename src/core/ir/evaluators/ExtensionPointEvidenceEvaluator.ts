import { GraphModel } from '../../GraphModel';
import { INodeFactCandidate, ICandidateEvaluation, ISemanticEvidence } from '../models/SemanticTypes';
import { INodeFactEvidenceEvaluator } from '../models/GeneratorInterfaces';

export class ExtensionPointEvidenceEvaluator implements INodeFactEvidenceEvaluator {
    public readonly evaluatorName = 'ExtensionPointEvidenceEvaluator';
    
    public evaluate(candidate: INodeFactCandidate, graph: GraphModel): ICandidateEvaluation {
        const evidenceList: ISemanticEvidence[] = [];
        const snapshot = graph.createSnapshot();
        
        // Fast lookup map for nodes
        const nodeMap = new Map<string, any>();
        for (const node of snapshot.nodes) {
            nodeMap.set(node.id, node);
        }

        // Gather implementors
        const implementorEdges = snapshot.edges.filter(e => {
            const target = e.data?.originalTarget || e.to || (e as any).targetId;
            return (e.type === 'IMPLEMENTS' || e.type === 'EXTENDS') && target === candidate.nodeId;
        });
        
        // Tier 1: Extension Density
        const count = implementorEdges.length;
        const densityScore = Math.min(1.0, count * 0.1); 
        
        if (count > 0) {
            evidenceList.push({
                id: `ev_density_${candidate.nodeId}`,
                kind: 'EXTENSION_DENSITY',
                score: densityScore,
                category: 'STRUCTURAL',
                description: `Has ${count} implementations.`
            });
        }
        
        // Tier 1.5: Cross-Cluster Density
        const clusterIds = new Set<string>();
        for (const edge of implementorEdges) {
            const source = edge.from || (edge as any).sourceId;
            const sourceNode = nodeMap.get(source);
            if (sourceNode) {
                // In a flat project state structure, this might just fallback to the root directory cluster.
                const dir = sourceNode.id.substring(0, sourceNode.id.lastIndexOf('/')) || 'root';
                clusterIds.add(dir);
            }
        }

        const clusterCount = clusterIds.size;
        let finalConfidence = candidate.baseConfidence + densityScore;

        if (clusterCount >= 2) {
            const crossClusterScore = Math.min(1.0, clusterCount * 0.2); 
            
            evidenceList.push({
                id: `ev_cross_cluster_${candidate.nodeId}`,
                kind: 'CROSS_CLUSTER_DENSITY',
                score: crossClusterScore,
                category: 'STRUCTURAL',
                description: `Implementors span across ${clusterCount} architectural clusters.`
            });
            
            finalConfidence += crossClusterScore;
        }

        return {
            candidateId: candidate.id,
            evidence: evidenceList,
            structuralEvidenceCount: evidenceList.filter(e => e.category === 'STRUCTURAL').length,
            languageEvidenceCount: evidenceList.filter(e => e.category === 'LANGUAGE').length,
            finalConfidence: Math.min(1.0, finalConfidence)
        };
    }
}
