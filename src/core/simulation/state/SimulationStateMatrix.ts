import { SimulationState } from './SimulationState';
import { SimulationEvidenceType } from '../evidence/SimulationEvidenceType';

export interface TransitionRule {
    from: SimulationState;
    to: SimulationState;
    requiredEvidence?: SimulationEvidenceType[];
}

export const VALID_TRANSITIONS: TransitionRule[] = [
    // Failure Engine (Phase 7)
    { from: SimulationState.NORMAL, to: SimulationState.DIRTY },
    { from: SimulationState.NORMAL, to: SimulationState.BROKEN },
    { from: SimulationState.DIRTY, to: SimulationState.BROKEN },

    // Recovery Engine (Phase 10)
    { from: SimulationState.BROKEN, to: SimulationState.DIRTY },

    // Validation Engine (Phase 11)
    { from: SimulationState.DIRTY, to: SimulationState.NORMAL },

    // Registry Updates (Multiple Failures / Partial Recovery - Phase 9.9)
    // Only self-transitions for BROKEN/DIRTY are allowed for accumulating causes without changing state level
    { from: SimulationState.BROKEN, to: SimulationState.BROKEN },
    { from: SimulationState.DIRTY, to: SimulationState.DIRTY }
];

export class StateMatrixValidator {
    public static canTransition(from: SimulationState, to: SimulationState): boolean {
        return VALID_TRANSITIONS.some(rule => rule.from === from && rule.to === to);
    }

    public static assertTransition(from: SimulationState, to: SimulationState): void {
        if (!this.canTransition(from, to)) {
            throw new Error(`Invalid State Transition: Cannot transition from ${from} to ${to}.`);
        }
    }
}
