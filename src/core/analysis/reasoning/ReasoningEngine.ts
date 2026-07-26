import { ProjectState } from '../../../types/schema';
import { AggregatedReportBundle, ReasonedReportBundle, ArchitecturalSmell } from '../types';
import { TarjanSCC } from './TarjanSCC';
import { InterventionEngine } from './InterventionEngine';

export class ReasoningEngine {
    
    /**
     * Applies heuristic rules to deduce Architectural Smells from the raw aggregated data.
     * Hard Lock-in: Mutating ProjectState/GraphModel is strictly forbidden.
     */
    public static reason(base: AggregatedReportBundle, state: ProjectState): ReasonedReportBundle {
        
        // 1. Tarjan SCC (Strictly Logic Node & Edges)
        const sccs = TarjanSCC.extract(state);

        // 2. Prepare Architectural Smells array
        const smells: ArchitecturalSmell[] = [];

        // 3. Intervention Discovery (Phase B & C)
        console.log("[STEP-2] Creating InterventionEngine");
        const interventionEngine = new InterventionEngine();
        const criticalBridges = interventionEngine.discoverCriticalBridges(state, sccs);

        return {
            version: 1,
            timestamp: Date.now(),
            sccs,
            smells,
            criticalBridges,
            base,
            auditLog: TarjanSCC.lastAuditLog
        };
    }
}
