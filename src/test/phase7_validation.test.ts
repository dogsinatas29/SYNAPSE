import * as fs from 'fs';
import * as path from 'path';
import { HarvestEngine, HarvestInput, HarvestResult, HarvestedFile } from '../core/collaboration/HarvestEngine';
import { ProjectMetadata } from '../core/ProjectMetadata';
import { ArchitectureIndexBuilder, ArchitectureIndex } from '../core/collaboration/ArchitectureIndexBuilder';
import { ReferenceVerifier, VerificationReport } from '../core/collaboration/ReferenceVerifier';
import { SubmissionSnapshot } from '../types/schema';

describe('Phase 7 — Harvest Engine', () => {
    const testRoot = path.join('/tmp', `synapse_phase7_test_${Date.now()}`);
    const masterLayerPath = path.join(testRoot, '.synapse', 'master');

    function makeSnapshot(overrides?: Partial<SubmissionSnapshot>): SubmissionSnapshot {
        return {
            id: 'sub_phase7_001',
            projectUUID: 'proj_phase7',
            sessionId: 'ses_phase7',
            clientId: 'usr_member',
            files: [
                { filePath: 'src/main.ts', content: 'function greet() { return "hello"; }\n', encoding: 'utf8' },
                { filePath: 'src/utils/helper.py', content: 'def parse(data): return data\n', encoding: 'utf8' },
                { filePath: 'src/config/settings.json', content: '{"debug": true}\n', encoding: 'utf8' },
                { filePath: 'docs/guide.md', content: '# User Guide\n', encoding: 'utf8' },
                { filePath: 'README.md', content: '# Project\n', encoding: 'utf8' },
                { filePath: 'external://axios', content: '', encoding: 'utf8' },
                { filePath: 'ghost://missing_mod', content: '', encoding: 'utf8' },
            ],
            timestamp: Date.now(),
            immutable: true,
            ...overrides,
        };
    }

    beforeAll(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
        fs.mkdirSync(path.join(testRoot, 'data'), { recursive: true });
        ProjectMetadata.getInstance().initialize(testRoot, 'test-project');
        ProjectMetadata.getInstance().loadSync();
    });

    beforeEach(() => {
        const syncedDir = path.join(testRoot, '.synapse');
        if (fs.existsSync(syncedDir)) {
            fs.rmSync(syncedDir, { recursive: true, force: true });
        }
    });

    afterAll(() => {
        fs.rmSync(testRoot, { recursive: true, force: true });
    });

    function makeVerificationReport(snapshot: SubmissionSnapshot): VerificationReport {
        const index = ArchitectureIndexBuilder.getInstance().build(snapshot, 'test-project');
        return ReferenceVerifier.getInstance().verify(index, snapshot);
    }

    test('1. Approved Workspace Exists', () => {
        const snapshot = makeSnapshot();
        const report = makeVerificationReport(snapshot);
        const input: HarvestInput = {
            submissionId: snapshot.id,
            projectUUID: snapshot.projectUUID,
            approvedFiles: snapshot.files,
            originalSnapshot: snapshot,
            verificationReport: report,
        };
        expect(input.approvedFiles.length).toBeGreaterThan(0);
        expect(input.submissionId).toBe('sub_phase7_001');
    });

    test('2. Folder Structure Copied', () => {
        const snapshot = makeSnapshot();
        const report = makeVerificationReport(snapshot);
        const engine = HarvestEngine.getInstance();
        const result = engine.harvest({
            submissionId: snapshot.id,
            projectUUID: snapshot.projectUUID,
            approvedFiles: snapshot.files,
            originalSnapshot: snapshot,
            verificationReport: report,
        });

        expect(fs.existsSync(path.join(masterLayerPath, 'src'))).toBe(true);
        expect(fs.existsSync(path.join(masterLayerPath, 'src', 'utils'))).toBe(true);
        expect(fs.existsSync(path.join(masterLayerPath, 'src', 'config'))).toBe(true);
        expect(fs.existsSync(path.join(masterLayerPath, 'docs'))).toBe(true);
    });

    test('3. Source Files Copied', () => {
        const snapshot = makeSnapshot();
        const report = makeVerificationReport(snapshot);
        const engine = HarvestEngine.getInstance();
        const result = engine.harvest({
            submissionId: snapshot.id,
            projectUUID: snapshot.projectUUID,
            approvedFiles: snapshot.files,
            originalSnapshot: snapshot,
            verificationReport: report,
        });

        const mainTs = path.join(masterLayerPath, 'src', 'main.ts');
        expect(fs.existsSync(mainTs)).toBe(true);
        expect(fs.readFileSync(mainTs, 'utf8')).toContain('function greet()');
    });

    test('4. Configuration Files Copied', () => {
        const snapshot = makeSnapshot();
        const report = makeVerificationReport(snapshot);
        const engine = HarvestEngine.getInstance();
        engine.harvest({
            submissionId: snapshot.id,
            projectUUID: snapshot.projectUUID,
            approvedFiles: snapshot.files,
            originalSnapshot: snapshot,
            verificationReport: report,
        });

        const settings = path.join(masterLayerPath, 'src', 'config', 'settings.json');
        expect(fs.existsSync(settings)).toBe(true);
        const content = JSON.parse(fs.readFileSync(settings, 'utf8'));
        expect(content.debug).toBe(true);
    });

    test('5. Documentation Files Copied', () => {
        const snapshot = makeSnapshot();
        const report = makeVerificationReport(snapshot);
        const engine = HarvestEngine.getInstance();
        engine.harvest({
            submissionId: snapshot.id,
            projectUUID: snapshot.projectUUID,
            approvedFiles: snapshot.files,
            originalSnapshot: snapshot,
            verificationReport: report,
        });

        expect(fs.existsSync(path.join(masterLayerPath, 'docs', 'guide.md'))).toBe(true);
        expect(fs.existsSync(path.join(masterLayerPath, 'README.md'))).toBe(true);
    });

    test('6. Original Snapshot Preserved', () => {
        const snapshot = makeSnapshot();
        const originalContent = JSON.stringify(snapshot);
        const report = makeVerificationReport(snapshot);
        const engine = HarvestEngine.getInstance();
        engine.harvest({
            submissionId: snapshot.id,
            projectUUID: snapshot.projectUUID,
            approvedFiles: snapshot.files,
            originalSnapshot: snapshot,
            verificationReport: report,
        });

        const snapshotPath = path.join(testRoot, '.synapse', 'snapshots', snapshot.id, 'snapshot.json');
        expect(fs.existsSync(snapshotPath)).toBe(true);
        const saved = fs.readFileSync(snapshotPath, 'utf8');
        const parsed = JSON.parse(saved);
        expect(parsed.id).toBe(snapshot.id);
        expect(parsed.projectUUID).toBe(snapshot.projectUUID);
        expect(parsed.immutable).toBe(true);
        expect(parsed.files).toEqual(snapshot.files);
    });

    test('7. Harvest Does Not Modify Snapshot', () => {
        const snapshot = makeSnapshot();
        const originalFiles = snapshot.files.map(f => ({ ...f }));
        const report = makeVerificationReport(snapshot);
        const engine = HarvestEngine.getInstance();
        engine.harvest({
            submissionId: snapshot.id,
            projectUUID: snapshot.projectUUID,
            approvedFiles: snapshot.files,
            originalSnapshot: snapshot,
            verificationReport: report,
        });

        expect(snapshot.files).toEqual(originalFiles);
        expect(snapshot.immutable).toBe(true);
    });

    test('8. Harvest Does Not Execute Verification', () => {
        const snapshot = makeSnapshot();
        const report = makeVerificationReport(snapshot);
        const engine = HarvestEngine.getInstance();
        const result = engine.harvest({
            submissionId: snapshot.id,
            projectUUID: snapshot.projectUUID,
            approvedFiles: snapshot.files,
            originalSnapshot: snapshot,
            verificationReport: report,
        });

        expect(result.filesHarvested).toBeGreaterThan(0);
        // No verification fields in HarvestResult
        expect((result as any).findings).toBeUndefined();
        expect((result as any).graph).toBeUndefined();
    });

    test('9. Harvest Completes Materialization', () => {
        const snapshot = makeSnapshot();
        const report = makeVerificationReport(snapshot);
        const engine = HarvestEngine.getInstance();
        const result = engine.harvest({
            submissionId: snapshot.id,
            projectUUID: snapshot.projectUUID,
            approvedFiles: snapshot.files,
            originalSnapshot: snapshot,
            verificationReport: report,
        });

        // All non-ghost files should be harvested
        const nonGhostFiles = snapshot.files.filter(f => !f.filePath.startsWith('external://') && !f.filePath.startsWith('ghost://'));
        expect(result.filesHarvested).toBe(nonGhostFiles.length);
        expect(result.foldersCreated).toBeGreaterThan(0);
        expect(result.masterLayerPath).toBe(masterLayerPath);
        expect(result.originalSnapshotPreserved).toBe(true);
    });

    test('10. Client Session May Be Closed', () => {
        const snapshot = makeSnapshot();
        const report = makeVerificationReport(snapshot);
        const engine = HarvestEngine.getInstance();
        const result = engine.harvest({
            submissionId: snapshot.id,
            projectUUID: snapshot.projectUUID,
            approvedFiles: snapshot.files,
            originalSnapshot: snapshot,
            verificationReport: report,
        });

        // Harvest completion implies session closure eligibility
        expect(result.harvestedAt).toBeGreaterThan(0);
        expect(result.submissionId).toBe(snapshot.id);
    });
});
