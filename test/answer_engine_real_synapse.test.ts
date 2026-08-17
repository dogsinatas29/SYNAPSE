import * as fs from 'fs';
import * as path from 'path';
import { GraphModel } from '../src/core/GraphModel';
import { EvidenceExtractor } from '../src/core/reasoning/evidence/EvidenceExtractor';
import { RuleRegistry, RuleEngine } from '../src/core/reasoning/rules/RuleEngine';
import { StateOwnerRule } from '../src/core/reasoning/rules/roles/StateOwnerRule';
import { PolicyOwnerRule } from '../src/core/reasoning/rules/roles/PolicyOwnerRule';
import { ControllerRule } from '../src/core/reasoning/rules/roles/ControllerRule';
import { AdapterRule } from '../src/core/reasoning/rules/roles/AdapterRule';
import { ViewRule } from '../src/core/reasoning/rules/roles/ViewRule';
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

function simulateRealSynapseGraph(): GraphModel {
    const graph = new GraphModel();
    
    // Core Engine
    graph.addNode({ id: 'CanvasEngine', type: 'class', label: 'CanvasEngine' });
    graph.addNode({ id: 'GraphModel', type: 'class', label: 'GraphModel' });
    graph.addNode({ id: 'RuleEngine', type: 'class', label: 'RuleEngine' });
    graph.addNode({ id: 'EvidenceExtractor', type: 'class', label: 'EvidenceExtractor' });
    graph.addNode({ id: 'FlowAnalyzer', type: 'class', label: 'FlowAnalyzer' });

    // UI/Adapter
    graph.addNode({ id: 'extension', type: 'class', label: 'extension' });
    graph.addNode({ id: 'CanvasPanel', type: 'class', label: 'CanvasPanel' });

    // Real-world GraphModel State Evidence
    for(let i=0; i<5; i++) graph.addEdge({ id: `gm_state_${i}`, source: 'GraphModel', target: `state_${i}`, type: 'owns' });
    
    // Real-world RuleEngine Policy Evidence
    for(let i=0; i<10; i++) graph.addEdge({ id: `re_pol_${i}`, source: 'RuleEngine', target: `rule_${i}`, type: 'owns' });

    // Extension roots
    graph.addEdge({ id: 'e1', source: 'extension', target: 'CanvasPanel', type: 'call' });
    graph.addEdge({ id: 'e2', source: 'CanvasPanel', target: 'CanvasEngine', type: 'dispatch' }); // Control
    graph.addEdge({ id: 'e3', source: 'CanvasEngine', target: 'RuleEngine', type: 'call' }); // Control
    graph.addEdge({ id: 'e4', source: 'RuleEngine', target: 'EvidenceExtractor', type: 'call' });
    
    graph.addEdge({ id: 'e5', source: 'EvidenceExtractor', target: 'GraphModel', type: 'return' }); // Data
    graph.addEdge({ id: 'e6', source: 'GraphModel', target: 'FlowAnalyzer', type: 'return' }); // Data
    graph.addEdge({ id: 'e7', source: 'FlowAnalyzer', target: 'CanvasEngine', type: 'return' }); // Data

    return graph;
}

function runRealSynapseAcceptance() {
    console.log('=== Answer Engine Real SYNAPSE Acceptance ===\n');

    const graph = simulateRealSynapseGraph(); // In a real CLI, this reads the actual disk. For tests, we use the simulated model.

    const extractor = new EvidenceExtractor();
    const snap1 = extractor.extract(graph);
    
    const roleReg = new RuleRegistry();
    roleReg.register(new StateOwnerRule());
    roleReg.register(new PolicyOwnerRule());
    roleReg.register(new ControllerRule());
    roleReg.register(new AdapterRule());
    roleReg.register(new ViewRule());
    const roleFindings = new RuleEngine(roleReg).execute(snap1);

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

    const answerEngine = new AnswerEngine();
    answerEngine.register(new Q1EntryPointAggregator());
    answerEngine.register(new Q2AuthorityAggregator());
    answerEngine.register(new Q7DataFlowAggregator());
    answerEngine.register(new Q8ControlFlowAggregator());

    const answers = answerEngine.execute(snap3, allFindings);

    console.log(JSON.stringify(answers, null, 2));

    // Ground Truth Validations
    const q1 = answers.find(a => a.questionId === 'Q1')!;
    if (!q1.items.some(i => i.targetId === 'CanvasPanel' || i.targetId === 'extension')) throw new Error('Q1 Real Test Failed');

    const q2 = answers.find(a => a.questionId === 'Q2')!;
    const top3 = q2.items.slice(0, 3).map(i => i.targetId);
    let authCount = 0;
    if (top3.includes('GraphModel')) authCount++;
    if (top3.includes('CanvasEngine')) authCount++;
    if (top3.includes('RuleEngine')) authCount++;
    if (authCount < 2) throw new Error('Q2 Real Test Failed: Core engines not in Top 3');

    const q7 = answers.find(a => a.questionId === 'Q7')!;
    if (!q7.items.some(i => i.targetId.includes('GraphModel -> FlowAnalyzer -> CanvasEngine'))) throw new Error('Q7 Real Test Failed');

    const q8 = answers.find(a => a.questionId === 'Q8')!;
    if (!q8.items.some(i => i.targetId.includes('CanvasPanel -> CanvasEngine -> RuleEngine'))) throw new Error('Q8 Real Test Failed');

    console.log('\n✅ All Ground Truth Assertions Passed for Real SYNAPSE simulation.');
}

runRealSynapseAcceptance();
