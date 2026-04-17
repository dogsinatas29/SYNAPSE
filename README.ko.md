# <img src="./resources/synapse-icon.png" width="40" height="40" /> 🧠 SYNAPSE: 시각적 아키텍처 엔진 (v0.3.18)

> **"눈에 보이는 것이 곧 LLM의 논리이다"** — *AI를 위한 WYSIWYG 논리*

[![Version](https://img.shields.io/badge/version-v0.3.18-brightgreen.png)
[![Latest Release](https://img.shields.io/badge/latest-v0.3.18%20Triple%20Expression-orange.png)
![Status](https://img.shields.io/badge/status-Production_Ready-brightgreen.png)
[![Language](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/Platform-VS_Code-007ACC?style=flat-square)](https://code.visualstudio.com/)

[🇰🇷 한국어 버전](README.ko.md) | [🇺🇸 영문 버전](README.md)

---

## 🔥 최신 릴리스: v0.3.18 - Triple Expression & 노드 역할 체계 (2026-04-17)

| 기능 | 설명 | 혜택 |
|-------|---------|-----|
| **Triple Expression** | **색상 · 레이어 · 우선순위** 시스템 | 고유 색상을 통한 역할 인지, 리프 노드 필터링을 통한 노이즈 제거, 별점을 통한 리팩토링 시급성 판단. |
| **노드 역할 체계** | 아키텍처적 정체성 분류 | 노드의 정체성을 **Orchestrator, Controller, Hub, Leaf**로 엄격히 분류(단일 역할 원칙). |
| **정체 인식 툴팁** | 근거 중심의 인사이트 | 별점(`★★★☆`)과 함께 레이어별 상세 연결 노드명을 출력하여 판단의 근거 제공. |
| **Zero-Unknown 원칙** | 시맨틱 노드 라벨링 | `unknown` 라벨을 제거하고 미배정 노드를 `External`, `Ghost`, `Unmapped`로 분류. |

---

## 🔍 노드 역할 체계 (Node Role Taxonomy)

SYNAPSE v0.3.18은 모든 노드를 연결 프로필에 따라 특정 아키텍처 역할로 분류합니다:

| 역할 (Role) | 식별 색상 | 의미 | 식별 기준 | 리팩토링 시급성 |
|:---:|:---:|:---|:---|:---:|
| **Orchestrator** | 🟠 주황 | 중앙 제어 노드 (팬아웃) | 출력 비율 ≥ 80% & 연결 수 ≥ 10 | 높음 |
| **Controller** | 🟢 초록 | 진입점 / API 파사드 | 입력 비율 ≥ 80% & 연결 수 ≥ 10 | 보통 |
| **Hub** | 🔵 파랑 | 고연결 중심점 | 총 연결 수 ≥ 20 | **매우 높음** |
| **Leaf Node** | ⚪ 회색 | 유틸리티 / 말단 기능 | 총 연결 수 ≤ 2 | 낮음 |

### 🛠️ Triple Expression System (인지-집중-판단)
- **색상 (Color)**: 테두리 및 글로우 색상을 통해 노드의 역할을 즉시 인지.
- **레이어 (Layer)**: `Hide Leaf Nodes` 토글로 구조적 노이즈를 제거하고 핵심 아키텍처에 집중.
- **우선순위 (Priority)**: 별점(`★`) 시스템을 통해 개선이 가장 시급한 핵심 노드를 정량적으로 선별.

---

## 🔍 아키텍처 진단 규칙 (R1-R5 정밀화)

SYNAPSE v0.3.18은 프로젝트의 아키텍처 건강 상태를 모니터링하는 규칙 기반 엔진을 도입했습니다. 노드(연결 수 5개 이상)에 마우스를 올리면 다음 진단이 수행됩니다:

| ID | 규칙명 | 조건 | 아키텍처적 의미 |
|:---:|:---|:---|:---|
| **R1** | **다중 도메인** | 고유 그룹 ≥ 3 | **관심사 분리(SoC) 위배.** 너무 많은 도메인에 관여하는 'God Object' 징후. |
| **R2** | **강결합** | 최대 그룹 비율 ≥ 0.7 | **높은 결합도.** 특정 레이어에 과하게 종속되어 격리나 재사용이 어려움. |
| **R3** | **출력 책임 과다** | Out / Total ≥ 0.7 | **오케스트레이터 과부하.** 노드가 너무 많은 외부 책임을 제어 중임. |
| **R4** | **입력 집중(병목)** | In / Total ≥ 0.7 | **시스템 핫스팟.** 핵심 의존 지점으로, 변경 시 사이드 이펙트 전파 범위가 넓음. |
| **R5** | **슈퍼 노드** | 총 연결 수 ≥ 30 | **복잡도 임계점.** 인지 범위를 초과한 과도한 복잡도 구역. |

---

## 🔥 v0.3.17 - 노드 요약 기능 (2026-04-14)

| 기능 | 설명 | 혜택 |
|-------|---------|-----|
| **노드 요약** | 대화형 연결 지표 | 노드 호버 시 고유 연결 노드 수, IN 차수, OUT 차수를 4줄 요약으로 표시. |
| **성능 맵** | O(E) 사전 계산 통계 | 캐싱된 `nodeStatsMap`을 사용하여 밀집된 그래프에서도 즉각적인 피드백 제공. |

---

## 🚀 시작하기
초 단위로 시각적 아키텍처 여정을 시작하세요.

1. **확장 프로그램 설치**: Antigravity/VS Code에 `synapse-visual-architecture-v0.3.18.vsix`를 설치합니다.
2. **DNA 주입**: 프로젝트 루트에 `GEMINI.md` 또는 `Project_Spec.md` 파일을 생성하거나 배치합니다.
3. **부트스트랩 단계**: 사이드바 또는 커맨드 팔레트(`Ctrl+Shift+P` -> `SYNAPSE: Open Canvas`)에서 **SYNAPSE Canvas**를 엽니다.
4. **첫 시각화**: 
    - 엔진이 폴더를 스캔하고 **제안된 노드**를 표시합니다.
    - 팝업에서 **[Confirm]**을 클릭하여 노드를 실체화합니다.

---

## 프로젝트 개요

### 프로젝트 토폴로지 (Topology)
LLM 추론 논리와 실제 소스 파일 간의 물리적 연결을 시각화합니다.
![Topology View](resources/screenshots/v0.3.18/topology_view.png)

### 노드 정보 요약 (v0.3.17)
노드 위에 마우스를 올리면 구조적 지표(연결 수, IN, OUT)를 즉시 볼 수 있어 책임 범위와 의존성 클러스터를 빠르게 식별할 수 있습니다.
![Node Summary](resources/screenshots/v0.3.17/node_summary.png)

---

## 🆕 개정 이력

| 버전 | 날짜 | 영문 설명 | 한글 설명 |
| :--- | :--- | :--- | :--- |
| **v0.3.18** | 2026-04-17 | **Triple Expression System**: Integrated Role-based colors, Leaf node filtering, and Priority Star ratings (★★★☆) for enhanced architectural judgment. | **Triple Expression System**: 역할별 색상 매핑, 리프 노드 숨기기 토글, 우선순위 별점(★★★☆) UI를 통해 아키텍처 판단력 강화. |
| **v0.3.17** | 2026-04-14 | **Node Summary Feature**: Added interactive node summary tooltips showing unique connections and directional degrees. Optimized with O(E) pre-calculation. | **노드 요약 정보 출력**: 노드 호버 시 고유 연결 및 방향성 의존성을 보여주는 요약 툴팁 추가 및 O(E) 성능 최적화. |
| **v0.3.16** | 2026-04-14 | **Minimalist Logic View**: Introduced toggle controls for edge and badge visibility. Implemented transparent edge persistence for selected nodes and O(1) rendering skips. | **미니멀리스트 로직 뷰**: 엣지 및 배지 가시성 토글 기능 도입. 선택된 노드의 엣지 반투명 노출 및 O(1) 렌더링 스킵 구현. |

---

## 📜 라이선스 및 작성자
Licensed under the [GNU General Public License v3.0](LICENSE).  
Created with 🧠 by [dogsinatas29](https://github.com/dogsinatas29)
