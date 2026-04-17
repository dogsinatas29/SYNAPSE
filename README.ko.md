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
| **Triple Expression** | **색상 · 레이어 · 우선순위** 시스템 | 고유 색상을 통한 역할 인지, 리프 노드 필터링을 통한 노이즈 제거, 별점을 통한 리플팩토링 시급성 판단. |
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

## 🔥 v0.3.16 - 미니멀리스트 로직 뷰 (2026-04-14)

| 기능 | 설명 | 혜택 |
|-------|---------|-----|
| **엣지 필터링** | 엣지/배지 가시성 토글 | 엣지와 배지를 숨겨 시각적 노이즈를 줄이면서도 논리적 연결성 유지. |
| **경로 하이라이트** | 반투명 엣지 지속성 | 엣지가 숨겨진 상태에서도 노드 선택/호버 시 0.3 투명도의 연결선 노출. |
| **O(1) 렌더링 스킵** | 성능 최적화 루프 | 숨겨진 엣지를 배열 재할당 없이 스킵하는 최적화된 WebGL / 2D Canvas 루프. |
| **배지 통합** | 통합 엣지 타입/상태 배지 | 중복된 여러 아이콘을 하나의 고밀도 정보 캡슐(`🔗 ✅`)로 통합. |

---

## 🔥 v0.3.15 - 쉘프 fzf 및 그리드 주권 (2026-04-13)

| 기능 | 설명 | 혜택 |
|-------|---------|-----|
| **문서 검색 (fzf)** | 문서 노드 대상 퍼지 검색 | `/` 단축키를 통해 수천 개의 문서 중 필요한 내용을 즉시 탐색 및 이동. |
| **그리드 주권** | 40px 격자 스냅 시스템 | 모든 노드의 위치를 40px 그리드에 동기화하여 아키텍처적 질서 유지. |

---

## 🔥 v0.3.14 - 긴급 렌더링 및 동기화 패치 (2026-04-13)

| 기능 | 설명 | 혜택 |
|-------|---------|-----|
| **고스트 정화** | 문서를 `doc_shelf`로 라우팅 | 비코드 자산들을 격리하여 "외부 고스트" 노드들을 정화 및 물리적 위치 최적화. |
| **시각 가이드** | 9개 카테고리 마커 표준화 | 노드 타입(Active, Doc, External 등)을 즉각 인지할 수 있는 표준 아이콘 체계 구축. |
| **지능형 동기화** | 확장 프로그램 인지 노드 해결 | 고스트 참조(예: `canvas-engine`)를 실제 활성 파일(`.js`)에 자동으로 연결. |

---

**SYNAPSE**는 **Google Antigravity** 및 **VS Code**를 위한 차세대 시각적 관제탑입니다. LLM(대규모 언어 모델)의 추론 논리와 물리적 코드 아키텍처 사이의 간극을 메워, 추상적인 로직을 인터랙티브한 고성능 노드-엣지 네트워크로 변환합니다.

## 🌟 다국어 지능형 엔진 (v0.2.11 신규)

SYNAPSE는 언어에 관계없이 프로젝트의 깊은 시맨틱을 이해하는 통합 스캔 엔진을 탑재하고 있습니다.

| 언어 | 고급 해결 (Resolution) | 로직 흐름 분석 | 권장 분야 |
| :--- | :---: | :---: | :--- |
| 🐍 **Python** | Deep Imports | 전체 지원 | 웹, 데이터 과학, AI |
| 🦀 **Rust** | Crate/Super/Self | `match` 및 에러 핸들링 | 시스템, 고성능 컴퓨팅 |
| 🇨 **C / C++** | 로컬 vs 시스템 헤더 | 제어 구조 분석 | 레거시, 임베디드, 성능 중심 |
| 📜 **JS / TS** | Async/Types 지원 | 전체 지원 | 웹, 확장 프로그램, 툴링 |

---

## 🚀 주요 기능 (Key Capabilities)

### 🌐 토폴로지 뷰 (Topology View / 아키텍처 맵)
프로젝트의 폴더 구조와 파일 의존성을 실시간 네트워크로 시각화합니다.

- **역할 기반 정체성 (v0.3.18)**: 모든 노드는 연결 구조에 따라 아키텍처 역할이 자동으로 부여됩니다.
  - 🟠 **Orchestrator**: 실행 흐름을 제어하고 많은 출력(Fan-out)을 가진 노드.
  - 🟢 **Controller**: 진입점 처리를 담당하는 서비스 게이트웨이 또는 API 파사드.
  - 🔵 **Hub**: 강력한 결합력을 가진 의존성 집중 노드.
  - ⚪ **Leaf**: 말단 유틸리티 기능 또는 단독 실행 모듈.
- **Triple Expression System (인지-집중-판단)**:
  - **색상 (Color)**: 역할별 고유 테두리와 글로우 색상을 통해 노드의 역할을 즉시 인지.
  - **레이어 (Layer)**: `Hide Leaf Nodes` 토글로 구조적 노이즈를 제거하고 핵심 아키텍처에 집중.
  - **우선순위 (Priority)**: 4단계 별점(`★★★☆`) 시스템을 통해 리팩토리링 시급성을 판단.
- **지능형 진단 엔진**: 수치적 근거(R1-R5)를 바탕으로 팩트 중심의 리팩토링 가이드 제공.
- **노드 다이어트**: 노이즈 파일(venv, node_modules 등)을 자동으로 필터링.
- **Ghost Node**: 연결이 끊긴 노드를 분리하여 캔버스의 순정 상태 유지. ([Ghost Node 가이드](GHOST_NODE.md))
- **규칙 엔진**: `RULES.md` 가이드에 따른 일관된 발견 및 아이콘 표준 준수.

### ➡️ 플로우 뷰 (Flow View / 로직 실행)
복잡한 실행 흐름을 직관적인 플로우차트로 투영합니다.
- **지능형 분기 탐지**: `if/else`, `loops`, `try/catch`의 고정밀 탐지.
- **매치 지원 (Rust)**: Rust의 강력한 패턴 매칭 기능을 시각화.
- **권위적 결과**: 수동 설계 결정사항과 실제 소스 코드 로직의 통합.

### 🧠 지속성 및 상태 관리
- **시맨틱 줌 (LOD)**: 수천 개의 노드를 성능 최적화된 렌더링으로 부드럽게 탐색.
- **지속성**: 전체 시각적 상태를 Git 친화적인 `project_state.json`에 저장.
- **그리드 주권**: 아키텍처적 질서를 유지하고 시각적 엔트로피를 줄이기 위해 모든 노드 위치를 40px 그리드에 정규화.

### 🔍 문서 검색 (fzf 스타일)
프로젝트의 문서 자산을 빠르게 탐색합니다.
- **즉시 검색**: 어디서든 `/`를 눌러 문서 보관함 검색 창을 엽니다.
- **퍼지 매칭**: 부분 이름이나 퍼지 문자로 검색 (예: `GHOST_NODE.md`를 위해 `gs` 입력).
- **텔레포트 및 하이라이트**: 검색 결과 선택 시 해당 노드로 뷰 이동 및 2초간 Golden Glow 하이라이트.
- **파일 직접 접근**: 검색 결과 더블 클릭 시 VS Code 편집기에서 실제 `.md` 파일 열기.

---

## 🧠 DTR (Density of Thought Reasoning) 엔진
SYNAPSE v0.2.18은 AI의 추론 깊이와 아키텍처 밀도를 정량적으로 측정하는 **DTR 엔진**을 도입했습니다. 이는 모호한 AI 확신도를 측정 가능한 엔지니어링 지표로 변환합니다.

### 🌓 DTR 메트릭 스펙트럼
- **DTR (추론 밀도)**: (0.0 ~ 1.0) 특정 노드에 얼마나 많은 추론 노력이 집중되었는지 나타냅니다. 고밀도 DTR 노드는 보라색 아우라로 빛나며 핵심 결정 지점임을 알립니다.
- **$\rho$ (밀도 로)**: 정보 압축 비율입니다. 하나의 시각적 추상화 내에 얼마나 많은 실제 코드/로직이 캡슐화되어 있는지 측정합니다.
- **Think-at-N (시뮬레이션 경로)**: 현재 노드를 실체화하기 전 LLM이 시뮬레이션한 대안 아키텍처 경로의 수입니다.
- **패닉 격리**: 특정 언어 클러스터(예: C++ 크래시)의 로직 실패가 시각 엔진 전체를 중단시키지 않고 구조화된 에러 코드로 보고되도록 보장하는 안전 프로토콜입니다.

### 🚀 결정론적 사고의 기반
DTR은 단순한 시각 효과가 아니라 **결정론적 사고(Deterministic Thinking)**의 기반입니다. 추론 밀도를 정량화함으로써, SYNAPSE는 AI 확신도가 낮은 아키텍처의 "약한 연결고리"를 식별하고 사용자에게 수동 검증(`?` 배지 흐름)을 요청합니다.

---

## 🏗️ 노드 컨벤션 (Node Conventions)
SYNAPSE는 각 컴포넌트의 유형과 추론 상태를 나타내기 위해 특정 아이콘과 색상을 사용합니다.

### 1. 📄 엔티티 타입 (정체성 아이콘)

| 아이콘 | 타입 | 의미 | 시각적 스타일 |
| :---: | :--- | :--- | :--- |
| **📄** | **활성 소스** | 물리적 소스 파일 (로직, 설정 등). | 실선 테두리, 기본색 |
| **⚡** | **원자적 로직** | 핵심 로직 또는 진입점 (`Atomic` 시그니처 포함). | 보라색 글로우 (DTR) |
| **📁** | **폴더** | 디렉토리 구조 클러스터. | 폴더 클러스터 컨테이너 |
| **☁️** | **외부 API** | 외부 라이브러리(os, fs) 또는 API 호출 의존성. | 구름 형태 UI |
| **📚** | **문서 보관함** | 마일스톤, 릴리즈 노트, 아키텍처 문서. | 기본적으로 캔버스에서 숨김 |
| **🧪** | **테스트 케이스** | 유닛 테스트 및 검증 스크립트 (`.test.ts`). | 주황색 테두리 |
| **🧩** | **컴포넌트** | 모듈형 UI 또는 논리적 컴포넌트 단위. | 청록색 테두리 |
| **⚙️** | **프로세서** | 데이터 변환 또는 연산 엔진. | 보라색-회색 테두리 |
| **🤝** | **서비스** | 공유 로직 또는 인프라 서비스 레이어. | 파란색 테두리 |
| **⛩️** | **게이트** | 보안, 인증 또는 트래픽 제어기. | 두꺼운 노란색 테두리 |
| **📋** | **데이터 레코드** | DB 스키마, JSON 모델 또는 순수 데이터 정의. | 두꺼운 테두리, 어두운 배경 |
| **👻** | **고스트 소스** | 참조되었으나 물리적 파일이 없는 내부 소스. | 점선 테두리 |

### 2. 🎨 노드 상태 및 글로우

| 상태 | 시각적 힌트 | 색상 | 의미 |
| :--- | :---: | :---: | :--- |
| **Active** | ![실선 테두리](./resources/node_styles/hint_solid_border.png) | ![히스토리](./resources/node_styles/node_active.png) | 검증되어 현재 코드베이스에서 활성화된 상태. |
| **High DTR** | ![보라색 글로우](./resources/node_styles/hint_purple_glow.png) | ![DTR](./resources/node_styles/node_high_dtr.png) | 높은 추론 밀도; 핵심 로직 지점. |
| **Ghost** | ![점선 테두리](./resources/node_styles/hint_dashed_border.png) | ![고스트](./resources/node_styles/node_ghost.png) | 제안된 아키텍처 노드 (아직 실체화되지 않음). |
| **Deleted** | ![회색 처리](./resources/node_styles/hint_grayed_out.png) | ![삭제](./resources/node_styles/node_deleted.png) | 안전하게 주석 처리되거나 폐기된 노드. |
| **Warning** | ![빨간색 펄스](./resources/node_styles/hint_red_pulse.png) | ![경고](./resources/node_styles/node_warning.png) | 로직 에러, 순환 의존성 또는 데드엔드 탐지. |
| **Necrosis** | 💀 | ![괴사](./resources/node_styles/node_warning.png) | 치명적 로직 실패; 빌드 파손 또는 심각한 물리적 결함. |
| **Tombstone** | 🪦 | ![묘비](./resources/node_styles/node_warning.png) | 복구 불가능한 결정론적 실패; 삭제 권장. |

---

## 🔗 엣지 및 선 규격 (Edge Conventions)

| 엣지 타입 | 색상 | 스타일 및 두께 | 의미 |
| :--- | :---: | :---: | :--- |
| **의존성** | ![베이지](./resources/edge_styles/color_beige.png) | ![실선 2px](./resources/edge_styles/style_solid_2px.png) | 표준 모듈 의존성 또는 임포트. |
| **데이터 흐름** | ![파랑](./resources/edge_styles/color_blue.png) | ![실선 3px](./resources/edge_styles/style_solid_3px.png) | 대량의 데이터 전송 또는 페이로드 이동. |
| **이벤트** | ![주황](./resources/edge_styles/color_orange.png) | ![실선 2px](./resources/edge_styles/style_solid_2px.png) | 이벤트 트리거 또는 비동기 콜백. |
| **조건부** | ![분홍](./resources/edge_styles/color_pink.png) | ![실선 1px](./resources/edge_styles/style_solid_1px.png) | if/else 또는 match와 같은 조건부 분기. |
| **기원 (Origin)**| ![갈색](./resources/edge_styles/color_brown.png) | ![실선 1.5px](./resources/edge_styles/style_solid_1.5px.png) | AI 로직 추적을 위한 프롬프트 기원 링크. |
| **API 호출** | ![청록](./resources/edge_styles/color_aqua.png) | ![점선 2px](./resources/edge_styles/style_dashed_2px.png) | 외부 API 또는 서비스 간 네트워크 호출. |
| **DB 쿼리** | ![자주](./resources/edge_styles/color_magenta.png) | ![실선 3px](./resources/edge_styles/style_solid_3px.png) | 데이터베이스 쿼리, 뮤테이션 또는 트랜잭션. |
| **루프 / 백** | ![주황](./resources/edge_styles/color_orange.png) | ![점선 2px](./resources/edge_styles/style_dotted_2px.png) | 루프백(`while`/`for`) 또는 역방향 로직 흐름. |

---

## 📸 시각적 개요 (Visual Overview)

### 프로젝트 토폴로지 (Project Topology)
LLM 추론 논리와 실제 소스 파일 간의 물리적 연결을 시각화합니다.
![Topology View](resources/screenshots/v0.3.18/topology_view.png)

### 노드 정보 요약 (Node Information Output)
노드 위에 마우스를 올리면 구조적 지표(연결 수, IN, OUT)를 즉시 볼 수 있습니다.
![Node Summary](resources/screenshots/v0.3.17/node_summary.png)

### 미니멀리스트 로직 뷰 (Minimalist Logic View)
엣지와 배지의 가시성을 조절하여 시각적 혼잡을 줄이면서 논리적 연결성을 유지합니다.
![Minimalist View](./resources/screenshots/v0.3.16/minimalist_view.png)

---

## 💾 시스템 요구 사항
**폰트 스택**: 🔗, 🛢️, 📡, 📊 등 현대적 이모지 아이콘의 올바른 렌더링을 위해 **Noto Color Emoji**와 같은 이모지 폰트 설치가 권장됩니다.

---

## 🆕 개정 이력 (Revision History)

| 버전 | 날짜 | 영문 설명 | 한글 설명 |
| :--- | :--- | :--- | :--- |
| **v0.3.18** | 2026-04-17 | **Diagnostic Hint Engine**: Real-time architectural analysis (R1-R5), Zero-Unknown semantic labeling, and detailed node identity list in tooltips. | **Triple Expression System**: 역할별 색상 매핑, 리프 노드 숨기기 토글, 우선순위 별점(★★★☆) UI를 통해 아키텍처 판단력 강화. |
| **v0.3.17** | 2026-04-14 | **Node Summary Feature**: Added interactive node summary tooltips showing unique connections and directional degrees. Optimized with O(E) pre-calculation. | **노드 요약 정보 출력**: 노드 호버 시 고유 연결 및 방향성 의존성을 보여주는 요약 툴팁 추가 및 O(E) 성능 최적화. |
| **v0.3.16** | 2026-04-14 | **Minimalist Logic View**: Introduced toggle controls for edge and badge visibility. Implemented transparent edge persistence for selected nodes and O(1) rendering skips. | **미니멀리스트 로직 뷰**: 엣지 및 배지 가시성 토글 기능 도입. 선택된 노드의 엣지 반투명 노출 및 O(1) 렌더링 스킵 구현. |

---

## 📜 라이선스 및 작성자
Licensed under the [GNU General Public License v3.0](LICENSE).  
Created with 🧠 by [dogsinatas29](https://github.com/dogsinatas29)
