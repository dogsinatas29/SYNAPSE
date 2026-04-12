# <img src="./resources/synapse-icon.png" width="40" height="40" /> 🧠 SYNAPSE: 시각적 아키텍처 엔진 (v0.3.12)

> **"눈에 보이는 것이 LLM의 논리다"** — *AI를 위한 WYSIWYG 논리*

[![Version](https://img.shields.io/badge/version-v0.3.12-brightgreen.png)
[![Latest Release](https://img.shields.io/badge/latest-v0.3.12%20Zen%20Sovereignty%20Edition-orange.png)
![Status](https://img.shields.io/badge/status-Production_Ready-brightgreen.png)
[![Language](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/Platform-VS_Code-007ACC?style=flat-square)](https://code.visualstudio.com/)

[🇺🇸 English Version](README.md) | [🇰🇷 Korean Version](README.ko.md)

---

## 🔥 최신 릴리즈: v0.3.11 - 코어 프리즈 및 트랜잭션 파이프라인 (2026-04-07)

### ✅ 아키텍처 혁신
**v0.3.11**은 SYNAPSE를 결정론적이고 불변하는 상태 머신으로 변환하는 **코어 프리즈(Core Freeze) 아키텍처**를 도입했습니다:

| 기능 | 설명 | 혜택 |
|-------|---------|-----|
| **Core Freeze** | 불변 `GraphSnapshot` + `DeepFreeze` | 승인되지 않은 상태 수정을 방지하며 읽기 전용 진실 계층을 유지합니다. |
| **Commit Pipeline** | 5단계 검증 (Validate ↔ Execute) | 파일 시스템 오류 발생 시 원자적 롤백이 가능한 무결점 트랜잭션을 보장합니다. |
| **Projection Layer** | 다중 해상도 (File/Function/Full) | 하부 그래프를 변경하지 않고 실시간으로 뷰를 전환할 수 있습니다. |
| **Scope Isolation** | 더블 클릭 오버레이 (Sub-Canvas) | 복잡한 모듈 분석을 위한 완전한 컨텍스트 격리를 지원합니다. |
| **Physical Unlink** | 트랜잭션 삭제 동기화 | 노드 제거와 물리적 파일 삭제 간의 원자적 동기화를 보장합니다. |
| **Self-Healing** | 시스템 클러스터 자동 복구 | Ghosts, Reserved, Docs 클러스터가 로드 시마다 자동으로 원상복구됩니다. |

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

### 🧠 지능형 컨텍스트 볼트 (Context Vault)
- **제로 클릭 컨텍스트 캡처 (`Ctrl+Alt+M`)**: 녹화(`REC`)를 시작하면 SYNAPSE가 배경에서 팝업 없이 최신 AI 채팅 세션(예: GitHub Copilot)을 자동으로 찾아 추출합니다. 코딩이 끝나면 다시 눌러 LLM 프롬프트, 응답, 실시간 Git diff를 완벽한 Markdown 아티팩트로 저장합니다.
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

### 📄 엔티티 유형 (Entity Types)
| 아이콘 | 유형 | 설명 |
| :---: | :--- | :--- |
| 📄 | **파일 (File)** | 워크스페이스 내의 물리적 소스 파일. |
| 📁 | **폴더 (Folder)** | 여러 노드나 클러스터를 포함하는 디렉토리. |
| 🧩 | **컴포넌트 (Component)** | 논리적 그룹 또는 추상화된 모듈. |
| ⚡ | **트리거 (Trigger)** | 진입점 또는 이벤트 발생원. |

### 🎨 노드 상태 및 글로우
| 상태 | 시각적 힌트 | 색상 | 의미 |
| :--- | :---: | :---: | :--- |
| **Active** | 실선 테두리 | ![#83a598](./resources/node_styles/node_active.png) | 검증되어 코드베이스에서 실제 작동 중인 상태. |
| **High DTR** | 보라색 글로우 | ![#8a2be2](./resources/node_styles/node_high_dtr.png) | 높은 추론 밀도; 핵심적인 논리 지점. |
| **Ghost** | 점선 테두리 | ![#928374](./resources/node_styles/node_ghost.png) | 제안된 아키텍처 노드 (아직 구현되지 않음). |
| **Deleted** | 회색 처리 | ![#282828](./resources/node_styles/node_deleted.png) | 안전하게 주석 처리되거나 비활성화된 노드. |
| **Warning** | 붉은색 펄스 | ![#fb4934](./resources/node_styles/node_warning.png) | 논리 오류, 순환 참조 또는 데드엔드 감지. |
| **Necrosis** | 💀 | ![#1d2021](./resources/node_styles/node_warning.png) | 치명적 논리 실패; 빌드 파손 또는 심각한 물리적 결함. |
| **Tombstone** | 🪦 | ![#1d2021](./resources/node_styles/node_warning.png) | 복구 불가능한 결정론적 실패; 삭제 권장. |

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
code --install-extension synapse-visual-architecture-v0.3.12.vsix
```
현재 버전: **v0.3.12** (Zen 주권 에디션)

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
| **v0.3.11** | 2026-04-11 | **Core Freeze 및 ID 안정성**: 불변 스냅샷, 5단계 트랜잭션, ID 기반 레이어 권한 강제, 엣지 영속성 강화 및 통합 정보 배지 시스템 도입. |
| **v0.3.10** | 2026-04-07 | **Hard Lock Protocol**: 원자적 파일 생성 보증, ID 정합성 수복 및 라벨 우선 클릭 상호작용 개선. |
| **v0.3.09_fix** | 2026-04-05 | **Hotfix PhaseLock**: RENDER/DEBUG 단계의 전역 인터렉션 락 해결 및 원자적 동기화 개선. |
| **v0.3.1** | 2026-03-31 | **Bootstrap Locked**: 전 단계(Phase 0-7) 순차 초기화 강제 및 시스템 잠금 프로토콜 도입. |

---

## 📜 라이선스 및 저작자
[GNU General Public License v3.0](LICENSE)에 따라 라이선스가 부여됩니다.  
🧠 [dogsinatas29](https://github.com/dogsinatas29)에 의해 제작되었습니다.
