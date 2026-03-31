import * as path from 'path';
import { FileScanner, CodeSummary } from './FileScanner';
import { phaseManager, Phase } from './PhaseManager';
import { graphModel, Node, Edge, NodeType, EdgeType, GraphModel } from './GraphModel';

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

  /**
   * 스캔된 정보를 기반으로 그래프 구축 (Node & Edge 생성)
   */
  private constructGraph(summaries: { filePath: string; summary: CodeSummary }[]) {
    // Phase 1 (Constructing)
    for (const item of summaries) {
      const fileName = path.basename(item.filePath, path.extname(item.filePath));
      const newNode: Node = {
        id: fileName,
        filePath: item.filePath,
        type: NodeType.FILE,
        label: fileName,
        degree: 0
      };
      graphModel.addNode(newNode);

      // Analyze references and create edges
      for (const ref of item.summary.references) {
        const targetNodeId = ref.target;
        
        // Edge Weight 기준 (Iron Grid Refined: 1번 전략)
        let weight = GraphModel.WEIGHT_UTILITY; // 기본값
        if (ref.type === 'dependency') weight = GraphModel.WEIGHT_DIRECT_INCLUDE;
        else if (ref.type === 'api_call') weight = GraphModel.WEIGHT_INTERNAL;
        
        const newEdge: Edge = {
          from: fileName,
          to: targetNodeId,
          type: this.mapEdgeType(ref.type),
          weight: weight
        };
        graphModel.addEdge(newEdge);
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
