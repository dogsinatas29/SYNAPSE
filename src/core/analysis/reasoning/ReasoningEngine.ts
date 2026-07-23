import { ProjectState } from '../../../types/schema';
import { AggregatedReportBundle, ReasonedReportBundle, ArchitecturalSmell } from '../types';
import { TarjanSCC } from './TarjanSCC';

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

        // 3. (Phase B) Dependency Composition & (Phase C) Smell Detection
        // TODO: Implement God Object, Service Locator, Layer Inversion, UI-Core Coupling

        return {
            version: 1,
            timestamp: Date.now(),
            sccs,
            smells,
            base
        };
    }
}
