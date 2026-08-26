/**
 * v0.3.34.32 Architectural Reasoning Layer
 * 
 * Phase 8.0: Transition Vocabulary Lock
 * 환각(Hallucination) 방지를 위해 상태 전이 시뮬레이션(StateTransitionAnalyzer)이 
 * 사용할 수 있는 유일한 상태(State)와 이벤트(Event)를 하드코딩 수준으로 엄격히 통제합니다.
 */

export const ALLOWED_STATES = [
    'UNOBSERVED',
    'DISCOVERED',
    'CLASSIFIED',
    'OWNED',
    'DOMINANT',
    'CORRIDOR_MEMBER',
    'PROPAGATED',
    'CONSTRAINED',
    'BOUNDARY_CROSSING',
    'AUTHORITY_IDENTIFIED',
    'OWNERSHIP_IDENTIFIED'
] as const;
export type ArchitecturalState = typeof ALLOWED_STATES[number];

export const ALLOWED_EVENTS = [
    'AUTHORITY_SIGNAL_FOUND',
    'BOUNDARY_CROSSING_DETECTED',
    'PROPAGATION_DETECTED',
    'CONSTRAINT_DETECTED'
] as const;
export type ArchitecturalEvent = typeof ALLOWED_EVENTS[number];

export interface TransitionEdge {
    fromState: ArchitecturalState;
    event: ArchitecturalEvent;
    toState: ArchitecturalState;
}

/**
 * 3중 키 매칭 기반 전이 허용표 (Transition Edge Registry)
 */
export const ALLOWED_TRANSITIONS: TransitionEdge[] = [
    {
        fromState: 'DISCOVERED',
        event: 'AUTHORITY_SIGNAL_FOUND',
        toState: 'AUTHORITY_IDENTIFIED'
    },
    {
        fromState: 'DISCOVERED',
        event: 'BOUNDARY_CROSSING_DETECTED',
        toState: 'CORRIDOR_MEMBER'
    },
    {
        fromState: 'AUTHORITY_IDENTIFIED',
        event: 'PROPAGATION_DETECTED',
        toState: 'DOMINANT'
    },
    {
        fromState: 'DOMINANT',
        event: 'CONSTRAINT_DETECTED',
        toState: 'CONSTRAINED'
    },
    {
        fromState: 'CORRIDOR_MEMBER',
        event: 'CONSTRAINT_DETECTED',
        toState: 'CONSTRAINED'
    }
];

export const FORBIDDEN_VOCABULARY = [
    'STABLE', 'UNSTABLE', 'HEALTHY', 'UNHEALTHY', 
    'CRITICAL', 'SAFE', 'RISKY', 'OPTIMAL', 'SUBOPTIMAL',
    'GOOD', 'BAD', 'ARCHITECT_DECIDES', 'REFACTOR_NEEDED', 'SYSTEM_IMPROVES'
];
