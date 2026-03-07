# <img src="resources/synapse-icon.png" width="40" height="40" /> 🧠 SYNAPSE: 비주얼 아키텍처 엔진 (v0.2.18.1)

> **"눈에 보이는 것이 곧 LLM의 논리입니다."** — *AI를 위한 WYSIWYG 논리 설계 도구*

[![Version](https://img.shields.io/badge/version-v0.2.18.1-brightgreen.svg)
![Status](https://img.shields.io/badge/status-War_Room_Ready-orange.svg)
[![Language](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/Platform-VS_Code-007ACC?style=flat-square)](https://code.visualstudio.com/)

[🇺🇸 English Version](README.md) | [🇰🇷 한국어 버전](README.ko.md)

---

**SYNAPSE**는 **Google Antigravity**와 **VS Code** 사용자를 위한 차세대 시각적 제어 센터입니다. 대규모 언어 모델(LLM)의 추론 과정과 실제 코드 아키텍처 사이의 간극을 메워, 추상적인 논리를 고성능의 인터랙티브 노드-에지 네트워크로 변환합니다.

## 🌟 다중 언어 지능 (v0.2.11 신규 기능)

SYNAPSE는 이제 사용하는 언어에 관계없이 프로젝트의 깊은 의미를 이해하는 통합 스캐닝 엔진을 탑재했습니다.

| 언어 | 고급 해석 엔진 | 로직 플로우 분석 | 최적의 용도 |
| :--- | :---: | :---: | :--- |
| 🐍 **Python** | 심층 임포트 해석 | 전체 지원 | 웹, 데이터 과학, AI |
| 🦀 **Rust** | Crate/Super/Self | `match` 및 에러 핸들링 | 시스템, 고성능 엔진 |
| 🇨 **C / C++** | 로컬 vs 시스템 헤더 | 제어 구조 분석 | 레거시, 성능 최적화, 임베디드 |
| 📜 **JS / TS** | Async/Types | 전체 지원 | 웹, 확장 프로그램, 툴링 |

---

## 🚀 핵심 기능

### 🌐 토폴로지 뷰 (아키텍처 맵)
프로젝트의 폴더 구조와 파일 의존성을 네트워크 형태로 시각화합니다.
- **Node Diet**: 빌드 결과물, 모듈 폴더 등 불필요한 노이즈를 자동으로 필터링합니다.
- **Ghost Node Storage**: 연결되지 않은 컴포넌트들을 별도 클러스터로 격리하여 캔버스를 깨끗하게 유지합니다. ([Ghost Node 가이드 보기](GHOST_NODE.md))
- **Rule Engine**: `RULES.md`를 통해 일관된 발견 규칙과 아이콘 표준을 적용합니다.

### ➡️ 플로우 뷰 (로직 실행 흐름)
복잡한 실행 흐름을 직관적인 순서도로 투영합니다.
- **지능형 분기 감지**: `if/else`, 루프, `try/catch` 등을 높은 정밀도로 포착합니다.
- **Rust 패턴 지원**: Rust 고유의 `match` 식과 에러 처리 패턴을 완벽하게 시각화합니다.
- **권위 있는 결과**: 수동 설계 결정과 실제 소스 코드 로직을 결합하여 최종 결과물을 도출합니다.

### 🧠 지능형 컨텍스트 보관소
- **무중단 컨텍스트 캡처 (`Ctrl+Alt+M`)**: 레코딩 시작(`REC`) 시 백그라운드에서 최근 VS Code AI 채팅(예: GitHub Copilot) 세션을 팝업 없이 자동으로 추적합니다. 코딩 완료 후 다시 버튼을 누르면, 프롬프트, 응답, Git diff가 완벽한 마크다운 문서로 자동 기록됩니다.
- **시맨틱 줌 (LOD)**: 수천 개의 노드도 성능 저하 없이 부드럽게 탐색할 수 있는 단계별 상세도 제어 기능을 제공합니다.
- **지속성(Persistence)**: 모든 시각적 상태를 Git 친화적인 `project_state.json`에 영구적으로 저장합니다.

---

## 🧠 DTR (Density of Thought Reasoning) 엔진
SYNAPSE v0.2.18부터 도입된 **DTR 엔진**은 AI의 추론 깊이와 아키텍처 밀도를 정량적으로 측정합니다. 이는 모호한 AI 확신도를 측정 가능한 엔지니어링 지표로 변환합니다.

### 🌓 DTR 지표 스펙트럼
- **DTR (Density of Thought)**: (0.0 ~ 1.0) 특정 노드에 집중된 추론 노력을 나타냅니다. 높은 DTR 노드는 보라색 아우라로 빛나며 핵심 결정 지점을 표시합니다.
- **$\rho$ (Density Rho)**: 정보 압축률. 하나의 시각적 추상화 내에 얼마나 많은 원시 코드/로직이 캡슐화되어 있는지를 측정합니다.
- **Think-at-N (Simulation Paths)**: 현재 노드를 실체화하기 전 LLM이 시뮬레이션한 대안적 아키텍처 경로의 수입니다.
- **Panic Isolation**: 한 언어 클러스터(예: C++ 크래시)의 로직 실패가 전체 엔진으로 전염되지 않도록 구조화된 에러 코드로 격리 및 보고하는 안전 프로토콜입니다.

### 🚀 결정론적 사고(Deterministic Thinking)의 기반
DTR은 단순한 시각 효과가 아닙니다. 이는 **결정론적 사고**의 기반이 됩니다. 추론 밀도를 수치화함으로써, AI 확신도가 낮은 아키텍처의 "약한 고리"를 식별하고 사용자에게 수동 검증(`?` 배지 흐름)을 유도합니다.

---

## 🔗 엣지 및 선 규격 (Edge & Line Conventions)
SYNAPSE는 노드 간의 다양한 논리적 연결과 데이터 흐름을 표현하기 위해 고유한 색상과 스타일을 사용합니다.

| 엣지 타입 | 색상 | 스타일 및 두께 | 의미 |
| :--- | :---: | :---: | :--- |
| **Dependency** | `#ebdbb2` (Beige) | 실선 (2px) | 표준 모듈 의존성 및 임포트. |
| **Data Flow** | `#83a598` (Blue) | 실선 (3px) | 대량 데이터 전송 또는 페이로드 이동. |
| **Event** | `#fe8019` (Orange) | 실선 (2px) | 이벤트 트리거 또는 비동기 콜백. |
| **Conditional** | `#d3869b` (Pink) | 실선 (1px) | if/else 또는 match와 같은 조건부 분기. |
| **Origin** | `#d65d0e` (Brown) | 실선 (1.5px)| AI 로직 추적을 위한 프롬프트 기원 링크. |
| **API Call** | `#8ec07c` (Aqua) | 점선 (2px) | 외부 API 또는 서비스 간 네트워크 호출. |
| **DB Query** | `#d3869b` (Magenta)| 실선 (3px) | 데이터베이스 쿼리, 수정 또는 트랜잭션. |
| **Loop / Back**| `#fe8019` (Orange) | 점선 (2px) | 반복문 (`while`/`for`) 또는 역방향 로직 흐름. |
| **Highlighted**| `#fabd2f` (Gold) | 펄스 (+5px) | 현재 활성화된 실행 경로 (호버/선택). |

---

## 📸 시각적 개요

### 프로젝트 토폴로지 (Topology)
LLM 추론 논리와 소스 파일 간의 물리적 연결 상태를 시각화합니다.
![Topology View](./resources/screenshots/v0.2.18/graph_view.png)

### 논리 흐름 (Flow)
코드 변경 사항과 수동 편집 사항이 모두 반영된 논리 실행 흐름도입니다. 그룹 기반 계층화와 직교 라우팅을 통해 깔끔한 로직을 제공합니다.
![Flow View](./resources/screenshots/v0.2.18/flow_view.png)

### 계층 구조 (Tree)
프로젝트 구조를 한눈에 파악할 수 있는 체계적인 트리 뷰를 제공합니다.
![Tree View](./assets/v0.2.16/synapse_tree_v0.2.16.png)

---

## 🛠️ 설치 방법

1. [Releases](https://github.com/dogsinatas29/SYNAPSE/releases) 페이지에서 최신 `.vsix` 파일을 다운로드합니다.
2. 파일을 **VS Code** 창으로 드래그 앤 드롭합니다.
### 빠른 설치
```bash
code --install-extension synapse-visual-architecture-0.2.18.1.vsix
```
현재 버전: **v0.2.18.1** (Iron Guard Protocol & Modular Architecture)

---

## 📖 사용 가이드 (주요 모드 설명)

### 1. 🔄 Reset State (상태 초기화)
캔버스가 손상되거나 완전히 새로운 아키텍처를 시작하고 싶을 때 사용합니다.
- **디스크 정리**: `project_state.json`에서 모든 노드, 엣지, 클러스터를 즉시 삭제합니다.
- **메모리 flush**: 현재 활성화된 엔진 메모리를 비우고 깨끗한 캔버스로 되돌립니다.

### 2. ✏️ Edit Logic 모드 (위지윅 파일 관리)
상단 툴바의 이 버튼을 통해 캔버스에서 직접 워크스페이스를 구성할 수 있습니다.
- **파일 생성**: 모드 활성화 후 빈 공간을 더블 클릭하여 새 노드를 만들면 **실제 파일이 물리적으로 생성**됩니다.
- **안전한 삭제**: 노드 삭제 시 파일을 하드 삭제하지 않고 `// [SYNAPSE_DELETED]` 주석으로 감싸 코드를 보존합니다.
- **부활**: 실수로 삭제한 경우 스냅샷 롤백을 통해 파일을 물리적으로 원상복구할 수 있습니다.

### 3. 🔗 엣지 관리 및 자동 임포트
- **배지 시스템 (`?` → `!`)**: 수동으로 노드를 연결하면 노란색 **`?`** 배지가 뜹니다. 이를 클릭하면 소스 코드 언어에 맞는 **`import` 구문이 파일 최상단에 자동으로 주입**되며 초록색 **`!`**로 바뀝니다.
- **엣지 삭제**: 엣지 중앙의 빨간색 `X` 배지를 클릭하여 연결을 즉시 끊을 수 있습니다.

---

## 🆕 버전 히스토리

### v0.2.18.1 (Iron Guard Protocol & Modular Architecture)
- **문서 모듈화 허브**: 거대한 `architecture.md`를 4개의 전문 스펙(`core_synapse`, `vega_agent`, `reporting`, `data_scheme`)으로 분리하고 마스터 허브 체계를 수립했습니다.
- **경량 스키마 가드 (LOD)**: `project_state.json` 저장/로드 시 핵심 필드(ID, Type, Status) 무결성을 엄격히 검증합니다.
- **Panic Isolation 기틀**: 이종 언어 간 예외를 에러 코드로 변환하여 격리하는 표준을 정립했습니다.
- **Ghost Node 워크플로우**: `Ghost` (제안) -> `Materialize` (승인) -> `Reserved` (대기) -> `Active` (코드) 전이 모델을 공식화했습니다.
- **계층형 UI 최적화**: 툴바를 논리적 메뉴 그룹(`View`, `System`, `Protocol`, `Snap Shot`)으로 재구조화했습니다.
- **컨텍스트 볼트 격리**: 비대한 컨텍스트 노드들을 전용 링크 버튼을 통해 외부 패널로 분리했습니다.
- **엣지 배지 클릭 반경 확장**: 확정(`?`) 및 삭제 버튼의 클릭 영역을 대폭 확장하여 사용성을 개선했습니다.

### v0.2.17 (DTR & WYSIWYG Logic Editing)
- **DTR 시각화**: AI 추론 밀도가 보라색으로 빛나며, 상태바에서 인퍼런스 압력을 직접 제어합니다.
- **버퍼 클러스터 자동화**: 수동 생성된 노드가 `Buffer Cluster`로 자동 스폰되며 카메라가 포커스합니다.
- **로직 편집 마스터 스위치**: 파괴적인 생성 도구들이 마케터 스위치 활성화 시에만 노출됩니다.
- **상태 변경 자동 스냅샷**: 모든 캔버스 조작은 즉각적으로 스냅샷 히스토리에 기록됩니다.

### v0.2.14 ~ v0.2.16 (Execution Flow & Layout Study)
- **Stable Layout BFS**: 위상 정렬 기반의 안정적인 랭크 계산법 도입.
- **NaN/Infinity 가드**: 복잡한 그래프에서의 엔진 프리징 방지.
- **순환 참조 안전 장치**: 계산 깊이 제한을 통한 비정상적 재귀 차단.
- **직교 라우팅(Manhattan Routing)**: 90도로 꺾이는 깔끔한 선 연결 방식 도입.
- **가상 버스 터미널**: 로직이 집중되는 구간에 `Merge / Sync` 노드 추가.

---

## 📜 라이선스 및 제작자
본 프로젝트는 [GNU General Public License v3.0](LICENSE) 라이선스를 따릅니다.  
[dogsinatas29](https://github.com/dogsinatas29)가 🧠와 정성을 담아 제작했습니다.
