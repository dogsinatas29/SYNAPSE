---
name: edit-report
description: SYNAPSE 정규 리포트 빌더, 어댑터, 계약(ReportContract) 정밀 수정 및 Before/After Semantic Diff 검증 워크플로우
---

# /edit-report — 리포트 레이어 정밀 수정 워크플로우

## 1. 목적 및 적용 범위
본 스킬은 `src/core/reporting/` 하위 빌더 및 어댑터(`FindingReportAdapter.ts`, `ReportBundleGenerator.ts`, `ReportContract.ts`, `ArchitectReportBuilder.ts`, `OnboardingReportBuilder.ts`, `BoundaryAnalysisReportBuilder.ts`)를 수정할 때 **리포트의 결정론적 재현성과 증거 계약(Report Contract) 무결성을 100% 보장**하기 위한 표준 공정이다[cite: 3, 6].

---

## 2. 수정 전 필수 준비 (Pre-Edit Gate)
1. **SSoT Working Copy 격리:**
   * 원본 `project_state.json`을 절대 직접 수정하거나 덮어쓰지 않는다[cite: 3, 6].
   * 반드시 불변 원본의 복사본(Working Copy)을 입력으로 사용하여 기준선(Before) 리포트를 `synapse_report/before/`(또는 격리된 임시 경로)에 먼저 생성한다[cite: 3, 6].
2. **수정 대상 및 범위 확정:**
   * 정규 계약 리포트(`ARCHITECT_REPORT`, `ONBOARDING_REPORT`, `SIMULATION_DEBUG`, `EXECUTION`)인지, 진단용 덤프(`BoundaryAnalysisReportBuilder.ts`의 `REJECTED_CANDIDATE`)인지 구분하여 작업 계획서를 먼저 승인받는다[cite: 3, 6].
   * 레거시 Rule-based 임의 추천 로직이나 LLM의 주관적 해석·보정 텍스트를 리포트 출력물에 절대 삽입하지 않는다[cite: 3, 6].

---

## 3. 구현 시 핵심 체크포인트 (Implementation Invariants)
* **증명된 증거 한정 (`SUPPORTED` Only):** Report Builder는 Validation Engine이 증명한 `SUPPORTED` 상태의 데이터만 렌더링한다[cite: 3, 6].
* **수치 정밀도 및 모수 동기화:**
  * 부동소수점 지표는 `toPrecision(3)` 포맷팅 가드를 준수한다[cite: 3, 6].
  * 모수 비율 표기(`selected / candidates`, 예: `15 selected / 144 candidates`)가 3대 정규 보고서(`ARCHITECT_REPORT`, `ONBOARDING_REPORT`, `SIMULATION_DEBUG`) 전체에서 불일치 없이 동일하게 렌더링되는지 확인한다[cite: 3, 6].
* **패턴 증거 한계 준수 (`ReportContract.ts`):**
  * `Dynamic Gap`(Root Entry Point, Cascade Failure Point), `Source-Signal Gap`(System Core, Boundary Fortress), `Definition Gap`(Learning Hub, Arch. Chokepoint, Peripheral Component)에 해당하는 패턴을 마치 런타임·제어권이 100% 증명된 것처럼 단정하는 문구를 작성하지 않는다[cite: 3, 6].
  * `A1 controlScore` 등 지표에는 `ReportContract.ts`에 정의된 사실적 해석 가이드(Interpretation Guide)만 부착한다[cite: 3, 6].

---

## 4. 수정 후 필수 검증 (Post-Edit Semantic Diff)
코드 수정 후 컴파일만 확인하고 "수정 완료"를 선언하지 않는다[cite: 3, 6]. 반드시 동일 `project_state.json` 복사본으로 **After Report**를 생성한 뒤 아래 5대 항목의 **Semantic Diff**를 제출한다[cite: 3, 6]:

1. **Core Nodes (`A1`) 변화:** 테스트 컴포넌트(`testNodeRatio >= 0.8`) 배제, P90 절삭, 결정론적 2차 정렬 및 수치 포맷이 의도대로 반영되었는가?[cite: 3, 6]
2. **Entry Points (`O2`) 변화:** `NodeRole.TEST` 필터링 후 순수 제품 진입점만 일관되게 출력되는가?[cite: 3, 6]
3. **Boundary Analysis 변화:** 경계 및 취약 지점(`Boundary Candidate`, `Weak Boundary`) 산출물이 모수 표기와 일치하는가?[cite: 3, 6]
4. **Blast Radius (`E2`) 변화:** 변경 증폭기 및 전파 한계(`truncation` 발생 시 명시 여부)가 정확히 기록되었는가?[cite: 3, 6]
5. **Determinism (바이트 단위 재현성):** 동일 입력으로 리포트 생성을 2회 연속 실행했을 때 산출물 파일의 해시(SHA-256)가 100% 일치하는가?[cite: 3, 6]

---

## 5. 완료 판정 기준
* Before / After Semantic Diff와 2회 연속 실행 바이트 단위 동일성 검증이 모두 `PASS`인 경우에만 작업을 완료(`COMPLETE`)로 선언한다[cite: 3, 6].
