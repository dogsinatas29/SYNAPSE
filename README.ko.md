# <img src="./resources/synapse-icon.png" width="40" height="40" /> 🧠 SYNAPSE: 비주얼 아키텍처 엔진 (v0.3.11)

> **"당신이 보는 것이 곧 LLM의 논리입니다"** — *AI를 위한 WYSIWYG 로직*

[![Version](https://img.shields.io/badge/version-v0.3.11-brightgreen.png)
[![Latest Release](https://img.shields.io/badge/latest-v0.3.11%20Core%20Freeze%20Edition-orange.png)
![Status](https://img.shields.io/badge/status-Production_Ready-brightgreen.png)
[![Language](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/Platform-VS_Code-007ACC?style=flat-square)](https://code.visualstudio.com/)

[🇰🇷 한국어 버전](README.ko.md) | [🇺🇸 영어 버전](README.md)

---

## 🔥 최신 릴리즈: v0.3.11 - 코어 프리즈 & 트랜잭션 파이프라인 (2026-04-07)

### ✅ 아키텍처 혁신
**v0.3.11**은 SYNAPSE를 결정론적이고 불변하는 상태 머신으로 변환하는 **코어 프리즈(Core Freeze) 아키텍처**를 도입했습니다.

| 기능 | 설명 | 이점 |
|-------|---------|-----|
| **코어 프리즈(Core Freeze)** | 불변 `GraphSnapshot` + `DeepFreeze` | 비인가 상태 변이를 차단하며 읽기 전용의 사실 계층을 보장합니다. |
| **커밋 파이프라인** | 5단계 검증 (Validate ↔ Execute) | 파일 시스템 오류 시 원자적 롤백을 지원하는 무손실 트랜잭션을 제공합니다. |
| **투영 레이어(Projection)** | 다중 해상도 (파일/함수/전체) | 원본 그래프를 변경하지 않고 실시간으로 시각화 해상도를 전환합니다. |
| **스코프 격리(Scope)** | 더블 클릭 오버레이 (서브 캔버스) | 복잡한 모듈 분석을 위해 특정 노드에 집중된 격리 환경을 제공합니다. |
| **물리적 언링크(Unlink)** | 트랜잭션 삭제 동기화 | 노드 삭제와 실제 파일 삭제를 원자적으로 동기화합니다. |
| **자가 치유(Self-Healing)** | 시스템 클러스터 자동 복구 | Ghosts, Reserved, Docs 클러스터가 로드 시마다 자동으로 정합성을 유지합니다. |

---

## 🔥 v0.3.10 - 하드 락 프로토콜 & 클릭 탄력성 (이전 버전)

**v0.3.10**은 수동 UI 설계와 물리적 파일 생성의 원자적 정합성을 연결합니다.

| 기능 | 설명 | 이점 |
|-------|---------|-----|
| **하드 락 프로토콜** | 원자적 `fs.writeFile` + `fs.stat` 검증 | UI가 '확정(Solid)' 상태가 되기 전 물리 파일 존재를 보증합니다. |
| **클릭 탄력성** | 지능적 라벨 우선 인식 (`test.py`) | 시스템 ID와 무관하게 사용자가 지정한 라벨 기반의 클릭 상호작용을 보장합니다. |

---

**SYNAPSE**는 **Google Antigravity**와 **VS Code**를 위한 차세대 비주얼 컨트롤 타워입니다. 대규모 언어 모델(LLM)의 추론 과정과 물리적 코드 아키텍처 사이의 간극을 메워, 추상적인 로직을 인터랙티브하고 고성능인 노드-엣지 네트워크로 변환합니다.

## 🌟 다중 언어 지능 (v0.2.11 신규)

SYNAPSE는 언어에 관계없이 프로젝트의 깊은 의미를 이해하는 통합 스캔 엔진을 탑재하고 있습니다.

| 언어 | 고급 해상도 | 로직 흐름 분석 | 용도 |
| :--- | :---: | :---: | :--- |
| 🐍 **Python** | 깊은 임포트 분석 | 전체 지원 | 웹, 데이터 과학, AI |
| 🦀 **Rust** | Crate/Super/Self | `match` 및 에러 처리 | 시스템, 고성능 |
| 🇨 **C / C++** | 로컬 vs 시스템 헤더 | 제어 구조 분석 | 레거시, 성능, 임베디드 |
| 📜 **JS / TS** | Async/타입 분석 | 전체 지원 | 웹, 확장 프로그램, 도구 |

---

## 🚀 주요 기능

### 🌐 토폴로지 뷰 (아키텍처 맵)
프로젝트의 폴더 구조와 파일 의존성을 실시간 네트워크로 시각화합니다.
- **노드 다이어트**: 노이즈(venv, node_modules, 빌드 파일)를 자동으로 필터링합니다.
- **고스트 노드 저장소**: 연결되지 않은 컴포넌트를 격리하여 작업 공간을 청결하게 유지합니다. ([고스트 노드 가이드](GHOST_NODE.md))
- **규칙 엔진**: `RULES.md`에 정의된 표준에 따라 아이콘과 탐색 기준을 유지합니다.

### ➡️ 플로우 뷰 (로직 실행)
복잡한 실행 흐름을 직관적인 플로우차트로 투영합니다.
- **지능적 분기 탐지**: `if/else`, `loops`, `try/catch` 등을 높은 정밀도로 탐지합니다.
- **Rust Match 지원**: Rust의 강력한 패턴 매칭을 기본적으로 시각화합니다.
- **권위적 결과**: 수동 설계 결정사항과 실제 소스 코드 로직을 통합합니다.

### 🧠 지능형 컨텍스트 금고
- **제로 클릭 컨텍스트 캡처 (`Ctrl+Alt+M`)**: 기록(`REC`)을 시작하면 SYNAPSE가 백그라운드에서 최신 VS Code AI 채팅 세션(예: GitHub Copilot)을 자동으로 찾아 추출합니다. 코딩이 끝나고 다시 누르면 LLM 프롬프트, 응답, Git diff가 완벽한 마크다운 문서로 저장됩니다.
- **시맨틱 줌 (LOD)**: 성능 최적화된 렌더링으로 수천 개의 노드를 부드럽게 탐색합니다.
- **지속성**: 전체 시각 상태를 Git 친화적인 `project_state.json`에 저장합니다.

---

## 🏗️ 노드 컨벤션 (Node Conventions)
SYNAPSE는 컴포넌트의 유형과 추론 상태를 나타내기 위해 특정 아이콘과 색상을 사용합니다.

### 📄 엔티티 유형
| 아이콘 | 유형 | 설명 |
| :---: | :--- | :--- |
| 📄 | **파일** | 작업 공간의 물리적 소스 파일입니다. |
| 📁 | **폴더** | 여러 노드나 클러스터를 포함하는 디렉토리입니다. |
| 🧩 | **컴포넌트** | 논리적 그룹 또는 추상화된 모듈입니다. |
| ⚡ | **트리거** | 진입점 또는 이벤트 소스입니다. |

### 🎨 노드 상태 및 발광(Glow)
| 상태 | 시각적 힌트 | 색상 | 의미 |
| :--- | :---: | :---: | :--- |
| **Active** | ![실선 테두리](./resources/node_styles/hint_solid_border.png) | ![#83a598](./resources/node_styles/node_active.png) | 검증되었으며 코드베이스에서 활성화된 상태입니다. |
| **High DTR** | ![보라색 발광](./resources/node_styles/hint_purple_glow.png) | ![#8a2be2](./resources/node_styles/node_high_dtr.png) | 높은 로직 밀도; 핵심적인 결정 지점입니다. |
| **Ghost** | ![점선 테두리](./resources/node_styles/hint_dashed_border.png) | ![#928374](./resources/node_styles/node_ghost.png) | 제안된 아키텍처 노드 (아직 구현되지 않음). |
| **Deleted** | ![회색 처리](./resources/node_styles/hint_grayed_out.png) | ![#282828](./resources/node_styles/node_deleted.png) | 안전하게 주석 처리되거나 제거된 노드입니다. |

---

## 🛠️ 설치 및 실행

1. [Releases](https://github.com/dogsinatas29/SYNAPSE/releases) 페이지에서 최신 `.vsix` 파일을 다운로드합니다.
2. 파일을 **VS Code**로 드래그 앤 드롭합니다.

### 빠른 설치
```bash
code --install-extension synapse-visual-architecture-v0.3.11.vsix
```
현재 버전: **v0.3.11** (Core Freeze Edition)

---

## 🚀 시작하기
초 단위로 비주얼 아키텍처 여행을 시작하세요.

1. **확장 프로그램 설치**: Antigravity/VS Code에 `synapse-visual-architecture-v0.3.11.vsix`를 설치합니다.
2. **DNA 주입**: 작업 공간 루트에 `GEMINI.md` 파일을 생성합니다.
3. **부트스트랩 단계**: 사이드바 또는 명령 팔레트(`Ctrl+Shift+P` -> `SYNAPSE: Open Canvas`)에서 캔버스를 엽니다.
4. **첫 시각화**: 
    - 엔진이 폴더를 스캔하고 **제안된 노드(Proposed Nodes)**를 표시합니다.
    - 제안 팝업에서 **[Confirm]**을 클릭하여 노드를 물리적으로 확정합니다.

---

## 🆕 개정 이력 (Revision History)

| 버전 | 날짜 | 영문 설명 | 한글 설명 |
| :--- | :--- | :--- | :--- |
| **v0.3.11** | 2026-04-07 | **Core Freeze**: Immutable snapshots, 5-stage transactional pipeline, Projection layer, and Scope isolation. | **코어 프리즈**: 불변 스냅샷, 5단계 트랜잭션 파이프라인, 투영 레이어 및 스코프 격리 지원. |
| **v0.3.10** | 2026-04-07 | **Hard Lock Protocol**: Atomic file creation, ID persistence fix, and label-priority click resilience. | **하드 락 프로토콜**: 원자적 파일 생성 보증, ID 정합성 수복 및 라벨 우선 클릭 상호작용 개선. |
| **v0.3.09_fix** | 2026-04-05 | **Hotfix PhaseLock**: Resolved system-wide interaction lock. | **핫픽스 페이즈락**: 전역 인터렉션 락 해결 및 동기화 개선. |

---

## 📜 라이선스 및 제작자
Licensed under the [GNU General Public License v3.0](LICENSE).  
Created with 🧠 by [dogsinatas29](https://github.com/dogsinatas29)
