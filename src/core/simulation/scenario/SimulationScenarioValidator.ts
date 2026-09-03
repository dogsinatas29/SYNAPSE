import { SimulationSnapshot } from '../SimulationSnapshot';
import { SimulationScenario } from './SimulationScenario';
import { SimulationScenarioType } from './SimulationScenarioType';
import { SimulationScenarioValidationResult, ValidationStatus } from './validation/SimulationScenarioValidationResult';
import { SimulationScenarioPolicy } from './validation/SimulationScenarioPolicy';
import { BoundarySplitPolicy } from './validation/policies/BoundarySplitPolicy';
import { DependencyRemovedPolicy } from './validation/policies/DependencyRemovedPolicy';
import { ApiChangedPolicy, ControlNodeChangedPolicy, ContractBrokenPolicy, BoundaryMergedPolicy } from './validation/policies/UnsupportedPolicies';

export class SimulationScenarioValidator {
    
    private static getPolicyForType(type: SimulationScenarioType): SimulationScenarioPolicy {
        switch (type) {
            case SimulationScenarioType.API_CHANGED:
                return ApiChangedPolicy;
            case SimulationScenarioType.CONTROL_NODE_CHANGED:
                return ControlNodeChangedPolicy;
            case SimulationScenarioType.CONTRACT_BROKEN:
                return ContractBrokenPolicy;
            case SimulationScenarioType.BOUNDARY_MERGED:
                return BoundaryMergedPolicy;
            case SimulationScenarioType.BOUNDARY_SPLIT:
                return new BoundarySplitPolicy();
            case SimulationScenarioType.DEPENDENCY_REMOVED:
                return new DependencyRemovedPolicy();
            default:
                throw new Error(`No policy registered for scenario type: ${type}`);
        }
    }

    /**
     * Validates if the scenario is logically feasible based on the topology of the snapshot.
     * Returns a ValidationResult instead of throwing.
     */
    public static validate(snapshot: SimulationSnapshot, scenario: SimulationScenario): SimulationScenarioValidationResult {
        if (!scenario.id || !scenario.type || !scenario.targetId) {
            return {
                status: ValidationStatus.INVALID,
                reason: 'Scenario is missing required fields (id, type, targetId).'
            };
        }

        const policy = this.getPolicyForType(scenario.type);
        return policy.evaluate(snapshot, scenario);
    }
}
