import { GraphModel } from '../src/core/GraphModel';
import { RoleAnalyzer } from '../src/core/reasoning/analysis/RoleAnalyzer';
import { AuthorityAnalyzer } from '../src/core/reasoning/analysis/AuthorityAnalyzer';
import { FlowAnalyzer } from '../src/core/reasoning/analysis/FlowAnalyzer';
import { BoundaryAnalyzer } from '../src/core/reasoning/analysis/BoundaryAnalyzer';
import { CriticalityAnalyzer } from '../src/core/reasoning/analysis/CriticalityAnalyzer';
import { ExtensionAnalyzer } from '../src/core/reasoning/analysis/ExtensionAnalyzer';
import { BlastRadiusAnalyzer } from '../src/core/reasoning/analysis/BlastRadiusAnalyzer';
import { RuleRegistry, RuleEngine } from '../src/core/reasoning/rules/RuleEngine';
import { StateOwnerRule } from '../src/core/reasoning/rules/roles/StateOwnerRule';
import { AuthorityRule } from '../src/core/reasoning/rules/authority/AuthorityRule';
import { DataPipelineRule } from '../src/core/reasoning/rules/flow/DataPipelineRule';
import { BoundaryRule } from '../src/core/reasoning/rules/boundary/BoundaryRule';
import { CriticalityRule } from '../src/core/reasoning/rules/criticality/CriticalityRule';
import { ExtensionRule } from '../src/core/reasoning/rules/extension/ExtensionRule';
import { BlastRadiusRule } from '../src/core/reasoning/rules/blast/BlastRadiusRule';
import { AnswerEngine } from '../src/core/reasoning/answers/AnswerEngine';
import { Q1EntryPointAggregator } from '../src/core/reasoning/answers/aggregators/Q1EntryPointAggregator';
import { Q2AuthorityAggregator } from '../src/core/reasoning/answers/aggregators/Q2AuthorityAggregator';
import { Q3CriticalityAggregator } from '../src/core/reasoning/answers/aggregators/Q3CriticalityAggregator';
import { Q4ExtensionAggregator } from '../src/core/reasoning/answers/aggregators/Q4ExtensionAggregator';
import { Q5BlastRadiusAggregator } from '../src/core/reasoning/answers/aggregators/Q5BlastRadiusAggregator';
import { Q6BoundaryAggregator } from '../src/core/reasoning/answers/aggregators/Q6BoundaryAggregator';
import { Q7DataFlowAggregator } from '../src/core/reasoning/answers/aggregators/Q7DataFlowAggregator';
import { Q8ControlFlowAggregator } from '../src/core/reasoning/answers/aggregators/Q8ControlFlowAggregator';
import { ReasoningSnapshot } from '../src/core/reasoning/snapshot/ReasoningSnapshot';
import { EvidenceCategory, IEvidence } from '../src/core/reasoning/evidence/Evidence';

/**
 * Constructs the definitive Ground Truth Graph for Phase 9 E2E Testing.
 * This graph embeds specific structural traps to validate the Reasoning Engine's logic.
 */
export function buildMockSynapseGraph(): GraphModel {
    const graph = new GraphModel();

    // ---------------------------------------------------------
    // Node Definitions
    // ---------------------------------------------------------

    // 1. Entry Points
    graph.addNode({ id: 'CanvasPanel', type: 'entry', dependencies: [] });
    
    // 2. Core Controllers
    graph.addNode({ id: 'CanvasEngine', type: 'controller', dependencies: [] });
    graph.addNode({ id: 'RuleEngine', type: 'controller', dependencies: [] });
    
    // 3. Authority Hub (GraphModel)
    graph.addNode({ id: 'GraphModel', type: 'core', dependencies: [] });
    
    // 4. Payload / State (GraphSchema) - LOW fan-in, HIGH criticality
    graph.addNode({ id: 'GraphSchema', type: 'state', dependencies: [] });

    // 5. Utilities & Traps
    graph.addNode({ id: 'Logger', type: 'utility', dependencies: [] });
    graph.addNode({ id: 'ThemeManager', type: 'utility', dependencies: [] });

    // 6. Extension Points
    graph.addNode({ id: 'IScanner', type: 'interface', dependencies: [] });
    graph.addNode({ id: 'FileScanner', type: 'implementation', dependencies: [] });
    graph.addNode({ id: 'AstScanner', type: 'implementation', dependencies: [] });
    graph.addNode({ id: 'IRule', type: 'interface', dependencies: [] });
    graph.addNode({ id: 'BlastRadiusRule', type: 'implementation', dependencies: [] });
    graph.addNode({ id: 'DataPipelineRule', type: 'implementation', dependencies: [] });

    // 7. Data Pipelines
    graph.addNode({ id: 'DataPipeline', type: 'pipeline', dependencies: [] });

    // 8. False CORE Trap (High fan-in/fan-out, but SUPPORTING, not CORE)
    graph.addNode({ id: 'ConfigManager', type: 'utility', dependencies: [] });

    // 9. Trap A: MegaUtility (Massive fan-in/fan-out, NO payload, NO boundary)
    graph.addNode({ id: 'MegaUtility', type: 'utility', dependencies: [] });

    // 10. Trap B: TinySchema (Tiny fan-in/fan-out, YES payload)
    graph.addNode({ id: 'TinySchema', type: 'state', dependencies: [] });

    // ---------------------------------------------------------
    // Edge Definitions (The Ground Truth Logic)
    // ---------------------------------------------------------

    // Control Flow: CanvasPanel -> CanvasEngine -> RuleEngine
    graph.addEdge({ source: 'CanvasPanel', target: 'CanvasEngine', type: 'CALLS' });
    graph.addEdge({ source: 'CanvasEngine', target: 'RuleEngine', type: 'CALLS' });

    // Data Flow: FileScanner -> DataPipeline -> GraphModel
    graph.addEdge({ source: 'FileScanner', target: 'DataPipeline', type: 'PRODUCES' });
    graph.addEdge({ source: 'DataPipeline', target: 'GraphModel', type: 'MODIFIES' });

    // Authority Trap: GraphModel has multiple inbound dependencies from important pipelines
    graph.addEdge({ source: 'RuleEngine', target: 'GraphModel', type: 'DEPENDS_ON' });
    graph.addEdge({ source: 'CanvasEngine', target: 'GraphModel', type: 'DEPENDS_ON' });

    // Payload Trap: GraphSchema has low fan-in, but owns the payload logic for pipelines
    graph.addEdge({ source: 'DataPipeline', target: 'GraphSchema', type: 'DEPENDS_ON' }); 
    graph.addEdge({ source: 'GraphModel', target: 'GraphSchema', type: 'DEPENDS_ON' });

    // Utility Trap: Logger / ThemeManager have high fan-in
    const allConsumers = ['CanvasPanel', 'CanvasEngine', 'RuleEngine', 'DataPipeline', 'FileScanner', 'AstScanner'];
    for (const consumer of allConsumers) {
        graph.addEdge({ source: consumer, target: 'Logger', type: 'DEPENDS_ON' });
    }
    graph.addEdge({ source: 'CanvasPanel', target: 'ThemeManager', type: 'DEPENDS_ON' });
    graph.addEdge({ source: 'CanvasEngine', target: 'ThemeManager', type: 'DEPENDS_ON' });

    // False CORE Trap: ConfigManager has high fan-in and fan-out
    for (const consumer of allConsumers) {
        graph.addEdge({ source: consumer, target: 'ConfigManager', type: 'DEPENDS_ON' });
    }
    graph.addEdge({ source: 'ConfigManager', target: 'ThemeManager', type: 'DEPENDS_ON' });
    graph.addEdge({ source: 'ConfigManager', target: 'Logger', type: 'DEPENDS_ON' });

    // Extension Trap: Interfaces implemented by multiple nodes
    graph.addEdge({ source: 'FileScanner', target: 'IScanner', type: 'IMPLEMENTS' });
    graph.addEdge({ source: 'AstScanner', target: 'IScanner', type: 'IMPLEMENTS' });
    graph.addEdge({ source: 'BlastRadiusRule', target: 'IRule', type: 'IMPLEMENTS' });
    graph.addEdge({ source: 'DataPipelineRule', target: 'IRule', type: 'IMPLEMENTS' });

    // Trap A: MegaUtility (Fan-in = 20, Fan-out = 20, No Payload)
    for (let i = 0; i < 20; i++) {
        const mockConsumer = `MockConsumer${i}`;
        const mockDep = `MockDependency${i}`;
        graph.addNode({ id: mockConsumer, type: 'utility', dependencies: [] });
        graph.addNode({ id: mockDep, type: 'utility', dependencies: [] });
        graph.addEdge({ source: mockConsumer, target: 'MegaUtility', type: 'DEPENDS_ON' });
        graph.addEdge({ source: 'MegaUtility', target: mockDep, type: 'DEPENDS_ON' });
    }

    // Trap B: TinySchema (Tiny fan-in/fan-out, YES payload)
    graph.addNode({ id: 'TinyConsumer', type: 'utility', dependencies: [] });
    graph.addNode({ id: 'TinyPipeline', type: 'pipeline', dependencies: [] });
    graph.addEdge({ source: 'TinyConsumer', target: 'TinySchema', type: 'DEPENDS_ON' });
    graph.addEdge({ source: 'TinyPipeline', target: 'TinySchema', type: 'DEPENDS_ON' });

    // False Extension Trap: PseudoInterface (High fan-in, named like interface, but 0 IMPLEMENTS)
    graph.addNode({ id: 'PseudoInterface', type: 'utility', dependencies: [] });
    for (let i = 0; i < 5; i++) {
        const mockCaller = `PseudoCaller${i}`;
        graph.addNode({ id: mockCaller, type: 'controller', dependencies: [] });
        graph.addEdge({ source: mockCaller, target: 'PseudoInterface', type: 'DEPENDS_ON' });
    }

    return graph;
}

function runE2EValidation() {
    console.log('=== Phase 9 E2E Validation ===\\n');
    let passed = 0;
    let failed = 0;

    function assertPass(testName: string, pass: boolean, errorMessage: string) {
        if (pass) {
            console.log(`✅ [${testName}] Passed.`);
            passed++;
        } else {
            console.error(`❌ [${testName}] Failed: ${errorMessage}`);
            failed++;
        }
    }

    const graph = buildMockSynapseGraph();

    // 0. Run Architecture IR Builder (Promote AST -> Semantic Edges)
    const { ArchitectureIrBuilder } = require('../src/core/ir/ArchitectureIrBuilder');
    const irBuilder = new ArchitectureIrBuilder();
    const { enrichedGraph, rejectedReports, audit } = irBuilder.build(graph);
    
    console.log(`[IR Builder] Candidates: ${audit.candidateCount}, Promoted: ${audit.promotedCount}, Rejected: ${audit.rejectedCount}`);
    
    // Provenance Replay Test
    const graphSchemaEdge = enrichedGraph.createSnapshot().edges.find((e: any) => e.from === 'GraphSchema' || e.to === 'GraphSchema');
    const graphSchemaPromoted = enrichedGraph.createSnapshot().edges.find((e: any) => e.type === 'DEFINES_PAYLOAD' && e.from === 'GraphSchema');
    if (graphSchemaPromoted) {
        console.log(`✅ [Provenance Replay] GraphSchema was promoted to DEFINES_PAYLOAD.`);
        console.log(`   Reasons:`, graphSchemaPromoted.data?.promotionReasons);
    } else {
        console.error(`❌ [Provenance Replay] GraphSchema failed to promote!`);
        console.error(`   Reject Reason:`, rejectedReports.find((r: any) => r.candidateId.includes('GraphSchema'))?.rejectReason);
    }

    const loggerRejected = rejectedReports.find((r: any) => r.candidateId.includes('Logger'));
    if (loggerRejected) {
        console.log(`✅ [Provenance Replay] Logger was rejected. Reason: ${loggerRejected.rejectReason}`);
    } else {
        // Not a candidate or failed to log
    }

    // Setup Pipeline
    let snapshot = new ReasoningSnapshot();
    
    // Core structural analyzers
    const roleAnalyzer = new RoleAnalyzer();
    const flowAnalyzer = new FlowAnalyzer();
    const boundaryAnalyzer = new BoundaryAnalyzer();
    const extensionAnalyzer = new ExtensionAnalyzer();
    
    // Rule Engine
    const ruleRegistry = new RuleRegistry();
    ruleRegistry.register(new StateOwnerRule());
    ruleRegistry.register(new AuthorityRule());
    ruleRegistry.register(new DataPipelineRule());
    ruleRegistry.register(new BoundaryRule());
    ruleRegistry.register(new CriticalityRule());
    ruleRegistry.register(new ExtensionRule());
    ruleRegistry.register(new BlastRadiusRule());
    const ruleEngine = new RuleEngine(ruleRegistry);

    // Higher order analyzers
    const criticalityAnalyzer = new CriticalityAnalyzer();
    const blastRadiusAnalyzer = new BlastRadiusAnalyzer();

    const answerEngine = new AnswerEngine();
    // (Registers omitted for brevity as they are unmodified below...)
    answerEngine.register(new Q1EntryPointAggregator());
    answerEngine.register(new Q2AuthorityAggregator());
    answerEngine.register(new Q3CriticalityAggregator());
    answerEngine.register(new Q4ExtensionAggregator());
    answerEngine.register(new Q5BlastRadiusAggregator());
    answerEngine.register(new Q6BoundaryAggregator());
    answerEngine.register(new Q7DataFlowAggregator());
    answerEngine.register(new Q8ControlFlowAggregator());

    console.log('\\n--- Pipeline Execution ---');
    let findings: any[] = [];
    let pipelineSucceeded = false;
    try {
        // Pass 1: Raw Structural Evidence
        if (typeof (roleAnalyzer as any).analyze === 'function') snapshot = (roleAnalyzer as any).analyze(snapshot, [], graph);
        if (typeof (flowAnalyzer as any).analyze === 'function') snapshot = (flowAnalyzer as any).analyze(snapshot, [], graph);
        if (typeof (boundaryAnalyzer as any).analyze === 'function') snapshot = (boundaryAnalyzer as any).analyze(snapshot, [], graph);
        if (typeof (extensionAnalyzer as any).analyze === 'function') snapshot = (extensionAnalyzer as any).analyze(snapshot, [], graph);

        // Pass 2: Base Findings (Roles, Flows)
        findings = ruleEngine.execute(snapshot);

        // Pass 3: Higher Order Evidence (Criticality)
        if (typeof (criticalityAnalyzer as any).analyze === 'function') snapshot = (criticalityAnalyzer as any).analyze(snapshot, findings, graph);

        // Pass 4: Criticality Findings (CORE)
        findings = ruleEngine.execute(snapshot);

        // Pass 5: Higher Order Evidence (Blast Radius)
        if (typeof (blastRadiusAnalyzer as any).analyze === 'function') snapshot = (blastRadiusAnalyzer as any).analyze(snapshot, findings);

        // Pass 6: Final Findings (BLAST_RADIUS)
        findings = ruleEngine.execute(snapshot);

        console.log('\n--- DEBUG: GraphSchema Criticality Evidence ---');
        console.dir(
            snapshot.getAllEvidence().filter(
                e => e.nodeId === 'GraphSchema' && e.category === EvidenceCategory.CRITICALITY
            ),
            { depth: 10 }
        );

        console.log('\n--- DEBUG: GraphSchema Findings After Pass4 ---');
        console.dir(
            findings.filter(f => f.targetIds.includes('GraphSchema')),
            { depth: 10 }
        );

        console.log('\n--- DEBUG: ConfigManager Criticality Evidence ---');
        console.dir(
            snapshot.getAllEvidence().filter(
                e => e.nodeId === 'ConfigManager' && e.category === EvidenceCategory.CRITICALITY
            ),
            { depth: 10 }
        );

        console.log('\n--- DEBUG: ConfigManager Findings After Pass4 ---');
        console.dir(
            findings.filter(f => f.targetIds.includes('ConfigManager') && f.type === 'CORE'),
            { depth: 10 }
        );

        pipelineSucceeded = true;
    } catch (err) {
        console.error('Pipeline Execution Failed', err);
    }

    assertPass('Pipeline Execution', pipelineSucceeded, 'Pipeline crashed during execution');

    if (!pipelineSucceeded) {
        console.log(`\\nResults: ${passed} Passed, ${failed} Failed.`);
        process.exit(1);
    }

    // ---------------------------------------------------------
    // Tier 1.5: Intermediate Findings (RoleRule Output)
    // ---------------------------------------------------------
    console.log('\\n--- Tier 1.5: Intermediate Findings Layer ---');
    const schemaStateOwner = findings.find(f => f.targetIds.includes('GraphSchema') && f.type === 'STATE_OWNER');
    const tinyStateOwner = findings.find(f => f.targetIds.includes('TinySchema') && f.type === 'STATE_OWNER');
    const megaStateOwner = findings.find(f => f.targetIds.includes('MegaUtility') && f.type === 'STATE_OWNER');

    assertPass('GraphSchema STATE_OWNER', !!schemaStateOwner, 'RoleRule failed to classify GraphSchema as STATE_OWNER');
    assertPass('TinySchema STATE_OWNER', !!tinyStateOwner, 'RoleRule failed to classify TinySchema as STATE_OWNER');
    assertPass('MegaUtility NOT STATE_OWNER', !megaStateOwner, 'RoleRule incorrectly classified MegaUtility as STATE_OWNER');

    // ---------------------------------------------------------
    // Tier 2: Higher-Order Evidence Assertions (Criticality)
    // ---------------------------------------------------------
    console.log('\\n--- Tier 2: Higher-Order Evidence Layer ---');
    
    const schemaEvidence = snapshot.getAllEvidence().find(e => e.nodeId === 'GraphSchema' && e.category === EvidenceCategory.CRITICALITY);
    const tinySchemaEvidence = snapshot.getAllEvidence().find(e => e.nodeId === 'TinySchema' && e.category === EvidenceCategory.CRITICALITY);
    const megaUtilityEvidence = snapshot.getAllEvidence().find(e => e.nodeId === 'MegaUtility' && e.category === EvidenceCategory.CRITICALITY);

    assertPass('GraphSchema isStateOwner', (schemaEvidence as any)?.metadata?.isStateOwner === true, 'GraphSchema should be identified as isStateOwner=true');
    assertPass('TinySchema isStateOwner', (tinySchemaEvidence as any)?.metadata?.isStateOwner === true, 'TinySchema should be identified as isStateOwner=true');
    assertPass('MegaUtility NOT isStateOwner', !(megaUtilityEvidence as any)?.metadata?.isStateOwner, 'MegaUtility should NOT be a state owner');

    // ---------------------------------------------------------
    // Tier 2: Finding Assertions
    // ---------------------------------------------------------
    console.log('\\n--- Tier 2: Finding Layer ---');
    // We simulate Rule Engine execution based on evidence
    findings = ruleEngine.execute(snapshot);

    const schemaFinding = findings.find(f => f.targetIds.includes('GraphSchema') && f.type === 'CORE');
    assertPass('Rule Generated', schemaFinding !== undefined, 'Rule Engine failed to generate CORE finding for GraphSchema');
    assertPass('Rule Type (CORE)', schemaFinding?.type === 'CORE', 'GraphSchema must be CORE');

    // ---------------------------------------------------------
    // Tier 2.5: Negative Ground Truth Assertions
    // ---------------------------------------------------------
    console.log('\n--- Tier 2.5: Negative Ground Truth Layer ---');
    const megaCore = findings.find(f => f.targetIds.includes('MegaUtility') && f.type === 'CORE');
    const configCore = findings.find(f => f.targetIds.includes('ConfigManager') && f.type === 'CORE');
    const loggerCore = findings.find(f => f.targetIds.includes('Logger') && f.type === 'CORE');
    const pseudoExtension = findings.find(f => f.targetIds.includes('PseudoInterface') && f.type === 'EXTENSION_POINT');
    
    assertPass('MegaUtility NOT CORE', megaCore === undefined, 'MegaUtility incorrectly classified as CORE');
    assertPass('ConfigManager NOT CORE', configCore === undefined, 'ConfigManager incorrectly classified as CORE');
    assertPass('Logger NOT CORE', loggerCore === undefined, 'Logger incorrectly classified as CORE');
    assertPass('PseudoInterface NOT EXTENSION', pseudoExtension === undefined, 'PseudoInterface incorrectly classified as EXTENSION_POINT');

    // ---------------------------------------------------------
    // Tier 3: Answer Assertions
    // ---------------------------------------------------------
    console.log('\\n--- Tier 3: Answer Layer ---');
    // We simulate answer generation
    const answers = answerEngine.execute(snapshot, findings);
    
    const q3 = answers.find(a => a.questionId === 'Q3');
    assertPass('Q3 answers generated', q3 !== undefined, 'Q3 aggregator did not return an answer');
    assertPass('Q3 contains GraphSchema as CORE', q3?.items.some(i => i.targetId === 'GraphSchema' && i.score === 3) === true, 'GraphSchema should be in Q3 as CORE');

    const q5 = answers.find(a => a.questionId === 'Q5');
    assertPass('Q5 answers generated', q5 !== undefined, 'Q5 aggregator did not return an answer');
    assertPass('Q5 contains GraphSchema as CRITICAL/HIGH', q5?.items.some(i => i.targetId === 'GraphSchema' && i.score >= 3) === true, 'GraphSchema should be in Q5 with high severity');

    console.log(`\\nResults: ${passed} Passed, ${failed} Failed.`);
    if (failed > 0) process.exit(1);
}

if (require.main === module) {
    runE2EValidation();
}
