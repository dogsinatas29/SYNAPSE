import { SimulationScenarioPolicy } from '../SimulationScenarioPolicy';
import { SimulationScenario } from '../../SimulationScenario';
import { SimulationSnapshot } from '../../../SimulationSnapshot';
import { SimulationScenarioValidationResult, ValidationStatus } from '../SimulationScenarioValidationResult';

export class BoundarySplitPolicy implements SimulationScenarioPolicy {
    evaluate(snapshot: SimulationSnapshot, scenario: SimulationScenario): SimulationScenarioValidationResult {
        const boundary = snapshot.getBoundary(scenario.targetId);
        
        if (!boundary) {
            return {
                status: ValidationStatus.INVALID,
                reason: `Boundary with ID '${scenario.targetId}' does not exist.`
            };
        }

        if (boundary.members.length < 2) {
            return {
                status: ValidationStatus.INVALID,
                reason: `Boundary '${scenario.targetId}' has only ${boundary.members.length} members. It must have at least 2 members to be split.`
            };
        }

        return { status: ValidationStatus.VALID };
    }
}
