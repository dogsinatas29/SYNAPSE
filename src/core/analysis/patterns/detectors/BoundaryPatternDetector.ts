import { PatternDetector } from '../PatternDetector';
import { PatternFinding } from '../PatternFinding';
import { PatternId } from '../PatternId';
import { EvidenceItem } from '../EvidenceItem';
import { ValidationContext } from '../../../validation/ValidationContext';
import { SimulationContext } from '../../../../types/schema';

export class BoundaryPatternDetector implements PatternDetector {
    
    public detect(context: any, simContext?: any): PatternFinding[] {
        const findings: PatternFinding[] = [];
        
        let semanticFindings = [];
        if (simContext && simContext.evidenceBundle && simContext.evidenceBundle.findings) {
            semanticFindings = simContext.evidenceBundle.findings.filter((f: any) => f.type === 'semantic' && f.evidenceType === 'BOUNDARY_NODE');
        }

        for (const semantic of semanticFindings) {
            const strength = semantic.metadata?.strength;
            const targetId = semantic.targetId;
            const members = semantic.metadata?.members || [];
            
            let patternId: PatternId | null = null;
            let title = '';
            
            if (strength === 'Strong') {
                patternId = PatternId.BOUNDARY_FORTRESS;
                title = 'Strong Boundary Fortress';
            } else if (strength === 'Moderate') {
                patternId = PatternId.BOUNDARY_CANDIDATE;
                title = 'Moderate Boundary Candidate';
            } else if (strength === 'Weak') {
                patternId = PatternId.WEAK_BOUNDARY;
                title = 'Weak Boundary';
            }

            if (patternId) {
                const evidenceItem: EvidenceItem = {
                    evidenceId: `E-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                    type: 'STRUCTURAL_METRIC',
                    description: `Strength: ${strength}, Cohesion: ${semantic.metadata?.cohesion || 0}, Size: ${semantic.metadata?.size || 0}`,
                    sourceId: targetId,
                    filePath: targetId,
                    graphNodeId: targetId
                };

                findings.push({
                    findingId: `F-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                    patternId: patternId,
                    targetScope: 'CLUSTER',
                    targetId: targetId,
                    confidence: 1.0,
                    evidence: [evidenceItem],
                    context: { members: members }
                });
            }
        }

        return findings;
    }
}
