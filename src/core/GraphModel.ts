/**
 * 📊 SYNAPSE Graph Model (v0.3.1)
 * 
 * "Iron Grid Refined" 전략에 따라 엣지 가중치와 필터링 기능을 포함하며,
 * 불변 스냅샷 기반의 Directed Graph 모델링을 제공한다.
 */

export enum NodeType {
  FILE = 'file',
  MODULE = 'module',
  SYMBOL = 'symbol',
  API = 'api',
  DOCUMENTATION = 'documentation',
  SOURCE = 'source',
  EXTERNAL = 'external'
}

export enum EdgeType {
  INCLUDE = 'include',
  CALL = 'call',
  REFERENCE = 'reference',
  STATIC = 'static'
}

export interface Node {
  id: string;
  filePath: string;
  type: NodeType;
  label?: string;
  degree: number; // For Hub Collapse logic
}

export interface Edge {
  from: string;
  to: string;
  type: EdgeType;
  weight: number; // 0.0 to 1.0 (Critical for rendering filtering)
}

export interface GraphSnapshot {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
}

export class GraphModel {
  private nodes: Map<string, Node> = new Map();
  private edges: Edge[] = [];
  
  // Weights (Constants from Iron Grid Refined)
  public static readonly WEIGHT_DIRECT_INCLUDE = 1.0;
  public static readonly WEIGHT_INTERNAL = 0.7;
  public static readonly WEIGHT_UTILITY = 0.2;
  public static readonly WEIGHT_TRANSITIVE = 0.1;

  public addNode(node: Node) {
    if (this.nodes.has(node.id)) return;
    this.nodes.set(node.id, node);
  }

  public addEdge(edge: Edge) {
    // Basic deduplication
    const exists = this.edges.some(e => e.from === edge.from && e.to === edge.to && e.type === edge.type);
    if (!exists) {
      this.edges.push(edge);
      this.updateDegrees(edge);
    }
  }

  private updateDegrees(edge: Edge) {
    const fromNode = this.nodes.get(edge.from);
    const toNode = this.nodes.get(edge.to);
    if (fromNode) fromNode.degree++;
    if (toNode) toNode.degree++;
  }

  /**
   * 렌더링을 위한 엣지 필터링 (Iron Grid Refined: 1번 전략)
   */
  public getFilteredEdges(threshold: number): Edge[] {
    return this.edges.filter(edge => edge.weight >= threshold);
  }

  /**
   * 허브 노드 축소 (Iron Grid Refined: 3번 전략)
   */
  public getCollapsedNodes(threshold: number): Node[] {
    return Array.from(this.nodes.values()).map(node => {
      if (node.degree > threshold) {
        // [TODO] Implement collapse logic (e.g. replacing with a summary icon)
        return { ...node, label: `(HUB) ${node.label}` };
      }
      return node;
    });
  }

  public createSnapshot(): GraphSnapshot {
    return {
      nodes: [...this.nodes.values()],
      edges: [...this.edges],
      timestamp: Date.now()
    };
  }

  public reset() {
    this.nodes.clear();
    this.edges = [];
  }

  /**
   * 스냅샷으로부터 그래프 상태 복구 (Phase 2 지원)
   */
  public restoreSnapshot(snapshot: GraphSnapshot) {
    this.reset();
    for (const node of snapshot.nodes) {
      this.addNode(node);
    }
    for (const edge of snapshot.edges) {
      this.addEdge(edge);
    }
  }
}

export const graphModel = new GraphModel();
