import * as path from 'path';
import { Intent, createIntent } from './Intent';
import { Node, Edge, Cluster, ClusterFlow, graphModel, GraphModel, GraphSnapshot } from '../GraphModel';
type Layer = 'ai' | 'user' | 'source' | 'documentation';
import { commitManager } from '../transaction/CommitManager';
import { projectionLayer, ProjectionResolution } from '../projection/ProjectionLayer';
import { Logger } from '../../utils/Logger';
import { RuleEngine } from '../RuleEngine';

/**
 * 🧬 SYNAPSE State Manager (v0.3.11_Hardened)
 * Built with: Transactional Integrity, Ghost Isolation, and User-Overwrite Authority.
 */

export interface CanvasState {
  nodes: Record<string, Node>;
  edges: Record<string, Edge>;
  clusters: Cluster[];
  deletedNodeIds?: string[];
  deletedNodeReasons?: Record<string, string>; // 📡 GC Signal Optimization
  deletedPaths?: string[];   
  userCount?: number;
  aiCount?: number;
  cluster_flows?: ClusterFlow[]; // [v0.3.21] Heatmap data
}

export class StateManager {
  private bufferNodes: Map<string, Node> = new Map();
  private bufferEdges: Map<string, Edge> = new Map();
  private bufferClusters: Map<string, Cluster> = new Map();
  private deletedNodeIds: Set<string> = new Set();
  private deletedPaths: Set<string> = new Set();
  private dirtyNodeIds: Set<string> = new Set();
  private reservedPaths: Set<string> = new Set(); // 📡 Immediate Sovereignty Signal (RTOS Style)
  private currentTxnId: number = 0;
  private activeScopeId: string | null = null;

  constructor(clusters?: Cluster[]) {
    this.bufferNodes = new Map();
    this.bufferEdges = new Map();
    const newClustersMap = new Map<string, Cluster>();
    (clusters || []).forEach((c: any) => {
        newClustersMap.set(c.id, { ...c });
    });
    this.bufferClusters = newClustersMap;
  }

  private incrementTxn() { this.currentTxnId++; }

  private markDirty(id: string) {
    this.dirtyNodeIds.add(id);
    this.incrementTxn();
  }
  
  private extractParentFolderName(p?: string): string | null {
    if (!p || p.includes('://')) return null; // [v0.3.14 Fix] Skip protocol-prefixed paths (ghost, external)
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
    const parts = normalized.split('/').filter(x => x.length > 0);
    if (parts.length >= 2) {
        return parts.slice(-2).join('/');
    } else if (parts.length === 1) {
        return parts[0];
    }
    return normalized;
  }

  public apply(intent: Intent): CanvasState {
    switch (intent.type) {
      case 'ADD_NODE': return this.mutateAddNode(intent.payload);
      case 'CONNECT_EDGE': return this.mutateConnectEdge(intent.payload);
      case 'MOVE_NODE': return this.mutateMoveNode(intent.payload);
      case 'DELETE_NODE': return this.mutateDeleteNode(intent.payload);
      case 'DELETE_EDGE': return this.mutateDeleteEdge(intent.payload);
      case 'UPDATE_EDGE': return this.mutateUpdateEdge(intent.payload);
      case 'UPDATE_NODE': return this.mutateUpdateNode(intent.payload);
      case 'ADD_CLUSTER': return this.mutateAddCluster(intent.payload);
      case 'CONFIRM_COMMIT': return this.commitTransaction(intent.payload);
      case 'GROUP': return this.mutateGroupCluster(intent.payload);
      case 'UNGROUP': return this.mutateUngroup(intent.payload);
      case 'ENTER_SCOPE': 
        this.activeScopeId = intent.payload.nodeId;
        return this.getSnapshot();
      case 'EXIT_SCOPE': 
        this.activeScopeId = null;
        return this.getSnapshot();
      default: return this.getSnapshot();
    }
  }

  private findNode(idOrPath: string): Node | undefined {
    if (!idOrPath) return undefined;
    const normSearch = this.normalizePath(idOrPath);
    let node = this.bufferNodes.get(idOrPath);
    if (!node) {
        node = Array.from(this.bufferNodes.values()).find(n => 
            n.id === idOrPath || (n.filePath && this.normalizePath(n.filePath) === normSearch)
        );
    }
    if (!node) {
        const coreNodes = graphModel.createSnapshot().nodes;
        node = coreNodes.find(cn => 
            cn.id === idOrPath || (cn.filePath && this.normalizePath(cn.filePath) === normSearch)
        );
    }
    return node;
  }

  private mutateGroupCluster(payload: { nodeIds: string[], label: string }): CanvasState {
    const clusterId = `cluster_${Date.now()}`;
    const targetNodes: Node[] = [];
    payload.nodeIds.forEach(id => {
       const node = this.findNode(id);
       if (node) targetNodes.push(node);
    });
    if (targetNodes.length === 0) return this.getSnapshot();
    const avgX = targetNodes.reduce((sum, n) => sum + (n.position?.x || 0), 0) / targetNodes.length;
    const avgY = targetNodes.reduce((sum, n) => sum + (n.position?.y || 0), 0) / targetNodes.length;
    const newCluster: Cluster = {
        id: clusterId, label: payload.label, type: 'folder', position: { x: avgX, y: avgY }, collapsed: false, data: { layer: 'user' }
    };
    this.bufferClusters.set(clusterId, newCluster);
    this.incrementTxn();
    targetNodes.forEach(node => {
        const buffered = this.bufferNodes.get(node.id) || { ...node };
        buffered.cluster_id = clusterId;
        if (buffered.position) {
            buffered.position = { x: buffered.position.x - avgX, y: buffered.position.y - avgY };
        }
        this.bufferNodes.set(node.id, buffered);
        this.markDirty(node.id);
    });
    return this.getSnapshot();
  }

  public mutateSyncFromDisk(nodes: Node[], edges: Edge[]) {
    nodes.forEach(n => {
        const existing = this.bufferNodes.get(n.id);
        if (existing) {
            // 📡 Authoritative Sync: Always trust fresh signatures over cached state
            const freshData = {
                ...existing.data,
                ...n.data,
                hasAtomicSignature: n.data.hasAtomicSignature,
                hasImportSignature: n.data.hasImportSignature
            };
            existing.data = freshData;
            existing.filePath = n.filePath;
        } else {
            this.bufferNodes.set(n.id, n);
        }
    });

    this.bufferEdges.clear();
    edges.forEach(e => this.bufferEdges.set(e.id || `${e.from}->${e.to}`, e));
    this.incrementTxn();
  }

  private extractBasename(path: string): string {
    if (!path) return "";
    const parts = path.split(/[\\/]/);
    return parts[parts.length - 1] || "";
  }

  private mutateAddNode(payload: any): CanvasState {
    const filePath = payload.filePath || '';
    const fileName = this.extractBasename(filePath);
    const finalLabel = payload.label || fileName || payload.id;
    const coreSnap = graphModel.createSnapshot();
    const existingCore = filePath ? coreSnap.nodes.find(cn => cn.filePath === filePath || (cn.data && cn.data.file === filePath)) : null;
    const nodeId = existingCore ? existingCore.id : (payload.id || `node_manual_${Date.now()}`);

    const normalizedNewPath = this.normalizePath(filePath);
    if (normalizedNewPath) {
      this.deletedPaths.delete(normalizedNewPath);
      this.reservedPaths.add(normalizedNewPath); // 📡 Immediate Signal (Interrupt)
    }
    this.deletedNodeIds.delete(nodeId);

    // 📡 Senior Blueprint: First Write Metadata Injection
    const now = Math.floor(Date.now() / 1000);
    const seniorData = {
      ...payload.data,
      label: finalLabel,
      layer: 'user',
      filePath: filePath,
      file: filePath,
      opacity: 1,             
      scale: 1,               
      isUserCreated: true,    
      isSovereign: true,      // 🏛️ Inertia: Once placed, stay placed
      isPinned: false,        
      color: payload.color || "",
      description: payload.description || "",
      lastModified: now,
      engineProps: payload.engineProps || {}
    };

    const newNode: Node = {
      ...payload,
      id: nodeId,
      filePath: filePath,
      type: payload.type || 'file',
      label: finalLabel,
      layer: 'user',
      cluster_id: payload.cluster_id || 'sys_cluster_buffer', // Start in Buffer
      status: 'pending',
      visual: { opacity: 1, scale: 1, visible: true },
      data: seniorData
    };
    this.bufferNodes.set(nodeId, newNode);
    this.markDirty(nodeId);
    return this.getSnapshot();
  }

  private mutateAddCluster(payload: any): CanvasState {
    this.bufferClusters.set(payload.id, {
      ...payload,
      id: payload.id,
      label: payload.label || payload.id,
      type: payload.type || 'folder',
      collapsed: payload.collapsed || false,
      data: { ...payload.data, layer: 'user' }
    });
    this.incrementTxn();
    return this.getSnapshot();
  }

  private mutateConnectEdge(payload: any): CanvasState {
    const id = payload.id || `${payload.from}->${payload.to}`;
    const newEdge: Edge = {
      id, from: payload.from, to: payload.to, type: payload.type || 'REFERENCE', weight: payload.weight || 1, status: 'pending',
      data: { ...payload.data, layer: 'user' }
    };
    this.bufferEdges.set(id, newEdge);
    this.incrementTxn();
    return this.getSnapshot();
  }

  private mutateMoveNode(payload: any): CanvasState {
    const node = this.findNode(payload.nodeId);
    if (node) {
      const buffered = this.bufferNodes.get(node.id) || { ...node };
      buffered.position = { x: payload.target.x, y: payload.target.y };
      this.bufferNodes.set(node.id, buffered);
      this.markDirty(node.id);
    }
    return this.getSnapshot();
  }

  private mutateDeleteNode(payload: { id: string}): CanvasState {
    const node = this.findNode(payload.id);
    this.incrementTxn();
    const path = node ? this.normalizePath(node.filePath || (node.data && (node.data.filePath || node.data.file))) : "";
    
    if (node) {
        this.bufferNodes.delete(node.id);
        this.deletedNodeIds.add(node.id);
        this.dirtyNodeIds.delete(node.id);
        if (node.filePath) {
            const normPath = this.normalizePath(node.filePath);
            if (normPath) this.deletedPaths.add(normPath);
        }
    }
    this.deletedNodeIds.add(payload.id);
    if (path) this.deletedPaths.add(path);
    return this.getSnapshot();
  }

  private mutateDeleteEdge(payload: any): CanvasState {
    this.bufferEdges.delete(`${payload.from}->${payload.to}`);
    this.incrementTxn();
    return this.getSnapshot();
  }

  private mutateUpdateEdge(payload: any): CanvasState {
    const id = payload.id || `${payload.from}->${payload.to}`;
    const edge = this.bufferEdges.get(payload.id) || this.bufferEdges.get(id);
    if (edge && payload.updates) {
        const updated = { ...edge, ...payload.updates };
        if (payload.updates.data) updated.data = { ...edge.data, ...payload.updates.data };
        this.bufferEdges.set(id, updated);
        this.incrementTxn();
    }
    return this.getSnapshot();
  }

  private mutateUngroup(payload: any): CanvasState {
    const nodes = Array.from(this.bufferNodes.values()).filter(n => n.cluster_id === payload.clusterId);
    nodes.forEach(n => {
        const buffered = this.bufferNodes.get(n.id) || { ...n };
        buffered.cluster_id = "";
        this.bufferNodes.set(n.id, buffered);
        this.markDirty(n.id);
    });
    this.bufferClusters.delete(payload.clusterId);
    this.incrementTxn();
    return this.getSnapshot();
  }

  private mutateUpdateNode(payload: any): CanvasState {
    const node = this.findNode(payload.id);
    if (node) {
      const buffered = this.bufferNodes.get(node.id) || { ...node };
      if (payload.updates.position !== undefined) buffered.position = payload.updates.position;
      if (payload.updates.cluster_id !== undefined) buffered.cluster_id = payload.updates.cluster_id;
      if (payload.updates.layer !== undefined) {
          buffered.layer = payload.updates.layer;
          buffered.data = { ...buffered.data, layer: payload.updates.layer };
      }
      if (payload.updates.status !== undefined) buffered.status = payload.updates.status;
      if (payload.updates.data) buffered.data = { ...buffered.data, ...payload.updates.data };
      this.bufferNodes.set(node.id, buffered);
      this.markDirty(node.id);
    }
    return this.getSnapshot();
  }

  private commitTransaction(payload: any): CanvasState {
      const cluster: any = {
          nodes: Array.from(this.bufferNodes.values()),
          edges: Array.from(this.bufferEdges.values()),
          clusters: Array.from(this.bufferClusters.values())
      };
      if (commitManager.commitCluster(cluster).success) {
          this.bufferNodes.clear(); this.bufferEdges.clear(); this.bufferClusters.clear();
          this.dirtyNodeIds.clear();
      }
      return this.getSnapshot();
  }

  private generateMergedState(options: { raw: boolean }): any {
    const coreSnap = graphModel.createSnapshot();
    const deDupMap = new Map<string, Node>();
    const getEffectivePath = (n: Node): string => {
        return n.filePath || (n.data && (n.data.file || n.data.filePath)) || "";
    };

    // 1. Collect all candidates
    const allCandidates = [...coreSnap.nodes, ...Array.from(this.bufferNodes.values())];
    
    // 2. Build path-to-ID mapping for de-duplication and edge routing
    const pathToIdMap = new Map<string, string>();
    allCandidates.forEach(n => {
        const fullPath = getEffectivePath(n);
        const normalized = this.normalizePath(fullPath);
        const isDraft = n.id.startsWith('node_manual_');
        
        if (normalized) {
            // Priority: Manual Drafts > Core Nodes (Physical truth)
            if (isDraft || !pathToIdMap.has(normalized)) {
                pathToIdMap.set(normalized, n.id);
            }
            
            // [v0.3.21] Heal Slugs: Also index by basename as a fallback for corrupted legacy states
            const stem = path.basename(normalized, path.extname(normalized));
            if (stem && !pathToIdMap.has(stem)) {
                pathToIdMap.set(stem, n.id);
            }
        }
    });

    // 3. De-duplicate candidates (Authoritative: Buffer > Core)
    // We process Buffer first so they occupy the Map, preventing stale Core data from overwriting them.
    const sortedCandidates = [...Array.from(this.bufferNodes.values()), ...coreSnap.nodes];
    sortedCandidates.forEach(n => {
        const path = this.normalizePath(getEffectivePath(n));
        const key = path || n.id;
        if (!deDupMap.has(key)) {
            deDupMap.set(key, n);
        } else if (n.id.startsWith('node_manual_')) {
            // Special Case: If a manual draft exists, it ALWAYS wins regardless of path collisions
            deDupMap.set(key, n);
        }
    });

    // 4. Calculate Degrees
    const degrees: Record<string, number> = {};
    const allEdges = [...coreSnap.edges, ...Array.from(this.bufferEdges.values())];
    allEdges.forEach(e => {
        const realFrom = pathToIdMap.get(this.normalizePath(e.from)) || e.from;
        const realTo = pathToIdMap.get(this.normalizePath(e.to)) || e.to;
        degrees[realFrom] = (degrees[realFrom] || 0) + 1;
        degrees[realTo] = (degrees[realTo] || 0) + 1;
    });

    const finalNodes: Record<string, Node> = {};
    let userCount = 0; let aiCount = 0;

    // 5. Zen Classification Loop
    deDupMap.forEach((n, key) => {
        const pathRef = this.normalizePath(getEffectivePath(n));
        const resolvedId = (pathRef && pathToIdMap.get(pathRef)) || n.id;
        
        // [v0.3.13 Emergency Purge] Clean up nodes from ignored paths (node_modules, dist, etc.)
        const ruleEngine = RuleEngine.getInstance();
        const fullRelPath = getEffectivePath(n);
        if (fullRelPath) {
            const pathParts = fullRelPath.split(/[\\/]/);
            const isIgnored = ruleEngine.shouldIgnoreFile(fullRelPath) || 
                              pathParts.some(part => ruleEngine.shouldIgnoreFolder(part));
            
            if (isIgnored) {
                // If it was already in the buffer, we might want to also remove it from deleted tracking to be clean
                return; 
            }
        }

        if (this.deletedNodeIds.has(n.id) || (pathRef && this.deletedPaths.has(pathRef))) return;
        
        // 🧬 Zen Sovereignty Engine (v0.3.12)
        const isExternal = n.filePath && (n.filePath.startsWith('external://') || n.filePath.startsWith('ghost://'));
        const isDraft = n.id.startsWith('node_manual_');
        const isDoc = n.type === 'documentation' || 
                      n.filePath?.endsWith('.md') ||
                      n.filePath?.toLowerCase().includes('mile_stone') ||
                      n.filePath?.toLowerCase().includes('release_note') ||
                      n.filePath?.toLowerCase().includes('milestone') ||
                      n.filePath?.toLowerCase().includes('v0.');
        const hasAtomic = !!(n.data && n.data.hasAtomicSignature);
        const hasImport = !!(n.data && n.data.hasImportSignature);
        
        // 🛡️ Strict Anchor: Only manual user-defined clusters act as anchors.
        // System clusters (buffer, reserved) are destinations, not sources of sovereignty.
        const isSystemCluster = n.cluster_id?.startsWith('sys_') || n.cluster_id === 'cluster_ghosts' || n.cluster_id === 'doc_shelf' || n.cluster_id === "";
        const isInUserCluster = n.cluster_id && !n.cluster_id.startsWith('folder_') && !isSystemCluster;

        let finalLayer: Layer = 'ai';
        let finalStatus = n.status || 'active';
        let finalClusterId = n.cluster_id || "";

        // 🏛️ Master Pivot
        if (hasAtomic || isDraft || isInUserCluster || isDoc) {
            finalLayer = 'user';
            finalStatus = 'active'; 
            
            if (isDoc) {
                finalClusterId = 'doc_shelf';
            } else if (hasAtomic && hasImport) {
                finalClusterId = 'sys_cluster_reserved';
            } else if (hasAtomic) {
                finalClusterId = 'sys_cluster_buffer';
            } else {
                finalClusterId = isInUserCluster ? (n.cluster_id || "") : 'sys_cluster_buffer';
            }
        } else {
            // AI / Base Logic Domain
            finalLayer = 'ai';
            const isOnDisk = isExternal || coreSnap.nodes.some(cn => cn.filePath === (n.filePath || n.id) || cn.id === n.id);
            const parentFolder = this.extractParentFolderName(n.filePath);

            if (isExternal) {
                finalClusterId = 'cluster_ghosts';
            } else if (!isOnDisk) {
                finalStatus = 'ghost';
                finalClusterId = 'sys_cluster_buffer';
            } else if (parentFolder) {
                finalClusterId = `folder_${parentFolder}`;
            } else {
                finalClusterId = ""; // Project Root
            }
        }

        const degree = degrees[resolvedId] || 0;
        const visualMeta = n.visual || { opacity: 1, scale: 1, visible: true };
        const dataMeta = { 
            ...n.data, 
            layer: finalLayer, status: finalStatus, cluster_id: finalClusterId, 
            degree, hasAtomicSignature: hasAtomic, hasImportSignature: hasImport,
            isUserCreated: (finalLayer === 'user'),
            hiddenOnCanvas: isDoc,
            opacity: visualMeta.opacity || 1, scale: visualMeta.scale || 1
        };

        const finalId = (finalLayer === 'user' && isDraft) ? n.id : resolvedId;
        finalNodes[finalId] = {
            ...n, id: finalId, cluster_id: finalClusterId, status: finalStatus as any,
            layer: finalLayer, data: dataMeta, visual: visualMeta,
            position: n.position || { x: 0, y: 0 }
        };

        if (finalLayer === 'user') userCount++; else aiCount++;
    });

    const finalEdges: Record<string, Edge> = {};
    allEdges.forEach(e => {
        const realFrom = pathToIdMap.get(this.normalizePath(e.from)) || e.from;
        const realTo = pathToIdMap.get(this.normalizePath(e.to)) || e.to;
        if (!finalNodes[realFrom] || !finalNodes[realTo]) return;
        const id = e.id || `${realFrom}->${realTo}`;
        finalEdges[id] = { ...e, id, from: realFrom, to: realTo };
    });

    const clusterMap = new Map<string, any>();
    [...coreSnap.clusters, ...Array.from(this.bufferClusters.values())].forEach(c => {
        if (c.id !== 'sys_cluster_root') clusterMap.set(c.id, c);
    });

    Object.values(finalNodes).forEach(n => {
        if (n.cluster_id && !clusterMap.has(n.cluster_id)) {
            const isFolder = n.cluster_id.startsWith('folder_');
            const isGhostCluster = (n.cluster_id === 'cluster_ghosts');
            if (isFolder || isGhostCluster) {
                clusterMap.set(n.cluster_id, {
                    id: n.cluster_id,
                    label: isGhostCluster ? '👻 External Ghosts' : `📂 ${n.cluster_id.replace('folder_', '')}`,
                    type: 'folder', position: { x: 0, y: 0 }, data: { layer: 'ai' }
                });
            }
        }
    });

    const systemIds = ['sys_cluster_buffer', 'sys_cluster_reserved', 'cluster_ghosts'];
    const systemLabels: Record<string, string> = { 'sys_cluster_buffer': 'Buffer Cluster', 'sys_cluster_reserved': 'Reserved Cluster', 'cluster_ghosts': '👻 External Ghosts' };
    systemIds.forEach(id => {
        if (!clusterMap.has(id)) {
            const layer = (id === 'sys_cluster_buffer') ? 'user' : 'ai';
            clusterMap.set(id, { id, label: systemLabels[id], type: 'system', position: { x: 0, y: 0 }, data: { layer } });
        }
    });

    const finalClusters = Array.from(clusterMap.values()).filter(c => {
        // [v0.3.21.2] SSoT Preservation: System clusters (buffer, reserved, ghosts, doc_shelf)
        // must ALWAYS be preserved to prevent flickering and bundling NaN errors,
        // even if they are currently empty.
        if (c.id.startsWith('sys_') || c.id === 'cluster_ghosts' || c.id === 'doc_shelf') {
            return true;
        }
        return true; // We also preserve folders for now to avoid layout jumps
    });

    return { nodes: finalNodes, edges: finalEdges, clusters: finalClusters, deletedNodeIds: Array.from(this.deletedNodeIds), deletedPaths: Array.from(this.deletedPaths), userCount, aiCount };
  }

  /**
   * [v0.3.21] 원본 그래프 상태 반환 (투영 전)
   * 디스크 저장이나 전체 데이터 전송에 사용
   */
  public getBaseSnapshot(): GraphSnapshot {
    const merged = this.generateMergedState({ raw: false });
    return {
      nodes: Object.values(merged.nodes),
      edges: Object.values(merged.edges),
      clusters: merged.clusters,
      timestamp: Date.now()
    };
  }

  public getSnapshot(): CanvasState {
    const merged = this.generateMergedState({ raw: false });
    const draftSnap: GraphSnapshot = {
        nodes: Object.values(merged.nodes),
        edges: Object.values(merged.edges),
        clusters: merged.clusters,
        timestamp: Date.now()
    };

    const resolution = this.activeScopeId ? ProjectionResolution.FUNCTION : ProjectionResolution.FILE;
    const viewSnap = projectionLayer.project(draftSnap, resolution);

    const finalNodes: Record<string, Node> = {};
    const seenPaths = new Set<string>();
    const deletedNodeReasons: Record<string, string> = {};

    // Populate explicit manual deletions
    this.deletedNodeIds.forEach(id => {
        deletedNodeReasons[id] = "manual_deletion";
    });

    let realUserCount = 0;
    let realAiCount = 0;

    viewSnap.nodes.forEach(n => {
        const pathRef = this.normalizePath(n.filePath || n.id);
        const isUserDirty = this.dirtyNodeIds.has(n.id);
        const isUserFlag = (n.data && n.data.isUserCreated);
        
        if (pathRef && pathRef.length > 0 && n.layer !== 'user' && !isUserDirty && !isUserFlag) {
            if (seenPaths.has(pathRef)) return;
            seenPaths.add(pathRef);
        }
        
        const layer = n.layer || (isUserFlag ? 'user' : 'ai');
        if (layer === 'user') realUserCount++; else realAiCount++;

        // 🛡️ Final Senior Guard: Ensure every projected node has vital visual props
        const finalVisual = n.visual || { opacity: 1, scale: 1, visible: true };
        finalNodes[n.id] = { 
            ...n, 
            visual: finalVisual,
            data: { 
                ...n.data, 
                layer, 
                isScoped: n.id === this.activeScopeId,
                opacity: finalVisual.opacity || 1,
                scale: finalVisual.scale || 1,
                isSovereign: n.data?.isSovereign || (layer === 'user')
            } 
        };
    });

    return {
        nodes: finalNodes,
        edges: Object.fromEntries(viewSnap.edges.map(e => [e.id, e])),
        clusters: viewSnap.clusters,
        cluster_flows: viewSnap.cluster_flows, // [v0.3.21] Heatmap Flow Data
        deletedNodeIds: Array.from(this.deletedNodeIds),
        deletedNodeReasons, // 📡 GC Signal Optimization
        deletedPaths: merged.deletedPaths,
        userCount: realUserCount,
        aiCount: realAiCount
    };
  }

  public getRawSnapshot(): CanvasState {
    return this.generateMergedState({ raw: true });
  }

  public load(state: any) {
    if (!state) return;
    this.bufferNodes.clear(); this.bufferEdges.clear(); this.bufferClusters.clear();
    this.deletedNodeIds.clear(); this.deletedPaths.clear(); this.dirtyNodeIds.clear();

    if (state.deletedNodeIds) state.deletedNodeIds.forEach((id: string) => this.deletedNodeIds.add(id));
    if (state.deletedPaths) state.deletedPaths.forEach((p: string) => this.deletedPaths.add(this.normalizePath(p)));

    const nodes = Array.isArray(state.nodes) ? state.nodes : Object.values(state.nodes || {});
    nodes.forEach((n: any) => {
        const path = n.filePath || (n.data && (n.data.filePath || n.data.file));
        const resolvedPath = this.normalizePath(path);
        if (this.deletedNodeIds.has(n.id) || (resolvedPath && this.deletedPaths.has(resolvedPath))) return;
        this.bufferNodes.set(n.id, { ...n });
    });

    const edges = Array.isArray(state.edges) ? state.edges : Object.values(state.edges || {});
    edges.forEach((e: any) => {
        const id = e.id || `${e.from}->${e.to}`;
        this.bufferEdges.set(id, { ...e });
    });

    const clusters = Array.isArray(state.clusters) ? state.clusters : Object.values(state.clusters || {});
    clusters.forEach((c: any) => {
        if (c.id !== 'sys_cluster_root') this.bufferClusters.set(c.id, { ...c });
    });
  }

  public mergeFromScan(scanState: any) {
    if (!scanState || !scanState.nodes) return;
    const coreSnap = graphModel.createSnapshot();
    const scanNodes = Array.isArray(scanState.nodes) ? scanState.nodes : Object.values(scanState.nodes);
    let finalCoreNodes = [...coreSnap.nodes];

    scanNodes.forEach((sn: any) => {
      const snPath = this.normalizePath(sn.filePath || (sn.data && (sn.data.file || sn.data.filePath)) || "");
      const existingIdx = finalCoreNodes.findIndex(n => n.filePath && this.normalizePath(n.filePath) === snPath);
      if (existingIdx !== -1) {
        if (finalCoreNodes[existingIdx].layer === 'user' || this.dirtyNodeIds.has(finalCoreNodes[existingIdx].id)) return;
        finalCoreNodes[existingIdx] = { ...finalCoreNodes[existingIdx], ...sn, layer: 'ai' };
      } else if (snPath && !this.deletedPaths.has(snPath)) {
        finalCoreNodes.push({ ...sn, layer: 'ai' });
      }
    });

    graphModel.loadFrom({ ...scanState, nodes: finalCoreNodes, clusters: coreSnap.clusters });
  }
}
