import { SimulationScenario, SimulationScenarioType } from '../scenario/SimulationScenario';
import { SimulationSnapshot } from '../SimulationSnapshot';
import { PropagationContext } from './PropagationContext';
import { PropagationResult } from './PropagationResult';

export interface PropagationRule {
    readonly targetScenarioType: SimulationScenarioType;
    readonly maxDepth?: number;

    evaluate(
        scenario: SimulationScenario,
        snapshot: SimulationSnapshot,
        context: PropagationContext
    ): PropagationResult;
}
