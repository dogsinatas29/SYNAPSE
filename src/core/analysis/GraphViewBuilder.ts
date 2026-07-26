import { Edge, EdgeProvenance, Node } from '../../types/schema';

export enum GraphPolicy {
    FULL,
    TYPE_FILTERED,
    RUNTIME_RESOLVED,
    STRONG_COUPLING,
    EXECUTABLE_COUPLING
}

export interface GraphFilter {
    allow?: EdgeProvenance[];
    exclude?: EdgeProvenance[];
}

export class GraphViewBuilder {
    /**
     * Filters edges based on the provided policy.
     */
    public static build(edges: Edge[], policy: GraphPolicy): Edge[] {
        let filter: GraphFilter = {};

        switch (policy) {
            case GraphPolicy.FULL:
                filter = {};
                break;
            case GraphPolicy.TYPE_FILTERED:
                filter = { exclude: [EdgeProvenance.TYPE_ONLY] };
                break;
            case GraphPolicy.RUNTIME_RESOLVED:
                filter = { exclude: [EdgeProvenance.TYPE_ONLY, EdgeProvenance.UNKNOWN_RUNTIME] };
                break;
            case GraphPolicy.STRONG_COUPLING:
                filter = { allow: [EdgeProvenance.FUNCTION_CALL, EdgeProvenance.CONSTRUCTOR_CALL, EdgeProvenance.INHERITANCE] };
                break;
            case GraphPolicy.EXECUTABLE_COUPLING:
                filter = { allow: [EdgeProvenance.FUNCTION_CALL, EdgeProvenance.CONSTRUCTOR_CALL, EdgeProvenance.INHERITANCE, EdgeProvenance.DECORATOR, EdgeProvenance.FRAMEWORK_REGISTRATION] };
                break;
        }

        return edges.filter(e => {
            const prov = e.provenance;
            if (!prov) {
                // If there's no provenance metadata (e.g. legacy edges), we treat it as UNKNOWN_RUNTIME
                // Or we can just include it unless excluded.
                const simulatedProv = EdgeProvenance.UNKNOWN_RUNTIME;
                if (filter.allow && !filter.allow.includes(simulatedProv)) return false;
                if (filter.exclude && filter.exclude.includes(simulatedProv)) return false;
                return true;
            }
            
            if (filter.allow && !filter.allow.includes(prov)) return false;
            if (filter.exclude && filter.exclude.includes(prov)) return false;
            
            return true;
        });
    }

    /**
     * Computes the Degree of all nodes in a given edge set.
     */
    public static computeDegrees(nodes: Map<string, Node>, edges: Edge[]): Map<string, number> {
        const degrees = new Map<string, number>();
        
        // Initialize degrees
        for (const [id] of nodes) {
            degrees.set(id, 0);
        }

        for (const e of edges) {
            if (degrees.has(e.from)) {
                degrees.set(e.from, degrees.get(e.from)! + 1);
            }
            if (degrees.has(e.to)) {
                degrees.set(e.to, degrees.get(e.to)! + 1);
            }
        }

        return degrees;
    }
}
