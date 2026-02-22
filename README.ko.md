# <img src="resources/synapse-icon.png" width="40" height="40" /> SYNAPSE: 비주얼 아키텍처 엔진

> **"눈에 보이는 것이 곧 LLM의 논리입니다."** — *AI를 위한 WYSIWYG 논리 설계 도구*

[![Release](https://img.shields.io/badge/Release-v0.2.11-orange?style=flat-square)](https://github.com/dogsinatas29/SYNAPSE/releases)
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
- **Ghost Node Storage**: 연결되지 않은 컴포넌트들을 별도 클러스터로 격리하여 캔버스를 깨끗하게 유지합니다.
- **Rule Engine**: `RULES.md`를 통해 일관된 발견 규칙과 아이콘 표준을 적용합니다.

### ➡️ 플로우 뷰 (로직 실행 흐름)
복잡한 실행 흐름을 직관적인 순서도로 투영합니다.
- **지능형 분기 감지**: `if/else`, 루프, `try/catch` 등을 높은 정밀도로 포착합니다.
- **Rust 패턴 지원**: Rust 고유의 `match` 식과 에러 처리 패턴을 완벽하게 시각화합니다.
- **권위 있는 결과**: 수동 설계 결정과 실제 소스 코드 로직을 결합하여 최종 결과물을 도출합니다.

### 🧠 컨텍스트 기반 설계
- **로그 프롬프트 (`Ctrl+Alt+M`)**: 노드 자동 바인딩 및 상태 스냅샷 기능을 통해 설계 결정을 캔버스에서 직접 기록합니다.
- **시맨틱 줌 (LOD)**: 수천 개의 노드도 성능 저하 없이 부드럽게 탐색할 수 있는 단계별 상세도 제어 기능을 제공합니다.
- **지속성(Persistence)**: 모든 시각적 상태를 Git 친화적인 `project_state.json`에 영구적으로 저장합니다.

---

## 📸 시각적 개요

### 프로젝트 토폴로지 (Topology)
LLM 추론 논리와 소스 파일 간의 물리적 연결 상태를 시각화합니다.
![Topology View](docs/media/graph_v0.2.11.png)

### 논리 흐름 (Flow)
코드 변경 사항과 수동 편집 사항이 모두 반영된 논리 실행 흐름도입니다.
![Flow View](docs/media/flow_v0.2.11.png)

### 계층 구조 (Tree)
프로젝트 구조를 한눈에 파악할 수 있는 체계적인 트리 뷰를 제공합니다.
![Tree View](docs/media/tree_v0.2.11.png)

---

## 🛠️ 설치 방법

1. [Releases](https://github.com/dogsinatas29/SYNAPSE/releases) 페이지에서 최신 `.vsix` 파일을 다운로드합니다.
2. 파일을 **VS Code** 창으로 드래그 앤 드롭합니다.
3. 또는 터미널에서 다음 명령어를 입력합니다: `code --install-extension synapse-visual-architecture-0.2.11.vsix`

---

## 🆕 버전 히스토리

### v0.2.11 (최종판)
- **✨ 다중 언어 지능화**: Python, C/C++, Rust를 위한 정교한 스캐닝 지원.
- **고급 해석 엔진**: 모든 주요 언어의 내부 경로 추적 기능 강화.
- **통합 플로우 뷰**: C/C++ 및 Rust의 로직 실행 시각화 지원 추가.

### v0.2.10
- **🐛 중요 수정**: 활성화 오류 해결 및 다중 노드 삭제 안정성 개선.

---

## 📜 라이선스 및 제작자
본 프로젝트는 [GNU General Public License v3.0](LICENSE) 라이선스를 따릅니다.  
[dogsinatas29](https://github.com/dogsinatas29)가 🧠와 정성을 담아 제작했습니다.
