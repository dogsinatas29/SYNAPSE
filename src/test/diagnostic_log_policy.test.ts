import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { DataPipeline, PipelineResult } from '../core/DataPipeline';
import { phaseManager } from '../core/PhaseManager';
import { ProjectMetadata } from '../core/ProjectMetadata';
import { SymbolIndex } from '../core/SymbolIndex';
import { Logger } from '../utils/Logger';

/**
 * Strips non-deterministic random edge UUIDs while verifying their presence
 * so structural equality across ON/OFF diagnostic log modes can be asserted.
 */
function normalizePipelineResult(res: PipelineResult) {
    return {
        ...res,
        edges: res.edges.map(e => {
            expect(typeof e.id).toBe('string');
            expect(e.id.length).toBeGreaterThan(0);
            const { id: _id, ...rest } = e;
            return rest;
        })
    };
}

describe('Phase D-1.1 — diagnostic_log.txt Opt-In Policy', () => {
    let tempRoot: string;
    let origEnvVal: string | undefined;
    let origWorkspaceFolders: typeof vscode.workspace.workspaceFolders;

    const targetFiles = ['src/a.ts', 'src/b.ts'];

    beforeEach(() => {
        origEnvVal = process.env.SYNAPSE_WRITE_DIAGNOSTIC_LOG;
        origWorkspaceFolders = vscode.workspace.workspaceFolders;
        delete process.env.SYNAPSE_WRITE_DIAGNOSTIC_LOG;

        tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'synapse-diag-policy-'));
        fs.mkdirSync(path.join(tempRoot, 'src'), { recursive: true });
        fs.writeFileSync(
            path.join(tempRoot, 'src', 'a.ts'),
            "import { helper } from './b';\nexport function run() { return helper(); }\n",
            'utf8'
        );
        fs.writeFileSync(
            path.join(tempRoot, 'src', 'b.ts'),
            'export function helper() { return 42; }\n',
            'utf8'
        );

        (vscode.workspace as any).workspaceFolders = [
            { uri: { fsPath: tempRoot }, name: 'diag-test', index: 0 }
        ];

        phaseManager.reset();
        const meta = ProjectMetadata.getInstance();
        meta.initialize(tempRoot, 'diag-test');
        meta.loadSync();
        SymbolIndex.getInstance().initialize('diag-test', tempRoot);
    });

    afterEach(() => {
        if (origEnvVal === undefined) {
            delete process.env.SYNAPSE_WRITE_DIAGNOSTIC_LOG;
        } else {
            process.env.SYNAPSE_WRITE_DIAGNOSTIC_LOG = origEnvVal;
        }
        (vscode.workspace as any).workspaceFolders = origWorkspaceFolders;
        jest.restoreAllMocks();
        fs.rmSync(tempRoot, { recursive: true, force: true });
    });

    it('1. Default (env unset): logs diagnostics via Logger.info and does NOT write diagnostic_log.txt', async () => {
        const infoSpy = jest.spyOn(Logger, 'info');
        const pipeline = new DataPipeline();

        await pipeline.processFiles(targetFiles, tempRoot);

        const diagLogCalls = infoSpy.mock.calls
            .map(args => String(args[0] ?? ''))
            .filter(msg => msg.includes('[PIPELINE] Nodes='));
        expect(diagLogCalls.length).toBeGreaterThan(0);

        const diagFilePath = path.join(tempRoot, 'synapse_report', 'diagnostic_log.txt');
        expect(fs.existsSync(diagFilePath)).toBe(false);
    });

    it('2. Non-"1" env values ("0", "true", ""): do NOT write diagnostic_log.txt', async () => {
        const diagFilePath = path.join(tempRoot, 'synapse_report', 'diagnostic_log.txt');

        for (const val of ['0', 'true', '']) {
            process.env.SYNAPSE_WRITE_DIAGNOSTIC_LOG = val;
            phaseManager.reset();
            const pipeline = new DataPipeline();

            await pipeline.processFiles(targetFiles, tempRoot);

            expect(fs.existsSync(diagFilePath)).toBe(false);
        }
    });

    it('3. Opt-In (SYNAPSE_WRITE_DIAGNOSTIC_LOG="1"): writes diagnostic_log.txt matching Logger.info output', async () => {
        process.env.SYNAPSE_WRITE_DIAGNOSTIC_LOG = '1';
        const infoSpy = jest.spyOn(Logger, 'info');
        const pipeline = new DataPipeline();

        await pipeline.processFiles(targetFiles, tempRoot);

        const diagFilePath = path.join(tempRoot, 'synapse_report', 'diagnostic_log.txt');
        expect(fs.existsSync(diagFilePath)).toBe(true);

        const fileContent = fs.readFileSync(diagFilePath, 'utf8');
        expect(fileContent).toContain('[PIPELINE] Nodes=');

        const diagLogCalls = infoSpy.mock.calls
            .map(args => String(args[0] ?? ''))
            .filter(msg => msg.includes('[PIPELINE] Nodes='));
        expect(diagLogCalls).toContain(fileContent);
    });

    it('4. Return value parity: OFF and ON produce identical PipelineResult structure', async () => {
        const pipelineOff = new DataPipeline();
        const resOff = await pipelineOff.processFiles(targetFiles, tempRoot);

        process.env.SYNAPSE_WRITE_DIAGNOSTIC_LOG = '1';
        phaseManager.reset();
        SymbolIndex.getInstance().initialize('diag-test', tempRoot);

        const pipelineOn = new DataPipeline();
        const resOn = await pipelineOn.processFiles(targetFiles, tempRoot);

        expect(fs.existsSync(path.join(tempRoot, 'synapse_report', 'diagnostic_log.txt'))).toBe(true);
        expect(normalizePipelineResult(resOff)).toEqual(normalizePipelineResult(resOn));
    });
});
