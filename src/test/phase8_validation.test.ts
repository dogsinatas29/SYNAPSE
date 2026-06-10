import * as fs from 'fs';
import * as path from 'path';
import { BoundaryGuard, BoundaryError } from '../core/collaboration/BoundaryGuard';
import { IdentityManager, Permission } from '../core/collaboration/IdentityManager';
import { SessionManager } from '../core/collaboration/SessionManager';
import { SubmissionManager } from '../core/collaboration/SubmissionManager';
import { ProjectMetadata } from '../core/ProjectMetadata';

describe('Phase 8 — Boundary Enforcement', () => {
    const testRoot = path.join('/tmp', `synapse_phase8_test_${Date.now()}`);
    let guard: BoundaryGuard;
    let leadId: string;
    let memberId: string;
    let outsiderId: string;

    function setupIdentities(): void {
        IdentityManager.getInstance().clearSession();
        const idMan = IdentityManager.getInstance();
        const lead = idMan.createIdentity('lead-user');
        const member = idMan.createIdentity('member-user');
        const outsider = idMan.createIdentity('outsider-user');
        leadId = lead.userId;
        memberId = member.userId;
        outsiderId = outsider.userId;
        idMan.assignRole('proj_a', leadId, 'lead');
        idMan.assignRole('proj_a', memberId, 'member');
        idMan.assignRole('proj_b', outsiderId, 'lead');
    }

    beforeAll(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
        fs.mkdirSync(path.join(testRoot, 'data', 'snapshots'), { recursive: true });
        ProjectMetadata.getInstance().initialize(testRoot, 'test-project');
        ProjectMetadata.getInstance().loadSync();
        guard = BoundaryGuard.getInstance();
        setupIdentities();
        if (!fs.existsSync(path.join(testRoot, 'src'))) {
            fs.mkdirSync(path.join(testRoot, 'src'), { recursive: true });
            fs.writeFileSync(path.join(testRoot, 'src', 'main.ts'), '// test\n', 'utf8');
        }
    });

    afterAll(() => {
        fs.rmSync(testRoot, { recursive: true, force: true });
    });

    beforeEach(() => {
        setupIdentities();
    });

    test('1. Cross Project Access Denied', () => {
        // Member of proj_a cannot access proj_b
        expect(() => guard.assertProjectAccess('proj_b', memberId)).toThrow(BoundaryError);
        // Lead of proj_a CAN access proj_a
        expect(() => guard.assertProjectAccess('proj_a', leadId)).not.toThrow();
    });

    test('2. Unauthorized Session Access Denied', () => {
        const sessionManager = SessionManager.getInstance();
        const session = sessionManager.createSession('proj_a', leadId);
        session.state = 'active';
        session.members.push(memberId);

        // outsider is not a member
        expect(() => guard.assertSessionAccess(session.sessionId, outsiderId)).toThrow(BoundaryError);
        // member is a member — should pass
        expect(() => guard.assertSessionAccess(session.sessionId, memberId)).not.toThrow();
    });

    test('3. Workspace Escape Attempt Denied', () => {
        expect(() => guard.assertWorkspacePath('../../../etc/passwd')).toThrow(BoundaryError);
        expect(() => guard.assertWorkspacePath('../../other_project')).toThrow(BoundaryError);
        expect(() => guard.assertWorkspacePath('/absolute/path')).toThrow(BoundaryError);
        // valid relative path passes
        expect(() => guard.assertWorkspacePath('src/main.ts')).not.toThrow();
    });

    test('4. Unauthorized Submission Access Denied', () => {
        const sessionManager = SessionManager.getInstance();
        const submissionManager = SubmissionManager.getInstance();
        const session = sessionManager.createSession('proj_a', leadId);
        session.state = 'active';
        session.members.push(memberId);

        const snapshot = submissionManager.createSubmission(
            'proj_a', session.sessionId, memberId,
            ['src/main.ts']
        );

        // outsider cannot access it
        expect(() => guard.assertSubmissionAccess(snapshot.id, 'proj_a', outsiderId)).toThrow(BoundaryError);
        // member can access own submission
        expect(() => guard.assertSubmissionAccess(snapshot.id, 'proj_a', memberId)).not.toThrow();
    });

    test('5. Unauthorized Remote Edit Denied', () => {
        const sessionManager = SessionManager.getInstance();
        const submissionManager = SubmissionManager.getInstance();
        const session = sessionManager.createSession('proj_a', leadId);
        session.state = 'active';
        session.members.push(memberId);
        const snapshot = submissionManager.createSubmission(
            'proj_a', session.sessionId, memberId,
            ['src/main.ts']
        );

        // member cannot remote edit (only lead)
        expect(() => guard.assertRemoteEditAuth('proj_a', memberId, snapshot.id, 'src/main.ts')).toThrow(BoundaryError);
        // lead can remote edit
        expect(() => guard.assertRemoteEditAuth('proj_a', leadId, snapshot.id, 'src/main.ts')).not.toThrow();
    });

    test('6. Unauthorized Harvest Denied', () => {
        // member cannot harvest (only lead)
        expect(() => guard.assertHarvestAuth('proj_a', memberId)).toThrow(BoundaryError);
        // lead can harvest
        expect(() => guard.assertHarvestAuth('proj_a', leadId)).not.toThrow();
    });

    test('7. Invalid Identity Denied', () => {
        // unknown user has no identity
        expect(() => guard.assertAuthenticated('proj_a', 'usr_nonexistent')).toThrow(BoundaryError);
        // user with no role in project fails
        expect(() => guard.assertAuthenticated('proj_b', memberId)).toThrow(BoundaryError);
        // valid lead passes
        expect(() => guard.assertAuthenticated('proj_a', leadId)).not.toThrow();
    });

    test('8. Session Cache Cleanup Success', () => {
        const sessionManager = SessionManager.getInstance();
        const submissionManager = SubmissionManager.getInstance();

        const session = sessionManager.createSession('proj_a', leadId);
        session.state = 'active';
        session.members.push(memberId);

        const snapshot = submissionManager.createSubmission(
            'proj_a', session.sessionId, memberId,
            ['src/main.ts']
        );

        expect(submissionManager.getSubmission(snapshot.id)).toBeTruthy();

        guard.cleanupSessionCache(session.sessionId);

        expect(submissionManager.getSubmission(snapshot.id)).toBeUndefined();
    });
});
