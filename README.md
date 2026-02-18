# 🧠 SYNAPSE: VS Code Visual Architecture Engine

> **Visual Studio Code (VS Code) Extension**  
> "What you see is the logic of LLM (WYSIWYG Logic for AI)"

[🇰🇷 한국어 (Korean)](README.ko.md) | [🇺🇸 English (English)](README.md)

SYNAPSE is a next-generation extension built for **Google Antigravity** and **Visual Studio Code** users. It visualizes complex reasoning logic generated or analyzed by Large Language Models (LLMs) into a physical node-edge network, helping you intuitively design, implement, and document AI thought processes.


## 🚀 Key Features

- **📂 Project Bootstrap**: Generates a structured view from `GEMINI.md` or scans your codebase directly.
- **📚 Documentation Shelf**: Automatically organizes Markdown (`.md`) files into a dedicated shelf, keeping them separate from code logic.
- **🎯 Manual Clustering**: Group related nodes manually to organize your thought process. These groups are preserved in exports.
- **🔍 Smart File Scanning**: Focuses on source code and documentation, filtering out noise like build artifacts and config files.
- **🤖 Deep Analysis**: Understands typical project structures (src, tests, docs) and categorizes nodes accordingly.
- **🎨 Interactive Canvas**: Drag, drop, zoom, and pan to explore your architecture.
- **📝 Mermaid Export**: Export your visual diagram to Mermaid.js format for easy sharing and documentation.
- **🌐 Topology View**: visualize project folder structure and file dependencies as a node-edge network.
- **🌳 Tree View**: A hierarchical overview of the project structure.
- **➡️ Flow View (Enhanced!)**: Projects the execution flow of specific logic into a flowchart. Now more robust in v0.2.3.
- **🛡️ Node Diet (Smart Scanning)**: Automatically ignores unnecessary folders like `.venv`, `node_modules`.
- **📦 Ghost Node Storage (New! 📥)**: Automatically isolates disconnected (degree-0) nodes into a dedicated storage cluster to keep the main view clean.
- **📂 Auto Folder Clustering**: Automatically groups nodes based on directory structure. This clustering is now also preserved in Mermaid exports (v0.2.2).
- **🔄 Deep Reset**: Instantly resets a messy layout and rescans with the latest filters.
- **🎯 Scan Scope Control**: Specify `Scan Paths` in `GEMINI.md` to precisely scan only desired areas.
- **⌨️ Arrow Key Navigation**: Fast and precise canvas navigation using arrow keys and Shift.
- **🔍 Semantic Zooming (LOD)**: Step-by-step detail control to manipulate thousands of nodes without performance degradation.
- **💾 Persistence**: Permanently save all visual states to `project_state.json` and manage with Git.
- **🛠️ Standalone Bridge**: Support for browser-only mode without VS Code.
- **💾 Prompt Traceability**: Save your prompts and design decisions directly from the canvas (Auto-save supported).
- **🧠 Context-Aware Logging (Enhanced in v0.2.6! 🚀)**:
    - **Node Auto-Binding**: Selecting a node automatically focuses the log on that component.
    - **Visual Tagging**: Categorize logs (`[Discovery]`, `[Reasoning]`, `[Action]`).
    - **State Snapshotting**: Saves the exact canvas view (Zoom/Pan) with the log for future restoration.
- **🛡️ Robust Ghost Node Prevention (v0.2.7+ 🛡️)**: Deep filtering of code blocks, inline code, and HTML comments, now guided by a centralized **Rule Engine**.
- **📜 Rule Externalization (v0.2.8! ⚖️)**: Technical rules for discovery and icon standards are now externalized in `RULES.md`.
- **⚖️ Rules UI**: Instant access to the project's architecture rules via a new toolbar button.
- **🔌 Enhanced LSP Integration**: Directly link `GEMINI.md` to code with Hover, Go to Definition, and Real-time Diagnostics.

## 🎥 Demo Video
https://www.youtube.com/watch?v=Va4vZWkqC8E
> *Click the link above to watch the full video on YouTube.*

## 📸 Screenshots

### 🌐 Graph View
Visualizes the physical connection status between LLM reasoning logic and files as a node-edge network.
![Graph View](docs/media/graph_v0.2.0.png)

### 🌳 Tree View
Intuitively overview the project's folder structure and file hierarchy.
![Tree View](docs/media/synapse_tree_view.png)

### ➡️ Flow View
Projects the logic execution flow of a specific event or function into a linear flowchart. This is the **authoritative final result** that integrates and reflects both manual node editing and source code changes.
![Flow View](docs/media/flow_v0.2.0.png)

## 🗂️ Language Support

SYNAPSE supports multi-language architecture analysis:
- 🐍 **Python**: `.py` file analysis and virtual environment filtering
- 🦀 **Rust**: `Cargo` project structure and `.rs` logic analysis
- 🇨 **C / C++**: Header and source file dependency analysis (ReDoS prevention optimized)
- 🐚 **Shell Script**: `.sh` automation script flow and function analysis
- 🗄️ **SQL**: `.sql` table definition and schema visualization
- ⚙️ **Config (JSON/YAML/TOML)**: Analyzing relationships between infrastructure configuration files (The Glue)
- 📜 **TypeScript / JavaScript**: Full engine support for interfaces, types, and complex async logic (Enhanced in v0.2.1+! 🚀)

## 🛠️ Technology Stack

- **Base**: Google Antigravity & Visual Studio Code (VS Code)
- **Language**: TypeScript
- **Engine**: HTML5 Canvas API (High Performance Rendering)
- **Scanner**: Regex-based Fast Multi-Language Scanner (Python, C++, Rust, Shell, SQL, Config)
- **Architecture**: Visual-First Design with LSP integration

## 📦 Installation & Setup

### 1. VS Code Extension (Recommended)
Download the latest `.vsix` file from the [Releases tab](https://github.com/dogsinatas29/SYNAPSE/releases).

#### How to Install:
*   **Method A: Drag & Drop (Easiest)**
    - Drag and drop the downloaded `synapse-extension.vsix` file directly onto an open **VS Code window**.
*   **Method B: Using the Extension Menu**
    1. Click the **Extensions** icon (Shortcut: `Ctrl+Shift+X`).
    2. Click the **`...` menu** at the top.
    3. Select **'Install from VSIX...'** and choose the file.
*   **Method C: Terminal Command**
    - `code --install-extension synapse-extension.vsix`

### 2. Getting Started (From Source)
```bash
git clone https://github.com/dogsinatas29/SYNAPSE.git
npm install
npm run watch
# Press F5 in VS Code to start
```

### 3. Standalone Bridge Mode (Web Browser)
Use this when you want to run the engine directly in the browser without VS Code.
```bash
# Terminal 1: API Server
npm run dev:standalone

# Terminal 2: UI Server
npm run dev:ui
```
- API Server: `http://localhost:3000`
- UI Server: `http://localhost:8080`

### 4. For Developers (Build)
1. `npm install -g @vscode/vsce`
2. `npx vsce package --out synapse-extension.vsix`

## 🎯 Manual & Usage Guide

### 🧱 Node & Edge Management (WYSIWYG)
- **Add Node**: Click the `Add Node` button on the top toolbar.
- **Delete Node/Edge**: Use the **🗑️ Delete** button in the toolbar, the `Delete` key, or the right-click context menu.
- **Manual Edge**: **Alt + Click a connection handle** on a node, then drag to the target. Release to select the relationship type (Dependency, Call, Data Flow, etc.).

### 📦 Clustering & Management
- **Create Group**: Select multiple nodes (Shift/Ctrl + Click) and click `Group`.
- **Manage Group**: Double-click the header to rename. Collapsable with `[-]`/`[+]` buttons.
- **Ungroup**: Select a group and click `Ungroup`.

### 💾 Snapshot & Rollback
- **Snapshot**: Click the camera icon to save the current visual state.
- **Rollback**: Click the clock icon to see history and revert to a previous design point.
- **Log Prompt**: Press `Ctrl+Alt+M` to capture your design thoughts as a node on the canvas.

### 🧠 Log Prompt & Context (New in v0.2.6)
1.  **Select a Node** (Optional): Click a node to bind the log to it.
2.  **Trigger**: Press `Ctrl+Alt+M`.
3.  **Tagging**: Select a tag (`[Discovery]`, `[Reasoning]`, etc.) to categorize your thought.
4.  **Save**: Choose to append to `context.md` (Recommended) or create a new file.
    -   *Bonus*: The current canvas view is automatically saved!

### 🧹 Data Hygiene Principles
- **Separation**: `GEMINI.md` holds the logic; `project_state.json` holds the coordinates.
- **Normalization**: Minimized Git Diff through sorted JSON keys.
- **Git Shield**: Common artifacts like `.vsix` and root `GEMINI.md` are automatically ignored (v0.2.2).
- **Volatile Auto-Edges**: Scanned edges are regenerated in real-time to prevent stale data.

### 🔥 Core Strategies
- **Multi-MD Strategy**: All `.md` files are treated as semantic context. Use `[Link](path)` to connect documents to code nodes.
- **Automatic Organization**: Manual logs are stored in `prompts/` and auto-committed to Git to preserve architecture history.

## 📐 Philosophy
"An intuitive playground for children, a powerful control tower for experts."  
Created with the belief that the simple act of connecting lines in complex systems is, in fact, the highest level of architectural design.

## 🆕 Version History

### v0.2.8
- **📜 Rule Externalization**: Introduced `RULES.md` to define and control architecture discovery rules (inclusion/exclusion/icons).
- **⚖️ Rules Button**: Added a dedicated button to the canvas UI for instant rule access.
- **🛠️ Auto-Generation**: `RULES.md` is now automatically created during project bootstrap if missing.
- **🐛 Fixed**: Resolved ghost node resurrection and multi-node deletion stability.

### v0.2.7
- **🛡️ Ghost Node Prevention**: Implemented stringent filtering for `GEMINI.md` content.
- **📝 Node Rules**: Added formal **Node Rules** and **Exclusion Rules** to `GEMINI.md`.

### v0.2.6
- **🧠 Context UI**: Enhanced `Log Prompt` (`Ctrl+Alt+M`) with Visual Tagging, Node Auto-Binding, and State Snapshotting.
- **📄 context.md**: Unified architecture decision log with one-click access and view restoration metadata.

### v0.2.5
- **🧹 Cleanup**: Removed legacy root files and example artifacts.
- **✨ Log Prompt**: Added support for appending context to `context.md`.
- **🐛 Fixes**: Resolved focus reset on node approval and ghost node parsing issues.

### v0.2.4
- **🚀 Fix Manual Grouping**: Replaced the browser's native `prompt()` dialog with a custom in-canvas modal. This resolves the issue where manual grouping was blocked or failed to appear in the VS Code extension environment.
- **✨ Enhanced UX**: Group creation flow is now non-blocking and visually integrated with the dark theme.

### v0.2.3
- **🚀 Hotfix for Tree/Flow Views**: Resolved rendering issues for projects with missing metadata.
- **📚 Documentation Shelf**: Dedicated area for `.md` files.
- **🎯 Manual Clustering**: Create and persist custom node groups.
- **🛡️ Enhanced Stability**: Improved error handling across all views.

## 📜 License
This project is licensed under the [GNU General Public License v3.0](LICENSE).

---
Created by [dogsinatas29](https://github.com/dogsinatas29)
