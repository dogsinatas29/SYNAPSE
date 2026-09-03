import { SimulationSnapshot, SimulationNode, SimulationEdge } from './src/core/simulation/SimulationSnapshot';
import { SimulationState } from './src/core/simulation/state/SimulationState';
import { SimulationRuleEngine } from './src/core/simulation/propagation/SimulationRuleEngine';
import { DependencyRemovedRealRule } from './src/core/simulation/propagation/rules/DependencyRemovedRealRule';
import { SimulationScenario } from './src/core/simulation/scenario/SimulationScenario';
import { SimulationScenarioType } from './src/core/simulation/scenario/SimulationScenarioType';
import { TraceCompressor } from './src/core/simulation/propagation/audit/TraceCompressor';
import { PropagationPositionAnalyzer } from './src/core/simulation/propagation/audit/PropagationPositionAnalyzer';

function generateLinuxMockSnapshot(): SimulationSnapshot {
    console.log('[Phase 9.5] Generating Linux-scale mock snapshot (110k nodes, 150k edges)...');
    const nodes: SimulationNode[] = [];
    const edges: SimulationEdge[] = [];

    const numNodes = 110000;
    const numEdges = 150000;

    const clusters = [
        { name: 'drivers/usb', weight: 0.20 },
        { name: 'drivers/gpu', weight: 0.15 },
        { name: 'drivers/net', weight: 0.10 },
        { name: 'drivers/core', weight: 0.13 },
        { name: 'arch/x86', weight: 0.15 },
        { name: 'arch/arm', weight: 0.06 },
        { name: 'kernel/sched', weight: 0.05 },
        { name: 'kernel/mm', weight: 0.06 },
        { name: 'fs/ext4', weight: 0.06 },
        { name: 'net/ipv4', weight: 0.04 }
    ];

    let cIdx = 0;
    let accumulated = clusters[0].weight * numNodes;

    for (let i = 0; i < numNodes; i++) {
        if (i > accumulated && cIdx < clusters.length - 1) {
            cIdx++;
            accumulated += clusters[cIdx].weight * numNodes;
        }
        nodes.push({
            id: `n_${i}`,
            type: 'source',
            cluster_id: clusters[cIdx].name,
            state: SimulationState.NORMAL
        });
    }

    for (let i = 0; i < numEdges; i++) {
        const fromIdx = Math.floor(Math.pow(Math.random(), 3) * numNodes);
        const toIdx = Math.floor(Math.random() * numNodes);
        edges.push({
            id: `e_${i}`,
            from: `n_${fromIdx}`,
            to: `n_${toIdx}`,
            type: 'INCLUDE',
            weight: 1,
            state: SimulationState.NORMAL
        });
    }

    return new SimulationSnapshot(nodes, edges, [], []).seal();
}

function runPhase9_5() {
    const snapshot = generateLinuxMockSnapshot();
    
    const fanOutCount = new Map<string, number>();
    for (const e of snapshot.edges) {
        fanOutCount.set(e.to, (fanOutCount.get(e.to) || 0) + 1);
    }
    
    let eligibleEdges = [...snapshot.edges].sort((a, b) => (fanOutCount.get(b.to) || 0) - (fanOutCount.get(a.to) || 0));
    const targetEdge = eligibleEdges[0];
    if (!targetEdge) return;

    console.log(`[Phase 9.5] Executing DEPENDENCY_REMOVED on TOP_FANOUT target: ${targetEdge.id}\n`);
    
    const scenario: SimulationScenario = {
        id: 'sc_audit_test',
        type: SimulationScenarioType.DEPENDENCY_REMOVED,
        targetId: targetEdge.id,
        evidenceIds: ['ev_root']
    };

    const engine = new SimulationRuleEngine();
    engine.registerRule(new DependencyRemovedRealRule(0)); // Depth Unlimited

    const result = engine.propagate(snapshot, scenario);

    const compressor = new TraceCompressor();
    const compressed = compressor.compress(result.traces, snapshot);
    const dominantPaths = compressor.extractDominantPaths(compressed, 4);

    const analyzer = new PropagationPositionAnalyzer();
    const positionStats = analyzer.analyze(result.traces, result.transitions);

    console.log('======================================================');
    console.log('🚀 Phase 9.5: Trace Compression & Position Analysis');
    console.log('======================================================\n');
    console.log('Linux TOP_FANOUT\n');
    console.log(`Raw Trace Links\n${result.traces.length}\n`);
    console.log(`Compressed Clusters\n${compressed.length}\n`);
    
    const ratio = result.traces.length > 0 
        ? ((1 - (compressed.length / result.traces.length)) * 100).toFixed(1) 
        : '0.0';
    console.log(`Compression Ratio\n${ratio}%\n`);

    console.log('Dominant Paths');
    dominantPaths.forEach((p, idx) => {
        console.log(`${idx + 1}. ${p.path[0]} -> ${p.path[1]} (Weight: ${p.weight})`);
    });

    console.log('\nPropagation Position Class');
    const totalPos = positionStats.rootAdjacent + positionStats.intermediate + positionStats.leaf;
    const raRatio = totalPos > 0 ? ((positionStats.rootAdjacent / totalPos) * 100).toFixed(1) : '0';
    const intRatio = totalPos > 0 ? ((positionStats.intermediate / totalPos) * 100).toFixed(1) : '0';
    const leafRatio = totalPos > 0 ? ((positionStats.leaf / totalPos) * 100).toFixed(1) : '0';

    console.log(`- Root Adjacent : ${positionStats.rootAdjacent} (${raRatio}%)`);
    console.log(`- Intermediate  : ${positionStats.intermediate} (${intRatio}%)`);
    console.log(`- Leaf          : ${positionStats.leaf} (${leafRatio}%)`);
    console.log('\n======================================================');
}

runPhase9_5();
