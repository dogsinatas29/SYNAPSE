import { phaseManager, Phase } from './PhaseManager';
import { gridSystem } from './GridSystem';
import { Node, Edge, graphModel, NodeType } from './GraphModel';
import { RenderProtocol } from './canvas-engine/RenderProtocol';

/**
 * 🎨 SYNAPSE Rendering Core (v0.3.1)
 * 
 * "Iron Grid Refined" 전략에 따라 Render Budget 관리와
 * 점진적 렌더링(Incremental Rendering), 가중치 필터링을 지원한다.
 * Phase 5 (RENDER) 담당.
 */

export interface RenderResult {
  nodes: Node[];
  edges: Edge[];
  isIncremental: boolean;
  isDegraded: boolean;
  budgetReport: {
    totalNodes: number;
    totalEdges: number;
    filteredEdges: number;
    threshold: number;
  };
}

export class RendererCore {

  private threshold: number = RenderProtocol.THRESHOLD.DEFAULT;
  private dirtyNodes: Set<string> = new Set(); // For Incremental Rendering
  public lastBudgetReport: any = null; // Phase 6 support

  /**
   * 전체적인 렌더링 파이프라인 정규화 및 필터링
   */
  public prepareRender(nodes: Node[], edges: Edge[]): RenderResult {
    try {
      // 1. Grid가 선행되어야 함 (Phase 4 확인)
      phaseManager.assertPhase(Phase.GRID);

      // 2. RENDER 진입 확인
      if (phaseManager.getCurrentPhase() < Phase.RENDER) {
        phaseManager.advancePhase(Phase.RENDER);
      }

      console.log(`[SYNAPSE] Applying Render Budget for ${nodes.length} nodes...`);

      // 3. Dynamic Threshold 계산 (Iron Grid Refined: 2, 3번 전략)
      this.calculateDynamicThreshold(nodes.length, edges.length);

      // 4. Edge Filtering (Iron Grid Refined: 1번 전략)
      // 중요도가 낮은 Edge는 필터링하여 렌더링 부하 감소
      const filteredEdges = graphModel.getFilteredEdges(this.threshold);
      
      const isDegraded = nodes.length > RenderProtocol.BUDGET.SOFT_NODES || this.threshold > RenderProtocol.THRESHOLD.HIGH;

      // 5. Incremental Rendering Check (Phase 5: 4번 전략)
      const renderResult = this.calculateIncrementalChanges(nodes, filteredEdges);
      
      const result: RenderResult = {
        ...renderResult,
        isDegraded,
        budgetReport: {
          totalNodes: nodes.length,
          totalEdges: edges.length,
          filteredEdges: filteredEdges.length,
          threshold: this.threshold
        }
      };

      this.lastBudgetReport = result.budgetReport; // Store for Debugger

      console.log(`[SYNAPSE] Render Prepared. (Degraded: ${isDegraded}, Threshold: ${this.threshold})`);
      return result;
    } catch (e: any) {
      phaseManager.lockSystem(`RENDER FAILURE: ${e.message}`);
      throw e;
    }
  }

  /**
   * 부하에 따른 동적 임계치 조절 (Iron Grid Refined)
   */
  private calculateDynamicThreshold(nodeCount: number, edgeCount: number) {
    if (nodeCount > RenderProtocol.BUDGET.HARD_NODES || edgeCount > RenderProtocol.BUDGET.HARD_EDGES) {
      this.threshold = RenderProtocol.THRESHOLD.HIGH; 
    } else if (nodeCount > RenderProtocol.BUDGET.SOFT_NODES || edgeCount > RenderProtocol.BUDGET.SOFT_EDGES) {
      this.threshold = RenderProtocol.THRESHOLD.MEDIUM;
    } else {
      this.threshold = RenderProtocol.THRESHOLD.LOW;
    }
  }

  /**
   * 점진적 렌더링 (Incremental Rendering) 계산
   */
  private calculateIncrementalChanges(nodes: Node[], edges: Edge[]) {
    // [TODO] Calculate dirty status
    // 현재는 전체를 반환하지만, isIncremental 플래그를 통해 UI 최적화 유도
    return { 
        nodes, 
        edges, 
        isIncremental: this.dirtyNodes.size > 0 
    };
  }

  public markDirty(nodeId: string) {
    this.dirtyNodes.add(nodeId);
  }

  public clearDirty() {
    this.dirtyNodes.clear();
  }
}

export const rendererCore = new RendererCore();
