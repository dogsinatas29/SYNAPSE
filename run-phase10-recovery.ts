import { SimulationSnapshot, SimulationNode, SimulationEdge } from './src/core/simulation/SimulationSnapshot';
import { SimulationState } from './src/core/simulation/state/SimulationState';
import { StateTransitionEngine } from './src/core/simulation/state/StateTransitionEngine';
import { SimulationTransition } from './src/core/simulation/state/SimulationTransition';
import { RecoveryRuleEngine } from './src/core/simulation/propagation/recovery/RecoveryRuleEngine';
import { DependencyRestoredRealRule } from './src/core/simulation/propagation/recovery/rules/DependencyRestoredRealRule';
import { RecoveryScenario } from './src/core/simulation/scenario/RecoveryScenario';
import { RecoveryEventType } from './src/core/simulation/scenario/RecoveryEventType';
import { RecoveryTraceGraph } from './src/core/simulation/propagation/recovery/RecoveryTraceGraph';

function runRecoveryEngineTest() {
    console.log('🚀 Phase 10: Recovery Rule Engine Verification\n');

    // Graph Setup: A -> C and B -> C
    // If Edge A and Edge B are both REMOVED, C gets broken twice.
    const nodeC: SimulationNode = { id: 'node_C', type: 'source', cluster_id: 'c1', state: SimulationState.NORMAL };
    const edgeA: SimulationEdge = { id: 'edge_A', from: 'node_A', to: 'node_C', type: 'INCLUDE', weight: 1, state: SimulationState.NORMAL };
    const edgeB: SimulationEdge = { id: 'edge_B', from: 'node_B', to: 'node_C', type: 'INCLUDE', weight: 1, state: SimulationState.NORMAL };

    let snapshot = new SimulationSnapshot([nodeC], [edgeA, edgeB], [], []);

    // Simulate Failure: Edge A and Edge B are both REMOVED, making C BROKEN with two causes.
    const failureTransitions: SimulationTransition[] = [
        { id: 'f1', ownerId: 'edge_A', ownerType: 'EDGE', from: SimulationState.NORMAL, to: SimulationState.BROKEN, evidenceIds: [], causesToAdd: [{ id: 'c_A', eventType: 'DEPENDENCY_REMOVED', sourceId: 'edge_A' }] },
        { id: 'f2', ownerId: 'edge_B', ownerType: 'EDGE', from: SimulationState.NORMAL, to: SimulationState.BROKEN, evidenceIds: [], causesToAdd: [{ id: 'c_B', eventType: 'DEPENDENCY_REMOVED', sourceId: 'edge_B' }] },
        { id: 'f3', ownerId: 'node_C', ownerType: 'NODE', from: SimulationState.NORMAL, to: SimulationState.BROKEN, evidenceIds: [], causesToAdd: [
            { id: 'c_C_A', eventType: 'DEPENDENCY_REMOVED', sourceId: 'edge_A' },
            { id: 'c_C_B', eventType: 'DEPENDENCY_REMOVED', sourceId: 'edge_B' }
        ] }
    ];
    snapshot = StateTransitionEngine.applyTransitions(snapshot, failureTransitions).snapshot;

    console.log('--- Initial Failure State ---');
    console.log(`Node C State: ${snapshot.getNode('node_C')?.state}`);
    console.log(`Node C Active Causes: ${snapshot.registry.getActiveCauses('NODE', 'node_C').map(c => c.id).join(', ')}`);

    // Setup Engine
    const engine = new RecoveryRuleEngine();
    engine.registerRule(new DependencyRestoredRealRule());

    // Scenario 1: Restore Edge A
    console.log('\n--- Scenario 1: Restore Edge A ---');
    const recScenarioA: RecoveryScenario = { id: 'rec_A', type: RecoveryEventType.DEPENDENCY_RESTORED, targetId: 'edge_A', evidenceIds: ['ev_A'] };
    const transA = engine.evaluate(recScenarioA, snapshot);
    
    // Apply Transitions
    snapshot = StateTransitionEngine.applyTransitions(snapshot, transA).snapshot;

    const traceGraphA = new RecoveryTraceGraph();
    traceGraphA.buildFromTransitions(transA);

    console.log(`Node C State: ${snapshot.getNode('node_C')?.state}`);
    console.log(`Node C Active Causes: ${snapshot.registry.getActiveCauses('NODE', 'node_C').map(c => c.id).join(', ')}`);
    console.log(`Recovery Traces:`, traceGraphA.getTraces());

    // Scenario 2: Restore Edge B
    console.log('\n--- Scenario 2: Restore Edge B ---');
    const recScenarioB: RecoveryScenario = { id: 'rec_B', type: RecoveryEventType.DEPENDENCY_RESTORED, targetId: 'edge_B', evidenceIds: ['ev_B'] };
    const transB = engine.evaluate(recScenarioB, snapshot);
    
    // Apply Transitions
    snapshot = StateTransitionEngine.applyTransitions(snapshot, transB).snapshot;

    const traceGraphB = new RecoveryTraceGraph();
    traceGraphB.buildFromTransitions(transB);

    console.log(`Node C State: ${snapshot.getNode('node_C')?.state}`);
    console.log(`Node C Active Causes: ${snapshot.registry.getActiveCauses('NODE', 'node_C').map(c => c.id).join(', ')}`);
    console.log(`Recovery Traces:`, traceGraphB.getTraces());
}

runRecoveryEngineTest();
