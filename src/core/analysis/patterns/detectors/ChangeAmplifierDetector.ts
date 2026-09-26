import { DetectorContext } from '../DetectorContext';
import { PatternDetector } from '../PatternDetector';
import { PatternFinding } from '../PatternFinding';
import { PatternId } from '../PatternId';
import { EvidenceItem } from '../EvidenceItem';

export class ChangeAmplifierDetector implements PatternDetector {
    
    public detect(context: any, simContext?: any): PatternFinding[] {
        const findings: PatternFinding[] = [];
        
        let semanticFindings = [];
        if (simContext && simContext.evidenceBundle && simContext.evidenceBundle.findings) {
            semanticFindings = simContext.evidenceBundle.findings.filter((f: any) => f.type === 'semantic' && f.evidenceType === 'BOUNDARY_NODE');
        }

        if (semanticFindings.length === 0) {
            return findings;
        }

        // Calculate complexity scores for Change Amplifier (Blast Radius)
        const scoredCandidates = semanticFindings.map((f: any) => {
            const size = f.metadata?.size || 0;
            const internalEdges = f.metadata?.internalEdges || 0;
            const externalEdges = f.metadata?.externalEdges || 0;
            
            const internalDensity = size > 0 ? internalEdges / size : 0;
            const externalDensity = size > 0 ? externalEdges / size : 0;
            
            const complexityScore = Math.floor(size * internalDensity * internalDensity * externalDensity);
            
            return {
                targetId: f.targetId,
                score: complexityScore,
                evidence: {
                    size,
                    internalDensity,
                    externalDensity,
                    complexityScore,
                    blastRadius: externalDensity * size
                },
                graphNodeId: f.nodeId || f.targetId
            };
        }).filter((c: any) => c.score > 0); 

        if (scoredCandidates.length === 0) return findings;

        // Calculate P50 (Median) cutoff
        const sortedScores = scoredCandidates.map((c: any) => c.score).sort((a: number, b: number) => a - b);
        const medianScore = sortedScores[Math.floor(sortedScores.length / 2)];
        const maxScore = sortedScores[sortedScores.length - 1];
        
        for (const c of scoredCandidates) {
            if (c.score >= medianScore) {
                const confidence = maxScore > 0 ? Number((c.score / maxScore).toFixed(2)) : 1.0;
                
                const evidenceItem: EvidenceItem = {
                    evidenceId: `E-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                    type: "COMPLEXITY_METRICS",
                    sourceId: c.targetId,
                    description: `Change Amplifier (Complexity: ${c.evidence.complexityScore}, BlastRadius: ${c.evidence.blastRadius})`,
                    filePath: c.targetId,
                    graphNodeId: c.graphNodeId
                };

                findings.push({
                    findingId: `F-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                    patternId: PatternId.CHANGE_AMPLIFIER,
                    targetScope: 'NODE',
                    targetId: c.targetId,
                    confidence,
                    evidence: [evidenceItem]
                });
            }
        }

        return findings;
    }
}
