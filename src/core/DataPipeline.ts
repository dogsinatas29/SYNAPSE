import * as crypto from 'crypto';
import * as path from 'path';
import { Logger } from '../utils/Logger';
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
  metaEdges?: any[]; // [Phase 2B.13] Edge Bundle Data
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
        for (const item of summaries) {
          for (const cls of item.summary.classes) {
            if (cls) symbolIndex.addSymbol(item.filePath, cls);
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

    interface DirNode {
        name: string;
        path: string;
        children: Map<string, DirNode>;
        files: number;
        semanticPath: string[];
    }
    
    const rootDir: DirNode = { name: 'root', path: '', children: new Map(), files: 0, semanticPath: [] };
    let diagnosticOutput = '';
    
    // Pass 1: Build directory tree
    for (const item of summaries) {
      const fileName = path.basename(item.filePath, path.extname(item.filePath));
      const isContextVault = item.filePath.includes('.synapse_contexts') || fileName.startsWith('session_');
      if (isContextVault) continue;

      const fName = fileName.toLowerCase();
      const isDoc = item.filePath.endsWith('.md') || fName.includes('report') || fName.startsWith('session_') || item.filePath.includes('.synapse_contexts') || item.filePath.toLowerCase().includes('mile_stone') || item.filePath.toLowerCase().includes('release_note') || item.filePath.toLowerCase().includes('milestone');
      if (isDoc) continue;

      const relPath = path.dirname(item.filePath);
      if (relPath && relPath !== '.' && relPath !== '/' && !path.isAbsolute(relPath)) {
        const rawParts = relPath.split(/[\\/]/).filter(p => p && p !== '.' && p !== '..');
        const boilerplate = new Set(['src', 'main', 'test', 'java', 'kotlin', 'androidTest', 'resources', 'assets']);
        const parts = rawParts.filter(p => !boilerplate.has(p));
        
        let curr = rootDir;
        for (const p of parts) {
            if (!curr.children.has(p)) {
                curr.children.set(p, { name: p, path: curr.path ? `${curr.path}/${p}` : p, children: new Map(), files: 0, semanticPath: [] });
            }
            curr = curr.children.get(p)!;
        }
        curr.files++;
      }
    }

    // Pass 2: Compute semantic paths (Branch Compression)
    const branchCompressionLog: string[] = [];
    function computeSemanticPaths(node: DirNode, currentPath: string[]) {
        const isPassthrough = node.children.size === 1 && node.files === 0 && node.name !== 'root';
        let nextPath = [...currentPath];
        
        if (!isPassthrough && node.name !== 'root') {
            nextPath.push(node.name);
            if (node.children.size === 1 && node.files === 0) {
               // This means we were passthrough, but wait... 
               // The logic above is: if we ARE passthrough, we don't push.
            }
        }
        
        node.semanticPath = nextPath;
        if (node.files > 0 || node.children.size > 1) {
             branchCompressionLog.push(`${node.path} -> ${nextPath.join('/') || 'root'}`);
        }
        
        for (const child of node.children.values()) {
            computeSemanticPaths(child, nextPath);
        }
    }
    computeSemanticPaths(rootDir, []);

    // Phase 2B.7a: Root Namespace Discovery
    const packageFrequencies = new Map<string, number>();
    let totalPackages = 0;
    for (const item of summaries) {
      if (item.summary && item.summary.package) {
          packageFrequencies.set(item.summary.package, (packageFrequencies.get(item.summary.package) || 0) + 1);
          totalPackages++;
      }
    }
    
    let internalNamespace = '';
    if (totalPackages > 0) {
        const prefixFrequencies = new Map<string, number>();
        for (const [pkg, count] of packageFrequencies.entries()) {
            const segments = pkg.split('.');
            let currentPrefix = '';
            for (const seg of segments) {
                currentPrefix = currentPrefix ? `${currentPrefix}.${seg}` : seg;
                prefixFrequencies.set(currentPrefix, (prefixFrequencies.get(currentPrefix) || 0) + count);
            }
        }
        
        let bestPrefix = '';
        let maxScore = -1;
        for (const [prefix, count] of prefixFrequencies.entries()) {
            if (count >= totalPackages * 0.5) { // Covers at least 50%
                if (prefix.length > maxScore) {
                    maxScore = prefix.length;
                    bestPrefix = prefix;
                }
            }
        }
        internalNamespace = bestPrefix;
    }
    diagnosticOutput += `=== NAMESPACE DISCOVERY ===\n`;
    diagnosticOutput += `Internal Namespace: ${internalNamespace || 'NOT_FOUND'}\n\n`;

    // Pass 3: Create primary nodes
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
        const rawParts = relPath.split(/[\\/]/).filter(p => p && p !== '.' && p !== '..');
        const boilerplate = new Set(['src', 'main', 'test', 'java', 'kotlin', 'androidTest', 'resources', 'assets']);
        const parts = rawParts.filter(p => !boilerplate.has(p));
        
        let curr = rootDir;
        for (const p of parts) {
            curr = curr.children.get(p) || curr;
        }
        
        // [v0.3.32.3] Subclustering: Increase MAX_CLUSTER_DEPTH to break down giant blobs like app_de_antennapod
        const MAX_CLUSTER_DEPTH = 4;
        const depthCappedParts = curr.semanticPath.slice(0, MAX_CLUSTER_DEPTH);
        
        let continent = curr.semanticPath[0] || 'root';
        let subcontinent = curr.semanticPath.slice(0, 2).join('/') || continent;
        
        if (depthCappedParts.length > 0) {
            let currentPath = '';
            for (const part of depthCappedParts) {
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
                        data: { continent, subcontinent }
                    });
                    clusterIds.add(currentSlug);
                }
            }
            clusterId = `cluster_${currentPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
        }
      }
      
      let nodeContinent = 'doc';
      let nodeSubcontinent = 'doc';
      if (!isDoc) {
          const rawParts = relPath.split(/[\\/]/).filter(p => p && p !== '.' && p !== '..');
          const boilerplate = new Set(['src', 'main', 'test', 'java', 'kotlin', 'androidTest', 'resources', 'assets']);
          const parts = rawParts.filter(p => !boilerplate.has(p));
          let curr = rootDir;
          for (const p of parts) curr = curr.children.get(p) || curr;
          nodeContinent = curr.semanticPath[0] || 'root';
          nodeSubcontinent = curr.semanticPath.slice(0, 2).join('/') || nodeContinent;
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
          hasImportSignature: !!item.summary.hasImportSignature,
          continent: nodeContinent,
          subcontinent: nodeSubcontinent,
          continent_type: 'INTERNAL'
        },
        intelligence: {},
        visual: { opacity: 1.0 }
      };
      
      nodes.push(newNode);
      nodeIds.add(item.filePath);
      
      // [USER_DEBUG] Node Creation Log
      if (item.filePath.includes('test_network') || item.filePath.includes('TEST_network')) {
        console.log(`[NODE] ID=${newNode.id} | PATH=${newNode.filePath} | LABEL=${newNode.label}`);
      }
    }

    // === [v0.3.32.2] Initial Spread removed (Moved to post-ghost processing) ===


    // 2. Analyze references and create edges + ghosts
    let symbolResolvedCount = 0;
    let unresolvedCount = 0;
    let totalReferencesFound = 0;
    let fallbackMatchedCount = 0;
    let packageFilteredCount = 0;
    let exactFilteredCount = 0;
    const edgeTypeCount = new Map<string, number>();

    for (const item of summaries) {
      for (const ref of item.summary.references) {
        if (!ref.target) continue;

        // [v0.3.32.2] GhostRule System: Early Pruning
        let isBlacklisted = false;
        const ghostRules = {
            packagePrefix: [
                'android.', 'androidx.', 'java.', 'javax.', 'kotlin.', 'kotlinx.collections.', 'kotlinx.atomicfu.', 'kotlinx.datetime.',
                'org.junit.', 'org.mockito.', 'com.bumptech.glide.', 'org.greenrobot.eventbus.', 'com.google.android.'
                // 'io.reactivex.', 'kotlinx.coroutines.' -> Optional (Meaningful architecture flows)
            ],
            exact: [
                'os', 'sys', 'math', 'json', 'datetime', 'vscode', 'path', 'fs',
                'context', 'nonnull', 'list', 'log', 'arraylist', 'nullable', 'r', 'view',
                'bundle', 'layoutinflater', 'collections', 'schedulers', 'eventbus',
                'ioexception', 'androidschedulers', 'test', 'disposable', 'date',
                'textutils', 'intent', 'locale', 'materialalertdialogbuilder', 'static',
                'string', 'object'
            ]
        };

        if ((ref as any).fullPath) {
            const lowerFullPath = (ref as any).fullPath.toLowerCase();
            if (ghostRules.packagePrefix.some(prefix => lowerFullPath.startsWith(prefix))) {
                isBlacklisted = true;
                packageFilteredCount++;
            }
        }

        const lowerId = ref.target.toLowerCase();
        if (!isBlacklisted && ghostRules.exact.some(b => lowerId === b || lowerId.startsWith(b + '.'))) {
            isBlacklisted = true;
            exactFilteredCount++;
        }

        if (isBlacklisted) continue;

        totalReferencesFound++;
        let targetNodeId = ref.target;
        
        // [v0.3.32.1] Resolution Debug
        const _origTarget = targetNodeId;
        const _inNodeIds = nodeIds.has(targetNodeId);
        
        if (!nodeIds.has(targetNodeId)) {
          const matchedId = Array.from(nodeIds).find(id => {
            const nodeStem = path.basename(id, path.extname(id)).toLowerCase();
            const targetStem = path.basename(targetNodeId, path.extname(targetNodeId)).toLowerCase();
            return nodeStem === targetStem;
          });
          if (matchedId) {
            targetNodeId = matchedId;
            fallbackMatchedCount++;
          } else {
            const symbolIndex = SymbolIndex.getInstance();
            const resolvedPath = symbolIndex.lookupSymbol(targetNodeId);
            if (resolvedPath) {
              targetNodeId = resolvedPath;
              symbolResolvedCount++;
            }
          }
        }

        // [v0.3.32.1] Resolution Result Debug
        if (item.filePath.includes('main.rs')) {
          console.log(`[FLOW_DEBUG] RESOLVE ${item.filePath} -> ref:${_origTarget} type:${ref.type} direct:${_inNodeIds} resolved:${targetNodeId} isNode:${nodeIds.has(targetNodeId)}`);
        }

        if (!nodeIds.has(targetNodeId)) {
          unresolvedCount++;

          // [v0.3.32.2] Diagnostic: ReferenceVerifier Detailed Failure Log
          Logger.info(`[VERIFIER_DEBUG] source=${path.basename(item.filePath)} target=${_origTarget} | directId=${_inNodeIds} | basename=${fallbackMatchedCount > 0 ? 'true' : 'false'} | symbolIndex=false | symbolIndexLookupKey=${_origTarget}`);

          // [v0.3.32.2] Ghost Aggregation Layer
          const getGhostClusterId = (cleanId: string): string => {
            const predefined = ['android', 'androidx', 'java', 'javax', 'kotlin', 'com.google', 'org.apache'];
            for (const p of predefined) {
              if (cleanId.startsWith(p + '.')) return `cluster_ghost_${p.replace(/\./g, '_')}`;
            }
            const segments = cleanId.split('.');
            if (segments.length > 1) {
              return `cluster_ghost_${segments[0]}`; // fallback to first segment
            }
            return 'cluster_ghosts';
          };

          const getOrCreateGhostCluster = (cId: string, label: string): string => {
            if (!clusterIds.has(cId)) {
              clusters.push({
                id: cId,
                label: label,
                type: 'system',
                collapsed: false,
                position: { x: 0, y: 0 },
                bounds: { x: 0, y: 0, width: 0, height: 0 },
                children: [],
                nodes: [],
                data: { layer: 'external' }
              });
              clusterIds.add(cId);
            }
            return cId;
          };

          const isDocRef = targetNodeId.toLowerCase().endsWith('.md');
          const cleanId = (ref as any).fullPath ? (ref as any).fullPath : _origTarget.replace('external://', '').replace('ghost://', '');

          let isExternal = false;
          if (ref.type === 'network_link') {
              isExternal = true;
          } else if (internalNamespace && cleanId.includes('.')) {
              isExternal = !cleanId.startsWith(internalNamespace);
          } else {
              isExternal = ref.type === 'api_call' || ref.type === 'dependency' || !targetNodeId.includes('.');
          }
          
          let ghostClusterId = isDocRef ? 'doc_shelf' : (isExternal ? getGhostClusterId(cleanId) : 'sys_cluster_reserved');
          
          if (ref.type === 'network_link') {
              ghostClusterId = 'cluster_ghost_network_remote';
              console.log(`[NETWORK_LINK] raw target = ${_origTarget}`);
              console.log(`[NETWORK_LINK] normalized = ${targetNodeId}`);
              console.log(`[NETWORK_LINK] node found = ${nodeIds.has(targetNodeId)}`);
              console.log(`[NETWORK_LINK] edge created = ${!nodeIds.has(targetNodeId) ? 'Ghost Node Fallback' : 'Direct'}`);
              console.log(`[NETWORK_LINK] ghost cluster = ${ghostClusterId}`);
          }
          
          if (isExternal && ghostClusterId !== 'doc_shelf') {
             const label = ghostClusterId === 'cluster_ghost_network_remote' 
                 ? '🌐 Remote Network / Cross-Workspace' 
                 : `☁️ External (${ghostClusterId.replace('cluster_ghost_', '')})`;
             getOrCreateGhostCluster(ghostClusterId, label);
          }

          let ghostContinent = 'unknown';
          if (isDocRef) {
              ghostContinent = 'doc';
          } else if (ghostClusterId.startsWith('cluster_ghost_')) {
              ghostContinent = ghostClusterId.replace('cluster_ghost_', '');
          } else if (ghostClusterId !== 'sys_cluster_reserved') {
              ghostContinent = ghostClusterId;
          }

          if (!nodes.find(n => n.id === targetNodeId)) {
            nodes.push({
              id: targetNodeId,
              filePath: isExternal ? `external://${targetNodeId}` : `ghost://${targetNodeId}`,
              type: isDocRef ? NodeType.DOCUMENTATION : (isExternal ? NodeType.EXTERNAL : NodeType.SYMBOL),
              label: targetNodeId.split('/').pop() || targetNodeId,
              cluster_id: ghostClusterId,
              status: 'ghost' as any,
              position: { x: 0, y: 0 },
              degree: 0,
              data: {
                label: targetNodeId,
                file: targetNodeId,
                cluster_id: ghostClusterId,
                icon: isDocRef ? '📚' : '👻',
                hiddenOnCanvas: isDocRef,
                continent: ghostContinent,
                subcontinent: ghostContinent,
                continent_type: 'EXTERNAL'
              },
              intelligence: {},
              visual: { opacity: isExternal ? 0.6 : 1.0 }
            });
            nodeIds.add(targetNodeId);
          }
        }

        const mappedType = this.mapEdgeType(ref.type);
        const newEdge: Edge = {
          id: crypto.randomUUID(),
          from: item.filePath,
          to: targetNodeId,
          type: mappedType,
          weight: 1,
          status: 'confirmed',
          is_approved: true,
          data: {},
          intelligence: {},
          visual: { color: '#888', thickness: 1 }
        };
        edges.push(newEdge);
        edgeTypeCount.set(mappedType, (edgeTypeCount.get(mappedType) || 0) + 1);
      }
    }

    // Calculate internal vs external edges
    let internalEdges = 0;
    let externalEdges = 0;
    
    // Original detailed degree calculation
    const detailedDegreeMap = new Map<string, { in: number, out: number, total: number }>();
    
    for (const edge of edges) {
      if (nodeIds.has(edge.to) && !edge.to.startsWith('external://') && !edge.to.startsWith('ghost://')) {
        const tgt = nodes.find(n => n.id === edge.to);
        if (tgt && tgt.status === 'ghost') {
          externalEdges++;
        } else {
          internalEdges++;
        }
      } else {
        externalEdges++;
      }

      if (!detailedDegreeMap.has(edge.from)) detailedDegreeMap.set(edge.from, { in: 0, out: 0, total: 0 });
      if (!detailedDegreeMap.has(edge.to)) detailedDegreeMap.set(edge.to, { in: 0, out: 0, total: 0 });
      
      detailedDegreeMap.get(edge.from)!.out++;
      detailedDegreeMap.get(edge.from)!.total++;
      detailedDegreeMap.get(edge.to)!.in++;
      detailedDegreeMap.get(edge.to)!.total++;
    }

    // Calculate cluster node counts
    const clusterNodesCount = new Map<string, number>();
    for (const node of nodes) {
      if (node.cluster_id) {
        clusterNodesCount.set(node.cluster_id, (clusterNodesCount.get(node.cluster_id) || 0) + 1);
      }
    }

    diagnosticOutput += `\n=== BRANCH COMPRESSION ===\n`;
    diagnosticOutput += branchCompressionLog.join('\n') + `\n\n`;

    diagnosticOutput += `=== CLUSTER SUMMARY ===\n`;
    for (const [cId, cCount] of Array.from(clusterNodesCount.entries()).sort((a, b) => b[1] - a[1])) {
      diagnosticOutput += `${cId.padEnd(25)} nodes=${cCount}\n`;
    }
    diagnosticOutput += `TOTAL_CLUSTERS=${clusterIds.size}\n\n`;

    diagnosticOutput += `=== EDGE SUMMARY ===\n`;
    diagnosticOutput += `Internal Edges: ${internalEdges}\n`;
    diagnosticOutput += `External/Ghost Edges: ${externalEdges}\n\n`;

    diagnosticOutput += `======================================================\n`;
    diagnosticOutput += `[PIPELINE] Nodes=${nodes.length} Edges=${edges.length}\n`;
    diagnosticOutput += `[FILTER] package_removed=${packageFilteredCount} exact_removed=${exactFilteredCount}\n`;
    diagnosticOutput += `======================================================\n`;
    diagnosticOutput += `=== EDGE BREAKDOWN ===\n`;
    for (const [type, count] of edgeTypeCount.entries()) {
      diagnosticOutput += `  - ${type}: ${count}\n`;
    }
    diagnosticOutput += `======================================================\n\n`;

    // Calculate Cluster Size Distribution
    const clusterSizes = { '1 node': 0, '2-5 nodes': 0, '6-10': 0, '11-20': 0, '20+': 0 };
    for (const [cId, cCount] of clusterNodesCount.entries()) {
       if (cCount === 1) clusterSizes['1 node']++;
       else if (cCount <= 5) clusterSizes['2-5 nodes']++;
       else if (cCount <= 10) clusterSizes['6-10']++;
       else if (cCount <= 20) clusterSizes['11-20']++;
       else clusterSizes['20+']++;
    }
    diagnosticOutput += `=== CLUSTER SIZE DISTRIBUTION ===\n`;
    diagnosticOutput += `1 node   : ${clusterSizes['1 node']} clusters\n`;
    diagnosticOutput += `2-5 nodes: ${clusterSizes['2-5 nodes']} clusters\n`;
    diagnosticOutput += `6-10     : ${clusterSizes['6-10']} clusters\n`;
    diagnosticOutput += `11-20    : ${clusterSizes['11-20']} clusters\n`;
    diagnosticOutput += `20+      : ${clusterSizes['20+']} clusters\n`;
    diagnosticOutput += `======================================================\n\n`;

    const sortedDegrees = Array.from(detailedDegreeMap.entries()).sort((a, b) => b[1].total - a[1].total);
    const top20Detailed = sortedDegrees.slice(0, 20);
    
    diagnosticOutput += `=== TOP HUB FILES ===\n`;
    let rank = 1;
    for (const [id, deg] of top20Detailed) {
      const node = nodes.find(n => n.id === id);
      const clusterId = node ? node.cluster_id : 'unknown';
      const role = node?.data?.role || 'none';
      const isExternal = id.startsWith('external://') || id.startsWith('ghost://') || node?.type === NodeType.EXTERNAL;
      diagnosticOutput += `rank=${rank++}\n`;
      diagnosticOutput += `id=${id}\n`;
      diagnosticOutput += `cluster=${clusterId}\n`;
      diagnosticOutput += `role=${role}\n`;
      diagnosticOutput += `external=${isExternal}\n`;
      diagnosticOutput += `degree=${deg.total} (in=${deg.in}, out=${deg.out})\n\n`;
    }
    diagnosticOutput += `========================\n\n`;

    // Calculate Cluster Traffic
    const clusterTraffic = new Map<string, { nodes: number, internal_edges: number, external_edges: number }>();
    for (const cid of Array.from(clusterIds)) {
      clusterTraffic.set(cid, { nodes: 0, internal_edges: 0, external_edges: 0 });
    }
    for (const n of nodes) {
        if (n.cluster_id && n.cluster_id.startsWith('cluster_ghost')) {
            if (!clusterTraffic.has(n.cluster_id)) clusterTraffic.set(n.cluster_id, { nodes: 0, internal_edges: 0, external_edges: 0 });
        }
    }

    const interClusterTraffic = new Map<string, number>();
    const ghostImpactTraffic = new Map<string, number>();
    const directionalClusterTraffic = new Map<string, number>(); // [Phase 2B.13] Meta Edges

    for (const node of nodes) {
      if (node.cluster_id && clusterTraffic.has(node.cluster_id)) {
        clusterTraffic.get(node.cluster_id)!.nodes++;
      }
    }

    let ghostEdges = 0;
    for (const edge of edges) {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      const fromCid = fromNode?.cluster_id || 'unknown';
      const toCid = toNode?.cluster_id || 'unknown';

      // Edge crossing boundary
      if (fromCid !== toCid) {
        if (clusterTraffic.has(fromCid)) {
          clusterTraffic.get(fromCid)!.external_edges++;
        }
        if (clusterTraffic.has(toCid)) {
          clusterTraffic.get(toCid)!.external_edges++;
        }
        
        if (fromCid.startsWith('cluster_ghost') || toCid.startsWith('cluster_ghost')) {
            ghostEdges++;
            const ghostCid = fromCid.startsWith('cluster_ghost') ? fromCid : toCid;
            const internalCid = fromCid.startsWith('cluster_ghost') ? toCid : fromCid;
            const key = `${ghostCid} -> ${internalCid}`;
            ghostImpactTraffic.set(key, (ghostImpactTraffic.get(key) || 0) + 1);
        } else {
            // Phase 2B.10 Tracking
            const pairKeys = [fromCid, toCid].sort();
            const key = `${pairKeys[0]} <-> ${pairKeys[1]}`;
            interClusterTraffic.set(key, (interClusterTraffic.get(key) || 0) + 1);

            // Phase 2B.13 Meta Edges
            const dirKey = `${fromCid} -> ${toCid}`;
            directionalClusterTraffic.set(dirKey, (directionalClusterTraffic.get(dirKey) || 0) + 1);
        }
      } else {
        if (clusterTraffic.has(fromCid)) {
          clusterTraffic.get(fromCid)!.internal_edges++;
        }
        if (fromCid.startsWith('cluster_ghost')) {
            ghostEdges++;
        }
      }
    }

    // Phase 2B.9A: Cluster Distribution Audit
    diagnosticOutput += `=== CLUSTER DISTRIBUTION ===\n`;
    const sortedClustersByNodes = Array.from(clusterTraffic.entries())
        .filter(([id]) => !id.startsWith('cluster_ghost'))
        .sort((a, b) => b[1].nodes - a[1].nodes).slice(0, 15);
    for (const [id, data] of sortedClustersByNodes) {
        diagnosticOutput += `${id}\n`;
        diagnosticOutput += `  nodes: ${data.nodes}\n`;
        diagnosticOutput += `  internal_edges: ${data.internal_edges}\n`;
        diagnosticOutput += `  external_edges: ${data.external_edges}\n\n`;
    }

    // Phase 2B.9: Hub Ranking
    diagnosticOutput += `=== HUB RANKING ===\n`;
    const sortedHubs = Array.from(clusterTraffic.entries())
      .map(([id, data]) => ({ id, ...data, traffic_score: data.internal_edges + data.external_edges }))
      .filter(c => !c.id.startsWith('cluster_ghost'))
      .sort((a, b) => b.traffic_score - a.traffic_score)
      .slice(0, 15);

    for (const c of sortedHubs) {
      diagnosticOutput += `${c.id}\n`;
      diagnosticOutput += `  traffic: ${c.traffic_score}\n`;
      diagnosticOutput += `  degree: ${c.external_edges}\n`;
      diagnosticOutput += `  nodes: ${c.nodes}\n\n`;
    }

    // Phase 2B.10A: Cluster Matrix
    diagnosticOutput += `=== CLUSTER MATRIX ===\n`;
    const topClusters = sortedHubs.map(c => c.id).slice(0, 10);
    diagnosticOutput += `                    ${topClusters.map(c => c.split('/').pop()?.substring(0, 9).padEnd(10) || c.substring(0, 9).padEnd(10)).join(' ')}\n`;
    for (const c1 of topClusters) {
        let row = `${c1.padEnd(19)} `;
        for (const c2 of topClusters) {
            if (c1 === c2) {
                row += `-         `;
            } else {
                const keys = [c1, c2].sort();
                const key = `${keys[0]} <-> ${keys[1]}`;
                const traffic = interClusterTraffic.get(key) || 0;
                row += `${traffic.toString().padEnd(10)}`;
            }
        }
        diagnosticOutput += `${row}\n`;
    }
    diagnosticOutput += `\n`;

    // Phase 2B.10B: Cluster Edge List
    diagnosticOutput += `=== CLUSTER EDGE LIST ===\n`;
    const sortedClusterEdges = Array.from(interClusterTraffic.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30);
    for (const [pair, traffic] of sortedClusterEdges) {
        const [c1, c2] = pair.split(' <-> ');
        diagnosticOutput += `${c1.padEnd(20)} ──(${traffic})── ${c2}\n`;
    }
    diagnosticOutput += `\n`;

    const ghostRatio = edges.length > 0 ? (ghostEdges / edges.length) * 100 : 0;
    let ghostNodes = 0;
    for (const [cid, data] of clusterTraffic.entries()) {
        if (cid.startsWith('cluster_ghost')) ghostNodes += data.nodes;
    }

    // Phase 2B.10C: Ghost Impact Matrix
    diagnosticOutput += `=== GHOST IMPACT MATRIX ===\n`;
    const sortedGhostImpact = Array.from(ghostImpactTraffic.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);
    for (const [key, traffic] of sortedGhostImpact) {
        const [ghost, internal] = key.split(' -> ');
        diagnosticOutput += `${ghost.padEnd(25)} -> ${internal.padEnd(35)} = ${traffic}\n`;
    }
    diagnosticOutput += `\n`;

    diagnosticOutput += `=== GHOST TRAFFIC ===\n`;
    diagnosticOutput += `ghost_nodes=${ghostNodes}\n`;
    diagnosticOutput += `ghost_edges=${ghostEdges}\n`;
    diagnosticOutput += `ghost_ratio=${ghostRatio.toFixed(1)}%\n\n`;

    // [v0.3.32.3] CONTINENT DIAGNOSTICS
    const continentNodes = new Map<string, number>();
    const continentClusters = new Map<string, Set<string>>();
    const subcontinentNodes = new Map<string, number>();
    const subcontinentClusters = new Map<string, Set<string>>();
    const continentTypes = new Map<string, string>(); // 'INTERNAL' or 'EXTERNAL'

    for (const node of nodes) {
       const cont = node.data?.continent || 'unknown';
       const sub = node.data?.subcontinent || 'unknown';
       
       continentNodes.set(cont, (continentNodes.get(cont) || 0) + 1);
       if (!continentClusters.has(cont)) continentClusters.set(cont, new Set());
       if (node.cluster_id) continentClusters.get(cont)!.add(node.cluster_id);

       subcontinentNodes.set(sub, (subcontinentNodes.get(sub) || 0) + 1);
       if (!subcontinentClusters.has(sub)) subcontinentClusters.set(sub, new Set());
       if (node.cluster_id) subcontinentClusters.get(sub)!.add(node.cluster_id);

       continentTypes.set(cont, node.data?.continent_type || 'INTERNAL');
    }

    const continentTrafficObj = new Map<string, { internal: number, external: number }>();
    const interContinentTraffic = new Map<string, number>();

    for (const edge of edges) {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      const fromCont = fromNode?.data?.continent || 'unknown';
      const toCont = toNode?.data?.continent || 'unknown';

      if (!continentTrafficObj.has(fromCont)) continentTrafficObj.set(fromCont, { internal: 0, external: 0 });
      if (!continentTrafficObj.has(toCont)) continentTrafficObj.set(toCont, { internal: 0, external: 0 });

      if (fromCont === toCont) {
         continentTrafficObj.get(fromCont)!.internal++;
      } else {
         continentTrafficObj.get(fromCont)!.external++;
         continentTrafficObj.get(toCont)!.external++;

         // Inter-continent traffic
         const pairKeys = [fromCont, toCont].sort();
         const key = `${pairKeys[0]} <-> ${pairKeys[1]}`;
         interContinentTraffic.set(key, (interContinentTraffic.get(key) || 0) + 1);
      }
    }

    diagnosticOutput += `=== INTERNAL CONTINENTS ===\n`;
    const sortedContinents = Array.from(continentNodes.entries()).sort((a, b) => b[1] - a[1]);
    for (const [cont, nodeCount] of sortedContinents) {
       if (continentTypes.get(cont) === 'INTERNAL') {
           diagnosticOutput += `${cont.padEnd(15)} nodes=${nodeCount} clusters=${continentClusters.get(cont)?.size || 0}\n`;
       }
    }
    diagnosticOutput += `\n`;

    diagnosticOutput += `=== EXTERNAL CONTINENTS ===\n`;
    for (const [cont, nodeCount] of sortedContinents) {
       if (continentTypes.get(cont) === 'EXTERNAL') {
           diagnosticOutput += `${cont.padEnd(15)} nodes=${nodeCount} clusters=${continentClusters.get(cont)?.size || 0}\n`;
       }
    }
    diagnosticOutput += `\n`;

    diagnosticOutput += `=== TOP CONTINENT PAIRS ===\n`;
    const sortedInterTraffic = Array.from(interContinentTraffic.entries()).sort((a, b) => b[1] - a[1]);
    for (const [pair, rawTraffic] of sortedInterTraffic.slice(0, 15)) {
       diagnosticOutput += `${pair.padEnd(30)} ${rawTraffic}\n`;
    }
    diagnosticOutput += `\n`;

    diagnosticOutput += `=== CONTINENT MATRIX ===\n`;
    const topInternal = sortedContinents.filter(([c]) => continentTypes.get(c) === 'INTERNAL').slice(0, 8).map(([c]) => c);
    diagnosticOutput += `            ${topInternal.map(c => c.padEnd(10)).join(' ')}\n`;
    for (const c1 of topInternal) {
        let row = `${c1.padEnd(11)} `;
        for (const c2 of topInternal) {
            if (c1 === c2) {
                row += `-         `;
            } else {
                const keys = [c1, c2].sort();
                const key = `${keys[0]} <-> ${keys[1]}`;
                const traffic = interContinentTraffic.get(key) || 0;
                row += `${traffic.toString().padEnd(10)}`;
            }
        }
        diagnosticOutput += `${row}\n`;
    }
    diagnosticOutput += `\n`;

    diagnosticOutput += `=== CONTINENT GRAPH (Top 20 Edges) ===\n`;
    for (const [pair, rawTraffic] of sortedInterTraffic.slice(0, 20)) {
       const [contA, contB] = pair.split(' <-> ');
       diagnosticOutput += `${contA} ──(${rawTraffic})── ${contB}\n`;
    }
    diagnosticOutput += `\n`;
    
    // [Moved to the end to include layout diagnostics]

    Logger.info(`[FLOW_DEBUG] symbol resolved ${symbolResolvedCount} unresolved ${unresolvedCount}`);
    Logger.info(`[FLOW_DEBUG] pipeline exit nodes ${nodes.length} edges ${edges.length}`);

    // [v0.3.32.2 Fix] Phase 2B.5-A: Continent Meta Layout (4-Tier Architecture)
    const NODE_SPACING_X = 80;
    const NODE_SPACING_Y = 50;
    
    // 1. Group nodes by cluster
    const clusterNodes = new Map<string, Node[]>();
    for (const n of nodes) {
      const cid = n.cluster_id || '__unclustered__';
      if (!clusterNodes.has(cid)) clusterNodes.set(cid, []);
      clusterNodes.get(cid)!.push(n);
    }
    
    const activeClusterIds = new Set(clusterNodes.keys());
    const activeClusters = clusters.filter(c => activeClusterIds.has(c.id));
    
    // [v0.3.32.4] Fix: Unclustered nodes are skipped by layout because '__unclustered__' is not in clusters list
    if (activeClusterIds.has('__unclustered__') && !clusters.find(c => c.id === '__unclustered__')) {
        const rootCluster: Cluster = {
            id: '__unclustered__',
            label: '📁 Root',
            type: 'folder',
            collapsed: false,
            position: { x: 0, y: 0 },
            bounds: { x: 0, y: 0, width: 0, height: 0 },
            children: [],
            nodes: [],
            data: { continent: 'root', subcontinent: 'root' }
        };
        activeClusters.push(rootCluster);
        clusters.push(rootCluster);
    }
    
    type ClusterWithBBox = Cluster & { estWidth: number, estHeight: number, area: number, nodeCount: number, localX?: number, localY?: number };
    const continentMap = new Map<string, {
        id: string,
        clusters: ClusterWithBBox[],
        nodeCount: number,
        edgeCount: number,
        hubTraffic: number,
        weight: number,
        estWidth: number,
        estHeight: number,
        centerX: number,
        centerY: number
    }>();

    // 2. Prepare clusters and group by continent
    for (const c of activeClusters) {
       const count = clusterNodes.get(c.id)?.length || 1;
       const cols = Math.ceil(Math.sqrt(count));
       const rows = Math.ceil(count / cols);
       
       const gridWidth = cols * NODE_SPACING_X + 150; 
       const labelWidth = c.label ? c.label.length * 15 + 150 : 200; 
       const estWidth = Math.max(gridWidth, labelWidth);
       const estHeight = Math.max(rows * NODE_SPACING_Y + 150, 150);
       
       const packedC: ClusterWithBBox = {
           ...c, estWidth, estHeight, area: estWidth * estHeight, nodeCount: count
       };

       const cont = c.data?.continent || 'unknown';
       if (!continentMap.has(cont)) {
           continentMap.set(cont, {
               id: cont, clusters: [], nodeCount: 0, edgeCount: 0, hubTraffic: 0, weight: 0, estWidth: 0, estHeight: 0, centerX: 0, centerY: 0
           });
       }
       continentMap.get(cont)!.clusters.push(packedC);
    }

    // 3. Continent Packing (Local Cluster Packing)
    for (const [cont, data] of continentMap.entries()) {
        const traffic = continentTrafficObj.get(cont) || { internal: 0, external: 0 };
        data.nodeCount = continentNodes.get(cont) || 0;
        data.edgeCount = traffic.internal + traffic.external;
        data.hubTraffic = traffic.external;
        // Continent Weight Formula
        data.weight = data.nodeCount * 0.3 + data.edgeCount * 0.4 + data.hubTraffic * 0.3;

        // Sort clusters inside continent by Subcontinent, then Area
        data.clusters.sort((a, b) => {
            const subA = a.data?.subcontinent || '';
            const subB = b.data?.subcontinent || '';
            if (subA !== subB) return subA.localeCompare(subB);
            return b.area - a.area;
        });

        // Flow Bin Pack clusters locally to form the Continent BBox
        let currentX = 0;
        let currentY = 0;
        let rowMaxHeight = 0;
        let maxW = 0;
        
        const totalClusterArea = data.clusters.reduce((sum, c) => sum + c.area, 0);
        const dynamicClusterGap = Math.max(Math.sqrt(totalClusterArea) * 0.15, 200); // Dynamic gap between clusters
        const idealWidth = Math.max(Math.sqrt(totalClusterArea) * 1.5, 1000); // Make continent slightly wider than tall

        for (const c of data.clusters) {
            if (currentX + c.estWidth > idealWidth && currentX > 0) {
                currentX = 0;
                currentY += rowMaxHeight + dynamicClusterGap;
                rowMaxHeight = 0;
            }
            c.localX = currentX + c.estWidth / 2;
            c.localY = currentY + c.estHeight / 2;
            
            currentX += c.estWidth + dynamicClusterGap;
            rowMaxHeight = Math.max(rowMaxHeight, c.estHeight);
            maxW = Math.max(maxW, currentX - dynamicClusterGap);
        }
        
        const dynamicContinentGap = Math.max(Math.sqrt(totalClusterArea) * 0.6, 1000);
        data.estWidth = maxW + dynamicContinentGap;
        data.estHeight = currentY + rowMaxHeight + dynamicContinentGap;

        // Phase 2B.11: Cluster Force Layout (within each continent)
        const cNodes = data.clusters;
        const ITERATIONS = 150;
        const SPRING_K = 0.05; 
        const REPULSION_K = 100000; 

        for (let iter = 0; iter < ITERATIONS; iter++) {
            const forces = new Map<string, { fx: number, fy: number }>();
            for (const c of cNodes) forces.set(c.id, { fx: 0, fy: 0 });

            for (let i = 0; i < cNodes.length; i++) {
                for (let j = i + 1; j < cNodes.length; j++) {
                    const c1 = cNodes[i];
                    const c2 = cNodes[j];
                    const dx = c1.localX! - c2.localX!;
                    const dy = c1.localY! - c2.localY!;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < 1) dist = 1;
                    
                    const min_dist = (c1.estWidth + c2.estWidth) / 2 + 100;

                    if (dist < min_dist) {
                        const overlap = min_dist - dist;
                        const force = overlap * 1.5; 
                        const fx = (dx / dist) * force;
                        const fy = (dy / dist) * force;
                        forces.get(c1.id)!.fx += fx;
                        forces.get(c1.id)!.fy += fy;
                        forces.get(c2.id)!.fx -= fx;
                        forces.get(c2.id)!.fy -= fy;
                    } else {
                        const force = REPULSION_K / (dist * dist);
                        const fx = (dx / dist) * force;
                        const fy = (dy / dist) * force;
                        forces.get(c1.id)!.fx += fx;
                        forces.get(c1.id)!.fy += fy;
                        forces.get(c2.id)!.fx -= fx;
                        forces.get(c2.id)!.fy -= fy;
                    }
                }
            }

            for (let i = 0; i < cNodes.length; i++) {
                for (let j = i + 1; j < cNodes.length; j++) {
                    const c1 = cNodes[i];
                    const c2 = cNodes[j];
                    const keys = [c1.id, c2.id].sort();
                    const key = `${keys[0]} <-> ${keys[1]}`;
                    const traffic = interClusterTraffic.get(key) || 0;
                    
                    if (traffic > 0) {
                        const dx = c2.localX! - c1.localX!;
                        const dy = c2.localY! - c1.localY!;
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        if (dist < 1) dist = 1;
                        
                        const force = Math.log(traffic + 1) * SPRING_K * dist; 
                        const fx = (dx / dist) * force;
                        const fy = (dy / dist) * force;
                        
                        forces.get(c1.id)!.fx += fx;
                        forces.get(c1.id)!.fy += fy;
                        forces.get(c2.id)!.fx -= fx;
                        forces.get(c2.id)!.fy -= fy;
                    }
                }
            }

            for (const c of cNodes) {
                const f = forces.get(c.id)!;
                const maxV = 100;
                f.fx = Math.max(-maxV, Math.min(maxV, f.fx));
                f.fy = Math.max(-maxV, Math.min(maxV, f.fy));
                c.localX! += f.fx;
                c.localY! += f.fy;
            }
        }

        // Re-center after force layout
        if (cNodes.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const c of cNodes) {
                minX = Math.min(minX, c.localX! - c.estWidth / 2);
                minY = Math.min(minY, c.localY! - c.estHeight / 2);
                maxX = Math.max(maxX, c.localX! + c.estWidth / 2);
                maxY = Math.max(maxY, c.localY! + c.estHeight / 2);
            }
            for (const c of cNodes) {
                c.localX! -= minX;
                c.localY! -= minY;
            }
            data.estWidth = (maxX - minX) + dynamicContinentGap;
            data.estHeight = (maxY - minY) + dynamicContinentGap;
        }
    }

    // 4. World Packing (Global Continent Packing)
    const sortedContinentsArr = Array.from(continentMap.values()).sort((a, b) => b.weight - a.weight);
    
    let worldX = 0;
    let worldY = 0;
    let worldRowMaxHeight = 0;
    const MAX_WORLD_WIDTH = 12000;

    for (const cont of sortedContinentsArr) {
        if (worldX + cont.estWidth > MAX_WORLD_WIDTH && worldX > 0) {
            worldX = 0;
            worldY += worldRowMaxHeight;
            worldRowMaxHeight = 0;
        }
        
        cont.centerX = worldX + cont.estWidth / 2;
        cont.centerY = worldY + cont.estHeight / 2;

        // Map cluster absolute positions
        for (const c of cont.clusters) {
            c.position = {
                x: worldX + c.localX!,
                y: worldY + c.localY!
            };
            const originalC = clusters.find(orig => orig.id === c.id);
            if (originalC) {
                originalC.position = { ...c.position };
            }
        }

        worldX += cont.estWidth;
        worldRowMaxHeight = Math.max(worldRowMaxHeight, cont.estHeight);
    }

    // 5. Place Nodes inside Clusters
    for (const cont of sortedContinentsArr) {
        for (const c of cont.clusters) {
            const cNodes = clusterNodes.get(c.id) || [];
            const cols = Math.ceil(Math.sqrt(cNodes.length));
            const rows = Math.ceil(cNodes.length / cols);
            
            const cx = c.position!.x;
            const cy = c.position!.y;
            
            for (let i = 0; i < cNodes.length; i++) {
                const n = cNodes[i];
                const col = i % cols;
                const row = Math.floor(i / cols);
                
                if (n.position) {
                    n.position.x = cx + (col - (cols - 1) / 2) * NODE_SPACING_X;
                    n.position.y = cy + (row - (rows - 1) / 2) * NODE_SPACING_Y;
                }
            }
        }
    }
    
    // 6. Layout Diagnostics
    diagnosticOutput += `=== CONTINENT LAYOUT ===\n`;
    for (const cont of sortedContinentsArr) {
        diagnosticOutput += `${cont.id}\n`;
        diagnosticOutput += `  clusters: ${cont.clusters.length}\n`;
        diagnosticOutput += `  nodes: ${cont.nodeCount}\n`;
        diagnosticOutput += `  weight: ${cont.weight.toFixed(1)}\n`;
        diagnosticOutput += `  bbox: ${Math.round(cont.estWidth)}x${Math.round(cont.estHeight)}\n`;
        diagnosticOutput += `  center: (${Math.round(cont.centerX)}, ${Math.round(cont.centerY)})\n\n`;
    }

    diagnosticOutput += `\n=== CONTINENT DISTANCE ===\n`;
    const distanceList: { pair: string, dist: number }[] = [];
    for (let i = 0; i < sortedContinentsArr.length; i++) {
        for (let j = i + 1; j < sortedContinentsArr.length; j++) {
            const a = sortedContinentsArr[i];
            const b = sortedContinentsArr[j];
            const dx = a.centerX - b.centerX;
            const dy = a.centerY - b.centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            distanceList.push({
                pair: `${a.id} <-> ${b.id}`,
                dist
            });
        }
    }
    distanceList.sort((a, b) => a.dist - b.dist).slice(0, 20).forEach(d => {
        diagnosticOutput += `${d.pair} = ${Math.round(d.dist)}\n`;
    });
    diagnosticOutput += `\n`;

    // Phase 2B.12: CLUSTER CENTROIDS
    diagnosticOutput += `=== CLUSTER CENTROIDS ===\n`;
    const centroidTopClusters = [...clusters].filter(c => c.type !== 'system' && c.id !== 'doc_shelf')
        .sort((a, b) => (clusterNodes.get(b.id)?.length || 0) - (clusterNodes.get(a.id)?.length || 0))
        .slice(0, 15);
        
    for (const c of centroidTopClusters) {
        const cNodes = clusterNodes.get(c.id) || [];
        if (cNodes.length === 0) continue;
        
        let sumX = 0, sumY = 0;
        let validNodes = 0;
        for (const n of cNodes) {
            if (n.position) {
                sumX += n.position.x;
                sumY += n.position.y;
                validNodes++;
            }
        }
        const nodeCenterX = validNodes > 0 ? sumX / validNodes : 0;
        const nodeCenterY = validNodes > 0 ? sumY / validNodes : 0;
        
        diagnosticOutput += `${c.id}\n`;
        diagnosticOutput += `bbox_center=(${Math.round(c.position!.x)}, ${Math.round(c.position!.y)})\n`;
        diagnosticOutput += `node_center=(${Math.round(nodeCenterX)}, ${Math.round(nodeCenterY)})\n`;
        diagnosticOutput += `node_count=${cNodes.length}\n\n`;
    }

    // Filter `clusters` to only active ones
    clusters.splice(0, clusters.length, ...activeClusters);

    // === [v0.3.33] Phase 4: Label Propagation Algorithm (Community Detection) ===
    Logger.info(`[FLOW_DEBUG] Running Label Propagation Community Detection...`);
    const lpaLabels = new Map<string, string>();
    const neighbors = new Map<string, string[]>();
    
    // Initialize labels & neighbors
    const validNodes = nodes.filter(n => n.type === NodeType.FILE || n.type === NodeType.SYMBOL);
    for (const n of validNodes) {
        lpaLabels.set(n.id, n.id);
        neighbors.set(n.id, []);
    }
    
    // Build undirected adjacency list for LPA
    for (const e of edges) {
        if (neighbors.has(e.from) && neighbors.has(e.to)) {
            neighbors.get(e.from)!.push(e.to);
            neighbors.get(e.to)!.push(e.from);
        }
    }
    
    // Run LPA for up to 5 iterations
    for (let iter = 0; iter < 5; iter++) {
        let changed = false;
        // Randomize node order
        const nodeIds = Array.from(lpaLabels.keys()).sort(() => Math.random() - 0.5);
        
        for (const id of nodeIds) {
            const currentLabel = lpaLabels.get(id)!;
            const neighborLabels = neighbors.get(id)!.map(nId => lpaLabels.get(nId)!);
            if (neighborLabels.length === 0) continue;
            
            // Find most frequent neighbor label
            const counts = new Map<string, number>();
            let maxCount = 0;
            let bestLabel = currentLabel;
            
            for (const nl of neighborLabels) {
                const count = (counts.get(nl) || 0) + 1;
                counts.set(nl, count);
                if (count > maxCount) {
                    maxCount = count;
                    bestLabel = nl;
                } else if (count === maxCount && Math.random() < 0.5) {
                    bestLabel = nl; // Break ties randomly
                }
            }
            
            if (bestLabel !== currentLabel) {
                lpaLabels.set(id, bestLabel);
                changed = true;
            }
        }
        if (!changed) break;
    }
    
    // Rebuild Clusters based on LPA (Downgraded)
    const communityMap = new Map<string, string[]>();
    for (const [nId, cLabel] of lpaLabels.entries()) {
        if (!communityMap.has(cLabel)) communityMap.set(cLabel, []);
        communityMap.get(cLabel)!.push(nId);
    }
    
    let commIdx = 1;
    for (const [cLabel, memberIds] of communityMap.entries()) {
        if (memberIds.length < 2) continue; // Skip single-node communities
        const commClusterId = `community_${commIdx++}`;
        
        // Update nodes: ONLY add as community_label
        for (const mId of memberIds) {
            const n = nodes.find(n => n.id === mId);
            if (n && n.data) {
                n.data.community_label = commClusterId;
            }
        }
    }
    Logger.info(`[FLOW_DEBUG] Generated ${commIdx - 1} functional communities via LPA (Saved as community_label)`);

    // [v0.3.32.2] Diagnostic: Cluster Bounds & Overlaps
    Logger.info(`\n=== [DIAGNOSTIC] CLUSTER BOUNDS ===`);
    let overlapCount = 0;
    const allPackedClusters: ClusterWithBBox[] = [];
    for (const cont of sortedContinentsArr) {
        allPackedClusters.push(...cont.clusters);
    }

    for (let i = 0; i < allPackedClusters.length; i++) {
        const c1 = allPackedClusters[i];
        
        // Compute actual BBox from nodes
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        const c1Nodes = clusterNodes.get(c1.id) || [];
        for (const n of c1Nodes) {
            if (n.position) {
                minX = Math.min(minX, n.position.x);
                maxX = Math.max(maxX, n.position.x);
                minY = Math.min(minY, n.position.y);
                maxY = Math.max(maxY, n.position.y);
            }
        }
        
        // Actual BBox (with 200px padding for rendering)
        const actualWidth = maxX === -Infinity ? 200 : (maxX - minX) + 200;
        const actualHeight = maxY === -Infinity ? 200 : (maxY - minY) + 200;
        const actualCenterX = minX === -Infinity ? c1.position!.x : minX + (maxX - minX) / 2;
        const actualCenterY = minY === -Infinity ? c1.position!.y : minY + (maxY - minY) / 2;
        
        Logger.info(`\n=== [CLUSTER] ===`);
        Logger.info(`id=${c1.id}`);
        Logger.info(`nodes=${c1.nodeCount}`);
        Logger.info(`estimated_w=${c1.estWidth}`);
        Logger.info(`estimated_h=${c1.estHeight}`);
        Logger.info(`actual_w=${actualWidth.toFixed(0)}`);
        Logger.info(`actual_h=${actualHeight.toFixed(0)}`);
        Logger.info(`center=(${actualCenterX.toFixed(0)},${actualCenterY.toFixed(0)})`);
        
        const density = c1.nodeCount / (actualWidth * actualHeight || 1);
        Logger.info(`density=${density.toFixed(6)}`);
        
        // Overlap detection using ACTUAL bounds (what is actually rendered)
        for (let j = i + 1; j < allPackedClusters.length; j++) {
            const c2 = allPackedClusters[j];
            
            let c2MinX = Infinity, c2MaxX = -Infinity, c2MinY = Infinity, c2MaxY = -Infinity;
            const c2Nodes = clusterNodes.get(c2.id) || [];
            for (const n of c2Nodes) {
                if (n.position) {
                    c2MinX = Math.min(c2MinX, n.position.x);
                    c2MaxX = Math.max(c2MaxX, n.position.x);
                    c2MinY = Math.min(c2MinY, n.position.y);
                    c2MaxY = Math.max(c2MaxY, n.position.y);
                }
            }
            const c2ActualWidth = c2MaxX === -Infinity ? 200 : (c2MaxX - c2MinX) + 200;
            const c2ActualHeight = c2MaxY === -Infinity ? 200 : (c2MaxY - c2MinY) + 200;
            const c2ActualCenterX = c2MinX === -Infinity ? c2.position!.x : c2MinX + (c2MaxX - c2MinX) / 2;
            const c2ActualCenterY = c2MinY === -Infinity ? c2.position!.y : c2MinY + (c2MaxY - c2MinY) / 2;
            
            const dx = Math.abs(actualCenterX - c2ActualCenterX);
            const dy = Math.abs(actualCenterY - c2ActualCenterY);
            
            // Checking intersection
            if (dx < (actualWidth + c2ActualWidth) / 2 && dy < (actualHeight + c2ActualHeight) / 2) {
                const overlapX = (actualWidth + c2ActualWidth) / 2 - dx;
                const overlapY = (actualHeight + c2ActualHeight) / 2 - dy;
                const overlapArea = overlapX * overlapY;
                Logger.info(`[OVERLAP] ${c1.id} ↔ ${c2.id} area=${overlapArea.toFixed(0)}`);
                overlapCount++;
            }
        }
    }
    
    // [v0.3.32.2] World Bounds & Diagnostic Logging
    let globalMinX = Infinity, globalMinY = Infinity, globalMaxX = -Infinity, globalMaxY = -Infinity;
    nodes.forEach(n => {
        if (n.position) {
            globalMinX = Math.min(globalMinX, n.position.x);
            globalMinY = Math.min(globalMinY, n.position.y);
            globalMaxX = Math.max(globalMaxX, n.position.x);
            globalMaxY = Math.max(globalMaxY, n.position.y);
        }
    });
    
    Logger.info(`\n=== [LAYOUT] ===`);
    Logger.info(`[LAYOUT] cluster_count=${allPackedClusters.length}`);
    Logger.info(`[LAYOUT] overlap_pairs=${overlapCount / 2}`);
    Logger.info(`[LAYOUT] world_bounds=min(${globalMinX.toFixed(0)}, ${globalMinY.toFixed(0)}) max(${globalMaxX.toFixed(0)}, ${globalMaxY.toFixed(0)})`);
    Logger.info(`[LAYOUT] world_width=${Math.abs(globalMaxX - globalMinX).toFixed(0)}`);
    Logger.info(`[LAYOUT] world_height=${Math.abs(globalMaxY - globalMinY).toFixed(0)}`);
    Logger.info(`================\n`);

    Logger.info(`\n=== [RENDER DIAGNOSTIC] NODE DUMP ===`);
    for (let i = 0; i < Math.min(10, nodes.length); i++) {
        const n = nodes[i];
        Logger.info(`NODE ${n.id} | cluster=${n.cluster_id} | comm=${n.data?.community_label || 'none'} | role=${n.data?.role || 'none'}`);
    }
    
    Logger.info(`\n=== [RENDER DIAGNOSTIC] CLUSTER DUMP ===`);
    for (const c of clusters) {
        Logger.info(`CLUSTER id=${c.id} type=${c.type} nodes=${c.nodes.length} (computed count=${clusterNodes.get(c.id)?.length || 0})`);
    }
    Logger.info(`=========================================\n`);
    Logger.info(diagnosticOutput);
    // Write to a file in the project root so the user can see it easily
    try {
        const fs = require('fs');
        const path = require('path');
        const vscode = require('vscode');
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            fs.writeFileSync(path.join(rootPath, 'diagnostic_log.txt'), diagnosticOutput, 'utf8');
        }
    } catch (e) {
        Logger.warn('Failed to write diagnostic_log.txt: ' + e);
    }

    // [Phase 2B.13] Generate Meta Edges
    const metaEdges: any[] = [];
    for (const [key, traffic] of Array.from(directionalClusterTraffic.entries())) {
        const [source, target] = key.split(' -> ');
        metaEdges.push({ source, target, weight: traffic });
    }

    return { nodes, edges, clusters, metaEdges };
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
