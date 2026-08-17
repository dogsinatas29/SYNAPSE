# 🔬 SYNAPSE Architecture Scan Report (EV-LIVE)
Generated: 2026-08-17T14:49:01.924Z

## 0. Analysis Subject (Layer -3)
- **Subject**: Module: src/core
- **Files**: 386
- **Internal Edges**: 177
- **Boundary Edges**: 865

### Subject Fingerprint (Top Internal Domains)
- Module: src/core
- Module: src/vs/workbench/contrib
- Module: src/core/collaboration
- Module: test
- Module: src/vs/workbench/contrib/chat/browser

## 1. Executive Summary
**Scan Context**: Sub-cluster Analysis
**Observation**: External Dependency Ratio = 4.9x
**Assessment**: Selected cluster depends heavily on modules outside the scan boundary.
**Implication**: This does not imply whole-project instability.

**Why High External Coupling?**
- **Boundary Edge Count**: 865 / 177 (Internal)
- **Top 3 Contributors**: 상위 3개 파일(BootstrapEngine.ts, CanvasPanel.ts, standalone.ts)이 전체 Boundary Edge의 **7.9%** (68개)를 생성하고 있습니다.



**Cumulative Boundary Contribution**
- **Top 3**: 7.9% (68 edges)
- **Top 10**: 14.6% (126 edges)
- **Top 50**: 30.4% (263 edges)
- **Top 100**: 40.1% (347 edges)

**Audit Confidence**: 76%

Base Score                     70
Grammar Noise Filtered        +0
Assembly Point Classified      +0
Contract Hub Verified          +0
Ghost Ratio < 5%               +6
Unknown References             0
Final Score                   76

### Global Metrics
- **Entropy**: 12
- **Ghost Dependencies**: 37

### Dependency Sources Breakdown
**Ghost Dependencies (Scanner Issues)**
  - N/A

**External Dependencies (Architecture)**
  - N/A


## 2. Impact Files (Architectural Assessment)
### 1. src/bootstrap/BootstrapEngine.ts
- **Role**: UNKNOWN
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/bootstrap/BootstrapEngine.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 26
- Blast Radius (Clusters): 24
- Fan-Out: 27
- Fan-In: 3

**Architectural Assessment**
> NORMAL: Standard node behavior without severe structural anomalies.

**Risk Level**: NONE

**Recommended Action**
> No immediate architectural action required.

**Top External Targets (Evidence)**
- src/core/GeminiParser.ts (1 edges - Type: INCLUDE)
- src/core/SnapshotSystem.ts (1 edges - Type: INCLUDE)
- src/core/ConfigScanner.ts (1 edges - Type: INCLUDE)
- src/core/DataPipeline.ts (1 edges - Type: CALL)
- src/core/GraphModel.ts (1 edges - Type: INCLUDE)
- src/core/JsTsScanner.ts (1 edges - Type: INCLUDE)
- src/utils/Logger.ts (1 edges - Type: INCLUDE)
- src/core/JVMAuditor.ts (1 edges - Type: INCLUDE)
- src/core/MarkdownScanner.ts (1 edges - Type: INCLUDE)
- src/core/PhaseManager.ts (1 edges - Type: INCLUDE)

**AST Evidence Verification** `[RUNTIME_HUB]`
- interface: 0% | type: 0% | function: 11% | statement: 61%
> 이 파일은 실제 실행 로직을 포함하는 런타임 허브다. 변경 시 즉각적 영향.

### 2. src/webview/CanvasPanel.ts
- **Role**: UNKNOWN
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/webview/CanvasPanel.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 21
- Blast Radius (Clusters): 25
- Fan-Out: 24
- Fan-In: 2

**Architectural Assessment**
> NORMAL: Standard node behavior without severe structural anomalies.

**Risk Level**: NONE

**Recommended Action**
> No immediate architectural action required.

**Top External Targets (Evidence)**
- src/core/DebuggerSystem.ts (1 edges - Type: INCLUDE)
- src/core/SnapshotSystem.ts (1 edges - Type: INCLUDE)
- src/core/SynapseIgnore.ts (1 edges - Type: INCLUDE)
- src/utils/Logger.ts (1 edges - Type: INCLUDE)
- src/core/VirtualDebugger.ts (1 edges - Type: INCLUDE)
- src/core/RendererCore.ts (1 edges - Type: INCLUDE)
- src/core/canvas-engine/RenderProtocol.ts (1 edges - Type: INCLUDE)
- src/core/GraphModel.ts (1 edges - Type: INCLUDE)
- src/core/analysis/ClusterBridgeAnalyzer.ts (1 edges - Type: INCLUDE)
- src/core/transaction/ProjectStateSerializer.ts (1 edges - Type: INCLUDE)

**AST Evidence Verification** `[RUNTIME_HUB]`
- interface: 0% | type: 0% | function: 13% | statement: 61%
> 이 파일은 실제 실행 로직을 포함하는 런타임 허브다. 변경 시 즉각적 영향.

### 3. src/server/standalone.ts
- **Role**: UNKNOWN
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/server/standalone.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 21
- Blast Radius (Clusters): 5
- Fan-Out: 21
- Fan-In: 0

**Architectural Assessment**
> NORMAL: Standard node behavior without severe structural anomalies.

**Risk Level**: NONE

**Recommended Action**
> No immediate architectural action required.

**Top External Targets (Evidence)**
- src/core/collaboration/RestCollaborationTransport.ts (1 edges - Type: INCLUDE)
- crypto (1 edges - Type: INCLUDE)
- src/core/collaboration/MountManager.ts (1 edges - Type: INCLUDE)
- src/core/collaboration/CompareEngine.ts (1 edges - Type: INCLUDE)
- src/core/collaboration/RuntimeInitializer.ts (1 edges - Type: INCLUDE)
- src/core/FlowScanner.ts (1 edges - Type: INCLUDE)
- src/core/ProjectMetadata.ts (1 edges - Type: INCLUDE)
- src/core/collaboration/HarvestSessionManager.ts (1 edges - Type: INCLUDE)
- src/core/collaboration/AccountManager.ts (1 edges - Type: INCLUDE)
- src/utils/Logger.ts (1 edges - Type: INCLUDE)

**AST Evidence Verification** `[RUNTIME_HUB]`
- interface: 0% | type: 0% | function: 10% | statement: 62%
> 이 파일은 실제 실행 로직을 포함하는 런타임 허브다. 변경 시 즉각적 영향.

### 4. src/extension.ts
- **Role**: UNKNOWN
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/extension.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 18
- Blast Radius (Clusters): 27
- Fan-Out: 22
- Fan-In: 0

**Architectural Assessment**
> NORMAL: Standard node behavior without severe structural anomalies.

**Risk Level**: NONE

**Recommended Action**
> No immediate architectural action required.

**Top External Targets (Evidence)**
- src/core/GeminiParser.ts (1 edges - Type: INCLUDE)
- src/utils/ChatExtractor.ts (1 edges - Type: INCLUDE)
- demo/canvas-engine.js (1 edges - Type: INCLUDE)
- src/core/AiOrchestrator.ts (1 edges - Type: INCLUDE)
- src/core/benchmark/BenchmarkHarness.ts (1 edges - Type: INCLUDE)
- src/core/BlacklistOrchestrator.ts (1 edges - Type: INCLUDE)
- src/utils/Logger.ts (1 edges - Type: INCLUDE)
- node (1 edges - Type: INCLUDE)
- src/core/PbSessionWatcher.ts (1 edges - Type: INCLUDE)
- src/core/BillingManager.ts (1 edges - Type: INCLUDE)

**AST Evidence Verification** `[RUNTIME_HUB]`
- interface: 0% | type: 0% | function: 11% | statement: 63%
> 이 파일은 실제 실행 로직을 포함하는 런타임 허브다. 변경 시 즉각적 영향.

### 5. src/core/ir/ArchitectureIrBuilder.ts
- **Role**: DOMAIN_SERVICE
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/ArchitectureIrBuilder.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 9
- Blast Radius (Clusters): 4
- Fan-Out: 12
- Fan-In: 2

**Architectural Assessment**
> NORMAL: Standard node behavior without severe structural anomalies.

**Risk Level**: NONE

**Recommended Action**
> No immediate architectural action required.

**Top External Targets (Evidence)**
- src/core/ir/evaluators/PayloadEvidenceEvaluator.ts (1 edges - Type: INCLUDE)
- src/core/GraphModel.ts (1 edges - Type: INCLUDE)
- src/core/ir/evaluators/ExtensionPointEvidenceEvaluator.ts (1 edges - Type: INCLUDE)
- src/core/ir/evaluators/BoundaryEvidenceEvaluator.ts (1 edges - Type: INCLUDE)
- src/core/ir/generators/BoundaryCandidateGenerator.ts (1 edges - Type: INCLUDE)
- src/core/ir/generators/StateOwnerCandidateGenerator.ts (1 edges - Type: INCLUDE)
- src/core/ir/generators/PayloadCandidateGenerator.ts (1 edges - Type: INCLUDE)
- src/core/ir/generators/ExtensionPointCandidateGenerator.ts (1 edges - Type: INCLUDE)
- src/core/ir/evaluators/StateOwnerEvidenceEvaluator.ts (1 edges - Type: INCLUDE)

**AST Evidence Verification** `[RUNTIME_HUB]`
- interface: 0% | type: 0% | function: 1% | statement: 70%
> 이 파일은 실제 실행 로직을 포함하는 런타임 허브다. 변경 시 즉각적 영향.

### 6. src/core/DataPipeline.ts
- **Role**: DOMAIN_SERVICE
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DataPipeline.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 7
- Blast Radius (Clusters): 27
- Fan-Out: 25
- Fan-In: 2

**Architectural Assessment**
> NORMAL: Standard node behavior without severe structural anomalies.

**Risk Level**: NONE

**Recommended Action**
> No immediate architectural action required.

**Top External Targets (Evidence)**
- src/types/schema.ts (1 edges - Type: INCLUDE)
- src/core/BoundsDiagnosticReporter.ts (1 edges - Type: UNKNOWN)
- src/core/DiagnosticReporter.ts (1 edges - Type: UNKNOWN)
- src/core/canvas-engine/CanvasEngine.ts (1 edges - Type: INCLUDE)
- crypto (1 edges - Type: INCLUDE)
- src/utils/Logger.ts (1 edges - Type: INCLUDE)
- src/core/LayoutDiagnosticReporter.ts (1 edges - Type: UNKNOWN)

**AST Evidence Verification** `[RUNTIME_HUB]`
- interface: 0% | type: 0% | function: 9% | statement: 52%
> 이 파일은 실제 실행 로직을 포함하는 런타임 허브다. 변경 시 즉각적 영향.

### 7. src/cli/ProjectAnalyzer.ts
- **Role**: UNKNOWN
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/ProjectAnalyzer.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 6
- Blast Radius (Clusters): 27
- Fan-Out: 6
- Fan-In: 2

**Architectural Assessment**
> NORMAL: Standard node behavior without severe structural anomalies.

**Risk Level**: NONE

**Recommended Action**
> No immediate architectural action required.

**Top External Targets (Evidence)**
- src/core/analysis/intent/ReasonedReportBundle.ts (1 edges - Type: UNKNOWN)
- src/core/analysis/intent/VSCodeProvider.ts (1 edges - Type: INCLUDE)
- src/core/analysis/intent/ArchitectMapGenerator.ts (1 edges - Type: INCLUDE)
- src/core/analysis/intent/RegexProvider.ts (1 edges - Type: INCLUDE)
- src/core/analysis/intent/EvidenceAggregator.ts (1 edges - Type: INCLUDE)
- src/core/analysis/intent/ConfidenceEngine.ts (1 edges - Type: INCLUDE)

**AST Evidence Verification** `[RUNTIME_HUB]`
- interface: 3% | type: 2% | function: 13% | statement: 25%
> 이 파일은 실제 실행 로직을 포함하는 런타임 허브다. 변경 시 즉각적 영향.

### 8. src/core/reasoning/analysis/ExtensionAnalyzer.ts
- **Role**: DOMAIN_SERVICE
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/analysis/ExtensionAnalyzer.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 6
- Blast Radius (Clusters): 7
- Fan-Out: 6
- Fan-In: 2

**Architectural Assessment**
> NORMAL: Standard node behavior without severe structural anomalies.

**Risk Level**: NONE

**Recommended Action**
> No immediate architectural action required.

**Top External Targets (Evidence)**
- src/core/ir/evaluators/ExtensionPointEvidenceEvaluator.ts (1 edges - Type: INCLUDE)
- src/core/GraphModel.ts (1 edges - Type: INCLUDE)
- src/core/ir/generators/ExtensionPointCandidateGenerator.ts (1 edges - Type: INCLUDE)
- src/core/reasoning/snapshot/ReasoningSnapshot.ts (1 edges - Type: INCLUDE)
- src/core/reasoning/evidence/Evidence.ts (1 edges - Type: INCLUDE)
- src/core/reasoning/rules/Rule.ts (1 edges - Type: INCLUDE)

**AST Evidence Verification** `[RUNTIME_HUB]`
- interface: 0% | type: 0% | function: 26% | statement: 30%
> 이 파일은 실제 실행 로직을 포함하는 런타임 허브다. 변경 시 즉각적 영향.

### 9. src/core/analysis/reasoning/ReasoningEngine.ts
- **Role**: DOMAIN_SERVICE
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/reasoning/ReasoningEngine.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 6
- Blast Radius (Clusters): 4
- Fan-Out: 8
- Fan-In: 0

**Architectural Assessment**
> NORMAL: Standard node behavior without severe structural anomalies.

**Risk Level**: NONE

**Recommended Action**
> No immediate architectural action required.

**Top External Targets (Evidence)**
- src/utils/Logger.ts (1 edges - Type: INCLUDE)
- src/core/analysis/TargetSelector.ts (1 edges - Type: INCLUDE)
- src/core/analysis/types.ts (1 edges - Type: INCLUDE)
- src/core/analysis/InterventionSimulator.ts (1 edges - Type: INCLUDE)
- src/core/GraphModel.ts (1 edges - Type: INCLUDE)
- src/types/schema.ts (1 edges - Type: INCLUDE)

**AST Evidence Verification** `[RUNTIME_HUB]`
- interface: 0% | type: 0% | function: 8% | statement: 53%
> 이 파일은 실제 실행 로직을 포함하는 런타임 허브다. 변경 시 즉각적 영향.

### 10. src/core/canvas-engine/StateManager.ts
- **Role**: DOMAIN_SERVICE
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/StateManager.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 6
- Blast Radius (Clusters): 4
- Fan-Out: 6
- Fan-In: 4

**Architectural Assessment**
> NORMAL: Standard node behavior without severe structural anomalies.

**Risk Level**: NONE

**Recommended Action**
> No immediate architectural action required.

**Top External Targets (Evidence)**
- src/utils/Logger.ts (1 edges - Type: INCLUDE)
- src/core/GraphModel.ts (1 edges - Type: INCLUDE)
- crypto (1 edges - Type: INCLUDE)
- src/core/transaction/CommitManager.ts (1 edges - Type: INCLUDE)
- src/core/RuleEngine.ts (1 edges - Type: INCLUDE)
- src/core/projection/ProjectionLayer.ts (1 edges - Type: INCLUDE)

**AST Evidence Verification** `[RUNTIME_HUB]`
- interface: 0% | type: 0% | function: 13% | statement: 58%
> 이 파일은 실제 실행 로직을 포함하는 런타임 허브다. 변경 시 즉각적 영향.


## 3. Evidence Layer
### 3.1 Ghost Evidence
<details><summary><b>Show Ghost Evidence (Top 50)</b></summary>

- [src/cli/ast_verification_engine.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/ast_verification_engine.ts) -> typescript (Count: 1)
- [src/server/standalone.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/server/standalone.ts) -> crypto (Count: 1)
- [src/core/collaboration/SessionManager.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/SessionManager.ts) -> crypto (Count: 1)
- [src/core/benchmark/BenchmarkGraphGenerator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/benchmark/BenchmarkGraphGenerator.ts) -> crypto (Count: 1)
- [src/core/FileScanner.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/FileScanner.ts) -> Y (Count: 1)
- [src/utils/hash_utils.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/utils/hash_utils.ts) -> crypto (Count: 1)
- [src/cli/verify_determinism.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/verify_determinism.ts) -> util (Count: 1)
- [src/core/canvas-engine/StateManager.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/StateManager.ts) -> crypto (Count: 1)
- [src/core/EdgeBuilder.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/EdgeBuilder.ts) -> crypto (Count: 1)
- [src/utils/hash_utils.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/utils/hash_utils.ts) -> util (Count: 1)
- [src/core/resolvers/TypeScriptResolver.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/resolvers/TypeScriptResolver.ts) -> foo (Count: 1)
- [src/core/collaboration/CompareEngine.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/CompareEngine.ts) -> crypto (Count: 1)
- [src/server/server.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/server/server.ts) -> vscode-languageserver-textdocument (Count: 1)
- [src/core/CDPManager.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/CDPManager.ts) -> http (Count: 1)
- [src/core/collaboration/CompareProjection.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/CompareProjection.ts) -> crypto (Count: 1)
- [src/core/SnapshotSystem.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/SnapshotSystem.ts) -> crypto (Count: 1)
- [src/core/DirectChatScraper.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DirectChatScraper.ts) -> crypto (Count: 1)
- [src/core/ProjectMetadata.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ProjectMetadata.ts) -> crypto (Count: 1)
- [src/core/DataPipeline.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DataPipeline.ts) -> crypto (Count: 1)
- [src/core/resolvers/TypeScriptResolver.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/resolvers/TypeScriptResolver.ts) -> typescript (Count: 1)
- [src/core/collaboration/EdgeGenerator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/EdgeGenerator.ts) -> crypto (Count: 1)
- [src/core/collaboration/AccountManager.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/AccountManager.ts) -> crypto (Count: 1)
- [src/core/collaboration/HarvestProjection.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/HarvestProjection.ts) -> crypto (Count: 1)
- [src/core/CDPManager.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/CDPManager.ts) -> crypto (Count: 1)
- [src/rust_checker/state_checker.rs](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/rust_checker/state_checker.rs) -> project_state_json (Count: 1)
- [src/webview/CanvasPanel.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/webview/CanvasPanel.ts) -> http (Count: 1)
</details>

### 3.2 Boundary Evidence
<details><summary><b>Show Boundary Evidence (Top 50)</b></summary>

- [src/core/analysis/reasoning/ReasoningEngine.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/reasoning/ReasoningEngine.ts) -> src/utils/Logger.ts (Count: 1)
- [src/server/standalone.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/server/standalone.ts) -> src/core/collaboration/RestCollaborationTransport.ts (Count: 1)
- [scripts/run_reasoning_on_real_graph.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/scripts/run_reasoning_on_real_graph.ts) -> src/core/reasoning/rules/criticality/CriticalityRule.ts (Count: 1)
- [src/core/ir/evaluators/StateOwnerEvidenceEvaluator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/evaluators/StateOwnerEvidenceEvaluator.ts) -> src/core/ir/models/GeneratorInterfaces.ts (Count: 1)
- [src/bootstrap/BootstrapEngine.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/bootstrap/BootstrapEngine.ts) -> src/core/GeminiParser.ts (Count: 1)
- [src/core/ir/generators/StateOwnerCandidateGenerator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/generators/StateOwnerCandidateGenerator.ts) -> src/core/ir/models/SemanticTypes.ts (Count: 1)
- [src/core/SnapshotSystem.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/SnapshotSystem.ts) -> src/core/BlacklistOrchestrator.ts (Count: 1)
- [src/core/analysis/InterventionSimulator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/InterventionSimulator.ts) -> src/types/schema.ts (Count: 1)
- [src/core/analysis/intent/ArchitectMapGenerator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/intent/ArchitectMapGenerator.ts) -> src/core/analysis/intent/ActionCandidate.ts (Count: 1)
- [src/core/analysis/analyzers/IsolatedNodeAnalyzer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/analyzers/IsolatedNodeAnalyzer.ts) -> src/core/analysis/types.ts (Count: 1)
- [src/core/reasoning/analysis/ExtensionAnalyzer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/analysis/ExtensionAnalyzer.ts) -> src/core/ir/evaluators/ExtensionPointEvidenceEvaluator.ts (Count: 1)
- [scripts/run_reasoning_on_real_graph.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/scripts/run_reasoning_on_real_graph.ts) -> src/core/reasoning/answers/aggregators/Q3CriticalityAggregator.ts (Count: 1)
- [src/core/analysis/InterventionSimulator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/InterventionSimulator.ts) -> src/utils/Logger.ts (Count: 1)
- [src/core/VisibleGraphResolver.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/VisibleGraphResolver.ts) -> src/core/ClusterHierarchy.ts (Count: 1)
- [src/core/AiOrchestrator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/AiOrchestrator.ts) -> src/utils/Logger.ts (Count: 1)
- [src/core/analysis/reasoning/ReasoningEngine.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/reasoning/ReasoningEngine.ts) -> src/core/analysis/TargetSelector.ts (Count: 1)
- [src/core/SymbolIndex.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/SymbolIndex.ts) -> src/utils/Logger.ts (Count: 1)
- [src/core/DataPipeline.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DataPipeline.ts) -> src/core/RuleEngine.ts (Count: 1)
- [src/core/ir/generators/BoundaryCandidateGenerator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/generators/BoundaryCandidateGenerator.ts) -> src/core/ir/models/SemanticTypes.ts (Count: 1)
- [src/core/canvas-engine/ValidationHarness.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/ValidationHarness.ts) -> src/core/RuleEngine.ts (Count: 1)
- [src/core/filterSnapshot.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/filterSnapshot.ts) -> src/core/RuleEngine.ts (Count: 1)
- [src/cli/run_b5_bundle.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/run_b5_bundle.ts) -> src/cli/stage_a5_validator.ts (Count: 1)
- [src/core/reasoning/answers/aggregators/Q4ExtensionAggregator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/answers/aggregators/Q4ExtensionAggregator.ts) -> src/core/reasoning/evidence/Evidence.ts (Count: 1)
- [src/core/DataPipeline.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DataPipeline.ts) -> src/types/schema.ts (Count: 1)
- [src/core/reasoning/analysis/CriticalityAnalyzer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/analysis/CriticalityAnalyzer.ts) -> src/core/reasoning/snapshot/ReasoningSnapshot.ts (Count: 1)
- [src/core/analysis/analyzers/DependencyPressureAnalyzer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/analyzers/DependencyPressureAnalyzer.ts) -> src/types/schema.ts (Count: 1)
- [src/core/analysis/analyzers/FractureAnalyzer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/analyzers/FractureAnalyzer.ts) -> src/core/analysis/types.ts (Count: 1)
- [src/core/ir/ArchitectureIrBuilder.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/ArchitectureIrBuilder.ts) -> src/core/ir/evaluators/PayloadEvidenceEvaluator.ts (Count: 1)
- [src/core/analysis/intent/ConfidenceEngine.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/intent/ConfidenceEngine.ts) -> src/core/analysis/intent/IntentEdge.ts (Count: 1)
- [src/core/collaboration/AccountManager.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/AccountManager.ts) -> src/utils/Logger.ts (Count: 1)
- [src/core/ir/ArchitectureIrBuilder.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/ArchitectureIrBuilder.ts) -> src/core/GraphModel.ts (Count: 1)
- [src/core/reasoning/analysis/RoleAnalyzer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/analysis/RoleAnalyzer.ts) -> src/core/reasoning/evidence/Evidence.ts (Count: 1)
- [src/cli.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli.ts) -> src/cli/BatchRunner.ts (Count: 1)
- [src/core/ir/evaluators/ExtensionPointEvidenceEvaluator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/evaluators/ExtensionPointEvidenceEvaluator.ts) -> src/core/ir/models/SemanticTypes.ts (Count: 1)
- [src/core/RendererCore.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/RendererCore.ts) -> src/core/canvas-engine/RenderProtocol.ts (Count: 1)
- [src/core/ir/generators/StateOwnerCandidateGenerator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/generators/StateOwnerCandidateGenerator.ts) -> src/core/GraphModel.ts (Count: 1)
- [src/cli/BatchRunner.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/BatchRunner.ts) -> src/core/analysis/intent/MarkdownExporter.ts (Count: 1)
- [src/core/collaboration/RestCollaborationTransport.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/RestCollaborationTransport.ts) -> src/core/collaboration/CollaborationTransport.ts (Count: 1)
- [src/core/benchmark/BenchmarkHarness.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/benchmark/BenchmarkHarness.ts) -> src/core/GraphModel.ts (Count: 1)
- [src/core/canvas-engine/CanvasEngine.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/CanvasEngine.ts) -> src/core/canvas-engine/PhaseGate.ts (Count: 1)
- [src/core/canvas-engine/VisualRuleBook.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/VisualRuleBook.ts) -> src/core/canvas-engine/StateManager.ts (Count: 1)
- [src/core/canvas-engine/StateManager.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/StateManager.ts) -> src/utils/Logger.ts (Count: 1)
- [src/cli/verify_determinism.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/verify_determinism.ts) -> src/utils/hash_utils.ts (Count: 1)
- [src/core/ir/evaluators/ExtensionPointEvidenceEvaluator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/evaluators/ExtensionPointEvidenceEvaluator.ts) -> src/core/ir/models/GeneratorInterfaces.ts (Count: 1)
- [src/core/LayoutEngine.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/LayoutEngine.ts) -> src/core/GraphModel.ts (Count: 1)
- [scripts/run_reasoning_on_real_graph.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/scripts/run_reasoning_on_real_graph.ts) -> src/core/reasoning/analysis/CriticalityAnalyzer.ts (Count: 1)
- [src/core/reasoning/analysis/AuthorityAnalyzer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/analysis/AuthorityAnalyzer.ts) -> src/core/reasoning/rules/Rule.ts (Count: 1)
- [src/core/ir/models/GeneratorInterfaces.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/models/GeneratorInterfaces.ts) -> src/core/ir/models/SemanticTypes.ts (Count: 1)
- [src/core/GhostClassifier.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/GhostClassifier.ts) -> src/core/GraphModel.ts (Count: 1)
- [src/core/analysis/types.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/types.ts) -> src/types/schema.ts (Count: 1)
</details>

## 4. System Assembly Points (Healthy Hubs)
*No system assembly points identified.*

### 4.1 ASSEMBLY_POINT Audit
src/client.ts
Verdict: REJECTED

Evidence
FanOut: 2
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
FanOut: 5
Boundary Ratio: 1.00

Reason Code:
REJECTED_LOW_FANOUT

---
vscode:/file/home/dogsinatas/다운로드/vscode/vscode-main/src/vs/sessions/sessions.common.main.ts
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
vscode:/file/home/dogsinatas/다운로드/vscode/vscode-main/src/vs/sessions/sessions.web.main.ts
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
vscode:/file/home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.common.main.ts
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---
vscode:/file/home/dogsinatas/다운로드/vscode/vscode-main/src/vs/workbench/workbench.web.main.ts
Verdict: REJECTED

Evidence
FanOut: 0
Boundary Ratio: 0.00

Reason Code:
REJECTED_LOW_FANOUT
REJECTED_LOW_BOUNDARY_RATIO

---

## 5. Knowledge Connectivity
*No knowledge sources linked.*

## 7. Architectural Reasoning
*Reasoning Pipeline was not executed or results unavailable.*

## 6. Raw Metrics
### 6.1 Global Metrics
- **Boundary Ratio**: 83.0%

### 6.2 Source Breakdown (ASR 3.0)
#### Ghost Source Top N
  - N/A

#### Coupling Source Top N
  - **core**: 430 (31.5%)
  - **unknown**: 258 (18.9%)
  - **root**: 183 (13.4%)
  - **vs**: 166 (12.2%)
  - **types**: 68 (5%)
  - ...