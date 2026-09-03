import { SimulationSnapshot } from '../SimulationSnapshot';

export interface TransitionResult {
    snapshot: SimulationSnapshot;
    appliedCount: number;
    transitionIds: readonly string[];
}
