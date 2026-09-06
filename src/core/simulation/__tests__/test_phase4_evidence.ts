import { SimulationEvidenceCollector } from './src/core/simulation/evidence/SimulationEvidenceCollector';
import { SimulationEvidenceType } from './src/core/simulation/evidence/SimulationEvidenceType';

function runEvidenceTest() {
    console.log('[Test] Phase 4: Simulation Evidence Layer');

    const collector = new SimulationEvidenceCollector();

    // 1. Capture Evidence & Verify Deterministic Sequence and Immutability
    console.log('\n--- 1. Capture & Immutability Test ---');
    const ev1 = collector.capture(SimulationEvidenceType.BEHAVIORAL, 'api_endpoint_1', { diff: 'changed signature' });
    const ev2 = collector.capture(SimulationEvidenceType.STRUCTURAL, 'node_xyz', { change: 'deleted' });
    const ev3 = collector.capture(SimulationEvidenceType.STATE, 'cluster_auth', { currentState: 'DIRTY' });

    console.log(`[Result] ev1 sequence: ${ev1.sequence}, ev2 sequence: ${ev2.sequence}`);
    if (ev1.sequence === 1 && ev2.sequence === 2) {
        console.log('✅ PASS: Deterministic sequencing works.');
    } else {
        console.error('❌ FAIL: Sequencing is incorrect.');
    }

    try {
        (ev1 as any).sequence = 99;
        console.error('❌ FAIL: Evidence object is not immutable!');
    } catch (e) {
        console.log('✅ PASS: Evidence object is deeply frozen and immutable.');
    }

    // 2. Test Linking
    console.log('\n--- 2. Graph Linking Test ---');
    collector.link(ev1.id, ev2.id); // ev1 caused ev2
    collector.link(ev2.id, ev3.id); // ev2 caused ev3

    const graph = collector.getGraph();
    const effectsOfEv1 = graph.getEffects(ev1.id);
    const causesOfEv3 = graph.getCauses(ev3.id);

    if (effectsOfEv1.length === 1 && effectsOfEv1[0].id === ev2.id && causesOfEv3.length === 1 && causesOfEv3[0].id === ev2.id) {
        console.log('✅ PASS: Causal links successfully established.');
    } else {
        console.error('❌ FAIL: Causal links are incorrect.');
    }

    // 3. Test DAG Validation (Cycle Prevention)
    console.log('\n--- 3. DAG Cycle Prevention Test ---');
    try {
        // Attempting to link ev3 back to ev1, which creates a cycle: ev1 -> ev2 -> ev3 -> ev1
        collector.link(ev3.id, ev1.id);
        console.error('❌ FAIL: Cycle was allowed! DAG Validation failed.');
    } catch (e: any) {
        console.log(`✅ PASS: Cycle correctly prevented. Error: "${e.message}"`);
    }

    try {
        // Self-referencing
        collector.link(ev2.id, ev2.id);
        console.error('❌ FAIL: Self-referencing cycle was allowed!');
    } catch (e: any) {
        console.log(`✅ PASS: Self-referencing correctly prevented. Error: "${e.message}"`);
    }

    // 4. Structural Verification for Inference APIs
    console.log('\n--- 4. Strict Structural Verification (No Inference) ---');
    const collectorProto = Object.getOwnPropertyNames(SimulationEvidenceCollector.prototype);
    const hasInferenceApi = collectorProto.some(name => name.includes('interpret') || name.includes('infer') || name.includes('rank') || name.includes('evaluate') || name.includes('analyze'));
    
    if (hasInferenceApi) {
        console.error('❌ FAIL: Collector contains inference/analysis logic!');
    } else {
        console.log('✅ PASS: Collector only captures, stores, and links (Evidence First, Inference Later).');
    }

    console.log('\n[Test] Phase 4 Validation Complete.');
}

runEvidenceTest();
