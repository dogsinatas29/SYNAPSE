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
  type: NodeType | string;
  label?: string;
  name?: string;  // [v0.3.11] Unified label sync
  text?: string;  // [v0.3.11] Unified label sync
  degree: number; 
  position?: { x: number; y: number };
  status?: string;
  cluster_id?: string;
  layer?: string;  // [v0.3.11] Explicit layer tag ('ai' | 'user')
  data?: any;
  intelligence?: any;
  visual?: any;
}

export interface Edge {
  id?: string;
  from: string;
  to: string;
  type: EdgeType | string;
  weight: number;
  status?: string;
  is_approved?: boolean;
  data?: any;
  visual?: any;
}

export interface Cluster {
  id: string;
  label: string;
  type: string;
  position?: { x: number; y: number }; // [v0.3.11] Added position for relative coordinate support
  collapsed?: boolean;
  data?: any;
}

export interface GraphSnapshot {
  nodes: Node[];
  edges: Edge[];
  clusters: Cluster[];
  timestamp: number;
}

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
  
  // Weights (Constants from Iron Grid Refined)
  public static readonly WEIGHT_DIRECT_INCLUDE = 1.0;
  public static readonly WEIGHT_INTERNAL = 0.7;
  public static readonly WEIGHT_UTILITY = 0.2;
  public static readonly WEIGHT_TRANSITIVE = 0.1;

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
        return { 
          ...node, 
          label: `(HUB) ${node.label}`,
          position: node.position 
        };
      }
      return node;
    });
  }

  public createSnapshot(): GraphSnapshot {
    return {
      nodes: [...this.nodes.values()],
      edges: [...this.edges],
      clusters: [...this.clusters],
      timestamp: Date.now()
    };
  }

  public reset() {
    this.nodes.clear();
    this.edges = [];
    this.clusters = [];
  }

  /**
   * 스냅샷으로부터 그래프 상태 복구
   */
  public restoreSnapshot(snapshot: GraphSnapshot) {
    this.reset();
    for (const node of snapshot.nodes) {
      this.nodes.set(node.id, node);
    }
    for (const edge of snapshot.edges) {
      this.edges.push(edge);
    }
    if (snapshot.clusters) {
      this.clusters = [...snapshot.clusters];
    }
  }

  public loadFrom(state: any) {
    this.reset();
    
    // [v0.3.11] 데이터 규격 호환성 강화: 배열(Array)과 객체(Map) 형태 모두 지원
    if (state.nodes) {
      if (Array.isArray(state.nodes)) {
        state.nodes.forEach((n: any) => this.nodes.set(n.id, n));
      } else {
        Object.values(state.nodes).forEach((n: any) => this.nodes.set(n.id, n));
      }
    }

    if (state.edges) {
      if (Array.isArray(state.edges)) {
        this.edges = [...state.edges];
      } else {
        this.edges = Object.values(state.edges);
      }
    }
    
    if (state.clusters) {
      this.clusters = Array.isArray(state.clusters) ? [...state.clusters] : Object.values(state.clusters);
    }

    // [v0.3.11] 보정 로직: 필수 시스템 클러스터가 누락된 경우 자동 추가
    const requiredClusters = [
      { id: 'cluster_root', label: '🏠 Project Root', type: 'system', position: { x: 0, y: 0 } },
      { id: 'cluster_ghosts', label: '👻 External Ghosts', type: 'system', position: { x: 800, y: 0 } },
      { id: 'cluster_reserved', label: '📦 Reserved Nodes', type: 'system', position: { x: 0, y: 600 } },
      { id: 'doc_shelf', label: '📚 Documentation Shelf', type: 'system', collapsed: true, position: { x: 800, y: 600 } }
    ];

    requiredClusters.forEach(required => {
      const exists = this.clusters.some(c => c.id === required.id);
      if (!exists) {
        console.warn(`[SYNAPSE] Restoring missing system cluster: ${required.id}`);
        this.clusters.push(required);
      }
    });
  }
}

export const graphModel = new GraphModel();
