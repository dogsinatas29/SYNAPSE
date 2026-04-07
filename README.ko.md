# <img src="./resources/synapse-icon.png" width="40" height="40" /> 🧠 SYNAPSE: 비주얼 아키텍처 엔진 (v0.3.10)

> **"당신이 보는 것이 LLM의 논리입니다"** — *AI를 위한 WYSIWYG 로직*

[![Version](https://img.shields.io/badge/version-v0.3.10-brightgreen.png)
[![Latest Release](https://img.shields.io/badge/latest-v0.3.10%20Hard%20Lock%20Edition-orange.png)
![Status](https://img.shields.io/badge/status-Production_Ready-brightgreen.png)
[![Language](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/Platform-VS_Code-007ACC?style=flat-square)](https://code.visualstudio.com/)

[🇰🇷 한국어 버전](README.ko.md) | [🇺🇸 영문 버전](README.md)

---

## 🔥 최신 릴리즈: v0.3.10 - 하드 락 프로토콜 및 클릭 상호작용 수복 (2026-04-07)

### ✅ 아키텍처 혁신
**v0.3.10**은 **하드 락(Hard Lock) 프로토콜**을 도입하여 수동 UI 설계와 물리적 파일 생성 간의 원자적 동기화를 완성했습니다.

| 주요 기능 | 설명 | 기대 효과 |
|-------|---------|-----|
| **하드 락 프로토콜** | 원자적 `fs.writeFile` + `fs.stat` 검증 | UI에서 'Solid' 상태가 되기 전 물리 파일의 존재를 100% 보증합니다. |
| **클릭 상호작용 수복** | 지능형 라벨 우선 폴백 (`test.py`) | 시스템 ID 노드에서도 라벨명을 인식하여 클릭 시 즉시 에디터를 엽니다. |
| **ID 정합성 유지** | 유효 ID 매핑 (익스텐션 ↔ 웹뷰) | 리프레시 없이도 신규 노드가 즉시 버퍼 클러스터로 자동 이동합니다. |
| **데이터 무결성** | 유령 엣지 제거 (14 -> 12 필터링) | 시각적 엣지 수와 상단 정보창의 통계 수치를 1:1로 일치시켰습니다. |
| **부팅 안정화** | Null-safety 가드 + CSP 403 오류 해결 | 초기화 시 발생하는 크래시와 에셋 로딩 차단 문제를 완벽히 해결했습니다. |

---

**SYNAPSE**는 **Google Antigravity** 및 **VS Code**를 위한 차세대 비주얼 컨트롤 타워입니다. 대규모 언어 모델(LLM)의 추론 논리와 물리적 코드 아키텍처 사이의 간극을 메우며, 추상적인 로직을 인터랙티브하고 고성능인 노드-엣지 네트워크로 변환합니다.

## 🌟 다국어 지능 (v0.2.11 신규 기능)

SYNAPSE는 언어에 관계없이 프로젝트의 깊은 의미를 이해하는 통합 스캔 엔진을 갖추고 있습니다.

| 언어 | 고급 해석 | 로직 흐름 분석 | 최적 분야 |
| :--- | :---: | :---: | :--- |
| 🐍 **Python** | 깊은 Import 지원 | 전체 지원 | 웹, 데이터 과학, AI |
| 🦀 **Rust** | Crate/Super/Self | `match` 및 에러 처리 | 시스템, 고성능 컴퓨팅 |
| 🇨 **C / C++** | 로컬 vs 시스템 헤더 | 제어 구조 분석 | 레거시, 성능 중심, 임베디드 |
| 📜 **JS / TS** | Async/타입 지원 | 전체 지원 | 웹, 익스텐션, 툴링 |

---

## 🚀 핵심 기능

### 🌐 토폴로지 뷰 (아키텍처 맵)
프로젝트의 폴더 구조와 파일 의존성을 라이브 네트워크로 시각화합니다.
- **노드 다이어트**: 노이즈(venv, node_modules, 빌드 결과물)를 자동으로 필터링합니다.
- **고스트 노드 저장소**: 연결되지 않은 컴포넌트를 격리하여 워크스페이스를 깨끗하게 유지합니다. ([고스트 노드 가이드 보기](GHOST_NODE.md))
- **규칙 엔진**: `RULES.md`에 따라 일관된 발견 및 아이콘 표준을 유지합니다.

### ➡️ 플로우 뷰 (로직 실행)
복잡한 실행 흐름을 직관적인 순서도로 투영합니다.
- **지능형 분기**: `if/else`, 루프, `try/catch` 등을 높은 정밀도로 감지합니다.
- **Rust Match 지원**: Rust의 강력한 패턴 매칭을 네이티브하게 시각화합니다.
- **권위 있는 결과**: 수동 설계 결정과 실제 소스 코드 로직을 통합합니다.

### 🧠 지능형 컨텍스트 볼트
- **제로-클릭 컨텍스트 캡처 (`Ctrl+Alt+M`)**: 녹화(`REC`)를 시작하면, 시냅스가 백그라운드에서 최신 AI 채팅 세션을 찾아 자동으로 추출합니다. 코딩이 끝나고 다시 누르면 프롬프트, 응답, Git diff가 마크다운 문서로 완벽하게 저장됩니다.
- **세맨틱 줌 (LOD)**: 수천 개의 노드를 부드럽고 성능 최적화된 렌더링으로 탐색하세요.
- **영속성**: 모든 시각적 상태를 Git 친화적인 `project_state.json`에 저장합니다.

---

## 🏗️ 노드 규격
시냅스는 다양한 컴포넌트 타입과 현재 추론 상태를 나타내기 위해 특정 아이콘과 색상을 사용합니다.

### 📄 엔티티 타입
| 아이콘 | 타입 | 설명 |
| :---: | :--- | :--- |
| 📄 | **파일** | 워크스페이스의 물리적 소스 파일입니다. |
| 📁 | **폴더** | 여러 노드나 클러스터를 포함하는 디렉토리입니다. |
| 🧩 | **컴포넌트** | 논리적 그룹 또는 추상화된 모듈입니다. |
| ⚡ | **트리거** | 진입점 또는 이벤트 소스입니다. |

### 🎨 노드 상태 및 발광(Glow)
| 상태 | 시각적 힌트 | 색상 | 의미 |
| :--- | :---: | :---: | :--- |
| **Active** | 실선 테두리 | 파란색 계열 | 코드베이스에서 검증되고 활성화된 상태입니다. |
| **High DTR** | 보라색 오라 | 보라색 | 높은 추론 밀도를 가진 핵심 로직 지점입니다. |
| **Ghost** | 점선 테두리 | 회색 계열 | 제안된 아키텍처 노드(아직 물리화되지 않음)입니다. |
| **Warning** | 붉은색 펄스 | 붉은색 | 로직 에러, 순환 의존성 또는 막다른 길 감지 상태입니다. |
| **Necrosis** | 💀 | 검은색/빨간색 | 치명적인 로직 실패 또는 물리적 결함 상태입니다. |

---

## 🛠️ 성능 및 3D 가속

1. [Releases](https://github.com/dogsinatas29/SYNAPSE/releases) 페이지에서 최신 `.vsix`를 다운로드합니다.
2. 파일을 **VS Code**로 드래그 앤 드롭합니다.

### 빠른 설치
```bash
code --install-extension synapse-visual-architecture-v0.3.10.vsix
```
현재 버전: **v0.3.10** (하드 락 프로토콜 에디션)

---

## 🆕 개정 이력

| 버전 | 날짜 | 영문 설명 | 한글 설명 |
| :--- | :--- | :--- | :--- |
| **v0.3.10** | 2026-04-07 | **Hard Lock Protocol**: Atomic file creation, ID persistence fix, and label-priority click resilience. | **하드 락 프로토콜**: 원자적 파일 생성 보증, ID 정합성 수복 및 라벨 우선 클릭 상호작용 개선. |
| **v0.3.09_fix** | 2026-04-05 | **Hotfix PhaseLock**: Resolved system-wide interaction lock. | **핫픽스 페이즈락**: RENDER/DEBUG 단계의 전역 인터렉션 락 해결 및 원자적 동기화 개선. |
| **v0.3.1** | 2026-03-31 | **Bootstrap Locked**: Full Phase-based initialization. | **부트스트랩 락**: 전 단계(Phase 0-7) 순차 초기화 강제 및 시스템 잠금 프로토콜 도입. |

---

## 📜 라이선스 및 저자
[GNU General Public License v3.0](LICENSE)에 따라 라이선스가 부여됩니다.  
[dogsinatas29](https://github.com/dogsinatas29)가 🧠로 만들었습니다.
