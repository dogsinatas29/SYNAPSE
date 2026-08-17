import { GraphModel } from '../src/core/GraphModel';
import { EvidenceExtractor } from '../src/core/reasoning/evidence/EvidenceExtractor';
import { RuleRegistry, RuleEngine } from '../src/core/reasoning/rules/RuleEngine';
import { StateOwnerRule } from '../src/core/reasoning/rules/roles/StateOwnerRule';
import { PolicyOwnerRule } from '../src/core/reasoning/rules/roles/PolicyOwnerRule';
import { ControllerRule } from '../src/core/reasoning/rules/roles/ControllerRule';
import { InfluenceAnalyzer } from '../src/core/reasoning/analysis/InfluenceAnalyzer';
import { AuthorityRule } from '../src/core/reasoning/rules/authority/AuthorityRule';
import { FlowAnalyzer } from '../src/core/reasoning/analysis/FlowAnalyzer';
import { DataPipelineRule } from '../src/core/reasoning/rules/flow/DataPipelineRule';
import { ControlPipelineRule } from '../src/core/reasoning/rules/flow/ControlPipelineRule';
import { AnswerEngine } from '../src/core/reasoning/answers/AnswerEngine';
import { Q1EntryPointAggregator } from '../src/core/reasoning/answers/aggregators/Q1EntryPointAggregator';
import { Q2AuthorityAggregator } from '../src/core/reasoning/answers/aggregators/Q2AuthorityAggregator';
import { Q7DataFlowAggregator } from '../src/core/reasoning/answers/aggregators/Q7DataFlowAggregator';
import { Q8ControlFlowAggregator } from '../src/core/reasoning/answers/aggregators/Q8ControlFlowAggregator';

function runAnswerEngineValidation() {
    console.log('=== Answer Engine Validation (Mock Graph) ===\n');

    const graph = new GraphModel();
    // Core Engine
    graph.addNode({ id: 'GraphModel', type: 'class', label: 'GraphModel' });
    graph.addNode({ id: 'CanvasEngine', type: 'class', label: 'CanvasEngine' });
    graph.addNode({ id: 'RuleEngine', type: 'class', label: 'RuleEngine' });
    graph.addNode({ id: 'DataPipeline', type: 'class', label: 'DataPipeline' });
    
    // UI/Adapter
    graph.addNode({ id: 'WebviewInterceptor', type: 'class', label: 'WebviewInterceptor' });
    graph.addNode({ id: 'CommandDispatcher', type: 'class', label: 'CommandDispatcher' });
    graph.addNode({ id: 'Button', type: 'class', label: 'Button' });

    // Utility (High Fan-In, Low Authority)
    graph.addNode({ id: 'ThemeManager', type: 'class', label: 'ThemeManager' });
    graph.addNode({ id: 'Logger', type: 'class', label: 'Logger' });

    // State Fields (To trigger StateOwnerRule on GraphModel)
    graph.addEdge({ id: 'e_state1', source: 'GraphModel', target: 'nodes', type: 'owns' });
    graph.addEdge({ id: 'e_state2', source: 'GraphModel', target: 'edges', type: 'owns' });
    
    // Dispatch (To trigger ControllerRule)
    graph.addEdge({ id: 'e_disp1', source: 'CommandDispatcher', target: 'RuleEngine', type: 'call' });
    graph.addEdge({ id: 'e_disp2', source: 'Button', target: 'CommandDispatcher', type: 'dispatch' });

    // Core Data/Control Flow
    graph.addEdge({ id: 'e_data1', source: 'GraphModel', target: 'DataPipeline', type: 'return' });
    graph.addEdge({ id: 'e_data2', source: 'DataPipeline', target: 'CanvasEngine', type: 'return' });
    
    // Utility Fan-In (Everyone uses ThemeManager and Logger)
    ['CanvasEngine', 'RuleEngine', 'CommandDispatcher', 'WebviewInterceptor', 'Button'].forEach((n, i) => {
        graph.addEdge({ id: `e_log_${i}`, source: n, target: 'Logger', type: 'call' });
        graph.addEdge({ id: `e_theme_${i}`, source: n, target: 'ThemeManager', type: 'call' });
    });

    // Run Engine Pipeline
    const extractor = new EvidenceExtractor();
    const snap1 = extractor.extract(graph);
    
    const roleReg = new RuleRegistry();
    roleReg.register(new StateOwnerRule());
    roleReg.register(new PolicyOwnerRule());
    roleReg.register(new ControllerRule());
    const roleEngine = new RuleEngine(roleReg);
    const roleFindings = roleEngine.execute(snap1);

    const inflAnalyzer = new InfluenceAnalyzer();
    const snap2 = inflAnalyzer.analyze(snap1, roleFindings);
    
    const authReg = new RuleRegistry();
    authReg.register(new AuthorityRule());
    const authFindings = new RuleEngine(authReg).execute(snap2);

    const flowAnalyzer = new FlowAnalyzer();
    const snap3 = flowAnalyzer.analyze(snap2);
    
    const flowReg = new RuleRegistry();
    flowReg.register(new DataPipelineRule());
    flowReg.register(new ControlPipelineRule());
    const flowFindings = new RuleEngine(flowReg).execute(snap3);

    const allFindings = [...roleFindings, ...authFindings, ...flowFindings];

    // Answer Engine
    const answerEngine = new AnswerEngine();
    answerEngine.register(new Q1EntryPointAggregator());
    answerEngine.register(new Q2AuthorityAggregator());
    answerEngine.register(new Q7DataFlowAggregator());
    answerEngine.register(new Q8ControlFlowAggregator());

    const answers = answerEngine.execute(snap3, allFindings);

    // Assertions
    const q1 = answers.find(a => a.questionId === 'Q1')!;
    console.log(`Q1: ${q1.summary}`);
    if (!q1.items.some(i => i.targetId === 'Button')) throw new Error('Q1 failed: Button not an entry point');
    if (q1.items.some(i => i.explanation.includes('ev-'))) throw new Error('Q1 failed: Opaque ID in explanation');
    console.log('✅ Q1 Pass');

    const q2 = answers.find(a => a.questionId === 'Q2')!;
    console.log(`\nQ2: ${q2.summary}`);
    const rank1 = q2.items[0].targetId;
    if (rank1 !== 'GraphModel') throw new Error(`Q2 failed: GraphModel should be #1, got ${rank1}`);
    const themeRank = q2.items.findIndex(i => i.targetId === 'ThemeManager');
    if (themeRank !== -1 && themeRank < 3) throw new Error('Q2 failed: ThemeManager ranked too high');
    if (!q2.items[0].explanation.includes('State Owner')) throw new Error('Q2 failed: Missing semantic Role in explanation');
    console.log('✅ Q2 Pass');

    const q7 = answers.find(a => a.questionId === 'Q7')!;
    console.log(`\nQ7: ${q7.summary}`);
    if (!q7.items.some(i => i.targetId === 'GraphModel -> DataPipeline -> CanvasEngine')) throw new Error('Q7 failed: Missing known pipeline');
    console.log('✅ Q7 Pass');

    const q8 = answers.find(a => a.questionId === 'Q8')!;
    console.log(`\nQ8: ${q8.summary}`);
    if (!q8.items.some(i => i.targetId === 'Button -> CommandDispatcher -> RuleEngine')) throw new Error('Q8 failed: Missing known pipeline');
    console.log('✅ Q8 Pass');
}

runAnswerEngineValidation();
