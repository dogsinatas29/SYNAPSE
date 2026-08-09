import { IdentityManager, Permission, RoleType } from '../core/collaboration/IdentityManager';
import { SessionManager, CollaborationSession } from '../core/collaboration/SessionManager';
import { RuntimeInitializer } from '../core/collaboration/RuntimeInitializer';
import { ProjectMetadata } from '../core/ProjectMetadata';
import { SymbolIndex } from '../core/SymbolIndex';
import * as path from 'path';
import * as fs from 'fs';

describe('Phase 2 — Identity & Session Foundation', () => {
    const testRoot = path.join('/tmp', `synapse_phase2_test_${Date.now()}`);
    const testProjectUUID = 'proj_test';

    beforeEach(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
        fs.mkdirSync(path.join(testRoot, 'synapse_data'), { recursive: true });
        const meta = ProjectMetadata.getInstance();
        meta.initialize(testRoot, 'test-project');
        meta.loadSync();
        SymbolIndex.getInstance().initialize('test-project', testRoot);
        IdentityManager.getInstance().clearSession();
    });

    afterEach(() => {
        fs.rmSync(testRoot, { recursive: true, force: true });
    });

    test('1. Identity 생성', () => {
        const im = IdentityManager.getInstance();
        const identity = im.createIdentity('Kim');
        expect(identity.userId).toBeTruthy();
        expect(identity.displayName).toBe('Kim');
        expect(identity.createdAt).toBeGreaterThan(0);

        const fetched = im.getIdentity(identity.userId);
        expect(fetched).toBeTruthy();
        expect(fetched!.displayName).toBe('Kim');
    });

    test('2. Role 할당', () => {
        const im = IdentityManager.getInstance();
        const lead = im.createIdentity('Lead');
        const member = im.createIdentity('Member');

        const leadRole = im.assignRole(testProjectUUID, lead.userId, 'lead');
        expect(leadRole.role).toBe('lead');

        const memberRole = im.assignRole(testProjectUUID, member.userId, 'member');
        expect(memberRole.role).toBe('member');
    });

    test('3. Role 없는 Identity Role 할당 불가', () => {
        const im = IdentityManager.getInstance();
        expect(() => im.assignRole(testProjectUUID, 'nonexistent', 'member')).toThrow();
    });

    test('4. Lead Permissions', () => {
        const im = IdentityManager.getInstance();
        const lead = im.createIdentity('Lead');
        im.assignRole(testProjectUUID, lead.userId, 'lead');

        expect(im.hasPermission(testProjectUUID, lead.userId, Permission.CreateSession)).toBe(true);
        expect(im.hasPermission(testProjectUUID, lead.userId, Permission.CloseSession)).toBe(true);
        expect(im.hasPermission(testProjectUUID, lead.userId, Permission.ApproveJoin)).toBe(true);
        expect(im.hasPermission(testProjectUUID, lead.userId, Permission.Verify)).toBe(true);
        expect(im.hasPermission(testProjectUUID, lead.userId, Permission.Harvest)).toBe(true);
        expect(im.hasPermission(testProjectUUID, lead.userId, Permission.RemoteEdit)).toBe(true);
        expect(im.hasPermission(testProjectUUID, lead.userId, Permission.DisconnectClient)).toBe(true);
    });

    test('5. Member Permissions', () => {
        const im = IdentityManager.getInstance();
        const member = im.createIdentity('Member');
        im.assignRole(testProjectUUID, member.userId, 'member');

        expect(im.hasPermission(testProjectUUID, member.userId, Permission.CreateSession)).toBe(false);
        expect(im.hasPermission(testProjectUUID, member.userId, Permission.CloseSession)).toBe(false);
        expect(im.hasPermission(testProjectUUID, member.userId, Permission.Harvest)).toBe(false);
        expect(im.hasPermission(testProjectUUID, member.userId, Permission.JoinSession)).toBe(false);
        expect(im.hasPermission(testProjectUUID, member.userId, Permission.LeaveSession)).toBe(false);
        expect(im.hasPermission(testProjectUUID, member.userId, Permission.SubmitChanges)).toBe(false);
        expect(im.hasPermission(testProjectUUID, member.userId, Permission.ReceiveCommands)).toBe(false);
    });

    test('6. Runtime Startup Flow', async () => {
        const rt = RuntimeInitializer.getInstance();
        const state = await rt.initialize(testRoot, 'test-project');
        expect(state).toBe('ready');
        expect(rt.getProjectUUID()).toBeTruthy();
        const meta = ProjectMetadata.getInstance().get();
        expect(meta.projectName).toBe('test-project');
    });

    test('7. Session 생성 (Lead only)', () => {
        const im = IdentityManager.getInstance();
        const lead = im.createIdentity('Lead');
        im.assignRole(testProjectUUID, lead.userId, 'lead');

        const sm = SessionManager.getInstance();
        const session = sm.createSession(testProjectUUID, lead.userId);
        expect(session.state).toBe('created');
        expect(session.leadId).toBe(lead.userId);
        expect(session.members).toContain(lead.userId);
    });

    test('8. Session 생성 실패 (Member cannot create)', () => {
        const im = IdentityManager.getInstance();
        const member = im.createIdentity('Member');
        im.assignRole(testProjectUUID, member.userId, 'member');

        const sm = SessionManager.getInstance();
        expect(() => sm.createSession(testProjectUUID, member.userId)).toThrow();
    });

    test('9. Join / Leave Workflow', () => {
        const im = IdentityManager.getInstance();
        const lead = im.createIdentity('Lead');
        const member = im.createIdentity('Member');
        im.assignRole(testProjectUUID, lead.userId, 'lead');
        im.assignRole(testProjectUUID, member.userId, 'member');

        const sm = SessionManager.getInstance();
        const session = sm.createSession(testProjectUUID, lead.userId);
        sm.openSession(session.sessionId, lead.userId);

        const joined = sm.joinSession(session.sessionId, member.userId);
        expect(joined.members).toContain(member.userId);

        const afterLeave = sm.leaveSession(session.sessionId, member.userId);
        expect(afterLeave.members).not.toContain(member.userId);
    });

    test('10. Session Close', () => {
        const im = IdentityManager.getInstance();
        const lead = im.createIdentity('Lead');
        im.assignRole(testProjectUUID, lead.userId, 'lead');

        const sm = SessionManager.getInstance();
        const session = sm.createSession(testProjectUUID, lead.userId);
        sm.openSession(session.sessionId, lead.userId);
        const closed = sm.closeSession(session.sessionId, lead.userId);
        expect(closed.state).toBe('closed');
        expect(closed.closedAt).toBeGreaterThan(0);
    });

    test('11. Closed Session 참가 실패', () => {
        const im = IdentityManager.getInstance();
        const lead = im.createIdentity('Lead');
        const member = im.createIdentity('Member');
        im.assignRole(testProjectUUID, lead.userId, 'lead');
        im.assignRole(testProjectUUID, member.userId, 'member');

        const sm = SessionManager.getInstance();
        const session = sm.createSession(testProjectUUID, lead.userId);
        sm.openSession(session.sessionId, lead.userId);
        sm.closeSession(session.sessionId, lead.userId);

        expect(() => sm.joinSession(session.sessionId, member.userId)).toThrow();
    });

    test('12. Role 없는 사용자도 세션 참가 가능 (zero-permission model)', () => {
        const im = IdentityManager.getInstance();
        const lead = im.createIdentity('Lead');
        const stranger = im.createIdentity('Stranger');
        im.assignRole(testProjectUUID, lead.userId, 'lead');
        // stranger has no role — zero-permission model allows join

        const sm = SessionManager.getInstance();
        const session = sm.createSession(testProjectUUID, lead.userId);
        sm.openSession(session.sessionId, lead.userId);

        expect(() => sm.joinSession(session.sessionId, stranger.userId)).not.toThrow();
    });

    test('13. ProjectMembers 조회', () => {
        const im = IdentityManager.getInstance();
        const lead = im.createIdentity('Lead');
        const m1 = im.createIdentity('Member1');
        const m2 = im.createIdentity('Member2');
        im.assignRole(testProjectUUID, lead.userId, 'lead');
        im.assignRole(testProjectUUID, m1.userId, 'member');
        im.assignRole(testProjectUUID, m2.userId, 'member');

        const members = im.getProjectMembers(testProjectUUID);
        expect(members.length).toBe(3);
    });

    test('14. Security: 다른 프로젝트 권한 격리', () => {
        const im = IdentityManager.getInstance();
        const user = im.createIdentity('User');
        im.assignRole('proj_a', user.userId, 'lead');

        expect(im.hasPermission('proj_b', user.userId, Permission.ReadLayer)).toBe(false);
        expect(im.hasPermission('proj_b', user.userId, Permission.CreateSession)).toBe(false);
    });
});
