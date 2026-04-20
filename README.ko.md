# <img src="./resources/synapse-icon.png" width="40" height="40" /> SYNAPSE

> **LLM 시스템을 위한 비주얼 아키텍처 엔진**

**코드를 읽지 말고, 아키텍처를 보십시오.**

[![Version](https://img.shields.io/badge/version-v0.3.22-brightgreen.png)](https://github.com/dogsinatas29/SYNAPSE)
[![Latest Release](https://img.shields.io/badge/latest-v0.3.22%20Rendering%20Parity-orange.png)](https://github.com/dogsinatas29/SYNAPSE/releases)
![Status](https://img.shields.io/badge/status-Production_Ready-brightgreen.png)

---

## 💡 SYNAPSE란 무엇인가요?

SYNAPSE는 LLM 기반 시스템의 내부 구조를 실시간 그래프로 시각화하는 고성능 엔진입니다.

- **실행 흐름 추적**: 논리 경로를 즉시 시각화합니다.
- **의존성 그래프 분석**: 복잡한 모듈 관계를 매핑합니다.
- **아키텍처 드리프트 감지**: 코드와 설계 간의 차이를 식별합니다.

## ⚠️ 문제점 (Problem)

LLM 기반 시스템은 다음과 같은 구조적 도전 과제에 직면해 있습니다:
- **보이지 않는 흐름**: 내부 논리 경로가 추상화 뒤에 숨겨져 있습니다.
- **의존성 폭발**: 관계가 빠르게 복잡해져 관리가 불가능해집니다.
- **불가능한 디버깅**: 시스템의 전체 구조를 디버깅하는 것이 근본적으로 어렵습니다.

## ✅ 해결책 (Solution)

SYNAPSE는 실행 흐름과 구조를 인터랙티브 그래프로 투영하여, 시스템을 "읽는 것"에서 "보는 것"으로 전환합니다.

## 📸 데모 (Demo)

![Topology View](assets/v0.3.21/synapse_topology_v0.3.21.png)
*SYNAPSE가 자기 자신의 아키텍처를 분석한 실제 화면.*

## 🚀 빠른 시작 (Quick Start)

단 몇 초 만에 아키텍처 탐색을 시작할 수 있습니다.

### 1. 확장 프로그램 설치
[Releases](https://github.com/dogsinatas29/SYNAPSE/releases)에서 최신 `.vsix`를 다운로드하고 실행합니다:
```bash
code --install-extension synapse-visual-architecture-v0.3.22.vsix
```

### 2. 캔버스 실행
에디터 제목 표시줄이나 사이드바의 **🧠 캔버스 아이콘**을 클릭합니다.

### 3. 즉시 분석
**"자동 분석 시작 (Lite Bootstrap)"**을 선택하여 프로젝트 아키텍처를 자동으로 탐색합니다.

---

## ✨ 핵심 기능 (Key Features)

- **🧠 실시간 그래프 시각화**: 프로젝트의 라이브 네트워크 매핑.
- **🔍 N-hop 포커스 뷰**: 핵심 노드 자동 식별 및 맥락 탐색.
- **⚠️ 지능형 진단**: 실시간 아키텍처 건전성 분석 (R1-R5).
- **🧩 AI 스캔 통합**: Python, Rust, C++, TS를 아우르는 통합 스캔 엔진.
- **시맨틱 줌 (LOD)**: 수천 개의 노드를 성능 저하 없이 탐색.

---

## 🔍 포커스 뷰 (Focus View, N-hop)

특정 노드를 기준으로 N단계까지의 연결만 추출하여 복잡한 전체 그래프에서 **국소 구조(Local Context)**만 집중적으로 분석할 수 있습니다.

![Focus View Demo](./resources/screenshots/v0.3.22/focus_view.png)
*중심 노드 C와 직접 연결된 이웃들(N=1)만 고립시켜 분석하는 화면.*

### 예시 (Example)

**전체 그래프 (Full Graph):**
```text
A ─ B ─ C ─ D ─ E  
│   │  
F   G ─ H ─ I  
```

---

**포커스 뷰 (N = 1, 중심점 = C):**
```text
B ─ C ─ D  
    │  
    G  
```

---

**포커스 뷰 (N = 2, 중심점 = C):**
```text
A ─ B ─ C ─ D ─ E  
│       │  
F       G ─ H  
```

### 왜 중요한가요?
- **범위 즉시 축소**: 거대한 그래프에서 디버깅 범위를 즉시 좁힐 수 있습니다.
- **실행 흐름 추적**: 특정 로직의 전후 맥락만 빠르게 추적합니다.
- **국소 이상 탐지**: 특정 영역 내의 구조적 결함에 정밀하게 진단합니다.

---

---

## 🏗️ 아키텍처 (Architecture)

SYNAPSE는 다음과 같은 레이어로 구성됩니다:
- **Scanner**: 다국어 시맨틱 정밀 분석기.
- **Graph Engine**: 결정론적 불변 상태 머신.
- **Visualization Layer**: 하이브리드 2D 캔버스 및 3D WebGL 가속 렌더러.
- **AI Merge Logic**: 유령 참조와 실제 파일 간의 지능형 매핑 로직.

---

## 🧠 철학 (Philosophy)

**"눈에 보이는 것이 LLM의 논리입니다"**

SYNAPSE는 코드 중심 개발의 한계를 극복하기 위해 만들어졌습니다. LLM의 추론과 물리적 아키텍처 사이의 간극을 메우고, 추상적인 논리를 인터랙티브한 고성능 네트워크로 전환합니다.

---

## 🆕 수정 이력 (v0.3.x)

| 버전 | 날짜 | 설명 |
| :--- | :--- | :--- |
| **v0.3.22** | 2026-04-20 | **렌더링 동기화 및 지능형 툴팁**: 2D/3D 시각적 완전 동기화, 정체성 바인딩이 적용된 데바운스 툴팁 도입. |
| **v0.3.21** | 2026-04-18 | **시각적 일관성 및 엣지 번들링**: 전체 시각 규격 동기화, 베지어 흐름 통합. |
| **v0.3.20** | 2026-04-17 | **Rust 지원 및 엔진 안정화**: Rust 대응 ID 도입, 물리 시뮬레이션 폭주 방지. |

---

## 📅 상태 및 로드맵

- **현재 상태**: v0.3.22 – 핵심 기능 안정화 완료.
- **향후 계획**:
    - 원격 분석을 위한 서버 / 클라이언트 분리.
    - 5만 개 이상의 노드를 위한 성능 최적화.
    - 실시간 협업 아키텍처 설계 기능.

---

## 📜 라이선스 및 작성자
[GNU General Public License v3.0](LICENSE)에 따라 라이선스가 부여됩니다.  
작성자: [dogsinatas29](https://github.com/dogsinatas29)
