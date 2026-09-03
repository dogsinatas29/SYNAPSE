import * as fs from 'fs';
import { SimulationSnapshot, SimulationNode } from './src/core/simulation/SimulationSnapshot';
import { SimulationState } from './src/core/simulation/state/SimulationState';
import { SimulationScopeResolver } from './src/core/simulation/SimulationScopeResolver';
import { SimulationProjectionBuilder } from './src/core/simulation/SimulationProjectionBuilder';

async function runIsolationTest() {
    console.log('[Test] Phase 2: Simulation Isolation Layer');
    const statePath = '/home/dogsinatas/다운로드/linux-7.2-rc3/synapse_data/project_state.json.indexed';
    
    // 1. Load mock Production State
    console.log('\n--- 1. Loading Production State ---');
    const rawData = fs.readFileSync(statePath, 'utf8');
    const productionState = JSON.parse(rawData);
    const prodNodesArray = Array.isArray(productionState.nodes) ? productionState.nodes : Object.values(productionState.nodes || {});
    console.log(`Loaded ${prodNodesArray.length} production nodes.`);

    // 2. Measure Projection (Clone) Time
    console.log('\n--- 2. Benchmarking Projection (Clone) Time ---');
    const scope = SimulationScopeResolver.resolve([], 'PROJECT');
    const startClone = performance.now();
    const snapshot = await SimulationProjectionBuilder.build(statePath, scope);
    const endClone = performance.now();
    console.log(`[Benchmark] Projection & Deep Clone Time: ${(endClone - startClone).toFixed(2)} ms`);

    // Pick a test node
    const testNodeId = prodNodesArray[0].id;
    const prodNode = prodNodesArray.find((n: any) => n.id === testNodeId);
    const simNode = snapshot.getNode(testNodeId);

    if (!prodNode || !simNode) {
        throw new Error('Test node not found.');
    }

    // 3. Reference Separation Proof
    console.log('\n--- 3. Reference Separation Proof ---');
    if (prodNode === simNode) {
        console.error('❌ FAIL: simNode and prodNode are the SAME reference!');
    } else {
        console.log('✅ PASS: simNode and prodNode have separate references.');
    }
    
    if (prodNode.data && simNode.data && prodNode.data === simNode.data) {
        console.error('❌ FAIL: Nested `data` object shares the same reference!');
    } else if (prodNode.data) {
        console.log('✅ PASS: Nested `data` object has separate references.');
    }

    // 4. Reverse Mutation Test (Prod -> Sim)
    console.log('\n--- 4. Reverse Mutation Test (Prod -> Sim) ---');
    const originalType = prodNode.type;
    prodNode.type = 'MUTATED_PRODUCTION';
    if (simNode.type === 'MUTATED_PRODUCTION') {
        console.error('❌ FAIL: Mutating Production affected Simulation!');
    } else {
        console.log('✅ PASS: Mutating Production did NOT affect Simulation.');
    }
    prodNode.type = originalType; // revert

    // 5. Forward Mutation Test (Sim -> Prod)
    console.log('\n--- 5. Forward Mutation Test (Sim -> Prod) ---');
    // Using `any` to bypass TypeScript Readonly just to test runtime isolation
    try {
        (simNode as any).state = SimulationState.BROKEN;
        console.error('❌ FAIL: simNode was mutable! Seal/Freeze failed.');
    } catch (e: any) {
        if (e instanceof TypeError) {
            console.log('✅ PASS: Mutating Simulation node threw TypeError (Immutable/Sealed).');
        } else {
            throw e;
        }
    }
    // Note: Revert is not needed because the assignment failed (TypeError).

    // 6. Benchmark Deep Freeze
    console.log('\n--- 6. Benchmarking Deep Freeze ---');
    const startFreeze = performance.now();
    
    // Attempting a manual deep freeze on the snapshot
    Object.freeze(snapshot.nodes);
    Object.freeze(snapshot.edges);
    Object.freeze(snapshot.clusters);
    
    for (const n of snapshot.nodes) {
        Object.freeze(n);
        if (n.data) Object.freeze(n.data);
    }
    for (const e of snapshot.edges) Object.freeze(e);
    for (const c of snapshot.clusters) Object.freeze(c);
    
    const endFreeze = performance.now();
    console.log(`[Benchmark] Deep Freeze Time (${snapshot.nodes.length} nodes): ${(endFreeze - startFreeze).toFixed(2)} ms`);
    
    // Check if it's really frozen
    try {
        (simNode as any).state = SimulationState.DIRTY;
        console.log('⚠️ Freeze was applied but mutation succeeded (Strict mode disabled?)');
    } catch (e) {
        console.log('✅ PASS: Mutation threw an error after Deep Freeze.');
    }

    console.log('\n[Test] Phase 2 Validation Complete.');
}

runIsolationTest();
