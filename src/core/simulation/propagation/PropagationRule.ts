import { SimulationScenario } from '../scenario/SimulationScenario';
import { SimulationScenarioType } from '../scenario/SimulationScenarioType';
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
