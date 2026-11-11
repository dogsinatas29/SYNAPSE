# encoding: utf-8
# 🧪 SEMANTIC_LAYER_REGRESSION_FIXTURES.md: 다층 시맨틱 아키텍처 회귀 테스트 픽스처 설계 명세서

- **작성 기준 시각**: 2026-10-18T18:09:00+09:00
- **원칙**: READ ONLY & ZERO CODE MODIFICATION (`src/`, `ui/` 코드 수정 0건 유지)
- **목적**: `INV_BASELINE_AUDIT.md`에서 관측된 결함(수집 누락, 역할 오분류, A5 구조/의미 혼동)을 원본 데이터 훼손 없이 독립적으로 반복 재현하고 검증할 수 있는 테스트 픽스처 데이터셋 및 불변식 판정 조건 정의.

---

## 1. 픽스처 설계 기본 원칙

1. **원본 데이터 불변성**:
   - 원본 `project_state.json`, `simulation_evidence.json`, `diagnostic_trace.json`은 읽기 전용으로 영구 보존하며 테스트 입력으로 직접 변형하지 않는다.
2. **합성 및 복제 격리**:
   - 모든 픽스처는 격리된 테스트 디렉터리(`scratch/fixtures/semantic_layers/` 또는 전용 테스트 픽스처 디렉터리)에 독립된 최소 단위 파일/그래프로 구성한다.
3. **기준선(Baseline)과 회귀(Regression)의 엄격한 분리**:
   - **현재 기준선 테스트**: 현재 구현(동결 코드)이 실제로 산출하는 결함 관측값(수집 누락, `RUNTIME` 오분류 등)을 기록하여 회귀 기준선으로 삼는다.
   - **향후 회귀 테스트**: 신규 다층 모델 도입 시 해당 결함이 교정되고 10대 불변식을 만족하는지 판정한다.
4. **단계별 독립 판정**:
   - 수집(Ingestion), 분류(Classification), 평가(Evaluation), 표현(Presentation)의 4단계를 독립적으로 검사하며, 한 단계의 통과가 전체 파이프라인의 통과를 의미하지 않는다.
5. **실제 프로젝트 검증과의 경계 명시**:
   - 소규모 픽스처 통과는 "로직의 단위 정합성"만을 입증하며, "실제 대규모 프로젝트(Godot, RustDesk) 파이프라인 통과"는 별도의 실측 게이트로 분리 관리한다.

---

## 2. 3대 핵심 회귀 테스트 픽스처 상세 명세

### FIXTURE 01: 수집 단계 (Ingestion) — Godot SCons 사례 픽스처

- **식별자**: `FIX-01-INGESTION-SCONS`
- **검증 목표 불변식**: `INV-01` (수집 완전성), `INV-09` (미확정 보존)
- **격리 데이터 구성**:
  ```text
  scratch/fixtures/semantic_layers/fix01_scons/
  ├── SConstruct                   (확장자 없는 빌드 진입점)
  ├── platform/
  │   └── linuxbsd/
  │       └── SCsub                (확장자 없는 서브 빌드 파일)
  ├── src/
  │   ├── main.cpp                 (일반 C++ 런타임 소스)
  │   └── utils.h                  (일반 C++ 헤더)
  └── misc/
      └── scripts/
          └── make_headers.py      (도구 스크립트)
  ```
- **현재 구현 기준선 관측값 (Current Baseline)**:
  - 수집 노드: `src/main.cpp`, `src/utils.h`, `misc/scripts/make_headers.py` (3개).
  - 제외 노드: `SConstruct`, `platform/linuxbsd/SCsub` (2개 누락, 제외 사유 미기록).
- **향후 회귀 테스트 기대 합격 조건 (Target Regression Pass Criteria)**:
  - **수집 정책 선택지 분리 명시 (Policy Alternatives)**:
    - *정책 A (수집 및 빌드 역할 부여)*: `SConstruct`, `SCsub`가 노드로 정상 수집되고 `BUILD` 역할로 태깅됨.
    - *정책 B (명시적 제외 및 메타데이터 추적)*: 화이트리스트 외 파일로 제외되더라도, 암묵적 소실이 아닌 명시적 제외 사유(`EXCLUDED_BY_RULE: NO_EXTENSION_SCONS`)가 1:1로 메타데이터에 기록되어 추적 가능함.
  - 기존 일반 소스(`main.cpp`, `utils.h`, `make_headers.py`)의 수집 결과가 불필요하게 변경되지 않을 것 (0 diff).
- **실패 판정 조건 (FAIL Criteria)**:
  - 확장자가 없다는 이유로 아무런 로그/메타데이터 없이 암묵적으로 파일이 증발하는 경우.

---

### FIXTURE 02: 분류 단계 (Classification) — RustDesk 빌드·패키징 사례 픽스처

- **식별자**: `FIX-02-CLASSIFICATION-BUILD-PKG`
- **검증 목표 불변식**: `INV-02` (역할 분류 추적성), `INV-03` (연결성 보존), `INV-09` (미확정 보존)
- **격리 데이터 구성**:
  ```text
  scratch/fixtures/semantic_layers/fix02_build_pkg/
  ├── Cargo.toml                   (매니페스트)
  ├── build.rs                     (빌드 스크립트)
  ├── src/
  │   ├── main.rs                  (런타임 엔트리)
  │   └── lib.rs                   (런타임 라이브러리)
  ├── res/
  │   └── msi/
  │       └── CustomActions/
  │           ├── CustomAction.cpp (패키징 C++ 소스)
  │           └── pch.h            (패키징 헤더)
  └── tests/
      └── integration_test.rs      (테스트 파일)
  ```
- **현재 구현 기준선 관측값 (Current Baseline)**:
  - `build.rs`: `role = NodeRole.RUNTIME` (오분류 관측).
  - `CustomAction.cpp`: `role = NodeRole.RUNTIME` (오분류 관측).
  - `tests/integration_test.rs`: `role = NodeRole.TEST` (정상 분류).
- **향후 회귀 테스트 기대 합격 조건 (Target Regression Pass Criteria)**:
  - `build.rs`에 명시적인 `BUILD` 역할(또는 근거 불충분 시 `UNVERIFIED`)이 부여될 것.
  - `res/msi/CustomActions/*`에 `PACKAGING` 역할이 부여될 것.
  - 역할 근거가 부재할 경우 강제로 `RUNTIME`으로 확정하지 않고 `UNVERIFIED`로 보존할 것.
  - `main.rs -> lib.rs`, `main.rs -> build.rs`(존재 시), `CustomAction.cpp -> pch.h` 간의 물리적/구조적 간선이 계층 분류 변경 후에도 100% 보존될 것 ($E_{before} = E_{after}$).
- **실패 판정 조건 (FAIL Criteria)**:
  - 빌드/패키징 파일이 여전히 근거 없이 `RUNTIME`으로 단정되거나, 역할을 부여하는 과정에서 유효한 간선이 임의 삭제되는 경우.

---

### FIXTURE 03: 평가 및 표현 단계 (Evaluation & Presentation) — A5 초크포인트 사례 픽스처

- **식별자**: `FIX-03-EVAL-PRESENTATION-CHOKEPOINT`
- **검증 목표 불변식**: `INV-04` (계층 의미 분리), `INV-05` (지표 재현성), `INV-06` (증거 계보), `INV-07` (표현 정확성)
- **결정론적 합성 그래프 입력 명세 (Deterministic Graph Spec)**:
  - **방향성**: 유향 그래프 (Directed Graph, `from -> to`)
  - **중복 간선 처리**: 단일 방향 동일 쌍 중복 불가 (Set 기반 고유 간선)
  - **정확한 노드 목록 (13개, 실제 파일 경로 형식 필수)**:
    - `core_runtime` (5개): `src/core/main.rs`, `src/core/server.rs`, `src/core/session.rs`, `src/core/router.rs`, `src/core/state.rs`
    - `pkg_msi` (5개): `res/msi/CustomActions/entry.cpp`, `res/msi/CustomActions/install.cpp`, `res/msi/CustomActions/config.cpp`, `res/msi/CustomActions/bridge.cpp`, `res/msi/CustomActions/helper.cpp`
    - `tool_scripts` (3개): `tools/builder.py`, `tools/generator.py`, `tools/linter.py`
  - **정확한 간선 목록 (30개 고정)**:
    - *Runtime 내부 루프 (5개)*:
      `src/core/main.rs -> src/core/server.rs`, `src/core/server.rs -> src/core/session.rs`, `src/core/session.rs -> src/core/router.rs`, `src/core/router.rs -> src/core/state.rs`, `src/core/state.rs -> src/core/main.rs`
    - *Packaging 내부 루프 (5개)*:
      `res/msi/CustomActions/entry.cpp -> res/msi/CustomActions/install.cpp`, `res/msi/CustomActions/install.cpp -> res/msi/CustomActions/config.cpp`, `res/msi/CustomActions/config.cpp -> res/msi/CustomActions/bridge.cpp`, `res/msi/CustomActions/bridge.cpp -> res/msi/CustomActions/helper.cpp`, `res/msi/CustomActions/helper.cpp -> res/msi/CustomActions/entry.cpp`
    - *Tooling 내부 체인 (2개)*:
      `tools/builder.py -> tools/generator.py`, `tools/generator.py -> tools/linter.py`
    - *Cross-Layer 브리지 간선 (18개: Runtime -> Packaging Bridge -> Tooling)*:
      - `src/core/main.rs -> res/msi/CustomActions/bridge.cpp`
      - `src/core/server.rs -> res/msi/CustomActions/bridge.cpp`
      - `src/core/session.rs -> res/msi/CustomActions/bridge.cpp`
      - `src/core/router.rs -> res/msi/CustomActions/bridge.cpp`
      - `src/core/state.rs -> res/msi/CustomActions/bridge.cpp`
      - `res/msi/CustomActions/bridge.cpp -> tools/builder.py`
      - `res/msi/CustomActions/bridge.cpp -> tools/generator.py`
      - `res/msi/CustomActions/bridge.cpp -> tools/linter.py`
      - `res/msi/CustomActions/entry.cpp -> src/core/server.rs`
      - `res/msi/CustomActions/install.cpp -> src/core/session.rs`
      - `res/msi/CustomActions/config.cpp -> src/core/router.rs`
      - `res/msi/CustomActions/helper.cpp -> src/core/state.rs`
      - `tools/builder.py -> src/core/main.rs`
      - `tools/generator.py -> src/core/server.rs`
      - `tools/linter.py -> src/core/session.rs`
      - `src/core/main.rs -> res/msi/CustomActions/entry.cpp`
      - `src/core/server.rs -> res/msi/CustomActions/install.cpp`
      - `src/core/session.rs -> res/msi/CustomActions/config.cpp`
  - **중심성 및 정규화 공식 (ArchitecturalChokepointDetector 기준)**:
    - **방향성 처리**: 유향 최단 경로 탐색(BFS 기반 `outAdj`, `pred` 추적). 간선의 방향을 엄격히 준수.
    - **정규화 분모**: 엔진의 `BetweennessProvider`는 비정규화(Raw) Brandes 누적값을 사용 ($BC(v) = \sum_{s \neq v \neq t} \frac{\sigma_{st}(v)}{\sigma_{st}}$, 정규화 분모 $(N-1)(N-2)$ 미적용).
    - **카테고리 가중치 ($Weight$)**:
      - `TEST`, `GENERATED`, `COPY`: $0.0$
      - `UTILITY` (`/utils/`, `/helpers/` 등): $0.5$
      - `RUNTIME` (일반 파일): $1.0$
      - 노드 최종 점수: $Score_{node}(v) = BC(v) \times Weight(v)$
    - **클러스터 점수 공식 ($\alpha = 0.15$)**:
      - $Score_{cluster} = \max(Score_{node}) + \alpha \times \left( \sum Score_{node} - \max(Score_{node}) \right)$
      - $\alpha$는 클러스터 내 1위 노드를 제외한 나머지 멤버 노드들의 가중 Betweenness 기여도 총합에 적용되는 감쇠 계수임.
  - **결정론적 기대 점수 및 허용 오차 (Exact Expected Scores, Tolerance $\pm 0.0001$)**:
    - **노드별 Raw Betweenness ($BC$) 및 최종 가중 점수**:
      - `res/msi/CustomActions/bridge.cpp`: $BC = 67.8333$, $W = 1.0$, $Score_{node} = 67.8333$
      - `src/core/session.rs`: $BC = 29.5000$, $W = 1.0$, $Score_{node} = 29.5000$
      - `src/core/server.rs`: $BC = 26.8333$, $W = 1.0$, $Score_{node} = 26.8333$
      - `res/msi/CustomActions/helper.cpp`: $BC = 13.8333$, $W = 1.0$, $Score_{node} = 13.8333$
      - `src/core/main.rs`: $BC = 12.5833$, $W = 1.0$, $Score_{node} = 12.5833$
      - `tools/generator.py`: $BC = 11.4167$, $W = 1.0$, $Score_{node} = 11.4167$
      - `tools/linter.py`: $BC = 9.7500$, $W = 1.0$, $Score_{node} = 9.7500$
      - `res/msi/CustomActions/entry.cpp`: $BC = 9.5833$, $W = 1.0$, $Score_{node} = 9.5833$
      - `src/core/state.rs`: $BC = 9.5000$, $W = 1.0$, $Score_{node} = 9.5000$
      - `src/core/router.rs`: $BC = 7.9167$, $W = 1.0$, $Score_{node} = 7.9167$
      - `res/msi/CustomActions/install.cpp`: $BC = 7.3333$, $W = 1.0$, $Score_{node} = 7.3333$
      - `tools/builder.py`: $BC = 6.0000$, $W = 1.0$, $Score_{node} = 6.0000$
      - `res/msi/CustomActions/config.cpp`: $BC = 5.9167$, $W = 1.0$, $Score_{node} = 5.9167$
    - **클러스터별 순위 및 결정론적 점수 ($Score_{cluster}$)**:
      - **1위**: `res/msi/CustomActions` ($\max = 67.8333, \sum = 104.5000$) $\rightarrow$ **$Score_{cluster} = 73.3333$**
      - **2위**: `src/core` ($\max = 29.5000, \sum = 86.3333$) $\rightarrow$ **$Score_{cluster} = 38.0250$**
      - **3위**: `tools` ($\max = 11.4167, \sum = 27.1667$) $\rightarrow$ **$Score_{cluster} = 13.7792$**
- **현재 구현 기준선 관측값 (Current Baseline)**:
  - `res/msi/CustomActions` 클러스터가 높은 $Score_{cluster} (73.3333)$를 획득하여 `ArchitecturalChokepointDetector`에서 1위 초크포인트(`CONTROL_BRIDGE`) finding으로 등록됨.
  - 보고서 및 시뮬레이션 증거에서 `res/msi/CustomActions`가 런타임 시스템 핵심 브리지와 동일한 수준으로 표현됨.
- **향후 회귀 테스트 기대 합격 조건 (Target Regression Pass Criteria)**:
  - **계산 정확성**: `res/msi/CustomActions`의 구조적 중심성 점수가 $73.3333 \pm 0.0001$로 결정론적으로 재현될 것 (INV-05).

  - **의미 분리**: 점수는 구조적 위상 메트릭으로 온전히 유지되되, Finding 메타데이터에 `targetLayer: "PACKAGING"` 속성이 명시될 것 (INV-04).
  - **표현 한계 명시**: 보고서 렌더러가 해당 Finding을 설명할 때 "패키징 배포 계층의 높은 결합도"로 설명하고, "런타임 핵심 제어점"으로 오인되지 않도록 계층적 해석 한계를 명시할 것 (INV-07).
  - **증거 계보 보존**: Finding $\rightarrow$ Evidence $\rightarrow$ Metric $\rightarrow$ 합성 노드 간 추적 ID가 100% 무결성을 유지할 것 (INV-06).
- **실패 판정 조건 (FAIL Criteria)**:
  - 구조적 중심성 계산 자체를 왜곡/조작하거나, 패키징 계층의 결과를 여전히 런타임 결함으로 표현하는 경우.


---

## 3. 회귀 픽스처 검증 매트릭스 및 관리 체계

| 픽스처 ID | 검증 단계 | 입력 형태 | 검증 대상 불변식 | 기준선 관측 상태 | 목표 합격 상태 |
| :--- | :---: | :--- | :--- | :---: | :---: |
| **FIX-01** | 수집 (Ingestion) | 소규모 디렉터리 트리 | INV-01, INV-09 | SConstruct 누락 | 수집 또는 제외 규칙 추적 |
| **FIX-02** | 분류 (Classification) | 다국어/빌드 트리 | INV-02, INV-03, INV-09 | RUNTIME 오분류 | 역할 추적 및 간선 보존 |
| **FIX-03** | 평가·표현 (Eval/Pres) | 격리 합성 그래프 JSON | INV-04, 05, 06, 07 | 런타임 제어점 오인 | 위상 계산 보존 + 계층 의미 분리 |

---

## 4. 공식 상태 및 향후 진행 절차

- **Strict Code Freeze**: 유지 (`src/`, `ui/` 코드 수정 0건).
- **산출물 상태**:
  - `mile_stone/v0.3.34.74.md`: 동기화 완료
  - `mile_stone/v0.3.34.74_log.md`: 동기화 완료
  - `release_note/v0.3.34.74_release_notes.md`: 동기화 완료
  - `mile_stone/INV_BASELINE_AUDIT.md`: 기준선 감사 완료
  - `mile_stone/SEMANTIC_LAYER_REGRESSION_FIXTURES.md`: 회귀 픽스처 설계 완료
- **빌드 시스템 의미적 격리**: **`UNVERIFIED` (미완료 확정 유지)**.
- **다음 단계**:
  본 픽스처 명세가 승인되면, 소스 코드 수정 없이 `scratch/fixtures/semantic_layers/` 하위에 픽스처 데이터 파일(FIXTURE 01, 02, 03)을 순수 정적 데이터로 준비하고, 현재 기준선 상태를 기록하는 단독 검증 러너(읽기 전용)를 구성합니다.
