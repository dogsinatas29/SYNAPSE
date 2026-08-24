import { EvidenceBundle, SemanticFinding } from '../analysis/types';
import { EvidenceType } from './types';

export class BoundaryAnalysisReportBuilder {
    public static build(bundle: EvidenceBundle): string {
        const boundaryNodes = bundle.findings.filter(f => f.type === 'semantic' && f.evidenceType === EvidenceType.BOUNDARY_NODE) as SemanticFinding[];
        const boundaryEdges = bundle.findings.filter(f => f.type === 'semantic' && f.evidenceType === EvidenceType.CROSS_BOUNDARY_DEPENDENCY) as SemanticFinding[];

        let content = `=== Semantic Boundary Report ===\n\n`;
        content += `Boundary Count: ${boundaryNodes.length}\n\n`;

        for (const node of boundaryNodes) {
            content += `[Boundary] ${node.targetId}\n`;
            
            const meta = node.metadata || {};
            const members = meta.members || [];
            
            content += `Members: ${members.length}\n`;
            content += `Internal Edges: ${meta.internalEdges || 0}\n`;
            content += `External Edges: ${meta.externalEdges || 0}\n`;
            
            // Format to 2 decimal places
            const cohesionStr = meta.cohesion !== undefined ? meta.cohesion.toFixed(2) : '0.00';
            content += `Cohesion: ${cohesionStr}\n`;
            content += `Strength: ${meta.strength || 'Unknown'}\n\n`;

            content += `Connected To:\n`;
            
            const relatedEdges = boundaryEdges.filter(e => e.metadata?.from === node.targetId);
            
            if (relatedEdges.length === 0) {
                content += `- None\n`;
            } else {
                // Sort by dependency count descending
                relatedEdges.sort((a, b) => {
                    const countA = a.metadata?.dependencyCount || 0;
                    const countB = b.metadata?.dependencyCount || 0;
                    return countB - countA;
                });
                
                for (const edge of relatedEdges) {
                    content += `- ${edge.metadata?.to} (${edge.metadata?.dependencyCount || 0})\n`;
                }
            }
            
            content += `\n--------------------------------\n\n`;
        }

        return content;
    }
}
