import { Node, Edge } from '../GraphModel';

/**
 * 🚀 SYNAPSE Intent Definition (v0.3.10)
 * 
 * 모든 상태 변화의 유일한 시발점.
 * EventHandler 또는 DataPipeline에서 발행된다.
 */

export type IntentType = 'ADD_NODE' | 'CONNECT_EDGE' | 'MOVE_NODE' | 'DELETE_NODE' | 'DELETE_EDGE' | 'UPDATE_EDGE' | 'UPDATE_NODE' | 'ADD_CLUSTER';

export interface BaseIntent {
  readonly type: IntentType;
  readonly timestamp: number;
}

export interface AddNodeIntent extends BaseIntent {
  readonly type: 'ADD_NODE';
  readonly payload: Partial<Node> & { id: string };
}

export interface ConnectEdgeIntent extends BaseIntent {
  readonly type: 'CONNECT_EDGE';
  readonly payload: { from: string; to: string; type?: string };
}

export interface MoveNodeIntent extends BaseIntent {
  readonly type: 'MOVE_NODE';
  readonly payload: { nodeId: string; target: { x: number; y: number } };
}

export interface DeleteNodeIntent extends BaseIntent {
  readonly type: 'DELETE_NODE';
  readonly payload: { id: string };
}

export interface DeleteEdgeIntent extends BaseIntent {
  readonly type: 'DELETE_EDGE';
  readonly payload: { from: string; to: string };
}

export interface UpdateEdgeIntent extends BaseIntent {
  readonly type: 'UPDATE_EDGE';
  readonly payload: { from: string; to: string; updates: any };
}

export interface UpdateNodeIntent extends BaseIntent {
  readonly type: 'UPDATE_NODE';
  readonly payload: { id: string; updates: any };
}

export interface AddClusterIntent extends BaseIntent {
  readonly type: 'ADD_CLUSTER';
  readonly payload: { id: string; label: string; type?: string; collapsed?: boolean; data?: any };
}

export type Intent = AddNodeIntent | ConnectEdgeIntent | MoveNodeIntent | DeleteNodeIntent | DeleteEdgeIntent | UpdateEdgeIntent | UpdateNodeIntent | AddClusterIntent;

export function createIntent<T extends Intent>(type: T['type'], payload: T['payload']): T {
  return {
    type,
    payload,
    timestamp: Date.now()
  } as T;
}
