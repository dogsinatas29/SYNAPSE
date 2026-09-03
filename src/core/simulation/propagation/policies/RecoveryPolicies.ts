import { RecoveryScenario } from '../../scenario/RecoveryScenario';
import { ValidationScenario } from '../../scenario/ValidationScenario';
import { SimulationState } from '../../state/SimulationState';

// Recovery Policy Contract: Must return DIRTY.
export class DependencyRestoredPolicy {
    public evaluate(scenario: RecoveryScenario): SimulationState {
        // Recovery Event => DIRTY
        return SimulationState.DIRTY;
    }
}

export class BoundaryReconnectedPolicy {
    public evaluate(scenario: RecoveryScenario): SimulationState {
        return SimulationState.DIRTY;
    }
}

// Validation Policy Contract: Must return NORMAL.
export class ValidationPassedPolicy {
    public evaluate(scenario: ValidationScenario): SimulationState {
        // Validation Event => NORMAL
        return SimulationState.NORMAL;
    }
}
