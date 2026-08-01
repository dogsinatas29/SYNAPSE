import { ProjectState, Node } from '../../../types/schema';
import { AggregatedReportBundle, ReasonedReportBundle, ArchitecturalSmell } from '../types';
import { TarjanSCC } from './TarjanSCC';
import { InterventionEngine } from './InterventionEngine';

import { TargetSelector, DemolitionTarget } from '../TargetSelector';
import { InterventionSimulator, InterventionResult } from '../InterventionSimulator';
import { GraphModel } from '../../GraphModel';
import { Logger } from '../../../utils/Logger';

export class ReasoningEngine {
    
    /**
     * Applies heuristic rules to deduce Architectural Smells from the raw aggregated data.
     * Hard Lock-in: Mutating ProjectState/GraphModel is strictly forbidden.
     */
    public static reason(base: AggregatedReportBundle, state: ProjectState, visibleClusterIds?: string[]): ReasonedReportBundle {
        
        console.log("[AUDIT] nodes", state.nodes?.length || 0);
        console.log("[AUDIT] edges", state.edges?.length || 0);
        console.log("[AUDIT] visibleClusters", state.clusters?.length || 0);
        
        console.log("[VD-5]", Date.now());
        // 1. Tarjan SCC (Strictly Logic Node & Edges)
        const sccs = TarjanSCC.extract(state);
        console.log("[VD-6]", Date.now());

        // 2. Prepare Architectural Smells array
        const smells: ArchitecturalSmell[] = [];

        // 3. Intervention Discovery (Phase B & C)
        console.log("[STEP-2] Creating InterventionEngine");
        const interventionEngine = new InterventionEngine();
        console.time("INTERVENTION_ENGINE_DISCOVER");
        const criticalBridges = interventionEngine.discoverCriticalBridges(state, sccs);
        console.timeEnd("INTERVENTION_ENGINE_DISCOVER");
        console.log("[VD-7]", Date.now());

        // 4. Target Selection & Intervention Simulation (v0.3.34.7)
        console.log("[STEP-3] Simulating Interventions");
        const nodes = state.nodes || [];
        const nodeMap = new Map<string, Node>();
        for (const n of nodes) nodeMap.set(n.id, n);

        const edges = state.edges || [];
        const clusters = state.clusters || [];
        
        // --- PROVENANCE AUDIT: REASONING_ENGINE ---
        const provStats: Record<string, number> = {};
        edges.forEach(e => {
            const p = e.provenance || 'UNDEFINED';
            provStats[p] = (provStats[p] || 0) + 1;
        });
        Logger.info(`[PROVENANCE_AUDIT] [REASONING_ENGINE] Total Edges: ${edges.length} | Stats: ${JSON.stringify(provStats)}`);
        // ------------------------------------------
        
        const targets = TargetSelector.selectTargets(nodes, edges, clusters, criticalBridges, visibleClusterIds);
        const interventions: InterventionResult[] = [];
        
        console.time("INTERVENTION_SIMULATE");
        targets.forEach((target, index) => {
            const result = InterventionSimulator.simulate(
                nodes, edges, clusters, 
                target.targetEdgeIds, 
                target.reason, 
                target.tier === 0 ? "T0" : target.tier === 1 ? "T1" : target.tier === 2 ? "T2" : "T3", 
                index + 1,
                target.rootCauseId,
                sccs,
                nodeMap
            );
            interventions.push(result);
        });
        console.timeEnd("INTERVENTION_SIMULATE");
        console.log("[VD-8]", Date.now());

        return {
            version: 1,
            timestamp: Date.now(),
            sccs,
            smells,
            criticalBridges,
            interventions,
            base,
            auditLog: TarjanSCC.lastAuditLog
        };
    }
}
