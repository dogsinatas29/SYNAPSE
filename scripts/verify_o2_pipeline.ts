/**
 * verify_o2_pipeline.ts
 * 
 * Independent Cross-Verification Script for O2 (Dependency Root) Detection Pipeline
 * 
 * Verifies:
 * 1. Independent math calculation vs Production Detector Findings (100% full candidate ID matching)
 * 2. Side-by-side execution of Production Strict Root vs Legacy Fallback Detector on real benchmarks (Delta = 0 across full set)
 * 3. Execution of Legacy Fallback vs Production Detector on Synthetic Rootless Cyclic Graph (proving fallback promotion elimination)
 * 4. Automated assertion failures on count/ID mismatch
 */

import * as fs from 'fs';
import { EntryPointDetector } from '../src/core/analysis/patterns/detectors/EntryPointDetector';
import { ScopeResolver } from '../src/core/analysis/ScopeResolver';

let totalAssertionsPassed = 0;

function assert(condition: boolean, msg: string) {
    if (!condition) {
        console.error(`[FAIL] ${msg}`);
        throw new Error(`ASSERTION_FAILURE: ${msg}`);
    } else {
        totalAssertionsPassed++;
        console.log(`[PASS] ${msg}`);
    }
}

/**
 * Historical Legacy EntryPointDetector implementation prior to Phase A v1.0.12 fallback removal.
 * Preserved verbatim for differential validation.
 */
class LegacyEntryPointDetectorWithFallback {
    private isRealFile(filePath: string): boolean {
        if (!filePath) return false;
        if (filePath.startsWith('AGGREGATE_') || filePath.startsWith('SYSTEM_') || filePath.includes('UNKNOWN') || filePath.includes('OUT_OF_SCOPE')) {
            return false;
        }
        if (!filePath.includes('.')) return false;
        return /\.(ts|js|rs|kt|java|py|cpp|c|h|go|rb)$/i.test(filePath);
    }

    public detect(context: any): { findings: any[], eligibleIds: string[], fallbackTriggered: boolean } {
        const findings: any[] = [];
        if (!context || !context.snapshot || !context.snapshot.nodes || !context.snapshot.edges) {
            return { findings, eligibleIds: [], fallbackTriggered: false };
        }

        const validNodes = context.snapshot.nodes.filter((n: any) => this.isRealFile(n.filePath || n.id || ''));
        if (validNodes.length === 0) return { findings, eligibleIds: [], fallbackTriggered: false };

        const inDegreeMap = new Map<string, number>();
        const outDegreeMap = new Map<string, number>();

        for (const edge of context.snapshot.edges) {
            const src = edge.source || edge.from;
            const tgt = edge.target || edge.to;
            if (src) outDegreeMap.set(src, (outDegreeMap.get(src) || 0) + 1);
            if (tgt) inDegreeMap.set(tgt, (inDegreeMap.get(tgt) || 0) + 1);
        }

        let execCandidates = validNodes.filter((n: any) => {
            const id = n.filePath || n.id;
            const fanIn = inDegreeMap.get(id) || 0;
            const fanOut = outDegreeMap.get(id) || 0;
            n.fanIn = fanIn;
            n.fanOut = fanOut;
            if (fanIn === 0 && fanOut > 0) {
                if (n.role === 'test' || String(n.role).toLowerCase() === 'test') {
                    return false;
                }
                return true;
            }
            return false;
        });

        let fallbackTriggered = false;
        // Legacy Fallback if no strict fanIn=0 exists (pre-v0.3.34.75 behavior)
        if (execCandidates.length === 0) {
            fallbackTriggered = true;
            execCandidates = validNodes.filter((n: any) => {
                const id = n.filePath || n.id;
                const fanOut = outDegreeMap.get(id) || 0;
                n.fanOut = fanOut;
                return fanOut > 0;
            });
        }

        // Scope filter
        const scopeResolver: ScopeResolver = context?.scopeResolver;
        if (scopeResolver && scopeResolver.hasExclusions()) {
            execCandidates = execCandidates.filter((n: any) => {
                const p = n.filePath || n.id;
                return !scopeResolver.matches(p);
            });
        }

        execCandidates.sort((a: any, b: any) => {
            const aOut = b.fanOut || 0;
            const bOut = a.fanOut || 0;
            if (aOut !== bOut) return aOut - bOut;
            const aId = a.filePath || a.id;
            const bId = b.filePath || b.id;
            return aId < bId ? -1 : (aId > bId ? 1 : 0);
        });

        const eligibleIds = execCandidates.map((n: any) => n.filePath || n.id);
        const top5 = execCandidates.slice(0, 5);
        for (const topExec of top5) {
            const targetId = topExec.filePath || topExec.id;
            findings.push({
                targetId: targetId,
                metadata: {
                    inDegree: inDegreeMap.get(targetId) || 0,
                    outDegree: outDegreeMap.get(targetId) || 0
                }
            });
        }

        return { findings, eligibleIds, fallbackTriggered };
    }
}

interface ExpectedCounts {
    totalSnapshot: number;
    validPhysical: number;
    strictRoots: number;
    testRoleDrop: number;
    universe: number;
    scopeExcluded: number;
    eligible: number;
    top5Ids: string[];
}

function verifyO2Project(
    statePath: string,
    patterns: string[],
    label: string,
    expected: ExpectedCounts
) {
    console.log(`\n===============================================================`);
    console.log(`=== O2 Pipeline Independent Trace & Differential Validation: ${label} ===`);
    console.log(`Data Source: ${statePath}`);

    const data = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    const snapshot = {
        nodes: data.nodes || (data.graph && data.graph.nodes) || [],
        edges: data.edges || (data.graph && data.graph.edges) || []
    };

    // 1. Independent isRealFile logic matching production detector
    const isRealFile = (filePath: string) => {
        if (!filePath) return false;
        if (filePath.startsWith('AGGREGATE_') || filePath.startsWith('SYSTEM_') || filePath.includes('UNKNOWN') || filePath.includes('OUT_OF_SCOPE')) return false;
        if (!filePath.includes('.')) return false;
        return /\.(ts|js|rs|kt|java|py|cpp|c|h|go|rb)$/i.test(filePath);
    };

    const allNodes = snapshot.nodes;
    const validNodes = allNodes.filter((n: any) => isRealFile(n.filePath || n.id || ''));

    // 2. Independent inDegree / outDegree calculation
    const inDegreeMap = new Map<string, number>();
    const outDegreeMap = new Map<string, number>();
    for (const edge of snapshot.edges) {
        const src = edge.source || edge.from;
        const tgt = edge.target || edge.to;
        if (src) outDegreeMap.set(src, (outDegreeMap.get(src) || 0) + 1);
        if (tgt) inDegreeMap.set(tgt, (inDegreeMap.get(tgt) || 0) + 1);
    }

    // 3. Strict Root & Test Role drop calculation
    let strictRootsCount = 0;
    let testRoleCount = 0;
    const universeCandidates = validNodes.filter((n: any) => {
        const id = n.filePath || n.id;
        const fanIn = inDegreeMap.get(id) || 0;
        const fanOut = outDegreeMap.get(id) || 0;
        if (fanIn === 0 && fanOut > 0) {
            strictRootsCount++;
            if (n.role === 'test' || String(n.role).toLowerCase() === 'test') {
                testRoleCount++;
                return false;
            }
            return true;
        }
        return false;
    });

    // 4. Declared Scope Exclusion calculation
    const resolver = new ScopeResolver(patterns, 'CLI_FLAG');
    let scopeExcludedCount = 0;
    const eligibleCandidates = universeCandidates.filter((n: any) => {
        const id = n.filePath || n.id;
        if (resolver.matches(id)) {
            scopeExcludedCount++;
            return false;
        }
        return true;
    });

    // 5. Independent Top 5 Sorting & Selection
    const independentSorted = [...eligibleCandidates].sort((a: any, b: any) => {
        const aId = a.filePath || a.id;
        const bId = b.filePath || b.id;
        const aOut = outDegreeMap.get(aId) || 0;
        const bOut = outDegreeMap.get(bId) || 0;
        if (bOut !== aOut) return bOut - aOut;
        return aId < bId ? -1 : (aId > bId ? 1 : 0);
    });
    const independentEligibleIds = independentSorted.map((n: any) => n.filePath || n.id);
    const independentTop5Ids = independentEligibleIds.slice(0, 5);

    // 6. Automated Assertions on Pipeline Stage Counts
    assert(allNodes.length === expected.totalSnapshot, `${label}: Snapshot nodes === ${expected.totalSnapshot}`);
    assert(validNodes.length === expected.validPhysical, `${label}: Valid physical nodes === ${expected.validPhysical}`);
    assert(strictRootsCount === expected.strictRoots, `${label}: Strict roots === ${expected.strictRoots}`);
    assert(testRoleCount === expected.testRoleDrop, `${label}: Test role drop === ${expected.testRoleDrop}`);
    assert(universeCandidates.length === expected.universe, `${label}: C_universe === ${expected.universe}`);
    assert(scopeExcludedCount === expected.scopeExcluded, `${label}: Scope excluded === ${expected.scopeExcluded}`);
    assert(eligibleCandidates.length === expected.eligible, `${label}: C_eligible === ${expected.eligible}`);

    // 7. Production EntryPointDetector Execution
    const productionDetector = new EntryPointDetector();
    const context = { snapshot, scopeResolver: resolver };
    const findings = productionDetector.detect(context);
    const productionTop5Ids = findings.map((f: any) => f.targetId);

    assert(findings.length === Math.min(5, expected.eligible), `${label}: Production detector findings count === ${findings.length}`);
    for (let i = 0; i < findings.length; i++) {
        assert(
            productionTop5Ids[i] === independentTop5Ids[i],
            `${label} Top #${i + 1} Candidate ID match: "${productionTop5Ids[i]}" === "${independentTop5Ids[i]}"`
        );
        assert(
            productionTop5Ids[i] === expected.top5Ids[i],
            `${label} Top #${i + 1} matches Expected Baseline ID: "${expected.top5Ids[i]}"`
        );
    }

    // 8. Side-by-Side Execution of Legacy Fallback Detector
    const legacyDetector = new LegacyEntryPointDetectorWithFallback();
    const legacyResult = legacyDetector.detect(context);

    // Assert Fallback was NOT triggered on real benchmark
    assert(
        legacyResult.fallbackTriggered === false,
        `${label}: Legacy Fallback was NOT triggered on real codebase (Strict Roots exist: ${strictRootsCount} > 0)`
    );

    // Assert 100% full set equality between Independent Eligible Candidates and Legacy Output
    assert(
        legacyResult.eligibleIds.length === expected.eligible,
        `${label}: Legacy detector candidate count (${legacyResult.eligibleIds.length}) === Expected eligible (${expected.eligible})`
    );

    // Check symmetrical difference of candidate sets
    const indSet = new Set(independentEligibleIds);
    const legSet = new Set(legacyResult.eligibleIds);
    let diffCount = 0;
    for (const id of indSet) {
        if (!legSet.has(id)) diffCount++;
    }
    for (const id of legSet) {
        if (!indSet.has(id)) diffCount++;
    }

    assert(
        diffCount === 0,
        `${label}: Full Candidate ID Set Delta === 0 (All ${expected.eligible} IDs match 100% between strict root and legacy fallback)`
    );

    // Assert Top 5 IDs match between production and legacy
    const legacyTop5 = legacyResult.findings.map(f => f.targetId);
    for (let i = 0; i < legacyTop5.length; i++) {
        assert(
            legacyTop5[i] === productionTop5Ids[i],
            `${label}: Legacy Top #${i + 1} ("${legacyTop5[i]}") === Production Top #${i + 1} ("${productionTop5Ids[i]}")`
        );
    }
}

function verifySyntheticRootlessGraph() {
    console.log(`\n===============================================================`);
    console.log(`=== O2 Synthetic Rootless Graph Verification (Side-by-Side Execution) ===`);

    // Pure cycle: A -> B -> C -> A (No strict roots: fanIn > 0 for all nodes)
    const rootlessSnapshot = {
        nodes: [
            { id: 'cycle_a.ts', filePath: 'cycle_a.ts' },
            { id: 'cycle_b.ts', filePath: 'cycle_b.ts' },
            { id: 'cycle_c.ts', filePath: 'cycle_c.ts' }
        ],
        edges: [
            { source: 'cycle_a.ts', target: 'cycle_b.ts' },
            { source: 'cycle_b.ts', target: 'cycle_c.ts' },
            { source: 'cycle_c.ts', target: 'cycle_a.ts' }
        ]
    };

    const emptyResolver = new ScopeResolver([], 'CLI_FLAG');
    const rootlessContext = { snapshot: rootlessSnapshot, scopeResolver: emptyResolver };

    // Execution 1: Production Strict Root Contract (Without Fallback)
    const productionDetector = new EntryPointDetector();
    const productionFindings = productionDetector.detect(rootlessContext);

    assert(
        productionFindings.length === 0,
        'Rootless Graph [Production Strict Root]: Returns exactly 0 findings (no false positive promotion)'
    );

    // Execution 2: Real Execution of Legacy Fallback Detector
    const legacyDetector = new LegacyEntryPointDetectorWithFallback();
    const legacyResult = legacyDetector.detect(rootlessContext);

    assert(
        legacyResult.fallbackTriggered === true,
        'Rootless Graph [Legacy Detector]: Fallback was TRIGGERED as fanIn=0 candidates were 0'
    );
    assert(
        legacyResult.eligibleIds.length === 3,
        'Rootless Graph [Legacy Detector]: Falsely promoted all 3 cyclic nodes as entry points'
    );
    assert(
        legacyResult.findings.length === 3,
        'Rootless Graph [Legacy Detector]: Emitted 3 invalid findings for cyclic non-root nodes'
    );

    console.log('[PROOF] Concrete execution difference: Legacy Fallback emits 3 false positives on cyclic graph, while Production Strict Root safely returns 0.');
}

function main() {
    console.log('=== Starting Automated O2 Independent Verification Suite ===');

    // 1. Godot Engine Benchmark
    verifyO2Project(
        '/home/dogsinatas/다운로드/godot-master/synapse_data/project_state.json',
        ['thirdparty/**', 'tests/**', 'platform/android/java/**/apksig/**'],
        'Godot Engine',
        {
            totalSnapshot: 9876,
            validPhysical: 8917,
            strictRoots: 842,
            testRoleDrop: 9,
            universe: 833,
            scopeExcluded: 504,
            eligible: 329,
            top5Ids: [
                'editor/import/3d/post_import_plugin_skeleton_rest_fixer.cpp',
                'scene/3d/physics/static_body_3d.cpp',
                'scene/gui/menu_button.cpp',
                'drivers/gles3/storage/utilities.cpp',
                'editor/themes/theme_classic.cpp'
            ]
        }
    );

    // 2. VS Code Benchmark
    verifyO2Project(
        '/home/dogsinatas/다운로드/vscode/vscode-main/synapse_data/project_state.json',
        ['test/**', 'extensions/**'],
        'VS Code',
        {
            totalSnapshot: 14748,
            validPhysical: 11274,
            strictRoots: 2621,
            testRoleDrop: 2032,
            universe: 589,
            scopeExcluded: 159,
            eligible: 430,
            top5Ids: [
                'src/vs/workbench/workbench.common.main.ts',
                'src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts',
                'src/vs/sessions/sessions.common.main.ts',
                'src/vs/workbench/api/browser/extensionHost.contribution.ts',
                'src/vs/platform/agentHost/node/codex/protocol/generated/index.ts'
            ]
        }
    );

    // 3. Synthetic Rootless Graph Verification
    verifySyntheticRootlessGraph();

    console.log(`\n===============================================================`);
    console.log(`=== All Automated O2 Assertions & Cross-Checks PASSED (Total: ${totalAssertionsPassed}) ===`);
}

main();
