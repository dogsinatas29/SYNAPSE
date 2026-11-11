# encoding: utf-8
# 📜 EXPERIMENT_B_MINIMAL_VERIFICATION_PLAN.md: Experiment B 최소 검증 계획서

- **문서 버전**: v1.9 (Pre-Execution Gate Cardinality-Priority & Two-Tier Invariant Specification)
- **작성 기준 시각**: 2026-10-19T01:25:00+09:00
- **상태 관리**: 📐 `DRAFT` (계획 수립 단계이며, 실행 승인 전까지 일체의 코드 수정 및 명령 실행 금지)
- **거버넌스 원칙**: READ ONLY & ZERO CODE MODIFICATION (Strict Code Freeze 및 파이프라인 ON HOLD)

---

## 1. 목적과 통제 원칙

본 문서는 Experiment B의 기존 `FAIL` 판정을 영구 보존하면서, MSI 관련 오결합의 원인과 안전성 계약의 차단 능력, 실제 공식 리포트에 미치는 영향을 최소한의 검증으로 확인하기 위한 **실행 전 승인용 계획서(Verification Plan)**이다.

본 단계에서는 어떠한 명령이나 테스트 러너도 실행하지 않는다. 본 문서에 기재된 명령은 향후 별도의 명시적 승인을 득한 후 사용할 수 있는 규격화된 예시이며, 현재의 실행 허가를 의미하지 않는다. 계획서 검토 승인(Gate 0)과 실제 명령 실행 승인(Gate 1 이상)은 상호 독립적이며, 계획서 확정이 명령 실행을 자동으로 허용하지 않는다.

### ⚠️ 거버넌스 및 통제 항목 현황
| 통제 항목 | 현재 상태 | 관리 원칙 |
| :--- | :--- | :--- |
| **Experiment B** | **`FAIL`** | 공식 실패 기록 영구 보존 (변경 금지) |
| **안전성 계약** | **`PROPOSED`** | v2.5 설계 기준선 동결 유지 |
| **테스트 명세** | **`DRAFT`** | 14개 케이스 논리적 정합성 초안 유지 |
| **MSI 제외 정책 및 빌드 격리** | **`UNVERIFIED`** | 실제 안전성 입증 전까지 미검증 유지 |
| **프로덕션 소스 (`src/`, `ui/`)** | **Strict Freeze** | 일체의 파일 변경 금지 |
| **테스트 러너 및 전체 파이프라인** | **`ON HOLD`** | 실행 전 게이트 승인 전까지 구동 보류 |
| **현재 작업 범위** | **계획 문서화** | 향후 검증 명령, 예상 결과, 중단 조건 명세화로 한정 |

### 📌 3대 독립 검증 질문 (질문 간 독립성 보장)
1. **원인 규명**: 기존 오결합이 어떤 후보 선택 및 해석 경로에서 발생했는가?
2. **차단 확인**: 안전성 계약에 정의된 거부 조건이 실제 구현에서 적용되는가?
3. **회귀 방지**: 실제 파이프라인과 공식 리포트에서 오결합이 제거되고 정상 관계가 보존되는가?
*(주의: 위 3개 질문은 상호 독립적이며, 앞 단계의 통과가 뒷 단계의 자동 성공을 보증하지 않는다)*

---

## 2. 기존 기준선 및 보존 대상

| 기준선 항목 | 기존 보고값 | 의미 및 판정 한계 |
| :--- | :---: | :--- |
| **원본 그래프 노드** | 751 | RustDesk 전체 스캔 원본 노드 수 |
| **원본 그래프 간선** | 1,108 | RustDesk 전체 스캔 원본 간선 수 |
| **원본 그래프 클러스터** | 63 | 디렉터리 기반 클러스터링 결과 |
| **MSI 제외 후 노드** | 724 | `res/msi/CustomActions/*` 27개 노드 제외 |
| **MSI 제외 후 간선** | 1,037 | 간선 72개 제거 및 2차 전이 1건 추가 |
| **MSI 제외 후 클러스터** | 62 | MSI 클러스터 1개 소거 |
| **제거된 간선** | 72 | 내부 52, 외부방향 16, 유입 오결합 4 |
| **추가된 간선** | 1 | `win32_window.cpp` $\rightarrow$ `windows.cc` 2차 하이재킹 간선 |
| **순 간선 변화** | -71 | $1,037 - 1,108 = -71$ |

*(한계 명시: 위 수치는 그래프 부트스트랩 수준의 관측치이며, 공식 탐지기 및 보고서 레벨의 영향은 미검증 상태임)*

### 🔒 보존 대상 입력 기준선 원본 및 격리 보존본 경로
기존 기록(`RUSTDESK_PREFLIGHT_AUDIT.md` 1.A절) 및 아티팩트 디렉터리 조사를 통해 확정된 원본 및 격리 보존본의 절대 경로, 권위 있는 SHA-256 기준 해시 및 출처:

| 기준선 식별자 | 외부 원본 실제 절대 경로 (Original) | 아티팩트 격리 보존본 절대 경로 (Artifact Backup) | 크기 (Bytes) | SHA-256 Checksum (보고값) | 권위 있는 기준 출처 및 보존 상태 |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **P-BASE-01** (`project_state.json`) | `/home/dogsinatas/다운로드/rustdesk-master/synapse_data/project_state.json` | `/home/dogsinatas/.gemini/antigravity-ide/brain/4230b6e0-a74c-4938-945b-55b960e1d3df/scratch/track14_output/synapse_data/project_state.json` | 938,240 | `26d86f2223c7e263061bb06f15d432282fe733a6a1f3ec5a5aaa58756feb95be` | `RUSTDESK_PREFLIGHT_AUDIT.md` §1.A.1 기록값 (동결) |
| **P-BASE-02** (`simulation_evidence.json`) | `/home/dogsinatas/다운로드/rustdesk-master/synapse_report/surgery/simulation_evidence.json` | `/home/dogsinatas/.gemini/antigravity-ide/brain/4230b6e0-a74c-4938-945b-55b960e1d3df/scratch/track14_output/synapse_report/surgery/simulation_evidence.json` | 62,383 | `c5cba413a969212e9796fe694069b5c4e8193f9fb157b7ba23e9c73614f0e107` | `RUSTDESK_PREFLIGHT_AUDIT.md` §1.A.2 기록값 (동결) |
| **P-BASE-03** (`diagnostic_trace.json`) | *(외부 원본 없음: Experiment B 산출 단일 보존본)* | `/home/dogsinatas/.gemini/antigravity-ide/brain/4230b6e0-a74c-4938-945b-55b960e1d3df/scratch/track14_output/synapse_report/surgery/diagnostic_trace.json` | 91,874 | `e6ed110dfc127a55bc4a26f937f0de7aa36cf96654ea06561f65199388f8fc47` | `RUSTDESK_PREFLIGHT_AUDIT.md` §1.A.3 기록값 (단일 보존본 대조) |

### 📂 실험 산출물 디렉터리 확정 및 실질적 격리 증명 체계 (사전 상태 스냅샷 보존)
- **실측 baseline 산출물 디렉터리 절대 경로**: `/home/dogsinatas/.gemini/antigravity-ide/brain/4230b6e0-a74c-4938-945b-55b960e1d3df/scratch/verification_output/rustdesk_eval/exp_b_baseline/`
- **실측 pruned 산출물 디렉터리 절대 경로**: `/home/dogsinatas/.gemini/antigravity-ide/brain/4230b6e0-a74c-4938-945b-55b960e1d3df/scratch/verification_output/rustdesk_eval/exp_b_pruned/`
- **실행 전 상태 기록 매니페스트 생성 및 보존 규칙 (5대 통제 규칙)**:
  - 저장 위치: `/home/dogsinatas/.gemini/antigravity-ide/brain/4230b6e0-a74c-4938-945b-55b960e1d3df/scratch/pre_execution_state_manifest.json`
  - 보존 내용: 대상 파일 및 디렉터리 절대 경로, SHA-256 체크섬, 파일 크기(Bytes), `mtime` 타임스탬프, 파일 권한 모드, 심볼릭 링크 타깃.
  1. **생성 시점의 엄격성**: 매니페스트는 별도의 명시적 승인을 득한 **향후 실행 직전(Just-in-Time)**에 생성한다. 현재 V0 단계에서는 경로와 프로토콜만 명시하며 임의로 파일을 생성하지 않는다.
  2. **범위 변동 시 무효화**: 매니페스트 생성 후 격리 실행 전까지 대상 파일이나 디렉터리 범위가 변경될 경우 기존 매니페스트는 즉시 무효화(`INVALIDATED`)되며 재검토를 거친다.
  3. **사후 검증 완료 시까지 보존**: 사후 상태 비교 및 회귀 판정이 완전히 종결될 때까지 매니페스트 파일과 사후 비교 결과를 불변 상태로 보존한다.
  4. **쓰기 권한 및 덮어쓰기 방지**: 원본 기준선 및 매니페스트 파일 자체가 실험 프로세스나 러너에 의해 쓰기/덮어써지지 않도록 파일 시스템 권한 및 디렉터리 격리를 검증한다.
  5. **과거 소급 증명 불가 명시**: 현재 작성될 매니페스트는 향후 실행의 변경을 감지하기 위한 것이며, 과거 Experiment B 실행 당시의 사전 기록이 없는 한 과거 원본의 무결성을 소급하여 확정할 수 없다.

---

## 3. 검증 단계별 실행 명세 (V0 ~ V3: 읽기 전용 정적 감사)

### V0 — 기준선 무결성 및 격리 세부 감사 (읽기 전용 4대 하위 판정 체계)
- **목적**: 기존 증거가 물리적으로 실재하고 해시가 불변인지, 실험 산출물 경로가 격리 보존되었는지를 독립적으로 확정함.
- **판정 결과 3대 범주 정의 (FAIL / BLOCKED / PASS 엄격 구분)**:
  - **`FAIL`**: 비교 대상 및 권위 있는 기준 해시가 식별되어 있고, 실제 해시 불일치, 파일 손상, 또는 원본 파일 쓰기/변경이 명확히 관측됨.
  - **`BLOCKED`**: 필수 파일 부재, 접근 권한 문제, 권위 있는 출처 불명확, 또는 입력 정보 부족으로 인해 판정 자체를 수행할 수 없음.
  - **`PASS`**: 사전에 정의된 모든 검증 조건(파일 실재, 권위 있는 기준 해시 100% 일치, 격리 구조 및 불변)을 완벽히 충족함.
- **V0 4대 세부 판정 항목 (독립 기록 체계)**:
  - **V0-A (파일 식별 및 실재 확인)**:
    - 외부 원본 및 격리 보존본 경로 상의 파일 실존 확인 (`fs.existsSync === true`).
    - P-BASE-03(`diagnostic_trace.json`)은 외부 원본이 없는 단일 보존본이므로 단일 보존본 실재 여부를 별도 확인.
    - 판정: 파일 부재 시 `BLOCKED` (임의 재생성 금지).
  - **V0-B (비트 단위 해시 검증 및 출처 신뢰성 엄격 5대 판정 체계)**:
    - 해시 일치 여부와 기준선 출처의 신뢰성을 엄격히 분리하여 아래 표의 5대 판정 규칙을 고정 적용:
      | 관측 결과 | 공식 판정 | 후속 조치 |
      | :--- | :---: | :--- |
      | **기록 해시와 파일 해시 불일치** | **`FAIL`** | 즉시 중단 및 불일치 오염 조사 |
      | **외부 원본과 격리 보존본 간 해시 불일치** | **`FAIL`** | 즉시 중단 및 원인 조사 (임의 정답 채택 금지) |
      | **해시 일치 & 독립 출처 확인** | **`PASS`** | 해시 및 출처 신뢰성 검증 완전 통과 |
      | **해시 일치 & 독립 출처 미확인** | **`PROVENANCE_UNVERIFIED`** | 기준 해시 자체의 출처 미확증 (`BLOCKED` 사유로 유지) |
      | **필요한 파일 또는 비교 자료 부재** | **`BLOCKED`** | 판정 보류 및 임의 생성 금지 |
    - **출처 신뢰성 해소 조건**: `RUSTDESK_PREFLIGHT_AUDIT.md` 자체는 동일 실험 산출물일 수 있으므로, 독립된 형상 관리 이력(Git commit tree) 또는 외부 독립 로그와의 교차 대조가 완료되지 않는 한 `PROVENANCE_UNVERIFIED` 상태를 영구 유지하며, 이를 `PROVENANCE_VERIFIED`로 자동 승격하지 않는다.
    - **Gate 1 승인 연계 규칙**: `PROVENANCE_UNVERIFIED` 상태가 유지되는 경우 완전 무결성 PASS 선언을 금지하며, 사용자가 명시적으로 '제한된 읽기 전용 감사(Limited Read-Only Audit)'를 조건부로 승인한 경우에 한하여 다음 단계 정적 조사를 진행할 수 있다.
  - **V0-C (격리 구조 및 변경 부재 확인)**:
    - 심볼릭 링크 및 외부 참조가 배제된 독립 서브트리 구조 확인.
    - 결과 기록 시 '현재 격리 구조 확인 결과'와 '과거 실행 원본 변경 여부 증거 유무'를 분리 기록.
    - 판정: 현재 격리 구조 미확인 시 `BLOCKED`, 원본 파일 쓰기/변경 탐지 시 `FAIL`.
  - **V0-D (현재 저장소 상태 기록 및 프로덕션 소스 변경 징후 확인)**:
    - 목적: 현재 저장소 상태를 기록하고 프로덕션 소스(`src/`, `ui/`)에 예기치 않은 변경 징후가 없는지 확인.
    - 판정 범위: Git 상태 검사는 코드 동결 여부의 보조 기록이며 디스크 전체의 절대적 무결성 증거가 아님.
    - 판정: 승인 전부터 존재한 기존 변경인지 식별할 수 없는 경우 `BLOCKED`로 유지.
- **허용 명령 규격 예시 (실행 승인 후 사용 가능)**:
  ```bash
  sha256sum \
    /home/dogsinatas/다운로드/rustdesk-master/synapse_data/project_state.json \
    /home/dogsinatas/.gemini/antigravity-ide/brain/4230b6e0-a74c-4938-945b-55b960e1d3df/scratch/track14_output/synapse_data/project_state.json \
    /home/dogsinatas/다운로드/rustdesk-master/synapse_report/surgery/simulation_evidence.json \
    /home/dogsinatas/.gemini/antigravity-ide/brain/4230b6e0-a74c-4938-945b-55b960e1d3df/scratch/track14_output/synapse_report/surgery/simulation_evidence.json \
    /home/dogsinatas/.gemini/antigravity-ide/brain/4230b6e0-a74c-4938-945b-55b960e1d3df/scratch/track14_output/synapse_report/surgery/diagnostic_trace.json
  git status --short
  ```
- **중단 조건**: 해시 불일치 관측 시 원본을 임의로 덮어쓰거나 선택하지 않고 차이점을 기록한 뒤 조사를 즉시 중단함.

---

### V1 — 오결합 원인에 대한 정적 코드 감사 (읽기 전용)
- **목적**: 전역 단일 `SymbolIndex` 덮어쓰기 구조 및 fallback 경로가 실제 소스 코드에 존재하는지 위치를 특정.
- **대상**: `src/core/analysis/pipeline/SymbolIndex.ts`, `ReferenceResolver.ts`, `DataPipeline.ts`.
- **입증 한계**: 코드의 자료구조와 fallback 분기를 입증하는 단계이며, 과거 실행에서 해당 분기가 실제로 오결합을 일으켰다는 런타임 인과관계 자체를 단독으로 입증하지 않음 (정적 근거로서만 취급).
- **허용 명령 규격**:
  ```bash
  rg -n "lookupSymbol|addFunction|symbol_index" src/
  rg -n "existingNodeIds|candidateCount|selectedTarget" src/
  ```
- **예상 증거**: 심볼 등록 시의 Map 자료구조, 중복 키 처리 방식, fallback 호출 분기문 코드 위치.
- **PASS 기준**: 심볼 인덱스의 등록·교체 구조 및 fallback 분기문이 코드 위치로 정적 확인됨.
- **FAIL 기준**: 실제 코드가 기존 결함 가설과 명백히 모순됨.
- **BLOCKED 기준**: 코드 추적 불가 또는 범위 미확정.
- **중단 조건**: 분석을 위해 소스 코드 수정이나 계측(console.log 등) 시도가 필요해지면 즉시 중단.

---

### V2 — 4대 MSI 관련 오결합에 대한 증거 감사 (읽기 전용)
- **목적**: 보고된 4대 간선의 호출 문맥, AST 수신 객체 타입, 선언 증거의 실재성을 독립 대조.
- **입증 한계**: 실제 소스의 호출 문맥과 선언 증거를 입증하는 단계이며, 리졸버가 해당 증거를 실제로 소비했는지의 여부는 단독으로 입증하지 않음.
- **대상 간선 및 독립적 소스 대조 항목 (4대 간선 전원 독립 증거 필수)**:
  1. `win32_window.cpp` $\rightarrow$ `FirewallRules.cpp` (`Release`):
     - 호출 문맥: `pTaskbarList->Release()` (COM 인터페이스 수신 객체 호출 문맥)
     - 선언 증거: `ITaskbarList3*` COM 인터페이스, `shobjidl.h` 인클루드 실재성
  2. `windows.cc` $\rightarrow$ `FirewallRules.cpp` (`Release`):
     - 독립 소스 대조: `windows.cc` 내의 실제 호출 문맥(COM 객체 해제 등)과 `FirewallRules.cpp` 내의 전역 함수 선언(`Release` 시그니처 및 네임스페이스)을 직접 대조하여, 양자가 소스 레벨에서 완전히 상이한 심볼임을 증명하는 물리적 소스 증거 확인.
  3. `wf_cliprdr.c` $\rightarrow$ `CustomActions.cpp` (`Sleep`):
     - 호출 문맥: `Sleep(100)` 커널 지연 호출 문맥
     - 선언 증거: `windows.h` (Win32 SDK kernel32 선언) 존재 여부 및 `CustomActions.cpp`와의 독립성
  4. `IddController.c` $\rightarrow$ `CustomActions.cpp` (`Sleep`):
     - 호출 문맥: `Sleep(...)` 호출 문맥
     - 선언 증거: Win32 SDK 전역 커널 함수 선언 실재성
- **PASS 기준**: 4대 간선 각각의 오결합 여부를 실제 소스 코드 문맥 및 선언 증거에 기반하여 독립 판정 완료.
- **FAIL 기준**: 실제 소스 코드 문맥과 기존 결함 보고 내용이 충돌.
- **BLOCKED 기준**: 원본 호출자 소스나 헤더의 부재로 문맥 확인 불가.
- **중단 조건**: 런타임 추적이 불가피한 경우 그 사실만을 기록하고 임의 실행을 중단함.

---

### V3 — 안전성 계약과 구현의 정적 대응 감사 (읽기 전용)
- **목적**: 계약 v2.5의 거부 규칙이 구현에 반영되어 있는지 및 `referenceId` 관측 경로 확인.
- **입증 한계**: 계약 조항과 구현 경로의 정적 대응을 입증하는 단계이며, 계약 조항의 존재가 곧 구현의 강제성을 증명하는 것은 아니며 미실행 경로의 실제 동작 및 전체 파이프라인의 안전성을 보증하지 않음.
- **대상**: `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md`, `UNIT_TEST_SPEC_V2.5.md`, V1에서 특정된 리졸버 소스.
- **필수 점검 항목**:
  1. `direct` 물리 경로 해석 시 실존 검증(`fs.existsSync`) 경로
  2. `excluded_by_scope` 판정 시 물리 타깃 인클루드 증거 확인 경로
  3. P2 제외 대상의 2차 fallback 전이 차단 로직 존재 여부
  4. `referenceId`가 스캐너에서 생성되어 리졸버 및 간선 생성기까지 전달되는 경로
- **PASS 기준**: 계약 조항과 실제 구현 위치의 1:1 대응 관계 및 강제 지점 특정.
- **FAIL 기준**: 구현이 계약 필수 규칙과 상충하거나 거부 경로가 누락됨.
- **BLOCKED 기준**: `referenceId` 등의 관측 지점이 코드 상에 미구현되어 추적 불가.
- **중단 조건**: 미구현 항목 발견 시 코드를 수정하지 않고 결함 레코드로만 기록.

---

## 4. 실행 승인 후에만 가능한 검증 (V4, V5: 실행 보류)

### V4 — 최소 재현 및 회귀 검증 (별도 승인 필요 · ON HOLD)
- **목적**: 승인된 격리 환경에서 4대 결함 픽스처 각각에 대해 리졸버가 안전성 계약에 따라 올바르게 개별 거부하는지 실측.
- **입증 한계**: 승인된 픽스처에서 관측된 거부 동작을 입증하는 단계이며, 공식 보고서의 전반적 개선 및 정상 간선 전체 보존은 입증하지 않음.
- **사전 조건**: V0~V3 완료 및 사용자 명시적 실행 승인.
- **엄격한 금지 사항**: 승인 없는 `src/` 수정, 전체 테스트 스위트 실행, 전체 파이프라인 구동.
- **V4 결과 증거 vs 경로 증거 분리 관측 스키마 (코드 계측 금지 원칙)**:
  결과 기록 시 아래 두 독립 증거를 분리 대조하며, 기존 구현에 경로 기록이 누락되어 확인이 불가능할 경우 코드를 수정하여 계측하지 않고 즉시 **`BLOCKED`** 처리함:
  1. **결과 증거 (Outcome Evidence)**: 리졸버 실행 결과 객체(`result.resolutionKind`, `result.fallbackReason`)의 실제 기록값.
  2. **경로 증거 (Trace Evidence)**: 해당 결과를 산출한 분기 경로 및 후속 전이 부재 기록 (예: `SYSTEM_API_GUARD` 진입 후 추가 fallback 분기 미호출 확인).
  3. **사후 추론 (Inference)**: 관측된 사유를 통해 도출한 아키텍처 해석 (보고서 참고용이며 PASS 증거로 인정 불가).
- **6대 독립 검증 파이프라인 (픽스처별 전수 통과 필수)**:
  1. **입력 증거의 실재성**: 픽스처의 AST 타입 레코드, 헤더 인클루드 증거가 실제로 존재하는가?
  2. **증거의 실제 소비 여부**: 리졸버가 해당 증거를 무시하지 않고 실제로 로직에서 소비했는가?
  3. **최종 resolutionKind 일치**: 최종 결과가 정확히 `"unresolved"`인가?
  4. **관측된 처리 경로와 거부 사유 일치**: 결과 증거와 경로 증거가 1:1로 일치하는가?
  5. **금지 간선 차단**: 금지 간선이 정확히 0건인가?
  6. **2차 전이 부재**: 제외 대상 탈락 후 다른 부적격 후보로 우회하는 2차 전이가 전혀 발생하지 않았는가?
- **4대 픽스처별 고정 기대 판정 규격**:
  1) `win32_window.cpp` COM `Release` (`TC-EXP-B-01A`):
     - 필수 `resolutionKind`: `"unresolved"`
     - 최종 고정 `fallbackReason`: `"SYSTEM_API_GUARD"` (COM vtable P1 적용)
     - 금지 간선: `win32_window.cpp` $\rightarrow$ `FirewallRules.cpp` (0건) 및 `windows.cc` (0건)
  2) `windows.cc` `Release` (`TC-EXP-B-01C`):
     - 입력 증거에 따른 조건부 고정:
       - Case A (COM 헤더/vtable 증거 관측 시): 직접 관측 최종 사유 `"SYSTEM_API_GUARD"`
       - Case B (스코프 제외 대상 탈락 후 2차 전이 차단 시): 직접 관측 최종 사유 `"FALLBACK_PRUNED_REJECT"`
       *(단순 목록 포함이 아닌, 실제 관측된 경로에 따른 1:1 결정론적 사유 매칭 필수)*
     - 금지 간선: `windows.cc` $\rightarrow$ `FirewallRules.cpp` (0건)
  3) `wf_cliprdr.c` Win32 `Sleep` (`TC-EXP-B-02`):
     - 필수 `resolutionKind`: `"unresolved"`
     - 최종 고정 `fallbackReason`: `"SYSTEM_API_GUARD"` (Windows SDK 전역 API 확인 시)
     - *(주의: 심볼 판별 불가 시 `"INSUFFICIENT_EVIDENCE"` 허용, 관측 자료 누락이나 파서 오류는 `BLOCKED`로 처리)*
     - 금지 간선: `wf_cliprdr.c` $\rightarrow$ `CustomActions.cpp` (0건)
  4) `IddController.c` Win32 `Sleep` (`TC-EXP-B-02`):
     - 필수 `resolutionKind`: `"unresolved"`
     - 최종 고정 `fallbackReason`: `"SYSTEM_API_GUARD"` (위 3번과 동일 적용)
     - 금지 간선: `IddController.c` $\rightarrow$ `CustomActions.cpp` (0건)
- **BLOCKED 기준**: 픽스처 관측 증거 누락, 직접 관측 사유 확인 불가, 또는 파서 실패 시 `BLOCKED`.
- **PASS 기준**: 4개 픽스처 모두에서 6대 검증 파이프라인을 전원 통과하고 금지 간선이 0건으로 차단됨.

---

### V5 — 전체 파이프라인 및 공식 리포트 검증 (별도 승인 필요 · ON HOLD)
- **목적**: 전체 파이프라인 구동 시 오결합 간선 4건 제거, 정상 경로·모듈 간선 488건 100% 보존, 공식 Executive Report의 시맨틱 개선 입증.
- **입증 한계**: 정의된 기준선과 공식 보고서에 대한 회귀 결과를 입증하는 단계이며, 타 프로젝트나 상황의 보편적 안전성을 입증하지 않음.
- **정상 경로 간선 488건 기준선 정의 및 실행 집합 $R$의 범위 고정**:
  - **488건 기준선 집합 $B$의 정의**: RustDesk 전체 스캔 결과 중, 동적/전역 심볼 호출(`CALL`) 간선을 제외하고 소스 레벨 물리적 인클루드/임포트(C/C++ 정적 `#include` 1:1 물리 매핑 및 Rust 명시적 `mod` 선언)로 확정된 비심볼(non-symbolic) 정상 구조 간선의 집합 ($|B|=488$).
  - **비교 대상 실행 집합 $R$의 범위 및 추출 조건**:
    실행 파이프라인 산출물(`project_state.json`)에서 기준선 $B$와 정확히 동일한 필터링 규칙(비심볼 `#include` 및 `mod` 관계 선언)을 적용하여 추출한 전체 비심볼 구조 간선 집합.
  - **기준선 간선 추출 아티팩트 소스**: `scratch/legitimate_path_edges_baseline.json` 스냅샷 및 `exp_b_baseline/repo/synapse_data/project_state.json`.
  - **사전 증명 필수 요건**: 기준선 아티팩트 내에 각 간선의 식별 키, 유형, 원본 위치, 추출 규칙, SHA-256 해시가 보존되어 있어야 하며, 디스크 실재성·해시·간선 수의 상호 일치가 V5 진입 전 사전 증명되지 않으면 V5 작업 상태는 즉시 **`BLOCKED`**로 처리함.

#### 📐 간선 재대응 프로토콜: 2단계 계층적 목적 최적화
기준선 간선 집합 $B$ ($|B|=488$)와 실행 간선 집합 $R$에 대해 다음 **2단계 계층적 목적 최적화(Two-Tier Hierarchical Optimization)**를 적용하여 일대일 매칭 $\text{Match}_{1:1} \subseteq B \times R$을 계산함:

1. **Tier 1 (기수 최대화 - Cardinality Maximization)**:
   - 후보 쌍 집합 $\mathcal{C} = \{ (b, r) \in B \times R \mid \text{4Tuple}(b) == \text{4Tuple}(r) \}$에 대해, 유효한 1:1 매칭 중 **매칭 크기(Cardinality) $|\text{Match}_{1:1}|$를 최대화**하는 매칭 집합군 $\mathcal{M}_{\max}$를 도출함.
   *(매칭 개수를 줄여 총비용을 낮추는 왜곡을 원천 배제)*
2. **Tier 2 (전역 비용 튜플 벡터 사전식 최소화 - Global Cost Minimization)**:
   - 각 후보 쌍 $(b, r)$의 개별 비용 튜플:
     $$\text{Cost}(b, r) = (|\text{line}_b - \text{line}_r|, \; |\text{col}_b - \text{col}_r|)$$
   - $\mathcal{M}_{\max}$ 내의 각 매칭 $M$에 속한 모든 간선 쌍의 비용 튜플들의 합 벡터 $\sum_{(b, r) \in M} \text{Cost}(b, r) = (\Delta \text{Line}_{\text{total}}, \; \Delta \text{Col}_{\text{total}})$를 계산하여, 사전식 최소값(줄 차이 합 우선, 열 차이 합 후순위)을 달성하는 최적 매칭 $M^*$을 선택함.
3. **복수 최적해 및 동률(Tie) 격리 규칙**:
   - 최소 비용 벡터를 달성하는 최적해 $M^*$가 유일하지 않고 2개 이상 존재하는 경우(복수 최적해 동률):
   - 임의 선택을 엄격히 금지하고, 경쟁 관계에 관여된 모든 간선 쌍을 **`InconclusiveEdges`**로 격리 분류함.
4. **UID 우선 매칭 시의 속성 변이 유효성 검증 규칙**:
   - $\text{edgeUID}(b) == \text{edgeUID}(r)$이더라도, UID에 포함되지 않은 비핵심 메타데이터 속성(`Attrs`)이 변이된 경우 곧바로 영구 변이로 확정하지 않음.
   - 해당 쌍이 Tier 1/Tier 2 최적 매칭 $M^*$ 내에서 4-튜플 및 위치 정합성을 만족하는 유효한 1:1 대응임이 확증된 경우에 한하여 $\text{MutatedPairs}$로 확정 분류함.

---

#### 🔒 작업 상태 vs 간선 분류 상태의 엄격한 분리 및 완전 분할 불변식
- **작업 상태 (Operation Status)**:
  - 작업 전체 수준에서 필수 입력 파일 부재, 파서 치명적 실패, 권한 오류 발생 시 전체 작업 상태를 **`BLOCKED`**로 선언하고 조사를 중단함 (인위적인 빈 간선 분류를 생성하지 않음).
- **개별 간선 분류 상태 (Edge-Level Partition)**:
  - 작업 상태가 수행 가능한 경우에 한하여, $B$와 $R$의 모든 간선은 아래의 상호 배타적 분할 불변식을 100% 만족해야 함:
    $$B = \pi_B(\text{PreservedPairs}) \uplus \pi_B(\text{MutatedPairs}) \uplus \text{MissingEdges} \uplus \pi_B(\text{InconclusiveEdges}) \uplus \text{BlockedEdges}_B$$
    $$R = \pi_R(\text{PreservedPairs}) \uplus \pi_R(\text{MutatedPairs}) \uplus \text{SpuriousEdges} \uplus \pi_R(\text{InconclusiveEdges}) \uplus \text{BlockedEdges}_R$$
  - **개별 간선 `BlockedEdges`의 정의**: 특정 개별 간선에 한하여 소스 텍스트 손상이나 AST 노드 결손으로 좌표 비교 자체가 불가능한 경우에만 해당 간선을 $\text{BlockedEdges}$로 집계함.
  - **상호 배타적 분류 집계 단위**:
    - $\text{PreservedPairs}$ 및 $\text{MutatedPairs}$: 매칭된 쌍 $(b, r)$ 단위로 집계.
    - $\text{MissingEdges}$: 매칭되지 않은 $B$의 간선 단위로 집계.
    - $\text{SpuriousEdges}$: 매칭되지 않은 $R$의 간선 단위로 집계.
    - $\text{InconclusiveEdges}$: 유일 해 확정이 불가한 경쟁 쌍 단위로 집계.

---

#### 🔍 중복 품질 지표의 독립 검증 체계 (Dual-Track Quality Audit)
중복 간선 지표는 간선 분할 분류와 혼합하지 않고, 그래프 자체의 구조적 건전성을 검증하는 **독립 품질 지표(Quality Invariant)**로 분리하여 검증함:

1. **모델 레벨 중복 ($\text{DuplicateEdges}$)**:
   - 결과 그래프 $R$ 내에서 동일한 `edgeUID`를 갖는 노드가 2회 이상 등록된 경우 $\equiv \emptyset$.
2. **물리적 의미적 중복 ($\text{SemanticDuplicateEdges}$)**:
   - 결과 그래프 $R$ 내에서 서로 다른 UID를 부여받았더라도, **`[source_file, raw_decl_range(start_line, start_col, end_line, end_col), target_file, edge_type, raw_directive]`**의 5대 물리 속성이 100% 일치하는 선언이 복수 파싱된 경우 $\equiv \emptyset$.
3. **분할 분류와의 연계 규칙**:
   - 중복으로 판정된 간선이 존재할 경우 해당 간선은 분할 매칭 단계에서 유효한 1:1 대응 대상에서 제외되어 $\text{InconclusiveEdges}$ 또는 $\text{SpuriousEdges}$로 귀결되며, 독립 품질 검증에서 즉시 FAIL 사유가 됨.

---

#### 📊 5대 평가 영역과 최종 PASS 연결 매트릭스
V5의 공식 통과 여부는 아래 5대 평가 영역이 모두 PASS여야 하며, 어느 하나라도 미충족 시 전체 PASS가 불가함:

| 평가 영역 | 대상 지표 및 검증 내용 | 필수 통과 조건 | 미충족 시 판정 |
| :--- | :--- | :--- | :---: |
| **영역 1: 기준선 무결성** | 파일 실재성, SHA-256 비트 일치, 격리 매니페스트 | $\text{HashMatch} \land \text{IsolationAudit} \equiv \text{PASS}$ | `BLOCKED` |
| **영역 2: 간선 보존 및 분할** | 488건 정상 간선의 유일 일대일 매칭 및 완전 분할 불변식 | $|\text{PreservedPairs}| = 488 \land \text{완전분할불변식 충족}$ | `FAIL` |
| **영역 3: 지표 회귀 방지** | A5(238.5550) 계산식 재현, 복합 엔트로피 지표 | 공식 보고서 산출 경로 및 지표 인과사슬 100% 입증 | `BLOCKED` (입증 전) |
| **영역 4: 오결합 완전 차단** | 4대 MSI 관련 오결합 및 2차 하이재킹 간선 | $\text{PollutionEdges} \equiv 0 \land \text{SpuriousEdges} \equiv \emptyset$ | `FAIL` |
| **영역 5: 시맨틱 보고서 개선** | Core/Boundary/Architecture Report 비교 | 보고서 레벨 시맨틱 개선 및 의미 있는 아키텍처 영향 입증 | `FAIL` |

#### 🏆 수학적 전수 대조 완결 PASS 판정식
$$\text{V5\_PASS} \iff \begin{cases} 
\text{OperationStatus} \equiv \text{PASS} \\
|\text{PreservedPairs}| = 488 \\
\text{MissingEdges} \equiv \emptyset \\
\text{SpuriousEdges} \equiv \emptyset \\
\text{MutatedPairs} \equiv \emptyset \\
\text{DuplicateEdges} \equiv \emptyset \\
\text{SemanticDuplicateEdges} \equiv \emptyset \\
\text{InconclusiveEdges} \equiv \emptyset \\
\text{BlockedEdges}_B \equiv \emptyset \;\land\; \text{BlockedEdges}_R \equiv \emptyset \\
\text{PollutionEdges} \equiv 0 \\
\text{EvaluationArea}[1..5] \equiv \text{PASS}
\end{cases}$$
*(위 조건 중 단 1개라도 불만족 시 V5 전체 PASS는 불가하며 FAIL 또는 BLOCKED 처리됨)*

---

## 5. 단계별 실행 거버넌스 게이트 (Execution Governance Gates)

검증은 아래의 엄격한 4대 순차 게이트를 따르며, 앞 단계의 승인 없이 다음 단계로 진입할 수 없다.

- **Gate 0 — 계획서 확정**: 본 계획서(v1.9) 검토 및 기준선 출처·비교 규칙 문서 동결 완료. (명령 실행 0건)
- **Gate 1 — V0 기준선 무결성 및 격리 승인**: [Gate 0 완료 후 별도 승인]
  - [ ] V0-A: 파일 식별 및 실재 확인 (외부 원본 및 격리 보존본 실재 대조)
  - [ ] V0-B: SHA-256 비트 단위 체크섬 및 출처 신뢰성 검증 (5대 판정 매트릭스 적용)
  - [ ] V0-C: 격리 구조 점검 및 현재/과거 격리 상태 분리 기록 (사전 매니페스트 프로토콜 확인)
  - [ ] V0-D: 현재 저장소 상태 기록 및 프로덕션 소스 변경 징후 확인
- **Gate 2 — V1~V3 정적 코드 및 계약 감사**: [Gate 1 완료 후 별도 승인]
  - [ ] V1: 오결합 원인 정적 코드 감사 (자료구조 및 fallback 분기 확인)
  - [ ] V2: 4대 간선 독립 소스 증거 감사 (호출 문맥 및 전역 함수 불일치 실재성 대조)
  - [ ] V3: 안전성 계약 조항과 구현 강제성 정적 대응 감사
- **Gate 3 — V4·V5 실행 검증 승인**: [Gate 2 완료 후 별도 승인 · ON HOLD]
  - [ ] V4: 최소 재현 및 결과/경로 분리 관측 기반 6대 거부 파이프라인 실측
  - [ ] V5: 전체 파이프라인 및 공식 리포트 시맨틱 개선 검증 (2단계 최적화 및 완전 분할 불변식 충족)

---

## 6. 결론 및 향후 절차

본 검증 계획서는 어떠한 코드 수정이나 파이프라인 실행도 포함하지 않으며, 향후 검증의 경계와 통제 조건을 선제적으로 확정하기 위해 작성되었습니다.

- **현재 거버넌스 상태 유지**:
  - Experiment B: `FAIL` 유지
  - `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md`: `PROPOSED` 유지
  - `UNIT_TEST_SPEC_V2.5.md`: `DRAFT` 유지
  - 프로덕션 코드: Strict Code Freeze 유지
  - 테스트 러너 및 파이프라인: `ON HOLD` 유지
  - Gate 0 및 Gate 1: **미승인 (검토 대기)**
- **다음 조치**: 본 계획서(v1.9)에 대한 사용자의 최종 검토 및 Gate 0(계획서 확정) 완료 여부 지시를 대기합니다. (명령 미실행)

---

## 7. Appendix: v1.9.1 Revision Specification (Append-Only Governance Update)

- **개정 버전**: v1.9.1 (Append-Only Governance Revision)
- **개정 기준 시각**: 2026-10-20T10:47:00+09:00
- **상태 관리**: 📐 `DRAFT` (계획서 보완 명세이며, 실행 승인을 의미하지 않음)
- **거버넌스 원칙**: 기존 v1.9 이력 보존, 프로덕션 코드 동결(Strict Code Freeze), 실행 전면 보류(Execution Freeze)

### 7.1 전역 매칭 4계층 순수 사전식(Lexicographical) 최적화 및 모호성 단위 처리

가중치 합산 방식($-w_{\text{uid}}$)은 가중치 설정에 따라 물리적 거리와 UID 일치 간의 왜곡을 유발하므로 전면 배제하며, 아래의 순수 사전식 계층 목적 함수로 단일화한다:

1. **Tier 1 (Max Cardinality):** 유효 후보 간선 쌍 집합에서 매칭 기수 $|M|$을 최대화한다.
2. **Tier 2 (Min Line Delta):** Tier 1 최적해들 중 총 라인 거리 $\sum |L_B - L_R|$을 최소화한다.
3. **Tier 3 (Min Column Delta):** Tier 2 최적해들 중 총 열 거리 $\sum |C_B - C_R|$을 최소화한다.

- **UID의 비결정권 및 모호성 처리 단위 ($\text{InconclusiveEdges}$)**:
  - **UID의 비결정권 (Non-Determinative Role)**: UID는 결과 출력의 일관된 정렬(Deterministic Serialization) 및 디버깅 식별 목적으로만 사용되며, 물리적 최적 매칭이 경합하는 상황에서 특정 간선 쌍을 임의로 유일한 정답으로 승자 확정하는 근거로 결코 사용될 수 없다.
  - **모호성 처리 단위 (Ambiguity Unit)**:
    - Tier 1~3 적용 후에도 복수의 서로 다른 최적 대응 쌍이 경합할 경우, 개별 간선 단위가 아니라 **"해당 경합 관계(Connected Component of Competing Matches)에 연루된 모든 기준선 간선 $e_B$와 실행 간선 $e_R$"** 전체를 단일 모호성 단위로 묶어 $\text{InconclusiveEdges}$로 분류한다.
    - 구현자가 임의의 타이브레이커로 하나의 해를 선택해 확정하는 것을 엄격히 금지하며, 모호성이 발생한 모든 경합 후보 집합은 불확정으로 처리된다.
  - **분할 불변식 집계**: 경합 집합에 관여한 기준선 간선 고유 ID 투영 집합 $I_B$와 실행 간선 고유 ID 투영 집합 $I_R$은 각각 **단 1회만 고유 카운팅**하여 중복 집계를 원천 차단한다.

### 7.2 기준선 집합 $B$와 실행 집합 $R$의 상호 배타적이고 완전한 분할 불변식

기준선 간선 집합을 $B$, 실행 간선 집합을 $R$이라 할 때, 양측의 고유 간선 ID는 상호 배타적인 서로소 집합(Disjoint Sets)으로 완전 분할되어야 한다:

$$B = P_B \uplus M_B \uplus I_B \uplus \text{Missing} \uplus \text{Blocked}_B$$
$$R = P_R \uplus M_R \uplus I_R \uplus \text{Spurious} \uplus \text{Blocked}_R$$

- $P_B, P_R$: 보존된 매칭 쌍(동일 위치/동일 속성)의 각 측 투영 고유 간선 집합.
- $M_B, M_R$: 변경된 매칭 쌍(위치/속성 변위 수용)의 각 측 투영 고유 간선 집합.
- $I_B, I_R$: 동률 및 불확실한 경합 단위에 연루된 고유 간선 ID 집합.
- $\text{Missing}$: 기준선 $B$에서 대응 간선을 찾지 못한 고유 간선 ID 집합.
- $\text{Spurious}$: 실행 서브그래프 $R_{\text{filtered}}$에서 대응 간선을 찾지 못한 고유 간선 ID 집합.
- $\text{Blocked}_B, \text{Blocked}_R$: 증거 손상 등으로 대조 불가능한 고유 간선 ID 집합.
- **예외 처리 원칙**: 입력 실패나 파서 결손 등으로 전체 비교를 수행할 수 없는 경우, 빈 집합을 날조하지 않고 `OperationStatus = BLOCKED`로 확정한다.

### 7.3 필터링된 구조 간선과 전체 그래프 오염 간선의 검증 범위 분리

서로 다른 두 집합을 혼동하지 않도록 검증 대상과 필터를 엄격히 분리한다:

1. **정상 구조 간선 보존 검증 ($488$건)**:
   - 대상: 기준선과 동일한 언어 및 경로 필터를 적용한 서브그래프 $R_{\text{filtered}}$.
   - 통과 조건: $|\text{PreservedPairs}| = 488 \land \text{Missing} \equiv \emptyset \land \text{Spurious} \equiv \emptyset$.
2. **오염 간선 제거 검증 ($4$대 MSI 오결합 및 전체 그래프)**:
   - 대상: 필터링 여부와 무관한 **전체 최종 그래프 $G_{\text{total}}$**.
   - 통과 조건: $\text{PollutionEdges} = 0$ (전체 그래프에서 MSI 대상 파일인 `FirewallRules.cpp`, `CustomActions.cpp`로 향하는 모든 유입 간선 수 = 0).

### 7.4 A5 지표 (`238.5550`)의 증거 사슬 요건 및 `BLOCKED` 상태 고정

- **증거 사슬(Evidence Chain) 요건**:
  - `A5` 지표가 유효한 규범적 불변식이 되려면 다음 4단계 사슬이 독립적으로 입증되어야 한다:
    $$\text{입력 스냅샷} \longrightarrow \text{AST 지표 추출} \longrightarrow \text{공식 계산식(수학적 정의)} \longrightarrow \text{중간값} \longrightarrow \text{최종 보고서 수치 (238.5550)}$$
- **현재 판정**:
  - 현재는 이 증거 사슬의 수학적 연결 증거가 부재하므로, `A5 = 238.5550`을 통과 필수 조건으로 강제하지 않고 **`BLOCKED`**로 동결 유지한다. 사슬이 증명되기 전까지 값의 일치 여부만으로 성공을 판정하지 않는다.

### 7.5 판정 체계 및 전체 검증 통과 조건

- **상태 범주 정의**:
  - `ALIGNED`: 명세와 테스트 요건이 필수 검증 범위에서 정확히 1:1 대응함.
  - `GAP`: 계약상 필수 요구사항이나 불변식이 테스트 명세에서 완전히 누락됨.
  - `AMBIGUOUS`: 계약 또는 테스트 명세의 해석이 복수로 갈리거나 검증 범위가 불일치함.
  - `BLOCKED`: 명세 정렬 여부와 무관하게 필수 증거, 기준선 스냅샷 또는 수학적 사슬이 결손되어 실행/판정이 차단됨.
- **전체 검증의 통과 조건**:
  - 명세 정렬이 되었다고 해서 실행 준비가 된 것이 아니며, 실행 준비가 되었다고 해서 테스트가 통과된 것이 아니다.
  - V0의 기준선 증거 공백(`BLOCKED`), Gate 2의 계약 미구현(`FAIL`), 그리고 정렬표의 미해결 항목들이 정식 승인을 통해 해소되기 전까지 전체 검증은 결코 `PASS`될 수 없다.

### 7.6 정렬표의 미해결 매핑 문제 및 검증 한계 (15개 규칙 최종 재집계 반영)

`EXPERIMENT_B_CONTRACT_TEST_ALIGNMENT.md` 감사를 통해 식별된 15개 원자 규칙의 최종 정합성 현황을 본 계획서의 공식 한계로 등록한다:

1. **명세 정합 완료 (`ALIGNED` 8건)**:
   - CR-01.1 (Win32 Interception), CR-01.2 (COM Interception), CR-02.1 (Build Target Isolation), CR-03.1 (3대 집합식), CR-03.2 (모듈 분할), CR-03.3 (배열 고유성), CR-05.1 (2차 fallback 차단), CR-05.2 (Disambiguation validationAudit 실패 사유 로깅).
2. **명세 공백 (`GAP` 5건)**:
   - CR-02.2: 직접 물리적 `#include` 예외 해석 전용 테스트 부재 (`NONE`).
   - CR-04.1: 결정론적 `referenceId` 생성 공식 검증 전용 테스트 부재 (`NONE`).
   - CR-04.2: 파이프라인 전 구간에 걸친 `referenceId` 종단간 인과 추적 전용 테스트 부재 (`NONE`).
   - CR-06.2: 전체 그래프 $G_{\text{total}}$ 대상 $\text{PollutionEdges} = 0$ 검증 전용 테스트 부재 (`NONE`). (개별 4대 호출문 픽스처만 존재)
   - CR-07.2: 아키텍처 보고서(Core Node, Entry Point) 시맨틱 랭킹 불변성 검증 테스트 부재 (`NONE`).
3. **모호성 (`AMBIGUOUS` 0건)**:
   - 계약 원문 대조를 통해 모든 모호성 항목을 `ALIGNED` 또는 `GAP`으로 명확히 분류 완료.
4. **실행 전제조건 차단 (`BLOCKED` 2건)**:
   - CR-06.1: `TC-PIPE-01`에서 488개 간선 보존을 명시하나, 원시 기준선 스냅샷 `EV-V0-04`가 `BLOCKED` 상태임.
   - CR-07.1: A5 지표 계산식과 스냅샷 간의 유도 증거 사슬 미입증.
- **최종 합계 확인**: $8 (\text{ALIGNED}) + 5 (\text{GAP}) + 0 (\text{AMBIGUOUS}) + 2 (\text{BLOCKED}) = 15$건.



