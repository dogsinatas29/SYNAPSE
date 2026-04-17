# <img src="./resources/synapse-icon.png" width="40" height="40" /> 🧠 SYNAPSE: 시각적 아키텍처 엔진 (v0.3.18)

> **"눈에 보이는 것이 곧 LLM의 논리이다"** — *AI를 위한 WYSIWYG 논리*

[![Version](https://img.shields.io/badge/version-v0.3.18-brightgreen.png)
[![Latest Release](https://img.shields.io/badge/latest-v0.3.18%20Diagnostic%20Hint-orange.png)
![Status](https://img.shields.io/badge/status-Production_Ready-brightgreen.png)
[![Language](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/Platform-VS_Code-007ACC?style=flat-square)](https://code.visualstudio.com/)

[🇰🇷 한국어 버전](README.ko.md) | [🇺🇸 영문 버전](README.md)

---

## 🔥 최신 릴리스: v0.3.18 - 문맥적 노드 인사이트 (2026-04-17)

| 기능 | 설명 | 혜택 |
|-------|---------|-----|
| **진단 힌트 엔진** | 자동화된 아키텍처 분석 | 노드 연결 패턴을 분석하여 실시간 리팩토링 힌트(R1-R5) 제공. |
| **정체 인식 툴팁** | 상세 연결 내역 분해 | 요약창에 레이어 카테고리와 함께 구체적인 파일/라이브러리명(`└ axon_core`) 표시. |
| **Zero-Unknown 원칙** | 시맨틱 노드 라벨링 | `unknown` 라벨을 제거하고 미배정 노드를 `External`, `Ghost`, `Unmapped`로 분류. |
| **툴팁 간섭 방지** | 충돌 감지 및 제어 | 노드 요약창 활성화 시 AI 추론 툴팁을 자동으로 숨겨 시각적 겹침 방지. |

---

## 🔍 아키텍처 진단 규칙 (R1-R5)

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
![Topology View](./resources/screenshots/v0.3.18/topology_view.png)

### 노드 정보 요약 (v0.3.17)
노드 위에 마우스를 올리면 구조적 지표(연결 수, IN, OUT)를 즉시 볼 수 있어 책임 범위와 의존성 클러스터를 빠르게 식별할 수 있습니다.
![Node Summary](./resources/screenshots/v0.3.17/node_summary.png)

---

## 🆕 개정 이력

| 버전 | 날짜 | 영문 설명 | 한글 설명 |
| :--- | :--- | :--- | :--- |
| **v0.3.18** | 2026-04-17 | **Diagnostic Hint Engine**: Real-time architectural analysis (R1-R5), Zero-Unknown semantic labeling, and detailed node identity list in tooltips. | **진단 힌트 엔진**: 실시간 아키텍처 분석(R1-R5), Zero-Unknown 시맨틱 라벨링 및 툴팁 내 상세 연결 노드 리스트 출력. |
| **v0.3.17** | 2026-04-14 | **Node Summary Feature**: Added interactive node summary tooltips showing unique connections and directional degrees. Optimized with O(E) pre-calculation. | **노드 요약 정보 출력**: 노드 호버 시 고유 연결 및 방향성 의존성을 보여주는 요약 툴팁 추가 및 O(E) 성능 최적화. |
| **v0.3.16** | 2026-04-14 | **Minimalist Logic View**: Introduced toggle controls for edge and badge visibility. Implemented transparent edge persistence for selected nodes and O(1) rendering skips. | **미니멀리스트 로직 뷰**: 엣지 및 배지 가시성 토글 기능 도입. 선택된 노드의 엣지 반투명 노출 및 O(1) 렌더링 스킵 구현. |

---

## 📜 라이선스 및 작성자
Licensed under the [GNU General Public License v3.0](LICENSE).  
Created with 🧠 by [dogsinatas29](https://github.com/dogsinatas29)
