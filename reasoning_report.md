# SYNAPSE Reasoning Report

## Graph Stats
- Nodes: 326
- Edges: 700

## Q1~Q8 Answers

### Q3: 무엇이 핵심이고 무엇이 부수적인가? (Core vs Utility)
**Summary**: Identified 7 Core Pillars, 0 Supporting nodes, and 0 Utilities.
**Confidence**: 0.9

#### Items:
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/types.ts** (Score: 3): [CORE PILLAR] State Owner, Participates in 1 critical pipelines
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/GraphModel.ts** (Score: 3): [CORE PILLAR] State Owner, Participates in 1 critical pipelines
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/models/SemanticTypes.ts** (Score: 3): [CORE PILLAR] State Owner, Participates in 1 critical pipelines
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/resolvers/TypeScriptResolver.ts** (Score: 3): [CORE PILLAR] State Owner, Participates in 1 critical pipelines
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/transaction/ProjectStateSerializer.ts** (Score: 3): [CORE PILLAR] State Owner, Participates in 1 critical pipelines
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/types/schema.ts** (Score: 3): [CORE PILLAR] State Owner, Participates in 1 critical pipelines
- **typescript** (Score: 3): [CORE PILLAR] State Owner, Participates in 1 critical pipelines

### Q4: 어디서 확장해야 하나? (Where are the Extension Points?)
**Summary**: Identified 9 Designed Extension Points.
**Confidence**: 1

#### Items:
- **ArchitectureAnalyzer** (Score: 1): - 8 implementations
- [EXTENSION_DENSITY] High extension density (8 implementors) suggests an architectural axis.
- **LanguageScanner** (Score: 1): - 10 implementations
- [EXTENSION_DENSITY] High extension density (10 implementors) suggests an architectural axis.
- **IAnswerAggregator** (Score: 1): - 8 implementations
- [EXTENSION_DENSITY] High extension density (8 implementors) suggests an architectural axis.
- **IRule** (Score: 1): - 10 implementations
- [EXTENSION_DENSITY] High extension density (13 implementors) suggests an architectural axis.
- [CROSS_CLUSTER_DENSITY] Cross-cluster adoption (7 clusters) confirms global extension axis.
- **ChatAdapter** (Score: 0.9): - 4 implementations
- [EXTENSION_DENSITY] High extension density (4 implementors) suggests an architectural axis.
- **RuleSubEngine** (Score: 0.8): - 3 implementations
- [EXTENSION_DENSITY] High extension density (3 implementors) suggests an architectural axis.
- **IEvidenceEvaluator** (Score: 0.8): - 3 implementations
- [EXTENSION_DENSITY] High extension density (3 implementors) suggests an architectural axis.
- **ICandidateGenerator** (Score: 0.8): - 3 implementations
- [EXTENSION_DENSITY] High extension density (3 implementors) suggests an architectural axis.
- **ProjectionRule** (Score: 0.8): - 3 implementations
- [EXTENSION_DENSITY] High extension density (3 implementors) suggests an architectural axis.

### Q5: 어디를 건드리면 무너지는가? (Blast Radius)
**Summary**: Identified structural blast radius for 210 nodes.
**Confidence**: 0.9

#### Items:
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/types.ts** (Score: 4): [CRITICAL] Classified as CORE.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/GraphModel.ts** (Score: 4): [CRITICAL] Classified as CORE.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/models/SemanticTypes.ts** (Score: 4): [CRITICAL] Classified as CORE.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/resolvers/TypeScriptResolver.ts** (Score: 4): [CRITICAL] Classified as CORE.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/transaction/ProjectStateSerializer.ts** (Score: 4): [CRITICAL] Classified as CORE.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/types/schema.ts** (Score: 4): [CRITICAL] Classified as CORE.
- **typescript** (Score: 4): [CRITICAL] Classified as CORE.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/StateManager.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/AccountManager.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/IdentityManager.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/SessionManager.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/PhaseManager.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/projection/RuleStore.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/validation/ValidationContext.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/bootstrap/BootstrapEngine.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/analyzers/BoundaryGuardAnalyzer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/analyzers/CycleAnalyzer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/analyzers/DeadEndAnalyzer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/analyzers/DependencyPressureAnalyzer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/analyzers/FractureAnalyzer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/analyzers/IsolatedNodeAnalyzer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/analyzers/NecrosisAnalyzer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/analyzers/SchemaViolationAnalyzer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/ArchitectureAnalysisEngine.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/ast/AstSymbolResolver.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/ClusterBridgeAnalyzer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/GraphViewBuilder.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/InterventionSimulator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/reasoning/CommunityDetector.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/reasoning/DependencyClassifier.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/reasoning/InterventionEngine.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/reasoning/ReasoningEngine.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/reasoning/SmellDetector.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/reasoning/TarjanSCC.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/TargetSelector.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ArchitectureDSL.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ClusterHierarchy.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/CompareProjection.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/EdgeGenerator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/HarvestProjection.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ConfigScanner.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/CppScanner.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/FlowchartGenerator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/GeminiParser.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/JavaScanner.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/JsTsScanner.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/JVMAuditor.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/KotlinScanner.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/MarkdownScanner.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/PythonScanner.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/resolvers/LanguageResolver.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/RustScanner.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ScannerRegistry.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ShellScanner.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/SqlScanner.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/VisibleGraphResolver.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/test/intervention_stability.test.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/utils/exclusionRules.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/utils/visualHints.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/BatchRunner.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/ProjectAnalyzer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/SummaryGenerator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/intent/ActionCandidate.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/intent/ArchitectMapGenerator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/intent/ArchitectureActionGenerator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/intent/ConfidenceEngine.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/intent/EvidenceAggregator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/intent/EvidenceIR.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/intent/FindingGenerator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/intent/IEvidenceProvider.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/intent/IntentEdge.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/intent/MarkdownExporter.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/intent/RegexProvider.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/analysis/intent/VSCodeProvider.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/ast_verification_engine.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/b5_validation_layer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/community_edge_audit.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/run_b5_bundle.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/signal_laboratory.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/stage_a5_validator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/validation/ArchitectureAuditor.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/validation/ValidationEngine.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/VirtualDebugger.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/cli/verify_determinism.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/utils/determinism.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/utils/hash_utils.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/benchmark/BenchmarkGraphGenerator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/benchmark/BenchmarkHarness.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/Intent.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ClusterBuilder.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/CommunityDetector.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DataPipeline.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DirectoryTreeBuilder.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/EdgeBuilder.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ExternalReferenceSemantics.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/FileScanner.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/GhostClassifier.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/GhostExpander.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/GhostPolicy.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/GraphAnalyzer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/ArchitectureIrBuilder.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/evaluators/BoundaryEvidenceEvaluator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/evaluators/ExtensionPointEvidenceEvaluator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/evaluators/PayloadEvidenceEvaluator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/evaluators/StateOwnerEvidenceEvaluator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/generators/BoundaryCandidateGenerator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/generators/ExtensionPointCandidateGenerator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/generators/PayloadCandidateGenerator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/generators/StateOwnerCandidateGenerator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/models/GeneratorInterfaces.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ir/promoters/PromotionEngine.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/LayoutEngine.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/LogicAnalyzer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/NodeBuilder.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/projection/ProjectionLayer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ReferenceResolver.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/BlacklistOrchestrator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/CanvasEngine.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/PhaseGate.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/RenderProtocol.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/RuleEngine.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/ScenarioRunner.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/SpatialRuleBook.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/ValidationHarness.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/canvas-engine/VisualRuleBook.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ControlSystem.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DebuggerSystem.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/EdgeCodeRefactorer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/filterSnapshot.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/graphBuilder.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/GridSystem.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/RendererCore.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/RuleEngine.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/SnapshotSystem.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/transaction/CommitManager.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/transaction/ExecutionLayer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/transaction/VerificationLayer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/verify_v0.3.10.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/webview/CanvasPanel.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/CDPManager.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/ArchitectureIndexBuilder.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/BoundaryGuard.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/CollaborationTransport.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/CompareEngine.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/HarvestEngine.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/HarvestSessionManager.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/MountManager.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/ReferenceVerifier.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/RemoteLayerProjector.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/RestCollaborationTransport.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/collaboration/RuntimeInitializer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/ProjectMetadata.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/SymbolIndex.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/SynapseIgnore.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/WebviewInterceptor.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/server/standalone.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/test/phase1_validation.test.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/test/phase2_validation.test.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/test/security_regression.test.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/utils/Logger.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/CommandInterceptor.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DirectChatScraper.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/PromptLogger.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/utils/SensitiveInfoMasker.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/analysis/AuthorityAnalyzer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/analysis/BlastRadiusAnalyzer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/analysis/BoundaryAnalyzer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/analysis/CriticalityAnalyzer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/analysis/ExtensionAnalyzer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/analysis/FlowAnalyzer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/analysis/InfluenceAnalyzer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/analysis/RoleAnalyzer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/answers/aggregators/Q1EntryPointAggregator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/answers/aggregators/Q2AuthorityAggregator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/answers/aggregators/Q3CriticalityAggregator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/answers/aggregators/Q4ExtensionAggregator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/answers/aggregators/Q5BlastRadiusAggregator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/answers/aggregators/Q6BoundaryAggregator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/answers/aggregators/Q7DataFlowAggregator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/answers/aggregators/Q8ControlFlowAggregator.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/answers/Answer.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/answers/AnswerEngine.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/evidence/Evidence.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/evidence/EvidenceExtractor.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/rules/authority/AuthorityRule.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/rules/blast/BlastRadiusRule.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/rules/boundary/BoundaryCrosserRule.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/rules/boundary/BoundaryRule.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/rules/criticality/CriticalityRule.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/rules/extension/ExtensionRule.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/rules/flow/ControlPipelineRule.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/rules/flow/DataPipelineRule.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/rules/roles/AdapterRule.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/rules/roles/ControllerRule.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/rules/roles/PolicyOwnerRule.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/rules/roles/StateOwnerRule.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/rules/roles/ViewRule.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/rules/Rule.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/rules/RuleEngine.ts** (Score: 1): [LOW] Classified as UTILITY.
- **/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/reasoning/snapshot/ReasoningSnapshot.ts** (Score: 1): [LOW] Classified as UTILITY.
- **ArchitectureAnalyzer** (Score: 1): [LOW] Classified as UTILITY.
• shatters 1 extension points
- **RuleSubEngine** (Score: 1): [LOW] Classified as UTILITY.
• shatters 1 extension points
- **LanguageScanner** (Score: 1): [LOW] Classified as UTILITY.
• shatters 1 extension points
- **IEvidenceEvaluator** (Score: 1): [LOW] Classified as UTILITY.
• shatters 1 extension points
- **ICandidateGenerator** (Score: 1): [LOW] Classified as UTILITY.
• shatters 1 extension points
- **ProjectionRule** (Score: 1): [LOW] Classified as UTILITY.
• shatters 1 extension points
- **IAnswerAggregator** (Score: 1): [LOW] Classified as UTILITY.
• shatters 1 extension points
- **IRule** (Score: 1): [LOW] Classified as UTILITY.
• shatters 1 extension points
- **ChatAdapter** (Score: 1): [LOW] Classified as UTILITY.
• shatters 1 extension points

### Q6: 시스템 경계는 어디인가? (Where are the boundaries?)
**Summary**: Identified 9 Boundaries and 0 Crossers based on structural topology.
**Confidence**: 1

#### Items:
- **Group[3 nodes]** (Score: 1): Isolated Island with 3 nodes. Highly decoupled.
- **Group[4 nodes]** (Score: 1): Isolated Island with 4 nodes. Highly decoupled.
- **Group[36 nodes]** (Score: 0.9516129032258065): Cohesive structural Boundary with 36 nodes (Modularity: 95.2%).
- **Group[16 nodes]** (Score: 0.8620689655172413): Cohesive structural Boundary with 16 nodes (Modularity: 86.2%).
- **Group[48 nodes]** (Score: 0.6766467065868264): Cohesive structural Boundary with 48 nodes (Modularity: 67.7%).
- **Group[24 nodes]** (Score: 0.6635514018691588): Cohesive structural Boundary with 24 nodes (Modularity: 66.4%).
- **Group[11 nodes]** (Score: 0.6551724137931034): Cohesive structural Boundary with 11 nodes (Modularity: 65.5%).
- **Group[33 nodes]** (Score: 0.6027397260273972): Cohesive structural Boundary with 33 nodes (Modularity: 60.3%).
- **Group[25 nodes]** (Score: 0.5408163265306123): Cohesive structural Boundary with 25 nodes (Modularity: 54.1%).

