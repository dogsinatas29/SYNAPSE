import { Intent } from './Intent';
import { RuleSubEngine, RuleVerdict } from './RuleEngine';
import { CanvasState } from './StateManager';
import { RenderProtocol } from './RenderProtocol';

/**
 * 🗺️ SYNAPSE Spatial Rule Book (SpatialRuleEngine)
 * 
 * 레이아웃 및 공간 제약 조건을 관리하며, 점수제(Scoring)를 수행할 수 있다.
 */

export class SpatialRuleBook implements RuleSubEngine {
  public evaluate(intent: Intent, state: CanvasState): RuleVerdict {
    switch (intent.type) {
      case 'MOVE_NODE':
        return this.evaluateMoveNode(intent.payload, state);
      case 'ADD_NODE':
        return this.evaluateAddNode(intent.payload, state);
      default:
        return this.createVerdict(true, 'info', 70);
    }
  }

  private evaluateMoveNode(payload: any, state: CanvasState): RuleVerdict {
    const { target } = payload;
    let score = 0;
    const reasons: string[] = [];

    // 1. Overlap Penalty (Scoring)
    const overlap = this.checkOverlap(target, state.nodes, payload.nodeId);
    if (overlap) {
      score -= 500;
      reasons.push('Position overlaps with existing nodes');
    }

    // 2. Grid Alignment Score
    const isSnapped = (target.x % RenderProtocol.GRID.SIZE === 0) && (target.y % RenderProtocol.GRID.SIZE === 0);
    if (isSnapped) {
      score += 100;
    }

    return {
      allowed: true, // Spatial은 웬만하면 거부하지 않고 점수로 유도함
      severity: 'info',
      priority: 70,
      score,
      reasons,
      source: 'spatial'
    };
  }

  private evaluateAddNode(payload: any, state: CanvasState): RuleVerdict {
    // 특정 범위 내 노드 밀도가 너무 높으면 경고
    return this.createVerdict(true, 'info', 70);
  }

  private checkOverlap(pos: { x: number; y: number }, nodes: Record<string, any>, excludeId?: string): boolean {
    for (const id in nodes) {
      if (id === excludeId) continue;
      const node = nodes[id];
      const dist = Math.sqrt(Math.pow(node.x - pos.x, 2) + Math.pow(node.y - pos.y, 2));
      if (dist < RenderProtocol.NODE.SPACING) return true;
    }
    return false;
  }

  private createVerdict(
    allowed: boolean, 
    severity: RuleVerdict['severity'], 
    priority: number, 
    reasons?: string[]
  ): RuleVerdict {
    return {
      allowed,
      severity,
      priority,
      score: 0,
      reasons,
      source: 'spatial'
    };
  }
}
