import { SimulationSnapshot } from '../../SimulationSnapshot';
import { RecoveryScenario } from '../../scenario/RecoveryScenario';
import { RecoveryRule } from './RecoveryRule';
import { SimulationTransition } from '../../state/SimulationTransition';
import { SimulationState } from '../../state/SimulationState';
import { RecoveryPropagationContext } from './RecoveryPropagationContext';
import { RecoveryImpact } from './RecoveryImpact';

export class RecoveryRuleEngine {
    private rules: RecoveryRule[] = [];

    public registerRule(rule: RecoveryRule): void {
        this.rules.push(rule);
    }

    public evaluate(scenario: RecoveryScenario, snapshot: SimulationSnapshot): SimulationTransition[] {
        const context: RecoveryPropagationContext = {
            snapshot,
            visited: new Set<string>(),
            depth: 0
        };

        const impacts: RecoveryImpact[] = [];
        for (const rule of this.rules) {
            if (rule.matches(scenario)) {
                impacts.push(...rule.evaluate(scenario, context));
            }
        }

        const transitions: SimulationTransition[] = [];
        let index = 0;

        for (const impact of impacts) {
            // Find current state
            let currentState: SimulationState | undefined;
            if (impact.ownerType === 'NODE') {
                currentState = snapshot.getNode(impact.ownerId)?.state;
            } else {
                currentState = snapshot.getEdge(impact.ownerId)?.state;
            }

            if (currentState === undefined) continue;

            // Only BROKEN states can be processed by Recovery Rule Engine
            if (currentState !== SimulationState.BROKEN) {
                continue; // Skip NORMAL or DIRTY
            }

            // Determine if it will fully recover after removing these causes
            const activeCauses = snapshot.registry.getActiveCauses(impact.ownerType, impact.ownerId);
            const remainingCauses = activeCauses.filter(c => !impact.causesToRemove.includes(c.id));
            
            // If empty, we can transition to DIRTY. Otherwise, stay BROKEN (partial recovery).
            const targetState = remainingCauses.length === 0 ? SimulationState.DIRTY : SimulationState.BROKEN;

            transitions.push({
                id: `rec_trans_${scenario.id}_${index++}`,
                ownerId: impact.ownerId,
                ownerType: impact.ownerType,
                from: currentState,
                to: targetState,
                evidenceIds: [impact.evidenceId],
                causesToRemove: impact.causesToRemove
            });
        }

        return transitions;
    }
}
