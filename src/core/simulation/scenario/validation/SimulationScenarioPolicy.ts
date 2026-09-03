import { SimulationScenario } from '../SimulationScenario';
import { SimulationSnapshot } from '../../SimulationSnapshot';
import { SimulationScenarioValidationResult } from './SimulationScenarioValidationResult';

export interface SimulationScenarioPolicy {
    /**
     * Evaluates whether the given scenario is structurally and semantically feasible
     * within the current snapshot topology. Does NOT execute the scenario.
     */
    evaluate(snapshot: SimulationSnapshot, scenario: SimulationScenario): SimulationScenarioValidationResult;
}
