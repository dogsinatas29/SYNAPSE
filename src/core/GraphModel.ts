/**
 * 📊 SYNAPSE Graph Model (v0.3.23)
 * 
 * L2 Runtime Safety Hardening Applied.
 */

import { RuleEngine } from './RuleEngine';
import { filterSnapshot } from './filterSnapshot';
import { Node, Edge, Cluster, GraphSnapshot, ClusterFlow, NodeType as SNodeType, EdgeType as SEdgeType } from '../types/schema';

export { Node, Edge, Cluster, GraphSnapshot, ClusterFlow };

// [v0.3.23] Runtime Value Constants for Types (Casted to any for extreme flexibility)
export const NodeType: any = {
  SOURCE: 'source',
  CLUSTER: 'cluster',
  DOCUMENTATION: 'documentation',
  FILE: 'source',
  SYMBOL: 'source',
  TEST: 'test',
  CONFIG: 'config',
  HISTORY: 'history',
  EXTERNAL: 'external',
  EVENT: 'event'
};

export const EdgeType: any = {
  DEPENDENCY: 'dependency',
  DATA_FLOW: 'data_flow',
  EVENT: 'event',
  CONDITIONAL: 'conditional',
  ORIGIN: 'origin',
  REFERENCE: 'reference',
  BROKEN_FRACTURE: 'broken_fracture',
  INCLUDE: 'include',
  CALL: 'call',
  DB_QUERY: 'db_query',
  LOOP_BACK: 'loop_back',
  STATIC: 'static'
};

declare const requestAnimationFrame: any;

export class GraphModel {
  private nodes: Map<string, Node> = new Map();
  private edges: Edge[] = [];
  private clusters: Cluster[] = [];
  private projectRoot: string = '';
  
  public setProjectRoot(root: string) {
    this.projectRoot = root;
  }

  public getProjectRoot(): string {
    return this.projectRoot;
  }

  public nodeCount(): number {
    return this.nodes.size;
  }
  
  public static readonly WEIGHT_DIRECT_INCLUDE = 1.0;
  public static readonly WEIGHT_INTERNAL = 0.7;
  public static readonly WEIGHT_UTILITY = 0.2;
  public static readonly WEIGHT_TRANSITIVE = 0.1;

  public getFilteredEdges(threshold: number): Edge[] {
    return this.edges.filter(edge => (edge.weight || 0) >= threshold);
  }

  public getCollapsedNodes(threshold: number): Node[] {
    return Array.from(this.nodes.values()).map(node => {
      const n = node as any;
      if (n.degree > threshold) {
        return { 
          ...node, 
          label: `(HUB) ${n.data?.label || n.id}`,
          position: n.position 
        } as any;
      }
      return node;
    });
  }

  public getClusterFlows(): ClusterFlow[] {
    const flowMap = new Map<string, number>();
    
    for (const edge of this.edges) {
      const srcNode = this.nodes.get(edge.from || '');
      const tgtNode = this.nodes.get(edge.to || '');
      
      if (srcNode && tgtNode) {
        const srcCluster = srcNode.cluster_id || 'root';
        const tgtCluster = tgtNode.cluster_id || 'root';
        
        if (srcCluster !== tgtCluster) {
          const key = `${srcCluster}->${tgtCluster}`;
          flowMap.set(key, (flowMap.get(key) || 0) + 1);
        }
      }
    }
    
    return Array.from(flowMap.entries()).map(([key, count]) => {
      const [from, to] = key.split('->');
      return { from, to, count };
    });
  }

  public createSnapshot(): GraphSnapshot {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges.slice(),
      clusters: this.clusters.slice(),
      cluster_flows: this.getClusterFlows(),
      timestamp: Date.now()
    };
  }

  public reset() {
    this.nodes.clear();
    this.edges = [];
    this.clusters = [];
  }

  public addNode(node: Node) {
    const ruleEngine = RuleEngine.getInstance();
    const pathToCheck = node.filePath || (node.data as any)?.file || node.id;
    
    if (ruleEngine.shouldIgnoreFile(pathToCheck)) {
      return;
    }
    this.nodes.set(node.id, node);
  }

  public applyBlacklist() {
    const ruleEngine = RuleEngine.getInstance();
    const affectedNodes: Node[] = [];

    for (const node of this.nodes.values()) {
      const pathToCheck = node.filePath || (node.data as any)?.file || node.id;
      if (ruleEngine.shouldIgnoreFile(pathToCheck)) {
        affectedNodes.push(node);
      }
    }

    if (affectedNodes.length === 0) return;

    const total = this.nodes.size;
    const ratio = affectedNodes.length / total;

    if (total < 1000 || ratio > 0.2) {
      this.rebuildWithBlacklist();
    } else {
      this.purgeIncremental(affectedNodes);
    }
  }

  private rebuildWithBlacklist() {
    const snapshot = this.createSnapshot();
    const filtered = filterSnapshot(snapshot);
    this.restoreSnapshot(filtered);
  }

  private purgeIncremental(nodesToRemove: Node[], chunkSize = 200) {
    let index = 0;
    const ruleEngine = RuleEngine.getInstance();
    const startTime = Date.now();

    const process = () => {
      const frameStart = Date.now();
      const end = Math.min(index + chunkSize, nodesToRemove.length);
      const removedIds = new Set<string>();

      for (; index < end; index++) {
        const node = nodesToRemove[index];
        const pathToCheck = node.filePath || (node.data as any)?.file || node.id;
        
        if (ruleEngine.shouldIgnoreFile(pathToCheck)) {
          this.nodes.delete(node.id);
          removedIds.add(node.id);
        }
        
        if (Date.now() - frameStart > 10) break; 
      }

      if (removedIds.size > 0) {
        this.edges = this.edges.filter(e => !removedIds.has(e.from || '') && !removedIds.has(e.to || ''));
      }

      if (index < nodesToRemove.length) {
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(process);
        } else {
          if (typeof setImmediate !== 'undefined') {
            setImmediate(process);
          } else {
            setTimeout(process, 1);
          }
        }
      } else {
        console.log(`[SYNAPSE] Incremental Purge completed in ${Date.now() - startTime}ms.`);
        this.finalizeGraph();
      }
    };

    process();
  }

  private finalizeGraph() {
    const flows = this.getClusterFlows();
    console.log(`[SYNAPSE] Graph finalized with ${this.nodes.size} nodes and ${flows.length} flows.`);
  }

  public restoreSnapshot(snapshot: GraphSnapshot) {
    this.reset();
    
    for (const node of snapshot.nodes) {
      this.nodes.set(node.id, node);
    }
    
    for (const edge of snapshot.edges) {
      this.edges.push(edge);
    }

    if (snapshot.clusters) {
      this.clusters = snapshot.clusters.slice();
    }
    
    this.finalizeGraph();
    console.log(`[SYNAPSE] Graph restored: ${this.nodes.size} nodes, ${this.edges.length} edges.`);
  }

  public loadFrom(state: any) {
    this.reset();
    
    if (state.nodes) {
      if (Array.isArray(state.nodes)) {
        state.nodes.forEach((n: any) => this.nodes.set(n.id, n));
      } else {
        Object.values(state.nodes).forEach((n: any) => this.nodes.set(n.id, n));
      }
    }

    if (state.edges) {
      if (Array.isArray(state.edges)) {
        this.edges = state.edges.slice();
      } else {
        this.edges = Object.values(state.edges);
      }
    }
    
    if (state.clusters) {
      this.clusters = Array.isArray(state.clusters) ? state.clusters.slice() : Object.values(state.clusters);
    }

    const requiredClusters = [
      { id: 'cluster_ghosts', label: '🌐 External Dependencies', type: 'system', position: { x: 800, y: 0 }, data: { layer: 'external', continent: 'external', subcontinent: 'external' } },
      { id: 'sys_cluster_reserved', label: 'Reserved Cluster', type: 'system', position: { x: 0, y: 600 } },
      { id: 'sys_cluster_buffer', label: '🛡️ Buffer Cluster', type: 'system', position: { x: -400, y: 600 } },
      { id: 'doc_shelf', label: '📚 Documentation Shelf', type: 'system', collapsed: true, position: { x: 800, y: 600 } }
    ];

    requiredClusters.forEach(required => {
      const existingIdx = this.clusters.findIndex(c => c.id === required.id);
      if (existingIdx === -1) {
        this.clusters.push({ ...required, children: [] } as any);
      } else {
        this.clusters[existingIdx] = { 
          ...this.clusters[existingIdx], 
          label: required.label, 
          type: required.type,
          data: { ...(this.clusters[existingIdx] as any).data, ...(required as any).data }
        };
      }
    });
  }
}

export const graphModel = new GraphModel();
