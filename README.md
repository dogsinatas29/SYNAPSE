# <img src="./resources/synapse-icon.png" width="40" height="40" /> SYNAPSE

> **Visual Architecture Engine for LLM Systems**

**Don't read the code. See the architecture.**

Software is not hard because of code.

Software is hard because of invisible relationships.

SYNAPSE transforms source code into an explorable architecture map,
allowing engineers to visualize dependencies, execution flow,
bottlenecks, and system-wide interactions across large software systems.

[![Version](https://img.shields.io/badge/version-v0.3.32-brightgreen.png)](https://github.com/dogsinatas29/SYNAPSE)
[![Latest Release](https://img.shields.io/badge/latest-v0.3.32%20Collaboration%20Flow%20Visibility-orange.png)](https://github.com/dogsinatas29/SYNAPSE/releases)
![Status](https://img.shields.io/badge/status-Production_Ready-brightgreen.png)

[🇰🇷 한국어 버전](./README.ko.md)


---

SYNAPSE helps you understand systems.

From hundreds of files and thousands of dependencies,
to the handful of nodes that actually matter.

## How SYNAPSE Understands System Architecture

| 1. Global Dependency Map | 2. Filter Noise |
| :---: | :---: |
| ![Global Dependency Map](assets/1.png) | ![Filter Noise](assets/2.png) |
| *"This is what real projects look like"* | *"Removes the noise"* |
| **3. Focus on Core Nodes** | **4. Traffic Heatmap** |
| ![Focus on Core Nodes](assets/3.png) | ![Traffic Heatmap](assets/4.png) |
| *"Tells you where to look"* | *"Shows you what matters most"* |

---

# Why SYNAPSE?

Modern software is no longer written by one person.

The problem is not writing code.

The problem is understanding how thousands of files,
multiple developers,
and distributed systems interact as a whole.

SYNAPSE turns source code into a visual architecture map.

It allows architects and senior engineers to:

* Identify architectural bottlenecks
* Trace dependency chains
* Visualize project-wide logic structures
* Collect remote team outputs through Harvest
* Review large codebases without manually traversing files

SYNAPSE focuses on visibility first.

Not synchronization.
Not issue tracking.
Not source control.

Visibility.

---

# Who Is It For?

### Architecture Review
* Tech Leads
* Staff Engineers
* CTOs

For those who need to grasp the structure of massive projects and trace dependencies.

### Distributed Development Teams
* Remote work teams
* VM-based development environments
* Multi-OS environments

For teams that need to visualize outputs created by multiple people in one unified space.

### Legacy & Brownfield Projects
* Old codebases
* Undocumented projects
* Systems with hard-to-understand structures

For those who want to see the architecture before reading the code.

## 📸 Demo

![Interaction Demo](assets/synapse_feature_demo.webp)
*Zoom, Layer Visibility, and Traffic Heatmap demonstration.*

![Zoom Detail Demo](assets/synapse_zoom_detail.webp)
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
code --install-extension synapse-visual-architecture-v0.3.28.vsix
```

### 2. Launch Canvas
Click the **🧠 Canvas icon** in the editor title bar or Sidebar.

### 3. Instant Analysis
Select **"Lite Bootstrap"** to automatically discover your project architecture.

---

## ✨ Key Features

- **🧠 Real-time Graph Visualization**: Live network mapping of your project.
- **🚫 Hybrid Blacklist System**: Intelligent exclusion of noise (node_modules, dist) with O(1) path matching.
- **🖱️ Explorer Context Integration**: Right-click any file/folder to instantly add to blacklist and refresh the graph.
  ![Explorer Menu](assets/v0.3.23/synapse_explorer_menu.png)
- **🔍 N-hop Focus View**: Automated identification of critical core nodes.
- **⚠️ Diagnostic Intelligence**: Real-time architectural analysis (R1-R5).
- **🧩 AI Scan Integration**: Unified scanning engine for Python, Rust, C++, and TS.
- **Semantic Zoom (LOD)**: Navigate thousands of nodes with performance optimization.

---

## 🔍 Semantic Analysis & Layer Visibility

SYNAPSE provides powerful semantic filters to analyze massive graphs by controlling layer visibility and isolating critical logic paths.

| 1. Default View | 2. Hide Lead (Noise Reduction) |
| :---: | :---: |
| ![Default View](assets/v0.3.22/synapse_default_view.png) | ![Hide Lead](assets/v0.3.22/synapse_hide_lead.png) |
| **3. Focus Top Nodes (N-hop)** | **4. Traffic Heatmap (Beta)** |
| ![Focus Top](assets/v0.3.22/synapse_focus_top.png) | ![Traffic Heatmap](assets/v0.3.22/synapse_traffic_heatmap.png) |


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

### 🔀 Auto-Generated Flow View
SYNAPSE automatically generates a logical flowchart based on the underlying architecture.

**Generation Conditions:**
- The graph must contain valid logical or data flow edges (e.g., `Flow`, `Calls`, `Depends`).
- Nodes must be properly connected; standalone, scattered nodes without connections will not form a meaningful flowchart.
- Accessible via the `View -> Flow View` menu in the top navigation bar.

![Flow View Screenshot](assets/network/flowview.png)
Flow view image

![Flow View Screenshot 2](assets/network/flow2.png)
Information for specific nodes can also be verified within the flow view

![Network Attached Flow View](assets/network/network_attached_flowview.png)
The logic of clients connected to the network is also included in the flow view.

---

## 📂 Cluster Visibility

SYNAPSE provides a **Cluster Visibility Panel** to effectively manage massive architectures. It offers a file-explorer-like hierarchical view to grasp and control complex folder (cluster) structures at a glance.

![Cluster Visibility](assets/cluster_visibility2.png)

### Quick Actions
- **모든 클러스터 - (Collapse All)**: Collapses all clusters in the tree, showing only the highest-level groupings.
- **루트만 보기 (Roots Only)**: Expands only the root clusters while keeping deeper levels collapsed.
- **모든 클러스터 + (Expand All)**: Expands all clusters in the tree to show their full contents.

### 1. Intuitive Hierarchy & Recursive Counting
The visibility panel reflects your project's actual folder structure. The number next to a folder indicates the **accumulated total of all nodes (files)** contained within it and all its subfolders. You can instantly know how many components are inside a module just by looking at the top-level folder.

![Cluster Fold](assets/cluster_fold.png)

### 2. Cascade Visibility Toggling
You can toggle the visibility of specific folders using the checkboxes. When you toggle a parent folder, **the visibility state automatically cascades to all its descendant folders**. This allows you to hide or reveal massive modules containing hundreds of nodes with a single click.

### 3. Real-time REVEAL Navigation
Clicking the `→` (REVEAL) button next to a folder smoothly navigates the canvas camera directly to where its nodes are clustered. Even if you have manually dragged nodes around, it **tracks the real-time physics coordinates** and centers them perfectly on your screen.

### 4. Network Attached Client Identification
Clusters created by clients connected to the network are clearly distinguished in the visibility panel. The system automatically prepends the client's account name (e.g., `[username]`) to their cluster names, keeping remote namespaces perfectly isolated and easily identifiable.

![Network Attached Cluster](assets/network_attached_cluster.png)

---

## 🌾 Harvest

Harvest is a snapshot-based collection system where the Architect (Server) safely collects the work results of collaboration participants.

[![SYNAPSE Harvest Demo](https://img.youtube.com/vi/ctQZHE7ZZ3A/0.jpg)](https://youtu.be/ctQZHE7ZZ3A)

Harvest does not aim for general bi-directional synchronization. The traditional Client ↔ Server ↔ Client architecture can cause ownership conflicts and state inconsistencies, leading to undefined behaviors.

To prevent this, Harvest adopts an **Architect-centric uni-directional collection model**.

```text
Client → Snapshot → Server → Archive
```

![Network Attached File](assets/network/network_attached_file.png)
Files from clients connected to the network are displayed directly on the Synapse screen, enabling logic verification.

![Harvest](assets/network/harvest.png)
Among the files from connected clients, only verified files can be "harvested" and saved to the server.

The goal of Harvest is not code integration, but **safe collection and preservation**.

### How It Works

#### Visibility-Based Harvest

Harvest does not collect the entire project indiscriminately.

The Architect selectively collects only from client layers with active visibility on the canvas, and can manually select files to copy via the UI.

This minimizes unnecessary data influx and repository pollution.

#### Client Isolation

Collected files are not merged into a single shared folder.

Each client is assigned an independent User Root, and their harvest results are kept in isolated user-specific Harvest spaces.

```text
.synapse/
└─ clients/
   ├─ userA/
   │  └─ harvest/
   └─ userB/
      └─ harvest/
```

This structure guarantees:

* Traceable ownership
* Safe diffing
* Independent deletion
* Prevention of overwrite collisions

#### Harvest Lock

While Harvest is in progress, a LOCK state is applied to the target clients.

A warning overlay appears on the clients' screens indicating that Harvest is underway, minimizing potential state changes during the collection.

Harvest Lock is a safeguard to support data integrity, aiming to maintain a deterministic state during the collection process.

### Directory Layout

```text
.synapse/
└─ clients/
   ├─ {username}/
   │  ├─ harvest/
   │  ├─ metadata.json
   │  ├─ snapshots/
   │  └─ cache/
   └─ ...
```

#### harvest/

Stores the actually collected source code while maintaining its original structure.

#### metadata.json

Stores session information, client identifiers, and collaboration metadata.

#### snapshots/

A history and backup layer intended for future versions.

#### cache/

Buffer space for remote file viewing and temporary data processing.

### Safety Guarantees

#### File Collision Protection

Even if files share the same name, they will not conflict or overwrite each other because each user's storage space is isolated.

#### Path Traversal Protection

Attempts to escape paths, such as parent directory access (`../`), are blocked on the server side.

#### Type-Safe Result Processing

Harvest result data is processed through explicit type structures, preventing data loss caused by runtime key mismatches.

### Harvest Is Not Sync

Harvest is a feature for collecting and preserving data.

It does not perform auto-merging, auto-overwriting, or conflict resolution.

Code integration is executed manually through the Architect's review and judgment; automated synchronization is beyond the scope of Harvest.

---

## 🔍 Verify (Architecture Logic Report)

Verify is the Architect's real-time diagnostic system for inspecting the health of the architecture graph — including **all currently connected remote clients**.

> ⚠️ **Scope**: Verify analyzes not only the Architect's local project graph, but also the architecture graphs pushed by connected collaboration clients. Any client whose layer is visible on the canvas is included in the diagnostic scope.

### Verify Menu Items

#### 🔬 Scan Architecture (AI)
Runs a full AI-driven semantic analysis on the current architecture graph. Scans all nodes and edges, detects schema violations, dead-end nodes, broken edges, and coupling anomalies. Generates a `LOGIC_REPORT.md` with detailed findings.

- Includes remote client nodes (connected via SSE) in the analysis scope.
- Reports are output in the OS display language (Korean / English auto-detected via `vscode.env.language`).

#### 🧪 Simulation Debug
Activates the Virtual Debugger mode. Simulates runtime behavior across the architecture graph, applying diagnosis states (Necrosis, Tombstone) to nodes that fail logical validation.

- Diagnoses include all connected clients' architecture layers, not just the local project.
- Allows the Architect to observe which remote nodes have failed or are stale without requiring a Harvest.

#### 💀 Simulate Necrosis
Manually applies the **Necrosis** state to selected nodes. Used to mark a node as logically dead — indicating it has broken dependencies, missing references, or has been flagged by the AI analysis.

Necrosis nodes appear with a red border and darkened background. Connected edges are marked as fractured.

#### 🪦 Simulate Tombstone
Manually applies the **Tombstone** state to selected nodes. A tombstone represents a node that has been fully deprecated or removed from the active architecture. Rendered as a gravestone visual marker on the canvas.

#### 🧹 Clear Debug
Removes all debug visual states (Necrosis, Tombstone) from the canvas and resets nodes to their default rendering state. Does not affect actual graph data.

#### 💎 Det Bootstrap (`v0.2.28: Determinism Bootstrap`)
Runs the Determinism Bootstrap sequence. Resets internal state checksums and re-establishes a deterministic baseline for the current architecture snapshot. Used to eliminate accumulated non-determinism from repeated edits.

#### 🔄 Deep Re-Scan
Performs a complete re-scan of the entire project directory from scratch. All previously cached graph data is discarded, and the full file-to-node pipeline is re-executed. Use when the graph has drifted from the actual file system state.

### Inference Pressure

The Verify system reports **Inference Pressure** — a normalized measure of architectural health:

| Pressure | Status | Meaning |
|---|---|---|
| 0–10% | 🟢 Stable | Architecture is healthy |
| 10–30% | 🟡 Caution | Minor issues detected |
| 30–60% | 🟠 Warning | Significant problems present |
| 60%+ | 🔥 Critical | Immediate action required |

Pressure = `criticalIssues / totalAnalyzedNodes × 100`. Scale-invariant — valid for both small (50-node) and large (5000-node) projects.

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

## 📜 Revision History

| Version | Release Date | Description |
| :---: | :---: | :--- |
| **v0.3.33.1_fix2** | 2026-07-20 | **Layout Engine Sovereignity & Extreme Scale Profiling**: Completely decoupled the Layout Engine from the Visibility State by removing `cluster.collapsed` constraints from the physics packer, preventing massive bounding box overlaps. Eliminated O(N*C) bottlenecks in `drawClusters` and `aggregateEdges`, reducing rendering preparation time from 1,830ms to 5ms (366x faster). Successfully tested against extreme mono-repo scales including **VSCODE-main** and **Linux Kernel 72 rc3**. |
| **v0.3.33.1_fix** | 2026-07-16 | **Render Virtualization & Pipeline Repair**: Removed the hardcoded edge limit (50k) that silently aborted the rendering pipeline for massive mono-repos like VSCode-main. Restored the 'LINES (No Badges)' edge visibility mode. Integrated precise telemetry probes into the WebGL/Canvas2D pipeline to trace culling and LOD bottlenecks. Resolved Cluster Bloating issues by excising padding from empty directories and properly propagating `collapsed` state bounds logic to the BottomUp packer. |
| **v0.3.33.1** | 2026-07-15 | **Aesthetics & LOD Optimization**: Fixed "Roots Only" cluster visibility bug to properly identify depth-1 Continents as roots, allowing them to be expanded correctly so their contents are visible rather than collapsing into missing blocks. Implemented 3-level Edge LOD (FULL/CLUSTER/NONE) to eliminate premature edge-culling on massive mono-repos. Refactored trackpad zoom logic with non-linear DeltaY sensitivity to fix hypersensitive "microscope" scrolling. |
| **v0.3.33** | 2026-07-14 | **Cluster Hierarchy & Dragging Overhaul**: Completely refactored cluster interactions and visibility control. Replaced isolated node-dragging with a unified cluster-dragging model that recursively moves all child clusters and their nodes. Upgraded Cluster Visibility panel with 3 new quick-action buttons (`Collapse All`, `Roots Only`, `Expand All`) for rapid LOD management. Implemented depth-based priority for hit detection (`getClusterHeaderAt`) to ensure reliable parent cluster selection, even in deeply nested paths. |
| **v0.3.32.4** | 2026-07-05 | **UX & Visibility Improvements**: Added recursive node counting and cascade toggling to the Cluster Visibility panel. Fixed real-time coordinate tracking for the REVEAL feature, completely isolated remote client namespaces with `👤 [username]` labels, and patched a major memory leak during State Reset. |
| **v0.3.32.1** | 2026-06-27 | **Cross-Network Trace & Semantic Flowchart**: Improved flowchart rendering quality (single-pass Barycenter ordering, red dotted back-edges). Implemented `[SYNAPSE_NETWORK_LINK]` macro for cross-project dependency parsing bypassing language syntax limits. Fixed IFF logic for remote client nodes and proved distributed DAG merging via Harvest. |
| **v0.3.32.2** | 2026-06-29 | **File Deletion Sync & Architecture Physics Fixes**: Fixed manual node deletion sync bug, safely handling absolute vs relative paths. Expanded `EXTERNAL_PACKAGES` to recognize 100+ standard frameworks across 7 languages, eliminating false ghost nodes. Enhanced regex to properly resolve `[SYNAPSE_NETWORK_LINK]` cross-workspace dependencies and cluster remote ghosts into `cluster_ghost_network_remote`. Fixed root-level files infinite layout collapse by injecting a dynamic `📁 Root` cluster to force global physics packing. Resolved false-positive JSON serialization errors for workspace states. |
| **v0.3.32.1** | 2026-06-27 | **Cross-Project Trace & Semantic Flow Layout**: Upgraded Flow View to Semantic Flow Layout with single-pass Barycenter Ordering, drastically reducing edge crossings. Visualized back-edges in red dashed lines. Introduced `[SYNAPSE_NETWORK_LINK]` for universal language-agnostic cross-network dependency parsing. Fixed client node mirroring (IFF logic) to distinguish local vs remote client nodes. Proved distributed architecture collaboration via Harvest DAG merge within Flow View. |
| **v0.3.32** | 2026-06-26 | **Collaboration Flow Visibility**: Fixed ghost filter collision that made 100% of client-contributed nodes invisible in Flow View. Client nodes now bypass `!isGhost` filter, controlled by `_isClientLayerVisible()` toggle. Fixed `reasons` ReferenceError that silently crashed `buildFlow()` when client nodes were present. Unified client node detection filters across debug/survival/flow logic. Contribution Entity Graph Phase 0 validated: `(filePath, userId)` confirmed as canonical identity. |
| **v0.3.31** | 2026-06-25 | **Diagnostics Stabilization & Observability**: Fixed false-positive Necrosis from `doc`/`file`/`folder` nodes. Normalized Pressure calculation to `criticalIssues / totalNodes`. Excluded Ghost Cluster (`cluster_ghosts`, `doc_shelf`) from dependency hints. Added `clientTimestamp`-based Stale opacity visualization (Active/Stale/Offline). Tooltip now shows `"[username] Updated Xm ago"`. Soft Disconnect with 15-minute cache retention for post-crash debugging. |
| **v0.3.30.2** | 2026-06-25 | **Security Hardening & Harvest Stabilization**: Verified 6 critical attack vectors (Path Traversal, Auth Bypass, SSE Contamination, Lock Bypass, Sandbox Escape, Client Spoofing). Fixed port binding conflict & 403 Auth error on Admin UI. Implemented backward compatibility for legacy array-formatted `accounts.json` and `synapse_history.json` to prevent `unshift` crash during Harvest. |
| **v0.3.30** | 2026-06-22 | **Harvest-Based Collaboration Model**: Major architecture upgrade introducing session management, secure SSH transport, and remote projection layers. Full integration of Harvest Engine and Identity permissions. |
| **v0.3.29** | 2026-06-06 | **Cluster Overlap Resolution & External Layer Fix**: Implemented Initial Spread (circular layout via FNV-1a hash) + Cluster Push-Apart engine (Mass-weighted AABB push-apart) to resolve cluster/node overlapping. Fixed External Ghosts cluster box not showing when External layer is ON. Reduced Align Architecture cluster expansion by 50% (roleOffsets halved). |
| **v0.3.27** | 2026-05-28 | **Data Sync Resilience & Layer Sovereignty**: Resolved critical data synchronization bugs causing phantom edge disappearances (`Edges: 0`). Ensured UI layer separation logic properly isolates scanned folders and custom groupings without structural damage. |
| **v0.3.26** | 2026-05-26 | **2D Edge Validation Patch**: Fixed a bug where solid edges would silently fail to render in 2D mode due to invalid dash array fallback `[0, 0]` not supported by HTML5 Canvas API context. |
| **v0.3.25** | 2026-05-25 | **Cluster-Aware Local Alignment**: Refactored the layout alignment physics so that nodes align cleanly relative to their specific cluster's gravity center, preventing global coordinate collapses when arranging architecture. |
| **v0.3.24** | 2026-05-24 | **RULES.md Embedding & Bootstrap Hardening**: Embedded standard DTR (Dynamic Thought Routing) & Forced File Projection Rules deeply into the Bootstrap Engine, establishing security and design constraints by default upon initialization. |
| **v0.3.23** | 2026-05-02 | **Hybrid Blacklist & Intelligent Onboarding**: Implemented O(1) path-matching blacklist system. Added Explorer context menu for instant exclusion. Fixed webview layout collapse issues. |
| **v0.3.22.11** | 2026-04-22 | **Interaction Stability & Coordinate Sovereignty**: Resolved node dragging jitter via Timestamp Guards and Position Persistence. Unified absolute coordinate system across SSoT layers. |22.11** | 2026-04-22 | **Interaction Stability & Coordinate Sovereignty**: Resolved node dragging jitter via Timestamp Guards and Position Persistence. Unified absolute coordinate system across SSoT layers. |
| **v0.3.22.10** | 2026-04-20 | **Rendering Parity & Identity Binding (SSoT)**: Full 2D/3D visual synchronization, and SSoT-based tooltip identity binding for 100% data consistency. |
| **v0.3.21** | 2026-04-18 | **Visual Consistency & Edge Bundling**: Full convention synchronization, Bezier flow consolidation, and Amnesia Guard for snapshot integrity. |
| **v0.3.20** | 2026-04-17 | **Rust Persistence & Engine Hardening**: Path-based IDs for Rust support, Velocity clamping for physics stability. |
| **v0.3.18** | 2026-04-17 | **Diagnostic Hint Engine**: Real-time architectural analysis (R1-R5), Zero-Unknown semantic labeling. |

[View Full History](REVISION_HISTORY.md)

---

## 📅 Status & Roadmap

- **Status**: v0.3.30.1 – UI/UX Refinement & Feature Cleanup.
- **Next**:
    - Server / Client separation for remote analysis.
    - Advanced Performance optimization for 50k+ nodes.
    - Real-time collaborative architecture design.

---

## 📜 License & Author
Licensed under the [GNU General Public License v3.0](LICENSE).  
Created with 🧠 by [dogsinatas29](https://github.com/dogsinatas29)
