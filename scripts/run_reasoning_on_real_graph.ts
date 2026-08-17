import * as fs from 'fs';
import * as path from 'path';

import { GraphModel } from '../src/core/GraphModel';
import { ReasoningSnapshot } from '../src/core/reasoning/snapshot/ReasoningSnapshot';
import { ArchitectureIrBuilder } from '../src/core/ir/ArchitectureIrBuilder';

// Analyzers
import { RoleAnalyzer } from '../src/core/reasoning/analysis/RoleAnalyzer';
import { AuthorityAnalyzer } from '../src/core/reasoning/analysis/AuthorityAnalyzer';
import { FlowAnalyzer } from '../src/core/reasoning/analysis/FlowAnalyzer';
import { BoundaryAnalyzer } from '../src/core/reasoning/analysis/BoundaryAnalyzer';
import { CriticalityAnalyzer } from '../src/core/reasoning/analysis/CriticalityAnalyzer';
import { ExtensionAnalyzer } from '../src/core/reasoning/analysis/ExtensionAnalyzer';
import { BlastRadiusAnalyzer } from '../src/core/reasoning/analysis/BlastRadiusAnalyzer';

// Rules
import { RuleRegistry, RuleEngine } from '../src/core/reasoning/rules/RuleEngine';
import { StateOwnerRule } from '../src/core/reasoning/rules/roles/StateOwnerRule';
import { AuthorityRule } from '../src/core/reasoning/rules/authority/AuthorityRule';
import { DataPipelineRule } from '../src/core/reasoning/rules/flow/DataPipelineRule';
import { BoundaryRule } from '../src/core/reasoning/rules/boundary/BoundaryRule';
import { CriticalityRule } from '../src/core/reasoning/rules/criticality/CriticalityRule';
import { ExtensionRule } from '../src/core/reasoning/rules/extension/ExtensionRule';
import { BlastRadiusRule } from '../src/core/reasoning/rules/blast/BlastRadiusRule';

// Answer Engine
import { AnswerEngine } from '../src/core/reasoning/answers/AnswerEngine';
import { Q1EntryPointAggregator } from '../src/core/reasoning/answers/aggregators/Q1EntryPointAggregator';
import { Q2AuthorityAggregator } from '../src/core/reasoning/answers/aggregators/Q2AuthorityAggregator';
import { Q3CriticalityAggregator } from '../src/core/reasoning/answers/aggregators/Q3CriticalityAggregator';
import { Q4ExtensionAggregator } from '../src/core/reasoning/answers/aggregators/Q4ExtensionAggregator';
import { Q5BlastRadiusAggregator } from '../src/core/reasoning/answers/aggregators/Q5BlastRadiusAggregator';
import { Q6BoundaryAggregator } from '../src/core/reasoning/answers/aggregators/Q6BoundaryAggregator';
import { Q7DataFlowAggregator } from '../src/core/reasoning/answers/aggregators/Q7DataFlowAggregator';
import { Q8ControlFlowAggregator } from '../src/core/reasoning/answers/aggregators/Q8ControlFlowAggregator';

function run() {
    const dataPath = path.join(__dirname, '../demo/data/project_state.json');
    if (!fs.existsSync(dataPath)) {
        console.error('project_state.json not found!');
        process.exit(1);
    }

    const state = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`[DEBUG] state.nodes length: ${state.nodes ? state.nodes.length : 'undefined'}`);
    let graph = new GraphModel();
    graph.loadFrom(state);

    console.log(`[SYNAPSE] Loaded real AST graph: ${graph.createSnapshot().nodes.length} nodes, ${graph.createSnapshot().edges.length} edges.`);

    // 1. Run Architecture IR Builder (Promote AST -> Semantic Edges)
    const irBuilder = new ArchitectureIrBuilder();
    const { enrichedGraph, rejectedReports, audit } = irBuilder.build(graph);
    graph = enrichedGraph;

    console.log(`\n=== Architecture IR Audit ===`);
    console.log(`Candidates Found : ${audit.candidateCount}`);
    console.log(`Promoted Edges   : ${audit.promotedCount} (${Object.entries(audit.promotedByType).map(([k,v]) => `${k}:${v}`).join(', ')})`);
    console.log(`Rejected Edges   : ${audit.rejectedCount} (${Object.entries(audit.rejectedByCategory).map(([k,v]) => `${k}:${v}`).join(', ')})\n`);
    
    // Detailed Audit
    const allEdges = enrichedGraph.createSnapshot().edges;
    
    const definesPayload = allEdges.filter(e => e.type === 'DEFINES_PAYLOAD').sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    console.log(`\n=================================`);
    console.log(`Top 50 DEFINES_PAYLOAD`);
    console.log(`=================================`);
    definesPayload.slice(0, 50).forEach((e, i) => {
        console.log(`${i+1}. [${(e.confidence || 0).toFixed(2)}] ${e.from}`);
    });

    const managesState = allEdges.filter(e => e.type === 'MANAGES_STATE').sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    console.log(`\n=================================`);
    console.log(`Top 50 MANAGES_STATE`);
    console.log(`=================================`);
    managesState.slice(0, 50).forEach((e, i) => {
        console.log(`${i+1}. [${(e.confidence || 0).toFixed(2)}] ${e.from}`);
    });

    const crossesBoundary = allEdges.filter(e => e.type === 'CROSSES_BOUNDARY').sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    console.log(`\n=================================`);
    console.log(`Top 50 CROSSES_BOUNDARY`);
    console.log(`=================================`);
    crossesBoundary.slice(0, 50).forEach((e, i) => {
        console.log(`${i+1}. [${(e.confidence || 0).toFixed(2)}] ${e.from} -> ${e.to}`);
    });

    console.log(`\n=================================`);
    console.log(`Top 50 REJECTED Candidates`);
    console.log(`=================================`);
    rejectedReports.sort((a, b) => b.finalScore - a.finalScore).slice(0, 50).forEach((r, i) => {
        console.log(`${i+1}. [${r.finalScore.toFixed(2)}] ${r.sourceId} (${r.proposedEdgeType})`);
        console.log(`   Reason: ${r.rejectReason}`);
    });

    console.log('==============================\n');

    // Initialize Reasoning Engine Components
    const roleAnalyzer = new RoleAnalyzer();
    const authorityAnalyzer = new AuthorityAnalyzer();
    const flowAnalyzer = new FlowAnalyzer();
    const boundaryAnalyzer = new BoundaryAnalyzer();
    const extensionAnalyzer = new ExtensionAnalyzer();

    const ruleRegistry = new RuleRegistry();
    ruleRegistry.register(new StateOwnerRule());
    ruleRegistry.register(new AuthorityRule());
    ruleRegistry.register(new DataPipelineRule());
    ruleRegistry.register(new BoundaryRule());
    ruleRegistry.register(new CriticalityRule());
    ruleRegistry.register(new ExtensionRule());
    ruleRegistry.register(new BlastRadiusRule());
    const ruleEngine = new RuleEngine(ruleRegistry);

    const criticalityAnalyzer = new CriticalityAnalyzer();
    const blastRadiusAnalyzer = new BlastRadiusAnalyzer();

    const answerEngine = new AnswerEngine();
    answerEngine.register(new Q1EntryPointAggregator());
    answerEngine.register(new Q2AuthorityAggregator());
    answerEngine.register(new Q3CriticalityAggregator());
    answerEngine.register(new Q4ExtensionAggregator());
    answerEngine.register(new Q5BlastRadiusAggregator());
    answerEngine.register(new Q6BoundaryAggregator());
    answerEngine.register(new Q7DataFlowAggregator());
    answerEngine.register(new Q8ControlFlowAggregator());

    let snapshot = new ReasoningSnapshot();
    let findings: any[] = [];

    console.log('[SYNAPSE] Running Reasoning Pipeline...');
    try {
        // Pass 1: Raw Structural Evidence
        if (typeof (roleAnalyzer as any).analyze === 'function') snapshot = (roleAnalyzer as any).analyze(snapshot, [], graph);
        if (typeof (authorityAnalyzer as any).analyze === 'function') snapshot = (authorityAnalyzer as any).analyze(snapshot, [], graph);
        if (typeof (flowAnalyzer as any).analyze === 'function') snapshot = (flowAnalyzer as any).analyze(snapshot, [], graph);
        if (typeof (boundaryAnalyzer as any).analyze === 'function') snapshot = (boundaryAnalyzer as any).analyze(snapshot, [], graph);
        if (typeof (extensionAnalyzer as any).analyze === 'function') snapshot = (extensionAnalyzer as any).analyze(snapshot, [], graph);

        // Pass 2: Base Findings
        findings = ruleEngine.execute(snapshot);

        // Pass 3: Higher Order Evidence (Criticality)
        if (typeof (criticalityAnalyzer as any).analyze === 'function') snapshot = (criticalityAnalyzer as any).analyze(snapshot, findings, graph);

        // Pass 4: Criticality Findings (CORE)
        findings = ruleEngine.execute(snapshot);

        // Pass 5: Higher Order Evidence (Blast Radius)
        if (typeof (blastRadiusAnalyzer as any).analyze === 'function') snapshot = (blastRadiusAnalyzer as any).analyze(snapshot, findings);

        // Pass 6: Final Findings
        findings = ruleEngine.execute(snapshot);

        // Produce Answers
        const answers = answerEngine.execute(snapshot, findings);

        // Dump Findings and Evidence for debugging
        fs.writeFileSync(path.join(__dirname, '../findings_dump.json'), JSON.stringify(findings, null, 2));
        fs.writeFileSync(path.join(__dirname, '../evidence_dump.json'), JSON.stringify(snapshot.getAllEvidence(), null, 2));

        // Format output
        let output = `# SYNAPSE Reasoning Report\n\n`;

        output += `## Graph Stats\n`;
        output += `- Nodes: ${graph.createSnapshot().nodes.length}\n`;
        output += `- Edges: ${graph.createSnapshot().edges.length}\n\n`;

        output += `## Q1~Q8 Answers\n\n`;
        for (const answer of answers) {
            output += `### ${answer.questionId}: ${answer.questionText}\n`;
            output += `**Summary**: ${answer.summary}\n`;
            output += `**Confidence**: ${answer.confidence}\n\n`;
            
            if (answer.items && answer.items.length > 0) {
                output += `#### Items:\n`;
                for (const item of answer.items) {
                    output += `- **${item.targetId}** (Score: ${item.score}): ${item.explanation}\n`;
                }
                output += `\n`;
            }
        }

        fs.writeFileSync(path.join(__dirname, '../reasoning_report.md'), output);
        console.log('[SYNAPSE] Report generated at reasoning_report.md');
    } catch (e) {
        console.error('Pipeline failed', e);
    }
}

run();
