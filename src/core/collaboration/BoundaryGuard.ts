import { Logger } from '../../utils/Logger';
import { ProjectMetadata } from '../ProjectMetadata';
import { IdentityManager, Permission } from './IdentityManager';
import { SessionManager } from './SessionManager';
import { SubmissionManager } from './SubmissionManager';
import { HarvestEngine } from './HarvestEngine';
import * as path from 'path';

export class BoundaryError extends Error {
    constructor(message: string) {
        super(`[v0.3.30][Boundary] ${message}`);
        this.name = 'BoundaryError';
    }
}

export class BoundaryGuard {
    private static instance: BoundaryGuard;

    static getInstance(): BoundaryGuard {
        if (!BoundaryGuard.instance) {
            BoundaryGuard.instance = new BoundaryGuard();
        }
        return BoundaryGuard.instance;
    }

    assertProjectAccess(projectUUID: string, clientId: string): void {
        if (!projectUUID) throw new BoundaryError('Project UUID required');
        const identityManager = IdentityManager.getInstance();
        const role = identityManager.getRole(projectUUID, clientId);
        if (!role) {
            throw new BoundaryError(`Client ${clientId} has no role in project ${projectUUID}`);
        }
        Logger.info(`[v0.3.30][Boundary] Project access granted: ${clientId} → ${projectUUID}`);
    }

    assertSessionAccess(sessionId: string, clientId: string): void {
        const sessionManager = SessionManager.getInstance();
        const session = sessionManager.getSession(sessionId);
        if (!session) {
            throw new BoundaryError(`Session not found: ${sessionId}`);
        }
        if (session.state === 'closed') {
            throw new BoundaryError(`Session closed: ${sessionId}`);
        }
        if (!session.members.includes(clientId) && session.leadId !== clientId) {
            throw new BoundaryError(`Client ${clientId} not a member of session ${sessionId}`);
        }
        Logger.info(`[v0.3.30][Boundary] Session access granted: ${clientId} → ${sessionId}`);
    }

    assertWorkspacePath(filePath: string): void {
        const projectRoot = ProjectMetadata.getInstance().getProjectRoot();
        const resolved = path.resolve(projectRoot, filePath);
        const root = path.resolve(projectRoot);
        if (!resolved.startsWith(root + path.sep) && resolved !== root) {
            throw new BoundaryError(`Path escapes workspace: ${filePath}`);
        }
        const normalized = filePath.replace(/\\/g, '/');
        if (normalized.includes('..')) {
            throw new BoundaryError(`Path traversal detected: ${filePath}`);
        }
        if (path.isAbsolute(filePath)) {
            throw new BoundaryError(`Absolute path not allowed: ${filePath}`);
        }
        Logger.info(`[v0.3.30][Boundary] Workspace path valid: ${filePath}`);
    }

    assertSubmissionAccess(submissionId: string, projectUUID: string, clientId: string): void {
        this.assertProjectAccess(projectUUID, clientId);
        const submissionManager = SubmissionManager.getInstance();
        const submission = submissionManager.getSubmission(submissionId);
        if (!submission) {
            throw new BoundaryError(`Submission not found: ${submissionId}`);
        }
        if (submission.projectUUID !== projectUUID) {
            throw new BoundaryError(`Submission ${submissionId} not in project ${projectUUID}`);
        }
        const identityManager = IdentityManager.getInstance();
        const role = identityManager.getRole(projectUUID, clientId);
        if (!role) {
            throw new BoundaryError(`Client ${clientId} has no role in project ${projectUUID}`);
        }
        if (role.role === 'member' && submission.clientId !== clientId) {
            throw new BoundaryError(`Member ${clientId} cannot access another member's submission`);
        }
        Logger.info(`[v0.3.30][Boundary] Submission access granted: ${clientId} → ${submissionId}`);
    }

    assertRemoteEditAuth(projectUUID: string, clientId: string, submissionId: string, filePath: string): void {
        this.assertProjectAccess(projectUUID, clientId);
        const identityManager = IdentityManager.getInstance();
        if (!identityManager.hasPermission(projectUUID, clientId, Permission.RemoteEdit)) {
            throw new BoundaryError(`Client ${clientId} lacks RemoteEdit permission`);
        }
        const submissionManager = SubmissionManager.getInstance();
        const submission = submissionManager.getSubmission(submissionId);
        if (!submission) {
            throw new BoundaryError(`Submission not found: ${submissionId}`);
        }
        if (submission.projectUUID !== projectUUID) {
            throw new BoundaryError(`Submission ${submissionId} not in project ${projectUUID}`);
        }
        if (filePath) {
            const fileExists = submission.files.some(f => f.filePath === filePath);
            if (!fileExists) {
                throw new BoundaryError(`File ${filePath} not in submission ${submissionId}`);
            }
        }
        Logger.info(`[v0.3.30][Boundary] RemoteEdit authorized: ${clientId} → ${submissionId}/${filePath}`);
    }

    assertHarvestAuth(projectUUID: string, clientId: string): void {
        this.assertProjectAccess(projectUUID, clientId);
        const identityManager = IdentityManager.getInstance();
        if (!identityManager.hasPermission(projectUUID, clientId, Permission.Harvest)) {
            throw new BoundaryError(`Client ${clientId} lacks Harvest permission`);
        }
        Logger.info(`[v0.3.30][Boundary] Harvest authorized: ${clientId} → ${projectUUID}`);
    }

    assertAuthenticated(projectUUID: string, clientId: string): void {
        const identityManager = IdentityManager.getInstance();
        const identity = identityManager.getIdentity(clientId);
        if (!identity) {
            throw new BoundaryError(`Identity not found: ${clientId}`);
        }
        const role = identityManager.getRole(projectUUID, clientId);
        if (!role) {
            throw new BoundaryError(`Client ${clientId} not assigned to project ${projectUUID}`);
        }
        Logger.info(`[v0.3.30][Boundary] Authenticated: ${clientId} in ${projectUUID}`);
    }

    cleanupSessionCache(sessionId: string): void {
        const sessionManager = SessionManager.getInstance();
        const session = sessionManager.getSession(sessionId);
        if (!session) {
            Logger.warn(`[v0.3.30][Boundary] No session to clean: ${sessionId}`);
            return;
        }
        const projectUUID = session.projectUUID;
        const submissionManager = SubmissionManager.getInstance();
        const submissions = submissionManager.getSubmissionsByProject(projectUUID);
        for (const sub of submissions) {
            if (sub.sessionId === sessionId) {
                submissionManager.clearProject(projectUUID);
                break;
            }
        }
        Logger.info(`[v0.3.30][Boundary] Cache cleaned for session: ${sessionId}`);
    }
}
