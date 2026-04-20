# <img src="./resources/synapse-icon.png" width="40" height="40" /> SYNAPSE

> **Visual Architecture Engine for LLM Systems**

**Don't read the code. See the architecture.**

[![Version](https://img.shields.io/badge/version-v0.3.22.10-brightgreen.png)](https://github.com/dogsinatas29/SYNAPSE)
[![Latest Release](https://img.shields.io/badge/latest-v0.3.22.10%20Rendering%20Parity-orange.png)](https://github.com/dogsinatas29/SYNAPSE/releases)
![Status](https://img.shields.io/badge/status-Production_Ready-brightgreen.png)

---

## 💡 What is SYNAPSE?

SYNAPSE is a high-performance engine that visualizes the internal structure of LLM-based systems into a real-time graph.

- **Trace Execution Flow**: Visualize logic paths instantly.
- **Analyze Dependency Graphs**: Map complex module relationships.
- **Detect Architecture Drift**: Identify deviations between code and design.

## ⚠️ Problem

LLM-based systems face these critical structural challenges:
- **Invisible Flow**: Internal logic paths are hidden behind abstractions.
- **Dependency Explosion**: Relationships become complex and unmanageable.
- **Impossible Debugging**: Debugging the overall structure is fundamentally difficult.

## ✅ Solution

SYNAPSE transforms "reading code" into "seeing architecture" by projecting execution flows and structures into an interactive graph.

## 📸 Demo

![Interaction Demo](assets/synapse_feature_demo.webp)
*Zoom, Layer Visibility, and Traffic Heatmap demonstration.*

![Zoom Detail Demo](assets/synapse_zoom_detail.mp4)
*Deep Zoom detail showing icons, badges, and tooltips.*

![Topology View](assets/v0.3.21/synapse_topology_v0.3.21.png)
SYNAPSE uses a rich visual vocabulary to communicate the nature and health of your architecture.

### 1. 📄 Entity Types (Identity Icons)
Defines the physical nature or architectural role of the node.

| Icon | Type | Meaning | Visual Style |
| :--- | :--- | :--- | :--- |
| 📄 | Active Source | A physical source file (Logic, Config, etc.). | Solid border, base color |
| ⚡ | Atomic Logic | Core logic or Entry Point (contains Atomic signature). | Purple glow (DTR) |
| 📁 | Folder | A directory structure cluster. | Folder cluster container |
| ☁️ | External API | External library (os, fs) or API call dependency. | Cloud-like UI |
| 📚 | Doc Shelf | Milestone, release note, architecture document. | Hidden by default on canvas |
| 🧪 | Test Case | Unit tests and validation scripts (.test.ts). | Orange border |
| 🧩 | Component | Modular UI or logical component unit. | Blue-green border |
| ⚙️ | Processor | Data transformation or computational engine. | Purple-grey border |
| 🤝 | Service | Shared logic or infrastructure service layer. | Blue border |
| ⛩️ | Gate | Security, authentication, or traffic controller. | Thick yellow border |
| 📋 | Data Record | DB schema, JSON model, or pure data definition. | Thick border, dark background |
| 👻 | Ghost Source | Referenced internal source missing physical file. | Dashed border |

### 2. 🎨 Node Status & Glow
Defines the current reasoning state and visual prominence of the node.

| Status | Visual Hint | Color | Meaning |
| :--- | :--- | :--- | :--- |
| **Active** | solid border | `#83a598` | Verified and currently active in the codebase. |
| **High DTR** | purple glow | `#8a2be2` | High reasoning density; critical logic point. |
| **Ghost** | dashed border | `#928374` | Proposed architectural node (not yet materialized). |
| **Deleted** | grayed out | `#282828` | Safely commented out/decommissioned node. |
| **Warning** | red pulse | `#fb4934` | Logic error, circular dependency, or dead-end detected. |
| **Necrosis** | 💀 | `#1d2021` | Fatal logic failure; broken build or severe physical defect. |
| **Tombstone** | 🪦 | `#1d2021` | Irrecoverable deterministic failure; recommended for deletion. |

### 3. ➡️ Logic & Flow Markers
Markers that occur on nodes or edges depending on the Zoom level (LOD).

| Icon | Type | Meaning |
| :--- | :--- | :--- |
| ↻ | Loop | Iterative logic (for, while, map). |
| ◈ | Decision | Branching logic (if, switch, validation). |
| 🖨️ | Output | Terminal logging, printing, or side-effect output. |
| 📡 | Signal | Network request or remote procedure call (RPC). |
| 📊 | Payload | High-bandwidth data movement or stream. |
| 🕒 | Async | Asynchronous processing or wait states. |

### 4. ⚠️ Hazard & Purification Markers
Visual indicators of system purity and architectural health.

| Icon | Type | Meaning | Visual Style |
| :--- | :--- | :--- | :--- |
| 💀 | Necrosis | Architectural failure (circular dependency, etc.). | Dark background + noise |
| 🪦 | Tombstone | Persistent deterministic violation record. | Tombstone marker |
| 💣 | Mine | High-hazard point (breaking changes detected). | Red-out warning |
| ⚠️ | Logic Fault | Specific code-level error or sync failure. | Red pulse / Warning icon |
| 🔴 | Dirty Dot | Local changes that require synchronization/push. | Top-right red dot |

### 5. ✅ Interaction & Approval Badges
Intelligent badges representing synchronization and user command status.

| Badge | Status | Meaning |
| :--- | :--- | :--- |
| ✅ | Confirmed | Manually approved by the Commander. |
| 🤖 | AI Validated | Automatically verified against the codebase. |
| ❓ | Pending | Proposed design awaiting verification (Draft). |
| ❌ | Purge | Marked for physical removal or deletion. |
| 🔒 | Locked | Immutable state; protected from modification. |

### 🔗 Edge & Line Conventions
SYNAPSE uses distinct colors and styles to represent different types of logical connections and data flows between nodes.

| Edge Type | Color | Style & Thickness | Meaning |
| :--- | :--- | :--- | :--- |
| **Dependency** | `#ebdbb2` | solid 2px | Standard module dependency or import. |
| **Data Flow** | `#83a598` | solid 3px | Heavy data transfer or payload movement. |
| **Event** | `#fe8019` | solid 2px | Event triggers or asynchronous callbacks. |
| **Conditional** | `#d3869b` | solid 1px | Conditional branches like if/else or match. |
| **Origin** | `#d65d0e` | solid 1.5px | Prompt origin links for AI logic tracking. |
| **API Call** | `#8ec07c` | dashed 2px | External API or cross-service network calls. |
| **DB Query** | `#d3869b` | solid 3px | Database queries, mutations, or transactions. |
| **Loop / Back** | `#fe8019` | dotted 2px | Loop-backs (while/for) or reverse logic flow. |
| **Highlighted** | `#fabd2f` | pulse 5px | Active execution path (Hovered/Selected). |

## 🚀 Quick Start

Launch your visual architecture journey in seconds.

### 1. Install Extension
Download the latest `.vsix` from [Releases](https://github.com/dogsinatas29/SYNAPSE/releases) and run:
```bash
code --install-extension synapse-visual-architecture-v0.3.22.10.vsix
```

### 2. Launch Canvas
Click the **🧠 Canvas icon** in the editor title bar or Sidebar.

### 3. Instant Analysis
Select **"Lite Bootstrap"** to automatically discover your project architecture.

---

## ✨ Key Features

- **🧠 Real-time Graph Visualization**: Live network mapping of your project.
- **🔍 N-hop Focus View**: Automated identification of critical core nodes.
- **⚠️ Diagnostic Intelligence**: Real-time architectural analysis (R1-R5).
- **🧩 AI Scan Integration**: Unified scanning engine for Python, Rust, C++, and TS.
- **Semantic Zoom (LOD)**: Navigate thousands of nodes with performance optimization.

---

## 🔍 Focus View (N-hop)

Extract only the connections up to N steps from a specific node to focus on the **Local Context** in a complex global graph.

![Focus View Demo](./resources/screenshots/v0.3.22/focus_view.png)
*Focus View (N=1) isolating node C and its immediate neighbors.*

### Example

**Full Graph:**
```text
A ─ B ─ C ─ D ─ E  
│   │  
F   G ─ H ─ I  
```

---

**Focus View (N = 1, Center = C):**
```text
B ─ C ─ D  
    │  
    G  
```

---

**Focus View (N = 2, Center = C):**
```text
A ─ B ─ C ─ D ─ E  
│       │  
F       G ─ H  
```

### Why it matters
- **Instant Scope Reduction**: Narrow down debugging range in massive graphs.
- **Path Tracing**: Rapidly trace specific execution flows.
- **Local Anomaly Detection**: Identify structural defects within a localized area.

---

## 🏗️ Architecture

SYNAPSE consists of the following layers:
- **Scanner**: Deep semantic multi-lang analyzer.
- **Graph Engine**: Deterministic, immutable state machine.
- **Visualization Layer**: Hybrid 2D Canvas & 3D WebGL accelerated rendering.
- **AI Merge Logic**: Intelligent resolution of ghost references and active files.

---

## 🧠 Philosophy

**"What you see is the logic of LLM"**

SYNAPSE was created to overcome the limitations of code-centric development. It bridges the gap between Large Language Model (LLM) reasoning and physical code architecture, transforming abstract logic into an interactive, high-performance node-edge network.

---

## 🆕 Revision History (v0.3.x)

| Version | Date | Description |
| :--- | :--- | :--- |
| **v0.3.22.10** | 2026-04-20 | **Rendering Parity & Identity Binding (SSoT)**: Full 2D/3D visual synchronization, and SSoT-based tooltip identity binding for 100% data consistency. |
| **v0.3.21** | 2026-04-18 | **Visual Consistency & Edge Bundling**: Full convention synchronization, Bezier flow consolidation, and Amnesia Guard for snapshot integrity. |
| **v0.3.20** | 2026-04-17 | **Rust Persistence & Engine Hardening**: Path-based IDs for Rust support, Velocity clamping for physics stability. |
| **v0.3.18** | 2026-04-17 | **Diagnostic Hint Engine**: Real-time architectural analysis (R1-R5), Zero-Unknown semantic labeling. |

[View Full History](REVISION_HISTORY.md)

---

## 📅 Status & Roadmap

- **Status**: v0.3.22 – Core features stabilized.
- **Next**:
    - Server / Client separation for remote analysis.
    - Advanced Performance optimization for 50k+ nodes.
    - Real-time collaborative architecture design.

---

## 📜 License & Author
Licensed under the [GNU General Public License v3.0](LICENSE).  
Created with 🧠 by [dogsinatas29](https://github.com/dogsinatas29)
