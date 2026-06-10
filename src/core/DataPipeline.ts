import * as path from 'path';
import { FileScanner, CodeSummary } from './FileScanner';
import { phaseManager, Phase } from './PhaseManager';
import { graphModel, Node, Edge, Cluster, NodeType, EdgeType, GraphModel } from './GraphModel';
import { canvasEngine } from './canvas-engine/CanvasEngine';
import { RuleEngine } from './RuleEngine';
import { SymbolIndex } from './SymbolIndex';
import { ProjectMetadata } from './ProjectMetadata';

/**
 * 🌊 SYNAPSE Data Pipeline (v0.3.30)
 * 
 * 코드 또는 CDP 데이터를 그래프 형태의 Node와 Edge로 변환한다.
 * Phase 0 (DATA) 및 Phase 1 (GRAPH) 담당.
 * 
 * [v0.3.30] SymbolIndex population integrated. Security boundary enforced via ProjectMetadata.
 */

export interface PipelineResult {
  nodes: Node[];
  edges: Edge[];
  clusters: Cluster[];
}

export class DataPipeline {
  private scanner = new FileScanner();

  /**
   * 전체적인 데이터 처리 흐름 실행 (v0.3.11: dispatch 제거, 순수 데이터 반환)
   * @param files 분석할 파일 목록
   */
  public processFiles(files: string[], projectRoot?: string): PipelineResult {
    try {
      // [v0.3.30] Security: validate all files are within project boundary
      if (projectRoot) {
        const meta = ProjectMetadata.getInstance();
        for (const file of files) {
          const absPath = path.isAbsolute(file) ? file : path.join(projectRoot, file);
          if (!meta.validatePath(absPath)) {
            throw new Error(`[v0.3.30] Security: File outside project boundary: ${file}`);
          }
        }
      }

      // 1. DATA 수집 시작 (Phase 0)
      phaseManager.assertPhase(Phase.DATA);
      console.log(`[SYNAPSE] Processing ${files.length} files... Root: ${projectRoot || 'CWD'}`);

      const summaries: { filePath: string; summary: CodeSummary }[] = [];
      for (const file of files) {
        const absolutePath = projectRoot ? (path.isAbsolute(file) ? file : path.join(projectRoot, file)) : file;
        const summary = this.scanner.scanFile(absolutePath);
        summaries.push({ filePath: file, summary });
      }

      // [v0.3.30] Populate SymbolIndex
      if (projectRoot) {
        const symbolIndex = SymbolIndex.getInstance();
        try { symbolIndex.initialize(path.basename(projectRoot), projectRoot); } catch {}
        const absoluteFiles = files.map(f => projectRoot ? (path.isAbsolute(f) ? f : path.join(projectRoot, f)) : f);
        symbolIndex.rebuildFromFiles(absoluteFiles);
        for (const item of summaries) {
          for (const fn of item.summary.functions) {
            const fnName = typeof fn === 'string' ? fn : (fn as any).name || '';
            const clsName = typeof fn === 'string' ? null : ((fn as any).className || null);
            const line = typeof fn === 'string' ? 0 : ((fn as any).line || 0);
            if (fnName) symbolIndex.addFunction(item.filePath, fnName, clsName, line);
          }
        }
      }

      // DATA 수집 완료 -> Phase 전이
      phaseManager.advancePhase(Phase.GRAPH);

      // 2. GRAPH 데이터 추출 (Phase 1)
      phaseManager.assertPhase(Phase.GRAPH);
      
      const result = this.extractGraphElements(summaries);

      return result;
    } catch (e: any) {
      phaseManager.lockSystem(`DATA_PIPELINE FAILURE: ${e.message}`);
      throw e;
    }
  }

  private extractGraphElements(summaries: { filePath: string; summary: CodeSummary }[]): PipelineResult {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const clusters: Cluster[] = [
      { id: 'cluster_ghosts', label: '☁️ External Ghosts', type: 'system', collapsed: false, position: { x: 0, y: 0 }, bounds: { x: 0, y: 0, width: 0, height: 0 }, children: [], nodes: [], data: { layer: 'external' } },
      { id: 'sys_cluster_reserved', label: '🛡️ Reserved (Internal Pending)', type: 'system', collapsed: false, position: { x: 0, y: 0 }, bounds: { x: 0, y: 0, width: 0, height: 0 }, children: [], nodes: [], data: {} },
      { id: 'doc_shelf', label: '📚 Documentation Shelf', type: 'system', collapsed: false, position: { x: 0, y: 0 }, bounds: { x: 0, y: 0, width: 0, height: 0 }, children: [], nodes: [], data: {} }
    ];

    const nodeIds = new Set<string>();
    const clusterIds = new Set<string>(['cluster_ghosts', 'sys_cluster_reserved', 'doc_shelf']);

    // 1. Create all primary nodes
    for (const item of summaries) {
      const fileName = path.basename(item.filePath, path.extname(item.filePath));
      const relPath = path.dirname(item.filePath);
      
      const isContextVault = item.filePath.includes('.synapse_contexts') || fileName.startsWith('session_');
      if (isContextVault) continue;

      let clusterId = ''; // Default: No cluster (flat)
      const fName = fileName.toLowerCase();
      const isDoc = item.filePath.endsWith('.md') || 
                    fName.includes('report') || 
                    fName.startsWith('session_') || 
                    item.filePath.includes('.synapse_contexts') ||
                    item.filePath.toLowerCase().includes('mile_stone') ||
                    item.filePath.toLowerCase().includes('release_note') ||
                    item.filePath.toLowerCase().includes('milestone');

      if (isDoc) {
        clusterId = 'doc_shelf';
      } else if (relPath && relPath !== '.' && relPath !== '/' && !path.isAbsolute(relPath)) {
        const parts = relPath.split(/[\\/]/).filter(p => p && p !== '.' && p !== '..');
        
        if (parts.length > 0) {
            let currentPath = '';
            for (const part of parts) {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                const currentSlug = `cluster_${currentPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
                if (!clusterIds.has(currentSlug)) {
                    clusters.push({ 
                        id: currentSlug, 
                        label: `📂 ${part}`, 
                        type: 'folder',
                        collapsed: false,
                        position: { x: 0, y: 0 },
                        bounds: { x: 0, y: 0, width: 0, height: 0 },
                        children: [],
                        nodes: [],
                        data: {}
                    });
                    clusterIds.add(currentSlug);
                }
            }
            clusterId = `cluster_${currentPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
        }
      }
      const newNode: Node = {
        id: item.filePath,
        filePath: item.filePath,
        type: isDoc ? NodeType.DOCUMENTATION : NodeType.FILE,
        label: fileName,
        cluster_id: clusterId,
        status: 'confirmed' as any,
        position: { x: 0, y: 0 },
        degree: 0,
        data: { 
          label: fileName, 
          file: item.filePath, 
          cluster_id: clusterId,
          icon: isDoc ? '📚' : (item.summary.hasAtomicSignature ? '⚡' : '📄'),
          hiddenOnCanvas: isDoc,
          hasAtomicSignature: !!item.summary.hasAtomicSignature,
          hasImportSignature: !!item.summary.hasImportSignature
        },
        intelligence: {},
        visual: { opacity: 1.0 }
      };
      
      nodes.push(newNode);
      nodeIds.add(item.filePath);
    }

    // === [v0.3.29] Initial Spread: Deterministic position assignment ===
    // System clusters: fixed far positions (UI getOrCreateSystemClusters may override)
    for (const sc of clusters) {
      if (sc.position) {
        if (sc.id === 'cluster_ghosts') { sc.position.x = -3000; sc.position.y = -3000; }
        else if (sc.id === 'sys_cluster_reserved') { sc.position.x = -2000; sc.position.y = -3000; }
        else if (sc.id === 'doc_shelf') { sc.position.x = 8000; sc.position.y = -3000; }
      }
    }
    // Folder clusters: circular spread with FNV-1a deterministic hash
    const folderClusters = clusters.filter((c): c is Cluster & { position: NonNullable<Cluster['position']> } => c.type === 'folder' && !!c.position);
    if (folderClusters.length > 0) {
      const BASE_RADIUS = Math.max(800, folderClusters.length * 200);
      for (let i = 0; i < folderClusters.length; i++) {
        const c = folderClusters[i];
        let hash = 0x811c9dc5;
        for (let k = 0; k < c.id.length; k++) { hash ^= c.id.charCodeAt(k); hash = Math.imul(hash, 0x01000193); }
        const baseAngle = ((hash >>> 0) % 1000) / 1000 * 2 * Math.PI;
        const angle = baseAngle + i * 2 * Math.PI / folderClusters.length;
        c.position.x = Math.cos(angle) * BASE_RADIUS;
        c.position.y = Math.sin(angle) * BASE_RADIUS;
      }
    }
    // Nodes: grid offset relative to their cluster center
    const clusterNodeCounts = new Map<string, number>();
    const clusterNodeIdx = new Map<string, number>();
    for (const n of nodes) {
      const cid = n.cluster_id || '__unclustered__';
      clusterNodeCounts.set(cid, (clusterNodeCounts.get(cid) || 0) + 1);
    }
    for (const n of nodes) {
      if (!n.position) continue;
      const cid = n.cluster_id || '__unclustered__';
      const cluster = clusters.find(c => c.id === n.cluster_id);
      const idx = clusterNodeIdx.get(cid) || 0;
      clusterNodeIdx.set(cid, idx + 1);
      const centerX = cluster?.position ? cluster.position.x : 0;
      const centerY = cluster?.position ? cluster.position.y : 0;
      const total = clusterNodeCounts.get(cid) || 1;
      const cols = Math.min(3, total);
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const rows = Math.ceil(total / cols);
      n.position.x = centerX + (col - (cols - 1) / 2) * 80;
      n.position.y = centerY + (row - rows / 2) * 50;
    }

    // 2. Analyze references and create edges + ghosts
    for (const item of summaries) {
      for (const ref of item.summary.references) {
        let targetNodeId = ref.target;
        
        if (!nodeIds.has(targetNodeId)) {
          const matchedId = Array.from(nodeIds).find(id => {
            const nodeStem = path.basename(id, path.extname(id)).toLowerCase();
            const targetStem = path.basename(targetNodeId, path.extname(targetNodeId)).toLowerCase();
            return nodeStem === targetStem;
          });
          if (matchedId) targetNodeId = matchedId;
        }

        if (!nodeIds.has(targetNodeId)) {
          const lowerId = targetNodeId.toLowerCase();
          const ghostBlacklist = ['os', 'sys', 'math', 'json', 'datetime', 'vscode', 'path', 'fs'];
          const isBlacklisted = ghostBlacklist.some(b => lowerId === b || lowerId.startsWith(b + '.'));
          if (isBlacklisted) continue;

          const isDocRef = targetNodeId.toLowerCase().endsWith('.md');
          const isExternal = ref.type === 'api_call' || !targetNodeId.includes('.');
          
          let ghostClusterId = isDocRef ? 'doc_shelf' : (isExternal ? 'cluster_ghosts' : 'sys_cluster_reserved');
          
          const ghostId = targetNodeId;
          const ghostNode: Node = {
            id: ghostId,
            filePath: isExternal ? `external://${ghostId}` : `ghost://${ghostId}`,
            type: isDocRef ? NodeType.DOCUMENTATION : (isExternal ? NodeType.EXTERNAL : NodeType.SYMBOL),
            label: ghostId,
            cluster_id: ghostClusterId,
            status: 'ghost' as any,
            position: { x: 0, y: 0 },
            degree: 0,
            data: { 
              label: ghostId, 
              cluster_id: ghostClusterId,
              icon: isDocRef ? '📚' : (isExternal ? '☁️' : '👻'),
              hiddenOnCanvas: isDocRef
            },
            intelligence: {},
            visual: { opacity: 0.5 }
          };
          nodes.push(ghostNode);
          nodeIds.add(ghostId);
        }

        const newEdge: Edge = {
          id: `edge_${item.filePath}_${targetNodeId}_${Date.now()}`,
          from: item.filePath,
          to: targetNodeId,
          type: this.mapEdgeType(ref.type),
          weight: 1,
          status: 'confirmed',
          is_approved: true,
          data: {},
          intelligence: {},
          visual: { color: '#888', thickness: 1 }
        };
        edges.push(newEdge);
      }
    }

    return { nodes, edges, clusters };
  }

  private mapEdgeType(rawType: string): any {
    switch (rawType) {
      case 'dependency': return 'INCLUDE' as any;
      case 'api_call': return 'CALL' as any;
      case 'db_query': return 'DB_QUERY' as any;
      case 'data_flow': return 'DATA_FLOW' as any;
      case 'event': return 'EVENT' as any;
      case 'conditional': return 'CONDITIONAL' as any;
      case 'loop_back': return 'LOOP_BACK' as any;
      case 'static_unidirectional': return 'STATIC' as any;
      default: return 'REFERENCE' as any;
    }
  }
}

export const dataPipeline = new DataPipeline();
