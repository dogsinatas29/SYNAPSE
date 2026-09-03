import { SimulationScenarioPolicy } from '../SimulationScenarioPolicy';
import { SimulationScenario } from '../../SimulationScenario';
import { SimulationSnapshot } from '../../../SimulationSnapshot';
import { SimulationScenarioValidationResult, ValidationStatus } from '../SimulationScenarioValidationResult';

export class UnsupportedPolicy implements SimulationScenarioPolicy {
    constructor(private readonly reason: string) {}

    evaluate(snapshot: SimulationSnapshot, scenario: SimulationScenario): SimulationScenarioValidationResult {
        return {
            status: ValidationStatus.UNSUPPORTED,
            reason: this.reason
        };
    }
}

export const ApiChangedPolicy = new UnsupportedPolicy('API_CHANGED is unsupported because no API classification evidence exists in the current snapshot.');
export const ControlNodeChangedPolicy = new UnsupportedPolicy('CONTROL_NODE_CHANGED is unsupported because no control-node evidence exists in the snapshot.');
export const ContractBrokenPolicy = new UnsupportedPolicy('CONTRACT_BROKEN is unsupported because contract schema evidence does not exist in the snapshot.');
export const BoundaryMergedPolicy = new UnsupportedPolicy('BOUNDARY_MERGED is unsupported because multi-target boundary definitions are currently not fully modeled in the snapshot.');
