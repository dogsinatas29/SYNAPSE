import { AuthenticatedUser } from './AccountManager';
import { CollaborationSession } from './SessionManager';
export interface CollaborationTransport {
    login(username: string, password: string): Promise<AuthenticatedUser | null>;
    createSession(projectUUID: string, leadId?: string): Promise<CollaborationSession>;
    joinSession(sessionId: string, userId: string): Promise<CollaborationSession>;
}
