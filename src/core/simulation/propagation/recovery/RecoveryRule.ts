import { RecoveryScenario } from '../../scenario/RecoveryScenario';
import { RecoveryImpact } from './RecoveryImpact';
import { RecoveryPropagationContext } from './RecoveryPropagationContext';

export interface RecoveryRule {
    /**
     * Determines if this rule applies to the given RecoveryScenario.
     */
    matches(scenario: RecoveryScenario): boolean;

    /**
     * Evaluates the recovery scenario against the current snapshot.
     * The rule must NOT mutate the snapshot or the registry.
     * It only reads the registry (using context.snapshot.registry) and emits RecoveryImpacts.
     */
    evaluate(scenario: RecoveryScenario, context: RecoveryPropagationContext): readonly RecoveryImpact[];
}
