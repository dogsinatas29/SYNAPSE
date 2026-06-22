import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { Logger } from '../../utils/Logger';
import { IdentityManager } from './IdentityManager';

export interface UserAccount {
    userId: string;
    username: string;
    passwordHash: string;
    createdAt: number;
    schemaVersion?: number;
}

export interface AuthenticatedUser {
    userId: string;
    username: string;
    createdAt: number;
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

    createAccount(username: string, password: string): UserAccount {
        if (this.accounts.has(username)) {
            throw new Error(`[v0.3.30] Account already exists: ${username}`);
        }

        const identityManager = IdentityManager.getInstance();
        const identity = identityManager.createIdentity(username);

        const passwordHash = createHash('sha256').update(password).digest('hex');
        const account: UserAccount = {
            userId: identity.userId,
            username,
            passwordHash,
            createdAt: Date.now(),
            schemaVersion: 2,
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

    getAllAccounts(): { username: string; userId: string; createdAt: number }[] {
        return Array.from(this.accounts.values()).map(a => ({
            username: a.username,
            userId: a.userId,
            createdAt: a.createdAt,
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
                // schemaVersion 1 → 2 마이그레이션: SSH 필드 제거
                const migrated: UserAccount = {
                    userId: acc.userId,
                    username: acc.username,
                    passwordHash: acc.passwordHash,
                    createdAt: acc.createdAt,
                    schemaVersion: 2,
                };
                this.accounts.set(acc.username, migrated);
                if (!identityManager.getIdentity(acc.userId)) {
                    identityManager.createIdentityWithId(acc.userId, acc.username);
                }
            }
            Logger.info(`[v0.3.30] Accounts loaded: ${this.accounts.size} (schema v2)`);
        } catch {
            Logger.warn('[v0.3.30] Failed to load accounts, starting fresh');
            this.accounts.clear();
        }
    }

    private saveSync(): void {
        const store: AccountsStore = {
            accounts: Array.from(this.accounts.values()),
        };
        const tmpPath = this.storePath + '.tmp';
        fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), 'utf8');
        fs.renameSync(tmpPath, this.storePath);
    }
}
