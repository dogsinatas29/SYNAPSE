import { SimulationSnapshot } from '../../SimulationSnapshot';

export interface RecoveryPropagationContext {
    readonly snapshot: SimulationSnapshot;
    readonly visited: Set<string>;
    readonly depth: number;
    readonly maxDepth?: number;
}
