# 🧠 core_synapse.md: Visual Architecture Engine Specs

## 🏗️ Node & Edge Rendering
- **Node Geometry**:
  - `Diamond`: Logical decisions, validation (`if`, `valid_`).
  - `Hexagon`: Loops and iterations (`for`, `while`).
  - `Parallellogram`: IO operations (`print`, `data input`).
  - `Rectangle`: Standard processes.
- **Edge Mechanics**:
  - **Orthogonal (Manhattan) Routing**: 90-degree paths to avoid node overlap.
  - **Bus Lines**: Convergent edges target a virtual "Merge / Sync" terminal to reduce congestion at logical sinks (e.g., `END`).

## 🛑 Kill Signal & Inference Monitoring
- **Edge Cutting**: Severing a connection between clusters immediately triggers a "Kill Signal" to the inference engine, stopping the logic flow at the breach point.
- **Real-time Status**: `G/Y/R` (Green/Yellow/Red) state propagation from individual files up to parent clusters.

## 🎻 DataPipeline Orchestrator (v0.3.32 Sovereign Protocol)
- **Role**: 순수 함수 파이프라인의 오케스트레이터.
- **Pipeline Architecture (8-Step)**:
  1. **Scan**: `GraphAnalyzer` (기본 스캔 및 참조 추출)
  2. **Policy**: `GhostPolicy` (참조 초기 필터링)
  3. **Resolve**: `ReferenceResolver` (타겟 출처 확정)
  4. **Expand**: `GhostExpander` (미해결 참조를 능동적 Ghost 엔티티로 확장)
  5. **Build**: `EdgeBuilder` (엣지 객체 조립)
  6. **Analyze**: `analyzeGraph` (차수, 밀도 계산)
  7. **Layout**: `LayoutEngine` (물리적 배치)
  8. **Community**: `CommunityDetector` (그룹 산출)
- **Rule**: `DataPipeline` 자체는 연산/상태 변경을 캡슐화한 순수 모듈들의 결과물을 넘겨받아 "조립 및 주입(Injection)"하는 책임만 수행.
