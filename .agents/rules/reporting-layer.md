---
trigger: glob
description: "SYNAPSE 리포트 빌더, 리포트 계약(ReportContract), 패턴 감사 및 보고서 출력 CLI 수정 시 자동 적용되는 무결성 규칙"
globs: "src/core/reporting/**, src/core/ReportExporter.ts, src/core/LogicAnalyzer.ts, src/cli/ReportVerifier.ts, src/cli/SummaryGenerator.ts"
---

# Reporting Layer & Contract Rules

## 1. Report Builder 핵심 원칙 (출판사 역할 한정)
* **증명된 증거만 렌더링:** Report Builder는 Validation Engine이 증명한 `SUPPORTED` 상태의 데이터만을 선별하여 목적에 맞게 정제 후 렌더링한다. 레거시 Rule-based 임의 추천 로직은 완전히 배제한다.
* **LLM 해석과 분석 결과의 엄격한 분리:** SYNAPSE가 산출한 그래프·패턴 분석 결과에 LLM의 추정, 해석, 보정 또는 임의의 분류를 섞지 않는다. 데이터에서 직접 확인할 수 없는 내용은 사실로 단정하지 않으며, 원인에 대한 가설은 분석 결과와 분리하여 미확인(`HYPOTHESIS`)으로 명시한다.
* **격리된 출력 경로 강제:** 정규 리포트 및 진단 덤프(`LOGIC_REPORT.md` 등)는 프로젝트 루트가 아닌 `synapse_report/` 디렉터리 내부로 격리 생성한다.
* **정밀도 및 모수 표기 동기화:** 부동소수점 정밀도 포맷팅(`toPrecision(3)` 가드)과 모수 비율(`selected / candidates`) 표기를 3대 정규 보고서(`ARCHITECT_REPORT`, `ONBOARDING_REPORT`, `SIMULATION_DEBUG`) 간 100% 바이트 단위 재현성으로 동기화한다.

---

## 2. Report Impact Verification (리포트 수정 전후 검증 의무)
Graph Metrics 변화만으로 엔진이나 리포트 품질 개선을 선언하지 않는다. 모든 아키텍처·리포트 수정은 반드시 동일 프로젝트에 대해 아래 3단계를 거쳐 검증한다:
1. **Before Report Generation** (수정 전 기준 리포트 생성)
2. **After Report Generation** (수정 후 리포트 생성)
3. **Semantic Diff Analysis** (의미적 차이 비교 분석)

* **Required Reports (4대 필수 비교 대상):**
  `Onboarding`, `Architect`, `Virtual Debug`, `Execution`
* **Validation Questions (필수 확인 항목):**
  * `Core Nodes`가 의미 있게 변했는가?
  * `Entry Points`가 의미 있게 변했는가?
  * `Boundary analysis`가 의미 있게 변했는가?
  * `Blast Radius`가 의미 있게 변했는가?
  * `Simulation results`가 의미 있게 변했는가?
* **판정 기준:** 그래프 지표가 달라졌더라도 리포트의 의미(Semantics)가 동일하면 사용자 가치 영향은 `0`으로 판단하며, 리포트 시맨틱이 의미 있게 개선되었을 때만 `COMPLETE` 및 `Architecture Impact`로 기록한다.

---

## 3. Pattern Contract Sufficiency Audit (11개 패턴 증거 계약 기준)
리포트에 패턴을 노출하거나 설명을 작성할 때는 아래 11개 패턴의 증거 충분성(Evidence Sufficiency) 한계를 절대 넘어 과장해서 단정하지 않는다.

| Pattern | Definition (아키텍처 정의) | Evidence Sufficiency (현재 증거의 정의 증명 여부) | Status | 사유 (근거) |
| :--- | :--- | :--- | :--- | :--- |
| **Root Entry Point** | 시스템 실행과 제어 흐름이 뻗어나가는 최초 런타임 출발지 | ❌ 불충분 (파일명 휴리스틱 + `fanIn=0` 만으로는 런타임 실행 여부를 증명할 수 없음) | 🔴 **E. Dynamic Gap** | "실행(Execution)"되는 최초 지점은 정적 분석이나 이름만으로는 증명할 수 없음. |
| **System Core** | 비즈니스 로직과 제어 흐름을 중앙에서 관장하는 컨트롤러 | ❌ 불충분 (`fanIn`이나 `authorityReach`는 참조 빈도일 뿐 "제어권(Control)"을 증명하지 못함) | ⚠️ **C. Source-Signal Gap** | 제어 흐름(Call)과 참조(Type)를 분리하는 AST 수준의 시그널 없이는 "Controller"임을 증명할 수 없음. |
| **Boundary Fortress** | 도메인 간 접근을 엄격히 통제/방어하는 명시적 관문 | ❌ 불충분 (클러스터 교차 트래픽만으로는 "설계된 방어선"인지 증명하지 못함) | ⚠️ **C. Source-Signal Gap** | `export/private` 캡슐화 내역이 Source 단계에서 보존되어야만 "Fortress" 증명 가능. |
| **Learning Hub** | 개발자가 시스템 구조를 학습하기 좋은 진입 관문 | ❌ 불충분 (Centrality가 높다고 "학습하기 좋다"는 보장이 없음) | 🧩 **D. Definition Gap** | "학습하기 좋다"는 정의 자체가 수학적/구조적으로 아직 Formalize되지 않았음. |
| **Arch. Chokepoint** | 트래픽이나 의존성이 필수로 통과하는 병목 지점 | ❌ 불충분 (Betweenness Centrality가 높아
