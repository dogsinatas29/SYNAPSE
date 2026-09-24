# VSCode Architectural Ecology Report

## Graph Summary
- Nodes: 26527
- Edges: 102873

## Experiment A: Top Reachability Hubs
1. **src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts** (Impacts: 8745 nodes, Peak Registry: 135)
2. **src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts** (Impacts: 8745 nodes, Peak Registry: 131)
3. **extensions/copilot/src/lib/node/chatLibMain.ts** (Impacts: 8745 nodes, Peak Registry: 114)
4. **src/vs/workbench/contrib/chat/browser/widget/chatListRenderer.ts** (Impacts: 8745 nodes, Peak Registry: 105)
5. **src/vs/workbench/api/common/extHost.protocol.ts** (Impacts: 8745 nodes, Peak Registry: 94)

## Experiment B: Top Bridge Nodes (CrossBoundaryLoad)
1. **extensions/copilot/src/util/vs/base/common/lifecycle.ts** (Boundary Edges: 3341, Ratio: 0.9961)
2. **extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/uri.ts** (Boundary Edges: 2598, Ratio: 0.9908)
3. **extensions/copilot/src/util/vs/platform/instantiation/common/instantiation.ts** (Boundary Edges: 2173, Ratio: 0.9968)
4. **extensions/copilot/src/extension/completions-core/vscode-node/lib/src/util/event.ts** (Boundary Edges: 2003, Ratio: 0.998)
5. **extensions/copilot/src/util/vs/nls.ts** (Boundary Edges: 1793, Ratio: 0.9983)

## Experiment C: Multi-Cause Collapse Victims
1. **.devcontainer/README.md** (Peak Registry: 5, Recovery Steps: 5)
2. **README.md** (Peak Registry: 5, Recovery Steps: 5)
3. **extensions/copilot/CONTRIBUTING.md** (Peak Registry: 5, Recovery Steps: 5)
4. **extensions/copilot/docs/NES_EXPECTED_EDIT_CAPTURE.md** (Peak Registry: 5, Recovery Steps: 5)
5. **extensions/copilot/script/eslintGitBlameReport/generateEslintIgnoreReport.ts** (Peak Registry: 5, Recovery Steps: 5)

## Experiment D: Critical Layer Collapse (vs/platform)
- **Workbench Impact**: 3370
- **Services Impact**: 676
- **ExtensionHost Impact**: 56
- **Max Depth**: 10

## Findings
- Multi-Cause Collapse highlights entirely different nodes than raw Reachability, proving the importance of the Failure Registry.
- The boundary between `vs/platform` and the rest of the application demonstrates high coupling, cascading deeply into the workbench.
