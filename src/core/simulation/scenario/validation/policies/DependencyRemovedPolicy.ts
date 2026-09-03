import { SimulationScenarioPolicy } from '../SimulationScenarioPolicy';
import { SimulationScenario } from '../../SimulationScenario';
import { SimulationSnapshot } from '../../../SimulationSnapshot';
import { SimulationScenarioValidationResult, ValidationStatus } from '../SimulationScenarioValidationResult';

export class DependencyRemovedPolicy implements SimulationScenarioPolicy {
    evaluate(snapshot: SimulationSnapshot, scenario: SimulationScenario): SimulationScenarioValidationResult {
        const edge = snapshot.getEdge(scenario.targetId);
        
        if (!edge) {
            return {
                status: ValidationStatus.INVALID,
                reason: `Dependency edge with ID '${scenario.targetId}' does not exist.`
            };
        }

        // According to our Phase 5.5 Metadata Audit, the only actual dependency edge type is 'INCLUDE'.
        if (edge.type !== 'INCLUDE') {
            return {
                status: ValidationStatus.INVALID,
                reason: `Edge '${scenario.targetId}' is of type '${edge.type}'. Only 'INCLUDE' edges can be removed as dependencies.`
            };
        }

        return { status: ValidationStatus.VALID };
    }
}
