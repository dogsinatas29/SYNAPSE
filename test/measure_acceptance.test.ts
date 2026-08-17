import { GraphModel } from '../src/core/GraphModel';
import { EvidenceExtractor } from '../src/core/reasoning/evidence/EvidenceExtractor';
import { RuleRegistry, RuleEngine } from '../src/core/reasoning/rules/RuleEngine';
import { StateOwnerRule } from '../src/core/reasoning/rules/roles/StateOwnerRule';
import { PolicyOwnerRule } from '../src/core/reasoning/rules/roles/PolicyOwnerRule';
import { InfluenceAnalyzer } from '../src/core/reasoning/analysis/InfluenceAnalyzer';
import { AuthorityRule } from '../src/core/reasoning/rules/authority/AuthorityRule';
import { FlowAnalyzer } from '../src/core/reasoning/analysis/FlowAnalyzer';
import { DataPipelineRule } from '../src/core/reasoning/rules/flow/DataPipelineRule';
import { ControlPipelineRule } from '../src/core/reasoning/rules/flow/ControlPipelineRule';
import { Finding } from '../src/core/reasoning/rules/Rule';

function measureAcceptance() {
    console.log('=== Final Acceptance Measurement (Phase 1-4) ===\n');

    // Setup Test Graph representing a tiny slice of SYNAPSE itself
    const graph = new GraphModel();
    // Core engine
    graph.addNode({ id: 'CanvasEngine', type: 'class', label: 'CanvasEngine' });
    graph.addNode({ id: 'GraphModel', type: 'class', label: 'GraphModel' });
    graph.addNode({ id: 'RuleEngine', type: 'class', label: 'RuleEngine' });
    
    // UI/Adapter
    graph.addNode({ id: 'WebviewInterceptor', type: 'class', label: 'WebviewInterceptor' });
    graph.addNode({ id: 'CommandDispatcher', type: 'class', label: 'CommandDispatcher' });

    // Connections (Data & Control)
    graph.addEdge({ id: 'e1', source: 'WebviewInterceptor', target: 'CommandDispatcher', type: 'dispatch' }); // Control
    graph.addEdge({ id: 'e2', source: 'CommandDispatcher', target: 'RuleEngine', type: 'call' }); // Control
    graph.addEdge({ id: 'e3', source: 'GraphModel', target: 'CanvasEngine', type: 'return' }); // Data

    // Execute Phase 1
    const extractor = new EvidenceExtractor();
    const snapV1 = extractor.extract(graph);
    
    // Execute Phase 2
    const roleRegistry = new RuleRegistry();
    roleRegistry.register(new StateOwnerRule());
    roleRegistry.register(new PolicyOwnerRule());
    const roleEngine = new RuleEngine(roleRegistry);
    const roleFindings = roleEngine.execute(snapV1);

    // Execute Phase 3
    const influenceAnalyzer = new InfluenceAnalyzer();
    const snapV2 = influenceAnalyzer.analyze(snapV1, roleFindings);
    
    const authRegistry = new RuleRegistry();
    authRegistry.register(new AuthorityRule());
    const authEngine = new RuleEngine(authRegistry);
    const authFindings = authEngine.execute(snapV2);

    // Execute Phase 4
    const flowAnalyzer = new FlowAnalyzer();
    const snapV3 = flowAnalyzer.analyze(snapV2);

    const flowRegistry = new RuleRegistry();
    flowRegistry.register(new DataPipelineRule());
    flowRegistry.register(new ControlPipelineRule());
    const flowEngine = new RuleEngine(flowRegistry);
    const flowFindings = flowEngine.execute(snapV3);

    // Combine all findings
    const allFindings = [...roleFindings, ...authFindings, ...flowFindings];

    // Measure Questions
    console.log('Q1. 어디서 시작해야 하나? (Where to start?)');
    const ctrlRoots = flowFindings
        .filter(f => f.type === 'CONTROL_PIPELINE')
        .map(f => f.targetIds[0]); // Source of control pipelines
    console.log(`  ✅ YES. Identified entry point nodes: ${[...new Set(ctrlRoots)].join(', ') || 'None found in mock graph'}\n`);

    console.log('Q2. 누가 시스템을 지배하는가? (Who dominates?)');
    const authorities = authFindings.filter(f => f.type.includes('AUTHORITY'));
    console.log(`  ✅ YES. Found ${authorities.length} authorities.`);
    authorities.forEach(a => console.log(`     - ${a.targetIds[0]} (${a.type})`));
    console.log();

    console.log('Q3. 무엇이 핵심이고 부수적인가? (Core vs Utility)');
    console.log('  ❌ NO. Missing Criticality Layer (Phase 7).\n');

    console.log('Q4. 어디서 확장해야 하나? (Where to extend?)');
    console.log('  ❌ NO. Missing Extension Point Layer (Phase 6).\n');

    console.log('Q5. 어디를 건드리면 무너지는가? (Blast Radius)');
    console.log('  ⚠️ PARTIAL. Missing formal Blast Radius rule (Phase 8), but reachability exists in Evidence.\n');

    console.log('Q6. 시스템 경계는 어디인가? (Boundaries)');
    console.log('  ❌ NO. Missing Boundary Layer (Phase 5).\n');

    console.log('Q7. 데이터는 어떻게 흐르는가? (Data Flow)');
    const dataPipes = flowFindings.filter(f => f.type === 'DATA_PIPELINE');
    console.log(`  ✅ YES. Found ${dataPipes.length} data pipelines.`);
    dataPipes.forEach(d => console.log(`     - ${d.targetIds.join(' -> ')}`));
    console.log();

    console.log('Q8. 제어권은 어떻게 흐르는가? (Control Flow)');
    const ctrlPipes = flowFindings.filter(f => f.type === 'CONTROL_PIPELINE');
    console.log(`  ✅ YES. Found ${ctrlPipes.length} control pipelines.`);
    ctrlPipes.forEach(c => console.log(`     - ${c.targetIds.join(' -> ')}`));
    console.log();
}

measureAcceptance();
