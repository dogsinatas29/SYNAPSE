# <img src="./resources/synapse-icon.png" width="40" height="40" /> 🧠 SYNAPSE: 시각적 아키텍처 엔진 (v0.3.14)

> **"눈에 보이는 것이 LLM의 논리다"** — *AI를 위한 WYSIWYG 논리*

[![Version](https://img.shields.io/badge/version-v0.3.14-brightgreen.png)
[![Latest Release](https://img.shields.io/badge/latest-v0.3.14%20Emergency%20Patch-orange.png)
![Status](https://img.shields.io/badge/status-Production_Ready-brightgreen.png)
[![Language](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/Platform-VS_Code-007ACC?style=flat-square)](https://code.visualstudio.com/)

[🇺🇸 English Version](README.md) | [🇰🇷 Korean Version](README.ko.md)

---

## 🔥 최신 릴리즈: v0.3.14 - 긴급 렌더링 및 동기화 패치 (2026-04-13)

### ✅ 안정성 및 복구
**v0.3.14**는 UI 블랙아웃 및 백그라운드 동기화 실패를 유발하던 치명적인 회귀 버그를 수정했습니다.

| 기능 | 설명 | 혜택 |
|-------|---------|-----|
| **Ghost Purification** | 문서를 `doc_shelf`로 자동 라우팅 | 비코드 자산을 격리하여 "External Ghosts" 클러스터 정화. |
| **Visual Guide** | 9개 카테고리 마커 규격화 | 노드 타입(Active, Doc, External 등)의 즉각적인 시각적 식별. |
| **Intelligent Sync** | 확장자 인식 노드 해결 | `canvas-engine` 등 확장자가 생략된 참조를 실제 파일로 자동 연결. |
| **UI Recovery** | `renderEdge` 내 `cpX` SyntaxError 수정 | 메인 렌더링 루프 복원; "빈 캔버스" 현상 제거. |
| **Purification** | 레거시 컨텍스트 볼트 제거 | `.synapse_contexts` 및 불필요한 로깅 로직을 삭제하여 데이터 위생 강화. |
| **Sync Hardening** | 클러스터 불변 상태 업데이트 | 셀프 힐링 중 Frozen된 시스템 객체 수정 시 발생하는 `TypeError` 방지. |

---

## 🔥 v0.3.13 - 키네틱 안정성 (2026-04-12)

**v0.3.13**은 오염 방지 로직과 동적 레이아웃 거동에 집중했습니다.

| 기능 | 설명 | 혜택 |
|-------|---------|-----|
| **Auto-Purge Pipeline** | 강화된 `node_modules` 제외 규칙 | 부적절한 스캔으로 인한 노드 폭주(4,500개 이상) 자동 정화. |
| **Grid Overlap Resolver**| O(N) 반발 로직 | 밀집 구역(126개 이상)에서 노드를 동적으로 밀어내 가시성 유지. |
| **Legacy Badges** | 'B' & 'D' 시그니처 마커 복구 | "Broken" 및 "Dependency" 엣지 마커로 고전적 아키텍처 명확성 복원. |
| **TDZ Protection** | 참조 순서 최적화 | 고주파 엣지 렌더링 중 Temporal Dead Zone 에러 제거. |

---

## 🔥 v0.3.12 - Zen 주권 및 시그니처 권한 (2026-04-12)

### ✅ 아키텍처 혁신
**v0.3.12**는 버퍼리스 결정론적 분류 엔진인 **Zen 주권 아키텍처**를 도입했습니다:

| 기능 | 설명 | 혜택 |
|-------|---------|-----|
| **Zen 주권** | 버퍼리스 분류 엔진 | 휴리스틱 머지 충돌 제거; 단일 패스 결정론적 진실성 보장. |
| **시그니처 권한** | `# [SYNAPSE]` 마커 강제 | 물리적 코드 시그니처만이 절대적인 노드 주권을 부여합니다. |
| **문서 보관함** | 불변 `doc_shelf` 영속성 | 시스템 클러스터에 아키텍처 문서(GEMINI.md 등)를 자동으로 보존합니다. |
| **권위적 이동** | 버퍼 우선 위치 확인 | 디스크 스냅샷보다 사용자 세션의 이동을 우선시합니다 (0,0 리셋 해결). |
| **엄격한 기반 로직**| 폴더 전용 AI 도메인 | 시그니처가 없는 파일은 폴더로 엄격히 격리하여 레이아웃 "하이재킹" 방지. |
| **UI 폴리싱** | 미니멀리즘 강화 | 가시성 패널 정리 및 불필요한 버전 태그 제거. |

---

## 🔥 v0.3.10 - 하드 락 프로토콜 및 클릭 복원력 (이전 버전)

**v0.3.10**은 수동 UI 설계와 물리적 파일 원자성 사이의 간극을 메웁니다:

| 기능 | 설명 | 혜택 |
|-------|---------|-----|
| **Hard Lock Protocol** | 원자적 `fs.writeFile` + `fs.stat` 검증 | UI가 'Solid' 상태가 되기 전 물리적 파일의 존재를 보장합니다. |
| **Click Resilience** | 지능형 라벨 우선 폴백 (`test.py`) | 시스템 ID를 가진 수동 노드에 대한 클릭 상호작용 실패를 수정했습니다. |

---

**SYNAPSE**는 **Google Antigravity** 및 **VS Code**를 위한 차세대 시각적 관제탑입니다. LLM의 추론과 물리적 코드 아키텍처 사이의 간극을 메워, 추상적인 논리를 고성능의 노드-엣지 네트워크로 변환합니다.

## 🌟 다국어 지능형 스캔 (v0.2.11 신규)

SYNAPSE는 언어에 상관없이 프로젝트의 깊은 의미를 이해하는 통합 스캔 엔진을 탑재하고 있습니다.

| 언어 | 고급 해석 지원 | 로직 흐름 분석 | 용도 |
| :--- | :---: | :---: | :--- |
| 🐍 **Python** | 깊은 임포트 탐색 | 완전 지원 | 웹, 데이터 과학, AI |
| 🦀 **Rust** | Crate/Super/Self | `match` 및 에러 처리 | 시스템, 고성능 애플리케이션 |
| 🇨 **C / C++** | 로컬 vs 시스템 헤더 | 제어 구조 분석 | 레거시, 임베디드, 성능 최적화 |
| 📜 **JS / TS** | Async/Types 지원 | 완전 지원 | 웹, 확장 프로그램, 툴링 |

---

## 🚀 주요 기능

### 🌐 토폴로지 뷰 (아키텍처 맵)
프로젝트의 폴더 구조와 파일 의존성을 실시간 네트워크로 시각화합니다.
- **Node Diet**: 불필요한 노이즈(venv, node_modules, 빌드 결과물)를 자동으로 필터링합니다.
- **Ghost Node Storage**: 연결되지 않은 컴포넌트를 격리하여 작업 공간을 청결하게 유지합니다. ([Ghost Node 가이드 보기](GHOST_NODE.md))
- **Rule Engine**: `RULES.md` 가이드에 따라 일관된 탐색 및 아이콘 표준을 유지합니다.

### ➡️ 플로우 뷰 (로직 실행 흐름)
복잡한 실행 로직을 직관적인 순서도로 투영합니다.
- **지능형 분기**: `if/else`, `loops`, `try/catch` 등의 고정밀 감지.
- **Match 지원 (Rust)**: Rust의 강력한 패턴 매칭을 기본적으로 시각화합니다.
- **결정론적 결과**: 수동 설계 결정과 실제 소스 코드 로직을 통합합니다.

### 🧠 영속성 및 상태
- **시맨틱 줌 (LOD)**: 수천 개의 노드를 성능 최적화된 렌더링으로 부드럽게 탐색합니다.
- **영속성**: 전체 시각적 상태를 Git 친화적인 `project_state.json`으로 저장합니다.

---

## 🧠 DTR (Density of Thought Reasoning) 엔진
SYNAPSE v0.2.18은 AI 추론 깊이와 아키텍처 밀도를 정량적으로 측정하는 **DTR 엔진**을 도입했습니다. 이는 모호한 AI 확신도를 측정 가능한 엔지니어링 지표로 변환합니다.

### 🌓 DTR 지표 스펙트럼
- **DTR (추론 밀도)**: (0.0 ~ 1.0) 특정 노드에 얼마나 많은 추론 노력이 집중되었는지를 나타냅니다. 고밀도 DTR 노드는 보라색 아우라로 빛나며 중요한 결정 지점임을 나타냅니다.
- **$\rho$ (밀도 로)**: 정보 압축률입니다. 하나의 시각적 추상화 안에 얼마나 많은 실제 코드/논리가 함축되어 있는지를 측정합니다.
- **Think-at-N (시뮬레이션 경로)**: 현재 노드를 생성하기 전 LLM에 의해 시뮬레이션된 대체 아키텍처 경로의 수입니다.
- **Panic Isolation**: 특정 언어 클러스터(예: C++ 크래시)의 논리 실패가 시각적 엔진 전체를 중단시키지 않고 구조화된 에러 코드로 보고되도록 보장하는 안전 프로토콜입니다.

### 🚀 결정론적 사고의 기초
DTR은 단순한 시각 효과가 아니라 **결정론적 사고**의 기초입니다. 추론 밀도를 측정함으로써 SYNAPSE는 AI 확신도가 낮은 아키텍처의 "약한 고리"를 식별하고 사용자에게 수동 검증(`?` 배지 흐름)을 요청합니다.

---

## 🏗️ 노드 규격 (Node Conventions)
SYNAPSE는 컴포넌트의 유형과 추론 상태를 나타내기 위해 특정 아이콘과 색상을 사용합니다.

### 1. 📄 엔티티 유형 (Identity Icons)
노드의 물리적 성격이나 아키텍처적 역할을 정의합니다.

| 아이콘 | 타입 | 의미 | 시각적 특징 |
| :---: | :--- | :--- | :--- |
| **📄** | **Active Source** | 워크스페이스 내에 존재하는 실제 소스 파일(Logic, Config 등)입니다. | 실선 테두리, 기본 색상 |
| **⚡** | **Atomic Logic** | 핵심 로직이나 진입점임을 의미합니다 (`Atomic` 시그니처). | DTR 발광 효과(보라색) |
| **📁** | **Folder** | 물리적인 디렉터리 구조를 나타내는 클러스터입니다. | 폴더 클러스터 컨테이너 |
| **☁️** | **External API** | 외부 라이브러리(os, fs) 또는 외부 API 호출 의존성입니다. | 구름 형태 시각화 |
| **📚** | **Doc Shelf** | 마일스톤, 릴리즈 노트, 아키텍처 설계 문서입니다. | 캔버스에서 기본 숨김 처리 |
| **🧪** | **Test Case** | 단위 테스트 및 시스템 검증 파일 (`.test.ts` 등). | 주황색 테두리 |
| **🧩** | **Component** | 독립적으로 작동하는 모듈형 컴포넌트입니다. | 청록색 테두리 |
| **⚙️** | **Processor** | 데이터 변환 및 연산을 담당하는 프로세서 엔진입니다. | 보라색-회색 테두리 |
| **🤝** | **Service** | 여러 모듈에 통합 기능을 제공하는 공용 서비스입니다. | 파란색 테두리 |
| **⛩️** | **Gate** | 입출력을 통제하거나 인증을 담당하는 보안 게이트입니다. | 두꺼운 황색 테두리 |
| **📋** | **Data Record** | DB 스키마, JSON 모델 등 순수 데이터 정의체입니다. | 두꺼운 테두리, 어두운 배경 |
| **👻** | **Ghost Source** | 참조는 되었으나 물리 파일이 없는 누락된 내부 소스입니다. | 점선 테두리 |

### 2. 🎨 노드 상태 및 글로우 (Node Status & Glow)
노드의 현재 추론 상태와 시각적 중요도를 정의합니다.

| 상태 | 시각적 힌트 | 색상 | 의미 |
| :--- | :---: | :---: | :--- |
| **Active** | 실선 테두리 | ![#83a598](./resources/node_styles/node_active.png) | 검증되어 코드베이스에서 실제 작동 중인 상태. |
| **High DTR** | 보라색 글로우 | ![#8a2be2](./resources/node_styles/node_high_dtr.png) | 높은 추론 밀도; 핵심적인 논리 지점. |
| **Ghost** | 점선 테두리 | ![#928374](./resources/node_styles/node_ghost.png) | 제안된 아키텍처 노드 (아직 구현되지 않음). |
| **Deleted** | 회색 처리 | ![#282828](./resources/node_styles/node_deleted.png) | 안전하게 주석 처리되거나 비활성화된 노드. |
| **Warning** | 붉은색 펄스 | ![#fb4934](./resources/node_styles/node_warning.png) | 논리 오류, 순환 참조 또는 데드엔드 감지. |
| **Necrosis** | 💀 | ![#1d2021](./resources/node_styles/node_warning.png) | 치명적 논리 실패; 빌드 파손 또는 심각한 물리적 결함. |
| **Tombstone** | 🪦 | ![#1d2021](./resources/node_styles/node_warning.png) | 복구 불가능한 결정론적 실패; 삭제 권장. |

### 3. ➡️ 로직 및 흐름 마커 (Logic Flow Markers)
LOD(상세 정보) 줌 레벨에 따라 노드 내부 혹은 엣지 위에 표시되는 로직 제어 마커입니다.

| 아이콘 | 타입 | 의미 |
| :---: | :--- | :--- |
| **↻** | **Loop** | 반복문 로직 (`for`, `while`, `map` 등). |
| **◈** | **Decision** | 분기 로직 (`if`, `switch`, `validation` 등). |
| **🖨️** | **Output** | 터미널 로그 출력, 프린트 또는 사이드 이펙트 출력. |
| **📡** | **Signal** | 네트워크 요청 또는 원격 호출 (RPC). |
| **📊** | **Payload** | 고대역폭 데이터 이동 또는 스트림. |
| **🕒** | **Async** | 비동기 처리 또는 대기 상태입니다. |

### 4. ⚠️ 특수 경고 및 정화 마커 (Hazard & Purification)
시스템 정화 및 아키텍처 건전성을 실시간으로 알려주는 시각적 지표입니다.

| 아이콘 | 타입 | 의미 | 시각적 특징 |
| :---: | :--- | :--- | :--- |
| **💀** | **Necrosis** | 아키텍처 위반(순환 의존성 등)으로 인한 괴사 상태입니다. | 어두운 배경 + 노이즈 효과 |
| **🪦** | **Tombstone** | 결정론적 위반 등이 기록된 영구적인 설계 결함입니다. | 묘비 마커 표시 |
| **💣** | **Mine** | 수정 시 위험도가 매우 높은 잠재적 결함(지뢰) 지점입니다. | 레드아웃 경고 |
| **⚠️** | **Logic Fault**| 코드 단위의 에러 또는 싱크 실패 지점입니다. | 붉은색 펄스 / 경고 아이콘 |
| **🔴** | **Dirty Dot** | 저장되지 않았거나 동기화/푸시가 필요한 로컬 변경 사항입니다. | 우측 상단 레드 도트 |

### 5. ✅ 인터랙션 및 승인 배지 (Interaction Badges)
동기화 및 사용자 커맨드 상태를 나타내는 지능형 배지입니다.

| 배지 | 상태 | 의미 |
| :---: | :--- | :--- |
| **✅** | **Confirmed** | 인간 코맨더에 의해 수동으로 승인된 설계입니다. |
| **🤖** | **AI Validated**| 소스 코드 분석을 통해 자동으로 검증된 논리입니다. |
| **❓** | **Pending** | AI가 제안했으나 검증을 기다리는 가설(Draft) 상태입니다. |
| **❌** | **Purge** | 물리적 제거 또는 삭제 대상으로 마킹된 항목입니다. |
| **🔒** | **Locked** | 불변 상태로 설정되어 수정으로부터 보호되는 항목입니다. |

---

## 🔗 엣지 및 라인 규격 (Edge & Line Conventions)
SYNAPSE는 노드 간의 다양한 논리적 연결과 데이터 흐름을 나타내기 위해 고유한 색상과 스타일을 사용합니다.

| 엣지 유형 | 색상 | 스타일 및 두께 | 의미 |
| :--- | :---: | :---: | :--- |
| **Dependency** | ![#ebdbb2](./resources/edge_styles/color_beige.png) | 실선 2px | 표준 모듈 의존성 또는 임포트(Import). |
| **Data Flow** | ![#83a598](./resources/edge_styles/color_blue.png) | 실선 3px | 대용량 데이터 전송 또는 페이로드 이동. |
| **Event** | ![#fe8019](./resources/edge_styles/color_orange.png) | 실선 2px | 이벤트 트리거 또는 비동기 콜백. |
| **Conditional** | ![#d3869b](./resources/edge_styles/color_pink.png) | 실선 1px | if/else 또는 match와 같은 조건부 분기. |
| **Origin** | ![#d65d0e](./resources/edge_styles/color_brown.png) | 실선 1.5px | AI 로직 추적을 위한 프롬프트 기원 링크. |
| **API Call** | ![#8ec07c](./resources/edge_styles/color_aqua.png) | 점선 2px | 외부 API 또는 서비스 간 네트워크 호출. |
| **DB Query** | ![#d3869b](./resources/edge_styles/color_magenta.png) | 실선 3px | 데이터베이스 쿼리, 뮤테이션 또는 트랜잭션. |
| **Loop / Back**| ![#fe8019](./resources/edge_styles/color_orange.png) | 점선 2px | 루프백(`while`/`for`) 또는 역방향 로직 흐름. |
| **Highlighted**| ![#fabd2f](./resources/edge_styles/color_gold.png) | 펄스 5px | 활성 실행 경로 (호버링/선택됨). |

### 🧠 통합 지능형 배지 (Integrated Intelligence Badges, v0.3.11)
SYNAPSE v0.3.11은 논리적 유형과 확정 상태를 하나의 캡슐 안에 통합한 **고밀도 정보 배지**를 도입했습니다.

| 배지 구성 요소 | 아이콘 | 의미 |
| :--- | :---: | :--- |
| **유형 아이콘** | `🔗`, `📡`, `📊` | 연결의 논리적 본질 (통합 표시). |
| **대기 (Pending)** | `❓` | AI/인간에 의해 제안되었으나 승인을 기다리는 연결. |
| **확정 (Confirmed)**| `✅` | 인간이 승인했거나 확립된 논리적 연결. |
| **AI 검증됨** | `🤖` | 소스 코드를 통해 자동으로 검증된 연결. |
| **삭제 액션** | `❌` | (빨간색) 해당 엣지를 즉시 물리적으로 제거. |

### 🔍 엣지 아이콘 매핑 (Edge Icon Mapping)
배지 내부와 화살표 머리에 사용되는 아이콘들은 연결의 시맨틱한 성격을 정의합니다:

| 유형 | 아이콘 | 상세 의미 |
| :--- | :---: | :--- |
| **Dependency** | `🔗` | 모듈 임포트, 상속 또는 패키지 사용. |
| **Call** | `📡` | 동기적 함수/메서드 호출. |
| **Data Flow** | `📊` | 고대역폭 데이터 또는 스트림 이동. |
| **Reference** | `📝` | 포인터, 변수 참조 또는 문서 링크. |
| **Event** | `⚡` | 비동기 트리거 또는 콜백 신호. |
| **Conditional** | `❓` | 결정 분기점 (`if`, `match`, `switch`). |
| **API Call** | `🌐` | 서비스 간 또는 외부 HTTP/RCP 네트워크 호출. |
| **DB Query** | `🛢️` | SQL 쿼리, NoSQL 변동 또는 캐시 액세스. |
| **Loop / Back** | `🔁` | 논리적 재귀 또는 반복 루프백. |
| **Fracture** | `💥` | 순환 참조 또는 아키텍처 붕괴 상태. |

---

## 📸 시각적 개요 (Visual Overview)

### 프로젝트 토폴로지 (Project Topology)
LLM 추론 논리와 소스 파일 간의 물리적 연결을 시각화합니다.
![Topology View](./resources/screenshots/v0.3.1/topology_view.png)

### 논리 흐름 (Logical Flow)
수동 편집과 코드 변경을 모두 반영한 특정 이벤트의 선형 실행 흐름입니다. 그룹 기반 계층 구조와 직각 엣지 라우팅을 사용하여 깔끔하고 읽기 쉬운 도도를 생성합니다.
![Flow View](./resources/screenshots/v0.2.21/flow_view.png)

### 계층적 트리 (Hierarchical Tree)
프로젝트 구조에 대한 깊고 조직적인 개요를 제공합니다.
![Tree View](./assets/v0.2.16/synapse_tree_v0.2.16.png)

---

## 🛠️ 설치 및 실행

1. [Releases](https://github.com/dogsinatas29/SYNAPSE/releases) 페이지에서 최신 `.vsix` 파일을 다운로드합니다.
2. 해당 파일을 **VS Code**로 드래그 앤 드롭합니다.

### 빠른 설치
```bash
code --install-extension synapse-visual-architecture-v0.3.14.vsix
```
현재 버전: **v0.3.14** (긴급 패치)

---

## 💾 시스템 요구 사항

### 폰트 스택 (아이콘 렌더링 필수)
**중요**: SYNAPSE는 현대적인 이모지 아이콘(🔗, 🛢️, 📡, 📊, 📍, 🔁)을 시각화에 사용합니다. 이를 위해 적절한 이모지 폰트 지원이 필요합니다.

**권장 폰트 스택** (우선순위 순):
1. Noto Color Emoji (구글의 포괄적인 이모지 폰트)
2. Apple Color Emoji (macOS 기본 이모지 폰트)
3. Segoe UI Emoji (Windows 10+ 기본 이모지 폰트)
4. 시스템 이모지 폴백

**운영체제별 설치**:

| OS | 설치 방법 | 명령어 |
|----|--------------|---------| 
| **Linux (Ubuntu/Debian)** | Noto Color Emoji 설치 | `sudo apt-get install fonts-noto-color-emoji` |
| **macOS** | 기본 탑재 | 이미 시스템 폰트에 포함되어 있음 |
| **Windows 10+** | 기본 탑재 | Segoe UI Emoji가 기본 포함되어 있음 |

---

## 🚀 시작하기
단 몇 초 만에 시각적 아키텍처 여정을 시작하십시오.

1. **확장 프로그램 설치**: Antigravity/VS Code에 최신 `vsix`를 설치합니다.
2. **DNA 주입**: 워크스페이스 루트에 `GEMINI.md` (또는 `Project_Spec.md`) 파일을 생성하거나 넣습니다.
3. **부트스트랩 단계**: 사이드바 또는 커맨드 팔레트(`Ctrl+Shift+P` -> `SYNAPSE: Open Canvas`)에서 **SYNAPSE Canvas**를 엽니다.
4. **첫 시각화**: 
    - 엔진이 폴더를 스캔하고 **제안된 노드 (Proposed Nodes)**를 표시합니다.
    - 제안 팝업에서 **[Confirm]**을 클릭하여 노드를 실체화(Materialize)합니다.

---

## 🆕 개정 이력 (Revision History)

| 버전 | 날짜 | 설명 |
| :--- | :--- | :--- |
| **v0.3.14** | 2026-04-13 | **시스템 정화 및 긴급 복구**: 레거시 컨텍스트 볼트 제거. 엣지 렌더링 SyntaxError 및 Frozen 클러스터 동기화 TypeError 해결. |
| **v0.3.13** | 2026-04-12 | **키네틱 안정성**: `node_modules` 오염 자동 정화, 격자 기반 겹침 해결 및 레거시 배지 복구. |
| **v0.3.12** | 2026-04-12 | **Zen 주권 및 시그니처 권한**: 버퍼리스 결정론적 분류 엔진, 물리 시그니처 배타적 주권, 문서 보관함 고정 및 권위적 이동 로직 도입. |
| **v0.3.11** | 2026-04-11 | **Core Freeze 및 ID 안정성**: 불변 스냅샷, 5단계 트랜잭션, ID 기반 레이어 권한 강제, 엣지 영속성 강화 및 통합 정보 배지 시스템 도입. |
| **v0.3.10** | 2026-04-07 | **Hard Lock Protocol**: 원자적 파일 생성 보증, ID 정합성 수복 및 라벨 우선 클릭 상호작용 개선. |
| **v0.3.09_fix** | 2026-04-05 | **Hotfix PhaseLock**: RENDER/DEBUG 단계의 전역 인터렉션 락 해결 및 원자적 동기화 개선. |
| **v0.3.1** | 2026-03-31 | **Bootstrap Locked**: 전 단계(Phase 0-7) 순차 초기화 강제 및 시스템 잠금 프로토콜 도입. |

---

## 📜 라이선스 및 저작자
[GNU General Public License v3.0](LICENSE)에 따라 라이선스가 부여됩니다.  
🧠 [dogsinatas29](https://github.com/dogsinatas29)에 의해 제작되었습니다.
