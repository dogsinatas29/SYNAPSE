# <img src="./resources/synapse-icon.png" width="40" height="40" /> 🧠 SYNAPSE: 비주얼 아키텍처 엔진 (v0.3.21)

> **"당신이 보는 것은 LLM의 논리입니다"** — *AI를 위한 WYSIWYG 논리 가시화*

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

SYNAPSE는 모든 노드를 연결 프로필에 따라 특정 아키텍처 역할로 분류합니다:

| 역할 | 대표 색상 | 의미 | 식별 기준 | 리팩토링 우선순위 |
|:---:|:---:|:---|:---|:---:|
| **Orchestrator** | 🟠 주황색 | 중앙 제어 노드 | OutRatio ≥ 80% & Conn ≥ 5 | 높음 |
| **Controller** | 🟢 녹색 | 인바운드 게이트웨이 | InRatio ≥ 80% & Conn ≥ 5 | 중간 |
| **Hub** | 🔵 파란색 | 고연결 중심점 | 총 연결 수 ≥ 15 | 매우 높음 |
| **Leaf Node** | ⚪ 회색 | 유틸리티 / 터미널 함수 | 총 연결 수 ≤ 3 | 낮음 |
| **Standard** | 🟡 베이지 | 일반 컴포넌트 | 기본 분류 | 낮음 |

---

## 📸 시각적 개요 (Visual Overview)

### 프로젝트 토폴로지 (Project Topology)
LLM 추론 논리와 실제 소스 파일 간의 물리적 연결을 시각화합니다.
![Topology View](assets/v0.3.21/synapse_topology_v0.3.21.png)

### 노드 정보 요약 (v0.3.17)
노드 위에 마우스를 올리면 연결 수, IN/OUT 차수 등 구조적 지표를 즉시 확인하여 책임 영역과 의존성 클러스터를 빠르게 식별할 수 있습니다.
![Node Summary](resources/screenshots/v0.3.17/node_summary.png)

### 미니멀리스트 로직 뷰 (v0.3.16)
엣지와 배지의 가시성을 토글하여 시각적 노이즈를 줄이면서도 선택된 노드의 논리적 연결성은 유지할 수 있습니다.
![Minimalist View](./resources/screenshots/v0.3.16/minimalist_view.png)

### 계층형 트리 (Hierarchical Tree)
프로젝트 구조에 대한 깊이 있고 조직화된 개요를 제공합니다.
![Tree View](./assets/v0.2.16/synapse_tree_v0.2.16.png)

---

## 🚀 시작하기

순식간에 시각적 아키텍처 여정을 시작하세요.

1. **확장 프로그램 설치**: Antigravity/VS Code에 `synapse-visual-architecture-v0.3.21.vsix`를 설치합니다.
2. **캔버스 열기**: 에디터 우측 상단 또는 사이드바의 **🧠 캔버스 아이콘**을 클릭합니다.
3. **즉시 분석**: 데이터가 없는 경우 **"자동 분석 시작 (Lite Bootstrap)"**을 선택하여 즉시 아키텍처를 확인합니다.

---

## 🆕 수정 이력 (Summary)

| 버전 | 날짜 | 설명 |
| :--- | :--- | :--- |
| **v0.3.21** | 2026-04-18 | **시각적 일관성 및 엣지 번들링**: 전체 시각 규격 동기화, 베지어 흐름 통합 및 스냅샷 무결성을 위한 Amnesia Guard 도입. |
| **v0.3.20** | 2026-04-17 | **Rust Persistence & 엔진 안정화**: Rust 지원을 위한 경로 기반 ID 도입, 물리 시뮬레이션 폭주 방지 및 로드 성능 가이드 강화. |
| **v0.3.19** | 2026-04-17 | **Top-N 포커스 뷰**: 1-hop 맥락 확장을 포함한 상위 10개 핵심 노드 자동 식별 및 글로벌 탐색 모드 도입. |
| **v0.3.18** | 2026-04-17 | **진단 힌트 엔진**: 실시간 아키텍처 분석(R1-R5), Zero-Unknown 시맨틱 라벨링 및 툴팁 내 상세 연결 노드 리스트 출력. |
| **v0.3.17** | 2026-04-14 | **노드 요약 정보 출력**: 노드 호버 시 고유 연결 및 방향성 의존성을 보여주는 요약 툴팁 추가 및 O(E) 성능 최적화. |
| **v0.3.16** | 2026-04-14 | **미니멀리스트 로직 뷰**: 엣지 및 배지 가시성 토글 기능 도입. 선택된 노드의 엣지 반투명 노출 및 O(1) 렌더링 스킵 구현. |
| **v0.3.15** | 2026-04-13 | **쉘프 fzf 및 그리드 주권**: documentation 노드 대상 `/` 단축키 검색 기능, 40px 격자 스냅 및 강조 하이라이트 효과 도입. |

---

## 📜 라이선스 및 작성자
Licensed under the [GNU General Public License v3.0](LICENSE).  
Created with 🧠 by [dogsinatas29](https://github.com/dogsinatas29)

---
**이 프로젝트는 fzf를 사용합니다 (MIT License)**
