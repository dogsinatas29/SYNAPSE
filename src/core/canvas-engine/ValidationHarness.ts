import { Intent } from './Intent';
import { RuleSubEngine, RuleVerdict } from './RuleEngine';
import { CanvasState } from './StateManager';

/**
 * 🛡️ SYNAPSE Validation Harness (LogicRuleEngine)
 * 
 * 시스템의 논리적 무결성을 검증하며, 거부권(Veto)을 가질 수 있다.
 */

export class ValidationHarness implements RuleSubEngine {
  public evaluate(intent: Intent, state: CanvasState): RuleVerdict {
    switch (intent.type) {
      case 'ADD_NODE':
        return this.validateAddNode(intent.payload, state);
      case 'CONNECT_EDGE':
        return this.validateConnectEdge(intent.payload, state);
      default:
        return this.createVerdict(true, 'info', 100);
    }
  }

  private validateAddNode(payload: any, state: CanvasState): RuleVerdict {
    // 1. 이미 존재하는 노드인지 검사
    if (state.nodes[payload.id]) {
      return this.createVerdict(false, 'critical', 100, ['Node already exists']);
    }

    // 2. ID 규칙 검증 (빈 문자열 등)
    if (!payload.id || payload.id.trim() === '') {
      return this.createVerdict(false, 'critical', 100, ['Invalid Node ID']);
    }

    return this.createVerdict(true, 'info', 100);
  }

  private validateConnectEdge(payload: any, state: CanvasState): RuleVerdict {
    // 1. Source/Target 노드 존재 여부 확인 (Consistency Check)
    if (!state.nodes[payload.from] || !state.nodes[payload.to]) {
      return this.createVerdict(false, 'critical', 100, ['Source or Target node not found']);
    }

    // 2. Self-connection 방지 (옵션)
    if (payload.from === payload.to) {
      return this.createVerdict(false, 'warn', 100, ['Self-connection is not recommended']);
    }

    // 3. 중복 엣지 방지 (Strict)
    const edgeId = `${payload.from}->${payload.to}`;
    if (state.edges[edgeId]) {
      return this.createVerdict(false, 'critical', 100, ['Duplicate edge detected']);
    }

    return this.createVerdict(true, 'info', 100);
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
      reasons,
      source: 'logic'
    };
  }
}
