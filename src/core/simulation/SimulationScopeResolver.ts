import { SimulationNode, SimulationEdge, SimulationCluster } from './SimulationSnapshot';

export type SimulationScopeType = 'PROJECT' | 'CLUSTER' | 'NODE';

export interface SimulationScope {
    type: SimulationScopeType;
    targetIds?: string[]; // If PROJECT, this is empty. If CLUSTER or NODE, contains target IDs.
}

export class SimulationScopeResolver {
    public static resolve(targetIds: string[] | undefined, targetType?: SimulationScopeType): SimulationScope {
        if (!targetIds || targetIds.length === 0) {
            return { type: 'PROJECT' };
        }
        
        // If explicitly provided, use it
        if (targetType) {
            return { type: targetType, targetIds };
        }

        // Auto-detect based on typical prefix conventions (if applicable)
        const sample = targetIds[0];
        if (sample.startsWith('cluster_') || sample.startsWith('folder_')) {
            return { type: 'CLUSTER', targetIds };
        }

        // Fallback to Node Scope
        return { type: 'NODE', targetIds };
    }

    public static filterNodes(nodes: SimulationNode[], scope: SimulationScope, clusterHierarchy: Map<string, SimulationCluster>): SimulationNode[] {
        if (scope.type === 'PROJECT') return nodes;

        if (scope.type === 'CLUSTER') {
            const validClusters = new Set<string>();
            // Add target clusters and all their descendants
            const addDescendants = (cid: string) => {
                validClusters.add(cid);
                for (const c of Array.from(clusterHierarchy.values())) {
                    if (c.parent_id === cid && !validClusters.has(c.id)) {
                        addDescendants(c.id);
                    }
                }
            };
            
            for (const id of scope.targetIds || []) {
                addDescendants(id);
            }

            return nodes.filter(n => validClusters.has(n.cluster_id));
        }

        if (scope.type === 'NODE') {
            const targetSet = new Set(scope.targetIds);
            return nodes.filter(n => targetSet.has(n.id));
        }

        return nodes;
    }

    public static filterEdges(edges: SimulationEdge[], validNodeIds: Set<string>): SimulationEdge[] {
        // Keep edges where AT LEAST ONE endpoint is in scope (to allow boundary edges to remain)
        return edges.filter(e => validNodeIds.has(e.from) || validNodeIds.has(e.to));
    }
}
