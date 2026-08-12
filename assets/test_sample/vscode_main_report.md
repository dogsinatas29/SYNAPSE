# 🔬 SYNAPSE Architecture Scan Report (EV-LIVE)
Generated: 2026-08-12T07:29:33.032Z

## 0. Analysis Subject (Layer -3)
- **Subject**: Module: src/vs/platform/agentHost/node
- **Files**: 13544
- **Internal Edges**: 16770
- **Boundary Edges**: 82452

### Subject Fingerprint (Top Internal Domains)
- Module: src/vs/platform/agentHost/node
- Module: src/vs/workbench/contrib/chat
- Module: extensions/copilot/src/extension/completions/core
- Module: extensions/copilot/src/extension/chatSessions
- Module: src/vs/workbench/contrib/notebook

## 1. Executive Summary
**Scan Context**: Sub-cluster Analysis
**Observation**: External Dependency Ratio = 4.9x
**Assessment**: Selected cluster depends heavily on modules outside the scan boundary.
**Implication**: This does not imply whole-project instability.

**Why High External Coupling?**
- **Boundary Edge Count**: 82452 / 16770 (Internal)
- **Top 3 Contributors**: 상위 3개 파일(extHost.protocol.ts, chatInputPart.ts, window.ts)이 전체 Boundary Edge의 **0.3%** (226개)를 생성하고 있습니다.

**Cumulative Boundary Contribution**
- **Top 3**: 0.3% (226 edges)
- **Top 10**: 0.8% (656 edges)
- **Top 50**: 3.4% (2781 edges)
- **Top 100**: 6.0% (4927 edges)

**Audit Confidence**: 85%

Base Score                     70
Grammar Noise Filtered        +0
Assembly Point Classified      +5
Contract Hub Verified          +4
Ghost Ratio < 5%               +6
Unknown References             0
Final Score                   85

### Global Metrics
- **Entropy**: 12
- **Ghost Dependencies**: 2679

### Dependency Sources Breakdown
**Ghost Dependencies (Scanner Issues)**
  - N/A

**External Dependencies (Architecture)**
  - N/A


## 2. Impact Files (Architectural Assessment)
### 1. src/vs/workbench/api/common/extHost.protocol.ts
- **Role**: CONTRACT_HUB
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/api/common/extHost.protocol.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 86
- Fan-Out: 94
- Blast Radius: 170 Clusters

**Top External Targets (Evidence)**
- src/vs/platform/action/common/action.ts (1 edges)
- src/vs/workbench/contrib/terminal/common/environmentVariable.ts (1 edges)
- src/vs/base/common/themables.ts (1 edges)
- extensions/copilot/src/extension/prompts/node/panel/chatVariables.tsx (1 edges)
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/openai/model.ts (1 edges)
- extensions/copilot/src/extension/prompts/node/panel/search.tsx (1 edges)
- src/vs/code/electron-utility/sharedProcess/contrib/extensions.ts (1 edges)
- src/vs/workbench/contrib/chat/common/chatSessionsService.ts (1 edges)
- src/vs/workbench/contrib/chat/common/editing/chatCodeMapperService.ts (1 edges)
- src/vs/editor/common/encodedTokenAttributes.ts (1 edges)

### 2. src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 75
- Fan-Out: 134
- Blast Radius: 178 Clusters

**Top External Targets (Evidence)**
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/snippy/network.ts (1 edges)
- src/vs/platform/agentHost/common/state/protocol/common/actions.ts (1 edges)
- src/vs/editor/contrib/suggest/browser/suggestController.ts (1 edges)
- src/vs/workbench/contrib/accessibility/browser/accessibilityConfiguration.ts (1 edges)
- src/vs/workbench/contrib/accessibility/common/accessibilityCommands.ts (1 edges)
- src/vs/base/common/codicons.ts (1 edges)
- src/vs/nls.ts (1 edges)
- src/vs/base/browser/ui/actionbar/actionViewItems.ts (1 edges)
- src/vs/editor/common/core/position.ts (1 edges)
- src/vs/platform/accessibility/common/accessibility.ts (1 edges)

### 3. src/vs/workbench/electron-browser/window.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/electron-browser/window.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 65
- Fan-Out: 67
- Blast Radius: 134 Clusters

**Top External Targets (Evidence)**
- src/vs/base/parts/sandbox/electron-browser/globals.ts (1 edges)
- src/vs/platform/actions/browser/menuEntryActionViewItem.ts (1 edges)
- extensions/copilot/src/extension/typescriptContext/serverPlugin/src/common/host.ts (1 edges)
- src/vs/workbench/services/integrity/common/integrity.ts (1 edges)
- src/vs/base/browser/ui/actionbar/actionbar.ts (1 edges)
- extensions/markdown-language-features/src/util/async.ts (1 edges)
- src/vs/workbench/services/environment/common/environmentService.ts (1 edges)
- src/vs/workbench/services/lifecycle/common/lifecycle.ts (1 edges)
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/uri.ts (1 edges)
- src/vs/platform/product/common/productService.ts (1 edges)

### 4. extensions/copilot/src/extension/intents/node/agentIntent.ts
- **Role**: COORDINATOR
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/intents/node/agentIntent.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 63
- Fan-Out: 68
- Blast Radius: 130 Clusters

**Top External Targets (Evidence)**
- extensions/copilot/src/extension/prompts/node/agent/backgroundSummarizer.ts (1 edges)
- extensions/copilot/src/extension/prompt/common/conversation.ts (1 edges)
- extensions/copilot/src/platform/tasks/common/tasksService.ts (1 edges)
- extensions/copilot/src/extension/prompts/node/agent/promptRegistry.ts (1 edges)
- src/vs/platform/instantiation/common/instantiation.ts (1 edges)
- extensions/copilot/src/extension/prompt/node/documentContext.ts (1 edges)
- extensions/copilot/src/platform/otel/common/genAiMetrics.ts (1 edges)
- extensions/copilot/src/extension/prompts/node/base/promptRenderer.ts (1 edges)
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/networking.ts (1 edges)
- extensions/copilot/src/platform/otel/common/otelService.ts (1 edges)

### 5. src/vs/workbench/contrib/terminal/browser/terminalInstance.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/browser/terminalInstance.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 62
- Fan-Out: 84
- Blast Radius: 146 Clusters

**Top External Targets (Evidence)**
- src/vs/base/browser/keyboardEvent.ts (1 edges)
- src/vs/workbench/contrib/accessibility/common/accessibilityCommands.ts (1 edges)
- addon-progress (1 edges)
- resources/server/bin-dev/helpers/browser.sh (1 edges)
- src/vs/base/common/uuid.ts (1 edges)
- src/vs/platform/instantiation/common/instantiation.ts (1 edges)
- src/vs/platform/opener/common/opener.ts (1 edges)
- src/vs/base/browser/ui/scrollbar/scrollableElement.ts (1 edges)
- extensions/copilot/src/extension/agents/node/adapters/types.ts (1 edges)
- src/vs/workbench/services/editor/browser/editorService.ts (1 edges)

### 6. src/vs/workbench/contrib/search/browser/searchView.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/search/browser/searchView.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 62
- Fan-Out: 79
- Blast Radius: 143 Clusters

**Top External Targets (Evidence)**
- src/vs/nls.ts (1 edges)
- src/vs/editor/common/editorCommon.ts (1 edges)
- extensions/copilot/src/extension/prompts/node/panel/preferences.tsx (1 edges)
- src/vs/platform/theme/common/themeService.ts (1 edges)
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/progress.ts (1 edges)
- src/vs/platform/list/browser/listService.ts (1 edges)
- src/vs/platform/opener/common/opener.ts (1 edges)
- src/vs/editor/browser/editorBrowser.ts (1 edges)
- src/vs/platform/agentHost/common/state/protocol/common/actions.ts (1 edges)
- extensions/media-preview/src/util/dom.ts (1 edges)

### 7. src/vs/editor/browser/view.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/editor/browser/view.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 62
- Fan-Out: 63
- Blast Radius: 95 Clusters

**Top External Targets (Evidence)**
- src/vs/editor/browser/view/viewPart.ts (1 edges)
- src/vs/editor/common/viewLayout/viewLinesViewportData.ts (1 edges)
- src/vs/editor/browser/viewParts/overviewRuler/decorationsOverviewRuler.ts (1 edges)
- src/vs/editor/browser/viewParts/marginDecorations/marginDecorations.ts (1 edges)
- src/vs/base/browser/mouseEvent.ts (1 edges)
- src/vs/editor/browser/view/viewUserInputEvents.ts (1 edges)
- src/vs/editor/browser/controller/editContext/native/nativeEditContext.ts (1 edges)
- src/vs/editor/browser/viewParts/lineNumbers/lineNumbers.ts (1 edges)
- src/vs/platform/userInteraction/browser/userInteractionService.ts (1 edges)
- src/vs/workbench/contrib/notebook/browser/viewModel/viewContext.ts (1 edges)

### 8. src/vs/sessions/contrib/changes/browser/changesView.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/sessions/contrib/changes/browser/changesView.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 61
- Fan-Out: 72
- Blast Radius: 154 Clusters

**Top External Targets (Evidence)**
- extensions/media-preview/src/util/dom.ts (1 edges)
- src/vs/platform/actionWidget/browser/actionWidget.ts (1 edges)
- src/vs/workbench/services/views/browser/viewsService.ts (1 edges)
- src/vs/platform/list/browser/listService.ts (1 edges)
- src/vs/base/common/resourceTree.ts (1 edges)
- src/vs/platform/label/common/label.ts (1 edges)
- src/vs/workbench/browser/dnd.ts (1 edges)
- src/vs/sessions/services/sessions/browser/sessionsService.ts (1 edges)
- src/vs/platform/actions/browser/menuEntryActionViewItem.ts (1 edges)
- src/vs/sessions/contrib/providers/agentHost/browser/agentHostSkillButtons.ts (1 edges)

### 9. src/vs/editor/editor.all.ts
- **Role**: DOMAIN_SERVICE
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/editor/editor.all.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 60
- Fan-Out: 63
- Blast Radius: 170 Clusters

**Top External Targets (Evidence)**
- src/vs/editor/contrib/wordHighlighter/browser/wordHighlighter.ts (1 edges)
- src/vs/editor/contrib/colorPicker/browser/colorPickerContribution.ts (1 edges)
- src/vs/editor/contrib/gotoError/browser/markerSelectionStatus.ts (1 edges)
- extensions/typescript-language-features/src/languageFeatures/folding.ts (1 edges)
- src/vs/editor/contrib/fontZoom/browser/fontZoom.ts (1 edges)
- src/vs/editor/contrib/inPlaceReplace/browser/inPlaceReplace.ts (1 edges)
- src/vs/editor/contrib/format/browser/formatActions.ts (1 edges)
- src/vs/editor/contrib/stickyScroll/browser/stickyScrollContribution.ts (1 edges)
- src/vs/editor/contrib/gotoError/browser/gotoError.ts (1 edges)
- src/vs/editor/contrib/insertFinalNewLine/browser/insertFinalNewLine.ts (1 edges)

### 10. src/vs/workbench/contrib/debug/browser/repl.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/debug/browser/repl.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 60
- Fan-Out: 70
- Blast Radius: 163 Clusters

**Top External Targets (Evidence)**
- src/vs/base/common/range.ts (1 edges)
- src/vs/base/common/codicons.ts (1 edges)
- src/vs/base/common/themables.ts (1 edges)
- src/vs/workbench/browser/actions/widgetNavigationCommands.ts (1 edges)
- src/vs/workbench/common/views.ts (1 edges)
- extensions/media-preview/src/util/dom.ts (1 edges)
- src/vs/editor/common/config/editorOptions.ts (1 edges)
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/language/languages.ts (1 edges)
- src/vs/platform/accessibilitySignal/browser/accessibilitySignalService.ts (1 edges)
- src/vs/workbench/contrib/accessibility/browser/accessibilityConfiguration.ts (1 edges)


## 3. Evidence Layer
### 3.1 Ghost Evidence
<details><summary><b>Show Ghost Evidence (Top 50)</b></summary>

- [src/vs/workbench/services/textMate/browser/backgroundTokenization/threadedBackgroundTokenizerFactory.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/textMate/browser/backgroundTokenization/threadedBackgroundTokenizerFactory.ts) -> src/vs/workbench/services/textMate/browser/backgroundTokenization/worker/textMateTokenizationWorker.worker.ts (Count: 1)
- [src/vs/workbench/services/textMate/browser/backgroundTokenization/worker/textMateTokenizationWorker.worker.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/textMate/browser/backgroundTokenization/worker/textMateTokenizationWorker.worker.ts) -> vscode-oniguruma (Count: 1)
- [src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/taskHelpers.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/taskHelpers.ts) -> xterm (Count: 1)
- [src/vs/workbench/contrib/terminalContrib/quickFix/browser/quickFixAddon.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminalContrib/quickFix/browser/quickFixAddon.ts) -> headless (Count: 1)
- [src/vs/workbench/workbench.common.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.common.main.ts) -> src/vs/workbench/contrib/mcp/browser/mcp.view.contribution.ts (Count: 1)
- [test/sanity/src/index.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/test/sanity/src/index.ts) -> vscode-uri (Count: 1)
- [src/vs/workbench/contrib/terminal/browser/xterm-private.d.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/browser/xterm-private.d.ts) -> xterm (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/layout.contribution.darwin.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/layout.contribution.darwin.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/terminalContrib/commandGuide/browser/terminal.commandGuide.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminalContrib/commandGuide/browser/terminal.commandGuide.contribution.ts) -> xterm (Count: 1)
- [src/vs/workbench/services/host/browser/browserHostService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/host/browser/browserHostService.ts) -> src/vs/workbench/browser/web.api.ts (Count: 1)
- [src/vs/workbench/contrib/terminal/browser/terminalInstance.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/browser/terminalInstance.ts) -> addon-progress (Count: 1)
- [src/vs/workbench/contrib/styleOverrides/browser/styleOverrides.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/styleOverrides/browser/styleOverrides.contribution.ts) -> fontRamp (Count: 1)
- [src/vs/workbench/workbench.common.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.common.main.ts) -> src/vs/workbench/contrib/bracketPairColorizer2Telemetry/browser/bracketPairColorizer2Telemetry.contribution.ts (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/cz.win.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/cz.win.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/terminal/browser/xterm/xtermAddonImporter.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/browser/xterm/xtermAddonImporter.ts) -> addon-image (Count: 1)
- [test/unit/node/index.js](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/test/unit/node/index.js) -> minimist (Count: 1)
- [src/vs/workbench/contrib/terminalContrib/find/browser/terminalFindWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminalContrib/find/browser/terminalFindWidget.ts) -> addon-search (Count: 1)
- [src/vs/workbench/contrib/terminal/browser/xterm/xtermTerminal.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/browser/xterm/xtermTerminal.ts) -> addon-search (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/pt-br.win.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/pt-br.win.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [src/vs/workbench/services/textMate/browser/tokenizationSupport/textMateTokenizationSupport.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/textMate/browser/tokenizationSupport/textMateTokenizationSupport.ts) -> vscode-textmate (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/en-belgian.win.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/en-belgian.win.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [test/monaco/core.js](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/test/monaco/core.js) -> monaco-editor-core (Count: 1)
- [src/vs/workbench/workbench.web.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.web.main.ts) -> src/vs/workbench/contrib/webview/browser/webview.web.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/terminal/browser/xterm/xtermTerminal.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/browser/xterm/xtermTerminal.ts) -> addon-ligatures (Count: 1)
- [src/vs/workbench/contrib/styleOverrides/browser/styleOverrides.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/styleOverrides/browser/styleOverrides.contribution.ts) -> padding (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/es-latin.win.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/es-latin.win.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [src/vs/workbench/services/environment/browser/environmentService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/environment/browser/environmentService.ts) -> src/vs/workbench/browser/web.api.ts (Count: 1)
- [src/vs/workbench/workbench.common.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.common.main.ts) -> src/vs/workbench/contrib/accessibilitySignals/browser/accessibilitySignal.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/terminal/browser/terminalConfigurationService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/browser/terminalConfigurationService.ts) -> xterm-private (Count: 1)
- [src/vs/workbench/services/treeSitter/browser/treeSitterLibraryService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/treeSitter/browser/treeSitterLibraryService.ts) -> tree-sitter-wasm (Count: 1)
- [src/vs/workbench/workbench.common.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.common.main.ts) -> src/vs/workbench/contrib/chat/browser/chat.view.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/terminalContrib/stickyScroll/browser/terminalStickyScrollOverlay.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminalContrib/stickyScroll/browser/terminalStickyScrollOverlay.ts) -> xterm-private (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/de.linux.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/de.linux.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/terminalContrib/links/browser/terminalMultiLineLinkDetector.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminalContrib/links/browser/terminalMultiLineLinkDetector.ts) -> xterm (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/ru.win.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/ru.win.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [test/sanity/src/context.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/test/sanity/src/context.ts) -> node-fetch (Count: 1)
- [src/vs/workbench/contrib/terminal/browser/widgets/terminalHoverWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/browser/widgets/terminalHoverWidget.ts) -> xterm (Count: 1)
- [src/vs/workbench/workbench.common.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.common.main.ts) -> src/vs/workbench/contrib/logs/browser/logs.contribution.ts (Count: 1)
- [test/mcp/src/automationTools/terminal.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/test/mcp/src/automationTools/terminal.ts) -> zod (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/es.win.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/es.win.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [src/vs/workbench/workbench.common.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.common.main.ts) -> src/vs/workbench/contrib/welcomeViews/common/newFile.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/terminalContrib/links/browser/links.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminalContrib/links/browser/links.ts) -> xterm (Count: 1)
- [src/vs/workbench/services/textMate/browser/backgroundTokenization/worker/textMateWorkerTokenizer.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/textMate/browser/backgroundTokenization/worker/textMateWorkerTokenizer.ts) -> src/vs/workbench/services/textMate/browser/backgroundTokenization/worker/textMateTokenizationWorker.worker.ts (Count: 1)
- [src/vs/workbench/contrib/output/browser/outputLinkProvider.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/output/browser/outputLinkProvider.ts) -> src/vs/editor/common/services/textModelSync/textModelSync.impl.ts (Count: 1)
- [src/vs/workbench/contrib/terminalContrib/links/browser/terminalLinkManager.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminalContrib/links/browser/terminalLinkManager.ts) -> xterm (Count: 1)
- [src/vs/workbench/contrib/debug/browser/debug.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/debug/browser/debug.contribution.ts) -> src/vs/workbench/contrib/debug/browser/debug.service.contribution.ts (Count: 1)
- [test/sanity/src/index.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/test/sanity/src/index.ts) -> rimraf (Count: 1)
- [src/vs/workbench/contrib/terminal/common/scripts/shellIntegration-bash.sh](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/common/scripts/shellIntegration-bash.sh) -> profile (Count: 1)
- [src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/executeStrategy/basicExecuteStrategy.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/executeStrategy/basicExecuteStrategy.ts) -> xterm (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/es.darwin.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/es.darwin.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
</details>

### 3.2 Boundary Evidence
<details><summary><b>Show Boundary Evidence (Top 50)</b></summary>

- [extensions/copilot/src/platform/workspaceChunkSearch/node/codeSearch/codeSearchChunkSearch.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/platform/workspaceChunkSearch/node/codeSearch/codeSearchChunkSearch.ts) -> src/vs/workbench/common/resources.ts (Count: 1)
- [src/vs/code/node/cli.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/code/node/cli.ts) -> src/vs/code/node/cliArgs.ts (Count: 1)
- [Ghost Dependency (extensions/copilot/src/extension/completions-core/vscode-node/lib/src/ghostText/ghostText.ts)](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/completions-core/vscode-node/lib/src/ghostText/ghostText.ts) -> extensions/copilot/src/platform/completions-core/common/openai/copilotAnnotations.ts (Count: 1)
- [src/vs/platform/agentHost/common/agentService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/platform/agentHost/common/agentService.ts) -> src/vs/platform/agentHost/common/state/sessionActions.ts (Count: 1)
- [src/vs/sessions/contrib/providers/remoteAgentHost/browser/remoteAgentHostActions.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/sessions/contrib/providers/remoteAgentHost/browser/remoteAgentHostActions.ts) -> extensions/copilot/test/simulation/fixtures/codeMapper/quickInput.ts (Count: 1)
- [src/vs/workbench/contrib/search/browser/searchQuickAccess.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/search/browser/searchQuickAccess.contribution.ts) -> src/vs/editor/contrib/quickAccess/browser/gotoLineQuickAccess.ts (Count: 1)
- [src/vs/base/common/codiconsUtil.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/base/common/codiconsUtil.ts) -> extensions/copilot/src/extension/agents/node/adapters/types.ts (Count: 1)
- [extensions/copilot/src/extension/completions-core/vscode-node/extension/src/codeReferencing/outputChannel.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/completions-core/vscode-node/extension/src/codeReferencing/outputChannel.ts) -> src/vs/workbench/services/lifecycle/common/lifecycle.ts (Count: 1)
- [src/vs/workbench/contrib/welcomeGettingStarted/browser/gettingStarted.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/welcomeGettingStarted/browser/gettingStarted.ts) -> src/vs/workbench/contrib/welcomeGettingStarted/common/gettingStartedContent.ts (Count: 1)
- [src/vs/workbench/contrib/terminal/browser/terminalIcon.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/browser/terminalIcon.ts) -> src/vs/platform/instantiation/common/instantiation.ts (Count: 1)
- [src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/runInTerminalTool.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/runInTerminalTool.ts) -> extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/uri.ts (Count: 1)
- [src/vs/workbench/contrib/terminal/browser/detachedTerminal.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/browser/detachedTerminal.ts) -> cli/src/util/errors.rs (Count: 1)
- [extensions/copilot/src/extension/completions-core/vscode-node/extension/src/copilotCompletionFeedbackTracker.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/completions-core/vscode-node/extension/src/copilotCompletionFeedbackTracker.ts) -> src/vs/platform/instantiation/common/instantiation.ts (Count: 1)
- [extensions/copilot/src/extension/chatSessions/copilotcli/common/copilotCLIPrompt.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/chatSessions/copilotcli/common/copilotCLIPrompt.ts) -> extensions/copilot/src/vscodeTypes.ts (Count: 1)
- [src/vs/workbench/contrib/tasks/electron-browser/taskService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/tasks/electron-browser/taskService.ts) -> src/vs/workbench/services/path/browser/pathService.ts (Count: 1)
- [src/vs/sessions/contrib/codeReview/browser/codeReview.contributions.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/sessions/contrib/codeReview/browser/codeReview.contributions.ts) -> src/vs/sessions/services/sessions/common/sessionsManagement.ts (Count: 1)
- [src/vs/workbench/contrib/bulkEdit/browser/preview/bulkEdit.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/bulkEdit/browser/preview/bulkEdit.contribution.ts) -> src/vs/base/common/cancellation.ts (Count: 1)
- [src/vs/sessions/contrib/chat/browser/repoPicker.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/sessions/contrib/chat/browser/repoPicker.ts) -> src/vs/base/common/iconLabels.ts (Count: 1)
- [src/vs/platform/files/browser/indexedDBFileSystemProvider.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/platform/files/browser/indexedDBFileSystemProvider.ts) -> src/vs/base/browser/indexedDB.ts (Count: 1)
- [src/vs/workbench/contrib/chat/browser/widget/input/sessionTargetPickerActionItem.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/widget/input/sessionTargetPickerActionItem.ts) -> src/vs/workbench/contrib/chat/browser/widget/input/chatInputPickerActionItem.ts (Count: 1)
- [src/vs/workbench/electron-browser/parts/titlebar/titlebarPart.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/electron-browser/parts/titlebar/titlebarPart.ts) -> src/vs/workbench/electron-browser/parts/titlebar/menubarControl.ts (Count: 1)
- [src/vs/workbench/contrib/notebook/browser/diff/notebookDiffEditorBrowser.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/notebook/browser/diff/notebookDiffEditorBrowser.ts) -> src/vs/workbench/contrib/notebook/browser/notebookBrowser.ts (Count: 1)
- [src/vs/workbench/contrib/extensions/browser/extensions.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/extensions/browser/extensions.contribution.ts) -> extensions/copilot/test/simulation/fixtures/gen-method-issue-3602/editor.ts (Count: 1)
- [src/vs/workbench/contrib/chat/browser/aiCustomization/promptsServiceCustomizationItemProvider.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/aiCustomization/promptsServiceCustomizationItemProvider.ts) -> src/vs/sessions/contrib/chat/browser/customizationHarnessService.ts (Count: 1)
- [extensions/copilot/src/extension/tools/node/vscodeAPITool.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/tools/node/vscodeAPITool.ts) -> extensions/copilot/src/extension/tools/common/toolsRegistry.ts (Count: 1)
- [extensions/copilot/src/extension/tools/node/findTextInFilesTool.tsx](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/tools/node/findTextInFilesTool.tsx) -> extensions/copilot/src/platform/prompts/common/promptPathRepresentationService.ts (Count: 1)
- [extensions/copilot/src/extension/intents/node/unknownIntent.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/intents/node/unknownIntent.ts) -> extensions/copilot/src/util/common/test/shims/l10n.ts (Count: 1)
- [src/vs/sessions/contrib/changes/browser/checksWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/sessions/contrib/changes/browser/checksWidget.ts) -> src/vs/platform/agentHost/common/state/protocol/common/actions.ts (Count: 1)
- [extensions/html-language-features/server/src/modes/languageModes.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/html-language-features/server/src/modes/languageModes.ts) -> extensions/html-language-features/server/src/modes/htmlMode.ts (Count: 1)
- [extensions/copilot/src/extension/chatSessions/copilotcli/vscode-node/copilotCLIPromptReferences.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/chatSessions/copilotcli/vscode-node/copilotCLIPromptReferences.ts) -> src/vs/workbench/common/resources.ts (Count: 1)
- [src/vs/workbench/browser/parts/editor/breadcrumbs.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/browser/parts/editor/breadcrumbs.ts) -> src/vs/base/common/glob.ts (Count: 1)
- [src/vs/workbench/contrib/chat/browser/chatDebug/chatDebugLogsView.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/chatDebug/chatDebugLogsView.ts) -> src/vs/workbench/contrib/chat/common/model/chatUri.ts (Count: 1)
- [src/vs/workbench/contrib/issue/browser/issueQuickAccess.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/issue/browser/issueQuickAccess.ts) -> src/vs/platform/agentHost/common/state/protocol/common/actions.ts (Count: 1)
- [src/vs/workbench/contrib/files/browser/fileCommands.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/files/browser/fileCommands.ts) -> src/vs/base/common/keyCodes.ts (Count: 1)
- [src/vs/editor/contrib/colorPicker/browser/standaloneColorPicker/standaloneColorPickerActions.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/editor/contrib/colorPicker/browser/standaloneColorPicker/standaloneColorPickerActions.ts) -> src/vs/editor/contrib/colorPicker/browser/standaloneColorPicker/standaloneColorPickerController.ts (Count: 1)
- [src/vs/workbench/browser/parts/editor/singleEditorTabsControl.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/browser/parts/editor/singleEditorTabsControl.ts) -> src/vs/workbench/browser/parts/editor/editorTabsControl.ts (Count: 1)
- [src/vs/workbench/contrib/debug/common/debugContentProvider.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/debug/common/debugContentProvider.ts) -> src/vs/editor/common/languages/language.ts (Count: 1)
- [test/automation/src/workbench.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/test/automation/src/workbench.ts) -> test/automation/src/problems.ts (Count: 1)
- [src/vs/workbench/contrib/testing/browser/testingExplorerView.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/testing/browser/testingExplorerView.ts) -> src/vs/platform/actions/browser/dropdownWithPrimaryActionViewItem.ts (Count: 1)
- [src/vs/workbench/contrib/multiDiffEditor/browser/multiDiffEditorInput.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/multiDiffEditor/browser/multiDiffEditorInput.ts) -> src/vs/editor/browser/widget/multiDiffEditor/multiDiffEditorViewModel.ts (Count: 1)
- [extensions/copilot/src/extension/intents/node/testIntent/testFromTestInvocation.tsx](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/intents/node/testIntent/testFromTestInvocation.tsx) -> extensions/copilot/src/extension/prompt/node/documentContext.ts (Count: 1)
- [src/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch.ts) -> src/vs/editor/contrib/gotoSymbol/browser/peek/referencesController.ts (Count: 1)
- [src/vs/platform/extensionManagement/common/extensionStorage.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/platform/extensionManagement/common/extensionStorage.ts) -> src/vs/workbench/services/extensionManagement/common/extensionManagement.ts (Count: 1)
- [src/vs/workbench/services/agentHost/common/agentHostResourceService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/agentHost/common/agentHostResourceService.ts) -> extensions/typescript-language-features/src/configuration/configuration.ts (Count: 1)
- [src/vs/editor/common/diff/defaultLinesDiffComputer/defaultLinesDiffComputer.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/editor/common/diff/defaultLinesDiffComputer/defaultLinesDiffComputer.ts) -> src/vs/editor/common/diff/defaultLinesDiffComputer/heuristicSequenceOptimizations.ts (Count: 1)
- [src/vs/sessions/contrib/files/browser/workspaceFolderActions.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/sessions/contrib/files/browser/workspaceFolderActions.ts) -> src/vs/sessions/services/sessions/browser/sessionsService.ts (Count: 1)
- [src/vs/workbench/contrib/browserView/electron-browser/tools/browserTools.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/browserView/electron-browser/tools/browserTools.contribution.ts) -> src/vs/workbench/services/editor/browser/editorService.ts (Count: 1)
- [src/vs/workbench/contrib/notebook/browser/diff/notebookDiffActions.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/notebook/browser/diff/notebookDiffActions.ts) -> src/vs/workbench/contrib/notebook/browser/diff/notebookMultiDiffEditor.ts (Count: 1)
- [src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingDeletedFileEntry.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingDeletedFileEntry.ts) -> src/vs/editor/common/languages/language.ts (Count: 1)
- [src/vs/workbench/contrib/inlineChat/browser/inlineChatWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/inlineChat/browser/inlineChatWidget.ts) -> src/vs/base/common/iconLabels.ts (Count: 1)
</details>

## 4. System Assembly Points (Healthy Hubs)
- [src/vs/workbench/workbench.common.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.common.main.ts) (Role: ASSEMBLY_POINT)
- [src/vs/code/electron-main/app.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/code/electron-main/app.ts) (Role: ASSEMBLY_POINT)
- [src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts) (Role: ASSEMBLY_POINT)
- [src/vs/sessions/sessions.common.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/sessions/sessions.common.main.ts) (Role: ASSEMBLY_POINT)
- [extensions/copilot/src/lib/node/chatLibMain.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/lib/node/chatLibMain.ts) (Role: ASSEMBLY_POINT)
- [extensions/copilot/src/extension/extension/vscode/services.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/extension/vscode/services.ts) (Role: ASSEMBLY_POINT)
- [src/vs/workbench/browser/web.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/browser/web.main.ts) (Role: ASSEMBLY_POINT)
- [src/vs/editor/standalone/browser/standaloneServices.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/editor/standalone/browser/standaloneServices.ts) (Role: ASSEMBLY_POINT)
- [src/vs/server/node/serverServices.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/server/node/serverServices.ts) (Role: ASSEMBLY_POINT)
- [src/vs/sessions/sessions.web.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/sessions/sessions.web.main.ts) (Role: ASSEMBLY_POINT)
- [src/vs/code/electron-main/main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/code/electron-main/main.ts) (Role: ASSEMBLY_POINT)
- [src/vs/code/node/cliProcessMain.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/code/node/cliProcessMain.ts) (Role: ASSEMBLY_POINT)
- [src/vs/sessions/electron-browser/sessions.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/sessions/electron-browser/sessions.main.ts) (Role: ASSEMBLY_POINT)
- [src/vs/workbench/electron-browser/desktop.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/electron-browser/desktop.main.ts) (Role: ASSEMBLY_POINT)
- [src/vs/workbench/workbench.web.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.web.main.ts) (Role: ASSEMBLY_POINT)

### 4.1 ASSEMBLY_POINT Audit
cli/src/tunnels/code_server.rs
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
cli/src/tunnels/control_server.rs
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
cli/src/tunnels/singleton_client.rs
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
cli/src/tunnels/singleton_server.rs
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/configuration-editing/src/configurationEditingMain.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.25

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/extension/agents/node/langModelServer.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.85

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/chatSessions/claude/common/mcpServers/ideMcpServer.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.71

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/extension/chatSessions/claude/node/claudeLanguageModelServer.ts
Verdict: REJECTED

Evidence
FanOut: 27
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/chatSessions/copilotcli/node/missionControlApiClient.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/chatSessions/copilotcli/vscode-node/inProcHttpServer.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/chronicle/node/cloudSessionApiClient.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/extension/chronicle/node/cloudSessionStoreClient.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/extension/vscode-worker/services.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/extension/extension/vscode/services.ts
Verdict: ACCEPTED

Evidence
FanOut: 87
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
extensions/copilot/src/extension/externalAgents/node/oaiLanguageModelServer.ts
Verdict: REJECTED

Evidence
FanOut: 21
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/typescriptContext/serverPlugin/src/node/main.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.33

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/lib/node/chatLibMain.ts
Verdict: ACCEPTED

Evidence
FanOut: 111
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_FANOUT
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
extensions/copilot/src/platform/chunking/common/chunkingEndpointClient.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/endpoint/common/capiClient.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/remoteSearch/common/codeOrDocsSearchClient.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/workspaceChunkSearch/node/codeSearch/externalIngestClient.ts
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/css-language-features/client/src/browser/cssClientMain.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/css-language-features/client/src/cssClient.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/css-language-features/client/src/node/cssClientMain.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/css-language-features/server/src/browser/cssServerMain.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/css-language-features/server/src/browser/cssServerWorkerMain.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/css-language-features/server/src/cssServer.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/css-language-features/server/src/node/cssServerMain.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/css-language-features/server/src/node/cssServerNodeMain.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/emmet/src/browser/emmetBrowserMain.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/emmet/src/node/emmetNodeMain.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.33

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/extension-editing/src/extensionEditingBrowserMain.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/extension-editing/src/extensionEditingMain.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/git/src/askpass-main.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/git/src/git-editor-main.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/git/src/ipc/ipcClient.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/git/src/ipc/ipcServer.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/github-authentication/src/browser/authServer.ts
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/github-authentication/src/githubServer.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/github-authentication/src/node/authServer.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/html-language-features/client/src/browser/htmlClientMain.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/html-language-features/client/src/htmlClient.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/html-language-features/client/src/node/htmlClientMain.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/html-language-features/server/src/browser/htmlServerMain.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/html-language-features/server/src/browser/htmlServerWorkerMain.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/html-language-features/server/src/htmlServer.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.85

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/html-language-features/server/src/node/htmlServerMain.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/html-language-features/server/src/node/htmlServerNodeMain.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/ipynb/src/ipynbMain.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.40

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/json-language-features/client/src/browser/jsonClientMain.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/json-language-features/client/src/jsonClient.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.40

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/json-language-features/client/src/node/jsonClientMain.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.60

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/json-language-features/server/src/browser/jsonServerMain.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/json-language-features/server/src/browser/jsonServerWorkerMain.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/json-language-features/server/src/jsonServer.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/json-language-features/server/src/node/jsonServerMain.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/json-language-features/server/src/node/jsonServerNodeMain.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/markdown-language-features/src/client/client.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.63

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/merge-conflict/src/mergeConflictMain.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/merge-conflict/src/services.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.14

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/npm/src/npmBrowserMain.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/npm/src/npmMain.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/php-language-features/src/phpMain.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/terminal-suggest/src/terminalSuggestMain.ts
Verdict: REJECTED

Evidence
FanOut: 28
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/typescript-language-features/src/commands/restartTsServer.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/typescript-language-features/src/tsServer/server.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 0.63

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/typescript-language-features/src/typescriptServiceClient.ts
Verdict: REJECTED

Evidence
FanOut: 25
Boundary Ratio: 0.96

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/typescript-language-features/web/src/webServer.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/vscode-colorize-tests/src/colorizerTestMain.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
scripts/code-server.js
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
scripts/mock-policy-server/public/app.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
scripts/mock-policy-server/server.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
src/bootstrap-server.ts
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/server-main.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 0.79

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/base/common/worker/webWorkerBootstrap.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/base/parts/ipc/electron-main/ipcMain.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/code/electron-main/app.ts
Verdict: ACCEPTED

Evidence
FanOut: 129
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_FANOUT
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/code/electron-main/main.ts
Verdict: ACCEPTED

Evidence
FanOut: 68
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts
Verdict: ACCEPTED

Evidence
FanOut: 130
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_FANOUT
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/code/node/cliProcessMain.ts
Verdict: ACCEPTED

Evidence
FanOut: 62
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/editor/browser/config/elementSizeObserver.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/common/services/editorWebWorkerMain.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/editor/editor.main.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/standalone/browser/standaloneServices.ts
Verdict: ACCEPTED

Evidence
FanOut: 87
Boundary Ratio: 0.95

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/platform/agentHost/browser/remoteAgentHostProtocolClient.ts
Verdict: REJECTED

Evidence
FanOut: 32
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/node/agentHostBootstrap.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/node/agentHostMain.ts
Verdict: REJECTED

Evidence
FanOut: 59
Boundary Ratio: 0.68

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/agentHost/node/agentHostServerMain.ts
Verdict: REJECTED

Evidence
FanOut: 54
Boundary Ratio: 0.63

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/agentHost/node/claude/claudeFileEditObserver.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.57

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/agentHost/node/claude/claudeServerToolMcpServer.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/agentHost/node/claude/clientTools/claudeClientToolMcpServer.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.60

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/agentHost/node/codex/codexAppServerClient.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 0.55

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/agentHost/node/diffWorkerMain.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/node/shared/loopbackProxyServer.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/files/common/diskFileSystemProviderClient.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/files/electron-browser/remoteFileSystemProxyClient.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/files/electron-browser/remoteFileSystemProxyServer.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/files/electron-main/diskFileSystemProviderServer.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/files/node/diskFileSystemProviderServer.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/files/node/watcher/nodejs/nodejsClient.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/files/node/watcher/watcherClient.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/files/node/watcher/watcherMain.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/ipc/common/services.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/ipc/electron-browser/services.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/profiling/electron-browser/profileAnalysisWorkerMain.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/storage/electron-main/storageMain.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/terminal/node/ptyHostMain.ts
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.87

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/webContentExtractor/electron-main/cdpAccessibilityDomain.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/server/node/remoteExtensionHostAgentServer.ts
Verdict: REJECTED

Evidence
FanOut: 33
Boundary Ratio: 0.79

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/server/node/remoteFileSystemProviderServer.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 0.91

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/server/node/server.main.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.63

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/server/node/serverServices.ts
Verdict: ACCEPTED

Evidence
FanOut: 89
Boundary Ratio: 0.90

Reason Code:
ACCEPTED

---
src/vs/server/node/webClientServer.ts
Verdict: REJECTED

Evidence
FanOut: 20
Boundary Ratio: 0.90

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/sessions/contrib/github/browser/githubApiClient.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/sessions/electron-browser/sessions.main.ts
Verdict: ACCEPTED

Evidence
FanOut: 57
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/sessions/sessions.common.main.ts
Verdict: ACCEPTED

Evidence
FanOut: 119
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_FANOUT
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/sessions/sessions.desktop.main.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/sessions/sessions.web.main.ts
Verdict: ACCEPTED

Evidence
FanOut: 68
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/api/common/extensionHostMain.ts
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 0.63

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/api/common/extHost.common.services.ts
Verdict: REJECTED

Evidence
FanOut: 34
Boundary Ratio: 0.03

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/api/node/extHost.node.services.ts
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 0.95

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/node/extHostCLIServer.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/node/loopbackServer.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/worker/extensionHostWorkerMain.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/api/worker/extHost.worker.services.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/browser/parts/editor/editorsObserver.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/browser/parts/views/viewPaneContainer.ts
Verdict: REJECTED

Evidence
FanOut: 36
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/browser/web.main.ts
Verdict: ACCEPTED

Evidence
FanOut: 83
Boundary Ratio: 0.99

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/contrib/debug/node/telemetryApp.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/editSessions/common/editSessionsStorageClient.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/mcp/common/mcpServer.ts
Verdict: REJECTED

Evidence
FanOut: 40
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/notebookVisibleCellObserver.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.60

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/notebook/common/services/notebookWebWorkerMain.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/output/browser/outputServices.ts
Verdict: REJECTED

Evidence
FanOut: 24
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/output/common/outputLinkComputerMain.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/scm/browser/scmViewPaneContainer.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/testing/browser/testingViewPaneContainer.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/electron-browser/desktop.main.ts
Verdict: ACCEPTED

Evidence
FanOut: 56
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/services/agentHost/browser/editorRemoteAgentHostServiceClient.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/extensionManagement/common/extensionManagementChannelClient.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 0.91

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/files/electron-browser/watcherClient.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/languageDetection/browser/languageDetectionWebWorkerMain.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/remote/common/remoteFileSystemProviderClient.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/search/worker/localFileSearchMain.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/textMate/browser/backgroundTokenization/worker/textMateTokenizationWorker.workerMain.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/workbench.common.main.ts
Verdict: ACCEPTED

Evidence
FanOut: 136
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_FANOUT
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/workbench.desktop.main.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/workbench.web.main.ts
Verdict: ACCEPTED

Evidence
FanOut: 49
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---

### 4.2 CONTRACT_HUB Audit
*No candidates found.*

## 5. Knowledge Connectivity
<details><summary><b>Show Knowledge Sources</b></summary>

- [src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationWidget.ts) -> src/vs/platform/theme/common/themeService.ts
- [src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackService.ts) -> src/vs/workbench/contrib/chat/common/chatService/chatService.ts
- [src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationWidget.ts) -> extensions/copilot/src/platform/inlineEdits/common/utils/observable.ts
- [src/vs/workbench/contrib/chat/common/tools/builtinTools/reviewPlanTool.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/common/tools/builtinTools/reviewPlanTool.ts) -> src/vs/base/common/uuid.ts
- [src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationModelManager.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationModelManager.ts) -> extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/map.ts
- [src/vs/workbench/api/browser/mainThreadMeteredConnection.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/api/browser/mainThreadMeteredConnection.ts) -> src/vs/workbench/api/common/extHost.protocol.ts
- [src/vs/workbench/contrib/mcp/browser/mcpLanguageFeatures.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/mcp/browser/mcpLanguageFeatures.ts) -> src/vs/workbench/services/lifecycle/common/lifecycle.ts
- [extensions/copilot/src/extension/agents/vscode-node/test/planAgentProvider.spec.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/agents/vscode-node/test/planAgentProvider.spec.ts) -> src/vs/platform/instantiation/common/instantiation.ts
- [src/vs/workbench/contrib/chat/test/browser/widget/chatContentParts/chatPlanReviewPart.test.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/test/browser/widget/chatContentParts/chatPlanReviewPart.test.ts) -> src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatPlanReviewPart.ts
- [src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatPlanReviewPart.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatPlanReviewPart.ts) -> extensions/typescript-language-features/src/configuration/configuration.ts
- [src/vs/workbench/contrib/mcp/browser/mcpLanguageFeatures.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/mcp/browser/mcpLanguageFeatures.ts) -> extensions/copilot/src/platform/parser/test/node/markers.ts
- [extensions/copilot/src/extension/chatSessions/copilotcli/node/exitPlanModeHandler.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/chatSessions/copilotcli/node/exitPlanModeHandler.ts) -> extensions/markdown-language-features/src/util/async.ts
- [src/vs/workbench/contrib/chat/test/browser/widget/chatContentParts/chatPlanReviewPart.test.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/test/browser/widget/chatContentParts/chatPlanReviewPart.test.ts) -> src/vs/workbench/common/dialogs.ts
- [src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatPlanReviewPart.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatPlanReviewPart.ts) -> src/vs/editor/common/languages/language.ts
- [src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatPlanReviewPart.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatPlanReviewPart.ts) -> src/vs/workbench/contrib/chat/common/model/chatProgressTypes/chatPlanReviewData.ts
- [extensions/copilot/src/extension/chatSessions/claude/common/test/claudePlanFileTracker.spec.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/chatSessions/claude/common/test/claudePlanFileTracker.spec.ts) -> src/vs/platform/registry/common/platform.ts
- [src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationWidget.ts) -> src/vs/editor/browser/editorBrowser.ts
- [src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatPlanReviewPart.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatPlanReviewPart.ts) -> extensions/copilot/src/extension/completions-core/vscode-node/lib/src/snippy/network.ts
- [extensions/copilot/src/extension/chatSessions/claude/common/toolPermissionHandlers/exitPlanModeHandler.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/chatSessions/claude/common/toolPermissionHandlers/exitPlanModeHandler.ts) -> src/vs/base/common/cancellation.ts
- [src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationModelManager.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationModelManager.ts) -> src/vs/code/electron-utility/sharedProcess/contrib/extensions.ts
</details>

## 4. Expected After Surgery
🟢 **STRENGTHENED**
- **Entropy**: 12 -> N/A
- **Boundary Edges**: 82452 -> N/A


## 6. Raw Metrics
### 6.1 AEL Metrics
- **Architecture Entropy**: 12 / 100 (Risk Level: **LOW**)
- **False Positive Probability**: 30.0%

### 6.2 Source Breakdown (ASR 3.0)
#### Ghost Source Top N
  - N/A

#### Coupling Source Top N
  - **vs**: 24058 (43.9%)
  - **extensions**: 23000 (42%)
  - **cli**: 2199 (4%)
  - **.eslint-plugin-local**: 1597 (2.9%)
  - **unknown**: 600 (1.1%)
  - ...

### 6.3 Cost Projection
- **Estimated Engineers**: 8
- **Estimated Days**: 99
- **Files Affected**: 100
- **Edges Affected**: 4927