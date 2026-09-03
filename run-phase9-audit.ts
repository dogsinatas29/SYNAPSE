import { SimulationSnapshot, SimulationNode, SimulationEdge } from './src/core/simulation/SimulationSnapshot';
import { SimulationState } from './src/core/simulation/state/SimulationState';
import { SimulationRuleEngine } from './src/core/simulation/propagation/SimulationRuleEngine';
import { DependencyRemovedRealRule } from './src/core/simulation/propagation/rules/DependencyRemovedRealRule';
import { SimulationScenario } from './src/core/simulation/scenario/SimulationScenario';
import { SimulationScenarioType } from './src/core/simulation/scenario/SimulationScenarioType';
import { SimulationAuditBuilder } from './src/core/simulation/propagation/audit/SimulationAuditBuilder';
import * as fs from 'fs';

function generateLinuxMockSnapshot(): SimulationSnapshot {
    console.log('[Phase 9] Generating Linux-scale mock snapshot (110k nodes, 150k edges)...');
    const nodes: SimulationNode[] = [];
    const edges: SimulationEdge[] = [];

    const numNodes = 110000;
    const numEdges = 150000;

    const clusters = [
        { name: 'drivers', weight: 0.58 },
        { name: 'arch', weight: 0.21 },
        { name: 'kernel', weight: 0.11 },
        { name: 'fs', weight: 0.06 },
        { name: 'net', weight: 0.04 }
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

function runPhase9Audit() {
    const snapshot = generateLinuxMockSnapshot();
    
    // Find TOP_FANOUT edge
    const fanoutMap = new Map<string, number>();
    for (const e of snapshot.edges) {
        fanoutMap.set(e.to, (fanoutMap.get(e.to) || 0) + 1);
    }
    
    let maxFanout = 0;
    let topNode = '';
    for (const [node, count] of fanoutMap.entries()) {
        if (count > maxFanout) {
            maxFanout = count;
            topNode = node;
        }
    }
    
    const targetEdge = snapshot.edges.find(e => e.from === topNode);
    if (!targetEdge) return;

    console.log(`[Phase 9] Executing DEPENDENCY_REMOVED on TOP_FANOUT target: ${targetEdge.id}`);
    
    const scenario: SimulationScenario = {
        id: 'sc_audit_test',
        type: SimulationScenarioType.DEPENDENCY_REMOVED,
        targetId: targetEdge.id,
        evidenceIds: ['ev_real_test_001']
    };

    const engine = new SimulationRuleEngine();
    engine.registerRule(new DependencyRemovedRealRule(0)); // Depth Unlimited

    const result = engine.propagate(snapshot, scenario);
    
    const auditBuilder = new SimulationAuditBuilder();
    const report = auditBuilder.build(scenario, snapshot, result);

    console.log('\n======================================================');
    console.log('🚀 Phase 9: Simulation Audit Report (Markdown Output)');
    console.log('======================================================\n');
    console.log(report.summaryMarkdown);
    
    fs.writeFileSync('trace_graph.json', JSON.stringify(report.traceGraph, null, 2));
    console.log('[Phase 9] trace_graph.json saved to disk.');
}

runPhase9Audit();
