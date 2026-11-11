# encoding: utf-8
# 📋 TRACK15_VERIFICATION_SPEC.md: Track 15 검증 명세 및 실행 전 체크리스트

- **작성 기준 시각**: 2026-10-18T20:15:00+09:00
- **원칙**: READ ONLY & ZERO CODE MODIFICATION (`src/`, `ui/` 코드 변경 0건, 원본 스냅샷 불변 보존)
- **목적**: Track 17(실제 파이프라인 검증) 실행 승인 전, 입력 무결성, 경로 격리, 비교 기준, 증거 추적성 및 중단 조건을 문서로 사전에 확정하여 불필요한 재실행과 해석 논쟁을 원천 차단함.

---

## 1. 6대 완료 조건 체크리스트 (Track 15 Completion Gate)

| ID | 검증 항목 | 합격 기준 (PASS Criteria) | 현재 상태 |
| :--- | :--- | :--- | :---: |
| **G-01** | **입력 무결성** | 원본 입력 파일의 SHA-256 해시가 사전 고정되고, 실행 전/후 불변 보장 | **확정 (Locked)** |
| **G-02** | **경로 격리** | 출력 디렉터리가 원본 저장소 및 기존 `synapse_report/`와 100% 분리 | **확정 (Locked)** |
| **G-03** | **정식 파이프라인 범위** | 부분 인라인 스크립트가 아닌 정식 SYNAPSE 파이프라인 전체 실행 보장 | **명세화 완료** |
| **G-04** | **비교 기준 고정** | $\Delta V, \Delta E$, A1/A3/A5/E2 점수 및 순위, SCC 루프 전후 비교식 고정 | **명세화 완료** |
| **G-05** | **증거 추적성** | `Finding → Evidence → Metric → Node`의 4계층 역추적 체인 100% 보존 | **명세화 완료** |
| **G-06** | **중단 규칙 (Abort)** | 해시 불일치, 산출물 누락, 증거 계보 단절 시 즉시 중단 및 `UNVERIFIED` 보존 | **명세화 완료** |

---

## 2. 입력 무결성 및 격리 경로 명세 (G-01, G-02)

### A. 불변 대상 원본 입력 스냅샷 지문 (Pre-Run SHA-256)
- **RustDesk 원본 상태 파일**:
  - 경로: `/home/dogsinatas/다운로드/rustdesk-master/synapse_data/project_state.json`
  - 크기: `938,240 bytes`
  - SHA-256: `26d86f2223c7e263061bb06f15d432282fe733a6a1f3ec5a5aaa58756feb95be`
- **RustDesk 원본 증거 파일**:
  - 경로: `/home/dogsinatas/다운로드/rustdesk-master/synapse_report/surgery/simulation_evidence.json`
  - 크기: `62,383 bytes`
  - SHA-256: `c5cba413a969212e9796fe694069b5c4e8193f9fb157b7ba23e9c73614f0e107`

### B. 실행 출력 격리 경로
- **격리 디렉터리**: `/home/dogsinatas/TypeScript_project/antigravity-extension-vis/scratch/verification_output/rustdesk_eval/`
- **보장 사항**:
  - 원본 디렉터리 쓰기 방지: 원본 경로 대상 `write`, `rename`, `unlink` 일체 금지.
  - 임시 출력 경로 내 `synapse_data/` 및 `synapse_report/` 단독 생성.

---

## 3. 정식 파이프라인 실행 경로 명세 (G-03)

- **금지 패턴**: 단위 탐색 스크립트나 메모리 상 배열 필터링(`validEdges.filter()`)으로 파이프라인 결과를 대체하는 행위 전면 금지.
- **정식 파이프라인 실행 시퀀스**:
  ```text
  [BootstrapEngine / DataPipeline]
         │ (Phase 0: DATA 수집 & 파일 스캔)
         ▼
  [ReferenceResolver & GhostExpander]
         │ (참조 해석 및 resolutionKind 부여)
         ▼
  [GraphModel / SnapshotSystem]
         │ (정식 project_state.json 생성)
         ▼
  [PatternDetectors (A1, A3, A5, E2)]
         │ (DiagnosticTracer 기반 Finding & Evidence 생성)
         ▼
  [ValidationEngine & ReportGenerator]
         │ (정식 diagnostic_trace.json & simulation_evidence.json 산출)
         ▼
  [격리 출력 경로 저장 및 전후 대조]
  ```

---

## 4. Track 16 실험 분리 및 정량 비교 기준 (G-04)

두 가지 원인을 한 번에 변경하여 인과관계를 흐리는 것을 방지하기 위해 3대 실험으로 분리 설계함.

### [실험 A] 심볼 오결합(Symbol Hijack) 경로 단독 검증
- **목적**: 런타임 소스(`windows.cc`, `win32_window.cpp` 등)의 `Release()`/`Sleep()` 호출이 왜 MSI로 단일 매핑되었는지 `SymbolIndex` 후보군 전수 추적.
- **관측 지표**:
  - `SymbolIndex` 내 `Release`, `Sleep` 심볼의 전체 후보 목록 (`candidateCount`).
  - 표준 Win32/COM API에 대한 제외/섀도잉 가드 존재 여부 확인.

### [실험 B] MSI 계층 전면 제외에 따른 구조적 변동량 실측
- **목적**: `res/msi/CustomActions/*` 제외 시 실제 런타임 의존성이 보존되는지 검증.
- **관측 및 대조 지표 (사전 예상치 vs 정식 산출물 실측치 구분)**:
  - **노드 변동량**: $\Delta V = V_{pruned} - V_{orig}$
    - *사전 예상값*: $\Delta V \approx -25$ (MSI 계층 25개 파일 제외는 현재 관측된 후보 집합에 대한 사전 가정이며, 실제 파이프라인에서 제거되는 노드 수는 중복 경로, 참조 관계, 노드 생성 규칙에 따라 달라질 수 있으므로 정식 산출물에서 실측하여 확정).
  - **간선 변동량**: $\Delta E = E_{pruned} - E_{orig}$
    - 기존 스냅샷 관측값(유입 4건, 유출 16건, 내부 22건)과 실험 후 정식 산출물 간의 실제 변동량을 엄격히 분리하여 측정.
  - **유출 간선 대조**: 기존 관측된 유출 간선 16건의 대상 노드 중 런타임 핵심 노드가 존재하는지 정밀 대조.

### [실험 C] A5 초크포인트 및 핵심 지표 전후 정밀 대조
- **목적**: 패키징 클러스터 제외가 전체 랭킹 및 타 지표에 미치는 인과적 파급 효과 측정.
- **엄격한 합격 판정 순서 (순환 루프 단순 소거를 합격 목표로 삼지 않음)**:
  - *원칙*: 루프가 사라지는 것은 구조 변화의 결과일 뿐 그 자체로 개선을 의미하지 않으며, 실제 런타임 관계를 잘못 제거하여 루프가 사라질 수도 있으므로 단순 소거를 목표로 삼지 않는다.
  1. **제외 정당성**: 제거된 간선이 사전에 확정된 제외 정책(안 B)에 따라 정당하게 제외되었는가?
  2. **런타임 보존**: 보존되어야 하는 런타임 간선이 모두 보존되었는가?
  3. **인과적 설명 가능성**: SCC 및 순환 루프 변화가 간선 변화로 온전히 설명되는가?
  4. **지표 재현성**: A5 점수와 순위 변화가 동일한 입력 및 계산 조건 하에서 재현되는가?
- **비교 대상 지표**:
  - A5 초크포인트 순위 1~10위 변동 내역 (`alphaScore`, `maxWeighted`, `sumWeighted`).
  - A1 (`SYSTEM_CORE`), A3 (`HIGH_ISOLATION_BOUNDARY`), E2 (`CHANGE_AMPLIFIER`) Finding 수 및 타깃 보존 여부.

---

## 5. 증거 계보 및 역추적성 기준 (G-05)

- **추적성 합격 기준 (데이터 모델 정합성 및 고아 참조 차단)**:
  - **참조 유효성**: 모든 Finding이 유효한 Evidence를 참조해야 한다.
  - **추적 연결성 및 산출 참여성**: 모든 Evidence가 실제 산출에 사용된 정량 Metric 및 대상 Node(또는 Cluster)와 추적 가능하게 연결되어야 한다. (단순한 ID 실존 여부 확인을 넘어, 해당 Metric이 실제로 그 Finding 산출 계산에 참여·사용되었는지를 검증).
  - **다대일·일대다 허용**: 여러 Finding이 같은 노드를 가리키거나 하나의 Evidence가 여러 지표에 사용될 수 있으므로, 다대일(N:1) 및 일대다(1:N) 관계는 허용하되, 고아 참조와 역추적 불가능한 연결은 0건이어야 한다.
  - **불합격 조건**:
    - Evidence 참조가 없는 고아 Finding (Orphan Finding).
    - 실제 그래프에 실존하지 않거나 역추적 불가능한 가상 ID를 가리키는 결함 연결.
    - 지표(Metric) 산출에 참여하지 않은 단절된 Evidence 연결.
    - 위 결함이 1건이라도 발생할 경우 해당 지표 판정은 즉시 기각된다.

---

## 6. 엄격한 중단 규칙 (G-06: Hard Abort Rules)

실행 중 또는 실행 후 다음 조건 중 하나라도 발생 시, 즉시 분석을 중단하고 공식 판정을 **`UNVERIFIED`**로 보존한다.

1. **입력 해시 불일치**: 실행 전 측정한 원본 파일 SHA-256과 실행 후 해시가 단 1비트라도 불일치할 경우 (원본 훼손 감지 시 즉시 중단).
2. **산출물 누락**: 격리 출력 디렉터리에 `project_state.json` 또는 `diagnostic_trace.json`이 정상 생성되지 않은 경우.
3. **증거 계보 단절**: Finding 수와 EvidenceCreated 이벤트 수의 불일치, 또는 역추적 불가능한 가상 타깃이 발견된 경우.
4. **설명 불가능한 타 지표 급변**: 빌드/패키징 제외와 무관한 순수 런타임 클러스터 간의 유효 간선이 1건이라도 임의 소실된 경우.

---

## 7. 공식 상태 요약

- **Track 15 검증 명세 및 체크리스트**: **확정 완료 (READY FOR APPROVAL)**.
- **Track 16 실험 설계**: **분리 완료 (실험 A, B, C)**.
- **Track 17 실제 파이프라인 검증**: **승인 대기 (보류 유지)**.
- **Strict Code Freeze**: **유지 (소스 코드 변경 0건)**.
- **빌드 시스템 의미적 격리**: **`UNVERIFIED` (공식 유지)**.
