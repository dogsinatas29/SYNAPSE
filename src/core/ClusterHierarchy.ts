import { Cluster } from '../types/schema';

export interface HierarchyNode {
  id: string;
  cluster: Cluster;
  parentId: string | null;
  children: string[];
  depth: number;
}

export class ClusterHierarchy {
  private nodeMap: Map<string, HierarchyNode>;
  private rootIds: string[];

  constructor(clusters: Cluster[]) {
    this.nodeMap = new Map();
    this.rootIds = [];

    if (!Array.isArray(clusters)) return;

    for (const c of clusters) {
      if (!c || !c.id) continue;
      this.nodeMap.set(c.id, {
        id: c.id,
        cluster: c,
        parentId: c.parent_id || null,
        children: [],
        depth: 0
      });
    }

    for (const [, node] of this.nodeMap) {
      if (node.parentId && this.nodeMap.has(node.parentId)) {
        this.nodeMap.get(node.parentId)!.children.push(node.id);
      }
    }

    for (const [id, node] of this.nodeMap) {
      if (!node.parentId || !this.nodeMap.has(node.parentId)) {
        this.rootIds.push(id);
      }
    }

    this.assignDepth(this.rootIds, 0);
  }

  private assignDepth(ids: string[], depth: number) {
    for (const id of ids) {
      const node = this.nodeMap.get(id);
      if (!node) continue;
      node.depth = depth;
      if (node.children.length > 0) {
        this.assignDepth(node.children, depth + 1);
      }
    }
  }

  get(id: string): HierarchyNode | null {
    return this.nodeMap.get(id) || null;
  }

  getChildren(id: string): HierarchyNode[] {
    const node = this.nodeMap.get(id);
    if (!node) return [];
    return node.children.map(cid => this.nodeMap.get(cid)).filter(Boolean) as HierarchyNode[];
  }

  getParent(id: string): HierarchyNode | null {
    const node = this.nodeMap.get(id);
    if (!node || !node.parentId) return null;
    return this.nodeMap.get(node.parentId) || null;
  }

  getDepth(id: string): number {
    const node = this.nodeMap.get(id);
    return node ? node.depth : -1;
  }

  getRoots(): HierarchyNode[] {
    return this.rootIds.map(id => this.nodeMap.get(id)).filter(Boolean) as HierarchyNode[];
  }

  getAllNodes(): HierarchyNode[] {
    return Array.from(this.nodeMap.values());
  }

  getAncestors(id: string): HierarchyNode[] {
    const ancestors: HierarchyNode[] = [];
    let current = this.nodeMap.get(id);
    while (current && current.parentId) {
      const parent = this.nodeMap.get(current.parentId);
      if (parent) {
        ancestors.push(parent);
        current = parent;
      } else {
        break;
      }
    }
    return ancestors;
  }

  getDescendants(id: string): HierarchyNode[] {
    const result: HierarchyNode[] = [];
    const node = this.nodeMap.get(id);
    if (!node) return result;
    const stack = [node];
    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const cid of current.children) {
        const child = this.nodeMap.get(cid);
        if (child) {
          result.push(child);
          stack.push(child);
        }
      }
    }
    return result;
  }

  getSiblings(id: string): HierarchyNode[] {
    const node = this.nodeMap.get(id);
    if (!node || !node.parentId) return [];
    const parent = this.nodeMap.get(node.parentId);
    if (!parent) return [];
    return parent.children
      .filter(cid => cid !== id)
      .map(cid => this.nodeMap.get(cid))
      .filter(Boolean) as HierarchyNode[];
  }

  getLeafClusterIds(): string[] {
    const leaves: string[] = [];
    for (const [id, node] of this.nodeMap) {
      if (node.children.length === 0) {
        leaves.push(id);
      }
    }
    return leaves;
  }

  getProjectRoots(): HierarchyNode[] {
    return this.rootIds
      .map(id => this.nodeMap.get(id))
      .filter(n => n && n.cluster.type !== 'system') as HierarchyNode[];
  }
}
