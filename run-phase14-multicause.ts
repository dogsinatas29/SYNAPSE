import { SimulationSnapshot, SimulationNode, SimulationEdge } from './src/core/simulation/SimulationSnapshot';
import { SimulationState } from './src/core/simulation/state/SimulationState';
import { StateTransitionEngine } from './src/core/simulation/state/StateTransitionEngine';
import { SimulationRuleEngine } from './src/core/simulation/propagation/SimulationRuleEngine';
import { DependencyRemovedRealRule } from './src/core/simulation/propagation/rules/DependencyRemovedRealRule';
import { RecoveryRuleEngine } from './src/core/simulation/propagation/recovery/RecoveryRuleEngine';
import { DependencyRestoredRealRule } from './src/core/simulation/propagation/recovery/rules/DependencyRestoredRealRule';
import { ValidationRuleEngine } from './src/core/simulation/propagation/validation/ValidationRuleEngine';
import { ValidationPassedRealRule } from './src/core/simulation/propagation/validation/rules/ValidationPassedRealRule';
import { SimulationScenarioType } from './src/core/simulation/scenario/SimulationScenarioType';
import { RecoveryEventType } from './src/core/simulation/scenario/RecoveryEventType';
import { ValidationEventType } from './src/core/simulation/scenario/ValidationEventType';
import { FailureCauseRegistry } from './src/core/simulation/state/FailureCauseRegistry';

function printState(step: string, snapshot: SimulationSnapshot, targetNode: string) {
    console.log(`\n=== ${step} ===`);
    const node = snapshot.getNode(targetNode);
    console.log(`Node ${targetNode}: ${node?.state}`);
    const causes = snapshot.registry.getActiveCauses('NODE', targetNode);
    console.log(`Registry: [${causes.map(c => c.sourceId).join(', ')}]`);
}

function runPhase14() {
    // We create a minimal graph: Edge A -> Node C, Edge B -> Node C
    const nodes: SimulationNode[] = [
        { id: 'NodeC', type: 'NODE', cluster_id: 'root', state: SimulationState.NORMAL }
    ];
    const edges: SimulationEdge[] = [
        { id: 'EdgeA', from: 'NodeC', to: 'NodeA', type: 'DEPENDS_ON', weight: 1, state: SimulationState.NORMAL },
        { id: 'EdgeB', from: 'NodeC', to: 'NodeB', type: 'DEPENDS_ON', weight: 1, state: SimulationState.NORMAL }
    ];

    const snapshot = new SimulationSnapshot(nodes, edges, [], [], new FailureCauseRegistry());
    const engine = new StateTransitionEngine();
    
    const failRuleEngine = new SimulationRuleEngine();
    failRuleEngine.registerRule(new DependencyRemovedRealRule(3)); // Max depth 3

    const recRuleEngine = new RecoveryRuleEngine();
    recRuleEngine.registerRule(new DependencyRestoredRealRule());

    const valRuleEngine = new ValidationRuleEngine();
    valRuleEngine.registerRule(new ValidationPassedRealRule());

    let currentSnapshot = snapshot.clone();

    // Step 1: Fail Edge A
    const failA = failRuleEngine.propagate(currentSnapshot, {
        id: 'fail_A',
        type: SimulationScenarioType.DEPENDENCY_REMOVED,
        targetId: 'EdgeA',
        evidenceIds: ['ev_fail_a']
    });
    currentSnapshot = StateTransitionEngine.applyTransitions(currentSnapshot, failA.transitions).snapshot;
    printState("Step 1: Edge A 제거", currentSnapshot, "NodeC");

    // Step 1.5: Duplicate Cause Suppression (Fail Edge A again)
    const failADup = failRuleEngine.propagate(currentSnapshot, {
        id: 'fail_A_dup',
        type: SimulationScenarioType.DEPENDENCY_REMOVED,
        targetId: 'EdgeA',
        evidenceIds: ['ev_fail_a_dup']
    });
    currentSnapshot = StateTransitionEngine.applyTransitions(currentSnapshot, failADup.transitions).snapshot;
    printState("Step 1.5: Edge A 제거 (Duplicate)", currentSnapshot, "NodeC");


    // Step 2: Fail Edge B
    const failB = failRuleEngine.propagate(currentSnapshot, {
        id: 'fail_B',
        type: SimulationScenarioType.DEPENDENCY_REMOVED,
        targetId: 'EdgeB',
        evidenceIds: ['ev_fail_b']
    });
    currentSnapshot = StateTransitionEngine.applyTransitions(currentSnapshot, failB.transitions).snapshot;
    printState("Step 2: Edge B 제거", currentSnapshot, "NodeC");

    // Step 3: Restore Edge A
    const recA = recRuleEngine.evaluate({
        id: 'rec_A',
        type: RecoveryEventType.DEPENDENCY_RESTORED,
        targetId: 'EdgeA',
        evidenceIds: ['ev_rec_a']
    }, currentSnapshot);
    currentSnapshot = StateTransitionEngine.applyTransitions(currentSnapshot, recA).snapshot;
    printState("Step 3: Edge A 복구", currentSnapshot, "NodeC");

    // Step 4: Restore Edge B
    const recB = recRuleEngine.evaluate({
        id: 'rec_B',
        type: RecoveryEventType.DEPENDENCY_RESTORED,
        targetId: 'EdgeB',
        evidenceIds: ['ev_rec_b']
    }, currentSnapshot);
    currentSnapshot = StateTransitionEngine.applyTransitions(currentSnapshot, recB).snapshot;
    printState("Step 4: Edge B 복구", currentSnapshot, "NodeC");

    // Step 5: Validation Passed
    const valC = valRuleEngine.evaluate({
        id: 'val_C',
        type: ValidationEventType.VALIDATION_PASSED,
        targetId: 'NodeC',
        targetType: 'NODE',
        evidenceIds: ['ev_val_c']
    }, currentSnapshot);
    currentSnapshot = StateTransitionEngine.applyTransitions(currentSnapshot, valC).snapshot;
    printState("Step 5: Validation", currentSnapshot, "NodeC");
}

runPhase14();
