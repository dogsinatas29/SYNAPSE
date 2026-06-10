import { CollaborationTransport } from './CollaborationTransport';
import { AuthenticatedUser, AccountManager } from './AccountManager';
import { CollaborationSession, SessionManager } from './SessionManager';
import { SubmissionManager } from './SubmissionManager';
import { SubmissionSnapshot, ReviewState } from '../../types/schema';

export class RestCollaborationTransport implements CollaborationTransport {
    async login(username: string, password: string): Promise<AuthenticatedUser | null> {
        return AccountManager.getInstance().login(username, password);
    }

    async createSession(projectUUID: string, _leadId?: string): Promise<CollaborationSession> {
        const session = SessionManager.getInstance().createServerSession(projectUUID);
        return SessionManager.getInstance().openSession(session.sessionId, 'system');
    }

    async joinSession(sessionId: string, userId: string): Promise<CollaborationSession> {
        return SessionManager.getInstance().serverJoinSession(sessionId, userId);
    }

    async createSubmission(
        projectUUID: string,
        sessionId: string,
        clientId: string,
        filePaths: string[]
    ): Promise<SubmissionSnapshot> {
        return SubmissionManager.getInstance().createSubmission(projectUUID, sessionId, clientId, filePaths);
    }

    async getReviewState(submissionId: string): Promise<ReviewState | null> {
        return SubmissionManager.getInstance().getReviewState(submissionId) || null;
    }
}
