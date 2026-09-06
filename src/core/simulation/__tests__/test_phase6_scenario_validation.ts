import { SimulationProjectionBuilder } from './src/core/simulation/SimulationProjectionBuilder';
import { SimulationScopeResolver } from './src/core/simulation/SimulationScopeResolver';
import { SimulationScenarioType } from './src/core/simulation/scenario/SimulationScenarioType';
import { SimulationScenarioRegistry } from './src/core/simulation/scenario/SimulationScenarioRegistry';
import { SimulationScenario } from './src/core/simulation/scenario/SimulationScenario';
import { SimulationSnapshot, SimulationNode, SimulationBoundary } from './src/core/simulation/SimulationSnapshot';
import { SimulationState } from './src/core/simulation/state/SimulationState';

async function runValidationTest() {
    console.log('[Test] Phase 6: Scenario Validation Layer (Evidence-Based Policies)');

    // 1. Real Snapshot Setup
    const statePath = '/home/dogsinatas/다운로드/linux-7.2-rc3/synapse_data/project_state.json.indexed';
    const scope = SimulationScopeResolver.resolve([], 'PROJECT');
    console.log('\n--- 1. Loading Real Production State ---');
    const snapshot = await SimulationProjectionBuilder.build(statePath, scope);
    const registry = new SimulationScenarioRegistry();

    // 2. Unsupported Policies Test
    console.log('\n--- 2. Unsupported Policies Rejection Test ---');
    const apiScenario: SimulationScenario = { id: 'api_1', type: SimulationScenarioType.API_CHANGED, targetId: 'any_node' };
    const controlScenario: SimulationScenario = { id: 'ctrl_1', type: SimulationScenarioType.CONTROL_NODE_CHANGED, targetId: 'any_node' };

    const tryRegister = (scenario: SimulationScenario, expectMsgStr: string) => {
        try {
            registry.register(snapshot, scenario);
            console.error(`❌ FAIL: Scenario type ${scenario.type} should have been rejected.`);
        } catch (e: any) {
            if (e.message.includes(expectMsgStr)) {
                console.log(`✅ PASS: ${scenario.type} correctly rejected. Reason: ${e.message}`);
            } else {
                console.error(`❌ FAIL: Wrong error message for ${scenario.type}. Got: ${e.message}`);
            }
        }
    };

    tryRegister(apiScenario, '[UNSUPPORTED]');
    tryRegister(controlScenario, '[UNSUPPORTED]');

    // 3. Dependency Removed Policy Test
    console.log('\n--- 3. Dependency Removed Validation Test ---');
    const invalidDepScenario: SimulationScenario = { id: 'dep_1', type: SimulationScenarioType.DEPENDENCY_REMOVED, targetId: 'non_existent_edge' };
    tryRegister(invalidDepScenario, '[INVALID]');

    // Valid dependency
    const validEdgeId = snapshot.edges[0].id;
    const validDepScenario: SimulationScenario = { id: 'dep_2', type: SimulationScenarioType.DEPENDENCY_REMOVED, targetId: validEdgeId };
    registry.register(snapshot, validDepScenario);
    console.log(`✅ PASS: Valid DEPENDENCY_REMOVED scenario registered successfully on edge '${validEdgeId}'.`);

    // 4. Boundary Split Synthetic Test
    console.log('\n--- 4. Synthetic Boundary Validation Test ---');
    const mockNode1: SimulationNode = { id: 'n1', type: 'source', cluster_id: 'root', state: SimulationState.NORMAL };
    const mockNode2: SimulationNode = { id: 'n2', type: 'source', cluster_id: 'root', state: SimulationState.NORMAL };
    
    // Boundary with 1 member
    const boundary1: SimulationBoundary = { id: 'b_1', type: 'logical', members: ['n1'] };
    // Boundary with 2 members
    const boundary2: SimulationBoundary = { id: 'b_2', type: 'logical', members: ['n1', 'n2'] };

    const syntheticSnapshot = new SimulationSnapshot([mockNode1, mockNode2], [], [], [boundary1, boundary2]).seal();
    const syntheticRegistry = new SimulationScenarioRegistry();

    const invalidSplitScenario: SimulationScenario = { id: 'split_1', type: SimulationScenarioType.BOUNDARY_SPLIT, targetId: 'b_1' };
    try {
        syntheticRegistry.register(syntheticSnapshot, invalidSplitScenario);
        console.error('❌ FAIL: Boundary with 1 member allowed to split.');
    } catch (e: any) {
        console.log(`✅ PASS: 1-member Boundary split correctly rejected. Error: ${e.message}`);
    }

    const validSplitScenario: SimulationScenario = { id: 'split_2', type: SimulationScenarioType.BOUNDARY_SPLIT, targetId: 'b_2' };
    syntheticRegistry.register(syntheticSnapshot, validSplitScenario);
    console.log('✅ PASS: 2-member Boundary split successfully registered.');

    console.log('\n[Test] Phase 6 Validation Complete.');
}

runValidationTest().catch(console.error);
