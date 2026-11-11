# encoding: utf-8
# 🛡️ INV_BASELINE_AUDIT.md: 다층 시맨틱 아키텍처 불변식 기준선 감사 보고서

- **작성 기준 시각**: 2026-10-18T18:07:30+09:00
- **원칙**: READ ONLY (코드 수정 0건, 스냅샷 재실행 0건, 원본 데이터 불변)
- **감사 대상 스냅샷 지문 (SHA-256 Checksums)**:
  - `rustdesk/synapse_data/project_state.json`: `26d86f2223c7e263061bb06f15d432282fe733a6a1f3ec5a5aaa58756feb95be` (938,240 bytes)
  - `godot/synapse_data/project_state.json`: `d38923102fb4781f5e123331378a5ea57bb84430f924dfe81236203aca3e8b62` (55,990,173 bytes)
  - `rustdesk/surgery/simulation_evidence.json`: `c5cba413a969212e9796fe694069b5c4e8193f9fb157b7ba23e9c73614f0e107` (62,383 bytes)
  - `track14_output/surgery/diagnostic_trace.json`: `e6ed110dfc127a55bc4a26f937f0de7aa36cf96654ea06561f65199388f8fc47` (91,874 bytes)

---

## 1. 10대 불변식(INV-01 ~ INV-10) 기준선 감사 총괄 매트릭스

| 불변식 ID | 명칭 | 기준선 판정 | 근거 파일 및 소스 위치 | 실측 관측값 및 핵심 사유 |
| :--- | :--- | :---: | :--- | :--- |
| **INV-01** | **수집 완전성** | **부분 검증** | `godot/project_state.json`<br>`src/bootstrap/BootstrapEngine.ts:571-572` | • Godot `SConstruct`(2개), `SCsub`(수십 개) 디스크 실존하나 노드 누락.<br>• `scanExtensions` 화이트리스트에 부재하여 제외된 메커니즘 확인.<br>• 전체 파일시스템 대비 1:1 수집/제외 추적 로그는 미구비 상태. |
| **INV-02** | **역할 분류 추적성** | **FAIL 사례 확인** | `rustdesk/project_state.json`<br>`src/core/NodeBuilder.ts:determineNodeRole` | • RustDesk `build.rs` 7개, `res/msi/CustomActions/*` 25개 전원이 `NodeRole.RUNTIME`으로 오분류됨 관측.<br>• 빌드/패키징 규칙 부재로 기본값 fallback 발생. |
| **INV-03** | **연결성 보존** | **UNVERIFIED** | N/A (신규 다층 모델 도입 전 상태) | • 다층 모델 도입 전이므로 수정 전/후 $E$ 집합 보존 여부를 비교할 대상이 없음.<br>• 향후 모델 도입 시 $E_{before} = E_{after}$ 전수 대조 필수. |
| **INV-04** | **계층 의미 분리** | **FAIL 사례 확인** | `track14_output/diagnostic_trace.json`<br>`EXEC-35`, `EXEC-39` | • 패키징 디렉터리(`res/msi/CustomActions`)가 구조적 중심성에 의해 A5(초크포인트 6위)로 선정되었으나, 보고서에서 런타임 제어점과 의미적으로 분리되지 않음. |
| **INV-05** | **지표 재현성** | **UNVERIFIED** | `simulation_evidence.json` vs 보고서 | • A5 초크포인트 점수(`alphaScore: 7233.23` vs 과거 언급된 `238.56`)의 가시성 스코프 및 정규화 조건 차이가 미확정 상태.<br>• 동일 입력 조건 하의 정량 대조 미수행. |
| **INV-06** | **증거 계보** | **부분 검증** | `diagnostic_trace.json`<br>`FindingCreated` (161건)<br>`EvidenceCreated` (161건) | • 161개 Finding 전체가 1:1로 `EvidenceCreated`(`evidenceId`)와 매핑됨 확인 (0건 누락).<br>• 다만 최종 렌더링 리포트 전체 텍스트와의 역방향 100% 전수 연결은 추가 검증 필요. |
| **INV-07** | **표현 정확성** | **FAIL 위험 확인** | `ARCHITECT_REPORT.md`<br>`simulation_evidence.json` | • A5 초크포인트 및 순환 의존성 루프(#33~#48)에 패키징 클러스터가 그대로 노출되어 독자에게 런타임 결함으로 오인될 위험 확인. |
| **INV-08** | **회귀 안전성** | **UNVERIFIED** | N/A (비교 대상 수정 모델 부재) | • 소스 코드 0건 변경 상태이므로 회귀 비교 대상 모델 및 스냅샷이 존재하지 않음. |
| **INV-09** | **미확정 보존** | **부분 검증** | `rustdesk/project_state.json`<br>`libs/hbb_common/` | • 미초기화 서브모듈 `hbb_common`에 대해 소스 부재를 근거로 날조하지 않고 `unresolved` 136건 격리 유지 확인.<br>• 반면 빌드/패키징 파일은 미확정 처리되지 않고 `RUNTIME`으로 단정됨. |
| **INV-10** | **스냅샷 격리** | **부분 검증** | `surgery/simulation_evidence.json`<br>`visibleClusterIds` (7개) | • 10월 4일자 부분 가시성 스냅샷(SHA: `c5cba413...`)이 독립 파일로 보존되어 풀 스캔과 바이트 수준에서 격리됨 확인.<br>• 다만 보고서 렌더러가 기준 시각과 스코프를 완전히 분리 명시하지 않음. |

---

## 2. 4단계 라이프사이클별 정밀 관측 데이터

### A. 수집 (Ingestion) 단계
- **Godot 관측**:
  - 파일시스템 경로: `/home/dogsinatas/다운로드/godot-master/SConstruct` (실존)
  - 노드 상태: `godot/synapse_data/project_state.json` 내 노드 검색 결과 `0건` (부재).
  - 코드 원인: `BootstrapEngine.ts:571` 내 `scanExtensions`에 무확장자 파일 처리 규칙 없음.
  - 판정: **INV-01 부분 검증 / 수집 필터 원천 제외 확인**.

### B. 분류 (Classification) 단계
- **RustDesk 관측**:
  - `build.rs` (7개): `NodeRole.RUNTIME` (100%)
  - `res/msi/CustomActions/*` (25개): `NodeRole.RUNTIME` (100%)
  - 코드 원인: `NodeBuilder.ts`에 빌드/패키징 전용 역할 판별 브랜치 부재.
  - 판정: **INV-02 FAIL 사례 확인 (오분류 관측)**.

### C. 평가 (Evaluation) 단계
- **A5 Chokepoint 계산 관측**:
  - `EXEC-35` (ArchitecturalChokepointDetector):
    - `targetId: "res/msi/CustomActions"` (`targetScope: CLUSTER`)
    - `findingId: "F-1792307603461-5220"`
    - `evidenceId: "E-1792307603461-1299"` (`origin: STRUCTURAL_METRIC`)
  - `EXEC-39` (ArchitecturalChokepointDetector):
    - 동일 20개 타깃에 대해 100% 동일 순서로 재생성 확인.
  - 판정: **INV-04 FAIL 사례 확인 (구조적 중심성의 비차등 평가)**.

### D. 표현 (Presentation) 단계
- **보고서 및 시뮬레이션 증거 관측**:
  - `simulation_evidence.json`: 순환 의존성 루프(Findings #33~#48) 12건에 `AGGREGATE_folder_res_msi_CustomActions`가 핵심 브리지로 표시됨.
  - 판정: **INV-07 FAIL 위험 확인 (계층적 한계 설명 부재)**.

---

## 3. 결론 및 공식 판정 상태

1. **기준선 감사 결과**:
   - 10대 불변식 중 2개는 **FAIL 사례 확인** (INV-02, INV-04), 1개는 **FAIL 위험 확인** (INV-07).
   - 4개는 **부분 검증** (INV-01, INV-06, INV-09, INV-10).
   - 3개는 모델 수정 전이므로 **UNVERIFIED** (INV-03, INV-05, INV-08).
2. **공식 상태**:
   - **Strict Code Freeze**: 유지 (소스 코드 수정 0건).
   - **빌드 시스템 의미적 격리**: **UNVERIFIED (미완료 확정)**.
   - **차기 조치**: 임의 코드 수정을 배격하고, 위 FAIL/UNVERIFIED 항목을 해결하기 위한 격리된 테스트 픽스처 데이터셋 설계 착수.
