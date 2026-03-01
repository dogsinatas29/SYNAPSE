# <img src="resources/synapse-icon.png" width="40" height="40" /> 🧠 SYNAPSE: Visual Architecture Engine (v0.2.17)

> **"What you see is the logic of LLM"** — *WYSIWYG Logic for AI*

[![Version](https://img.shields.io/badge/version-v0.2.17-brightgreen.svg)
![Status](https://img.shields.io/badge/status-War_Room_Ready-orange.svg)
[![Language](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/Platform-VS_Code-007ACC?style=flat-square)](https://code.visualstudio.com/)

[🇰🇷 한국어 버전](README.ko.md) | [🇺🇸 English Version](README.md)

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

## 🔗 Edge & Line Conventions (선과 색상의 의미)
SYNAPSE uses distinct colors and styles to represent different types of logical connections and data flows between nodes.

| Edge Type (종류) | Color (색상) | Style & Thickness | Meaning (의미) |
| :--- | :---: | :---: | :--- |
| **Dependency** | `#ebdbb2` (Beige) | Solid (2px) | Standard module dependency or import. (일반적인 모듈 의존성 및 참조) |
| **Data Flow** | `#83a598` (Blue) | Solid (3px) | Heavy data transfer or payload movement. (데이터의 흐름 및 전달) |
| **Event** | `#fe8019` (Orange) | Solid (2px) | Event triggers or asynchronous callbacks. (이벤트 생성 및 비동기 콜백) |
| **Conditional** | `#d3869b` (Pink) | Solid (1px) | Conditional branches like if/else or match. (조건부 로직 분기) |
| **Origin** | `#d65d0e` (Brown) | Solid (1.5px)| Prompt origin links for AI logic tracking. (프롬프트 기원 및 LLM 추적) |
| **API Call** | `#8ec07c` (Aqua) | Dashed (2px) | External API or cross-service network calls. (외부 API 호출 및 통신) |
| **DB Query** | `#d3869b` (Magenta)| Solid (3px) | Database queries, mutations, or transactions. (데이터베이스 쿼리 및 트랜잭션) |
| **Loop / Back**| `#fe8019` (Orange) | Dotted (2px) | Loop-backs (`while`/`for`) or reverse logic flow. (반복문 또는 역방향 피드백 흐름) |
| **Highlighted**| `#fabd2f` (Gold) | Pulse (+5px) | Active execution path (Hovered/Selected). (마우스 호버나 선택 시 활성화된 실행 경로) |

---

## 📸 visual Overview

### Project Topology
Visualizes the physical connections between LLM reasoning logic and source files.
![Topology View](./assets/v0.2.16/synapse_graph_v0.2.16.png)

### Logical Flow
Linear execution flow of specific events, reflecting both manual edits and code changes. Group-Aware Hierarchy and Orthogonal Edge Routing create clean, readable diagrams.
![Flow View](./assets/v0.2.16/synapse_flow_v0.2.16.png)

### Hierarchical Tree
A deep, organized overview of your project structure.
![Tree View](./assets/v0.2.16/synapse_tree_v0.2.16.png)

---

## 🛠️ Installation

1. Download the latest `.vsix` from the [Releases](https://github.com/dogsinatas29/SYNAPSE/releases) page.
2. Drag and drop the file into **VS Code**.
### Quick Installation
```bash
code --install-extension synapse-visual-architecture-0.2.16.vsix
```
    Current Version: **v0.2.17** (Edge Connectivity & Safe Deletion)

---

## 📖 Usage Guide (v0.2.17 Key Features)

### 1. 🔄 Reset State (Full Factory Reset)
If your canvas becomes corrupted or you want to start a completely new architecture from scratch, use the **`Reset State`** button in the top toolbar.
- **Disk Purge**: Instantly wipes all nodes, edges, and clusters from `project_state.json`.
- **Memory Flush & Visual Reset**: Clears the currently active canvas and internal engine memory.
- **Re-Bootstrap**: Prompts you to reload `GEMINI.md` to begin generating a fresh architecture.

### 2. ✏️ Edit Logic Mode (WSIWYG File Management)
The `Edit Logic` button in the toolbar empowers you to shape your workspace directly from the canvas. 
- **Creating Files**: Toggle `Edit Logic` ON, double-click anywhere on the empty canvas to spawn a new node, give it a module name, and SYNAPSE will **physically create an empty file** in your workspace.
- **Safe Deletion**: Deleting a node in `Edit Logic` mode intercepts the file system. Instead of destructive deletion, SYNAPSE wraps the physical source code entirely in `// [SYNAPSE_DELETED]` comments, ensuring no code is ever permanently lost.
- **Resurrection**: If you delete a node by mistake, the automatic Snapshot & Rollback system allows you to revert to the previous state and revive the file.

### 3. 🔗 Edge Management & Auto-Imports
SYNAPSE v0.2.17 bridges the gap between drawing pictures and writing code.
- **Inline Trash (`X`)**: Hover over any edge to reveal a red `X` badge at its center. Click it to instantly sever the logical and visual connection.
- **Confirmation Flow (`?` → `!`)**: When you manually connect two nodes in `Edit Logic` mode, the edge appears with a yellow **`?`** badge indicating a `pending_confirm` state.
- **Auto-Injected Imports**: Click the **`?`** badge to confirm the architectural decision. SYNAPSE will analyze the target node, detect the file language (`.py`, `.ts`, `.js`), and **automatically inject the correct `import` or `require()` statement at the very top of the source file.** The badge then turns perfectly green (**`!`**).

---

## 🆕 Revision History

### v0.2.17 (Edge Connectivity & Safe Deletion)
- **Safe Node Deletion**: Physical files are commented out instead of hard-deleted to prevent data loss.
- **Auto-Snapshot on State Change**: Any canvas action (node/edge deletion or position change) automatically captures the latest state into the snapshot history. This strictly seals the new state and prevents old data (`Ghost nodes` or stale imports) from resurrecting.
- **Edge Auto-Imports**: Confirming an edge visually injects the actual `import` statement into the source file.
- **Reset State Protocol**: 4-step full reset system (Disk, Memory, Canvas, Prompt).
- **V/X Redundancy Removed**: Cleared the redundant Node Approve/Reject texts in favor of seamless Edit Logic interactions.
- **Data Hygiene**: Eliminated JSON buffer encoding corruption and RangeErrors.

### v0.2.16 (Strategic Execution Flow Update)
- **Ready Handshake**: Extension now waits for WebView readiness, preventing initialization race conditions.
- **Stable Layout BFS**: Replaced potentially infinite BFS loops with a stable topological rank calculation.
- **NaN/Infinity Guards**: Strict coordinate validation to prevent UI engine freezes on complex graphs.
- **Throttled Communication**: Reduced progress update frequency and batched messages for smoother UI performance.
- **Recursion Safety**: Added depth limits to rank calculation to handle extremely complex or circular dependencies.

### v0.2.15 (Performance & Visibility Release)

### v0.2.14fix (The Clarity Update)
- **Group-Aware Hierarchy**: Nodes in the Flow View now persist their grouped `cluster_id` from the Graph view, preserving modular context with visual dashed boxes (`[ MODULES ]`).
- **Orthogonal Edge Routing**: Eradicated diagonal spaghetti edges. Edges now use 90-degree Manhattan routing with smart bypass logic to avoid piercing unrelated nodes.
- **Virtual End-Point Bus**: Added a `Merge / Sync` virtual node before `END` to multiplex and cleanly route parallel pathways down a logical bus line.
- **Decision Node Resizing**: Scaled down the horizontal bloat of decision diamonds to preserve grid layout integrity.

### v0.2.14
- **💎 Flowchart Geometric Shapes**: The Graph View now renders nodes in standard flowchart shapes based on their semantic logic (Diamonds for `if/valid_`, Hexagons for `for/loop`, Parallelograms for `print`).
- **🛡️ War Room Implementation**: Transform SYNAPSE into a technical audit center.
- **Logic Analyzer**: Detect Circular Dependencies, Bottlenecks, and Dead-ends.
- **Pulse Animation**: Real-time signal traversal to visualize logic flow reachability.
- **Interactive Reports**: Clicking findings in `리포트.md` automatically focuses the node on the canvas.

### v0.2.13
- **🌟 Cluster UX Overhaul**: Radically improved Canvas interaction.
- **Drag & Drop**: Entire clusters can now be seamlessly dragged by pulling their top header block.
- **Body Selection**: Added the ability to draw Multi-Select boxes over cluster bodies without dragging the cluster itself.
- **Gruvbox Colors**: All clusters are now automatically rendered with consistent, distinct hash-based colors for instant visual recognition.

### v0.2.12
- **🧠 Intelligent Context Vault**: Seamless, popup-free extraction of your hidden VS Code Copilot Chat sessions directly into your project's `context.md`.
- **Zero-Click Work Mapping**: Press `Ctrl+Alt+M` to auto-capture your AI conversation and Git diffs without breaking your flow.

### v0.2.11
- **✨ Multi-Language Intelligence**: Sophisticated scanning for Python, C/C++, and Rust.
- **Advanced Resolution**: Deep internal pathway tracking for all major languages.
- **Unified Flow**: C/C++ and Rust now support full Flow View visualization.

### v0.2.10
- **🐛 Critical Fixes**: Resolved activation errors and improved multi-node deletion stability.

---

## 📜 License & Author
Licensed under the [GNU General Public License v3.0](LICENSE).  
Created with 🧠 by [dogsinatas29](https://github.com/dogsinatas29)
