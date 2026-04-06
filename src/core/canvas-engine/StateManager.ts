import { Intent } from './Intent';
import { Node, Edge, graphModel, GraphModel } from '../GraphModel';

/**
 * 🧬 SYNAPSE State Manager (v0.3.10)
 * 
 * 유일한 Mutation Point. RuleEngine의 승인을 받은 Intent를 실제 상태 변이로 전환한다.
 * 모든 연산은 Deterministic(결정론적)이어야 하며, 기존 GraphModel에 반영한다.
 */

export interface CanvasState {
  nodes: Record<string, Node>;
  edges: Record<string, Edge>;
  clusters: any[];
}

export class StateManager {
  /**
   * 🧪 Intent를 실제 상태 변이(Mutation)로 변환
   */
  public apply(intent: Intent): CanvasState {
    switch (intent.type) {
      case 'ADD_NODE':
        return this.mutateAddNode(intent.payload);
      case 'CONNECT_EDGE':
        return this.mutateConnectEdge(intent.payload);
      case 'MOVE_NODE':
        return this.mutateMoveNode(intent.payload);
      case 'DELETE_NODE':
        return this.mutateDeleteNode(intent.payload);
      case 'DELETE_EDGE':
        return this.mutateDeleteEdge(intent.payload);
      case 'UPDATE_EDGE':
        return this.mutateUpdateEdge(intent.payload);
      case 'UPDATE_NODE':
        return this.mutateUpdateNode(intent.payload);
      case 'ADD_CLUSTER':
        return this.mutateAddCluster(intent.payload);
      default:
        return this.getSnapshot();
    }
  }

  private mutateAddNode(payload: any): CanvasState {
    const newNode: Node = {
      id: payload.id,
      filePath: payload.filePath || '',
      type: payload.type || 'FILE',
      label: payload.label || payload.id,
      position: payload.position || { x: Math.random() * 500, y: Math.random() * 500 },
      data: payload.data || { label: payload.label || payload.id },
      degree: 0,
      ...payload
    };

    graphModel.addNode(newNode);
    return this.getSnapshot();
  }

  private mutateConnectEdge(payload: any): CanvasState {
    const newEdge: Edge = {
      from: payload.from,
      to: payload.to,
      type: payload.type || 'REFERENCE',
      weight: payload.weight || GraphModel.WEIGHT_UTILITY
    };

    graphModel.addEdge(newEdge);
    return this.getSnapshot();
  }

  private mutateMoveNode(payload: any): CanvasState {
    const nodes = graphModel.createSnapshot().nodes;
    const node = nodes.find(n => n.id === payload.nodeId);
    if (node) {
      node.position = { x: payload.target.x, y: payload.target.y };
    }
    return this.getSnapshot();
  }

  private mutateDeleteNode(payload: any): CanvasState {
    graphModel.deleteNode(payload.id);
    return this.getSnapshot();
  }

  private mutateDeleteEdge(payload: any): CanvasState {
    graphModel.deleteEdge(payload.from, payload.to);
    return this.getSnapshot();
  }

  private mutateUpdateEdge(payload: any): CanvasState {
    graphModel.updateEdge(payload.from, payload.to, payload.updates);
    return this.getSnapshot();
  }

  private mutateUpdateNode(payload: any): CanvasState {
    graphModel.updateNode(payload.id, payload.updates);
    return this.getSnapshot();
  }

  private mutateAddCluster(payload: any): CanvasState {
    graphModel.addCluster({
      id: payload.id,
      label: payload.label,
      type: payload.type || 'folder',
      collapsed: payload.collapsed,
      data: payload.data
    });
    return this.getSnapshot();
  }

    public getSnapshot(): CanvasState {
        const snap = graphModel.createSnapshot();
        const nodes: Record<string, Node> = {};
        const edges: Record<string, Edge> = {};
        
        snap.nodes.forEach(n => {
            // [v0.3.10] UI Normalization: ensure position and data exist
            const uiNode = {
                ...n,
                position: n.position || { x: Math.random() * 500, y: Math.random() * 500 },
                data: n.data || { label: n.label || n.id, file: n.filePath }
            };
            nodes[n.id] = uiNode as any;
        });
        snap.edges.forEach(e => {
            const id = e.id || `${e.from}->${e.to}`;
            edges[id] = e;
        });

        return { 
            nodes, 
            edges,
            clusters: snap.clusters || []
        };
    }

    public load(state: any) {
        graphModel.loadFrom(state);
    }
}
