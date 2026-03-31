import { phaseManager, Phase } from './PhaseManager';
import { gridSystem } from './GridSystem';
import { Node, Edge, graphModel, NodeType } from './GraphModel';

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
  private readonly SOFT_BUDGET_NODES = 200;
  private readonly HARD_BUDGET_NODES = 500;
  private readonly SOFT_BUDGET_EDGES = 500;
  private readonly HARD_BUDGET_EDGES = 1000;

  private threshold: number = 0.5; // Default Edge Weight Filter
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
      
      const isDegraded = nodes.length > this.SOFT_BUDGET_NODES || this.threshold > 0.6;

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
    if (nodeCount > this.HARD_BUDGET_NODES || edgeCount > this.HARD_BUDGET_EDGES) {
      this.threshold = 0.9; // 극단적인 필터링 (최소 연결만 표시)
    } else if (nodeCount > this.SOFT_BUDGET_NODES || edgeCount > this.SOFT_BUDGET_EDGES) {
      this.threshold = 0.7; // 중간 단계 필터링
    } else {
      this.threshold = 0.5; // 기본 필터링
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
