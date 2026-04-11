import * as path from 'path';
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
  deletedNodeIds?: string[]; // [v0.3.11] 영속적 삭제 추적
  userCount?: number;        // [v0.3.11] 명시적 레이어 집계
  aiCount?: number;          // [v0.3.11] 명시적 레이어 집계
}

export class StateManager {
  private bufferNodes: Map<string, Node> = new Map();
  private bufferEdges: Map<string, Edge> = new Map();
  private bufferClusters: Cluster[] = [];
  private deletedPathsBuffer: Set<string> = new Set(); // [v0.3.11] 삭제된 경로 추적 (Anti-Resurrection)
  private activeScopeId: string | null = null; // [v0.3.11] Scope Isolation
  
  /**
   * Helper to extract parent folder name for clustering (v0.3.11 optimized)
   */
  private extractParentFolderName(p?: string): string | null {
    if (!p) return null;
    const normalized = p.replace(/\\/g, '/').replace(/^\/+/, '');
    const parts = normalized.split('/').filter(x => x.length > 0);
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
    return null;
  }

  private normalizePath(p?: string): string {
    if (!p) return "";
    let normalized = p.replace(/\\/g, '/').trim();
    
    // [v0.3.11] Ultra-Precision Normalization:
    // 절대 경로든 상대 경로든 '파일명'과 '부모 폴더'만 남겨서 일치시킴
    // ex) /home/user/project/src/test.py -> src/test.py
    // ex) test.py -> test.py
    const parts = normalized.split('/').filter(x => x.length > 0);
    if (parts.length >= 2) {
        // 끝에서 두 자리가 실질적인 '프로젝트 내 상대 경로'일 확률이 매우 높음
        return parts.slice(-2).join('/');
    } else if (parts.length === 1) {
        return parts[0];
    }
    return normalized;
  }

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
    const filePath = payload.filePath || '';
    const fileName = this.extractBasename(filePath);
    const finalLabel = payload.label || fileName || payload.id;
    
    // [v0.3.11] 🛡️ Anti-Zombie Guard: 부활 허용 (normalizePath 활용)
    const normalizedNewPath = this.normalizePath(filePath);
    if (normalizedNewPath) this.deletedPathsBuffer.delete(normalizedNewPath);
    
    // [v0.3.11] Deduplication Check: 동일한 filePath를 가진 코어 노드가 있는지 확인
    const coreSnap = graphModel.createSnapshot();
    const existingCore = filePath ? coreSnap.nodes.find(cn => cn.filePath === filePath || (cn.data && cn.data.file === filePath)) : null;

    const nodeId = existingCore ? existingCore.id : (payload.id || `node_manual_${Date.now()}`);

    const newNode: Node = {
      ...payload,
      id: nodeId,
      filePath: filePath,
      type: payload.type || 'file',
      label: finalLabel,
      layer: 'user',
      cluster_id: payload.cluster_id || '',
      status: 'pending',
      data: { 
        ...payload.data, 
        label: finalLabel,
        layer: 'user',
        filePath: filePath,
        file: filePath,
        cluster_id: payload.cluster_id || ''
      }
    };
    
    this.bufferNodes.set(nodeId, newNode);
    console.log(`[StateManager] Node ${nodeId} created/promoted to User layer.`);
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
    const node = this.bufferNodes.get(payload.nodeId);
    if (node) {
      node.position = { x: payload.target.x, y: payload.target.y };
    }
    return this.getSnapshot();
  }

  private mutateDeleteNode(payload: { id: string, isPhysical?: boolean }): CanvasState {
    const node = this.bufferNodes.get(payload.id) || graphModel.createSnapshot().nodes.find(n => n.id === payload.id);
    const path = node ? this.normalizePath(node.filePath || (node.data && (node.data.filePath || node.data.file))) : "";
    
    // 1. 버퍼에서 제거
    this.bufferNodes.delete(payload.id);
    
    // 2. 경로 기반 삭제 레지스트리 등록 (Zombie Registry)
    if (path) {
        this.deletedPathsBuffer.add(path);
        console.log(`[StateManager] Path ${path} marked as deleted.`);
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
    
    // [v0.3.11] Anti-Zombie Guard: 삭제된 경로는 업데이트 거부
    const coreSnapRef = graphModel.createSnapshot();
    const coreNodeRef = coreSnapRef.nodes.find(n => n.id === payload.id);
    const path = this.normalizePath(coreNodeRef?.filePath || (coreNodeRef?.data && (coreNodeRef.data.filePath || coreNodeRef.data.file)));
    
    if (!node && path && this.deletedPathsBuffer.has(path)) {
        return this.getSnapshot();
    }

    if (!node) {
        // Promote core node to buffer to allow manual modification (Core Freeze Compliance)
        if (coreNodeRef) {
            node = { ...coreNodeRef };
            this.bufferNodes.set(payload.id, node);
        }
    }

    if (node) {
      // [v0.3.11] 업데이트 적용 (루트 레벨 필드)
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
      // 기타 업데이트 파사드 (유연성 보장)
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

  /**
   * [v0.3.11] 🧬 Unified SSoT State Generation
   */
  private generateMergedState(options: { raw: boolean }): { 
      nodes: Record<string, Node>, 
      edges: Record<string, Edge>, 
      clusters: any[], 
      deletedNodeIds: string[],
      userCount: number,
      aiCount: number
  } {
    const coreSnap = graphModel.createSnapshot();
    const nodesMap = new Map<string, Node>();
    const orphanMap = new Map<string, Node>();

    // [v0.3.11] Safe Path Extraction (No Mutation)
    const getEffectivePath = (n: Node): string => {
        return n.filePath || (n.data && (n.data.file || n.data.filePath)) || "";
    };

    // 1. [Truth-01] Buffer Nodes (User Authority)
    this.bufferNodes.forEach(bn => {
        const path = getEffectivePath(bn);
        const resolvedPath = this.normalizePath(path);
        if (resolvedPath) {
            nodesMap.set(resolvedPath, bn);
        } else {
            orphanMap.set(bn.id, bn);
        }
    });

    // 2. [Truth-02] Zombie Guard (Pruning by Path)
    const filteredCoreNodes = coreSnap.nodes.filter(cn => {
        const path = getEffectivePath(cn);
        const p = this.normalizePath(path);
        return !this.deletedPathsBuffer.has(p);
    });

    // 3. [Truth-03] AI Discovery Merge (Merge Only, No Overwrite)
    filteredCoreNodes.forEach(cn => {
        const path = getEffectivePath(cn);
        const resolvedPath = this.normalizePath(path);
        
        if (resolvedPath) {
            const existingNode = nodesMap.get(resolvedPath);
            
            // 🛡️ Ultimate Layer Authority: ID 접두어를 최종 권위로 설정
            const isManualNode = (existingNode && existingNode.id.startsWith('node_manual_')) || cn.id.startsWith('node_manual_') || (existingNode && existingNode.layer === 'user');
            const finalLayer = isManualNode ? 'user' : 'ai';
            const finalId = isManualNode ? (existingNode?.id || cn.id) : cn.id;

            if (existingNode) {
                nodesMap.set(resolvedPath, {
                    ...existingNode,
                    id: finalId, // 🛡️ 수동 ID 주권 보호
                    layer: finalLayer, 
                    cluster_id: existingNode.cluster_id || cn.cluster_id, 
                    degree: cn.degree || existingNode.degree
                });
                if (nodesMap.get(resolvedPath)?.data) {
                    nodesMap.get(resolvedPath)!.data.layer = finalLayer;
                }
                return;
}

            if (!nodesMap.has(resolvedPath)) {
                nodesMap.set(resolvedPath, {
                    ...cn,
                    layer: finalLayer,
                    data: { ...cn.data, layer: finalLayer }
                });
            }
        } else if (!orphanMap.has(cn.id)) {
            // ID가 'node_manual_'로 시작하면 고립 노드여도 User로 보호
            const isManual = cn.id.startsWith('node_manual_');
            orphanMap.set(cn.id, { ...cn, layer: isManual ? 'user' : 'ai' });
        }
    });


    // 4. Record Conversion & Layer Counting (Strict Deduplication by Path)
    const finalNodes: Record<string, Node> = {};
    const seenPaths = new Set<string>();
    // 3.5 [v0.3.11] Pre-calculate Path-to-ID mapping (Prioritize Manual IDs for each path)
    const pathToIdMap = new Map<string, string>(); 
    const allCandidates = [...Array.from(orphanMap.values()), ...Array.from(nodesMap.values())];
    
    // Sort to ensure manual IDs are assigned to paths in the map first
    allCandidates.sort((a, b) => {
        const aIsManual = a.id.startsWith('node_manual_');
        const bIsManual = b.id.startsWith('node_manual_');
        return (aIsManual === bIsManual) ? 0 : (aIsManual ? -1 : 1);
    });

    const basenameToIdMap = new Map<string, string>();

    allCandidates.forEach(n => {
        const rawPath = (n.filePath || n.id).replace(/\\/g, '/');
        const pathRef = this.normalizePath(rawPath);
        const baseName = n.filePath ? path.basename(n.filePath) : (n.id.startsWith('node_manual_') ? n.label : n.id);
        const cleanBaseName = baseName?.replace(/^[📄📁]\s*/, '').trim();
        const baseNameNoExt = cleanBaseName?.toLowerCase().split('.')[0];

        if (pathRef && !pathToIdMap.has(pathRef)) {
            // [v0.3.11] Multi-Stage Unification: Match by path, basename, or extension-less basename
            const existingId = (cleanBaseName && basenameToIdMap.get(cleanBaseName)) || 
                             (baseNameNoExt && basenameToIdMap.get(baseNameNoExt));

            if (existingId) {
                pathToIdMap.set(pathRef, existingId);
            } else {
                pathToIdMap.set(pathRef, n.id);
                if (cleanBaseName) basenameToIdMap.set(cleanBaseName, n.id);
                if (baseNameNoExt) basenameToIdMap.set(baseNameNoExt, n.id);
            }
        }
    });

    // 3.6 [v0.3.11] Pre-calculate degrees using resolved IDs
    const degrees: Record<string, number> = {};
    const allEdges = [...coreSnap.edges, ...Array.from(this.bufferEdges.values())];
    allEdges.forEach(e => {
        const fromPath = this.normalizePath(e.from);
        const toPath = this.normalizePath(e.to);
        const realFrom = pathToIdMap.get(fromPath || e.from.replace(/\\/g, '/')) || e.from;
        const realTo = pathToIdMap.get(toPath || e.to.replace(/\\/g, '/')) || e.to;
        
        degrees[realFrom] = (degrees[realFrom] || 0) + 1;
        degrees[realTo] = (degrees[realTo] || 0) + 1;
    });

    // 4. Record Conversion & Layer Counting (Strict Deduplication by Path)
    let userCount = 0;
    let aiCount = 0;

    allCandidates.forEach(n => {
        const rawPath = (n.filePath || n.id).replace(/\\/g, '/');
        const pathRef = this.normalizePath(rawPath);
        
        if (pathRef && (this.deletedPathsBuffer.has(pathRef) || seenPaths.has(pathRef))) return;
        if (pathRef) seenPaths.add(pathRef);

        const nodeDegree = degrees[n.id] || 0;
        const isExternal = n.filePath && n.filePath.startsWith('external://');
        const isFromBuffer = this.bufferNodes.has(n.id);
        const isManual = n.id.startsWith('node_manual_') || n.layer === 'user' || (n.data && n.data.layer === 'user') || isFromBuffer;
        
        const isAiFile = n.filePath && !isExternal && !isManual;
        const finalLayer = (isAiFile || isExternal) ? 'ai' : 'user';

        // [v0.3.11] Smart Cluster Assignment (User-Driven Logic)
        let finalClusterId = n.cluster_id;
        
        // 1. Identify Parent Folder (Universal Winner)
        const parentFolder = this.extractParentFolderName(n.filePath || n.id);

        if (parentFolder) {
            // Folder structure always wins for both AI and User nodes
            finalClusterId = `folder_${parentFolder}`;
        } else if (isExternal) {
            finalClusterId = 'cluster_ghosts';
        } else if (finalLayer === 'user') {
            // Root-level User Nodes
            const hasManualGroup = n.cluster_id && n.cluster_id.startsWith('cluster_manual_');
            if (!hasManualGroup) {
                if (nodeDegree === 0) {
                    finalClusterId = 'sys_cluster_buffer';
                } else {
                    // Confirmed root user nodes: Let them float OR use Reserved Cluster if desired
                    // User Rule: "Root nodes should just spread out without clusters"
                    finalClusterId = undefined; 
                }
            }
        } else {
            // Root-level AI Nodes (Float freely per user rule #2)
            finalClusterId = undefined;
        }

        finalNodes[n.id] = {
            ...n,
            layer: finalLayer,
            cluster_id: finalClusterId,
            position: n.position || { x: 0, y: 0 },
            data: { ...n.data, layer: finalLayer }
        };

        if (finalLayer === 'user') userCount++; else aiCount++;
    });

    // 6. Cluster Logic & Essential Shield (v0.3.11: Hide empty system clusters)
    const clusterMap = new Map<string, Cluster>();
    coreSnap.clusters.forEach(c => clusterMap.set(c.id, c));
    this.bufferClusters.forEach(c => clusterMap.set(c.id, c));

    // [v0.3.11] System Cluster Metadata Sync (Correct Labels AFTER map is ready)
    const systemClusterMeta: Record<string, string> = {
        'sys_cluster_buffer': 'Buffer Cluster',
        'sys_cluster_reserved': 'Reserved Cluster',
        'cluster_ghosts': 'External Ghosts'
    };

    clusterMap.forEach((c: Cluster) => {
        if (systemClusterMeta[c.id]) {
            c.label = systemClusterMeta[c.id];
            c.type = 'system';
        }
    });

    const finalClusters = Array.from(clusterMap.values())
        .filter(c => c.id !== 'sys_cluster_root') // [Rule 1] Root Abolition
        .filter(c => {
            // [v0.3.11] Empty System Cluster Auto-Hide
            const isSystemCluster = c.id.startsWith('sys_') || c.id === 'cluster_ghosts' || c.id === 'doc_shelf';
            if (isSystemCluster) {
                const hasNodes = Object.values(finalNodes).some(n => n.cluster_id === c.id);
                if (c.id === 'doc_shelf') return true;
                return hasNodes;
            }
            return true;
        })
        .map((c: any) => {
            // [v0.3.11] Origin-based Layer Authority
            const isSystemCluster = c.id.startsWith('sys_') || c.id === 'doc_shelf' || c.id === 'cluster_ghosts';
            
            // [v0.3.11] Reserved & Buffer = User / Folders & Ghosts = AI
            const isUserSystem = (c.id === 'sys_cluster_buffer' || c.id === 'sys_cluster_reserved' || c.id.startsWith('cluster_manual_'));
            const layer = isUserSystem ? 'user' : 'ai';
            
            return {
                ...c,
                layer,
                data: { ...c.data, layer }
            };
        });

    // 5. Edges Sync (Dedup by From-To pair, prioritize Confirmed status)
    const finalEdges: Record<string, Edge> = {};
    const edgePairMap = new Map<string, Edge>();
    // Reusing allEdges from previous declaration

    allEdges.forEach(e => {
        const fromPath = this.normalizePath(e.from);
        const toPath = this.normalizePath(e.to);
        const realFrom = pathToIdMap.get(fromPath || e.from.replace(/\\/g, '/')) || e.from;
        const realTo = pathToIdMap.get(toPath || e.to.replace(/\\/g, '/')) || e.to;

        if (!finalNodes[realFrom] || !finalNodes[realTo]) return;
        
        const pairKey = `${realFrom}->${realTo}`;
        const existing = edgePairMap.get(pairKey);
        
        const isIncomingConfirmed = (e.status === 'confirmed' || (e.data && e.data.layer === 'user'));
        const isExistingConfirmed = existing ? (existing.status === 'confirmed' || (existing.data && existing.data.layer === 'user')) : false;

        if (!existing || (isIncomingConfirmed && !isExistingConfirmed)) {
            edgePairMap.set(pairKey, { ...e, from: realFrom, to: realTo });
        }
    });

    edgePairMap.forEach((e, pairKey) => {
        const id = e.id || `edge_${pairKey}`;
        finalEdges[id] = e;
    });

    return {
        nodes: finalNodes,
        edges: finalEdges,
        clusters: finalClusters,
        deletedNodeIds: Array.from(this.deletedPathsBuffer),
        userCount,
        aiCount
    };
  }

  public getSnapshot(): CanvasState {
    const merged = this.generateMergedState({ raw: false });
    
    // UI 전 전처리 (Projection 등)
    const draftSnap: GraphSnapshot = {
        nodes: Object.values(merged.nodes),
        edges: Object.values(merged.edges),
        clusters: merged.clusters,
        timestamp: Date.now()
    };

    const resolution = this.activeScopeId ? ProjectionResolution.FUNCTION : ProjectionResolution.FILE;
    const viewSnap = projectionLayer.project(draftSnap, resolution);

    // [v0.3.11] Result Mapping (Path-Based SSoT)
    const finalNodes: Record<string, Node> = {};
    const seenPaths = new Set<string>();

    const degrees: Record<string, number> = {};
    Object.values(merged.edges).forEach(e => {
        degrees[e.from] = (degrees[e.from] || 0) + 1;
        degrees[e.to] = (degrees[e.to] || 0) + 1;
    });

    // [v0.3.11] User Nodes first to establish "Manual Authority"
    const allKnownNodes = Object.values(merged.nodes);
    const userNodes = allKnownNodes.filter(n => (n.layer === 'user' || n.id.startsWith('node_manual_')));
    const aiNodes = allKnownNodes.filter(n => !userNodes.includes(n));

    [...userNodes, ...aiNodes].forEach(n => {
        const rawPath = n.filePath || n.id;
        const pathRef = this.normalizePath(rawPath);
        
        // [v0.3.11] 🛡️ Strict Double-Guard: Ensure no deleted paths pass through to UI
        if (pathRef && (this.deletedPathsBuffer.has(pathRef) || seenPaths.has(pathRef))) return;
        if (pathRef) seenPaths.add(pathRef);

        const id = n.id;
        
        // [v0.3.11] Layer Authority: filePath가 있더라도 매뉴얼ID거나 이미 user면 User 주권 유지
        const isExternal = n.filePath && n.filePath.startsWith('external://');
        const isManual = n.id.startsWith('node_manual_') || n.layer === 'user' || (n.data && n.data.layer === 'user');
        const isAiFile = n.filePath && !isExternal && !isManual;
        const finalLayer = (isAiFile || isExternal) ? 'ai' : 'user';
        
        const nodeDegree = degrees[n.id] || 0;
        finalNodes[id] = { 
            ...n, 
            layer: finalLayer 
        };
    });

    const nodesMapResult: Record<string, Node> = {};
    Object.values(finalNodes).forEach(n => {
        const fileName = (n.filePath) ? this.extractBasename(n.filePath) : null;
        const finalLabel = n.label || (n.data && n.data.label) || fileName || n.id;
        
        nodesMapResult[n.id] = {
            ...n,
            label: finalLabel,
            data: { ...n.data, label: finalLabel, isScoped: n.id === this.activeScopeId }
        };
    });

    return {
        nodes: nodesMapResult,
        edges: merged.edges,
        clusters: merged.clusters,
        deletedNodeIds: merged.deletedNodeIds,
        userCount: merged.userCount || 0,
        aiCount: merged.aiCount || 0
    };
  }

  public getRawSnapshot(): CanvasState {
    return this.generateMergedState({ raw: true });
  }

  public load(state: any) {
    if (!state) return;
    
    graphModel.loadFrom(state);
    
    // [v0.3.11] 🔄 Restore Buffers from loaded state (Anti-Evaporation)
    this.bufferNodes.clear();
    this.bufferEdges.clear();
    this.bufferClusters = [];

    // [v0.3.11] Restore Deleted Paths
    this.deletedPathsBuffer.clear();
    if (state.deletedNodeIds && Array.isArray(state.deletedNodeIds)) {
        state.deletedNodeIds.forEach((p: string) => {
            this.deletedPathsBuffer.add(this.normalizePath(p));
        });
    }

    const nodes = Array.isArray(state.nodes) ? state.nodes : Object.values(state.nodes || {});
    nodes.forEach((n: any) => {
        // [v0.3.11] 진정한 user 노드 조건
        const resolvedPath = this.normalizePath(n.filePath || (n.data && (n.data.filePath || n.data.file)));
        if (this.deletedPathsBuffer.has(resolvedPath)) return;

        const hasUserLayer = (n.layer === 'user' || (n.data && n.data.layer === 'user'));
        const isManualId = n.id && n.id.startsWith('node_manual_');
        // [v0.3.11] Enhanced User Recovery: 
        // 1. Manual IDs are always user.
        // 2. Anything in 'pending' status.
        // 3. Anything explicitly tagged as 'user' layer (even if confirmed).
        const isUserNode = isManualId || n.status === 'pending' || n.status === 'confirmed' || hasUserLayer;
        
        if (isUserNode) {
            // [v0.3.11] Unify filePath/file fields during load
            const resolvedPath = n.filePath || (n.data && (n.data.filePath || n.data.file)) || "";
            
            const normalizedNode = {
                ...n,
                filePath: resolvedPath,
                layer: 'user',
                data: { 
                    ...n.data, 
                    filePath: resolvedPath, 
                    file: resolvedPath,
                    layer: 'user' 
                }
            };
            this.bufferNodes.set(n.id, normalizedNode);
        }
    });

    const clusters = Array.isArray(state.clusters) ? state.clusters : Object.values(state.clusters || {});
    clusters.forEach((c: any) => {
        if (c.id === 'sys_cluster_root') return; // [v0.3.11] Never restore Root macro-container
        
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

    const edges = Array.isArray(state.edges) ? state.edges : Object.values(state.edges || {});
    edges.forEach((e: any) => {
        const isUserEdge = e.status === 'pending' || (e.data && e.data.layer === 'user');
        if (isUserEdge) {
            const id = e.id || `edge_${e.from}_${e.to}`;
            this.bufferEdges.set(id, { ...e, id });
        }
    });

    Logger.info(`[StateManager] Restored ${this.bufferNodes.size} nodes, ${this.bufferEdges.size} edges, and ${this.bufferClusters.length} clusters to buffer.`);
  }

  /**
   * [v0.3.11] 🛡️ AI Scan Merge Logic (SSoT Master)
   * AI가 발견한 새로운 노드들을 기존 상태에 병합하되, 유저 자산은 절대 건드리지 않습니다.
   */
  public mergeFromScan(scanState: any) {
      if (!scanState || !scanState.nodes) return;
      
      const coreSnap = graphModel.createSnapshot();
      const mergedCoreNodes = [...coreSnap.nodes];
      
      // 경로(filePath) 기반 빠른 조회를 위한 맵 생성
      const pathMap = new Map<string, Node>();
      mergedCoreNodes.forEach(n => {
          if (n.filePath) pathMap.set(n.filePath, n);
      });

      const scanNodes = Array.isArray(scanState.nodes) ? scanState.nodes : Object.values(scanState.nodes);
      
      // [v0.3.11] Safe Merge: Create a new array and new object instances
      let finalCoreNodes = [...mergedCoreNodes];

      scanNodes.forEach((sn: any) => {
          const snRawPath = sn.filePath || (sn.data && (sn.data.file || sn.data.filePath)) || "";
          const snPath = this.normalizePath(snRawPath);
          
          const existingIdx = snPath ? finalCoreNodes.findIndex(n => this.normalizePath(n.filePath) === snPath) : -1;

          if (existingIdx !== -1) {
              const target = finalCoreNodes[existingIdx];
              // [v0.3.11] Authoritative User Shield
              if (target.layer === 'user' || (target.data && target.data.layer === 'user')) {
                  return; 
              }

              // Replace with merged copy
              finalCoreNodes[existingIdx] = { 
                  ...target,
                  ...sn, 
                  id: target.id,
                  cluster_id: target.cluster_id, 
                  layer: target.layer === 'user' ? 'user' : 'ai'
              };
          } else {
              // snPath(경로) 기준으로 삭제 여부 판단
              if (snPath && !this.deletedPathsBuffer.has(snPath)) {
                finalCoreNodes.push({ ...sn, filePath: snRawPath, layer: 'ai' });
              }
          }
      });

      // 최종 병합된 상태를 Core Graph로 환원
      graphModel.loadFrom({
          ...scanState,
          nodes: finalCoreNodes,
          clusters: coreSnap.clusters 
      });

      Logger.info(`[StateManager] mergeFromScan complete. Core Nodes: ${mergedCoreNodes.length}`);
  }
}
