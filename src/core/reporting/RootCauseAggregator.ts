import { FindingType, SimulationContext } from '../../types/schema';
import { ProblemGroup } from './types';
import { Logger } from '../../utils/Logger';

export class RootCauseAggregator {
    /**
     * Groups raw findings by their root cause (source node or target cluster)
     * rather than keeping them as a flat list of 500+ items.
     */
    public aggregate(context: SimulationContext): ProblemGroup[] {
        if (!context.evidenceBundle || !context.evidenceBundle.findings) {
            return [];
        }

        const findings = context.evidenceBundle.findings;
        Logger.info(`[AGGREGATOR] start ${findings.length}`);
        const groupMap = new Map<string, ProblemGroup>();

        const findingTypes = new Map<string, number>();

        for (const finding of findings) {
            findingTypes.set(finding.type, (findingTypes.get(finding.type) || 0) + 1);

            const rawId = finding.sourceId || finding.nodeId || (finding.nodeIds && finding.nodeIds[0]) || 'UNKNOWN';
            
            // Skip synthetic cluster aggregates
            if (rawId.startsWith('AGGREGATE_') || rawId.startsWith('SYSTEM_') || rawId === 'UNKNOWN') {
                continue;
            }

            // Extract subsystem/module (top 2 directories) for massive scale grouping
            let ownerId = rawId;
            if (typeof rawId === 'string' && rawId.includes('/')) {
                const parts = rawId.split('/');
                if (parts.length >= 2) {
                    // e.g. "core/config/project_settings.cpp" -> "core/config"
                    ownerId = parts.slice(0, 2).join('/');
                } else if (parts.length === 1) {
                    ownerId = parts[0];
                }
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
