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
                patternId = PatternId.HIGH_ISOLATION_BOUNDARY;
                title = 'High Isolation Boundary';
                outputStats.Strong++;
            } else if (strength === 'Moderate') {
                patternId = PatternId.BOUNDARY_CANDIDATE;
                title = 'Moderate Boundary Candidate';
                outputStats.Moderate++;
            } else if (strength === 'Weak') {
                patternId = PatternId.LOW_ISOLATION_BOUNDARY;
                title = 'Low Isolation Boundary';
                outputStats.Weak++;
            }

            if (patternId) {
                let basisStr = `Classified as ${title} because its isolation strength was evaluated as '${strength}'.`;
                const size = semantic.metadata?.size || 0;
                const internalEdges = semantic.metadata?.internalEdges || 0;
                const inbound = semantic.metadata?.inboundEdges || 0;
                const cohesionVal = semantic.metadata?.cohesion || 0;

                let strengthVal = cohesionVal;
                let penaltyStr = '';
                if (size < 5) {
                    strengthVal -= 0.15;
                    penaltyStr = ` (applied -0.15 penalty for size < 5, adjusted cohesion=${strengthVal.toFixed(3)})`;
                }
                const isMassive = size >= 100 && internalEdges >= 1000;

                if (strength === 'Strong') {
                    if (isMassive) basisStr = `Classified as ${title} ('Strong') primarily due to massive internal structure (size=${size} >= 100, internalEdges=${internalEdges} >= 1000).`;
                    else if (inbound >= 100) basisStr = `Classified as ${title} ('Strong') primarily due to massive Fan-In (inboundEdges=${inbound} >= 100).`;
                    else basisStr = `Classified as ${title} ('Strong') due to high cohesion (cohesion=${cohesionVal.toFixed(3)}${penaltyStr} >= 0.75).`;
                } else if (strength === 'Moderate') {
                    if (inbound >= 30) basisStr = `Classified as ${title} ('Moderate') due to high Fan-In (inboundEdges=${inbound} >= 30).`;
                    else basisStr = `Classified as ${title} ('Moderate') due to moderate cohesion (cohesion=${cohesionVal.toFixed(3)}${penaltyStr} >= 0.45).`;
                } else if (strength === 'Weak') {
                    basisStr = `Classified as ${title} ('Weak') because it did not meet Fan-In or cohesion thresholds for promotion (inboundEdges=${inbound} < 30 AND adjusted cohesion=${strengthVal.toFixed(3)} < 0.45).`;
                }

                const evidenceItem: EvidenceItem = {
                    evidenceId: `E-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                    type: 'STRUCTURAL_METRIC',
                    description: `Strength: ${strength}, Cohesion: ${semantic.metadata?.cohesion || 0}, Size: ${semantic.metadata?.size || 0}`,
                    sourceId: targetId,
                    filePath: targetId,
                    graphNodeId: targetId,
                    metadata: {
                        strength: strength,
                        cohesion: semantic.metadata?.cohesion,
                        size: semantic.metadata?.size,
                        internalEdges: semantic.metadata?.internalEdges,
                        externalEdges: semantic.metadata?.externalEdges,
                        members: semantic.metadata?.members?.length // too large to show array, show length
                    },
                    predicate: {
                        condition: "ISOLATION_CLASSIFICATION",
                        metric: "strength",
                        operator: "===",
                        cutoff: strength,
                        actualValue: strength
                    },
                    selectionBasis: basisStr
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
