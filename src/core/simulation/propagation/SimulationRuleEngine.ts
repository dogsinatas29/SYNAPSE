import { SimulationState } from '../state/SimulationState';
import { SimulationScenario } from '../scenario/SimulationScenario';
import { SimulationSnapshot, SimulationNode, SimulationEdge } from '../SimulationSnapshot';
import { SimulationTransition } from '../state/SimulationTransition';
import { PropagationRule } from './PropagationRule';
import { PropagationContext } from './PropagationContext';
import { PropagationImpact } from './PropagationImpact';
import * as crypto from 'crypto';

import { SimulationPropagationResult } from './SimulationPropagationResult';

export const StateSeverity: Record<SimulationState, number> = {
    [SimulationState.NORMAL]: 0,
    [SimulationState.DIRTY]: 1,
    [SimulationState.BROKEN]: 2
};

export class SimulationRuleEngine {
    private rules: Map<string, PropagationRule> = new Map();

    public registerRule(rule: PropagationRule) {
        this.rules.set(rule.targetScenarioType, rule);
    }

    public propagate(
        snapshot: SimulationSnapshot,
        scenario: SimulationScenario
    ): SimulationPropagationResult {
        const rule = this.rules.get(scenario.type);
        if (!rule) {
            // Unsupported scenarios return empty transitions
            return { transitions: [], traces: [] };
        }

        const context = new PropagationContext();
        
        // Phase 8 Rule execution -> PropagationResult
        const result = rule.evaluate(scenario, snapshot, context);

        // Merge Impacts (Priority Merge based on StateSeverity)
        const mergedImpacts = new Map<string, PropagationImpact>();
        for (const impact of result.impacts) {
            const key = `${impact.ownerType}:${impact.ownerId}`;
            const existing = mergedImpacts.get(key);
            
            if (!existing) {
                mergedImpacts.set(key, impact);
            } else {
                if (StateSeverity[impact.targetState] > StateSeverity[existing.targetState]) {
                    existing.targetState = impact.targetState;
                }
            }
        }

        // Convert merged impacts to Transitions
        const transitions: SimulationTransition[] = [];
        let index = 0;
        for (const impact of mergedImpacts.values()) {
            let currentState: SimulationState | undefined;
            if (impact.ownerType === 'NODE') {
                currentState = snapshot.getNode(impact.ownerId)?.state;
            } else {
                currentState = snapshot.getEdge(impact.ownerId)?.state;
            }

            if (!currentState) {
                continue; // Target disappeared from snapshot
            }

            // State Saturation (상태 포화)
            if (StateSeverity[impact.targetState] < StateSeverity[currentState]) {
                continue; // Target state is weaker, drop it
            }
            if (StateSeverity[impact.targetState] === StateSeverity[currentState] && !impact.causeDescriptor) {
                continue; // Same state and no new cause, drop it
            }

            const transition: SimulationTransition = {
                id: `trans_${scenario.id}_${index++}`,
                ownerId: impact.ownerId,
                ownerType: impact.ownerType,
                from: currentState,
                to: impact.targetState,
                evidenceIds: scenario.evidenceIds ? [...scenario.evidenceIds] : [], // Only copy root cause
                causesToAdd: impact.causeDescriptor ? [{
                    id: `cause_${impact.causeDescriptor.eventType}_${impact.ownerId}_${impact.causeDescriptor.sourceId}`,
                    eventType: impact.causeDescriptor.eventType as any,
                    sourceId: impact.causeDescriptor.sourceId
                }] : []
            };
            transitions.push(transition);
        }

        // Maintain determinism by sorting by ID
        transitions.sort((a, b) => a.id.localeCompare(b.id));

        return {
            transitions,
            traces: result.traces,
            stats: result.stats
        };
    }

    /**
     * Helper to compute deterministic hash for 3-way verification
     */
    public static computeHash(data: any): string {
        return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    }
}
