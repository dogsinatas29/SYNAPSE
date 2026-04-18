# <img src="./resources/synapse-icon.png" width="40" height="40" /> 🧠 SYNAPSE: 비주얼 아키텍처 엔진 (v0.3.21)

> **"눈에 보이는 것이 LLM의 논리입니다"** — *AI를 위한 WYSIWYG 로직*

[![Version](https://img.shields.io/badge/version-v0.3.21-brightgreen.png)](https://github.com/dogsinatas29/SYNAPSE)
[![Latest Release](https://img.shields.io/badge/latest-v0.3.21%20Edge%20Bundling-orange.png)](https://github.com/dogsinatas29/SYNAPSE/releases)
![Status](https://img.shields.io/badge/status-Production_Ready-brightgreen.png)
[![Language](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/Platform-VS_Code-007ACC?style=flat-square)](https://code.visualstudio.com/)

[🇰🇷 한국어 버전](README.ko.md) | [🇺🇸 영어 버전](README.md)

---

## 🔥 최신 릴리즈: v0.3.21 - 시각적 일관성 및 엣지 번들링 (2026-04-18)

| 기능 | 설명 | 이점 |
|-------|---------|-----|
| **규격 동기화** | **전체 시각 규격 일치** | 25종 이상의 노드/엣지 아이콘 및 색상을 SYNAPSE 공식 명세와 1:1로 동기화했습니다. |
| **엣지 번들링** | **시각적 수렴** | 중복되는 시각적 경로를 우아한 "번들"로 병합하여 데이터 흐름 패턴을 드러냅니다. |
| **지능형 배지** | **상태 가시화** | 노드 상단에 실시간 배지(✅, 🤖, 🔒, 💣)를 표시하여 거버넌스 및 위험 상태를 즉시 파악합니다. |
| **제로-컨피그 UX**| **자동 분석 온보딩** | 설정 파일 없이 단 한 번의 클릭으로 프로젝트 아키텍처를 즉시 시각화합니다. |
| **Amnesia Guard** | **스냅샷 주권 보호** | 복잡한 동기화 과정에서 데이터 유실 및 상태 오염을 원천 차단합니다. |
| **정밀 파서 개선**| **다국어 임포트 최적화** | Rust(use), Python(relative), C++(header)의 의존성 추출 정확도를 대폭 향상했습니다. |

---

## 🔍 노드 역할 분류 (Node Role Taxonomy)

SYNAPSE v0.3.18은 연결 프로필에 따라 모든 노드를 특정 아키텍처 역할로 분류합니다:

| 역할 | 대표 색상 | 의미 | 식별 기준 | 리팩토링 우선순위 |
|:---:|:---:|:---|:---|:---:|
| **Orchestrator** | 🟠 주황색 | 중앙 제어 노드 | OutRatio ≥ 80% & 연결 수 ≥ 10 | 높음 |
| **Controller** | 🟢 녹색 | 인바운드 게이트웨이 / Facade | InRatio ≥ 80% & 연결 수 ≥ 10 | 중간 |
| **Hub** | 🔵 파란색 | 고연결 중심점 | 총 연결 수 ≥ 20 | 매우 높음 |
| **Leaf Node** | ⚪ 회색 | 유틸리티 / 터미널 함수 | 총 연결 수 ≤ 2 | 낮음 |

### 🛠️ 삼중 표현 시스템 (Triple Expression System)
- **색상 (Perception)**: 테두리 및 발광 색상을 통해 역할을 즉시 인지합니다.
- **레이어 (Focus)**: `Hide Leaf Nodes` 토글을 통해 구조적 노이즈를 제거하고 핵심에 집중합니다.
- **우선순위 (Judgment)**: 별점(`★`) 시스템을 통해 리팩토링이나 추상화의 시급성을 표시합니다.

---

## 🔍 아키텍처 진단 (R1-R5 Refined)

SYNAPSE는 아키텍처의 건전성을 위해 다음 5가지 핵심 원칙(Rules)을 실시간으로 진단합니다:
- **R1: 순환 의존성 탐지**: 모듈 간의 꼬인 루프를 즉시 식별합니다.
- **R2: 비대해진 허브(Fat Hub)**: 과도한 의존성을 가진 노드를 리팩토링 대상으로 지목합니다.
- **R3: 고립된 논리**: 물리적 파일은 존재하나 논리적으로 연결되지 않은 노드를 찾습니다.
- **R4: 불투명한 외부 의존성**: 검증되지 않은 외부 라이브러리의 무분별한 사용을 감시합니다.
- **R5: 진입점 오염**: 메인 게이트웨이에 집중된 복잡도를 분산하도록 권고합니다.

---

## 🌟 다국어 지능형 분석 (Multi-Language Intelligence)

언어에 상관없이 프로젝트의 깊은 시맨틱을 이해하는 통합 스캔 엔진을 제공합니다.

| 언어 | 고급 해결 기능 | 논리 흐름 분석 | 권장 용도 |
| :--- | :---: | :---: | :--- |
| 🐍 **Python** | 딥 임포트 | 풀 지원 | 웹, 데이터 과학, AI |
| 🦀 **Rust** | Crate/Super/Self | `match` 및 에러 처리 | 시스템, 고성능 컴퓨팅 |
| 🇨 **C / C++** | 로컬 vs 시스템 헤더 | 제어 구조 | 레거시, 성능, 임베디드 |
| 📜 **JS / TS** | 비동기 / 타입 | 풀 지원 | 웹, 확장 프로그램, 툴링 |

---

## 🚀 핵심 기능

### 🌐 토폴로지 뷰 (아키텍처 맵)
프로젝트의 폴더 구조와 파일 의존성을 실시간 네트워크로 시각화합니다.

- **역할 기반 식별 (v0.3.18)**: 모든 노드가 자동으로 Orchestrator, Controller, Hub 등으로 분류됩니다.
- **전략적 아키텍처 정렬 (v0.3.20)**: 스프링 바이어스 레이아웃을 통해 노드들이 자연스럽게 아키텍처 레인으로 정렬됩니다.
- **시맨틱 핫스팟 매핑 (v0.3.20)**: "의미 있는 덩어리"를 식별하여 역할 색상의 점선 상자로 그룹화합니다.
- **엣지 번들링 라이트 (v0.3.21)**: 여러 개의 엣지를 하나의 유려한 "번들"로 병합하여 데이터 흐름을 시각화합니다.
- **진단 지능**: 수치적 근거를 바탕으로 리팩토링 힌트(R1-R5)를 상황별로 보고합니다.
- **노드 다이어트**: venv, node_modules 등 불필요한 노이즈를 자동으로 필터링합니다.

### ➡️ 플로우 뷰 (논리 실행)
복잡한 실행 흐름을 직관적인 순서도로 투영합니다.
- **지능형 분기**: `if/else`, `loops`, `try/catch` 고정밀 감지.
- **패턴 매칭 (Rust)**: Rust의 강력한 `match` 구문을 기본 시각화합니다.

### 🧠 영속성 및 상태 관리
- **시맨틱 줌 (LOD)**: 수천 개의 노드를 부드럽게 탐색할 수 있는 성능 최적화 렌더링.
- **그리드 주권**: 모든 노드 위치를 40px 그리드로 정규화하여 시각적 질서를 유지합니다.
- **상태 보존**: 전체 시각적 상태를 Git 친화적인 `project_state.json`으로 저장합니다.

---

## 🏗️ 노드 규격 (Node Conventions)

### 1. 📄 엔터티 타입 (Identity Icons)
노드의 물리적 성격이나 아키텍처 역할을 정의합니다.

| 아이콘 | 타입 | 의미 | 시각적 스타일 |
| :---: | :--- | :--- | :--- |
| **📄** | **Active Source** | 물리적 소스 파일 (Logic, Config 등). | 실선 테두리, 기본 색상 |
| **⚡** | **Atomic Logic** | 핵심 로직 또는 진입점 (`Atomic` 서명 포함). | 보라색 발광 (DTR) |
| **📁** | **Folder** | 디렉토리 구조 클러스터. | 폴더 클러스터 컨테이너 |
| **☁️** | **External API** | 외부 라이브러리(os, fs) 또는 API 호출 의존성. | 클라우드 형태 UI |
| **📚** | **Doc Shelf** | 마일스톤, 릴리즈 노트, 아키텍처 문서. | 기본적으로 숨김 처리 |
| **🧪** | **Test Case** | 유닛 테스트 및 검증 스크립트 (`.test.ts`). | 주황색 테두리 |
| **🧩** | **Component** | 모듈형 UI 또는 논리적 컴포넌트 단위. | 청록색(Aqua) 테두리 |
| **⚙️** | **Processor** | 데이터 변환 또는 연산 엔진. | 보라색-회색 테두리 |
| **🤝** | **Service** | 공유 로직 또는 인프라 서비스 레이어. | 파란색 테두리 |
| **⛩️** | **Gate** | 보안, 인증 또는 트래픽 제어기. | 두꺼운 노란색 테두리 |
| **📋** | **Data Record** | DB 스키마, JSON 모델 또는 순수 데이터 정의. | 두꺼운 테두리, 어두운 배경 |
| **👻** | **Ghost Source** | 참조되지만 물리적 파일이 없는 내부 소스. | 점선 테두리 |

### 2. 🎨 노드 상태 및 발광 (Status & Glow)
노드의 현재 추론 상태와 시각적 중요도를 정의합니다.

| 상태 | 시각적 힌트 | 색상 | 의미 |
| :--- | :---: | :---: | :--- |
| **Active** | 실선 테두리 | ![#83a598](https://via.placeholder.com/15/83a598/000000?text=+) | 검증되었으며 현재 코드베이스에서 활성화됨. |
| **High DTR** | 보라색 발광 | ![#8a2be2](https://via.placeholder.com/15/8a2be2/000000?text=+) | 높은 사고 밀도; 핵심적인 논리 지점. |
| **Ghost** | 점선 테두리 | ![#928374](https://via.placeholder.com/15/928374/000000?text=+) | 제안된 아키텍처 노드 (아직 실체화되지 않음). |
| **Deleted** | 회색 처리 | ![#282828](https://via.placeholder.com/15/282828/000000?text=+) | 안전하게 주석 처리되거나 제거된 노드. |
| **Warning** | 빨간색 맥동 | ![#fb4934](https://via.placeholder.com/15/fb4934/000000?text=+) | 논리 에러, 순환 의존성 또는 막다른 길 감지. |
| **Necrosis** | 💀 | ![#1d2021](https://via.placeholder.com/15/1d2021/000000?text=+) | 치명적 논리 실패; 빌드 파손 또는 심각한 결함. |
| **Tombstone** | 🪦 | ![#1d2021](https://via.placeholder.com/15/1d2021/000000?text=+) | 복구 불가능한 결정론적 실패; 삭제 권고. |

### 3. ➡️ 논리 및 흐름 마커 (Logic & Flow Markers)
줌 레벨(LOD)에 따라 노드나 엣지에 나타나는 마커입니다.

| 아이콘 | 타입 | 의미 |
| :---: | :--- | :--- |
| **↻** | **Loop** | 반복 논리 (`for`, `while`, `map`). |
| **◈** | **Decision** | 분기 논리 (`if`, `switch`, 검증). |
| **🖨️** | **Output** | 터미널 로그, 출력 또는 사이드 이펙트. |
| **📡** | **Signal** | 네트워크 요청 또는 원격 프로시저 호출 (RPC). |
| **📊** | **Payload** | 대역폭이 높은 데이터 이동 또는 스트림. |
| **🕒** | **Async** | 비동기 처리 또는 대기 상태. |

### 4. ⚠️ 위험 및 정화 마커 (Hazard & Purification)
시스템 정화도와 아키텍처 건강 상태를 나타내는 시각적 지표입니다.

| 아이콘 | 타입 | 의미 | 시각적 스타일 |
| :---: | :--- | :--- | :--- |
| **💀** | **Necrosis** | 아키텍처 실패 (순환 의존성 등). | 어두운 배경 + 노이즈 |
| **🪦** | **Tombstone** | 지속적인 결정론적 위반 기록. | 묘비 마커 |
| **💣** | **Mine** | 고위험 지점 (브레이킹 체인지 감지). | Red-out 경고 |
| **⚠️** | **Logic Fault**| 특정 코드 수준의 에러 또는 동기화 실패. | 빨간색 맥동 / 경고 아이콘 |
| **🔴** | **Dirty Dot** | 동기화/푸시가 필요한 로컬 변경 사항. | 우측 상단 빨간 점 |

### 5. ✅ 상호작용 및 승인 배지
동기화 및 사용자 명령 상태를 나타내는 지능형 배지입니다.

| 배지 | 상태 | 의미 |
| :---: | :--- | :--- |
| **✅** | **Confirmed** | 지휘관(사용자)에 의해 수동 승인됨. |
| **🤖** | **AI Validated**| 코드베이스를 바탕으로 자동 검증됨. |
| **❓** | **Pending** | 제안된 설계로 검증 대기 중 (Draft). |
| **❌** | **Purge** | 물리적 제거 또는 삭제 대상으로 마킹됨. |
| **🔒** | **Locked** | 불변 상태; 수정으로부터 보호됨. |

---

## 🔗 엣지 및 선 규격 (Edge & Line Conventions)

노드 간의 논리적 연결과 데이터 흐름을 서로 다른 색상과 스타일로 표현합니다.

| 엣지 타입 | 색상 | 스타일 및 두께 | 의미 |
| :--- | :---: | :---: | :--- |
| **Dependency** | ![#ebdbb2](https://via.placeholder.com/15/ebdbb2/000000?text=+) | 실선 2px | 표준 모듈 의존성 또는 임포트. |
| **Data Flow** | ![#83a598](https://via.placeholder.com/15/83a598/000000?text=+) | 실선 3px | 대량의 데이터 전송 또는 페이로드 이동. |
| **Event** | ![#fe8019](https://via.placeholder.com/15/fe8019/000000?text=+) | 실선 2px | 이벤트 트리거 또는 비동기 콜백. |
| **Conditional** | ![#d3869b](https://via.placeholder.com/15/d3869b/000000?text=+) | 실선 1px | if/else 또는 match와 같은 조건부 분기. |
| **Origin** | ![#d65d0e](https://via.placeholder.com/15/d65d0e/000000?text=+) | 실선 1.5px | AI 논리 추적을 위한 프롬프트 기원 링크. |
| **API Call** | ![#8ec07c](https://via.placeholder.com/15/8ec07c/000000?text=+) | 점선 2px | 외부 API 또는 서비스 간 네트워크 호출. |
| **DB Query** | ![#d3869b](https://via.placeholder.com/15/d3869b/000000?text=+) | 실선 3px | 데이터베이스 쿼리, 뮤테이션 또는 트랜잭션. |
| **Loop / Back**| ![#fe8019](https://via.placeholder.com/15/fe8019/000000?text=+) | 점선 2px | 루프백 (`while`/`for`) 또는 역방향 논리 흐름. |
| **Highlighted**| ![#fabd2f](https://via.placeholder.com/15/fabd2f/000000?text=+) | 펄스 5px | 활성 실행 경로 (호버링/선택됨). |

---

## 📸 시각적 개요 (Visual Overview)

### 프로젝트 토폴로지 (Project Topology)
LLM 추론 논리와 실제 소스 파일 간의 물리적 연결을 시각화합니다.
![Topology View](assets/v0.3.21/synapse_topology_v0.3.21.png)

### 노드 정보 요약 (v0.3.17)
노드 위에 마우스를 올리면 연결 수, IN/OUT 차수 등 구조적 지표를 즉시 확인합니다.
![Node Summary](resources/screenshots/v0.3.17/node_summary.png)

### 미니멀리스트 로직 뷰 (v0.3.16)
시각적 노이즈를 줄이면서도 선택된 노드의 논리적 연결성은 유지할 수 있습니다.
![Minimalist View](./resources/screenshots/v0.3.16/minimalist_view.png)

### 계층형 트리 (Hierarchical Tree)
프로젝트 구조에 대한 깊이 있고 조직화된 개요를 제공합니다.
![Tree View](./assets/v0.2.16/synapse_tree_v0.2.16.png)

---

## 🛠️ 성능 및 시스템 요구사항

### 폰트 스택 (아이콘 렌더링에 필수)
**중요**: SYNAPSE는 시각화에 현대적인 이모지 아이콘(🔗, 🛢️, 📡, 📊 등)을 사용합니다. 이를 위해 적절한 이모지 폰트 지원이 필요합니다.

**권장 폰트 스택**:
1. Noto Color Emoji (구글의 통합 이모지 폰트)
2. Apple Color Emoji (macOS 기본)
3. Segoe UI Emoji (Windows 10+ 기본)

| OS | 설치 방법 | 명령어 |
|----|--------------|---------| 
| **Linux (Ubuntu/Debian)** | Noto Color Emoji 설치 | `sudo apt-get install fonts-noto-color-emoji` |
| **macOS** | 기본 탑재 | 별도 설치 불필요 |
| **Windows 10+** | 기본 탑재 | 별도 설치 불필요 |

---

## 🚀 시작하기

1. **확장 프로그램 설치**: `synapse-visual-architecture-v0.3.21.vsix`를 설치합니다.
2. **캔버스 열기**: 에디터 우측 상단 또는 사이드바의 **🧠 캔버스 아이콘**을 클릭합니다.
3. **즉시 분석**: 데이터가 없는 경우 **"자동 분석 시작 (Lite Bootstrap)"**을 선택하여 즉시 아키텍처를 확인합니다.

---

## 🆕 수정 이력 (Summary)

| 버전 | 날짜 | 설명 |
| :--- | :--- | :--- |
| **v0.3.21** | 2026-04-18 | **시각적 일관성 및 엣지 번들링**: 전체 시각 규격 동기화, 베지어 흐름 통합 및 스냅샷 무결성을 위한 Amnesia Guard 도입. |
| **v0.3.20** | 2026-04-17 | **Rust Persistence & 엔진 안정화**: Rust 지원을 위한 경로 기반 ID 도입, 물리 시뮬레이션 폭주 방지 및 로드 성능 가이드 강화. |
| **v0.3.19** | 2026-04-17 | **Top-N 포커스 뷰**: 상위 10개 핵심 노드 자동 식별 및 1-hop 맥락 확장 모드 도입. |
| **v0.3.18** | 2026-04-17 | **진단 힌트 엔진**: 실시간 아키텍처 분석(R1-R5), Zero-Unknown 시맨틱 라벨링 출력. |
| **v0.3.17** | 2026-04-14 | **노드 요약 정보 출력**: 노드 호버 시 고유 연결 및 의존성을 보여주는 요약 툴팁 추가. |
| **v0.3.16** | 2026-04-14 | **미니멀리스트 로직 뷰**: 엣지 및 배지 가시성 토글 기능 및 O(1) 렌더링 스킵 구현. |

---

## 📜 라이선스 및 작성자
[GNU General Public License v3.0](LICENSE)에 따라 라이선스가 부여됩니다.  
작성자: [dogsinatas29](https://github.com/dogsinatas29)
