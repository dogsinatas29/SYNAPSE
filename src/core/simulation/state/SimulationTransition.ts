import { SimulationState } from './SimulationState';

export interface SimulationTransition {
    id: string;
    ownerId: string;
    ownerType: 'NODE' | 'EDGE';

    from: SimulationState;
    to: SimulationState;

    /**
     * The IDs of the evidences that caused this state transition.
     * This forms the causal chain for blast radius calculations and auditing.
     */
    evidenceIds: readonly string[];

    /**
     * Optional failure causes to add to the registry during this transition.
     */
    causesToAdd?: readonly import('./FailureCauseRegistry').FailureCause[];

    /**
     * Optional failure cause IDs to remove from the registry during this transition.
     */
    causesToRemove?: readonly string[];
}
