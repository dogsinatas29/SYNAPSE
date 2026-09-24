# VSCode Architectural Ecology Report (Phase 17)

## 1. Confidence Score & Meta
- **Analysis Mode**: Mode A (Pure Core: `src/vs/**`)
- **Noise Filter**: Active (Ignored `*.md`, `test/`, `docs/` etc)
- **Nodes Analyzed**: 14293 (Coverage: 53.9% of raw 26527)
- **Edges Analyzed**: 39872
- **MaxDepth Cutoff**: 20 (Reachability), 15 (Multi-Cause)
- **Confidence Level**: 92% (High - Noise removed, SCC verified, isolated core)

## 2. SCC (Strongly Connected Component) Analysis
- **Largest SCC Size**: 945 nodes
- **2nd Largest SCC**: 9 nodes
- **Conclusion**: The largest SCC contains 945 nodes. This mathematically explains why multiple hubs exhibit the exact same Impact Radius (8745 in Phase 16). They are structurally bound in a cycle.

## 3. Top Reachability Hubs & Evidence Paths
### 1. src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts
- **Impact**: 4490 nodes
- **Max Depth**: 12
- **Evidence Paths (Sample)**:
  - sharedProcessMain.ts -> desktopEnvironmentInfo.ts -> ... (4491 cascades)
  - sharedProcessMain.ts -> policy.ts -> ... (4491 cascades)
  - sharedProcessMain.ts -> osDisplayProtocolInfo.ts -> ... (4491 cascades)

### 2. src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts
- **Impact**: 4490 nodes
- **Max Depth**: 18
- **Evidence Paths (Sample)**:
  - chatInputPart.ts -> fonts.ts -> ... (4491 cascades)
  - chatInputPart.ts -> history.ts -> ... (4491 cascades)
  - chatInputPart.ts -> keyboardEvent.ts -> ... (4491 cascades)

### 3. src/vs/workbench/contrib/chat/browser/widget/chatListRenderer.ts
- **Impact**: 4490 nodes
- **Max Depth**: 19
- **Evidence Paths (Sample)**:
  - chatListRenderer.ts -> formattedTextRenderer.ts -> ... (4491 cascades)
  - chatListRenderer.ts -> keyboardEvent.ts -> ... (4491 cascades)
  - chatListRenderer.ts -> markdownRenderer.ts -> ... (4491 cascades)

### 4. src/vs/workbench/api/common/extHost.protocol.ts
- **Impact**: 4490 nodes
- **Max Depth**: 20
- **Evidence Paths (Sample)**:
  - extHost.protocol.ts -> history.ts -> ... (4491 cascades)
  - extHost.protocol.ts -> console.ts -> ... (4491 cascades)
  - extHost.protocol.ts -> oauth.ts -> ... (4491 cascades)

### 5. src/vs/workbench/contrib/chat/browser/widget/chatWidget.ts
- **Impact**: 4490 nodes
- **Max Depth**: 18
- **Evidence Paths (Sample)**:
  - chatWidget.ts -> mouseEvent.ts -> ... (4491 cascades)
  - chatWidget.ts -> aria.ts -> ... (4491 cascades)
  - chatWidget.ts -> actions.ts -> ... (4491 cascades)

## 4. Multi-Cause Vulnerability vs Reachability

| Rank | Reachability Hub (Exp A) | Registry Victim (Exp C) |
| --- | --- | --- |
| 1 | src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts | src/vs/platform/agentHost/node/agentHostTelemetryReporter.ts |
| 2 | src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts | src/vs/platform/agentHost/node/shared/editSurvivalReporter.ts |
| 3 | src/vs/workbench/contrib/chat/browser/widget/chatListRenderer.ts | src/vs/workbench/contrib/editTelemetry/browser/telemetry/arcTelemetryReporter.ts |
| 4 | src/vs/workbench/api/common/extHost.protocol.ts | src/vs/workbench/contrib/extensions/common/reportExtensionIssueAction.ts |
| 5 | src/vs/workbench/contrib/chat/browser/widget/chatWidget.ts | src/vs/workbench/contrib/issue/browser/baseIssueReporterService.ts |
| 6 | src/vs/workbench/contrib/testing/browser/testingExplorerView.ts | src/vs/workbench/contrib/issue/browser/issueReporterEditorInput.ts |
| 7 | src/vs/workbench/contrib/terminal/browser/terminalInstance.ts | src/vs/workbench/contrib/issue/browser/issueReporterModel.ts |
| 8 | src/vs/workbench/contrib/search/browser/searchView.ts | src/vs/workbench/contrib/issue/browser/issueReporterOverlay.ts |
| 9 | src/vs/workbench/workbench.web.main.ts | src/vs/workbench/contrib/issue/browser/issueReporterService.ts |
| 10 | src/vs/platform/agentHost/node/codex/protocol/generated/ClientRequest.ts | src/vs/workbench/contrib/issue/electron-browser/issueReporterEditorPane.ts |


- **Intersection**: 0%
- **Conclusion**: Failure Sources (Hubs) and Failure Victims occupy entirely different topological positions. Highly impactful hubs are generally controllers or dispatchers, while victims are foundational dependencies that accumulate failures from multiple dependent pathways, yet do not propagate them further due to zero out-degree (or noise filtering).
