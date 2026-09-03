import { SimulationTransition } from './SimulationTransition';

export class TransitionBatchValidator {
    /**
     * Validates a batch of transitions. 
     * Ensures that for any given owner, the transitions do not conflict (e.g. diverging from same state)
     * and form a valid sequential chain if there are multiple.
     */
    public static validateBatch(transitions: SimulationTransition[]): void {
        const ownerTransitions = new Map<string, SimulationTransition[]>();
        
        for (const t of transitions) {
            const key = `${t.ownerType}:${t.ownerId}`;
            if (!ownerTransitions.has(key)) {
                ownerTransitions.set(key, []);
            }
            ownerTransitions.get(key)!.push(t);
        }

        for (const [ownerKey, trans] of ownerTransitions.entries()) {
            if (trans.length <= 1) continue;

            // Check for duplicate 'from' states (Diverging conflicts)
            // e.g. NORMAL->DIRTY and NORMAL->BROKEN in same batch
            const fromSet = new Set<string>();
            for (const t of trans) {
                if (fromSet.has(t.from)) {
                    throw new Error(`Batch Conflict: Duplicate transitions originating from '${t.from}' for owner ${ownerKey}.`);
                }
                fromSet.add(t.from);
            }

            // Check for duplicate 'to' states (Converging conflicts)
            // e.g. BROKEN->DIRTY and NORMAL->DIRTY in same batch
            const toSet = new Set<string>();
            for (const t of trans) {
                if (toSet.has(t.to)) {
                    throw new Error(`Batch Conflict: Multiple transitions converging to '${t.to}' for owner ${ownerKey}.`);
                }
                toSet.add(t.to);
            }
            
            // To ensure they form a valid chain, the number of transitions should be exactly equal to 
            // the number of unique states involved minus 1.
            // Since we already proved no duplicate 'from' and no duplicate 'to', it's a set of disjoint paths or a single path.
            // We can just verify that it forms a single path.
            let startNodes = 0;
            for (const t of trans) {
                if (!toSet.has(t.from)) {
                    startNodes++;
                }
            }
            if (startNodes !== 1) {
                throw new Error(`Batch Conflict: Transitions for owner ${ownerKey} do not form a continuous valid chain.`);
            }
        }
    }
}
