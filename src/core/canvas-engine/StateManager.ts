import { Intent, createIntent } from './Intent';
import { Node, Edge, Cluster, graphModel, GraphModel, GraphSnapshot } from '../GraphModel';
import { commitManager } from '../transaction/CommitManager';
import { projectionLayer, ProjectionResolution } from '../projection/ProjectionLayer';
import { Logger } from '../../utils/Logger';

/**
 * 🧬 SYNAPSE State Manager (v0.3.11)
 * 
 * "Core Freeze" 원칙에 따라 실시간 Core 변경을 전면 중단하며,
 * UI 상의 임시 데이터를 "Buffer"로 관리한다.
 * "CONFIRM_COMMIT" 인텐트를 통해서만 Core 그래프를 확정(Update)한다.
 */

export interface CanvasState {
  nodes: Record<string, Node>;
  edges: Record<string, Edge>;
  clusters: any[];
}

export class StateManager {
  private bufferNodes: Map<string, Node> = new Map();
  private bufferEdges: Map<string, Edge> = new Map();
  private bufferClusters: Cluster[] = [];
  private deletedNodesBuffer: Map<string, Node> = new Map(); // [v0.3.11] 삭제 대기 버퍼
  private activeScopeId: string | null = null; // [v0.3.11] Scope Isolation

  /**
   * 🧪 Intent를 실제 상태 변이(Mutation)로 변환 (v0.3.11: Buffer 중심)
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
      case 'CONFIRM_COMMIT': // [v0.3.11] Commit Contract Transaction
        return this.commitTransaction(intent.payload);
      case 'GROUP':
        return this.mutateGroupCluster(intent.payload);
      case 'UNGROUP':
        return this.mutateUngroup(intent.payload);
      case 'ENTER_SCOPE': // [v0.3.11] Overlay Mode Enter
        this.activeScopeId = intent.payload.nodeId;
        return this.getSnapshot();
      case 'EXIT_SCOPE': // [v0.3.11] Overlay Mode Exit
        this.activeScopeId = null;
        return this.getSnapshot();
      default:
        return this.getSnapshot();
    }
  }

  private mutateGroupCluster(payload: { nodeIds: string[], label: string }): CanvasState {
    const clusterId = `cluster_${Date.now()}`;
    const targetNodes: Node[] = [];
    
    payload.nodeIds.forEach(id => {
       const node = this.bufferNodes.get(id) || graphModel.createSnapshot().nodes.find(n => n.id === id);
       if (node) targetNodes.push(node);
    });

    if (targetNodes.length === 0) return this.getSnapshot();

    // Calculate cluster center (average of nodes)
    const avgX = targetNodes.reduce((sum, n) => sum + (n.position?.x || 0), 0) / targetNodes.length;
    const avgY = targetNodes.reduce((sum, n) => sum + (n.position?.y || 0), 0) / targetNodes.length;

    const newCluster: any = {
        id: clusterId,
        label: payload.label,
        type: 'folder',
        position: { x: avgX, y: avgY },
        data: { layer: 'user' }
    };
    
    this.bufferClusters.push(newCluster);
    
    // Update target nodes (Move to Relative Coordinate System)
    targetNodes.forEach(node => {
        const buffered = this.bufferNodes.get(node.id) || { ...node };
        buffered.cluster_id = clusterId;
        if (buffered.position) {
            buffered.position = {
                x: buffered.position.x - avgX,
                y: buffered.position.y - avgY
            };
        }
        if (buffered.data) buffered.data.cluster_id = clusterId;
        this.bufferNodes.set(node.id, buffered);
    });

    return this.getSnapshot();
  }


  private mutateAddNode(payload: any): CanvasState {
    const fileName = this.extractBasename(payload.filePath);
    const finalLabel = payload.label || fileName || payload.id;
    
    const newNode: Node = {
      ...payload,
      id: payload.id,
      filePath: payload.filePath || '',
      type: payload.type || 'file',
      label: finalLabel,
      layer: 'user', // [v0.3.11] Root level tagging
      position: payload.position || { x: Math.random() * 500, y: Math.random() * 500 },
      degree: 0,
      status: 'pending', // [v0.3.11] Draft State
      data: { 
        ...payload.data, 
        label: finalLabel,
        layer: 'user' 
      }
    };
    this.bufferNodes.set(newNode.id, newNode);
    return this.getSnapshot();
  }

  private mutateAddCluster(payload: any): CanvasState {
    const existingIdx = this.bufferClusters.findIndex(c => c.id === payload.id);
    const newCluster = {
      ...payload,
      id: payload.id,
      label: payload.label || payload.id,
      type: payload.type || 'folder',
      data: { ...payload.data, layer: 'user' }
    };

    if (existingIdx >= 0) {
      this.bufferClusters[existingIdx] = newCluster;
    } else {
      this.bufferClusters.push(newCluster);
    }
    return this.getSnapshot();
  }

  private mutateConnectEdge(payload: any): CanvasState {
    const id = payload.id || `${payload.from}->${payload.to}`;
    const newEdge: Edge = {
      id,
      from: payload.from,
      to: payload.to,
      type: payload.type || 'REFERENCE',
      weight: payload.weight || 1,
      status: 'pending', // [v0.3.11] Draft State
      ...payload,
      data: { ...payload.data, layer: 'user' }
    };

    this.bufferEdges.set(id, newEdge);
    return this.getSnapshot();
  }

  private mutateMoveNode(payload: any): CanvasState {
    const node = this.bufferNodes.get(payload.nodeId) || this.deletedNodesBuffer.get(payload.nodeId);
    if (node) {
      node.position = { x: payload.target.x, y: payload.target.y };
    }
    return this.getSnapshot();
  }

  private mutateDeleteNode(payload: { id: string, isPhysical?: boolean }): CanvasState {
    const coreSnap = graphModel.createSnapshot();
    const target = coreSnap.nodes.find(n => n.id === payload.id) || this.bufferNodes.get(payload.id);
    
    if (target) {
        const deletionReady = { 
            ...target, 
            data: { ...target.data, __isPhysicalDelete: !!payload.isPhysical } 
        };

        this.deletedNodesBuffer.set(target.id, deletionReady);
        this.bufferNodes.delete(target.id);
    }
    return this.getSnapshot();
  }

  private extractBasename(path: string): string {
    if (!path) return "";
    const parts = path.split(/[\\/]/);
    return parts[parts.length - 1] || "";
  }

  private mutateDeleteEdge(payload: any): CanvasState {
    this.bufferEdges.delete(`${payload.from}->${payload.to}`);
    return this.getSnapshot();
  }

  private mutateUngroup(payload: any): CanvasState {
    const { nodeIds } = payload;
    const coreNodes = graphModel.createSnapshot().nodes;
    
    for (const id of nodeIds) {
      let node = this.bufferNodes.get(id);
      if (!node) {
          const coreNode = coreNodes.find(n => n.id === id);
          if (coreNode) {
              node = { ...coreNode };
              this.bufferNodes.set(id, node);
          }
      }

      if (node && node.cluster_id) {
        // [v0.3.11 Fix] Relative to Absolute Conversion
        const parent: any = this.bufferClusters.find(c => c.id === node.cluster_id) || 
                          graphModel.createSnapshot().clusters.find(c => c.id === node!.cluster_id);
                          
        if (parent && parent.position && node.position) {
            node.position = {
                x: parent.position.x + node.position.x,
                y: parent.position.y + node.position.y
            };
        }
        // [v0.3.11 FIX] '' 빈 문자열로 명시: undefined는 저장 시 null 처리되어 재로드 시 cluster_root로 복원됨
        node.cluster_id = '';
        if (node.data) {
            node.data.cluster_id = '';
            node.data.ungrouped = true; // 언그룹 상태임을 명시적으로 마킹
        }
        this.bufferNodes.set(id, node); // 버퍼에 명시적으로 재저장
      }
    }
    return this.getSnapshot();
  }

  private mutateUpdateEdge(payload: any): CanvasState {
    const id = payload.id || `${payload.from}->${payload.to}`;
    const edge = this.bufferEdges.get(payload.id) || this.bufferEdges.get(id);
    
    if (edge) {
      if (payload.updates) {
        Object.assign(edge, payload.updates);
        if (payload.updates.data) {
          edge.data = { ...edge.data, ...payload.updates.data };
        }
      }
    }
    return this.getSnapshot();
  }

  private mutateUpdateNode(payload: any): CanvasState {
    let node = this.bufferNodes.get(payload.id);
    
    if (!node) {
        // Promote core node to buffer to allow manual modification (Core Freeze Compliance)
        const coreSnap = graphModel.createSnapshot();
        const coreNode = coreSnap.nodes.find(n => n.id === payload.id);
        if (coreNode) {
            node = { ...coreNode };
            this.bufferNodes.set(payload.id, node);
        }
    }

    if (node) {
      // [v0.3.11] 업데이트 적용 (루트렬벨 필드)
      if (payload.updates.position !== undefined) node.position = payload.updates.position;
      if (payload.updates.cluster_id !== undefined) node.cluster_id = payload.updates.cluster_id;
      if (payload.updates.layer !== undefined) {
          node.layer = payload.updates.layer;
          // data.layer도 동기화 (루트 layer와 일치시키기)
          node.data = { ...node.data, layer: payload.updates.layer };
      }
      if (payload.updates.status !== undefined) node.status = payload.updates.status;
      // data 필드는 안전하게 머지 (덮어쓰기 금지)
      if (payload.updates.data) {
          node.data = { ...node.data, ...payload.updates.data };
      }
      // 기타 업데이트 파사드 (유첩성 보장)
      const safeKeys = ['label', 'type', 'filePath', 'degree'] as const;
      for (const key of safeKeys) {
          if ((payload.updates as any)[key] !== undefined) (node as any)[key] = (payload.updates as any)[key];
      }
      Logger.info(`[StateManager] Updated node ${payload.id} (Promoted to Buffer: ${!!node})`);
    }
    return this.getSnapshot();
  }


  /**
   * [v0.3.11] Buffer -> Core (Transaction)
   */
  private commitTransaction(payload: any): CanvasState {
      const cluster: any = {
          nodes: Array.from(this.bufferNodes.values()),
          edges: Array.from(this.bufferEdges.values()),
          clusters: this.bufferClusters
      };

      const result = commitManager.commitCluster(cluster);

      if (result.success) {
          this.bufferNodes.clear();
          this.bufferEdges.clear();
          this.bufferClusters = [];
      }

      return this.getSnapshot();
  }

  public getSnapshot(): CanvasState {
    const coreSnap = graphModel.createSnapshot();
    
    // [v0.3.11] 영속성 복구 로직: Core에 포함되어 있지만 확정되지 않은 노드들을 Buffer로 재포섭
    coreSnap.nodes.forEach(n => {
        if (n.status === 'pending' && !this.bufferNodes.has(n.id)) {
            this.bufferNodes.set(n.id, n);
        }
    });

    // [v0.3.11] 삭제 예약된 노드들을 Core에서 필터링하여 제외 (시각적 삭제 완료)
    // [v0.3.11] 🛡️ Reality Reconciliation: Merge by filePath to prevent duplicates
    const pathMap = new Map<string, Node>();
    this.bufferNodes.forEach(bn => {
        if (bn.filePath) pathMap.set(bn.filePath, bn);
    });

    const filteredCoreNodes = coreSnap.nodes.filter(n => !this.deletedNodesBuffer.has(n.id));
    
    // Core 노드 중 Buffer에 동일 경로가 있는 경우 업데이트/병합
    const reconciledCoreNodes = filteredCoreNodes.map(cn => {
        const manualMatch = cn.filePath ? pathMap.get(cn.filePath) : null;
        if (manualMatch) {
            // 수동 노드가 이미 존재하므로, Core 노드를 Buffer 정보로 덮어씌움 (Promote)
            pathMap.delete(cn.filePath!); // 중복 방지를 위해 맵에서 제거
            return {
                ...cn,
                ...manualMatch,
                id: cn.id, // ID는 안정성을 위해 Core ID 유지
                status: 'confirmed' // 파일이 존재하므로 확정 상태로 변경
            };
        }
        return cn;
    });

    // 남은 Buffer 노드(아직 물리적으로 매칭되지 않은 것들) 추가
    const finalNodes = [...reconciledCoreNodes, ...Array.from(pathMap.values())];
    const draftSnap: GraphSnapshot = {
        nodes: finalNodes,
        edges: [...coreSnap.edges, ...Array.from(this.bufferEdges.values())],
        clusters: [...coreSnap.clusters, ...this.bufferClusters],
        timestamp: Date.now()
    };

    // Projection 적용 (Scope 활성 시 FUNCTION, 아니면 FILE)
    const resolution = this.activeScopeId ? ProjectionResolution.FUNCTION : ProjectionResolution.FILE;
    const viewSnap = projectionLayer.project(draftSnap, resolution);

    const nodesMap: Record<string, Node> = {};
    const edgesMap: Record<string, Edge> = {};
    
    viewSnap.nodes.forEach(n => {
        // [v0.3.11] Scope Isolation: Focus on activeScopeId and its immediate neighbors
        if (this.activeScopeId) {
            const isRelevant = n.id === this.activeScopeId || 
                               viewSnap.edges.some(e => (e.from === this.activeScopeId && e.to === n.id) || (e.to === this.activeScopeId && e.from === n.id));
            if (!isRelevant) return;
        }

        // [v0.3.11] 레이블 결정 로직: 모든 시각화 필드 전수 동기화 (undefined 원천 봉쇄)
        // basename(filePath)를 최후의 수단으로 사용
        const fileName = (n.filePath) ? this.extractBasename(n.filePath) : null;
        const finalLabel = n.label || (n.data && n.data.label) || n.name || n.text || fileName || n.id || "Unknown Node";

        // [v0.3.11] 저장 시 레이어 판정에서 bufferNodes.has() 제거 (오염 방지)
        const isUserLayer = (n.status === 'pending' || 
                             (n.data && n.data.layer === 'user') || 
                             ((n as any).layer === 'user'));

        const nodeObj: any = {
            ...n,
            position: n.position || { x: Math.random() * 500, y: Math.random() * 500 },
            label: finalLabel,
            layer: isUserLayer ? 'user' : 'ai',
            name: finalLabel,
            text: finalLabel,
            data: {
                ...n.data,
                label: finalLabel,
                name: finalLabel,
                text: finalLabel,
                file: n.filePath,
                isScoped: n.id === this.activeScopeId,
                layer: isUserLayer ? 'user' : 'ai'
            }
        };
        nodesMap[n.id] = nodeObj;
    });

    // [v0.3.11] 엣지 보존 및 레이어 태깅
    const finalEdgesMap: Record<string, Edge> = {};
    viewSnap.edges.forEach(e => {
        const edgeId = e.id || `${e.from}->${e.to}`;
        finalEdgesMap[edgeId] = {
            ...e,
            id: edgeId,
            data: { 
                ...e.data, 
                layer: (e.status === 'pending' || this.bufferEdges.has(edgeId) || (e.data && e.data.layer === 'user')) ? 'user' : 'ai' 
            }
        };
    });

    const clusterMap = new Map<string, Cluster>();
    coreSnap.clusters.forEach(c => clusterMap.set(c.id, c));
    this.bufferClusters.forEach(c => clusterMap.set(c.id, c));

    // [v0.3.11] 🛡️ Layer Counting Logic Enhancement
    const layerCounts: Record<string, number> = { ai: 0, user: 0 };
    Object.values(nodesMap).forEach(n => {
        const lyr = (n as any).layer || (n.data && n.data.layer) || 'ai';
        if (layerCounts[lyr] !== undefined) layerCounts[lyr]++;
    });
    (this as any)._lastLayerCounts = layerCounts; 

    // [v0.3.11] Cluster Isolation: Ensure system clusters don't claim manual nodes
    const finalClusters = Array.from(clusterMap.values()).map((c: any) => {
        const isUserCluster = c.id.startsWith('cluster_manual_') || 
                            c.id === 'doc_shelf' ||
                            this.bufferClusters.some(bc => bc.id === c.id) ||
                            (c.data && (c.data.layer === 'user' || c.layer === 'user'));
                            
        return {
            ...c,
            layer: isUserCluster ? 'user' : 'ai',
            data: { 
                ...c.data, 
                layer: isUserCluster ? 'user' : 'ai',
                // root 클러스터인 경우 자손 범위를 제한하기 위해 별도 마킹 (UI 힌트)
                isSystemRoot: c.id === 'cluster_root'
            }
        };
    });

    return {
        nodes: nodesMap,
        edges: finalEdgesMap,
        clusters: finalClusters
    };
  }

  /**
   * 🛡️ 영속성 보관용 원본 데이터 추출 (필터링/투영 없음)
   * UI용 투영 모델이 아닌, 전체 버퍼와 코어를 병합한 프로젝트 마스터 상태를 반환합니다.
   */
  public getRawSnapshot(): CanvasState {
    const coreSnap = graphModel.createSnapshot();
    const nodesMap = new Map<string, Node>(); // filePath 기반 유일성 보장
    const orphanMap = new Map<string, Node>(); // 경로가 없는 수동 노드용

    // 1. Buffer Nodes 우선순위 (수동 수정 사항 반영)
    this.bufferNodes.forEach(bn => {
        if (bn.filePath) {
            nodesMap.set(bn.filePath, bn);
        } else {
            orphanMap.set(bn.id, bn);
        }
    });

    // 2. Core Nodes 병합 (Buffer에 없는 경로만 추가)
    coreSnap.nodes.forEach(cn => {
        if (this.deletedNodesBuffer.has(cn.id)) return;
        
        if (cn.filePath) {
            if (!nodesMap.has(cn.filePath)) {
                nodesMap.set(cn.filePath, cn);
            } else {
                // 이미 존재하면 병합 (ID와 기본적인 데이터는 보존)
                const existing = nodesMap.get(cn.filePath)!;
                nodesMap.set(cn.filePath, { ...cn, ...existing, id: cn.id });
            }
        } else if (!orphanMap.has(cn.id)) {
            orphanMap.set(cn.id, cn);
        }
    });

    // 3. 맵을 레코드로 변환 (최종 노드 리스트 구성)
    // [v0.3.11] 명시적으로 user로 생성된 노드만 layer='user' 태그
    // bufferNodes.has()는 saveState 시 위치 업데이트로 승격된 AI 노드도 포함하므로 사용 불가
    const finalNodesMap: Record<string, Node> = {};
    nodesMap.forEach(n => {
        const isExplicitUser = n.layer === 'user' || 
                               (n.data && n.data.layer === 'user') || 
                               n.status === 'pending';
        finalNodesMap[n.id] = isExplicitUser
            ? { ...n, layer: 'user', data: { ...n.data, layer: 'user' } }
            : { ...n, layer: (n as any).layer || 'ai' }; // AI 노드는 그대로 유지
    });
    orphanMap.forEach(n => {
        // orphanMap = filePath가 없는 수동 노드 → 명시적 user 확인
        const isExplicitUser = n.layer === 'user' || 
                               (n.data && n.data.layer === 'user') || 
                               n.status === 'pending';
        finalNodesMap[n.id] = isExplicitUser
            ? { ...n, layer: 'user', data: { ...n.data, layer: 'user' } }
            : n;
    });

    // 2. Edges
    const finalEdgesMap: Record<string, Edge> = {};
    coreSnap.edges.forEach(e => {
        const id = e.id || `${e.from}->${e.to}`;
        finalEdgesMap[id] = e;
    });
    this.bufferEdges.forEach((e, id) => {
        finalEdgesMap[id] = e;
    });

    // 3. Clusters
    // [v0.3.11] 버퍼 클러스터 + sys_cluster_ 접두어 클러스터에 layer='user' 강제 태그
    const clusterMap = new Map<string, Cluster>();
    coreSnap.clusters.forEach(c => clusterMap.set(c.id, c));
    this.bufferClusters.forEach(c => clusterMap.set(c.id, {
        ...c,
        layer: 'user',
        data: { ...c.data, layer: 'user' }
    } as any));

    // coreSnap 클러스터 중 sys_cluster_* 또는 data.layer==='user' 인 것도 user 태그
    // 단, AI 시스템 클러스터는 절대 user로 분류하지 않음 (오염 방지)
    const AI_CLUSTER_IDS = new Set(['cluster_root', 'cluster_ghosts', 'cluster_reserved', 'context_vault']);
    const finalClusters = Array.from(clusterMap.values()).map((c: any) => {
        if (AI_CLUSTER_IDS.has(c.id)) {
            return { ...c, layer: 'ai', data: { ...c.data, layer: 'ai' } };
        }
        const isUser = this.bufferClusters.some(bc => bc.id === c.id) ||
                       c.id.startsWith('sys_cluster_') ||
                       c.id.startsWith('cluster_manual_') ||
                       c.layer === 'user' ||
                       (c.data && c.data.layer === 'user');
        return isUser
            ? { ...c, layer: 'user', data: { ...c.data, layer: 'user' } }
            : { ...c, layer: 'ai', data: { ...c.data, layer: 'ai' } }; // 명시적으로 ai 태그
    });

    return {
        nodes: finalNodesMap,
        edges: finalEdgesMap,
        clusters: finalClusters
    };
  }

  public load(state: any) {
    if (!state) return;
    
    graphModel.loadFrom(state);
    
    // [v0.3.11] 🔄 Restore Buffers from loaded state (Anti-Evaporation)
    this.bufferNodes.clear();
    this.bufferEdges.clear();
    this.bufferClusters = [];

    const nodes = Array.isArray(state.nodes) ? state.nodes : Object.values(state.nodes || {});
    nodes.forEach((n: any) => {
        // [v0.3.11] 진정한 user 노드 조건:
        // 1. pending 상태 (파일 미생성)
        // 2. layer='user'이고 ghost/error_necrosis AI 전용 상태가 아닌 것
        // ⚠️ 'confirmed'는 파일 존재 확인 = user도 confirmed 될 수 있으므로 제외
        const hasUserLayer = (n.layer === 'user' || (n.data && n.data.layer === 'user'));
        const isAiStatus = n.status === 'ghost' || n.status === 'error_necrosis';
        const isUserNode = n.status === 'pending' || (hasUserLayer && !isAiStatus);
        if (isUserNode) {
            this.bufferNodes.set(n.id, n);
            n.layer = 'user';
            n.data = { ...n.data, layer: 'user' };
        }
    });

    const clusters = Array.isArray(state.clusters) ? state.clusters : Object.values(state.clusters || {});
    clusters.forEach((c: any) => {
        const isUserC = c.id.startsWith('cluster_manual_') || 
                        c.id === 'sys_cluster_buffer' || 
                        c.id === 'sys_cluster_reserved' || 
                        c.id === 'doc_shelf' ||
                        (c.data && c.data.layer === 'user');
        if (isUserC) {
            this.bufferClusters.push({
                ...c,
                data: { ...c.data, layer: 'user' }
            });
        }
    });

    Logger.info(`[StateManager] Restored ${this.bufferNodes.size} nodes and ${this.bufferClusters.length} clusters to buffer.`);
  }

  /**
   * [v0.3.11] Non-destructive State Merge (For Self-Healing)
   */
  public mergeState(state: any) {
      if (!state || !state.nodes) return;
      
      const newNodes = state.nodes || [];
      const coreSnap = graphModel.createSnapshot();
      
      // Preserve existing core nodes
      const mergedCoreNodes = [...coreSnap.nodes];
      const pathMap = new Map<string, Node>();
      mergedCoreNodes.forEach(n => {
          if (n.filePath) pathMap.set(n.filePath, n);
      });

      newNodes.forEach((nn: Node) => {
          // [v0.3.11] 🛡️ ID 또는 경로 기반 매칭 시도
          const existingById = mergedCoreNodes.find(cn => cn.id === nn.id);
          const existingByPath = nn.filePath ? pathMap.get(nn.filePath) : null;
          
          if (existingById || existingByPath) {
              // 이미 존재하면 병합 (기존 ID 유지하여 롤백 시 엉킴 방지)
              const target = existingById || existingByPath!;
              // nn(디스크 스캔 데이터)보다 target(현재 시각화 데이터)의 좌표와 클러스터 정보를 우선함
              Object.assign(target, { 
                  ...nn, 
                  id: target.id, 
                  position: target.position || nn.position,
                  cluster_id: target.cluster_id || nn.cluster_id 
              }); 
          } else {
              mergedCoreNodes.push(nn);
          }
      });

      // Update Core Graph
      graphModel.loadFrom({
          ...state,
          nodes: mergedCoreNodes,
          clusters: coreSnap.clusters 
      });

      Logger.info(`[StateManager] Non-destructive merge complete. Core Nodes: ${mergedCoreNodes.length}`);
  }
}
