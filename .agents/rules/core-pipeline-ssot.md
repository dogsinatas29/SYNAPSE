---
trigger: glob
description: "SYNAPSE 코어 파이프라인(스캐너, 리졸버, 트랜잭션, 시뮬레이션, 추론 엔진) 수정 시 자동 적용되는 SSoT 불변 및 연산 안전 규칙"
globs: "src/bootstrap/**, src/core/DataPipeline.ts, src/core/GraphModel.ts, src/core/ReferenceResolver.ts, src/core/NodeBuilder.ts, src/core/ClusterBuilder.ts, src/core/EdgeBuilder.ts, src/core/*Scanner.ts, src/core/resolvers/**, src/core/transaction/**, src/core/simulation/**, src/core/reasoning/**, src/core/analysis/**"
---

# Core Pipeline & SSoT Invariants

## 1. KISS 원칙: `project_state.json` 원본 불변 보존 및 재생성 배제 규약
1. **적용 범위 한정:** 본 규약의 재생성 배제는 **기존 SSoT(`project_state.json`)의 손상이나 분석 실패를 복구하기 위한 자동 재생성을 금지**하는 것에 엄격히 한정한다[cite: 3, 6]. (`BootstrapEngine`에 의한 최초 생성 및 명시적으로 승인된 재수집(Re-harvesting)은 분석 중 복구 목적의 재생성과 완전히 분리된 별도 작업이다)[cite: 3, 6].
2. **기존 SSoT 복구 목적의 자동 재생성 제거:** 복잡한 크래시 롤백, 저널링, 상태 머신 복구 등 오버엔지니어링을 전면 배제한다[cite: 3, 6]. 최고의 복구는 **"복구할 필요 자체를 만들지 않는 것"**이다[cite: 3, 6].
3. **원본 영구 보존 (Immutable SSoT):** 재생성이 불가능하거나 고비용인 `project_state.json`은 디스크 상에서 절대 수정·변조하거나 복구 목적으로 자동 재생성하지 않고 **영구 불변(Immutable)**으로 보존한다[cite: 3, 6]. 원본 파일시스템 경로에 대한 인플레이스(In-place) 수정이나 원자적 덮어쓰기(Overwrite) 시도 자체를 금지한다[cite: 3, 6].
4. **원본의 복사본으로 작업 (Working Copy / Shadow Copy):** 분석, 시뮬레이션, 범위 제외, 리포트 검증은 원본 SSoT를 직접 건드리지 않고 **불변 원본의 복사본(인메모리 객체 또는 격리된 작업 복사본)**에서 수행한다[cite: 3, 6]. 실패한 복사본은 폐기하고 원본에서 다시 생성한다[cite: 3, 6].
5. **재구성 불필요 (No Reconstruction):** 원본이 1바이트도 손상되지 않으므로, 데이터 파손을 가정한 복구·재구성(Reconstruction) 메커니즘을 작성하지 않는다[cite: 3, 6].

---

## 2. Persistence Philosophy (File System First & Database Free)
* **File System First:** SYNAPSE의 Source Of Truth는 DB가 아니라 파일 시스템이다 (`Master Layer`, `Submission Snapshot`, `Harvest Report`, `Project Files` 등 모두 파일로 존재)[cite: 3, 6].
* **Database Free Principle:** v0.3.x 기준으로 외부/내장 DB(`SQLite`, `PostgreSQL`, `MySQL`, `MongoDB`, `Redis`)는 절대 도입하지 않는다[cite: 3, 6].
* **Persistence Strategy:** 모든 상태는 `.synapse/`(또는 `data/` 및 VSCode Global Storage) 내 JSON/파일(`accounts.json`, `project_metadata.json`, `project_state.json`, `synapse_history.json`, `.server_info`)로 저장한다[cite: 3, 6].
* **Graph Model & Scale:** 데이터 모델은 그래프(`Node`: Task, Layer, File, Remote Client / `Edge`: DependsOn, Owns, Modifies, Harvests)이며, 사용자 10명 이하(권장 최대 20명), 노드 `1,000 ~ 10,000+` 규모를 기준으로 설계한다 (분산 DB, 샤딩, 클러스터링은 비목표)[cite: 3, 6].

---

## 3. AST Analysis Constraints (비용 통제 및 스코프 제한)
AST 분석은 고비용 연산이므로 기본 스캐닝 메커니즘이 아닌 **타겟 정밀 조사 도구**로만 취급한다[cite: 3, 6].

* **Allowed Triggers (허용된 실행 대상):**
  1. `Top Intervention Target`[cite: 3, 6]
  2. `Largest SCC`[cite: 3, 6]
  3. `Highest Risk Hub`[cite: 3, 6]
  4. `User Selected Cluster or Node`[cite: 3, 6]
* **Prohibited Operations (절대 금지):**
  * Full-project AST traversal (전체 프로젝트 AST 순회)[cite: 3, 6]
  * Global Call Graph generation (전역 콜 그래프 생성)[cite: 3, 6]
  * Repository-wide symbol resolution / type inference (저장소 전역 심볼 해석 및 타입 추론)[cite: 3, 6]
  * 프레임 렌더링 및 레이아웃 계산 도중 AST 분석 실행[cite: 3, 6]
* **근거:** Linux Kernel, Chromium, VSCode 규모 저장소에서 전역 AST 실행 시 메모리 및 CPU 한계를 초과한다[cite: 3]. 반드시 Graph Engine이 식별한 검증된 타겟으로 스코프를 좁혀서 실행한다[cite: 3].

---

## 4. Propagation Safety Rules (전파 탐색 안전 한계)
정적 파급 효과(Blast Radius) 및 의존성 전파 연산 시 무한 확장 및 메모리 고갈을 차단한다[cite: 3].

* **Default Limits (기본 한계치):**
  * `MAX_PROPAGATION_DEPTH = 3`[cite: 3, 6]
  * `MAX_PROPAGATION_NODES = 500`[cite: 3, 6]
  * `MAX_PROPAGATION_EDGES = 2000`[cite: 3, 6]
* **Escalation Policy (상향 조건):** 아래 세 조건이 모두 충족될 때만 한계치를 상향할 수 있다[cite: 3, 6]:
  1. 사용자가 명시적으로 심층 분석(Deep Analysis)을 요청한 경우[cite: 3, 6]
  2. 분석 타겟 범위가 이미 좁혀진(Narrowed) 경우[cite: 3, 6]
  3. 메모리 예산이 검증된 경우[cite: 3, 6]
* **Fail Fast (조기 중단 및 명시적 기록):** 한계치를 초과하면 절대 조용히 계속 진행하지 않고, **즉시 탐색 중단 → 경고(Warning) 발생 → 리포트에 `truncation` 기록**을 남긴다[cite: 3, 6].

---

## 5. Execution Evidence Principle (실행 계층 증거 원칙)
* 정적 그래프만으로는 실제 런타임 실행 흐름을 100% 복원할 수 없다 (*"프로파일이 틀렸던 게 아니라, 그래프에 없는 물리량을 그래프에 있다고 가정했던 것이 틀렸다"*)[cite: 3, 6].
* 따라서 정적 토폴로지에 없는 런타임 물리량을 가정하지 않으며, 실행 경로 추적이 필요한 경우 반드시 **실행 레이어 디텍터(Execution Layer Detector)**를 통해 계측된 근거를 확보한다[cite: 3, 6].
