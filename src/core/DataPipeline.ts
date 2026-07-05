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
    const clusters: Cluster[] = [];
    const clusterIds = new Set<string>();
    let diagnosticOutput = '';

    // [v0.3.32.4] NodeBuilder: Build nodes first (cluster_id computed internally)
    const directoryTree = buildDirectoryTree(summaries);
    const nodeResult = buildNodes(summaries, directoryTree);
    nodes.push(...nodeResult.nodes);
    const nodeIds = nodeResult.nodeIds;
    const internalNamespace = nodeResult.internalNamespace;

    // [v0.3.32.4] ClusterBuilder: Build clusters from nodes
    const clusterResult = buildClusters(nodeResult.nodes);
    clusters.push(...clusterResult.clusters);
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
      const expansionResult = GhostExpander.expand(resolvedReferences, clusterIds, internalNamespace);
      
      // Inject Mutated States (DataPipeline's responsibility)
      nodes.push(...expansionResult.ghostNodes);
      for (const n of expansionResult.ghostNodes) nodeIds.add(n.id);
      
      clusters.push(...expansionResult.ghostClusters);
      for (const c of expansionResult.ghostClusters) clusterIds.add(c.id);

      // [v0.3.32.5] Edge Materialization (Extracted to EdgeBuilder)
      const edgeBuilderResult = EdgeBuilder.build(expansionResult.expandedReferences);
      edges.push(...edgeBuilderResult.edges);
      
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
    const layoutResult = applyLayout(layoutInput);
    const continentMap = layoutResult.continentMap;
    const clusterNodes = new Map<string, Node[]>(Array.from(layoutResult.clusterNodes.entries()).map(([k, v]) => [k, [...v]]));
    const activeClusters = layoutResult.activeClusters;
    
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
