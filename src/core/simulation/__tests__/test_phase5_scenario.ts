import { SimulationProjectionBuilder } from './src/core/simulation/SimulationProjectionBuilder';
import { SimulationScopeResolver } from './src/core/simulation/SimulationScopeResolver';
import { SimulationScenarioType } from './src/core/simulation/scenario/SimulationScenarioType';
import { SimulationScenarioRegistry } from './src/core/simulation/scenario/SimulationScenarioRegistry';
import { SimulationScenario } from './src/core/simulation/scenario/SimulationScenario';
import * as fs from 'fs';

async function runScenarioTest() {
    console.log('[Test] Phase 5: Scenario Engine (Definition & Registration)');

    // 1. Real Snapshot setup
    const statePath = '/home/dogsinatas/다운로드/linux-7.2-rc3/synapse_data/project_state.json.indexed';
    const scope = SimulationScopeResolver.resolve([], 'PROJECT');
    
    console.log('\n--- 1. Loading Real Production State (110k+ nodes) ---');
    const snapshot = await SimulationProjectionBuilder.build(statePath, scope);

    const registry = new SimulationScenarioRegistry();

    // 2. Test Valid Registration & Count Tracking
    console.log('\n--- 2. Valid Scenario Registration & Tracking ---');
    const targetNodeId = snapshot.nodes[0].id; // Ensure we use an existing node ID
    
    console.log(`Before Registration Count: ${registry.getRegisteredScenarios().length}`);
    // We must use a valid scenario under Phase 6 policies. BOUNDARY_SPLIT requires a boundary with >= 2 members.
    // Let's create a synthetic boundary on the snapshot since the real one has no boundaries.
    const validBoundaryId = 'b_test_5';
    (snapshot as any).boundaries = [{ id: validBoundaryId, type: 'logical', members: ['node_1', 'node_2'] }];
    // We also need to add it to the map so getBoundary works
    (snapshot as any)._boundaryMap.set(validBoundaryId, (snapshot as any).boundaries[0]);

    const validScenario: SimulationScenario = {
        id: 'scen_1',
        type: SimulationScenarioType.BOUNDARY_SPLIT,
        targetId: validBoundaryId,
        metadata: { impactFactor: 'HIGH' }
    };
    registry.register(snapshot, validScenario);
    console.log(`After Registration Count: ${registry.getRegisteredScenarios().length}`);
    console.log('✅ PASS: Valid scenario successfully registered.');
    
    // 3. Test Duplicate Registration (Denial)
    console.log('\n--- 3. Duplicate Registration Test ---');
    try {
        registry.register(snapshot, validScenario);
        console.error('❌ FAIL: Duplicate registration should have been blocked.');
    } catch (e: any) {
        console.log(`✅ PASS: Duplicate registration properly rejected. Error: "${e.message}"`);
    }

    // 4. Deep Immutable Payload Test
    console.log('\n--- 4. Deep Immutable Payload Test ---');
    const registeredScen = registry.getRegisteredScenarios()[0];
    try {
        (registeredScen as any).metadata.impactFactor = 'LOW';
        console.error('❌ FAIL: Scenario payload was mutable! Deep Freeze failed.');
    } catch (e: any) {
        console.log('✅ PASS: Deep mutation correctly threw an error. Deep Freeze is active.');
    }

    // 5. Invalid Target Validation Test
    console.log('\n--- 5. Invalid Target Validation Test ---');
    const invalidTargetScenario: SimulationScenario = {
        id: 'scen_2',
        type: SimulationScenarioType.DEPENDENCY_REMOVED,
        targetId: 'non_existent_edge_xyz999'
    };
    try {
        registry.register(snapshot, invalidTargetScenario);
        console.error('❌ FAIL: Invalid node target should have been blocked.');
    } catch (e: any) {
        if (e.message.includes('does not exist')) {
            console.log(`✅ PASS: Invalid target properly rejected. Error: "${e.message}"`);
        } else {
            console.error(`❌ FAIL: Wrong error message for invalid target. Got: ${e.message}`);
        }
    }

    const invalidBoundaryTargetScenario: SimulationScenario = {
        id: 'scen_3',
        type: SimulationScenarioType.BOUNDARY_SPLIT,
        targetId: '____and_this_is_not_a_boundary'
    };
    try {
        registry.register(snapshot, invalidBoundaryTargetScenario);
        console.error('❌ FAIL: Invalid boundary target should have been blocked.');
    } catch (e: any) {
        if (e.message.includes('does not exist')) {
            console.log(`✅ PASS: Invalid boundary target properly rejected. Error: "${e.message}"`);
        } else {
            console.error(`❌ FAIL: Wrong error message for invalid boundary target. Got: ${e.message}`);
        }
    }

    // 6. Strict Structural Verification (No Execution API)
    console.log('\n--- 6. Strict Structural Verification (No Execution) ---');
    const registryProto = Object.getOwnPropertyNames(SimulationScenarioRegistry.prototype);
    const hasExecutionApi = registryProto.some(name => 
        name.includes('execute') || 
        name.includes('propagate') || 
        name.includes('apply') || 
        name.includes('run') ||
        name.includes('blast')
    );

    if (hasExecutionApi) {
        console.error('❌ FAIL: ScenarioRegistry contains execution/propagation logic!');
    } else {
        console.log('✅ PASS: ScenarioRegistry only registers scenarios. No execution/propagation APIs found.');
    }

    console.log('\n[Test] Phase 5 Validation Complete.');
}

runScenarioTest();
