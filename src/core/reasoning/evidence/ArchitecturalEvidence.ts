/**
 * v0.3.34.32 Architectural Reasoning Layer
 * 
 * Architectural Evidence
 * 결론(Conclusion)이나 판단(Judgment)을 철저히 배제하고,
 * 오직 정량적 사실(Fact)과 구조적/의미적 힌트(Hint)만을 담는 정적 데이터 컨테이너.
 * 
 * 주의: "HIGH_FAN_IN"이나 "MUST_EXIST" 같은 해석적 단어는 이 구조체에 존재할 수 없습니다.
 */

export interface SemanticHints {
  hasFactoryPattern: boolean;
  hasServiceRegistry: boolean;
  hasLifecycleControl: boolean;
  hasStateMutation: boolean;
  isEntryPoint: boolean;
}

export interface ConstraintHints {
  inboundDependencyCount: number;
  outboundDependencyCount: number;
  boundaryRootCount: number;
  singletonPatternDetected: boolean;
  uniqueImplementationCount: number;
  replacementCandidates: number;
}

export interface ArchitecturalEvidence {
  nodeId: string;
  boundaryId: string | null;
  
  // 1. Structural Evidence (절대값)
  fanIn: number;
  fanOut: number;
  blastRadius: number;
  
  // 2. Semantic Hints
  roleHints: SemanticHints;
  
  // 3. Constraint Hints
  constraintHints: ConstraintHints;
  
  // 4. Boundary Pressure Evidence
  crossBoundaryDependencies: string[];
  boundaryInboundPressure: number;
  
  // 5. Evidence Sources (Audit/Traceability를 위한 출처 기록)
  sources: {
    [key: string]: string;
  };
}
