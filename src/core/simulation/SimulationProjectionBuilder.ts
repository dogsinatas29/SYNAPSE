import * as fs from 'fs';
import { SimulationSnapshot, SimulationNode, SimulationEdge, SimulationCluster, SimulationBoundary } from './SimulationSnapshot';
import { SimulationScopeResolver, SimulationScope } from './SimulationScopeResolver';
import { SimulationState } from './state/SimulationState';

export class SimulationProjectionBuilder {
    /**
     * Reads project_state.json using an index if available to prevent OOM.
     */
    public static async build(statePath: string, scope: SimulationScope): Promise<SimulationSnapshot> {
        const indexPath = statePath + '.idx'; // e.g. project_state.json.idx
        let nodes: SimulationNode[] = [];
        let edges: SimulationEdge[] = [];
        let clusters: SimulationCluster[] = [];
        let boundaries: SimulationBoundary[] = [];

        if (!fs.existsSync(indexPath)) {
            throw new Error(`[SimulationProjectionBuilder] REQUIRED: index.idx not found at ${indexPath}. Monolithic parsing is strictly forbidden to prevent OOM.`);
        }

        // Index Consumer Mode
        console.log(`[SimulationProjectionBuilder] Using index.idx at ${indexPath}`);
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
        
        if (index.nodes) nodes = await this.readSlice<SimulationNode>(statePath, index.nodes.start, index.nodes.end);
        if (index.edges) edges = await this.readSlice<SimulationEdge>(statePath, index.edges.start, index.edges.end);
        if (index.clusters) clusters = await this.readSlice<SimulationCluster>(statePath, index.clusters.start, index.clusters.end);
        if (index.boundaries) boundaries = await this.readSlice<SimulationBoundary>(statePath, index.boundaries.start, index.boundaries.end);

        // Convert to simulation objects
        let simNodes = nodes.map((n: any) => ({
            id: n.id,
            type: n.type || 'file',
            cluster_id: n.cluster_id || 'root',
            state: SimulationState.NORMAL,
            data: n.data
        } as SimulationNode));

        let simEdges = edges.map((e: any) => ({
            id: e.id || `${e.from}->${e.to}`,
            from: e.from,
            to: e.to,
            weight: e.weight || 1,
            type: e.type || 'depends_on',
            state: SimulationState.NORMAL
        } as SimulationEdge));

        let simClusters = clusters.map((c: any) => ({
            id: c.id,
            parent_id: c.parent_id || c.parentId,
            label: c.label || c.id,
            type: c.type || c.layer || 'folder',
            collapsed: c.collapsed
        } as SimulationCluster));
        
        let simBoundaries = boundaries.map((b: any) => ({
            id: b.id,
            type: b.type || 'logical',
            members: b.members || []
        } as SimulationBoundary));

        // Apply Scope Filter
        if (scope.type !== 'PROJECT') {
            const clusterMap = new Map(simClusters.map(c => [c.id, c]));
            simNodes = SimulationScopeResolver.filterNodes(simNodes, scope, clusterMap);
            
            const validNodeIds = new Set(simNodes.map(n => n.id));
            simEdges = SimulationScopeResolver.filterEdges(simEdges, validNodeIds);
            
            // For Phase 3: We could filter boundaries that have no intersection with current scope,
            // but reading all boundaries is lightweight and safer.
        }

        return new SimulationSnapshot(simNodes, simEdges, simClusters, simBoundaries).seal();
    }

    private static async readSlice<T>(filePath: string, start: number, end: number): Promise<T[]> {
        return new Promise((resolve, reject) => {
            const stream = fs.createReadStream(filePath, { start, end });
            let data = '';
            stream.on('data', chunk => data += chunk.toString('utf-8'));
            stream.on('end', () => {
                try {
                    let toParse = data.trim();
                    // Basic sanity check to ensure it's a valid JSON array or fragment
                    if (toParse.startsWith('[') && toParse.endsWith(']')) {
                        resolve(JSON.parse(toParse));
                    } else if (toParse.endsWith(',')) {
                        resolve(JSON.parse(`[${toParse.slice(0, -1)}]`));
                    } else {
                        resolve(JSON.parse(`[${toParse}]`));
                    }
                } catch (e: any) {
                    reject(new Error(`Failed to parse slice: ${e.message}`));
                }
            });
            stream.on('error', reject);
        });
    }
}
