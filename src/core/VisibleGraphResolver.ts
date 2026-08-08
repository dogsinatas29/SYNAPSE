import { Cluster, GraphSnapshot } from '../types/schema';
import { ClusterHierarchy } from './ClusterHierarchy';

export interface AggregateEdge {
  from: string;
  to: string;
  weight: number;
}

export interface VisibleGraph {
  visibleClusters: Cluster[];
  visibleEdges: AggregateEdge[];
}

function findVisibleRepresentative(
  clusterId: string | undefined,
  hierarchy: ClusterHierarchy,
  visibleSet: Set<string>
): string | null {
  if (!clusterId) return null;

  const path: string[] = [clusterId];
  const ancestors = hierarchy.getAncestors(clusterId);
  for (const a of ancestors) {
    path.push(a.id);
  }

  return path.find(id => visibleSet.has(id)) || null;
}

function computeVisibleClusterIds(
  hierarchy: ClusterHierarchy,
  expandedClusters: Set<string>
): Set<string> {
  const roots = hierarchy.getRoots();
  const visible = new Set<string>();
  for (const r of roots) {
    visible.add(r.id);
  }

  const queue = roots.map(r => r.id);
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (!expandedClusters.has(current)) continue;

    const children = hierarchy.getChildren(current);
    for (const child of children) {
      if (!visible.has(child.id)) {
        visible.add(child.id);
        queue.push(child.id);
      }
    }
  }

  return visible;
}

export function resolveVisibleGraph(
  rawGraph: GraphSnapshot,
  hierarchy: ClusterHierarchy,
  expandedClusters: Set<string>
): VisibleGraph {
  const visibleIds = computeVisibleClusterIds(hierarchy, expandedClusters);
  const visibleClusters: Cluster[] = [];
  for (const id of visibleIds) {
    const node = hierarchy.get(id);
    if (node) visibleClusters.push(node.cluster);
  }

  const nodeMap = new Map(rawGraph.nodes.map(n => [n.id, n]));
  const edgeMap = new Map<string, number>();

  for (const edge of rawGraph.edges) {
    const fromNode = edge.from ? nodeMap.get(edge.from) : undefined;
    const toNode = edge.to ? nodeMap.get(edge.to) : undefined;
    if (!fromNode || !toNode) continue;

    const fromRep = findVisibleRepresentative(fromNode.cluster_id, hierarchy, visibleIds);
    const toRep = findVisibleRepresentative(toNode.cluster_id, hierarchy, visibleIds);
    if (!fromRep || !toRep || fromRep === toRep) continue;

    const key = `${fromRep}→${toRep}`;
    edgeMap.set(key, (edgeMap.get(key) || 0) + (edge.weight || 1));
  }

  const visibleEdges: AggregateEdge[] = [];
  for (const [key, weight] of edgeMap) {
    const sep = key.indexOf('→');
    visibleEdges.push({ from: key.slice(0, sep), to: key.slice(sep + 1), weight });
  }

  const roots = visibleClusters.filter(c => !c.parent_id).map(c => c.id);
  
  // Depth analysis
  const depthCount: Record<string, number> = { roots: roots.length };
  for (const c of visibleClusters) {
    if (!c.parent_id) continue;
    const ancestors = hierarchy.getAncestors(c.id);
    const depthStr = `depth${ancestors.length}`;
    depthCount[depthStr] = (depthCount[depthStr] || 0) + 1;
  }

  console.log('[VISIBLE_ROOTS]', roots);
  console.log('[VISIBLE_DEPTH]', depthCount);

  return { visibleClusters, visibleEdges };
}
