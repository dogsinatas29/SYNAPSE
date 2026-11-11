# encoding: utf-8
# 📊 CONTRACT_COMPLIANCE_MATRIX.md: 심볼 해석 안전성 계약 적합성 매트릭스

- **문서 버전**: v1.0 (엔진 구현 전 읽기 전용 설계 검토표)
- **작성 기준 시각**: 2026-10-18T21:20:00+09:00
- **상태**: 📐 `READ_ONLY_DESIGN_AUDIT` (소스 코드 변경 0건, 불변 기준선 대조)
- **목적**: `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md`(v1.2)의 CR-01~CR-05 규칙을 기존 SYNAPSE 엔진 코드의 실제 분기/구현과 1:1로 대조하여 결함 위치와 회귀 검증 조건을 명시함.

---

## 1. 2대 사전 아키텍처 결정 사항 (Architectural Clarifications)

### ① `resolutionKind` 단일 필드 체계 유지 및 내부 판정 축 분리
- **질문**: `direct`와 `excluded_by_scope`는 경로 해석 방식과 분석 범위라는 상이한 판정 축인데 어떻게 공존하는가?
- **결정**: 기존 리포트 및 프론트엔드(`project_state.json`, `allFindings.json`, UI)와의 호환성을 위해 **외부 노출 스키마는 단일 `resolutionKind`를 유지**하되, 엔진 내부 판정은 다음 2대 축으로 처리함:
  1. `resolutionMethod`: `relative_path` | `include_path` | `symbol_index` | `module_root`
  2. `targetStatus`: `included` | `excluded_by_scope` | `unresolved`
- **적용 규칙**:
  - 물리 파일이 실존하고 스코프 제외 대상임이 입증되면 최종 `resolutionKind`는 `excluded_by_scope`가 됨.
  - 대상이 제외되었더라도 호출의 원래 의도가 불확실하다면 `unresolved`로 격리하며, 제외 후보 정보는 9대 증거 필드의 `candidatePaths`와 `fallbackReason`에 보존함.

### ② `candidateCount`의 2중 집계 규격 확정
- **질문**: `candidateCount = 1`이 원래 후보가 1개였는지, 필터링 후 1개만 남은 것인지 불명확함.
- **결정**: 9대 증거 스키마에서 다음 두 수치를 명시적으로 구분하여 기록함:
  - `candidateCountRaw`: `SymbolIndex` 또는 디스크에서 조회된 전체 1차 후보 수 (Unfiltered).
  - `candidateCount`: 가시성, 네임스페이스, 모듈 바운더리, 타입 가드를 적용한 후 남은 유효 후보 수 (Filtered).
  - *효과*: `candidateCount = 1`이라도 `candidateCountRaw = 28`인 경우 동음이의어 필터링이 발생했음을 추적할 수 있음.

---

## 2. CR-01 ~ CR-05 적합성 매트릭스 (AS-IS vs TO-BE)

### 📌 CR-01: 후보 자격 인정과 최종 간선 확정의 분리 (Rule 1)
| 항목 | 내용 |
| :--- | :--- |
| **관련 코드 위치** | `src/core/ReferenceResolver.ts:L590-L606`, `src/core/SymbolIndex.ts:L147-L167` |
| **현재 입·출력 필드** | 입력: `targetNodeId` (토큰 심볼명), 출력: `targetNodeId = resolvedPath`, `resolutionKind = 'symbol_index'` |
| **v1.2 계약 요구 동작** | 1단계: 언어별 정적 가시성(동일 네임스페이스, 상속, FFI 선언 등) 증명 시 후보군 편입.<br>2단계: 수신 객체 타입, vtable 인터페이스 정의, 호출 문맥 일치 시 최종 `symbol_index` 승격. |
| **현재 미충족 조건** | AST에서 함수 호출문(`foo()`) 토큰만 추출되면, 가시성/타입 검증 없이 `SymbolIndex` 전역 맵에 존재하는 파일로 즉시 연결됨. |
| **회귀 테스트 사양** | • **입력**: `win32_window.cpp`의 `pTaskbarList->Release()` (COM 메서드 호출)<br>• **기대 상태**: COM 가상 메서드이므로 구체 C++ 구현체로 확정되지 않고 `unresolved`<br>• **실패 판정**: 가시성/타입 증거 없이 `FirewallRules.cpp`나 `windows.cc`로 간선 생성 시 FAIL |
| **호환성 위험** | 정적 가시성이 없는 부실한 CALL 간선 수백 건이 `unresolved`로 정직하게 전환되므로 전체 간선 수가 감소함 (정상적인 품질 정상화). |

---

### 📌 CR-02: 복수 후보 임의 선택 금지 (Rule 2)
| 항목 | 내용 |
| :--- | :--- |
| **관련 코드 위치** | `src/core/SymbolIndex.ts:L150-L162` (`addSymbol`), `src/core/ReferenceResolver.ts:L596` (`lookupSymbol`) |
| **현재 입·출력 필드** | 입력: `symbolName`, 출력: `filePath` (Map<string, string> 단일 값) |
| **v1.2 계약 요구 동작** | `candidateCountRaw >= 2`인 동음이의어 심볼은 등록 순서로 단일 선택하지 않고 모호성으로 거절(`unresolved`, `fallbackReason: 'AMBIGUOUS_CANDIDATES'`). |
| **현재 미충족 조건** | `SymbolIndex`가 1:1 맵이어서 먼저 등록된 파일이 영구 독점하며, 복수 후보 여부 자체를 추적하지 못함. |
| **회귀 테스트 사양** | • **입력**: RustDesk 내 28개 파일에 분산된 `Release` 또는 `close` 심볼 호출<br>• **기대 상태**: 모호성 규칙 적용 $\rightarrow$ `unresolved`, `candidatePaths`에 28개 파일 기록<br>• **실패 판정**: 28개 중 1개 파일로 단일 연결 생성 시 FAIL |
| **호환성 위험** | 없음. 기존 1:1 하이재킹 버그를 차단하는 핵심 불변성임. |

---

### 📌 CR-03: 단일 후보(`candidateCount === 1`) 독립 검증 (Rule 2)
| 항목 | 내용 |
| :--- | :--- |
| **관련 코드 위치** | `src/core/ReferenceResolver.ts:L599-L606`, `src/core/ReferenceResolver.ts:L635-L637` |
| **현재 입·출력 필드** | 입력: `targetNodeId`, 출력: `resolutionKind = 'direct'` 또는 `'symbol_index'`, `candidateCount = 1` 하드코딩 (L957) |
| **v1.2 계약 요구 동작** | 후보가 1개뿐이어도 모듈 경계, 디렉터리 관계, FFI 등 독립적 연결 근거가 없으면 `unresolved`로 격리. |
| **현재 미충족 조건** | `resolvedPath`가 존재하면 유일 여부와 무관하게 무조건 `resolutionKind = 'symbol_index'` 부여 (L601). 또한 L957에서 `candidateCount: 1`을 무조건 고정 주입함. |
| **회귀 테스트 사양** | • **입력**: 타 서브시스템에 속한 유일한 고유 심볼명 호출 (단, `#include`나 모듈 의존성 없음)<br>• **기대 상태**: 후보는 1개(`candidateCountRaw: 1`)이나 독립 증거 부재로 `unresolved`<br>• **실패 판정**: 유일 후보라는 이유로 간선이 생성되거나 `direct`로 승격 시 FAIL |
| **호환성 위험** | `candidateCount`가 실제 계산치로 변경되므로 L957 하드코딩 제거 필요. |

---

### 📌 CR-04: 다차원 문맥 기반 시스템 API 격리 (Rule 3)
| 항목 | 내용 |
| :--- | :--- |
| **관련 코드 위치** | `src/core/ReferenceResolver.ts:L790-L803` (`cStdlibHeaders` 목록), `src/core/ReferenceResolver.ts:L807-L811` (`isGoStdlib`) |
| **현재 입·출력 필드** | 입력: `targetNodeId`, `sourceFilePath`, 출력: `resolutionKind = 'stdlib'` 또는 인클루드 경로 조작 |
| **v1.2 계약 요구 동작** | 단순 문자열 블랙리스트를 지양하고 5대 다차원 문맥(플랫폼, 수신타입, 호출표현식, SDK여부, 정적증거)으로 시스템 API 판별 후 `unresolved` 격리. |
| **현재 미충족 조건** | 현재 시스템 라이브러리 검사는 `cStdlibHeaders`(헤더 파일명 31개)와 Go stdlib에 한정되어 있으며, Win32 커널 API(`Sleep`), COM API(`Release`), POSIX 호출에 대한 런타임 다차원 검사기가 전무함. |
| **회귀 테스트 사양** | • **입력**: `wf_cliprdr.c:L475`의 `Sleep(10)` (Win32 API)<br>• **기대 상태**: Win32 SDK 호출로 식별되어 `res/msi/CustomActions/CustomActions.cpp`로 매핑되지 않고 `unresolved`<br>• **실패 판정**: `CustomActions.cpp`로 연결되거나 단일 심볼로 연결 시 FAIL |
| **호환성 위험** | 없음. 가짜 크로스 바운더리 간선을 차단하여 A5 초크포인트 왜곡을 방지함. |

---

### 📌 CR-05: 제외된 후보의 자동 전이 대체 금지 (Rule 4)
| 항목 | 내용 |
| :--- | :--- |
| **관련 코드 위치** | `src/core/SymbolIndex.ts:L150-L162` (`symbolCatalog`), `src/core/ReferenceResolver.ts:L596` |
| **현재 입·출력 필드** | 입력: `targetNodeId`, 출력: 전역 Map 선점 파일 |
| **v1.2 계약 요구 동작** | Tier 1/Tier 2에 의해 1순위 매핑 대상이 배제되었을 때, 차순위 파일로 Fallback 자동 전이되는 것을 금지하고 `unresolved` 처리. |
| **현재 미충족 조건** | 파일 스캔에서 MSI가 제외되면 `SymbolIndex`에 MSI 파일이 등록되지 않아, 차순위 파일인 `src/platform/windows.cc`가 `Release`의 1순위로 자동 승격되어 2차 왜곡이 발생함 (실험 B에서 실증됨). |
| **회귀 테스트 사양** | • **입력**: MSI 계층이 제외된 RustDesk 저장소에서의 `win32_window.cpp` `Release` 호출<br>• **기대 상태**: `windows.cc`로 2차 전이되지 않고 `unresolved`<br>• **실패 판정**: `win32_window.cpp -> src/platform/windows.cc` 간선 생성 시 FAIL |
| **호환성 위험** | 실험 B의 핵심 실패 사유였던 2차 하이재킹을 원천 차단함. |

---

## 3. 공식 상태 요약 및 거버넌스

- **문서 목적**: 본 매트릭스는 엔진 코드 변경 전에 아키텍처 결함 위치와 회귀 기준을 명확히 동결하기 위한 **읽기 전용 설계 검토 산출물**임.
- **프로덕션 코드**: `src/`, `ui/` 프로덕션 소스 코드는 일체 수정하지 않음 (**Strict Code Freeze 유지**).
- **공식 판정**:
  - 실험 B: **`CONDITIONAL / FAILED TO PRESERVE SEMANTICS`** (유지)
  - 안전성 계약: **`PROPOSED`** (유지)
  - 빌드 시스템 의미적 격리: **`UNVERIFIED`** (유지)
