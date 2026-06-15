import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { Logger } from '../../utils/Logger';
import { IdentityManager } from './IdentityManager';
import { validateMountPath } from './MountManager';

export interface UserAccount {
    userId: string;
    username: string;
    passwordHash: string;
    createdAt: number;
    sshHost?: string;
    sshPort?: number;
    sshUser?: string;
    sshMountPath?: string;
    sshKey?: string;
}

export interface AuthenticatedUser {
    userId: string;
    username: string;
    createdAt: number;
    sshHost?: string;
    sshPort?: number;
    sshUser?: string;
    sshMountPath?: string;
    sshKey?: string;
}

interface AccountsStore {
    accounts: UserAccount[];
}

export class AccountManager {
    private static instance: AccountManager;
    private accounts: Map<string, UserAccount> = new Map();
    private storePath: string = '';

    static getInstance(): AccountManager {
        if (!AccountManager.instance) {
            AccountManager.instance = new AccountManager();
        }
        return AccountManager.instance;
    }

    initialize(projectRoot: string): void {
        this.storePath = path.join(projectRoot, 'data', 'accounts.json');
        const dir = path.dirname(this.storePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        this.loadSync();
    }

    createAccount(username: string, password: string, sshConfig?: { sshHost?: string; sshPort?: number; sshUser?: string; sshMountPath?: string; sshKey?: string }): UserAccount {
        if (this.accounts.has(username)) {
            throw new Error(`[v0.3.30] Account already exists: ${username}`);
        }
        if (sshConfig?.sshMountPath && !validateMountPath(sshConfig.sshMountPath)) {
            throw new Error(`[v0.3.30] Invalid sshMountPath: "${sshConfig.sshMountPath}". Must be an absolute project path (not "/", no "../", no "~").`);
        }

        const identityManager = IdentityManager.getInstance();
        const identity = identityManager.createIdentity(username);

        const passwordHash = createHash('sha256').update(password).digest('hex');
        const account: UserAccount = {
            userId: identity.userId,
            username,
            passwordHash,
            createdAt: Date.now(),
            ...sshConfig,
        };

        this.accounts.set(username, account);
        this.saveSync();
        Logger.info(`[v0.3.30] Account created: ${username} (${identity.userId})`);
        return account;
    }

    login(username: string, password: string): AuthenticatedUser | null {
        const account = this.accounts.get(username);
        if (!account) return null;

        const hash = createHash('sha256').update(password).digest('hex');
        if (hash !== account.passwordHash) return null;

        return {
            userId: account.userId,
            username: account.username,
            createdAt: account.createdAt,
            sshHost: account.sshHost,
            sshPort: account.sshPort,
            sshUser: account.sshUser,
            sshMountPath: account.sshMountPath,
            sshKey: account.sshKey,
        };
    }

    deleteAccount(username: string): boolean {
        const account = this.accounts.get(username);
        if (!account) return false;
        this.accounts.delete(username);
        this.saveSync();
        Logger.info(`[v0.3.30] Account deleted: ${username} (${account.userId})`);
        return true;
    }

    changePassword(username: string, newPassword: string): boolean {
        const account = this.accounts.get(username);
        if (!account) return false;
        account.passwordHash = createHash('sha256').update(newPassword).digest('hex');
        this.saveSync();
        Logger.info(`[v0.3.30] Password changed for: ${username}`);
        return true;
    }

    updateSSHInfo(username: string, sshConfig: { sshHost?: string; sshPort?: number; sshUser?: string; sshMountPath?: string; sshKey?: string }): boolean {
        const account = this.accounts.get(username);
        if (!account) return false;
        if (sshConfig.sshMountPath && !validateMountPath(sshConfig.sshMountPath)) {
            throw new Error(`[v0.3.30] Invalid sshMountPath: "${sshConfig.sshMountPath}". Must be an absolute project path (not "/", no "../", no "~").`);
        }
        if (sshConfig.sshHost !== undefined) account.sshHost = sshConfig.sshHost || undefined;
        if (sshConfig.sshPort !== undefined) account.sshPort = sshConfig.sshPort || undefined;
        if (sshConfig.sshUser !== undefined) account.sshUser = sshConfig.sshUser || undefined;
        if (sshConfig.sshMountPath !== undefined) account.sshMountPath = sshConfig.sshMountPath || undefined;
        if (sshConfig.sshKey !== undefined) account.sshKey = sshConfig.sshKey || undefined;
        this.saveSync();
        Logger.info(`[v0.3.30] SSH info updated for: ${username}`);
        return true;
    }

    getAllAccounts(): { username: string; userId: string; createdAt: number; sshHost?: string; sshMountPath?: string }[] {
        return Array.from(this.accounts.values()).map(a => ({
            username: a.username,
            userId: a.userId,
            createdAt: a.createdAt,
            sshHost: a.sshHost,
            sshMountPath: a.sshMountPath,
        }));
    }

    getAccount(username: string): UserAccount | undefined {
        return this.accounts.get(username);
    }

    getUsernameByUserId(userId: string): string | undefined {
        for (const acc of this.accounts.values()) {
            if (acc.userId === userId) return acc.username;
        }
        return undefined;
    }

    hasAccount(username: string): boolean {
        return this.accounts.has(username);
    }

    private loadSync(): void {
        if (!fs.existsSync(this.storePath)) {
            this.accounts.clear();
            return;
        }
        try {
            const raw = fs.readFileSync(this.storePath, 'utf8');
            const store: AccountsStore = JSON.parse(raw);
            this.accounts.clear();
            const identityManager = IdentityManager.getInstance();
            for (const acc of store.accounts) {
                this.accounts.set(acc.username, acc);
                if (!identityManager.getIdentity(acc.userId)) {
                    identityManager.createIdentityWithId(acc.userId, acc.username);
                }
            }
            Logger.info(`[v0.3.30] Accounts loaded: ${this.accounts.size}`);
        } catch {
            Logger.warn('[v0.3.30] Failed to load accounts, starting fresh');
            this.accounts.clear();
        }
    }

    private saveSync(): void {
        const store: AccountsStore = {
            accounts: Array.from(this.accounts.values()),
        };
        fs.writeFileSync(this.storePath, JSON.stringify(store, null, 2), 'utf8');
    }
}
