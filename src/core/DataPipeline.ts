import * as path from 'path';
import { FileScanner, CodeSummary } from './FileScanner';
import { phaseManager, Phase } from './PhaseManager';
import { graphModel, Node, Edge, Cluster, NodeType, EdgeType, GraphModel } from './GraphModel';
import { canvasEngine } from './canvas-engine/CanvasEngine';
import { RuleEngine } from './RuleEngine';

/**
 * 🌊 SYNAPSE Data Pipeline (v0.3.1)
 * 
 * 코드 또는 CDP 데이터를 그래프 형태의 Node와 Edge로 변환한다.
 * Phase 0 (DATA) 및 Phase 1 (GRAPH) 담당.
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
      // 1. DATA 수집 시작 (Phase 0)
      phaseManager.assertPhase(Phase.DATA);
      console.log(`[SYNAPSE] Processing ${files.length} files... Root: ${projectRoot || 'CWD'}`);

      const summaries: { filePath: string; summary: CodeSummary }[] = [];
      for (const file of files) {
        const absolutePath = projectRoot ? (path.isAbsolute(file) ? file : path.join(projectRoot, file)) : file;
        const summary = this.scanner.scanFile(absolutePath);
        summaries.push({ filePath: file, summary });
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
      { id: 'cluster_ghosts', label: '☁️ External Ghosts', type: 'system' },
      { id: 'sys_cluster_reserved', label: '🛡️ Reserved (Internal Pending)', type: 'system' },
      { id: 'doc_shelf', label: '📚 Documentation Shelf', type: 'system', collapsed: false }
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
                        type: 'folder' 
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
        degree: 0,
        data: { 
          label: fileName, 
          file: item.filePath, 
          cluster_id: clusterId,
          icon: isDoc ? '📚' : (item.summary.hasAtomicSignature ? '⚡' : '📄'),
          hiddenOnCanvas: isDoc,
          hasAtomicSignature: !!item.summary.hasAtomicSignature,
          hasImportSignature: !!item.summary.hasImportSignature
        }
      };
      
      nodes.push(newNode);
      nodeIds.add(item.filePath);
    }

    // 2. Analyze references and create edges + ghosts
    for (const item of summaries) {
      const fileName = path.basename(item.filePath, path.extname(item.filePath));
      
      for (const ref of item.summary.references) {
        let targetNodeId = ref.target;
        
        // [v0.3.14] Intelligent Resolution: Try to link to active nodes with extensions if name matches
        if (!nodeIds.has(targetNodeId)) {
          const lowerTarget = targetNodeId.toLowerCase();
          const matchedId = Array.from(nodeIds).find(id => {
            const nodeStem = path.basename(id, path.extname(id)).toLowerCase();
            const targetStem = path.basename(targetNodeId, path.extname(targetNodeId)).toLowerCase();
            const supportedExtensions = ['.ts', '.js', '.py', '.tsx', '.jsx', '.rs', '.cpp', '.h', '.c', '.hpp', '.cc'];
            return nodeStem === targetStem && supportedExtensions.some(ext => id.toLowerCase().endsWith(ext));
          });
          if (matchedId) {
            targetNodeId = matchedId; // Re-route to existing active node
          }
        }

        if (!nodeIds.has(targetNodeId)) {
          const lowerId = targetNodeId.toLowerCase();
          const ghostBlacklist = [
            'os', 'sys', 'math', 'json', 'datetime', 'sqlite3', 'pandas', 'rich', 'numpy',
            'command', 'snap_', 'test_doc', 'untitled', 'request', 'urllib', 'vscode', 'path', 'fs', 'http', 'https'
          ];
          
          const isBlacklisted = ghostBlacklist.some(b => lowerId === b || lowerId.startsWith(b + ':') || lowerId.startsWith(b + '.'));
          
          // [v0.3.14 Fix] Check RuleEngine to prevent blacklisted/excluded files from becoming ghosts
          const isRuleIgnored = RuleEngine.getInstance().shouldIgnoreFile(targetNodeId);

          const isInvalidGhost = isBlacklisted || 
                                 isRuleIgnored ||
                                 targetNodeId.includes(':') ||
                                 targetNodeId.length < 2;

          if (isInvalidGhost) continue;

          // [v0.3.14] Semantic Routing Logic
          const isDocRef = targetNodeId.toLowerCase().endsWith('.md') || 
                           targetNodeId.toLowerCase().includes('release_note') || 
                           targetNodeId.toLowerCase().includes('mile_stone') ||
                           targetNodeId.toLowerCase().includes('milestone') ||
                           targetNodeId.toLowerCase().includes('v0.');
          
          // isExternal: No extension usually means a library or module
          const isExternal = ref.type === 'api_call' || !targetNodeId.includes('.');
          
          // Routing to specific clusters
          let ghostClusterId = 'cluster_ghosts';
          if (isDocRef) {
            ghostClusterId = 'doc_shelf';
          } else if (!isExternal) {
            // Missing internal file with extension -> Isolated for cleanup
            ghostClusterId = 'sys_cluster_reserved';
          }
          
          const ghostId = targetNodeId;
          const ghostNode: Node = {
            id: ghostId,
            filePath: isExternal ? `external://${ghostId}` : `ghost://${ghostId}`,
            type: isDocRef ? NodeType.DOCUMENTATION : (isExternal ? NodeType.EXTERNAL : NodeType.SYMBOL),
            label: ghostId,
            cluster_id: ghostClusterId,
            status: 'ghost' as any,
            degree: 0,
            data: { 
              label: ghostId, 
              cluster_id: ghostClusterId,
              icon: isDocRef ? '📚' : (isExternal ? '☁️' : '👻'),
              hiddenOnCanvas: isDocRef // [v0.3.14] Follow doc_shelf visibility rule
            }
          };
          nodes.push(ghostNode);
          nodeIds.add(ghostId);
        }

        let weight = GraphModel.WEIGHT_UTILITY;
        if (ref.type === 'dependency') weight = GraphModel.WEIGHT_DIRECT_INCLUDE;
        else if (ref.type === 'api_call') weight = GraphModel.WEIGHT_INTERNAL;
        
        const newEdge: Edge = {
          from: item.filePath,
          to: targetNodeId,
          type: this.mapEdgeType(ref.type),
          weight: weight,
          status: 'confirmed'
        };

        edges.push(newEdge);
      }
    }

    return { nodes, edges, clusters };
  }

  private mapEdgeType(rawType: string): EdgeType {
    switch (rawType) {
      case 'dependency': return EdgeType.INCLUDE;
      case 'api_call': return EdgeType.CALL;
      case 'db_query': return EdgeType.DB_QUERY;
      case 'data_flow': return EdgeType.DATA_FLOW;
      case 'event': return EdgeType.EVENT;
      case 'conditional': return EdgeType.CONDITIONAL;
      case 'loop_back': return EdgeType.LOOP_BACK;
      case 'static_unidirectional': return EdgeType.STATIC;
      default: return EdgeType.REFERENCE;
    }
  }
}

export const dataPipeline = new DataPipeline();
