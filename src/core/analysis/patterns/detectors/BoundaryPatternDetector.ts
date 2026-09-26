import { PatternDetector } from '../PatternDetector';
import { PatternFinding } from '../PatternFinding';
import { PatternId } from '../PatternId';
import { EvidenceItem } from '../EvidenceItem';
import { ValidationContext } from '../../../validation/ValidationContext';
import { SimulationContext } from '../../../../types/schema';

export class BoundaryPatternDetector implements PatternDetector {
    
    public detect(context: any, simContext?: any): PatternFinding[] {
        const allFindings = simContext?.evidenceBundle?.findings || [];
        
        // Count breakdown
        const breakdown = {
            total: allFindings.length,
            BOUNDARY_NODE: 0,
            SIMULATION: 0,
            PROPAGATION: 0,
            CASCADE: 0,
            other: 0
        };

        for (const f of allFindings) {
            if (f.evidenceType === 'BOUNDARY_NODE') breakdown.BOUNDARY_NODE++;
            else if (f.evidenceType === 'SIMULATION') breakdown.SIMULATION++;
            else if (f.evidenceType === 'PROPAGATION') breakdown.PROPAGATION++;
            else if (f.evidenceType === 'CASCADE') breakdown.CASCADE++;
            else breakdown.other++;
        }

        console.log(`[DATA_TRACE] BoundaryDetector input:\n  total=${breakdown.total}\n  BOUNDARY_NODE=${breakdown.BOUNDARY_NODE}\n  SIMULATION=${breakdown.SIMULATION}\n  PROPAGATION=${breakdown.PROPAGATION}\n  CASCADE=${breakdown.CASCADE}\n  other=${breakdown.other}`);

        const findings: PatternFinding[] = [];
        let semanticFindings = allFindings.filter((f: any) => f.type === 'semantic' && f.evidenceType === 'BOUNDARY_NODE');

        const outputStats = {
            promoted: semanticFindings.length,
            Strong: 0,
            Moderate: 0,
            Weak: 0,
            PatternFindings: 0
        };

        for (const semantic of semanticFindings) {
            const strength = semantic.metadata?.strength;
            const targetId = semantic.targetId;
            const members = semantic.metadata?.members || [];
            
            let patternId: PatternId | null = null;
            let title = '';
            
            if (strength === 'Strong') {
                patternId = PatternId.BOUNDARY_FORTRESS;
                title = 'Strong Boundary Fortress';
                outputStats.Strong++;
            } else if (strength === 'Moderate') {
                patternId = PatternId.BOUNDARY_CANDIDATE;
                title = 'Moderate Boundary Candidate';
                outputStats.Moderate++;
            } else if (strength === 'Weak') {
                patternId = PatternId.WEAK_BOUNDARY;
                title = 'Weak Boundary';
                outputStats.Weak++;
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
                outputStats.PatternFindings++;
            }
        }

        console.log(`[DATA_TRACE] BoundaryDetector output:\n  promoted=${outputStats.promoted}\n  Strong=${outputStats.Strong}\n  Moderate=${outputStats.Moderate}\n  Weak=${outputStats.Weak}\n  PatternFindings=${outputStats.PatternFindings}`);

        return findings;
    }
}
