import * as crypto from 'crypto';
import { Logger } from '../../utils/Logger';
import { IdentityManager, Permission } from './IdentityManager';
import { ProjectMetadata } from '../ProjectMetadata';

export type SessionState = 'created' | 'open' | 'active' | 'closing' | 'closed';

export interface CollaborationSession {
    sessionId: string;
    projectUUID: string;
    leadId: string;
    state: SessionState;
    members: string[];
    createdAt: number;
    closedAt: number | null;
    maxMembers: number;
}

export class SessionManager {
    private static instance: SessionManager;
    private sessions: Map<string, CollaborationSession> = new Map();
    private static readonly DEFAULT_MAX_MEMBERS = 10;

    static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    createSession(projectUUID: string, leadId: string): CollaborationSession {
        const identityManager = IdentityManager.getInstance();
        if (!identityManager.hasPermission(projectUUID, leadId, Permission.CreateSession)) {
            throw new Error(`[v0.3.30] Permission denied: ${leadId} cannot create sessions`);
        }

        const sessionId = crypto.randomUUID();
        const session: CollaborationSession = {
            sessionId,
            projectUUID,
            leadId,
            state: 'created',
            members: [leadId],
            createdAt: Date.now(),
            closedAt: null,
            maxMembers: SessionManager.DEFAULT_MAX_MEMBERS,
        };
        this.sessions.set(sessionId, session);
        Logger.info(`[v0.3.30] Session created: ${sessionId} (Lead: ${leadId})`);
        return session;
    }

    createServerSession(projectUUID: string): CollaborationSession {
        const sessionId = crypto.randomUUID();
        const session: CollaborationSession = {
            sessionId,
            projectUUID,
            leadId: 'system',
            state: 'created',
            members: ['system'],
            createdAt: Date.now(),
            closedAt: null,
            maxMembers: SessionManager.DEFAULT_MAX_MEMBERS,
        };
        this.sessions.set(sessionId, session);
        Logger.info(`[v0.3.30] Server session created: ${sessionId}`);
        return session;
    }

    openSession(sessionId: string, userId: string): CollaborationSession {
        const session = this.getSession(sessionId);
        if (!session) throw new Error(`[v0.3.30] Session not found: ${sessionId}`);
        if (session.state !== 'created') throw new Error(`[v0.3.30] Session cannot be opened (state: ${session.state})`);
        if (session.leadId !== userId) throw new Error(`[v0.3.30] Only lead can open session`);

        session.state = 'open';
        Logger.info(`[v0.3.30] Session opened: ${sessionId}`);
        return session;
    }

    joinSession(sessionId: string, userId: string): CollaborationSession {
        const session = this.getSession(sessionId);
        if (!session) throw new Error(`[v0.3.30] Session not found: ${sessionId}`);

        this.validateJoin(session, userId);

        const identityManager = IdentityManager.getInstance();
        if (!identityManager.hasPermission(session.projectUUID, session.leadId, Permission.ApproveJoin)) {
            throw new Error(`[v0.3.30] Lead lacks approval permission`);
        }

        session.members.push(userId);
        if (session.state === 'open') {
            session.state = 'active';
        }
        Logger.info(`[v0.3.30] User joined session: ${userId} → ${sessionId}`);
        return session;
    }

    serverJoinSession(sessionId: string, userId: string): CollaborationSession {
        const session = this.getSession(sessionId);
        if (!session) throw new Error(`[v0.3.30] Session not found: ${sessionId}`);

        this.validateJoin(session, userId);

        session.members.push(userId);
        if (session.state === 'open') {
            session.state = 'active';
        }
        Logger.info(`[v0.3.30] Server-joined: ${userId} → ${sessionId}`);
        return session;
    }

    leaveSession(sessionId: string, userId: string): CollaborationSession {
        const session = this.getSession(sessionId);
        if (!session) throw new Error(`[v0.3.30] Session not found: ${sessionId}`);

        if (userId === session.leadId) {
            throw new Error(`[v0.3.30] Lead cannot leave. Close session instead.`);
        }

        const idx = session.members.indexOf(userId);
        if (idx >= 0) {
            session.members.splice(idx, 1);
        }
        Logger.info(`[v0.3.30] User left session: ${userId} ← ${sessionId}`);
        return session;
    }

    closeSession(sessionId: string, userId: string): CollaborationSession {
        const session = this.getSession(sessionId);
        if (!session) throw new Error(`[v0.3.30] Session not found: ${sessionId}`);

        const identityManager = IdentityManager.getInstance();
        if (!identityManager.hasPermission(session.projectUUID, userId, Permission.CloseSession)) {
            throw new Error(`[v0.3.30] Permission denied: ${userId} cannot close sessions`);
        }

        session.state = 'closing';
        session.members = [session.leadId];
        session.state = 'closed';
        session.closedAt = Date.now();
        Logger.info(`[v0.3.30] Session closed: ${sessionId}`);
        return session;
    }

    getSession(sessionId: string): CollaborationSession | undefined {
        return this.sessions.get(sessionId);
    }

    getActiveSessions(projectUUID: string): CollaborationSession[] {
        const active: CollaborationSession[] = [];
        for (const session of this.sessions.values()) {
            if (session.projectUUID === projectUUID && session.state !== 'closed') {
                active.push(session);
            }
        }
        return active;
    }

    getAllSessions(): CollaborationSession[] {
        return Array.from(this.sessions.values());
    }

    getMemberCount(sessionId: string): number {
        const session = this.sessions.get(sessionId);
        return session ? session.members.length : 0;
    }

    clearProjectSessions(projectUUID: string): void {
        for (const [id, session] of this.sessions) {
            if (session.projectUUID === projectUUID) {
                this.sessions.delete(id);
            }
        }
    }

    private validateJoin(session: CollaborationSession, userId: string): void {
        if (session.state === 'closed') {
            throw new Error(`[v0.3.30] Session is closed: ${session.sessionId}`);
        }
        if (session.state === 'created') {
            throw new Error(`[v0.3.30] Session not yet open: ${session.sessionId}`);
        }
        if (session.members.includes(userId)) {
            throw new Error(`[v0.3.30] Already a member: ${userId}`);
        }
        if (session.members.length >= session.maxMembers) {
            throw new Error(`[v0.3.30] Session at capacity (${session.maxMembers})`);
        }
        const projectUUID = session.projectUUID;
        try {
            const root = ProjectMetadata.getInstance().getProjectRoot();
            if (!root) throw new Error('no project root');
        } catch {
            throw new Error(`[v0.3.30] Project not initialized`);
        }
    }
}
