# P3: Root-Cause Investigation of "File Exists/Node Missing" Discrepancy
**Status: ✅ PROVEN (Discovery Complete)**

## 1. The Discrepancy
In the previous Chromium run, 4,172 files (including many `ash/session/` nodes like `session_controller_impl.h`) were physically present on disk and processed by the scanner, yet the graph engine (`temp_target_state.json`) mapped them as `ghost` nodes because the `Resolver` returned `targetNodeExists: false`.

## 2. Root Cause Identified
The failure occurs precisely between the scanning phase and the resolution phase. Specifically, in `NodeBuilder.ts`.

### Evidence 1: The `NodeBuilder.ts` Hardcoded Exclusion
When `DataPipeline.ts` invokes `NodeBuilder.build(summaries, projectRoot)`, the `NodeBuilder` iterates over the `CodeSummary` results and builds the final list of valid `nodes` and `nodeIds`. 

In `/src/core/NodeBuilder.ts` (Line 120):
```typescript
const fileName = path.basename(item.filePath, path.extname(item.filePath));
if (item.filePath.includes('.synapse_contexts') || fileName.startsWith('session_')) continue;
```
**Mechanism of Failure**: Any file whose basename starts with `session_` (e.g., `session_controller_impl.h`, `session_manager.cc`) is immediately completely discarded. It is never pushed to the `nodes` array and never added to the `nodeIds` set.

### Evidence 2: The Cascading Effect on the Resolver
In `/src/core/ReferenceResolver.ts` (Line 120):
```typescript
if (!existingNodeIds.has(targetNodeId)) {
    // Falls back to symbol search or marks as 'unresolved'
}
```
Because the `session_*` files were intentionally stripped from `nodeIds` by `NodeBuilder.ts`, the `Resolver` correctly evaluates `existingNodeIds.has("ash/session/session_controller_impl.h")` as `false`. The reference is subsequently labeled as `unresolved`, and the pipeline downgrades the target into a Ghost node.

## 3. Secondary Findings (File Exclusions)
Additionally, in `/src/bootstrap/BootstrapEngine.ts` (Line 567):
```typescript
if (fileName.includes('logic_report') || fileName.includes('synapse')) {
    // [v0.3.34.45] 🚫 Block SYNAPSE generated data from being scanned as source
    continue;
}
```
This is a standard framework protection to avoid recursive data-UI loops, but combined with the `session_` filter, it heavily affects projects using these strings as prefixes.

## 4. Conclusion
The `Resolver` logic itself is functioning exactly as mathematically designed. It failed to resolve the references because the `nodeIds` truth-source was preemptively poisoned/truncated by an overly broad heuristics filter (`fileName.startsWith('session_')`) within `NodeBuilder.ts`. This filter was likely a legacy hack to ignore `session_12345.json` history files, but inadvertently crippled C++ projects that organically use the word "session" in source code files.

**Recommendation for Fix:**
Modify the `session_` filter in `NodeBuilder.ts` to strictly apply only to specific file extensions (e.g., `.json`, `.md`) or rely exclusively on standard `synapse.config.json` blacklist overrides, ensuring source code like `.h` and `.cc` bypasses this artificial block.
