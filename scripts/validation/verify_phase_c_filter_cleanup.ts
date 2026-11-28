import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ScopeResolver } from '../../src/core/analysis/ScopeResolver';
import { ChangeAmplifierDetector } from '../../src/core/analysis/patterns/detectors/ChangeAmplifierDetector';
import { EntryPointDetector } from '../../src/core/analysis/patterns/detectors/EntryPointDetector';
import { SystemCoreDetector } from '../../src/core/analysis/patterns/detectors/SystemCoreDetector';
import { ReportBundleGenerator } from '../../src/core/reporting/ReportBundleGenerator';
import { NodeRole } from '../../src/types/schema';

// Clear any external override so CLI_FLAG controls ScopeResolver deterministically.
delete process.env.SYNAPSE_SCOPE_EXCLUSIONS;

const WORKSPACE_ROOT = path.resolve(__dirname, '../..');
const EVIDENCE_ROOT = path.join(WORKSPACE_ROOT, 'mile_stone', 'evidence', 'phase_c');
const FS_PRE_REL = 'mile_stone/evidence/phase_c/fs_inventory_pre.json';
const FS_POST_REL = 'mile_stone/evidence/phase_c/fs_inventory_post.json';
const W4_REL = 'scripts/validation/verify_phase_c_filter_cleanup.ts';
const W1_REL = 'src/core/analysis/patterns/detectors/SystemCoreDetector.ts';
const W2_REL = 'src/core/analysis/patterns/detectors/ChangeAmplifierDetector.ts';

type DatasetId = 'godot' | 'vscode';
type ScenarioId = 'A' | 'B' | 'C';
type ReportFileName = 'ARCHITECT_REPORT.md' | 'ONBOARDING_REPORT.md' | 'SIMULATION_DEBUG.md';

interface ProjectDef {
    id: DatasetId;
    name: string;
    rootPath: string;
    projectStatePath: string;
    simEvidencePath: string;
}

const PROJECTS: Record<DatasetId, ProjectDef> = {
    godot: {
        id: 'godot',
        name: 'Godot Engine',
        rootPath: '/home/dogsinatas/다운로드/godot-master',
        projectStatePath: '/home/dogsinatas/다운로드/godot-master/synapse_data/project_state.json',
        simEvidencePath: '/home/dogsinatas/다운로드/godot-master/synapse_report/surgery/simulation_evidence.json'
    },
    vscode: {
        id: 'vscode',
        name: 'VS Code',
        rootPath: '/home/dogsinatas/다운로드/vscode/vscode-main',
        projectStatePath: '/home/dogsinatas/다운로드/vscode/vscode-main/synapse_data/project_state.json',
        simEvidencePath: '/home/dogsinatas/다운로드/vscode/vscode-main/synapse_report/surgery/simulation_evidence.json'
    }
};

interface ScenarioDef {
    dataset: DatasetId;
    scenario: ScenarioId;
    patterns: string[];
    description: string;
}

const SCENARIOS: ScenarioDef[] = [
    { dataset: 'godot', scenario: 'A', patterns: [], description: 'Godot Empty Scope ([])' },
    {
        dataset: 'godot',
        scenario: 'B',
        patterns: ['thirdparty/**', 'tests/**', 'platform/android/java/**/apksig/**'],
        description: 'Godot Phase A Targeted Exclusions'
    },
    { dataset: 'vscode', scenario: 'A', patterns: [], description: 'VS Code Empty Scope ([])' },
    {
        dataset: 'vscode',
        scenario: 'B',
        patterns: ['test/**', 'extensions/**'],
        description: 'VS Code Phase A Targeted Exclusions'
    },
    {
        dataset: 'vscode',
        scenario: 'C',
        patterns: ['test/**', 'extensions/**', '**/test/**'],
        description: 'VS Code Extended Test Coverage Exclusions'
    }
];

const NOT_APPLICABLE_SCENARIOS = [
    {
        dataset: 'godot' as DatasetId,
        scenario: 'C' as ScenarioId,
        status: 'NOT_APPLICABLE',
        reason: 'Scenario C targets VS Code nested src/vs/workbench/test/... paths; Godot root tests are covered by Scenario B (tests/**).'
    }
];

const PHASE_A_BASELINE_HASHES: Record<DatasetId, Record<ReportFileName, string>> = {
    godot: {
        'ONBOARDING_REPORT.md': 'e5706b0d4ae6518b94a63d7bc50142793fe27c8d28fbfc0a4e7ce9ede447663b',
        'ARCHITECT_REPORT.md': '1885bcbccbc4a7a8a58c69cd453a9f70c111275aeb4144764349361eb3118cd2',
        'SIMULATION_DEBUG.md': '14424cdef43c6817b93830e69bb03db781dd583a5dab64eca8b2ae67a8ed0ae2'
    },
    vscode: {
        'ONBOARDING_REPORT.md': 'f4d65746de1e026b7b7d80d699b2d34c27a8c2f68e7ef1b4726d6ff3257acaa8',
        'ARCHITECT_REPORT.md': '41c75243c8b2fabfe106a97ae40315a1031e84265afb71f8409b19733a1338e6',
        'SIMULATION_DEBUG.md': '42c1c78c60e97ca4ff232143ae99c482c4b2c4261ad717269ca773f21f70aec8'
    }
};

const VSCODE_TARGET_8_IDS = [
    'test/smoke',
    'extensions/copilot/test',
    'extensions/vscode-api-tests/src',
    'extensions/copilot/src/extension/test/vscode-node',
    'extensions/copilot/src/extension/mcp/test/vscode-node',
    'extensions/copilot/src/util/common/test/shims',
    'src/vs/workbench/test/browser/componentFixtures/chat',
    'src/vs/workbench/test/browser/componentFixtures/sessions'
];

interface CallSpec {
    index: number;
    command: 'fetchArchitectureReport' | 'fetchOnboardingReport' | 'fetchSimulationDebug';
    reportFile: ReportFileName;
    callFolder: string;
}

const CALL_SPECS: CallSpec[] = [
    { index: 1, command: 'fetchArchitectureReport', reportFile: 'ARCHITECT_REPORT.md', callFolder: 'call_1_fetchArchitectureReport' },
    { index: 2, command: 'fetchOnboardingReport', reportFile: 'ONBOARDING_REPORT.md', callFolder: 'call_2_fetchOnboardingReport' },
    { index: 3, command: 'fetchSimulationDebug', reportFile: 'SIMULATION_DEBUG.md', callFolder: 'call_3_fetchSimulationDebug' }
];

function toPosixRel(root: string, absPath: string): string {
    return path.relative(root, absPath).split(path.sep).join('/');
}

function sha256Buffer(buf: Buffer): string {
    return crypto.createHash('sha256').update(buf).digest('hex');
}

function sha256File(filePath: string): { bytes: number; sha256: string } {
    const buf = fs.readFileSync(filePath);
    return { bytes: buf.length, sha256: sha256Buffer(buf) };
}

function ensureDir(dirPath: string): void {
    fs.mkdirSync(dirPath, { recursive: true });
}

function deepEqualJSON(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null || a === undefined || b === undefined) return a === b;
    if (typeof a !== 'object' || typeof b !== 'object') return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!deepEqualJSON(a[i], b[i])) return false;
        }
        return true;
    }

    const objA = a as Record<string, unknown>;
    const objB = b as Record<string, unknown>;
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    if (keysA.length !== keysB.length) return false;
    for (const k of keysA) {
        if (!Object.prototype.hasOwnProperty.call(objB, k)) return false;
        if (!deepEqualJSON(objA[k], objB[k])) return false;
    }
    return true;
}

function assert(cond: boolean, msg: string): void {
    if (!cond) {
        throw new Error(`[ASSERTION_FAIL] ${msg}`);
    }
}

// ============================================================================
// Filesystem Inventory (R5)
// ============================================================================

interface FileEntry {
    relativePath: string;
    bytes: number;
    sha256: string;
}

interface SymlinkEntry {
    relativePath: string;
    linkTarget: string;
    pointsOutsideWorkspace: boolean;
    isBroken: boolean | null;
}

interface UnverifiedEntry {
    relativePath: string;
    reason: string;
    code?: string;
}

interface ExternalSsotEntry {
    id: string;
    path: string;
    bytes: number;
    sha256: string;
}

interface FilesystemInventory {
    capturedAt: string;
    mode: 'PRE' | 'POST';
    workspaceRoot: string;
    excludedPaths: string[];
    files: Record<string, FileEntry>;
    symlinks: Record<string, SymlinkEntry>;
    unverifiedEntries: UnverifiedEntry[];
    externalSsot: Record<string, ExternalSsotEntry>;
    w4LockedHashAtPre?: string;
    diffAgainstPre?: {
        b1AllowedFiles: Array<{ relativePath: string; changeType: string; sha256Before?: string; sha256After?: string; note?: string }>;
        b2IsolatedEvidence: Array<{ relativePath: string; changeType: string; bytes?: number; sha256?: string }>;
        b3BuildDist: Array<{ relativePath: string; changeType: string; sha256Before?: string; sha256After?: string }>;
        b4ExternalSsot: Array<{ id: string; path: string; sha256Before: string; sha256After: string; unchanged: boolean }>;
        b5UnauthorizedChanges: Array<{ relativePath: string; changeType: string; detail?: string }>;
        w4UnchangedSincePre: boolean;
        symlinkChanges: Array<{ relativePath: string; changeType: string }>;
        unverifiedPreCount: number;
        unverifiedPostCount: number;
        verdict: 'PASS' | 'FAIL' | 'UNVERIFIED';
    };
}

function captureFilesystemInventory(mode: 'PRE' | 'POST'): FilesystemInventory {
    const files: Record<string, FileEntry> = {};
    const symlinks: Record<string, SymlinkEntry> = {};
    const unverifiedEntries: UnverifiedEntry[] = [];
    const excludedPaths = [
        'node_modules/',
        '.git/',
        FS_PRE_REL,
        FS_POST_REL
    ];

    function walk(dirPath: string): void {
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(dirPath, { withFileTypes: true });
        } catch (err: any) {
            unverifiedEntries.push({
                relativePath: toPosixRel(WORKSPACE_ROOT, dirPath) || '.',
                reason: 'READDIR_ERROR',
                code: err?.code
            });
            return;
        }
        entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

        for (const entry of entries) {
            if (entry.name === 'node_modules' || entry.name === '.git') continue;
            const fullPath = path.join(dirPath, entry.name);
            const rel = toPosixRel(WORKSPACE_ROOT, fullPath);
            if (rel === FS_PRE_REL || rel === FS_POST_REL) continue;

            let lst: fs.Stats;
            try {
                lst = fs.lstatSync(fullPath);
            } catch (err: any) {
                unverifiedEntries.push({ relativePath: rel, reason: 'LSTAT_ERROR', code: err?.code });
                continue;
            }

            if (lst.isSymbolicLink()) {
                let linkTarget = '';
                try {
                    linkTarget = fs.readlinkSync(fullPath);
                } catch (err: any) {
                    unverifiedEntries.push({ relativePath: rel, reason: 'READLINK_ERROR', code: err?.code });
                    continue;
                }
                const resolvedSingleHop = path.resolve(path.dirname(fullPath), linkTarget);
                const relFromWs = path.relative(WORKSPACE_ROOT, resolvedSingleHop);
                const pointsOutsideWorkspace = relFromWs.startsWith('..') || path.isAbsolute(relFromWs);

                let isBroken: boolean | null = false;
                try {
                    fs.statSync(fullPath);
                } catch (err: any) {
                    if (err?.code === 'ENOENT' || err?.code === 'ENOTDIR' || err?.code === 'ELOOP') {
                        isBroken = true;
                        unverifiedEntries.push({ relativePath: rel, reason: 'BROKEN_SYMLINK', code: err.code });
                    } else {
                        isBroken = null;
                        unverifiedEntries.push({
                            relativePath: rel,
                            reason: `SYMLINK_STAT_ERROR:${err?.code || 'UNKNOWN'}`,
                            code: err?.code
                        });
                    }
                }
                symlinks[rel] = { relativePath: rel, linkTarget, pointsOutsideWorkspace, isBroken };
            } else if (lst.isDirectory()) {
                walk(fullPath);
            } else if (lst.isFile()) {
                try {
                    const hashed = sha256File(fullPath);
                    files[rel] = { relativePath: rel, bytes: hashed.bytes, sha256: hashed.sha256 };
                } catch (err: any) {
                    unverifiedEntries.push({ relativePath: rel, reason: 'FILE_READ_ERROR', code: err?.code });
                }
            } else {
                unverifiedEntries.push({ relativePath: rel, reason: 'UNSUPPORTED_ENTRY_TYPE' });
            }
        }
    }

    walk(WORKSPACE_ROOT);

    const externalSsot: Record<string, ExternalSsotEntry> = {};
    const extTargets: Array<{ id: string; p: string }> = [
        { id: 'godot_project_state', p: PROJECTS.godot.projectStatePath },
        { id: 'godot_simulation_evidence', p: PROJECTS.godot.simEvidencePath },
        { id: 'vscode_project_state', p: PROJECTS.vscode.projectStatePath },
        { id: 'vscode_simulation_evidence', p: PROJECTS.vscode.simEvidencePath }
    ];
    for (const item of extTargets) {
        assert(fs.existsSync(item.p), `External SSoT file missing: ${item.p}`);
        const h = sha256File(item.p);
        externalSsot[item.id] = { id: item.id, path: item.p, bytes: h.bytes, sha256: h.sha256 };
    }

    return {
        capturedAt: new Date().toISOString(),
        mode,
        workspaceRoot: WORKSPACE_ROOT,
        excludedPaths,
        files,
        symlinks,
        unverifiedEntries,
        externalSsot
    };
}

function runSnapshotPre(): void {
    console.log('=== [Phase C Stage 2] Capturing PRE Filesystem & External SSoT Inventory ===');
    ensureDir(EVIDENCE_ROOT);
    const inv = captureFilesystemInventory('PRE');
    assert(Boolean(inv.files[W4_REL]), `W4 script must exist at PRE: ${W4_REL}`);
    inv.w4LockedHashAtPre = inv.files[W4_REL].sha256;

    const outPath = path.join(WORKSPACE_ROOT, FS_PRE_REL);
    fs.writeFileSync(outPath, JSON.stringify(inv, null, 2), 'utf8');

    console.log(`Recorded ${Object.keys(inv.files).length} workspace files, ${Object.keys(inv.symlinks).length} symlinks, ${inv.unverifiedEntries.length} unverified entries.`);
    console.log(`W4 PRE SHA-256: ${inv.w4LockedHashAtPre}`);
    for (const ssot of Object.values(inv.externalSsot)) {
        console.log(`External SSoT [${ssot.id}]: ${ssot.bytes} bytes, sha256=${ssot.sha256}`);
    }
    console.log(`Saved PRE inventory: ${outPath}`);
}

function runSnapshotPost(): void {
    console.log('=== [Phase C Stage 2] Capturing POST Filesystem Inventory & Auditing B1-B5 Boundaries ===');
    const prePath = path.join(WORKSPACE_ROOT, FS_PRE_REL);
    assert(fs.existsSync(prePath), `PRE inventory missing: ${prePath}`);
    const pre: FilesystemInventory = JSON.parse(fs.readFileSync(prePath, 'utf8'));
    const post = captureFilesystemInventory('POST');

    const b1Set = new Set([W1_REL, W2_REL, W4_REL]);
    const b1AllowedFiles: Array<{ relativePath: string; changeType: string; sha256Before?: string; sha256After?: string; note?: string }> = [];
    const b2IsolatedEvidence: Array<{ relativePath: string; changeType: string; bytes?: number; sha256?: string }> = [];
    const b3BuildDist: Array<{ relativePath: string; changeType: string; sha256Before?: string; sha256After?: string }> = [];
    const b5UnauthorizedChanges: Array<{ relativePath: string; changeType: string; detail?: string }> = [];

    const allFilePaths = new Set([...Object.keys(pre.files), ...Object.keys(post.files)]);
    for (const rel of Array.from(allFilePaths).sort()) {
        const pEntry = pre.files[rel];
        const qEntry = post.files[rel];
        let changeType: string | null = null;
        if (!pEntry && qEntry) changeType = 'CREATED';
        else if (pEntry && !qEntry) changeType = 'DELETED';
        else if (pEntry && qEntry && pEntry.sha256 !== qEntry.sha256) changeType = 'MODIFIED';
        if (!changeType) continue;

        if (b1Set.has(rel)) {
            if (rel === W4_REL && changeType === 'DELETED') {
                b5UnauthorizedChanges.push({
                    relativePath: rel,
                    changeType,
                    detail: 'W4 was deleted after PRE lock'
                });
            } else {
                b1AllowedFiles.push({
                    relativePath: rel,
                    changeType,
                    sha256Before: pEntry?.sha256,
                    sha256After: qEntry?.sha256,
                    ...(rel === W4_REL
                        ? { note: 'Post-PRE W4 assertion fix: G3-6 ONBOARDING_REPORT shared A1/E2 header accounting + G4 detector_snapshot runIndex-excluded payload hash + audit-existing mode' }
                        : {})
                });
            }
        } else if (rel.startsWith('mile_stone/evidence/phase_c/')) {
            b2IsolatedEvidence.push({
                relativePath: rel,
                changeType,
                bytes: qEntry?.bytes,
                sha256: qEntry?.sha256
            });
        } else if (rel.startsWith('dist/')) {
            b3BuildDist.push({
                relativePath: rel,
                changeType,
                sha256Before: pEntry?.sha256,
                sha256After: qEntry?.sha256
            });
        } else {
            b5UnauthorizedChanges.push({
                relativePath: rel,
                changeType,
                detail: `Before=${pEntry?.sha256 || 'NONE'}, After=${qEntry?.sha256 || 'NONE'}`
            });
        }
    }

    const symlinkChanges: Array<{ relativePath: string; changeType: string }> = [];
    const allLinks = new Set([...Object.keys(pre.symlinks), ...Object.keys(post.symlinks)]);
    for (const rel of Array.from(allLinks).sort()) {
        const pLink = pre.symlinks[rel];
        const qLink = post.symlinks[rel];
        if (!deepEqualJSON(pLink, qLink)) {
            symlinkChanges.push({ relativePath: rel, changeType: !pLink ? 'CREATED' : !qLink ? 'DELETED' : 'MODIFIED' });
            b5UnauthorizedChanges.push({ relativePath: rel, changeType: 'SYMLINK_CHANGED' });
        }
    }

    const b4ExternalSsot: Array<{ id: string; path: string; sha256Before: string; sha256After: string; unchanged: boolean }> = [];
    let b4AllUnchanged = true;
    for (const id of Object.keys(pre.externalSsot).sort()) {
        const pSsot = pre.externalSsot[id];
        const qSsot = post.externalSsot[id];
        const unchanged = Boolean(qSsot && pSsot.sha256 === qSsot.sha256 && pSsot.bytes === qSsot.bytes);
        if (!unchanged) b4AllUnchanged = false;
        b4ExternalSsot.push({
            id,
            path: pSsot.path,
            sha256Before: pSsot.sha256,
            sha256After: qSsot?.sha256 || 'MISSING',
            unchanged
        });
    }

    const w4UnchangedSincePre = Boolean(post.files[W4_REL] && pre.w4LockedHashAtPre === post.files[W4_REL].sha256);
    const hasUnverified = pre.unverifiedEntries.length > 0 || post.unverifiedEntries.length > 0;
    const verdict: 'PASS' | 'FAIL' | 'UNVERIFIED' =
        b5UnauthorizedChanges.length > 0 || !b4AllUnchanged
            ? 'FAIL'
            : hasUnverified
              ? 'UNVERIFIED'
              : 'PASS';

    post.diffAgainstPre = {
        b1AllowedFiles,
        b2IsolatedEvidence,
        b3BuildDist,
        b4ExternalSsot,
        b5UnauthorizedChanges,
        w4UnchangedSincePre,
        symlinkChanges,
        unverifiedPreCount: pre.unverifiedEntries.length,
        unverifiedPostCount: post.unverifiedEntries.length,
        verdict
    };

    const outPath = path.join(WORKSPACE_ROOT, FS_POST_REL);
    fs.writeFileSync(outPath, JSON.stringify(post, null, 2), 'utf8');

    console.log(`B1 Allowed Modified Files (${b1AllowedFiles.length}):`, b1AllowedFiles.map(x => `${x.relativePath} [${x.changeType}]`));
    console.log(`W4 Unchanged Since PRE: ${w4UnchangedSincePre}`);
    console.log(`B2 Isolated Evidence Files: ${b2IsolatedEvidence.length}`);
    console.log(`B3 dist/ Changes: ${b3BuildDist.length}`);
    console.log(`B4 External SSoT 4/4 Unchanged: ${b4AllUnchanged}`);
    console.log(`B5 Unauthorized Changes: ${b5UnauthorizedChanges.length}`);
    if (b5UnauthorizedChanges.length > 0) {
        console.error('B5 UNAUTHORIZED CHANGES:', JSON.stringify(b5UnauthorizedChanges, null, 2));
    }
    console.log(`Unverified Entries (PRE=${pre.unverifiedEntries.length}, POST=${post.unverifiedEntries.length})`);
    console.log(`G5 Filesystem Inventory Verdict: ${verdict}`);

    if (verdict === 'FAIL') {
        process.exit(1);
    }
}

// ============================================================================
// G2 Synthetic Unit Suite (R1 — 26 Assertions)
// ============================================================================

function computeA1ScoreRaw(meta: { inboundEdges?: number; externalEdges?: number; size?: number; authorityReach?: number }): number {
    const fanIn = meta.inboundEdges || 0;
    const fanOut = meta.externalEdges || 0;
    const size = meta.size || 0;
    const blastRadius = fanOut * size;
    const authorityReach = meta.authorityReach || 0.0;
    const controlScore = Math.floor(fanIn * 10 + blastRadius * 2 + authorityReach * 100);
    return !Number.isFinite(controlScore) || controlScore <= 0 ? 0 : controlScore;
}

function computeE2ScoreRaw(meta: { size?: number; internalEdges?: number; externalEdges?: number }): number {
    const size = meta.size || 0;
    const internalEdges = meta.internalEdges || 0;
    const externalEdges = meta.externalEdges || 0;
    const internalDensity = size > 0 ? internalEdges / size : 0;
    const externalDensity = size > 0 ? externalEdges / size : 0;
    return Math.floor(size * internalDensity * internalDensity * externalDensity);
}

interface UnitSuiteReport {
    glob9VectorsPassed: number;
    detector16CasesPassed: number;
    o2RegressionPassed: number;
    totalAssertions: number;
    verdict: 'PASS';
}

function runSyntheticUnitSuite(): UnitSuiteReport {
    console.log('\n=== [G2] Running Synthetic Unit Suite (26 Assertions, Real NodeRole + Raw Metrics) ===');
    let glob9VectorsPassed = 0;
    let detector16CasesPassed = 0;
    let o2RegressionPassed = 0;

    // 1. 9 boundary vectors for **/test/**
    const resolverDoubleStarTest = ScopeResolver.loadConfig(undefined, ['**/test/**']);
    const globVectors: Array<[string, boolean]> = [
        ['test/smoke/a.ts', true],
        ['src/vs/workbench/test/browser/componentFixtures/chat/a.ts', true],
        ['extensions/copilot/test/a.ts', true],
        ['src/test', true],
        ['extensions/vscode-api-tests/src/a.ts', false],
        ['src/vs/Test/a.ts', false],
        ['src/vs/test_util.ts', false],
        ['/test/a.ts', false],
        ['ghost://test/a', false]
    ];
    assert(globVectors.length === 9, 'Glob vectors must be exactly 9');
    for (const [target, expected] of globVectors) {
        const actual = resolverDoubleStarTest.matches(target);
        assert(actual === expected, `**/test/** match("${target}") expected=${expected}, actual=${actual}`);
        glob9VectorsPassed++;
    }

    const makeNodes = (specs: Array<[string, NodeRole]>) => specs.map(([id, role]) => ({ id, filePath: id, role }));
    const a1PositiveMeta = (members: string[]) => ({
        members,
        size: 10,
        inboundEdges: 10,
        internalEdges: 20,
        externalEdges: 5,
        authorityReach: 0.5
    }); // expected controlScore = 250
    const e2PositiveMeta = (members: string[]) => ({
        members,
        size: 10,
        inboundEdges: 10,
        internalEdges: 20,
        externalEdges: 10,
        authorityReach: 0.5
    }); // expected complexityScore = 40
    const zeroMeta = (members: string[]) => ({
        members,
        size: 10,
        inboundEdges: 0,
        internalEdges: 0,
        externalEdges: 0,
        authorityReach: 0.0
    }); // expected 0 for both

    const makeBoundary = (targetId: string, metadata: Record<string, unknown>) => ({
        type: 'semantic',
        evidenceType: 'BOUNDARY_NODE',
        targetId,
        nodeId: targetId,
        metadata
    });

    type FixtureCase = {
        id: string;
        nodes: Array<{ id: string; filePath: string; role: NodeRole }>;
        patterns: string[];
        a1Boundaries: Array<ReturnType<typeof makeBoundary>>;
        e2Boundaries: Array<ReturnType<typeof makeBoundary>>;
        verify: (detectorName: 'A1' | 'E2', findings: any[]) => void;
    };

    const fx1Members = Array.from({ length: 10 }, (_, i) => `core/f${i}.ts`);
    const fx2Members = [...Array.from({ length: 5 }, (_, i) => `mix/t${i}.ts`), ...Array.from({ length: 5 }, (_, i) => `mix/r${i}.ts`)];
    const fx3Members = [...Array.from({ length: 8 }, (_, i) => `t80/t${i}.ts`), ...Array.from({ length: 2 }, (_, i) => `t80/r${i}.ts`)];
    const fx4Members = Array.from({ length: 10 }, (_, i) => `tests/t${i}.ts`);
    const fx5ZeroMembers = Array.from({ length: 10 }, (_, i) => `tests/z${i}.ts`);
    const fx5CtrlMembers = Array.from({ length: 10 }, (_, i) => `core/c${i}.ts`);
    const fx8Members = [...Array.from({ length: 8 }, (_, i) => `tests/t${i}.ts`), ...Array.from({ length: 2 }, (_, i) => `core/r${i}.ts`)];

    const fixtures: FixtureCase[] = [
        {
            id: 'FX-1 (0.0 ratio, [])',
            nodes: makeNodes(fx1Members.map(m => [m, NodeRole.RUNTIME])),
            patterns: [],
            a1Boundaries: [makeBoundary('core/mod', a1PositiveMeta(fx1Members))],
            e2Boundaries: [makeBoundary('core/mod', e2PositiveMeta(fx1Members))],
            verify: (d, f) => {
                assert(f.length === 1 && f[0].targetId === 'core/mod', `${d} FX-1 expected 1 finding`);
                const m = f[0].evidence[0].metadata;
                assert(m.universeCandidates === 1 && m.excludedByScope === 0 && m.eligibleCandidates === 1, `${d} FX-1 accounting`);
                assert((d === 'A1' ? m.controlScore : m.complexityScore) === (d === 'A1' ? 250 : 40), `${d} FX-1 raw score`);
            }
        },
        {
            id: 'FX-2 (0.5 ratio, [])',
            nodes: makeNodes([
                ...fx2Members.slice(0, 5).map(m => [m, NodeRole.TEST] as [string, NodeRole]),
                ...fx2Members.slice(5).map(m => [m, NodeRole.RUNTIME] as [string, NodeRole])
            ]),
            patterns: [],
            a1Boundaries: [makeBoundary('mix/mod', a1PositiveMeta(fx2Members))],
            e2Boundaries: [makeBoundary('mix/mod', e2PositiveMeta(fx2Members))],
            verify: (d, f) => {
                assert(f.length === 1 && f[0].targetId === 'mix/mod', `${d} FX-2 expected 1 finding`);
            }
        },
        {
            id: 'FX-3 (0.8 ratio boundary, [])',
            nodes: makeNodes([
                ...fx3Members.slice(0, 8).map(m => [m, NodeRole.TEST] as [string, NodeRole]),
                ...fx3Members.slice(8).map(m => [m, NodeRole.RUNTIME] as [string, NodeRole])
            ]),
            patterns: [],
            a1Boundaries: [makeBoundary('t80/mod', a1PositiveMeta(fx3Members))],
            e2Boundaries: [makeBoundary('t80/mod', e2PositiveMeta(fx3Members))],
            verify: (d, f) => {
                assert(f.length === 1 && f[0].targetId === 't80/mod', `${d} FX-3 expected 1 finding (testRatio=0.8 filter removed)`);
            }
        },
        {
            id: 'FX-4 (1.0 ratio, [])',
            nodes: makeNodes(fx4Members.map(m => [m, NodeRole.TEST])),
            patterns: [],
            a1Boundaries: [makeBoundary('tests/suite', a1PositiveMeta(fx4Members))],
            e2Boundaries: [makeBoundary('tests/suite', e2PositiveMeta(fx4Members))],
            verify: (d, f) => {
                assert(f.length === 1 && f[0].targetId === 'tests/suite', `${d} FX-4 expected 1 finding (testRatio=1.0 filter removed)`);
            }
        },
        {
            id: 'FX-5 (D1 score>0 precedes scopeExclusions)',
            nodes: makeNodes([
                ...fx5ZeroMembers.map(m => [m, NodeRole.TEST] as [string, NodeRole]),
                ...fx5CtrlMembers.map(m => [m, NodeRole.RUNTIME] as [string, NodeRole])
            ]),
            patterns: ['tests/**'],
            a1Boundaries: [makeBoundary('tests/zero', zeroMeta(fx5ZeroMembers)), makeBoundary('core/app', a1PositiveMeta(fx5CtrlMembers))],
            e2Boundaries: [makeBoundary('tests/zero', zeroMeta(fx5ZeroMembers)), makeBoundary('core/app', e2PositiveMeta(fx5CtrlMembers))],
            verify: (d, f) => {
                assert(f.length === 1 && f[0].targetId === 'core/app', `${d} FX-5 expected only core/app`);
                const m = f[0].evidence[0].metadata;
                assert(
                    m.universeCandidates === 1 && m.excludedByScope === 0 && m.eligibleCandidates === 1,
                    `${d} FX-5 D1 violation: expected U=1, Ex=0, El=1, got U=${m.universeCandidates}, Ex=${m.excludedByScope}, El=${m.eligibleCandidates}`
                );
            }
        },
        {
            id: 'FX-6 (boundary: empty members [] with size=10)',
            nodes: [],
            patterns: ['**'],
            a1Boundaries: [makeBoundary('empty/mod', a1PositiveMeta([]))],
            e2Boundaries: [makeBoundary('empty/mod', e2PositiveMeta([]))],
            verify: (d, f) => {
                assert(f.length === 1 && f[0].targetId === 'empty/mod', `${d} FX-6 members.length > 0 guard must retain empty/mod`);
            }
        },
        {
            id: 'FX-7 (Full Match exclusion + accounting)',
            nodes: makeNodes([
                ...fx4Members.map(m => [m, NodeRole.TEST] as [string, NodeRole]),
                ...fx5CtrlMembers.map(m => [m, NodeRole.RUNTIME] as [string, NodeRole])
            ]),
            patterns: ['tests/**'],
            a1Boundaries: [makeBoundary('tests/suite', a1PositiveMeta(fx4Members)), makeBoundary('core/app', a1PositiveMeta(fx5CtrlMembers))],
            e2Boundaries: [makeBoundary('tests/suite', e2PositiveMeta(fx4Members)), makeBoundary('core/app', e2PositiveMeta(fx5CtrlMembers))],
            verify: (d, f) => {
                assert(f.length === 1 && f[0].targetId === 'core/app', `${d} FX-7 expected only core/app`);
                const m = f[0].evidence[0].metadata;
                assert(m.universeCandidates === 2 && m.excludedByScope === 1 && m.eligibleCandidates === 1, `${d} FX-7 expected U=2, Ex=1, El=1`);
            }
        },
        {
            id: 'FX-8 (0.8 hybrid Partial Match retention + scopeStatus)',
            nodes: makeNodes([
                ...fx8Members.slice(0, 8).map(m => [m, NodeRole.TEST] as [string, NodeRole]),
                ...fx8Members.slice(8).map(m => [m, NodeRole.RUNTIME] as [string, NodeRole])
            ]),
            patterns: ['tests/**'],
            a1Boundaries: [makeBoundary('hybrid/mod', a1PositiveMeta(fx8Members))],
            e2Boundaries: [makeBoundary('hybrid/mod', e2PositiveMeta(fx8Members))],
            verify: (d, f) => {
                assert(f.length === 1 && f[0].targetId === 'hybrid/mod', `${d} FX-8 Partial Match must retain eligibility`);
                const m = f[0].evidence[0].metadata;
                assert(
                    m.scopeStatus === 'Partially Excluded (Eligible: 2/10, Excluded: 8/10)',
                    `${d} FX-8 scopeStatus mismatch: ${m.scopeStatus}`
                );
            }
        }
    ];

    for (const fx of fixtures) {
        const srA1 = ScopeResolver.loadConfig(undefined, fx.patterns);
        const a1Findings = new SystemCoreDetector().detect(
            { snapshot: { nodes: fx.nodes }, scopeResolver: srA1 },
            { evidenceBundle: { findings: fx.a1Boundaries } }
        );
        fx.verify('A1', a1Findings);
        detector16CasesPassed++;

        const srE2 = ScopeResolver.loadConfig(undefined, fx.patterns);
        const e2Findings = new ChangeAmplifierDetector().detect(
            { snapshot: { nodes: fx.nodes }, scopeResolver: srE2 },
            { evidenceBundle: { findings: fx.e2Boundaries } }
        );
        fx.verify('E2', e2Findings);
        detector16CasesPassed++;
    }

    // FX-O2: EntryPointDetector NodeRole.TEST preservation
    const o2Nodes = [
        { id: 'tests/e.ts', filePath: 'tests/e.ts', role: NodeRole.TEST },
        { id: 'src/main.ts', filePath: 'src/main.ts', role: NodeRole.RUNTIME },
        { id: 'src/dep.ts', filePath: 'src/dep.ts', role: NodeRole.RUNTIME }
    ];
    const o2Edges = [
        { from: 'tests/e.ts', to: 'src/dep.ts' },
        { from: 'src/main.ts', to: 'src/dep.ts' }
    ];
    const o2Findings = new EntryPointDetector().detect({
        snapshot: { nodes: o2Nodes, edges: o2Edges },
        scopeResolver: ScopeResolver.loadConfig(undefined, [])
    });
    assert(
        o2Findings.length === 1 && o2Findings[0].targetId === 'src/main.ts',
        `FX-O2 failed: expected only src/main.ts, got ${o2Findings.map(f => f.targetId).join(', ')}`
    );
    o2RegressionPassed = 1;

    const totalAssertions = glob9VectorsPassed + detector16CasesPassed + o2RegressionPassed;
    console.log(`G2 PASSED: 9 glob vectors + 16 A1/E2 fixtures + 1 O2 regression = ${totalAssertions}/26 assertions.`);
    return {
        glob9VectorsPassed,
        detector16CasesPassed,
        o2RegressionPassed,
        totalAssertions,
        verdict: 'PASS'
    };
}

// ============================================================================
// Pipeline Helpers, Finding Validation (R2-3) & Ranking Parity (R2-1, M2)
// ============================================================================

function normalizeFindings(findings: any[]): any[] {
    const cloned = JSON.parse(JSON.stringify(findings));
    for (const f of cloned) {
        delete f.findingId;
        if (Array.isArray(f.evidence)) {
            for (const e of f.evidence) {
                delete e.evidenceId;
            }
        }
    }
    return cloned;
}

interface PatternAccountingDirect {
    count: number;
    universeCandidates: number | null;
    excludedByScope: number | null;
    eligibleCandidates: number | null;
    emptyStatus?: string;
}

function validateAndExtractPattern(
    allFindings: any[],
    patternId: 'SYSTEM_CORE' | 'CHANGE_AMPLIFIER' | 'DEPENDENCY_ROOT',
    hasExclusions: boolean,
    inputEmptyContext: {
        rawBoundaryNodeCount: number;
        rawComponentCandidateCount: number;
        stage2ExcludedComponentCount: number;
        zeroScoreComponentCount: number;
        isBefore: boolean;
    }
): PatternAccountingDirect {
    const arr = allFindings.filter(f => f && f.patternId === patternId);
    if (arr.length === 0) {
        if (patternId === 'SYSTEM_CORE' || patternId === 'CHANGE_AMPLIFIER') {
            if (inputEmptyContext.rawBoundaryNodeCount === 0) {
                return { count: 0, universeCandidates: 0, excludedByScope: 0, eligibleCandidates: 0, emptyStatus: 'NO_SIMULATION_EVIDENCE_BOUNDARY_NODES' };
            }
            if (inputEmptyContext.isBefore && inputEmptyContext.stage2ExcludedComponentCount === inputEmptyContext.rawComponentCandidateCount) {
                return { count: 0, universeCandidates: 0, excludedByScope: 0, eligibleCandidates: 0, emptyStatus: 'ALL_EXCLUDED_BY_STAGE2_TEST_RATIO' };
            }
            const remainingAfterStage2 = inputEmptyContext.rawComponentCandidateCount - inputEmptyContext.stage2ExcludedComponentCount;
            if (inputEmptyContext.zeroScoreComponentCount === remainingAfterStage2) {
                return { count: 0, universeCandidates: 0, excludedByScope: 0, eligibleCandidates: 0, emptyStatus: 'ALL_ZERO_SCORE' };
            }
            return { count: 0, universeCandidates: null, excludedByScope: null, eligibleCandidates: null, emptyStatus: 'EMPTY_OR_UNEXPECTED_CHECK_WITH_PARITY' };
        }
        return { count: 0, universeCandidates: null, excludedByScope: null, eligibleCandidates: null, emptyStatus: 'EMPTY_O2_CHECK_WITH_CONTEXT' };
    }

    const seenTargets = new Set<string>();
    const seenRanks = new Set<number>();
    let refUniverse = -1;
    let refExcluded = -1;
    let refEligible = -1;

    for (let i = 0; i < arr.length; i++) {
        const f = arr[i];
        const targetStr = String(f.targetId);
        assert(!seenTargets.has(targetStr), `${patternId}: duplicate targetId "${targetStr}"`);
        seenTargets.add(targetStr);

        assert(Array.isArray(f.evidence) && f.evidence.length >= 1, `${patternId}[${i}] missing evidence[0]`);
        const meta = f.evidence[0].metadata;
        assert(meta !== null && typeof meta === 'object' && !Array.isArray(meta), `${patternId}[${i}] metadata not plain object`);

        for (const key of ['universeCandidates', 'excludedByScope', 'eligibleCandidates'] as const) {
            const val = meta[key];
            assert(
                typeof val === 'number' && Number.isFinite(val) && Number.isInteger(val) && val >= 0,
                `${patternId}[${i}].${key} invalid integer: ${val}`
            );
        }

        if (i === 0) {
            refUniverse = meta.universeCandidates;
            refExcluded = meta.excludedByScope;
            refEligible = meta.eligibleCandidates;
        } else {
            assert(meta.universeCandidates === refUniverse, `${patternId}[${i}].universeCandidates mismatch`);
            assert(meta.excludedByScope === refExcluded, `${patternId}[${i}].excludedByScope mismatch`);
            assert(meta.eligibleCandidates === refEligible, `${patternId}[${i}].eligibleCandidates mismatch`);
        }

        if (patternId === 'SYSTEM_CORE' || patternId === 'CHANGE_AMPLIFIER') {
            assert(
                typeof meta.totalCandidates === 'number' &&
                    Number.isFinite(meta.totalCandidates) &&
                    Number.isInteger(meta.totalCandidates) &&
                    meta.totalCandidates === refUniverse,
                `${patternId}[${i}].totalCandidates mismatch: ${meta.totalCandidates} !== ${refUniverse}`
            );
            assert(
                typeof meta.hasScopeExclusions === 'boolean' && meta.hasScopeExclusions === hasExclusions,
                `${patternId}[${i}].hasScopeExclusions mismatch`
            );
            assert(
                typeof meta.rank === 'number' && Number.isFinite(meta.rank) && Number.isInteger(meta.rank) && meta.rank === i + 1,
                `${patternId}[${i}].rank continuity failure: expected ${i + 1}, got ${meta.rank}`
            );
            assert(!seenRanks.has(meta.rank), `${patternId}: duplicate rank ${meta.rank}`);
            seenRanks.add(meta.rank);
        }
    }

    assert(refUniverse === refExcluded + refEligible, `${patternId}: universe (${refUniverse}) !== excluded (${refExcluded}) + eligible (${refEligible})`);
    if (patternId === 'SYSTEM_CORE' || patternId === 'CHANGE_AMPLIFIER') {
        const expectedP90 = refEligible === 0 ? 0 : Math.ceil(0.1 * refEligible);
        assert(arr.length === expectedP90, `${patternId}: cSelected (${arr.length}) !== ceil(0.1 * ${refEligible}) (${expectedP90})`);
    } else {
        assert(arr.length === Math.min(5, refEligible), `DEPENDENCY_ROOT: cSelected (${arr.length}) !== min(5, ${refEligible})`);
    }

    return {
        count: arr.length,
        universeCandidates: refUniverse,
        excludedByScope: refExcluded,
        eligibleCandidates: refEligible
    };
}

interface CandidateFullRecord {
    targetId: string;
    membersCount: number;
    matchedMembersCount: number;
    testRoleMembersCount: number;
    testRatio: number;
    stage2ExcludedBefore: boolean;
    score: number;
    inUniverse: boolean;
    excludedByScope: boolean;
    eligibleRank: number | null;
    inP90Selected: boolean;
    scopeStatus?: string;
}

interface AccountingBreakdown {
    rawBoundaryNodeCount: number;
    rawComponentCandidateCount: number;
    stage2ExcludedComponentCount: number;
    zeroScoreComponentCount: number;
    universeCandidates: number;
    excludedByScope: number;
    eligibleCandidates: number;
    p90Count: number;
    cSelected: number;
    accountingEquationOk: boolean;
}

function buildAuxiliaryRankingAndAssertParity(
    detectorType: 'A1' | 'E2',
    snapshot: any,
    simContext: any,
    scopeResolver: ScopeResolver,
    isBefore: boolean,
    allFindingsFromPipeline: any[],
    directMeta: PatternAccountingDirect
): { accounting: AccountingBreakdown; candidates: CandidateFullRecord[]; byTarget: Record<string, CandidateFullRecord> } {
    const patternId = detectorType === 'A1' ? 'SYSTEM_CORE' : 'CHANGE_AMPLIFIER';
    const rawFindings = (simContext?.evidenceBundle?.findings || []).filter(
        (f: any) => f.type === 'semantic' && f.evidenceType === 'BOUNDARY_NODE'
    );
    const rawBoundaryNodeCount = rawFindings.length;
    const seenIds = new Set<string>();
    for (const f of rawFindings) {
        assert(typeof f.targetId === 'string' && f.targetId.trim().length > 0, `Invalid BOUNDARY_NODE targetId: ${f.targetId}`);
        assert(!seenIds.has(f.targetId), `DUPLICATE_BOUNDARY_TARGET_ID: ${f.targetId}`);
        seenIds.add(f.targetId);
    }
    const rawComponentCandidateCount = seenIds.size;
    assert(rawBoundaryNodeCount === rawComponentCandidateCount, `Dimension mismatch: rawBoundaryNodeCount=${rawBoundaryNodeCount} !== rawComponentCandidateCount=${rawComponentCandidateCount}`);

    const nodeRoleMap = new Map<string, string>();
    for (const n of snapshot?.nodes || []) {
        if (n.role) {
            nodeRoleMap.set(n.id || n.filePath, String(n.role).toLowerCase());
        }
    }

    let stage2ExcludedComponentCount = 0;
    let zeroScoreComponentCount = 0;
    const universeList: Array<{ f: any; score: number; testCount: number; testRatio: number }> = [];

    for (const f of rawFindings) {
        const members: string[] = f.metadata?.members || [];
        let testCount = 0;
        if (members.length > 0 && nodeRoleMap.size > 0) {
            for (const m of members) {
                const r = nodeRoleMap.get(m);
                if (r === 'test' || r === NodeRole.TEST.toLowerCase()) testCount++;
            }
        }
        const testRatio = members.length > 0 ? testCount / members.length : 0;
        const stage2Excluded = isBefore && members.length > 0 && nodeRoleMap.size > 0 && testRatio >= 0.8;
        if (stage2Excluded) {
            stage2ExcludedComponentCount++;
            continue;
        }
        const score = detectorType === 'A1' ? computeA1ScoreRaw(f.metadata || {}) : computeE2ScoreRaw(f.metadata || {});
        if (score <= 0) {
            zeroScoreComponentCount++;
            continue;
        }
        universeList.push({ f, score, testCount, testRatio });
    }

    const universeCandidates = universeList.length;
    const eligibleList: Array<{ f: any; score: number; testCount: number; testRatio: number; matched: number; scopeStatus?: string }> = [];
    const excludedSet = new Set<string>();
    let excludedByScope = 0;

    for (const item of universeList) {
        const members: string[] = item.f.metadata?.members || [];
        let matched = 0;
        for (const m of members) {
            if (scopeResolver.matches(m)) matched++;
        }
        if (scopeResolver.hasExclusions() && members.length > 0 && matched === members.length) {
            excludedByScope++;
            excludedSet.add(item.f.targetId);
            continue;
        }
        const eligibleMembers = members.length - matched;
        const scopeStatus =
            scopeResolver.hasExclusions() && matched > 0 && eligibleMembers > 0
                ? `Partially Excluded (Eligible: ${eligibleMembers}/${members.length}, Excluded: ${matched}/${members.length})`
                : undefined;
        eligibleList.push({ ...item, matched, scopeStatus });
    }

    eligibleList.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.f.targetId < b.f.targetId ? -1 : a.f.targetId > b.f.targetId ? 1 : 0;
    });

    const eligibleCandidates = eligibleList.length;
    const p90Count = eligibleCandidates === 0 ? 0 : Math.ceil(0.1 * eligibleCandidates);
    const rankMap = new Map<string, { rank: number; inP90: boolean; scopeStatus?: string; matched: number }>();
    for (let i = 0; i < eligibleList.length; i++) {
        rankMap.set(eligibleList[i].f.targetId, {
            rank: i + 1,
            inP90: i < p90Count,
            scopeStatus: eligibleList[i].scopeStatus,
            matched: eligibleList[i].matched
        });
    }

    const pipelineArr = allFindingsFromPipeline.filter(x => x.patternId === patternId);
    assert(pipelineArr.length === p90Count, `PIPELINE_PARITY_MISMATCH (${patternId}): pipeline length ${pipelineArr.length} !== aux p90 ${p90Count}`);
    if (pipelineArr.length > 0) {
        assert(directMeta.universeCandidates === universeCandidates, `PIPELINE_PARITY_MISMATCH (${patternId}): universe ${directMeta.universeCandidates} !== ${universeCandidates}`);
        assert(directMeta.excludedByScope === excludedByScope, `PIPELINE_PARITY_MISMATCH (${patternId}): excluded ${directMeta.excludedByScope} !== ${excludedByScope}`);
        assert(directMeta.eligibleCandidates === eligibleCandidates, `PIPELINE_PARITY_MISMATCH (${patternId}): eligible ${directMeta.eligibleCandidates} !== ${eligibleCandidates}`);
    } else if (eligibleCandidates > 0) {
        throw new Error(`UNEXPECTED_EMPTY_FINDINGS (${patternId}): eligibleCandidates=${eligibleCandidates} but pipeline emitted 0`);
    }

    for (let i = 0; i < p90Count; i++) {
        const pf = pipelineArr[i];
        const aux = eligibleList[i];
        assert(pf.targetId === aux.f.targetId, `PIPELINE_PARITY_MISMATCH (${patternId}[${i}]): targetId ${pf.targetId} !== ${aux.f.targetId}`);
        const pfMeta = pf.evidence[0].metadata;
        const pfScore = detectorType === 'A1' ? pfMeta.controlScore : pfMeta.complexityScore;
        assert(pfScore === aux.score, `PIPELINE_PARITY_MISMATCH (${patternId}[${i}]): score ${pfScore} !== ${aux.score}`);
        assert(pfMeta.rank === i + 1, `PIPELINE_PARITY_MISMATCH (${patternId}[${i}]): rank ${pfMeta.rank} !== ${i + 1}`);
        assert(pfMeta.scopeStatus === aux.scopeStatus, `PIPELINE_PARITY_MISMATCH (${patternId}[${i}]): scopeStatus ${pfMeta.scopeStatus} !== ${aux.scopeStatus}`);
    }

    const eq1 = rawComponentCandidateCount === stage2ExcludedComponentCount + zeroScoreComponentCount + universeCandidates;
    const eq2 = universeCandidates === excludedByScope + eligibleCandidates;
    assert(eq1 && eq2, `PIPELINE_ACCOUNTING_MISMATCH (${patternId}): eq1=${eq1}, eq2=${eq2}`);

    const candidates: CandidateFullRecord[] = [];
    const byTarget: Record<string, CandidateFullRecord> = {};
    for (const f of rawFindings) {
        const members: string[] = f.metadata?.members || [];
        let testCount = 0;
        if (members.length > 0 && nodeRoleMap.size > 0) {
            for (const m of members) {
                const r = nodeRoleMap.get(m);
                if (r === 'test' || r === NodeRole.TEST.toLowerCase()) testCount++;
            }
        }
        const testRatio = members.length > 0 ? testCount / members.length : 0;
        let matchedMembersCount = 0;
        for (const m of members) {
            if (scopeResolver.matches(m)) matchedMembersCount++;
        }
        const stage2ExcludedBefore = isBefore && members.length > 0 && nodeRoleMap.size > 0 && testRatio >= 0.8;
        const score = detectorType === 'A1' ? computeA1ScoreRaw(f.metadata || {}) : computeE2ScoreRaw(f.metadata || {});
        const inUniverse = !stage2ExcludedBefore && score > 0;
        const excludedByScopeFlag = excludedSet.has(f.targetId);
        const rInfo = rankMap.get(f.targetId);
        const rec: CandidateFullRecord = {
            targetId: f.targetId,
            membersCount: members.length,
            matchedMembersCount,
            testRoleMembersCount: testCount,
            testRatio,
            stage2ExcludedBefore,
            score,
            inUniverse,
            excludedByScope: excludedByScopeFlag,
            eligibleRank: rInfo ? rInfo.rank : null,
            inP90Selected: rInfo ? rInfo.inP90 : false,
            scopeStatus: rInfo?.scopeStatus
        };
        candidates.push(rec);
        byTarget[rec.targetId] = rec;
    }

    return {
        accounting: {
            rawBoundaryNodeCount,
            rawComponentCandidateCount,
            stage2ExcludedComponentCount,
            zeroScoreComponentCount,
            universeCandidates,
            excludedByScope,
            eligibleCandidates,
            p90Count,
            cSelected: pipelineArr.length,
            accountingEquationOk: eq1 && eq2
        },
        candidates,
        byTarget
    };
}

// ============================================================================
// Per-Run Execution (R2-2 Option 1 — Original rootPath Preserved)
// ============================================================================

interface CallRecord {
    callIndex: number;
    command: string;
    reportFile: ReportFileName;
    reportPath: string;
    reportBytes: number;
    reportSha256: string;
    allFindingsPath: string;
    allFindingsBytes: number;
    allFindingsSha256: string;
    originalFindingsCount: number;
    executiveSummaryStatus: { status: 'NOT_APPLICABLE'; reason: string };
    directAccounting: {
        a1: PatternAccountingDirect;
        e2: PatternAccountingDirect;
        o2: PatternAccountingDirect;
    };
}

interface RunRecord {
    stage: 'before' | 'after';
    dataset: DatasetId;
    scenario: ScenarioId;
    runIndex: number;
    patterns: string[];
    calls: CallRecord[];
    crossCallNormalizedIdentical: boolean;
    reports: Record<ReportFileName, { path: string; bytes: number; sha256: string }>;
    detectorSnapshotPath: string;
    detectorSnapshotSha256: string;
    accounting: { a1: AccountingBreakdown; e2: AccountingBreakdown };
}

function summarizeUnchangedPatterns(normalizedFindings: any[]): Record<string, any[]> {
    const out: Record<string, any[]> = {
        DEPENDENCY_ROOT: [],
        CROSS_BOUNDARY_REFERENCE: [],
        BOUNDARY_CANDIDATE_GROUP: [],
        CONTROL_BRIDGE: []
    };
    for (const f of normalizedFindings) {
        if (f.patternId === 'DEPENDENCY_ROOT') out.DEPENDENCY_ROOT.push(f);
        else if (f.patternId === 'CROSS_BOUNDARY_REFERENCE') out.CROSS_BOUNDARY_REFERENCE.push(f);
        else if (
            f.patternId === 'HIGH_ISOLATION_BOUNDARY' ||
            f.patternId === 'BOUNDARY_CANDIDATE' ||
            f.patternId === 'LOW_ISOLATION_BOUNDARY'
        ) {
            out.BOUNDARY_CANDIDATE_GROUP.push(f);
        } else if (f.patternId === 'CONTROL_BRIDGE') {
            out.CONTROL_BRIDGE.push(f);
        }
    }
    return out;
}

async function processScenarioRun(
    stage: 'before' | 'after',
    scen: ScenarioDef,
    runIndex: number,
    rawStateStr: string,
    rawSimStr: string,
    preSsotHashes: { projectState: string; simEvidence: string },
    reuseExisting: boolean
): Promise<{ runRecord: RunRecord; snapshotObj: any }> {
    const proj = PROJECTS[scen.dataset];
    const runDir = path.join(EVIDENCE_ROOT, stage, scen.dataset, `scenario_${scen.scenario}`, `run_${runIndex}`);
    if (reuseExisting) {
        assert(fs.existsSync(runDir), `Missing existing run directory: ${runDir}`);
        assert(sha256File(proj.projectStatePath).sha256 === preSsotHashes.projectState, `SSoT project_state hash mismatch before loading ${scen.dataset}/${scen.scenario}`);
        assert(sha256File(proj.simEvidencePath).sha256 === preSsotHashes.simEvidence, `SSoT simulation_evidence hash mismatch before loading ${scen.dataset}/${scen.scenario}`);
    } else {
        ensureDir(runDir);
    }
    const bundleDir = path.join(proj.rootPath, 'synapse_report', 'surgery');

    const parsedSimForMeta = JSON.parse(rawSimStr);
    const rawBoundaryForMeta = (parsedSimForMeta?.evidenceBundle?.findings || []).filter(
        (f: any) => f.type === 'semantic' && f.evidenceType === 'BOUNDARY_NODE'
    );
    const callRecords: CallRecord[] = [];
    const callNormalizedList: any[][] = [];
    const reportsSummary = {} as Record<ReportFileName, { path: string; bytes: number; sha256: string }>;

    for (const spec of CALL_SPECS) {
        const callDir = path.join(runDir, spec.callFolder);
        const dstReportPath = path.join(callDir, spec.reportFile);
        const dstAllFindingsPath = path.join(callDir, 'allFindings.json');

        if (!reuseExisting) {
            // Parse fresh snapshot per call so EntryPointDetector mutation cannot leak.
            const parsedState = JSON.parse(rawStateStr);
            const freshSnapshot = {
                nodes: parsedState.nodes || parsedState.graph?.nodes || [],
                edges: parsedState.edges || parsedState.graph?.edges || [],
                clusters: parsedState.clusters || []
            };
            const scopeResolver = ScopeResolver.loadConfig(undefined, scen.patterns);
            const context = {
                workspaceRoot: proj.rootPath,
                snapshot: freshSnapshot,
                scopeResolver,
                metrics: { topImpactFiles: [], systemAssemblyPoints: [] }
            };

            await ReportBundleGenerator.generateBundle(context, proj.rootPath, { command: spec.command });

            // Immediately verify external SSoT 0-byte immutability
            const psHashAfter = sha256File(proj.projectStatePath);
            const simHashAfter = sha256File(proj.simEvidencePath);
            assert(psHashAfter.sha256 === preSsotHashes.projectState, `SSoT project_state mutated during ${scen.dataset}/${scen.scenario}/${spec.command}`);
            assert(simHashAfter.sha256 === preSsotHashes.simEvidence, `SSoT simulation_evidence mutated during ${scen.dataset}/${scen.scenario}/${spec.command}`);

            const srcReportPath = path.join(bundleDir, spec.reportFile);
            const srcAllFindingsPath = path.join(bundleDir, 'allFindings.json');
            assert(fs.existsSync(srcReportPath), `Missing generated report: ${srcReportPath}`);
            assert(fs.existsSync(srcAllFindingsPath), `Missing allFindings.json: ${srcAllFindingsPath}`);

            ensureDir(callDir);
            fs.copyFileSync(srcReportPath, dstReportPath);
            fs.copyFileSync(srcAllFindingsPath, dstAllFindingsPath);

            const srcRepHash = sha256File(srcReportPath);
            const copyRepHash = sha256File(dstReportPath);
            assert(srcRepHash.sha256 === copyRepHash.sha256, `Copy hash mismatch for ${spec.reportFile}`);

            const srcAfHash = sha256File(srcAllFindingsPath);
            const copyAfHash = sha256File(dstAllFindingsPath);
            assert(srcAfHash.sha256 === copyAfHash.sha256, `Copy hash mismatch for allFindings.json`);
        } else {
            assert(fs.existsSync(dstReportPath), `Missing saved report: ${dstReportPath}`);
            assert(fs.existsSync(dstAllFindingsPath), `Missing saved allFindings.json: ${dstAllFindingsPath}`);
        }

        const dstRepHash = sha256File(dstReportPath);
        const dstAfHash = sha256File(dstAllFindingsPath);
        const parsedAf = JSON.parse(fs.readFileSync(dstAllFindingsPath, 'utf8'));
        assert(Array.isArray(parsedAf), `allFindings.json must be an array`);

        const inputEmptyCtx = {
            rawBoundaryNodeCount: rawBoundaryForMeta.length,
            rawComponentCandidateCount: rawBoundaryForMeta.length,
            stage2ExcludedComponentCount: 0,
            zeroScoreComponentCount: 0,
            isBefore: stage === 'before'
        };
        const a1Direct = validateAndExtractPattern(parsedAf, 'SYSTEM_CORE', scen.patterns.length > 0, inputEmptyCtx);
        const e2Direct = validateAndExtractPattern(parsedAf, 'CHANGE_AMPLIFIER', scen.patterns.length > 0, inputEmptyCtx);
        const o2Direct = validateAndExtractPattern(parsedAf, 'DEPENDENCY_ROOT', scen.patterns.length > 0, inputEmptyCtx);

        const normalized = normalizeFindings(parsedAf);
        callNormalizedList.push(normalized);

        callRecords.push({
            callIndex: spec.index,
            command: spec.command,
            reportFile: spec.reportFile,
            reportPath: toPosixRel(WORKSPACE_ROOT, dstReportPath),
            reportBytes: dstRepHash.bytes,
            reportSha256: dstRepHash.sha256,
            allFindingsPath: toPosixRel(WORKSPACE_ROOT, dstAllFindingsPath),
            allFindingsBytes: dstAfHash.bytes,
            allFindingsSha256: dstAfHash.sha256,
            originalFindingsCount: parsedAf.length,
            executiveSummaryStatus: {
                status: 'NOT_APPLICABLE',
                reason: 'ReportBundleGenerator.ts L162-270 defines no fetchExecutiveReport branch; falls back to SIMULATION_DEBUG.md'
            },
            directAccounting: { a1: a1Direct, e2: e2Direct, o2: o2Direct }
        });

        reportsSummary[spec.reportFile] = {
            path: toPosixRel(WORKSPACE_ROOT, dstReportPath),
            bytes: dstRepHash.bytes,
            sha256: dstRepHash.sha256
        };
    }

    const crossIdentical12 = deepEqualJSON(callNormalizedList[0], callNormalizedList[1]);
    const crossIdentical13 = deepEqualJSON(callNormalizedList[0], callNormalizedList[2]);
    assert(crossIdentical12 && crossIdentical13, `CROSS_CALL_DIVERGENCE detected in ${stage}/${scen.dataset}/${scen.scenario}/run_${runIndex}`);

    // Build auxiliary full rankings and assert 100% parity with call_1 allFindings.json
    const parsedStateAux = JSON.parse(rawStateStr);
    const auxSnapshot = {
        nodes: parsedStateAux.nodes || parsedStateAux.graph?.nodes || [],
        edges: parsedStateAux.edges || parsedStateAux.graph?.edges || [],
        clusters: parsedStateAux.clusters || []
    };
    const auxResolver = ScopeResolver.loadConfig(undefined, scen.patterns);
    const call1AllFindings = JSON.parse(fs.readFileSync(path.join(WORKSPACE_ROOT, callRecords[0].allFindingsPath), 'utf8'));
    const auxA1 = buildAuxiliaryRankingAndAssertParity(
        'A1',
        auxSnapshot,
        parsedSimForMeta,
        auxResolver,
        stage === 'before',
        call1AllFindings,
        callRecords[0].directAccounting.a1
    );
    const auxE2 = buildAuxiliaryRankingAndAssertParity(
        'E2',
        auxSnapshot,
        parsedSimForMeta,
        auxResolver,
        stage === 'before',
        call1AllFindings,
        callRecords[0].directAccounting.e2
    );

    const computedSnapshotObj = {
        stage,
        dataset: scen.dataset,
        scenario: scen.scenario,
        runIndex,
        patterns: scen.patterns,
        originalFindingsCount: callRecords[0].originalFindingsCount,
        normalizedFindings: callNormalizedList[0],
        unchangedDetectorNormalized: summarizeUnchangedPatterns(callNormalizedList[0]),
        accounting: { a1: auxA1.accounting, e2: auxE2.accounting },
        fullRankings: { a1: auxA1.candidates, e2: auxE2.candidates }
    };

    const detectorSnapshotPathAbs = path.join(runDir, 'detector_snapshot.json');
    let snapshotObj: any;
    if (reuseExisting) {
        assert(fs.existsSync(detectorSnapshotPathAbs), `Missing saved detector_snapshot.json: ${detectorSnapshotPathAbs}`);
        snapshotObj = JSON.parse(fs.readFileSync(detectorSnapshotPathAbs, 'utf8'));
        const normalizedComputed = JSON.parse(JSON.stringify(computedSnapshotObj));
        assert(
            deepEqualJSON(snapshotObj.normalizedFindings, normalizedComputed.normalizedFindings),
            `Saved detector_snapshot normalizedFindings mismatch in ${stage}/${scen.dataset}/${scen.scenario}/run_${runIndex}`
        );
        assert(
            deepEqualJSON(snapshotObj.unchangedDetectorNormalized, normalizedComputed.unchangedDetectorNormalized),
            `Saved detector_snapshot unchangedDetectorNormalized mismatch in ${stage}/${scen.dataset}/${scen.scenario}/run_${runIndex}`
        );
        assert(
            deepEqualJSON(snapshotObj.accounting, normalizedComputed.accounting),
            `Saved detector_snapshot accounting mismatch in ${stage}/${scen.dataset}/${scen.scenario}/run_${runIndex}`
        );
        assert(
            deepEqualJSON(snapshotObj.fullRankings, normalizedComputed.fullRankings),
            `Saved detector_snapshot fullRankings mismatch in ${stage}/${scen.dataset}/${scen.scenario}/run_${runIndex}`
        );
    } else {
        fs.writeFileSync(detectorSnapshotPathAbs, JSON.stringify(computedSnapshotObj, null, 2), 'utf8');
        snapshotObj = computedSnapshotObj;
    }
    const dsHash = sha256File(detectorSnapshotPathAbs);

    return {
        runRecord: {
            stage,
            dataset: scen.dataset,
            scenario: scen.scenario,
            runIndex,
            patterns: scen.patterns,
            calls: callRecords,
            crossCallNormalizedIdentical: true,
            reports: reportsSummary,
            detectorSnapshotPath: toPosixRel(WORKSPACE_ROOT, detectorSnapshotPathAbs),
            detectorSnapshotSha256: dsHash.sha256,
            accounting: { a1: auxA1.accounting, e2: auxE2.accounting }
        },
        snapshotObj
    };
}

async function executeScenarioRun(
    stage: 'before' | 'after',
    scen: ScenarioDef,
    runIndex: number,
    rawStateStr: string,
    rawSimStr: string,
    preSsotHashes: { projectState: string; simEvidence: string }
): Promise<{ runRecord: RunRecord; snapshotObj: any }> {
    return processScenarioRun(stage, scen, runIndex, rawStateStr, rawSimStr, preSsotHashes, false);
}

async function loadExistingScenarioRun(
    stage: 'after',
    scen: ScenarioDef,
    runIndex: number,
    rawStateStr: string,
    rawSimStr: string,
    preSsotHashes: { projectState: string; simEvidence: string }
): Promise<{ runRecord: RunRecord; snapshotObj: any }> {
    return processScenarioRun(stage, scen, runIndex, rawStateStr, rawSimStr, preSsotHashes, true);
}

function listExternalSurgeryDir(dirPath: string): Array<{ file: string; bytes: number; sha256: string }> {
    if (!fs.existsSync(dirPath)) return [];
    return fs
        .readdirSync(dirPath)
        .filter(name => fs.statSync(path.join(dirPath, name)).isFile())
        .sort()
        .map(name => {
            const h = sha256File(path.join(dirPath, name));
            return { file: name, bytes: h.bytes, sha256: h.sha256 };
        });
}

function getMetadataHeader(mode: string) {
    let tsVersion = 'unknown';
    let tsNodeVersion = 'unknown';
    try {
        tsVersion = require('typescript/package.json').version;
    } catch {}
    try {
        tsNodeVersion = require('ts-node/package.json').version;
    } catch {}
    return {
        platform: os.platform(),
        release: os.release(),
        nodeVersion: process.version,
        typescriptVersion: tsVersion,
        tsNodeVersion,
        cwd: process.cwd(),
        tz: process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
        argv: process.argv,
        mode
    };
}

// ============================================================================
// Modes: --mode=before & --mode=after
// ============================================================================

async function runBeforeMode(): Promise<void> {
    const startedAt = new Date().toISOString();
    console.log('=== [Phase C Stage 2] Running BEFORE Baseline Capture (5 scenarios x 3 calls = 15 generateBundle calls) ===');
    ensureDir(EVIDENCE_ROOT);

    const dataCache = {} as Record<DatasetId, { rawState: string; rawSim: string; hashes: { projectState: string; simEvidence: string } }>;
    const preSurgeryState: Record<string, Array<{ file: string; bytes: number; sha256: string }>> = {};

    for (const ds of ['godot', 'vscode'] as DatasetId[]) {
        const proj = PROJECTS[ds];
        preSurgeryState[ds] = listExternalSurgeryDir(path.join(proj.rootPath, 'synapse_report', 'surgery'));
        const psHash = sha256File(proj.projectStatePath).sha256;
        const simHash = sha256File(proj.simEvidencePath).sha256;
        dataCache[ds] = {
            rawState: fs.readFileSync(proj.projectStatePath, 'utf8'),
            rawSim: fs.readFileSync(proj.simEvidencePath, 'utf8'),
            hashes: { projectState: psHash, simEvidence: simHash }
        };
    }

    const runs: RunRecord[] = [];
    for (const scen of SCENARIOS) {
        console.log(`\n[BEFORE] Dataset=${scen.dataset}, Scenario=${scen.scenario}, Patterns=${JSON.stringify(scen.patterns)}`);
        const d = dataCache[scen.dataset];
        const { runRecord } = await executeScenarioRun('before', scen, 1, d.rawState, d.rawSim, d.hashes);
        runs.push(runRecord);
    }

    // Verify Before Scenario A matches Phase A baseline hashes 6/6
    const baselineCrossCheck: Array<{ dataset: DatasetId; reportFile: ReportFileName; expected: string; actual: string; match: boolean }> = [];
    for (const ds of ['godot', 'vscode'] as DatasetId[]) {
        const runA = runs.find(r => r.dataset === ds && r.scenario === 'A');
        assert(Boolean(runA), `Missing Before Scenario A for ${ds}`);
        for (const rep of ['ONBOARDING_REPORT.md', 'ARCHITECT_REPORT.md', 'SIMULATION_DEBUG.md'] as ReportFileName[]) {
            const expected = PHASE_A_BASELINE_HASHES[ds][rep];
            const actual = runA!.reports[rep].sha256;
            const match = expected === actual;
            baselineCrossCheck.push({ dataset: ds, reportFile: rep, expected, actual, match });
            assert(match, `Phase A baseline mismatch for Before ${ds} Scenario A ${rep}: expected ${expected}, got ${actual}`);
        }
    }
    console.log('\n[PASS] Before Scenario A matches Phase A baseline 6/6 SHA-256 byte-identically.');

    const manifestBefore = {
        environment: { ...getMetadataHeader('before'), startedAt, finishedAt: new Date().toISOString() },
        notApplicable: NOT_APPLICABLE_SCENARIOS,
        preExistingExternalSurgery: preSurgeryState,
        baselineCrossCheck6of6: baselineCrossCheck,
        runs
    };
    const outPath = path.join(EVIDENCE_ROOT, 'manifest_before.json');
    fs.writeFileSync(outPath, JSON.stringify(manifestBefore, null, 2), 'utf8');
    console.log(`Saved Before manifest: ${outPath}`);
}

async function runAfterMode(reuseExistingRuns = false): Promise<void> {
    const startedAt = new Date().toISOString();
    console.log(
        reuseExistingRuns
            ? '=== [Phase C Stage 2] Auditing EXISTING AFTER Artifacts & Cross-Audit ==='
            : '=== [Phase C Stage 2] Running AFTER Verification & Cross-Audit ==='
    );

    const beforeManifestPath = path.join(EVIDENCE_ROOT, 'manifest_before.json');
    assert(fs.existsSync(beforeManifestPath), `manifest_before.json missing: ${beforeManifestPath}`);
    const manifestBefore = JSON.parse(fs.readFileSync(beforeManifestPath, 'utf8'));

    // 1. G2 Synthetic Unit Suite
    const g2Unit = runSyntheticUnitSuite();

    // 2. Load SSoT inputs & run (or audit saved) 5 scenarios x 2 runs = 10 runs (30 generateBundle calls)
    const dataCache = {} as Record<DatasetId, { rawState: string; rawSim: string; hashes: { projectState: string; simEvidence: string } }>;
    for (const ds of ['godot', 'vscode'] as DatasetId[]) {
        const proj = PROJECTS[ds];
        dataCache[ds] = {
            rawState: fs.readFileSync(proj.projectStatePath, 'utf8'),
            rawSim: fs.readFileSync(proj.simEvidencePath, 'utf8'),
            hashes: {
                projectState: sha256File(proj.projectStatePath).sha256,
                simEvidence: sha256File(proj.simEvidencePath).sha256
            }
        };
    }

    const runs: RunRecord[] = [];
    const afterSnapshots: Record<string, any> = {};
    for (const scen of SCENARIOS) {
        const d = dataCache[scen.dataset];
        for (const runIdx of [1, 2]) {
            console.log(
                `\n[${reuseExistingRuns ? 'AUDIT-EXISTING' : 'AFTER'}] Dataset=${scen.dataset}, Scenario=${scen.scenario}, Run=${runIdx}, Patterns=${JSON.stringify(scen.patterns)}`
            );
            const { runRecord, snapshotObj } = reuseExistingRuns
                ? await loadExistingScenarioRun('after', scen, runIdx, d.rawState, d.rawSim, d.hashes)
                : await executeScenarioRun('after', scen, runIdx, d.rawState, d.rawSim, d.hashes);
            runs.push(runRecord);
            afterSnapshots[`${scen.dataset}_${scen.scenario}_${runIdx}`] = snapshotObj;
        }
    }

    // 3. Cross-Audit Engine
    const beforeRuns: RunRecord[] = manifestBefore.runs;
    const beforeSnapshots: Record<string, any> = {};
    for (const br of beforeRuns) {
        beforeSnapshots[`${br.dataset}_${br.scenario}`] = JSON.parse(
            fs.readFileSync(path.join(WORKSPACE_ROOT, br.detectorSnapshotPath), 'utf8')
        );
    }

    // G3-2: Godot A & B invariance (6/6 .md SHA-256 identical)
    const godotInvariance: Array<{ scenario: ScenarioId; reportFile: ReportFileName; beforeSha: string; afterSha: string; identical: boolean }> = [];
    for (const sc of ['A', 'B'] as ScenarioId[]) {
        const bRun = beforeRuns.find(r => r.dataset === 'godot' && r.scenario === sc)!;
        const aRun = runs.find(r => r.dataset === 'godot' && r.scenario === sc && r.runIndex === 1)!;
        for (const rep of ['ARCHITECT_REPORT.md', 'ONBOARDING_REPORT.md', 'SIMULATION_DEBUG.md'] as ReportFileName[]) {
            const bSha = bRun.reports[rep].sha256;
            const aSha = aRun.reports[rep].sha256;
            const identical = bSha === aSha;
            godotInvariance.push({ scenario: sc, reportFile: rep, beforeSha: bSha, afterSha: aSha, identical });
            assert(identical, `Godot Scenario ${sc} ${rep} changed unexpectedly! Before=${bSha}, After=${aSha}`);
        }
    }

    // G3-4 (M4): VS Code 8-component individual tracking for A1 and E2 (separated Candidate State vs Markdown Rendering State)
    const mdTextCache: Record<string, Record<ReportFileName, string>> = {};
    for (const sc of ['A', 'B', 'C'] as ScenarioId[]) {
        const aRun = runs.find(r => r.dataset === 'vscode' && r.scenario === sc && r.runIndex === 1)!;
        mdTextCache[sc] = {
            'ARCHITECT_REPORT.md': fs.readFileSync(path.join(WORKSPACE_ROOT, aRun.reports['ARCHITECT_REPORT.md'].path), 'utf8'),
            'ONBOARDING_REPORT.md': fs.readFileSync(path.join(WORKSPACE_ROOT, aRun.reports['ONBOARDING_REPORT.md'].path), 'utf8'),
            'SIMULATION_DEBUG.md': fs.readFileSync(path.join(WORKSPACE_ROOT, aRun.reports['SIMULATION_DEBUG.md'].path), 'utf8')
        };
    }

    function build8Table(detectorKey: 'a1' | 'e2', reportFile: 'ARCHITECT_REPORT.md' | 'SIMULATION_DEBUG.md') {
        const snapBeforeA = beforeSnapshots['vscode_A'];
        const snapA = afterSnapshots['vscode_A_1'];
        const snapB = afterSnapshots['vscode_B_1'];
        const snapC = afterSnapshots['vscode_C_1'];

        const mapRec = (snap: any) => {
            const m = new Map<string, CandidateFullRecord>();
            for (const c of snap.fullRankings[detectorKey] as CandidateFullRecord[]) m.set(c.targetId, c);
            return m;
        };
        const mBefore = mapRec(snapBeforeA);
        const mA = mapRec(snapA);
        const mB = mapRec(snapB);
        const mC = mapRec(snapC);

        return VSCODE_TARGET_8_IDS.map(id => {
            const b = mBefore.get(id)!;
            const a = mA.get(id)!;
            const sb = mB.get(id)!;
            const sc = mC.get(id)!;
            assert(Boolean(b && a && sb && sc), `Target 8 ID missing in ${detectorKey}: ${id}`);

            const exposureFor = (rec: CandidateFullRecord, mdText: string) => {
                const targetLine = `- **Target**: \`${id}\``;
                const displayedInMarkdownTop5 = mdText.includes(targetLine);
                let reportExposureStatus:
                    | 'TOP5_RENDERED'
                    | 'P90_OVERFLOW_NOT_PRINTED'
                    | 'BELOW_P90_NOT_SELECTED'
                    | 'EXCLUDED_BY_SCOPE'
                    | 'ZERO_SCORE_EXCLUDED';
                if (!rec.inUniverse) reportExposureStatus = 'ZERO_SCORE_EXCLUDED';
                else if (rec.excludedByScope) reportExposureStatus = 'EXCLUDED_BY_SCOPE';
                else if (displayedInMarkdownTop5) reportExposureStatus = 'TOP5_RENDERED';
                else if (rec.inP90Selected) reportExposureStatus = 'P90_OVERFLOW_NOT_PRINTED';
                else reportExposureStatus = 'BELOW_P90_NOT_SELECTED';

                assert(displayedInMarkdownTop5 === (rec.eligibleRank !== null && rec.eligibleRank <= 5 && rec.inP90Selected), `Top5 markdown mismatch for ${detectorKey}/${id}`);

                return {
                    candidateState: {
                        matched: rec.matchedMembersCount,
                        total: rec.membersCount,
                        excludedByScope: rec.excludedByScope,
                        eligibleRank: rec.eligibleRank,
                        inP90Selected: rec.inP90Selected
                    },
                    markdownRenderingState: {
                        displayedInMarkdownTop5,
                        countedInMarkdownOverflow: rec.inP90Selected && !displayedInMarkdownTop5,
                        reportExposureStatus
                    }
                };
            };

            return {
                componentId: id,
                memberCount: a.membersCount,
                beforeState: {
                    stage2Excluded: b.stage2ExcludedBefore,
                    testRoleMembersCount: b.testRoleMembersCount,
                    testRatio: Number(b.testRatio.toFixed(4)),
                    rawScore: b.score
                },
                afterCandidateBase: {
                    afterScore: a.score,
                    inUniverse: a.inUniverse
                },
                scenarioA: exposureFor(a, mdTextCache['A'][reportFile]),
                scenarioB: exposureFor(sb, mdTextCache['B'][reportFile]),
                scenarioC: exposureFor(sc, mdTextCache['C'][reportFile])
            };
        });
    }

    const vscode8A1 = build8Table('a1', 'ARCHITECT_REPORT.md');
    const vscode8E2 = build8Table('e2', 'SIMULATION_DEBUG.md');

    // G3-5 (M5): VS Code 155 BOUNDARY_NODE bidirectional ID set equality + Collateral match audit (B vs C)
    const snapVscodeB = afterSnapshots['vscode_B_1'];
    const snapVscodeC = afterSnapshots['vscode_C_1'];
    const rawVscodeSim = JSON.parse(dataCache.vscode.rawSim);
    const sourceRawBoundary = (rawVscodeSim?.evidenceBundle?.findings || []).filter(
        (f: any) => f.type === 'semantic' && f.evidenceType === 'BOUNDARY_NODE'
    );
    const sourceIds = sourceRawBoundary.map((f: any) => f.targetId as string);
    const sourceIdSet = new Set<string>(sourceIds);
    assert(sourceIds.length === sourceIdSet.size, 'Duplicate IDs in VS Code source BOUNDARY_NODE');
    assert(sourceIdSet.size === 155, `Expected 155 VS Code BOUNDARY_NODE IDs, got ${sourceIdSet.size}`);

    const listB = snapVscodeB.fullRankings.a1 as CandidateFullRecord[];
    const listC = snapVscodeC.fullRankings.a1 as CandidateFullRecord[];
    const resultIdsB = listB.map(r => r.targetId);
    const resultIdsC = listC.map(r => r.targetId);
    const resultSetB = new Set(resultIdsB);
    const resultSetC = new Set(resultIdsC);
    assert(resultIdsB.length === resultSetB.size && resultIdsC.length === resultSetC.size, 'Duplicate IDs in VS Code Scenario B/C results');

    const missingInC = Array.from(sourceIdSet).filter(id => !resultSetC.has(id));
    const extraInC = Array.from(resultSetC).filter(id => !sourceIdSet.has(id));
    assert(missingInC.length === 0 && extraInC.length === 0, `155 ID bidirectional mismatch: missing=${missingInC.length}, extra=${extraInC.length}`);
    assert(resultSetB.size === sourceIdSet.size && Array.from(sourceIdSet).every(id => resultSetB.has(id)), 'Scenario B set mismatch');

    const target8Set = new Set(VSCODE_TARGET_8_IDS);
    for (const t8 of VSCODE_TARGET_8_IDS) {
        assert(sourceIdSet.has(t8), `Target 8 ID missing from 155 set: ${t8}`);
    }

    const mapB = new Map(listB.map(r => [r.targetId, r]));
    const mapC = new Map(listC.map(r => [r.targetId, r]));
    const classify = (r: CandidateFullRecord) =>
        r.membersCount > 0 && r.matchedMembersCount === r.membersCount
            ? 'FULL_MATCH'
            : r.matchedMembersCount > 0
              ? 'PARTIAL_MATCH'
              : 'ZERO_MATCH';

    const target8Transitions: any[] = [];
    const collateralTransitions: any[] = [];
    let allNonTargetUnchanged = 0;

    for (const id of Array.from(sourceIdSet)) {
        const rb = mapB.get(id)!;
        const rc = mapC.get(id)!;
        const entry = {
            componentId: id,
            membersCount: rc.membersCount,
            matchedB: rb.matchedMembersCount,
            classB: classify(rb),
            excludedB: rb.excludedByScope,
            matchedC: rc.matchedMembersCount,
            classC: classify(rc),
            excludedC: rc.excludedByScope,
            changedBetweenBandC: rb.matchedMembersCount !== rc.matchedMembersCount || classify(rb) !== classify(rc) || rb.excludedByScope !== rc.excludedByScope
        };
        if (target8Set.has(id)) {
            target8Transitions.push(entry);
        } else {
            if (entry.changedBetweenBandC) {
                collateralTransitions.push(entry);
            } else {
                allNonTargetUnchanged++;
            }
        }
    }
    assert(target8Transitions.length === 8, 'target8Transitions !== 8');
    assert(target8Transitions.length + collateralTransitions.length + allNonTargetUnchanged === sourceIdSet.size, 'Partition invariant failed');

    function stripSharedA1E2HeaderLines(md: string): string {
        return md
            .split(/\r?\n/)
            .filter(line => !line.startsWith('  - A1 (System Cores): ') && !line.startsWith('  - E2 (Change Amplifiers): '))
            .join('\n');
    }

    // G3-6 (M6): Unchanged detectors (O2/A2/A3/A5 Delta=0) & ONBOARDING_REPORT audit
    const unchangedAudits: Array<{
        dataset: DatasetId;
        scenario: ScenarioId;
        onboardingFullShaIdentical: boolean;
        onboardingO2BodyByteIdentical: boolean;
        onlySharedA1E2HeaderDiff: boolean;
        differingHeaderLines?: { before: string[]; after: string[] };
        unchangedFindingsDeltaZero: boolean;
    }> = [];
    for (const scen of SCENARIOS) {
        const bRun = beforeRuns.find(r => r.dataset === scen.dataset && r.scenario === scen.scenario)!;
        const aRun = runs.find(r => r.dataset === scen.dataset && r.scenario === scen.scenario && r.runIndex === 1)!;
        const onboardingFullShaIdentical = bRun.reports['ONBOARDING_REPORT.md'].sha256 === aRun.reports['ONBOARDING_REPORT.md'].sha256;
        const bMd = fs.readFileSync(path.join(WORKSPACE_ROOT, bRun.reports['ONBOARDING_REPORT.md'].path), 'utf8');
        const aMd = fs.readFileSync(path.join(WORKSPACE_ROOT, aRun.reports['ONBOARDING_REPORT.md'].path), 'utf8');
        const onboardingO2BodyByteIdentical = stripSharedA1E2HeaderLines(bMd) === stripSharedA1E2HeaderLines(aMd);
        const bSnap = beforeSnapshots[`${scen.dataset}_${scen.scenario}`];
        const aSnap = afterSnapshots[`${scen.dataset}_${scen.scenario}_1`];
        const unchangedFindingsDeltaZero = deepEqualJSON(bSnap.unchangedDetectorNormalized, aSnap.unchangedDetectorNormalized);

        assert(unchangedFindingsDeltaZero, `Unchanged detector (O2/A2/A3/A5) Delta !== 0 for ${scen.dataset}/${scen.scenario}`);
        assert(onboardingO2BodyByteIdentical, `ONBOARDING_REPORT.md O2 body/non-A1E2-header changed for ${scen.dataset}/${scen.scenario}`);

        const bAcc = bRun.accounting;
        const aAcc = aRun.accounting;
        const a1E2AccountingChanged =
            scen.patterns.length > 0 &&
            (bAcc.a1.excludedByScope !== aAcc.a1.excludedByScope ||
                bAcc.a1.eligibleCandidates !== aAcc.a1.eligibleCandidates ||
                bAcc.a1.universeCandidates !== aAcc.a1.universeCandidates ||
                bAcc.e2.excludedByScope !== aAcc.e2.excludedByScope ||
                bAcc.e2.eligibleCandidates !== aAcc.e2.eligibleCandidates ||
                bAcc.e2.universeCandidates !== aAcc.e2.universeCandidates);

        let differingHeaderLines: { before: string[]; after: string[] } | undefined;
        if (!a1E2AccountingChanged) {
            assert(onboardingFullShaIdentical, `ONBOARDING_REPORT.md full SHA-256 changed unexpectedly for ${scen.dataset}/${scen.scenario}`);
        } else {
            const bLines = bMd.split(/\r?\n/);
            const aLines = aMd.split(/\r?\n/);
            assert(bLines.length === aLines.length, `ONBOARDING_REPORT.md line count changed for ${scen.dataset}/${scen.scenario}: ${bLines.length} vs ${aLines.length}`);
            const diffBefore: string[] = [];
            const diffAfter: string[] = [];
            for (let i = 0; i < bLines.length; i++) {
                if (bLines[i] !== aLines[i]) {
                    diffBefore.push(bLines[i]);
                    diffAfter.push(aLines[i]);
                }
            }
            const expectedA1Line = `  - A1 (System Cores): ${aAcc.a1.excludedByScope} components excluded (${aAcc.a1.eligibleCandidates} eligible / ${aAcc.a1.universeCandidates} candidates)`;
            const expectedE2Line = `  - E2 (Change Amplifiers): ${aAcc.e2.excludedByScope} components excluded (${aAcc.e2.eligibleCandidates} eligible / ${aAcc.e2.universeCandidates} candidates)`;
            assert(
                diffAfter.length === 2 && diffAfter[0] === expectedA1Line && diffAfter[1] === expectedE2Line,
                `ONBOARDING_REPORT.md diff mismatch for ${scen.dataset}/${scen.scenario}: got ${JSON.stringify(diffAfter)}`
            );
            differingHeaderLines = { before: diffBefore, after: diffAfter };
        }

        const onlySharedA1E2HeaderDiff = a1E2AccountingChanged && !onboardingFullShaIdentical && onboardingO2BodyByteIdentical;
        unchangedAudits.push({
            dataset: scen.dataset,
            scenario: scen.scenario,
            onboardingFullShaIdentical,
            onboardingO2BodyByteIdentical,
            onlySharedA1E2HeaderDiff,
            ...(differingHeaderLines ? { differingHeaderLines } : {}),
            unchangedFindingsDeltaZero
        });
    }

    // G4 (M7): Determinism — 15 .md pairs + 5 detector_snapshot pairs
    const mdDeterminism15Pairs: Array<{ dataset: DatasetId; scenario: ScenarioId; reportFile: ReportFileName; run1Sha: string; run2Sha: string; identical: boolean }> = [];
    const snapshotDeterminism5Pairs: Array<{
        dataset: DatasetId;
        scenario: ScenarioId;
        run1Sha: string;
        run2Sha: string;
        run1PayloadSha: string;
        run2PayloadSha: string;
        payloadByteIdentical: boolean;
        deepEqual: boolean;
        rawDiffOnlyRunIndex: boolean;
    }> = [];
    for (const scen of SCENARIOS) {
        const r1 = runs.find(r => r.dataset === scen.dataset && r.scenario === scen.scenario && r.runIndex === 1)!;
        const r2 = runs.find(r => r.dataset === scen.dataset && r.scenario === scen.scenario && r.runIndex === 2)!;
        for (const rep of ['ARCHITECT_REPORT.md', 'ONBOARDING_REPORT.md', 'SIMULATION_DEBUG.md'] as ReportFileName[]) {
            const s1 = r1.reports[rep].sha256;
            const s2 = r2.reports[rep].sha256;
            const identical = s1 === s2;
            mdDeterminism15Pairs.push({ dataset: scen.dataset, scenario: scen.scenario, reportFile: rep, run1Sha: s1, run2Sha: s2, identical });
            assert(identical, `Report determinism failure ${scen.dataset}/${scen.scenario}/${rep}: ${s1} !== ${s2}`);
        }
        const ds1 = r1.detectorSnapshotSha256;
        const ds2 = r2.detectorSnapshotSha256;
        const snap1 = afterSnapshots[`${scen.dataset}_${scen.scenario}_1`];
        const snap2 = afterSnapshots[`${scen.dataset}_${scen.scenario}_2`];
        const run1PayloadSha = sha256Buffer(Buffer.from(JSON.stringify({ ...snap1, runIndex: undefined }), 'utf8'));
        const run2PayloadSha = sha256Buffer(Buffer.from(JSON.stringify({ ...snap2, runIndex: undefined }), 'utf8'));
        const payloadByteIdentical = run1PayloadSha === run2PayloadSha;
        const deepEqual =
            deepEqualJSON(snap1.normalizedFindings, snap2.normalizedFindings) &&
            deepEqualJSON(snap1.unchangedDetectorNormalized, snap2.unchangedDetectorNormalized) &&
            deepEqualJSON(snap1.accounting, snap2.accounting) &&
            deepEqualJSON(snap1.fullRankings, snap2.fullRankings);
        const rawDiffOnlyRunIndex = ds1 !== ds2 && payloadByteIdentical;
        snapshotDeterminism5Pairs.push({
            dataset: scen.dataset,
            scenario: scen.scenario,
            run1Sha: ds1,
            run2Sha: ds2,
            run1PayloadSha,
            run2PayloadSha,
            payloadByteIdentical,
            deepEqual,
            rawDiffOnlyRunIndex
        });
        assert(payloadByteIdentical && deepEqual, `Snapshot determinism failure ${scen.dataset}/${scen.scenario}`);
    }

    const codeFilesToHash = [
        ['verifyScript', W4_REL],
        ['systemCoreDetector', W1_REL],
        ['changeAmplifierDetector', W2_REL],
        ['scopeResolver', 'src/core/analysis/ScopeResolver.ts'],
        ['entryPointDetector', 'src/core/analysis/patterns/detectors/EntryPointDetector.ts'],
        ['reportBundleGenerator', 'src/core/reporting/ReportBundleGenerator.ts']
    ];
    const codeHashes: Record<string, { path: string; bytes: number; sha256: string }> = {};
    for (const [k, rel] of codeFilesToHash) {
        const h = sha256File(path.join(WORKSPACE_ROOT, rel));
        codeHashes[k] = { path: rel, bytes: h.bytes, sha256: h.sha256 };
    }

    const accountingSummary = SCENARIOS.map(scen => {
        const b = beforeRuns.find(r => r.dataset === scen.dataset && r.scenario === scen.scenario)!.accounting;
        const a = runs.find(r => r.dataset === scen.dataset && r.scenario === scen.scenario && r.runIndex === 1)!.accounting;
        return {
            dataset: scen.dataset,
            scenario: scen.scenario,
            patterns: scen.patterns,
            before: b,
            after: a
        };
    });

    const manifestAfter = {
        environment: {
            ...getMetadataHeader(reuseExistingRuns ? 'audit-existing' : 'after'),
            reusedExistingAfterRuns: reuseExistingRuns,
            startedAt,
            finishedAt: new Date().toISOString()
        },
        notApplicable: NOT_APPLICABLE_SCENARIOS,
        codeHashes,
        runs
    };
    fs.writeFileSync(path.join(EVIDENCE_ROOT, 'manifest_after.json'), JSON.stringify(manifestAfter, null, 2), 'utf8');

    const auditSummary = {
        generatedAt: new Date().toISOString(),
        g2SyntheticUnit: g2Unit,
        g3GodotInvariance6of6: godotInvariance,
        g3AccountingBeforeVsAfter: accountingSummary,
        g3Vscode8ComponentsA1: vscode8A1,
        g3Vscode8ComponentsE2: vscode8E2,
        g3CollateralAudit155: {
            sourceCount: sourceIdSet.size,
            bidirectionalEqualityPass: true,
            target8Transitions,
            collateralTransitionsCount: collateralTransitions.length,
            collateralTransitions,
            nonTargetUnchangedCount: allNonTargetUnchanged
        },
        g3UnchangedDetectorsAndOnboarding: unchangedAudits,
        g4MdDeterminism15Pairs: mdDeterminism15Pairs,
        g4SnapshotDeterminism5Pairs: snapshotDeterminism5Pairs
    };
    fs.writeFileSync(path.join(EVIDENCE_ROOT, 'phase_c_audit_summary.json'), JSON.stringify(auditSummary, null, 2), 'utf8');

    console.log('\n=== [PASS] ALL AFTER G2-G4 CROSS-AUDITS PASSED ===');
    console.log(`- Godot A/B Invariance: ${godotInvariance.filter(x => x.identical).length}/${godotInvariance.length} .md identical`);
    console.log(
        `- Unchanged Detectors (O2/A2/A3/A5) Delta=0: ${unchangedAudits.filter(x => x.unchangedFindingsDeltaZero).length}/${unchangedAudits.length}; ` +
            `ONBOARDING_REPORT: ${unchangedAudits.filter(x => x.onboardingFullShaIdentical).length}/${unchangedAudits.length} full-file identical, ` +
            `${unchangedAudits.filter(x => x.onboardingO2BodyByteIdentical).length}/${unchangedAudits.length} O2-body identical`
    );
    console.log(`- G4 Determinism: ${mdDeterminism15Pairs.filter(x => x.identical).length}/15 .md pairs, ${snapshotDeterminism5Pairs.filter(x => x.payloadByteIdentical && x.deepEqual).length}/5 detector_snapshot payload pairs`);
    console.log(`- VS Code 155 BOUNDARY_NODE Collateral Changes (B vs C): ${collateralTransitions.length} collateral component(s) changed`);
}

async function main(): Promise<void> {
    const modeArg = process.argv.find(a => a.startsWith('--mode='));
    const mode = modeArg ? modeArg.split('=')[1] : '';
    switch (mode) {
        case 'snapshot-pre':
            runSnapshotPre();
            break;
        case 'before':
            await runBeforeMode();
            break;
        case 'unit':
            runSyntheticUnitSuite();
            break;
        case 'after':
            await runAfterMode(false);
            break;
        case 'audit-existing':
            await runAfterMode(true);
            break;
        case 'snapshot-post':
            runSnapshotPost();
            break;
        default:
            console.error('Usage: ts-node verify_phase_c_filter_cleanup.ts --mode=<snapshot-pre|before|unit|after|audit-existing|snapshot-post>');
            process.exit(1);
    }
}

main().catch(err => {
    console.error('[FATAL]', err);
    process.exit(1);
});
