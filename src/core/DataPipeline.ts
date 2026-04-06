import * as path from 'path';
import { FileScanner, CodeSummary } from './FileScanner';
import { phaseManager, Phase } from './PhaseManager';
import { graphModel, Node, Edge, NodeType, EdgeType, GraphModel } from './GraphModel';
import { canvasEngine } from './canvas-engine/CanvasEngine';

/**
 * 🌊 SYNAPSE Data Pipeline (v0.3.1)
 * 
 * 코드 또는 CDP 데이터를 그래프 형태의 Node와 Edge로 변환한다.
 * Phase 0 (DATA) 및 Phase 1 (GRAPH) 담당.
 */

export class DataPipeline {
  private scanner = new FileScanner();

  /**
   * 전체적인 데이터 처리 흐름 실행
   * @param files 분석할 파일 목록
   */
  public processFiles(files: string[]): Node[] {
    try {
      // 1. DATA 수집 시작 (Phase 0)
      phaseManager.assertPhase(Phase.DATA);
      console.log(`[SYNAPSE] Processing ${files.length} files...`);

      const summaries: { filePath: string; summary: CodeSummary }[] = [];
      for (const file of files) {
        const summary = this.scanner.scanFile(file);
        summaries.push({ filePath: file, summary });
      }

      // DATA 수집 완료 -> Phase 전이
      phaseManager.advancePhase(Phase.GRAPH);

      // 2. GRAPH 생성 시작 (Phase 1)
      phaseManager.assertPhase(Phase.GRAPH);
      graphModel.reset();

      this.constructGraph(summaries);

      return Array.from(graphModel.createSnapshot().nodes);
    } catch (e: any) {
      phaseManager.lockSystem(`DATA_PIPELINE FAILURE: ${e.message}`);
      throw e;
    }
  }

  private constructGraph(summaries: { filePath: string; summary: CodeSummary }[]) {
    // 0. Initialize standard clusters
    canvasEngine.dispatch('ADD_CLUSTER', { id: 'cluster_root', label: '🏠 Project Root', type: 'system' });
    canvasEngine.dispatch('ADD_CLUSTER', { id: 'cluster_ghosts', label: '👻 External Ghosts', type: 'system' });
    canvasEngine.dispatch('ADD_CLUSTER', { id: 'doc_shelf', label: '📚 Documentation Shelf', type: 'system', collapsed: true });

    // 1. Create all primary nodes
    const nodeIds = new Set<string>();
    const clusterIds = new Set<string>();

    for (const item of summaries) {
      const fileName = path.basename(item.filePath, path.extname(item.filePath));
      const relPath = path.dirname(item.filePath);
      
      // Determine Cluster ID based on Folder Structure
      let clusterId = 'cluster_root';
      const fName = fileName.toLowerCase();
      const isDoc = item.filePath.endsWith('.md') || fName.includes('report') || fName.startsWith('session_') || item.filePath.includes('.synapse_contexts');

      if (isDoc) {
        clusterId = 'doc_shelf';
      } else if (relPath && relPath !== '.' && relPath !== '/' && !path.isAbsolute(relPath)) {
        // Deep Folder Support (Sanitized)
        const parts = relPath.split(/[\\/]/).filter(p => p && p !== '.' && p !== '..');
        
        if (parts.length > 0) {
            let currentPath = '';
            for (const part of parts) {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                const currentSlug = `cluster_${currentPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
                if (!clusterIds.has(currentSlug)) {
                    canvasEngine.dispatch('ADD_CLUSTER', { 
                        id: currentSlug, 
                        label: `📂 ${part}`, 
                        type: 'folder' 
                    });
                    clusterIds.add(currentSlug);
                }
            }
            clusterId = `cluster_${currentPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
        }
      }

      const newNode: Node = {
        id: fileName,
        filePath: item.filePath,
        type: isDoc ? NodeType.DOCUMENTATION : NodeType.FILE,
        label: fileName,
        cluster_id: clusterId,
        degree: 0,
        data: { 
            label: fileName, 
            file: item.filePath, 
            cluster_id: clusterId,
            hiddenOnCanvas: isDoc // [v0.3.10] Mark for canvas exclusion
        }
      };
      
      nodeIds.add(fileName);
      canvasEngine.dispatch('ADD_NODE', newNode);
    }

    // 2. Analyze references and create edges + ghosts
    for (const item of summaries) {
      const fileName = path.basename(item.filePath, path.extname(item.filePath));
      
      for (const ref of item.summary.references) {
        const targetNodeId = ref.target;
        
        // Ensure Target exists, if not, create a GHOST node
        if (!nodeIds.has(targetNodeId)) {
          // [v0.3.10] Strict Ghost Filtering: Skip reports, commands, and common external libraries
          const lowerId = targetNodeId.toLowerCase();
          const ghostBlacklist = [
            'os', 'sys', 'math', 'json', 'datetime', 'sqlite3', 'pandas', 'rich', 'numpy',
            'command', 'snap_', 'test_doc', 'untitled', 'request', 'urllib'
          ];
          
          const isBlacklisted = ghostBlacklist.some(b => lowerId === b || lowerId.startsWith(b + ':') || lowerId.startsWith(b + '.'));
          const isInvalidGhost = isBlacklisted || 
                                 targetNodeId.includes(':') ||
                                 targetNodeId.includes('/') ||
                                 targetNodeId.length < 2;

          if (isInvalidGhost) continue;

          const isExternal = ref.type === 'api_call' || !targetNodeId.includes('.');
          const ghostId = targetNodeId;
          const ghostNode: Node = {
            id: ghostId,
            filePath: `external://${ghostId}`,
            type: isExternal ? NodeType.EXTERNAL : NodeType.SYMBOL,
            label: ghostId,
            cluster_id: 'cluster_ghosts',
            status: 'ghost' as any,
            degree: 0,
            data: { label: ghostId, cluster_id: 'cluster_ghosts' }
          };
          canvasEngine.dispatch('ADD_NODE', ghostNode);
          nodeIds.add(ghostId);
        }

        // Edge Weight
        let weight = GraphModel.WEIGHT_UTILITY;
        if (ref.type === 'dependency') weight = GraphModel.WEIGHT_DIRECT_INCLUDE;
        else if (ref.type === 'api_call') weight = GraphModel.WEIGHT_INTERNAL;
        
        const newEdge: Edge = {
          from: fileName,
          to: targetNodeId,
          type: this.mapEdgeType(ref.type),
          weight: weight
        };

        canvasEngine.dispatch('CONNECT_EDGE', newEdge);
      }
    }
  }

  private mapEdgeType(rawType: string): EdgeType {
    switch (rawType) {
      case 'dependency': return EdgeType.INCLUDE;
      case 'api_call': return EdgeType.CALL;
      case 'static_unidirectional': return EdgeType.STATIC;
      default: return EdgeType.REFERENCE;
    }
  }
}

export const dataPipeline = new DataPipeline();
