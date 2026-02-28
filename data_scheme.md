# 📦 data_scheme.md: Data Specifications

## 💾 State Management
- **Project State (`project_state.json`)**:
  - UI Metatada: `zoom`, `offset`, `node colors`.
  - Layout Persistence: Ensures the viewport doesn't reset between updates.
- **Snapshots**: 
  - Each snapshot captures a hash of the source code and the visual layout state.

## 🔗 Schema Definitions
- **Node Status**: `Planned`, `In-Progress`, `Completed`.
- **Relationship Types**: `Dependency`, `Inference`, `Call`, `Bypass`.
