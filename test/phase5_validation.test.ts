import { GraphModel } from '../src/core/GraphModel';
import { ReasoningSnapshot } from '../src/core/reasoning/snapshot/ReasoningSnapshot';
import { BoundaryAnalyzer } from '../src/core/reasoning/analysis/BoundaryAnalyzer';
import { RuleRegistry, RuleEngine } from '../src/core/reasoning/rules/RuleEngine';
import { BoundaryRule } from '../src/core/reasoning/rules/boundary/BoundaryRule';
import { BoundaryCrosserRule } from '../src/core/reasoning/rules/boundary/BoundaryCrosserRule';

function runPhase5Validation() {
    console.log('=== Phase 5 Boundary Validation ===\n');

    const analyzer = new BoundaryAnalyzer();
    const registry = new RuleRegistry();
    registry.register(new BoundaryRule());
    registry.register(new BoundaryCrosserRule());
    const ruleEngine = new RuleEngine(registry);

    let passed = 0;
    let failed = 0;

    function assertBoundaryFound(graph: GraphModel, testName: string, expectedGroupNode: string, expectedCrosser?: string, expectIsland?: string) {
        const snap = analyzer.analyze(new ReasoningSnapshot('snap-1', Date.now(), []), graph);
        const findings = ruleEngine.execute(snap);

        const boundaries = findings.filter(f => f.type === 'BOUNDARY');
        const islands = findings.filter(f => f.type === 'BOUNDARY_ISLAND');
        const crossers = findings.filter(f => f.type === 'BOUNDARY_CROSSER');

        let success = true;

        if (!boundaries.some(b => b.targetIds.includes(expectedGroupNode)) && !islands.some(i => i.targetIds.includes(expectedGroupNode))) {
            console.error(`❌ [${testName}] Failed: Expected node ${expectedGroupNode} to be in a boundary.`);
            success = false;
        }

        if (expectedCrosser && !crossers.some(c => c.targetIds.includes(expectedCrosser))) {
            console.error(`❌ [${testName}] Failed: Expected crosser ${expectedCrosser} not found.`);
            success = false;
        }

        if (expectIsland && !islands.some(i => i.targetIds.includes(expectIsland))) {
            console.error(`❌ [${testName}] Failed: Expected island containing ${expectIsland} not found.`);
            success = false;
        }

        if (success) {
            console.log(`✅ [${testName}] Passed.`);
            passed++;
        } else {
            failed++;
        }
    }

    // Test 1: Boundary ≠ Folder
    const g1 = new GraphModel();
    g1.addNode({ id: 'ui/A', type: 'class', label: 'ui/A' });
    g1.addNode({ id: 'ui/B', type: 'class', label: 'ui/B' });
    g1.addNode({ id: 'core/C', type: 'class', label: 'core/C' });
    g1.addNode({ id: 'infra/D', type: 'class', label: 'infra/D' });
    
    // ui/B and core/C are tightly coupled
    for (let i = 0; i < 5; i++) g1.addEdge({ id: `e1_${i}`, source: 'ui/B', target: 'core/C', type: 'call' });
    // ui/A is separate
    g1.addEdge({ id: 'e1_a', source: 'ui/A', target: 'ui/B', type: 'call' });
    assertBoundaryFound(g1, 'Boundary ≠ Folder', 'ui/B'); // They should be in a boundary together

    // Test 2: Bridge Detection
    const g2 = new GraphModel();
    g2.addNode({ id: 'UI1', type: 'class', label: 'UI1' });
    g2.addNode({ id: 'UI2', type: 'class', label: 'UI2' });
    g2.addNode({ id: 'Adapter', type: 'class', label: 'Adapter' });
    g2.addNode({ id: 'Core1', type: 'class', label: 'Core1' });
    g2.addNode({ id: 'Core2', type: 'class', label: 'Core2' });
    
    g2.addEdge({ id: 'e2_1', source: 'UI1', target: 'UI2', type: 'call' });
    g2.addEdge({ id: 'e2_2', source: 'UI2', target: 'UI1', type: 'call' });
    g2.addEdge({ id: 'e2_3', source: 'Core1', target: 'Core2', type: 'call' });
    g2.addEdge({ id: 'e2_4', source: 'Core2', target: 'Core1', type: 'call' });
    
    // Cross boundary through Adapter
    g2.addEdge({ id: 'e2_5', source: 'UI1', target: 'Adapter', type: 'call' });
    g2.addEdge({ id: 'e2_6', source: 'Adapter', target: 'Core1', type: 'call' });
    assertBoundaryFound(g2, 'Bridge Detection', 'UI1', 'Adapter');

    // Test 3: Island Detection
    const g3 = new GraphModel();
    g3.addNode({ id: 'Main1', type: 'class', label: 'Main1' });
    g3.addNode({ id: 'Main2', type: 'class', label: 'Main2' });
    g3.addNode({ id: 'Util1', type: 'class', label: 'Util1' });
    g3.addNode({ id: 'Util2', type: 'class', label: 'Util2' });
    g3.addNode({ id: 'Util3', type: 'class', label: 'Util3' });

    g3.addEdge({ id: 'e3_1', source: 'Main1', target: 'Main2', type: 'call' });
    g3.addEdge({ id: 'e3_2', source: 'Util1', target: 'Util2', type: 'call' });
    g3.addEdge({ id: 'e3_3', source: 'Util2', target: 'Util3', type: 'call' });
    g3.addEdge({ id: 'e3_4', source: 'Util3', target: 'Util1', type: 'call' });
    
    // Only 1 edge connects them
    g3.addEdge({ id: 'e3_5', source: 'Main1', target: 'Util1', type: 'call' });
    assertBoundaryFound(g3, 'Island Detection', 'Main1', undefined, 'Util1');

    console.log(`\nResults: ${passed} Passed, ${failed} Failed.`);
    if (failed > 0) process.exit(1);
}

runPhase5Validation();
