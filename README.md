# <img src="./resources/synapse-icon.png" width="40" height="40" /> 🧠 SYNAPSE: Visual Architecture Engine (v0.3.10)

> **"What you see is the logic of LLM"** — *WYSIWYG Logic for AI*

[![Version](https://img.shields.io/badge/version-v0.3.10-brightgreen.png)
[![Latest Release](https://img.shields.io/badge/latest-v0.3.10%20Hard%20Lock%20Edition-orange.png)
![Status](https://img.shields.io/badge/status-Production_Ready-brightgreen.png)
[![Language](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/Platform-VS_Code-007ACC?style=flat-square)](https://code.visualstudio.com/)

[🇰🇷 Korean Version](README.ko.md) | [🇺🇸 English Version](README.md)

---

## 🔥 Latest Release: v0.3.10 - Hard Lock Protocol & Click Resilience (2026-04-07)

### ✅ Architectural Breakthroughs
**v0.3.10** introduces the **Hard Lock Protocol**, bridging the gap between manual UI design and physical file atomicity:

| Feature | Description | Benefit |
|-------|---------|-----|
| **Hard Lock Protocol** | Atomic `fs.writeFile` + `fs.stat` verification | Guarantees physical file existence before UI 'Solid' state. |
| **Click Resilience** | Intelligent Label-priority Fallback (`test.py`) | Fixes click failures for manual nodes with system IDs. |
| **ID Persistence** | Unified ID mapping (Extension ↔ WebView) | Instant node migration to Buffer Cluster without refresh. |
| **Data Integrity** | Ghost Edge Pruning (Filtering 14 -> 12) | 1:1 parity between visual edges and information statistics. |
| **Boot Hardening** | Null-safety guards + CSP 403 Resolution | Elimination of initialization crashes and asset loading errors. |

---

**SYNAPSE** is a next-generation visual control tower for **Google Antigravity** and **VS Code**. It bridges the gap between Large Language Model (LLM) reasoning and physical code architecture, transforming abstract logic into an interactive, high-performance node-edge network.

## 🌟 Multi-Language Intelligence (New in v0.2.11)

SYNAPSE now features a unified scanning engine that understands the deep semantics of your project, regardless of the language.

| Language | Advanced Resolution | Logic Flow Analysis | Best For |
| :--- | :---: | :---: | :--- |
| 🐍 **Python** | Deep Imports | Full Support | Web, Data Science, AI |
| 🦀 **Rust** | Crate/Super/Self | `match` & Error Handling | Systems, High Performance |
| 🇨 **C / C++** | Local vs System Headers | Control Structures | Legacy, Performance, Embedded |
| 📜 **JS / TS** | Async/Types | Full Support | Web, Extensions, Tooling |

---

## 🚀 Key Capabilities

### 🌐 Topology View (Architecture Map)
Visualize your project's folder structure and file dependencies as a live network.
- **Node Diet**: Automatically filters noise (venv, node_modules, build artifacts).
- **Ghost Node Storage**: Keeps your workspace clean by isolating disconnected components. ([View Ghost Node Guide](GHOST_NODE.md))
- **Rule Engine**: Guided by `RULES.md` for consistent discovery and icon standards.

### ➡️ Flow View (Logic Execution)
Project complex execution flows into intuitive flowcharts.
- **Intelligent Branching**: High-fidelity detection of `if/else`, `loops`, and `try/catch`.
- **Match Support (Rust)**: Native visualization of Rust's powerful pattern matching.
- **Authoritative Result**: Integrates manual design decisions with real source code logic.

### 🧠 Intelligent Context Vault
- **Zero-Click Context Capture (`Ctrl+Alt+M`)**: Start recording (`REC`), and SYNAPSE will automatically locate and extract your latest VS Code AI Chat session (e.g. GitHub Copilot) in the background without any popups. When you're done coding, press it again, and your LLM prompt, response, and live Git diffs are saved into a perfectly documented Markdown artifact.
- **Semantic Zoom (LOD)**: Navigate thousands of nodes with smooth, performance-optimized rendering.
- **Persistence**: Save your entire visual state to Git-friendly `project_state.json`.

---

## 🧠 DTR (Density of Thought Reasoning) Engine
SYNAPSE v0.2.18 introduces the **DTR Engine**, a quantitative measure of AI reasoning depth and architectural density. It transforms fuzzy AI confidence into measurable engineering metrics.

### 🌓 The DTR Metric Spectrum
- **DTR (Density of Thought)**: (0.0 ~ 1.0) Represents how much reasoning effort was concentrated in a specific node. High DTR nodes glow with a purple aura, indicating critical decision points.
- **$\rho$ (Density Rho)**: The information compression ratio. Measures how much raw code/logic is encapsulated within a single visual abstraction.
- **Think-at-N (Simulation Paths)**: The number of alternative architectural paths simulated by the LLM before materializing the current node.
- **Panic Isolation**: A safety protocol that ensures logic failures in one language cluster (e.g., C++ crash) are contained and reported via structured error codes rather than crashing the visual engine.

### 🚀 Deterministic Thinking Foundation
DTR is not just a visual effect; it is the foundation for **Deterministic Thinking**. By quantifying reasoning density, SYNAPSE identifies "weak links" in the architecture where AI confidence is low, prompting the user for manual validation (the `?` badge flow).

---

## 🏗️ Node Conventions
SYNAPSE uses specific icons and colors to represent different types of components and their current reasoning states.

### 📄 Entity Types
| Icon | Type | Description |
| :---: | :--- | :--- |
| 📄 | **File** | A physical source file in the workspace. |
| 📁 | **Folder** | A directory containing multiple nodes or clusters. |
| 🧩 | **Component** | A logical grouping or abstract module. |
| ⚡ | **Trigger** | An entry point or event source. |

### 🎨 Node Status & Glow
| Status | Visual Hint | Color | Meaning |
| :--- | :---: | :---: | :--- |
| **Active** | ![solid border](./resources/node_styles/hint_solid_border.png) | ![#83a598](./resources/node_styles/node_active.png) | Verified and currently active in the codebase. |
| **High DTR** | ![purple glow](./resources/node_styles/hint_purple_glow.png) | ![#8a2be2](./resources/node_styles/node_high_dtr.png) | High reasoning density; critical logic point. |
| **Ghost** | ![dashed border](./resources/node_styles/hint_dashed_border.png) | ![#928374](./resources/node_styles/node_ghost.png) | Proposed architectural node (not yet materialized). |
| **Deleted** | ![grayed out](./resources/node_styles/hint_grayed_out.png) | ![#282828](./resources/node_styles/node_deleted.png) | Safely commented out/decommissioned node. |
| **Warning** | ![red pulse](./resources/node_styles/hint_red_pulse.png) | ![#fb4934](./resources/node_styles/node_warning.png) | Logic error, circular dependency, or dead-end detected. |
| **Necrosis** | 💀 | ![#1d2021](./resources/node_styles/node_warning.png) | Fatal logic failure; broken build or severe physical defect. |
| **Tombstone** | 🪦 | ![#1d2021](./resources/node_styles/node_warning.png) | Irrecoverable deterministic failure; recommended for deletion. |

---

## 🔗 Edge & Line Conventions
SYNAPSE uses distinct colors and styles to represent different types of logical connections and data flows between nodes.

| Edge Type | Color | Style & Thickness | Meaning |
| :--- | :---: | :---: | :--- |
| **Dependency** | ![#ebdbb2](./resources/edge_styles/color_beige.png) | ![solid 2px](./resources/edge_styles/style_solid_2px.png) | Standard module dependency or import. |
| **Data Flow** | ![#83a598](./resources/edge_styles/color_blue.png) | ![solid 3px](./resources/edge_styles/style_solid_3px.png) | Heavy data transfer or payload movement. |
| **Event** | ![#fe8019](./resources/edge_styles/color_orange.png) | ![solid 2px](./resources/edge_styles/style_solid_2px.png) | Event triggers or asynchronous callbacks. |
| **Conditional** | ![#d3869b](./resources/edge_styles/color_pink.png) | ![solid 1px](./resources/edge_styles/style_solid_1px.png) | Conditional branches like if/else or match. |
| **Origin** | ![#d65d0e](./resources/edge_styles/color_brown.png) | ![solid 1.5px](./resources/edge_styles/style_solid_1.5px.png) | Prompt origin links for AI logic tracking. |
| **API Call** | ![#8ec07c](./resources/edge_styles/color_aqua.png) | ![dashed 2px](./resources/edge_styles/style_dashed_2px.png) | External API or cross-service network calls. |
| **DB Query** | ![#d3869b](./resources/edge_styles/color_magenta.png) | ![solid 3px](./resources/edge_styles/style_solid_3px.png) | Database queries, mutations, or transactions. |
| **Loop / Back**| ![#fe8019](./resources/edge_styles/color_orange.png) | ![dotted 2px](./resources/edge_styles/style_dotted_2px.png) | Loop-backs (`while`/`for`) or reverse logic flow. |
| **Highlighted**| ![#fabd2f](./resources/edge_styles/color_gold.png) | ![pulse 5px](./resources/edge_styles/style_pulse_5px.png) | Active execution path (Hovered/Selected). |

---

## 📸 visual Overview

### Project Topology
Visualizes the physical connections between LLM reasoning logic and source files.
![Topology View](./resources/screenshots/v0.3.1/topology_view.png)

### Logical Flow
Linear execution flow of specific events, reflecting both manual edits and code changes. Group-Aware Hierarchy and Orthogonal Edge Routing create clean, readable diagrams.
![Flow View](./resources/screenshots/v0.2.21/flow_view.png)

### Hierarchical Tree
A deep, organized overview of your project structure.
![Tree View](./assets/v0.2.16/synapse_tree_v0.2.16.png)

---

## 🛠️ Performance & 3D Acceleration

1. Download the latest `.vsix` from the [Releases](https://github.com/dogsinatas29/SYNAPSE/releases) page.
2. Drag and drop the file into **VS Code**.

### Quick Installation
```bash
code --install-extension synapse-visual-architecture-v0.3.10.vsix
```
Current Version: **v0.3.10** (Hard Lock Protocol Edition)

---

## 💾 System Requirements

### Font Stack (Required for Icon Rendering)
**Critical**: SYNAPSE uses modern emoji icons (🔗, 🛢️, 📡, 📊, 📍, 🔁) in 3D visualization. These require proper emoji font support.

**Required Font Stack** (in order of preference):
1. Noto Color Emoji       (Google's comprehensive emoji font)
2. Apple Color Emoji       (macOS default emoji font)
3. Segoe UI Emoji          (Windows 10+ emoji font)
4. System emoji fallback

**Installation by OS**:

| OS | Installation | Command |
|----|--------------|---------| 
| **Linux (Ubuntu/Debian)** | Install Noto Color Emoji | `sudo apt-get install fonts-noto-color-emoji` |
| **macOS** | Pre-installed | Already bundled in system fonts |
| **Windows 10+** | Pre-installed | Segoe UI Emoji included by default |

---

## 🚀 Getting Started
Launch your visual architecture journey in seconds.

1. **Install Extension**: Install the `synapse-visual-architecture-v0.3.10.vsix` (or latest) in Antigravity/VS Code.
2. **DNA Injection**: Create or drop a `GEMINI.md` (or `Project_Spec.md`) file into your workspace root.
3. **Bootstrap Phase**: Open the **SYNAPSE Canvas** from the sidebar or command palette (`Ctrl+Shift+P` -> `SYNAPSE: Open Canvas`).
4. **First Visualization**: 
    - The engine will scan your folder and display **Proposed Nodes**.
    - **Click [Confirm]** in the proposal popup to materialize nodes.

---

## 🆕 Revision History

| Version | Date | Description (English) | Description (Korean) |
| :--- | :--- | :--- | :--- |
| **v0.3.10** | 2026-04-07 | **Hard Lock Protocol**: Atomic file creation, ID persistence fix, and label-priority click resilience. | **하드 락 프로토콜**: 원자적 파일 생성 보증, ID 정합성 수복 및 라벨 우선 클릭 상호작용 개선. |
| **v0.3.09_fix** | 2026-04-05 | **Hotfix PhaseLock**: Resolved system-wide interaction lock in RENDER/DEBUG phases. | **핫픽스 페이즈락**: RENDER/DEBUG 단계의 전역 인터렉션 락 해결 및 원자적 동기화 개선. |
| **v0.3.1** | 2026-03-31 | **Bootstrap Locked**: Full Phase-based initialization (Phases 0-7). | **부트스트랩 락**: 전 단계(Phase 0-7) 순차 초기화 강제 및 시스템 잠금 프로토콜 도입. |

---

## 📜 License & Author
Licensed under the [GNU General Public License v3.0](LICENSE).  
Created with 🧠 by [dogsinatas29](https://github.com/dogsinatas29)
