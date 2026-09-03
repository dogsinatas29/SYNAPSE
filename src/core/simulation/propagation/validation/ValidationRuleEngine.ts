import { SimulationSnapshot } from '../../SimulationSnapshot';
import { ValidationScenario } from '../../scenario/ValidationScenario';
import { ValidationRule } from './ValidationRule';
import { SimulationTransition } from '../../state/SimulationTransition';
import { SimulationState } from '../../state/SimulationState';
import { ValidationImpact } from './ValidationImpact';

export class ValidationRuleEngine {
    private rules: ValidationRule[] = [];

    public registerRule(rule: ValidationRule): void {
        this.rules.push(rule);
    }

    public evaluate(scenario: ValidationScenario, snapshot: SimulationSnapshot): SimulationTransition[] {
        const impacts: ValidationImpact[] = [];
        for (const rule of this.rules) {
            if (rule.matches(scenario)) {
                impacts.push(...rule.evaluate(scenario));
            }
        }

        const transitions: SimulationTransition[] = [];
        let index = 0;

        for (const impact of impacts) {
            let currentState: SimulationState | undefined;
            if (impact.ownerType === 'NODE') {
                currentState = snapshot.getNode(impact.ownerId)?.state;
            } else {
                currentState = snapshot.getEdge(impact.ownerId)?.state;
            }

            if (currentState === undefined) continue;

            // NeedsValidation Check: Only process if state is DIRTY.
            // NORMAL + VALIDATION_PASSED = Ignored
            // BROKEN + VALIDATION_PASSED = Ignored
            if (currentState !== SimulationState.DIRTY) {
                continue;
            }

            // Always transition to NORMAL
            transitions.push({
                id: `val_trans_${scenario.id}_${index++}`,
                ownerId: impact.ownerId,
                ownerType: impact.ownerType,
                from: currentState,
                to: SimulationState.NORMAL,
                evidenceIds: [impact.evidenceId]
            });
        }

        return transitions;
    }
}
