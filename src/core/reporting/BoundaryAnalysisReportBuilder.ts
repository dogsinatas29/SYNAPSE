import { EvidenceBundle, SemanticFinding } from '../analysis/types';
import { EvidenceType } from './types';

export class BoundaryAnalysisReportBuilder {
    public static build(bundle: EvidenceBundle): string {
        const boundaryNodes = bundle.findings.filter(f => f.type === 'semantic' && f.evidenceType === EvidenceType.BOUNDARY_NODE) as SemanticFinding[];
        const boundaryEdges = bundle.findings.filter(f => f.type === 'semantic' && f.evidenceType === EvidenceType.CROSS_BOUNDARY_DEPENDENCY) as SemanticFinding[];
        const rejectedCandidates = bundle.findings.filter(f => f.type === 'semantic' && f.evidenceType === EvidenceType.REJECTED_CANDIDATE) as SemanticFinding[];

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

        // Add Rejected Candidates section (v0.3.34.39 Audit)
        if (rejectedCandidates.length > 0) {
            content += `=== Rejected Boundary Candidates ===\n\n`;
            content += `Rejected Count: ${rejectedCandidates.length}\n\n`;

    for (const candidate of rejectedCandidates) {
        const meta = candidate.metadata || {};
        const result = meta.result || 'UNKNOWN';
        
        content += `[${result}] ${candidate.targetId}\n`;
        content += `  Members: ${meta.members || 0}\n`;
        content += `  Depth: ${meta.depth || 'N/A'}\n`;
        content += `  Internal Edges: ${meta.internalEdges || 0}\n`;
        content += `  External Edges: ${meta.externalEdges || 0}\n`;
        
        const cohesionStr = meta.cohesion !== undefined ? meta.cohesion.toFixed(3) : '0.000';
        content += `  Cohesion: ${cohesionStr}\n`;
        
        const concentrationStr = meta.targetConcentration !== undefined ? meta.targetConcentration.toFixed(3) : '0.000';
        content += `  Target Concentration: ${concentrationStr}\n`;
        
        // v0.3.34.40: Output member files for audit
        if (meta.memberFiles && Array.isArray(meta.memberFiles) && meta.memberFiles.length > 0) {
            content += `  Member Files:\n`;
            for (const file of meta.memberFiles) {
                content += `    - ${file}\n`;
            }
        }
        
        content += `\n`;
    }
        }

        return content;
    }
}
