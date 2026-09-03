import { SimulationState } from './state/SimulationState';
import { FailureCauseRegistry } from './state/FailureCauseRegistry';
import * as crypto from 'crypto';

export interface SimulationNode {
    readonly id: string;
    readonly type: string;
    readonly cluster_id: string;
    readonly state: SimulationState;
    readonly data?: Readonly<any>;
}

export interface SimulationEdge {
    readonly id: string;
    readonly from: string;
    readonly to: string;
    readonly weight: number;
    readonly type: string;
    readonly state: SimulationState;
}

export interface SimulationCluster {
    readonly id: string;
    readonly parent_id?: string;
    readonly label: string;
    readonly type: string;
    readonly collapsed?: boolean;
}

export interface SimulationBoundary {
    readonly id: string;
    readonly type: string;
    readonly members: ReadonlyArray<string>; // Node or Cluster IDs
}

export class SimulationSnapshot {
    public readonly nodes: ReadonlyArray<SimulationNode>;
    public readonly edges: ReadonlyArray<SimulationEdge>;
    public readonly clusters: ReadonlyArray<SimulationCluster>;
    public readonly boundaries: ReadonlyArray<SimulationBoundary>;
    public readonly registry: FailureCauseRegistry;

    private readonly _nodeMap: Map<string, SimulationNode> = new Map();
    private readonly _edgeMap: Map<string, SimulationEdge> = new Map();
    private readonly _clusterMap: Map<string, SimulationCluster> = new Map();
    private readonly _boundaryMap: Map<string, SimulationBoundary> = new Map();
    
    private _isSealed: boolean = false;

    constructor(
        nodes: SimulationNode[] = [],
        edges: SimulationEdge[] = [],
        clusters: SimulationCluster[] = [],
        boundaries: SimulationBoundary[] = [],
        registry?: FailureCauseRegistry
    ) {
        this.nodes = nodes;
        this.edges = edges;
        this.clusters = clusters;
        this.boundaries = boundaries;
        this.registry = registry || new FailureCauseRegistry();

        for (const n of nodes) this._nodeMap.set(n.id, n);
        for (const e of edges) this._edgeMap.set(e.id, e);
        for (const c of clusters) this._clusterMap.set(c.id, c);
        for (const b of boundaries) this._boundaryMap.set(b.id, b);
    }

    public getNode(id: string): SimulationNode | undefined {
        return this._nodeMap.get(id);
    }

    public getEdge(id: string): SimulationEdge | undefined {
        return this._edgeMap.get(id);
    }

    public getCluster(id: string): SimulationCluster | undefined {
        return this._clusterMap.get(id);
    }

    public getBoundary(id: string): SimulationBoundary | undefined {
        return this._boundaryMap.get(id);
    }

    /**
     * Creates a deep clone of the snapshot, ensuring complete reference separation.
     */
    public clone(): SimulationSnapshot {
        return new SimulationSnapshot(
            this.nodes.map(n => SimulationSnapshot.deepCloneNode(n)),
            this.edges.map(e => ({ ...e })),
            this.clusters.map(c => ({ ...c })),
            this.boundaries.map(b => ({ ...b, members: [...b.members] })),
            this.registry.clone()
        );
    }
    
    /**
     * Enforces strict runtime immutability via Object.freeze()
     */
    public seal(): this {
        if (this._isSealed) return this;
        
        Object.freeze(this.nodes);
        Object.freeze(this.edges);
        Object.freeze(this.clusters);
        Object.freeze(this.boundaries);
        
        for (const n of this.nodes) {
            Object.freeze(n);
            if (n.data) Object.freeze(n.data);
        }
        for (const e of this.edges) Object.freeze(e);
        for (const c of this.clusters) Object.freeze(c);
        for (const b of this.boundaries) {
            Object.freeze(b);
            Object.freeze(b.members);
        }
        
        this._isSealed = true;
        return this;
    }

    private static deepCloneNode(n: SimulationNode): SimulationNode {
        return {
            ...n,
            data: n.data ? JSON.parse(JSON.stringify(n.data)) : undefined
        };
    }
}
