import { GraphModel } from '../src/core/GraphModel';
import { ReasoningSnapshot } from '../src/core/reasoning/snapshot/ReasoningSnapshot';
import { BlastRadiusAnalyzer } from '../src/core/reasoning/analysis/BlastRadiusAnalyzer';
import { RuleRegistry, RuleEngine } from '../src/core/reasoning/rules/RuleEngine';
import { BlastRadiusRule } from '../src/core/reasoning/rules/blast/BlastRadiusRule';
import { Finding } from '../src/core/reasoning/rules/Rule';
import { EvidenceCategory } from '../src/core/reasoning/evidence/Evidence';

function runPhase8Validation() {
    console.log('=== Phase 8 Blast Radius Validation ===\n');

    const analyzer = new BlastRadiusAnalyzer();
    const registry = new RuleRegistry();
    registry.register(new BlastRadiusRule());
    const ruleEngine = new RuleEngine(registry);

    let passed = 0;
    let failed = 0;

    function assertBlastRadius(testName: string, mockFindings: Finding[], targetNode: string, expectedSeverity: string, mockEvidence: any[] = []) {
        // Run analysis on findings
        const snap = analyzer.analyze(new ReasoningSnapshot('snap-1', Date.now(), mockEvidence), mockFindings);
        
        // Run rule
        const finalFindings = ruleEngine.execute(snap);
        const blastFinding = finalFindings.find(f => f.type === 'BLAST_RADIUS' && f.targetIds.includes(targetNode));

        if (!blastFinding) {
            console.error(`❌ [${testName}] Failed: No BLAST_RADIUS finding generated for ${targetNode}.`);
            failed++;
            return;
        }

        const severityMatch = blastFinding.explanation.match(/^\[(.*?)\]/);
        const severity = severityMatch ? severityMatch[1] : 'UNKNOWN';

        if (severity !== expectedSeverity) {
            console.error(`❌ [${testName}] Failed: Expected ${expectedSeverity}, got ${severity} for ${targetNode}.`);
            failed++;
        } else {
            console.log(`✅ [${testName}] Passed. (${targetNode} -> ${severity})`);
            passed++;
        }
    }

    // 1. Hidden Blast Test
    assertBlastRadius('Hidden Blast Test', [
        { id: 'f-core-1', type: 'CORE', confidence: 1, evidenceIds: [], ruleId: 'r1', summary: '', explanation: '', targetType: 'NODE', targetIds: ['GraphSchema'] },
        { id: 'f-pipe-1', type: 'DATA_PIPELINE', confidence: 1, evidenceIds: [], ruleId: 'r2', summary: '', explanation: '', targetType: 'NODE', targetIds: ['GraphSchema'] }
    ], 'GraphSchema', 'CRITICAL', [{
        id: 'e-crit-1', category: EvidenceCategory.CRITICALITY, nodeId: 'GraphSchema', description: '', metadata: { isStateOwner: true }
    }]);

    // 2. Utility Immunity Test
    assertBlastRadius('Utility Immunity Test', [
        { id: 'f-util-1', type: 'UTILITY', confidence: 1, evidenceIds: [], ruleId: 'r1', summary: '', explanation: '', targetType: 'NODE', targetIds: ['Logger'] }
    ], 'Logger', 'LOW');

    // 3. Boundary Collapse Test
    // Adapter bridges boundaries (is BOUNDARY_CROSSER) but is a SUPPORTING node.
    assertBlastRadius('Boundary Collapse Test', [
        { id: 'f-sup-1', type: 'SUPPORTING', confidence: 1, evidenceIds: [], ruleId: 'r1', summary: '', explanation: '', targetType: 'NODE', targetIds: ['Adapter'] },
        { id: 'f-cross-1', type: 'BOUNDARY_CROSSER', confidence: 1, evidenceIds: [], ruleId: 'r2', summary: '', explanation: '', targetType: 'NODE', targetIds: ['Adapter'] }
    ], 'Adapter', 'HIGH');

    // 4. Extension Collapse Test
    // IRule is a CORE extension point -> CRITICAL
    assertBlastRadius('Extension Collapse Test', [
        { id: 'f-core-2', type: 'CORE', confidence: 1, evidenceIds: [], ruleId: 'r1', summary: '', explanation: '', targetType: 'NODE', targetIds: ['IRule'] },
        { id: 'f-ext-1', type: 'EXTENSION_POINT', confidence: 1, evidenceIds: ['e-ext-1'], ruleId: 'r2', summary: '', explanation: '', targetType: 'NODE', targetIds: ['IRule'] }
    ], 'IRule', 'CRITICAL', [{
        id: 'e-ext-1', category: EvidenceCategory.EXTENSION, nodeId: 'IRule', description: '', metadata: { implementationCount: 10 }
    }]);

    // 5. False Blast Test (ThemeManager)
    // High authority (implied by findings), but is SUPPORTING, NOT a crosser, NOT an extension point.
    // It DOES participate in a pipeline, but not critical enough.
    assertBlastRadius('False Blast Test', [
        { id: 'f-sup-2', type: 'SUPPORTING', confidence: 1, evidenceIds: [], ruleId: 'r1', summary: '', explanation: '', targetType: 'NODE', targetIds: ['ThemeManager'] },
        { id: 'f-pipe-2', type: 'DATA_PIPELINE', confidence: 1, evidenceIds: [], ruleId: 'r2', summary: '', explanation: '', targetType: 'NODE', targetIds: ['ThemeManager'] }
    ], 'ThemeManager', 'MEDIUM'); // SUPPORTING without crossing boundaries/extensions -> MEDIUM

    // 6. Cascading Contract Test
    // IContributionProvider has medium authority and medium criticality (SUPPORTING), but has 15 implementations (EXTENSION_POINT).
    assertBlastRadius('Cascading Contract Test', [
        { id: 'f-sup-3', type: 'SUPPORTING', confidence: 1, evidenceIds: [], ruleId: 'r1', summary: '', explanation: '', targetType: 'NODE', targetIds: ['IContributionProvider'] },
        { id: 'f-ext-2', type: 'EXTENSION_POINT', confidence: 1, evidenceIds: ['e-ext-2'], ruleId: 'r2', summary: '', explanation: '', targetType: 'NODE', targetIds: ['IContributionProvider'] }
    ], 'IContributionProvider', 'HIGH', [{
        id: 'e-ext-2', category: EvidenceCategory.EXTENSION, nodeId: 'IContributionProvider', description: '', metadata: { implementationCount: 15 }
    }]);

    console.log(`\nResults: ${passed} Passed, ${failed} Failed.`);
    if (failed > 0) process.exit(1);
}

runPhase8Validation();
