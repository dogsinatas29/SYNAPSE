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
    const clusterResult = buildClusters(nodeResult.nodes);
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
      const expansionResult = GhostExpander.expand(resolvedReferences, clusterIds, nodeIds, internalNamespace);
      
      // Inject Mutated States (DataPipeline's responsibility)
      for (const node of expansionResult.ghostNodes) nodes.push(node);
      for (const n of expansionResult.ghostNodes) nodeIds.add(n.id);
      
      for (const cluster of expansionResult.ghostClusters) clusters.push(cluster);
      for (const c of expansionResult.ghostClusters) clusterIds.add(c.id);

      // [v0.3.32.5] Edge Materialization (Extracted to EdgeBuilder)
      const edgeBuilderResult = EdgeBuilder.build(expansionResult.expandedReferences);
      for (const edge of edgeBuilderResult.edges) edges.push(edge);
      
      // Update pipeline diagnostics
      for (const [mappedType, count] of edgeBuilderResult.edgeTypeCount.entries()) {
        edgeTypeCount.set(mappedType, (edgeTypeCount.get(mappedType) || 0) + count);
      }
    const analysis = analyzeGraph({ nodes, edges, clusterIds, nodeIds });

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
    const orphanNodes = nodes.filter(node => {
        if (!node.cluster_id) return true;
        const cluster = clusters.find(c => c.id === node.cluster_id);
        return !cluster;
    });
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
    const emptyClustersCount = clusters.filter(c => {
        const hasNodes = nodes.some(n => n.cluster_id === c.id || (n.data && n.data.cluster_id === c.id));
        return !hasNodes;
    });
    
    const suspiciousClusters = emptyClustersCount.slice(0, 20);
    for (const cluster of suspiciousClusters) {
        const actualNodes = nodes.filter(
            n => n.cluster_id === cluster.id || (n.data && n.data.cluster_id === cluster.id)
        );
        console.log('[EMPTY_CLUSTER_VERIFY]', {
            cluster: cluster.id,
            actualNodes: actualNodes.length,
            childClusterCount: clusters.filter(c => c.parent_id === cluster.id).length
        });
    }
    
    console.log('[LAYOUT_INPUT]', {
        clusterCount: clusters.length,
        emptyClusters: emptyClustersCount.length
    });

    // ==========================================
    // [USER PROBE #3: GHOST_SAMPLE]
    // ==========================================
    const ghostNodes = nodes.filter(n => n.cluster_id && n.cluster_id.startsWith('cluster_ghost'));
    const ghostSources = new Map<string, number>();
    ghostNodes.forEach(n => {
        const src = (n.data as any)?.sourceFile || 'unknown';
        ghostSources.set(src, (ghostSources.get(src) || 0) + 1);
    });
    console.log('[GHOST_CLUSTER_BREAKDOWN]', {
        total: ghostNodes.length,
        topSources: [...ghostSources.entries()].sort((a,b) => b[1] - a[1]).slice(0, 20)
    });
    console.log('[GHOST_SAMPLE]', 
        ghostNodes.slice(0, 50).map(n => ({
            id: n.id,
            cluster: n.cluster_id,
            sourceFile: (n.data as any)?.sourceFile || 'unknown'
        }))
    );

    // ==========================================


    // ==========================================
    // [SINGLE NODE CLUSTER COLLAPSE]
    // ==========================================
    let collapseCount = 0;
    let chainCount = 0;
    let collapseChanged = true;
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
    console.log(`[CLUSTER_COLLAPSE] Aggressively Absorbed ${collapseCount} clusters, Compressed ${chainCount} chains`);

    // ==========================================
    // [USER PROBE #4: POST-COLLAPSE CLUSTER_SIZE_DISTRIBUTION]
    // ==========================================
    const sizeDistribution = {
        '0': 0, '1': 0, '2-5': 0, '6-10': 0, '11-20': 0, '21-50': 0, '50+': 0
    };
    const clusterSizes = clusters.map(c => {
        const nodeCount = nodes.filter(n => n.cluster_id === c.id || (n.data && n.data.cluster_id === c.id)).length;
        if (nodeCount === 0) sizeDistribution['0']++;
        else if (nodeCount === 1) sizeDistribution['1']++;
        else if (nodeCount <= 5) sizeDistribution['2-5']++;
        else if (nodeCount <= 10) sizeDistribution['6-10']++;
        else if (nodeCount <= 20) sizeDistribution['11-20']++;
        else if (nodeCount <= 50) sizeDistribution['21-50']++;
        else sizeDistribution['50+']++;
        return { id: c.id, nodeCount };
    });
    console.log('[POST_COLLAPSE_CLUSTER_SIZE_DISTRIBUTION]', sizeDistribution);
    
    console.log('[POST_COLLAPSE_SMALLEST_CLUSTERS]', 
        clusterSizes.filter(c => c.nodeCount > 0).sort((a,b) => a.nodeCount - b.nodeCount).slice(0, 50)
    );

    // ==========================================
    // [USER PROBE #5: POST-COLLAPSE DEPTH_DISTRIBUTION]
    // ==========================================
    const depthDistribution: Record<string, number> = {};
    clusters.forEach(c => {
        let depth = 1;
        let current = c;
        while (current.parent_id) {
            depth++;
            const parent = clusters.find(p => p.id === current.parent_id);
            if (!parent) break;
            current = parent;
        }
        const depthKey = depth >= 7 ? '7+' : depth.toString();
        depthDistribution[depthKey] = (depthDistribution[depthKey] || 0) + 1;
    });
    console.log('[POST_COLLAPSE_DEPTH_DISTRIBUTION]', depthDistribution);

    const tLayoutStart = process.hrtime.bigint();
    const layoutResult = applyLayout(layoutInput);
    const layoutMs = Number(process.hrtime.bigint() - tLayoutStart) / 1e6;
    Logger.info(`[LAYOUT_TIME] applyLayout took ${layoutMs.toFixed(2)}ms`);

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

    return { nodes, edges, clusters, metaEdges };
  }


}

export const dataPipeline = new DataPipeline();
