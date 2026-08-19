# 🔬 SYNAPSE Architecture Scan Report (EV-LIVE)
Generated: 2026-08-19T03:09:47.103Z

## 0. Analysis Subject (Layer -3)
- **Subject**: Module: src/core
- **Files**: 302
- **Internal Edges**: 177
- **Boundary Edges**: 743

### Subject Fingerprint (Top Internal Domains)
- Module: src/core
- Module: src/vs/workbench/contrib
- Module: src/core/collaboration
- Module: src/vs/workbench/contrib/chat/browser
- Module: src

## 1. Executive Summary
**Scan Context**: Sub-cluster Analysis
**Observation**: External Dependency Ratio = 4.2x
**Assessment**: Selected cluster depends heavily on modules outside the scan boundary.
**Implication**: This does not imply whole-project instability.

**Why High External Coupling?**
- **Boundary Edge Count**: 743 / 177 (Internal)
- **Top 3 Contributors**: 상위 3개 파일(BootstrapEngine.ts, CanvasPanel.ts, standalone.ts)이 전체 Boundary Edge의 **9.2%** (68개)를 생성하고 있습니다.

**Cumulative Boundary Contribution**
- **Top 3**: 9.2% (68 edges)
- **Top 10**: 17.0% (126 edges)
- **Top 50**: 35.4% (263 edges)
- **Top 100**: 44.1% (328 edges)

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
- **Ghost Dependencies**: 33

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
- Boundary Crossing: 26
- Fan-Out: 27
- Blast Radius: 18 Clusters

**Top External Targets (Evidence)**
- src/core/FlowchartGenerator.ts (1 edges)
- src/core/JVMAuditor.ts (1 edges)
- src/core/GraphModel.ts (1 edges)
- src/core/KotlinScanner.ts (1 edges)
- src/core/SnapshotSystem.ts (1 edges)
- src/core/JavaScanner.ts (1 edges)
- src/core/JsTsScanner.ts (1 edges)
- src/utils/Logger.ts (1 edges)
- src/core/RuleEngine.ts (1 edges)
- src/core/ScannerRegistry.ts (1 edges)

**AST Evidence Verification** `[HEALTHY_CONTRACT]`
- interface: 0% | type: 0% | function: 1% | statement: 5%
- Score: 26 → 21 (×0.8)
> 이 파일은 계약과 구현이 균형을 이룬다. 표준 위험도.

### 2. src/webview/CanvasPanel.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/webview/CanvasPanel.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 21
- Fan-Out: 24
- Blast Radius: 20 Clusters

**Top External Targets (Evidence)**
- src/core/transaction/ProjectStateSerializer.ts (1 edges)
- src/core/GraphModel.ts (1 edges)
- src/core/RendererCore.ts (1 edges)
- src/core/RuleEngine.ts (1 edges)
- src/core/FileScanner.ts (1 edges)
- http (1 edges)
- src/core/EdgeCodeRefactorer.ts (1 edges)
- src/core/FlowchartGenerator.ts (1 edges)
- src/core/ControlSystem.ts (1 edges)
- src/core/analysis/ClusterBridgeAnalyzer.ts (1 edges)

**AST Evidence Verification** `[HEALTHY_CONTRACT]`
- interface: 0% | type: 0% | function: 1% | statement: 6%
- Score: 21 → 17 (×0.8)
> 이 파일은 계약과 구현이 균형을 이룬다. 표준 위험도.

### 3. src/server/standalone.ts
- **Role**: UNKNOWN
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/server/standalone.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 21
- Fan-Out: 21
- Blast Radius: 5 Clusters

**Top External Targets (Evidence)**
- src/core/collaboration/AccountManager.ts (1 edges)
- src/core/GeminiParser.ts (1 edges)
- src/core/collaboration/ArchitectureIndexBuilder.ts (1 edges)
- src/core/SynapseIgnore.ts (1 edges)
- express (1 edges)
- src/core/collaboration/RuntimeInitializer.ts (1 edges)
- src/core/collaboration/CompareEngine.ts (1 edges)
- cors (1 edges)
- crypto (1 edges)
- src/core/collaboration/HarvestSessionManager.ts (1 edges)

**AST Evidence Verification** `[HEALTHY_CONTRACT]`
- interface: 0% | type: 0% | function: 1% | statement: 6%
- Score: 21 → 17 (×0.8)
> 이 파일은 계약과 구현이 균형을 이룬다. 표준 위험도.

### 4. src/extension.ts
- **Role**: UNKNOWN
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/extension.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 18
- Fan-Out: 22
- Blast Radius: 22 Clusters

**Top External Targets (Evidence)**
- src/core/LogicAnalyzer.ts (1 edges)
- src/utils/ChatExtractor.ts (1 edges)
- src/core/collaboration/RuntimeInitializer.ts (1 edges)
- src/core/PbSessionWatcher.ts (1 edges)
- src/core/ReportExporter.ts (1 edges)
- src/core/GeminiParser.ts (1 edges)
- src/core/ProjectMetadata.ts (1 edges)
- src/core/GraphModel.ts (1 edges)
- src/core/BillingManager.ts (1 edges)
- src/core/AiOrchestrator.ts (1 edges)

**AST Evidence Verification** `[HEALTHY_CONTRACT]`
- interface: 0% | type: 0% | function: 1% | statement: 6%
- Score: 18 → 14 (×0.8)
> 이 파일은 계약과 구현이 균형을 이룬다. 표준 위험도.

### 5. src/core/ir/ArchitectureIrBuilder.ts
- **Role**: UI_COMPONENT
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/ArchitectureIrBuilder.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 9
- Fan-Out: 12
- Blast Radius: 4 Clusters

**Top External Targets (Evidence)**
- src/core/ir/generators/BoundaryCandidateGenerator.ts (1 edges)
- src/core/ir/evaluators/BoundaryEvidenceEvaluator.ts (1 edges)
- src/core/ir/evaluators/ExtensionPointEvidenceEvaluator.ts (1 edges)
- src/core/ir/generators/PayloadCandidateGenerator.ts (1 edges)
- src/core/ir/evaluators/PayloadEvidenceEvaluator.ts (1 edges)
- src/core/ir/evaluators/StateOwnerEvidenceEvaluator.ts (1 edges)
- src/core/ir/generators/ExtensionPointCandidateGenerator.ts (1 edges)
- src/core/ir/generators/StateOwnerCandidateGenerator.ts (1 edges)
- src/core/GraphModel.ts (1 edges)

**AST Evidence Verification** `[HEALTHY_CONTRACT]`
- interface: 0% | type: 0% | function: 0% | statement: 5%
- Score: 9 → 7 (×0.8)
> 이 파일은 계약과 구현이 균형을 이룬다. 표준 위험도.

### 6. src/core/DataPipeline.ts
- **Role**: DOMAIN_SERVICE
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DataPipeline.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 7
- Fan-Out: 25
- Blast Radius: 22 Clusters

**Top External Targets (Evidence)**
- src/core/canvas-engine/CanvasEngine.ts (1 edges)
- src/utils/Logger.ts (1 edges)
- crypto (1 edges)
- src/core/BoundsDiagnosticReporter.ts (1 edges)
- src/core/DiagnosticReporter.ts (1 edges)
- src/types/schema.ts (1 edges)
- src/core/LayoutDiagnosticReporter.ts (1 edges)

**AST Evidence Verification** `[HEALTHY_CONTRACT]`
- interface: 0% | type: 0% | function: 1% | statement: 5%
- Score: 7 → 6 (×0.8)
> 이 파일은 계약과 구현이 균형을 이룬다. 표준 위험도.

### 7. src/cli/ProjectAnalyzer.ts
- **Role**: UNKNOWN
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/ProjectAnalyzer.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 6
- Fan-Out: 6
- Blast Radius: 22 Clusters

**Top External Targets (Evidence)**
- src/core/analysis/intent/RegexProvider.ts (1 edges)
- src/core/analysis/intent/ReasonedReportBundle.ts (1 edges)
- src/core/analysis/intent/EvidenceAggregator.ts (1 edges)
- src/core/analysis/intent/ConfidenceEngine.ts (1 edges)
- src/core/analysis/intent/VSCodeProvider.ts (1 edges)
- src/core/analysis/intent/ArchitectMapGenerator.ts (1 edges)

**AST Evidence Verification** `[HEALTHY_CONTRACT]`
- interface: 0% | type: 0% | function: 1% | statement: 2%
- Score: 6 → 5 (×0.8)
> 이 파일은 계약과 구현이 균형을 이룬다. 표준 위험도.

### 8. src/core/reasoning/analysis/ExtensionAnalyzer.ts
- **Role**: DOMAIN_SERVICE
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/analysis/ExtensionAnalyzer.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 6
- Fan-Out: 6
- Blast Radius: 7 Clusters

**Top External Targets (Evidence)**
- src/core/reasoning/rules/Rule.ts (1 edges)
- src/core/reasoning/evidence/Evidence.ts (1 edges)
- src/core/reasoning/snapshot/ReasoningSnapshot.ts (1 edges)
- src/core/ir/generators/ExtensionPointCandidateGenerator.ts (1 edges)
- src/core/GraphModel.ts (1 edges)
- src/core/ir/evaluators/ExtensionPointEvidenceEvaluator.ts (1 edges)

**AST Evidence Verification** `[HEALTHY_CONTRACT]`
- interface: 0% | type: 0% | function: 2% | statement: 2%
- Score: 6 → 5 (×0.8)
> 이 파일은 계약과 구현이 균형을 이룬다. 표준 위험도.

### 9. src/core/analysis/reasoning/ReasoningEngine.ts
- **Role**: DOMAIN_SERVICE
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/reasoning/ReasoningEngine.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 6
- Fan-Out: 8
- Blast Radius: 4 Clusters

**Top External Targets (Evidence)**
- src/core/analysis/types.ts (1 edges)
- src/types/schema.ts (1 edges)
- src/core/GraphModel.ts (1 edges)
- src/core/analysis/TargetSelector.ts (1 edges)
- src/core/analysis/InterventionSimulator.ts (1 edges)
- src/utils/Logger.ts (1 edges)

**AST Evidence Verification** `[HEALTHY_CONTRACT]`
- interface: 0% | type: 0% | function: 1% | statement: 4%
- Score: 6 → 5 (×0.8)
> 이 파일은 계약과 구현이 균형을 이룬다. 표준 위험도.

### 10. src/core/canvas-engine/StateManager.ts
- **Role**: DOMAIN_SERVICE
[View Source File](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/StateManager.ts)

**Evidence (Observed Behavior)**
- Boundary Crossing: 6
- Fan-Out: 6
- Blast Radius: 4 Clusters

**Top External Targets (Evidence)**
- src/core/RuleEngine.ts (1 edges)
- src/core/projection/ProjectionLayer.ts (1 edges)
- crypto (1 edges)
- src/core/GraphModel.ts (1 edges)
- src/core/transaction/CommitManager.ts (1 edges)
- src/utils/Logger.ts (1 edges)

**AST Evidence Verification** `[HEALTHY_CONTRACT]`
- interface: 0% | type: 0% | function: 1% | statement: 5%
- Score: 6 → 5 (×0.8)
> 이 파일은 계약과 구현이 균형을 이룬다. 표준 위험도.


## 3. Evidence Layer
### 3.1 Ghost Evidence
*No ghost evidence found.*

### 3.2 Boundary Evidence
<details><summary><b>Show Boundary Evidence (Top 50)</b></summary>

- [src/bootstrap/BootstrapEngine.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/bootstrap/BootstrapEngine.ts) -> src/core/FlowchartGenerator.ts (Count: 1)
- [src/core/canvas-engine/SpatialRuleBook.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/SpatialRuleBook.ts) -> src/core/canvas-engine/RuleEngine.ts (Count: 1)
- [src/utils/exclusionRules.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/utils/exclusionRules.ts) -> src/core/RuleEngine.ts (Count: 1)
- [src/core/analysis/TargetSelector.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/TargetSelector.ts) -> src/core/analysis/types.ts (Count: 1)
- [src/core/reasoning/rules/extension/ExtensionRule.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/rules/extension/ExtensionRule.ts) -> src/core/reasoning/evidence/Evidence.ts (Count: 1)
- [src/core/CommandInterceptor.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/CommandInterceptor.ts) -> src/core/PromptLogger.ts (Count: 1)
- [src/core/analysis/analyzers/CycleAnalyzer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/analyzers/CycleAnalyzer.ts) -> src/core/analysis/types.ts (Count: 1)
- [src/core/reasoning/analysis/BoundaryAnalyzer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/analysis/BoundaryAnalyzer.ts) -> src/core/GraphModel.ts (Count: 1)
- [src/core/ir/promoters/PromotionEngine.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/promoters/PromotionEngine.ts) -> src/core/ir/models/SemanticTypes.ts (Count: 1)
- [src/core/ir/generators/ExtensionPointCandidateGenerator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/generators/ExtensionPointCandidateGenerator.ts) -> src/core/GraphModel.ts (Count: 1)
- [src/core/analysis/analyzers/DeadEndAnalyzer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/analyzers/DeadEndAnalyzer.ts) -> src/types/schema.ts (Count: 1)
- [src/core/ir/ArchitectureIrBuilder.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/ArchitectureIrBuilder.ts) -> src/core/ir/generators/BoundaryCandidateGenerator.ts (Count: 1)
- [src/cli/b5_validation_layer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/b5_validation_layer.ts) -> src/core/validation/ValidationContext.ts (Count: 1)
- [src/core/analysis/reasoning/CommunityDetector.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/reasoning/CommunityDetector.ts) -> src/core/analysis/types.ts (Count: 1)
- [src/core/VisibleGraphResolver.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/VisibleGraphResolver.ts) -> src/core/ClusterHierarchy.ts (Count: 1)
- [src/bootstrap/BootstrapEngine.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/bootstrap/BootstrapEngine.ts) -> src/types/schema.ts (Count: 1)
- [src/webview/CanvasPanel.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/webview/CanvasPanel.ts) -> src/core/transaction/ProjectStateSerializer.ts (Count: 1)
- [src/core/analysis/intent/VSCodeProvider.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/intent/VSCodeProvider.ts) -> src/core/analysis/intent/IEvidenceProvider.ts (Count: 1)
- [src/core/ir/ArchitectureIrBuilder.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/ArchitectureIrBuilder.ts) -> src/core/ir/evaluators/BoundaryEvidenceEvaluator.ts (Count: 1)
- [src/core/analysis/analyzers/CycleAnalyzer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/analyzers/CycleAnalyzer.ts) -> src/types/schema.ts (Count: 1)
- [src/core/collaboration/RuntimeInitializer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/RuntimeInitializer.ts) -> src/core/SymbolIndex.ts (Count: 1)
- [src/core/reasoning/analysis/BoundaryAnalyzer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/analysis/BoundaryAnalyzer.ts) -> src/core/reasoning/snapshot/ReasoningSnapshot.ts (Count: 1)
- [src/core/benchmark/BenchmarkHarness.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/benchmark/BenchmarkHarness.ts) -> src/core/GhostExpander.ts (Count: 1)
- [src/core/analysis/reasoning/ReasoningEngine.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/reasoning/ReasoningEngine.ts) -> src/core/analysis/types.ts (Count: 1)
- [src/core/analysis/analyzers/SchemaViolationAnalyzer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/analyzers/SchemaViolationAnalyzer.ts) -> src/core/analysis/types.ts (Count: 1)
- [src/core/ir/evaluators/BoundaryEvidenceEvaluator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/evaluators/BoundaryEvidenceEvaluator.ts) -> src/core/ir/models/GeneratorInterfaces.ts (Count: 1)
- [src/core/analysis/reasoning/ReasoningEngine.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/reasoning/ReasoningEngine.ts) -> src/types/schema.ts (Count: 1)
- [src/core/reasoning/analysis/CriticalityAnalyzer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/analysis/CriticalityAnalyzer.ts) -> src/core/reasoning/rules/Rule.ts (Count: 1)
- [src/server/standalone.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/server/standalone.ts) -> src/core/collaboration/AccountManager.ts (Count: 1)
- [src/core/VirtualDebugger.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/VirtualDebugger.ts) -> src/core/validation/ValidationEngine.ts (Count: 1)
- [src/core/canvas-engine/CanvasEngine.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/CanvasEngine.ts) -> src/core/RuleEngine.ts (Count: 1)
- [src/core/analysis/ast/AstSymbolResolver.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/ast/AstSymbolResolver.ts) -> src/types/schema.ts (Count: 1)
- [src/core/reasoning/analysis/RoleAnalyzer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/analysis/RoleAnalyzer.ts) -> src/core/reasoning/snapshot/ReasoningSnapshot.ts (Count: 1)
- [src/extension.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/extension.ts) -> src/core/LogicAnalyzer.ts (Count: 1)
- [src/core/RendererCore.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/RendererCore.ts) -> src/core/PhaseManager.ts (Count: 1)
- [src/core/analysis/InterventionSimulator.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/InterventionSimulator.ts) -> src/core/analysis/GraphViewBuilder.ts (Count: 1)
- [src/server/standalone.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/server/standalone.ts) -> src/core/GeminiParser.ts (Count: 1)
- [src/core/ShellScanner.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ShellScanner.ts) -> src/types/schema.ts (Count: 1)
- [src/extension.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/extension.ts) -> src/utils/ChatExtractor.ts (Count: 1)
- [src/core/DataPipeline.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DataPipeline.ts) -> src/core/ReferenceResolver.ts (Count: 1)
- [src/core/analysis/analyzers/NecrosisAnalyzer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/analyzers/NecrosisAnalyzer.ts) -> src/types/schema.ts (Count: 1)
- [src/core/reasoning/analysis/ExtensionAnalyzer.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/analysis/ExtensionAnalyzer.ts) -> src/core/reasoning/rules/Rule.ts (Count: 1)
- [src/core/collaboration/BoundaryGuard.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/BoundaryGuard.ts) -> src/core/collaboration/SessionManager.ts (Count: 1)
- [src/core/collaboration/HarvestSessionManager.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/HarvestSessionManager.ts) -> src/utils/Logger.ts (Count: 1)
- [src/core/NodeBuilder.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/NodeBuilder.ts) -> src/core/DirectoryTreeBuilder.ts (Count: 1)
- [src/cli/verify_determinism.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/verify_determinism.ts) -> src/utils/hash_utils.ts (Count: 1)
- [src/core/ir/ArchitectureIrBuilder.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/ArchitectureIrBuilder.ts) -> src/core/ir/evaluators/ExtensionPointEvidenceEvaluator.ts (Count: 1)
- [src/cli.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli.ts) -> src/bootstrap/BootstrapEngine.ts (Count: 1)
- [src/core/resolvers/TypeScriptResolver.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/resolvers/TypeScriptResolver.ts) -> src/core/resolvers/LanguageResolver.ts (Count: 1)
- [src/core/GridSystem.ts](vscode://file//home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/GridSystem.ts) -> src/core/ControlSystem.ts (Count: 1)
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

### 4.2 CONTRACT_HUB Audit
*No candidates found.*

## 5. Knowledge Connectivity
*No knowledge sources linked.*

## 4. Expected After Surgery
🟢 **STRENGTHENED**
- **Entropy**: 12 -> N/A
- **Boundary Edges**: 743 -> N/A


## 6. Raw Metrics
### 6.1 AEL Metrics
- **Architecture Entropy**: 12 / 100 (Risk Level: **LOW**)
- **False Positive Probability**: 30.0%

### 6.2 Source Breakdown (ASR 3.0)
#### Ghost Source Top N
  - N/A

#### Coupling Source Top N
  - **core**: 427 (38.1%)
  - **root**: 183 (16.3%)
  - **unknown**: 137 (12.2%)
  - **vs**: 83 (7.4%)
  - **types**: 68 (6.1%)
  - ...

### 6.3 Cost Projection
- **Estimated Engineers**: 4
- **Estimated Days**: 7
- **Files Affected**: 64
- **Edges Affected**: 328