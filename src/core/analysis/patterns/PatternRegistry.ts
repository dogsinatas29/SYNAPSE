import { PatternId } from './PatternId';

export interface PatternDefinition {
    patternId: PatternId;
    displayName: string;
    domain: string;
    status: string;
    gapType: string;
    targetScope: string;
    // Contract fact: does an actual PatternDetector implementation exist that can emit this patternId?
    hasDetector: boolean;
}

// [2026-09-25] P0-13 재검증을 위해 13개 PatternId 전체를 등재 (기존 6개 → 13개, 실제 코드 구현 여부 반영)
export const PatternRegistry: Map<PatternId, PatternDefinition> = new Map([
    [PatternId.DEPENDENCY_ROOT, {
        patternId: PatternId.DEPENDENCY_ROOT,
        displayName: 'Dependency Root',
        domain: 'ENTRY',
        status: 'IMPLEMENTED',
        gapType: 'E',
        targetScope: 'NODE',
        hasDetector: true
    }],
    [PatternId.SYSTEM_CORE, {
        patternId: PatternId.SYSTEM_CORE,
        displayName: 'System Core',
        domain: 'CORE',
        status: 'IMPLEMENTED',
        gapType: 'C',
        targetScope: 'NODE',
        hasDetector: true
    }],
    [PatternId.HIGH_ISOLATION_BOUNDARY, {
        patternId: PatternId.HIGH_ISOLATION_BOUNDARY,
        displayName: 'Boundary Fortress',
        domain: 'BOUNDARY',
        status: 'IMPLEMENTED',
        gapType: 'C',
        targetScope: 'CLUSTER',
        hasDetector: true
    }],
    [PatternId.BOUNDARY_CANDIDATE, {
        patternId: PatternId.BOUNDARY_CANDIDATE,
        displayName: 'Boundary Candidate',
        domain: 'BOUNDARY',
        status: 'IMPLEMENTED',
        gapType: 'B',
        targetScope: 'CLUSTER',
        hasDetector: true
    }],
    [PatternId.LOW_ISOLATION_BOUNDARY, {
        patternId: PatternId.LOW_ISOLATION_BOUNDARY,
        displayName: 'Weak Boundary',
        domain: 'BOUNDARY',
        status: 'IMPLEMENTED',
        gapType: 'B',
        targetScope: 'CLUSTER',
        hasDetector: true
    }],
    [PatternId.CHANGE_AMPLIFIER, {
        patternId: PatternId.CHANGE_AMPLIFIER,
        displayName: 'Change Amplifier',
        domain: 'BLAST',
        status: 'IMPLEMENTED',
        gapType: 'B',
        targetScope: 'CLUSTER',
        hasDetector: true
    }],
    [PatternId.CONTROL_BRIDGE, {
        patternId: PatternId.CONTROL_BRIDGE,
        displayName: 'Structural Control Bridge',
        domain: 'BLAST',
        status: 'IMPLEMENTED',
        gapType: 'B',
        targetScope: 'CLUSTER',
        hasDetector: true
    }],
    [PatternId.CASCADE_FAILURE_POINT, {
        patternId: PatternId.CASCADE_FAILURE_POINT,
        displayName: 'Cascade Failure Point',
        domain: 'SIMULATION',
        status: 'IMPLEMENTED',
        gapType: 'E',
        targetScope: 'NODE',
        hasDetector: true
    }],
    [PatternId.SAFE_REFACTORING_ZONE, {
        patternId: PatternId.SAFE_REFACTORING_ZONE,
        displayName: 'Safe Refactoring Zone',
        domain: 'SIMULATION',
        status: 'IMPLEMENTED',
        gapType: 'A',
        targetScope: 'NODE',
        hasDetector: true
    }],
    [PatternId.LEARNING_HUB, {
        patternId: PatternId.LEARNING_HUB,
        displayName: 'Learning Hub',
        domain: 'ENTRY',
        status: 'IMPLEMENTED',
        gapType: 'D',
        targetScope: 'NODE',
        hasDetector: true
    }],
    [PatternId.PERIPHERAL_COMPONENT, {
        patternId: PatternId.PERIPHERAL_COMPONENT,
        displayName: 'Peripheral Component',
        domain: 'CORE',
        status: 'IMPLEMENTED',
        gapType: 'D',
        targetScope: 'NODE',
        hasDetector: true
    }],
    [PatternId.METRIC_ACCESS_VIOLATION, {
        patternId: PatternId.METRIC_ACCESS_VIOLATION,
        displayName: 'Metric Access Violation',
        domain: 'AUDIT',
        status: 'IMPLEMENTED',
        gapType: 'N/A',
        targetScope: 'FILE',
        hasDetector: true
    }],
    [PatternId.VOCABULARY_VIOLATION, {
        patternId: PatternId.VOCABULARY_VIOLATION,
        displayName: 'Vocabulary Violation',
        domain: 'AUDIT',
        status: 'IMPLEMENTED',
        gapType: 'N/A',
        targetScope: 'FILE',
        hasDetector: true
    }]
]);
