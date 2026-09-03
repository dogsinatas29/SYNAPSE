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
import * as crypto from 'crypto';

function hashObj(obj: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex').substring(0, 8);
}

function printState(step: string, snapshot: SimulationSnapshot, targetNode: string) {
    console.log(`\n=== ${step} ===`);
    const node = snapshot.getNode(targetNode);
    const causes = snapshot.registry.getActiveCauses('NODE', targetNode);
    const snapHash = hashObj({
        nodeState: node?.state,
        causes: causes
    });
    console.log(`Node ${targetNode}: ${node?.state} | Registry Count: ${causes.length} [${causes.map(c => c.sourceId).join(', ')}] | Hash: ${snapHash}`);
}

function runPhase15Stress() {
    const nodes: SimulationNode[] = [
        { id: 'NodeX', type: 'NODE', cluster_id: 'root', state: SimulationState.NORMAL }
    ];
    
    // NodeX depends on 5 edges
    const edges: SimulationEdge[] = [
        { id: 'EdgeA', from: 'NodeX', to: 'NodeA', type: 'DEPENDS_ON', weight: 1, state: SimulationState.NORMAL },
        { id: 'EdgeB', from: 'NodeX', to: 'NodeB', type: 'DEPENDS_ON', weight: 1, state: SimulationState.NORMAL },
        { id: 'EdgeC', from: 'NodeX', to: 'NodeC', type: 'DEPENDS_ON', weight: 1, state: SimulationState.NORMAL },
        { id: 'EdgeD', from: 'NodeX', to: 'NodeD', type: 'DEPENDS_ON', weight: 1, state: SimulationState.NORMAL },
        { id: 'EdgeE', from: 'NodeX', to: 'NodeE', type: 'DEPENDS_ON', weight: 1, state: SimulationState.NORMAL }
    ];

    let snapshot = new SimulationSnapshot(nodes, edges, [], [], new FailureCauseRegistry());
    const failRuleEngine = new SimulationRuleEngine();
    failRuleEngine.registerRule(new DependencyRemovedRealRule(3));
    const recRuleEngine = new RecoveryRuleEngine();
    recRuleEngine.registerRule(new DependencyRestoredRealRule());
    const valRuleEngine = new ValidationRuleEngine();
    valRuleEngine.registerRule(new ValidationPassedRealRule());

    const edgesList = ['EdgeA', 'EdgeB', 'EdgeC', 'EdgeD', 'EdgeE'];

    printState("Initial State", snapshot, "NodeX");

    // Fail all 5 edges sequentially
    for (const edgeId of edgesList) {
        const fail = failRuleEngine.propagate(snapshot, {
            id: `fail_${edgeId}`,
            type: SimulationScenarioType.DEPENDENCY_REMOVED,
            targetId: edgeId,
            evidenceIds: [`ev_fail_${edgeId}`]
        });
        snapshot = StateTransitionEngine.applyTransitions(snapshot, fail.transitions).snapshot;
        printState(`Fail ${edgeId}`, snapshot, "NodeX");
    }

    // Recover first 4 edges sequentially
    for (let i = 0; i < 4; i++) {
        const edgeId = edgesList[i];
        const rec = recRuleEngine.evaluate({
            id: `rec_${edgeId}`,
            type: RecoveryEventType.DEPENDENCY_RESTORED,
            targetId: edgeId,
            evidenceIds: [`ev_rec_${edgeId}`]
        }, snapshot);
        snapshot = StateTransitionEngine.applyTransitions(snapshot, rec).snapshot;
        printState(`Recover ${edgeId}`, snapshot, "NodeX");
    }

    // Recover 5th edge
    const recE = recRuleEngine.evaluate({
        id: `rec_EdgeE`,
        type: RecoveryEventType.DEPENDENCY_RESTORED,
        targetId: 'EdgeE',
        evidenceIds: [`ev_rec_EdgeE`]
    }, snapshot);
    snapshot = StateTransitionEngine.applyTransitions(snapshot, recE).snapshot;
    printState(`Recover EdgeE (Final)`, snapshot, "NodeX");

    // Validation
    const val = valRuleEngine.evaluate({
        id: `val_NodeX`,
        type: ValidationEventType.VALIDATION_PASSED,
        targetId: 'NodeX',
        targetType: 'NODE',
        evidenceIds: [`ev_val_NodeX`]
    }, snapshot);
    snapshot = StateTransitionEngine.applyTransitions(snapshot, val).snapshot;
    printState(`Validate NodeX`, snapshot, "NodeX");
}

runPhase15Stress();
