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
