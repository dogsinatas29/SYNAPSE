import * as crypto from 'crypto';
import * as path from 'path';
import { TypeScriptResolver } from './resolvers/TypeScriptResolver';
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
import { NodeRole } from '../types/schema';
import { canvasEngine } from './canvas-engine/CanvasEngine';
import { RuleEngine } from './RuleEngine';
import { SymbolIndex } from './SymbolIndex';
import { ProjectMetadata } from './ProjectMetadata';

// [Phase 1 Debug] analyzeGraph 완전 OFF - 범인 검출용 임시 플래그
const SKIP_ANALYSIS = true;

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
  ghostBreakdown?: Record<string, number>;
  externalBreakdown?: Record<string, number>;
  resolutionStats?: {
      total: number;
      resolved: number;
      ambiguous: number;
      ghost: number;
      unresolved: number;
  };
  edgeTypeDistribution?: Record<string, number>;
}

export class DataPipeline {
  private scanner: FileScanner;
  private tsResolver: TypeScriptResolver;

  constructor() {
    this.scanner = new FileScanner();
    this.tsResolver = new TypeScriptResolver();
  }

  /**
   * 전체적인 데이터 처리 흐름 실행 (v0.3.11: dispatch 제거, 순수 데이터 반환)
   * @param files 분석할 파일 목록
   */
  public async processFiles(files: string[], projectRoot?: string, onProgress?: (msg: string, percent: number) => void): Promise<PipelineResult> {
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
      const totalFiles = files.length;
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const absolutePath = projectRoot ? (path.isAbsolute(file) ? file : path.join(projectRoot, file)) : file;
        const summary = this.scanner.scanFile(absolutePath);
        
        // [v0.3.34.5] Resolver Upgrade for TypeScript/JavaScript
        if (summary && ['.ts', '.tsx', '.js', '.jsx'].includes(path.extname(absolutePath).toLowerCase())) {
            const fileContent = require('fs').readFileSync(absolutePath, 'utf8');
            this.tsResolver.resolve(absolutePath, fileContent, summary);
        }
        
        summaries.push({ filePath: file, summary });
        
        if (onProgress && (i % 5 === 0 || i === totalFiles - 1)) {
            const percent = Math.floor(((i + 1) / totalFiles) * 100);
            onProgress(`Analyzing ${i + 1} / ${totalFiles} files...`, percent);
        }

        // [v0.3.33.1] Prevent Extension Host freezing by yielding to the event loop
        if (i % 100 === 0) {
            await new Promise(resolve => setImmediate(resolve));
        }
      }

      // --- PROVENANCE AUDIT: SCANNER ---
      const scannerProvStats: Record<string, number> = {};
      summaries.forEach(s => {
          s.summary.references.forEach(r => {
              const p = r.provenance || 'UNDEFINED';
              scannerProvStats[p] = (scannerProvStats[p] || 0) + 1;
          });
      });
      Logger.info(`[PROVENANCE_AUDIT] [SCANNER] Total References: ${summaries.reduce((acc, s) => acc + s.summary.references.length, 0)} | Stats: ${JSON.stringify(scannerProvStats)}`);

      // [v0.3.34.16 DIAGNOSTIC] UNDEFINED Reference Sampling (P1 investigation)
      const undefinedSamples: any[] = [];
      for (const s of summaries) {
        for (const r of s.summary.references) {
          if (!r.provenance && undefinedSamples.length < 20) {
            undefinedSamples.push({
              source: s.filePath,
              raw: r.target,
              type: r.type,
              hasFullPath: !!(r as any).fullPath
            });
          }
        }
      }
      if (undefinedSamples.length > 0) {
        Logger.info(`[UNDEFINED_SAMPLE] count=${undefinedSamples.length} samples=${JSON.stringify(undefinedSamples)}`);
      }
      // ---------------------------------

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
    const edgeTypeCount = new Map<string, number>();

      console.error('[PIPELINE] Starting GhostPolicy.filter, summaries=', summaries.length);
      // [v0.3.32.2] GhostRule System: Early Pruning (Extracted to GhostPolicy)
      const policyResult = GhostPolicy.filter(summaries);

      // [v0.3.32.3] Reference Resolution (Extracted to ReferenceResolver)
      const resolvedReferences = ReferenceResolver.resolve(policyResult.validReferences, nodeIds, SymbolIndex.getInstance());
      
      const resolutionStats = {
          total: resolvedReferences.length,
          resolved: 0,
          ambiguous: 0,
          ghost: 0,
          unresolved: 0
      };

      for (const r of resolvedReferences) {
        totalReferencesFound++;
        if (r.resolutionKind === 'symbol_index') { symbolResolvedCount++; resolutionStats.resolved++; }
        else if (r.resolutionKind === 'direct') { resolutionStats.resolved++; }
        else if (r.resolutionKind === 'basename') { fallbackMatchedCount++; resolutionStats.ambiguous++; }
        else if (r.resolutionKind === 'unresolved') { unresolvedCount++; resolutionStats.unresolved++; }
        
        if (r.targetId.startsWith('ghost://') || r.targetId.startsWith('external://')) {
            resolutionStats.ghost++;
        }
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
      const validGhostNodes = expansionResult.ghostNodes.filter(n => {
          if (n.role === NodeRole.GHOST) return false;
          if ((n.data as any)?.ghost_classification === 'parserArtifact') return false;
          return true;
      });
      
      const validGhostNodeIds = new Set(validGhostNodes.map(n => n.id));
      const validReferences = expansionResult.expandedReferences.filter(ref => 
          nodeIds.has(ref.targetId) || validGhostNodeIds.has(ref.targetId)
      );

      for (const node of validGhostNodes) nodes.push(node);
      for (const n of validGhostNodes) nodeIds.add(n.id);
      
      const usedClusterIds = new Set<string>();
      for (const n of validGhostNodes) {
          if (n.cluster_id) usedClusterIds.add(n.cluster_id);
      }
      usedClusterIds.add('cluster_ghosts');
      usedClusterIds.add('sys_cluster_reserved');
      usedClusterIds.add('doc_shelf');
      
      const validGhostClusters = expansionResult.ghostClusters.filter(c => usedClusterIds.has(c.id));
      for (const cluster of validGhostClusters) clusters.push(cluster);
      for (const c of validGhostClusters) clusterIds.add(c.id);

      console.log('[AFTER_GHOST_FILTER]', {
        ghostNodes: validGhostNodes.length,
        references: validReferences.length,
        ghostClusters: validGhostClusters.length
      });

      console.log('[BEFORE_CLUSTER_BUILD]', {
        nodeCount: nodes.length,
        ghostCount: validGhostNodes.length,
        clusterCount: clusters.length
      });

      // [v0.3.32.5] Edge Materialization (Extracted to EdgeBuilder)
      console.time('[PIPELINE] edgeBuilder');
      const edgeBuilderResult = EdgeBuilder.build(validReferences);
      console.timeEnd('[PIPELINE] edgeBuilder');
      for (const edge of edgeBuilderResult.edges) edges.push(edge);
      
      // --- PROVENANCE AUDIT: EDGE_BUILDER ---
      const edgeProvStats: Record<string, number> = {};
      edgeBuilderResult.edges.forEach(e => {
          const p = e.provenance || 'UNDEFINED';
          edgeProvStats[p] = (edgeProvStats[p] || 0) + 1;
      });
      Logger.info(`[PROVENANCE_AUDIT] [EDGE_BUILDER] Total Edges: ${edgeBuilderResult.edges.length} | Stats: ${JSON.stringify(edgeProvStats)}`);
      // --------------------------------------
      
      // Update pipeline diagnostics
      for (const [mappedType, count] of edgeBuilderResult.edgeTypeCount.entries()) {
        edgeTypeCount.set(mappedType, (edgeTypeCount.get(mappedType) || 0) + count);
      }
      console.log('[EDGE_TYPE_BREAKDOWN]', Object.fromEntries(edgeTypeCount));
    let analysis: GraphAnalysis;
    if (SKIP_ANALYSIS) {
      console.log('[BOOTSTRAP] Analysis disabled - skip analyzeGraph()');
      analysis = {
        degreeMap: new Map(),
        clusterTraffic: new Map(),
        interClusterTraffic: new Map(),
        ghostImpactTraffic: new Map(),
        directionalClusterTraffic: new Map(),
        continentTraffic: new Map(),
        interContinentTraffic: new Map(),
        clusterSizes: {},
        continentInfo: new Map(),
        stats: { internalEdges: 0, externalEdges: 0, ghostNodes: 0, ghostEdges: 0, ghostRatio: 0 },
        assemblyAudit: []
      };
    } else {
      console.time('[PIPELINE] graphAnalyzer');
      analysis = analyzeGraph({ nodes, edges, clusterIds, nodeIds });
      console.timeEnd('[PIPELINE] graphAnalyzer');
    }
    
    // [P0 진단] DataPipeline 첫 번째 analyzeGraph 결과 확인
    console.log('[PIPELINE_ASSEMBLY_AUDIT]', {
        assemblyAuditLength: analysis.assemblyAudit?.length ?? -1
    });
    
    const nodeMap = new Map<string, Node>(nodes.map(n => [n.id, n]));

    const context: DiagnosticContext = {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        edgeTypeCount,
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

    // [v0.3.34.15 P0.1] Pre-Normalize: Collapse 전에 nodeCount를 미리 계산
    // Promotion 판단 로직이 undefined를 보지 않도록 함
    {
        const preCountMap = new Map<string, number>();
        for (const n of nodes) {
            if (n.cluster_id) {
                preCountMap.set(n.cluster_id, (preCountMap.get(n.cluster_id) || 0) + 1);
            }
        }
        for (const c of clusters) {
            c.nodeCount = preCountMap.get(c.id) || 0;
        }
    }

    let collapseCount = 0;
    let chainCount = 0;
    let collapseChanged = true;
    console.time('[PIPELINE] clusterCollapse');
    
    // O(1) Lookups for collapse loop
    const clusterMap = new Map<string, Cluster>();
    for (const c of clusters) clusterMap.set(c.id, c);
    
    const myNodesMap = new Map<string, Node[]>();
    for (const n of nodes) {
        const cid = n.cluster_id || (n.data && n.data.cluster_id);
        if (cid) {
            if (!myNodesMap.has(cid)) myNodesMap.set(cid, []);
            myNodesMap.get(cid)!.push(n);
        }
    }

    while(collapseChanged) {
        collapseChanged = false;
        
        const parentToChildren = new Map<string, Cluster[]>();
        for (const child of clusters) {
            if (child.parent_id) {
                if (!parentToChildren.has(child.parent_id)) parentToChildren.set(child.parent_id, []);
                parentToChildren.get(child.parent_id)!.push(child);
            }
        }
        
        for (let i = clusters.length - 1; i >= 0; i--) {
            const c = clusters[i];
            if (c.id === 'cluster_ghosts' || c.id === 'sys_cluster_reserved' || c.id === 'folder_root') continue;
            
            const childClusters = parentToChildren.get(c.id) || [];
            const myNodes = myNodesMap.get(c.id) || [];
            
            // Calculate cluster depth
            let depth = 1;
            let currentForDepth = c;
            while (currentForDepth.parent_id) {
                depth++;
                const parent = clusterMap.get(currentForDepth.parent_id);
                if (!parent) break;
                currentForDepth = parent;
            }
            
            // 0. Force Compression (Depth > 5)
            if (depth > 5) {
                const parentId = c.parent_id;
                if (parentId) {
                    if (!myNodesMap.has(parentId)) myNodesMap.set(parentId, []);
                    const parentNodes = myNodesMap.get(parentId)!;
                    
                    myNodes.forEach(n => {
                        n.cluster_id = parentId;
                        if (n.data) n.data.cluster_id = parentId;
                        parentNodes.push(n);
                    });
                    myNodesMap.set(c.id, []);
                    
                    childClusters.forEach(child => {
                        child.parent_id = parentId;
                        if (!parentToChildren.has(parentId)) parentToChildren.set(parentId, []);
                        parentToChildren.get(parentId)!.push(child);
                    });
                    parentToChildren.set(c.id, []);
                    // Remove deleted cluster from parent's children list
                    const parentSiblings = parentToChildren.get(parentId);
                    if (parentSiblings) {
                        const idx2 = parentSiblings.indexOf(c);
                        if (idx2 !== -1) parentSiblings.splice(idx2, 1);
                    }
                    
                    clusters.splice(i, 1);
                    clusterMap.delete(c.id);
                    collapseCount++;
                    collapseChanged = true;
                    continue;
                }
            }
            
            // 1. Aggressive Branch Promotion (nodeCount <= 2)
            if (myNodes.length <= 2) {
                const parentId = c.parent_id;
                if (parentId) {
                    if (!myNodesMap.has(parentId)) myNodesMap.set(parentId, []);
                    const parentNodes = myNodesMap.get(parentId)!;
                    
                    myNodes.forEach(n => {
                        n.cluster_id = parentId;
                        if (n.data) n.data.cluster_id = parentId;
                        parentNodes.push(n);
                    });
                    myNodesMap.set(c.id, []);
                    
                    childClusters.forEach(child => {
                        child.parent_id = parentId;
                        const myName = c.label.replace('📂 ', '').replace(/\[.*\]\s*/, '');
                        if (!child.label.includes(myName + '/')) {
                            child.label = child.label.replace('📂 ', `📂 ${myName}/`);
                        }
                        if (!parentToChildren.has(parentId)) parentToChildren.set(parentId, []);
                        parentToChildren.get(parentId)!.push(child);
                    });
                    parentToChildren.set(c.id, []);
                    // Remove deleted cluster from parent's children list
                    const parentSiblings = parentToChildren.get(parentId);
                    if (parentSiblings) {
                        const idx2 = parentSiblings.indexOf(c);
                        if (idx2 !== -1) parentSiblings.splice(idx2, 1);
                    }
                    
                    clusters.splice(i, 1);
                    clusterMap.delete(c.id);
                    collapseCount++;
                    collapseChanged = true;
                    continue;
                }
            }

            // [v0.3.34.15] Promotion Lifecycle Invariant Check (노이즈 억제: collapse 중 nodeCount는 의도적으로 stale)
            // console.error 제거 - 수백 건 spam이 발생하여 성능 저하 유발
            
            // 2. Chain Compression (childClusterCount === 1)
            if (childClusters.length === 1) {
                if (myNodes.length <= 5) {
                    const child = childClusters[0];
                    const parentId = c.parent_id;
                    
                    if (!myNodesMap.has(child.id)) myNodesMap.set(child.id, []);
                    const childNodes = myNodesMap.get(child.id)!;
                    
                    myNodes.forEach(n => {
                        n.cluster_id = child.id;
                        if (n.data) n.data.cluster_id = child.id;
                        childNodes.push(n);
                    });
                    myNodesMap.set(c.id, []);
                    
                    child.parent_id = parentId;
                    if (parentId) {
                        if (!parentToChildren.has(parentId)) parentToChildren.set(parentId, []);
                        parentToChildren.get(parentId)!.push(child);
                        // Remove deleted cluster from parent's children list
                        const parentSiblings = parentToChildren.get(parentId);
                        if (parentSiblings) {
                            const idx2 = parentSiblings.indexOf(c);
                            if (idx2 !== -1) parentSiblings.splice(idx2, 1);
                        }
                    }
                    parentToChildren.set(c.id, []);
                    
                    const myName = c.label.replace('📂 ', '').replace(/\[.*\]\s*/, '');
                    if (!child.label.includes(myName + '/')) {
                        child.label = child.label.replace('📂 ', `📂 ${myName}/`);
                    }
                    
                    clusters.splice(i, 1);
                    clusterMap.delete(c.id);
                    chainCount++;
                    collapseChanged = true;
                    continue;
                }
            }
        }
    }
    console.timeEnd('[PIPELINE] clusterCollapse');
    console.log(`[CLUSTER_COLLAPSE] Aggressively Absorbed ${collapseCount} clusters, Compressed ${chainCount} chains`);

    // [v0.3.34.15 P0] Cluster Single Source of Truth Normalization
    // O(n)으로 clusterNodeMap을 한 번만 구축한 뒤 재사용
    const clusterNodeMap = new Map<string, Node[]>();
    for (const n of nodes) {
        const cid = n.cluster_id;
        if (!cid) continue;
        if (!clusterNodeMap.has(cid)) clusterNodeMap.set(cid, []);
        clusterNodeMap.get(cid)!.push(n);
    }

    let normalizeCount = 0;
    for (const c of clusters) {
        const actualNodes = clusterNodeMap.get(c.id) || [];
        const computed = actualNodes.length;

        if (c.nodeCount !== computed) {
            console.log(`[CLUSTER_NORMALIZE] ${c.id} ${c.nodeCount} -> ${computed}`);
            normalizeCount++;
        }

        c.nodeCount = computed;
        if (Array.isArray(c.nodes)) {
            c.nodes = actualNodes;
        }
    }
    if (normalizeCount > 0) {
        console.log(`[CLUSTER_NORMALIZE_SUMMARY] fixed=${normalizeCount}`);
    }

    console.time('[PIPELINE] layout');
    const nonEmpty = clusters.filter(c => (c.nodes?.length || 0) > 0 || (c.children?.length || 0) > 0);
    console.log('[LAYOUT_PRE]', { total: clusters.length, nonEmpty: nonEmpty.length, sample: nonEmpty.slice(0,5).map(c => c.id) });
    const layoutResult = applyLayout(layoutInput);
    console.timeEnd('[PIPELINE] layout');

    console.log('[ACTIVE_CLUSTERS]', layoutResult.activeClusters.map(c => ({
        id: c.id,
        x: c.position?.x,
        y: c.position?.y,
        bounds: c.bounds
    })));
    console.log('[WORLD_BOUNDS]', layoutResult.worldBounds);
    console.log('[CLUSTER_BOUNDS_MAP]', layoutResult.clusterBounds);
    console.log('[ACTIVE_CLUSTER_0]', layoutResult.activeClusters[0]);

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
    if (!SKIP_ANALYSIS) {
      for (const [key, traffic] of Array.from(analysis.directionalClusterTraffic.entries())) {
          const [source, target] = key.split(' -> ');
          metaEdges.push({ source, target, weight: traffic });
      }
    } else {
      console.log('[BOOTSTRAP] MetaEdges disabled');
    }

    console.timeEnd('[PIPELINE] TOTAL');
    const rootClusterCount = clusters.filter(c => !c.parent_id).length;
    console.log('[SNAPSHOT_AUDIT] DataPipeline finished:', {
        NODE_COUNT: nodes.length,
        EDGE_COUNT: edges.length,
        CLUSTER_COUNT: clusters.length,
        ROOT_CLUSTER_COUNT: rootClusterCount
    });

    // [v0.3.34.40] SNAPSHOT_COMPOSITION - ghost/external/real breakdown
    {
        let ghostCount = 0, externalCount = 0, realCount = 0;
        for (const n of nodes) {
            const s = (n as any).status;
            const r = (n as any).role;
            const t = (n as any).type;
            if (s === 'ghost' || r === 'ghost' || t === 'SYMBOL' && s === 'ghost') ghostCount++;
            else if (t === 'EXTERNAL' || r === 'external' || (n as any).layer === 'external') externalCount++;
            else realCount++;
        }
        console.log('[SNAPSHOT_COMPOSITION]', { totalNodes: nodes.length, ghostNodes: ghostCount, externalNodes: externalCount, realNodes: realCount, totalEdges: edges.length });
    }

    
    const edgeTypeDistribution: Record<string, number> = {};
    for (const [k, v] of edgeTypeCount.entries()) edgeTypeDistribution[k] = v;

    return { 
        nodes, 
        edges, 
        clusters, 
        metaEdges, 
        ghostBreakdown: policyResult.ghostBreakdown, 
        externalBreakdown: policyResult.externalBreakdown,
        resolutionStats,
        edgeTypeDistribution
    };
  }


}

export const dataPipeline = new DataPipeline();
