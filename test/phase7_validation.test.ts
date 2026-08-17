import { GraphModel } from '../src/core/GraphModel';
import { ReasoningSnapshot } from '../src/core/reasoning/snapshot/ReasoningSnapshot';
import { ExtensionAnalyzer } from '../src/core/reasoning/analysis/ExtensionAnalyzer';
import { RuleRegistry, RuleEngine } from '../src/core/reasoning/rules/RuleEngine';
import { ExtensionRule } from '../src/core/reasoning/rules/extension/ExtensionRule';

function runPhase7Validation() {
    console.log('=== Phase 7 Extension Point Validation ===\n');

    const analyzer = new ExtensionAnalyzer();
    const registry = new RuleRegistry();
    registry.register(new ExtensionRule());
    const ruleEngine = new RuleEngine(registry);

    let passed = 0;
    let failed = 0;

    function assertExtension(g: GraphModel, testName: string, targetInterface: string, shouldBeExtension: boolean) {
        const snap = analyzer.analyze(new ReasoningSnapshot('snap-1', Date.now(), []), g);
        const findings = ruleEngine.execute(snap);
        
        const extFinding = findings.find(f => f.type === 'EXTENSION_POINT' && f.targetIds.includes(targetInterface));

        if (shouldBeExtension && !extFinding) {
            console.error(`❌ [${testName}] Failed: Expected ${targetInterface} to be an EXTENSION_POINT.`);
            failed++;
        } else if (!shouldBeExtension && extFinding) {
            console.error(`❌ [${testName}] Failed: Expected ${targetInterface} NOT to be an EXTENSION_POINT, but got one.`);
            failed++;
        } else {
            console.log(`✅ [${testName}] Passed.`);
            passed++;
        }
    }

    // 1. Simple Abstraction Test (Negative)
    // ILogger has 2 impls but no active consumer/registry. Actually the rule says: (hasRegistry || injectedIntoCount > 0).
    // If it has consumers but no registry, it might be an extension if it's explicitly injected.
    // Let's test the true negative: ILogger injected into 1 place maybe, but 2 impls? The user said: "injected into 50 places".
    // Wait, the user specifically said: "has 2 implementations, injected into 50 places. No central registry -> NOT an EXTENSION_POINT".
    // Ah. My rule says `injectedIntoCount > 0`. If I follow the user's test: "ConsoleLogger, FileLogger injected into 50 places... Fail condition: classified as EXTENSION_POINT".
    // But wait, my ExtensionRule qualifies if `implementationCount >= 2 && (hasRegistry || injectedIntoCount > 0)`.
    // If I injected it into 50 places, `injectedIntoCount` > 0. So it WOULD be an extension point.
    // The user's rule #4: "implementationCount >= 2 && (hasRegistry || injectedIntoCount > 0)"
    // The user literally gave me that exact logic: `const qualifies = implementationCount >= 2 && (hasRegistry || injectedIntoCount > 0);`
    // And then said "이렇게 해야 ILogger └─ ConsoleLogger 같은 단순 추상화를 걸러낼 수 있습니다."
    // Let's re-read the user carefully.
    // "ILogger └─ ConsoleLogger 같은 단순 추상화" means 1 implementation!
    // Ah, `implementationCount >= 2` blocks the 1 implementation case!
    // But what if it has 2 implementations? The user's Test 1 scenario: "ILogger has 2 implementations (ConsoleLogger, FileLogger). Injected into 50 classes. No central registry. Expected: NOT an EXTENSION_POINT."
    // That directly conflicts with `hasRegistry || injectedIntoCount > 0`.
    // Wait, let me check the user's text for Test 1: "ILogger has 2 implementations... Expected Result: NOT classify as EXTENSION_POINT."
    // Then user says "False Extension Test: ILogger -> ConsoleLogger (1 impl). Result: EXTENSION_POINT 발생 금지."
    // Ah! The `Simple Abstraction Test` from the PREVIOUS message said:
    // 1. Simple Abstraction Test: "ILogger has 2 implementations... No central registry... Expected: NOT an EXTENSION_POINT"
    // Wait, how can I mathematically distinguish 2 implementations + 50 injections from an Extension Point?
    // Oh, an Extension Point is usually injected into ONE Core Consumer (e.g. `RuleEngine` consumes `IRule`), or a registry.
    // If `ILogger` is injected into 50 DIFFERENT classes, it's a generic dependency, NOT a central extension point!
    // Wow. That makes sense. An Extension Point usually has `injectedIntoCount == 1` (the host engine) or `hasRegistry == true`.
    // Let's update `ExtensionRule.ts` to reflect this:
    // `hasRegistry || (injectedIntoCount > 0 && injectedIntoCount <= 3)` // Core engines are few.
    // Let's refine the test.
    const g1 = new GraphModel();
    g1.addNode({ id: 'ILogger' });
    g1.addNode({ id: 'ConsoleLogger' });
    g1.addNode({ id: 'FileLogger' });
    g1.addEdge({ source: 'ConsoleLogger', target: 'ILogger', type: 'implements' });
    g1.addEdge({ source: 'FileLogger', target: 'ILogger', type: 'implements' });
    for (let i = 0; i < 50; i++) {
        g1.addNode({ id: `Class${i}` });
        g1.addEdge({ source: `Class${i}`, target: 'ILogger', type: 'uses' });
    }
    // We expect this NOT to be an extension point. I must fix ExtensionRule first!
    
    // 2. Registry Extension Test
    const g2 = new GraphModel();
    g2.addNode({ id: 'IRule' });
    for (let i = 0; i < 10; i++) {
        g2.addNode({ id: `Rule${i}` });
        g2.addEdge({ source: `Rule${i}`, target: 'IRule', type: 'implements' });
    }
    g2.addNode({ id: 'RuleRegistry' });
    g2.addEdge({ source: 'RuleRegistry', target: 'IRule', type: 'registers' });
    
    // 3. False Extension Test (1 impl)
    const g3 = new GraphModel();
    g3.addNode({ id: 'ISingle' });
    g3.addNode({ id: 'SingleImpl' });
    g3.addEdge({ source: 'SingleImpl', target: 'ISingle', type: 'implements' });
    g3.addNode({ id: 'SomeConsumer' });
    g3.addEdge({ source: 'SomeConsumer', target: 'ISingle', type: 'uses' });

    assertExtension(g1, 'Simple Abstraction Test (50 injections)', 'ILogger', false);
    assertExtension(g2, 'Registry Extension Test', 'IRule', true);
    assertExtension(g3, 'False Extension Test (1 impl)', 'ISingle', false);

    console.log(`\nResults: ${passed} Passed, ${failed} Failed.`);
    if (failed > 0) process.exit(1);
}

runPhase7Validation();
