import { RecoveryRule } from '../RecoveryRule';
import { RecoveryScenario } from '../../../scenario/RecoveryScenario';
import { RecoveryImpact } from '../RecoveryImpact';
import { RecoveryPropagationContext } from '../RecoveryPropagationContext';
import { RecoveryEventType } from '../../../scenario/RecoveryEventType';
import { SimulationState } from '../../../state/SimulationState';

export class DependencyRestoredRealRule implements RecoveryRule {
    matches(scenario: RecoveryScenario): boolean {
        return scenario.type === RecoveryEventType.DEPENDENCY_RESTORED;
    }

    evaluate(scenario: RecoveryScenario, context: RecoveryPropagationContext): readonly RecoveryImpact[] {
        const impacts: RecoveryImpact[] = [];
        
        // targetId is the Edge that was restored
        const edgeId = scenario.targetId;
        const edge = context.snapshot.getEdge(edgeId);
        if (!edge) {
            return [];
        }

        // Start traversal from the node that depends on the edge (caller)
        const queue: string[] = [edge.from];
        
        // Also emit impact for the edge itself
        const edgeCauses = context.snapshot.registry.getActiveCauses('EDGE', edgeId);
        const edgeCauseToRemove = edgeCauses.find(c => c.sourceId === edgeId && c.eventType === 'DEPENDENCY_REMOVED');
        if (edgeCauseToRemove) {
            impacts.push({
                ownerId: edgeId,
                ownerType: 'EDGE',
                evidenceId: scenario.id,
                causesToRemove: [edgeCauseToRemove.id]
            });
        }

        const reverseEdges = new Map<string, string[]>();
        for (const e of context.snapshot.edges) {
            let callerList = reverseEdges.get(e.to);
            if (!callerList) {
                callerList = [];
                reverseEdges.set(e.to, callerList);
            }
            callerList.push(e.from);
        }

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            
            if (context.visited.has(currentId)) {
                continue;
            }
            context.visited.add(currentId);

            const node = context.snapshot.getNode(currentId);
            if (!node) continue;

            const activeCauses = context.snapshot.registry.getActiveCauses('NODE', currentId);
            const causeToRemove = activeCauses.find(c => c.sourceId === edgeId && c.eventType === 'DEPENDENCY_REMOVED');

            if (causeToRemove) {
                // We found a cause, emit an impact to remove it
                impacts.push({
                    ownerId: currentId,
                    ownerType: 'NODE',
                    evidenceId: scenario.id,
                    causesToRemove: [causeToRemove.id]
                });

                // Continue traversal backwards
                const callers = reverseEdges.get(currentId) || [];
                for (const callerId of callers) {
                    if (!context.visited.has(callerId)) {
                        queue.push(callerId);
                    }
                }
            }
        }

        return impacts;
    }
}
