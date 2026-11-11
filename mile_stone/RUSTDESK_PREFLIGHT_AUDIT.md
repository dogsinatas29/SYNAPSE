# encoding: utf-8
# 📋 RUSTDESK_PREFLIGHT_AUDIT.md: RustDesk 실측 준비 감사 보고서

- **작성 기준 시각**: 2026-10-18T19:56:00+09:00
- **원칙**: READ ONLY & ZERO CODE MODIFICATION (`src/`, `ui/` 코드 변경 0건, 원본 스냅샷 덮어쓰기 0건)
- **목적**: 실제 RustDesk 파이프라인 실측에 앞서 원본 스냅샷 지문 및 경로 격리를 확인하고, 기존 A1/A3/A5/E2 증거 계보와 안 B(선택적 수집 제외) 판정 규칙을 고정.

---

## 1. 원본 및 출력 경로 격리 감사 (Path & Fingerprint Isolation)

### A. 원본 파일 SHA-256 지문 (읽기 전용 기준선)
| 대상 파일 경로 | 크기 (Bytes) | SHA-256 Checksum | 보존 상태 |
| :--- | :---: | :--- | :---: |
| `/home/dogsinatas/다운로드/rustdesk-master/synapse_data/project_state.json` | 938,240 | `26d86f2223c7e263061bb06f15d432282fe733a6a1f3ec5a5aaa58756feb95be` | **불변 보존** |
| `/home/dogsinatas/다운로드/rustdesk-master/synapse_report/surgery/simulation_evidence.json` | 62,383 | `c5cba413a969212e9796fe694069b5c4e8193f9fb157b7ba23e9c73614f0e107` | **불변 보존** |
| `scratch/track14_output/synapse_data/project_state.json` | 938,240 | `26d86f2223c7e263061bb06f15d432282fe733a6a1f3ec5a5aaa58756feb95be` | **불변 보존** |
| `scratch/track14_output/synapse_report/surgery/simulation_evidence.json` | 62,383 | `c5cba413a969212e9796fe694069b5c4e8193f9fb157b7ba23e9c73614f0e107` | **불변 보존** |
| `scratch/track14_output/synapse_report/surgery/diagnostic_trace.json` | 91,874 | `e6ed110dfc127a55bc4a26f937f0de7aa36cf96654ea06561f65199388f8fc47` | **불변 보존** |

### B. 격리 출력 디렉터리 검증
- **실측 출력 격리 경로**: `/home/dogsinatas/TypeScript_project/antigravity-extension-vis/scratch/verification_output/rustdesk_eval`
- **원본 경로 덮어쓰기 위험 검사**:
  - 원본 파일 상위 경로(`/home/dogsinatas/다운로드/rustdesk-master/`) 및 이전 트랙 산출물(`scratch/track14_output/`)과 완전 분리 확인 (`true`).
  - 기존 증거를 덮어쓰는 파이프라인 실행 옵션 없음 확인.

---

## 2. RustDesk 기존 기준선 증거 계보 및 미해결 항목 감사

### A. 핵심 탐지기 Finding $\rightarrow$ Evidence 매핑 실측 (68건)
`diagnostic_trace.json` 전수 대조 결과:
- **`CONTROL_BRIDGE` (A5)**: 총 40건 (`EXEC-35`: 20건, `EXEC-39`: 20건, 동일 타깃 중복 실행).
  - `res/msi/CustomActions` 클러스터 등재:
    - `EXEC-35`: `findingId: F-1792307603461-5220` $\rightarrow$ `evidenceId: E-1792307603461-1299` (`STRUCTURAL_METRIC`)
    - `EXEC-39`: `findingId: F-1792307603466-5789` $\rightarrow$ `evidenceId: E-1792307603466-9206` (`STRUCTURAL_METRIC`)
- **`SYSTEM_CORE` (A1)**: 총 2건 (`EXEC-38`: `flutter/linux`, `flutter/windows/runner`). `res/msi/CustomActions` 미포함 확인.
- **`HIGH_ISOLATION_BOUNDARY` (A3)**: 총 24건 (`EXEC-34, 37, 40~45`). `res/msi/CustomActions` 미포함 확인.
- **`CHANGE_AMPLIFIER` (E2)**: 총 2건 (`EXEC-33`). `res/msi/CustomActions` 미포함 확인.

### B. 기존 노드 역할 분류 실측치
- `build.rs` 계열 노드: 총 7개 (`build.rs`, `libs/base/build.rs` 등) $\rightarrow$ **전원 `NodeRole.RUNTIME` 오분류**.
- `res/msi/CustomActions/*` 파일 수 및 노드 실측 구분:
  - **디렉터리 내 물리 파일**: 총 28개 (`.h`: 17개, `.cpp`: 8개, `.def`: 1개, `.vcxproj`: 1개, `.config`: 1개).
  - **C/C++ 파싱 대상 소스·헤더**: 총 25개 (`.cpp`: 8개, `.h`: 17개).
  - **이전 스캔 산출물/그래프 노드**: 26개 (비 C/C++ 파일 포함 여부 또는 이전 보고서 관측값). 실제 파이프라인에서 생성되는 그래프 노드 수는 인라인 규칙에 따라 달라질 수 있으므로 실측 분리 기록.
  - $\rightarrow$ **기존 스캔 당시 전원 `NodeRole.RUNTIME` 오분류**.
- `tests/*` 계열 노드: 총 18개 $\rightarrow$ **전원 `NodeRole.RUNTIME` 오분류**.

### C. 점수 차이(`7233.23` vs `238.56`) 및 스냅샷 기원 감사
- **실측 사실**:
  - `diagnostic_trace.json` 및 `simulation_evidence.json` 본문에는 `7233.23` 및 `238.56` 수치 문자열이 명시적으로 존재하지 않음.
  - `simulation_evidence.json`의 타임스탬프(`1791141161353`) 및 `visibleClusterIds`(7개)는 10월 4일자 Flutter 서브트리 스냅샷임.
  - `7233.23`은 이전 전체 프로젝트 스캔 보고서(`allFindings.json` 및 `EVIDENCE_VIEWER.html`)에서 확인된 수치임.
- **공식 판정**: 두 점수의 출처와 정규화 조건이 독립적으로 확인될 때까지 **`미해결 (UNRESOLVED)`** 상태로 고정 유지.

---

## 3. 설계 방향 B 판정 규칙 및 신뢰도 계층 확정 (엔진 적용 전 명세)

| 신뢰도 계층 | 대상 파일 및 경로 패턴 | 기본 런타임 정책 | 판정 조건 및 증거 요건 |
| :--- | :--- | :---: | :--- |
| **Tier 1 (명확한 빌드)** | `build.rs`, `libs/*/build.rs` (7개) | **수집 제외** | Cargo 패키지 루트의 명확한 빌드 스크립트. 물리적 존재(`fs.existsSync`) 및 Cargo 매니페스트 증거 확인 시 `excluded_by_scope` 판정 허용. |
| **Tier 2 (패키징 후보)** | `res/msi/CustomActions/*` (소스 25개 / 전체 28개) | **수집 제외** | Windows MSI 인스톨러 전용 C++ 소스. 런타임 소스에서의 실행 바이너리 포함 여부 예외 검증 완료 후 `excluded_by_scope` 판정. |
| **Tier 3 (모호/근거 부족)** | 런타임과 빌드 공유 설정, 미확정 스크립트 | **수집 보존** | 역할 근거가 불충분할 경우 임의 제외를 전면 금지하고 `UNVERIFIED` 보존. |
| **참조 해석 계약** | 제외된 타깃을 향한 정적 참조 | **3분 판정** | • `direct`: 런타임 실존 연결<br>• `excluded_by_scope`: **물리적 존재(조건 1) + 제외 규칙 적합성(조건 2)** 동시 충족 시 한정<br>• `unresolved`: 증거 불충분, 실제 부재, I/O 오류 전반의 정직한 격리 |

### 3.1 Tier 1 (`build.rs` 7개) 역할 근거 실측 결과 (100% PROVEN)
- **대상 파일 전수 조사 (7개)**:
  - 7개 파일 전원 물리적 실존(`fs.existsSync === true`) 및 부모 디렉터리 내 `Cargo.toml` 실존 확인.
- **역할 근거의 3중 분류 (실제 선언 vs 빌드 의존성 vs 기본 규칙)**:
  1. `build = "build.rs"` 명시적 선언 + `[build-dependencies]` 동시 보유 (3개):
     - `build.rs` (루트)
     - `libs/clipboard/build.rs`
     - `libs/enigo/build.rs`
  2. `build = "build.rs"` 명시적 선언 보유 (1개):
     - `libs/portable/build.rs`
  3. `[build-dependencies]` 선언 + Cargo 기본 빌드 스크립트 규칙 적용 (3개):
     - `libs/base/build.rs`
     - `libs/scrap/build.rs`
     - `libs/virtual_display/dylib/build.rs` (패키지 루트에 위치하여 Cargo 표준 컨벤션 `build.rs`로 자동 인식됨)
- **판정**: **7개 파일 모두 Cargo 빌드 스크립트 역할 근거 확보 $\rightarrow$ Tier 1 기본 런타임 그래프 수집 제외 대상 적합 판정**.

### 3.2 Tier 2 (`res/msi/CustomActions/*`) 심층 참조 감사: 심볼 오결합 가설 및 부분 진단 계산

- **대상 파일**: `res/msi/CustomActions/` 하위 소스·헤더 25개 (물리 파일 28개 중 C/C++ 25개).
- **외부 크로스 바운더리 유입 간선 (Inbound) 전수 4건 실측 (Fact)**:
  1. `flutter/windows/runner/win32_window.cpp -> res/msi/CustomActions/FirewallRules.cpp`
     - 메타데이터: `originalTarget: "Release"`, `resolutionKind: "symbol_index"`, `candidateCount: 1`
  2. `src/platform/windows.cc -> res/msi/CustomActions/FirewallRules.cpp`
     - 메타데이터: `originalTarget: "Release"`, `resolutionKind: "symbol_index"`, `candidateCount: 1`
  3. `libs/clipboard/src/windows/wf_cliprdr.c -> res/msi/CustomActions/CustomActions.cpp`
     - 메타데이터: `originalTarget: "Sleep"`, `resolutionKind: "symbol_index"`, `candidateCount: 1`
  4. `libs/virtual_display/dylib/src/win10/IddController.c -> res/msi/CustomActions/CustomActions.cpp`
     - 메타데이터: `originalTarget: "Sleep"`, `resolutionKind: "symbol_index"`, `candidateCount: 1`
- **원인 소스 코드 대조 검증 (Fact)**:
  - 호출원 4개 파일의 원본 텍스트 검사 결과, `CustomActions`, `FirewallRules`에 대한 명시적 include/참조는 **0건 (`false`)**.
  - Win32/COM 표준 API인 `Release()` 및 `Sleep()` 함수 호출이 `SymbolIndex`에서 MSI 디렉터리의 심볼로 단일 매핑된 정황 확인.
- **단위 탐색 계산 (Exploratory Diagnostic Calculation — 파이프라인 미검증 가설)**:
  - 기존 `project_state.json` 유효 노드(446개) 및 간선(532개)에 대해 탐지기 단위 계산 모듈을 독립 스크립트로 실행한 관측치:
    - 원본 간선 입력 시: `res/msi/CustomActions` $\rightarrow$ `alphaScore: 238.5550` (6위).
    - 임의로 유입 간선 4건을 필터링한 입력 시: `alphaScore: 140.2800` (7위), $\Delta = -98.28$ ($41.2\%$ 변동).
  - **엄격한 경계 구분 (Boundary Notice)**:
    - 본 계산은 메모리 상의 배열 필터링에 의한 **진단용 부분 계산(Unit Probe)**일 뿐이며, 정식 SYNAPSE 파이프라인을 통과한 분석 결과가 아님.
    - 따라서 $41.2\%$ 영향량 및 $140.28$ 점수는 공식 사실(Fact)이 아니며, **"오결합 간선 제거 시 초크포인트 점수가 대폭 하락할 것이다"라는 가설(HYPOTHESIS)**을 뒷받침하는 탐색 데이터로만 한정 취급함.

### 3.3 범위 문제와 해석 문제의 2대 축 분리
1. **범위 문제 (Scope Exclusion)**:
   - 기본 런타임 분석에서 순수 빌드/패키징 전용 파일을 그래프 수집 범위에서 제외할 것인가?
2. **해석 문제 (Symbol Resolution Hijack)**:
   - 런타임 소스 간의 일반 API/메서드 호출(`Release`, `Sleep` 등)이 동명 심볼로 오결합되는 것을 어떻게 방어할 것인가?
   - **경계**: MSI 디렉터리를 수집 단계에서 제외하면 이번 오결합 간선은 소거되지만, 이는 심볼 리졸버 자체의 본질적 결함(동음이의어 방어 부재)을 완치한 것은 아니므로 두 문제를 엄격히 독립 분리하여 다룸.

---

## 4. 삼분화된 결론 (Fact vs Hypothesis vs Unverified) 및 공식 상태

| 구분 | 항목 | 내용 |
| :--- | :--- | :--- |
| **확인된 사실 (Fact)** | **A5 수치 부분 재현** | 기존 `project_state.json`을 단위 계산 모듈에 대입 시 `res/msi/CustomActions` 점수가 `238.5550` (6위)로 산출됨 (단, 과거 전체 파이프라인 실행 출처 증명은 별개 과제). |
| **확인된 사실 (Fact)** | **유입 간선 텍스트 불일치** | 호출원 소스 4개에 MSI 참조가 0건이며, `Release`/`Sleep`이 `symbol_index`로 단일 매핑된 엣지 메타데이터 존재 확인. |
| **강한 추론 (Hypothesis)** | **Symbol Index Hijack** | 4건의 유입 간선은 COM `Release()` 및 Win32 `Sleep()`에 대한 가짜 간선(False Positive)일 가능성이 매우 높으나, 리졸버의 실제 심볼 색인 후보 대조를 통한 추가 규명 필요. |
| **강한 추론 (Hypothesis)** | **A5 점수 증폭 가설** | 단위 탐색 계산상 4건의 간선이 약 98.28점(41.2%)을 증폭시키는 것으로 관측되었으나, 공식 파이프라인 재실행 실측 전까지는 가설로 격하 유지. |
| **미확정 (Unverified)** | **과거 수치(`238.56`, `7233.23`) 출처** | 수치 일치만으로 과거 실행 환경·가시성 스코프·정규화 조건이 완전히 증명된 것은 아니며, 출처 규명은 미해결 과제로 보존. |
| **미확정 (Unverified)** | **MSI 계층 전면 제외 안전성** | 4건의 유입 간선 외에 MSI 내부 25개 파일 및 외부 유출 간선까지 일괄 제외해도 다른 런타임 관계가 왜곡되지 않는지는 전체 파이프라인 전후 비교 전까지 미확정. |

- **Strict Code Freeze**: 유지 (소스 코드 변경 0건).
- **RustDesk 파이프라인 실측 실행**: **승인 대기 (보류 유지)**.
- **빌드 시스템 의미적 격리**: **`UNVERIFIED` (공식 유지)**.



