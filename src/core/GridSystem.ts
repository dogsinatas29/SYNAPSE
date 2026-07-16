import { phaseManager, Phase } from './PhaseManager';
import { controlSystem } from './ControlSystem';
import { Node, NodeType } from './GraphModel';

/**
 * 📏 SYNAPSE Grid System (v0.3.1)
 * 
 * "Iron Grid Refined" 전략에 따라 결정론적 레이아웃과 
 * Snap-to-Grid(40px)를 지원한다.
 * Phase 4 (GRID) 담당.
 */

export class GridSystem {
  public static readonly GRID_SIZE = 40; // Pixels (Standard)

  /**
   * 그리드 시스템 초기화 및 결정론적 레이아웃 생성
   */
  public buildGrid(nodes: Node[]) {
    try {
      // 1. Snapshot과 Control이 선행되어야 함 (Phase 3 확인)
      phaseManager.assertPhase(Phase.CONTROL);

      // 2. GRID 진입 확인
      if (phaseManager.getCurrentPhase() < Phase.GRID) {
        phaseManager.advancePhase(Phase.GRID);
      }

      console.log(`[SYNAPSE] Building Deterministic Grid for ${nodes.length} nodes...`);
      const layout = this.calculateDeterministicLayout(nodes);
      
      // Update nodes positions with Snapping
      for (const node of nodes) {
        if (!layout[node.id]) continue;
        
        // [v0.3.09_fix] Preserve existing snapshot coordinates
        const existingPos = (node as any).position;
        if (existingPos && typeof existingPos.x === 'number' && typeof existingPos.y === 'number') {
          // Keep existing layout but snap to grid for consistency
          const snapped = this.snapToGrid(existingPos.x, existingPos.y);
          (node as any).position = snapped;
          layout[node.id] = snapped; // Sync layout map
          continue;
        }

        const pos = layout[node.id];
        const snapped = this.snapToGrid(pos.x, pos.y);
        (node as any).position = snapped;
      }
      
      console.log(`[SYNAPSE] Grid Layout Calculated & Snapped.`);
      return layout;
    } catch (e: any) {
      phaseManager.lockSystem(`GRID FAILURE: ${e.message}`);
      throw e;
    }
  }

  /**
   * 좌표를 40px 그리드에 맞춤 (Snap-to-Grid)
   */
  public snapToGrid(x: number, y: number): { x: number, y: number } {
    return {
      x: Math.round(x / GridSystem.GRID_SIZE) * GridSystem.GRID_SIZE,
      y: Math.round(y / GridSystem.GRID_SIZE) * GridSystem.GRID_SIZE
    };
  }

  /**
   * 동일한 입력에 대해 동일한 결과를 보장하는 결정론적 레이아웃
   * (Iron Grid Refined: 04. Deterministic Layout)
   */
  private calculateDeterministicLayout(nodes: Node[]): Record<string, { x: number, y: number }> {
    const layout: Record<string, { x: number, y: number }> = {};
    
    // 1. 노드 정렬 (ID 기준) - 결과의 결정론적 보장
    const sortedNodes = nodes.slice().sort((a, b) => a.id.localeCompare(b.id));

    // 2. 영역 분리 (Source: 상단, Doc: 하단)
    const sourceNodes = sortedNodes.filter(n => n.type !== NodeType.DOCUMENTATION);
    const docNodes = sortedNodes.filter(n => n.type === NodeType.DOCUMENTATION);

    // 3. Source 배치 (Grid Matrix)
    const srcCols = Math.ceil(Math.sqrt(sourceNodes.length + 1));
    sourceNodes.forEach((node, index) => {
      const col = index % srcCols;
      const row = Math.floor(index / srcCols);
      layout[node.id] = {
        x: col * GridSystem.GRID_SIZE * 8, // 넉넉한 간격
        y: row * GridSystem.GRID_SIZE * 6
      };
    });

    // 4. Documentation 배치 (하단 영역 고정)
    docNodes.forEach((node, index) => {
      layout[node.id] = {
        x: index * GridSystem.GRID_SIZE * 8,
        y: 1200 + (index % 2) * GridSystem.GRID_SIZE * 4
      };
    });

    return layout;
  }
}

export const gridSystem = new GridSystem();
