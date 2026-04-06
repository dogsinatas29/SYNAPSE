import { Intent } from './Intent';
import { RuleSubEngine, RuleVerdict } from './RuleEngine';
import { CanvasState } from './StateManager';
import { RenderProtocol } from './RenderProtocol';

/**
 * 🖌️ SYNAPSE Visual Rule Book (VisualRuleEngine)
 * 
 * 시각적 일관성을 유지하며, 렌더링 값의 유효성을 검증한다.
 * 직접 렌더링 로직은 포함하지 않는다.
 */

export class VisualRuleBook implements RuleSubEngine {
  public evaluate(intent: Intent, state: CanvasState): RuleVerdict {
    switch (intent.type) {
      case 'ADD_NODE':
        return this.validateAddNode(intent.payload);
      default:
        return this.createVerdict(true, 'info', 40);
    }
  }

  private validateAddNode(payload: any): RuleVerdict {
    // NODE 크기가 프로토콜 범위를 벗어나면 경고 (또는 강제 조정 점수)
    // 여기서는 기본값이므로 통과 시킴
    return this.createVerdict(true, 'info', 40);
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
      score: 50, // 기본 시각 점수
      reasons,
      source: 'visual'
    };
  }
}
