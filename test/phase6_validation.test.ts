import { GraphModel } from '../src/core/GraphModel';
import { Finding } from '../src/core/reasoning/rules/Rule';
import { ReasoningSnapshot } from '../src/core/reasoning/snapshot/ReasoningSnapshot';
import { CriticalityAnalyzer } from '../src/core/reasoning/analysis/CriticalityAnalyzer';
import { RuleRegistry, RuleEngine } from '../src/core/reasoning/rules/RuleEngine';
import { CriticalityRule } from '../src/core/reasoning/rules/criticality/CriticalityRule';

function createMockFinding(id: string, type: string, targetId: string, confidence = 1.0): Finding {
    return {
        id,
        type,
        confidence,
        evidenceIds: [],
        ruleId: 'mock',
        summary: 'mock',
        explanation: 'mock',
        targetType: 'NODE',
        targetIds: [targetId]
    };
}

function runPhase6Validation() {
    console.log('=== Phase 6 Criticality Validation ===\n');

    const analyzer = new CriticalityAnalyzer();
    const registry = new RuleRegistry();
    registry.register(new CriticalityRule());
    const ruleEngine = new RuleEngine(registry);

    let passed = 0;
    let failed = 0;

    function assertCriticality(testName: string, mockFindings: Finding[], expectedTarget: string, expectedType: string) {
        const snap = analyzer.analyze(new ReasoningSnapshot('snap-1', Date.now(), []), mockFindings);
        const criticalityFindings = ruleEngine.execute(snap);

        const targetFinding = criticalityFindings.find(f => f.targetIds.includes(expectedTarget));

        if (!targetFinding) {
            console.error(`❌ [${testName}] Failed: No criticality finding for ${expectedTarget}`);
            failed++;
        } else if (targetFinding.type !== expectedType) {
            console.error(`❌ [${testName}] Failed: Expected ${expectedTarget} to be ${expectedType}, but got ${targetFinding.type}`);
            failed++;
        } else {
            console.log(`✅ [${testName}] Passed. (${expectedTarget} -> ${expectedType})`);
            passed++;
        }
    }

    // 1. Utility Inflation Test
    // Logger has massive authority, but no state/policy/pipelines.
    const f1 = [
        createMockFinding('f1_auth', 'DOMINANT_AUTHORITY', 'Logger', 0.95),
        createMockFinding('f1_island', 'BOUNDARY_ISLAND', 'Logger')
    ];
    assertCriticality('Utility Inflation Test', f1, 'Logger', 'UTILITY');

    // 2. Hidden Core Test
    // GraphSchema has low authority, but is state owner and participates in critical pipeline
    const f2 = [
        createMockFinding('f2_auth', 'MINOR_AUTHORITY', 'GraphSchema', 0.3),
        createMockFinding('f2_state', 'STATE_OWNER', 'GraphSchema'),
        createMockFinding('f2_pipe', 'DATA_PIPELINE', 'GraphSchema', 0.9)
    ];
    assertCriticality('Hidden Core Test', f2, 'GraphSchema', 'CORE');

    // 3. False Core Prevention Test
    // CacheManager has high authority and crosses boundary, but no state/policy/critical pipes
    const f3 = [
        createMockFinding('f3_auth', 'DOMINANT_AUTHORITY', 'CacheManager', 0.8),
        createMockFinding('f3_cross', 'BOUNDARY_CROSSER', 'CacheManager')
    ];
    assertCriticality('False Core Prevention Test', f3, 'CacheManager', 'SUPPORTING');

    console.log(`\nResults: ${passed} Passed, ${failed} Failed.`);
    if (failed > 0) process.exit(1);
}

runPhase6Validation();
