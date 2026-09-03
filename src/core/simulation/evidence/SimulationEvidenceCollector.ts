import { SimulationEvidence } from './SimulationEvidence';
import { SimulationEvidenceGraph } from './SimulationEvidenceGraph';
import { SimulationEvidenceType } from './SimulationEvidenceType';

export class SimulationEvidenceCollector {
    private readonly _graph: SimulationEvidenceGraph;
    private _sequenceCounter: number = 0;

    constructor(graph?: SimulationEvidenceGraph) {
        this._graph = graph || new SimulationEvidenceGraph();
    }

    /**
     * Captures and stores a new evidence in the graph.
     * Evidence is made completely immutable (Deep Freeze).
     */
    public capture(type: SimulationEvidenceType, sourceId: string, metadata?: any): SimulationEvidence {
        const sequence = ++this._sequenceCounter;
        const id = `ev_${sequence}_${type}_${sourceId}`;

        const evidence: SimulationEvidence = {
            id,
            type,
            sourceId,
            sequence,
            metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined
        };

        // Enforce Immutability
        Object.freeze(evidence);
        if (evidence.metadata) {
            Object.freeze(evidence.metadata);
        }

        this._graph.addEvidence(evidence);
        return evidence;
    }

    /**
     * Links two pieces of evidence together (Cause -> Effect).
     */
    public link(causeId: string, effectId: string): void {
        this._graph.link(causeId, effectId);
    }

    public getGraph(): SimulationEvidenceGraph {
        return this._graph;
    }
}
