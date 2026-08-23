import { IEvidence, EvidenceCategory } from '../evidence/Evidence';

export class ReasoningSnapshot {
    private readonly evidenceMap = new Map<EvidenceCategory, IEvidence[]>();
    private isFrozen = false;

    constructor() {
        for (const cat of Object.values(EvidenceCategory)) {
            this.evidenceMap.set(cat as EvidenceCategory, []);
        }
    }

    public addEvidence(evidence: IEvidence): void {
        if (this.isFrozen) {
            throw new Error('Cannot add evidence: snapshot is frozen');
        }
        const list = this.evidenceMap.get(evidence.category);
        if (list) {
            list.push(evidence);
        }
    }

    public freeze(): void {
        this.isFrozen = true;
        // Deep freeze all arrays
        for (const [key, list] of this.evidenceMap.entries()) {
            this.evidenceMap.set(key, Object.freeze([...list]) as IEvidence[]);
        }
    }

    public getEvidenceByCategory<T extends IEvidence>(category: EvidenceCategory): ReadonlyArray<T> {
        return (this.evidenceMap.get(category) || []) as unknown as ReadonlyArray<T>;
    }

    public getEvidenceForNode(nodeId: string): ReadonlyArray<IEvidence> {
        const result: IEvidence[] = [];
        for (const list of this.evidenceMap.values()) {
            for (const ev of list) {
                if (ev.nodeId === nodeId) {
                    result.push(ev);
                }
            }
        }
        return this.isFrozen ? Object.freeze(result) : result;
    }

    public getAllEvidence(): ReadonlyArray<IEvidence> {
        const result: IEvidence[] = [];
        for (const list of this.evidenceMap.values()) {
            for (const ev of list) {
                result.push(ev);
            }
        }
        return this.isFrozen ? Object.freeze(result) : result;
    }

    /**
     * Creates a new unfrozen snapshot containing all evidence from this snapshot.
     * Use this to create a V2 snapshot from a frozen V1 snapshot.
     */
    public clone(): ReasoningSnapshot {
        const newSnapshot = new ReasoningSnapshot();
        for (const ev of this.getAllEvidence()) {
            newSnapshot.addEvidence({ ...ev }); // Shallow copy is fine for evidence objects
        }
        return newSnapshot;
    }
}

