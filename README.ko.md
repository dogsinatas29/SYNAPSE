# <img src="./resources/synapse-icon.png" width="40" height="40" /> SYNAPSE

> **LLM 시스템을 위한 비주얼 아키텍처 엔진**

**코드를 읽지 말고, 아키텍처를 보십시오.**

[![Version](https://img.shields.io/badge/version-v0.3.22.10-brightgreen.png)](https://github.com/dogsinatas29/SYNAPSE)
[![Latest Release](https://img.shields.io/badge/latest-v0.3.22.10%20Rendering%20Parity-orange.png)](https://github.com/dogsinatas29/SYNAPSE/releases)
![Status](https://img.shields.io/badge/status-Production_Ready-brightgreen.png)

[🇺🇸 English Version](./README.md)


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

![Interaction Demo](assets/synapse_feature_demo.webp)
*줌 인/아웃, 레이어 가시성 제어, 트래픽 히트맵 시연 영상.*

![Zoom Detail Demo](assets/synapse_zoom_detail.webp)
*상세 줌 인 시연 (아이콘, 배지 및 툴팁 가시성).*

![Topology View](assets/v0.3.21/synapse_topology_v0.3.21.png)
*SYNAPSE가 자기 자신의 아키텍처를 분석한 실제 화면.*

---

## 🎨 Visual Language & Conventions (시각 언어 및 규격)

SYNAPSE는 아키텍처의 특성과 상태를 명확하게 전달하기 위해 풍부한 시각적 언어를 사용합니다.

### 1. 📄 Entity Types (Identity Icons - 정체성 아이콘)
노드의 물리적 성격이나 아키텍처적 역할을 정의합니다.

| 아이콘 | 타입 | 의미 | 시각적 스타일 |
| :--- | :--- | :--- | :--- |
| 📄 | Active Source | 물리적 소스 파일 (로직, 설정 등). | 실선 테두리, 기본 색상 |
| ⚡ | Atomic Logic | 핵심 로직 또는 진입점 (Atomic 시그니처 포함). | 보라색 글로우 (DTR) |
| 📁 | Folder | 디렉토리 구조 클러스터. | 폴더 클러스터 컨테이너 |
| ☁️ | External API | 외부 라이브러리(os, fs) 또는 API 호출 종속성. | 클라우드 형태 UI |
| 📚 | Doc Shelf | 마일스톤, 릴리스 노트, 아키텍처 문서. | 캔버스에서 기본 숨김 |
| 🧪 | Test Case | 단위 테스트 및 검증 스크립트 (.test.ts). | 주황색 테두리 |
| 🧩 | Component | 모듈형 UI 또는 논리적 컴포넌트 단위. | 청록색 테두리 |
| ⚙️ | Processor | 데이터 변환 또는 계산 엔진. | 보라-회색 테두리 |
| 🤝 | Service | 공유 로직 또는 인프라 서비스 레이어. | 파란색 테두리 |
| ⛩️ | Gate | 보안, 인증 또는 트래픽 제어기. | 두꺼운 노란색 테두리 |
| 📋 | Data Record | DB 스키마, JSON 모델 또는 순수 데이터 정의. | 두꺼운 테두리, 어두운 배경 |
| 👻 | Ghost Source | 참조되었으나 물리적 파일이 없는 내부 소스. | 점선 테두리 |

### 2. 🎨 Node Status & Glow (노드 상태 및 발광)
노드의 현재 추론 상태와 시각적 중요도를 정의합니다.

| 상태 | 시각적 힌트 | 색상 | 의미 |
| :--- | :--- | :--- | :--- |
| **Active** | 실선 테두리 | `#83a598` | 검증되었으며 현재 코드베이스에서 활성화된 상태. |
| **High DTR** | 보라색 글로우 | `#8a2be2` | 높은 추론 밀도; 핵심 로직 지점. |
| **Ghost** | 점선 테두리 | `#928374` | 제안된 아키텍처 노드 (아직 구현되지 않음). |
| **Deleted** | 회색 처리 | `#282828` | 안전하게 주석 처리되거나 제거된 노드. |
| **Warning** | 빨간색 펄스 | `#fb4934` | 로직 에러, 순환 종속성 또는 막다른 길 감지. |
| **Necrosis** | 💀 | `#1d2021` | 치명적 로직 실패; 빌드 깨짐 또는 심각한 결함. |
| **Tombstone** | 🪦 | `#1d2021` | 회복 불가능한 결정론적 실패; 삭제 권장. |

### 3. ➡️ Logic & Flow Markers (로직 및 흐름 마커)
줌 레벨(LOD)에 따라 노드나 엣지에 나타나는 마커입니다.

| 아이콘 | 타입 | 의미 |
| :--- | :--- | :--- |
| ↻ | Loop | 반복 로직 (for, while, map). |
| ◈ | Decision | 분기 로직 (if, switch, 검증). |
| 🖨️ | Output | 터미널 로깅, 출력 또는 사이드 이펙트 발생. |
| 📡 | Signal | 네트워크 요청 또는 원격 프로시저 호출 (RPC). |
| 📊 | Payload | 대역폭이 큰 데이터 이동 또는 스트림. |
| 🕒 | Async | 비동기 처리 또는 대기 상태. |

### 4. ⚠️ Hazard & Purification Markers (위험 및 정화 마커)
시스템 순수성과 아키텍처 건전성을 나타내는 지표입니다.

| 아이콘 | 타입 | 의미 | 시각적 스타일 |
| :--- | :--- | :--- | :--- |
| 💀 | Necrosis | 아키텍처 실패 (순환 종속성 등). | 어두운 배경 + 노이즈 |
| 🪦 | Tombstone | 지속적인 결정론적 위반 기록. | 묘비 마커 |
| 💣 | Mine | 고위험 지점 (파괴적 변경 감지). | 빨간색 경고 |
| ⚠️ | Logic Fault | 특정 코드 레벨 에러 또는 동기화 실패. | 빨간색 펄스 / 경고 아이콘 |
| 🔴 | Dirty Dot | 동기화/푸시가 필요한 로컬 변경 사항. | 우측 상단 빨간 점 |

### 5. ✅ Interaction & Approval Badges (상호작용 및 승인 배지)
동기화 및 사용자 명령 상태를 나타내는 지능형 배지입니다.

| 배지 | 상태 | 의미 |
| :--- | :--- | :--- |
| ✅ | Confirmed | 지휘관(사용자)에 의해 수동 승인됨. |
| 🤖 | AI Validated | 코드베이스를 바탕으로 자동 검증됨. |
| ❓ | Pending | 검증 대기 중인 제안된 설계 (초안). |
| ❌ | Purge | 물리적 제거 또는 삭제 대상으로 표시됨. |
| 🔒 | Locked | 불변 상태; 수정으로부터 보호됨. |

### 🔗 Edge & Line Conventions (엣지 및 라인 규격)
SYNAPSE는 노드 간의 다양한 논리적 연결과 데이터 흐름을 표현하기 위해 고유한 색상과 스타일을 사용합니다.

| 엣지 타입 | 색상 | 스타일 및 두께 | 의미 |
| :--- | :--- | :--- | :--- |
| **Dependency** | `#ebdbb2` | 실선 2px | 표준 모듈 종속성 또는 임포트. |
| **Data Flow** | `#83a598` | 실선 3px | 대량 데이터 전송 또는 페이로드 이동. |
| **Event** | `#fe8019` | 실선 2px | 이벤트 트리거 또는 비동기 콜백. |
| **Conditional** | `#d3869b` | 실선 1px | if/else 또는 match와 같은 조건부 분기. |
| **Origin** | `#d65d0e` | 실선 1.5px | AI 로직 추적을 위한 프롬프트 기원 링크. |
| **API Call** | `#8ec07c` | 점선 2px | 외부 API 또는 서비스 간 네트워크 호출. |
| **DB Query** | `#d3869b` | 실선 3px | 데이터베이스 쿼리, 뮤테이션 또는 트랜잭션. |
| **Loop / Back** | `#fe8019` | 점선 2px | 루프백(while/for) 또는 역방향 로직 흐름. |
| **Highlighted** | `#fabd2f` | 펄스 5px | 활성화된 실행 경로 (호버/선택됨). |

## 🚀 빠른 시작 (Quick Start)

단 몇 초 만에 아키텍처 탐색을 시작할 수 있습니다.

### 1. 확장 프로그램 설치
[Releases](https://github.com/dogsinatas29/SYNAPSE/releases)에서 최신 `.vsix`를 다운로드하고 실행합니다:
```bash
code --install-extension synapse-visual-architecture-v0.3.22.10.vsix
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
| **v0.3.22.10** | 2026-04-20 | **렌더링 패리티 및 정체성 바인딩 (SSoT)**: 2D/3D 시각적 동기화 완료 및 SSoT 기반 툴팁 정체성 바인딩을 통한 100% 데이터 정합성 확보. |
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
