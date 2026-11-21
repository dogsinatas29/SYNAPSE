import * as fs from 'fs';
import * as path from 'path';

export interface UserNodePatch {
    label?: string;
    description?: string;
    status?: 'approved';
}

export interface UserEdgePatch {
    label?: string;
    description?: string;
    status?: 'confirmed';
}

export interface UserGraphData {
    version: 1;
    revision: number;
    updatedAt: string;
    modifiedNodes: Record<string, UserNodePatch>;
    modifiedEdges: Record<string, UserEdgePatch>;
    hiddenNodeIds: string[];
    hiddenEdgeIds: string[];
}

export class UserGraphStorage {
    private static isReadOnlyMode: boolean = false;

    public static createEmptyUserGraph(): UserGraphData {
        return {
            version: 1,
            revision: 0,
            updatedAt: new Date().toISOString(),
            modifiedNodes: {},
            modifiedEdges: {},
            hiddenNodeIds: [],
            hiddenEdgeIds: []
        };
    }

    public static getUserGraphFilePath(workspaceRoot: string): string {
        return path.join(workspaceRoot, 'synapse_data', 'user_graph.json');
    }

    public static getIsReadOnly(): boolean {
        return this.isReadOnlyMode;
    }

    public static setReadOnly(readOnly: boolean): void {
        this.isReadOnlyMode = readOnly;
    }

    /**
     * Sanitize and validate patch for Node against Allowlist.
     * Rejects identity fields (id, from, to, filePath, position, etc.) and prototype pollution.
     */
    public static sanitizeNodePatch(rawPatch: any): UserNodePatch | null {
        if (!rawPatch || typeof rawPatch !== 'object' || Array.isArray(rawPatch)) {
            return null;
        }

        const safePatch: UserNodePatch = {};

        // Prototype pollution check
        const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
        for (const key of Object.getOwnPropertyNames(rawPatch)) {
            if (dangerousKeys.includes(key)) {
                throw new Error(`Security Exception: Forbidden key detected in node patch: ${key}`);
            }
        }
        if (Object.prototype.hasOwnProperty.call(rawPatch, '__proto__') ||
            Object.prototype.hasOwnProperty.call(rawPatch, 'constructor') ||
            Object.prototype.hasOwnProperty.call(rawPatch, 'prototype')) {
            throw new Error(`Security Exception: Forbidden key detected in node patch`);
        }

        // label: 1 <= length <= 256
        if (typeof rawPatch.label === 'string') {
            const trimmed = rawPatch.label.trim();
            if (trimmed.length >= 1 && trimmed.length <= 256) {
                safePatch.label = trimmed;
            }
        }

        // description: length <= 2048
        if (typeof rawPatch.description === 'string') {
            if (rawPatch.description.length <= 2048) {
                safePatch.description = rawPatch.description;
            }
        }

        // status: only 'approved' allowed; if empty string, signal delete
        if (rawPatch.status === 'approved') {
            safePatch.status = 'approved';
        } else if (rawPatch.status === '' || rawPatch.status === undefined) {
            // reset status - do not include or undefined
        } else if (rawPatch.status !== undefined) {
            // reject arbitrary status values
            return null;
        }

        return Object.keys(safePatch).length > 0 ? safePatch : {};
    }

    /**
     * Sanitize and validate patch for Edge against Allowlist.
     */
    public static sanitizeEdgePatch(rawPatch: any): UserEdgePatch | null {
        if (!rawPatch || typeof rawPatch !== 'object' || Array.isArray(rawPatch)) {
            return null;
        }

        const safePatch: UserEdgePatch = {};

        const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
        for (const key of Object.getOwnPropertyNames(rawPatch)) {
            if (dangerousKeys.includes(key)) {
                throw new Error(`Security Exception: Forbidden key detected in edge patch: ${key}`);
            }
        }
        if (Object.prototype.hasOwnProperty.call(rawPatch, '__proto__') ||
            Object.prototype.hasOwnProperty.call(rawPatch, 'constructor') ||
            Object.prototype.hasOwnProperty.call(rawPatch, 'prototype')) {
            throw new Error(`Security Exception: Forbidden key detected in edge patch`);
        }

        if (typeof rawPatch.label === 'string') {
            const trimmed = rawPatch.label.trim();
            if (trimmed.length >= 1 && trimmed.length <= 256) {
                safePatch.label = trimmed;
            }
        }

        if (typeof rawPatch.description === 'string') {
            if (rawPatch.description.length <= 2048) {
                safePatch.description = rawPatch.description;
            }
        }

        if (rawPatch.status === 'confirmed') {
            safePatch.status = 'confirmed';
        } else if (rawPatch.status === '' || rawPatch.status === undefined) {
            // reset status
        } else if (rawPatch.status !== undefined) {
            return null;
        }

        return Object.keys(safePatch).length > 0 ? safePatch : {};
    }

    /**
     * Validates UserGraphData schema structure.
     */
    public static validateSchema(data: any): boolean {
        if (!data || typeof data !== 'object') return false;
        if (data.version !== 1) return false;
        if (typeof data.revision !== 'number') return false;
        if (typeof data.updatedAt !== 'string') return false;
        if (!data.modifiedNodes || typeof data.modifiedNodes !== 'object') return false;
        if (!data.modifiedEdges || typeof data.modifiedEdges !== 'object') return false;
        if (!Array.isArray(data.hiddenNodeIds)) return false;
        if (!Array.isArray(data.hiddenEdgeIds)) return false;

        // Custom Nodes / Custom Edges strictly forbidden (YAGNI)
        if ('customNodes' in data || 'customEdges' in data) return false;

        return true;
    }

    /**
     * Loads user_graph.json from workspace.
     * Backs up corrupt files safely without overwriting.
     */
    public static async loadUserGraph(workspaceRoot: string): Promise<UserGraphData> {
        const filePath = this.getUserGraphFilePath(workspaceRoot);
        if (!fs.existsSync(filePath)) {
            return this.createEmptyUserGraph();
        }

        let rawContent: string;
        try {
            rawContent = fs.readFileSync(filePath, 'utf8');
        } catch (readErr: any) {
            console.error(`[UserGraphStorage] Failed to read ${filePath}: ${readErr.message}`);
            return this.createEmptyUserGraph();
        }

        let parsed: any;
        let isCorrupt = false;

        try {
            parsed = JSON.parse(rawContent);
            if (!this.validateSchema(parsed)) {
                isCorrupt = true;
            }
        } catch (parseErr) {
            isCorrupt = true;
        }

        if (isCorrupt) {
            console.warn(`[UserGraphStorage] Corrupt user_graph.json detected at ${filePath}. Preserving backup.`);
            const backedUp = this.backupCorruptFile(filePath);
            if (!backedUp) {
                // Inability to backup corrupt file forces Read-Only mode to protect user data from being overwritten
                console.error(`[UserGraphStorage] CRITICAL: Failed to backup corrupt user_graph.json. Entering READ-ONLY mode.`);
                this.isReadOnlyMode = true;
            }
            return this.createEmptyUserGraph();
        }

        return parsed as UserGraphData;
    }

    /**
     * Saves user_graph.json safely.
     */
    public static async saveUserGraph(workspaceRoot: string, data: UserGraphData): Promise<void> {
        if (this.isReadOnlyMode) {
            throw new Error('[UserGraphStorage] Read-Only Mode Active: cannot write user_graph.json to protect un-backed corrupt data.');
        }

        if (!this.validateSchema(data)) {
            throw new Error('[UserGraphStorage] Schema Validation Failed before save.');
        }

        const synapseDataDir = path.join(workspaceRoot, 'synapse_data');
        if (!fs.existsSync(synapseDataDir)) {
            fs.mkdirSync(synapseDataDir, { recursive: true });
        }

        const filePath = this.getUserGraphFilePath(workspaceRoot);
        const tempPath = `${filePath}.tmp.${Date.now()}`;

        const serialized = JSON.stringify(data, null, 2);
        fs.writeFileSync(tempPath, serialized, 'utf8');
        fs.renameSync(tempPath, filePath);
    }

    /**
     * Backs up a corrupt file with unique counter to prevent overwriting existing backups.
     */
    public static backupCorruptFile(filePath: string): boolean {
        try {
            const dir = path.dirname(filePath);
            const timestamp = Date.now();
            let counter = 0;
            let backupPath = path.join(dir, `user_graph.json.corrupt-${timestamp}-${counter}`);
            while (fs.existsSync(backupPath)) {
                counter++;
                backupPath = path.join(dir, `user_graph.json.corrupt-${timestamp}-${counter}`);
            }

            fs.renameSync(filePath, backupPath);
            console.warn(`[UserGraphStorage] Successfully backed up corrupt file to: ${backupPath}`);
            return true;
        } catch (backupErr: any) {
            console.error(`[UserGraphStorage] Failed to backup corrupt file: ${backupErr.message}`);
            return false;
        }
    }

    /**
     * Resets user_graph.json with a safety backup (.reset-backup-<timestamp>).
     */
    public static async reset(workspaceRoot: string): Promise<UserGraphData> {
        const filePath = this.getUserGraphFilePath(workspaceRoot);
        if (fs.existsSync(filePath)) {
            try {
                const dir = path.dirname(filePath);
                const timestamp = Date.now();
                let counter = 0;
                let backupPath = path.join(dir, `user_graph.json.reset-backup-${timestamp}-${counter}`);
                while (fs.existsSync(backupPath)) {
                    counter++;
                    backupPath = path.join(dir, `user_graph.json.reset-backup-${timestamp}-${counter}`);
                }
                fs.renameSync(filePath, backupPath);
                console.info(`[UserGraphStorage] Reset safety backup created at: ${backupPath}`);
            } catch (err: any) {
                console.warn(`[UserGraphStorage] Failed to create reset backup: ${err.message}`);
            }
        }

        const empty = this.createEmptyUserGraph();
        await this.saveUserGraph(workspaceRoot, empty);
        return empty;
    }

    /**
     * Deep clone helper: uses native structuredClone with JSON fallback.
     */
    public static deepClone<T>(obj: T): T {
        if (typeof structuredClone === 'function') {
            try {
                return structuredClone(obj);
            } catch (e) {
                // Fallback if object has non-cloneable symbols/functions
            }
        }
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Creates an Independent Rendering Copy of ProjectState with user_graph overlay applied.
     * SSoT masterState remains 100% immutable and unmutated.
     */
    public static createRenderingCopy(masterState: any, overlay: UserGraphData): any {
        if (!masterState) return masterState;

        // 1. Entire deep clone to ensure complete isolation
        const copy = this.deepClone(masterState);

        const hiddenNodesSet = new Set(overlay.hiddenNodeIds || []);
        const hiddenEdgesSet = new Set(overlay.hiddenEdgeIds || []);

        // 2. Process Nodes: Filter hidden and apply validated patches
        if (Array.isArray(copy.nodes)) {
            copy.nodes = copy.nodes.filter((node: any) => {
                if (!node || !node.id) return false;
                if (hiddenNodesSet.has(node.id)) return false;

                const rawPatch = overlay.modifiedNodes[node.id];
                if (rawPatch) {
                    const safePatch = this.sanitizeNodePatch(rawPatch);
                    if (safePatch) {
                        if (safePatch.label !== undefined) node.label = safePatch.label;
                        if (safePatch.description !== undefined) node.description = safePatch.description;
                        if (safePatch.status === 'approved') {
                            node.status = 'approved';
                        }
                    }
                }
                return true;
            });
        }

        // 3. Process Edges: Filter hidden + cascading hidden (connected to hidden nodes) and apply patches
        if (Array.isArray(copy.edges)) {
            copy.edges = copy.edges.filter((edge: any) => {
                if (!edge || !edge.id) return false;
                if (hiddenEdgesSet.has(edge.id)) return false;
                if (hiddenNodesSet.has(edge.from) || hiddenNodesSet.has(edge.to)) return false;

                const rawPatch = overlay.modifiedEdges[edge.id];
                if (rawPatch) {
                    const safePatch = this.sanitizeEdgePatch(rawPatch);
                    if (safePatch) {
                        if (safePatch.label !== undefined) edge.label = safePatch.label;
                        if (safePatch.description !== undefined) edge.description = safePatch.description;
                        if (safePatch.status === 'confirmed') {
                            edge.status = 'confirmed';
                        }
                    }
                }
                return true;
            });
        }

        // 4. Process Clusters: prune hidden nodes from nodeIds and update counts
        if (Array.isArray(copy.clusters)) {
            for (const cluster of copy.clusters) {
                if (cluster && Array.isArray(cluster.nodeIds)) {
                    cluster.nodeIds = cluster.nodeIds.filter((id: string) => !hiddenNodesSet.has(id));
                    cluster.count = cluster.nodeIds.length;
                }
            }
        }

        return copy;
    }
}
