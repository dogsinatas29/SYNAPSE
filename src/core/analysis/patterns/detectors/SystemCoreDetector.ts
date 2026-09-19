import { ValidationContext } from '../../../validation/ValidationContext';
import { SimulationContext } from '../../../../types/schema';
import { PatternDetector, PatternFinding } from '../PatternDetector';

export class SystemCoreDetector implements PatternDetector {
    
    public detect(context: ValidationContext, simContext?: SimulationContext): PatternFinding[] {
        const findings: PatternFinding[] = [];
        
        // Semantic Boundary Nodes are the primary source for System Core detection
        let semanticFindings = [];
        if (simContext && simContext.evidenceBundle && simContext.evidenceBundle.findings) {
            semanticFindings = simContext.evidenceBundle.findings.filter((f: any) => f.type === 'semantic' && f.evidenceType === 'BOUNDARY_NODE');
        }

        if (semanticFindings.length === 0) {
            return findings;
        }

        // Calculate control scores based on new semantic metrics
        const scoredCandidates = semanticFindings.map((f: any) => {
            const fanIn = f.metadata?.fanIn || 0;
            const fanOut = f.metadata?.fanOut || 0;
            const blastRadius = f.metadata?.blastRadius || 0;
            const authorityReach = f.metadata?.authorityReach || 0.0;
            
            // Score weight: FanIn heavily dictates Core nature. Blast Radius adds impact. Authority Reach adds network centrality.
            const controlScore = Math.floor(fanIn * 10 + blastRadius * 2 + (authorityReach * 100));
            
            return {
                targetId: f.targetId,
                score: controlScore,
                evidence: {
                    fanIn,
                    fanOut,
                    blastRadius,
                    authorityReach,
                    controlScore
                }
            };
        }).filter((c: any) => c.score > 0); // Must have at least some score

        if (scoredCandidates.length === 0) return findings;

        // Calculate P50 (Median) cutoff to avoid returning thousands of candidates
        const sortedScores = scoredCandidates.map((c: any) => c.score).sort((a: number, b: number) => a - b);
        const medianScore = sortedScores[Math.floor(sortedScores.length / 2)];
        
        const maxScore = sortedScores[sortedScores.length - 1];
        
        // Filter and map to PatternFinding
        for (const c of scoredCandidates) {
            if (c.score >= medianScore) {
                // Normalize confidence between 0.0 and 1.0 relative to max score
                const confidence = maxScore > 0 ? Number((c.score / maxScore).toFixed(2)) : 1.0;
                
                findings.push({
                    patternId: 'system_core',
                    targetId: c.targetId,
                    confidence,
                    isCandidate: true,
                    evidence: c.evidence
                });
            }
        }

        return findings;
    }
}
