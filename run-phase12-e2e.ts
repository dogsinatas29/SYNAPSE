import { SimulationSnapshot, SimulationNode, SimulationEdge } from './src/core/simulation/SimulationSnapshot';
import { SimulationState } from './src/core/simulation/state/SimulationState';
import { StateTransitionEngine } from './src/core/simulation/state/StateTransitionEngine';
import { SimulationTransition } from './src/core/simulation/state/SimulationTransition';
import { RecoveryRuleEngine } from './src/core/simulation/propagation/recovery/RecoveryRuleEngine';
import { DependencyRestoredRealRule } from './src/core/simulation/propagation/recovery/rules/DependencyRestoredRealRule';
import { ValidationRuleEngine } from './src/core/simulation/propagation/validation/ValidationRuleEngine';
import { ValidationPassedRealRule } from './src/core/simulation/propagation/validation/rules/ValidationPassedRealRule';
import { ValidationScenario } from './src/core/simulation/scenario/ValidationScenario';
import { ValidationEventType } from './src/core/simulation/scenario/ValidationEventType';
import { RecoveryScenario } from './src/core/simulation/scenario/RecoveryScenario';
import { RecoveryEventType } from './src/core/simulation/scenario/RecoveryEventType';
import { RecoveryTraceGraph } from './src/core/simulation/propagation/recovery/RecoveryTraceGraph';
import * as crypto from 'crypto';

function hashObj(obj: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex').substring(0, 8);
}

function runE2E() {
    console.log('🚀 Phase 12: End-to-End Simulation Harness\n');

    // Setup initial graph
    const n1: SimulationNode = { id: 'n1', type: 'source', cluster_id: 'c1', state: SimulationState.NORMAL };
    const n2: SimulationNode = { id: 'n2', type: 'source', cluster_id: 'c1', state: SimulationState.NORMAL };
    const e1: SimulationEdge = { id: 'e1', from: 'n1', to: 'n2', type: 'INCLUDE', weight: 1, state: SimulationState.NORMAL };
    
    let initialSnapshot = new SimulationSnapshot([n1, n2], [e1], [], []);

    const runSingleCycle = () => {
        let snapshot = initialSnapshot.clone();

        // 1. Failure (n1 broken, e1 broken, n2 broken due to e1)
        const failureTransitions: SimulationTransition[] = [
            { id: 'f1', ownerId: 'e1', ownerType: 'EDGE', from: SimulationState.NORMAL, to: SimulationState.BROKEN, evidenceIds: [], causesToAdd: [{ id: 'c1', eventType: 'DEPENDENCY_REMOVED', sourceId: 'e1' }] },
            { id: 'f2', ownerId: 'n2', ownerType: 'NODE', from: SimulationState.NORMAL, to: SimulationState.BROKEN, evidenceIds: [], causesToAdd: [{ id: 'c2', eventType: 'DEPENDENCY_REMOVED', sourceId: 'e1' }] }
        ];
        const failResult = StateTransitionEngine.applyTransitions(snapshot, failureTransitions);
        snapshot = failResult.snapshot;
        const failTransHash = hashObj(failureTransitions);

        // 2. Recovery (e1 restored)
        const recEngine = new RecoveryRuleEngine();
        recEngine.registerRule(new DependencyRestoredRealRule());
        const recScenario: RecoveryScenario = { id: 'rec_1', type: RecoveryEventType.DEPENDENCY_RESTORED, targetId: 'e1', evidenceIds: ['ev_1'] };
        const recTransitions = recEngine.evaluate(recScenario, snapshot);
        
        const recResult = StateTransitionEngine.applyTransitions(snapshot, recTransitions);
        snapshot = recResult.snapshot;
        const recTransHash = hashObj(recTransitions);
        
        const recGraph = new RecoveryTraceGraph();
        recGraph.buildFromTransitions(recTransitions);
        const recTraceHash = hashObj(recGraph.getTraces());

        // 3. Validation (n2 and e1 passed)
        const valEngine = new ValidationRuleEngine();
        valEngine.registerRule(new ValidationPassedRealRule());
        
        const valScenarios: ValidationScenario[] = [
            { id: 'v1', type: ValidationEventType.VALIDATION_PASSED, targetId: 'e1', targetType: 'EDGE', evidenceIds: ['ev_v1'] },
            { id: 'v2', type: ValidationEventType.VALIDATION_PASSED, targetId: 'n2', targetType: 'NODE', evidenceIds: ['ev_v2'] }
        ];
        
        const valTransitions = [...valEngine.evaluate(valScenarios[0], snapshot), ...valEngine.evaluate(valScenarios[1], snapshot)];
        const valResult = StateTransitionEngine.applyTransitions(snapshot, valTransitions);
        snapshot = valResult.snapshot;
        const valTransHash = hashObj(valTransitions);

        // Collect all applied transitions for Invariant 2
        const allTrans = [...failureTransitions, ...recTransitions, ...valTransitions];

        return {
            snapshot,
            allTrans,
            failTransHash,
            recTransHash,
            recTraceHash,
            valTransHash,
            finalSnapshotHash: hashObj(snapshot),
            registryHash: snapshot.registry.getHash()
        };
    };

    // INVARIANT 3: Determinism
    console.log('[Invariant 3] Testing Determinism (100 runs)...');
    const firstRun = runSingleCycle();
    const failHashes = new Set<string>();
    const recHashes = new Set<string>();
    const recTraceHashes = new Set<string>();
    const valHashes = new Set<string>();
    const snapHashes = new Set<string>();
    const regHashes = new Set<string>();

    failHashes.add(firstRun.failTransHash);
    recHashes.add(firstRun.recTransHash);
    recTraceHashes.add(firstRun.recTraceHash);
    valHashes.add(firstRun.valTransHash);
    snapHashes.add(firstRun.finalSnapshotHash);
    regHashes.add(firstRun.registryHash);

    for (let i = 1; i < 100; i++) {
        const run = runSingleCycle();
        failHashes.add(run.failTransHash);
        recHashes.add(run.recTransHash);
        recTraceHashes.add(run.recTraceHash);
        valHashes.add(run.valTransHash);
        snapHashes.add(run.finalSnapshotHash);
        regHashes.add(run.registryHash);
    }

    console.log(`Unique Failure Hash Count: ${failHashes.size}`);
    console.log(`Unique Recovery Hash Count: ${recHashes.size}`);
    console.log(`Unique Recovery Trace Hash Count: ${recTraceHashes.size}`);
    console.log(`Unique Validation Hash Count: ${valHashes.size}`);
    console.log(`Unique Snapshot Hash Count: ${snapHashes.size}`);
    console.log(`Unique Registry Hash Count: ${regHashes.size}`);

    const isDeterministic = failHashes.size === 1 && recHashes.size === 1 && recTraceHashes.size === 1 && 
                            valHashes.size === 1 && snapHashes.size === 1 && regHashes.size === 1;

    console.log(`Determinism Passed: ${isDeterministic ? '✅' : '❌'}`);
    if (!isDeterministic) throw new Error("Determinism Failed!");

    // INVARIANT 2: State Machine Invariant
    console.log('\n[Invariant 2] Testing State Machine Transitions...');
    const illegalTransitions = firstRun.allTrans.filter(t => {
        const path = `${t.from}->${t.to}`;
        const banned = ['BROKEN->NORMAL', 'NORMAL->NORMAL', 'BROKEN->BROKEN', 'DIRTY->DIRTY'];
        return banned.includes(path);
    });
    console.log(`Illegal Transitions Found: ${illegalTransitions.length} ${illegalTransitions.length === 0 ? '✅' : '❌'}`);
    if (illegalTransitions.length > 0) throw new Error("State Machine Invariant Failed!");

    // INVARIANT 1: Registry Invariant
    console.log('\n[Invariant 1] Testing Registry State Match...');
    let registryPassed = true;
    const finalNodes = firstRun.snapshot.nodes;
    const finalEdges = firstRun.snapshot.edges;
    [...finalNodes, ...finalEdges].forEach(item => {
        const causes = firstRun.snapshot.registry.getActiveCauses((item as any).from ? 'EDGE' : 'NODE', item.id);
        if (item.state === SimulationState.BROKEN && causes.length === 0) registryPassed = false;
        if (item.state === SimulationState.DIRTY && causes.length > 0) registryPassed = false;
        if (item.state === SimulationState.NORMAL && causes.length > 0) registryPassed = false;
    });
    console.log(`Registry Invariant Passed: ${registryPassed ? '✅' : '❌'}`);
    if (!registryPassed) throw new Error("Registry Invariant Failed!");

    // INVARIANT 5: Ownership Invariant
    console.log('\n[Invariant 5] Testing Ownership (No Cluster/Boundary states)...');
    let ownershipPassed = true;
    const allOwners = new Set(firstRun.allTrans.map(t => t.ownerType));
    allOwners.forEach(type => {
        if (type !== 'NODE' && type !== 'EDGE') ownershipPassed = false;
    });
    console.log(`Ownership Invariant Passed: ${ownershipPassed ? '✅' : '❌'}`);
    if (!ownershipPassed) throw new Error("Ownership Invariant Failed!");

    // INVARIANT 4: Transaction Invariant
    console.log('\n[Invariant 4] Testing Transaction Rollback...');
    const snapshotBeforeError = initialSnapshot.clone();
    const beforeHash = hashObj(snapshotBeforeError);
    const beforeRegHash = snapshotBeforeError.registry.getHash();
    
    // Inject fake transitions where the 2nd one throws an error (e.g. invalid state matrix transition)
    const errorTransitions: SimulationTransition[] = [
        { id: 't1', ownerId: 'n1', ownerType: 'NODE', from: SimulationState.NORMAL, to: SimulationState.DIRTY, evidenceIds: [], causesToAdd: [{ id: 'cx', eventType: 'TEST', sourceId: 'src' }] },
        // This one violates matrix: NORMAL -> NORMAL is banned by Matrix (we removed it)
        { id: 't2', ownerId: 'n2', ownerType: 'NODE', from: SimulationState.NORMAL, to: SimulationState.NORMAL, evidenceIds: [] }
    ];

    try {
        StateTransitionEngine.applyTransitions(snapshotBeforeError, errorTransitions);
        console.log('Transaction Rollback Failed: No Error Thrown! ❌');
        throw new Error("Transaction Invariant Failed!");
    } catch (e: any) {
        const afterHash = hashObj(snapshotBeforeError);
        const afterRegHash = snapshotBeforeError.registry.getHash();
        const rolledBack = beforeHash === afterHash && beforeRegHash === afterRegHash;
        console.log(`Error Thrown Correctly: "${e.message}"`);
        console.log(`Transaction Rollback Passed: ${rolledBack ? '✅' : '❌'}`);
        if (!rolledBack) throw new Error("Transaction Rollback Failed! Snapshot mutated.");
    }
}

runE2E();
