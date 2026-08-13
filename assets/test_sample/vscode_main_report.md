# 🔬 SYNAPSE Architecture Scan Report (EV-LIVE)
Generated: 2026-08-13T01:14:23.977Z

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
- src/vs/platform/telemetry/common/gdprTypings.ts (1 edges)
- src/vs/workbench/contrib/notebook/common/notebookCommon.ts (1 edges)
- src/vs/base/common/severity.ts (1 edges)
- src/vs/editor/common/config/editorOptions.ts (1 edges)
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/progress.ts (1 edges)
- src/vs/platform/extensionManagement/common/extensionStorage.ts (1 edges)
- src/vs/platform/tunnel/common/tunnel.ts (1 edges)
- src/vs/base/common/cancellation.ts (1 edges)
- src/vs/platform/label/common/label.ts (1 edges)
- cli/src/commands/output.rs (1 edges)

### 2. src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 75
- Fan-Out: 134
- Blast Radius: 178 Clusters

**Top External Targets (Evidence)**
- src/vs/platform/accessibility/common/accessibility.ts (1 edges)
- src/vs/editor/contrib/dropOrPasteInto/browser/copyPasteController.ts (1 edges)
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/map.ts (1 edges)
- src/vs/platform/list/browser/listService.ts (1 edges)
- src/vs/base/common/marshallingIds.ts (1 edges)
- src/vs/platform/observable/common/platformObservableUtils.ts (1 edges)
- src/vs/editor/contrib/hover/browser/glyphHoverController.ts (1 edges)
- src/vs/editor/common/config/editorConfiguration.ts (1 edges)
- cli/src/constants.rs (1 edges)
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/language/languages.ts (1 edges)

### 3. src/vs/workbench/electron-browser/window.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/electron-browser/window.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 65
- Fan-Out: 67
- Blast Radius: 134 Clusters

**Top External Targets (Evidence)**
- src/vs/workbench/common/dialogs.ts (1 edges)
- src/vs/workbench/services/integrity/common/integrity.ts (1 edges)
- src/vs/base/parts/sandbox/common/sandboxTypes.ts (1 edges)
- src/vs/base/browser/ui/actionbar/actionbar.ts (1 edges)
- src/vs/platform/workspaces/common/workspaces.ts (1 edges)
- extensions/git/src/hover.ts (1 edges)
- src/vs/platform/uriIdentity/common/uriIdentity.ts (1 edges)
- src/vs/workbench/services/driver/browser/driver.ts (1 edges)
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/telemetry.ts (1 edges)
- extensions/typescript-language-features/src/configuration/configuration.ts (1 edges)

### 4. extensions/copilot/src/extension/intents/node/agentIntent.ts
- **Role**: COORDINATOR
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/intents/node/agentIntent.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 63
- Fan-Out: 68
- Blast Radius: 130 Clusters

**Top External Targets (Evidence)**
- extensions/copilot/src/platform/multiFileEdit/common/editLogService.ts (1 edges)
- extensions/copilot/src/extension/prompt/node/chatParticipantTelemetry.ts (1 edges)
- extensions/copilot/src/extension/commands/node/commandService.ts (1 edges)
- extensions/copilot/src/platform/telemetry/common/nullExperimentationService.ts (1 edges)
- extensions/copilot/src/extension/prompts/node/codeMapper/codeMapperService.ts (1 edges)
- extensions/copilot/src/extension/prompt/node/defaultIntentRequestHandler.ts (1 edges)
- extensions/copilot/src/platform/endpoint/common/chatModelCapabilities.ts (1 edges)
- extensions/copilot/src/extension/prompt/common/specialRequestTypes.ts (1 edges)
- extensions/copilot/src/extension/tools/node/replaceStringTool.tsx (1 edges)
- extensions/copilot/src/extension/prompts/node/agent/summarizedConversationHistory.tsx (1 edges)

### 5. src/vs/workbench/contrib/terminal/browser/terminalInstance.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/browser/terminalInstance.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 62
- Fan-Out: 84
- Blast Radius: 146 Clusters

**Top External Targets (Evidence)**
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/event.ts (1 edges)
- src/vs/base/browser/canIUse.ts (1 edges)
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/uri.ts (1 edges)
- src/vs/workbench/services/path/browser/pathService.ts (1 edges)
- src/vs/amdX.ts (1 edges)
- src/vs/platform/opener/common/opener.ts (1 edges)
- src/vs/platform/keybinding/common/keybinding.ts (1 edges)
- extensions/copilot/src/extension/agents/node/adapters/types.ts (1 edges)
- src/vs/platform/theme/common/themeService.ts (1 edges)
- src/vs/platform/instantiation/common/instantiation.ts (1 edges)

### 6. src/vs/workbench/contrib/search/browser/searchView.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/search/browser/searchView.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 62
- Fan-Out: 79
- Blast Radius: 143 Clusters

**Top External Targets (Evidence)**
- src/vs/base/common/strings.ts (1 edges)
- src/vs/workbench/contrib/scm/common/scm.ts (1 edges)
- src/vs/workbench/common/memento.ts (1 edges)
- src/vs/platform/instantiation/common/instantiation.ts (1 edges)
- src/vs/workbench/contrib/files/common/files.ts (1 edges)
- src/vs/workbench/services/search/common/queryBuilder.ts (1 edges)
- src/vs/base/common/keyCodes.ts (1 edges)
- cli/src/constants.rs (1 edges)
- src/vs/workbench/browser/parts/views/viewPane.ts (1 edges)
- src/vs/platform/contextkey/common/contextkey.ts (1 edges)

### 7. src/vs/editor/browser/view.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/editor/browser/view.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 62
- Fan-Out: 63
- Blast Radius: 95 Clusters

**Top External Targets (Evidence)**
- src/vs/platform/theme/common/themeService.ts (1 edges)
- cli/src/util/errors.rs (1 edges)
- src/vs/platform/instantiation/common/instantiation.ts (1 edges)
- src/vs/editor/browser/viewParts/linesDecorations/linesDecorations.ts (1 edges)
- src/vs/editor/browser/viewParts/minimap/minimap.ts (1 edges)
- src/vs/workbench/services/lifecycle/common/lifecycle.ts (1 edges)
- src/vs/workbench/browser/window.ts (1 edges)
- src/vs/workbench/api/common/extHostTypes/selection.ts (1 edges)
- src/vs/editor/browser/view/viewUserInputEvents.ts (1 edges)
- src/vs/editor/browser/view/viewPart.ts (1 edges)

### 8. src/vs/sessions/contrib/changes/browser/changesView.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/sessions/contrib/changes/browser/changesView.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 61
- Fan-Out: 72
- Blast Radius: 154 Clusters

**Top External Targets (Evidence)**
- src/vs/workbench/contrib/chat/common/actions/chatContextKeys.ts (1 edges)
- src/vs/base/common/iconLabels.ts (1 edges)
- src/vs/platform/instantiation/common/instantiation.ts (1 edges)
- src/vs/sessions/common/agentHostSessionsProvider.ts (1 edges)
- src/vs/platform/actions/browser/buttonbar.ts (1 edges)
- src/vs/platform/actions/browser/actionWidgetDropdownActionViewItem.ts (1 edges)
- src/vs/nls.ts (1 edges)
- src/vs/platform/actionWidget/browser/actionWidget.ts (1 edges)
- src/vs/base/browser/ui/sash/sash.ts (1 edges)
- src/vs/platform/observable/common/platformObservableUtils.ts (1 edges)

### 9. src/vs/editor/editor.all.ts
- **Role**: DOMAIN_SERVICE
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/editor/editor.all.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 60
- Fan-Out: 63
- Blast Radius: 170 Clusters

**Top External Targets (Evidence)**
- src/vs/editor/contrib/hover/browser/hoverContribution.ts (1 edges)
- extensions/typescript-language-features/src/languageFeatures/linkedEditing.ts (1 edges)
- src/vs/editor/contrib/insertFinalNewLine/browser/insertFinalNewLine.ts (1 edges)
- src/vs/base/browser/ui/codicons/codiconStyles.ts (1 edges)
- src/vs/editor/contrib/caretOperations/browser/transpose.ts (1 edges)
- src/vs/editor/contrib/snippet/browser/snippetController2.ts (1 edges)
- src/vs/editor/contrib/middleScroll/browser/middleScroll.contribution.ts (1 edges)
- src/vs/editor/contrib/format/browser/formatActions.ts (1 edges)
- src/vs/editor/contrib/wordHighlighter/browser/wordHighlighter.ts (1 edges)
- src/vs/editor/contrib/anchorSelect/browser/anchorSelect.ts (1 edges)

### 10. src/vs/workbench/contrib/debug/browser/repl.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/debug/browser/repl.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 60
- Fan-Out: 70
- Blast Radius: 163 Clusters

**Top External Targets (Evidence)**
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/event.ts (1 edges)
- extensions/git/src/decorators.ts (1 edges)
- src/vs/base/common/keyCodes.ts (1 edges)
- src/vs/editor/contrib/suggest/browser/suggestController.ts (1 edges)
- src/vs/workbench/contrib/codeEditor/browser/simpleEditorOptions.ts (1 edges)
- extensions/markdown-language-features/src/util/async.ts (1 edges)
- src/vs/base/common/themables.ts (1 edges)
- src/vs/base/browser/ui/actionbar/actionbar.ts (1 edges)
- src/vs/editor/common/services/textResourceConfiguration.ts (1 edges)
- src/vs/editor/browser/editorBrowser.ts (1 edges)


## 3. Evidence Layer
### 3.1 Ghost Evidence
<details><summary><b>Show Ghost Evidence (Top 50)</b></summary>

- [src/vs/workbench/workbench.common.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.common.main.ts) -> src/vs/workbench/contrib/bracketPairColorizer2Telemetry/browser/bracketPairColorizer2Telemetry.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/terminalContrib/clipboard/browser/terminal.clipboard.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminalContrib/clipboard/browser/terminal.clipboard.contribution.ts) -> xterm (Count: 1)
- [src/vs/workbench/contrib/styleOverrides/browser/styleOverrides.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/styleOverrides/browser/styleOverrides.contribution.ts) -> roundedCorners (Count: 1)
- [test/mcp/src/automationTools/editor.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/test/mcp/src/automationTools/editor.ts) -> zod (Count: 1)
- [src/vs/workbench/workbench.web.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.web.main.ts) -> src/vs/workbench/contrib/extensions/browser/extensions.web.contribution.ts (Count: 1)
- [test/mcp/src/automationTools/terminal.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/test/mcp/src/automationTools/terminal.ts) -> zod (Count: 1)
- [src/vs/workbench/workbench.common.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.common.main.ts) -> src/vs/workbench/contrib/welcomeViews/common/newFile.contribution.ts (Count: 1)
- [src/vs/workbench/workbench.web.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.web.main.ts) -> src/vs/workbench/contrib/processExplorer/browser/processExplorer.web.contribution.ts (Count: 1)
- [src/vs/workbench/services/languageDetection/browser/languageDetectionWorkerServiceImpl.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/languageDetection/browser/languageDetectionWorkerServiceImpl.ts) -> src/vs/editor/common/services/textModelSync/textModelSync.impl.ts (Count: 1)
- [src/vs/workbench/contrib/terminalContrib/links/browser/terminal.links.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminalContrib/links/browser/terminal.links.contribution.ts) -> xterm (Count: 1)
- [src/vs/workbench/contrib/terminal/browser/xterm/xtermTerminal.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/browser/xterm/xtermTerminal.ts) -> addon-clipboard (Count: 1)
- [src/vs/workbench/contrib/terminalContrib/developer/browser/terminal.developer.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminalContrib/developer/browser/terminal.developer.contribution.ts) -> xterm (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/en-uk.win.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/en-uk.win.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [src/vs/workbench/services/textMate/browser/backgroundTokenization/threadedBackgroundTokenizerFactory.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/textMate/browser/backgroundTokenization/threadedBackgroundTokenizerFactory.ts) -> vscode-textmate (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/dk.win.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/dk.win.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/meteredConnection/browser/meteredConnection.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/meteredConnection/browser/meteredConnection.contribution.ts) -> src/vs/platform/meteredConnection/common/meteredConnection.config.contribution.ts (Count: 1)
- [test/sanity/scripts/run-docker.sh](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/test/sanity/scripts/run-docker.sh) -> artifacts (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/es.darwin.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/es.darwin.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [src/vs/workbench/workbench.common.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.common.main.ts) -> src/vs/workbench/contrib/styleOverrides/browser/styleOverrides.contribution.ts (Count: 1)
- [src/vs/workbench/services/assignment/common/assignmentService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/assignment/common/assignmentService.ts) -> tas-client (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/layout.contribution.darwin.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/layout.contribution.darwin.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/pt-br.win.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/pt-br.win.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [test/sanity/src/index.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/test/sanity/src/index.ts) -> minimist (Count: 1)
- [src/vs/workbench/contrib/editTelemetry/browser/editStats/aiStatsStatusBar.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/editTelemetry/browser/editStats/aiStatsStatusBar.ts) -> media (Count: 1)
- [src/vs/workbench/services/textMate/browser/backgroundTokenization/textMateWorkerTokenizerController.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/textMate/browser/backgroundTokenization/textMateWorkerTokenizerController.ts) -> vscode-textmate (Count: 1)
- [src/vs/workbench/contrib/terminal/browser/xterm/markNavigationAddon.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/browser/xterm/markNavigationAddon.ts) -> xterm (Count: 1)
- [src/vs/workbench/contrib/styleOverrides/browser/styleOverrides.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/styleOverrides/browser/styleOverrides.contribution.ts) -> commandCenter (Count: 1)
- [src/vs/workbench/contrib/terminalContrib/links/browser/terminalLinkManager.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminalContrib/links/browser/terminalLinkManager.ts) -> xterm-private (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/no.win.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/no.win.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/terminal/common/scripts/shellIntegration-bash.sh](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/common/scripts/shellIntegration-bash.sh) -> bashrc (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/en-intl.darwin.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/en-intl.darwin.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/terminalContrib/links/browser/terminalUriLinkDetector.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminalContrib/links/browser/terminalUriLinkDetector.ts) -> xterm (Count: 1)
- [src/vs/workbench/contrib/terminal/browser/widgets/terminalHoverWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/browser/widgets/terminalHoverWidget.ts) -> xterm (Count: 1)
- [src/vs/workbench/contrib/terminal/terminal.all.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/terminal.all.ts) -> src/vs/workbench/contrib/terminalContrib/stickyScroll/browser/terminal.stickyScroll.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/terminal/terminal.all.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/terminal.all.ts) -> src/vs/workbench/contrib/terminalContrib/voice/browser/terminal.voice.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/task/getTaskOutputTool.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/task/getTaskOutputTool.ts) -> xterm (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/en.linux.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/en.linux.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/sv.win.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/sv.win.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [src/vs/workbench/workbench.web.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.web.main.ts) -> src/vs/workbench/contrib/webview/browser/webview.web.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/terminal/common/scripts/shellIntegration-bash.sh](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/common/scripts/shellIntegration-bash.sh) -> activation (Count: 1)
- [src/vs/workbench/contrib/terminalContrib/zoom/browser/terminal.zoom.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminalContrib/zoom/browser/terminal.zoom.contribution.ts) -> xterm (Count: 1)
- [src/vs/workbench/services/textMate/browser/backgroundTokenization/worker/textMateTokenizationWorker.worker.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/textMate/browser/backgroundTokenization/worker/textMateTokenizationWorker.worker.ts) -> vscode-oniguruma (Count: 1)
- [test/mcp/src/application.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/test/mcp/src/application.ts) -> test-electron (Count: 1)
- [src/vs/workbench/services/languageDetection/browser/languageDetectionWebWorker.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/languageDetection/browser/languageDetectionWebWorker.ts) -> src/vs/workbench/services/languageDetection/browser/languageDetectionWorker.protocol.ts (Count: 1)
- [src/vs/workbench/contrib/terminal/browser/xterm/xtermTerminal.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/browser/xterm/xtermTerminal.ts) -> addon-serialize (Count: 1)
- [src/vs/workbench/contrib/terminalContrib/stickyScroll/browser/terminalStickyScrollOverlay.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminalContrib/stickyScroll/browser/terminalStickyScrollOverlay.ts) -> addon-webgl (Count: 1)
- [src/vs/workbench/contrib/terminal/common/scripts/shellIntegration-bash.sh](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/common/scripts/shellIntegration-bash.sh) -> bash_profile (Count: 1)
- [src/vs/workbench/contrib/terminal/terminal.all.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/terminal.all.ts) -> src/vs/workbench/contrib/terminalContrib/quickAccess/browser/terminal.quickAccess.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/terminal/terminal.all.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/terminal.all.ts) -> src/vs/workbench/contrib/terminalContrib/autoReplies/browser/terminal.autoReplies.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/terminal/terminal.all.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/terminal.all.ts) -> src/vs/workbench/contrib/terminalContrib/sendSequence/browser/terminal.sendSequence.contribution.ts (Count: 1)
</details>

### 3.2 Boundary Evidence
<details><summary><b>Show Boundary Evidence (Top 50)</b></summary>

- [src/vs/workbench/services/policies/browser/accountPolicyGateContribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/policies/browser/accountPolicyGateContribution.ts) -> src/vs/platform/contextkey/common/contextkey.ts (Count: 1)
- [src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackHover.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackHover.ts) -> src/vs/workbench/services/lifecycle/common/lifecycle.ts (Count: 1)
- [src/vs/platform/agentHost/node/claude/claudeAgentSession.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/platform/agentHost/node/claude/claudeAgentSession.ts) -> src/vs/platform/agentHost/node/claude/claudeSessionMetadataStore.ts (Count: 1)
- [src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentSessionProjectionActions.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentSessionProjectionActions.ts) -> src/vs/nls.ts (Count: 1)
- [src/vs/workbench/services/extensions/common/abstractExtensionService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/extensions/common/abstractExtensionService.ts) -> src/vs/workbench/services/extensions/common/rpcProtocol.ts (Count: 1)
- [src/vs/workbench/contrib/inlineChat/browser/inlineChatWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/inlineChat/browser/inlineChatWidget.ts) -> extensions/git/src/hover.ts (Count: 1)
- [src/vs/workbench/contrib/testing/common/nullTestingService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/testing/common/nullTestingService.ts) -> src/vs/workbench/contrib/testing/common/testTypes.ts (Count: 1)
- [src/vs/platform/agentHost/electron-browser/localAgentHostService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/platform/agentHost/electron-browser/localAgentHostService.ts) -> cli/src/commands.rs (Count: 1)
- [src/vs/workbench/api/browser/extensionHost.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/api/browser/extensionHost.contribution.ts) -> src/vs/workbench/api/browser/mainThreadNotebookSaveParticipant.ts (Count: 1)
- [src/vs/server/node/remoteExtensionsScanner.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/server/node/remoteExtensionsScanner.ts) -> src/vs/code/electron-utility/sharedProcess/contrib/extensions.ts (Count: 1)
- [src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/runInTerminalHelpers.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/runInTerminalHelpers.ts) -> src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts (Count: 1)
- [src/vs/editor/contrib/colorPicker/browser/hoverColorPicker/hoverColorPickerParticipant.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/editor/contrib/colorPicker/browser/hoverColorPicker/hoverColorPickerParticipant.ts) -> extensions/notebook-renderers/src/color.ts (Count: 1)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.ts) -> src/vs/platform/mcp/common/mcpPlatformTypes.ts (Count: 1)
- [src/vs/workbench/contrib/chat/browser/tools/clientToolSetsContribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/tools/clientToolSetsContribution.ts) -> src/vs/base/common/codicons.ts (Count: 1)
- [extensions/copilot/src/platform/chat/node/hookExecutor.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/platform/chat/node/hookExecutor.ts) -> extensions/copilot/src/platform/chat/common/hookExecutor.ts (Count: 1)
- [src/vs/workbench/contrib/notebook/common/notebookExecutionService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/notebook/common/notebookExecutionService.ts) -> src/vs/workbench/contrib/notebook/common/notebookCommon.ts (Count: 1)
- [extensions/copilot/src/extension/xtab/node/xtabProvider.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/xtab/node/xtabProvider.ts) -> extensions/copilot/src/platform/endpoint/node/proxyXtabEndpoint.ts (Count: 1)
- [src/vs/workbench/contrib/codeEditor/browser/editorSettingsMigration.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/codeEditor/browser/editorSettingsMigration.ts) -> extensions/typescript-language-features/src/configuration/configuration.ts (Count: 1)
- [src/vs/workbench/browser/codeeditor.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/browser/codeeditor.ts) -> src/vs/editor/common/config/editorOptions.ts (Count: 1)
- [src/vs/platform/menubar/electron-main/menubar.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/platform/menubar/electron-main/menubar.ts) -> src/vs/platform/lifecycle/electron-main/lifecycleMainService.ts (Count: 1)
- [src/vs/workbench/api/common/extHost.protocol.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/api/common/extHost.protocol.ts) -> src/vs/platform/telemetry/common/gdprTypings.ts (Count: 1)
- [src/vs/workbench/contrib/chat/browser/widgetHosts/viewPane/chatViewPane.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/widgetHosts/viewPane/chatViewPane.ts) -> src/vs/workbench/contrib/chat/browser/agentSessions/agentSessions.ts (Count: 1)
- [src/vs/workbench/contrib/chat/browser/agentSessions/experiments/unifiedQuickAccess.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/experiments/unifiedQuickAccess.ts) -> src/vs/workbench/services/lifecycle/common/lifecycle.ts (Count: 1)
- [src/vs/workbench/contrib/extensions/browser/extensions.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/extensions/browser/extensions.contribution.ts) -> src/vs/workbench/contrib/chat/browser/pluginInstallService.ts (Count: 1)
- [extensions/emmet/src/imageSizeHelper.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/emmet/src/imageSizeHelper.ts) -> image-size (Count: 1)
- [src/vs/workbench/services/host/electron-browser/nativeHostService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/host/electron-browser/nativeHostService.ts) -> src/vs/code/electron-utility/sharedProcess/contrib/extensions.ts (Count: 1)
- [src/vs/workbench/contrib/searchEditor/browser/searchEditorInput.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/searchEditor/browser/searchEditorInput.ts) -> src/vs/workbench/services/path/browser/pathService.ts (Count: 1)
- [src/vs/editor/contrib/suggest/browser/suggest.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/editor/contrib/suggest/browser/suggest.ts) -> src/vs/base/common/range.ts (Count: 1)
- [src/vs/workbench/contrib/chat/browser/widgetHosts/viewPane/chatViewPane.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/widgetHosts/viewPane/chatViewPane.ts) -> src/vs/base/browser/mouseEvent.ts (Count: 1)
- [src/vs/workbench/contrib/terminal/common/remote/terminal.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/common/remote/terminal.ts) -> extensions/copilot/src/extension/prompts/node/panel/terminal.tsx (Count: 1)
- [src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatToolConfirmationSubPart.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatToolConfirmationSubPart.ts) -> src/vs/workbench/contrib/chat/browser/tools/chatToolRiskAssessmentService.ts (Count: 1)
- [src/vs/workbench/services/userDataProfile/browser/settingsResource.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/userDataProfile/browser/settingsResource.ts) -> src/vs/platform/userDataSync/common/settingsMerge.ts (Count: 1)
- [src/vs/workbench/contrib/chat/browser/widget/input/modePickerActionItem.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/widget/input/modePickerActionItem.ts) -> cli/src/constants.rs (Count: 1)
- [src/vs/workbench/contrib/chat/browser/widgetHosts/chatQuick.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/widgetHosts/chatQuick.ts) -> extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/uri.ts (Count: 1)
- [src/vs/editor/common/services/model.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/editor/common/services/model.ts) -> src/vs/editor/common/textModelEditSource.ts (Count: 1)
- [src/vs/workbench/browser/parts/notifications/notificationsToasts.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/browser/parts/notifications/notificationsToasts.ts) -> src/vs/workbench/browser/parts/notifications/notificationsList.ts (Count: 1)
- [src/vs/workbench/contrib/notebook/browser/contrib/multicursor/notebookMulticursor.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/notebook/browser/contrib/multicursor/notebookMulticursor.ts) -> src/vs/workbench/contrib/notebook/browser/view/cellParts/cellEditorOptions.ts (Count: 1)
- [src/vs/editor/browser/widget/multiDiffEditor/diffEditorItemTemplate.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/editor/browser/widget/multiDiffEditor/diffEditorItemTemplate.ts) -> src/vs/base/browser/ui/button/button.ts (Count: 1)
- [src/vs/workbench/contrib/debug/browser/debugHover.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/debug/browser/debugHover.ts) -> src/vs/base/common/cancellation.ts (Count: 1)
- [src/vs/workbench/contrib/issue/browser/issueService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/issue/browser/issueService.ts) -> src/vs/workbench/services/integrity/common/integrity.ts (Count: 1)
- [src/vs/workbench/contrib/notebook/browser/diff/notebookDiffActions.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/notebook/browser/diff/notebookDiffActions.ts) -> src/vs/platform/contextkey/common/contextkey.ts (Count: 1)
- [src/vs/sessions/contrib/providers/copilotChatSessions/browser/copilotChatSessionsChangesets.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/sessions/contrib/providers/copilotChatSessions/browser/copilotChatSessionsChangesets.ts) -> src/vs/nls.ts (Count: 1)
- [src/vs/workbench/contrib/mcp/common/discovery/installedMcpServersDiscovery.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/mcp/common/discovery/installedMcpServersDiscovery.ts) -> src/vs/base/common/arrays.ts (Count: 1)
- [src/vs/server/node/remoteExtensionsScanner.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/server/node/remoteExtensionsScanner.ts) -> extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/uri.ts (Count: 1)
- [src/vs/editor/common/cursor/cursorDeleteOperations.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/editor/common/cursor/cursorDeleteOperations.ts) -> src/vs/base/common/range.ts (Count: 1)
- [extensions/copilot/src/extension/intents/node/askAgentIntent.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/intents/node/askAgentIntent.ts) -> extensions/copilot/src/platform/multiFileEdit/common/editLogService.ts (Count: 1)
- [extensions/copilot/src/extension/testing/node/aiEvaluationService.tsx](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/testing/node/aiEvaluationService.tsx) -> extensions/copilot/src/platform/chat/common/commonTypes.ts (Count: 1)
- [src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackItemsBackend.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackItemsBackend.ts) -> src/vs/sessions/contrib/codeReview/browser/codeReviewService.ts (Count: 1)
- [extensions/typescript-language-features/src/languageFeatures/completions.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/typescript-language-features/src/languageFeatures/completions.ts) -> extensions/copilot/src/extension/completions-core/vscode-node/lib/src/telemetry.ts (Count: 1)
- [src/vs/workbench/contrib/format/browser/format.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/format/browser/format.contribution.ts) -> src/vs/workbench/contrib/format/browser/formatActionsMultiple.ts (Count: 1)
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
Boundary Ratio: 0.98

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

- [src/vs/workbench/contrib/mcp/common/mcpLanguageModelToolContribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/mcp/common/mcpLanguageModelToolContribution.ts) -> extensions/copilot/src/extension/agents/node/adapters/types.ts
- [src/vs/workbench/contrib/mcp/common/mcpLanguageModelToolContribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/mcp/common/mcpLanguageModelToolContribution.ts) -> src/vs/workbench/contrib/chat/common/enablement.ts
- [src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatPlanReviewPart.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatPlanReviewPart.ts) -> src/vs/base/browser/keyboardEvent.ts
- [extensions/copilot/src/extension/agents/vscode-node/test/planAgentProvider.spec.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/agents/vscode-node/test/planAgentProvider.spec.ts) -> src/vs/workbench/services/lifecycle/common/lifecycle.ts
- [src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatPlanReviewPart.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatPlanReviewPart.ts) -> extensions/media-preview/src/util/dom.ts
- [extensions/copilot/src/extension/agents/vscode-node/test/planAgentProvider.spec.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/agents/vscode-node/test/planAgentProvider.spec.ts) -> src/vs/platform/configuration/common/configurationService.ts
- [extensions/copilot/src/extension/chatSessions/copilotcli/node/test/exitPlanModeHandler.spec.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/chatSessions/copilotcli/node/test/exitPlanModeHandler.spec.ts) -> extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/uri.ts
- [src/vs/workbench/api/browser/mainThreadMessageService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/api/browser/mainThreadMessageService.ts) -> src/vs/workbench/services/lifecycle/common/lifecycle.ts
- [src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationWidget.ts) -> src/vs/nls.ts
- [extensions/copilot/src/extension/agents/vscode-node/test/planAgentProvider.spec.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/agents/vscode-node/test/planAgentProvider.spec.ts) -> chai
- [extensions/copilot/src/extension/agents/vscode-node/test/planAgentProvider.spec.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/agents/vscode-node/test/planAgentProvider.spec.ts) -> extensions/copilot/src/platform/configuration/test/common/inMemoryConfigurationService.ts
- [src/vs/workbench/contrib/chat/test/browser/planReviewFeedbackService.test.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/test/browser/planReviewFeedbackService.test.ts) -> src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackService.ts
- [src/vs/workbench/contrib/mcp/browser/mcpLanguageFeatures.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/mcp/browser/mcpLanguageFeatures.ts) -> src/vs/platform/secrets/common/secrets.ts
- [src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationModelManager.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationModelManager.ts) -> src/vs/workbench/common/resources.ts
- [src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackEditorActions.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackEditorActions.ts) -> src/vs/base/common/codicons.ts
- [src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackEditorContribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackEditorContribution.ts) -> src/vs/editor/browser/editorBrowser.ts
- [src/vs/workbench/contrib/mcp/common/mcpLanguageModelToolContribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/mcp/common/mcpLanguageModelToolContribution.ts) -> src/vs/workbench/contrib/mcp/test/common/mcpRegistryTypes.ts
- [src/vs/platform/agentHost/node/codex/protocol/generated/v2/TurnPlanUpdatedNotification.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/platform/agentHost/node/codex/protocol/generated/v2/TurnPlanUpdatedNotification.ts) -> src/vs/platform/agentHost/node/codex/protocol/generated/v2/TurnPlanStep.ts
- [extensions/copilot/src/extension/agents/vscode-node/planAgentProvider.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/agents/vscode-node/planAgentProvider.ts) -> src/vs/platform/log/common/logService.ts
- [src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationWidget.ts) -> src/vs/editor/browser/editorBrowser.ts
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
- **Files Affected**: 835
- **Edges Affected**: 4927