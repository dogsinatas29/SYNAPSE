import { SimulationSnapshot, SimulationNode, SimulationEdge } from './src/core/simulation/SimulationSnapshot';
import { SimulationState } from './src/core/simulation/state/SimulationState';
import { SimulationTransition } from './src/core/simulation/state/SimulationTransition';
import { StateTransitionEngine } from './src/core/simulation/state/StateTransitionEngine';

function runTransitionEngineTest() {
    console.log('[Test] Phase 7: State Transition Execution Engine');

    // Setup base snapshot
    const node1: SimulationNode = { id: 'n1', type: 'source', cluster_id: 'root', state: SimulationState.NORMAL };
    const node2: SimulationNode = { id: 'n2', type: 'source', cluster_id: 'root', state: SimulationState.DIRTY };
    const edge1: SimulationEdge = { id: 'e1', from: 'n1', to: 'n2', type: 'INCLUDE', weight: 1, state: SimulationState.NORMAL };
    
    const baseSnapshot = new SimulationSnapshot([node1, node2], [edge1], [], []).seal();

    // 1. 단일 Node 전이 (Single Node Transition)
    console.log('\n--- 1. Single Node Transition ---');
    const t1: SimulationTransition = {
        id: 't_1',
        ownerId: 'n1',
        ownerType: 'NODE',
        from: SimulationState.NORMAL,
        to: SimulationState.DIRTY,
        evidenceIds: ['ev_1']
    };
    
    const result1 = StateTransitionEngine.applyTransitions(baseSnapshot, [t1]);
    if (result1.appliedCount === 1 && result1.snapshot.getNode('n1')?.state === SimulationState.DIRTY) {
        console.log('✅ PASS: Node transitioned from NORMAL to DIRTY.');
    } else {
        console.error('❌ FAIL: Node transition failed.');
    }

    // 2. 단일 Edge 전이 (Single Edge Transition)
    console.log('\n--- 2. Single Edge Transition ---');
    const t2: SimulationTransition = {
        id: 't_2',
        ownerId: 'e1',
        ownerType: 'EDGE',
        from: SimulationState.NORMAL,
        to: SimulationState.BROKEN,
        evidenceIds: ['ev_2']
    };
    const result2 = StateTransitionEngine.applyTransitions(baseSnapshot, [t2]);
    if (result2.appliedCount === 1 && result2.snapshot.getEdge('e1')?.state === SimulationState.BROKEN) {
        console.log('✅ PASS: Edge transitioned from NORMAL to BROKEN.');
    } else {
        console.error('❌ FAIL: Edge transition failed.');
    }

    // 3. Matrix 위반 (Matrix Violation)
    console.log('\n--- 3. Matrix Violation & Rollback ---');
    const tMatrixViolator: SimulationTransition = {
        id: 't_3',
        ownerId: 'n2',
        ownerType: 'NODE',
        from: SimulationState.DIRTY,
        to: SimulationState.NORMAL, // DIRTY -> NORMAL is blocked
        evidenceIds: ['ev_3']
    };
    try {
        StateTransitionEngine.applyTransitions(baseSnapshot, [t1, tMatrixViolator]);
        console.error('❌ FAIL: Matrix violation was allowed!');
    } catch (e: any) {
        console.log(`✅ PASS: Matrix violation correctly threw error. Error: "${e.message}"`);
    }

    // 4. Batch 충돌 (Batch Conflict - Duplicate From)
    console.log('\n--- 4. Batch Conflict Validation ---');
    const tConflict1: SimulationTransition = { id: 'tc1', ownerId: 'n1', ownerType: 'NODE', from: SimulationState.NORMAL, to: SimulationState.DIRTY, evidenceIds: [] };
    const tConflict2: SimulationTransition = { id: 'tc2', ownerId: 'n1', ownerType: 'NODE', from: SimulationState.NORMAL, to: SimulationState.BROKEN, evidenceIds: [] };
    
    try {
        StateTransitionEngine.applyTransitions(baseSnapshot, [tConflict1, tConflict2]);
        console.error('❌ FAIL: Batch conflict was allowed!');
    } catch (e: any) {
        console.log(`✅ PASS: Batch conflict correctly rejected. Error: "${e.message}"`);
    }

    // 5. Chain Consistency (Valid Chain)
    console.log('\n--- 5. Chain Consistency Validation ---');
    const tChain1: SimulationTransition = { id: 'tc3', ownerId: 'n1', ownerType: 'NODE', from: SimulationState.NORMAL, to: SimulationState.DIRTY, evidenceIds: [] };
    const tChain2: SimulationTransition = { id: 'tc4', ownerId: 'n1', ownerType: 'NODE', from: SimulationState.DIRTY, to: SimulationState.BROKEN, evidenceIds: [] };
    
    const resultChain = StateTransitionEngine.applyTransitions(baseSnapshot, [tChain2, tChain1]); // Input in reverse order to test chain resolution
    if (resultChain.appliedCount === 2 && resultChain.snapshot.getNode('n1')?.state === SimulationState.BROKEN) {
        console.log('✅ PASS: Chain consistency correctly applied (NORMAL -> DIRTY -> BROKEN).');
    } else {
        console.error('❌ FAIL: Chain consistency failed.');
    }

    // 6. 원본 Snapshot 불변성 & 전체 Transaction Rollback
    console.log('\n--- 6. Snapshot Immutability & Transaction Rollback ---');
    const tValid: SimulationTransition = { id: 't_v1', ownerId: 'n1', ownerType: 'NODE', from: SimulationState.NORMAL, to: SimulationState.DIRTY, evidenceIds: [] };
    const tInvalidState: SimulationTransition = { id: 't_inv', ownerId: 'n2', ownerType: 'NODE', from: SimulationState.NORMAL, to: SimulationState.BROKEN, evidenceIds: [] }; // n2 is actually DIRTY, not NORMAL
    
    try {
        StateTransitionEngine.applyTransitions(baseSnapshot, [tValid, tInvalidState]);
        console.error('❌ FAIL: Invalid state transition was allowed!');
    } catch (e: any) {
        console.log(`✅ PASS: State mismatch rejected. Error: "${e.message}"`);
        // Check if n1 was modified in base snapshot
        if (baseSnapshot.getNode('n1')?.state === SimulationState.NORMAL) {
            console.log('✅ PASS: Original snapshot remained untouched (Transaction Rollback).');
        } else {
            console.error('❌ FAIL: Original snapshot was mutated!');
        }
    }

    console.log('\n[Test] Phase 7 Validation Complete.');
}

runTransitionEngineTest();
