---
name: synapse-validation
description: "SYNAPSE 아키텍처 분석 엔진의 버그 원인(Root Cause) 확정, 파이프라인 차등 검증, 산출물 감사 및 실험실(Lab) 시그널 평가를 위한 엄격 검증 프로토콜"
---

# /synapse-validation — SYNAPSE 검증 및 증거 프로토콜

코드 리뷰, `grep`, 로그 분석만으로 Root Cause를 확정하지 않는다. 모든 원인 규명과 수정 완료 선언은 반드시 **SYNAPSE Pipeline Differential Validation (Level 3+)**을 통과해야 한다.

---

## 1. Core Principle: Rule 0 — No Assumption
다음 항목들은 모두 참고자료일 뿐 **증거가 아니다**:
* `Code Inspection` / `grep` / `regex search` / `file search` / `string compare` / `mock data` / `manual reasoning`

최종 판정은 반드시 아래 실제 파이프라인을 통과한 런타임 결과로 수행한다:
`BootstrapEngine → DataPipeline → GraphModel → Snapshot`

* **"코드를 수정했다" ≠ "엔진이 수정되었다"**
* **"로그가 그럴듯하다" ≠ "그래프가 올바르다"**
* **"추론상 맞다" ≠ "파이프라인으로 증명되었다"**

### 1.1 검증 기준의 사전 고정 및 범위 엄수 (Mandatory)
* **실행 전 기대 결과 정의:** 테스트 실행 전 기대 결과, 불변식, 비교 대상 및 합격 기준을 사전에 명확히 정의한다.
* **사후 합격 기준 변경 금지:** 실행 결과를 확인한 뒤 합격 기준이나 판정 임계치를 임의로 변경하지 않는다.
* **검증 범위를 넘는 일반화 금지:** 특정 프로젝트·언어·실행 환경·입력에서 확인한 결과를 전체 시스템의 보편적 사실로 확장하지 않는다.

---

## 2. Evidence Levels & Fact/Hypothesis/Proven 라벨링

### 2.1 4단계 증거 등급 (Evidence Levels)
* **Level 1 — Code Evidence:** 실제 코드 위치 (예: `ReferenceResolver.ts:133`, `StateManager.ts:77`) → 목적: 문제가 존재하는가? → 판정: **가능성 (`HYPOTHESIS`)**
* **Level 2 — Runtime Evidence:** 실제 파이프라인 실행 로그 (`NODE_COUNT`, `EDGE_COUNT`, `GHOST_COUNT`, `CLUSTER_COUNT`) → 목적: 문제가 실제 발생하는가? → 판정: **강한 증거**
* **Level 3 — Graph Evidence:** 실제 Graph State (`Node`, `Edge`, `Hub`, `Ghost`, `Authority`) → 목적: 그래프가 실제 어떻게 왜곡되었는가? → 판정: **사실 (`FACT`)**
* **Level 4 — Semantic Evidence:** 실제 사례 샘플 (`Source File`, `Import`, `Original Target`, `Resolved Target`) → 목적: 왜 이런 결과가 나왔는가? → 판정: **최종 확정 (`PROVEN`)**

### 2.2 보고서 필수 표기 형식 (`FACT` / `HYPOTHESIS` / `PROVEN`)
* **`HYPOTHESIS`:** 추론, 코드 리뷰, `grep` 결과, 부분 로그만 존재하는 상태
* **`FACT`:** `Code Evidence` + `Runtime Evidence` + `Graph Evidence`를 모두 충족한 상태
* **`PROVEN`:** `Semantic Validation`(실제 사례 샘플 대조)까지 완료된 상태

### 2.3 Extraordinary Claim Rule
대규모 수치 개선/발생 주장(예: 18,316 divergence 해결, 425 node 복구, 2,043 edge hijack, 96% fallback, 10,000 ghost node 생성 등)은 반드시 **Code Evidence + Runtime Evidence + Graph Evidence + Before/After Metrics**를 모두 제출해야 하며, 하나라도 누락 시 가설(`HYPOTHESIS`)로 취급한다.

### 2.4 `SUPPORTED` 증거 범위의 한계
* **`SUPPORTED` ≠ 보편적 진실:** `SUPPORTED` 판정은 해당 분석 결과가 보편적 진실임을 의미하지 않으며, 오직 아래 세 요건이 충족되었음을 뜻한다:
  1. **증거 계통(Evidence Chain) 존재**
  2. **재현(Replication) 완료**
  3. **데이터셋 범위(Dataset Scope) 명시**

---

## 3. Validation Pipeline (5단계 순차 검증 — 단계 생략 금지)

1. **Step 1 — Unit Validation (개별 함수 검증):**
   * 대상: `normalizePath()`, `resolveImport()`, `scanImports()` 등 (단위 테스트에 한해 모의 데이터 허용, 실제 파이프라인 검증 대체 불가)
   * 필수 확인: `Input` / `Output` / `Expected` / `Actual`
2. **Step 2 — Pipeline Validation (전체 파이프라인 생존 및 Before/After 비교):**
   * 실제 파이프라인 데이터(`project_state.json` 복사본)를 투입하여 `NODE_COUNT`, `EDGE_COUNT`, `CLUSTER_COUNT`, `ROOT_CLUSTER_COUNT`, `GHOST_COUNT`의 Before / After 수치를 비교한다.
3. **Step 3 — Structural Validation (그래프 건강성 및 분포 측정):**
   * **Graph Health:** `Ghost Ratio`, `Fallback Ratio`, `Unresolved Import Ratio`, `Duplicate Node Ratio`, `Collision Count`
   * **Distribution:** `Top Hub`, `Top Authority`, `Top Ghost`, `Top Cluster`
4. **Step 4 — Semantic Validation (가장 중요 — 실제 사례 샘플 대조):**
   * **금지된 검증:** `event.ts InDegree=2043 → 허브`처럼 단일 수치만으로 결론 도출 금지
   * **허용된 검증:** 반드시 `Source`, `Import`, `Original Target`, `Resolved Target` 실제 샘플 제시
     *(예: Source: `chatDebugFileLoggerService.ts` / Import: `vs/base/common/event` / Resolved: `extensions/copilot/.../event.ts`)*
5. **Step 5 — Conclusion (최종 판정 및 증거 기록):**
   * 검증에 사용한 입력 데이터, 생성 경로, 실행 조건, 기준 스냅샷, 비교 결과 및 테스트 로그를 재현 가능하게 기록한다.
   * 결과 상태는 `PASS`, `FAIL`, `UNVERIFIED`로 엄격히 구분하며 `UNVERIFIED`는 `PASS`로 간주하지 않는다. 실패·불일치 발견 시 숨기거나 임의 수정하지 않고 원인과 영향 범위를 조사한다.

---

## 4. Mandatory Sanity Checks (파이프라인 종료 후 자동 실행)
파이프라인 실행 종료 후 아래 5가지 임계치를 반드시 검사한다:
* **Check 1:** `Fallback Ratio > 20%` → **ERROR**
* **Check 2:** `Ghost Nodes > Real Nodes` → **ERROR**
* **Check 3:** `Duplicate Node Count > 0` → **ERROR**
* **Check 4:** `Top Hub InDegree > 전체 Edge의 10%` → **WARNING** (샘플 출력 필수)
* **Check 5:** `Unresolved Import Ratio > 10%` → **WARNING**

---

## 5. 세부 검증 규칙 (Verification Rules)

### 5.1 Pipeline Contract Verification (5단계 계층 추적)
어떤 계층의 버그를 주장할 때는 반드시 동일 샘플로 아래 5단계를 추적한다 (하나라도 생략되면 `HYPOTHESIS` 유지):
`1. Raw Input → 2. Scanner Output → 3. Resolver Input → 4. Resolver Output → 5. Final Graph State`

### 5.2 Root Cause Verification (원인 확정 3대 조건)
원인으로 의심되는 모듈을 수정하기 전 반드시 아래 세 조건을 충족해야 `ROOT CAUSE`로 승격한다:
1. **Reproduction 가능** (재현 가능성)
2. **Failure Mechanism 설명 가능** (실패 메커니즘 규명)
3. **Alternative Cause 배제 가능** (대안 원인 배제)

### 5.3 Authority Verification (상위권 진위 검증)
Top Authority 또는 Top Hub 순위 변화만으로 성공 판정을 내리지 않는다:
1. Top Authority 노드 선정
2. 연결된 Edge 랜덤 100개 추출
3. 실제 `Import`/`Reference` 존재 여부 전수 확인
4. True Positive 비율 계산 (`>=95%`: **PROVEN**, `80~95%`: **LIKELY**, `<80%`: **INVALID**)

### 5.4 Representative Sampling (대표성 과장 금지)
* Top N 샘플만으로 전체 시스템의 원인을 단정하지 않는다.
* **금지:** `Top100 중 98% → 전체 98%` / `Top10 중 100% → 시스템 전체 100%`
* **허용:** `Top100 중 98% → Top100 기준 98%` (전체 비율 주장 시 전수조사 또는 통계적 샘플링 필수)

### 5.5 Ranking Correctness (순위 적절성 검증)
`Edge Accuracy ≠ Ranking Correctness`. 상위권(Top N)에 위치하더라도 아래 4단계를 모두 통과하기 전까지 `"Ranking 정상화"`라는 표현 사용을 엄격히 금지한다 (4단계 미검증 시 `"Authority Edge Accuracy 확보 (Ranking은 추가 검증 필요)"`로만 명시):
1. Edge 존재 여부 → 2. Edge 정확성 → 3. Metric 계산 정확성 → 4. Ranking 순서 적절성 (왜 A가 B보다 상위에 있는가?)

### 5.6 구조 및 메타데이터 전수 비교
구조 보존 검증 시 노드·엣지 개수만 비교하지 않고, 식별자, 출발점/도착점, 엣지 유형, 관련 메타데이터 및 `resolutionKind`를 전수 비교하며 비교 범위와 제외 항목을 명시한다.

---

## 6. Architectural Ecology Laboratory (아키텍처 생태계 실험실)
v0.3.34.13에서 확립된 실험실 프레임워크를 영구적인 커뮤니티 품질 평가 표준으로 사용한다.
* **"실험체(Signal)보다 실험실(Laboratory)을 먼저 만들고 신뢰한다"**는 과학적 철학을 유지한다.
* 새로운 시그널(`Function Call`, `Struct Ownership`, `Lock Dependency` 등)을 도입할 때는 반드시 실험실 프레임워크를 통과하여:
  1. **9대 물리 법칙 지표:** `Purity`, `Entropy`, `Stability`, `Retention`, `Intrusion`, `Erosion`, `Lineage`, `Dominance`, `Cohesion`
  2. **객관적 상태 판독기:** `Strengthened`, `Isolated`, `Polluted`, `Dissolved`, `Fragmented`
  를 통해 기여도와 오염도를 정량적으로 측정하고 수학적으로 증명해야 한다.

---

## 7. Project Independence Rule (범용성 검증)
특정 프로젝트에서 성공했다고 일반화하지 않는다 (`특정 프로젝트 성공 ≠ 범용 엔진 성공`). 보편적 아키텍처 규칙으로 승격하려면 반드시 아래 8대 검증 데이터셋에서 횡단 프로젝트 재현(Cross-Project Replication)을 거쳐야 한다:
* `Linux Kernel`, `VSCode`, `AntennaPod`, `Godot`, `PostgreSQL`, `Kubernetes`, `RustDesk`, `nowinandroid`
