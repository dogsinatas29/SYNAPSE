import { Logger } from '../../utils/Logger';

export type RoleType = 'lead' | 'member';

export enum Permission {
    ReadLayer = 'read_layer',
    WriteLayer = 'write_layer',
    Verify = 'verify',
    Harvest = 'harvest',
    ApproveJoin = 'approve_join',
    CloseSession = 'close_session',
    RemoteEdit = 'remote_edit',
    SubmitChanges = 'submit_changes',
    CreateSession = 'create_session',
    DisconnectClient = 'disconnect_client',
    JoinSession = 'join_session',
    LeaveSession = 'leave_session',
    ReceiveCommands = 'receive_commands',
}

export interface Identity {
    userId: string;
    displayName: string;
    createdAt: number;
}

export interface ProjectRole {
    projectUUID: string;
    userId: string;
    role: RoleType;
    assignedAt: number;
}

const ROLE_PERMISSIONS: Record<RoleType, Permission[]> = {
    lead: [
        Permission.CreateSession,
        Permission.CloseSession,
        Permission.ApproveJoin,
        Permission.Verify,
        Permission.Harvest,
        Permission.RemoteEdit,
        Permission.DisconnectClient,
        Permission.ReadLayer,
        Permission.WriteLayer,
    ],
    member: [],
};

export class IdentityManager {
    private static instance: IdentityManager;
    private identities: Map<string, Identity> = new Map();
    private projectRoles: Map<string, ProjectRole> = new Map();

    static getInstance(): IdentityManager {
        if (!IdentityManager.instance) {
            IdentityManager.instance = new IdentityManager();
        }
        return IdentityManager.instance;
    }

    createIdentity(displayName: string): Identity {
        const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const identity: Identity = {
            userId,
            displayName,
            createdAt: Date.now(),
        };
        this.identities.set(userId, identity);
        Logger.info(`[v0.3.30] Identity created: ${displayName} (${userId})`);
        return identity;
    }

    createIdentityWithId(userId: string, displayName: string): Identity {
        const identity: Identity = {
            userId,
            displayName,
            createdAt: Date.now(),
        };
        this.identities.set(userId, identity);
        Logger.info(`[v0.3.30] Identity restored: ${displayName} (${userId})`);
        return identity;
    }

    getIdentity(userId: string): Identity | undefined {
        return this.identities.get(userId);
    }

    assignRole(projectUUID: string, userId: string, role: RoleType): ProjectRole {
        if (!this.identities.has(userId)) {
            throw new Error(`[v0.3.30] Identity not found: ${userId}`);
        }
        const key = `${projectUUID}:${userId}`;
        const projectRole: ProjectRole = {
            projectUUID,
            userId,
            role,
            assignedAt: Date.now(),
        };
        this.projectRoles.set(key, projectRole);
        Logger.info(`[v0.3.30] Role assigned: ${userId} → ${role} in project ${projectUUID}`);
        return projectRole;
    }

    getRole(projectUUID: string, userId: string): ProjectRole | undefined {
        return this.projectRoles.get(`${projectUUID}:${userId}`);
    }

    getPermissions(projectUUID: string, userId: string): Permission[] {
        const role = this.getRole(projectUUID, userId);
        if (!role) return [];
        return ROLE_PERMISSIONS[role.role] || [];
    }

    hasPermission(projectUUID: string, userId: string, permission: Permission): boolean {
        return this.getPermissions(projectUUID, userId).includes(permission);
    }

    removeRole(projectUUID: string, userId: string): void {
        this.projectRoles.delete(`${projectUUID}:${userId}`);
    }

    getProjectMembers(projectUUID: string): ProjectRole[] {
        const members: ProjectRole[] = [];
        for (const [key, role] of this.projectRoles) {
            if (key.startsWith(projectUUID + ':')) {
                members.push(role);
            }
        }
        return members;
    }

    getAllIdentities(): Identity[] {
        return Array.from(this.identities.values());
    }

    clearSession(): void {
        this.identities.clear();
        this.projectRoles.clear();
    }
}
