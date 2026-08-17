import { Edge } from '../GraphModel';

export class ProjectStateSerializer {
    /**
     * Strip internal bloat and default values before saving to JSON.
     * Uses explicit key checking instead of duck typing.
     */
    public static serialize(projectState: any): string {
        // Deep clone or mutate during stringify? We use replacer for streaming efficiency.
        return JSON.stringify(projectState, function (key, value) {
            // Strip Node internals
            if (key === 'nodes' && Array.isArray(value)) {
                return value.map((node: any) => {
                    if (node && node.data && (node.data.references || node.data.classes || node.data.functions)) {
                        const { references, classes, functions, ...restData } = node.data;
                        return { ...node, data: restData };
                    }
                    return node;
                });
            }

            // Strip Edge internals
            if (key === 'edges' && Array.isArray(value)) {
                return value.map((edge: any) => {
                    const newEdge = { ...edge };
                    if (newEdge.visual && newEdge.visual.color === '#888' && newEdge.visual.thickness === 1) {
                        delete newEdge.visual;
                    }
                    if (newEdge.weight === 1) delete newEdge.weight;
                    if (newEdge.status === 'confirmed') delete newEdge.status;
                    if (newEdge.is_approved === true) delete newEdge.is_approved;
                    if (newEdge.data && Object.keys(newEdge.data).length === 0) delete newEdge.data;
                    if (newEdge.intelligence && Object.keys(newEdge.intelligence).length === 0) delete newEdge.intelligence;
                    return newEdge;
                });
            }

            return value;
        }); // Minified format without indent (saves ~10% size)
    }

    /**
     * Restore default values after loading from JSON.
     * Prevents UI components from breaking due to missing fields.
     */
    public static restore(data: any): any {
        if (!data) return data;

        const edges = data.edges || (data.snapshot && data.snapshot.edges) || (data.graph && data.graph.edges);
        if (edges && Array.isArray(edges)) {
            for (const edge of edges) {
                if (!edge.visual) edge.visual = { color: '#888', thickness: 1 };
                if (edge.weight === undefined) edge.weight = 1;
                if (!edge.status) edge.status = 'confirmed';
                if (edge.is_approved === undefined) edge.is_approved = true;
                if (!edge.data) edge.data = {};
                if (!edge.intelligence) edge.intelligence = {};
            }
        }
        return data;
    }
}
