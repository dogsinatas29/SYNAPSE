#!/usr/bin/env node
// @synapse-bypass Deterministic audit CLI infrastructure.
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { hashDirectory, hashFile } from '../utils/hash_utils';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const rm = promisify(fs.rm);
const cp = fs.promises.cp;

interface DeterminismConfig {
    enabled: boolean;
    runs: number;
    hashAlgorithm: string;
    diffReport: boolean;
    isolateProcess: boolean;
    canonicalizeJson: boolean;
    normalizeFloats: {
        enabled: boolean;
        precision: number;
        fields: string[];
        semanticTypes: string[];
    };
    runtimeMetadataKeys: string[];
    saveResults: boolean;
    validationRuns: number;
}

interface Summary {
    inputHash: string;
    engineVersion: string;
    reportGeneratorVersion: string;
    gitCommit: string;
    runs: {
        runId: number;
        semanticHash: string;
        runtimeHash: string;
        normalizationTraceCount: number;
        status: 'PASS' | 'FAIL';
        mismatchAgainstRun1?: boolean;
    }[];
    deterministic: 'PASS' | 'FAIL';
    resultsDir: string;
    passCriteria: string;
    failedRunIds: number[];
}

const DEFAULT_CONFIG: DeterminismConfig = {
    enabled: true,
    runs: 5,
    hashAlgorithm: 'sha256',
    diffReport: true,
    isolateProcess: true,
    canonicalizeJson: true,
    normalizeFloats: {
        enabled: true,
        precision: 4,
        fields: ['confidence', 'ratio', 'score', 'weight', 'probability'],
        semanticTypes: ['confidence', 'ratio', 'score', 'weight', 'probability'],
    },
    runtimeMetadataKeys: ['generatedAt', 'duration', 'durationMs', 'executionTime', 'memoryUsage', 'timestamp'],
    saveResults: true,
    validationRuns: 3,
};

const PACKAGE_JSON_PATH = path.join(__dirname, '../../package.json');
const SYNAPSE_CONFIG_PATH = path.join(__dirname, '../../synapse.config.json');

async function getGitCommit(): Promise<string> {
    try {
        const output = await execCommand('git', ['rev-parse', 'HEAD'], path.resolve(__dirname, '../..'));
        return output.trim();
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn('Git commit hash not available:', message);
        return 'unknown';
    }
}

async function getEngineVersion(): Promise<{ engineVersion: string; reportGeneratorVersion: string }> {
    try {
        const packageJson = JSON.parse(await readFile(PACKAGE_JSON_PATH, 'utf-8'));
        return {
            engineVersion: packageJson.version,
            reportGeneratorVersion: packageJson.version, // Assuming same version for simplicity
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn('Package.json not found or invalid:', message);
        return {
            engineVersion: 'unknown',
            reportGeneratorVersion: 'unknown',
        };
    }
}

async function loadConfig(): Promise<DeterminismConfig> {
    try {
        const config = JSON.parse(await readFile(SYNAPSE_CONFIG_PATH, 'utf-8'));
        const merged = {
            ...DEFAULT_CONFIG,
            ...(config.determinism || {}),
            normalizeFloats: {
                ...DEFAULT_CONFIG.normalizeFloats,
                ...((config.determinism && config.determinism.normalizeFloats) || {})
            }
        } as DeterminismConfig;
        return merged;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn('synapse.config.json not found or invalid, using default config:', message);
        return DEFAULT_CONFIG;
    }
}

function parseArgs(): { inputPath: string; evId: string; runs?: number } {
    const args = process.argv.slice(2);
    const out = {
        inputPath: '',
        evId: 'EV-1029',
        runs: undefined as number | undefined
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--input' && args[i + 1]) {
            out.inputPath = args[i + 1];
            i++;
            continue;
        }
        if (arg === '--ev-id' && args[i + 1]) {
            out.evId = args[i + 1];
            i++;
            continue;
        }
        if (arg === '--runs' && args[i + 1]) {
            const parsed = Number.parseInt(args[i + 1], 10);
            if (!Number.isNaN(parsed) && parsed > 0) {
                out.runs = parsed;
            }
            i++;
            continue;
        }
        if (!arg.startsWith('--') && !out.inputPath) {
            out.inputPath = arg;
        }
    }

    if (!out.inputPath) {
        throw new Error('Missing input graph path. Usage: ts-node src/cli/verify_determinism.ts --input <graph.json> [--runs 5] [--ev-id EV-1029]');
    }

    return out;
}

async function execCommand(cmd: string, args: string[], cwd: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const child = spawn(cmd, args, {
            cwd,
            stdio: ['ignore', 'pipe', 'pipe']
        });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (chunk: Buffer) => {
            stdout += chunk.toString('utf8');
        });
        child.stderr.on('data', (chunk: Buffer) => {
            stderr += chunk.toString('utf8');
        });
        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0) {
                resolve(stdout);
                return;
            }
            reject(new Error(`${cmd} ${args.join(' ')} failed with code ${code}\n${stderr}`));
        });
    });
}

async function prepareOutputDir(baseDir: string, runId: number): Promise<string> {
    const runDir = path.join(baseDir, `run_${runId}`);
    await rm(runDir, { recursive: true, force: true });
    await mkdir(runDir, { recursive: true });
    return runDir;
}

function firstDiffLine(left: string, right: string): { line: number; left: string; right: string } | null {
    const leftLines = left.split('\n');
    const rightLines = right.split('\n');
    const max = Math.max(leftLines.length, rightLines.length);
    for (let i = 0; i < max; i++) {
        const a = leftLines[i] ?? '';
        const b = rightLines[i] ?? '';
        if (a !== b) {
            return { line: i + 1, left: a, right: b };
        }
    }
    return null;
}

async function listFiles(rootDir: string): Promise<string[]> {
    const entries = await fs.promises.readdir(rootDir);
    const out: string[] = [];
    for (const e of entries.sort((a, b) => a.localeCompare(b))) {
        const abs = path.join(rootDir, e);
        const st = await fs.promises.stat(abs);
        if (st.isDirectory()) {
            const nested = await listFiles(abs);
            out.push(...nested);
        } else {
            out.push(abs);
        }
    }
    return out;
}

async function generateDiffReport(baseDir: string, run1Dir: string, runXDir: string, runId: number): Promise<void> {
    const diffDir = path.join(baseDir, 'diff');
    await mkdir(diffDir, { recursive: true });

    const run1Files = await listFiles(run1Dir);
    const runXFiles = await listFiles(runXDir);
    const run1Rel = new Set(run1Files.map((p) => path.relative(run1Dir, p).split(path.sep).join('/')));
    const runXRel = new Set(runXFiles.map((p) => path.relative(runXDir, p).split(path.sep).join('/')));
    const all = Array.from(new Set([...run1Rel, ...runXRel])).sort((a, b) => a.localeCompare(b));

    const lines: string[] = [];
    lines.push(`# Diff Report (run_1 vs run_${runId})`);
    lines.push('');

    for (const rel of all) {
        const aPath = path.join(run1Dir, rel);
        const bPath = path.join(runXDir, rel);
        const aExists = fs.existsSync(aPath);
        const bExists = fs.existsSync(bPath);

        if (!aExists || !bExists) {
            lines.push(`- ${rel}: ${aExists ? 'missing in run_x' : 'missing in run_1'}`);
            continue;
        }

        const a = await readFile(aPath, 'utf-8');
        const b = await readFile(bPath, 'utf-8');
        if (a === b) continue;

        const d = firstDiffLine(a, b);
        if (!d) continue;
        lines.push(`- ${rel}`);
        lines.push(`  line ${d.line}`);
        lines.push(`  run_1: ${d.left}`);
        lines.push(`  run_${runId}: ${d.right}`);
    }

    const out = path.join(diffDir, `run_1_vs_run_${runId}.md`);
    await writeFile(out, lines.join('\n'), 'utf-8');
}

async function runPipelineOnce(workspaceRoot: string, graphPath: string, evId: string, validationRuns: number): Promise<void> {
    await execCommand('npx', ['ts-node', 'src/cli/b5_validation_layer.ts', graphPath, String(validationRuns)], workspaceRoot);
    await execCommand('npx', ['ts-node', 'src/cli/generate_surgery_report.ts', evId], workspaceRoot);
}

async function snapshotOutputs(workspaceRoot: string, runDir: string): Promise<void> {
    const surgeryDir = path.join(workspaceRoot, 'synapse_report', 'surgery');
    const validationJson = path.join(workspaceRoot, 'synapse_report', 'b5_validation_layer.latest.json');

    const runReportDir = path.join(runDir, 'synapse_report');
    const runEvidenceDir = path.join(runDir, 'evidence');
    await mkdir(runReportDir, { recursive: true });
    await mkdir(runEvidenceDir, { recursive: true });

    if (!fs.existsSync(surgeryDir)) {
        throw new Error(`Expected output directory not found: ${surgeryDir}`);
    }
    await cp(surgeryDir, runReportDir, { recursive: true, force: true });
    if (fs.existsSync(path.join(surgeryDir, 'evidence'))) {
        await cp(path.join(surgeryDir, 'evidence'), runEvidenceDir, { recursive: true, force: true });
    }
    if (fs.existsSync(validationJson)) {
        await cp(validationJson, path.join(runDir, 'validation.latest.json'));
    }
}

async function verifyDeterminism(inputPath: string, evId: string, forcedRuns?: number): Promise<void> {
    const config = await loadConfig();
    if (!config.enabled) {
        console.log('Determinism verification is disabled.');
        return;
    }

    const runs = forcedRuns ?? config.runs;
    const workspaceRoot = path.resolve(__dirname, '../..');
    const resolvedInputPath = path.isAbsolute(inputPath)
        ? inputPath
        : path.resolve(workspaceRoot, inputPath);
    if (!fs.existsSync(resolvedInputPath)) {
        throw new Error(`Input graph not found: ${resolvedInputPath}`);
    }
    
    const { engineVersion, reportGeneratorVersion } = await getEngineVersion();
    const gitCommit = await getGitCommit();
    const inputHash = await hashFile(resolvedInputPath, config.hashAlgorithm);
    
    console.log(`Input Hash: ${inputHash}`);
    console.log(`Engine Version: ${engineVersion}`);
    console.log(`Git Commit: ${gitCommit}`);
    
    const baseDir = path.join(workspaceRoot, '.determinism');
    await rm(baseDir, { recursive: true, force: true });
    await mkdir(baseDir, { recursive: true });
    
    const summary: Summary = {
        inputHash,
        engineVersion,
        reportGeneratorVersion,
        gitCommit,
        runs: [],
        deterministic: 'PASS',
        resultsDir: baseDir,
        passCriteria: 'PASS only if 5/5 semantic hashes match; FAIL on any mismatch.',
        failedRunIds: []
    };
    
    let referenceSemantic: string | null = null;
    
    for (let i = 1; i <= runs; i++) {
        const runDir = await prepareOutputDir(baseDir, i);

        await runPipelineOnce(workspaceRoot, resolvedInputPath, evId, config.validationRuns);
        await snapshotOutputs(workspaceRoot, runDir);

        const mergedHash = await hashDirectory(runDir, {
            hashAlgorithm: config.hashAlgorithm,
            normalize: {
                enabled: config.normalizeFloats.enabled,
                precision: config.normalizeFloats.precision,
                fields: config.normalizeFloats.fields,
                semanticTypes: config.normalizeFloats.semanticTypes,
                runtimeMetadataKeys: config.runtimeMetadataKeys
            }
        });
        const [semanticHash, runtimeHash, traceCountStr] = mergedHash.split('::');
        const status = referenceSemantic === null || referenceSemantic === semanticHash ? 'PASS' : 'FAIL';

        if (status === 'FAIL') {
            summary.deterministic = 'FAIL';
            summary.failedRunIds.push(i);
        }
        
        summary.runs.push({
            runId: i,
            semanticHash,
            runtimeHash,
            normalizationTraceCount: Number.parseInt(traceCountStr || '0', 10) || 0,
            status,
            mismatchAgainstRun1: i > 1 ? status === 'FAIL' : undefined
        });
        
        console.log(`Run ${i}: Semantic Hash=${semanticHash} ${status === 'PASS' ? '✅' : '❌'}`);
        console.log(`Run ${i}: Runtime Hash=${runtimeHash}`);
        
        if (referenceSemantic === null) {
            referenceSemantic = semanticHash;
        }
        
        if (status === 'FAIL' && config.diffReport && i > 1) {
            await generateDiffReport(baseDir, path.join(baseDir, 'run_1'), runDir, i);
        }
    }
    
    if (config.saveResults) {
        await writeFile(path.join(baseDir, 'summary.json'), JSON.stringify(summary, null, 2));
    }
    
    console.log(`\nDeterministic: ${summary.deterministic} (${summary.runs.filter(r => r.status === 'PASS').length}/${runs} runs matched)`);
    console.log(`\nResults saved to: ${baseDir}`);
}

async function main(): Promise<void> {
    const args = parseArgs();
    await verifyDeterminism(args.inputPath, args.evId, args.runs);
}

main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Determinism] ${message}`);
    process.exit(1);
});