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
