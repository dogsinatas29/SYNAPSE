import { SimulationSnapshot, SimulationNode } from './src/core/simulation/SimulationSnapshot';
import { SimulationState } from './src/core/simulation/state/SimulationState';
import { StateTransitionEngine } from './src/core/simulation/state/StateTransitionEngine';
import { SimulationTransition } from './src/core/simulation/state/SimulationTransition';

function runRegistryTest() {
    console.log('🚀 Phase 9.9: Failure Cause Registry Verification\n');

    const nodeC: SimulationNode = {
        id: 'node_C',
        type: 'source',
        cluster_id: 'cluster_1',
        state: SimulationState.NORMAL
    };

    const initialSnapshot = new SimulationSnapshot([nodeC], [], [], []);

    // 1. Cause A makes Node C BROKEN
    console.log('--- Step 1: Cause A makes Node C BROKEN ---');
    const transitionA: SimulationTransition = {
        id: 't1',
        ownerId: 'node_C',
        ownerType: 'NODE',
        from: SimulationState.NORMAL,
        to: SimulationState.BROKEN,
        evidenceIds: [],
        causesToAdd: [{ id: 'cause_A', eventType: 'DEPENDENCY_REMOVED', sourceId: 'edge_A' }]
    };

    const result1 = StateTransitionEngine.applyTransitions(initialSnapshot, [transitionA]);
    let currentSnapshot = result1.snapshot;
    let causes = currentSnapshot.registry.getActiveCauses('NODE', 'node_C');
    console.log(`Node C State: ${currentSnapshot.getNode('node_C')?.state}`);
    console.log(`Active Causes: ${causes.map(c => c.id).join(', ')}`);
    console.log(`Can Recover? ${currentSnapshot.registry.canRecover('NODE', 'node_C')}`);

    // 2. Cause B also makes Node C BROKEN (already BROKEN, just adding cause)
    console.log('\n--- Step 2: Cause B added (Multiple Failures) ---');
    const transitionB: SimulationTransition = {
        id: 't2',
        ownerId: 'node_C',
        ownerType: 'NODE',
        from: SimulationState.BROKEN,
        to: SimulationState.BROKEN,
        evidenceIds: [],
        causesToAdd: [{ id: 'cause_B', eventType: 'DEPENDENCY_REMOVED', sourceId: 'edge_B' }]
    };
    const result2 = StateTransitionEngine.applyTransitions(currentSnapshot, [transitionB]);
    currentSnapshot = result2.snapshot;
    causes = currentSnapshot.registry.getActiveCauses('NODE', 'node_C');
    console.log(`Node C State: ${currentSnapshot.getNode('node_C')?.state}`);
    console.log(`Active Causes: ${causes.map(c => c.id).join(', ')}`);
    console.log(`Can Recover? ${currentSnapshot.registry.canRecover('NODE', 'node_C')}`);

    // 3. Remove Cause A (Recovery Event for A)
    console.log('\n--- Step 3: Remove Cause A (Recovery) ---');
    const transitionRecA: SimulationTransition = {
        id: 't3',
        ownerId: 'node_C',
        ownerType: 'NODE',
        from: SimulationState.BROKEN,
        to: SimulationState.BROKEN, // Still broken because B is active!
        evidenceIds: [],
        causesToRemove: ['cause_A']
    };
    const result3 = StateTransitionEngine.applyTransitions(currentSnapshot, [transitionRecA]);
    currentSnapshot = result3.snapshot;
    causes = currentSnapshot.registry.getActiveCauses('NODE', 'node_C');
    console.log(`Node C State: ${currentSnapshot.getNode('node_C')?.state}`);
    console.log(`Active Causes: ${causes.map(c => c.id).join(', ')}`);
    console.log(`Can Recover? ${currentSnapshot.registry.canRecover('NODE', 'node_C')} => (Recovery Engine would see this and NOT transition to DIRTY yet)`);

    // 4. Remove Cause B (Recovery Event for B)
    console.log('\n--- Step 4: Remove Cause B (Recovery) ---');
    const transitionRecB: SimulationTransition = {
        id: 't4',
        ownerId: 'node_C',
        ownerType: 'NODE',
        from: SimulationState.BROKEN,
        to: SimulationState.DIRTY, // Now it can go to DIRTY
        evidenceIds: [],
        causesToRemove: ['cause_B']
    };
    const result4 = StateTransitionEngine.applyTransitions(currentSnapshot, [transitionRecB]);
    currentSnapshot = result4.snapshot;
    causes = currentSnapshot.registry.getActiveCauses('NODE', 'node_C');
    console.log(`Node C State: ${currentSnapshot.getNode('node_C')?.state}`);
    console.log(`Active Causes: ${causes.map(c => c.id).join(', ')}`);
    console.log(`Can Recover? ${currentSnapshot.registry.canRecover('NODE', 'node_C')}`);

    console.log(`\nSnapshot Hash (Determinism Check): ${currentSnapshot.registry.getHash()}`);
}

runRegistryTest();
