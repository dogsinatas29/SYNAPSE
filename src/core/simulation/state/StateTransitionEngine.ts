import { SimulationSnapshot, SimulationNode, SimulationEdge } from '../SimulationSnapshot';
import { SimulationTransition } from './SimulationTransition';
import { TransitionResult } from './TransitionResult';
import { TransitionBatchValidator } from './TransitionBatchValidator';
import { StateMatrixValidator } from './SimulationStateMatrix';

export class StateTransitionEngine {
    /**
     * Applies a batch of transitions to a snapshot.
     * Functions as a Transaction: if any transition violates constraints, it throws an error and leaves the original snapshot untouched.
     */
    public static applyTransitions(
        snapshot: SimulationSnapshot,
        transitions: SimulationTransition[]
    ): TransitionResult {
        if (transitions.length === 0) {
            return {
                snapshot, // No changes
                appliedCount: 0,
                transitionIds: []
            };
        }

        // 1. Validate the batch for internal consistency
        TransitionBatchValidator.validateBatch(transitions);

        // 2. Clone the snapshot to guarantee original immutability
        const newSnapshot = snapshot.clone();

        // 3. Process transitions per owner to handle chains correctly
        const ownerTransitions = new Map<string, SimulationTransition[]>();
        for (const t of transitions) {
            // Verify matrix rule for each transition independently
            StateMatrixValidator.assertTransition(t.from, t.to);

            const key = `${t.ownerType}:${t.ownerId}`;
            if (!ownerTransitions.has(key)) {
                ownerTransitions.set(key, []);
            }
            ownerTransitions.get(key)!.push(t);
        }

        // 4. Apply transitions
        let appliedCount = 0;
        const appliedTransitionIds: string[] = [];

        for (const [key, transList] of ownerTransitions.entries()) {
            const [ownerType, ownerId] = key.split(':');
            
            // Resolve target object
            let target: SimulationNode | SimulationEdge | undefined;
            if (ownerType === 'NODE') {
                target = newSnapshot.getNode(ownerId);
            } else if (ownerType === 'EDGE') {
                target = newSnapshot.getEdge(ownerId);
            }

            if (!target) {
                throw new Error(`Transaction Failed: Target ${ownerType} '${ownerId}' does not exist in snapshot.`);
            }

            // Since it's a valid chain, we can just sort it so it applies in order.
            // Find the start of the chain (the transition whose 'from' is not any other transition's 'to' unless it's a self-transition)
            let currentTrans: SimulationTransition | undefined;
            if (transList.length === 1) {
                currentTrans = transList[0];
            } else {
                const toSet = new Set(transList.filter(t => t.from !== t.to).map(t => t.to));
                currentTrans = transList.find(t => !toSet.has(t.from));
            }

            if (!currentTrans) {
                throw new Error(`Transaction Failed: Circular chain detected for owner ${key}.`);
            }

            // Verify initial state matches
            if (target.state !== currentTrans.from) {
                throw new Error(`Transaction Failed: State mismatch for ${ownerType} '${ownerId}'. Expected '${currentTrans.from}' but was '${target.state}'.`);
            }

            // Follow the chain and apply
            while (currentTrans) {
                // Apply the transition (we bypass readonly purely for the builder execution, before sealing)
                (target as any).state = currentTrans.to;
                
                // Update Registry
                if (currentTrans.causesToAdd) {
                    for (const cause of currentTrans.causesToAdd) {
                        newSnapshot.registry.addCause(ownerType as 'NODE' | 'EDGE', ownerId, cause);
                    }
                }
                if (currentTrans.causesToRemove) {
                    for (const causeId of currentTrans.causesToRemove) {
                        newSnapshot.registry.removeCause(ownerType as 'NODE' | 'EDGE', ownerId, causeId);
                    }
                }

                appliedCount++;
                appliedTransitionIds.push(currentTrans.id);

                // Find next in chain (excluding the current transition to prevent infinite loop on self-transitions)
                const previousTrans: import('./SimulationTransition').SimulationTransition = currentTrans;
                currentTrans = transList.find(t => t.from === previousTrans.to && t !== previousTrans);
            }
        }

        // 5. Seal the new snapshot
        newSnapshot.seal();

        return {
            snapshot: newSnapshot,
            appliedCount,
            transitionIds: appliedTransitionIds
        };
    }
}
