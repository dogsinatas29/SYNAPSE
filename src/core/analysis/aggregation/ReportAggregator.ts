import { EvidenceBundle, AggregatedReportBundle, CycleCluster, PressureFinding, CycleFinding, StructuralFinding, NecrosisFinding, BoundaryFinding, SchemaFinding, FractureFinding } from '../types';
import * as crypto from 'crypto';
import { ProjectState } from '../../../types/schema';

export class ReportAggregator {
    public static aggregate(bundle: EvidenceBundle, state: ProjectState): AggregatedReportBundle {
        const findings = bundle.findings;
        
        // 1. Separate by type
        const pressures = findings.filter(f => f.type === 'pressure') as PressureFinding[];
        const cycles = findings.filter(f => f.type === 'cycle') as CycleFinding[];
        const structurals = findings.filter(f => f.type === 'structural') as StructuralFinding[];
        const necrosis = findings.filter(f => f.type === 'necrosis' || f.type === 'boundary' || f.type === 'schema') as (NecrosisFinding | BoundaryFinding | SchemaFinding)[];
        const fractures = findings.filter(f => f.type === 'fracture') as FractureFinding[];

        // 2. Pressure Aggregation (Top 10)
        const bottlenecks = pressures.filter(p => p.pressureType === 'bottleneck').sort((a, b) => (b.value || 0) - (a.value || 0));
        const fanOuts = pressures.filter(p => p.pressureType === 'fan-out').sort((a, b) => (b.value || 0) - (a.value || 0));
        const fanIns = pressures.filter(p => p.pressureType === 'fan-in').sort((a, b) => (b.value || 0) - (a.value || 0));
        const crossClusters = pressures.filter(p => p.pressureType === 'warning' && p.message.includes('between clusters')).sort((a, b) => (b.value || 0) - (a.value || 0));

        // 3. Cycle Canonicalization (Exact Node Set Hash)
        const cycleMap = new Map<string, CycleCluster>();
        for (const cycle of cycles) {
            const sortedNodes = [...cycle.nodeIds].sort();
            const hash = crypto.createHash('md5').update(sortedNodes.join(',')).digest('hex');
            
            if (!cycleMap.has(hash)) {
                cycleMap.set(hash, {
                    id: hash,
                    nodeIds: sortedNodes,
                    paths: [],
                    count: 0
                });
            }
            
            const cluster = cycleMap.get(hash)!;
            cluster.count++;
            if (cluster.paths.length < 3) { // Keep top 3 paths per cluster for report
                cluster.paths.push(cycle.message);
            }
        }
        
        const canonicalCycles = Array.from(cycleMap.values()).sort((a, b) => b.count - a.count);

        // 4. Structural Prioritization
        const nodeMap = new Map(state.nodes?.map(n => [n.id, n]));
        
        const prioritizedStructurals = structurals.filter(s => {
            const n = nodeMap.get(s.nodeId);
            if (!n) return false;
            if (n.data?.layer !== undefined && n.data.layer > 0) return true;
            if (n.data?.label && (n.data.label.includes('src/') || n.data.label.includes('core/'))) return true;
            return false;
        });

        return {
            version: 1,
            timestamp: Date.now(),
            rawFindingsCount: findings.length,
            
            topBottlenecks: bottlenecks.slice(0, 10),
            topFanOuts: fanOuts.slice(0, 10),
            topFanIns: fanIns.slice(0, 10),
            crossClusterPressures: crossClusters.slice(0, 10),
            
            canonicalCycles: canonicalCycles,
            criticalStructurals: prioritizedStructurals.slice(0, 20),
            criticalNecrosis: necrosis,
            criticalFractures: fractures,
            
            stats: {
                totalBottleneck: bottlenecks.length,
                totalFanOut: fanOuts.length,
                totalFanIn: fanIns.length,
                totalCrossCluster: crossClusters.length,
                totalCycleClusters: canonicalCycles.length,
                totalCycles: cycles.length,
                totalStructurals: structurals.length,
                totalNecrosis: necrosis.length,
                totalFracture: fractures.length
            }
        };
    }
}
