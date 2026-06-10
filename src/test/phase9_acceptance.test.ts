import * as fs from 'fs';
import * as path from 'path';
import { RuntimeInitializer } from '../core/collaboration/RuntimeInitializer';
import { IdentityManager, Permission } from '../core/collaboration/IdentityManager';
import { SessionManager } from '../core/collaboration/SessionManager';
import { SubmissionManager } from '../core/collaboration/SubmissionManager';
import { RemoteLayerProjector } from '../core/collaboration/RemoteLayerProjector';
import { ArchitectureIndexBuilder, ArchitectureIndex } from '../core/collaboration/ArchitectureIndexBuilder';
import { ReferenceVerifier, VerificationReport, HarvestCandidateSet } from '../core/collaboration/ReferenceVerifier';
import { HarvestEngine, HarvestInput } from '../core/collaboration/HarvestEngine';
import { BoundaryGuard } from '../core/collaboration/BoundaryGuard';
import { ProjectMetadata } from '../core/ProjectMetadata';

describe('Phase 9 — Acceptance Test', () => {
    const testRoot = path.join('/tmp', `synapse_phase9_accept_${Date.now()}`);
    const projectName = 'acceptance-test';
    let leadId: string;
    let memberId: string;
    let sessionId: string;
    let submissionId: string;
    let architectureIndex: ArchitectureIndex;
    let verificationReport: VerificationReport;
    let masterLayerPath: string;

    beforeAll(async () => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
        fs.mkdirSync(path.join(testRoot, 'src/utils'), { recursive: true });
        fs.writeFileSync(path.join(testRoot, 'src/main.ts'),
            'import { helper } from "./utils/helper";\n' +
            'import axios from "axios";\n' +
            'function greet() { return "hello"; }\n', 'utf8');
        fs.writeFileSync(path.join(testRoot, 'src/utils/helper.ts'),
            'export function helper() { return 42; }\n', 'utf8');
        fs.writeFileSync(path.join(testRoot, 'README.md'), '# Docs\n', 'utf8');
    });

    afterAll(() => {
        fs.rmSync(testRoot, { recursive: true, force: true });
    });

    test('1. Server Startup — Runtime Initialization', async () => {
        const runtime = RuntimeInitializer.getInstance();
        const state = await runtime.initialize(testRoot, projectName);
        expect(state).toBe('ready');
        const projectUUID = runtime.getProjectUUID();
        expect(projectUUID).toBeTruthy();
        expect(RuntimeInitializer.getInstance().getState()).toBe('ready');
    });

    test('2. Session Creation — Lead creates active session', () => {
        const idMan = IdentityManager.getInstance();
        const lead = idMan.createIdentity('lead-user');
        const member = idMan.createIdentity('member-user');
        leadId = lead.userId;
        memberId = member.userId;

        const projectUUID = RuntimeInitializer.getInstance().getProjectUUID()!;
        idMan.assignRole(projectUUID, leadId, 'lead');
        idMan.assignRole(projectUUID, memberId, 'member');

        const sessionMan = SessionManager.getInstance();
        const session = sessionMan.createSession(projectUUID, leadId);
        sessionId = session.sessionId;
        expect(session.state).toBe('created');
        expect(session.members).toContain(leadId);

        sessionMan.openSession(sessionId, leadId);
        expect(session.state).toBe('open');

        sessionMan.joinSession(sessionId, memberId);
        expect(session.state).toBe('active');
        expect(session.members).toContain(memberId);
    });

    test('3. Submission Workflow — Member submits, lead reviews', () => {
        const projectUUID = RuntimeInitializer.getInstance().getProjectUUID()!;
        const subMan = SubmissionManager.getInstance();

        const snapshot = subMan.createSubmission(
            projectUUID, sessionId, memberId,
            ['src/main.ts', 'src/utils/helper.ts', 'README.md']
        );
        submissionId = snapshot.id;
        expect(snapshot.immutable).toBe(true);
        expect(snapshot.files.length).toBe(3);

        const review = subMan.startReview(submissionId, leadId);
        expect(review.state).toBe('review');

        const approved = subMan.approveSubmission(submissionId, leadId, 'Looks good');
        expect(approved.state).toBe('approved');
    });

    test('4. Remote Layer Projection — Submitted workspace visible', () => {
        const projectUUID = RuntimeInitializer.getInstance().getProjectUUID()!;
        const subMan = SubmissionManager.getInstance();
        const snapshot = subMan.getSubmission(submissionId)!;

        // Inject external/ghost for layer projection test
        snapshot.files.push(
            { filePath: 'external://axios', content: '', encoding: 'utf8' },
            { filePath: 'ghost://missing_mod', content: '', encoding: 'utf8' },
        );

        const projector = RemoteLayerProjector.getInstance();
        const result = projector.project(snapshot);
        expect(result.nodes.length).toBeGreaterThan(0);
        expect(result.clusters.length).toBeGreaterThan(0);

        const srcMain = result.nodes.find(n => n.filePath === 'src/main.ts');
        expect(srcMain).toBeTruthy();
        expect(srcMain!.layer).toBe('ai');

        // Documentation goes to user layer
        const readmeNode = result.nodes.find(n => n.filePath === 'README.md');
        expect(readmeNode).toBeTruthy();
        expect(readmeNode!.layer).toBe('user');

        // External dependency
        const externalNode = result.nodes.find(n => n.filePath === 'external://axios');
        expect(externalNode).toBeTruthy();
        expect(externalNode!.layer).toBe('external');
    });

    test('5. Architecture Index Generated', () => {
        const subMan = SubmissionManager.getInstance();
        const snapshot = subMan.getSubmission(submissionId)!;
        const projectUUID = RuntimeInitializer.getInstance().getProjectUUID()!;

        architectureIndex = ArchitectureIndexBuilder.getInstance().build(snapshot, projectName);
        expect(architectureIndex.sourceFileRegistry.length).toBe(2); // .ts files only, excludes .md
        expect(architectureIndex.functionCatalog.length).toBeGreaterThan(0);
        expect(architectureIndex.folderTree.name).toBe(projectName);
    });

    test('6. Review and Verification — Report produced', () => {
        const subMan = SubmissionManager.getInstance();
        const snapshot = subMan.getSubmission(submissionId)!;

        verificationReport = ReferenceVerifier.getInstance().verify(architectureIndex, snapshot);
        expect(verificationReport.stats.totalEdges).toBeGreaterThan(0);
        expect(verificationReport.stats.resolvedReferences).toBeGreaterThan(0);
        expect(verificationReport.graph.ghostNodes.length).toBeGreaterThan(0); // axios is external
        expect(verificationReport.findings.length).toBeGreaterThan(0);
    });

    test('7. Remote Edit — Lead corrects file', () => {
        const subMan = SubmissionManager.getInstance();
        const snapshot = subMan.getSubmission(submissionId)!;

        const action = subMan.applyRemoteEdit(submissionId, leadId, 'src/main.ts',
            'import { helper } from "./utils/helper";\n' +
            'import axios from "axios";\n' +
            'function greet() { return "hello world"; }\n'
        );
        expect(action.filePath).toBe('src/main.ts');
        expect(action.editedBy).toBe(leadId);
        expect(action.originalContent).toContain('return "hello"');
        expect(action.newContent).toContain('return "hello world"');

        const workspace = subMan.getCorrectedWorkspace(submissionId);
        const correctedFile = workspace.find(f => f.filePath === 'src/main.ts');
        expect(correctedFile).toBeTruthy();
        expect(correctedFile!.content).toContain('hello world');

        // Re-verify with corrected content
        const updatedIndex = ArchitectureIndexBuilder.getInstance().build(snapshot, projectName);
        const updatedReport = ReferenceVerifier.getInstance().verify(updatedIndex, snapshot);
        expect(updatedReport.stats.totalEdges).toBe(updatedReport.stats.resolvedReferences + updatedReport.stats.unresolvedReferences);
    });

    test('8. Harvest — Master Layer materialized', () => {
        const subMan = SubmissionManager.getInstance();
        const snapshot = subMan.getSubmission(submissionId)!;
        const projectUUID = RuntimeInitializer.getInstance().getProjectUUID()!;

        const input: HarvestInput = {
            submissionId,
            projectUUID,
            approvedFiles: snapshot.files,
            originalSnapshot: snapshot,
            verificationReport,
        };

        const engine = HarvestEngine.getInstance();
        const result = engine.harvest(input);
        masterLayerPath = result.masterLayerPath;

        expect(result.filesHarvested).toBeGreaterThan(0);
        expect(fs.existsSync(path.join(masterLayerPath, 'src', 'main.ts'))).toBe(true);
        expect(fs.existsSync(path.join(masterLayerPath, 'README.md'))).toBe(true);

        // Original snapshot preserved
        const snapshotFile = path.join(testRoot, '.synapse', 'snapshots', submissionId, 'snapshot.json');
        expect(fs.existsSync(snapshotFile)).toBe(true);
    });

    test('9. Session Termination — Clean closure', () => {
        const sessionMan = SessionManager.getInstance();
        const session = sessionMan.getSession(sessionId)!;
        expect(session.state).toBe('active');

        const guard = BoundaryGuard.getInstance();
        guard.cleanupSessionCache(sessionId);

        sessionMan.closeSession(sessionId, leadId);
        expect(session.state).toBe('closed');
        expect(session.closedAt).toBeGreaterThan(0);
    });

    test('10. End-to-End Full Workflow Validation', () => {
        const projectUUID = RuntimeInitializer.getInstance().getProjectUUID()!;

        // Phase 2: Identity
        expect(leadId).toBeTruthy();
        expect(memberId).toBeTruthy();

        // Phase 2: Session was closed in test 9
        expect(sessionId).toBeTruthy();

        // Phase 3: Submission was created and approved
        expect(submissionId).toBeTruthy();

        // Phase 5: Architecture Index was built
        expect(architectureIndex.sourceFileRegistry.length).toBeGreaterThan(0);
        expect(architectureIndex.functionCatalog.length).toBeGreaterThan(0);

        // Phase 6: Verification Report produced
        expect(verificationReport.stats.totalEdges).toBeGreaterThan(0);
        expect(verificationReport.stats.totalGhosts).toBeGreaterThan(0);

        // Phase 7: Harvest — files written to master layer
        expect(fs.existsSync(path.join(masterLayerPath, 'src', 'main.ts'))).toBe(true);
        expect(fs.existsSync(path.join(masterLayerPath, 'src', 'utils', 'helper.ts'))).toBe(true);

        // Phase 8: Boundary Enforcement (cache was cleaned, but guard still works)
        const guard = BoundaryGuard.getInstance();
        expect(() => guard.assertHarvestAuth(projectUUID, memberId)).toThrow();
        expect(() => guard.assertHarvestAuth(projectUUID, leadId)).not.toThrow();

        // Phase 8: Cache cleanup verified (submission cleared)
        const subMan = SubmissionManager.getInstance();
        expect(subMan.getSubmission(submissionId)).toBeUndefined();
        expect(subMan.getSubmissionsByProject(projectUUID).length).toBe(0);
    });
});
