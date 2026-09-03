import { SimulationProjectionBuilder } from './src/core/simulation/SimulationProjectionBuilder';
import { SimulationScopeResolver } from './src/core/simulation/SimulationScopeResolver';

async function runTest() {
    const statePath = '/home/dogsinatas/다운로드/linux-7.2-rc3/synapse_data/project_state.json.indexed';
    
    console.log('[Test] Starting Phase 1 Validation (Node Count & Cluster Count Eq Check)');
    
    // Baseline Counts from Phase 0
    const BASELINE_NODE_COUNT = 110179;
    const BASELINE_CLUSTER_COUNT = 3012;
    
    try {
        const scope = SimulationScopeResolver.resolve([], 'PROJECT');
        const snapshot = await SimulationProjectionBuilder.build(statePath, scope);
        
        const projNodeCount = snapshot.nodes.length;
        const projClusterCount = snapshot.clusters.length;
        
        console.log(`[Result] Baseline Nodes: ${BASELINE_NODE_COUNT} | Projection Nodes: ${projNodeCount}`);
        console.log(`[Result] Baseline Clusters: ${BASELINE_CLUSTER_COUNT} | Projection Clusters: ${projClusterCount}`);
        
        if (projNodeCount === BASELINE_NODE_COUNT && projClusterCount === BASELINE_CLUSTER_COUNT) {
            console.log('[Test] SUCCESS: Projection counts exactly match Baseline.');
        } else {
            console.error('[Test] FAIL: Count mismatch detected.');
        }
    } catch (e: any) {
        console.error('[Test] Exception during projection build:', e.message);
    }
}

runTest();
