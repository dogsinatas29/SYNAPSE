import { IdentityManager, Permission } from '../core/collaboration/IdentityManager';
import { SessionManager } from '../core/collaboration/SessionManager';
import { SubmissionManager } from '../core/collaboration/SubmissionManager';
import { AccountManager } from '../core/collaboration/AccountManager';
import { RestCollaborationTransport } from '../core/collaboration/RestCollaborationTransport';
import { ProjectMetadata } from '../core/ProjectMetadata';
import { SymbolIndex } from '../core/SymbolIndex';
import { RuntimeInitializer } from '../core/collaboration/RuntimeInitializer';
import * as path from 'path';
import * as fs from 'fs';

describe('CollaborationTransport Adapter', () => {
    const testRoot = path.join('/tmp', `synapse_transport_test_${Date.now()}`);
    const projectUUID = 'proj_transport_test';
    let transport: RestCollaborationTransport;

    beforeAll(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
        fs.mkdirSync(path.join(testRoot, 'data'), { recursive: true });
        fs.mkdirSync(path.join(testRoot, 'src'), { recursive: true });
        fs.writeFileSync(path.join(testRoot, 'src', 'main.ts'), 'const x = 1;\n');

        const meta = ProjectMetadata.getInstance();
        meta.initialize(testRoot, 'test-project');
        meta.loadSync();
        SymbolIndex.getInstance().initialize('test-project', testRoot);
        RuntimeInitializer.getInstance().initialize(testRoot, 'test-project');
        AccountManager.getInstance().initialize(testRoot);
    });

    beforeEach(() => {
        IdentityManager.getInstance().clearSession();
        transport = new RestCollaborationTransport();
    });

    afterAll(() => {
        fs.rmSync(testRoot, { recursive: true, force: true });
    });

    test('Transport: login success', async () => {
        AccountManager.getInstance().createAccount('testuser', 'pass123');
        const user = await transport.login('testuser', 'pass123');
        expect(user).not.toBeNull();
        expect(user!.username).toBe('testuser');
        expect(user!.userId).toBeTruthy();
        expect((user as any).passwordHash).toBeUndefined();
    });

    test('Transport: login wrong password', async () => {
        const user = await transport.login('testuser', 'wrongpass');
        expect(user).toBeNull();
    });

    test('Transport: login nonexistent user', async () => {
        const user = await transport.login('nobody', 'pass');
        expect(user).toBeNull();
    });

    test('Transport: createSession → joinSession → createSubmission → getReviewState', async () => {
        AccountManager.getInstance().createAccount('member1', 'pass');
        AccountManager.getInstance().createAccount('lead1', 'pass');

        const leadIdentity = IdentityManager.getInstance().getIdentity(
            AccountManager.getInstance().getAccount('lead1')!.userId
        )!;
        IdentityManager.getInstance().assignRole(projectUUID, leadIdentity.userId, 'lead');

        const session = await transport.createSession(projectUUID, leadIdentity.userId);
        expect(session.sessionId).toBeTruthy();
        expect(session.state).toBe('open');

        const memberIdentity = IdentityManager.getInstance().getIdentity(
            AccountManager.getInstance().getAccount('member1')!.userId
        )!;
        IdentityManager.getInstance().assignRole(projectUUID, memberIdentity.userId, 'member');

        const activeSession = await transport.joinSession(session.sessionId, memberIdentity.userId);
        expect(activeSession.state).toBe('active');

        const filePaths = [path.join(testRoot, 'src', 'main.ts')];
        const snapshot = await transport.createSubmission(projectUUID, session.sessionId, memberIdentity.userId, filePaths);
        expect(snapshot.id).toBeTruthy();
        expect(snapshot.clientId).toBe(memberIdentity.userId);

        const reviewState = await transport.getReviewState(snapshot.id);
        expect(reviewState).not.toBeNull();
        expect(reviewState!.state).toBe('pending');
    });
});
