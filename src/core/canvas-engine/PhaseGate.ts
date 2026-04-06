import { Intent } from './Intent';
import { phaseManager, Phase } from '../PhaseManager';

/**
 * 🔒 SYNAPSE Phase Gate (v0.3.10)
 * 
 * 특정 인텐트가 현재 시스템의 Phase에서 실행 가능한지 결정한다.
 * RuleEngine 이전에 실행되며, 실행 권한(WHEN)만 담당한다.
 */

export class PhaseGate {
  /**
   * 🛡️ 현재 단계에서 해당 Intent 실행이 허용되는지 확인
   */
  public allow(intent: Intent): boolean {
    const currentPhase = phaseManager.getCurrentPhase();

    // 시스템이 잠겨있으면 모든 실행 거부
    if (phaseManager.isLocked()) return false;

    switch (intent.type) {
      case 'ADD_NODE':
      case 'CONNECT_EDGE':
        // 노드와 엣지 생성은 최소 GRAPH(1) 단계 이상이어야 함
        return currentPhase >= Phase.GRAPH;

      case 'MOVE_NODE':
        // 노드 이동은 제어(CONTROL: 3) 또는 그리드(GRID: 4) 단계 이상에서 가능
        return currentPhase >= Phase.CONTROL;

      case 'DELETE_NODE':
      case 'DELETE_EDGE':
      case 'UPDATE_EDGE':
      case 'UPDATE_NODE':
        return currentPhase >= Phase.CONTROL;

      default:
        return true;
    }
  }
}
