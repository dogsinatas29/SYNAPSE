import { SimulationSnapshot, SimulationBoundary } from './SimulationSnapshot';
import { SimulationState } from './state/SimulationState';

export interface BoundaryMetadata {
    id: string;
    nodeCount: number;
    clusterCount: number;
}

export class SimulationBoundaryResolver {
    /**
     * Looks up a SimulationBoundary strictly by its ID.
     */
    public static lookup(snapshot: SimulationSnapshot, boundaryId: string): SimulationBoundary | undefined {
        return snapshot.getBoundary(boundaryId);
    }

    /**
     * Selects all SimulationBoundaries that contain a specific node.
     */
    public static selectByNode(snapshot: SimulationSnapshot, nodeId: string): SimulationBoundary[] {
        // Fast path: if nodes keep a reference to boundary, use it.
        // But since boundary members are defined in boundary.members, we scan them.
        // For performance on large repos, this might need an inverted index in the future,
        // but for Phase 3 read-only isolation proof, this is sufficient.
        const results: SimulationBoundary[] = [];
        for (const boundary of snapshot.boundaries) {
            if (boundary.members.includes(nodeId)) {
                results.push(boundary);
            }
        }
        return results;
    }

    /**
     * Evaluates the impact metadata of a boundary without causing any state mutations.
     * State transition logic is forbidden here.
     */
    public static evaluateImpact(snapshot: SimulationSnapshot, boundaryId: string): BoundaryMetadata | undefined {
        const boundary = snapshot.getBoundary(boundaryId);
        if (!boundary) return undefined;

        let nodeCount = 0;
        let clusterCount = 0;

        // Count members
        for (const memberId of boundary.members) {
            if (snapshot.getNode(memberId)) nodeCount++;
            else if (snapshot.getCluster(memberId)) clusterCount++;
        }

        return {
            id: boundary.id,
            nodeCount,
            clusterCount
        };
    }
}
