import { Logger } from '../../utils/Logger';
import { HarvestSessionState } from '../../types/schema';

export class HarvestSessionManager {
    private static instance: HarvestSessionManager;
    private state: HarvestSessionState = 'Inactive';
    private lockedClients: Set<string> = new Set();
    private activeProjectUUID: string | null = null;

    static getInstance(): HarvestSessionManager {
        if (!HarvestSessionManager.instance) {
            HarvestSessionManager.instance = new HarvestSessionManager();
        }
        return HarvestSessionManager.instance;
    }

    getState(): HarvestSessionState {
        return this.state;
    }

    setState(newState: HarvestSessionState) {
        Logger.info(`[v0.3.30] HarvestSession state change: ${this.state} -> ${newState}`);
        this.state = newState;
    }

    startSession(projectUUID: string, clientIds: string[]): boolean {
        if (this.state !== 'Inactive' && this.state !== 'Unlocked') {
            Logger.warn(`[v0.3.30] Cannot start session, current state is ${this.state}`);
            return false;
        }

        this.activeProjectUUID = projectUUID;
        this.lockedClients = new Set(clientIds);
        this.setState('Locked');
        return true;
    }

    unlockSession() {
        this.setState('Unlocked');
        this.lockedClients.clear();
        this.activeProjectUUID = null;
    }

    isClientLocked(clientId: string): boolean {
        return (this.state !== 'Inactive' && this.state !== 'Unlocked') && this.lockedClients.has(clientId);
    }

    getLockedClients(): string[] {
        return Array.from(this.lockedClients);
    }
}
