import { SimulationScenarioType } from './SimulationScenarioType';

export interface SimulationScenario {
    readonly id: string;
    readonly type: SimulationScenarioType;
    readonly targetId: string; // ID of the node, edge, or boundary affected
    readonly metadata?: Readonly<any>;

    /**
     * Root Cause Evidence only.
     * Derived / propagated evidences must not be stored here.
     * This forms the entry point for "where did the propagation start".
     */
    readonly evidenceIds?: readonly string[];
}
