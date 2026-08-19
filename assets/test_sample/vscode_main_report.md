# 🔬 SYNAPSE Architecture Scan Report (EV-LIVE)
Generated: 2026-08-19T03:25:27.879Z

## 0. Analysis Subject (Layer -3)
- **Subject**: Module: src/vs/platform/agentHost/node
- **Files**: 13764
- **Internal Edges**: 17372
- **Boundary Edges**: 85396

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
- **Boundary Edge Count**: 85396 / 17372 (Internal)
- **Top 3 Contributors**: 상위 3개 파일(aiCustomizationManagementEditor.ts, agentSessionsViewer.ts, aiCustomizationListWidget.ts)이 전체 Boundary Edge의 **0.3%** (256개)를 생성하고 있습니다.



**Cumulative Boundary Contribution**
- **Top 3**: 0.3% (256 edges)
- **Top 10**: 0.9% (770 edges)
- **Top 50**: 3.6% (3047 edges)
- **Top 100**: 6.2% (5278 edges)

**Audit Confidence**: 81%

Base Score                     70
Grammar Noise Filtered        +0
Assembly Point Classified      +5
Contract Hub Verified          +0
Ghost Ratio < 5%               +6
Unknown References             0
Final Score                   81

### Global Metrics
- **Entropy**: 12
- **Ghost Dependencies**: 2974

### Dependency Sources Breakdown
**Ghost Dependencies (Scanner Issues)**
  - N/A

**External Dependencies (Architecture)**
  - N/A


## 2. Impact Files (Architectural Assessment)
### 1. src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditor.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditor.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 96
- Blast Radius (Clusters): 190
- Fan-Out: 146
- Fan-In: 5

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- extensions/notebook-renderers/src/color.ts (2 edges - Type: INCLUDE)
- extensions/copilot/src/platform/customInstructions/common/promptTypes.ts (2 edges - Type: INCLUDE)
- src/vs/workbench/contrib/codeEditor/browser/simpleEditorOptions.ts (2 edges - Type: INCLUDE)
- src/vs/platform/list/browser/listService.ts (2 edges - Type: INCLUDE)
- src/vs/platform/opener/common/opener.ts (2 edges - Type: INCLUDE)
- src/vs/editor/common/services/resolverService.ts (2 edges - Type: INCLUDE)
- src/vs/workbench/services/workingCopy/common/workingCopyService.ts (2 edges - Type: INCLUDE)
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/openai/model.ts (2 edges - Type: INCLUDE)
- extensions/git/src/hover.ts (2 edges - Type: INCLUDE)
- extensions/copilot/src/platform/promptFiles/common/promptsService.ts (2 edges - Type: INCLUDE)

**AST Evidence Verification** `[RUNTIME_HUB]`
- interface: 0% | type: 1% | function: 13% | statement: 73%
> 이 파일은 실제 실행 로직을 포함하는 런타임 허브다. 변경 시 즉각적 영향.

### 2. src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 84
- Blast Radius (Clusters): 116
- Fan-Out: 102
- Fan-In: 12

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- src/vs/base/common/strings.ts (2 edges - Type: INCLUDE)
- src/vs/platform/instantiation/common/serviceCollection.ts (2 edges - Type: INCLUDE)
- src/vs/base/browser/ui/aria/aria.ts (2 edges - Type: INCLUDE)
- IAgentSessionSectionTemplate> (2 edges - Type: IMPLEMENTS)
- src/vs/base/browser/ui/tree/objectTree.ts (2 edges - Type: IMPLEMENTS)
- src/vs/base/browser/ui/tree/asyncDataTree.ts (2 edges - Type: IMPLEMENTS)
- src/vs/platform/markdown/browser/markdownRenderer.ts (2 edges - Type: INCLUDE)
- src/vs/base/common/arrays.ts (2 edges - Type: INCLUDE)
- src/vs/platform/agentHost/common/state/protocol/common/actions.ts (2 edges - Type: INCLUDE)
- src/vs/base/common/htmlContent.ts (2 edges - Type: INCLUDE)

**AST Evidence Verification** `[RUNTIME_HUB]`
- interface: 1% | type: 0% | function: 13% | statement: 59%
> 이 파일은 실제 실행 로직을 포함하는 런타임 허브다. 변경 시 즉각적 영향.

### 3. src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationListWidget.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationListWidget.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 76
- Blast Radius (Clusters): 155
- Fan-Out: 90
- Fan-In: 4

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- src/vs/base/browser/ui/list/list.ts (2 edges - Type: IMPLEMENTS)
- src/vs/platform/actions/browser/menuEntryActionViewItem.ts (2 edges - Type: INCLUDE)
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/uri.ts (2 edges - Type: INCLUDE)
- src/vs/base/common/themables.ts (2 edges - Type: INCLUDE)
- src/vs/platform/list/browser/listService.ts (2 edges - Type: INCLUDE)
- IAICustomizationItemTemplateData> (2 edges - Type: IMPLEMENTS)
- src/vs/platform/theme/browser/defaultStyles.ts (2 edges - Type: INCLUDE)
- src/vs/platform/agentHost/common/state/protocol/common/actions.ts (2 edges - Type: INCLUDE)
- src/vs/platform/label/common/label.ts (2 edges - Type: INCLUDE)
- src/vs/base/browser/ui/highlightedlabel/highlightedLabel.ts (2 edges - Type: INCLUDE)

**AST Evidence Verification** `[RUNTIME_HUB]`
- interface: 1% | type: 0% | function: 14% | statement: 65%
> 이 파일은 실제 실행 로직을 포함하는 런타임 허브다. 변경 시 즉각적 영향.

### 4. src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionHandler.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionHandler.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 76
- Blast Radius (Clusters): 153
- Fan-Out: 120
- Fan-In: 3

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- src/vs/platform/agentHost/common/sessionConfigKeys.ts (2 edges - Type: INCLUDE)
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/event.ts (2 edges - Type: INCLUDE)
- extensions/copilot/src/extension/prompts/node/panel/terminal.tsx (2 edges - Type: INCLUDE)
- src/vs/platform/agentHost/common/meta/agentCompletionAttachmentMeta.ts (2 edges - Type: INCLUDE)
- extensions/copilot/src/platform/chat/common/chatAgents.ts (2 edges - Type: INCLUDE)
- src/vs/platform/agentHost/common/state/protocol/common/actions.ts (2 edges - Type: INCLUDE)
- src/vs/base/common/cancellation.ts (2 edges - Type: INCLUDE)
- src/vs/base/common/objects.ts (2 edges - Type: INCLUDE)
- src/vs/platform/agentHost/common/state/sessionProtocol.ts (2 edges - Type: INCLUDE)
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/uri.ts (2 edges - Type: INCLUDE)

**AST Evidence Verification** `[RUNTIME_HUB]`
- interface: 0% | type: 0% | function: 14% | statement: 58%
> 이 파일은 실제 실행 로직을 포함하는 런타임 허브다. 변경 시 즉각적 영향.

### 5. src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 75
- Blast Radius (Clusters): 191
- Fan-Out: 135
- Fan-In: 3

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- src/vs/base/browser/ui/button/button.ts (1 edges - Type: INCLUDE)
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/language/languages.ts (1 edges - Type: INCLUDE)
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/event.ts (1 edges - Type: INCLUDE)
- src/vs/editor/common/services/resolverService.ts (1 edges - Type: INCLUDE)
- src/vs/workbench/services/editor/browser/editorService.ts (1 edges - Type: INCLUDE)
- src/vs/base/common/marshallingIds.ts (1 edges - Type: INCLUDE)
- src/vs/platform/webContentExtractor/common/webContentExtractor.ts (1 edges - Type: INCLUDE)
- src/vs/platform/history/browser/contextScopedHistoryWidget.ts (1 edges - Type: INCLUDE)
- src/vs/workbench/contrib/codeEditor/browser/simpleEditorOptions.ts (1 edges - Type: INCLUDE)
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/uri.ts (1 edges - Type: INCLUDE)

**AST Evidence Verification** `[RUNTIME_HUB]`
- interface: 0% | type: 0% | function: 15% | statement: 63%
> 이 파일은 실제 실행 로직을 포함하는 런타임 허브다. 변경 시 즉각적 영향.

### 6. extensions/vscode-test-resolver/src/extension.ts
- **Role**: TEST_ARTIFACT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/vscode-test-resolver/src/extension.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 74
- Blast Radius (Clusters): 218
- Fan-Out: 78
- Fan-In: 1

**Architectural Assessment**
> EXCESSIVE_FAN_OUT: Component directly manages or orchestrates an excessive number of dependencies.

**Risk Level**: MEDIUM

**Recommended Action**
> Split responsibilities or apply Dependency Inversion Principle (DIP).

**Top External Targets (Evidence)**
- extensions/github/src/canonicalUriProvider.ts (1 edges - Type: INCLUDE)
- src/vs/base/common/cancellation.ts (1 edges - Type: INCLUDE)
- extensions/media-preview/media/videoPreview.js (1 edges - Type: INCLUDE)
- extensions/github/src/branchProtection.ts (1 edges - Type: INCLUDE)
- .eslint-plugin-local/index.ts (1 edges - Type: INCLUDE)
- extensions/configuration-editing/src/browser/net.ts (1 edges - Type: INCLUDE)
- extensions/microsoft-authentication/src/UriEventHandler.ts (1 edges - Type: INCLUDE)
- extensions/git/src/git.ts (1 edges - Type: INCLUDE)
- extensions/copilot/src/extension/chatSessions/copilotcli/node/logger.ts (1 edges - Type: INCLUDE)
- src/vs/workbench/contrib/debug/node/debugAdapter.ts (1 edges - Type: INCLUDE)

**AST Evidence Verification** `[RUNTIME_HUB]`
- interface: 0% | type: 0% | function: 20% | statement: 60%
> 이 파일은 실제 실행 로직을 포함하는 런타임 허브다. 변경 시 즉각적 영향.

### 7. src/vs/workbench/contrib/scm/browser/scmViewPane.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/scm/browser/scmViewPane.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 70
- Blast Radius (Clusters): 166
- Fan-Out: 78
- Fan-In: 2

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- ISCMResourceGroup> (1 edges - Type: IMPLEMENTS)
- src/vs/base/browser/ui/list/listView.ts (1 edges - Type: INCLUDE)
- src/vs/workbench/browser/dnd.ts (1 edges - Type: INCLUDE)
- src/vs/base/common/iterator.ts (1 edges - Type: INCLUDE)
- extensions/media-preview/src/util/dom.ts (1 edges - Type: INCLUDE)
- src/vs/platform/agentHost/common/state/protocol/common/actions.ts (1 edges - Type: INCLUDE)
- src/vs/base/browser/ui/tree/objectTree.ts (1 edges - Type: IMPLEMENTS)
- InputTemplate> (1 edges - Type: IMPLEMENTS)
- src/vs/workbench/api/common/extHostTypes/selection.ts (1 edges - Type: INCLUDE)
- src/vs/platform/actions/browser/menuEntryActionViewItem.ts (1 edges - Type: INCLUDE)

**AST Evidence Verification** `[RUNTIME_HUB]`
- interface: 1% | type: 0% | function: 17% | statement: 61%
> 이 파일은 실제 실행 로직을 포함하는 런타임 허브다. 변경 시 즉각적 영향.

### 8. src/vs/workbench/api/common/extHost.protocol.ts
- **Role**: DOMAIN_SERVICE
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/api/common/extHost.protocol.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 86
- Blast Radius (Clusters): 198
- Fan-Out: 94
- Fan-In: 196

**Architectural Assessment**
> GOD_SERVICE: Centralized service object that handles too many responsibilities across domain boundaries.

**Risk Level**: CRITICAL

**Recommended Action**
> Decompose into smaller domain-specific services.

**Top External Targets (Evidence)**
- src/vs/editor/common/diff/legacyLinesDiffComputer.ts (1 edges - Type: INCLUDE)
- extensions/typescript-language-features/src/languageFeatures/callHierarchy.ts (1 edges - Type: INCLUDE)
- src/vs/workbench/services/remote/common/tunnelModel.ts (1 edges - Type: INCLUDE)
- src/vs/workbench/contrib/terminal/common/environmentVariable.ts (1 edges - Type: INCLUDE)
- extensions/copilot/src/extension/prompts/node/panel/chatVariables.tsx (1 edges - Type: INCLUDE)
- extensions/copilot/src/platform/customInstructions/common/promptTypes.ts (1 edges - Type: INCLUDE)
- cli/src/util/errors.rs (1 edges - Type: INCLUDE)
- src/vs/code/electron-utility/sharedProcess/contrib/extensions.ts (1 edges - Type: INCLUDE)
- cli/src/constants.rs (1 edges - Type: INCLUDE)
- src/vs/platform/tunnel/common/tunnel.ts (1 edges - Type: INCLUDE)

**AST Evidence Verification** `[HEALTHY_CONTRACT]`
- interface: 82% | type: 13% | function: 0% | statement: 1%
- Score: 86 → 69 (×0.8)
> 이 파일은 계약과 구현이 균형을 이룬다. 표준 위험도.

### 9. src/vs/workbench/contrib/files/browser/views/explorerViewer.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/files/browser/views/explorerViewer.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 67
- Blast Radius (Clusters): 141
- Fan-Out: 72
- Fan-In: 3

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/event.ts (1 edges - Type: INCLUDE)
- src/vs/platform/workspaces/common/workspaces.ts (1 edges - Type: INCLUDE)
- src/vs/base/browser/ui/contextview/contextview.ts (1 edges - Type: INCLUDE)
- src/vs/platform/registry/common/platform.ts (1 edges - Type: INCLUDE)
- src/vs/platform/instantiation/common/instantiation.ts (1 edges - Type: INCLUDE)
- extensions/media-preview/src/util/dom.ts (1 edges - Type: INCLUDE)
- src/vs/base/common/comparers.ts (1 edges - Type: INCLUDE)
- src/vs/platform/theme/common/colorRegistry.ts (1 edges - Type: INCLUDE)
- src/vs/platform/contextkey/common/contextkey.ts (1 edges - Type: INCLUDE)
- src/vs/base/browser/keyboardEvent.ts (1 edges - Type: INCLUDE)

**AST Evidence Verification** `[RUNTIME_HUB]`
- interface: 0% | type: 0% | function: 16% | statement: 59%
> 이 파일은 실제 실행 로직을 포함하는 런타임 허브다. 변경 시 즉각적 영향.

### 10. src/vs/workbench/electron-browser/window.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/electron-browser/window.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 66
- Blast Radius (Clusters): 155
- Fan-Out: 68
- Fan-In: 0

**Architectural Assessment**
> UI_TO_SERVICE_COUPLING: UI layer is directly coupled to domain services and state-management layers.

**Risk Level**: HIGH

**Recommended Action**
> Introduce ViewModel, Facade, or Presentation Boundary.

**Top External Targets (Evidence)**
- extensions/git/src/hover.ts (1 edges - Type: INCLUDE)
- src/vs/platform/uriIdentity/common/uriIdentity.ts (1 edges - Type: INCLUDE)
- src/vs/platform/windows/electron-main/windowImpl.ts (1 edges - Type: EXTENDS)
- src/vs/workbench/services/banner/browser/bannerService.ts (1 edges - Type: INCLUDE)
- src/vs/workbench/services/filesConfiguration/common/filesConfigurationService.ts (1 edges - Type: INCLUDE)
- extensions/media-preview/src/util/dom.ts (1 edges - Type: INCLUDE)
- src/vs/platform/remote/common/remoteAuthorityResolver.ts (1 edges - Type: INCLUDE)
- src/vs/base/common/arrays.ts (1 edges - Type: INCLUDE)
- src/vs/platform/tunnel/common/tunnel.ts (1 edges - Type: INCLUDE)
- extensions/copilot/src/extension/completions-core/vscode-node/lib/src/progress.ts (1 edges - Type: INCLUDE)

**AST Evidence Verification** `[RUNTIME_HUB]`
- interface: 0% | type: 0% | function: 22% | statement: 56%
> 이 파일은 실제 실행 로직을 포함하는 런타임 허브다. 변경 시 즉각적 영향.


## 3. Evidence Layer
### 3.1 Ghost Evidence
<details><summary><b>Show Ghost Evidence (Top 50)</b></summary>

- [src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts) -> IAgentSessionSectionTemplate> (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts) -> IAgentSessionShowMoreTemplate> (Count: 2)
- [src/vs/workbench/workbench.common.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.common.main.ts) -> src/vs/workbench/contrib/chat/browser/chat.shared.contribution.ts (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/en-uk.darwin.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/en-uk.darwin.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/markers/browser/markersTreeViewer.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/markers/browser/markersTreeViewer.ts) -> IMarkerTemplateData> (Count: 1)
- [test/mcp/src/automationTools/scm.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/test/mcp/src/automationTools/scm.ts) -> zod (Count: 1)
- [src/vs/workbench/contrib/scm/browser/scmViewPane.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/scm/browser/scmViewPane.ts) -> ISCMResourceGroup> (Count: 1)
- [src/vs/workbench/contrib/terminalContrib/stickyScroll/browser/terminalStickyScrollOverlay.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminalContrib/stickyScroll/browser/terminalStickyScrollOverlay.ts) -> addon-webgl (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/es.win.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/es.win.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [test/smoke/src/main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/test/smoke/src/main.ts) -> node-fetch (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/dvorak.darwin.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/dvorak.darwin.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/terminal/browser/xterm/xtermAddonImporter.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/browser/xterm/xtermAddonImporter.ts) -> addon-clipboard (Count: 1)
- [src/vs/workbench/contrib/workspace/browser/workspaceTrustEditor.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/workspace/browser/workspaceTrustEditor.ts) -> ITrustedUriPathColumnTemplateData> (Count: 1)
- [src/vs/workbench/services/search/node/ripgrepTextSearchEngine.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/search/node/ripgrepTextSearchEngine.ts) -> string_decoder (Count: 1)
- [src/vs/workbench/services/mcp/browser/mcpWorkbenchManagementService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/mcp/browser/mcpWorkbenchManagementService.ts) -> BaseWorkbenchMcpManagementService (Count: 1)
- [src/vs/workbench/services/assignment/common/assignmentService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/assignment/common/assignmentService.ts) -> IKeyValueStorage (Count: 1)
- [src/vs/workbench/contrib/testing/browser/testCoverageView.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/testing/browser/testCoverageView.ts) -> HTMLElement> (Count: 1)
- [src/vs/workbench/contrib/debug/browser/replViewer.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/debug/browser/replViewer.ts) -> IRawObjectReplTemplateData> (Count: 1)
- [src/vs/workbench/services/languageDetection/browser/languageDetectionWebWorker.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/languageDetection/browser/languageDetectionWebWorker.ts) -> src/vs/workbench/services/languageDetection/browser/languageDetectionWorker.protocol.ts (Count: 1)
- [src/vs/workbench/contrib/styleOverrides/browser/styleOverrides.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/styleOverrides/browser/styleOverrides.contribution.ts) -> roundedCorners (Count: 1)
- [src/vs/workbench/contrib/workspace/browser/workspaceTrustEditor.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/workspace/browser/workspaceTrustEditor.ts) -> IActionsColumnTemplateData> (Count: 1)
- [src/vs/workbench/contrib/notebook/browser/diff/notebookDiffList.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/notebook/browser/diff/notebookDiffList.ts) -> NotebookDocumentDiffElementRenderTemplate> (Count: 1)
- [src/vs/workbench/contrib/userDataProfile/browser/userDataProfilesEditor.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/userDataProfile/browser/userDataProfilesEditor.ts) -> IActionsColumnTemplateData> (Count: 1)
- [src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatToolConfirmationCarouselPart.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatToolConfirmationCarouselPart.ts) -> chatToolConfirmationCarousel (Count: 1)
- [src/vs/workbench/services/assignment/common/assignmentService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/assignment/common/assignmentService.ts) -> tas-client (Count: 1)
- [src/vs/workbench/workbench.common.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.common.main.ts) -> src/vs/workbench/contrib/dropOrPasteInto/browser/dropOrPasteInto.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/userDataProfile/browser/userDataProfilesEditor.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/userDataProfile/browser/userDataProfilesEditor.ts) -> ProfileTreeElement> (Count: 1)
- [src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingCodeEditorIntegration.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingCodeEditorIntegration.ts) -> src/vs/editor/browser/widget/diffEditor/registrations.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/preferences/browser/keybindingsEditor.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/preferences/browser/keybindingsEditor.ts) -> IWhenColumnTemplateData> (Count: 1)
- [src/vs/workbench/workbench.common.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.common.main.ts) -> src/vs/workbench/contrib/accessibilitySignals/browser/accessibilitySignal.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/terminal/terminal.all.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/terminal.all.ts) -> src/vs/workbench/contrib/terminalContrib/sendSignal/browser/terminal.sendSignal.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/terminal/browser/xterm/xtermAddonImporter.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/browser/xterm/xtermAddonImporter.ts) -> addon-progress (Count: 1)
- [src/vs/workbench/services/extensionManagement/electron-browser/extensionManagementService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/extensionManagement/electron-browser/extensionManagementService.ts) -> BaseExtensionManagementService (Count: 1)
- [src/vs/workbench/contrib/terminal/terminal.all.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/terminal.all.ts) -> src/vs/workbench/contrib/terminalContrib/resizeDimensionsOverlay/browser/terminal.resizeDimensionsOverlay.contribution.ts (Count: 1)
- [src/vs/workbench/contrib/styleOverrides/browser/styleOverrides.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/styleOverrides/browser/styleOverrides.contribution.ts) -> commandCenter (Count: 1)
- [src/vs/workbench/contrib/terminal/browser/terminal.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/browser/terminal.ts) -> xterm-private (Count: 1)
- [src/vs/workbench/contrib/terminal/browser/xterm/xtermTerminal.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/terminal/browser/xterm/xtermTerminal.ts) -> addon-clipboard (Count: 1)
- [src/vs/workbench/contrib/styleOverrides/browser/styleOverrides.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/styleOverrides/browser/styleOverrides.contribution.ts) -> scrollShadows (Count: 1)
- [src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatEditPillElement.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatEditPillElement.ts) -> chatCodeBlockPill (Count: 1)
- [src/vs/workbench/contrib/chat/browser/aiCustomization/pluginListWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/aiCustomization/pluginListWidget.ts) -> IPluginRemoteItemTemplateData> (Count: 1)
- [src/vs/workbench/contrib/scm/browser/scmRepositoryRenderer.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/scm/browser/scmRepositoryRenderer.ts) -> RepositoryTemplate> (Count: 1)
- [src/vs/workbench/contrib/markers/browser/markersTreeViewer.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/markers/browser/markersTreeViewer.ts) -> FilterData> (Count: 1)
- [src/vs/workbench/contrib/comments/browser/commentsTreeViewer.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/comments/browser/commentsTreeViewer.ts) -> ICommentThreadTemplateData> (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/pt.darwin.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/pt.darwin.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/pt.win.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/pt.win.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [src/vs/workbench/services/keybinding/browser/keyboardLayouts/cz.win.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keyboardLayouts/cz.win.ts) -> src/vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution.ts (Count: 1)
- [src/vs/workbench/services/userDataSync/browser/userDataSyncEnablementService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/userDataSync/browser/userDataSyncEnablementService.ts) -> BaseUserDataSyncEnablementService (Count: 1)
- [src/vs/workbench/contrib/markers/browser/markersTable.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/markers/browser/markersTable.ts) -> IMarkerHighlightedLabelColumnTemplateData> (Count: 1)
- [test/smoke/src/main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/test/smoke/src/main.ts) -> test/sanity/src/devTunnel.test.ts (Count: 1)
- [src/vs/workbench/contrib/debug/browser/replViewer.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/debug/browser/replViewer.ts) -> IReplEvaluationResultTemplateData> (Count: 1)
</details>

### 3.2 Boundary Evidence
<details><summary><b>Show Boundary Evidence (Top 50)</b></summary>

- [src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationItemsModel.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationItemsModel.ts) -> src/vs/workbench/contrib/chat/browser/agentSessions/agentSessions.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostLocalCustomizations.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostLocalCustomizations.ts) -> src/vs/platform/mcp/common/mcpPlatformTypes.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionHandler.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionHandler.ts) -> src/vs/workbench/contrib/chat/common/model/chatProgressTypes/chatToolInvocation.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionHandler.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionHandler.ts) -> src/vs/platform/agentHost/common/sessionConfigKeys.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentSessionProjectionActions.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentSessionProjectionActions.ts) -> src/vs/platform/instantiation/common/instantiation.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationListWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationListWidget.ts) -> src/vs/base/browser/ui/list/list.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsControl.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsControl.ts) -> src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsService.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.contribution.ts) -> src/vs/base/common/buffer.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditor.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditor.ts) -> extensions/copilot/src/extension/prompts/node/test/fixtures/codeEditorWidget.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts) -> src/vs/base/common/strings.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.contribution.ts) -> src/vs/nls.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.contribution.ts) -> src/vs/workbench/contrib/chat/browser/agentPluginEditor/agentPluginItems.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationListWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationListWidget.ts) -> src/vs/platform/actions/browser/menuEntryActionViewItem.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts) -> src/vs/platform/instantiation/common/serviceCollection.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionListStore.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionListStore.ts) -> src/vs/platform/agentHost/common/agentService.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationListWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationListWidget.ts) -> src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationListWidgetUtils.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionHandler.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionHandler.ts) -> src/vs/workbench/contrib/chat/common/model/chatUri.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/localAgentDisabledInputTipContribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/localAgentDisabledInputTipContribution.ts) -> src/vs/workbench/common/contributions.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/stateToProgressAdapter.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/stateToProgressAdapter.ts) -> src/vs/platform/agentHost/common/meta/agentFeedbackAnnotations.ts (Count: 2)
- [src/vs/workbench/contrib/chat/electron-browser/agentSessions/agentSessionsActions.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/electron-browser/agentSessions/agentSessionsActions.ts) -> src/vs/workbench/contrib/chat/common/actions/chatContextKeys.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel.ts) -> src/vs/workbench/contrib/chat/common/chatSessionsService.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionHandler.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionHandler.ts) -> extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/event.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/localAgentSessionsController.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/localAgentSessionsController.ts) -> src/vs/workbench/contrib/chat/common/chatSessionsService.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditor.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditor.ts) -> extensions/notebook-renderers/src/color.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts) -> src/vs/base/browser/ui/aria/aria.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/localAgentDisabledInputTipContribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/localAgentDisabledInputTipContribution.ts) -> src/vs/workbench/contrib/chat/common/model/chatUri.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusWidget.ts) -> extensions/git/src/hover.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostToolSetEnablementService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostToolSetEnablementService.ts) -> src/vs/platform/instantiation/common/instantiation.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionHandler.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionHandler.ts) -> extensions/copilot/src/extension/prompts/node/panel/terminal.tsx (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentSessionProjectionService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentSessionProjectionService.ts) -> cli/src/constants.rs (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionListStore.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionListStore.ts) -> src/vs/base/common/cancellation.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentSessionProjectionService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentSessionProjectionService.ts) -> src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel.ts) -> src/vs/platform/registry/common/platform.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts) -> src/vs/workbench/contrib/chat/common/chatSessionsService.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationIcons.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationIcons.ts) -> src/vs/nls.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsControl.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsControl.ts) -> src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsOpener.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentSessionProjectionService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentSessionProjectionService.ts) -> extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/event.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostModeSynchronizer.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostModeSynchronizer.ts) -> extensions/copilot/test/simulation/workbench/stores/storage.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationListWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationListWidget.ts) -> extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/uri.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationItemsModel.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationItemsModel.ts) -> src/vs/workbench/contrib/chat/common/plugins/agentPluginService.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.contribution.ts) -> src/vs/workbench/common/contributions.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel.ts) -> src/vs/workbench/services/workspaces/common/workspaceTrust.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusWidget.ts) -> src/vs/workbench/services/layout/browser/layoutService.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSnapshotController.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSnapshotController.ts) -> extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/uri.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationItemSource.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationItemSource.ts) -> src/vs/platform/product/common/productService.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostLocalCustomizations.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostLocalCustomizations.ts) -> extensions/copilot/src/platform/promptFiles/common/promptsService.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.ts) -> extensions/copilot/src/platform/customInstructions/common/promptTypes.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsPicker.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsPicker.ts) -> src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentSessionsExperiments.contribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentSessionsExperiments.contribution.ts) -> src/vs/nls.ts (Count: 2)
- [src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts) -> src/vs/base/browser/ui/tree/objectTree.ts (Count: 2)
</details>

## 4. System Assembly Points (Healthy Hubs)
- [src/vs/workbench/workbench.common.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.common.main.ts) (Role: ASSEMBLY_POINT)
- [src/vs/code/electron-main/app.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/code/electron-main/app.ts) (Role: ASSEMBLY_POINT)
- [src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts) (Role: ASSEMBLY_POINT)
- [src/vs/sessions/sessions.common.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/sessions/sessions.common.main.ts) (Role: ASSEMBLY_POINT)
- [extensions/copilot/src/lib/node/chatLibMain.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/lib/node/chatLibMain.ts) (Role: ASSEMBLY_POINT)
- [extensions/copilot/src/extension/extension/vscode/services.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/extension/vscode/services.ts) (Role: ASSEMBLY_POINT)
- [src/vs/editor/standalone/browser/standaloneServices.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/editor/standalone/browser/standaloneServices.ts) (Role: ASSEMBLY_POINT)
- [src/vs/workbench/browser/web.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/browser/web.main.ts) (Role: ASSEMBLY_POINT)
- [src/vs/server/node/serverServices.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/server/node/serverServices.ts) (Role: ASSEMBLY_POINT)
- [src/vs/sessions/sessions.web.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/sessions/sessions.web.main.ts) (Role: ASSEMBLY_POINT)
- [src/vs/code/electron-main/main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/code/electron-main/main.ts) (Role: ASSEMBLY_POINT)
- [src/vs/code/node/cliProcessMain.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/code/node/cliProcessMain.ts) (Role: ASSEMBLY_POINT)
- [src/vs/workbench/contrib/tasks/browser/abstractTaskService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/tasks/browser/abstractTaskService.ts) (Role: ASSEMBLY_POINT)
- [src/vs/sessions/electron-browser/sessions.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/sessions/electron-browser/sessions.main.ts) (Role: ASSEMBLY_POINT)
- [src/vs/workbench/electron-browser/desktop.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/electron-browser/desktop.main.ts) (Role: ASSEMBLY_POINT)
- [src/vs/workbench/workbench.web.main.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.web.main.ts) (Role: ASSEMBLY_POINT)
- [src/vs/workbench/contrib/extensions/browser/extensionsWorkbenchService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/extensions/browser/extensionsWorkbenchService.ts) (Role: ASSEMBLY_POINT)
- [src/vs/workbench/services/configuration/browser/configurationService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/configuration/browser/configurationService.ts) (Role: ASSEMBLY_POINT)
- [src/vs/platform/windows/electron-main/windowsMainService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/platform/windows/electron-main/windowsMainService.ts) (Role: ASSEMBLY_POINT)
- [src/vs/workbench/services/preferences/browser/preferencesService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/preferences/browser/preferencesService.ts) (Role: ASSEMBLY_POINT)
- [src/vs/workbench/services/keybinding/browser/keybindingService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/services/keybinding/browser/keybindingService.ts) (Role: ASSEMBLY_POINT)
- [src/vs/workbench/contrib/tasks/electron-browser/taskService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/tasks/electron-browser/taskService.ts) (Role: ASSEMBLY_POINT)
- [src/vs/platform/native/electron-main/nativeHostMainService.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/platform/native/electron-main/nativeHostMainService.ts) (Role: ASSEMBLY_POINT)

### 4.1 ASSEMBLY_POINT Audit
cli/src/tunnels/code_server.rs
Verdict: REJECTED

Evidence
FanOut: 5
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
cli/src/tunnels/service.rs
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

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
cli/src/update_service.rs
Verdict: REJECTED

Evidence
FanOut: 1
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
extensions/copilot/src/extension/agents/vscode-node/githubOrgChatResourcesService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/byok/vscode-node/byokStorageService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/extension/chat/vscode-node/chatDebugFileLoggerService.ts
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/chat/vscode-node/chatHookService.ts
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/extension/chat/vscode-node/sessionTranscriptService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/chatSessions/claude/common/claudeAgentSdkLoaderService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/chatSessions/claude/common/claudeRuntimeDataService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/chatSessions/claude/common/claudeSessionStateService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.71

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/extension/chatSessions/claude/common/claudeToolPermissionService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

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
extensions/copilot/src/extension/chatSessions/claude/node/bundledClaudeAgentSdkLoaderService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/extension/chatSessions/claude/node/claudeCodeSdkService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/extension/chatSessions/claude/node/claudeLanguageModelServer.ts
Verdict: ACCEPTED

Evidence
FanOut: 28
Boundary Ratio: 0.89

Reason Code:
ACCEPTED

---
extensions/copilot/src/extension/chatSessions/claude/node/claudeRuntimeDataService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/extension/chatSessions/claude/node/claudeSessionStateService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/extension/chatSessions/claude/node/sessionParser/claudeCodeSessionService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.46

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/extension/chatSessions/claude/vscode-node/claudeAgentSdkLoaderService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/chatSessions/claude/vscode-node/claudeSlashCommandService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/chatSessions/claude/vscode-node/routingClaudeAgentSdkLoaderService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/extension/chatSessions/common/chatSessionWorkspaceFolderService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.33

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/extension/chatSessions/common/chatSessionWorktreeCheckpointService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/chatSessions/common/chatSessionWorktreeService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/chatSessions/common/claudeWorkspaceFolderService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/chatSessions/copilotcli/common/customSessionTitleService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/chatSessions/copilotcli/common/delegationSummaryService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/chatSessions/copilotcli/node/copilotcliSessionService.ts
Verdict: REJECTED

Evidence
FanOut: 49
Boundary Ratio: 0.71

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

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
FanOut: 10
Boundary Ratio: 0.90

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/chatSessions/vscode-node/copilotCLIPythonTerminalService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/extension/chatSessions/vscode-node/pullRequestCreationService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/chatSessions/vscode-node/pullRequestDetectionService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/chatSessions/vscode-node/pullRequestFileChangesService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/chronicle/common/sessionSyncStateService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

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
extensions/copilot/src/extension/commands/node/commandService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/completions-core/vscode-node/lib/src/experiments/featuresService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.40

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/extension/completions/common/copilotInlineCompletionItemProviderService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/completions/vscode-node/copilotInlineCompletionItemProviderService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

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
FanOut: 88
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
extensions/copilot/src/extension/externalAgents/node/oaiLanguageModelServer.ts
Verdict: REJECTED

Evidence
FanOut: 22
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/git/common/mergeConflictService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/intents/node/intentService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/languageContextProvider/vscode-node/languageContextProviderService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/linkify/common/linkifyService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.62

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/extension/onboardDebug/common/launchConfigService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/onboardDebug/vscode/launchConfigService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/extension/power/vscode-node/powerService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/prompt/node/promptVariablesService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/prompt/vscode-node/gitDiffService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/prompt/vscode-node/promptVariablesService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/promptFileContext/vscode-node/promptFileContextService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/prompts/node/codeMapper/codeMapperService.ts
Verdict: ACCEPTED

Evidence
FanOut: 25
Boundary Ratio: 0.92

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
extensions/copilot/src/extension/prompts/node/inline/fixCookbookService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

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
extensions/copilot/src/extension/typescriptContext/vscode-node/languageContextService.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/extension/typescriptContext/vscode-node/nesRenameService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/extension/workspaceRecorder/common/workspaceListenerService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/extension/workspaceRecorder/vscode-node/workspaceListenerService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/extension/xtab/common/similarFilesContextService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/lib/node/chatLibMain.ts
Verdict: ACCEPTED

Evidence
FanOut: 115
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_FANOUT
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
extensions/copilot/src/platform/authentication/common/authenticationUpgradeService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/authentication/common/staticGitHubAuthenticationService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/authentication/vscode-node/authenticationService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/chat/common/blockedExtensionService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/chat/common/chatDebugFileLoggerService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/chat/common/chatHookService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/chat/common/chatQuotaService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/chat/common/chatSessionService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/chat/common/interactionService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/chat/common/sessionTranscriptService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/chat/vscode/chatSessionService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/chunking/common/chunkingEndpointClient.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/chunking/node/naiveChunkerService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/commands/common/mockRunCommandExecutionService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/commands/common/runCommandExecutionService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/configuration/common/defaultsOnlyConfigurationService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/customInstructions/common/customInstructionsService.ts
Verdict: REJECTED

Evidence
FanOut: 21
Boundary Ratio: 0.76

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/debug/common/debugOutputService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/devcontainer/common/devContainerConfigurationService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/diff/common/diffService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/editSurvivalTracking/common/editSurvivalTrackerService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.60

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/endpoint/common/capiClient.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/endpoint/common/domainService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/endpoint/node/automodeService.ts
Verdict: REJECTED

Evidence
FanOut: 21
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/extensions/common/extensionsService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/extensions/vscode/extensionsService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/filesystem/common/fileSystemService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/git/common/gitCommitMessageService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/git/common/gitDiffService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/git/common/gitExtensionService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/git/common/nullGitDiffService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/git/common/nullGitExtensionService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/github/common/githubApiFetcherService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/github/common/githubService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.90

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/github/node/githubRepositoryService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/ignore/common/ignoreService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/ignore/vscode-node/ignoreService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.90

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/image/common/imageService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/inlineEdits/common/inlineEditsModelService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/inlineEdits/node/inlineEditsModelService.ts
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 0.78

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/interactive/common/interactiveSessionService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/languageContextProvider/common/languageContextProviderService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/languageContextProvider/common/nullLanguageContextProviderService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.60

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/languages/common/languageDiagnosticsService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/languages/common/languageFeaturesService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/languages/common/testLanguageDiagnosticsService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/languageServer/common/languageContextService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/multiFileEdit/common/editLogService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/nesFetch/common/completionsFetchService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/networking/common/fetcherService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/networking/common/toolDeferralService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/notebook/common/mockAlternativeContentService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/otel/common/noopOtelService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/otel/common/otelService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/otel/node/inMemoryOTelService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/parser/node/parserService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/promptFiles/common/promptsService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/prompts/common/promptPathRepresentationService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/proxyModels/common/proxyModelsService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/proxyModels/node/proxyModelsService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/releaseNotes/common/releaseNotesService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/remoteCodeSearch/common/adoCodeSearchService.ts
Verdict: ACCEPTED

Evidence
FanOut: 26
Boundary Ratio: 0.96

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
extensions/copilot/src/platform/remoteCodeSearch/common/githubCodeSearchService.ts
Verdict: ACCEPTED

Evidence
FanOut: 26
Boundary Ratio: 0.96

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

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
extensions/copilot/src/platform/review/common/reviewService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/settingsEditor/common/settingsEditorSearchService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/snippy/common/snippyService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/survey/common/surveyService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/tabs/common/tabsAndEditorsService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/tasks/common/tasksService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/tasks/common/testTasksService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/tasks/vscode/tasksService.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/telemetry/common/baseTelemetryService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.71

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
extensions/copilot/src/platform/telemetry/common/ghTelemetryService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/telemetry/common/nullExperimentationService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/telemetry/common/nullTelemetryService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/telemetry/node/baseExperimentationService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.90

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/telemetry/node/spyingTelemetryService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/telemetry/vscode-node/microsoftExperimentationService.ts
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.93

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/terminal/common/terminalService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/workbench/common/workbenchService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/workspace/common/workspaceService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/workspaceChunkSearch/common/rerankerService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/workspaceChunkSearch/node/codeSearch/externalIngestClient.ts
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/workspaceChunkSearch/node/scenarioAutomationWorkspaceChunkSearchService.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 0.81

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/copilot/src/platform/workspaceChunkSearch/node/workspaceChunkSearchService.ts
Verdict: ACCEPTED

Evidence
FanOut: 33
Boundary Ratio: 0.82

Reason Code:
ACCEPTED

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
FanOut: 5
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
extensions/github-authentication/src/common/experimentationService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

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
FanOut: 9
Boundary Ratio: 0.67

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
Verdict: ACCEPTED

Evidence
FanOut: 28
Boundary Ratio: 0.86

Reason Code:
ACCEPTED

---
extensions/typescript-language-features/src/commands/restartTsServer.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/typescript-language-features/src/experimentationService.ts
Verdict: REJECTED

Evidence
FanOut: 2
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
extensions/typescript-language-features/src/typescriptService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
extensions/typescript-language-features/src/typescriptServiceClient.ts
Verdict: ACCEPTED

Evidence
FanOut: 25
Boundary Ratio: 0.96

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

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
FanOut: 15
Boundary Ratio: 0.80

Reason Code:
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
src/vs/editor/browser/services/abstractCodeEditorService.ts
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.93

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/browser/services/bulkEditService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/browser/services/codeEditorService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/browser/services/editorWorkerService.ts
Verdict: ACCEPTED

Evidence
FanOut: 33
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/editor/browser/services/inlineCompletionsService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/browser/services/openerService.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 0.93

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/browser/services/renameSymbolTrackerService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/browser/widget/diffEditor/diffProviderFactoryService.ts
Verdict: REJECTED

Evidence
FanOut: 13
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
src/vs/editor/common/services/languageFeaturesService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/common/services/languageService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/common/services/markerDecorationsService.ts
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.93

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/common/services/modelService.ts
Verdict: REJECTED

Evidence
FanOut: 23
Boundary Ratio: 0.96

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/common/services/resolverService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/common/services/semanticTokensStylingService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.71

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/editor/common/services/textResourceConfigurationService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/common/services/treeSitter/treeSitterLibraryService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/common/services/treeSitter/treeSitterThemeService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/common/services/treeViewsDndService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/editor/contrib/gotoError/browser/markerNavigationService.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/editor.main.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/standalone/browser/quickInput/standaloneQuickInputService.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 0.94

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/standalone/browser/services/standaloneWebWorkerService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/standalone/browser/standaloneCodeEditorService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/standalone/browser/standaloneLayoutService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/standalone/browser/standaloneServices.ts
Verdict: ACCEPTED

Evidence
FanOut: 94
Boundary Ratio: 0.96

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/editor/standalone/browser/standaloneThemeService.ts
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/editor/standalone/browser/standaloneTreeSitterLibraryService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/accessibility/browser/accessibilityService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/accessibilitySignal/browser/accessibilitySignalService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/actions/browser/actionViewItemService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/actions/common/menuService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/browser/agentHostConnectionsService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/browser/nullAgentHostService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/browser/nullSshRemoteAgentHostService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/browser/nullWslRemoteAgentHostService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/browser/remoteAgentHostProtocolClient.ts
Verdict: ACCEPTED

Evidence
FanOut: 32
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/platform/agentHost/common/agentHostChangesetOperationService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/agentHost/common/agentHostChangesetService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/agentHost/common/agentHostChangesetSubscriptionService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/agentHost/common/agentHostCheckpointService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/common/agentHostConnectionsService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/agentHost/common/agentHostGitService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/agentHost/common/agentHostGitStateService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/agentHost/common/agentService.ts
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 0.65

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/agentHost/common/diffComputeService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/common/remoteAgentHostService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.56

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/agentHost/common/sessionDataService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/agentHost/electron-browser/localAgentHostService.ts
Verdict: REJECTED

Evidence
FanOut: 24
Boundary Ratio: 0.96

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/electron-browser/remoteAgentHostService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/electron-browser/sshRemoteAgentHostService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/agentHost/electron-browser/wslRemoteAgentHostService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/agentHost/node/agentConfigurationService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/node/agentHostAuthenticationService.ts
Verdict: REJECTED

Evidence
FanOut: 1
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
src/vs/platform/agentHost/node/agentHostChangesetOperationService.ts
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 0.71

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/agentHost/node/agentHostChangesetService.ts
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 0.82

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/node/agentHostChangesetSubscriptionService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/node/agentHostCheckpointService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/node/agentHostFileMonitorService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/node/agentHostGitService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/node/agentHostGitStateService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

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
src/vs/platform/agentHost/node/agentHostService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/node/agentHostTelemetryService.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/node/agentService.ts
Verdict: REJECTED

Evidence
FanOut: 55
Boundary Ratio: 0.64

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/agentHost/node/claude/claudeAgentSdkService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

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
src/vs/platform/agentHost/node/claude/claudeProxyService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.50

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
external://src/vs/platform/agentHost/node/claude/claudeTranscriptService.ts
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

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
FanOut: 12
Boundary Ratio: 0.58

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/agentHost/node/codex/codexProxyService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.40

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/agentHost/node/diffComputeService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/node/diffWorkerMain.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/node/otel/agentHostOTelService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/node/sessionDataService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/node/shared/agentHostOctoKitService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/node/shared/copilotApiService.ts
Verdict: REJECTED

Evidence
FanOut: 7
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
src/vs/platform/agentHost/node/sshRemoteAgentHostService.ts
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.93

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/node/tunnelAgentHostService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/node/tunnelHostMainService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/agentHost/node/wslRemoteAgentHostService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/auxiliaryWindow/electron-main/auxiliaryWindowsMainService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/backup/electron-main/backupMainService.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/browserView/common/playwrightService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/browserView/electron-main/browserViewGroupMainService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/browserView/electron-main/browserViewMainService.ts
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/browserView/node/browserViewGroupRemoteService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/browserView/node/playwrightService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.85

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/checksum/common/checksumService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/checksum/node/checksumService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/clipboard/common/clipboardService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/configuration/common/configurationService.ts
Verdict: ACCEPTED

Evidence
FanOut: 34
Boundary Ratio: 0.94

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/platform/contextkey/browser/contextKeyService.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/contextview/browser/contextMenuService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/contextview/browser/contextViewService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/cssDev/node/cssDevService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/dataChannel/browser/forwardingTelemetryService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/diagnostics/electron-browser/diagnosticsService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/diagnostics/electron-main/diagnosticsMainService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/diagnostics/node/diagnosticsService.ts
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.93

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/dialogs/electron-main/dialogMainService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/download/common/downloadService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/encryption/common/encryptionService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/encryption/electron-main/encryptionMainService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.33

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/environment/electron-main/environmentMainService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/environment/node/environmentService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/extensionManagement/common/abstractExtensionManagementService.ts
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 0.94

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/extensionManagement/common/allowedExtensionsService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/extensionManagement/common/extensionEnablementService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/extensionManagement/common/extensionGalleryManifestService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/extensionManagement/common/extensionsProfileScannerService.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 0.94

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/extensionManagement/common/extensionsScannerService.ts
Verdict: ACCEPTED

Evidence
FanOut: 28
Boundary Ratio: 0.89

Reason Code:
ACCEPTED

---
src/vs/platform/extensionManagement/common/extensionTipsService.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 0.94

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/extensionManagement/electron-browser/extensionsProfileScannerService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/extensionManagement/node/extensionManagementService.ts
Verdict: ACCEPTED

Evidence
FanOut: 38
Boundary Ratio: 0.89

Reason Code:
ACCEPTED

---
src/vs/platform/extensionManagement/node/extensionSignatureVerificationService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/extensionManagement/node/extensionsProfileScannerService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/extensionManagement/node/extensionTipsService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/extensionResourceLoader/browser/extensionResourceLoaderService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/extensionResourceLoader/common/extensionResourceLoaderService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 0.82

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/externalTerminal/electron-browser/externalTerminalService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/externalTerminal/node/externalTerminalService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.78

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/files/common/diskFileSystemProviderClient.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/files/common/fileService.ts
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 1.00

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
FanOut: 12
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
src/vs/platform/git/common/localGitService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/git/node/localGitService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/hover/browser/hoverService.ts
Verdict: REJECTED

Evidence
FanOut: 24
Boundary Ratio: 0.96

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/imageResize/common/imageResizeService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/instantiation/common/instantiationService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.60

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/ipc/common/mainProcessService.ts
Verdict: REJECTED

Evidence
FanOut: 3
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
src/vs/platform/ipc/electron-browser/mainProcessService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/ipc/electron-browser/services.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/keybinding/common/abstractKeybindingService.ts
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/keyboardLayout/common/keyboardLayoutService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/keyboardLayout/electron-main/keyboardLayoutMainService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.71

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/launch/electron-main/launchMainService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/lifecycle/electron-main/lifecycleMainService.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 0.81

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/lifecycle/node/sharedProcessLifecycleService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/list/browser/listService.ts
Verdict: REJECTED

Evidence
FanOut: 24
Boundary Ratio: 0.96

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/log/common/logService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/log/electron-main/loggerService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/log/node/loggerService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/markers/common/markerService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/mcp/common/allowedMcpServersService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/mcp/common/mcpGalleryManifestService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/mcp/common/mcpGalleryService.ts
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.87

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/mcp/common/mcpManagementService.ts
Verdict: REJECTED

Evidence
FanOut: 20
Boundary Ratio: 0.85

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/mcp/common/mcpResourceScannerService.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/mcp/node/mcpGatewayService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/mcp/node/mcpManagementService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/mcp/node/nativeMcpDiscoveryHelperService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/menubar/electron-main/menubarMainService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/meteredConnection/browser/meteredConnectionService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/meteredConnection/electron-browser/meteredConnectionService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.71

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/meteredConnection/electron-main/meteredConnectionMainService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/native/common/nativeHostService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.33

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/native/electron-main/nativeHostMainService.ts
Verdict: ACCEPTED

Evidence
FanOut: 44
Boundary Ratio: 0.84

Reason Code:
ACCEPTED

---
src/vs/platform/networkFilter/common/networkFilterService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/policy/common/fileManagedSettingsService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.78

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/policy/common/filePolicyService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/policy/common/multiplexPolicyService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/policy/node/nativeManagedSettingsService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/policy/node/nativePolicyService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/process/electron-main/processMainService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.71

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/product/common/productService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

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
src/vs/platform/profiling/electron-browser/profileAnalysisWorkerService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/profiling/electron-browser/profilingService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/profiling/node/profilingService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/protocol/electron-main/protocolMainService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 0.91

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/remote/browser/remoteAuthorityResolverService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/remote/common/remoteSocketFactoryService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/remote/common/sharedProcessTunnelService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/remote/electron-browser/remoteAuthorityResolverService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/remote/electron-browser/sharedProcessTunnelService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/remoteTunnel/electron-browser/remoteTunnelService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/remoteTunnel/node/remoteTunnelService.ts
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.73

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/request/electron-utility/requestService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/request/node/requestService.ts
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 0.94

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/sandbox/browser/sandboxHelperService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/sandbox/common/sandboxHelperService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/sandbox/electron-browser/sandboxHelperService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/sandbox/electron-main/sandboxHelperService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/sign/browser/signService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.71

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/sign/common/abstractSignService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/sign/node/signService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/state/node/stateService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/storage/common/storageService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 0.82

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/storage/electron-main/storageMain.ts
Verdict: ACCEPTED

Evidence
FanOut: 14
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/platform/storage/electron-main/storageMainService.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 0.93

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/telemetry/common/serverTelemetryService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.57

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/telemetry/common/telemetryService.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 0.79

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/telemetry/electron-browser/customEndpointTelemetryService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/telemetry/node/customEndpointTelemetryService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/terminal/common/terminalLogService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/terminal/node/heartbeatService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/terminal/node/ptyHostMain.ts
Verdict: ACCEPTED

Evidence
FanOut: 15
Boundary Ratio: 0.87

Reason Code:
ACCEPTED

---
src/vs/platform/terminal/node/ptyHostService.ts
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 0.94

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/terminal/node/ptyService.ts
Verdict: ACCEPTED

Evidence
FanOut: 27
Boundary Ratio: 0.93

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/platform/theme/common/themeService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/theme/electron-main/themeMainService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/tunnel/node/sharedProcessTunnelService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/tunnel/node/tunnelService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/undoRedo/common/undoRedoService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/update/electron-main/abstractUpdateService.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/uriIdentity/common/uriIdentityService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/url/common/urlService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/userDataProfile/common/userDataProfileStorageService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/userDataProfile/electron-browser/userDataProfileStorageService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/userDataProfile/node/userDataProfileStorageService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/userDataSync/common/userDataAutoSyncService.ts
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/userDataSync/common/userDataSyncEnablementService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/userDataSync/common/userDataSyncLocalStoreService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/userDataSync/common/userDataSyncService.ts
Verdict: REJECTED

Evidence
FanOut: 27
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/userDataSync/common/userDataSyncStoreService.ts
Verdict: REJECTED

Evidence
FanOut: 21
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/userDataSync/node/userDataAutoSyncService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 0.82

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/userInteraction/browser/userInteractionService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/utilityProcess/common/utilityProcessWorkerService.ts
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/utilityProcess/electron-main/utilityProcessWorkerMainService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.70

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/webContentExtractor/electron-browser/webContentExtractorService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/webContentExtractor/electron-main/cdpAccessibilityDomain.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/webContentExtractor/electron-main/webContentExtractorService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.78

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/webContentExtractor/node/sharedWebContentExtractorService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/webview/common/webviewManagerService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/webview/electron-main/webviewMainService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/webWorker/browser/webWorkerService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/platform/windows/electron-main/windowsMainService.ts
Verdict: ACCEPTED

Evidence
FanOut: 47
Boundary Ratio: 0.91

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/platform/workspaces/electron-main/workspacesHistoryMainService.ts
Verdict: REJECTED

Evidence
FanOut: 22
Boundary Ratio: 0.95

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/workspaces/electron-main/workspacesMainService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 0.82

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/platform/workspaces/electron-main/workspacesManagementMainService.ts
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/server/node/extensionHostStatusService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/server/node/extensionsScannerService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 0.91

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/server/node/remoteExtensionHostAgentServer.ts
Verdict: REJECTED

Evidence
FanOut: 33
Boundary Ratio: 0.79

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/server/node/remoteFileSystemProviderServer.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.92

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
src/vs/server/node/serverEnvironmentService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/server/node/serverLifetimeService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/server/node/serverServices.ts
Verdict: ACCEPTED

Evidence
FanOut: 90
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
src/vs/sessions/browser/chatDashboardService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/sessions/browser/paneCompositePartService.ts
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/sessions/browser/sessionsSetUpService.ts
Verdict: ACCEPTED

Evidence
FanOut: 27
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackService.ts
Verdict: REJECTED

Evidence
FanOut: 22
Boundary Ratio: 0.82

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/sessions/contrib/changes/browser/changesViewService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/sessions/contrib/changes/common/changesViewService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/sessions/contrib/chat/browser/aiCustomizationWorkspaceService.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 0.94

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/sessions/contrib/chat/browser/customizationHarnessService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/sessions/contrib/chat/browser/nullChatTipService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/sessions/contrib/chat/browser/nullInlineChatSessionService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/sessions/contrib/chat/browser/promptsService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/sessions/contrib/chat/browser/sessionsTasksService.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 0.93

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/sessions/contrib/codeReview/browser/codeReviewService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/sessions/contrib/github/browser/githubApiClient.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/sessions/contrib/github/browser/githubService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.54

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/sessions/contrib/providers/remoteAgentHost/browser/webTunnelAgentHostService.ts
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/sessions/contrib/providers/remoteAgentHost/electron-browser/tunnelAgentHostService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

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
src/vs/sessions/services/agentHost/browser/agentHostCustomizationService.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/sessions/services/agentHostFilter/browser/agentHostFilterService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.90

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/sessions/services/extensionRecommendations/common/extensionRecommendationNotificationService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/sessions/services/sessions/browser/sessionGroupsService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/sessions/services/sessions/browser/sessionSectionOrderService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/sessions/services/sessions/browser/sessionsListModelService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/sessions/services/sessions/browser/sessionsManagementService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.77

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/sessions/services/sessions/browser/sessionsPartService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/sessions/services/sessions/browser/sessionsProvidersService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/sessions/services/sessions/browser/sessionsService.ts
Verdict: REJECTED

Evidence
FanOut: 21
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/sessions/services/workspace/browser/workspaceContextService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

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
src/vs/workbench/api/browser/mainThreadDebugService.ts
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/browser/mainThreadDownloadService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/browser/mainThreadExtensionService.ts
Verdict: REJECTED

Evidence
FanOut: 23
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/browser/mainThreadFileSystemEventService.ts
Verdict: REJECTED

Evidence
FanOut: 20
Boundary Ratio: 0.95

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/browser/mainThreadGitExtensionService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/browser/mainThreadLabelService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/browser/mainThreadLogService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/browser/mainThreadOutputService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/browser/mainThreadTerminalService.ts
Verdict: REJECTED

Evidence
FanOut: 20
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/browser/mainThreadTunnelService.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/common/extensionHostMain.ts
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 0.63

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/api/common/extHost.common.services.ts
Verdict: REJECTED

Evidence
FanOut: 34
Boundary Ratio: 0.03

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/api/common/extHostApiDeprecationService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/api/common/extHostDebugService.ts
Verdict: REJECTED

Evidence
FanOut: 28
Boundary Ratio: 0.61

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/api/common/extHostExtensionService.ts
Verdict: REJECTED

Evidence
FanOut: 39
Boundary Ratio: 0.56

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/api/common/extHostFileSystemEventService.ts
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 0.59

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/api/common/extHostGitExtensionService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/api/common/extHostInitDataService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/common/extHostLabelService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/api/common/extHostLocalizationService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.63

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/api/common/extHostLoggerService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/api/common/extHostLogService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/api/common/extHostMessageService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/api/common/extHostRpcService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/common/extHostTerminalService.ts
Verdict: REJECTED

Evidence
FanOut: 26
Boundary Ratio: 0.77

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/api/common/extHostTunnelService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/api/common/extHostUriTransformerService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/common/extHostVariableResolverService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.54

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
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/node/extHostDebugService.ts
Verdict: REJECTED

Evidence
FanOut: 24
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/node/extHostDownloadService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/node/extHostExtensionService.ts
Verdict: REJECTED

Evidence
FanOut: 20
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/api/node/extHostLoggerService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/node/extHostTerminalService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/node/extHostTunnelService.ts
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/node/extHostVariableResolverService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/api/node/loopbackServer.ts
Verdict: REJECTED

Evidence
FanOut: 7
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
src/vs/workbench/api/worker/extHostExtensionService.ts
Verdict: REJECTED

Evidence
FanOut: 9
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
src/vs/workbench/browser/parts/paneCompositePartService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/browser/parts/views/viewPaneContainer.ts
Verdict: ACCEPTED

Evidence
FanOut: 37
Boundary Ratio: 0.92

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/browser/web.main.ts
Verdict: ACCEPTED

Evidence
FanOut: 85
Boundary Ratio: 0.96

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/contrib/agentsVoice/browser/agentsVoiceWindowService.ts
Verdict: ACCEPTED

Evidence
FanOut: 29
Boundary Ratio: 0.86

Reason Code:
ACCEPTED

---
src/vs/workbench/contrib/browserView/common/browserZoomService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/browserView/electron-browser/browserViewCDPService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/browserView/electron-browser/browserViewWorkbenchService.ts
Verdict: ACCEPTED

Evidence
FanOut: 31
Boundary Ratio: 0.94

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/contrib/bulkEdit/browser/bulkEditService.ts
Verdict: ACCEPTED

Evidence
FanOut: 25
Boundary Ratio: 0.84

Reason Code:
ACCEPTED

---
src/vs/workbench/contrib/chat/browser/accessibility/chatAccessibilityService.ts
Verdict: REJECTED

Evidence
FanOut: 20
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/browser/agentPluginRepositoryService.ts
Verdict: REJECTED

Evidence
FanOut: 22
Boundary Ratio: 0.82

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostActiveClientService.ts
Verdict: REJECTED

Evidence
FanOut: 22
Boundary Ratio: 0.73

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.ts
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostNewSessionFolderService.ts
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostToolSetEnablementService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentSessionProjectionService.ts
Verdict: REJECTED

Evidence
FanOut: 40
Boundary Ratio: 0.55

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationWorkspaceService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/browser/aiCustomization/customizationCreatorService.ts
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 0.76

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/browser/aiCustomization/customizationHarnessService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/browser/attachments/chatAttachmentResolveService.ts
Verdict: ACCEPTED

Evidence
FanOut: 27
Boundary Ratio: 0.85

Reason Code:
ACCEPTED

---
src/vs/workbench/contrib/chat/browser/attachments/chatContextPickService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingTextModelChangeService.ts
Verdict: ACCEPTED

Evidence
FanOut: 32
Boundary Ratio: 0.84

Reason Code:
ACCEPTED

---
src/vs/workbench/contrib/chat/browser/chatGoalSummaryService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/browser/chatImageCarouselService.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 0.79

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/browser/chatStatus/chatStatusItemService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/browser/chatTipService.ts
Verdict: REJECTED

Evidence
FanOut: 23
Boundary Ratio: 0.70

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/browser/codeBlockContextProviderService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/browser/contextContrib/chatContextService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 0.73

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/browser/languageModelsConfigurationService.ts
Verdict: ACCEPTED

Evidence
FanOut: 25
Boundary Ratio: 0.92

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackService.ts
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/browser/pluginGitCommandService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/browser/pluginInstallService.ts
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/browser/voiceClient/micCaptureService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/browser/voiceClient/ttsPlaybackService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/browser/voiceClient/voiceToolDispatchService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.54

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatMarkdownAnchorService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/browser/widget/chatWidgetService.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 0.69

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/browser/widget/input/chatInputNotificationService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/common/chatDebugService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/common/chatService/chatService.ts
Verdict: REJECTED

Evidence
FanOut: 31
Boundary Ratio: 0.74

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/common/chatSessionsService.ts
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 0.82

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/common/customizationHarnessService.ts
Verdict: REJECTED

Evidence
FanOut: 20
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/common/editing/chatCodeMapperService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/common/editing/chatEditingService.ts
Verdict: REJECTED

Evidence
FanOut: 20
Boundary Ratio: 0.90

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/common/model/chatTransferService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/common/plugins/agentPluginRepositoryService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/common/plugins/agentPluginService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.70

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/common/plugins/pluginGitCommandService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/common/plugins/pluginGitService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/common/plugins/pluginInstallService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/common/plugins/pluginMarketplaceService.ts
Verdict: REJECTED

Evidence
FanOut: 25
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/common/plugins/workspacePluginSettingsService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/common/promptSyntax/service/extensionPromptFileService.ts
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.87

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 0.71

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/common/voiceChatService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 0.91

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/common/voiceClient/voiceClientService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/common/voicePlaybackService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/common/widget/chatLayoutService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/common/widget/chatWidgetHistoryService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.70

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/electron-browser/actions/exportAgentHostDebugLogsService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/chat/electron-browser/pluginGitCommandService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/chat/electron-browser/tunnelHostService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/comments/browser/commentService.ts
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 0.74

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/debug/browser/debugService.ts
Verdict: REJECTED

Evidence
FanOut: 54
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/debug/browser/extensionHostDebugService.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/debug/common/nullDebugService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.71

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/debug/electron-browser/extensionHostDebugService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/debug/node/telemetryApp.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/editSessions/browser/editSessionsStorageService.ts
Verdict: REJECTED

Evidence
FanOut: 23
Boundary Ratio: 0.91

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/editSessions/common/editSessionsLogService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/editSessions/common/editSessionsStorageClient.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/editTelemetry/browser/randomService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/editTelemetry/browser/telemetry/aiEditTelemetry/aiEditTelemetryService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/extensions/browser/extensionRecommendationNotificationService.ts
Verdict: REJECTED

Evidence
FanOut: 20
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/extensions/browser/extensionRecommendationsService.ts
Verdict: REJECTED

Evidence
FanOut: 23
Boundary Ratio: 0.65

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/extensions/browser/extensionsWorkbenchService.ts
Verdict: ACCEPTED

Evidence
FanOut: 50
Boundary Ratio: 0.98

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/contrib/extensions/electron-browser/extensionProfileService.ts
Verdict: REJECTED

Evidence
FanOut: 20
Boundary Ratio: 0.90

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/externalUriOpener/common/externalUriOpenerService.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/files/browser/explorerService.ts
Verdict: REJECTED

Evidence
FanOut: 24
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/git/browser/gitService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/git/common/gitService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/inlineChat/browser/inlineChatSessionService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/inlineCompletions/browser/renameSymbolTrackerService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/interactive/browser/interactiveDocumentService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/interactive/browser/interactiveHistoryService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/issue/browser/githubUploadService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/issue/browser/issueFormService.ts
Verdict: ACCEPTED

Evidence
FanOut: 29
Boundary Ratio: 0.93

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/contrib/issue/browser/issueService.ts
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 0.94

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/issue/browser/recordingService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/issue/browser/screenshotService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/issue/electron-browser/issueService.ts
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.93

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/issue/electron-browser/nativeGitHubUploadService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/issue/electron-browser/nativeIssueFormService.ts
Verdict: REJECTED

Evidence
FanOut: 20
Boundary Ratio: 0.85

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/issue/electron-browser/nativeRecordingService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/issue/electron-browser/nativeScreenshotService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/mcp/browser/mcpElicitationService.ts
Verdict: REJECTED

Evidence
FanOut: 21
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/mcp/browser/mcpGatewayService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/mcp/browser/mcpWorkbenchService.ts
Verdict: ACCEPTED

Evidence
FanOut: 40
Boundary Ratio: 0.90

Reason Code:
ACCEPTED

---
src/vs/workbench/contrib/mcp/common/mcpGatewayService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/mcp/common/mcpSamplingService.ts
Verdict: REJECTED

Evidence
FanOut: 21
Boundary Ratio: 0.76

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/mcp/common/mcpSandboxService.ts
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 0.94

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/mcp/common/mcpServer.ts
Verdict: REJECTED

Evidence
FanOut: 40
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/mcp/common/mcpService.ts
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 0.72

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/mcp/electron-browser/mcpGatewayService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/multiDiffEditor/browser/multiDiffSourceResolverService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

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
src/vs/workbench/contrib/notebook/browser/services/notebookEditorService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/notebook/common/notebookCellStatusBarService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/notebook/common/notebookEditorModelResolverService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/notebook/common/notebookExecutionService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/notebook/common/notebookExecutionStateService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.71

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/notebook/common/notebookKernelService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.90

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/notebook/common/notebookKeymapService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/notebook/common/notebookLoggingService.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/notebook/common/notebookRendererMessagingService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/notebook/common/notebookService.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 0.75

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
src/vs/workbench/contrib/notebook/common/services/notebookWorkerService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/onboarding/browser/onboardingService.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/onboarding/common/onboardingScenarioService.ts
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
src/vs/workbench/contrib/remoteCodingAgents/common/remoteCodingAgentsService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/scm/browser/scmViewPaneContainer.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/scm/browser/scmViewService.ts
Verdict: REJECTED

Evidence
FanOut: 24
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/scm/common/quickDiffService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/scm/common/scmService.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 0.93

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/search/browser/notebookSearch/notebookSearchService.ts
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/search/browser/replaceService.ts
Verdict: ACCEPTED

Evidence
FanOut: 27
Boundary Ratio: 0.85

Reason Code:
ACCEPTED

---
src/vs/workbench/contrib/search/browser/searchTreeModel/searchViewModelWorkbenchService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/search/common/searchHistoryService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/share/browser/shareService.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 0.93

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/snippets/browser/snippetsService.ts
Verdict: ACCEPTED

Evidence
FanOut: 27
Boundary Ratio: 0.89

Reason Code:
ACCEPTED

---
src/vs/workbench/contrib/speech/browser/speechService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/speech/common/speechService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/tags/browser/workspaceTagsService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/tags/electron-browser/workspaceTagsService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 0.82

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/tasks/browser/abstractTaskService.ts
Verdict: ACCEPTED

Evidence
FanOut: 70
Boundary Ratio: 0.89

Reason Code:
ACCEPTED

---
src/vs/workbench/contrib/tasks/browser/taskService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/tasks/common/taskService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/tasks/electron-browser/taskService.ts
Verdict: ACCEPTED

Evidence
FanOut: 45
Boundary Ratio: 0.89

Reason Code:
ACCEPTED

---
src/vs/workbench/contrib/terminal/browser/agentHostTerminalService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/terminal/browser/terminalConfigurationService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/terminal/browser/terminalEditingService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.60

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/terminal/browser/terminalEditorService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.77

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/terminal/browser/terminalGroupService.ts
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 0.76

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/terminal/browser/terminalInstanceService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.85

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/terminal/browser/terminalProfileResolverService.ts
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/terminal/browser/terminalProfileService.ts
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 0.84

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/terminal/browser/terminalService.ts
Verdict: REJECTED

Evidence
FanOut: 51
Boundary Ratio: 0.78

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/terminal/common/environmentVariableService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.78

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/terminal/electron-browser/terminalProfileResolverService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/terminalContrib/chat/browser/terminalChatService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 0.91

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/terminalContrib/chatAgentTools/common/terminalSandboxService.ts
Verdict: ACCEPTED

Evidence
FanOut: 26
Boundary Ratio: 0.96

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/contrib/terminalContrib/links/browser/terminalLinkProviderService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/terminalContrib/quickFix/browser/terminalQuickFixService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/terminalContrib/suggest/browser/terminalCompletionService.ts
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 0.84

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/timeline/common/timelineService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/url/browser/trustedDomainService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/url/common/trustedDomainService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/webview/browser/webviewService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.43

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/webview/electron-browser/webviewService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/contrib/webviewPanel/browser/webviewWorkbenchService.ts
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/webviewView/browser/webviewViewService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedService.ts
Verdict: ACCEPTED

Evidence
FanOut: 33
Boundary Ratio: 0.91

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/contrib/welcomeOnboarding/common/onboardingService.ts
Verdict: REJECTED

Evidence
FanOut: 2
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
src/vs/workbench/services/accessibility/common/accessibleViewInformationService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/accessibility/electron-browser/accessibilityService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/activity/browser/activityService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/agentHost/browser/editorRemoteAgentHostServiceClient.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/agentHost/common/agentHostFileSystemService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/agentHost/common/agentHostResourceService.ts
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/agentHost/electron-browser/agentHostService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/aiEmbeddingVector/common/aiEmbeddingVectorService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/aiRelatedInformation/common/aiRelatedInformationService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/aiSettingsSearch/common/aiSettingsSearchService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/assignment/common/assignmentService.ts
Verdict: REJECTED

Evidence
FanOut: 21
Boundary Ratio: 0.95

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/authentication/browser/authenticationAccessService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/authentication/browser/authenticationExtensionsService.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 0.81

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/authentication/browser/authenticationMcpAccessService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/authentication/browser/authenticationMcpService.ts
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 0.82

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/authentication/browser/authenticationMcpUsageService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/authentication/browser/authenticationQueryService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.30

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/authentication/browser/authenticationService.ts
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/authentication/browser/authenticationUsageService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/authentication/browser/dynamicAuthenticationProviderStorageService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/auxiliaryWindow/browser/auxiliaryWindowService.ts
Verdict: REJECTED

Evidence
FanOut: 24
Boundary Ratio: 0.96

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/auxiliaryWindow/electron-browser/auxiliaryWindowService.ts
Verdict: REJECTED

Evidence
FanOut: 22
Boundary Ratio: 0.91

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/banner/browser/bannerService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/browserView/electron-browser/playwrightWorkbenchService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/chat/common/chatEntitlementService.ts
Verdict: REJECTED

Evidence
FanOut: 24
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/checksum/electron-browser/checksumService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/clipboard/browser/clipboardService.ts
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.93

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/clipboard/electron-browser/clipboardService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/commands/common/commandService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/configuration/browser/configurationService.ts
Verdict: ACCEPTED

Evidence
FanOut: 45
Boundary Ratio: 0.93

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/services/configuration/common/jsonEditingService.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 0.94

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/configurationResolver/browser/baseConfigurationResolverService.ts
Verdict: REJECTED

Evidence
FanOut: 22
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/configurationResolver/browser/configurationResolverService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 0.82

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/configurationResolver/electron-browser/configurationResolverService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.85

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/contextmenu/electron-browser/contextmenuService.ts
Verdict: REJECTED

Evidence
FanOut: 21
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/dataChannel/browser/dataChannelService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/decorations/browser/decorationsService.ts
Verdict: REJECTED

Evidence
FanOut: 22
Boundary Ratio: 0.95

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/dialogs/browser/abstractFileDialogService.ts
Verdict: ACCEPTED

Evidence
FanOut: 28
Boundary Ratio: 0.96

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/services/dialogs/browser/fileDialogService.ts
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 0.94

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/dialogs/common/dialogService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/dialogs/electron-browser/fileDialogService.ts
Verdict: REJECTED

Evidence
FanOut: 24
Boundary Ratio: 0.96

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/editor/browser/codeEditorService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 0.91

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/editor/browser/editorPaneService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/editor/browser/editorResolverService.ts
Verdict: REJECTED

Evidence
FanOut: 20
Boundary Ratio: 0.85

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/editor/browser/editorService.ts
Verdict: ACCEPTED

Evidence
FanOut: 29
Boundary Ratio: 0.90

Reason Code:
ACCEPTED

---
src/vs/workbench/services/editor/common/customEditorLabelService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/editor/common/editorGroupsService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/editor/common/editorPaneService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/editor/common/editorResolverService.ts
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.87

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/editor/common/editorService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/encryption/browser/encryptionService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/encryption/electron-browser/encryptionService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/environment/browser/environmentService.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 0.93

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/environment/common/environmentService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/environment/electron-browser/environmentService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 0.91

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/environment/electron-browser/shellEnvironmentService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/extensionManagement/browser/builtinExtensionsScannerService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/extensionManagement/browser/extensionEnablementService.ts
Verdict: ACCEPTED

Evidence
FanOut: 26
Boundary Ratio: 0.92

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/services/extensionManagement/browser/extensionGalleryManifestService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/extensionManagement/browser/extensionsProfileScannerService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/extensionManagement/browser/webExtensionsScannerService.ts
Verdict: ACCEPTED

Evidence
FanOut: 33
Boundary Ratio: 0.97

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/services/extensionManagement/common/extensionFeaturesManagemetService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/extensionManagement/common/extensionGalleryService.ts
Verdict: ACCEPTED

Evidence
FanOut: 25
Boundary Ratio: 0.96

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/services/extensionManagement/common/extensionManagementChannelClient.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/extensionManagement/common/extensionManagementServerService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 0.73

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/extensionManagement/common/extensionManagementService.ts
Verdict: ACCEPTED

Evidence
FanOut: 34
Boundary Ratio: 0.97

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/services/extensionManagement/common/remoteExtensionManagementService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.78

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/extensionManagement/common/webExtensionManagementService.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 0.94

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/extensionManagement/electron-browser/extensionGalleryManifestService.ts
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/extensionManagement/electron-browser/extensionManagementServerService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/extensionManagement/electron-browser/extensionManagementService.ts
Verdict: REJECTED

Evidence
FanOut: 22
Boundary Ratio: 0.95

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/extensionManagement/electron-browser/extensionTipsService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/extensionManagement/electron-browser/nativeExtensionManagementService.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/extensionManagement/electron-browser/remoteExtensionManagementService.ts
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/extensionRecommendations/common/extensionIgnoredRecommendationsService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.71

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/extensions/browser/extensionService.ts
Verdict: REJECTED

Evidence
FanOut: 35
Boundary Ratio: 0.69

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/extensions/browser/extensionsScannerService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/extensions/common/abstractExtensionService.ts
Verdict: REJECTED

Evidence
FanOut: 44
Boundary Ratio: 0.68

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/extensions/common/extensionManifestPropertiesService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/extensions/electron-browser/extensionsScannerService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/extensions/electron-browser/nativeExtensionService.ts
Verdict: REJECTED

Evidence
FanOut: 52
Boundary Ratio: 0.73

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/files/browser/elevatedFileService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/files/common/elevatedFileService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/files/electron-browser/elevatedFileService.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 0.86

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
src/vs/workbench/services/filesConfiguration/common/filesConfigurationService.ts
Verdict: REJECTED

Evidence
FanOut: 22
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/history/browser/historyService.ts
Verdict: ACCEPTED

Evidence
FanOut: 27
Boundary Ratio: 0.93

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/services/host/browser/browserHostService.ts
Verdict: ACCEPTED

Evidence
FanOut: 36
Boundary Ratio: 0.97

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/services/host/electron-browser/nativeHostService.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/imageResize/browser/imageResizeService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/imageResize/electron-browser/imageResizeService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/integrity/browser/integrityService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 0.50

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/integrity/electron-browser/integrityService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/keybinding/browser/keybindingService.ts
Verdict: ACCEPTED

Evidence
FanOut: 43
Boundary Ratio: 0.93

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/services/keybinding/browser/keyboardLayoutService.ts
Verdict: ACCEPTED

Evidence
FanOut: 26
Boundary Ratio: 0.81

Reason Code:
ACCEPTED

---
src/vs/workbench/services/keybinding/electron-browser/nativeKeyboardLayoutService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/label/common/labelService.ts
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 0.95

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/language/common/languageService.ts
Verdict: REJECTED

Evidence
FanOut: 18
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
src/vs/workbench/services/languageDetection/common/languageDetectionWorkerService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/languageStatus/common/languageStatusService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/layout/browser/layoutService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/lifecycle/browser/lifecycleService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/lifecycle/common/lifecycleService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/lifecycle/electron-browser/lifecycleService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.70

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/localization/browser/localeService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.90

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/localization/electron-browser/languagePackService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/localization/electron-browser/localeService.ts
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 0.95

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/log/electron-browser/logService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/mcp/browser/mcpGalleryManifestService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/mcp/browser/mcpWorkbenchManagementService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/mcp/common/mcpWorkbenchManagementService.ts
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/mcp/electron-browser/mcpGalleryManifestService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/mcp/electron-browser/mcpWorkbenchManagementService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/menubar/electron-browser/menubarService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/model/common/modelService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/notebook/common/notebookDocumentService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/notification/common/notificationService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/outline/browser/outlineService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/path/browser/pathService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 0.86

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/path/common/pathService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/path/electron-browser/pathService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/policies/common/accountPolicyService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/power/browser/powerService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/power/common/powerService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/power/electron-browser/powerService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/preferences/browser/preferencesService.ts
Verdict: ACCEPTED

Evidence
FanOut: 43
Boundary Ratio: 0.93

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/services/process/electron-browser/processService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/progress/browser/progressService.ts
Verdict: REJECTED

Evidence
FanOut: 20
Boundary Ratio: 0.85

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/quickinput/browser/quickInputService.ts
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 0.94

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/remote/browser/remoteAgentService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/remote/common/abstractRemoteAgentService.ts
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.87

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/remote/common/remoteAgentService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/remote/common/remoteExplorerService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/remote/common/remoteFileSystemProviderClient.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/remote/electron-browser/remoteAgentService.ts
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.87

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/request/browser/requestService.ts
Verdict: REJECTED

Evidence
FanOut: 12
Boundary Ratio: 0.92

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/request/electron-browser/requestService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.90

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/search/browser/searchService.ts
Verdict: REJECTED

Evidence
FanOut: 23
Boundary Ratio: 0.91

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/search/common/searchService.ts
Verdict: REJECTED

Evidence
FanOut: 22
Boundary Ratio: 0.95

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/search/electron-browser/searchService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/search/node/rawSearchService.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 0.79

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

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
src/vs/workbench/services/secrets/browser/secretStorageService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/secrets/electron-browser/secretStorageService.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/sharedProcess/electron-browser/sharedProcessService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/storage/browser/storageService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/storage/electron-browser/storageService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/telemetry/browser/telemetryService.ts
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/telemetry/electron-browser/telemetryService.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/terminal/common/embedderTerminalService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/textfile/browser/browserTextFileService.ts
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/textfile/browser/textFileService.ts
Verdict: ACCEPTED

Evidence
FanOut: 34
Boundary Ratio: 0.91

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/services/textfile/common/textEditorService.ts
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/textfile/electron-browser/nativeTextFileService.ts
Verdict: REJECTED

Evidence
FanOut: 21
Boundary Ratio: 0.90

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/textMate/browser/backgroundTokenization/worker/textMateTokenizationWorker.workerMain.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/textmodelResolver/common/textModelResolverService.ts
Verdict: REJECTED

Evidence
FanOut: 14
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/textresourceProperties/common/textResourcePropertiesService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/themes/browser/browserHostColorSchemeService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/themes/browser/workbenchThemeService.ts
Verdict: REJECTED

Evidence
FanOut: 39
Boundary Ratio: 0.74

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/themes/common/hostColorSchemeService.ts
Verdict: REJECTED

Evidence
FanOut: 2
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/themes/common/workbenchThemeService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/themes/electron-browser/nativeHostColorSchemeService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/timer/browser/timerService.ts
Verdict: REJECTED

Evidence
FanOut: 17
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/timer/electron-browser/timerService.ts
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/title/browser/titleService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/title/electron-browser/titleService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/treeSitter/browser/treeSitterLibraryService.ts
Verdict: REJECTED

Evidence
FanOut: 13
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/treeSitter/browser/treeSitterThemeService.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/tunnel/browser/tunnelService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/tunnel/electron-browser/tunnelService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/update/browser/updateService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/update/electron-browser/updateService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/url/browser/urlService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/url/electron-browser/urlService.ts
Verdict: REJECTED

Evidence
FanOut: 11
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/userActivity/common/userActivityService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/userAttention/common/userAttentionService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/userDataProfile/browser/userDataProfileImportExportService.ts
Verdict: REJECTED

Evidence
FanOut: 35
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/userDataProfile/browser/userDataProfileStorageService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/userDataProfile/common/userDataProfileService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/userDataSync/browser/userDataSyncEnablementService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/userDataSync/browser/userDataSyncWorkbenchService.ts
Verdict: ACCEPTED

Evidence
FanOut: 36
Boundary Ratio: 0.97

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/services/userDataSync/browser/webUserDataSyncEnablementService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.67

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/userDataSync/electron-browser/userDataAutoSyncService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 0.80

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/userDataSync/electron-browser/userDataSyncService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 0.83

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/utilityProcess/electron-browser/utilityProcessWorkerWorkbenchService.ts
Verdict: REJECTED

Evidence
FanOut: 7
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/views/browser/viewDescriptorService.ts
Verdict: REJECTED

Evidence
FanOut: 20
Boundary Ratio: 0.90

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/views/browser/viewsService.ts
Verdict: ACCEPTED

Evidence
FanOut: 28
Boundary Ratio: 1.00

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/services/views/common/viewsService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/workingCopy/browser/workingCopyBackupService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.75

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/workingCopy/browser/workingCopyHistoryService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/workingCopy/common/workingCopyBackupService.ts
Verdict: REJECTED

Evidence
FanOut: 16
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/workingCopy/common/workingCopyEditorService.ts
Verdict: REJECTED

Evidence
FanOut: 8
Boundary Ratio: 0.88

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/workingCopy/common/workingCopyFileService.ts
Verdict: REJECTED

Evidence
FanOut: 18
Boundary Ratio: 0.72

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/workingCopy/common/workingCopyHistoryService.ts
Verdict: ACCEPTED

Evidence
FanOut: 26
Boundary Ratio: 0.88

Reason Code:
ACCEPTED

---
src/vs/workbench/services/workingCopy/common/workingCopyService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 0.89

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/workingCopy/electron-browser/workingCopyBackupService.ts
Verdict: REJECTED

Evidence
FanOut: 10
Boundary Ratio: 0.70

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/workingCopy/electron-browser/workingCopyHistoryService.ts
Verdict: REJECTED

Evidence
FanOut: 3
Boundary Ratio: 0.33

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/vs/workbench/services/workspaces/browser/abstractWorkspaceEditingService.ts
Verdict: ACCEPTED

Evidence
FanOut: 27
Boundary Ratio: 0.93

Reason Code:
ASSEMBLY_HIGH_BOUNDARY_RATIO
ACCEPTED

---
src/vs/workbench/services/workspaces/browser/workspaceEditingService.ts
Verdict: REJECTED

Evidence
FanOut: 19
Boundary Ratio: 0.84

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/workspaces/browser/workspacesService.ts
Verdict: REJECTED

Evidence
FanOut: 15
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/workspaces/common/canonicalUriService.ts
Verdict: REJECTED

Evidence
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/workspaces/common/editSessionIdentityService.ts
Verdict: REJECTED

Evidence
FanOut: 6
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/workspaces/common/workspaceIdentityService.ts
Verdict: REJECTED

Evidence
FanOut: 9
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/vs/workbench/services/workspaces/electron-browser/workspaceEditingService.ts
Verdict: ACCEPTED

Evidence
FanOut: 28
Boundary Ratio: 0.89

Reason Code:
ACCEPTED

---
src/vs/workbench/services/workspaces/electron-browser/workspacesService.ts
Verdict: REJECTED

Evidence
FanOut: 5
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

## 5. Knowledge Connectivity
<details><summary><b>Show Knowledge Sources</b></summary>

- [src/vs/workbench/contrib/mcp/browser/mcpLanguageFeatures.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/mcp/browser/mcpLanguageFeatures.ts) -> src/vs/base/common/range.ts
- [extensions/copilot/src/extension/chatSessions/copilotcli/node/test/exitPlanModeHandler.spec.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/chatSessions/copilotcli/node/test/exitPlanModeHandler.spec.ts) -> src/vs/workbench/services/lifecycle/common/lifecycle.ts
- [src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationWidget.ts) -> src/vs/base/common/themables.ts
- [src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatPlanReviewPart.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatPlanReviewPart.ts) -> extensions/copilot/src/extension/prompts/node/test/fixtures/codeEditorWidget.ts
- [src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackEditorContribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackEditorContribution.ts) -> src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackEditorActions.ts
- [src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackEditorActions.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackEditorActions.ts) -> extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/uri.ts
- [src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackEditorContribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackEditorContribution.ts) -> src/vs/base/common/themables.ts
- [extensions/copilot/src/extension/agents/vscode-node/test/planAgentProvider.spec.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/agents/vscode-node/test/planAgentProvider.spec.ts) -> extensions/copilot/src/extension/agents/vscode-node/agentTypes.ts
- [extensions/copilot/src/extension/agents/vscode-node/planAgentProvider.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/agents/vscode-node/planAgentProvider.ts) -> extensions/copilot/src/platform/extContext/common/extensionContext.ts
- [extensions/copilot/test/simulation/fixtures/multiFileEdit/readme-generation/.devcontainer/post-install.sh](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/test/simulation/fixtures/multiFileEdit/readme-generation/.devcontainer/post-install.sh) -> sh
- [src/vs/workbench/contrib/mcp/common/mcpLanguageModelToolContribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/mcp/common/mcpLanguageModelToolContribution.ts) -> extensions/copilot/src/platform/inlineEdits/common/utils/observable.ts
- [extensions/copilot/src/extension/chatSessions/copilotcli/node/test/exitPlanModeHandler.spec.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/extensions/copilot/src/extension/chatSessions/copilotcli/node/test/exitPlanModeHandler.spec.ts) -> extensions/copilot/src/platform/workspace/common/workspaceService.ts
- [src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationWidget.ts) -> src/vs/base/common/iconLabels.ts
- [src/vs/workbench/contrib/chat/test/browser/widget/chatContentParts/chatPlanReviewPart.test.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/test/browser/widget/chatContentParts/chatPlanReviewPart.test.ts) -> src/vs/workbench/contrib/chat/common/model/chatViewModel.ts
- [src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationWidget.ts) -> src/vs/base/common/codicons.ts
- [src/vs/workbench/contrib/mcp/browser/mcpLanguageFeatures.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/mcp/browser/mcpLanguageFeatures.ts) -> src/vs/workbench/services/configurationResolver/common/configurationResolverExpression.ts
- [src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackEditorActions.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackEditorActions.ts) -> src/vs/workbench/contrib/chat/common/actions/chatActions.ts
- [src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackEditorContribution.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackEditorContribution.ts) -> src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackService.ts
- [src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationWidget.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationWidget.ts) -> src/vs/workbench/contrib/chat/browser/chat.ts
- [src/vs/workbench/contrib/chat/common/tools/builtinTools/reviewPlanTool.ts](vscode://file//home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/contrib/chat/common/tools/builtinTools/reviewPlanTool.ts) -> src/vs/base/common/htmlContent.ts
</details>

## 7. Architectural Reasoning
### Q4 Extension Points
- **src/vs/editor/common/languages.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 18 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 15 architectural clusters.
- **extensions/copilot/src/extension/prompts/node/test/fixtures/tempo-actions.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 249 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 132 architectural clusters.
- **src/vs/sessions/contrib/layout/browser/baseSessionLayoutController.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/prompts/node/base/promptElement.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 156 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 32 architectural clusters.
- **extensions/copilot/src/extension/completions-core/vscode-node/prompt/src/error.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 86 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 75 architectural clusters.
- **extensions/copilot/src/extension/completions-core/vscode-node/prompt/src/tokenization/tokenizer.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/platform/diff/common/diffService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/prompts/node/test/fixtures/tempo-actions.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 249 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 132 architectural clusters.
- **AGGREGATE_unknown** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 17 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 14 architectural clusters.
- **extensions/git/src/ipc/ipcClient.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/platform/log/common/log.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 14 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 10 architectural clusters.
- **extensions/copilot/src/extension/trajectory/vscode-node/otelChatDebugLogProvider.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 97 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 78 architectural clusters.
- **src/vs/base/browser/ui/list/list.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 71 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 42 architectural clusters.
- **src/vs/base/browser/ui/list/listWidget.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 36 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 23 architectural clusters.
- **src/vs/workbench/contrib/mcp/common/mcpGatewayService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/completions-core/vscode-node/extension/src/panelShared/languages/javaScriptReact.tmLanguage.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 10 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 9 architectural clusters.
- **src/vs/platform/extensionManagement/common/extensionsScannerService.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/workbench/api/common/extHostConsoleForwarder.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/vscode-colorize-perf-tests/test/colorize-fixtures/test-treeView.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 22 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 20 architectural clusters.
- **src/vs/base/browser/ui/tree/asyncDataTree.ts** (Confidence: 1.00)
  - - 9 implementations
  - - [EXTENSION_DENSITY] Has 9 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 6 architectural clusters.
- **extensions/copilot/test/base/cache.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/intents/node/toolCallingLoop.ts** (Confidence: 1.00)
  - - 9 implementations
  - - [EXTENSION_DENSITY] Has 9 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/base/common/equals.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **extensions/copilot/src/extension/chatSessions/copilotcli/node/test/missionControlApiClient.spec.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/workbench/common/editor/editorModel.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 15 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 12 architectural clusters.
- **src/vs/platform/agentHost/common/agentHostChangesetOperationService.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vscode-dts/vscode.d.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 22 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 16 architectural clusters.
- **src/vs/base/browser/ui/tree/tree.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 51 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 38 architectural clusters.
- **src/vs/workbench/common/editor/editorInput.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 37 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 29 architectural clusters.
- **src/vs/workbench/contrib/chat/common/chatSessionsService.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/platform/accessibility/browser/accessibleViewRegistry.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 29 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 22 architectural clusters.
- **extensions/copilot/src/extension/tools/common/toolsRegistry.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 27 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/platform/agentHost/common/agentService.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 6 architectural clusters.
- **src/vs/platform/telemetry/common/telemetry.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 18 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 11 architectural clusters.
- **src/vs/platform/action/common/action.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 31 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 26 architectural clusters.
- **src/vs/workbench/contrib/extensions/browser/abstractRuntimeExtensionsEditor.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/test/testExecutor.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **extensions/copilot/src/platform/networking/common/networking.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 11 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 8 architectural clusters.
- **src/vs/platform/theme/common/themeService.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 18 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 13 architectural clusters.
- **extensions/copilot/src/extension/trajectory/vscode-node/otelChatDebugLogProvider.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 97 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 78 architectural clusters.
- **HTMLElement>** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/workbench/api/common/extHostExtensionService.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/platform/quickinput/browser/pickerQuickAccess.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 18 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 14 architectural clusters.
- **extensions/copilot/src/platform/endpoint/node/chatEndpoint.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 10 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/workbench/contrib/chat/browser/chat.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **extensions/copilot/test/scenarios/test-explain/foo.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **BaseWorkbenchMcpManagementService** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/editor/browser/editorExtensions.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 18 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 18 architectural clusters.
- **extensions/git/src/ipc/ipcServer.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **extensions/copilot/src/extension/completions-core/vscode-node/lib/src/progress.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/editor/common/editorAction.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 52 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 46 architectural clusters.
- **src/vs/base/browser/ui/list/list.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 71 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 42 architectural clusters.
- **src/vs/workbench/common/editor.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 37 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 30 architectural clusters.
- **src/vs/workbench/common/dialogs.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **eslint.Rule.RuleModule** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 44 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/services/userData/browser/userDataInit.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/util/common/diff.ts** (Confidence: 1.00)
  - - 7 implementations
  - - [EXTENSION_DENSITY] Has 7 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 6 architectural clusters.
- **src/vs/base/browser/ui/tree/objectTree.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 18 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 11 architectural clusters.
- **src/vs/workbench/contrib/notebook/browser/diff/diffComponents.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/platform/agentHost/common/agentPluginManager.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/contrib/debug/common/debug.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 13 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **extensions/copilot/src/extension/prompts/node/agent/defaultAgentInstructions.tsx** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/base/browser/ui/tree/tree.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 51 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 38 architectural clusters.
- **src/vs/platform/agentHost/common/agentHostGitStateService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/base/test/common/mock.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 48 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 21 architectural clusters.
- **src/vs/platform/telemetry/common/errorTelemetry.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/base/test/common/mock.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 48 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 21 architectural clusters.
- **src/vs/base/parts/ipc/test/browser/ipc.mp.test.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/browser/parts/editor/editorPane.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 33 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 28 architectural clusters.
- **src/vs/workbench/browser/parts/views/viewPane.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 43 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 24 architectural clusters.
- **extensions/copilot/src/extension/prompts/node/test/fixtures/codeEditorWidget.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **extensions/copilot/src/extension/typescriptContext/serverPlugin/src/common/contextProvider.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
- **src/vs/base/browser/ui/actionbar/actionViewItems.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 59 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 42 architectural clusters.
- **src/vs/workbench/services/configuration/common/configuration.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/typescript-language-features/src/tsServer/versionManager.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/workbench/services/textfile/browser/textFileService.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/workbench/services/workspaces/browser/abstractWorkspaceEditingService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/chatSessions/copilotcli/node/test/copilotCliSessionService.spec.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/workbench/browser/parts/editor/editorPane.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 33 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 28 architectural clusters.
- **IActionsColumnTemplateData>** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/editor/common/services/treeSitter/treeSitterLibraryService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/common/contributions.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/platform/secrets/test/common/secrets.test.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/editor/common/model/tokens/abstractSyntaxTokenBackend.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/prompt/node/intents.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 28 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 7 architectural clusters.
- **extensions/copilot/src/platform/telemetry/common/nullTelemetryService.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 11 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 8 architectural clusters.
- **extensions/copilot/src/platform/workspace/common/workspaceService.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/editor/contrib/codeAction/test/browser/codeActionModel.test.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 6 architectural clusters.
- **extensions/copilot/src/platform/ignore/node/test/mockAuthenticationService.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/base/browser/ui/actionbar/actionViewItems.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 59 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 42 architectural clusters.
- **cli/src/util/command.rs** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 31 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/workbench/browser/parts/paneCompositePart.ts** (Confidence: 1.00)
  - - 8 implementations
  - - [EXTENSION_DENSITY] Has 8 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 6 architectural clusters.
- **src/vs/workbench/contrib/git/common/gitService.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **extensions/copilot/src/extension/agents/vscode-node/githubOrgChatResourcesService.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 14 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 11 architectural clusters.
- **extensions/copilot/src/platform/test/node/testWorkspaceService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/editor/contrib/quickAccess/browser/gotoLineQuickAccess.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/editor/standalone/browser/standaloneServices.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/editor/contrib/snippet/browser/snippetParser.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **extensions/copilot/src/extension/byok/vscode-node/abstractLanguageModelChatProvider.ts** (Confidence: 1.00)
  - - 8 implementations
  - - [EXTENSION_DENSITY] Has 8 implementations.
- **extensions/copilot/test/simulation/diagnosticProviders/utils.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
- **src/vs/base/browser/ui/dropdown/dropdownActionViewItem.ts** (Confidence: 1.00)
  - - 9 implementations
  - - [EXTENSION_DENSITY] Has 9 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 8 architectural clusters.
- **src/vs/workbench/browser/parts/views/viewPane.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 43 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 24 architectural clusters.
- **src/vs/base/browser/ui/list/list.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 71 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 42 architectural clusters.
- **src/vs/base/browser/ui/actionbar/actionViewItems.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 59 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 42 architectural clusters.
- **src/vs/editor/browser/editorBrowser.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 14 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 12 architectural clusters.
- **extensions/copilot/src/extension/completions-core/vscode-node/lib/src/textDocument.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/platform/telemetry/common/1dsAppender.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/editor/common/viewEventHandler.ts** (Confidence: 1.00)
  - - 7 implementations
  - - [EXTENSION_DENSITY] Has 7 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 6 architectural clusters.
- **src/vs/editor/browser/view/viewLayer.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **extensions/copilot/src/platform/chat/common/chatHookService.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/platform/action/common/action.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 31 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 26 architectural clusters.
- **src/vs/workbench/contrib/workspace/common/workspace.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **extensions/copilot/src/extension/prompts/node/agent/promptRegistry.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 18 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/contrib/terminalContrib/suggest/browser/terminal.suggest.contribution.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 19 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 16 architectural clusters.
- **src/vs/platform/environment/common/environment.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/actions/browser/menuEntryActionViewItem.ts** (Confidence: 1.00)
  - - 9 implementations
  - - [EXTENSION_DENSITY] Has 9 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 9 architectural clusters.
- **src/vs/workbench/contrib/localization/common/localization.contribution.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/editor/standalone/common/standaloneTheme.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/keybinding/common/baseResolvedKeybinding.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/services/lifecycle/common/lifecycle.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 16 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 10 architectural clusters.
- **extensions/media-preview/src/mediaPreview.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/base/browser/ui/widget.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 24 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 18 architectural clusters.
- **src/vs/platform/theme/common/themeService.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 18 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 13 architectural clusters.
- **src/vs/editor/common/services/textResourceConfiguration.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/platform/storage/common/storage.ts** (Confidence: 1.00)
  - - 7 implementations
  - - [EXTENSION_DENSITY] Has 7 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 7 architectural clusters.
- **src/vs/base/parts/ipc/common/ipc.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 29 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 22 architectural clusters.
- **extensions/copilot/src/extension/agents/vscode-node/githubOrgChatResourcesService.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 14 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 11 architectural clusters.
- **src/vs/platform/windows/electron-main/windowImpl.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/editor/common/editorCommon.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 47 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 38 architectural clusters.
- **src/vs/workbench/services/extensions/common/abstractExtensionService.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **extensions/copilot/test/simulation/workbench/stores/storage.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/services/userDataProfile/common/userDataProfile.ts** (Confidence: 1.00)
  - - 9 implementations
  - - [EXTENSION_DENSITY] Has 9 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **FilterData>** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/platform/tabs/common/tabsAndEditorsService.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/editor/contrib/zoneWidget/browser/zoneWidget.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **Ghost Dependency (extensions/copilot/src/extension/completions-core/vscode-node/lib/src/ghostText/test/statementTree.test.ts)** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts** (Confidence: 1.00)
  - - 7 implementations
  - - [EXTENSION_DENSITY] Has 7 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 7 architectural clusters.
- **src/vs/base/common/filters.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 25 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 18 architectural clusters.
- **src/vs/workbench/services/lifecycle/common/lifecycle.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 16 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 10 architectural clusters.
- **src/vs/workbench/browser/parts/editor/textCodeEditor.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **extensions/copilot/src/platform/github/common/githubService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/agentHost/node/agentHostTelemetryService.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/platform/label/common/label.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **extensions/copilot/src/platform/inlineEdits/common/observableWorkspace.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **extensions/copilot/src/util/common/chatResponseStreamImpl.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/platform/meteredConnection/common/meteredConnection.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/sessions/browser/parts/editorPart.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/chatSessions/copilotcli/node/test/copilotcliPromptResolver.spec.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/editor/browser/view/viewPart.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 17 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 17 architectural clusters.
- **src/vs/platform/accessibility/browser/accessibleViewRegistry.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 29 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 22 architectural clusters.
- **src/vs/workbench/contrib/chat/browser/widget/input/chatInputPickerActionItem.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/common/views.ts** (Confidence: 1.00)
  - - 8 implementations
  - - [EXTENSION_DENSITY] Has 8 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 7 architectural clusters.
- **src/vs/workbench/contrib/terminal/common/basePty.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/list/browser/listService.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 17 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 16 architectural clusters.
- **extensions/copilot/src/extension/chatSessions/claude/common/claudeToolPermission.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/workbench/services/textfile/common/textfiles.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/workbench/contrib/browserView/electron-browser/browserEditor.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 15 implementations.
- **extensions/copilot/src/extension/tools/common/virtualTools/toolEmbeddingsComputer.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/agents/node/adapters/types.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **extensions/copilot/src/extension/chatSessions/claude/vscode-node/slashCommands/claudeSlashCommandRegistry.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/base/browser/ui/tree/tree.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 51 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 38 architectural clusters.
- **extensions/copilot/src/util/common/diff.ts** (Confidence: 1.00)
  - - 7 implementations
  - - [EXTENSION_DENSITY] Has 7 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 6 architectural clusters.
- **src/vs/workbench/contrib/terminal/browser/baseTerminalBackend.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/chatSessions/vscode-node/test/copilotCLIChatSessionParticipant.spec.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/event.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/workbench/contrib/tasks/browser/abstractTaskService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **AGGREGATE_unknown** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 17 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 14 architectural clusters.
- **src/vs/workbench/contrib/browserView/electron-browser/tools/clickBrowserTool.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 24 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 8 architectural clusters.
- **src/vs/workbench/contrib/notebook/browser/controller/coreActions.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 10 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 7 architectural clusters.
- **src/vs/workbench/services/localization/common/locale.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/platform/requestLogger/node/requestLogger.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/editor/contrib/hover/browser/markdownHoverParticipant.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/editor/common/editorCommon.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 47 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 38 architectural clusters.
- **extensions/copilot/src/extension/completions-core/vscode-node/lib/src/language/languages.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/workbench/contrib/browserView/electron-browser/tools/clickBrowserTool.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 24 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 8 architectural clusters.
- **extensions/copilot/src/extension/chatSessions/common/folderRepositoryManager.ts** (Confidence: 1.00)
  - - 7 implementations
  - - [EXTENSION_DENSITY] Has 7 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 6 architectural clusters.
- **extensions/copilot/src/extension/chatSessions/common/agentSessionsWorkspace.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/undoRedo/common/undoRedo.ts** (Confidence: 1.00)
  - - 7 implementations
  - - [EXTENSION_DENSITY] Has 7 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 6 architectural clusters.
- **src/vs/platform/extensionManagement/common/abstractExtensionManagementService.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/platform/tunnel/node/tunnelProxy.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/services/configuration/common/jsonEditing.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/terminal/common/capabilities/capabilities.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/platform/files/common/inMemoryFilesystemProvider.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/platform/configuration/common/configurationService.ts** (Confidence: 1.00)
  - - 7 implementations
  - - [EXTENSION_DENSITY] Has 7 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 7 architectural clusters.
- **src/vs/workbench/services/userDataSync/common/userDataSync.ts** (Confidence: 1.00)
  - - 8 implementations
  - - [EXTENSION_DENSITY] Has 8 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 7 architectural clusters.
- **src/vs/platform/agentHost/common/sessionDataService.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **extensions/copilot/src/extension/typescriptContext/serverPlugin/fixtures/context/testbed/src/person.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/completions-core/vscode-node/prompt/src/components/components.ts** (Confidence: 1.00)
  - - 8 implementations
  - - [EXTENSION_DENSITY] Has 8 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 7 architectural clusters.
- **src/vs/workbench/services/lifecycle/common/lifecycleService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/typescript-language-features/src/tsServer/server.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/sessions/contrib/github/common/types.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/editor/browser/editorExtensions.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 18 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 18 architectural clusters.
- **src/vs/base/browser/ui/list/list.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 71 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 42 architectural clusters.
- **src/vs/editor/common/diff/documentDiffProvider.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/sessions/contrib/chat/browser/sessionTaskRunner.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/browser/parts/views/viewPaneContainer.ts** (Confidence: 1.00)
  - - 7 implementations
  - - [EXTENSION_DENSITY] Has 7 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 7 architectural clusters.
- **extensions/copilot/src/extension/chatSessions/claude/common/claudeAgentSdkLoaderService.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/services/workingCopy/electron-browser/workingCopyBackupService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/contextview/browser/contextView.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/platform/chunking/common/chunkingEndpointClient.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/base/common/parsers.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/typescriptContext/serverPlugin/fixtures/context/p9/source/f1.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/base/browser/ui/widget.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 24 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 18 architectural clusters.
- **src/vs/editor/common/languages.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 18 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 15 architectural clusters.
- **src/vs/workbench/services/extensionRecommendations/common/extensionRecommendations.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 10 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/editor/browser/editorBrowser.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 14 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 12 architectural clusters.
- **extensions/copilot/src/platform/testing/common/testLogService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/contrib/debug/browser/debugSession.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/sessions/contrib/providers/agentHost/browser/agentHostModePicker.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/test/simulation/fixtures/codeMapper/extHostExtensionActivator.test.ts** (Confidence: 1.00)
  - - 8 implementations
  - - [EXTENSION_DENSITY] Has 8 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/workbench/common/editor/editorModel.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 15 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 12 architectural clusters.
- **extensions/vscode-colorize-perf-tests/test/colorize-fixtures/test-treeView.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 22 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 20 architectural clusters.
- **extensions/copilot/test/simulation/fixtures/doc/issue-6406/debugModel.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/workbench/common/editor/resourceEditorInput.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/editor/common/services/resolverService.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 14 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 14 architectural clusters.
- **src/vs/platform/list/browser/listService.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 17 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 16 architectural clusters.
- **extensions/copilot/src/platform/chat/common/sessionTranscriptService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/sessions/browser/parts/sessionHeaderMetaActionViewItem.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/workbench/contrib/notebook/browser/controller/coreActions.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 10 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 7 architectural clusters.
- **src/vs/base/browser/ui/list/listWidget.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 36 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 23 architectural clusters.
- **extensions/copilot/src/platform/requestLogger/common/requestLogger.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/contrib/terminalContrib/links/browser/links.ts** (Confidence: 1.00)
  - - 7 implementations
  - - [EXTENSION_DENSITY] Has 7 implementations.
- **extensions/copilot/src/extension/completions-core/vscode-node/prompt/src/error.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 86 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 75 architectural clusters.
- **src/vs/base/browser/ui/list/list.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 71 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 42 architectural clusters.
- **src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatToolInvocationSubPart.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 11 implementations.
- **extensions/copilot/src/platform/editing/common/abstractText.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **extensions/copilot/src/extension/byok/node/openAIEndpoint.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/userDataSync/common/abstractSynchronizer.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 12 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **extensions/copilot/src/extension/completions-core/vscode-node/lib/src/networkingTypes.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/base/common/observableInternal/base.ts** (Confidence: 1.00)
  - - 7 implementations
  - - [EXTENSION_DENSITY] Has 7 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 7 architectural clusters.
- **src/vs/workbench/contrib/splash/browser/splash.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/browser/parts/views/viewPane.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 43 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 24 architectural clusters.
- **src/vs/editor/common/services/resolverService.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 14 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 14 architectural clusters.
- **src/vs/base/browser/ui/actionbar/actionbar.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/test/simulation/fixtures/codeMapper/extHostExtensionActivator.test.ts** (Confidence: 1.00)
  - - 8 implementations
  - - [EXTENSION_DENSITY] Has 8 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **extensions/copilot/src/extension/linkify/common/linkifyService.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/abstractToolConfirmationSubPart.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
- **extensions/terminal-suggest/src/completions/copilot.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/platform/agentHost/common/state/protocol/common/actions.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/sessions/contrib/chat/browser/sessionTypePicker.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/configuration/test/common/testConfigurationService.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/base/browser/ui/actionbar/actionViewItems.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 59 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 42 architectural clusters.
- **src/vs/platform/agentHost/common/agentServerTools.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/chatSessions/copilotcli/node/userInputHelpers.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/workbench/contrib/mcp/common/discovery/nativeMcpDiscoveryAbstract.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/chatSessions/copilotcli/node/copilotCli.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/base/common/worker/webWorker.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 6 architectural clusters.
- **src/vs/platform/telemetry/common/telemetryService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/base/browser/ui/table/table.ts** (Confidence: 1.00)
  - - 7 implementations
  - - [EXTENSION_DENSITY] Has 7 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 7 architectural clusters.
- **src/vs/workbench/services/dialogs/common/dialogService.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/workbench/contrib/debug/common/abstractDebugAdapter.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/workbench/contrib/notebook/common/notebookService.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/workbench/services/workingCopy/common/storedFileWorkingCopy.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/services/search/common/searchService.ts** (Confidence: 1.00)
  - - 7 implementations
  - - [EXTENSION_DENSITY] Has 7 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 6 architectural clusters.
- **src/vs/workbench/services/environment/common/environmentService.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/base/browser/ui/dropdown/dropdownActionViewItem.ts** (Confidence: 1.00)
  - - 9 implementations
  - - [EXTENSION_DENSITY] Has 9 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 8 architectural clusters.
- **extensions/copilot/src/lib/node/chatLibMain.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/workbench/common/editor/textResourceEditorInput.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/workbench/common/editor.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 37 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 30 architectural clusters.
- **extensions/copilot/src/platform/filesystem/common/fileSystemService.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 6 architectural clusters.
- **extensions/copilot/src/lib/vscode-node/test/nesProvider.spec.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/sessions/services/sessions/common/session.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/sandbox/common/sandboxHelperService.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/workbench/contrib/notebook/browser/view/cellPart.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 17 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/platform/telemetry/node/baseExperimentationService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/common/editor.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 37 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 30 architectural clusters.
- **extensions/copilot/src/extension/chatSessions/copilotcli/node/logger.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **extensions/copilot/src/extension/agents/node/langModelServer.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/workbench/contrib/codeEditor/browser/find/simpleFindWidget.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **extensions/copilot/src/platform/endpoint/common/endpointProvider.ts** (Confidence: 1.00)
  - - 8 implementations
  - - [EXTENSION_DENSITY] Has 8 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 8 architectural clusters.
- **extensions/copilot/src/platform/workbench/common/workbenchService.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/platform/extensionManagement/common/extensionsProfileScannerService.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/editor/contrib/peekView/browser/peekView.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 6 architectural clusters.
- **src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatCollapsibleContentPart.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/platform/scopeSelection/common/scopeSelection.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/base/browser/ui/toggle/toggle.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/browser/parts/views/viewPane.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 43 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 24 architectural clusters.
- **extensions/copilot/src/platform/chat/common/chatAgents.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/platform/list/browser/listService.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 17 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 16 architectural clusters.
- **src/vs/platform/quickinput/browser/pickerQuickAccess.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 18 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 14 architectural clusters.
- **src/vs/platform/agentHost/common/state/protocol/common/errors.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/workbench/contrib/multiDiffEditor/browser/multiDiffSourceResolverService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/editor/browser/widget/diffEditor/diffEditorWidget.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/inlineEdits/node/nextEditProviderTelemetry.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/chatSessions/claude/common/claudeMessageDispatch.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/typescript-language-features/src/configuration/configuration.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/agentHost/common/agentHostChangesetService.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
- **src/vs/workbench/api/test/browser/mainThreadDocumentsAndEditors.test.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/base/browser/dom.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/actions/browser/actionViewItemService.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/platform/chat/common/chatMLFetcher.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/editor/common/editorAction.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 52 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 46 architectural clusters.
- **src/vs/workbench/browser/parts/titlebar/titlebarActions.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/sessions/contrib/providers/agentHost/browser/baseAgentHostSessionsProvider.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/remote/common/managedSocket.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/userDataSync/common/extensionsSync.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/editor/contrib/peekView/browser/peekView.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 6 architectural clusters.
- **extensions/copilot/src/extension/tools/common/toolsService.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **extensions/copilot/src/extension/completions-core/vscode-node/lib/src/completionNotifier.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/editor/contrib/zoneWidget/browser/zoneWidget.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/platform/actions/browser/menuEntryActionViewItem.ts** (Confidence: 1.00)
  - - 9 implementations
  - - [EXTENSION_DENSITY] Has 9 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 9 architectural clusters.
- **src/vs/platform/tunnel/common/tunnel.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **extensions/copilot/src/platform/languages/common/languageFeaturesService.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/editor/contrib/hover/browser/hoverTypes.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/editor/browser/controller/editContext/editContext.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/platform/telemetry/common/telemetryData.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/contrib/chat/browser/attachments/chatContextPickService.ts** (Confidence: 1.00)
  - - 7 implementations
  - - [EXTENSION_DENSITY] Has 7 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 7 architectural clusters.
- **src/vs/base/browser/ui/tree/objectTree.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 18 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 11 architectural clusters.
- **src/vs/platform/terminal/common/capabilities/commandDetectionCapability.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/configuration-editing/src/settingsDocumentHelper.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/util/common/test/shims/textEditor.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **test/automation/src/viewlet.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
- **src/vs/base/browser/ui/list/listPaging.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/workbench/services/remote/common/abstractRemoteAgentService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/test/codeMapper/codeMapper.stest.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/base/browser/ui/tree/tree.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 51 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 38 architectural clusters.
- **FuzzyScore>** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/commands/node/commandService.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/workbench/common/views.ts** (Confidence: 1.00)
  - - 8 implementations
  - - [EXTENSION_DENSITY] Has 8 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 7 architectural clusters.
- **EventTarget** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/common/memento.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/contrib/search/browser/searchTreeModel/fileMatch.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/editor/browser/widget/multiDiffEditor/workbenchUIElementFactory.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/editor/common/config/fontInfo.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/agentHost/common/agentHostGitService.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/base/browser/ui/tree/tree.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 51 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 38 architectural clusters.
- **IErrorTemplateData>** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/contrib/chat/browser/defaultModelContribution.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/editor/common/model.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/platform/actions/browser/actionWidgetDropdownActionViewItem.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/platform/tunnel/common/tunnel.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/platform/agentHost/test/node/agentHostFileMonitorService.test.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/sessions/contrib/chat/browser/sessionWorkspacePicker.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/contrib/terminalContrib/suggest/browser/terminal.suggest.contribution.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 19 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 16 architectural clusters.
- **src/vs/base/browser/ui/tree/tree.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 51 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 38 architectural clusters.
- **src/vs/workbench/services/notification/common/notificationService.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **extensions/copilot/src/platform/chat/common/chatSessionService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/log/common/logService.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/workbench/common/editor/editorInput.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 37 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 29 architectural clusters.
- **extensions/php-language-features/src/features/hoverProvider.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/platform/files/node/watcher/baseWatcher.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/api/common/extHostExtensionActivator.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/services/search/common/searchService.ts** (Confidence: 1.00)
  - - 7 implementations
  - - [EXTENSION_DENSITY] Has 7 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 6 architectural clusters.
- **src/vs/workbench/services/extensionManagement/common/extensionManagementChannelClient.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/secrets/common/secrets.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/services/configurationResolver/common/variableResolver.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **extensions/copilot/src/extension/prompts/node/test/fixtures/tempo-actions.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 249 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 132 architectural clusters.
- **src/vs/workbench/services/decorations/common/decorations.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/base/common/filters.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 25 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 18 architectural clusters.
- **extensions/copilot/src/platform/inlineCompletions/common/api.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/workbench/common/views.ts** (Confidence: 1.00)
  - - 8 implementations
  - - [EXTENSION_DENSITY] Has 8 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 7 architectural clusters.
- **extensions/copilot/src/extension/typescriptContext/vscode-node/inspector.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/editor/common/core/characterClassifier.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/base/browser/ui/dropdown/dropdownActionViewItem.ts** (Confidence: 1.00)
  - - 9 implementations
  - - [EXTENSION_DENSITY] Has 9 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 8 architectural clusters.
- **src/vs/editor/contrib/colorPicker/browser/colorPickerParticipantUtils.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/completions-core/vscode-node/extension/src/panelShared/languages/javaScriptReact.tmLanguage.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 10 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 9 architectural clusters.
- **src/vs/editor/browser/services/bulkEditService.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/contextkey/common/contextkey.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **SpanExporter** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/services/integrity/common/integrity.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/keybinding/common/abstractKeybindingService.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **extensions/media-preview/src/ownedStatusBarEntry.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **IExperimentationFilterProvider** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/contrib/debug/common/debug.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 13 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/platform/agentHost/common/agentHostFileSystemProvider.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/browser/parts/views/viewPaneContainer.ts** (Confidence: 1.00)
  - - 7 implementations
  - - [EXTENSION_DENSITY] Has 7 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 7 architectural clusters.
- **src/vs/workbench/services/extensions/common/extensionHostKind.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/windows/electron-main/windowImpl.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/platform/request/common/request.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/platform/userDataProfile/common/userDataProfileStorageService.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/editor/common/services/textResourceConfiguration.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/runInTerminalTool.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/files/node/diskFileSystemProviderServer.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/editor/browser/view/dynamicViewOverlay.ts** (Confidence: 1.00)
  - - 8 implementations
  - - [EXTENSION_DENSITY] Has 8 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 8 architectural clusters.
- **extensions/copilot/src/extension/githubPullRequest.d.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/typescript-language-features/src/tsServer/versionProvider.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/encryption/common/encryptionService.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/platform/sign/common/abstractSignService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/platform/languages/common/languageDiagnosticsService.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/workbench/browser/parts/titlebar/titlebarActions.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **extensions/copilot/src/extension/chatSessions/copilotcli/node/copilotCliBridgeSpanProcessor.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **extensions/copilot/src/extension/prompts/node/test/adjustSelection.spec.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/contrib/terminal/common/environmentVariable.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/files/common/inMemoryFilesystemProvider.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/base/common/range.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **ITreeItem>** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **ExplorerItem>** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/references-view/src/references-view.d.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/platform/files/common/watcher.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/platform/backup/electron-main/backup.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/contrib/snippets/browser/snippets.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/platform/testing/common/workspaceMutationManager.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/base/common/observableInternal/logging/logging.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **BaseWorkspace** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/extensionManagement/common/extensionGalleryManifestService.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/base/browser/ui/tree/tree.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 51 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 38 architectural clusters.
- **src/vs/base/browser/ui/grid/grid.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/workbench/services/files/common/elevatedFileService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/services/extensionRecommendations/common/extensionRecommendations.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 10 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/workbench/browser/part.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 10 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 8 architectural clusters.
- **src/vs/base/common/fuzzyScorer.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/editor/common/languages/language.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/contrib/notebook/common/notebookKernelService.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/contrib/issue/common/issue.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/contrib/update/common/update.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/services/history/common/history.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **Iterable** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/services/configurationResolver/browser/baseConfigurationResolverService.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/platform/agentHost/common/state/protocol/common/errors.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/workbench/api/common/extHostTypes.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/platform/extensions/common/extensionsService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/request/common/request.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **extensions/copilot/test/simulation/workbench/components/toolbar.tsx** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/api/common/extHostRequireInterceptor.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/browser/web.factory.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/platform/authentication/node/copilotTokenManager.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/services/workingCopy/test/browser/workingCopyEditorService.test.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/editor/browser/editorBrowser.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 14 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 12 architectural clusters.
- **src/vs/platform/agentHost/node/agentSdkDownloader.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/editor/common/services/textModelSync/textModelSync.protocol.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/platform/git/common/gitDiffService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/services/panecomposite/browser/panecomposite.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/platform/notebook/common/alternativeContent.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/chatSessions/copilotcli/common/customSessionTitleService.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **extensions/copilot/src/extension/completions-core/vscode-node/lib/src/prompt/similarFiles/relatedFiles.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/agentHost/node/shared/loopbackProxyServer.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **extensions/copilot/src/platform/inlineEdits/common/statelessNextEditProvider.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/editor/browser/viewParts/glyphMargin/glyphMargin.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **IResourceMarkersTemplateData>** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/services/dialogs/browser/abstractFileDialogService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/contrib/terminal/common/terminal.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/workbench/services/authentication/common/authentication.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **IssueModel** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/prompts/node/base/promptRenderer.ts** (Confidence: 1.00)
  - - 8 implementations
  - - [EXTENSION_DENSITY] Has 8 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/workbench/common/editor/textEditorModel.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/platform/agentHost/node/agentHostCompletions.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/editor/common/services/modelService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/services/languageDetection/common/languageDetectionWorkerService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/services/search/common/search.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **test/automation/src/terminal.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/common/editor/textResourceEditorInput.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/base/common/observableInternal/set.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/webWorker/browser/webWorkerService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/base/browser/ui/table/table.ts** (Confidence: 1.00)
  - - 7 implementations
  - - [EXTENSION_DENSITY] Has 7 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 7 architectural clusters.
- **extensions/copilot/src/platform/testing/common/testProvider.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/platform/filesystem/node/test/mockFileSystemService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/platform/ignore/common/ignoreService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/editor/common/modelLineProjectionData.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/chatSessions/vscode-node/copilotCloudSessionContentBuilder.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/workbench/services/path/common/pathService.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/workbench/contrib/chat/common/chatSessionsService.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **extensions/copilot/src/platform/authentication/common/copilotTokenManager.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/platform/git/common/gitExtensionService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/editor/common/model.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/workbench/contrib/chat/common/plugins/pluginGitCommandService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/list/browser/listService.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 17 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 16 architectural clusters.
- **extensions/copilot/src/extension/chatSessions/copilotcli/vscode-node/test/askUserQuestionHandler.spec.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/instantiation/common/instantiation.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/browser/parts/editor/editorWithViewState.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/base/browser/ui/list/list.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 71 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 42 architectural clusters.
- **extensions/copilot/src/extension/inlineEdits/test/node/nextEditProviderTelemetry.spec.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/platform/git/vscode/git.d.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/platform/files/common/fileService.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/workbench/contrib/chat/common/enablement.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **extensions/copilot/src/platform/review/common/reviewService.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/platform/list/browser/listService.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 17 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 16 architectural clusters.
- **src/vs/base/browser/ui/menu/menubar.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/extensionResourceLoader/common/extensionResourceLoader.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/editor/common/diff/linesDiffComputer.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/editor/contrib/wordOperations/browser/wordOperations.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/inlineEdits/node/nextEditProvider.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/platform/remoteSearch/common/codeOrDocsSearchClient.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/code/node/cliProcessMain.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/services/editor/test/browser/editorGroupsService.test.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/files/common/diskFileSystemProvider.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/editor/browser/services/abstractCodeEditorService.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/platform/undoRedo/common/undoRedo.ts** (Confidence: 1.00)
  - - 7 implementations
  - - [EXTENSION_DENSITY] Has 7 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 6 architectural clusters.
- **src/vs/platform/actions/browser/actionWidgetDropdownActionViewItem.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/platform/mcp/common/mcpManagementService.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/workbench/contrib/issue/common/issue.contribution.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/contrib/debug/common/abstractDebugAdapter.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **src/vs/base/common/glob.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/languagePacks/common/languagePacks.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/contrib/notebook/browser/controller/coreActions.ts** (Confidence: 1.00)
  - - 10 implementations
  - - [EXTENSION_DENSITY] Has 10 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 7 architectural clusters.
- **extensions/copilot/src/extension/prompts/node/test/fixtures/5710.summarized.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/commands/node/commandService.ts** (Confidence: 1.00)
  - - 5 implementations
  - - [EXTENSION_DENSITY] Has 5 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 5 architectural clusters.
- **src/vs/workbench/contrib/tags/common/workspaceTags.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/editor/common/model/textModelPart.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/platform/quickinput/common/quickAccess.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **extensions/php-language-features/src/features/completionItemProvider.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **src/vs/workbench/services/path/common/pathService.ts** (Confidence: 1.00)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 4 architectural clusters.
- **extensions/copilot/src/platform/configuration/test/common/inMemoryConfigurationService.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/browser/parts/paneCompositePart.ts** (Confidence: 1.00)
  - - 8 implementations
  - - [EXTENSION_DENSITY] Has 8 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 6 architectural clusters.
- **src/vs/platform/workspaces/common/workspaces.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/sessions/contrib/providers/agentHost/browser/agentHostModelPicker.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/microsoft-authentication/src/common/publicClientCache.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/prompt/vscode-node/endpointProviderImpl.ts** (Confidence: 1.00)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 3 architectural clusters.
- **extensions/copilot/test/simulation/fixtures/codeMapper/quickInput.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/base/common/worker/webWorker.ts** (Confidence: 1.00)
  - - 6 implementations
  - - [EXTENSION_DENSITY] Has 6 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 6 architectural clusters.
- **IFileTemplateData>** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **extensions/copilot/src/extension/typescriptContext/serverPlugin/fixtures/context/testbed/src/events.ts** (Confidence: 1.00)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
  - - [CROSS_CLUSTER_DENSITY] Implementors span across 2 architectural clusters.
- **src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/commandLinePresenter/commandLinePresenter.ts** (Confidence: 0.90)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
- **extensions/copilot/src/extension/tools/common/virtualTools/virtualToolTypes.ts** (Confidence: 0.90)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
- **src/vs/workbench/contrib/snippets/browser/commands/abstractSnippetsActions.ts** (Confidence: 0.90)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
- **src/vs/workbench/contrib/debug/browser/baseDebugView.ts** (Confidence: 0.90)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
- **src/vs/platform/update/electron-main/abstractUpdateService.ts** (Confidence: 0.90)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
- **src/vs/workbench/contrib/snippets/browser/commands/abstractSnippetsActions.ts** (Confidence: 0.90)
  - - 4 implementations
  - - [EXTENSION_DENSITY] Has 4 implementations.
- **src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingModifiedFileEntry.ts** (Confidence: 0.80)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
- **WarmQuery** (Confidence: 0.80)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
- **src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatIncrementalRendering/buffers/buffer.ts** (Confidence: 0.80)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
- **src/vs/workbench/browser/parts/editor/editorTabsControl.ts** (Confidence: 0.80)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
- **src/vs/workbench/contrib/mergeEditor/browser/view/editors/codeEditorView.ts** (Confidence: 0.80)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
- **extensions/copilot/src/shared-fetch-utils/common/test/fetchedValue.spec.ts** (Confidence: 0.80)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
- **extensions/copilot/src/platform/notebook/common/alternativeContentProvider.ts** (Confidence: 0.80)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
- **extensions/copilot/src/platform/notebook/common/alternativeNotebookDocument.ts** (Confidence: 0.80)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
- **extensions/copilot/src/extension/inlineEdits/vscode-node/features/diagnosticsBasedCompletions/diagnosticsCompletions.ts** (Confidence: 0.80)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
- **src/vs/platform/keyboardLayout/common/keyboardMapper.ts** (Confidence: 0.80)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
- **extensions/typescript-language-features/src/languageFeatures/definitionProviderBase.ts** (Confidence: 0.80)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
- **src/vs/platform/agentHost/node/agentHostTerminalManager.ts** (Confidence: 0.80)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
- **src/vs/platform/agentHost/node/claude/claudeAgentSdkService.ts** (Confidence: 0.80)
  - - 3 implementations
  - - [EXTENSION_DENSITY] Has 3 implementations.
- **extensions/copilot/src/extension/completions-core/vscode-node/lib/src/prompt/completionsPromptFactory/completionsPromptFactory.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **extensions/copilot/src/extension/intents/node/editCodeIntent.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **IAgentSessionSectionTemplate>** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/workbench/services/authentication/browser/authenticationUsageService.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **void>** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/base/browser/ui/scrollbar/abstractScrollbar.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **IAICustomizationItemTemplateData>** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **extensions/ipynb/src/notebookSerializer.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **test/automation/src/logger.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/workbench/contrib/notebook/browser/viewModel/baseCellViewModel.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **extensions/copilot/src/extension/intents/node/agentIntent.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/workbench/browser/parts/compositeBarActions.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/editor/contrib/hover/browser/hoverOperation.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/editor/browser/widget/diffEditor/utils.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/sessions/contrib/providers/agentHost/browser/agentHostSettingsShared.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/editor/browser/gpu/atlas/atlas.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **extensions/copilot/src/platform/authentication/vscode-node/copilotTokenManager.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/editor/common/services/editorWorker.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **extensions/copilot/src/extension/chatSessions/vscode/cloudAgentBackend.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/workbench/api/node/proxyResolver.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **extensions/copilot/src/extension/completions-core/vscode-node/prompt/src/snippetInclusion/selectRelevance.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **extensions/copilot/src/platform/inlineEdits/common/workspaceEditTracker/historyContextProvider.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/platform/download/common/download.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/workbench/contrib/notebook/common/notebookLoggingService.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentCustomizationSyncProvider.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/editor/contrib/folding/browser/folding.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **AsyncGenerator** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **IGroupHeaderTemplateData>** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/editor/common/diff/defaultLinesDiffComputer/algorithms/diffAlgorithm.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/editor/browser/gpu/renderStrategy/baseRenderStrategy.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/platform/userDataSync/common/abstractJsonSynchronizer.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/editor/contrib/quickAccess/browser/editorNavigationQuickAccess.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **ISectionItemTemplateData>** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/platform/agentHost/common/relayTransport.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **extensions/merge-conflict/src/interfaces.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **IAgentSessionShowMoreTemplate>** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/workbench/contrib/chat/browser/widget/input/chatInputNotificationService.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatEditPillElement.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/workbench/contrib/testing/browser/explorerProjections/index.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **src/vs/workbench/contrib/webviewPanel/browser/webviewWorkbenchService.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **extensions/copilot/src/platform/endpoint/node/copilotChatEndpoint.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **extensions/typescript-language-features/src/languageFeatures/codeLens/baseCodeLensProvider.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.
- **extensions/copilot/src/platform/telemetry/test/node/telemetry.spec.ts** (Confidence: 0.70)
  - - 2 implementations
  - - [EXTENSION_DENSITY] Has 2 implementations.

## 6. Raw Metrics
### 6.1 Global Metrics
- **Boundary Ratio**: 83.1%

### 6.2 Source Breakdown (ASR 3.0)
#### Ghost Source Top N
  - N/A

#### Coupling Source Top N
  - **vs**: 25166 (43.8%)
  - **extensions**: 23960 (41.7%)
  - **cli**: 2296 (4%)
  - **.eslint-plugin-local**: 1655 (2.9%)
  - **unknown**: 625 (1.1%)
  - ...