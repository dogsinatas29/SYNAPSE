import * as crypto from 'crypto';
import * as path from 'path';
import { Logger } from '../utils/Logger';
import { FileScanner, CodeSummary } from './FileScanner';
import { buildNodes, NodeBuildResult } from './NodeBuilder';
import { buildClusters, ClusterBuildResult } from './ClusterBuilder';
import { buildDirectoryTree } from './DirectoryTreeBuilder';
import { analyzeGraph, GraphAnalysis } from './GraphAnalyzer';
import { generateDiagnosticReport, DiagnosticContext } from './DiagnosticReporter';
import { generateLayoutDiagnostics } from './LayoutDiagnosticReporter';
import { generateBoundsDiagnostics } from './BoundsDiagnosticReporter';
import { applyLayout, LayoutInput, LayoutResult, ClusterWithBBox, NODE_SPACING_X, NODE_SPACING_Y } from './LayoutEngine';
import { detectCommunities } from './CommunityDetector';
import { GhostPolicy } from './GhostPolicy';
import { ReferenceResolver } from './ReferenceResolver';
import { GhostExpander } from './GhostExpander';
import { GhostClassifier } from './GhostClassifier';
import { EdgeBuilder } from './EdgeBuilder';
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
  public async processFiles(files: string[], projectRoot?: string): Promise<PipelineResult> {
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
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const absolutePath = projectRoot ? (path.isAbsolute(file) ? file : path.join(projectRoot, file)) : file;
        const summary = this.scanner.scanFile(absolutePath);
        summaries.push({ filePath: file, summary });

        // [v0.3.33.1] Prevent Extension Host freezing by yielding to the event loop
        if (i % 100 === 0) {
            await new Promise(resolve => setImmediate(resolve));
        }
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
      
      const result = this.extractGraphElements(summaries, projectRoot);

      return result;
    } catch (e: any) {
      phaseManager.lockSystem(`DATA_PIPELINE FAILURE: ${e.message}`);
      throw e;
    }
  }

  private extractGraphElements(summaries: { filePath: string; summary: CodeSummary }[], projectRoot?: string): PipelineResult {
    console.time('[PIPELINE] TOTAL');
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const clusters: Cluster[] = [];
    const clusterIds = new Set<string>();
    let diagnosticOutput = '';

    // [v0.3.32.4] NodeBuilder: Build nodes first (cluster_id computed internally)
    const directoryTree = buildDirectoryTree(summaries);
    const nodeResult = buildNodes(summaries, directoryTree);
    for (const node of nodeResult.nodes) nodes.push(node);
    const nodeIds = nodeResult.nodeIds;
    const internalNamespace = nodeResult.internalNamespace;

    // [v0.3.32.4] ClusterBuilder: Build clusters from nodes
    console.time('[PIPELINE] buildClusters');
    const clusterResult = buildClusters(nodeResult.nodes);
    console.timeEnd('[PIPELINE] buildClusters');
    for (const cluster of clusterResult.clusters) clusters.push(cluster);
    clusterResult.clusterIds.forEach(id => clusterIds.add(id));


    // 2. Analyze references and create edges + ghosts
    let symbolResolvedCount = 0;
    let unresolvedCount = 0;
    let totalReferencesFound = 0;
    let fallbackMatchedCount = 0;
    let packageFilteredCount = 0;
    let exactFilteredCount = 0;
    const edgeTypeCount = new Map<string, number>();

      console.error('[PIPELINE] Starting GhostPolicy.filter, summaries=', summaries.length);
      // [v0.3.32.2] GhostRule System: Early Pruning (Extracted to GhostPolicy)
      const policyResult = GhostPolicy.filter(summaries);
      packageFilteredCount = policyResult.packageFilteredCount;
      exactFilteredCount = policyResult.exactFilteredCount;

      // [v0.3.32.3] Reference Resolution (Extracted to ReferenceResolver)
      const resolvedReferences = ReferenceResolver.resolve(policyResult.validReferences, nodeIds, SymbolIndex.getInstance());
      
      for (const r of resolvedReferences) {
        totalReferencesFound++;
        if (r.resolutionKind === 'symbol_index') symbolResolvedCount++;
        if (r.resolutionKind === 'basename') fallbackMatchedCount++;
        if (r.resolutionKind === 'unresolved') unresolvedCount++;
      }

      // [v0.3.32.4] Ghost Expansion (Extracted to GhostExpander)
      console.error('[GHOST] resolvedReferences=', resolvedReferences.length, 'clusterIds=', clusterIds.size, 'nodeIds=', nodeIds.size);
      const expansionResult = GhostExpander.expand(resolvedReferences, clusterIds, nodeIds, internalNamespace);
      Logger.info(`[GHOST_CLASSIFIER_ENTRY] ghostNodes=${expansionResult.ghostNodes.length} resolvedRefs=${resolvedReferences.length}`);

      console.time('ghost-classification');
      const ghostReport = GhostClassifier.inspect({
        ghostNodes: expansionResult.ghostNodes,
        resolvedReferences,
        projectRoot,
        existingNodeIds: nodeIds
      });
      console.timeEnd('ghost-classification');
      Logger.info(`[GHOST_CLASSIFIER_EXIT] total=${ghostReport.total} unknown=${ghostReport.v2Gate.unknownCount} readyForV2B=${ghostReport.v2Gate.readyForV2B}`);
      diagnosticOutput += `\n[GHOST_CLASSIFICATION_SUMMARY] total=${ghostReport.total} unknown=${ghostReport.v2Gate.unknownCount} unknownRatio=${ghostReport.v2Gate.unknownRatio} readyForV2B=${ghostReport.v2Gate.readyForV2B}\n`;
      const externalLayerMode = ghostReport.v2Gate.readyForV2B ? 'DECOMPOSE_READY' : 'SINGLE_EXTERNAL_LAYER';
      diagnosticOutput += `[EXTERNAL_LAYER_MODE] mode=${externalLayerMode} unknownRatio=${ghostReport.v2Gate.unknownRatio} threshold=${ghostReport.v2Gate.thresholdUnknownRatio}\n`;
      
      // Inject Mutated States (DataPipeline's responsibility)
      for (const node of expansionResult.ghostNodes) nodes.push(node);
      for (const n of expansionResult.ghostNodes) nodeIds.add(n.id);
      
      for (const cluster of expansionResult.ghostClusters) clusters.push(cluster);
      for (const c of expansionResult.ghostClusters) clusterIds.add(c.id);

      // [v0.3.32.5] Edge Materialization (Extracted to EdgeBuilder)
      console.time('[PIPELINE] edgeBuilder');
      const edgeBuilderResult = EdgeBuilder.build(expansionResult.expandedReferences);
      console.timeEnd('[PIPELINE] edgeBuilder');
      for (const edge of edgeBuilderResult.edges) edges.push(edge);
      
      // Update pipeline diagnostics
      for (const [mappedType, count] of edgeBuilderResult.edgeTypeCount.entries()) {
        edgeTypeCount.set(mappedType, (edgeTypeCount.get(mappedType) || 0) + count);
      }
    console.time('[PIPELINE] graphAnalyzer');
    const analysis = analyzeGraph({ nodes, edges, clusterIds, nodeIds });
    console.timeEnd('[PIPELINE] graphAnalyzer');
    const nodeMap = new Map<string, Node>(nodes.map(n => [n.id, n]));

    const context: DiagnosticContext = {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        edgeTypeCount,
        packageRemoved: packageFilteredCount,
        exactRemoved: exactFilteredCount,
        nodeMap
    };

    diagnosticOutput += generateDiagnosticReport(analysis, context);

    const layoutInput: LayoutInput = { nodes, clusters, analysis };
    
    // ==========================================
    // [USER PROBE #1: ORPHAN NODES]
    // ==========================================
    const clusterIdSet = new Set(clusters.map(c => c.id));
    const orphanNodes = nodes.filter(node =>
        !node.cluster_id || !clusterIdSet.has(node.cluster_id)
    );
    console.log('[ORPHAN_NODES]', {
        count: orphanNodes.length,
        sample: orphanNodes.slice(0,20).map(n => ({
            id: n.id,
            cluster_id: n.cluster_id
        }))
    });

    // ==========================================
    // [USER PROBE #2: EMPTY_CLUSTER_VERIFY]
    // ==========================================
    const nodeCountByCluster = new Map<string, number>();
    for (const n of nodes) {
        const cid = n.cluster_id || n.data?.cluster_id;
        if (cid) nodeCountByCluster.set(cid, (nodeCountByCluster.get(cid) || 0) + 1);
    }
    const emptyClustersCount = clusters.filter(c =>
        (nodeCountByCluster.get(c.id) || 0) === 0
    );
    
    const suspiciousClusters = emptyClustersCount.slice(0, 20);
    for (const cluster of suspiciousClusters) {
        console.log('[EMPTY_CLUSTER_VERIFY]', {
            cluster: cluster.id,
            actualNodes: nodeCountByCluster.get(cluster.id) || 0,
            childClusterCount: clusters.filter(c => c.parent_id === cluster.id).length
        });
    }
    
    console.log('[LAYOUT_INPUT]', {
        clusterCount: clusters.length,
        emptyClusters: emptyClustersCount.length
    });

    /* [USER PROBE #3: GHOST_SAMPLE] — removed for performance */

    // ==========================================


    // ==========================================
    // [SINGLE NODE CLUSTER COLLAPSE]
    // ==========================================
    let collapseCount = 0;
    let chainCount = 0;
    let collapseChanged = true;
    console.time('[PIPELINE] clusterCollapse');
    while(collapseChanged) {
        collapseChanged = false;
        
        for (let i = clusters.length - 1; i >= 0; i--) {
            const c = clusters[i];
            if (c.id === 'cluster_ghosts' || c.id === 'sys_cluster_reserved' || c.id === 'folder_root') continue;
            
            const childClusters = clusters.filter(child => child.parent_id === c.id);
            const myNodes = nodes.filter(n => n.cluster_id === c.id || (n.data && n.data.cluster_id === c.id));
            
            // Calculate cluster depth
            let depth = 1;
            let currentForDepth = c;
            while (currentForDepth.parent_id) {
                depth++;
                const parent = clusters.find(p => p.id === currentForDepth.parent_id);
                if (!parent) break;
                currentForDepth = parent;
            }
            
            // 0. Force Compression (Depth > 5)
            if (depth > 5) {
                const parentId = c.parent_id;
                if (parentId) {
                    // Move my nodes to parent
                    myNodes.forEach(n => {
                        n.cluster_id = parentId;
                        if (n.data) n.data.cluster_id = parentId;
                    });
                    
                    // Move my children to parent
                    childClusters.forEach(child => {
                        child.parent_id = parentId;
                    });
                    
                    clusters.splice(i, 1);
                    collapseCount++;
                    collapseChanged = true;
                    continue;
                }
            }
            
            // 1. Aggressive Branch Promotion (nodeCount <= 2)
            // If a cluster has very few direct nodes, it's not worth being a separate box.
            // We promote its nodes and children to its parent.
            if (myNodes.length <= 2) {
                const parentId = c.parent_id;
                if (parentId) {
                    // Move my nodes to parent
                    myNodes.forEach(n => {
                        n.cluster_id = parentId;
                        if (n.data) n.data.cluster_id = parentId;
                    });
                    
                    // Move my children to parent
                    childClusters.forEach(child => {
                        child.parent_id = parentId;
                        // Prepend my name to child's name to preserve path visually
                        const myName = c.label.replace('📂 ', '').replace(/\[.*\]\s*/, '');
                        if (!child.label.includes(myName + '/')) {
                            child.label = child.label.replace('📂 ', `📂 ${myName}/`);
                        }
                    });
                    
                    clusters.splice(i, 1);
                    collapseCount++;
                    collapseChanged = true;
                    continue;
                }
            }
            
            // 2. Chain Compression (childClusterCount === 1)
            // For folders like A/B/C where B has no nodes but 1 child
            if (childClusters.length === 1) {
                if (myNodes.length <= 5) {
                    const child = childClusters[0];
                    const parentId = c.parent_id;
                    
                    // Move my nodes to the child cluster
                    myNodes.forEach(n => {
                        n.cluster_id = child.id;
                        if (n.data) n.data.cluster_id = child.id;
                    });
                    
                    // Bypass current cluster
                    child.parent_id = parentId;
                    
                    // Merge labels: A + B -> A/B
                    const myName = c.label.replace('📂 ', '').replace(/\[.*\]\s*/, '');
                    if (!child.label.includes(myName + '/')) {
                        child.label = child.label.replace('📂 ', `📂 ${myName}/`);
                    }
                    
                    clusters.splice(i, 1);
                    chainCount++;
                    collapseChanged = true;
                    continue;
                }
            }
        }
    }
    console.timeEnd('[PIPELINE] clusterCollapse');
    console.log(`[CLUSTER_COLLAPSE] Aggressively Absorbed ${collapseCount} clusters, Compressed ${chainCount} chains`);

    console.time('[PIPELINE] layout');
    const layoutResult = applyLayout(layoutInput);
    console.timeEnd('[PIPELINE] layout');

    const continentMap = layoutResult.continentMap;
    const clusterNodes = new Map<string, Node[]>(Array.from(layoutResult.clusterNodes.entries()).map(([k, v]) => [k, [...v]]));
    const activeClusters = layoutResult.activeClusters;

    // [v0.3.33 Phase B] Backend coordinate provenance
    { let mnY=Infinity,mxY=-Infinity; for(const n of nodes){const y=n.position?.y;if(typeof y==='number'&&Number.isFinite(y)){if(y<mnY)mnY=y;if(y>mxY)mxY=y}} const maxY=mxY; Logger.info(`[BACKEND_LAYOUT] nodeCount=${nodes.length} minY=${mnY} maxY=${maxY}`); if(maxY>100000){const offenders=[];for(const n of nodes){if(n.position&&typeof n.position.y==='number'&&n.position.y>100000){offenders.push({id:n.id?.substring(0,40),label:n.data?.label,y:Math.round(n.position.y)});if(offenders.length>=20)break}} Logger.info(`[BACKEND_LAYOUT_OFFENDERS] ${JSON.stringify(offenders)}`)} }
    
    Logger.info(`[FLOW_DEBUG] symbol resolved ${symbolResolvedCount} unresolved ${unresolvedCount}`);
    Logger.info(`[FLOW_DEBUG] pipeline exit nodes ${nodes.length} edges ${edges.length}`);


    // 6. Layout Diagnostics
    diagnosticOutput += generateLayoutDiagnostics(layoutResult);

    // Filter `clusters` to only active ones
    clusters.splice(0, clusters.length, ...activeClusters);

    // === [v0.3.33] Phase 4: Label Propagation Algorithm (Community Detection) ===
    Logger.info(`[FLOW_DEBUG] Running Label Propagation Community Detection...`);
    const communityResult = detectCommunities(nodes, edges);

    const communitySizes = Array.from(communityResult.communitySizes.entries())
      .sort((a, b) => b[1] - a[1]);
    const communityCount = communityResult.communityCount;
    const communityNodeTotal = communitySizes.reduce((sum, [, size]) => sum + size, 0);
    const largestCommunity = communitySizes[0]?.[1] || 0;
    const avgCommunitySize = communityCount > 0 ? communityNodeTotal / communityCount : 0;
    Logger.info(`[COMMUNITY_STATS] count=${communityCount} total=${communityNodeTotal} avg=${avgCommunitySize.toFixed(2)} largest=${largestCommunity}`);
    Logger.info(`[COMMUNITY_STATS_TOP10] ${JSON.stringify(communitySizes.slice(0, 10).map(([id, size]) => ({ id, size })))}`);
    
    // Inject community labels into node.data
    for (const node of nodes) {
        const label = communityResult.nodeCommunityMap.get(node.id);
        if (label) {
            if (!node.data) node.data = {};
            node.data.community_label = label;
        }
    }
    
    Logger.info(`[FLOW_DEBUG] Generated ${communityResult.communityCount} functional communities via LPA (Saved as community_label)`);

    // [v0.3.32.2] Diagnostic: Cluster Bounds & Overlaps
    diagnosticOutput += generateBoundsDiagnostics(layoutResult, nodes, clusters);
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
    for (const [key, traffic] of Array.from(analysis.directionalClusterTraffic.entries())) {
        const [source, target] = key.split(' -> ');
        metaEdges.push({ source, target, weight: traffic });
    }

    console.timeEnd('[PIPELINE] TOTAL');
    return { nodes, edges, clusters, metaEdges };
  }


}

export const dataPipeline = new DataPipeline();
