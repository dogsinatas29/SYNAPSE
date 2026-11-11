# encoding: utf-8
# 📜 UNIT_TEST_SPEC_V2.5.md: 심볼 해석 안전성 계약 v2.5 대응 단위 테스트 명세서 (정합화 최종판)

- **문서 버전**: v1.5 (Contract-Reconciled Revision — 5대 잔여 GAP 정합화 사양 반영)
- **대응 안전성 계약**: `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` (v2.5 설계 기준선 동결판)
- **작성 기준 시각**: 2026-10-21T10:25:00+09:00
- **상태 관리**: 📐 `DRAFT` (계약 및 출처 기반 정합화 사양이며, 테스트 코드 구현 `IMPLEMENTED` 및 실행 `REGRESSION_VERIFIED`와 엄격히 분리)
- **거버넌스 원칙**: READ ONLY & ZERO CODE MODIFICATION (프로덕션 소스 코드 및 파이프라인 불변 유지)
- **해석 경계 (Interpretation Boundary)**:
  - 본 문서는 테스트의 사전 조건, 입력 픽스처, 기대 불변식, 실패 조건 및 증거 요건을 명시하는 **테스트 사양(Specification-only)**이다.
  - 본 사양의 존재나 작성 완료가 현재 구현의 적합성, 런타임 동작의 정상성, 과거 기준선 증거의 유효성을 입증하지 않는다.
  - 본 문서는 어떠한 프로덕션 코드 수정, 테스트 구현, 테스트 러너 실행, 그래프 생성, 파이프라인 구동도 승인하지 않는다.
  - 과거 Experiment B `FAIL`, Gate 1 `BLOCKED`, Gate 2 `FAIL`, Gate 3 `ON HOLD`, Strict Code Freeze, Execution Freeze는 완전하게 유지된다.

---

## 1. 개요 및 거버넌스 경계

본 문서는 `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` v2.5에 명시된 불변 규칙, 우선순위 매트릭스, 파일 분할 및 검증 감사 계약을 독립적으로 검증하기 위한 **단위 테스트 명세(Unit Test Specification)**이다.

### ⚠️ 엄격한 거버넌스 및 증거 판정 경계
1. **문서 작성 $\neq$ 테스트 구현**: 본 문서는 테스트 케이스의 입력, 사전 상태, 기대 결과, 불변식을 정의하는 설계 문서이며, 테스트 스크립트 작성이나 러너 구동을 의미하지 않는다.
2. **테스트 명세 $\neq$ `REGRESSION_VERIFIED`**: 테스트 케이스가 작성되었다고 해서 리졸버 엔진이 검증된 것이 아니며, 실제 파이프라인 구동 및 스냅샷 증거 보존 전까지 공식 판정은 변경되지 않는다.
3. **실험 B `FAIL` 보존**: 본 명세의 테스트 ID `TC-EXP-B-01A`, `TC-EXP-B-01B`, `TC-EXP-B-03` 등은 실험 B의 결함을 검출하기 위한 회귀 기준이며, 통과 실측이 있기 전까지 실험 B의 상태는 영구히 `FAIL`로 유지된다.
4. **실행 전 승인 분리**: 모든 테스트 케이스는 `실행 전 필요한 승인 여부`를 명시하며, 사용자 승인 없이 임의 실행되지 않는다.
5. **테스트 판정 어휘 체계 (4-State Outcome Vocabulary)**:
   - **`PASS`**: 명시된 증거 요건을 충족하며 모든 필수 단언(Assertions)이 100% 만족됨.
   - **`FAIL`**: 증거가 하나 이상의 필수 단언을 위반함.
   - **`BLOCKED`**: 필수 소스, 픽스처, 스냅샷, 진단 필드 또는 독립 오라클이 결손되어 테스트 평가를 진행할 수 없음.
   - **`INCONCLUSIVE`**: 증거는 존재하나 허용된 해석과 금지된 해석을 객관적으로 판별할 수 없음.
   - *결손된 관찰은 결코 `PASS`로 취급할 수 없다.*
6. **픽스처 격리 및 신원 보존 원칙**:
   - 합성 픽스처는 반드시 `SYNTHETIC`으로 명시하며, 과거 Experiment B의 원시 증거로 둔갑시켜 제시할 수 없다.
   - 전체 그래프 단언은 대상 그래프 스냅샷 식별자 및 출처 무결성 상태를 명시해야 한다.
   - 모든 기대 해시는 구현의 출력 복사가 아닌, 독립 테스트 오라클에 의해 정규화된 입력으로부터 직접 계산되어야 한다.
   - `referenceId`는 참조 발생(Occurrence)을 식별하며, 1:1 엣지 생성을 강제하지 않는다 (거부·억제된 참조는 엣지가 미생성됨).

---

## 2. 테스트 스위트 구조

- **Suite 1: 우선순위 충돌 및 결정론적 계층 검증 (Priority Conflict Tests)**: 6개 케이스 (`TC-PRIO-01`, `TC-PRIO-02`, `TC-PRIO-03`, `TC-PRIO-04A`, `TC-PRIO-04B`, `TC-PRIO-04C`)
- **Suite 2: 핵심 불변식 및 감사 구조 검증 (Core Invariant & Audit Tests)**: 6개 케이스 (`TC-INV-01`, `TC-INV-02`, `TC-INV-03A`, `TC-INV-03B`, `TC-INV-04A`, `TC-INV-04B`)
- **Suite 3: 실험 B 재현 및 왜곡 차단 검증 (Experiment B Defect Reproduction Tests)**: 5개 케이스 (`TC-EXP-B-01A`, `TC-EXP-B-01B`, `TC-EXP-B-01C`, `TC-EXP-B-02`, `TC-EXP-B-03`)
- **Suite 4: 전체 파이프라인 및 공식 리포트 회귀 검증 (Pipeline & Report Semantics Tests)**: 2개 케이스 (`TC-PIPE-01`, `TC-PIPE-02`)
- **총 테스트 케이스 수**: **19개** (기존 14개 + 5대 GAP 해소 신규 케이스 5개)

---

## 3. Suite 1: 우선순위 충돌 및 결정론적 계층 검증 (Priority Conflict Tests)

### TC-PRIO-01: `direct` 사전 확정 vs P0 전역 수집 결손 충돌
- **대응 계약 조항**: `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` Section 4 (사전 평가: `direct` 물리 경로 해석의 P0 우회 게이트)
- **입력 조건 및 사전 상태**:
  - 호출원: `src/main.rs`, 대상 표현식: `mod ui;`
  - 픽스처 전제조건 고정:
    - 1) 호출원 `src/main.rs`의 해당 모듈 선언(`mod ui;`) AST 노드는 **정상적으로 100% 파싱되어 성공적으로 획득됨**.
    - 2) 대상 물리 파일 `src/ui.rs`가 유일한 유효 대상 파일이며 디스크 상에 실존 (`fs.existsSync === true`).
    - 3) 대체 모듈 경로(`src/ui/mod.rs`), 인라인 모듈 블록, `#[path]` 경로 재정의 속성이 전무함.
    - 4) 적용 경로 규칙 ID: `PATH-RUST-MOD-V1.0` (Rust 2018 에디션 모듈 경로 규칙).
  - 전역 수집 상태: 다른 무관한 서브디렉터리의 C 파일 파싱 에러로 인해 **전역 수집 상태만 `collectionStatus.overall === 'PARTIAL'` (`astParsingVerified === false`)**임.
  - 해당 직접 경로 검증에 필요한 국소적 물리 경로 증거 자체는 100% 완전함.
- **실행 대상과 격리 조건**: 단위 경로 해석기 (`resolveDirectPath`), mock AST 파서 결손 상태 주입
- **단일 기대 결과**:
  - `resolutionKind`: `"direct"`
  - `fallbackReason`: `null`
  - `selectedTarget`: `"src/ui.rs"`
  - `directPathProof` (계약 v2.5 원문 Section 3 L159-164 스키마 매핑 완료 — 원문 검증 대기):
    ```json
    {
      "targetPhysicalPath": "src/ui.rs",
      "pathResolutionRuleId": "PATH-RUST-MOD-V1.0",
      "pathResolutionRuleVersion": "RUST-2018-EDITION",
      "fileExistsVerified": true
    }
    ```
- **검증할 불변식**:
  - Rust 2018+ 에디션 모듈 해결 규칙(패키지 루트 `Cargo.toml`, 모듈 선언 `src/main.rs`, `#[path]` 부재, `src/ui.rs` 단일 실존)에 따라 결정론적 1:1 물리 바인딩이 성립함
  - 국소 물리 경로 4대 증거가 완비된 참조는 전역 수집 결손(`PARTIAL`) 상태라 할지라도 P0 게이트를 안전하게 우회함
  - 국소 물리 경로 4대 증거가 완비된 참조는 전역 수집 결손(`PARTIAL`) 상태라 할지라도 P0 게이트를 안전하게 우회함
- **실패 판정 기준**:
  - `resolutionKind`가 `"unresolved"`로 격리되거나 `fallbackReason`에 `"TRACE_INCOMPLETE"`가 할당된 경우
  - `directPathProof`가 누락된 채 `direct`가 부여된 경우
- **필요한 증거와 보존 위치**: `artifacts/scratch/audit_tc_prio_01.json` (진단 레코드 덤프)
- **실행 전 필요한 승인 여부**: 단위 테스트 러너 구현 승인 필요

---

### TC-PRIO-02: P1 시스템 API 가드 vs 복수 유효 후보(P4) 충돌
- **대응 계약 조항**: `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` Section 3 (Rule 3), Section 4 (Priority 1 시스템 API 절대 우선 가드)
- **성격 구분**:
  - **본 케이스의 검증 범위**: `systemApiEvaluation: 'CONFIRMED'`가 이미 주입된 상태에서 리졸버의 P1 우선순위 처리 결정론을 검증함. (실제 리졸버 파이프라인의 시스템 API 분류 자체의 정확성은 `TC-EXP-B-01A`에서 별도 평가함)
- **입력 조건 및 사전 상태**:
  - 심볼명: `Release`
  - 호출원 수신 객체 타입: `ITaskbarList3*`
  - 시스템 헤더 포함: `shobjidl.h`
  - `systemApiEvaluation`: `'CONFIRMED'` (주입된 평가 상태)
  - 내부 유효 후보: 2개 (`src/platform/windows.cc`, `res/msi/CustomActions/FirewallRules.cpp`) 모두 문법적 가시성 존재
  - 내부 후보 중 하나에 대해 `disambiguationProof` (수신 객체 타입 일치 증거)가 주입된 상태
- **실행 대상과 격리 조건**: `SymbolResolver` 평가 파이프라인 (심볼 평가 격리 모듈)
- **단일 기대 결과**:
  - `resolutionKind`: `"unresolved"`
  - `fallbackReason`: `"SYSTEM_API_GUARD"`
  - `selectedTarget`: `null`
- **검증할 불변식**:
  - 내부 후보에 대한 독립 증거 유무와 무관하게, `systemApiEvaluation === 'CONFIRMED'`이면 P1이 최우선 차단
  - P4 승격 또는 모호성(`AMBIGUOUS_CANDIDATES`)보다 P1이 선행 결정론 적용
- **실패 판정 기준**:
  - `selectedTarget`이 내부 파일로 연결되거나, `fallbackReason`이 `AMBIGUOUS_CANDIDATES`로 산출된 경우
- **필요한 증거와 보존 위치**: `artifacts/scratch/audit_tc_prio_02.json`
- **실행 전 필요한 승인 여부**: 단위 테스트 러너 구현 승인 필요

---

### TC-PRIO-03: P1 미판정(`INDETERMINATE`) 상태에서의 단일 후보 격리
- **대응 계약 조항**: `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` Section 4 (Priority 5 단일 후보 검증 및 미판정 격리)
- **계약 규격 대조**: 계약 Section 4 우선순위 정의표 P5에 규정된 `fallbackReason: "INSUFFICIENT_EVIDENCE"` 및 Section 3 `evaluatedConditions.insufficientEvidenceType: 'SINGLE_UNVERIFIED'`와 매핑 완료 — 원문 검증 대기.
- **입력 조건 및 사전 상태**:
  - 심볼명: `Sleep`
  - 호출원: C 소스 파일, 헤더 인클루드 불분명
  - `systemApiEvaluation`: `'INDETERMINATE'` (SDK 함수인지 도메인 함수인지 판정 불가)
  - 유효 후보 수: 1개 (`candidateCount === 1`, `CustomActions.cpp`)
  - Rule 1의 독립적 연결 근거(FFI 계약, 정적 모듈 바인딩): 부재
- **실행 대상과 격리 조건**: `SymbolResolver` 단일 후보 검증기
- **단일 기대 결과**:
  - `resolutionKind`: `"unresolved"`
  - `fallbackReason`: `"INSUFFICIENT_EVIDENCE"` (계약 원문 단일 대표 코드)
  - `selectedTarget`: `null`
  - `insufficientEvidenceType`: `"SINGLE_UNVERIFIED"` (계약 원문 P5 상세 진단 플래그)
- **검증할 불변식**:
  - 시스템 API 판정이 불확실하고 단일 후보가 존재하더라도, 독립적 연결 근거가 없으면 P5 규칙에 따라 오결합으로 연결하지 않고 정직하게 미해결 격리함
- **실패 판정 기준**:
  - 단일 후보인 `CustomActions.cpp`로 간선이 연결되거나 `isValidated === true`로 오승격된 경우
- **필요한 증거와 보존 위치**: `artifacts/scratch/audit_tc_prio_03.json`
- **실행 전 필요한 승인 여부**: 단위 테스트 러너 구현 승인 필요

---

### TC-PRIO-04A: 스코프 제외 대상의 대체 미시도 정상 제외 확정 (`excluded_by_scope`)
- **대응 계약 조항**: `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` Section 2 (L28: `excluded_by_scope` 3대 동시 충족 요건), Section 3 L150-156 (`scopeExclusionProof` 4대 필수 필드 스키마)
- **성격 구분 및 4단계 전체 증거 체인(Full Evidence Chain) 검증**:
  - 계약 정의: 1) 대상 파일 실존(`fs.existsSync`), 2) 승인된 제외 규칙 정합, 3) **해당 참조가 실제로 그 대상을 가리킨다는 물리/정적 증거**가 동시 입증되어야 함.
  - 본 케이스는 단순 심볼 호출이 아니라 **직접 상대 경로 인클루드 참조**에 대해 다음 4단계 전체 증거 체인을 독립적으로 전수 검증함:
    1) **물리적 실존(Physical Existence)**: `targetPhysicalPath`가 실제 유효한 파일로 확인됨 (`fs.existsSync("res/msi/CustomActions/FirewallRules.h") === true`).
    2) **규칙 정합성(Rule Matching)**: `exclusionRuleId: "TIER-2-MSI-RULE"` 및 `exclusionRuleVersion: "RULE-EXCL-V1.7"`가 사전 승인된 제외 규칙 카탈로그에 공식 대응함.
    3) **타깃 증거(Targeting Evidence)**: `targetingEvidence: "DIRECT_INCLUDE_PATH"`가 해당 물리 파일을 명시적으로 가리키는 실제 AST 헤더 인클루드 지시문에 인과적으로 연결됨.
    4) **참조 단위 리졸버-간선 인과 결합 검증(Reference-Level Causal Binding)**:
       - 그래프 전체에서 우연히 간선이 0건인 것이 아니라, **해당 참조 레코드의 식별자(`referenceId`) $\rightarrow$ 리졸버 진단 로그(`scopeExclusionProof`) $\rightarrow$ 그래프 모델 간선 생성기** 사이의 인과 체인을 직접 추적하여, 해당 참조의 판정 결과(`resolutionKind: "excluded_by_scope"`, `selectedTarget: null`)로 인해 해당 특정 의존성 간선이 생성되지 않았음을 1:1로 증명함.
       - *(관측 가능성 설계 전제: `referenceId`는 테스트 명세가 임의 가정한 것이 아니라, 스캐너가 참조 추출 시 생성하는 고유 참조 레코드 ID임. 파이프라인 진단 로그가 이 ID를 유지하는지 여부를 본 테스트의 핵심 관측 지점(Observability Point)으로 검증함)*
    5) **참조 유형 한정 및 일반화 금지(Scope Boundary)**:
       - 본 테스트는 **헤더 파일에 대한 물리적 정적 `#include` 참조의 정상 제외**만을 검증하며, 해당 헤더 내에 선언된 함수의 심볼 기반 `CALL` 호출까지 자동으로 제외 판정된다고 일반화하지 않음 (심볼 호출은 별도 가드 규칙에 의해 독립 판정됨).
- **입력 조건 및 사전 상태**:
  - 호출원: `res/msi/CustomActions/CustomActions.cpp`
  - 직접 참조 표현식: `#include "FirewallRules.h"` (물리 상대 경로 확인)
  - 타깃 대상 파일: `res/msi/CustomActions/FirewallRules.h` (디스크 실존, Tier 2 MSI 제외 대상 정합)
  - 직접 타깃팅 증거: AST 인클루드 디렉티브 및 상대 경로 매핑 성공 레코드 (`targetingEvidence: "DIRECT_INCLUDE_PATH"`)
  - 대체 후보 탐색 요건: 불요 (`alternateAttempted: false`)
- **실행 대상과 격리 조건**: `SymbolResolver` 스코프 필터
- **단일 기대 결과**:
  - `resolutionKind`: `"excluded_by_scope"`
  - `fallbackReason`: `null` (정상적인 범위 판정이 확정된 상태)
  - `selectedTarget`: `null` (해당 참조로부터의 그래프 의존성 간선 생성수: **정확히 0건**)
  - `scopeExclusionProof` (계약 Section 3 L150-156 스키마 준수):
    ```json
    {
      "targetPhysicalPath": "res/msi/CustomActions/FirewallRules.h",
      "exclusionRuleId": "TIER-2-MSI-RULE",
      "exclusionRuleVersion": "RULE-EXCL-V1.7",
      "targetingEvidence": "DIRECT_INCLUDE_PATH"
    }
    ```
- **검증할 불변식**:
  - 4단계 증거 체인이 모두 충족된 직접 스코프 제외 참조는 `FALLBACK_PRUNED_REJECT`가 아닌 `excluded_by_scope`로 확정되고 간선이 생성되지 않음
- **실패 판정 기준**:
  - 4대 필드 중 1개라도 누락되거나, `resolutionKind`가 `unresolved`로 기록되거나, 해당 참조로부터 대상 파일로의 간선이 생성된 경우
- **필요한 증거와 보존 위치**: `artifacts/scratch/audit_tc_prio_04a.json`
- **실행 전 필요한 승인 여부**: 단위 테스트 러너 구현 승인 필요

---

### TC-PRIO-04B: 스코프 제외 대상의 2차 전이 시도 차단 (`FALLBACK_PRUNED_REJECT`)
- **대응 계약 조항**: `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` Section 4 (Priority 2 제외 후보 대체 전이 차단)
- **성격 구분**:
  - 본 케이스는 1차 대상이 스코프 제외되었을 때, 리졸버가 잔여 후보 풀에서 차순위 파일로 2차 전이하려는 시도를 감지하고 P2에 따라 엄격히 차단함을 검증함.
- **입력 조건 및 사전 상태**:
  - 호출원: `src/platform/windows.cc`
  - 호출 표현식: 도메인 함수 `ConfigureFirewall()`
  - 1차 매핑 대상: `res/msi/CustomActions/FirewallRules.cpp` (스코프 제외 대상)
  - 리졸버 전이 시도: 1차 대상 제외 후 잔여 후보 `src/network/firewall_stub.cc`로 2차 대체 바인딩 시도
  - 2차 후보의 독립적 호출 증거: 부재
- **실행 대상과 격리 조건**: `SymbolResolver` 대체 전이 가드
- **단일 기대 결과**:
  - `resolutionKind`: `"unresolved"`
  - `fallbackReason`: `"FALLBACK_PRUNED_REJECT"` (P2 적용)
  - `selectedTarget`: `null`
  - `prunedFallbackProof`: `{ primaryPrunedTarget: "res/msi/CustomActions/FirewallRules.cpp", attemptedFallbackTarget: "src/network/firewall_stub.cc", rejectedByRule: "P2_PRUNED_FALLBACK_GUARD" }`
- **검증할 불변식**:
  - 스코프 제외된 1차 대상을 대체하려는 2차 전이는 독립 증거 없이 성립할 수 없으며 반드시 거절됨
- **실패 판정 기준**:
  - `src/network/firewall_stub.cc`로 2차 간선이 연결되거나, `fallbackReason`이 누락된 경우
- **필요한 증거와 보존 위치**: `artifacts/scratch/audit_tc_prio_04b.json`
- **실행 전 필요한 승인 여부**: 단위 테스트 러너 구현 승인 필요

---

### TC-PRIO-04C: 직접 물리적 `#include` 예외 판정 및 심볼 Fallback 방지 단언
- **대응 계약 조항**: `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` Section 4 (CR-02.2: 제외 스코프 타깃의 물리 include 증거 예외)
- **테스트 유형**: 리졸버 우선순위 / 계약 예외 사양 (Resolver-priority / contract exception)
- **실행 상태**: **`NOT RUN — EXECUTION FREEZE`** (실행 동결 유지)
- **검증 목적 (Objective)**:
  - 타깃 파일이 일반 스코프 제외 대상(`res/msi/**`)에 속하더라도, 실재하는 명시적 상대 물리 `#include` 디렉티브가 존재하는 경우 계약의 `direct` 예외 규칙에 따라 처리되는지 검증함.
  - 본 예외 처리가 심볼 인덱스 fallback이나 기타 도메인 추론 바인딩을 정당화하는 포괄적 면죄부로 악용되는 것을 방지함.
- **입력 조건 및 격리 픽스처 (Fixture)**:
  - 최소 격리 픽스처 (Minimal Isolated Fixture):
    - 호출원: `res/msi/CustomActions/CustomActions.cpp`
    - 타깃 헤더: `res/msi/CustomActions/FirewallRules.h`
    - 리터럴 디렉티브: `CustomActions.cpp` 내 `#include "FirewallRules.h"`
    - 타깃 파일 상태: 계약 정의 상대 물리 경로 상에 디스크 실존 (`fs.existsSync === true`)
    - 타깃 경로 분류: 일반 스코프 제외 규칙에 의해 `excludedFiles`로 분류됨
    - 심볼 인덱스 후보 배제: 해당 include 만족을 위해 심볼 인덱스 풀을 요구하지 않음
  - *동명 소스 파일 분리*: 픽스처는 물리 헤더(`FirewallRules.h`)와 동명의 소스 파일(`FirewallRules.cpp`)을 엄격히 구분함.
- **검증 절차 (Procedure)**:
  1. 픽스처 소스 내 `#include "FirewallRules.h"` 디렉티브 존재 확인.
  2. 해석된 물리 경로에 타깃 헤더가 독립적으로 실존함을 확인.
  3. 해당 include 발생에 대해 리졸버 계약 규칙 평가.
  4. 선택된 타깃 경로, `resolutionKind`, 예외 적용 증거를 기록.
  5. **음성 대조군 (Negative Control)** 실행: 물리 헤더가 결손된 상태에서, 동명의 심볼 인덱스 후보(`FirewallRules.cpp`)가 존재하는 시나리오 주입.
- **필수 단언 (Required Assertions)**:
  - **양성 케이스 (Positive Case)**: include가 물리적 `FirewallRules.h` 타깃으로 정확히 해석되며, `resolutionKind: 'direct'` (또는 계약 정의 등가값)로 분류됨.
  - 직접 해석 결과는 include 디렉티브 및 물리적 파일 실존에 의해서만 정당화되며, 심볼 인덱스 매칭에 의해 발생하지 않음.
  - 일반 스코프 제외 규칙은 명시적인 물리 include 예외를 부당하게 차단하지 않음.
  - **음성 대조군 (Negative Control)**: 물리 타깃이 결손되었을 때, 본 예외 규칙이 `FirewallRules.cpp`나 타 후보로의 심볼 인덱스 fallback을 결코 인가하지 않음 (`FALLBACK_PRUNED_REJECT` 또는 `unresolved` 격리).
  - *경계 제한*: `FirewallRules.h` 내에 선언된 개별 함수 호출 바인딩은 본 include 테스트의 평가 범위를 벗어남.
- **실패 판정 기준 (Failure Conditions)**:
  - 존재하는 물리 헤더가 일반 제외 규칙에 의해서만 거부되는 경우.
  - 물리적 include가 아닌 심볼 인덱스 fallback에 의해 타깃이 선택된 경우.
  - 결손된 물리 타깃이 동명의 심볼 후보에 기반하여 허용되는 경우.
  - 헤더 픽스처 대신 소스 파일을 투입한 경우.
- **필요한 증거와 보존 위치**:
  - `artifacts/scratch/audit_tc_prio_04c.json` (픽스처 소스, include 라인, 정규화 경로, 물리 실존 관찰, 리졸버 결정 레코드, 음성 대조군 결과).
- **실행 전 필요한 승인 여부**: 단위 테스트 러너 구현 및 실행 승인 필요.
- **검증 한계 (Limits)**: 본 테스트는 예외 사양을 검증하며, 프로덕션 구현이 해당 예외를 포함하는지 여부는 구현 검사와 승인된 실행 전까지 입증하지 않음.

---

## 4. Suite 2: 핵심 불변식 및 감사 구조 검증 (Core Invariant & Audit Tests)

### TC-INV-01: 4대 파일 집합 분할 및 분류 사유 보존
- **대응 계약 조항**: `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` Section 3 (Invariant 3: 4대 파일 집합 분할 체계)
- **입력 조건 및 사전 상태**:
  - 실행 환경 및 단위 식별:
    - `discoveredFiles`는 디렉터리 순회에서 감지된 **정규화된 경로의 고유 Set (문자열 경로 고유 집합)**으로 정의함.
    - 심볼릭 링크는 디렉터리 엔트리 자체의 경로를 `discoveredFiles`에 기록하되, 대상 링크 확인 시 타깃이 깨져 있으면 `BROKEN_SYMLINK`로 분류함.
    - **실행 환경 실패와 제품 실패 구분**:
      - `chmod 000` 설정 후 실제 `fs.readFile` I/O 시도 시 `EACCES` 오류가 발생한 경우에만 유효한 접근 거부 픽스처로 인정함.
      - 만약 실행 환경(루트 권한, 특수 마운트 등)으로 인해 `EACCES`가 발생하지 않고 읽기가 성공할 경우, 이는 제품의 결함이 아니라 픽스처 전제조건 실패이므로 `FAIL`이 아닌 **`BLOCKED`**로 판정함.
  - 프로젝트 디렉터리 내 테스트 픽스처 생성:
    - 정상 C/Rust 소스: 10개 (`analysisTargetFiles`)
    - MSI 빌드 스크립트: 3개 (`excludedFiles`, Tier 2 제외 규칙 대상)
    - 바이너리(`.png`, `.dll`): 5개 (`nonTargetFiles`, 사유: `UNSUPPORTED_FORMAT`)
    - 접근 권한 거부 파일(`fs.readFile` 시 `EACCES` 확인): 1개 (`nonTargetFiles`, 사유: `ACCESS_DENIED`)
    - 깨진 심볼릭 링크: 1개 (`nonTargetFiles`, 사유: `BROKEN_SYMLINK`)
- **실행 대상과 격리 조건**: `FileDiscoveryPipeline` 격리 모듈
- **단일 기대 결과**:
  - `discoveredFiles.length === 20`
  - $\text{discoveredFiles} = \text{analysisTargetFiles} \uplus \text{excludedFiles} \uplus \text{nonTargetFiles}$ (상호 배타적 완전 분할 성립)
  - `nonTargetFiles`의 7개 파일 각각에 대해 구체적 실패 사유(`unclassifiableReason: 'UNSUPPORTED_FORMAT' | 'ACCESS_DENIED' | 'BROKEN_SYMLINK'`)가 영구 보존됨
  - **`astParsingVerified` 검증 범위**: 전체 20개가 아닌 **분석 대상으로 분류된 10개 파일(`analysisTargetFiles`)에 대해서만 AST 파싱 성공 여부를 검증**하여 `astParsingVerified === true` 산출
- **검증할 불변식**:
  - 접근 오류나 바이너리가 `analysisTargetFiles`로 누출되지 않음
  - `nonTargetFiles` 및 `excludedFiles`의 미파싱이 전체 수집 상태를 `PARTIAL`로 강등시키지 않음
- **실패 판정 기준**:
  - 집합 간 교집합이 존재하거나 합집합이 `discoveredFiles`와 일치하지 않는 경우
  - 분류 실패 사유가 누락된 경우
- **필요한 증거와 보존 위치**: `artifacts/scratch/audit_tc_inv_01.json`
- **실행 전 필요한 승인 여부**: 단위 테스트 러너 구현 승인 필요

---

### TC-INV-02: 후보 집합 4대 집합론적 등식 및 위반 검출력 검증 (Positive & Negative Path)
- **대응 계약 조항**: `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` Section 3 (Invariant 2: 후보군 집합 분모 고정 및 4대 집합론적 검증 조건)
- **성격 구분**: 단순 정상 입력의 등식 성립 검증(Happy Path)뿐 아니라, **의도적 결손 픽스처 주입 시 감사기가 불변식 파괴를 정확히 검출하는지(Negative Path 5종)**를 전수 검증함.
- **입력 조건 및 사전 상태 (정상 경로 및 5대 부정 경로 픽스처)**:
  - **기본 정상 픽스처 (Case 0 - Happy Path)**:
    - 원본 후보 5개: `symbolCandidatePaths: ["P1", "P2", "P3", "P4", "P5"]`
    - 적격 통과: `eligibleCandidatePaths: ["P1", "P2"]`
    - 거절 탈락: `filterRejections: [{ candidatePath: "P3" }, { candidatePath: "P4" }, { candidatePath: "P5" }]`
  - **구체적 입력 배열 구성 (Cases 0~5)**:
    - **Case 0 (정상)**:
      - `symbolCandidatePaths: ["P1", "P2", "P3", "P4", "P5"]`
      - `eligibleCandidatePaths: ["P1", "P2"]`
      - `rejectedCandidatePaths: ["P3", "P4", "P5"]`
      - `filterRejections: [{ candidatePath: "P3" }, { candidatePath: "P4" }, { candidatePath: "P5" }]`
    - **Case 1 (완전성 결손 단독 결함 - Under-coverage)**:
      - `symbolCandidatePaths: ["P1", "P2", "P3", "P4", "P5"]`
      - `eligibleCandidatePaths: ["P1", "P2"]`
      - `rejectedCandidatePaths: ["P3", "P4"]` (P5 고의 누락: $\text{eligible} \cup \text{rejected} \subset \text{symbol}$)
      - `filterRejections: [{ candidatePath: "P3" }, { candidatePath: "P4" }]`
      - *(판정: 불변식 1, 2, 4는 모두 PASS이고 불변식 3 완전성만 단독 FAIL)*
    - **Case 2 (완전성 초과 유령 후보 단독 결함 - Over-coverage)**:
      - `symbolCandidatePaths: ["P1", "P2", "P3", "P4", "P5"]`
      - `eligibleCandidatePaths: ["P1", "P2", "P_GHOST"]` (원본에 없는 유령 후보 삽입: $\text{eligible} \cup \text{rejected} \supset \text{symbol}$)
      - `rejectedCandidatePaths: ["P3", "P4", "P5"]`
      - `filterRejections: [{ candidatePath: "P3" }, { candidatePath: "P4" }, { candidatePath: "P5" }]`
      - *(수학적 분석: 별도 부분집합성 계약을 날조하지 않고, 계약 Section 3 L195의 불변식 3 등식 $\text{eligible} \cup \text{rejected} \equiv \text{symbol}$에 의해 좌변 $\{P1, P2, P3, P4, P5, P\_GHOST\} \neq \{P1, P2, P3, P4, P5\}$로 정확히 불변식 3 등식 위반으로 단독 판독됨. 불변식 1, 2, 4는 PASS)*
    - **Case 3 (배열 중복 단독 결함 - Duplicate Candidate)**:
      - `symbolCandidatePaths: ["P1", "P1", "P2", "P3", "P4", "P5"]` (P1 고의 중복)
      - `eligibleCandidatePaths: ["P1", "P2"]`
      - `rejectedCandidatePaths: ["P3", "P4", "P5"]`
      - `filterRejections: [{ candidatePath: "P3" }, { candidatePath: "P4" }, { candidatePath: "P5" }]`
      - *(판정: 집합 변환 전 원본 배열에서 고유성 검사 $|\operatorname{Set}(S)| \neq |S|$로 불변식 4만 단독 FAIL, 불변식 1, 2, 3은 집합론적 기준에서 PASS)*
    - **Case 4 (투영 불일치 단독 결함 - Projection Mismatch)**:
      - `symbolCandidatePaths: ["P1", "P2", "P3", "P4", "P5"]`
      - `eligibleCandidatePaths: ["P1", "P2"]`
      - `rejectedCandidatePaths: ["P3", "P4", "P5"]`
      - `filterRejections: [{ candidatePath: "P3" }, { candidatePath: "P4" }, { candidatePath: "P_DIFF" }]`
      - *(판정: $\text{rejectedCandidatePaths} \neq \{ r.\text{candidatePath} \}$로 불변식 1만 단독 FAIL, 불변식 2, 3, 4는 PASS)*
    - **Case 5 (상호 배타성 중첩 단독 결함 - Mutual Exclusivity Violation)**:
      - `symbolCandidatePaths: ["P1", "P2", "P3", "P4", "P5"]`
      - `eligibleCandidatePaths: ["P1", "P2"]`
      - `rejectedCandidatePaths: ["P2", "P3", "P4", "P5"]` (P2가 양쪽 모두에 존재)
      - `filterRejections: [{ candidatePath: "P2" }, { candidatePath: "P3" }, { candidatePath: "P4" }, { candidatePath: "P5" }]`
      - *(판정: $\text{eligible} \cap \text{rejected} = \{P2\} \neq \emptyset$로 불변식 2만 단독 FAIL, 합집합 $\{P1..P5\} \equiv \text{symbol}$ 및 투영, 고유성은 PASS)*
- **실행 대상과 격리 조건**: `CandidateFilterValidator` 집합 불변식 감사기
- **단일 기대 결과 및 계약 4대 불변식별 평가 판정 행렬 (Evaluation Matrix)**:
  새로운 계약 조항을 날조하지 않고, 계약 원문(Section 3 L190-196)에 정의된 기존 4대 불변식만을 기준으로 각 케이스의 실제 집합 연산 결과와 100% 일치하도록 정합화함:

| 테스트 케이스 | 불변식 1: 전단사 투영 (rejected $\equiv$ rejections) | 불변식 2: 상호 배타성 (eligible $\cap$ rejected $\equiv \emptyset$) | 불변식 3: 완전성 등식 (eligible $\cup$ rejected $\equiv$ symbol) | 불변식 4: 배열 고유성 ($|\operatorname{Set}(S)| = |S|$) | 감사기 최종 판정 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Case 0 (정상)** | **PASS** | **PASS** | **PASS** | **PASS** | **승격 승인 (`AUDIT_PASS`)** |
| **Case 1 (누락)** | PASS | PASS | **FAIL** ($\subset$) | PASS | **검증 실패 (`REJECT`)** |
| **Case 2 (유령)** | PASS | PASS | **FAIL** ($\supset$) | PASS | **검증 실패 (`REJECT`)** |
| **Case 3 (중복)** | PASS | PASS | PASS | **FAIL** ($6 \neq 5$) | **검증 실패 (`REJECT`)** |
| **Case 4 (투영)** | **FAIL** | PASS | PASS | PASS | **검증 실패 (`REJECT`)** |
| **Case 5 (중첩)** | PASS | **FAIL** ($\{P2\}$) | PASS | PASS | **검증 실패 (`REJECT`)** |
- **검증할 불변식**:
  - 특정 신규 오류 코드를 계약 의무로 강제하지 않고, **해당 집합론적 불변식의 위반 여부 자체를 감사기가 안정적으로 탐지하여 결함 후보군을 안전하게 거절함을 설계 목표(Design Verification Goal)**로 검증함.
- **실패 판정 기준**:
  - Case 0에서 등식이 성립하지 않거나, Cases 1~5 중 단 1건이라도 위반이 탐지되지 않고 검증을 통과해버린 경우(오탐/미탐 실패)
- **필요한 증거와 보존 위치**: `artifacts/scratch/audit_tc_inv_02.json` (Case 0 및 Cases 1~5 검출 감사 레코드 전수 보존)
- **실행 전 필요한 승인 여부**: 단위 테스트 러너 구현 승인 필요

---

### TC-INV-03A: `validationAudit` 계약 원문 필수 불변식 준수 검증
- **대응 계약 조항**: `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` Section 3 L131, L219-225 (Invariant 6)
- **성격 구분**: 계약 v2.5 원문에 명시된 **규범적 필수 불변식(Normative Invariant)**과 검증기 구현 복구 전략의 분리 검증.
- **입력 조건 및 사전 상태**:
  - 복수 후보 상황에서 `disambiguationProof` 객체 수신
  - 케이스 1 (정상 검증): 4대 감사 플래그(`candidateInEligibleVerified`, `selectedTargetMatchVerified`, `astEvidenceVerified`, `typeEvidenceVerified`) 모두 `true`
  - 케이스 2 (플래그 결손): 4대 감사 플래그 중 1개라도 `false`
  - 케이스 3 (논리식 모순 객체): `isValidated: true`이면서 `failureReason !== null`이거나, `isValidated: false`이면서 `failureReason === null`인 불변식 위반 객체 주입
- **실행 대상과 격리 조건**: `DisambiguationProofValidator` 계약 불변식 평가기
- **단일 기대 결과**:
  - 케이스 1 (정상 승격): `isValidated === true` $\land$ `failureReason === null`
  - 케이스 2 (승격 거절): `isValidated === false` $\land$ `failureReason !== null`
  - 케이스 3 (계약상 불변식 위반 판정):
    - **계약 규범적 판정 (Normative Check)**: 해당 객체는 계약 Section 3 L225에 따라 "불변식 위반으로 즉시 검증 실패(Verification Failure)"로 판정되어 결코 승격 유효 객체로 인정되지 않음.
    - **구현 복구 전략 (Implementation Choice)**: 검증기 파이프라인은 해당 모순 객체를 즉시 거부(Exception/Reject)하거나 `isValidated: false`로 정규화 격리하되, 계약이 특정 복구 방식(강등 vs 예외)만을 단독 규정하는 것으로 단정하지 않음.
- **검증할 불변식**:
  - $\text{isValidated} = \text{true} \iff \text{failureReason} = \text{null}$
  - $\text{isValidated} = \text{false} \iff \text{failureReason} \neq \text{null}$
  - 4대 감사 플래그가 모두 `true`가 아니면 결코 `isValidated: true`로 승격될 수 없음
- **실패 판정 기준**:
  - $\text{isValidated} = \text{true}$인데 `failureReason`이 존재하거나, 플래그 결손에도 `isValidated === true`가 유지되는 경우
- **필요한 증거와 보존 위치**: `artifacts/scratch/audit_tc_inv_03a.json`
- **실행 전 필요한 승인 여부**: 단위 테스트 러너 구현 승인 필요

---

### TC-INV-03B: 제안된 검증기 확장 오류 코드 및 거절 동작 검증 (Proposed Extension)
- **대응 계약 조항**: 향후 안전성 계약 개정을 위해 제안된 검증기 표준 오류 코드 확장 규격
- **성격 구분**: 계약 원문 의무가 아니며, **테스트 명세에서 구현 견고성을 위해 제안한 확장 동작(Proposed Extension Behavior)**을 검증함. (계약 v2.5 필수 통과 기준과 명확히 분리)
- **입력 조건 및 사전 상태**:
  - 구체적 위조 시나리오 객체 주입:
    - 시나리오 1: `targetCandidatePath`가 `eligibleCandidatePaths`에 미포함된 경우
    - 시나리오 2: AST 증거 참조 노드가 실제 인덱스에 부재한 경우
    - 시나리오 3: `disambiguationProof` 내부 스키마 불변식이 파괴된 객체
- **실행 대상과 격리 조건**: 단위 검증기 오류 매퍼
- **단일 기대 결과**:
  - 시나리오 1: 제안된 사유 코드 `"CANDIDATE_NOT_IN_ELIGIBLE"` 매핑
  - 시나리오 2: 제안된 사유 코드 `"EVIDENCE_NOT_FOUND"` 매핑
  - 시나리오 3: 제안된 에러 코드 `"SCHEMA_INVARIANT_VIOLATION"` 매핑 및 처리 중단
- **검증할 불변식**:
  - 제안된 오류 코드는 세부 원인 진단을 돕는 확장 계층이며, 기본 계약 준수 여부를 왜곡하지 않음
- **실패 판정 기준**:
  - 확장 오류 매퍼가 지정된 제안 코드를 산출하지 못한 경우 (단, 본 실패는 계약 v2.5 위반으로 취급하지 않음)
- **필요한 증거와 보존 위치**: `artifacts/scratch/audit_tc_inv_03b.json`
- **실행 전 필요한 승인 여부**: 단위 테스트 러너 구현 승인 필요

---

### TC-INV-04A: 결정론적 `referenceId` 생성 공식 및 독립 오라클 검증 단언
- **대응 계약 조항**: `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` Section 3 (CR-04.1: 참조 ID의 결정론적 생성 공식)
- **테스트 유형**: 결정론적 식별자 불변식 사양 (Deterministic identity invariant)
- **실행 상태**: **`NOT RUN — EXECUTION FREEZE`** (실행 동결 유지)
- **검증 목적 (Objective)**:
  - AST 스캐너에서 방출되는 참조 좌표로부터 `referenceId = sha256(file:line:col:name)` 생성 공식을 독립적인 테스트 오라클로 검증하고, 완전하게 정의된 정규화 입력으로부터 비트 단위로 결정론적 생성을 보장함.
- **정규화 선행 요건 (Canonicalization Prerequisites — Blocked Boundary)**:
  - 구현 전에 계약/명세는 다음 규격을 모호성 없이 100% 사전 확정해야 함:
    - 1) `file`: 절대 경로인지 저장소 상대 경로인지 여부.
    - 2) 경로 구분자 정규화 (`/` 고정) 및 대소문자 민감도 정책.
    - 3) 텍스트 인코딩 (UTF-8) 및 유니코드 정규화(NFC 등) 적용 여부.
    - 4) `line` 및 `col`: 1-based 인덱스인지 0-based 인덱스인지 여부.
    - 5) 구분자 콜론(`:`) 이스케이프 규칙 (파일명이나 심볼명에 콜론 포함 시).
    - 6) `name`: 원본 소스 철자(Spelling)인지 정규화된 심볼 식별자인지 여부.
    - 7) SHA-256 해시 직렬화 방식 (64자리 소문자 Hex 고정).
  - *차단 규칙*: 상기 7대 정규화 규칙 중 단 하나라도 계약 원문에 미정인 경우, 본 테스트 판정은 **`BLOCKED`**로 유지되며 테스트가 임의로 정규화 규칙을 날조하여 `PASS` 처리할 수 없음.
- **입력 조건 및 격리 픽스처 (Fixture)**:
  - 최소 3개 고정 참조 발생 레코드 투입:
    - 레코드 1: 순수 ASCII 경로 및 표준 심볼 (`src/main.rs:10:5:init`)
    - 레코드 2: 동일 심볼명을 가지나 좌표가 상이한 레코드 (`src/lib.rs:20:8:init`)
    - 레코드 3: 특수문자, 비-ASCII, 또는 구분자 경계 테스트 레코드
  - 유효하지 않은 입력 케이스 (Invalid Inputs): 필수 필드 누락, 음수 좌표 등 계약 정책에 따른 검증.
- **검증 절차 (Procedure)**:
  1. 계약 정의 규칙에 따라 정규화 입력 문자열(Canonical Input String)을 구성.
  2. 독립 테스트 오라클에서 기대 SHA-256 해시를 직접 계산.
  3. 구현체에서 방출된 `referenceId`와 독립 오라클 기대 해시를 비트 단위 대조.
  4. 동일 입력에 대해 다회 생성 반복하여 결정론적 불변성 검증.
  5. 정규화 필드 중 정확히 1개 필드만 변경 후 기대 해시 변화 검증 (Collision/Sensitivity Test).
- **필수 단언 (Required Assertions)**:
  - 동일한 정규화 입력은 다회 호출 전반에서 비트 단위로 동일한 ID를 생성함.
  - 생성된 다이제스트는 정규화 바이트의 독립 계산 SHA-256 해시와 완전 일치함.
  - 정규화 필드 변경 시 공식에 정의된 기대 다이제스트로 즉시 변경됨.
  - 결손되거나 유효하지 않은 입력은 명시적 계약 정책에 따라 엄격히 처리되며, 결코 null, 빈 문자열, 비결정론적 대체값을 침묵 속에 방출하지 않음.
  - 전체 64자리 SHA-256 Hex 포맷을 준수하지 않는 왜곡/절삭 출력을 즉시 거부함.
- **실패 판정 기준 (Failure Conditions)**:
  - 출력이 독립 테스트 오라클 해시와 불일치하는 경우.
  - 동일 정규화 입력에서 다른 ID가 생성되는 비결정론이 관측된 경우.
  - 입력 필드 변경이 무시되어 동일 해시가 방출된 경우.
  - 유효하지 않은 입력에 대해 모호하거나 임의의 식별자가 침묵 속에 생성된 경우.
  - 정규화 규칙이 미정인데도 테스트를 `PASS`로 판정한 경우.
- **필요한 증거와 보존 위치**:
  - `artifacts/scratch/audit_tc_inv_04a.json` (픽스처 레코드, 정규화 바이트 표현, 독립 기대 다이제스트, 실제 출력값, 정규화 규칙 버전).
- **실행 전 필요한 승인 여부**: 단위 테스트 러너 구현 및 실행 승인 필요.
- **검증 한계 (Limits)**: 결정론적 ID 생성 증거가 파이프라인 런타임 전파를 입증하지는 않으며, 전파 무결성은 `TC-INV-04B`에서 독립 검증함.

---

### TC-INV-04B: `referenceId`의 파이프라인 종단 간 추적성 및 엣지 결과 인과성 단언
- **대응 계약 조항**: `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` Section 3, Section 4 (CR-04.2: 종단 간 참조 인과 추적성)
- **테스트 유형**: 파이프라인 관측 가능성 / 인과 추적 계약 사양 (Pipeline observability / causal trace contract)
- **실행 상태**: **`NOT RUN — EXECUTION FREEZE`** (실행 동결 유지)
- **검증 목적 (Objective)**:
  - 단일 참조 발생(Reference Occurrence)이 AST 스캐너 출력 $\to$ 리졸버 입력 $\to$ 리졸버 진단 로그 $\to$ 최종 그래프 결과(엣지 생성 또는 억제)까지 ID 유실이나 변조 없이 1:1로 완전하게 추적 가능함을 검증함.
- **입력 조건 및 격리 픽스처 (Fixture)**:
  - 최소 3대 종단 결과를 대표하는 격리 픽스처:
    - 픽스처 1: 정상 해석되어 최종 엣지를 생성할 자격이 있는 참조 (Resolved & Eligible).
    - 픽스처 2: 계약 규칙(P1/P2 등)에 의해 거절된 참조 (Rejected).
    - 픽스처 3: 불충분 증거로 억제되거나 미해석으로 남은 참조 (Suppressed / Unresolved).
  - 각 픽스처는 `TC-INV-04A`에 정의된 고유한 독립 기대 `referenceId`를 보유함.
- **검증 절차 (Procedure)**:
  1. 스캐너의 참조 발생 레코드 및 생성된 `referenceId`를 캡처.
  2. 동일 참조가 리졸버 입력 및 리졸버 결정/진단 출력으로 전파되는 경로 추적.
  3. 리졸버 결정이 최종 엣지 생성 또는 엣지 억제(간선 0건) 결과로 귀결되는 종단 추적.
  4. 모든 레코드를 `referenceId`를 키로 하여 1:1 상호 대조.
  5. 최종 종단 결과가 리졸버의 계약 결정과 논리적으로 일치하는지 확인.
- **필수 단언 (Required Assertions)**:
  - 계약이 요구하는 전 파이프라인 단계에서 동일한 `referenceId`가 보존됨.
  - 어떠한 단계도 `referenceId`를 다른 ID로 무단 치환하거나 유실하지 않음.
  - 거절되거나 억제된 참조는 명시적인 종단 결정 레코드를 보유해야 하며, 필수 관측 필드가 결손된 경우 결과는 `BLOCKED`로 처리됨.
  - 생성된 엣지는 단순히 소스/타깃 이름이 일치한다는 사후 추정이 아니라, 해당 `referenceId`에 인과적으로 직접 귀속되어야 함.
  - 종단 결과는 리졸버 결정과 엄격히 일치함: 거절된 참조는 결코 금지된 엣지를 생성하지 않음.
  - *카디널리티 한계*: 모든 참조가 반드시 1개의 엣지를 만들어야 한다는 전역 1:1 카디널리티를 강제하지 않으며, 거부·억제된 참조는 0개의 엣지를 산출함을 정상 단언함.
- **실패 판정 기준 (Failure Conditions)**:
  - 필수 파이프라인 단계에서 `referenceId`가 유실되거나 변조된 경우.
  - 최종 엣지나 억제 결과가 발원 참조 발생과 인과적으로 연결되지 않는 경우.
  - 거절된 참조가 금지된 엣지를 생성한 경우.
  - 단순히 우연히 일치하는 파일 경로/심볼 이름에만 의존하여 인과 추적성을 주장한 경우.
  - 필수 추적 필드가 결손되었음에도 테스트를 `PASS`로 처리한 경우.
- **필요한 증거와 보존 위치**:
  - `artifacts/scratch/audit_tc_inv_04b.json` (스캐너 발생 레코드, 리졸버 입출력 레코드, 진단 추적 로그, 엣지 생성/억제 레코드, `referenceId` 키 매핑 대조표).
- **실행 전 필요한 승인 여부**: 파이프라인 통합 러너 구현 및 실행 승인 필요.
- **검증 한계 (Limits)**: 본 명세는 관측 가능한 인과 사슬 요건을 정의하며, 현재 구현체가 모든 필드를 방출하고 있음을 주장하거나 런타임 실행을 승인하지 않음.

---

## 5. Suite 3: 실험 B 재현 및 왜곡 차단 검증 (Experiment B Defect Reproduction Tests)

### TC-EXP-B-01A: 실험 B 실제 결함 재현 — `win32_window.cpp`의 COM `Release()` 2차 하이재킹 차단
- **대응 계약 조항**: `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` Section 1, Section 6 (`Release` 실측 판정), `RUSTDESK_PREFLIGHT_AUDIT.md` 3.2절
- **성격 구분 및 실측 증거 요건**:
  - 본 테스트는 픽스처의 전제 사실성(소스 및 AST 헤더 존재)과 리졸버의 실제 평가 경로(런타임 결정)를 엄격히 분리하여, 리졸버가 실제로 평가 경로에서 결정을 내렸음을 입증하는 다음 **4대 필수 런타임 증거(Runtime Evidence Artifacts)**를 요구함:
    1) **호출 AST 및 수신 객체 타입 증거**: `flutter/windows/runner/win32_window.cpp` AST 파싱 결과 수신 객체가 `ITaskbarList3*`임을 확인한 타입 레코드 (테스트 입력이 아닌 AST 엔진의 파싱 산출물).
    2) **시스템 헤더 인클루드 증거**: 호출원 파싱 시 `shobjidl.h`가 include 집합에 포함되어 있음을 입증하는 진단 스냅샷.
    3) **리졸버 다차원 문맥 판독 로그**: 실제 리졸버 평가 함수 내부에서 동적으로 기록된 `systemApiEvaluation: 'CONFIRMED'`, `platformContext: 'COM'` 산출 로그.
    4) **두 관계의 독립적 간선 차단 증거 (Dual-Edge Isolation Diff)**:
       - 1차 오결합 차단: `win32_window.cpp` $\rightarrow$ `res/msi/CustomActions/FirewallRules.cpp` (`Release`): **0건**
       - 2차 하이재킹 차단: `win32_window.cpp` $\rightarrow$ `src/platform/windows.cc` (`Release`): **0건**
       - (어느 하나가 사라졌다고 다른 하나가 자동 차단된 것으로 간주하지 않고 두 간선 모두 독립 전수 검사함).
- **입력 조건 및 사전 상태 (실험 B 실제 결함 입력 고정)**:
  - 호출원: `flutter/windows/runner/win32_window.cpp`
  - 호출 표현식: COM 가상 메서드 `Release()` (수신 객체: `ITaskbarList3*`, 시스템 헤더 `shobjidl.h` 포함 확인)
  - 1차 매핑 대상: `res/msi/CustomActions/FirewallRules.cpp` (Tier 2 MSI 제외 규칙에 따라 스코프 제외됨)
  - AS-IS 엔진 결함 동작: 1차 대상 제외 시 `SymbolIndex`의 차순위 파일인 `src/platform/windows.cc`로 2차 전이 매핑 발생
  - `systemApiEvaluation`: `'CONFIRMED'` (다차원 평가 결과 COM 시스템 메서드로 확정)
- **실행 대상과 격리 조건**: RustDesk 심볼 해석 파이프라인 (실측 픽스처 환경)
- **단일 기대 결과**:
  - `resolutionKind`: `"unresolved"`
  - `fallbackReason`: `"SYSTEM_API_GUARD"` (P1 절대 우선 적용)
  - `selectedTarget`: `null`
  - `win32_window.cpp` $\rightarrow$ `windows.cc` 및 `FirewallRules.cpp` 간선 생성률: **각각 0건 (완전 차단)**
- **검증할 불변식**:
  - COM 가상 메서드로 확정된 호출은 내부 1차 후보 제외 시 차순위 파일로 2차 전이되지 않고 P1 가드에 의해 정직하게 격리됨
- **실패 판정 기준**:
  - 리졸버가 COM 시스템 API를 `CONFIRMED`로 판독하지 못하거나, 상기 4대 필수 증거 중 1개라도 누락된 경우, 또는 `Release()` 간선이 `src/platform/windows.cc`나 `FirewallRules.cpp`로 연결된 경우
- **필요한 증거와 보존 위치**: `artifacts/scratch/audit_tc_exp_b_01a.json` (4대 증거 전수 보존)
- **실행 전 필요한 승인 여부**: 격리 회귀 환경 실행 승인 필요

---

### TC-EXP-B-01B: 스코프 제외 대상의 비시스템 대체 전이 차단 (합성 P2 규칙 검증)
- **대응 계약 조항**: `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` Section 4 (Priority 2 제외 후보 대체 전이 차단)
- **성격 구분**: 본 테스트는 실제 실험 B의 `Release` 결함과 구분되는 **일반적인 P2 계약 검증을 위한 합성 단위 테스트(Synthetic Test)**임.
- **입력 조건 및 사전 상태**:
  - 호출원: `src/service.cpp`
  - 도메인 전용 함수 `CustomRelease()` 호출
  - 원래 1차 매핑 대상: `res/msi/CustomActions/FirewallRules.cpp` (스코프 제외 대상)
  - 리졸버 전이 시도: 1차 대상 제외로 인해 `src/platform/windows.cc`의 `CustomRelease`로 대체 바인딩 시도
  - 대체 연결 타당성: 미입증 (독립 증거 부재)
- **실행 대상과 격리 조건**: RustDesk 심볼 해석 파이프라인
- **단일 기대 결과**:
  - `resolutionKind`: `"unresolved"`
  - `fallbackReason`: `"FALLBACK_PRUNED_REJECT"` (P2 적용)
  - `selectedTarget`: `null`
  - `prunedFallbackProof` 구조체 필수 보존
- **검증할 불변식**:
  - 시스템 API가 아닌 일반 도메인 심볼의 대체 전이 시도는 P2 규칙에 의해 차단됨
- **실패 판정 기준**:
  - `windows.cc`로 2차 전이 매핑이 발생한 경우
- **필요한 증거와 보존 위치**: `artifacts/scratch/audit_tc_exp_b_01b.json`
- **실행 전 필요한 승인 여부**: 격리 회귀 환경 실행 승인 필요

---

### TC-EXP-B-01C: `windows.cc`의 기존 `Release()` 오결합 독립 제거 검증
- **대응 계약 조항**: `RUSTDESK_PREFLIGHT_AUDIT.md` 3.2절 (Fact 2번 간선)
- **성격 구분**: `win32_window.cpp`와 별개로 존재하는 `src/platform/windows.cc` $\rightarrow$ `FirewallRules.cpp` 오결합의 독립 소거를 검증함.
- **입력 조건 및 사전 상태**:
  - 호출원: `src/platform/windows.cc`
  - 호출 식별자: `Release()`
  - 1차 매핑 대상: `res/msi/CustomActions/FirewallRules.cpp` (스코프 제외 대상)
- **실행 대상과 격리 조건**: RustDesk 심볼 해석 파이프라인
- **단일 기대 결과**:
  - 리졸버의 시스템 API 판독: `systemApiEvaluation === 'CONFIRMED'`
  - `src/platform/windows.cc` $\rightarrow$ `FirewallRules.cpp` 간선 수: **0건 (완전 소거)**
  - 최종 상태: `resolutionKind: "unresolved"`, `fallbackReason: "SYSTEM_API_GUARD"`
- **실패 판정 기준**:
  - 해당 간선이 잔존하거나 내부 다른 파일로 재매핑된 경우
- **필요한 증거와 보존 위치**: `artifacts/scratch/audit_tc_exp_b_01c.json`
- **실행 전 필요한 승인 여부**: 격리 회귀 환경 실행 승인 필요

---

### TC-EXP-B-02: Win32 커널 `Sleep()` 오결합 차단 (실측 재현)
- **대응 계약 조항**: `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` Section 6 (실측 판정 `Sleep`), `RUSTDESK_PREFLIGHT_AUDIT.md` 3.2절
- **성격 구분**: `wf_cliprdr.c` 및 `IddController.c`의 실제 커널 호출 위치를 독립 검증함.
- **입력 조건 및 사전 상태**:
  - 위치 1: `libs/clipboard/src/windows/wf_cliprdr.c` 내 `Sleep(DWORD)` 호출
  - 위치 2: `libs/virtual_display/dylib/src/win10/IddController.c` 내 `Sleep(DWORD)` 호출
  - 프로젝트 내 `Sleep` 정의 보유 파일: `res/msi/CustomActions/CustomActions.cpp` (유일한 정의 소스)
- **실행 대상과 격리 조건**: RustDesk 심볼 해석 파이프라인
- **단일 기대 결과**:
  - 두 위치 모두 리졸버의 시스템 API 판독 결과: `systemApiEvaluation === 'CONFIRMED'` (Win32 선언 및 호출 문맥 기반)
  - 두 위치 모두 최종 판정 상태:
    - `resolutionKind`: `"unresolved"`
    - `fallbackReason`: `"SYSTEM_API_GUARD"`
    - `selectedTarget`: `null`
  - 두 위치로부터 `CustomActions.cpp`로의 오결합 간선 수: **각각 0건 (총 0건)**
- **검증할 불변식**:
  - 프로젝트 내에 단일 후보(`CustomActions.cpp`)가 존재하더라도 시스템 API 가드에 의해 내부 노드 결합 차단
- **실패 판정 기준**:
  - `wf_cliprdr.c` 또는 `IddController.c` $\rightarrow$ `CustomActions.cpp` 간선이 1건이라도 생성된 경우
- **필요한 증거와 보존 위치**: `artifacts/scratch/audit_tc_exp_b_02.json`
- **실행 전 필요한 승인 여부**: 격리 회귀 환경 실행 승인 필요

---

### TC-EXP-B-03: 전체 그래프 오염 엣지 전수 조사 및 제로 오결합 불변식 단언 ({\text{total}}$)
- **대응 계약 조항**: `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` Section 1, Section 6 (CR-06.2: 전체 그래프 {\text{total}}$ 수준의 오염 엣지 제로 불변식)
- **테스트 유형**: 전체 그래프 불변식 / 실험 B 안전성 사양 (Whole-graph invariant / Experiment B safety)
- **실행 상태**: **`NOT RUN — EXECUTION FREEZE`** (실행 동결 유지)
- **검증 목적 (Objective)**:
  - 실험 B에서 보고된 특정 4개 호출원 외에, 전체 그래프({\text{total}}$) 상의 어떠한 노드도 MSI 빌드 스크립트 소스 파일로 부당하게 바인딩되는 오염 엣지(Pollution Edges)가 총 0건임을 전수 조사(Exhaustive Audit)로 정의하고 단언함.
- **범위 및 필수 스냅샷 신원 (Scope & Required Snapshot Identity)**:
  - 본 테스트는 명시적으로 식별되고 불변 잠금된 단일 그래프 스냅샷 {\text{total}}$ 상에서 동작해야 함.
  - 스냅샷 식별자, 소스 경로, SHA-256 해시, 노드 수, 엣지 수, 출처 검증 상태를 필수 기록해야 함.
  - *차단 규칙*: 스냅샷을 식별할 수 없거나 필수 내용이 결손된 경우 결과는 **`BLOCKED`**로 처리되며, 출처가 미검증된 그래프나 임의로 새로 생성한 그래프를 과거 기준선이라고 날조하여 대체할 수 없음.
- **금지 대상 집합 (Prohibited Target Set)**:
  - 단순 베이스네임이 아닌 정규화된 정규 경로 신원(Canonical Path Identity)으로 정의:
    - 1) `res/msi/CustomActions/FirewallRules.cpp`
    - 2) `res/msi/CustomActions/CustomActions.cpp`
  - (계약이 추가 대상 변종을 요구하는 경우 실행 전 명시적으로 열거해야 하며, 유사 이름에만 의존하여 자의적으로 대상을 확장하거나 누락할 수 없음).
- **분류 규칙 (Classification Rule)**:
  - {\text{total}}$ 내에서 금지 대상 집합으로 향하는 모든 엣지에 대해, 해당 엣지가 계약상 오염(Misbound/Pollution) 엣지인지 판별함.
  - 계약이 승인한 합법적이고 명시적인 물리 `#include` 예외(`TC-PRIO-04C`) 관계는 대상이 MSI 범위에 있다는 이유만으로 오염 엣지로 오분류되어서는 안 됨.
  - 반대로, 단순 흔한 심볼명 일치(`Release`, `Sleep` 등)는 유효한 바인딩의 증거가 될 수 없음.
- **검증 절차 (Procedure)**:
  1. 선언된 그래프 스냅샷 {\text{total}}$의 모든 엣지를 전수 열거.
  2. 정규화된 타깃 경로가 금지 대상 집합에 속하는 모든 엣지를 선별(Filter).
  3. 선별된 각 엣지를 계약 정의 증거 규칙에 따라 정밀 분류.
  4. 선별된 모든 엣지와 분류 근거(소스 경로, 타깃 경로, 심볼/참조 식별자, `resolutionKind`, 뒷받침 증거)를 전수 기록.
  5. 오염 엣지로 최종 분류된 총 개수($\text{PollutionEdges}$)를 계산.
- **필수 단언 (Required Assertions)**:
  - 조사는 이전에 보고된 4개 호출원만이 아니라, 선언된 {\text{total}}$의 모든 엣지를 전수 포함함.
  - 금지 대상 집합을 타깃으로 하는 모든 엣지가 감사 출력에 정확히 1회 계수됨.
  - **$\text{PollutionEdges} = 0* 단언은 선별된 모든 엣지가 검토되고 오염 정의에 부합하는 것이 전무할 때에만 성립함.
  - 증거 결손으로 인해 선별된 엣지를 분류할 수 없는 경우 판정은 `PASS`가 아닌 **`BLOCKED`** 또는 **`INCONCLUSIVE`**로 처리됨.
  - 금지 집합을 타깃으로 하는 전체 엣지 수와 오염으로 분류된 엣지 수를 분리 보고해야 하며, 두 값을 혼동하지 않음.
  - 과거의 4대 의심 엣지는 기명 점검 항목으로 포함될 수 있으나 전체 그래프 전수 조사를 대체할 수 없음.
- **실패 판정 기준 (Failure Conditions)**:
  - 금지된 오염 엣지가 1건이라도 잔존하는 경우 ($\text{PollutionEdges} > 0$).
  - 전수 열거에서 엣지가 누락되거나, 분류 불가능한 엣지를 침묵 속에 제외한 경우.
  - 기지의 호출원만 검사하고 전체 그래프 검증을 통과했다고 주장한 경우.
  - 그래프 스냅샷 신원이나 출처가 결손되었음에도 과거 기준선 주장으로 비약한 경우.
- **필요한 증거와 보존 위치**:
  - `artifacts/scratch/audit_tc_exp_b_03.json` (스냅샷 신원 및 출처 메타데이터, 선별된 엣지 전수 인벤토리, 개별 엣지 분류 근거, 재현 가능한 합계 계산 산출물).
- **실행 전 필요한 승인 여부**: 전 그래프 전수 감사 러너 구현 및 실행 승인 필요.
- **검증 한계 (Limits)**: 제로 결과는 명명된 스냅샷과 타깃 집합에만 유효하며, 런타임 동작이나 향후 스냅샷의 무결성을 입증하지 않음. 출처 미검증 스냅샷은 과거 Experiment B의 `FAIL` 판정을 번복할 수 없음.


- **금지 대상 집합 (Prohibited Target Set)**:
  - 단순 베이스네임이 아닌 정규화된 정규 경로 신원(Canonical Path Identity)으로 정의:
    - 1) `res/msi/CustomActions/FirewallRules.cpp`
    - 2) `res/msi/CustomActions/CustomActions.cpp`
  - (계약이 추가 대상 변종을 요구하는 경우 실행 전 명시적으로 열거해야 하며, 유사 이름에만 의존하여 자의적으로 대상을 확장하거나 누락할 수 없음).
- **분류 규칙 (Classification Rule)**:
  - $G_{\text{total}}$ 내에서 금지 대상 집합으로 향하는 모든 엣지에 대해, 해당 엣지가 계약상 오염(Misbound/Pollution) 엣지인지 판별함.
  - 계약이 승인한 합법적이고 명시적인 물리 `#include` 예외(`TC-PRIO-04C`) 관계는 대상이 MSI 범위에 있다는 이유만으로 오염 엣지로 오분류되어서는 안 됨.
  - 반대로, 단순 흔한 심볼명 일치(`Release`, `Sleep` 등)는 유효한 바인딩의 증거가 될 수 없음.
- **검증 절차 (Procedure)**:
  1. 선언된 그래프 스냅샷 $G_{\text{total}}$의 모든 엣지를 전수 열거.
  2. 정규화된 타깃 경로가 금지 대상 집합에 속하는 모든 엣지를 선별(Filter).
  3. 선별된 각 엣지를 계약 정의 증거 규칙에 따라 정밀 분류.
  4. 선별된 모든 엣지와 분류 근거(소스 경로, 타깃 경로, 심볼/참조 식별자, `resolutionKind`, 뒷받침 증거)를 전수 기록.
  5. 오염 엣지로 최종 분류된 총 개수($\text{PollutionEdges}$)를 계산.
- **필수 단언 (Required Assertions)**:
  - 조사는 이전에 보고된 4개 호출원만이 아니라, 선언된 $G_{\text{total}}$의 모든 엣지를 전수 포함함.
  - 금지 대상 집합을 타깃으로 하는 모든 엣지가 감사 출력에 정확히 1회 계수됨.
  - **$\text{PollutionEdges} = 0$** 단언은 선별된 모든 엣지가 검토되고 오염 정의에 부합하는 것이 전무할 때에만 성립함.
  - 증거 결손으로 인해 선별된 엣지를 분류할 수 없는 경우 판정은 `PASS`가 아닌 **`BLOCKED`** 또는 **`INCONCLUSIVE`**로 처리됨.
  - 금지 집합을 타깃으로 하는 전체 엣지 수와 오염으로 분류된 엣지 수를 분리 보고해야 하며, 두 값을 혼동하지 않음.
  - 과거의 4대 의심 엣지는 기명 점검 항목으로 포함될 수 있으나 전체 그래프 전수 조사를 대체할 수 없음.
- **실패 판정 기준 (Failure Conditions)**:
  - 금지된 오염 엣지가 1건이라도 잔존하는 경우 ($\text{PollutionEdges} > 0$).
  - 전수 열거에서 엣지가 누락되거나, 분류 불가능한 엣지를 침묵 속에 제외한 경우.
  - 기지의 호출원만 검사하고 전체 그래프 검증을 통과했다고 주장한 경우.
  - 그래프 스냅샷 신원이나 출처가 결손되었음에도 과거 기준선 주장으로 비약한 경우.
- **필요한 증거와 보존 위치**:
  - `artifacts/scratch/audit_tc_exp_b_03.json` (스냅샷 신원 및 출처 메타데이터, 선별된 엣지 전수 인벤토리, 개별 엣지 분류 근거, 재현 가능한 합계 계산 산출물).
- **실행 전 필요한 승인 여부**: 전 그래프 전수 감사 러너 구현 및 실행 승인 필요.
- **검증 한계 (Limits)**: 제로 결과는 명명된 스냅샷과 타깃 집합에만 유효하며, 런타임 동작이나 향후 스냅샷의 무결성을 입증하지 않음. 출처 미검증 스냅샷은 과거 Experiment B의 `FAIL` 판정을 번복할 수 없음.

---

## 6. Suite 4: 전체 파이프라인 및 공식 리포트 회귀 검증 (Pipeline & Report Semantics Tests)

### TC-PIPE-01: 전 파이프라인 5대 독립 판정 및 리포트 시맨틱 회귀 검증
- **대응 계약 조항**: `GEMINI.md` (Mandatory Sanity Checks & Report Impact Verification), `RUSTDESK_PREFLIGHT_AUDIT.md` 1~3절
- **기준선 데이터셋 및 스냅샷 지문 고정 (불변 원칙)**:
  - 검증 대상 프로젝트: RustDesk 전체 소스 트리
  - 입력 기준 스냅샷 지문 (읽기 전용 격리 보존):
    - `project_state.json`: SHA-256 `26d86f2223c7e263061bb06f15d432282fe733a6a1f3ec5a5aaa58756feb95be`
    - `simulation_evidence.json`: SHA-256 `c5cba413a969212e9796fe694069b5c4e8193f9fb157b7ba23e9c73614f0e107`
    - `diagnostic_trace.json`: SHA-256 `e6ed110dfc127a55bc4a26f937f0de7aa36cf96654ea06561f65199388f8fc47`
  - **A5 잠정 기준선 (PROVISIONAL BASELINE) 및 순위 평가 규칙**:
    - 공식 지위: 점수의 입력-공식-계산 재현 사슬이 독립 증명되기 전까지 본 수치는 **`PROVISIONAL BASELINE`**으로 분류 관리함.
    - 평가 대상: `CONTROL_BRIDGE` (A5) 탐지기 평가 대상 전체 클러스터 (동점 시 클러스터 경로 사전식 고정 정렬).
    - 잠정 관측치: 6위 (`alphaScore: 238.5550`, 클러스터: `res/msi/CustomActions`). (과거 `7233.23`은 전체 프로젝트 스캔 출처로 분리 격리).
    - **점수 감소와 순위 변화의 분리 판정 프로토콜**:
      1) **점수 감소 판정**: 오결합 간선 4건 제거 후 실제 탐지기가 산출한 `alphaScore`가 기준선 대비 실측 감소했는가 ($\text{alphaScore}_{\text{new}} < 238.5550$)?
      2) **순위 변화 판정**: 전체 클러스터 재계산 및 사전식 동점 정렬 적용 시 순위가 7위 이하로 하락했는가?
      3) **결과 기록 규칙**: 점수가 감소했으나 다른 클러스터들의 변동으로 순위가 하락하지 않은 경우, 즉시 리졸버 실패로 단정하지 않고 **"오결합 제거 성공 및 A5 순위 영향 가설 미지지(`INCONCLUSIVE`)"**로 분리 기록함.
  - **정상 경로·모듈 간선 기준선 (`LEGITIMATE_PATH_EDGES_BASELINE`) 명세 및 검증 프로토콜**:
    - **1) 기준선 범위 및 간선 유형 한정**:
       - 본 기준선은 전체 그래프의 모든 간선이 아니며, **C/C++ 정적 `#include` 물리 매핑 간선 및 Rust 명시적 `mod` 선언 간선 총 488건으로 한정(`LEGITIMATE_PATH_EDGES_BASELINE`)**됨. (심볼 기반 `CALL` 간선은 별도 검증 대상).
       - 고유 UID 생성 규칙: `edgeUID = HASH(from_path + "::" + to_path + "::" + edge_type + "::" + raw_import_text + "::" + ast_line_number)` (경로 구분자 정규화 및 원본 텍스트 포함으로 충돌 방지).
    - **2) 사전 고정 및 SHA-256 잠금 (Pre-Fixed Baseline)**:
       - 회귀 실행 전 `scratch/legitimate_path_edges_baseline.json` 픽스처 파일을 생성하고 SHA-256 체크섬을 영구 잠금.
    - **3) 3자 차집합 및 속성 전수 검증 (Delta Verification)**:
       - 단순 ID 일치뿐 아니라, `from`, `to`, `edge_type`, 원본 참조 텍스트, 경로 정규화 규칙을 전수 대조:
       $$\text{PreservedEdges} = \{ e \in \text{RunEdges} \mid e \in \text{BaselineEdges} \land \operatorname{Attrs}(e) \equiv \operatorname{Attrs}_{\text{base}}(e) \}$$
       $$\text{MissingEdges} = \text{BaselineEdges} \setminus \text{RunEdges} \equiv \emptyset \quad (\text{경로·모듈 간선 보존율 100\%})$$
       $$\text{AddedEdges} = \text{RunEdges} \setminus \text{BaselineEdges} \quad (\text{신규 생성 간선의 정당성 개별 감사})$$
- **실행 대상 파이프라인 전 단계**:
  - 1단계: `BootstrapEngine` (파일 발견 및 4대 집합 분할)
  - 2단계: `DataPipeline` (스캐너 파싱 및 참조 추출)
  - 3단계: `ReferenceResolver` (v2.5 안전성 계약 적용)
  - 4단계: `GraphModel` & `Snapshot` (그래프 및 메트릭 생성)
  - 5단계: 탐지기 실행 엔진 (A1 `SYSTEM_CORE`, A3 `HIGH_ISOLATION_BOUNDARY`, A5 `CONTROL_BRIDGE`, E2 `CHANGE_AMPLIFIER`)
  - 6단계: 리포트 엔진 (`ExecutiveReportBuilder`, `ExecutiveReportDiffBuilder`)

### 📌 TC-PIPE-01의 5대 독립 합격 판정 영역 (4-State Audit Grading)
각 영역은 **`PASS` / `FAIL` / `BLOCKED` / `INCONCLUSIVE`**로 독립 기록되며, 전체 테스트가 최종 공식 `PASS`하기 위해서는 **5개 영역 모두 `PASS`**여야 한다.

| 평가 영역 | 독립 검증 항목 | 합격 기준 (PASS) | 실패 (FAIL) | 차단/미확정 (BLOCKED / INCONCLUSIVE) |
| :--- | :--- | :--- | :--- | :--- |
| **영역 1** | **오결합 간선 4건 제거** | 실측 오결합 간선 4건 전수 소거 확인:<br>1) `win32_window.cpp` $\rightarrow$ `FirewallRules.cpp` (`Release`): 0건<br>2) `windows.cc` $\rightarrow$ `FirewallRules.cpp` (`Release`): 0건<br>3) `wf_cliprdr.c` $\rightarrow$ `CustomActions.cpp` (`Sleep`): 0건<br>4) `IddController.c` $\rightarrow$ `CustomActions.cpp` (`Sleep`): 0건 | 4건 중 1건이라도 잔존하거나 `windows.cc`로 2차 전이된 경우 | `BLOCKED`: 파싱 I/O 실패 등으로 간선 분석이 중단된 경우 |
| **영역 2** | **정상 경로·모듈 간선 보존율** | 사전 해시 고정된 `LEGITIMATE_PATH_EDGES_BASELINE` (488건)에 대한 $\text{MissingEdges} \equiv \emptyset$ (100% 보존) 및 속성 전수 일치 | 경로·모듈 간선 중 1건이라도 누락되거나 속성이 변질된 경우 | `BLOCKED`: 기준선 픽스처 해시 불일치 또는 로드 실패 시 |
| **영역 3** | **A5 초크포인트 지표 변화** | 오결합 간선 4건 제거 후 실제 탐지기 재계산 결과:<br>1) 기준선 인과사슬 증명 완료 후 `alphaScore`가 실측 감소함<br>2) 재계산 순위가 7위 이하로 하락함 | 기준선 증명 후 점수가 하락하지 않거나 오히려 증가한 경우 | `BLOCKED`: 기준선(`238.5550`)의 입력 스냅샷·공식 재현 사슬 검증 전 (검증 전 평가 유보)<br>`INCONCLUSIVE`: 점수는 하락했으나 순위 하락이 관측되지 않은 경우 |
| **영역 4** | **리포트 증거 추적성 링크** | `findingId` $\rightarrow$ `evidenceId` $\rightarrow$ `reportSection` 링크가 가리키는 실제 노드/간선 식별자가 그래프 스냅샷 및 `diagnostic_trace` 데이터와 **매핑 완료 — 원문 검증 대기** | 링크 식별자가 가리키는 데이터가 그래프 상에 없거나 불일치 시 | `BLOCKED`: 리포트 빌더 산출물 생성 실패 시 |
| **영역 5** | **GEMINI.md Sanity Checks** | `GEMINI.md` 라인 351~365 필수 에러 기준 충족:<br>1) Fallback Ratio $\le 20\%$<br>2) Ghost Nodes $\le$ Real Nodes<br>3) Duplicate Node Count $\equiv 0$ | 세 가지 필수 에러 기준 중 1개라도 위반 시 | `BLOCKED`: 엔진 메트릭 카운터 계산 중단 시 |

- **검증할 불변식**:
  - 그래프 엔지니어링 메트릭 변화가 공식 리포트(Executive Report)의 아키텍처 해석 품질 향상으로 입증되어야 함
  - 상기 5대 영역 중 **단 1개라도 FAIL, BLOCKED, INCONCLUSIVE가 발생할 경우 전체 회귀 테스트는 미통과**로 판정됨
- **필요한 증거와 보존 위치**: `artifacts/scratch/audit_tc_pipe_01.json`, 공식 Executive Report Semantic Diff, `scratch/legitimate_path_edges_baseline.json` (SHA-256)
- **실행 전 필요한 승인 여부**: 전체 파이프라인 통합 회귀 승인 필요

---

### TC-PIPE-02: 아키텍처 리포트 시맨틱 불변성 및 사전 정의 허용 변경 단언
- **대응 계약 조항**: `GEMINI.md` (Validation Rule: Report Impact Verification), `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` Section 6 (CR-07.2: 리포트 시맨틱 불변성)
- **테스트 유형**: 리포트 수준 회귀 명세 사양 (Report-level regression specification)
- **실행 상태**: **`NOT RUN — EXECUTION FREEZE`** (실행 동결 유지)
- **검증 목적 (Objective)**:
  - 의존성 해석 수정으로 인한 정당한 그래프 및 순위 변동은 허용하되, 리졸버 변경 전반에서 시스템의 핵심 아키텍처 의미론(Core Node Top 10 및 Entry Point 순위 체계)이 왜곡되지 않고 불변 보존됨을 정밀 대조함.
- **기준선 선행 요건 (Baseline Prerequisites — Blocked Boundary)**:
  - 기준선 리포트, 입력 그래프 스냅샷, 리포트 생성 설정, 메트릭 공식, 순위 동점 처리(Tie-break) 규칙이 사전에 명시되어야 함.
  - *차단 규칙*: 기준선 리포트를 입력 스냅샷 및 메트릭 유도 사슬과 연결할 수 없는 경우, 과거 기준선 주장에 대해 결과는 **`BLOCKED`**로 처리됨. (합성 기준선은 향후 격리 테스트에 사용할 수 있으나 반드시 `SYNTHETIC`으로 표기해야 함).
- **보호 대상 출력 (Protected Outputs)**:
  - 최소 다음 항목을 정밀 대조:
    - 1) Core Node Top 10 구성원 및 순위.
    - 2) Entry Point 구성원 및 순위.
    - 3) 리포트에 나열된 각 항목의 근거 증거 참조(Evidence References).
    - 4) 양 리포트가 동일한 메트릭 정의와 설정을 사용함을 입증하는 리포트 메타데이터.
- **사전 정의 허용 변경 정책 (Permitted-Change Policy — Predeclared)**:
  - 실행 전에 본 명세는 올바른 의존성 엣지 추가/제거 시 허용되는 변경을 사전 정의해야 함 (모든 순위 변경을 무단 왜곡으로 간주하지 않음).
  - 리포트 차이점은 최소 다음 3가지 중 하나로 사전 분류되어야 함:
    - 1) **예상된 인과 결과 (Expected Consequence)**: 검증된 그래프 변경 및 공개된 메트릭 공식에 의해 직접 설명되는 합법적 변경.
    - 2) **보호된 불변식 위반 (Protected Invariant Violation)**: 허용된 인과 설명 없이 보호 대상을 왜곡한 위반.
    - 3) **미해결 차이 (Unresolved Difference)**: 가용 증거로 변경의 정당성을 판별할 수 없는 경우.
  - *사후 조작 금지*: 허용 변경 정책은 테스트 실행 전에 명시되어야 하며, 결과를 본 후 사후에 꿰맞추는 행위는 엄격히 금지됨.
- **검증 절차 (Procedure)**:
  1. 기준선 리포트 및 필수 출처/설정 식별자를 캡처.
  2. 별도 승인된 검증 실행으로부터 비교 리포트를 캡처.
  3. 명세가 명시적으로 허용한 비결정론적 표현 필드(예: 생성 타임스탬프)만 정규화 (순위, 증거, 메트릭 차이는 결코 정규화로 은폐하지 않음).
  4. Core Node Top 10 순위, Entry Point 순위, 증거 링크를 전수 대조.
  5. 관측된 모든 차이점을 그래프 델타 및 관련 메트릭 유도 사슬과 연결하여 분석.
  6. 4-State 결과 규칙에 따라 최종 판정을 분류.
- **필수 단언 (Required Assertions)**:
  - 양 리포트가 선언된 비교 가능 설정 및 메트릭 정의를 공유함을 입증해야 하며, 그렇지 않으면 판정은 `BLOCKED`임.
  - Core Node Top 10 및 Entry Point의 모든 차이점이 전수 열거됨.
  - 변경된 모든 순위는 허용된 그래프/메트릭 인과 결과로 100% 설명되어야 하며, 그렇지 않은 경우 불변식 위반 또는 미해결 차이로 판정됨.
  - 리포트 내의 증거 참조 링크가 해당 발견을 뒷받침하는 실제 그래프 데이터와 일치해야 함.
  - 최종 점수가 유리한 방향으로 움직였다는 이유만으로 리포트 불일치를 기각할 수 없음.
  - 점수가 변경되었는데 순위가 유지된 경우라도 변경된 점수에 대한 유도 설명이 필수적이며 자동 PASS되지 않음.
- **4-State 결과 판정 규칙 (Outcome Rules)**:
  - **`PASS`**: 모든 보호된 의미론이 유지되고, 허용된 모든 변경이 증거로 설명됨.
  - **`FAIL`**: 최소 하나의 보호된 불변식이 인과 근거 없이 위반됨.
  - **`INCONCLUSIVE`**: 실질적 차이가 존재하나 증거로 허용 여부를 확정할 수 없음.
  - **`BLOCKED`**: 기준선 출처, 설정 동등성 또는 필수 리포트 증거가 결손됨.
- **필요한 증거와 보존 위치**:
  - `artifacts/scratch/audit_tc_pipe_02.json` (양 리포트 산출물, 입력 스냅샷 ID, 메트릭/설정 ID, 정규화 diff, 그래프 델타, 차이점별 인과 설명서, 최종 분류 결과).
- **실행 전 필요한 승인 여부**: 리포트 통합 검증 러너 구현 및 실행 승인 필요.
- **검증 한계 (Limits)**: 본 테스트는 순위가 결코 변하지 않아야 함을 주장하는 것이 아니며, 통제된 시맨틱 비교 체계를 정의함. 스냅샷-공식 유도 사슬이 미검증된 과거 A5 수치는 규범적 기준선이 될 수 없음.

---

## 7. 테스트 케이스 요약 매트릭스 (총 19개)

| 테스트 ID | 범주 | 대상 규칙 / 조항 | 사전 승인 필요 | 비고 |
| :--- | :--- | :--- | :---: | :--- |
| **TC-PRIO-01** | 우선순위 충돌 | `direct` 사전 확정 vs P0 우회 | 필요 | 국소 파싱 전제 고정 및 물리 1:1 확정 검증 |
| **TC-PRIO-02** | 우선순위 충돌 | P1 시스템 API vs P4 복수 후보 | 필요 | P1 우선순위 처리 결정론 검증 (분류 정확성과 분리) |
| **TC-PRIO-03** | 우선순위 충돌 | P1 `INDETERMINATE` vs P5 단일 후보 | 필요 | 계약 원문 규격 `INSUFFICIENT_EVIDENCE` + `SINGLE_UNVERIFIED` |
| **TC-PRIO-04A** | 우선순위 충돌 | `excluded_by_scope` 정상 제외 | 필요 | 대체 미시도 직접 제외 대상 확정 (`scopeExclusionProof` 4대 필드) |
| **TC-PRIO-04B** | 우선순위 충돌 | P2 전이 거절 (`FALLBACK_PRUNED_REJECT`) | 필요 | 2차 대체 전이 차단 (`prunedFallbackProof` 3대 필드) |
| **TC-PRIO-04C** | 우선순위 충돌 | 물리 `#include` 증거 예외 (CR-02.2) | 필요 | 제외 대상 물리 헤더 직접 해석 및 심볼 fallback 차단 음성 대조군 |
| **TC-INV-01** | 핵심 불변식 | 4대 파일 집합 분할 및 분류 사유 | 필요 | I/O 에러 실측 확인(`EACCES`), 미확인 시 `BLOCKED` 판정 |
| **TC-INV-02** | 핵심 불변식 | 후보 집합 4대 집합론적 일치 | 필요 | 중복 수식 $|\operatorname{Set}| = |S|$ 및 계약 우선순위+사전식 정렬 |
| **TC-INV-03A** | 핵심 불변식 | validationAudit 계약 원문 준수 | 필요 | 계약 원문 불변식(isValidated <=> failureReason === null) |
| **TC-INV-03B** | 확장 검증 | 제안된 검증기 오류 코드 검증 | 필요 | 제안된 확장 동작(CANDIDATE_NOT_IN_ELIGIBLE 등, 계약 의무 아님) |
| **TC-INV-04A** | 핵심 불변식 | 결정론적 `referenceId` 생성 (CR-04.1) | 필요 | 독립 오라클 SHA-256 검증 및 7대 정규화 미정 시 `BLOCKED` 경계 |
| **TC-INV-04B** | 핵심 불변식 | `referenceId` 종단 간 추적성 (CR-04.2) | 필요 | 스캐너 $\to$ 리졸버 $\to$ 엣지/억제 종단 인과 추적 (1:1 엣지 강제 없음) |
| **TC-EXP-B-01A** | 결함 재현 | 실험 B 실제 결함 재현 (`win32_window.cpp`) | 필요 | `Release` COM 판독 및 1차/2차 간선 전수 차단 실측 |
| **TC-EXP-B-01B** | 결함 재현 | 도메인 `Release` P2 대체 전이 차단 | 필요 | 합성 단위 테스트 목적 명시 |
| **TC-EXP-B-01C** | 결함 재현 | `windows.cc`의 `Release` 오결합 소거 | 필요 | `windows.cc` $\rightarrow$ `FirewallRules.cpp` 오결합 독립 제거 검증 |
| **TC-EXP-B-02** | 결함 재현 | `Sleep` Win32 오결합 차단 | 필요 | `wf_cliprdr.c`, `IddController.c` 실측 재현 (각 0건) |
| **TC-EXP-B-03** | 결함 재현 | 전체 그래프 오염 엣지 전수 조사 (CR-06.2) | 필요 | $G_{\text{total}}$ 전수 열거, $\text{PollutionEdges} = 0$, 스냅샷 미검증 시 `BLOCKED` |
| **TC-PIPE-01** | 파이프라인 회귀 | 전체 파이프라인 및 리포트 영향 (CR-06.1) | 필요 | A5 잠정 기준선, 경로 간선 488건 기준선, 5대 독립 합격 판정 |
| **TC-PIPE-02** | 파이프라인 회귀 | 아키텍처 리포트 시맨틱 불변성 (CR-07.2) | 필요 | Core Node Top 10/Entry Point 순위 불변 및 사전 정의 허용 변경 정책 |

---

## 8. 계약 조항별 1:1 대조 및 추적표 (Contract Traceability Matrix)

본 명세서에 정의된 19개 테스트 케이스와 안전성 계약(`SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` v2.5) 원문 간의 1:1 정합성 대조 현황입니다.

| 계약 조항 / 불변식 | 테스트 ID | 입력 조건 및 사전 상태 | 단일 기대 결과 (상태값 및 사유) | 계약 증거 스키마 일치 여부 |
| :--- | :--- | :--- | :--- | :--- |
| **Section 4: P0 우회**<br>(물리 경로 direct 사전 확정) | **TC-PRIO-01** | `src/main.rs`의 `mod ui;`<br>Rust 2018+ 에디션 픽스처<br>전역 `PARTIAL` 수집 결손 | `resolutionKind: "direct"`<br>`fallbackReason: null`<br>`selectedTarget: "src/ui.rs"` | **매핑 완료 — 사양 정의**<br>`directPathProof` 4대 필드 전수 일치 |
| **Section 4: P1 절대 가드**<br>(시스템 API vs P4 복수 후보) | **TC-PRIO-02** | COM `Release` 호출<br>`systemApiEvaluation: CONFIRMED`<br>복수 도메인 후보 존재 | `resolutionKind: "unresolved"`<br>`fallbackReason: "SYSTEM_API_GUARD"`<br>`selectedTarget: null` | **매핑 완료 — 사양 정의**<br>P1 절대 우선순위 결정론 |
| **Section 4: P5 미판정 격리**<br>(미판정 단일 후보 안전 격리) | **TC-PRIO-03** | C 소스 `Sleep` 호출<br>`systemApiEvaluation: INDETERMINATE`<br>단일 후보(`CustomActions.cpp`) | `resolutionKind: "unresolved"`<br>`fallbackReason: "INSUFFICIENT_EVIDENCE"`<br>`selectedTarget: null` | **매핑 완료 — 사양 정의**<br>`insufficientEvidenceType: "SINGLE_UNVERIFIED"` |
| **Section 4: excluded_by_scope**<br>(대체 미시도 직접 스코프 제외) | **TC-PRIO-04A** | MSI 클러스터 내부 호출<br>동일 스코프 타깃(`FirewallRules.cpp`)<br>대체 탐색 불요 | `resolutionKind: "excluded_by_scope"`<br>`fallbackReason: null`<br>`selectedTarget: null` | **매핑 완료 — 사양 정의**<br>`scopeExclusionProof` 4대 필드 일치 |
| **Section 4: P2 전이 차단**<br>(제외 대상의 2차 전이 차단) | **TC-PRIO-04B** | 1차 대상 스코프 제외(`res/msi`)<br>잔여 차순위 파일로 2차 전이 시도<br>독립 연결 근거 부재 | `resolutionKind: "unresolved"`<br>`fallbackReason: "FALLBACK_PRUNED_REJECT"`<br>`selectedTarget: null` | **매핑 완료 — 사양 정의**<br>`prunedFallbackProof` 3대 필드 일치 |
| **Section 4: CR-02.2**<br>(제외 스코프 타깃 물리 include 예외) | **TC-PRIO-04C** | `CustomActions.cpp` 내 `#include "FirewallRules.h"`<br>타깃 헤더 물리 실존<br>음성 대조군(헤더 결손 + 소스 심볼 후보 실존) | `resolutionKind: "direct"`<br>음성 대조군: 심볼 인덱스 fallback 원천 차단 (`FALLBACK_PRUNED_REJECT`) | **매핑 완료 — 사양 정의**<br>물리 증거 기반 direct 예외 판정 |
| **Section 3: Invariant 3**<br>(4대 파일 집합 분할 및 사유 보존) | **TC-INV-01** | 20개 테스트 파일 집합<br>(대상 10, 제외 3, 비대상 7)<br>`EACCES` 실측 픽스처 | 집합 분할 완전 등식 성립<br>비대상 파일 사유 코드 100% 보존<br>(`EACCES` 미발생 시 `BLOCKED`) | **매핑 완료 — 사양 정의**<br>집합론적 상호 배타 분할 |
| **Section 3: Invariant 4**<br>(후보 집합 4대 등식 및 전수 감사) | **TC-INV-02** | 심볼당 10개 후보 풀<br>4개 상호 배타 집합 분류 | $S_{\text{initial}} \equiv \biguplus 4\text{대 집합}$<br>$|\operatorname{Set}(S)| = |S|$ (중복 0건)<br>사전식 고정 정렬 | **매핑 완료 — 사양 정의**<br>후보 집합 완전 분할 불변식 |
| **Section 3: Invariant 6**<br>(계약 원문 validationAudit 불변식) | **TC-INV-03A** | 정상/플래그결손/모순 3대 객체<br>(4대 감사 플래그 대조) | $\text{isValidated} \iff \text{failureReason} = \text{null}$<br>플래그 결손 시 무조건 승격 거절 | **매핑 완료 — 사양 정의**<br>계약 규범적 필수 의무 전수 대조 |
| **제안 확장 규격**<br>(검증기 표준 오류 코드) | **TC-INV-03B** | 후보미포함, 증거부재, 모순객체 | 제안 오류 코드 매핑<br>(CANDIDATE_NOT_IN_ELIGIBLE 등) | **제안 확장 (계약 외 규격)**<br>계약 v2.5 필수 통과와 엄격 분리 |
| **Section 3: CR-04.1**<br>(참조 ID 결정론적 생성 공식) | **TC-INV-04A** | AST 참조 좌표 스트림<br>독립 테스트 오라클 해시 계산<br>7대 정규화 사전 확인 | `referenceId = sha256(canonical_bytes)` 완전 일치<br>동일 입력 다회 재현 불변<br>(정규화 미정 시 `BLOCKED`) | **매핑 완료 — 사양 정의**<br>독립 오라클 대조 및 Hex 직렬화 |
| **Section 3, 4: CR-04.2**<br>(종단 간 참조 인과 추적성) | **TC-INV-04B** | 3대 종단 픽스처 (해석, 거절, 억제)<br>스캐너 $\to$ 리졸버 $\to$ 엣지/억제 추적 | `referenceId` 전 파이프라인 1:1 보존<br>거절/억제 참조의 엣지 비생성 보장<br>(필수 필드 결손 시 `BLOCKED`) | **매핑 완료 — 사양 정의**<br>참조 키 기반 인과 사슬 검증 |
| **Section 1, 6: 결함 실측 재현**<br>(win32_window.cpp COM Release) | **TC-EXP-B-01A** | `win32_window.cpp` COM Release<br>1차: `FirewallRules.cpp` (제외)<br>AS-IS: `windows.cc` (2차 전이) | 4대 런타임 증거 필수 보존<br>`win32_window.cpp` $\rightarrow$ `FirewallRules.cpp`: 0건<br>`win32_window.cpp` $\rightarrow$ `windows.cc`: 0건 | **매핑 완료 — 사양 정의**<br>두 간선 독립 차단 실측 |
| **Section 4: 합성 P2 규칙**<br>(비시스템 심볼의 대체 전이 차단) | **TC-EXP-B-01B** | 일반 도메인 함수 `CustomRelease`<br>1차: `res/msi` (스코프 제외)<br>2차: `windows.cc` (대체 시도) | `resolutionKind: "unresolved"`<br>`fallbackReason: "FALLBACK_PRUNED_REJECT"`<br>`selectedTarget: null` | **매핑 완료 — 사양 정의**<br>합성 P2 규칙 검증 목적 명시 |
| **Section 1, 6: 결함 실측 재현**<br>(windows.cc Release 오결합 소거) | **TC-EXP-B-01C** | `windows.cc` 자체의 `Release` 호출<br>타깃: `res/msi/CustomActions/*` | `windows.cc` $\rightarrow$ `FirewallRules.cpp`: **0건**<br>독립 간선 전수 소거 확인 | **매핑 완료 — 사양 정의**<br>1차 오결합 자체의 독립 소거 |
| **Section 1, 6: 결함 실측 재현**<br>(Win32 Sleep 오결합 차단) | **TC-EXP-B-02** | `wf_cliprdr.c`, `IddController.c`<br>단일 후보: `CustomActions.cpp` | `wf_cliprdr.c` $\rightarrow$ `CustomActions.cpp`: 0건<br>`IddController.c` $\rightarrow$ `CustomActions.cpp`: 0건 | **매핑 완료 — 사양 정의**<br>Win32 SDK 기본 함수 격리 |
| **Section 1, 6: CR-06.2**<br>(전체 그래프 $G_{\text{total}}$ 오염 엣지 제로) | **TC-EXP-B-03** | 불변 잠금 스냅샷 $G_{\text{total}}$<br>금지 타깃: MSI 빌드 스크립트 2종<br>전체 엣지 전수 열거 및 분류 | $\text{PollutionEdges} \equiv 0$<br>(스냅샷 미검증 시 `BLOCKED`) | **매핑 완료 — 사양 정의**<br>전수 조사 기반 제로 오염 단언 |
| **GEMINI.md & Section 6: CR-06.1**<br>(파이프라인 회귀 및 리포트 영향) | **TC-PIPE-01** | RustDesk 전체 스냅샷 (SHA-256)<br>A5 잠정 기준선 (`238.5550`)<br>경로·모듈 간선 기준선 (488건) | 5대 영역 독립 4-State 평가<br>(점수 감소와 순위 하락 분리,<br>경로 간선 100% 보존, 전원 PASS) | **매핑 완료 — 사양 정의**<br>잠정 기준선 및 부분집합 명시 |
| **GEMINI.md & Section 6: CR-07.2**<br>(아키텍처 리포트 시맨틱 불변성) | **TC-PIPE-02** | 기준선 리포트 vs 검증 리포트<br>Core Node Top 10 & Entry Point<br>사전 정의 허용 변경 정책 | 보호 출력 순위 불변<br>인과 사슬로 설명되지 않는 변경 거부<br>(기준선 결손 시 `BLOCKED`) | **매핑 완료 — 사양 정의**<br>시맨틱 순위 및 인과 사슬 대조 |

---

## 9. 결론 및 거버넌스 상태 확인

본 단위 테스트 명세서([UNIT_TEST_SPEC_V2.5.md](file:///home/dogsinatas/TypeScript_project/antigravity-extension-vis/mile_stone/UNIT_TEST_SPEC_V2.5.md))는 v1.5 정합화 개정을 통해 안전성 계약(`SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` v2.5)의 잔여 5대 GAP을 사양 수준에서 100% 보완하였습니다.

- **현재 거버넌스 통제 상태 유지 (엄격 불변)**:
  - `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md`: `PROPOSED` (v2.5 기준선 동결 유지)
  - `UNIT_TEST_SPEC_V2.5.md`: `DRAFT` (v1.5 사양 수준 정합화 완료, 구현 및 실행과 분리)
  - 프로덕션 코드: Strict Code Freeze 유지 (`NO_CODE_MODIFICATION`)
  - 파이프라인 및 러너: Execution Freeze 유지 (`NO_PIPELINE_EXECUTION`)
  - Historical Experiment B: `FAIL` 유지 (영구 보존)
  - Gate 1 (V0 기준선): `BLOCKED` 유지
  - Gate 2 (V1~V3 정적 감사): `FAIL` 유지
  - Gate 3 (V4~V5 검증 실행): `ON HOLD` 유지
  - 신규 추가된 5개 테스트 케이스: **`NOT RUN — EXECUTION FREEZE`**
