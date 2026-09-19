import { ValidationContext } from '../../../validation/ValidationContext';
import { SimulationContext } from '../../../../types/schema';
import { PatternDetector, PatternFinding } from '../PatternDetector';

export class CascadeFailureDetector implements PatternDetector {
    
    public detect(context: ValidationContext, simContext?: SimulationContext): PatternFinding[] {
        const findings: PatternFinding[] = [];
        
        let simulationFindings = [];
        if (simContext && simContext.evidenceBundle && simContext.evidenceBundle.findings) {
            // Find any findings that represent simulation results, such as PROPAGATION or CASCADE
            simulationFindings = simContext.evidenceBundle.findings.filter((f: any) => 
                f.type === 'simulation' || f.evidenceType === 'PROPAGATION' || f.evidenceType === 'CASCADE'
            );
        }

        if (simulationFindings.length === 0) {
            return findings;
        }

        // Calculate failure scores based on simulation impact
        const scoredCandidates = simulationFindings.map((f: any) => {
            const affectedNodeCount = f.metadata?.affectedNodeCount || 0;
            const propagationDepth = f.metadata?.propagationDepth || 0;
            const cascadeImpact = f.metadata?.cascadeImpact || 0; // Schema fallback
            
            // Score based on how many nodes are destroyed + how deep the propagation goes
            const failureScore = (affectedNodeCount * 10) + (propagationDepth * 50) + (cascadeImpact * 100);
            
            return {
                targetId: f.targetId || f.nodeId || 'UNKNOWN',
                score: failureScore,
                evidence: {
                    affectedNodeCount,
                    propagationDepth,
                    cascadeImpact,
                    failureScore
                }
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
                
                findings.push({
                    patternId: 'cascade_failure_point',
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
