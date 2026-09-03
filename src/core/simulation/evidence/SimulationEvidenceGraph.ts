import { SimulationEvidence } from './SimulationEvidence';

export class SimulationEvidenceGraph {
    private readonly _evidences: Map<string, SimulationEvidence> = new Map();
    // Maps a child evidence ID to an array of its parent evidence IDs (Causes)
    private readonly _parents: Map<string, string[]> = new Map();
    // Maps a parent evidence ID to an array of its child evidence IDs (Effects)
    private readonly _children: Map<string, string[]> = new Map();

    /**
     * Adds an evidence to the graph.
     */
    public addEvidence(evidence: SimulationEvidence): void {
        if (this._evidences.has(evidence.id)) {
            throw new Error(`Evidence with ID ${evidence.id} already exists.`);
        }
        this._evidences.set(evidence.id, evidence);
        this._parents.set(evidence.id, []);
        this._children.set(evidence.id, []);
    }

    /**
     * Links a cause (parent) to an effect (child).
     * Strictly enforces Directed Acyclic Graph (DAG) validation to prevent cycles.
     */
    public link(causeId: string, effectId: string): void {
        if (!this._evidences.has(causeId)) throw new Error(`Cause evidence ${causeId} not found.`);
        if (!this._evidences.has(effectId)) throw new Error(`Effect evidence ${effectId} not found.`);

        if (causeId === effectId) {
            throw new Error(`Self-referencing cycle detected: ${causeId} -> ${effectId}`);
        }

        // Cycle Detection (DFS)
        if (this.wouldCreateCycle(causeId, effectId)) {
            throw new Error(`DAG Violation: Linking ${causeId} -> ${effectId} creates a cycle.`);
        }

        const parents = this._parents.get(effectId)!;
        if (!parents.includes(causeId)) {
            parents.push(causeId);
        }

        const children = this._children.get(causeId)!;
        if (!children.includes(effectId)) {
            children.push(effectId);
        }
    }

    public getEvidence(id: string): SimulationEvidence | undefined {
        return this._evidences.get(id);
    }

    public getAllEvidences(): SimulationEvidence[] {
        return Array.from(this._evidences.values());
    }

    public getCauses(effectId: string): SimulationEvidence[] {
        const parentIds = this._parents.get(effectId) || [];
        return parentIds.map(id => this._evidences.get(id)!);
    }

    public getEffects(causeId: string): SimulationEvidence[] {
        const childIds = this._children.get(causeId) || [];
        return childIds.map(id => this._evidences.get(id)!);
    }

    /**
     * Checks if adding an edge from causeId to effectId would create a cycle.
     * We do a DFS from effectId. If we can reach causeId, adding (causeId -> effectId) creates a cycle.
     */
    private wouldCreateCycle(causeId: string, effectId: string): boolean {
        const visited = new Set<string>();
        const stack = [effectId];

        while (stack.length > 0) {
            const current = stack.pop()!;
            if (current === causeId) return true;

            if (!visited.has(current)) {
                visited.add(current);
                const children = this._children.get(current) || [];
                for (const child of children) {
                    stack.push(child);
                }
            }
        }

        return false;
    }
}
