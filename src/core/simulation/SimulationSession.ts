import { SimulationAction, SimulationActionType, ScenarioSnapshot } from '../../types/schema';
import { TopologyOverlay } from './TopologyOverlay';

/**
 * v0.3.34.30 - Orchestrator for TopologyOverlay State
 * Manages actions (Undo/Redo), stores and loads Scenarios.
 * Ensures the graph has not mutated out from underneath the simulation.
 */
export class SimulationSession {
    private sourceGraphHash: string;
    private undoStack: SimulationAction[] = [];
    private redoStack: SimulationAction[] = [];
    private activeOverlay: TopologyOverlay;

    constructor(sourceGraphHash: string) {
        this.sourceGraphHash = sourceGraphHash;
        this.activeOverlay = new TopologyOverlay();
    }

    /**
     * Gets the current overlay. Throws if the underlying graph has mutated.
     */
    public getOverlay(currentGraphHash: string): TopologyOverlay {
        this.validateGraphHash(currentGraphHash);
        return this.activeOverlay;
    }

    public getActions(): SimulationAction[] {
        return [...this.undoStack];
    }

    private validateGraphHash(currentHash: string) {
        if (currentHash !== this.sourceGraphHash) {
            throw new Error(`SimulationSession invalidated: Source graph hash mismatch (Expected ${this.sourceGraphHash}, got ${currentHash})`);
        }
    }

    public applyAction(currentGraphHash: string, action: SimulationAction) {
        this.validateGraphHash(currentGraphHash);
        this.undoStack.push(action);
        this.redoStack = []; // Clear redo stack on new action
        this.rebuildOverlay();
    }

    public undo(currentGraphHash: string) {
        this.validateGraphHash(currentGraphHash);
        const action = this.undoStack.pop();
        if (action) {
            this.redoStack.push(action);
            this.rebuildOverlay();
        }
    }

    public redo(currentGraphHash: string) {
        this.validateGraphHash(currentGraphHash);
        const action = this.redoStack.pop();
        if (action) {
            this.undoStack.push(action);
            this.rebuildOverlay();
        }
    }

    private rebuildOverlay() {
        this.activeOverlay = new TopologyOverlay();
        for (const action of this.undoStack) {
            if (action.type === SimulationActionType.REMOVE_NODE && action.nodeId) {
                this.activeOverlay.removedNodes.add(action.nodeId);
            } else if (action.type === SimulationActionType.REMOVE_EDGE && action.source && action.target) {
                this.activeOverlay.removedEdges.add(`${action.source}::${action.target}`);
            } else if (action.type === SimulationActionType.ADD_EDGE && action.source && action.target) {
                this.activeOverlay.addedEdges.push({
                    source: action.source,
                    target: action.target,
                    type: action.edgeType || 'dependency'
                });
            }
        }
    }

    public saveScenario(currentGraphHash: string, description: string): ScenarioSnapshot {
        this.validateGraphHash(currentGraphHash);
        return {
            id: `scenario_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            timestamp: Date.now(),
            description,
            actions: [...this.undoStack]
        };
    }

    public loadScenario(currentGraphHash: string, snapshot: ScenarioSnapshot) {
        this.validateGraphHash(currentGraphHash);
        this.undoStack = [...snapshot.actions];
        this.redoStack = [];
        this.rebuildOverlay();
    }
}
