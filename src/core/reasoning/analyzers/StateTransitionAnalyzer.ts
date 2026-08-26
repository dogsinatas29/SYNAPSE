import { ArchitecturalState, ArchitecturalEvent } from './ArchitecturalVocabulary';
import { ArchitecturalTransitionGraph } from './ArchitecturalTransitionGraph';

export interface TransitionResult {
    from: ArchitecturalState;
    event: ArchitecturalEvent;
    to: ArchitecturalState | null;
}

/**
 * v0.3.34.32 Architectural Reasoning Layer
 * 
 * Phase 9: State Transition Executor (순수 실행기)
 * 목표: 현재 상태(from)와 입력 이벤트(event)를 조합하여, 
 * Transition Graph 룰에 따라 다음 상태(to)를 계산합니다.
 * 
 * [!CAUTION] 
 * 이 클래스는 어떠한 해석(Recommendation, Improvement, Healthy 판별 등)도 
 * 수행하지 않는 순수 FSM 실행기입니다. (Gate L 준수)
 */
export class StateTransitionAnalyzer {
    private graph: ArchitecturalTransitionGraph;

    constructor() {
        this.graph = new ArchitecturalTransitionGraph();
    }

    public simulateTransition(currentState: ArchitecturalState, event: ArchitecturalEvent): TransitionResult {
        const nextState = this.graph.getNextState(currentState, event);

        return {
            from: currentState,
            event: event,
            to: nextState
        };
    }
}
