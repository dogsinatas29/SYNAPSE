import { DetectorContext } from '../DetectorContext';
import { PatternDetector } from '../PatternDetector';
import { PatternFinding } from '../PatternFinding';
import { PatternId } from '../PatternId';
import { EvidenceItem } from '../EvidenceItem';
import { NodeRole } from '../../../../types/schema';
import { ScopeResolver } from '../../ScopeResolver';

export class EntryPointDetector implements PatternDetector {
    
    private isRealFile(filePath: string): boolean {
        if (!filePath) return false;
        if (filePath.startsWith('AGGREGATE_') || filePath.startsWith('SYSTEM_') || filePath.includes('UNKNOWN') || filePath.includes('OUT_OF_SCOPE')) {
            return false;
        }
        if (!filePath.includes('.')) return false;
        return /\.(ts|js|rs|kt|java|py|cpp|c|h|go|rb)$/i.test(filePath);
    }

    public detect(context: any, simContext?: any): PatternFinding[] {
        const findings: PatternFinding[] = [];
        
        if (!context || !context.snapshot || !context.snapshot.nodes || !context.snapshot.edges) {
            return findings;
        }

        const validNodes = context.snapshot.nodes.filter((n: any) => this.isRealFile(n.filePath || n.id || ''));
        if (validNodes.length === 0) return findings;

        const inDegreeMap = new Map<string, number>();
        const outDegreeMap = new Map<string, number>();

        for (const edge of context.snapshot.edges) {
            const src = edge.source || edge.from;
            const tgt = edge.target || edge.to;
            if (src) outDegreeMap.set(src, (outDegreeMap.get(src) || 0) + 1);
            if (tgt) inDegreeMap.set(tgt, (inDegreeMap.get(tgt) || 0) + 1);
        }

        // Execution Entry (Exclude test-role components from onboarding dependency root)
        let excludedTestCount = 0;
        let execCandidates = validNodes.filter((n: any) => {
            const id = n.filePath || n.id;
            const fanIn = inDegreeMap.get(id) || 0;
            const fanOut = outDegreeMap.get(id) || 0;
            n.fanIn = fanIn;
            n.fanOut = fanOut;

            if (fanIn === 0 && fanOut > 0) {
                if (n.role === NodeRole.TEST || String(n.role).toLowerCase() === 'test') {
                    excludedTestCount++;
                    return false;
                }
                return true;
            }
            return false;
        });

        if (excludedTestCount > 0) {
            console.log(`[ENTRY_POINT_DETECTOR] Excluded ${excludedTestCount} test-role nodes from DEPENDENCY_ROOT candidates.`);
        }

        // Fallback removed per Phase A v1.0.12 contract: Strict roots only.

        // Declared Scope Exclusion (Phase A)
        // Applied BEFORE Top 5 slice so Top 5 roots are populated from eligible candidates
        const scopeResolver: ScopeResolver = context?.scopeResolver || ScopeResolver.loadConfig(context?.workspaceRoot);
        const universeNodes = execCandidates.length;
        let excludedByScopeCount = 0;

        if (scopeResolver && scopeResolver.hasExclusions()) {
            execCandidates = execCandidates.filter((n: any) => {
                const p = n.filePath || n.id;
                if (scopeResolver.matches(p)) {
                    excludedByScopeCount++;
                    return false;
                }
                return true;
            });
            if (excludedByScopeCount > 0) {
                console.log(`[ENTRY_POINT_DETECTOR] Excluded ${excludedByScopeCount} nodes matching scopeExclusions.`);
            }
        }

        const eligibleNodes = execCandidates.length;

        if (execCandidates.length > 0) {
            execCandidates.sort((a: any, b: any) => {
                // Purely structural sorting: favor nodes with the highest outDegree (largest orchestrators)
                return (b.fanOut || 0) - (a.fanOut || 0);
            });
            
            // Take Top 5 Execution Roots to avoid hiding legitimate build.rs roots
            const topExecs = execCandidates.slice(0, 5);
            
            for (const topExec of topExecs) {
                const targetId = topExec.filePath || topExec.id;
                
                const evidence: EvidenceItem = {
                    evidenceId: `E-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    type: "EXECUTION_METRIC",
                    sourceId: targetId,
                    description: `Observable root entry point with outDegree=${topExec.fanOut || 0}, inDegree=${topExec.fanIn || 0}`,
                    filePath: targetId,
                    graphNodeId: topExec.id,
                    metadata: {
                        inDegree: topExec.fanIn || 0,
                        outDegree: topExec.fanOut || 0,
                        universeCandidates: universeNodes,
                        excludedByScope: excludedByScopeCount,
                        eligibleCandidates: eligibleNodes
                    },
                    predicate: {
                        condition: topExec.fanIn === 0 ? "STRICT_ROOT" : "FALLBACK_ROOT",
                        metric: "inDegree/outDegree",
                        operator: "==/>",
                        cutoff: topExec.fanIn === 0 ? "0/>0" : "X/>0",
                        actualValue: `${topExec.fanIn || 0}/${topExec.fanOut || 0}`
                    },
                    selectionBasis: `Observed graph dependency root (inDegree=${topExec.fanIn || 0}, outDegree=${topExec.fanOut || 0})`
                };

                findings.push({
                    findingId: `F-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    patternId: PatternId.DEPENDENCY_ROOT,
                    targetScope: 'NODE',
                    targetId: targetId,
                    confidence: 1.0,
                    evidence: [evidence]
                });
            }
        }

        return findings;
    }
}
