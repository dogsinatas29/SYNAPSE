import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../../utils/Logger';
import { IdentityManager, Permission } from './IdentityManager';
import { SessionManager } from './SessionManager';
import { ProjectMetadata } from '../ProjectMetadata';
import { SubmissionSnapshot, SubmissionFile, ReviewState, ReviewStateType, RemoteEditAction } from '../../types/schema';

export class SubmissionManager {
    private static instance: SubmissionManager;
    private submissions: Map<string, SubmissionSnapshot> = new Map();
    private reviewStates: Map<string, ReviewState> = new Map();
    private remoteEdits: Map<string, RemoteEditAction[]> = new Map();
    private frozenMembers: Set<string> = new Set();

    static getInstance(): SubmissionManager {
        if (!SubmissionManager.instance) {
            SubmissionManager.instance = new SubmissionManager();
        }
        return SubmissionManager.instance;
    }

    createSubmission(
        projectUUID: string,
        sessionId: string,
        clientId: string,
        filePaths: string[]
    ): SubmissionSnapshot {
        const identityManager = IdentityManager.getInstance();
        const role = identityManager.getRole(projectUUID, clientId);
        if (!role || role.role !== 'member') {
            throw new Error(`[v0.3.30] Only members can submit: ${clientId}`);
        }

        const sessionManager = SessionManager.getInstance();
        const session = sessionManager.getSession(sessionId);
        if (!session || session.state !== 'active') {
            throw new Error(`[v0.3.30] No active session for submission`);
        }

        const files: SubmissionFile[] = [];
        const projectRoot = ProjectMetadata.getInstance().getProjectRoot();

        for (const fp of filePaths) {
            const absPath = path.resolve(projectRoot, fp);
            if (!ProjectMetadata.getInstance().validatePath(absPath)) {
                throw new Error(`[v0.3.30] File outside project boundary: ${fp}`);
            }
            const content = fs.readFileSync(absPath, 'utf8');
            files.push({ filePath: fp, content, encoding: 'utf8' });
        }

        const submissionId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const snapshot: SubmissionSnapshot = {
            id: submissionId,
            projectUUID,
            sessionId,
            clientId,
            files,
            timestamp: Date.now(),
            immutable: true,
        };

        this.submissions.set(submissionId, snapshot);

        const review: ReviewState = {
            submissionId,
            state: 'pending',
            leadId: session.leadId,
            reviewedAt: null,
            notes: '',
            corrections: [],
        };
        this.reviewStates.set(submissionId, review);
        this.frozenMembers.add(clientId);

        Logger.info(`[v0.3.30] Submission created: ${submissionId} (${files.length} files, Client: ${clientId})`);
        Logger.info(`[v0.3.30] Member frozen: ${clientId}`);
        return snapshot;
    }

    getSubmission(submissionId: string): SubmissionSnapshot | undefined {
        return this.submissions.get(submissionId);
    }

    getReviewState(submissionId: string): ReviewState | undefined {
        return this.reviewStates.get(submissionId);
    }

    startReview(submissionId: string, leadId: string): ReviewState {
        const identityManager = IdentityManager.getInstance();
        const submission = this.submissions.get(submissionId);
        if (!submission) throw new Error(`[v0.3.30] Submission not found: ${submissionId}`);
        if (!identityManager.hasPermission(submission.projectUUID, leadId, Permission.Verify)) {
            throw new Error(`[v0.3.30] Permission denied: ${leadId} cannot review`);
        }

        const review = this.reviewStates.get(submissionId);
        if (!review) throw new Error(`[v0.3.30] No review state for: ${submissionId}`);
        if (review.state !== 'pending') throw new Error(`[v0.3.30] Review already ${review.state}`);

        review.state = 'review';
        review.leadId = leadId;
        Logger.info(`[v0.3.30] Review started: ${submissionId} by ${leadId}`);
        return review;
    }

    approveSubmission(submissionId: string, leadId: string, notes?: string): ReviewState {
        const submission = this.submissions.get(submissionId);
        if (!submission) throw new Error(`[v0.3.30] Submission not found: ${submissionId}`);

        const identityManager = IdentityManager.getInstance();
        if (!identityManager.hasPermission(submission.projectUUID, leadId, Permission.Verify)) {
            throw new Error(`[v0.3.30] Permission denied: ${leadId} cannot approve`);
        }

        const review = this.reviewStates.get(submissionId);
        if (!review || review.state !== 'review') throw new Error(`[v0.3.30] Submission not in review state`);

        review.state = 'approved';
        review.reviewedAt = Date.now();
        if (notes) review.notes = notes;
        Logger.info(`[v0.3.30] Submission approved: ${submissionId}`);
        return review;
    }

    rejectSubmission(submissionId: string, leadId: string, reason: string): ReviewState {
        const submission = this.submissions.get(submissionId);
        if (!submission) throw new Error(`[v0.3.30] Submission not found: ${submissionId}`);

        const identityManager = IdentityManager.getInstance();
        if (!identityManager.hasPermission(submission.projectUUID, leadId, Permission.Verify)) {
            throw new Error(`[v0.3.30] Permission denied: ${leadId} cannot reject`);
        }

        const review = this.reviewStates.get(submissionId);
        if (!review || review.state !== 'review') throw new Error(`[v0.3.30] Submission not in review state`);

        review.state = 'rejected';
        review.reviewedAt = Date.now();
        review.notes = reason;
        Logger.info(`[v0.3.30] Submission rejected: ${submissionId} — ${reason}`);
        return review;
    }

    applyRemoteEdit(submissionId: string, leadId: string, filePath: string, newContent: string): RemoteEditAction {
        const submission = this.submissions.get(submissionId);
        if (!submission) throw new Error(`[v0.3.30] Submission not found: ${submissionId}`);

        const identityManager = IdentityManager.getInstance();
        if (!identityManager.hasPermission(submission.projectUUID, leadId, Permission.RemoteEdit)) {
            throw new Error(`[v0.3.30] Permission denied: ${leadId} cannot remote edit`);
        }

        const fileEntry = submission.files.find(f => f.filePath === filePath);
        if (!fileEntry) throw new Error(`[v0.3.30] File not found in submission: ${filePath}`);

        const originalContent = fileEntry.content;
        const action: RemoteEditAction = {
            filePath,
            originalContent,
            newContent,
            editedBy: leadId,
            editedAt: Date.now(),
        };

        if (!this.remoteEdits.has(submissionId)) {
            this.remoteEdits.set(submissionId, []);
        }
        this.remoteEdits.get(submissionId)!.push(action);

        fileEntry.content = newContent;

        Logger.info(`[v0.3.30] Remote edit applied: ${filePath} in ${submissionId}`);
        return action;
    }

    getRemoteEdits(submissionId: string): RemoteEditAction[] {
        return this.remoteEdits.get(submissionId) || [];
    }

    getCorrectedWorkspace(submissionId: string): SubmissionFile[] {
        const submission = this.submissions.get(submissionId);
        if (!submission) return [];
        return [...submission.files];
    }

    isMemberFrozen(clientId: string): boolean {
        return this.frozenMembers.has(clientId);
    }

    unfreezeMember(clientId: string): void {
        this.frozenMembers.delete(clientId);
        Logger.info(`[v0.3.30] Member unfrozen: ${clientId}`);
    }

    getSubmissionsByClient(projectUUID: string, clientId: string): SubmissionSnapshot[] {
        const result: SubmissionSnapshot[] = [];
        for (const sub of this.submissions.values()) {
            if (sub.projectUUID === projectUUID && sub.clientId === clientId) {
                result.push(sub);
            }
        }
        return result;
    }

    getSubmissionsByProject(projectUUID: string): SubmissionSnapshot[] {
        const result: SubmissionSnapshot[] = [];
        for (const sub of this.submissions.values()) {
            if (sub.projectUUID === projectUUID) {
                result.push(sub);
            }
        }
        return result;
    }

    clearProject(projectUUID: string): void {
        for (const [id, sub] of this.submissions) {
            if (sub.projectUUID === projectUUID) {
                this.submissions.delete(id);
                this.reviewStates.delete(id);
                this.remoteEdits.delete(id);
            }
        }
        for (const memberId of this.frozenMembers) {
            const identityManager = IdentityManager.getInstance();
            const role = identityManager.getRole(projectUUID, memberId);
            if (role) this.unfreezeMember(memberId);
        }
    }
}
