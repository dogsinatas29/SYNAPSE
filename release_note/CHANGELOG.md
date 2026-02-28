# Release Notes - v0.2.9

> **"Ghostbusters"**

Version 0.2.9 focuses on **Visual Integrity**. We've eliminated "Ghost Nodes" that plagued collapsed clusters and implemented automatic cleanup for empty groups, ensuring your architecture map remains clean and truthful.

## 👻 Ghost Node Fixes
- **Hit-Testing Logic**: Fixed an issue where nodes inside collapsed clusters were still selectable (invisible but interactive). Now, hidden nodes are truly hidden from mouse events.
- **Drag Selection**: Box selection now correctly ignores nodes currently hidden within a collapsed cluster.

## 🧹 Auto-Cleanup
- **Empty Cluster Removal**: When all nodes in a cluster are deleted, the empty container is now automatically removed to prevent visual clutter.
- **Backend Sync**: This cleanup logic is synchronized between the frontend canvas and the persistent backend state.

---

# Release Notes - v0.2.8

> **"Law & Order"**

Version 0.2.8 introduces the **Rule Externalization** system, giving you granular control over your architecture's integrity. It also brings significant quality-of-life improvements to the canvas interactions.

## ⚖️ Rule Externalization
- **`RULES.md` Integration**: Synapse now respects a `RULES.md` file in your project root.
    - Define **Inclusion/Exclusion** patterns (e.g., ignore `*.test.ts`, include `src/core/*`).
    - Set **Edge Constraints** (e.g., `Controller` cannot depend on `Repository` directly).
- **Auto-Generation**: If missing, a default `RULES.md` is automatically created to get you started.
- **UI Access**: Added a **Rules (⚖️)** button to the toolbar for quick access to your architectural constitution.

## 🛠️ Canvas Enhancements
- **Cluster Rollup**: Fixed an issue where collapsing a cluster did not visually hide its child nodes. Now executes a clean "fold" animation.
- **Multi-Node Deletion**:
    - Select multiple nodes (Shift+Click or Drag) and delete them all at once.
    - **Backspace Support**: Added `Backspace` as a hotkey for deletion (in addition to `Delete`).
- **Ghost Node Exorcism**: Improved logic to prevent "zombie" nodes from reappearing after deletion if they were referenced in `GEMINI.md` code blocks.

## 🐛 Bug Fixes
- **View State Preservation**: Fixed camera resetting unexpectedly during certain graph updates.
- **Drag Selection**: Improved collision detection for box selection.

---

# Release Notes - v0.2.6

> **"Context is King"**

Version 0.2.6 introduces a major upgrade to the **Log Prompt** workflow, making it a powerful tool for capturing the "Why" behind your architecture.

## 🌟 New Features
- **Context-Aware Logging (`Ctrl+Alt+M`)**:
    - **Node Auto-Binding**: Selecting a node automatically focuses the log on that component.
    - **Visual Tagging**: Categorize logs (`[Discovery]`, `[Reasoning]`, `[Action]`, `[Fix]`).
    - **State Snapshotting**: Saves the exact canvas view (Zoom/Pan) with the log for future restoration.
    - **One-Click Access**: Open `context.md` directly from the notification.

## 📄 Documentation
- Updated `README.md` and `README.ko.md` with new Context UI guides.

---

# Release Notes - v0.2.5

## 🧹 Housekeeping & Cleanup
- **Project Root Cleanup**: Removed redundant placeholder files (`CanvasPanel.ts`, `FileScanner.ts`, `extension.ts`, `schema.js`, etc.) from the project root. The codebase is now cleaner and strictly follows the `src/` directory structure.
- **Example File Removal**: Deleted auto-generated example files (`login.py`, `board.py`, `schema.sql`) that were causing confusion.

## 🐛 Bug Fixes
- **Focus Stabilization**: Fixed an issue where the canvas camera would reset to default zoom/pan when clicking "Approve" or "Reject" on a node. The view now remains stable, allowing for a smoother review workflow.
- **Ghost Node Exorcism**: Patched `GeminiParser.ts` to correctly ignore file paths inside Markdown code blocks. This prevents example paths in `GEMINI.md` from appearing as disconnected "Ghost Nodes" in the graph.

## ✨ New Features
- **Context-Aware Log Prompt (`Ctrl+Alt+M`)**: 
    - You can now choose to **Append** your design thoughts to a single `context.md` file instead of creating a new file for every log.
    - Added a QuickPick menu to select between "Append to context.md" (Default) and "Create New Log File".

# Release Notes - v0.2.4

## 🏁 Strategic Execution Flow & Single Source of Truth
- **Authoritative Flow**: Formally defined Flow View as the final authoritative state (SSOT) to prevent synchronization drift between different editing modes.
- **START/END Markers**: Added explicit terminal markers for logical clarity in execution paths.
- **Functional Entry Points**: Prioritized functional roots (`main.*`, `index.*`) over configuration metadata.
- **Ghost Node Isolation**: Automated isolation of degree-0 nodes into a "Storage" cluster for a cleaner main view.

## 🏗️ Full TypeScript & Logic Support (Core Enhancement)
- **Advanced Scanning**: Comprehensive support for TypeScript `interface`, `type`, and `enum` declarations.
- **TS Modifiers**: Correct detection of `public`, `private`, `protected`, and `async` method combinations.
- **Type-Safe Dependencies**: Improved handling of `import type` to accurately map architectural bonds without execution overhead.
- **Logic Flow Recognition**: Added detection for `try/catch` blocks and `switch` statements within the logic flow visualization.

# Release Notes - v0.1.8

## 🔌 Enhanced LSP Integration (Editor-First Design)
- **Hover Provider**: Added real-time information tooltips for file paths and references within ALL Markdown files.
- **Definition Provider (Go to Definition)**: Enabled `Ctrl+Click` navigation from Markdown documentation directly to the referenced source code.
- **Diagnostics**: Implemented automatic file existence checks; invalid file paths in documentation are now highlighted as warnings.
- **Build Optimization**: Refined `tsconfig.json` to exclude build artifacts, ensuring cleaner packaging and faster compilation.

# Release Notes - v0.1.7

## 🚀 Bug Fixes & Packaging
- **Activation Fix**: Resolved "command not found" errors after reload by explicitly defining activation events for all commands.
- **Dependency Bundle**: Fixed `.vscodeignore` to ensure `node_modules` are included in the VSIX package, preventing activation crashes due to missing libraries.
- **Verbose Logging**: Added internal logs (`[SYNAPSE]`) to track activation progress and identify failure points.

# Release Notes - v0.1.6

## 📜 Legal & Documentation
- **GPL 3.0 License**: Confirmed and added license information to all README files.
- **Header Standardization**: Ensured GPL 3.0 headers are present in core source files.

# Release Notes - v0.1.5

## 🔧 Maintenance
- Internal optimizations for extension activation and path resolving.
- Refined styling of the visual canvas for better consistency.

# Release Notes - v0.1.4

## 🚀 Hotfix: Always-On Thought Stream
- **Global Keybinding (Zero-Context Activation)**: `Ctrl+Alt+M` now works globally, even on an empty workbench (Welcome Page).
- **Auto-Sync**: The canvas now automatically detects new prompt logs in the `prompts/` folder and refreshes instantly.

# Release Notes - v0.1.3

## 🐛 Bug Fixes
- **Keybinding Activation**: Fixed an issue where `Ctrl+Alt+M` would not trigger the command if the extension wasn't already active.
- **Context Relaxation**: Removed restrictive `when` clauses to allow broader access to the prompt logger.

# Release Notes - v0.1.2

## ✨ New Feature: Prompt Traceability Engine
- **Strategic Command**: `Ctrl+Alt+M` (or `Synapse: Log Prompt`) to instantly capture your design thoughts.
- **Structured Parsing**: Automatically extracts `# Goal`, `# Decision`, `# Context` from your prompts.
- **Origin Edge**: Referenced files in your prompt (e.g., `[src/main.ts](src/main.ts)`) are visualized as **Origin Edges** on the canvas, showing the "Cause & Effect" of your decisions.
- **Git Auto-Staging**: Every logged prompt is automatically saved as a Markdown file in `prompts/` and staged to Git.

---

# Release Notes - v0.1.1

## 🚀 New Features

### 💾 Prompt Traceability (New!)
Document your design decisions directly within the canvas.
- **Save Button**: A new `Save` icon (💾) in the toolbar logs your thoughts.
- **Auto-Save Option**: Enable `synapse.prompt.autoSave` in settings to save prompts instantly with a timestamp, keeping you in the flow.
- **Manual Control**: Default behavior prompts for a filename/title for better organization.

### 📚 Multilingual Documentation
- **Korean Support**: Added [`README.ko.md`](README.ko.md) for Korean users.
- **English Support**: Refined [`README.md`](README.md).

## 🔥 Core Strategies

### Multi-MD Strategy & Auto-Save
- **Context Awareness**: Automatically scans `prompts/*.md` as history and other `.md` files as documentation.
- **Zero-Friction Logging**: Designed to minimize interruption while capturing critical architectural decisions.

## 🛠️ Enhancements
- **Refined Phrasing**: Updated documentation to better reflect "Various Language Support" (다양한 언어 아키텍처 분석).
- **UI Update**: Added "Save Prompt" button to the main toolbar.
