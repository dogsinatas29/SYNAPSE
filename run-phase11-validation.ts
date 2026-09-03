import { SimulationSnapshot, SimulationNode } from './src/core/simulation/SimulationSnapshot';
import { SimulationState } from './src/core/simulation/state/SimulationState';
import { StateTransitionEngine } from './src/core/simulation/state/StateTransitionEngine';
import { ValidationRuleEngine } from './src/core/simulation/propagation/validation/ValidationRuleEngine';
import { ValidationPassedRealRule } from './src/core/simulation/propagation/validation/rules/ValidationPassedRealRule';
import { ValidationScenario } from './src/core/simulation/scenario/ValidationScenario';
import { ValidationEventType } from './src/core/simulation/scenario/ValidationEventType';

function runValidationEngineTest() {
    console.log('🚀 Phase 11: Validation Engine Verification\n');

    const nodeA: SimulationNode = { id: 'node_A', type: 'source', cluster_id: 'c1', state: SimulationState.NORMAL };
    const nodeB: SimulationNode = { id: 'node_B', type: 'source', cluster_id: 'c1', state: SimulationState.BROKEN };
    const nodeC: SimulationNode = { id: 'node_C', type: 'source', cluster_id: 'c1', state: SimulationState.DIRTY };

    let snapshot = new SimulationSnapshot([nodeA, nodeB, nodeC], [], [], []);
    
    const engine = new ValidationRuleEngine();
    engine.registerRule(new ValidationPassedRealRule());

    console.log('--- Initial States ---');
    console.log(`Node A: ${snapshot.getNode('node_A')?.state}`);
    console.log(`Node B: ${snapshot.getNode('node_B')?.state}`);
    console.log(`Node C: ${snapshot.getNode('node_C')?.state}`);

    // Case A: NORMAL + VALIDATION_PASSED
    console.log('\n--- Case A: Validate NORMAL Node ---');
    const scenarioA: ValidationScenario = { id: 'v_A', type: ValidationEventType.VALIDATION_PASSED, targetId: 'node_A', targetType: 'NODE', causedByScenarioId: 'rec_1', evidenceIds: [] };
    const transA = engine.evaluate(scenarioA, snapshot);
    console.log(`Generated Transitions: ${transA.length}`);
    snapshot = StateTransitionEngine.applyTransitions(snapshot, transA).snapshot;
    console.log(`Node A State: ${snapshot.getNode('node_A')?.state}`);

    // Case B: BROKEN + VALIDATION_PASSED
    console.log('\n--- Case B: Validate BROKEN Node ---');
    const scenarioB: ValidationScenario = { id: 'v_B', type: ValidationEventType.VALIDATION_PASSED, targetId: 'node_B', targetType: 'NODE', causedByScenarioId: 'rec_2', evidenceIds: [] };
    const transB = engine.evaluate(scenarioB, snapshot);
    console.log(`Generated Transitions: ${transB.length}`);
    snapshot = StateTransitionEngine.applyTransitions(snapshot, transB).snapshot;
    console.log(`Node B State: ${snapshot.getNode('node_B')?.state}`);

    // Case C: DIRTY + VALIDATION_PASSED
    console.log('\n--- Case C: Validate DIRTY Node ---');
    const scenarioC: ValidationScenario = { id: 'v_C', type: ValidationEventType.VALIDATION_PASSED, targetId: 'node_C', targetType: 'NODE', causedByScenarioId: 'rec_3', evidenceIds: [] };
    const transC = engine.evaluate(scenarioC, snapshot);
    console.log(`Generated Transitions: ${transC.length}`);
    snapshot = StateTransitionEngine.applyTransitions(snapshot, transC).snapshot;
    console.log(`Node C State: ${snapshot.getNode('node_C')?.state}`);
}

runValidationEngineTest();
