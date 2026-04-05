# <img src="./resources/synapse-icon.png" width="40" height="40" /> 🧠 SYNAPSE: 시각적 아키텍처 엔진 (v0.3.9)

> **"눈에 보이는 것이 LLM의 논리다"** — *AI를 위한 WYSIWYG 논리 엔진*

[![Version](https://img.shields.io/badge/version-v0.3.9-brightgreen.png)](https://github.com/dogsinatas29/SYNAPSE)
[![Latest Release](https://img.shields.io/badge/latest-v0.3.09%20Hotfix-orange.png)](https://github.com/dogsinatas29/SYNAPSE/releases)
![Status](https://img.shields.io/badge/status-Production_Ready-brightgreen.png)
[![Language](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/Platform-VS_Code-007ACC?style=flat-square)](https://code.visualstudio.com/)

[🇰🇷 한국어 버전](README.ko.md) | [🇺🇸 영어 버전](README.md)

---

## 🔥 최신 릴리즈: v0.3.09 핫픽스 (2026-04-05)

### ✅ 주요 버그 수정
**v0.3.09** 버전은 v0.3.9 배포 후 보고된 치명적인 렌더링 및 시스템 락 이슈를 해결합니다:

| 이슈 | 증상 | 수정 내용 | 상태 |
|-------|---------|-----|--------|
| **시스템 락 (Lock)** | Phase 5 이상에서 세이브/편집 불가 | Phase 전이 제약 완화 및 인터렉션 허용 범위 확장 | ✅ 수정됨 |
| **Canvas 높이 0** | 2D 모드: 노드가 보이지 않음 | 최소 높이 강제 및 DOM 리플로우 트리거 | ✅ 수정됨 |
| **이모지 폰트 누락** | 3D 모드: 아이콘이 'D', 'B'로 표시됨 | Noto Color Emoji 폰트 스택 적용 | ✅ 수정됨 |
| **에코 모드 수면** | 렌더링 중 성능 저하 발생 | 렌더링 상태 체크 및 유휴 타이머 초기화 | ✅ 수정됨 |
| **렌더링 격리** | 뷰 전환 시 WebGL 잔상 발생 | Rule 8 적용: 뷰 종료 시 WebGL 프레임버퍼 강제 리셋 | ✅ 수정됨 |

---

**SYNAPSE**는 **Google Antigravity**와 **VS Code**를 위한 차세대 시각적 관제탑입니다. LLM의 추론과 실제 코드 아키텍처 사이의 간극을 메우며, 추상적인 논리를 상호작용 가능한 고성능 노드-엣지 네트워크로 변환합니다.

## 🌟 다국어 지능 (v0.2.11 신규)

SYNAPSE는 언어에 관계없이 프로젝트의 깊은 의미를 이해하는 통합 스캔 엔진을 갖추고 있습니다.

| 언어 | 고급 해석 | 논리 흐름 분석 | 용도 |
| :--- | :---: | :---: | :--- |
| 🐍 **Python** | 딥 임포트 | 전체 지원 | 웹, 데이터 과학, AI |
| 🦀 **Rust** | Crate/Super/Self | `match` 및 에러 처리 | 시스템, 고성능 |
| 🇨 **C / C++** | 로컬 vs 시스템 헤더 | 제어 구조 | 레거시, 성능, 임베디드 |
| 📜 **JS / TS** | Async/Types | 전체 지원 | 웹, 확장 프로그램, 툴링 |

---

## 🚀 핵심 기능

### 🌐 토폴로지 뷰 (아키텍처 맵)
프로젝트의 폴더 구조와 파일 의존성을 실시간 네트워크로 시각화합니다.
- **Node Diet**: 노이즈(venv, node_modules, 빌드 결과물)를 자동으로 필터링합니다.
* **Ghost Node Storage**: 연결되지 않은 컴포넌트를 격리하여 작업 공간을 깨끗하게 유지합니다. ([Ghost Node 가이드 보기](GHOST_NODE.md))
- **Rule Engine**: `RULES.md`를 기반으로 일관된 탐색 및 아이콘 표준을 유지합니다.

### ➡️ 플로우 뷰 (논리 실행)
복잡한 실행 흐름을 직관적인 순서도로 투영합니다.
- **지능형 분기**: `if/else`, `loops`, `try/catch`의 고정밀 탐지.
- **Match 지원 (Rust)**: Rust의 강력한 패턴 매칭을 네이티브하게 시각화.
- **권위 있는 결과**: 수동 설계 결정과 실제 소스 코드 논리를 통합합니다.

### 🧠 지능형 컨텍스트 볼트 (Vault)
- **제로 클릭 컨텍스트 캡처 (`Ctrl+Alt+M`)**: 기록(`REC`)을 시작하면 SYNAPSE가 배경에서 팝업 없이 최신 VS Code AI 채팅 세션을 자동으로 찾아 추출합니다. 코딩이 끝나면 다시 누르기만 하면 LLM 프롬프트, 응답 및 Live Git diff가 완벽하게 문서화된 Markdown 아티팩트로 저장됩니다.
- **세만틱 줌 (LOD)**: 성능 최적화된 렌더링을 통해 수천 개의 노드를 부드럽게 탐색합니다.
- **영속성**: 전체 시각적 상태를 Git 친화적인 `project_state.json`에 저장합니다.

---

## 🧠 DTR (Density of Thought Reasoning) 엔진
SYNAPSE v0.2.18은 AI 추론 깊이와 아키텍처 밀도를 정량적으로 측정하는 **DTR 엔진**을 도입했습니다. 이는 모호한 AI 확신도를 측정 가능한 엔지니어링 지표로 변환합니다.

### 🌓 DTR 지표 스펙트럼
- **DTR (사고 밀도)**: (0.0 ~ 1.0) 특정 노드에 집중된 추론 노력을 나타냅니다. 고밀도 DTR 노드는 보라색 아우라로 발광하여 핵심 결정 지점임을 나타냅니다.
- **$\rho$ (밀도 Rho)**: 정보 압축률입니다. 단일 시각적 추상화 내에 얼마나 많은 원시 코드/논리가 함축되어 있는지를 측정합니다.
- **Think-at-N (시뮬레이션 경로)**: 현재 노드를 구체화하기 전 LLM이 시뮬레이션한 대안 아키텍처 경로의 수입니다.
- **패닉 격리**: 한 언어 클러스터(예: C++ 크래시)의 논리 오류가 시각 엔진 전체를 중단시키지 않고 구조화된 에러 코드로 보고되도록 보장하는 안전 프로토콜입니다.

---

## 🏗️ 노드 규약 (Conventions)
SYNAPSE는 다양한 컴포넌트 타입과 추론 상태를 나타내기 위해 특정 아이콘과 색상을 사용합니다.

### 📄 엔티티 타입
| 아이콘 | 타입 | 설명 |
| :---: | :--- | :--- |
| 📄 | **File** | 작업 공간의 실제 소스 파일. |
| 📁 | **Folder** | 여러 노드나 클러스터를 포함하는 디렉토리. |
| 🧩 | **Component** | 논리적 그룹 또는 추상 모듈. |
| ⚡ | **Trigger** | 진입점 또는 이벤트 소스. |

### 🎨 노드 상태 및 발광 (Glow)
| 상태 | 시각적 힌트 | 색상 | 의미 |
| :--- | :---: | :---: | :--- |
| **Active** | 실선 테두리 | 녹색계열 | 검증되었으며 현재 코드베이스에서 활성화됨. |
| **High DTR** | 보라색 발광 | 보라색 | 높은 추론 밀도; 핵심 논리 지점. |
| **Ghost** | 점선 테두리 | 회색 | 제안된 아키텍처 노드 (아직 파일로 생성되지 않음). |
| **Deleted** | 흐릿함 | 어두운 회색 | 안전하게 주석 처리/폐기된 노드. |
| **Warning** | 붉은색 펄스 | 붉은색 | 논리 오류, 순환 의존성 또는 막다른 경로 탐지. |

---

## 🔗 엣지 및 라인 규약
SYNAPSE는 노드 간의 다양한 논리적 연결과 데이터 흐름을 나타내기 위해 고유한 색상과 스타일을 사용합니다.

| 엣지 타입 | 색상 | 스타일 및 두께 | 의미 |
| :--- | :---: | :---: | :--- |
| **Dependency** | 베이지 | 실선 2px | 표준 모듈 의존성 또는 임포트. |
| **Data Flow** | 파랑 | 실선 3px | 대량 데이터 전송 또는 페이로드 이동. |
| **API Call** | 아쿠아 | 점선 2px | 외부 API 또는 서비스 간 네트워크 호출. |
| **Loop / Back**| 오렌지 | 점선(Dotted) 2px | 루프백(`while`/`for`) 또는 역방향 논리 흐름. |

---

## 🚀 시작하기

1. **확장 프로그램 설치**: Antigravity/VS Code에 `synapse-visual-architecture-v0.3.09.vsix`를 설치합니다.
2. **DNA 주입**: 프로젝트 루트에 `GEMINI.md` 파일을 생성하거나 등록합니다.
3. **부트스트랩**: 사이드바 또는 명령 팔레트(`Ctrl+Shift+P` -> `SYNAPSE: Open Canvas`)에서 **SYNAPSE Canvas**를 엽니다.
4. **첫 시각화**: 
    - 엔진이 폴더를 스캔하고 **제안된 노드 (Proposed Nodes)**를 표시합니다.
    - 팝업에서 **[Confirm]**을 클릭하여 이 노드들을 실제 파일 및 클러스터로 구체화합니다.

---

## 🛠️ 성능 및 3D 가속
SYNAPSE는 수천 개의 노드를 처리하기 위해 WebGL 기반의 고성능 렌더러를 지원합니다. 상단 툴바의 **Accel** 버튼을 통해 전환할 수 있습니다.

---

## 📜 라이선스 및 저자
[GNU General Public License v3.0](LICENSE) 하에 라이선스가 부여됩니다.  
🧠 제작: [dogsinatas29](https://github.com/dogsinatas29)
