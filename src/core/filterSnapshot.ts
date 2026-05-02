import { GraphSnapshot } from '../types/schema';
import { RuleEngine } from './RuleEngine';

/**
 * [v0.3.23] Filter a snapshot based on the current blacklist.
 * Ensures that if a node is removed, all its edges and references are also removed.
 */
export function filterSnapshot(snapshot: GraphSnapshot): GraphSnapshot {
  const ruleEngine = RuleEngine.getInstance();

  // 1. Filter Nodes
  const nodes = snapshot.nodes.filter(n => {
    const pathToCheck = (n as any).filePath || n.data?.file || n.id;
    return !ruleEngine.shouldIgnoreFile(pathToCheck);
  });

  // 2. Create a set of valid Node IDs for O(1) lookup
  const nodeIds = new Set(nodes.map(n => n.id));

  // 3. Filter Edges (both from and to must exist)
  const edges = snapshot.edges.filter(e =>
    nodeIds.has(e.from) && nodeIds.has(e.to)
  );

  // 4. Filter Clusters (at least one node in the cluster must still exist)
  const clusters = (snapshot.clusters || []).filter(c => {
    const members = (c as any).children || (c as any).nodeIds || [];
    return members.some((id: string) => nodeIds.has(id));
  }).map(c => {
    const members = (c as any).children || (c as any).nodeIds || [];
    const filteredMembers = members.filter((id: string) => nodeIds.has(id));
    
    return {
      ...c,
      [(c as any).children ? 'children' : 'nodeIds']: filteredMembers
    };
  });

  // 5. Filter Cluster Flows (if any)
  const cluster_flows = (snapshot as any).cluster_flows?.filter((flow: any) =>
    nodeIds.has(flow.from) && nodeIds.has(flow.to)
  ) ?? [];

  return {
    ...snapshot,
    nodes,
    edges,
    clusters: clusters as any[],
    cluster_flows
  } as GraphSnapshot;
}
