import { SimulationSnapshot, SimulationNode, SimulationEdge } from './src/core/simulation/SimulationSnapshot';
import { SimulationScenario } from './src/core/simulation/scenario/SimulationScenario';
import { SimulationState } from './src/core/simulation/state/SimulationState';
import { SimulationRuleEngine } from './src/core/simulation/propagation/SimulationRuleEngine';
import { PropagationRule } from './src/core/simulation/propagation/PropagationRule';
import { PropagationContext } from './src/core/simulation/propagation/PropagationContext';
import { PropagationImpact } from './src/core/simulation/propagation/PropagationImpact';

import { SimulationScenarioType } from './src/core/simulation/scenario/SimulationScenarioType';

// Mock Rule that outputs intersecting impacts to test Priority Merge
class MockDependencyRemovedRule implements PropagationRule {
    public readonly targetScenarioType = SimulationScenarioType.DEPENDENCY_REMOVED;
    public readonly maxDepth = 2;

    evaluate(scenario: SimulationScenario, snapshot: SimulationSnapshot, context: PropagationContext): PropagationImpact[] {
        // Just simulate a hardcoded traversal for deterministic test
        context.visitedNodes.add('node_target');
        
        return [
            { ownerId: 'n1', ownerType: 'NODE', targetState: SimulationState.DIRTY }, // Dirty hit
            { ownerId: 'n1', ownerType: 'NODE', targetState: SimulationState.BROKEN }, // Broken hit (should override Dirty)
            { ownerId: 'n2', ownerType: 'NODE', targetState: SimulationState.DIRTY }, // Existing is Dirty, should be saturated (filtered out)
            { ownerId: 'e1', ownerType: 'EDGE', targetState: SimulationState.BROKEN } // Edge broken
        ];
    }
}

function runPhase8Test() {
    console.log('[Test] Phase 8: Rule / Propagation Engine');

    const node1: SimulationNode = { id: 'n1', type: 'source', cluster_id: 'root', state: SimulationState.NORMAL };
    const node2: SimulationNode = { id: 'n2', type: 'source', cluster_id: 'root', state: SimulationState.DIRTY };
    const edge1: SimulationEdge = { id: 'e1', from: 'n1', to: 'n2', type: 'INCLUDE', weight: 1, state: SimulationState.NORMAL };
    
    const baseSnapshot = new SimulationSnapshot([node1, node2], [edge1], [], []).seal();

    const scenario: SimulationScenario = {
        id: 'scen_test',
        type: SimulationScenarioType.DEPENDENCY_REMOVED,
        targetId: 'e1',
        evidenceIds: ['ev_root']
    };

    const engine = new SimulationRuleEngine();
    engine.registerRule(new MockDependencyRemovedRule());

    console.log('\n--- 1. Testing Rule Resolution & State Saturation ---');
    const transitions = engine.propagate(baseSnapshot, scenario);

    let n1Broken = false;
    let n1Dirty = false;
    let n2Trans = false;
    let e1Trans = false;

    for (const t of transitions) {
        if (t.ownerId === 'n1' && t.to === SimulationState.BROKEN) n1Broken = true;
        if (t.ownerId === 'n1' && t.to === SimulationState.DIRTY) n1Dirty = true;
        if (t.ownerId === 'n2') n2Trans = true;
        if (t.ownerId === 'e1' && t.to === SimulationState.BROKEN) e1Trans = true;
        
        // Check Evidence copy rule
        if (t.evidenceIds.length !== 1 || t.evidenceIds[0] !== 'ev_root') {
            throw new Error(`Evidence generation rule violated on transition: ${t.id}`);
        }
    }

    if (n1Broken && !n1Dirty) {
        console.log('✅ PASS: Priority Merge (DIRTY + BROKEN -> BROKEN) applied successfully.');
    } else {
        console.error('❌ FAIL: Priority Merge failed.', transitions);
    }

    if (!n2Trans) {
        console.log('✅ PASS: State Saturation (target is DIRTY, rule says DIRTY -> no transition) applied successfully.');
    } else {
        console.error('❌ FAIL: State Saturation failed. n2 generated transition.');
    }

    if (e1Trans) {
        console.log('✅ PASS: Edge transition successfully mapped.');
    } else {
        console.error('❌ FAIL: Edge transition mapping failed.');
    }

    console.log('\n--- 2. Testing 3-Way Hash Determinism ---');
    
    const snapshotHash = SimulationRuleEngine.computeHash(baseSnapshot.nodes) + SimulationRuleEngine.computeHash(baseSnapshot.edges);
    const scenarioHash = SimulationRuleEngine.computeHash(scenario);
    let lastTransHash = '';

    let determinismPassed = true;
    for (let i = 0; i < 100; i++) {
        const trans = engine.propagate(baseSnapshot, scenario);
        
        // We only hash the content of the transitions minus the generated ID which includes increment index
        const transContent = trans.map(t => ({ ownerId: t.ownerId, ownerType: t.ownerType, from: t.from, to: t.to }));
        const transHash = SimulationRuleEngine.computeHash(transContent);
        
        if (i === 0) {
            lastTransHash = transHash;
        } else {
            if (transHash !== lastTransHash) {
                determinismPassed = false;
                console.error(`❌ FAIL: Hash mismatch at iteration ${i}. Determinism broken.`);
                break;
            }
        }
    }

    if (determinismPassed) {
        console.log(`✅ PASS: F(SnapshotHash, ScenarioHash) = TransitionArrayHash is 100% deterministic over 100 iterations.`);
        console.log(`Snapshot Hash Fragment: ${snapshotHash.substring(0, 8)}...`);
        console.log(`Scenario Hash Fragment: ${scenarioHash.substring(0, 8)}...`);
        console.log(`Transitions Hash: ${lastTransHash}`);
    }

    console.log('\n[Test] Phase 8 Validation Complete.');
}

runPhase8Test();
