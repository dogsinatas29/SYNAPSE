import { DetectorContext } from '../DetectorContext';
import { PatternDetector } from '../PatternDetector';
import { PatternFinding } from '../PatternFinding';
import { PatternId } from '../PatternId';
import { EvidenceItem } from '../EvidenceItem';
import { NodeRole } from '../../../../types/schema';
import { ScopeResolver } from '../../ScopeResolver';

export class SystemCoreDetector implements PatternDetector {
    
    public detect(context: any, simContext?: any): PatternFinding[] {
        const findings: PatternFinding[] = [];
        
        // Semantic Boundary Nodes are the primary source for System Core detection
        let semanticFindings = [];
        if (simContext && simContext.evidenceBundle && simContext.evidenceBundle.findings) {
            semanticFindings = simContext.evidenceBundle.findings.filter((f: any) => f.type === 'semantic' && f.evidenceType === 'BOUNDARY_NODE');
        }

        if (semanticFindings.length === 0) {
            return findings;
        }

        // 1. Build nodeRoleMap from context.snapshot.nodes
        const nodeRoleMap = new Map<string, string>();
        if (context?.snapshot?.nodes) {
            for (const n of context.snapshot.nodes) {
                if (n.role) {
                    nodeRoleMap.set(n.id || n.filePath, String(n.role).toLowerCase());
                }
            }
        }

        // 2. Pre-filter test components BEFORE score and percentile cutoff calculation
        const nonTestSemanticFindings: any[] = [];
        const excludedTestComponents: string[] = [];

        for (const f of semanticFindings) {
            const members: string[] = f.metadata?.members || [];
            let isTestComponent = false;
            if (members.length > 0 && nodeRoleMap.size > 0) {
                let testNodeCount = 0;
                for (const m of members) {
                    const r = nodeRoleMap.get(m);
                    if (r === 'test' || r === NodeRole.TEST.toLowerCase()) {
                        testNodeCount++;
                    }
                }
                const testRatio = testNodeCount / members.length;
                if (testRatio >= 0.8) {
                    isTestComponent = true;
                }
            }

            if (isTestComponent) {
                excludedTestComponents.push(f.targetId);
            } else {
                nonTestSemanticFindings.push(f);
            }
        }

        if (excludedTestComponents.length > 0) {
            console.log(`[SYSTEM_CORE_DETECTOR] Excluded ${excludedTestComponents.length} test components: ${excludedTestComponents.join(', ')}`);
        }

        // Calculate control scores based on new semantic metrics
        let scoredCandidates = nonTestSemanticFindings.map((f: any) => {
            const fanIn = f.metadata?.inboundEdges || 0;
            const fanOut = f.metadata?.externalEdges || 0;
            const size = f.metadata?.size || 0;
            const blastRadius = fanOut * size; // Estimated blast radius
            const authorityReach = f.metadata?.authorityReach || 0.0;
            
            // Score weight: FanIn heavily dictates Core nature. Blast Radius adds impact. Authority Reach adds network centrality.
            let controlScore = Math.floor(fanIn * 10 + blastRadius * 2 + (authorityReach * 100));
            if (!Number.isFinite(controlScore) || controlScore <= 0) {
                controlScore = 0;
            }
            
            return {
                targetId: f.targetId,
                score: controlScore,
                members: f.metadata?.members || [],
                evidence: {
                    fanIn,
                    fanOut,
                    blastRadius,
                    authorityReach,
                    controlScore
                },
                graphNodeId: f.nodeId || f.targetId
            };
        }).filter((c: any) => c.score > 0); // Base Qualification: Must have score > 0

        const universeCandidates = scoredCandidates.length;

        // Declared Scope Exclusion (Phase A)
        const scopeResolver: ScopeResolver = context?.scopeResolver || ScopeResolver.loadConfig(context?.workspaceRoot);
        let excludedByScopeCount = 0;

        if (scopeResolver && scopeResolver.hasExclusions()) {
            scoredCandidates = scoredCandidates.filter((c: any) => {
                const members: string[] = c.members || [];
                if (members.length > 0) {
                    // Full Component Match: Exclude only if ALL members match scopeExclusions
                    const allExcluded = members.every(m => scopeResolver.matches(m));
                    if (allExcluded) {
                        excludedByScopeCount++;
                        return false;
                    }
                }
                return true;
            });
            if (excludedByScopeCount > 0) {
                console.log(`[SYSTEM_CORE_DETECTOR] Excluded ${excludedByScopeCount} components by scopeExclusions Full Match.`);
            }
        }

        const eligibleCandidates = scoredCandidates.length;
        if (scoredCandidates.length === 0) return findings;

        // P90 Cutoff: Sort descending by score, deterministic tie-breaking by targetId ascending
        scoredCandidates.sort((a: any, b: any) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.targetId < b.targetId ? -1 : (a.targetId > b.targetId ? 1 : 0);
        });

        const p90Count = Math.ceil(0.1 * eligibleCandidates);
        const selectedCandidates = scoredCandidates.slice(0, p90Count);
        const maxScore = scoredCandidates[0]?.score || 1;
        
        // Map to PatternFinding
        for (let idx = 0; idx < selectedCandidates.length; idx++) {
            const c = selectedCandidates[idx];
            // Normalize confidence between 0.0 and 1.0 relative to max score
            const confidence = maxScore > 0 ? Number((c.score / maxScore).toFixed(2)) : 1.0;
            
            const selectionBasisStr = scopeResolver && scopeResolver.hasExclusions()
                ? `Top 10% (P90) structural centrality: ranked #${idx + 1} of ${eligibleCandidates} eligible candidates (controlScore: ${c.score})`
                : `Top 10% (P90) structural centrality: ranked #${idx + 1} of ${universeCandidates} candidates (controlScore: ${c.score})`;

            const members: string[] = c.members || [];
            let excludedMembersCount = 0;
            if (scopeResolver && scopeResolver.hasExclusions() && members.length > 0) {
                for (const m of members) {
                    if (scopeResolver.matches(m)) {
                        excludedMembersCount++;
                    }
                }
            }
            const eligibleMembersCount = members.length - excludedMembersCount;
            const scopeStatus = (scopeResolver && scopeResolver.hasExclusions() && excludedMembersCount > 0 && eligibleMembersCount > 0)
                ? `Partially Excluded (Eligible: ${eligibleMembersCount}/${members.length}, Excluded: ${excludedMembersCount}/${members.length})`
                : undefined;

            const evidenceItem: EvidenceItem = {
                evidenceId: `E-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                type: "SEMANTIC_METRICS",
                sourceId: c.targetId,
                description: `Core traits (FanIn: ${c.evidence.fanIn}, BlastRadius: ${c.evidence.blastRadius}) -> Control Score: ${c.evidence.controlScore}`,
                filePath: c.targetId,
                graphNodeId: c.graphNodeId,
                metadata: {
                    controlScore: c.evidence.controlScore,
                    fanIn: c.evidence.fanIn,
                    blastRadius: c.evidence.blastRadius,
                    authorityReach: c.evidence.authorityReach,
                    rank: idx + 1,
                    totalCandidates: universeCandidates,
                    universeCandidates: universeCandidates,
                    excludedByScope: excludedByScopeCount,
                    eligibleCandidates: eligibleCandidates,
                    hasScopeExclusions: scopeResolver && scopeResolver.hasExclusions(),
                    scopeStatus
                },
                selectionBasis: selectionBasisStr
            };

            findings.push({
                findingId: `F-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                patternId: PatternId.SYSTEM_CORE,
                targetScope: 'NODE',
                targetId: c.targetId,
                confidence,
                evidence: [evidenceItem]
            });
        }

        return findings;
    }
}
