# 🔬 SYNAPSE Architecture Scan Report (EV-LIVE)
Generated: 2026-08-12T08:59:07.058Z

## 0. Analysis Subject (Layer -3)
- **Subject**: Module: src/core
- **Files**: 331
- **Internal Edges**: 151
- **Boundary Edges**: 461

### Subject Fingerprint (Top Internal Domains)
- Module: src/core
- Module: src/core/collaboration
- Module: src
- Module: src/core/analysis/intent
- Module: src/cli

## 1. Executive Summary
**Scan Context**: Sub-cluster Analysis
**Observation**: External Dependency Ratio = 3.1x
**Assessment**: Selected cluster depends heavily on modules outside the scan boundary.
**Implication**: This does not imply whole-project instability.

**Why High External Coupling?**
- **Boundary Edge Count**: 461 / 151 (Internal)
- **Top 3 Contributors**: 상위 3개 파일(BootstrapEngine.ts, standalone.ts, CanvasPanel.ts)이 전체 Boundary Edge의 **14.1%** (65개)를 생성하고 있습니다.

**Cumulative Boundary Contribution**
- **Top 3**: 14.1% (65 edges)
- **Top 10**: 25.2% (116 edges)
- **Top 50**: 47.1% (217 edges)
- **Top 100**: 57.7% (266 edges)

**Audit Confidence**: 80%

Base Score                     70
Grammar Noise Filtered        +0
Assembly Point Classified      +0
Contract Hub Verified          +4
Ghost Ratio < 5%               +6
Unknown References             0
Final Score                   80

### Global Metrics
- **Entropy**: 12
- **Ghost Dependencies**: 82

### Dependency Sources Breakdown
**Ghost Dependencies (Scanner Issues)**
  - N/A

**External Dependencies (Architecture)**
  - N/A


## 2. Impact Files (Architectural Assessment)
### 1. src/bootstrap/BootstrapEngine.ts
- **Role**: COORDINATOR
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/bootstrap/BootstrapEngine.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 24
- Fan-Out: 25
- Blast Radius: 11 Clusters

**Top External Targets (Evidence)**
- src/core/JsTsScanner.ts (1 edges)
- src/core/KotlinScanner.ts (1 edges)
- src/core/graphBuilder.ts (1 edges)
- src/core/CppScanner.ts (1 edges)
- src/core/MarkdownScanner.ts (1 edges)
- src/utils/Logger.ts (1 edges)
- src/core/SnapshotSystem.ts (1 edges)
- src/core/GeminiParser.ts (1 edges)
- src/core/ScannerRegistry.ts (1 edges)
- src/core/RuleEngine.ts (1 edges)

### 2. src/server/standalone.ts
- **Role**: UNKNOWN
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/server/standalone.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 21
- Fan-Out: 21
- Blast Radius: 4 Clusters

**Top External Targets (Evidence)**
- src/core/collaboration/SessionManager.ts (1 edges)
- src/utils/Logger.ts (1 edges)
- src/core/collaboration/MountManager.ts (1 edges)
- src/core/collaboration/IdentityManager.ts (1 edges)
- src/core/SymbolIndex.ts (1 edges)
- src/core/collaboration/ReferenceVerifier.ts (1 edges)
- src/core/FlowScanner.ts (1 edges)
- src/core/collaboration/RestCollaborationTransport.ts (1 edges)
- src/core/collaboration/HarvestSessionManager.ts (1 edges)
- src/core/collaboration/AccountManager.ts (1 edges)

### 3. src/webview/CanvasPanel.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/webview/CanvasPanel.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 20
- Fan-Out: 23
- Blast Radius: 12 Clusters

**Top External Targets (Evidence)**
- src/core/GraphModel.ts (1 edges)
- src/core/SnapshotSystem.ts (1 edges)
- src/core/SynapseIgnore.ts (1 edges)
- src/core/VirtualDebugger.ts (1 edges)
- http (1 edges)
- src/utils/Logger.ts (1 edges)
- src/core/FileScanner.ts (1 edges)
- src/core/GeminiParser.ts (1 edges)
- src/core/LogicAnalyzer.ts (1 edges)
- src/core/EdgeCodeRefactorer.ts (1 edges)

### 4. src/extension.ts
- **Role**: UNKNOWN
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/extension.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 17
- Fan-Out: 21
- Blast Radius: 14 Clusters

**Top External Targets (Evidence)**
- src/core/GeminiParser.ts (1 edges)
- src/core/ReportExporter.ts (1 edges)
- src/core/SymbolIndex.ts (1 edges)
- src/core/ProjectMetadata.ts (1 edges)
- src/core/LogicAnalyzer.ts (1 edges)
- node (1 edges)
- src/core/collaboration/RuntimeInitializer.ts (1 edges)
- src/core/BillingManager.ts (1 edges)
- src/core/AiOrchestrator.ts (1 edges)
- src/core/RuleEngine.ts (1 edges)

### 5. src/core/DataPipeline.ts
- **Role**: DOMAIN_SERVICE
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DataPipeline.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 7
- Fan-Out: 25
- Blast Radius: 14 Clusters

**Top External Targets (Evidence)**
- src/utils/Logger.ts (1 edges)
- src/types/schema.ts (1 edges)
- src/core/canvas-engine/CanvasEngine.ts (1 edges)
- src/core/BoundsDiagnosticReporter.ts (1 edges)
- src/core/LayoutDiagnosticReporter.ts (1 edges)
- src/core/DiagnosticReporter.ts (1 edges)
- crypto (1 edges)

### 6. src/cli/ProjectAnalyzer.ts
- **Role**: UNKNOWN
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/ProjectAnalyzer.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 6
- Fan-Out: 6
- Blast Radius: 13 Clusters

**Top External Targets (Evidence)**
- src/core/analysis/intent/ConfidenceEngine.ts (1 edges)
- src/core/analysis/intent/VSCodeProvider.ts (1 edges)
- src/core/analysis/intent/RegexProvider.ts (1 edges)
- src/core/analysis/intent/ArchitectMapGenerator.ts (1 edges)
- src/core/analysis/intent/EvidenceAggregator.ts (1 edges)
- src/core/analysis/intent/ReasonedReportBundle.ts (1 edges)

### 7. src/core/analysis/reasoning/ReasoningEngine.ts
- **Role**: DOMAIN_SERVICE
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/reasoning/ReasoningEngine.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 6
- Fan-Out: 8
- Blast Radius: 4 Clusters

**Top External Targets (Evidence)**
- src/types/schema.ts (1 edges)
- src/core/analysis/InterventionSimulator.ts (1 edges)
- src/utils/Logger.ts (1 edges)
- src/core/analysis/types.ts (1 edges)
- src/core/analysis/TargetSelector.ts (1 edges)
- src/core/GraphModel.ts (1 edges)

### 8. src/core/canvas-engine/StateManager.ts
- **Role**: DOMAIN_SERVICE
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/StateManager.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 6
- Fan-Out: 6
- Blast Radius: 4 Clusters

**Top External Targets (Evidence)**
- src/core/GraphModel.ts (1 edges)
- src/core/transaction/CommitManager.ts (1 edges)
- src/utils/Logger.ts (1 edges)
- crypto (1 edges)
- src/core/RuleEngine.ts (1 edges)
- src/core/projection/ProjectionLayer.ts (1 edges)

### 9. src/core/VirtualDebugger.ts
- **Role**: DOMAIN_SERVICE
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/VirtualDebugger.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 5
- Fan-Out: 5
- Blast Radius: 13 Clusters

**Top External Targets (Evidence)**
- src/utils/Logger.ts (1 edges)
- src/types/schema.ts (1 edges)
- src/core/validation/ValidationEngine.ts (1 edges)
- src/core/validation/ValidationContext.ts (1 edges)
- src/core/validation/ValidationReportBuilder.ts (1 edges)

### 10. src/core/analysis/reasoning/TarjanSCC.ts
- **Role**: DOMAIN_SERVICE
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/reasoning/TarjanSCC.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 4
- Fan-Out: 4
- Blast Radius: 4 Clusters

**Top External Targets (Evidence)**
- src/core/analysis/types.ts (1 edges)
- src/core/analysis/GraphViewBuilder.ts (1 edges)
- src/types/schema.ts (1 edges)
- src/core/NodeBuilder.ts (1 edges)


## 3. Evidence Layer
### 3.1 Ghost Evidence
<details><summary><b>Show Ghost Evidence (Top 50)</b></summary>

- [src/rust_checker/state_checker.rs](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/rust_checker/state_checker.rs) -> project_state_json (Count: 1)
- [src/utils/hash_utils.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/utils/hash_utils.ts) -> crypto (Count: 1)
- [src/core/collaboration/CompareProjection.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/CompareProjection.ts) -> crypto (Count: 1)
- [src/core/resolvers/TypeScriptResolver.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/resolvers/TypeScriptResolver.ts) -> typescript (Count: 1)
- [src/core/CDPManager.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/CDPManager.ts) -> http (Count: 1)
- [src/utils/hash_utils.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/utils/hash_utils.ts) -> util (Count: 1)
- [src/extension.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/extension.ts) -> node (Count: 1)
- [src/webview/CanvasPanel.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/webview/CanvasPanel.ts) -> http (Count: 1)
- [src/server/standalone.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/server/standalone.ts) -> express (Count: 1)
- [src/core/FileScanner.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/FileScanner.ts) -> Y (Count: 1)
- [src/core/resolvers/TypeScriptResolver.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/resolvers/TypeScriptResolver.ts) -> foo (Count: 1)
- [src/core/benchmark/BenchmarkGraphGenerator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/benchmark/BenchmarkGraphGenerator.ts) -> crypto (Count: 1)
- [src/server/standalone.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/server/standalone.ts) -> cors (Count: 1)
- [src/core/collaboration/HarvestProjection.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/HarvestProjection.ts) -> crypto (Count: 1)
- [src/cli/verify_determinism.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/verify_determinism.ts) -> util (Count: 1)
- [src/core/ProjectMetadata.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ProjectMetadata.ts) -> crypto (Count: 1)
- [src/core/SnapshotSystem.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/SnapshotSystem.ts) -> crypto (Count: 1)
- [src/core/EdgeBuilder.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/EdgeBuilder.ts) -> crypto (Count: 1)
- [src/core/collaboration/SessionManager.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/SessionManager.ts) -> crypto (Count: 1)
- [src/core/DataPipeline.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DataPipeline.ts) -> crypto (Count: 1)
- [src/core/DirectChatScraper.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DirectChatScraper.ts) -> crypto (Count: 1)
- [src/client.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/client.ts) -> node (Count: 1)
- [src/server/server.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/server/server.ts) -> vscode-languageserver-textdocument (Count: 1)
- [src/core/collaboration/CompareEngine.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/CompareEngine.ts) -> crypto (Count: 1)
- [src/core/CDPManager.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/CDPManager.ts) -> net (Count: 1)
- [src/core/collaboration/MountManager.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/MountManager.ts) -> net (Count: 1)
- [src/server/standalone.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/server/standalone.ts) -> crypto (Count: 1)
- [src/core/collaboration/AccountManager.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/AccountManager.ts) -> crypto (Count: 1)
- [src/core/canvas-engine/StateManager.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/StateManager.ts) -> crypto (Count: 1)
- [src/core/collaboration/EdgeGenerator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/EdgeGenerator.ts) -> crypto (Count: 1)
- [src/server/server.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/server/server.ts) -> node (Count: 1)
- [src/core/CDPManager.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/CDPManager.ts) -> crypto (Count: 1)
</details>

### 3.2 Boundary Evidence
<details><summary><b>Show Boundary Evidence (Top 50)</b></summary>

- [test_hygiene.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/test_hygiene.ts) -> src/core/analysis/reasoning/TarjanSCC.ts (Count: 1)
- [src/cli/BatchRunner.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/BatchRunner.ts) -> src/cli/SummaryGenerator.ts (Count: 1)
- [src/core/DataPipeline.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DataPipeline.ts) -> src/utils/Logger.ts (Count: 1)
- [src/core/DebuggerSystem.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DebuggerSystem.ts) -> src/core/RendererCore.ts (Count: 1)
- [src/core/SnapshotSystem.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/SnapshotSystem.ts) -> src/core/BlacklistOrchestrator.ts (Count: 1)
- [src/core/collaboration/MountManager.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/MountManager.ts) -> src/core/SynapseIgnore.ts (Count: 1)
- [src/core/canvas-engine/Intent.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/Intent.ts) -> src/core/GraphModel.ts (Count: 1)
- [src/cli/ProjectAnalyzer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/ProjectAnalyzer.ts) -> src/core/analysis/intent/ConfidenceEngine.ts (Count: 1)
- [src/core/RendererCore.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/RendererCore.ts) -> src/core/canvas-engine/RenderProtocol.ts (Count: 1)
- [src/core/VirtualDebugger.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/VirtualDebugger.ts) -> src/utils/Logger.ts (Count: 1)
- [src/core/DataPipeline.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DataPipeline.ts) -> src/core/FileScanner.ts (Count: 1)
- [src/core/GeminiParser.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/GeminiParser.ts) -> src/core/RuleEngine.ts (Count: 1)
- [src/bootstrap/BootstrapEngine.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/bootstrap/BootstrapEngine.ts) -> src/core/JsTsScanner.ts (Count: 1)
- [src/core/analysis/reasoning/CommunityDetector.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/reasoning/CommunityDetector.ts) -> src/types/schema.ts (Count: 1)
- [src/server/standalone.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/server/standalone.ts) -> src/core/collaboration/SessionManager.ts (Count: 1)
- [src/core/analysis/analyzers/SchemaViolationAnalyzer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/analyzers/SchemaViolationAnalyzer.ts) -> src/types/schema.ts (Count: 1)
- [src/extension.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/extension.ts) -> src/core/GeminiParser.ts (Count: 1)
- [src/core/PythonScanner.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/PythonScanner.ts) -> src/types/schema.ts (Count: 1)
- [src/core/analysis/InterventionSimulator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/InterventionSimulator.ts) -> src/core/analysis/reasoning/TarjanSCC.ts (Count: 1)
- [src/core/NodeBuilder.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/NodeBuilder.ts) -> src/core/DirectoryTreeBuilder.ts (Count: 1)
- [src/core/collaboration/ReferenceVerifier.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/ReferenceVerifier.ts) -> src/utils/Logger.ts (Count: 1)
- [src/core/collaboration/EdgeGenerator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/EdgeGenerator.ts) -> src/types/schema.ts (Count: 1)
- [src/core/DataPipeline.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DataPipeline.ts) -> src/types/schema.ts (Count: 1)
- [src/core/GhostPolicy.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/GhostPolicy.ts) -> src/core/FileScanner.ts (Count: 1)
- [src/core/VisibleGraphResolver.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/VisibleGraphResolver.ts) -> src/types/schema.ts (Count: 1)
- [src/core/collaboration/ArchitectureIndexBuilder.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/ArchitectureIndexBuilder.ts) -> src/types/schema.ts (Count: 1)
- [src/core/canvas-engine/StateManager.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/StateManager.ts) -> src/core/GraphModel.ts (Count: 1)
- [src/core/canvas-engine/ValidationHarness.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/ValidationHarness.ts) -> src/core/RuleEngine.ts (Count: 1)
- [src/core/transaction/ExecutionLayer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/transaction/ExecutionLayer.ts) -> src/core/EdgeCodeRefactorer.ts (Count: 1)
- [src/core/projection/ProjectionLayer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/projection/ProjectionLayer.ts) -> src/core/projection/RuleStore.ts (Count: 1)
- [src/cli/stage_a5_validator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/stage_a5_validator.ts) -> src/cli/signal_laboratory.ts (Count: 1)
- [src/bootstrap/BootstrapEngine.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/bootstrap/BootstrapEngine.ts) -> src/core/KotlinScanner.ts (Count: 1)
- [src/core/DataPipeline.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DataPipeline.ts) -> src/core/canvas-engine/CanvasEngine.ts (Count: 1)
- [src/core/benchmark/BenchmarkHarness.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/benchmark/BenchmarkHarness.ts) -> src/core/GhostPolicy.ts (Count: 1)
- [src/core/analysis/reasoning/TarjanSCC.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/reasoning/TarjanSCC.ts) -> src/core/analysis/types.ts (Count: 1)
- [src/core/analysis/reasoning/SmellDetector.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/reasoning/SmellDetector.ts) -> src/core/analysis/types.ts (Count: 1)
- [src/core/analysis/InterventionSimulator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/InterventionSimulator.ts) -> src/types/schema.ts (Count: 1)
- [src/server/standalone.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/server/standalone.ts) -> src/utils/Logger.ts (Count: 1)
- [src/core/analysis/reasoning/TarjanSCC.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/reasoning/TarjanSCC.ts) -> src/core/analysis/GraphViewBuilder.ts (Count: 1)
- [src/core/analysis/GraphViewBuilder.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/GraphViewBuilder.ts) -> src/types/schema.ts (Count: 1)
- [src/core/analysis/analyzers/FractureAnalyzer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/analyzers/FractureAnalyzer.ts) -> src/core/analysis/types.ts (Count: 1)
- [src/server/standalone.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/server/standalone.ts) -> src/core/collaboration/MountManager.ts (Count: 1)
- [src/core/GhostClassifier.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/GhostClassifier.ts) -> src/utils/Logger.ts (Count: 1)
- [src/core/benchmark/BenchmarkGraphGenerator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/benchmark/BenchmarkGraphGenerator.ts) -> src/core/GraphModel.ts (Count: 1)
- [src/core/collaboration/BoundaryGuard.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/BoundaryGuard.ts) -> src/core/ProjectMetadata.ts (Count: 1)
- [src/core/benchmark/BenchmarkHarness.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/benchmark/BenchmarkHarness.ts) -> src/core/ReferenceResolver.ts (Count: 1)
- [src/core/canvas-engine/SpatialRuleBook.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/SpatialRuleBook.ts) -> src/core/RuleEngine.ts (Count: 1)
- [src/core/canvas-engine/CanvasEngine.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/CanvasEngine.ts) -> src/core/canvas-engine/PhaseGate.ts (Count: 1)
- [src/core/RendererCore.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/RendererCore.ts) -> src/core/GraphModel.ts (Count: 1)
- [src/webview/CanvasPanel.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/webview/CanvasPanel.ts) -> src/core/GraphModel.ts (Count: 1)
</details>

## 4. System Assembly Points (Healthy Hubs)
*No system assembly points identified.*

### 4.1 ASSEMBLY_POINT Audit
src/client.ts
Verdict: REJECTED

Evidence
FanOut: 1
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
src/main.ts
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
src/server/server.ts
Verdict: REJECTED

Evidence
FanOut: 4
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
external://src/vs/workbench/workbench.common.main.ts
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
external://src/vs/workbench/workbench.web.main.ts
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---

### 4.2 CONTRACT_HUB Audit
*No candidates found.*

## 5. Knowledge Connectivity
*No knowledge sources linked.*

## 4. Expected After Surgery
🟢 **STRENGTHENED**
- **Entropy**: 12 -> N/A
- **Boundary Edges**: 461 -> N/A


## 6. Raw Metrics
### 6.1 AEL Metrics
- **Architecture Entropy**: 12 / 100 (Risk Level: **LOW**)
- **False Positive Probability**: 30.0%

### 6.2 Source Breakdown (ASR 3.0)
#### Ghost Source Top N
  - N/A

#### Coupling Source Top N
  - **core**: 241 (29.5%)
  - **unknown**: 176 (21.5%)
  - **src**: 82 (10%)
  - **types**: 64 (7.8%)
  - **utils**: 43 (5.3%)
  - ...

### 6.3 Cost Projection
- **Estimated Engineers**: 8
- **Estimated Days**: 6
- **Files Affected**: 90
- **Edges Affected**: 266