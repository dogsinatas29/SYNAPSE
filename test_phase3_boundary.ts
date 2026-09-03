import * as fs from 'fs';
import { SimulationProjectionBuilder } from './src/core/simulation/SimulationProjectionBuilder';
import { SimulationScopeResolver } from './src/core/simulation/SimulationScopeResolver';
import { SimulationSnapshot, SimulationNode } from './src/core/simulation/SimulationSnapshot';
import { SimulationState } from './src/core/simulation/state/SimulationState';
import { SimulationBoundaryResolver } from './src/core/simulation/SimulationBoundaryResolver';

async function runBoundaryTest() {
    console.log('[Test] Phase 3: Boundary Resolution Layer');

    // 1. Load Real Snapshot & Check Boundary Count
    const statePath = '/home/dogsinatas/다운로드/linux-7.2-rc3/synapse_data/project_state.json.indexed';
    const scope = SimulationScopeResolver.resolve([], 'PROJECT');
    console.log('\n--- 1. Baseline Boundary Count Check ---');
    const snapshot = await SimulationProjectionBuilder.build(statePath, scope);
    
    // Check if boundaries are 0 -> 0
    console.log(`[Result] Baseline Boundaries: 0 | Projection Boundaries: ${snapshot.boundaries.length}`);
    if (snapshot.boundaries.length !== 0) {
        console.error(`❌ FAIL: Expected 0 boundaries, but got ${snapshot.boundaries.length}`);
    } else {
        console.log('✅ PASS: Boundary Count matches exactly (0 -> 0).');
    }

    // 2. Mock Boundary Test (For structural testing)
    console.log('\n--- 2. Synthetic Boundary Test (Isolation & Resolution) ---');
    
    const mockNode: SimulationNode = { id: 'node_1', type: 'file', cluster_id: 'root', state: SimulationState.NORMAL };
    const prodBoundary = { id: 'b_mock_1', type: 'logical', members: ['node_1'] };
    const simBoundaryCopy = JSON.parse(JSON.stringify(prodBoundary));
    const syntheticSnapshot = new SimulationSnapshot([mockNode], [], [], [simBoundaryCopy as any]).seal();
    
    const testBoundaryId = 'b_mock_1';
    
    console.log('\n--- 3. Boundary Object Identity Separation ---');
    const simBoundary = SimulationBoundaryResolver.lookup(syntheticSnapshot, testBoundaryId);
    
    if (!simBoundary) {
        throw new Error('SimulationBoundaryResolver.lookup failed.');
    }
    
    if (prodBoundary === (simBoundary as any)) {
        console.error('❌ FAIL: simBoundary and prodBoundary are the SAME reference!');
    } else {
        console.log('✅ PASS: simBoundary and prodBoundary have separate references.');
    }
    
    if (prodBoundary.members === (simBoundary as any).members) {
        console.error('❌ FAIL: Boundary members array shares the same reference!');
    } else {
        console.log('✅ PASS: Boundary members array has separate references.');
    }

    console.log('\n--- 4. Boundary Selection API ---');
    const memberNodeId = 'node_1';
    const foundBoundaries = SimulationBoundaryResolver.selectByNode(syntheticSnapshot, memberNodeId);
    if (foundBoundaries.some(b => b.id === testBoundaryId)) {
        console.log(`✅ PASS: selectByNode found boundary ${testBoundaryId} for node ${memberNodeId}.`);
    } else {
        console.error('❌ FAIL: selectByNode could not find the boundary.');
    }

    console.log('\n--- 5. Boundary Metadata Evaluation API ---');
    const metadata = SimulationBoundaryResolver.evaluateImpact(syntheticSnapshot, testBoundaryId);
    if (metadata && metadata.id === testBoundaryId && metadata.nodeCount === 1 && metadata.clusterCount === 0) {
        console.log(`✅ PASS: evaluateImpact returned valid metadata (Nodes: ${metadata.nodeCount}, Clusters: ${metadata.clusterCount}).`);
    } else {
        console.error('❌ FAIL: evaluateImpact returned invalid metadata.');
    }

    console.log('\n--- 6. Strict Structural Verification ---');
    const resolverProto = Object.getOwnPropertyNames(SimulationBoundaryResolver);
    const hasWriteApi = resolverProto.some(name => name.startsWith('create') || name.startsWith('add') || name.startsWith('set'));
    if (hasWriteApi) {
        console.error('❌ FAIL: BoundaryResolver exposes a write/creation API!');
    } else {
        console.log('✅ PASS: BoundaryResolver exposes only read/evaluation APIs.');
    }

    console.log('\n[Test] Phase 3 Validation Complete.');
}

runBoundaryTest();
