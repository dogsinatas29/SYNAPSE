import { ScopeResolver } from '../src/core/analysis/ScopeResolver';
import { SystemCoreDetector } from '../src/core/analysis/patterns/detectors/SystemCoreDetector';
import { FindingReportAdapter } from '../src/core/reporting/FindingReportAdapter';
import * as fs from 'fs';
import * as path from 'path';

function assert(condition: boolean, msg: string) {
    if (!condition) {
        console.error(`FAIL: ${msg}`);
        process.exit(1);
    } else {
        console.log(`PASS: ${msg}`);
    }
}

function assertThrows(fn: () => void, expectedErrSnippet: string, msg: string) {
    try {
        fn();
        console.error(`FAIL (Did not throw): ${msg}`);
        process.exit(1);
    } catch (err: any) {
        if (err.message && err.message.includes(expectedErrSnippet)) {
            console.log(`PASS: ${msg}`);
        } else {
            console.error(`FAIL (Wrong error: ${err.message}): ${msg}`);
            process.exit(1);
        }
    }
}

console.log("=== Running ScopeResolver Contract Unit Tests ===");

// 1. ** Single pattern test vector
assert(ScopeResolver.matchGlob('**', 'main.ts') === true, '** matches main.ts');
assert(ScopeResolver.matchGlob('**', 'src/main.ts') === true, '** matches src/main.ts');
assert(ScopeResolver.matchGlob('**', 'src/core/main.ts') === true, '** matches src/core/main.ts');

// 2. Single segment * vector
assert(ScopeResolver.matchGlob('foo/*/bar.ts', 'foo/a/bar.ts') === true, 'foo/*/bar.ts matches foo/a/bar.ts');
assert(ScopeResolver.matchGlob('foo/*/bar.ts', 'foo/bar.ts') === false, 'foo/*/bar.ts does NOT match foo/bar.ts');
assert(ScopeResolver.matchGlob('foo/*/bar.ts', 'foo/a/b/bar.ts') === false, 'foo/*/bar.ts does NOT match foo/a/b/bar.ts (* cannot cross /)');

// 3. In-segment wildcard (*.ts, foo/*.cpp)
assert(ScopeResolver.matchGlob('src/*.ts', 'src/index.ts') === true, 'src/*.ts matches src/index.ts');
assert(ScopeResolver.matchGlob('src/*.ts', 'src/index.js') === false, 'src/*.ts does NOT match src/index.js');
assert(ScopeResolver.matchGlob('src/*.ts', 'src/core/index.ts') === false, 'src/*.ts does NOT cross directory boundary');

// 4. Intermediate ** vector
assert(ScopeResolver.matchGlob('foo/**/bar.ts', 'foo/bar.ts') === true, 'foo/**/bar.ts matches foo/bar.ts (0 skip)');
assert(ScopeResolver.matchGlob('foo/**/bar.ts', 'foo/a/bar.ts') === true, 'foo/**/bar.ts matches foo/a/bar.ts (1 skip)');
assert(ScopeResolver.matchGlob('foo/**/bar.ts', 'foo/a/b/bar.ts') === true, 'foo/**/bar.ts matches foo/a/b/bar.ts (multiple skip)');

// 5. Leading and Trailing ** vector
assert(ScopeResolver.matchGlob('**/foo', 'foo') === true, '**/foo matches root foo');
assert(ScopeResolver.matchGlob('**/foo', 'a/b/foo') === true, '**/foo matches a/b/foo');
assert(ScopeResolver.matchGlob('foo/**', 'foo/bar.ts') === true, 'foo/** matches direct child');
assert(ScopeResolver.matchGlob('foo/**', 'foo/a/b/bar.ts') === true, 'foo/** matches deep child');

// 6. Complex vector
assert(ScopeResolver.matchGlob('platform/android/java/**/apksig/**', 'platform/android/java/editor/src/main/java/com/android/apksig/internal/util/VerityTreeBuilder.java') === true, 'Complex multi-** matches Godot apksig file');
assert(ScopeResolver.matchGlob('thirdparty/**', 'thirdparty/freetype/include/freetype/internal/ftdebug.h') === true, 'thirdparty/** matches freetype header');

// 7. Case sensitivity
assert(ScopeResolver.matchGlob('Thirdparty/**', 'thirdparty/foo.cpp') === false, 'Case-sensitive test 1');
assert(ScopeResolver.matchGlob('thirdparty/**', 'Thirdparty/foo.cpp') === false, 'Case-sensitive test 2');

// 8. Virtual node skip & Backslash normalization
const resolver = new ScopeResolver(['thirdparty/**', 'tests/**'], 'CLI_FLAG');
assert(resolver.matches('ghost://Fragment') === false, 'Virtual ghost node is skipped');
assert(resolver.matches('external://express') === false, 'Virtual external node is skipped');
assert(resolver.matches('stdlib://fs') === false, 'Virtual stdlib node is skipped');
assert(resolver.matches('AGGREGATE_cluster') === false, 'Virtual AGGREGATE node is skipped');
assert(resolver.matches('') === false, 'Empty filePath is skipped');
assert(resolver.matches(undefined as any) === false, 'Undefined/missing filePath is skipped');
assert(resolver.matches('/tests/foo.ts') === false, 'Absolute path node is skipped');
assert(resolver.matches('tests/main.cpp') === true, 'Relative test path is matched');
assert(resolver.matches('thirdparty/jolt/Jolt.h') === true, 'Relative thirdparty path is matched');
assert(resolver.matches('core/engine.cpp') === false, 'In-house path is not matched');
assert(resolver.matches('thirdparty\\freetype\\ft.h') === true, 'Backslash path is normalized and matched');

// 8-b. Component Full Match vs Partial Match retention
const fullMatchMembers = ['thirdparty/a.h', 'thirdparty/b.h'];
assert(fullMatchMembers.every(m => resolver.matches(m)) === true, 'Full Match component is marked for exclusion');
const partialMatchMembers = ['thirdparty/a.h', 'core/engine.cpp'];
assert(partialMatchMembers.every(m => resolver.matches(m)) === false, 'Partial Match component is NOT excluded (candidate eligibility retained)');

// 9. Forbidden Patterns (Fail-Closed INVALID_PATTERN)
assertThrows(() => ScopeResolver.loadConfig(undefined, ['foo**bar']), 'INVALID_PATTERN', 'Reject in-segment **: foo**bar');
assertThrows(() => ScopeResolver.loadConfig(undefined, ['***']), 'INVALID_PATTERN', 'Reject triple asterisk: ***');
assertThrows(() => ScopeResolver.loadConfig(undefined, ['**/**']), 'INVALID_PATTERN', 'Reject redundant recursive wildcard: **/**');
assertThrows(() => ScopeResolver.loadConfig(undefined, ['/leading']), 'INVALID_PATTERN', 'Reject leading slash: /leading');
assertThrows(() => ScopeResolver.loadConfig(undefined, ['trailing/']), 'INVALID_PATTERN', 'Reject trailing slash: trailing/');
assertThrows(() => ScopeResolver.loadConfig(undefined, ['']), 'INVALID_PATTERN', 'Reject empty pattern string: ""');
assertThrows(() => ScopeResolver.loadConfig(undefined, ['   ']), 'INVALID_PATTERN', 'Reject whitespace only pattern string');
assertThrows(() => ScopeResolver.loadConfig(undefined, ['foo\\bar']), 'INVALID_PATTERN', 'Reject backslash in glob pattern: foo\\bar');
assertThrows(() => ScopeResolver.loadConfig(undefined, ['foo//bar']), 'INVALID_PATTERN', 'Reject redundant slashes in pattern: foo//bar');
assertThrows(() => ScopeResolver.loadConfig(undefined, ['foo/../bar']), 'INVALID_PATTERN', 'Reject directory traversal: foo/../bar');
assertThrows(() => ScopeResolver.loadConfig(undefined, ['foo[a-z]']), 'INVALID_PATTERN', 'Reject unsupported bracket glob: foo[a-z]');

// 10. INVALID_CONFIG type validation
assertThrows(() => ScopeResolver.loadConfig(undefined, 'not-an-array' as any), 'scopeExclusions must be an array of strings', 'Reject non-array config');
assertThrows(() => ScopeResolver.loadConfig(undefined, [123] as any), 'scopeExclusions must contain only string values', 'Reject non-string array item');

// 11. Configuration Priority (First-Win, No Merge)
const tempDir = path.join(__dirname, '..', '.tmp_test_scope_config');
fs.mkdirSync(tempDir, { recursive: true });
fs.mkdirSync(path.join(tempDir, '.vscode'), { recursive: true });

try {
    fs.writeFileSync(path.join(tempDir, 'synapse.config.json'), JSON.stringify({ scopeExclusions: ['from_config/**'] }));
    fs.writeFileSync(path.join(tempDir, '.vscode', 'settings.json'), JSON.stringify({ 'synapse.analysis.scopeExclusions': ['from_vscode/**'] }));

    // Config file only
    const resConfig = ScopeResolver.loadConfig(tempDir);
    // Since .vscode/settings.json exists, VSCode settings should win over synapse.config.json
    assert(resConfig.getSource() === 'VSCODE_SETTINGS' && resConfig.getPatterns()[0] === 'from_vscode/**', 'VSCode settings wins over synapse.config.json');

    // ENV overrides VSCode settings
    process.env.SYNAPSE_SCOPE_EXCLUSIONS = JSON.stringify(['from_env/**']);
    const resEnv = ScopeResolver.loadConfig(tempDir);
    assert(resEnv.getSource() === 'ENV_VAR' && resEnv.getPatterns()[0] === 'from_env/**', 'ENV_VAR wins over VSCode settings');

    // CLI overrides ENV
    const resCli = ScopeResolver.loadConfig(tempDir, ['from_cli/**']);
    assert(resCli.getSource() === 'CLI_FLAG' && resCli.getPatterns()[0] === 'from_cli/**', 'CLI_FLAG wins over ENV_VAR');

    // First-Win with empty array [] (must NOT fall through to lower tiers)
    const resCliEmpty = ScopeResolver.loadConfig(tempDir, []);
    assert(resCliEmpty.getSource() === 'CLI_FLAG' && resCliEmpty.getPatterns().length === 0, 'CLI_FLAG with [] stops fallthrough to lower tiers');

    delete process.env.SYNAPSE_SCOPE_EXCLUSIONS;

    // ENV with [] stops fallthrough to VSCode
    process.env.SYNAPSE_SCOPE_EXCLUSIONS = JSON.stringify([]);
    const resEnvEmpty = ScopeResolver.loadConfig(tempDir);
    assert(resEnvEmpty.getSource() === 'ENV_VAR' && resEnvEmpty.getPatterns().length === 0, 'ENV_VAR with [] stops fallthrough to VSCode settings');

    // Invalid JSON in ENV throws INVALID_CONFIG
    process.env.SYNAPSE_SCOPE_EXCLUSIONS = '{bad_json_string';
    assertThrows(() => ScopeResolver.loadConfig(tempDir), 'INVALID_CONFIG', 'Reject invalid JSON in SYNAPSE_SCOPE_EXCLUSIONS environment variable');

    delete process.env.SYNAPSE_SCOPE_EXCLUSIONS;
} finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
}

// 12. Pattern matching and UNMATCHED detection logic
const testPatterns = ['matched/**', 'unmatched/**'];
const sampleFiles = ['matched/foo.ts', 'inhouse/bar.ts'];
const matchCounts = new Map<string, number>();
for (const p of testPatterns) matchCounts.set(p, 0);

for (const f of sampleFiles) {
    for (const p of testPatterns) {
        if (ScopeResolver.matchGlob(p, f)) {
            matchCounts.set(p, (matchCounts.get(p) || 0) + 1);
        }
    }
}
assert(matchCounts.get('matched/**') === 1, 'matched/** matched 1 file');
assert(matchCounts.get('unmatched/**') === 0, 'unmatched/** matched 0 files (triggers [WARN] UNMATCHED)');

// 13. Synthetic Partial Match End-to-End Test (Detector & FindingReportAdapter contract verification)
{
    const resolver = new ScopeResolver(['thirdparty/**'], 'CLI_FLAG');
    const detector = new SystemCoreDetector();

    const syntheticContext = {
        snapshot: {
            nodes: [
                { id: 'thirdparty/lib.cpp', role: 'production' },
                { id: 'core/main.cpp', role: 'production' },
                { id: 'core/util.cpp', role: 'production' }
            ]
        },
        scopeResolver: resolver
    };

    const syntheticSimContext = {
        evidenceBundle: {
            findings: [
                {
                    type: 'semantic',
                    evidenceType: 'BOUNDARY_NODE',
                    targetId: 'core/hybrid_module',
                    metadata: {
                        members: ['thirdparty/lib.cpp', 'core/main.cpp', 'core/util.cpp'],
                        internalEdges: 5,
                        externalEdges: 10,
                        inboundEdges: 8,
                        size: 3
                    }
                }
            ]
        }
    };

    const findings = detector.detect(syntheticContext, syntheticSimContext);
    assert(findings.length === 1, 'Hybrid component retains candidate eligibility (not excluded by Full Match rule)');
    
    const ev = findings[0].evidence[0];
    assert(
        ev.metadata?.scopeStatus === 'Partially Excluded (Eligible: 2/3, Excluded: 1/3)',
        'Hybrid component metadata.scopeStatus matches format "Partially Excluded (Eligible: 2/3, Excluded: 1/3)"'
    );

    const adapter = new FindingReportAdapter();
    const rendered = adapter.buildArchitectSections(findings);
    const a1Section = rendered.find((s: any) => s.title.includes('A1'));
    assert(
        !!a1Section && a1Section.content.includes('- Scope Status: Partially Excluded (Eligible: 2/3, Excluded: 1/3)'),
        'Report Markdown renders "- Scope Status: Partially Excluded (Eligible: 2/3, Excluded: 1/3)"'
    );
}

console.log("=== All ScopeResolver Unit Tests Passed! ===");
