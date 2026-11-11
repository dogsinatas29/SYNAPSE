# encoding: utf-8
# 📜 SYMBOL_RESOLUTION_SAFETY_CONTRACT.md: 심볼 해석 안전성 계약 명세

- **문서 버전**: v2.7 (C-01~C-06 데이터 계약·결정론적 불변식 완결판 — §8 정식 반영)
- **작성 기준 시각**: 2026-10-31T18:50:00+09:00
- **상태 관리**: 📐 `RATIFIED_SPEC` (데이터 계약 비준 완료; 구현 및 회귀검증은 엄격 분리)
- **원칙**: READ ONLY & ZERO CODE MODIFICATION (프로덕션 소스 코드 동결 유지)

---

## 1. 배경 및 제정 목적
 
 RustDesk 실측 실험 A 및 실험 B의 실행 결과 보고에서 다음 현상이 직접 관측됨:
 1. `SymbolIndex`의 전역 단일 매핑(`Map<string, string>`) 구조로 인해, `win32_window.cpp`의 COM 가상 메서드 호출(`Release()`) 및 C 소스의 Win32 커널 호출(`Sleep()`)이 프로젝트 내 특정 C/C++ 구현 파일(`FirewallRules.cpp`, `CustomActions.cpp`)로 부당하게 독점 바인딩되는 현상이 관측됨.
 2. 단순히 빌드/패키징 계층(`res/msi/CustomActions/*`)을 수집에서 제외(Pruning)할 경우, 해당 `Release` 간선이 올바르게 `unresolved`로 격리되는 대신 `SymbolIndex` 상의 차순위 파일(`src/platform/windows.cc`)로 2차 전이 하이재킹(Secondary Hijack)되는 중대한 왜곡이 보고됨.
 3. 따라서 **"심볼 리졸버의 안전성 계약"**을 사전에 명확히 확정하지 않고는 어떠한 스코프 제외 정책도 런타임 그래프의 의미론적 무결성을 보장할 수 없음.

---

## 2. 상태값(resolutionKind) 및 판정 축 용어 계약

기존 엔진의 동작 및 리포트 모델과의 충돌을 방지하기 위해 다음 4대 상태값의 경계를 엄격히 고정한다.

| 상태값 (`resolutionKind`) | 정의 및 적용 조건 | `fallbackReason` 적용 규칙 | 금지 사항 |
| :--- | :--- | :--- | :--- |
| **`direct`** | **물리적 파일 경로 해석(File-Path Resolution)의 확정**.<br>상대 경로(`./`, `../`), 컴파일러 include path 매핑, 언어 모듈 경로 규칙을 통해 출발지 소스에서 대상 물리 파일이 1:1로 확정된 경우.<br>*(주의: `direct`는 경로 해석의 확실성을 의미할 뿐이며, 경로 해석 성공만으로 실제 런타임 호출 관계의 의미론적 타당성이 보증되는 것은 아님)* | **`null`** (해석 성공 상태이므로 미해결 사유 불요) | 심볼 이름 일치나 휴리스틱 추론만으로 `direct`로 승격하는 행위 전면 금지. |
| **`symbol_index`** | **심볼 카탈로그 기반의 정적 호출 관계(Symbol-Call Resolution) 확정**.<br>Rule 1(가시성+호출문맥 일치)과 Rule 2(단일/복수 후보 검증)를 모두 통과하여 실제 호출 대상임이 독립 입증된 경우. | **`null`** (해석 성공 상태이므로 미해결 사유 불요) | 모호한 동음이의어 또는 가드 미검증 심볼을 `symbol_index`로 확정하는 행위 금지. |
| **`excluded_by_scope`** | **의도된 분석 범위 배제(Intentional Scope Exclusion)**.<br>1) 대상 파일이 물리적으로 실존(`fs.existsSync === true`)하고,<br>2) 해당 파일이 승인된 제외 규칙(Tier 1 빌드, Tier 2 패키징 등)에 정합하며,<br>3) **해당 참조가 실제로 그 파일을 대상으로 한다는 증거**가 **동시에 입증**된 경우에만 한정 부여.<br>*(주의: 이는 정상적인 범위 판정 성공 상태이며, 미해결 격리가 아님)* | **`null`** (정상적인 범위 판정이 확정된 상태이므로 미해결 사유 코드가 아님. 제외 상세 규칙은 `disambiguationRule` 및 `evidenceRefs`에 기록) | 제외된 후보가 존재했더라도 해당 호출이 원래 그 제외 대상을 가리켰다는 증거가 없다면 이 상태를 부여하지 않는다. |
| **`unresolved`** | **정직한 미해결 격리(Honest Unresolved Isolation)**.<br>호출 대상이나 연결 관계를 충분한 증거로 확정하지 못한 모든 경우 (후보 부재, 증거 부족, 시스템 API 의심, 제외 후보의 대체 불확실 등 전반).<br>*(주의: `unresolved`는 잘못된 간선을 제거하는 격리 수단임)* | **필수 (`string`)**<br>(아래 5대 표준 우선순위에 따라 결정론적 단일 대표 코드 부여) | 증거가 불충분함에도 그래프 연결성을 위해 임의의 파일로 대체하거나 가상 ID를 부여하는 행위 금지. |

---

## 3. 심볼 해석 5대 불변성 원칙 (Core Safety Rules)

### 📌 Rule 1: 후보 자격 인정과 최종 간선 확정의 분리 (Separation of Candidacy & Edge Confirmation)
- 단순히 토큰화된 함수/메서드 이름(`symbolName`)이 특정 파일에 존재한다는 이유만으로 의존성 간선(`CALL`)을 생성하는 것을 전면 금지한다.
- **후보 자격 인정 조건 (Candidacy Criteria)**:
  - 언어별 문법적 가시성(동일 네임스페이스, 상속, 명시적 `#include`, 모듈 임포트, Rust-C++ 간 명시적 FFI 선언 등)이 확인된 경우에만 해당 대상을 '심볼 해석 유효 후보군(`eligibleCandidatePaths`)'으로 편입한다.
- **최종 간선 확정 조건 (Edge Confirmation Criteria)**:
  - `#include`나 동일 네임스페이스는 선언/타입 가시성의 증거일 뿐, 특정 구현체로의 호출 확정 증거가 아니다.
  - 가상 메서드(COM vtable 등)나 오버로딩 함수는 수신 객체의 타입, 인터페이스 정의, 호출 표현식 문맥이 대상 구현 파일과 의미론적으로 일치한다는 독립적 정적 증거가 확인된 경우에만 최종 간선(`symbol_index`)으로 승격한다.

### 📌 Rule 2: 모호성 방지 및 단일 후보 승격 조건 (Ambiguity Prohibition & Single Candidate Verification)
- **복수 유효 후보 (`candidateCount >= 2`)**:
  - 가시성/타입 필터링을 통과한 유효 후보가 2개 이상일 경우, 등록 순서나 임의의 휴리스틱으로 1개 파일을 단일 선택하는 행위를 전면 금지한다.
  - 명확한 스코프(모듈 경로, 패키지 루트) 일치 근거가 없는 동음이의어 심볼은 단일 간선으로 확정하지 않는다.
- **단일 유효 후보 (`candidateCount === 1`)**:
  - `candidateCount === 1`은 필터링 후 남은 후보가 유일하다는 뜻일 뿐, 호출 대상이 올바르다는 증명이 아니다.
  - 단일 후보라 할지라도 Rule 1의 독립적인 연결 근거(모듈 경계, FFI 계약, 정적 가시성)가 입증되지 않으면 결코 `direct` 또는 `symbol_index` 확정 간선으로 승격하지 않고 `unresolved`로 격리한다.

### 📌 Rule 3: 다차원 문맥 기반 시스템 API 격리 (Multi-Dimensional System API Evaluation)
- 단순한 함수 이름 문자열 블랙리스트(단순히 `Release`, `read`, `size`를 이름만으로 차단하는 방식)는 정상적인 내부 함수까지 오판할 위험이 있으므로 금지한다.
- 시스템 API 및 표준 라이브러리 격리는 다음 5대 다차원 문맥을 종합 평가하여 판정한다:
  1. **언어 및 플랫폼 환경**: C/C++ (Win32/COM/POSIX), Rust (Std/Core/Alloc) 등
  2. **수신 객체 타입 및 API 선언**: `IUnknown`, `ITaskbarList3`, Win32 전역 함수 등
  3. **호출 표현식 및 호출원 정보**: 시스템 헤더 포함 여부, 시스템 호출 위치
  4. **프로젝트 내부 후보 vs 외부 API 후보 구분**: SDK 제공 함수인지 프로젝트 고유 도메인 로직인지 분리
  5. **실제 연결을 입증하는 정적 증거 여부**:
- 다차원 평가 결과 시스템 API로 판단되거나 내부 파일로의 연결이 불확실한 경우, 억지로 프로젝트 내부 노드에 매핑하지 않고 정직하게 **`resolutionKind: "unresolved"`**로 격리한다.

### 📌 Rule 4: 제외된 후보의 자동 전이 대체 금지 (No Arbitrary Fallback Shift)
- 특정 파일이나 디렉터리가 스코프 제외 정책(예: Tier 1 빌드 스크립트, Tier 2 MSI 패키징)에 의해 배제되었을 때, 기존에 해당 파일로 매핑되던 호출을 `SymbolIndex` 상의 차순위 파일로 자동 전이(Fallback Shift)시키는 것을 엄격히 금지한다.
- 대체 대상 파일의 실제 호출 유효성이 독립적인 언어 문법, 타입 일치, 가시성 검사로 입증되지 않는 한, 해당 호출은 무조건 **`unresolved`**로 전환되어야 한다.

### 📌 Rule 5: 4단계 후보군 계층화 및 2계층 감사 증거 스키마 (Dual-Layer Reproducible Evidence Schema)
- **후보군 집합의 4단계 분리 규격**:
  1. `discoveredCandidatePaths`: 검색 범위 전체에서 발견된 물리 파일 집합 (예: 텍스트 일치 파일 전수)
  2. `symbolCandidatePaths`: 해당 심볼의 실제 AST 정의/구현이 확인된 파일 집합
  3. `eligibleCandidatePaths`: 가시성, 네임스페이스, 모듈 바운더리, 타입 가드를 통과한 유효 후보 집합
  4. `selectedTarget`: 최종적으로 독립 증거를 통해 확정된 대상 노드 ID (미해결 시 `null`)

- **Layer 1: 9대 핵심 스키마 (Main Graph Edge / Reference Record)**
  리졸버가 심볼 매핑을 수행할 때, 모든 참조 레코드에 다음 **9대 핵심 필드**를 보존한다:

| 번호 | 필드명 | 타입 | 목적 및 설명 | 적용 규칙 |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `callerNodeId` | `string` | 호출원 노드 고유 식별자 | 필수 |
| 2 | `originalTarget` | `string` | 원래 추출된 식별자, 심볼명 또는 참조 경로 | 필수 |
| 3 | `candidateCountRaw` | `number` | `symbolCandidatePaths.length` (심볼 정의 보유 파일 수) | 필수 |
| 4 | `candidateCount` | `number` | `eligibleCandidatePaths.length` (가시성·타입 규칙 통과 유효 후보 수) | 필수 |
| 5 | `candidatePaths` | `string[]` | 실제로 검토된 `eligibleCandidatePaths` 후보 파일 목록 전수 | 필수 |
| 6 | `selectedTarget` | `string \| null` | 실제 선택된 대상 노드 ID (미해결/제외 시 `null`) | `direct`/`symbol_index` 시 필수, 그 외 `null` |
| 7 | `resolutionKind` | `string` | `direct`, `symbol_index`, `unresolved`, `excluded_by_scope` | 필수 |
| 8 | `disambiguationRule` | `string` | 적용된 규칙 ID 및 계약 버전 (예: `RULE-02-V1`) | 필수 |
| 9 | `fallbackReason` | `string \| null` | 최종 판정의 대표 사유 단일 코드 (아래 5대 표준 우선순위에 따라 결정) | **`unresolved` 시 필수**, `direct`/`symbol_index`/`excluded_by_scope` 시 `null` |

- **Layer 2: 진단 이벤트 레코드 (`evidenceRefs` 진단 스키마)**
  대표 사유 코드 하나만으로는 복합 조건(예: 시스템 API 판정 + MSI 스코프 제외 동시 발생)의 모든 맥락이 유실될 수 있으므로, `evidenceRefs`가 가리키는 외부 진단 이벤트 객체에 다음 감사 레코드를 전수 보존한다:

```typescript
interface DiagnosticTraceEvent {
  traceId: string;                     // evidenceRefs로 참조되는 고유 식별자
  callerNodeId: string;
  originalTarget: string;
  discoveredCandidatePaths: string[];  // 1단계: 디스크 전수 발견 목록
  symbolCandidatePaths: string[];      // 2단계: AST 심볼 정의 보유 파일 전수
  eligibleCandidatePaths: string[];    // 3단계: 가시성·타입 가드를 통과한 유효 후보 전수 (Layer 1과 1:1 일치)
  
  // A. 수집 완전성 5대 단계별 상태 검증 (Stage-wise Collection Completeness)
  collectionStatus: {
    overall: 'COMPLETE' | 'PARTIAL' | 'UNCOLLECTED';
    fileDiscoveryVerified: boolean;    // 프로젝트 범위 내 물리 파일 탐색 완료 여부
    astParsingVerified: boolean;       // 대상 파일 전체 AST 파싱 성공 여부 (실패 파일 목록 보존)
    symbolExtractionVerified: boolean; // 식별자 심볼 추출 완료 여부
    candidateFilteringVerified: boolean;// 가시성/타입 가드 평가 전수 완료 여부
    schemaIntegrityVerified: boolean;  // 필수 필드 및 참조 무결성 검증 여부
  };
  
  evaluatedConditions: {               // 평가된 모든 배타적/비배타적 조건 결과
    systemApiEvaluation: 'CONFIRMED' | 'NOT_CONFIRMED' | 'INDETERMINATE'; // 시스템 API 3상태 판독
    isPrunedFallback: boolean;         // P2: 제외 대상 의존 여부 및 대체 불확실 여부
    candidateCountRaw: number;         // P3: 원시 후보 수 (0 여부)
    candidateCount: number;            // P4: 유효 후보 수 (>= 2 여부)
    hasIndependentDisambiguationProof: boolean; // 복수 후보 중 특정 대상의 독립 확정 증거 유무
    insufficientEvidenceType: 'NO_VALID_CANDIDATE' | 'SINGLE_UNVERIFIED' | null; // P5 상세 구분
  };

  // C & D. 비결정성 배제를 위한 구조화된 판정 증거
  structuredEvidence: {
    platformContext: 'WIN32' | 'COM' | 'POSIX' | 'RUST_STD' | 'INTERNAL_CODE';
    receiverTypeInfo: string | null;   // 수신 객체 타입 (예: 'ITaskbarList3*')
    systemHeaderInclusion: string[];   // 호출원에서 인클루드된 시스템 헤더 (예: ['shobjidl.h'])
    
    // P4 독립 확정 증거의 후보별 직접 귀속 규격
    disambiguationProof?: {
      targetCandidatePath: string;     // 확정 대상 특정 후보 경로 (selectedTarget과 1:1 일치 필수)
      proofType: 'RECEIVER_TYPE_MATCH' | 'MODULE_BOUNDARY_MATCH' | 'EXPLICIT_FFI_DECLARATION' | 'VTABLE_SIGNATURE_MATCH';
      evidenceRef: string;             // 독립 증거가 위치한 AST 노드 또는 타입 선언 참조
      ruleId: string;                  // 검증에 적용된 규칙 ID (예: 'RULE-02-DISAMBIG')
      ruleVersion: string;             // 적용된 규칙 버전 (예: 'RULE-02-V2.5')
      isValidated: boolean;            // 4대 조건 실재성 및 유효성 검증 완료 여부 (isValidated === true <=> failureReason === null)
      validationAudit: {               // 감사 추적을 위한 구조화된 4대 검증 내역
        callerNodeId: string;
        candidatePath: string;
        candidateInEligibleVerified: boolean;  // 1) targetCandidatePath in eligibleCandidatePaths 검증
        selectedTargetMatchVerified: boolean;  // 2) selectedTarget 노드 ID와 1:1 일치 검증
        astEvidenceVerified: boolean;          // 3) evidenceRef AST 노드 실재성 검증
        typeEvidenceVerified: boolean;         // 4) proofType 언어별 타입/시그니처 일치 검증
        failureReason: string | null;          // 검증 실패 시 구체적 거절 사유 (성공 시 반드시 null)
      };
    };

    // P2 FALLBACK_PRUNED_REJECT 3대 증거 요건
    prunedFallbackProof?: {
      originalPrunedTarget: string;    // 1) 실제로 제외된 1차 후보 경로
      attemptedShiftTarget: string;    // 2) 리졸버가 전이를 시도한 차순위 후보 경로
      shiftRejectionReason: string;    // 3) 대체 후보의 연결 타당성 미입증 근거
    };

    // excluded_by_scope 4대 필수 증거 요건
    scopeExclusionProof?: {
      targetPhysicalPath: string;      // 1) 대상 물리 파일 경로 (fs.existsSync === true)
      exclusionRuleId: string;         // 2) 적용된 제외 규칙 식별자 (예: 'TIER-2-MSI-RULE')
      exclusionRuleVersion: string;    // 3) 제외 규칙 버전 (예: 'RULE-EXCL-V1.7')
      targetingEvidence: string;       // 4) 호출이 원래 그 파일을 가리켰다는 정적 증거 (직접 임포트 경로 등)
    };

    // direct 물리 경로 사전 확정 증거 상세 (P0 우회 시 필수)
    directPathProof?: {
      targetPhysicalPath: string;      // 1) 정규화된 대상 물리 파일 경로
      pathResolutionRuleId: string;    // 2) 경로 해석 규칙 식별자 (예: 'PATH-RESOLVE-RELATIVE')
      pathResolutionRuleVersion: string; // 3) 적용된 규칙 버전 (예: 'PATH-V1.2')
      fileExistsVerified: boolean;     // 4) 디스크 실존 확인 결과 (fs.existsSync === true)
    };

    ruleVersion: string;               // 적용된 안전성 계약 규칙 버전 (예: 'RULE-03-V2.5')
  };

  // B & E. 후보 탈락 정규화 및 구조화된 복수 위반 내역 전수 보존
  filterRejections: Array<{            // 각 탈락 후보당 정확히 1개의 대표 정규화 탈락 기록
    candidatePath: string;
    normalizedReason: 'NO_VISIBILITY' | 'NAMESPACE_MISMATCH' | 'TYPE_MISMATCH' | 'MODULE_BOUNDARY';
    ruleId: string;
    evidence: { expected: string; actual: string };
    allViolations: Array<{             // 해당 파일에서 발생한 모든 위반의 구조화된 상세 감사 기록
      reason: 'NO_VISIBILITY' | 'NAMESPACE_MISMATCH' | 'TYPE_MISMATCH' | 'MODULE_BOUNDARY';
      ruleId: string;
      expected: string;
      actual: string;
    }>;
  }>;

  appliedPriority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | null; // 최종 선정된 대표 우선순위
  representativeFallbackReason: string | null;             // 9대 필드의 fallbackReason과 일치
}
```

- **후보군 및 진단 수집 불변 규칙 (Invariant Collection Guarantees)**:
  1. `candidatePaths`와 `candidateCount`는 동일한 판정 시점의 `eligibleCandidatePaths`를 1:1로 엄격히 반영한다 (`candidatePaths.length === candidateCount`).
  2. **후보군 집합 분모 고정 및 4대 집합론적 검증 조건 (Set-Theoretic Partition Validation)**:
     - 필터링 시작 시점의 대상 집합은 AST 정의가 확인된 `symbolCandidatePaths`로 고정되며, 모든 후보 경로는 중복 없는 정규화 경로(`path.normalize`)로 관리된다.
     - 단순 개수 일치뿐 아니라 다음 **4대 집합 일치 조건이 동시에 성립**해야 한다:
       1) $\text{rejectedCandidatePaths} \equiv \{ r.\text{candidatePath} \mid r \in \text{filterRejections} \}$ (탈락 경로와 탈락 기록의 1:1 전단사 일치)
       2) $\text{eligibleCandidatePaths} \cap \text{rejectedCandidatePaths} = \emptyset$ (상호 배타성: 동일 후보의 유효/탈락 동시 존재 금지)
       3) $\text{eligibleCandidatePaths} \cup \text{rejectedCandidatePaths} \equiv \text{symbolCandidatePaths}$ (완전성: 누락/이탈 후보 전무)
       4) $\forall p \in \text{symbolCandidatePaths}$, 중복이 없으며($\text{Set}(p).size = p.length$) 정확히 하나의 최종 상태를 가짐.
  3. **4대 파일 집합 분할 체계 및 `COMPLETE` 산출의 논리적 동치 불변식**:
     프로젝트 내 발견된 모든 파일은 다음 4대 상호 배타적 분할(Mutually Exclusive & Collectively Exhaustive Partition)로 명확히 분류되어야 한다:
     - `discoveredFiles`: 탐색 루트 내에서 발견된 모든 물리 파일의 전체 집합
     - `excludedFiles`: 승인된 정책(Tier 1/2)에 따라 의도적으로 스코프에서 제외된 파일 집합
     - `nonTargetFiles`: 파일 형식(바이너리, 미디어, 압축 파일 등)이나 파서 미지원 범위로 인해 분석 대상이 아닌 비소스 파일 집합
     - `analysisTargetFiles`: 실제 AST 파싱 및 심볼 추출 대상인 소스 파일 집합
     $$\text{discoveredFiles} = \text{analysisTargetFiles} \uplus \text{excludedFiles} \uplus \text{nonTargetFiles}$$
     $$\text{analysisTargetFiles} \equiv \text{discoveredFiles} \setminus (\text{excludedFiles} \cup \text{nonTargetFiles})$$
     - 의도적 스코프 제외(`excludedFiles`)와 파서 미지원 비대상(`nonTargetFiles`)은 명확히 서로 다른 이유 코드로 기록 및 분리 관리된다.
     $$\text{overall} = \text{COMPLETE} \iff \bigwedge_{i=1}^{5} \text{stage}_i = \text{true}$$
     - `fileDiscoveryVerified`: 분석 루트, 제외 규칙, 파서 지원 확장자 목록, 심볼릭 링크 처리 결과가 감사 로그에 영구 보존됨을 검증.
     - `astParsingVerified`: **`analysisTargetFiles`에 속한 모든 파일에 대해 AST 파싱이 100% 성공했음을 검증**. (1개라도 파싱 실패 시 `astParsingVerified = false` $\rightarrow$ `overall: 'PARTIAL'` 강등 및 실패 파일/원인 전수 기록. `nonTargetFiles`나 `excludedFiles`의 미파싱은 강등 사유가 아님).
     - `symbolExtractionVerified`, `candidateFilteringVerified`, `schemaIntegrityVerified`까지 5대 하위 검증이 **모두 참(`true`)일 때에만** `overall: 'COMPLETE'`가 부여된다.
  4. **수집 불완전 시의 상태 처리 규칙**:
     `collectionStatus.overall`이 `'PARTIAL'` 또는 `'UNCOLLECTED'`인 경우, 후보 탈락 등식 검증을 수행하지 않고 **'수집 불완전(Trace Incomplete)'**으로 판정한다.
  5. **`normalizedReason`의 결정론적 우선순위 함수**:
     후보 파일이 복수의 필터링 규칙을 위반했을 경우, 임의 선택을 금지하고 언어 의미론적 의존성 계층에 따라 다음 고정 순서로 단일 `normalizedReason`을 결정한다:
     - **Rank 1**: `NO_VISIBILITY` (언어적 가시성/스코프 부재 - 최상위 차단)
     - **Rank 2**: `MODULE_BOUNDARY` (패키지/모듈 경계 위반)
     - **Rank 3**: `NAMESPACE_MISMATCH` (네임스페이스 불일치)
     - **Rank 4**: `TYPE_MISMATCH` (수신 객체 및 시그니처 불일치)
     *(단, 위반된 모든 사유는 `allViolations` 구조화 배열에 중복 없이 정렬되어 전수 보존된다)*
  6. **`disambiguationProof` 및 `validationAudit` 검증 불변식**:
     `disambiguationProof` 필드가 존재하더라도 감사 레코드(`validationAudit`)의 4대 검증 플래그가 모두 참으로 검증되지 않으면 승격이 거절된다. 다음 불변식이 강제된다:
     1) **감사 플래그 완전성**: `candidateInEligibleVerified === true`, `selectedTargetMatchVerified === true`, `astEvidenceVerified === true`, `typeEvidenceVerified === true`가 **동시에 성립**해야만 `isValidated === true`가 성립한다.
     2) **성공/실패 상호 배타성**:
        $$\text{isValidated} = \text{true} \iff \text{failureReason} = \text{null}$$
        $$\text{isValidated} = \text{false} \iff \text{failureReason} \neq \text{null}$$
        `isValidated === true`이면서 `failureReason !== null`이거나, `isValidated === false`이면서 `failureReason === null`인 비정상 상태는 불변식 위반으로 즉시 검증 실패 처리된다.
     3) **관계 일치성**: 검증 대상 후보(`candidatePath`), 선택된 노드(`targetCandidatePath`), 호출원(`callerNodeId`) 간의 식별자 및 경로 관계가 1:1로 엄격히 일치해야 한다.

---

## 4. `fallbackReason` 판정 우선순위 및 규칙 매트릭스 (Deterministic Hierarchy)

동일한 입력 조건에서 항상 결정론적인 단일 대표 `fallbackReason`이 산출되도록 다음 평가 절차를 엄격히 적용한다.

### 📌 사전 평가: `direct` 물리 경로 해석의 P0 우회 게이트 (Pre-Evaluation Direct Gate)
- P0 전역 수집 불완전 검사보다 **선행하여 `direct` 물리 경로 증거를 사전 평가**한다.
- 다음 **4대 물리 경로 증거 조건**이 충족된 모든 참조는 전역 수집 결손(`PARTIAL`)과 무관하게 P0 게이트를 안전하게 우회하여 `resolutionKind: "direct"`, `fallbackReason: null`로 즉시 확정된다:
  1) 호출원-대상 간 경로 해석 규칙(상대 경로, 컴파일러 include path 매핑, 언어 모듈 경로 규칙)이 명시적으로 입증됨 (`pathResolutionRuleId`, `pathResolutionRuleVersion` 기록)
  2) 해석 결과가 디스크 상에 실존하는 단 하나의 정규화된 물리 파일(`path.normalize`)로 확정됨 (`fs.existsSync === true`)
  3) 대상 파일 실존 및 해석 경로 매핑 근거가 진단 레코드에 보존됨 (`directPathProof.fileExistsVerified === true`)
  4) 심볼 이름 일치나 휴리스틱 후보 선택에 전혀 의존하지 않음
  *(경계 명확화: `direct`가 보장하는 것은 1:1 물리 파일 경로 해석의 확실성이지, 런타임 호출 관계의 의미론적 실행 가능성이 아님. 따라서 독립 회귀 테스트 시에도 단순 경로 해석 성공만으로 언어별 런타임 호출 의미론까지 완전 검증된 것으로 간주하지 않고 엄격히 분리 평가함)*

### 📌 P0: 전역 수집 불완전 게이트 (Universal Incompleteness Gate)
- **적용 범위**: 사전 `direct` 확정을 거치지 않은 심볼 카탈로그 기반의 모든 해석(`symbol_index`, 모호성, 후보 부재 전반)에 전면 적용된다.
- **P0 트리거 시 표준 출력 스키마 고정**:
  - `resolutionKind`: `"unresolved"`
  - `fallbackReason`: `"TRACE_INCOMPLETE"`
  - `selectedTarget`: `null`

```text
[입력: 호출 표현식, 심볼명, 호출원]
        │
        ▼ (사전 평가: direct 물리 경로 4대 증거 검증)
물리 경로 4대 증거가 충족되는가?
  ├─ YES ──> [resolutionKind: direct, fallbackReason: null, selectedTarget: 물리노드ID] (P0 우회 확정)
  └─ NO (심볼 기반 해석 대상)
        │
        ▼ (Priority 0: 전역 수집 상태 검사)
수집 상태가 COMPLETE인가?
  ├─ NO (PARTIAL / UNCOLLECTED) ──> [resolutionKind: unresolved, fallbackReason: TRACE_INCOMPLETE, selectedTarget: null]
  └─ YES (COMPLETE)
        │
        ▼ (Priority 1: 시스템 API 절대 우선 가드)
다차원 문맥 평가 결과 시스템 API (Win32/COM/POSIX)로 확정(CONFIRMED)되었는가?
  ├─ YES ──> [SYSTEM_API_GUARD] (대표 사유 확정. 내부 후보의 독립 증거 유무와 무관하게 차단)
  └─ NO (NOT_CONFIRMED 또는 INDETERMINATE)
        │
        ▼ (Priority 2: 제외 후보 대체 전이 차단)
1) 원래 후보가 제외되었고, 2) 대체 전이가 시도되었으며, 3) 대체 연결 타당성이 미입증되었는가?
  ├─ YES ──> [FALLBACK_PRUNED_REJECT] (대표 사유 확정. 2차 왜곡 전이 차단)
  └─ NO
        │
        ▼ (Priority 3: 분석 범위 내 정의 부재)
프로젝트 분석 범위 내에서 심볼 정의를 가진 원시 후보가 전혀 없는가? (candidateCountRaw === 0)
  ├─ YES ──> [NO_CANDIDATE] (분석 범위 내 정의 부재로 확정. 외부 소속 단정 금지)
  └─ NO (candidateCountRaw >= 1)
        │
        ▼ (Priority 4: 복수 유효 후보 검증)
유효 후보가 2개 이상(candidateCount >= 2)인가?
  ├─ [특정 후보 귀속 disambiguationProof 유효성 검증 완료] ──> [symbol_index 확정 승격] (selectedTarget 확정)
  ├─ [독립 확정 증거 부재 또는 검증 실패] ──> [AMBIGUOUS_CANDIDATES] (동음이의어 모호성 거절)
  └─ NO (candidateCount <= 1)
        │
        ▼ (Priority 5: 단일 후보 검증 및 미판정 격리)
유효 후보가 0개(전원 탈락)이거나 1개이나 독립 증거가 부족한가? (candidateCount in {0, 1})
  └─ YES ──> [INSUFFICIENT_EVIDENCE]
             (진단: systemApiEvaluation === 'INDETERMINATE'인 경우 내부 후보 무검증 승격 차단 플래그 보존)
```

### 상세 우선순위 정의표
| 우선순위 | 사유 코드 (`fallbackReason`) | 트리거 조건 (Evaluation Condition) | 진단 이벤트 세부 보존 사항 | 비고 및 설명 |
| :---: | :--- | :--- | :--- | :--- |
| **Pre-Direct**| **`null` (`direct` 확정)** | 물리 경로 4대 증거가 충족됨 | 경로 매핑 규칙, 물리 파일 실존 확인 근거 | **P0 우회**: 전역 수집 결손과 무관하게 1:1 물리 파일 실존 확정 |
| **P0-Gate**| **`TRACE_INCOMPLETE`** | `collectionStatus.overall !== 'COMPLETE'`인 상태에서 심볼 해석 시도 | 파싱 실패 파일 목록, 미탐색 범위, 수집 결손 단계 | **표준 출력**: `resolutionKind: "unresolved"`, `fallbackReason: "TRACE_INCOMPLETE"`, `selectedTarget: null` 고정 |
| **P1** | **`SYSTEM_API_GUARD`** | 5대 다차원 문맥 평가 결과 `systemApiEvaluation === 'CONFIRMED'`로 확정됨 | 수신 객체 타입, 시스템 헤더 참조, P2(스코프 제외 후보 존재) 동시 발생 여부 | **절대 우선**: 내부 후보에 대한 독립 증거가 존재하더라도 시스템 API가 `CONFIRMED`이면 최우선 차단 |
| **P2** | **`FALLBACK_PRUNED_REJECT`** | **3대 필수 요건 입증 시에만 한정 부여**:<br>1) 원래 1차 매핑 후보가 스코프에서 제외됨<br>2) 리졸버가 차순위 파일로의 전이 경로에 진입함<br>3) 대체 후보의 정적 호출 타당성이 미입증됨 | `prunedFallbackProof` 구조체(원래 제외 후보, 전이 시도 대상, 거절 사유 전수 기록) | 2차 심볼 하이재킹 전이를 원천 차단. 3대 요건 미입증 시 P2 부여 금지 |
| **P3** | **`NO_CANDIDATE`** | `collectionStatus.overall === 'COMPLETE'` 상태에서 프로젝트 분석 범위 내 심볼 정의 파일 부재 (`candidateCountRaw === 0`) | 조회된 식별자명, 소스 파싱 범위 | **분석 범위 내 정의 부재 한정 판정**: 별도 증거 없이 외부 라이브러리/SDK 소속으로 단정하는 행위 엄격 금지 |
| **P4** | **`AMBIGUOUS_CANDIDATES`** | 가시성/타입 규칙을 통과한 유효 후보가 2개 이상(`candidateCount >= 2`)이며, 특정 후보를 확정할 `disambiguationProof`가 부재하거나 유효하지 않은 경우 | 통과된 `eligibleCandidatePaths` 전수 목록 및 모호성 충돌 로그 | **독립 증거와 모호성 분리**: 특정 후보에 귀속된 독립 증거가 유효 검증된 경우에만 `symbol_index`로 승격하며, 부재 시 P4 거절. (`INDETERMINATE`라도 특정 후보 독립 증거가 유효하면 승격 가능하나, 증거가 없으면 `INDETERMINATE`를 이유로 임의 선택 불가) |
| **P5** | **`INSUFFICIENT_EVIDENCE`** | 1) 원시 후보는 존재했으나 가시성 검증에서 전원 탈락하여 유효 후보가 0개가 되었거나 (`candidateCountRaw >= 1` & `candidateCount === 0`),<br>2) 유효 후보가 1개 존재하나(`candidateCount === 1`) Rule 1의 독립적 확정 증거가 부족한 경우.<br>*(주의: `systemApiEvaluation === 'INDETERMINATE'`인 상태에서 남은 단일 후보는 독립 증거가 입증되지 않는 한 반드시 P5로 격리)* | `insufficientEvidenceType`: `NO_VALID_CANDIDATE` vs `SINGLE_UNVERIFIED` 명시적 구분 | 단일 후보 무검증 승격 차단 및 시스템 API 미판정 시의 임의 확정 방지 |

### 📌 `excluded_by_scope` vs `FALLBACK_PRUNED_REJECT` 명시적 판정 경계 및 대체 미시도 예외 규격
1. **`excluded_by_scope` (정상적 범위 판정)**:
   - `scopeExclusionProof` 4대 증거(물리 실존, 규칙 ID, 규칙 버전, 타겟팅 증거)가 **모두 입증**된 경우에만 부여.
   - 최종 상태: `resolutionKind: "excluded_by_scope"`, `fallbackReason: null`.
2. **`unresolved` + `FALLBACK_PRUNED_REJECT` (잘못된 대체 전이 거절)**:
   - `prunedFallbackProof` 3대 요건(원래 대상 제외, 전이 시도, 타당성 미입증)이 입증되어 2차 전이를 차단한 경우.
   - 최종 상태: `resolutionKind: "unresolved"`, `fallbackReason: "FALLBACK_PRUNED_REJECT"`.
3. **경계 사례: 대체 전이가 시도되지 않은 제외 대상 (Pruned Target without Shift Attempt)**:
   - 원래 후보가 스코프 제외 대상임은 확인되었으나, 리졸버가 차순위 후보 탐색이나 대체 전이를 시도하지 않은 경우.
   - **판정 규칙**: P2의 '전이 시도' 요건이 결여되었으므로 결코 `FALLBACK_PRUNED_REJECT`를 부여할 수 없다.
     - 원래 대상과의 직접적 타겟팅 증거가 완비되어 있다면 $\rightarrow$ `excluded_by_scope` 부여.
     - 타겟팅 증거가 불충분하다면 $\rightarrow$ `unresolved` 격리 및 실제 증거 상태에 따른 사유 코드(예: `INSUFFICIENT_EVIDENCE` 또는 `NO_CANDIDATE`) 부여.
     - *원칙*: 제외 사실만으로 대체 전이를 추정하거나 P2를 부여하는 행위는 엄격히 금지된다.

---

## 5. 기존 리졸버 동작 vs 안전성 계약 대응표 (읽기 전용 설계 검토)

| 항목 / 규칙 ID | 입력 조건 | 기존 엔진 동작 (AS-IS) | 계약 후 기대 상태 (TO-BE) | 실패 판정 조건 (FAIL Criteria) |
| :--- | :--- | :--- | :--- | :--- |
| **CR-01 (Rule 1)** | 심볼명만 일치, 가시성 증거 부재 | `SymbolIndex` 전역 Map에서 선점 파일로 즉시 연결 | 후보군 미편입 $\rightarrow$ `unresolved` (`fallbackReason: INSUFFICIENT_EVIDENCE`) | 증거 없는 호출이 간선으로 확정된 경우 |
| **CR-02 (Rule 2)** | 유효 후보 2개 이상 (`candidateCount >= 2`) | 먼저 스캔된 C/C++ 구현체로 단일 매핑 독점 | 임의 단일 선택 금지 $\rightarrow$ `unresolved` (`fallbackReason: AMBIGUOUS_CANDIDATES`) | 모호한 동음이의어가 단일 간선으로 승격된 경우 |
| **CR-03 (Rule 2)** | 단일 후보 (`candidateCount === 1`) | 유일 후보라는 이유로 무조건 간선 생성 | 독립 증거 검증 $\rightarrow$ 불충분 시 `unresolved` (`fallbackReason: INSUFFICIENT_EVIDENCE`) | 단일 후보가 검증 없이 `direct` 또는 확정된 경우 |
| **CR-04 (Rule 3)** | COM 메서드 / Win32 커널 API 호출 | 식별자 일치하는 프로젝트 소스로 하이재킹 | 5대 다차원 문맥 평가 $\rightarrow$ `unresolved` (`fallbackReason: SYSTEM_API_GUARD`) | Win32/COM 호출이 내부 소스로 오결합된 경우 |
| **CR-05 (Rule 4)** | 매핑 대상 파일이 스코프 제외됨 | 차순위 등록 파일로 자동 전이 (2차 왜곡) | 자동 대체 금지 $\rightarrow$ `unresolved` (`fallbackReason: FALLBACK_PRUNED_REJECT`) | 제외 파일의 호출이 무관한 파일로 2차 전이된 경우 |

---

## 6. 심볼별 판정 및 향후 독립 회귀 검증 사례 정의

| 심볼 식별자 | 런타임 호출 성격 | 현재 실측 판정 | 향후 독립 회귀 테스트 요구사항 (Test Cases) |
| :--- | :--- | :---: | :--- |
| **`Release`** | COM `IUnknown::Release()` | **2차 왜곡 실증** | 1. MSI 제외 시 `windows.cc`로 2차 전이되지 않고 `unresolved` (`SYSTEM_API_GUARD` 또는 `FALLBACK_PRUNED_REJECT`)로 격리되는가?<br>2. 수신 포인터 타입(`ITaskbarList3`)이 다차원 평가에서 시스템 COM으로 식별되는가? |
| **`Sleep`** | Win32 `Sleep(DWORD)` | **오결합 실증** | 1. `wf_cliprdr.c`, `IddController.c`의 커널 호출이 `CustomActions.cpp`로 매핑되지 않는가?<br>2. 단일 후보라도 시스템 API 가드에 의해 `unresolved` (`SYSTEM_API_GUARD`)로 격리되는가? |
| **`ReadConfig`** | Rust $\rightarrow$ C++ 크로스 랭귀지 | **`UNVERIFIED`** | 1. FFI 링크나 C-ABI 선언 없는 임의 결합이 원천 차단되는가?<br>2. 후보 존재 여부와 무관하게 크로스 랭귀지 증거 부재로 `unresolved` (`INSUFFICIENT_EVIDENCE`) 처리되는가? |
| **`excluded_by_scope` 정상 제외** | 제외 대상 파일 직접 참조 | **설계 검증 대상** | 직접 임포트된 제외 파일 대상 참조가 `unresolved`가 아닌 `excluded_by_scope`(`fallbackReason: null`)로 정확히 기록되는가? |
| **복수 후보 모호성** | 동음이의어 전역 함수 | **설계 검증 대상** | 복수 후보 발생 시 임의 선점 매핑 없이 `disambiguationRule`에 의해 안전하게 거절되는가? |

---

## 7. 공식 상태 분리 및 거버넌스

- **상태 관리의 3단계 분리**:
  1. **`PROPOSED` (현재 상태)**: 설계 계약 및 불변 규칙 명세 수립 완료. (문서 작성 $\neq$ 구현 완료)
  2. **`IMPLEMENTED`**: 소스 코드 동결 해제 및 승인 하에 계약 규칙이 리졸버에 코드로 반영된 상태.
  3. **`REGRESSION_VERIFIED`**: 5대 회귀 테스트 사례를 통과하여 파이프라인 상에서 증명된 상태.
- **불변 원칙**:
  - 현재 프로덕션 소스 코드(`src/`, `ui/`)는 완전한 **Strict Code Freeze**를 유지함.
  - 실험 B의 실패 기록(2차 왜곡 발생)은 본 계약이 `REGRESSION_VERIFIED`되기 전까지 어떠한 경우에도 성공으로 변경되거나 왜곡되지 않음.

---

## 8. 데이터 계약 및 불변식 정밀 보완 조항 (C-01 ~ C-06 Formalization)

본 절은 거버넌스 심의 판정(`CONDITIONALLY_ACCEPTABLE — REVISION REQUIRED`)에 따라 기존 설계의 재작성 없이 C-01부터 C-06까지 6대 핵심 데이터 계약 및 불변식 충돌을 결정론적으로 종결하기 위해 추가된 필수 규격이다.

### 8.1. [C-01] `referenceId` 결정론성 및 UTF-8 해시 입력 규격 (P0)

1. **AST 순회 독립적 `occurrenceIndex` 결정 규칙**:
   - `occurrenceIndex`는 AST 방문 순서(Traversal Order)에 의존하여 부여하지 않는다.
   - **그룹화 기준**: 동일한 정규화 파일 경로(`normalizedPath`), 정규화된 1-based 소스 좌표(`startLine`, `startCharacter`, `endLine`, `endCharacter`), 및 토큰 텍스트(`callToken`)를 공유하는 참조 집합 내에서만 국소적으로 부여된다.
   - **정렬 기준**: 소스 내 노드의 절대 바이트 시작 오프셋(`startOffset`) 및 종료 오프셋(`endOffset`)의 오름차순으로 순서를 확정한다.
   - **식별 불가 예외 처리**: 동일한 물리 좌표(`startOffset`, `endOffset`)와 동일 토큰을 가짐에도 불구하고 정규화 좌표계 내에서 독립성이 입증되지 않는 동시성/중첩 매크로 확장 참조는 임의 번호를 부여하지 않고 **식별 실패(`IDENTIFIER_COLLISION_ERROR`)**로 처리하여 격리한다.
2. **`canonicalStream` UTF-8 바이트 직렬화 규격**:
   - `referenceId` 생성의 원천이 되는 `canonicalStream`은 `ASCII Unit Separator (0x1F)` 바이트로 필드를 구분하며, 플랫폼 및 런타임의 기본 인코딩에 영향을 받지 않도록 **강제 UTF-8 바이트 시퀀스로 고정 직렬화**한 후 SHA-256을 계산한다:
     $$\text{canonicalStream} = \text{UTF-8}(\text{normalizedPath} \parallel \text{0x1F} \parallel \text{startLine} \parallel \text{0x1F} \parallel \text{startChar} \parallel \text{0x1F} \parallel \text{endLine} \parallel \text{0x1F} \parallel \text{endChar} \parallel \text{0x1F} \parallel \text{callToken} \parallel \text{0x1F} \parallel \text{occurrenceIndex})$$
     $$\text{referenceId} = \text{SHA-256}(\text{canonicalStream})$$
   - 연결 테스트: `test_gate2_v1_symbol_index.ts`의 결정론적 좌표 식별자 테스트 케이스와 바인딩.

---

### 8.2. [C-02] 참조 식별자 집합 기반 보존성 불변식 (P0)

단순 간선 수 합산식($N_{\text{ref}} = |\text{Edges}| + |\text{Ledger}|$)은 다대일/일대다 매핑 시 보존성을 증명할 수 없으므로, **참조 식별자 집합(Set of Reference IDs)의 상호 배타적 분할(Disjoint Partition) 불변식**으로 대체 고정한다.

1. **참조 집합 분할 불변식**:
   $$R_{\text{extracted}} = R_{\text{resolved}} \uplus R_{\text{unresolved}} \uplus R_{\text{excluded}}$$
   - $R_{\text{extracted}}$: 추출된 전체 고유 `referenceId` 집합.
   - $R_{\text{resolved}}$: 안전성 계약을 통과하여 1개 이상의 유효 간선으로 바인딩된 참조 집합.
   - $R_{\text{unresolved}}$: 미해결 참조 원장(`UnresolvedReferenceLedger`)에 수록된 참조 집합.
   - $R_{\text{excluded}}$: 스코프 제외 정책에 의해 정상 제외된 참조 집합 (`excluded_by_scope`).
   - 불변 조건: $R_{\text{resolved}} \cap R_{\text{unresolved}} = \emptyset$, $R_{\text{resolved}} \cap R_{\text{excluded}} = \emptyset$, $R_{\text{unresolved}} \cap R_{\text{excluded}} = \emptyset$.
2. **참조와 간선 간의 관계 규격**:
   - **N:1 매핑 허용**: 복수의 `referenceId`가 동일한 소스 파일과 타깃 파일/노드를 가리킬 때, 하나의 간선(Edge) 메타데이터 배열(`referenceIds: string[]`)에 복수의 참조 식별자가 수록될 수 있다.
   - **1:N 매핑 금지**: 단일 `referenceId`가 복수의 간선으로 분기되는 것은 허용되지 않는다 (단일 진실의 원칙).
   - **중복 기록 방지**: 동일한 `referenceId`는 원장(`UnresolvedReferenceLedger`) 또는 간선 풀 전체에서 정확히 1회만 출현해야 한다.
   - **`diagnosticTraceRef` 누락 예외**: 진단 추적 기록 생성이 실패한 경우 임의 누락을 금지하며, 원장에 `diagnosticTraceRef: "TRACE_GENERATION_FAILED"`를 기록하고 감사 경고를 발생시킨다.

---

### 8.3. [C-03] COM/Win32 시스템 API 가드 확정 타입 증거 및 상태 전이 규격 (P0)

1. **증거 계층 및 최소 확정 요건**:
   - COM 표준 헤더(`#include <windows.h>`, `<unknwn.h>` 등) 포함 및 `->Release()` 문법 패턴은 **보조 증거(Supporting Evidence)**에 불과하며, 단독 또는 조합으로 `CONFIRMED`를 선언할 수 없다.
   - **강한 증거(Strong Evidence)**: 수신 객체의 정적/추론 타입이 시스템 COM 인터페이스(`IUnknown`, `IDispatch` 등)로 바인딩되거나, 인터페이스 상속 관계 및 메서드 선언이 시스템 SDK 범주에 속함이 입증된 경우.
   - **내부 타입 상쇄**: 수신 객체 또는 클래스가 프로젝트 내부 선언/구현체로 확인되면 헤더나 메서드 이름과 무관하게 `NOT_CONFIRMED`로 판정한다.
2. **엄격한 3상태 전이 매트릭스**:
   ```text
   [입력 호출]
      │
      ├── (강한 증거로 시스템 API 입증) ──────────────> CONFIRMED
      │                                                └──> SYSTEM_API_GUARD -> unresolved (격리)
      │
      ├── (프로젝트 내부 타입/메서드로 확인) ─────────> NOT_CONFIRMED
      │                                                └──> 일반 내부 심볼 해석 허용
      │
      └── (단순 헤더/문법 일치, 타입 미확정) ────────> INDETERMINATE
                                                         │
                                                         ├── (독립적인 내부 심볼 증거 존재: 가시성/스코프 완비)
                                                         │     └──> 일반 심볼 해석 허용
                                                         │
                                                         └── (독립적인 내부 증거 부재)
                                                               └──> INSUFFICIENT_EVIDENCE -> unresolved (격리)
   ```
   *참고*: 독립적 내부 증거란 단순 이름 일치 후보 존재가 아니라, 해당 소스 유닛에서 가시적이고 도달 가능한 선언이 존재함을 뜻함.
   - 연결 테스트: `CR-04`, `Release`, `Sleep` 회귀 검증 항목과 바인딩.

---

### 8.4. [C-04] 정규화 경로 vs 물리 파일(Realpath) 동일성 분리 규격 (P1)

1. **동일성 판정 계층 분리**:
   - **정규화 경로 동일성 (`NormalizedPathEquality`)**: `path.resolve()` 및 POSIX 구분자 정규화를 통해 문자열 차원의 `.` 및 `..` 해석 경로가 일치하는 상태.
   - **물리 파일 객체 동일성 (`PhysicalFileIdentity`)**: 파일 시스템 레벨에서 심볼릭 링크를 추적하여 실제 동일한 i-node 또는 고유 파일 엔티티에 도달함을 보증하는 상태 (`fs.realpathSync` 또는 파이프라인 매니페스트 바이트/해시 동일성).
2. **Type 1 폴백 적용 제약**:
   - 파이프라인이 정적 경로 정규화만 수행하고 파일 시스템에 실시간 조회하지 않는 경우, '물리적 동일성'을 표방할 수 없으며 오직 **정규화 경로 기반 일치(`NormalizedPathEquivalent`)**로만 기록해야 한다.
   - 심볼릭 링크 가능성이 존재하는 외부 경로는 물리 조회가 수반되지 않는 한 동일 객체로 간주하여 간선을 연결하는 것을 금지한다.

---

### 8.5. [C-05] Include 관계와 Call/Reference 관계의 명시적 분리 규격 (P0)

1. **관계 계층의 엄격한 분리**:
   - **Include 엣지 (`kind: "include"`)**: 소스 파일이 헤더 파일을 물리적으로 포함한다는 구조적 의존 관계.
   - **Call/Reference 엣지 (`kind: "call" | "reference"`)**: 소스 내 호출부가 특정 함수, 메서드, 심볼의 선언 또는 정의를 바인딩한다는 의미적 참조 관계.
2. **Type 2 헤더 연결 왜곡 방지**:
   - 소스 파일 $A$가 헤더 $H$를 include하고 있다는 사실($A \xrightarrow{\text{include}} H$)만으로, $A$ 내부의 호출 $c$가 $H$에 선언된 함수 $f$에 대한 참조($A \xrightarrow{\text{call}} H::f$)로 자동 승격되어서는 안 된다.
   - 심볼 가시성, 네임스페이스, 시그니처 일치, 모호성 배제 등 독자적인 심볼 바인딩 증거가 성립해야만 Call 간선이 생성될 수 있다.

---

### 8.6. [C-06] 파일 집합 보존성 및 원장 스키마 정합성 규격 (P0)

1. **파일 집합 분할 및 보존 불변식**:
   $$D = A \uplus E \uplus N$$
   - $D$ (Discovered): 스캐너가 디스크에서 발견한 전체 파일 집합.
   - $A$ (Analyzed): 분석 파이프라인에 투입되어 노드로 생성되는 대상 파일 집합.
   - $E$ (Excluded): 스코프 제외 정책에 의해 배제된 파일 집합.
   - $N$ (Non-Target): 지원되지 않는 확장자/바이너리 등 비대상 파일 집합.
   - **조건**: $A \cap E = \emptyset$, $A \cap N = \emptyset$, $E \cap N = \emptyset$, $A \cup E \cup N = D$.
   - 모든 파일은 실행 단위별로 불변 고정되며, $E$와 $N$에 속한 파일 역시 분류 근거(`exclusionReason`)가 진단 원장에 보존된다.
2. **식별자 분리 및 원장 스키마 정합성**:
   - `project_state.json`에는 $A$에 속한 파일만 그래프 노드(`sourceNodeId`)로 생성된다.
   - 따라서 $E, N$에 위치한 호출이나 파일은 노드가 없을 수 있으므로, 원장에는 `sourceNodeId`를 옵셔널로 두고 **정규화 파일 경로인 `sourceFileId` (string, 필수)**를 주 식별자로 사용한다.
3. **타입 정의 및 Nullable 규격 정합화**:
   ```typescript
   export type ResolutionStatus =
       | 'resolved'            // 정상 해결되어 간선으로 바인딩됨
       | 'unresolved'          // 해결 실패하여 미해결 원장에 격리됨
       | 'excluded_by_scope';  // 스코프 제외 대상과의 관계로 정상 식별됨

   export type FallbackReason =
       | 'SYSTEM_API_GUARD'        // COM/Win32 등 시스템 API 가드 격리
       | 'FALLBACK_PRUNED_REJECT'  // 제외 대상의 부적절한 2차 대체 전이 차단
       | 'AMBIGUOUS_CANDIDATES'    // 복수 후보 경합으로 인한 모호성 배제
       | 'INSUFFICIENT_EVIDENCE'   // 단일 후보 또는 증거 불충분 격리
       | 'TRACE_INCOMPLETE'        // 진단 추적 실패 예외
       | null;                     // resolutionStatus === 'resolved' 또는 'excluded_by_scope'일 때 null 필수

   export interface UnresolvedReferenceEntry {
       referenceId: string;               // C-01 결정론적 해시 (필수)
       sourceFileId: string;              // 정규화 파일 경로 (필수)
       sourceNodeId?: string | null;      // 그래프 노드 ID (A 집합 노드만 존재, E/N은 null)
       callToken: string;                 // 심볼 토큰 (필수)
       status: ResolutionStatus;          // 'unresolved' | 'excluded_by_scope' (필수)
       fallbackReason: FallbackReason;    // 실패 사유 코드 (필수)
       candidateCount: number;            // 검토된 후보 수 (0 이상)
       candidateFileIds: string[];        // 검토 대상 파일 경로 목록
       prunedCandidateFileIds: string[];  // 탈락/배제된 후보 파일 경로 목록
       diagnosticTraceRef: string;        // 진단 추적 ID (실패 시 "TRACE_GENERATION_FAILED")
   }
   ```

