import { AuthenticatedUser } from './AccountManager';
import { CollaborationSession } from './SessionManager';
import { SubmissionSnapshot, ReviewState } from '../../types/schema';

export interface CollaborationTransport {
    login(username: string, password: string): Promise<AuthenticatedUser | null>;
    createSession(projectUUID: string, leadId?: string): Promise<CollaborationSession>;
    joinSession(sessionId: string, userId: string): Promise<CollaborationSession>;
    createSubmission(
        projectUUID: string,
        sessionId: string,
        clientId: string,
        filePaths: string[]
    ): Promise<SubmissionSnapshot>;
    getReviewState(submissionId: string): Promise<ReviewState | null>;
}
