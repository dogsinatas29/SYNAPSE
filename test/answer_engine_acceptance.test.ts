import { AnswerEngine } from '../src/core/reasoning/answers/AnswerEngine';
import { Q1EntryPointAggregator } from '../src/core/reasoning/answers/aggregators/Q1EntryPointAggregator';
import { Q2AuthorityAggregator } from '../src/core/reasoning/answers/aggregators/Q2AuthorityAggregator';
import { Q3CriticalityAggregator } from '../src/core/reasoning/answers/aggregators/Q3CriticalityAggregator';
import { Q4ExtensionAggregator } from '../src/core/reasoning/answers/aggregators/Q4ExtensionAggregator';
import { Q5BlastRadiusAggregator } from '../src/core/reasoning/answers/aggregators/Q5BlastRadiusAggregator';
import { Q6BoundaryAggregator } from '../src/core/reasoning/answers/aggregators/Q6BoundaryAggregator';
import { Q7DataFlowAggregator } from '../src/core/reasoning/answers/aggregators/Q7DataFlowAggregator';
import { Q8ControlFlowAggregator } from '../src/core/reasoning/answers/aggregators/Q8ControlFlowAggregator';
import { Finding } from '../src/core/reasoning/rules/Rule';
import { ReasoningSnapshot } from '../src/core/reasoning/snapshot/ReasoningSnapshot';

// Helper to easily create findings
function createFinding(id: string, type: string, targetId: string, ruleId: string): Finding {
    return {
        id,
        type,
        confidence: 0.9,
        evidenceIds: [],
        ruleId,
        summary: `Found ${type} in ${targetId}`,
        explanation: `${targetId} is a ${type}`,
        targetType: 'NODE',
        targetIds: [targetId]
    };
}

function runAnswerEngineAcceptance() {
    console.log('=== Answer Engine Acceptance Validation ===\n');

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

    // ---------------------------------------------------------
    // Layer A: Mock Findings
    // ---------------------------------------------------------
    const findings: Finding[] = [
        // Q1 / Q8: Entry Points & Control Pipelines
        createFinding('f-cp-1', 'CONTROL_PIPELINE', 'CanvasPanel', 'rule-control-flow'),
        createFinding('f-cp-2', 'CONTROL_PIPELINE', 'CanvasEngine', 'rule-control-flow'),
        
        // Q2: Authority
        createFinding('f-auth-1', 'DOMINANT_AUTHORITY', 'GraphModel', 'rule-authority'),
        createFinding('f-auth-2', 'DOMINANT_AUTHORITY', 'RuleEngine', 'rule-authority'),
        createFinding('f-auth-3', 'MAJOR_AUTHORITY', 'CanvasEngine', 'rule-authority'),
        createFinding('f-auth-4', 'MAJOR_AUTHORITY', 'ThemeManager', 'rule-authority'), // ThemeManager is highly referenced

        // Q3: Criticality
        createFinding('f-crit-1', 'CORE', 'GraphSchema', 'rule-criticality'),
        createFinding('f-crit-2', 'CORE', 'GraphModel', 'rule-criticality'),
        createFinding('f-crit-3', 'UTILITY', 'Logger', 'rule-criticality'),
        createFinding('f-crit-4', 'UTILITY', 'ThemeManager', 'rule-criticality'),

        // Q4: Extension
        createFinding('f-ext-1', 'EXTENSION_POINT', 'IScanner', 'rule-extension'),
        createFinding('f-ext-2', 'EXTENSION_POINT', 'IRule', 'rule-extension'),

        // Q5: Blast Radius
        createFinding('f-blast-1', 'BLAST_RADIUS', 'GraphSchema', 'rule-blast'),
        createFinding('f-blast-2', 'BLAST_RADIUS', 'RuleEngine', 'rule-blast'),
        createFinding('f-blast-3', 'BLAST_RADIUS', 'Logger', 'rule-blast'),

        // Q6: Boundaries
        createFinding('f-bound-1', 'BOUNDARY', 'UI Boundary', 'rule-boundary'),
        createFinding('f-bound-2', 'BOUNDARY', 'Core Boundary', 'rule-boundary'),

        // Q7: Data Flow
        createFinding('f-dp-1', 'DATA_PIPELINE', 'FileScanner', 'rule-data-flow')
    ];

    findings.find(f => f.id === 'f-cp-1')!.explanation = "Path: CanvasPanel -> CanvasEngine -> RuleEngine";
    findings.find(f => f.id === 'f-cp-2')!.explanation = "Path: CanvasEngine -> RuleEngine";
    findings.find(f => f.id === 'f-dp-1')!.explanation = "Path: FileScanner -> DataPipeline -> GraphModel";
    
    // Simulate what the BlastRadiusAggregator expects in the finding explanation
    findings.find(f => f.id === 'f-blast-1')!.explanation = "[CRITICAL] CORE node defining payload";
    findings.find(f => f.id === 'f-blast-2')!.explanation = "[CRITICAL] Ecosystem Root";
    findings.find(f => f.id === 'f-blast-3')!.explanation = "[LOW] Utility Node";

    // ---------------------------------------------------------
    // Layer B: Answer Engine Execution
    // ---------------------------------------------------------
    console.log('\n--- Answer Engine Execution ---');
    const answerEngine = new AnswerEngine();
    answerEngine.register(new Q1EntryPointAggregator());
    answerEngine.register(new Q2AuthorityAggregator());
    answerEngine.register(new Q3CriticalityAggregator());
    answerEngine.register(new Q4ExtensionAggregator());
    answerEngine.register(new Q5BlastRadiusAggregator());
    answerEngine.register(new Q6BoundaryAggregator());
    answerEngine.register(new Q7DataFlowAggregator());
    answerEngine.register(new Q8ControlFlowAggregator());

    const snapshot = new ReasoningSnapshot('snap-gt', Date.now(), []);
    const answers = answerEngine.execute(snapshot, findings);

    // Q1 Entry Point
    const q1 = answers.find(a => a.questionId === 'Q1');
    assertPass('Q1 Present', !!q1, 'Q1 Answer is missing');
    if (q1) {
        assertPass('Q1 Target Inclusion', q1.summary.includes('CanvasPanel') || q1.explanation.includes('CanvasPanel'), 'CanvasPanel is not in Q1');
    }

    // Q2 Authority
    const q2 = answers.find(a => a.questionId === 'Q2');
    assertPass('Q2 Present', !!q2, 'Q2 Answer is missing');
    if (q2) {
        // Strict rank parsing: expects lines starting with "1. NodeName"
        const lines = q2.explanation.split('\\n');
        const ranks = lines.filter(l => l.match(/^\\d+\\./)).map(l => l.split('.')[1].trim().split(' ')[0]);
        
        const graphModelIndex = ranks.indexOf('GraphModel');
        const themeManagerIndex = ranks.indexOf('ThemeManager');
        
        assertPass('Q2 Top 3 Ranking', graphModelIndex !== -1 && graphModelIndex < 3, 'GraphModel is not in the Top 3 of Q2');
        assertPass('Q2 Relative Ranking', graphModelIndex !== -1 && (themeManagerIndex === -1 || graphModelIndex < themeManagerIndex), 'GraphModel did not outrank ThemeManager in Q2');
    }

    // Q3 Criticality
    const q3 = answers.find(a => a.questionId === 'Q3');
    assertPass('Q3 Present', !!q3, 'Q3 Answer is missing');
    if (q3) {
        assertPass('Q3 CORE Inclusion', q3.explanation.includes('GraphSchema'), 'GraphSchema not in CORE');
        assertPass('Q3 UTILITY Inclusion', q3.explanation.includes('Logger'), 'Logger not in UTILITY');
    }

    // Q4 Extension Points
    const q4 = answers.find(a => a.questionId === 'Q4');
    assertPass('Q4 Present', !!q4, 'Q4 Answer is missing');
    if (q4) {
        assertPass('Q4 Extension Inclusion', q4.summary.includes('IRule') || q4.explanation.includes('IRule'), 'IRule is not in Q4');
    }

    // Q5 Blast Radius
    const q5 = answers.find(a => a.questionId === 'Q5');
    assertPass('Q5 Present', !!q5, 'Q5 Answer is missing');
    if (q5) {
        // Strict bucket parsing
        let currentBucket = 'UNKNOWN';
        const buckets: Record<string, string[]> = { CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [] };
        
        const lines = q5.explanation.split('\\n');
        for (const line of lines) {
            const trimmedLine = line.trim();
            // Match headers robustly, e.g. "CRITICAL:" or "### CRITICAL"
            if (trimmedLine.match(/^(?:#+\\s*)?CRITICAL[:]?$/i)) currentBucket = 'CRITICAL';
            else if (trimmedLine.match(/^(?:#+\\s*)?HIGH[:]?$/i)) currentBucket = 'HIGH';
            else if (trimmedLine.match(/^(?:#+\\s*)?MEDIUM[:]?$/i)) currentBucket = 'MEDIUM';
            else if (trimmedLine.match(/^(?:#+\\s*)?LOW[:]?$/i)) currentBucket = 'LOW';
            else if (trimmedLine.startsWith('-')) {
                const nodeName = trimmedLine.replace('-', '').trim().split(' ')[0];
                if (buckets[currentBucket]) buckets[currentBucket].push(nodeName);
            }
        }

        assertPass('Q5 Critical GraphSchema', buckets['CRITICAL'].includes('GraphSchema'), 'GraphSchema is not listed under CRITICAL bucket');
        assertPass('Q5 Low Logger', buckets['LOW'].includes('Logger'), 'Logger is not listed under LOW bucket');
    }

    // Q6 Boundary
    const q6 = answers.find(a => a.questionId === 'Q6');
    assertPass('Q6 Present', !!q6, 'Q6 Answer is missing');
    if (q6) {
        assertPass('Q6 Boundary Inclusion', q6.explanation.includes('UI Boundary'), 'UI Boundary is not in Q6');
    }

    // Q7 Data Flow
    const q7 = answers.find(a => a.questionId === 'Q7');
    assertPass('Q7 Present', !!q7, 'Q7 Answer is missing');
    if (q7) {
        const corridors = q7.explanation.split('\\n').filter(l => l.trim().startsWith('- '));
        const uniqueCorridors = new Set(corridors);
        assertPass('Q7 Deduplication', corridors.length === uniqueCorridors.size, `Q7 contains duplicate corridors`);
        assertPass('Q7 Content', q7.explanation.includes('FileScanner -> DataPipeline -> GraphModel'), 'Missing canonical data flow');
    }

    // Q8 Control Flow
    const q8 = answers.find(a => a.questionId === 'Q8');
    assertPass('Q8 Present', !!q8, 'Q8 Answer is missing');
    if (q8) {
        const corridors = q8.explanation.split('\\n').filter(l => l.trim().startsWith('- '));
        const uniqueCorridors = new Set(corridors);
        assertPass('Q8 Deduplication', corridors.length === uniqueCorridors.size, `Q8 contains duplicate corridors`);
        assertPass('Q8 Content', q8.explanation.includes('CanvasPanel -> CanvasEngine -> RuleEngine'), 'Missing canonical control flow');
    }

    console.log(`\nResults: ${passed} Passed, ${failed} Failed.`);
    if (failed > 0) process.exit(1);
}

runAnswerEngineAcceptance();
