import * as crypto from 'crypto';

export interface FailureCause {
    id: string; // e.g. "ev_root" or unique cause id
    eventType: string; // e.g. "DEPENDENCY_REMOVED"
    sourceId: string; // e.g. "edge_A"
}

export interface FailureCauseSet {
    ownerId: string;
    ownerType: 'NODE' | 'EDGE';
    activeCauses: readonly FailureCause[];
}

export class FailureCauseRegistry {
    private store: Map<string, FailureCause[]> = new Map();

    private getKey(ownerType: 'NODE' | 'EDGE', ownerId: string): string {
        return `${ownerType}:${ownerId}`;
    }

    public addCause(ownerType: 'NODE' | 'EDGE', ownerId: string, cause: FailureCause): void {
        const key = this.getKey(ownerType, ownerId);
        const causes = this.store.get(key) || [];
        // Prevent duplicate causes
        if (!causes.find(c => c.id === cause.id)) {
            causes.push(cause);
            this.store.set(key, causes);
        }
    }

    public removeCause(ownerType: 'NODE' | 'EDGE', ownerId: string, causeId: string): void {
        const key = this.getKey(ownerType, ownerId);
        const causes = this.store.get(key);
        if (causes) {
            const filtered = causes.filter(c => c.id !== causeId);
            if (filtered.length === 0) {
                this.store.delete(key);
            } else {
                this.store.set(key, filtered);
            }
        }
    }

    public getActiveCauses(ownerType: 'NODE' | 'EDGE', ownerId: string): readonly FailureCause[] {
        const key = this.getKey(ownerType, ownerId);
        return this.store.get(key) || [];
    }

    public canRecover(ownerType: 'NODE' | 'EDGE', ownerId: string): boolean {
        return this.getActiveCauses(ownerType, ownerId).length === 0;
    }

    public clone(): FailureCauseRegistry {
        const cloned = new FailureCauseRegistry();
        for (const [key, causes] of this.store.entries()) {
            cloned.store.set(key, [...causes]);
        }
        return cloned;
    }

    public serialize(): string {
        // Sort keys to guarantee deterministic serialization
        const keys = Array.from(this.store.keys()).sort();
        const obj: Record<string, FailureCause[]> = {};
        for (const key of keys) {
            // Sort causes by ID for determinism
            const causes = [...(this.store.get(key) || [])].sort((a, b) => a.id.localeCompare(b.id));
            obj[key] = causes;
        }
        return JSON.stringify(obj);
    }

    public getHash(): string {
        return crypto.createHash('sha256').update(this.serialize()).digest('hex').substring(0, 8);
    }
}
