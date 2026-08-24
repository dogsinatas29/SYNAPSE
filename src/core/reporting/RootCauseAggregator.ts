import { FindingType, SimulationContext } from '../../types/schema';
import { ProblemGroup } from './types';
import { Logger } from '../../utils/Logger';

export class RootCauseAggregator {
    /**
     * Groups raw findings by their root cause (source node or target cluster)
     * rather than keeping them as a flat list of 500+ items.
     */
    public aggregate(context: SimulationContext, semanticContext?: any): ProblemGroup[] {
        if (!context.evidenceBundle || !context.evidenceBundle.findings) {
            return [];
        }

        const findings = context.evidenceBundle.findings;
        Logger.info(`[AGGREGATOR] start ${findings.length}`);
        const groupMap = new Map<string, ProblemGroup>();

        const findingTypes = new Map<string, number>();

        for (const finding of findings) {
            // Skip semantic metadata findings from grouping
            if (finding.type === 'semantic') continue;

            findingTypes.set(finding.type, (findingTypes.get(finding.type) || 0) + 1);

            const rawId = finding.sourceId || finding.nodeId || (finding.nodeIds && finding.nodeIds[0]) || 'UNKNOWN';
            
            // Skip synthetic cluster aggregates
            if (rawId.startsWith('AGGREGATE_') || rawId.startsWith('SYSTEM_') || rawId === 'UNKNOWN') {
                continue;
            }

            // Try to match the exact boundary id discovered by SemanticContext
            let ownerId = rawId;
            if (semanticContext) {
                const boundary = semanticContext.getBoundaryForNode(rawId);
                if (boundary) {
                    ownerId = boundary.id;
                } else {
                    let depth = 2;
                    ownerId = extractTopLevelDir(rawId, depth) || rawId;
                    while (semanticContext.isWrapper(ownerId) && depth < 5) {
                        depth++;
                        ownerId = extractTopLevelDir(rawId, depth) || rawId;
                    }
                }
            } else {
                ownerId = extractTopLevelDir(rawId, 2) || rawId;
            }
            
            const groupKey = ownerId; // Group by subsystem entirely, merging finding types

            let category: 'INTERNAL' | 'EXTERNAL' | 'TESTS' | 'DOCS' | 'PLATFORM' = 'INTERNAL';
            if (ownerId.startsWith('thirdparty/') || ownerId.startsWith('vendor/') || ownerId.startsWith('node_modules/')) {
                category = 'EXTERNAL';
            } else if (ownerId.startsWith('tests/') || ownerId.startsWith('test/')) {
                category = 'TESTS';
            } else if (ownerId.startsWith('docs/') || ownerId.startsWith('doc/')) {
                category = 'DOCS';
            } else if (ownerId.startsWith('platform/')) {
                category = 'PLATFORM';
            }

            if (category === 'EXTERNAL') {
                continue;
            }

            if (!groupMap.has(groupKey)) {
                groupMap.set(groupKey, {
                    id: groupKey,
                    ownerCluster: ownerId, 
                    category,
                    primaryFindingType: 'MULTIPLE_VIOLATIONS',
                    relatedFindings: [],
                    totalImpact: 0,
                    blastRadius: 0,
                    cycleParticipation: 0,
                    boundaryCrossings: 0,
                    fanOut: 0
                });
            }

            const group = groupMap.get(groupKey)!;
            group.relatedFindings.push(finding);
            group.totalImpact += 1;

            // Aggregate metrics based on finding type
            if (finding.type === FindingType.CYCLIC_DEPENDENCY || finding.type === 'cycle') {
                group.cycleParticipation += 1;
            }
            if (finding.type === 'BOUNDARY_VIOLATION' || finding.type === 'LAYER_VIOLATION' || finding.type === 'fracture') {
                group.boundaryCrossings += 1;
            }
            if (finding.type === FindingType.EXCESSIVE_FAN_OUT || finding.type === 'necrosis' || finding.type === 'pressure') {
                group.fanOut += 1;
            }
            
            // Blast radius is ideally extracted from the finding's impact or pre-calculated metrics.
            // If the finding has a specific metric, we add it. Otherwise, we assume 1 file = 1 impact.
            // In a real scenario, this would use context.metrics.
            group.blastRadius += 1;
        }
        
        Logger.info(`[AGGREGATOR] Finding Types Breakdown: ${JSON.stringify(Object.fromEntries(findingTypes))}`);
        
        const result = Array.from(groupMap.values());
        
        // Debug dump for top 5 groups
        const sortedDump = [...result].sort((a, b) => b.blastRadius - a.blastRadius).slice(0, 5);
        Logger.info(`[AGGREGATOR] Top 5 Dump: ${JSON.stringify(sortedDump, null, 2)}`);

        Logger.info(`[AGGREGATOR] end. Group count: ${result.length}`);
        return result;
    }
}

function extractTopLevelDir(filePath: string, depth: number = 2): string | null {
    if (!filePath || filePath.indexOf('/') === -1) return null;
    const parts = filePath.split('/');
    if (parts.length >= depth) {
        return parts.slice(0, depth).join('/');
    }
    return parts[0];
}
