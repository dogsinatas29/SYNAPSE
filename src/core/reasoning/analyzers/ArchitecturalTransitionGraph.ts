import { 
    ALLOWED_STATES, 
    ALLOWED_EVENTS, 
    ALLOWED_TRANSITIONS, 
    ArchitecturalState, 
    ArchitecturalEvent 
} from './ArchitecturalVocabulary';

/**
 * v0.3.34.32 Architectural Reasoning Layer
 * 
 * Phase 8: Architectural Transition Graph (FSM 뼈대)
 * ArchitecturalVocabulary에서 확정된 3중 키(fromState, event, toState)를 바탕으로,
 * 상태 전이 시뮬레이션을 통제하는 순수 무방향/방향성 룰엔진입니다.
 */
export class ArchitecturalTransitionGraph {
    
    /**
     * 특정 상태에서 특정 이벤트를 받았을 때, 다음 상태를 반환합니다.
     * 정의되지 않은 전이는 null을 반환하여 환각 확산을 즉각 차단합니다.
     */
    public getNextState(currentState: ArchitecturalState, event: ArchitecturalEvent): ArchitecturalState | null {
        const edge = ALLOWED_TRANSITIONS.find(t => t.fromState === currentState && t.event === event);
        return edge ? edge.toState : null;
    }

    /**
     * Gate K (Coverage Audit) 등을 위한 헬퍼: 현재 상태에서 가능한 모든 이벤트 반환
     */
    public getAvailableEvents(currentState: ArchitecturalState): ArchitecturalEvent[] {
        return ALLOWED_TRANSITIONS
            .filter(t => t.fromState === currentState)
            .map(t => t.event);
    }
}
