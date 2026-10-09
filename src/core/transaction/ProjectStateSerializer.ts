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
     * Write project state directly to file with async yields to avoid V8 max string length OOM.
     */
    public static async serializeToFileAsync(projectState: any, filePath: string): Promise<void> {
        const fs = require('fs');
        const fd = fs.openSync(filePath, 'w');
        
        const logHeap = (label: string) => {
            const used = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
            console.log(`[HEAP_TRACK] ${label}: ${used} MB`);
        };

        try {
            const writeNode = (fd: number, node: any) => {
                let n = node;
                if (node && node.data && (node.data.references !== undefined || node.data.classes !== undefined || node.data.functions !== undefined)) {
                    n = { ...node, data: { ...node.data } };
                    delete n.data.references;
                    delete n.data.classes;
                    delete n.data.functions;
                }
                fs.writeSync(fd, JSON.stringify(n));
            };
            
            const writeEdge = (fd: number, edge: any) => {
                const e = { ...edge };
                if (e.visual && e.visual.color === '#888' && e.visual.thickness === 1) {
                    delete e.visual;
                }
                if (e.weight === 1) delete e.weight;
                if (e.status === 'confirmed') delete e.status;
                if (e.is_approved === true) delete e.is_approved;
                if (e.data && Object.keys(e.data).length === 0) delete e.data;
                if (e.intelligence && Object.keys(e.intelligence).length === 0) delete e.intelligence;
                
                fs.writeSync(fd, JSON.stringify(e));
            };

            logHeap('Before Serialization');
            fs.writeSync(fd, '{');
            let firstKey = true;
            for (const key of Object.keys(projectState)) {
                if (!firstKey) fs.writeSync(fd, ',');
                firstKey = false;
                
                fs.writeSync(fd, JSON.stringify(key) + ':');
                
                const value = projectState[key];
                if (key === 'nodes' && Array.isArray(value)) {
                    fs.writeSync(fd, '[');
                    for (let i = 0; i < value.length; i++) {
                        if (i > 0) fs.writeSync(fd, ',');
                        try {
                            writeNode(fd, value[i]);
                        } catch (e) {
                            console.error(`[SERIALIZE_ERROR] Failed to serialize node ${i}:`, e);
                            fs.writeSync(fd, 'null');
                        }
                        if (i % 5000 === 0 && i > 0) {
                            await new Promise(r => setImmediate(r));
                            logHeap(`Nodes loop ${i}`);
                        }
                    }
                    fs.writeSync(fd, ']');
                } else if (key === 'edges' && Array.isArray(value)) {
                    fs.writeSync(fd, '[');
                    for (let i = 0; i < value.length; i++) {
                        if (i > 0) fs.writeSync(fd, ',');
                        try {
                            writeEdge(fd, value[i]);
                        } catch (e) {
                            console.error(`[SERIALIZE_ERROR] Failed to serialize edge ${i}:`, e);
                            fs.writeSync(fd, 'null');
                        }
                        if (i % 10000 === 0 && i > 0) {
                            await new Promise(r => setImmediate(r));
                            logHeap(`Edges loop ${i}`);
                        }
                    }
                    fs.writeSync(fd, ']');
                } else if (Array.isArray(value)) {
                    fs.writeSync(fd, '[');
                    for (let i = 0; i < value.length; i++) {
                        if (i > 0) fs.writeSync(fd, ',');
                        try {
                            fs.writeSync(fd, JSON.stringify(value[i]));
                        } catch (e) {
                            console.error(`[SERIALIZE_ERROR] Failed to serialize item ${i} in ${key}:`, e);
                            fs.writeSync(fd, 'null');
                        }
                    }
                    fs.writeSync(fd, ']');
                } else {
                    try {
                        fs.writeSync(fd, JSON.stringify(value));
                    } catch (e) {
                        console.error(`[SERIALIZE_ERROR] Failed to serialize key ${key}:`, e);
                        fs.writeSync(fd, 'null');
                    }
                }
            }
            fs.writeSync(fd, '}');
            logHeap('After Serialization');
        } finally {
            fs.closeSync(fd);
        }
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
