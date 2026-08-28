=== Semantic Boundary Report ===

Boundary Count: 3

[Boundary] src/core/analysis
Members: 39
Internal Edges: 47
External Edges: 37
Cohesion: 0.56
Strength: Weak

Connected To:
- src/types (Unpromoted) (23)
- src/core/GraphModel.ts (Unpromoted) (4)
- root (Unpromoted) (4)
- src/utils (Unpromoted) (3)
- src/core/FileScanner.ts (Unpromoted) (1)
- src/core/CommunityDetector.ts (Unpromoted) (1)
- src/core/NodeBuilder.ts (Unpromoted) (1)

--------------------------------

[Boundary] src/core/ir
Members: 12
Internal Edges: 29
External Edges: 10
Cohesion: 0.74
Strength: Weak

Connected To:
- src/core/GraphModel.ts (Unpromoted) (10)

--------------------------------

[Boundary] src/core/reasoning
Members: 60
Internal Edges: 139
External Edges: 13
Cohesion: 0.91
Strength: Moderate

Connected To:
- src/core/GraphModel.ts (Unpromoted) (7)
- src/core/ir (3)
- src/core/CommunityDetector.ts (Unpromoted) (1)
- src/core/validation (Unpromoted) (1)
- src/types (Unpromoted) (1)

--------------------------------

=== Rejected Boundary Candidates ===

Rejected Count: 107

[REJECT_SMALL] external:
  Members: 12
  Depth: 1
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - ...
    - [^'"]+
    - /home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/RawTextMiner.ts
    - 링크
    - 출력 가능한 ASCII
    - crypto
    - foo
    - http
    - project_state_json
    - typescript
    - util
    - vscode-languageserver-textdocument

[REJECT_SMALL] 
  Members: 2
  Depth: 1
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - /home/dogsinatas/TypeScript_project/antigravity-extension-vis/demo/index.html
    - ui/index.html

[REJECT_SMALL] root
  Members: 11
  Depth: 1
  Internal Edges: 1
  External Edges: 85
  Cohesion: 0.012
  Target Concentration: 0.506
  Member Files:
    - build-guard.js
    - cors
    - express
    - net
    - node
    - package.json
    - synapse.config.json
    - test_analyze.ts
    - tsconfig.json
    - Y
    - AGGREGATE_OUT_OF_SCOPE

[REJECT_SMALL] demo
  Members: 1
  Depth: 1
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - demo/canvas-engine.js

[REJECT_SMALL] scratch
  Members: 5
  Depth: 1
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - scratch/analyze_fan_in_out.js
    - scratch/analyze_top_100_regions.js
    - scratch/check_clusters.js
    - scratch/extract_fork_and_write.js
    - scratch/extract_fork.js

[REJECT_SMALL] scripts
  Members: 11
  Depth: 1
  Internal Edges: 0
  External Edges: 49
  Cohesion: 0.000
  Target Concentration: 0.776
  Member Files:
    - scripts/audit_extension_clusters.ts
    - scripts/create-account.js
    - scripts/extension_discovery_audit.ts
    - scripts/run_reasoning_on_real_graph.ts
    - scripts/test_architecture_dependency_audit.ts
    - scripts/test_architecture_verification_26.ts
    - scripts/test_architecture_verification_27.ts
    - scripts/test_architecture_verification_28_29.ts
    - scripts/test_architecture_verification_30.ts
    - scripts/update_project_state.ts
    - scripts/verify_anomaly_collector.ts

[WRAPPER] src
  Members: 393
  Depth: 1
  Internal Edges: 697
  External Edges: 59
  Cohesion: 0.922
  Target Concentration: 0.356
  Member Files:
    - src/analysis/hintEngine.ts
    - src/bootstrap/BootstrapEngine.ts
    - src/cli.ts
    - src/cli/ast_verification_engine.ts
    - src/cli/audit_evidence.ts
    - src/cli/audit_gate_g.ts
    - src/cli/audit_gate_i.ts
    - src/cli/audit_gate_j.ts
    - src/cli/audit_gate_k.ts
    - src/cli/audit_gate_l.ts
    - src/cli/audit_gate_m.ts
    - src/cli/audit_gate_n_series.ts
    - src/cli/audit_gate_o_series.ts
    - src/cli/audit_phase_12_2_5_coordination_audit.ts
    - src/cli/audit_phase_12_2_6_5_service_investigation.ts
    - src/cli/audit_phase_12_2_6_revalidation.ts
    - src/cli/audit_phase_12_3_determinism_and_regression.ts
    - src/cli/audit_phase_12_4_5_dossier.ts
    - src/cli/audit_phase_12_4_falsification.ts
    - src/cli/audit_phase_12_7_generalization.ts

[REJECT_SMALL] ui
  Members: 7
  Depth: 1
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - ui/canvas-engine.js
    - ui/cluster-hierarchy.js
    - ui/engine-core.js
    - ui/i18n.js
    - ui/rbush.js
    - ui/synapse-theme.js
    - ui/webgl-renderer.js

[REJECT_SMALL] src/analysis
  Members: 1
  Depth: 2
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/analysis/hintEngine.ts

[REJECT_SMALL] src/bootstrap
  Members: 1
  Depth: 2
  Internal Edges: 0
  External Edges: 27
  Cohesion: 0.000
  Target Concentration: 0.889
  Member Files:
    - src/bootstrap/BootstrapEngine.ts

[REJECT_SMALL] src/cli.ts
  Members: 1
  Depth: 2
  Internal Edges: 0
  External Edges: 2
  Cohesion: 0.000
  Target Concentration: 0.500
  Member Files:
    - src/cli.ts

[REJECT_SMALL] src/cli
  Members: 41
  Depth: 2
  Internal Edges: 9
  External Edges: 73
  Cohesion: 0.110
  Target Concentration: 0.849
  Member Files:
    - src/cli/ast_verification_engine.ts
    - src/cli/audit_evidence.ts
    - src/cli/audit_gate_g.ts
    - src/cli/audit_gate_i.ts
    - src/cli/audit_gate_j.ts
    - src/cli/audit_gate_k.ts
    - src/cli/audit_gate_l.ts
    - src/cli/audit_gate_m.ts
    - src/cli/audit_gate_n_series.ts
    - src/cli/audit_gate_o_series.ts
    - src/cli/audit_phase_12_2_5_coordination_audit.ts
    - src/cli/audit_phase_12_2_6_5_service_investigation.ts
    - src/cli/audit_phase_12_2_6_revalidation.ts
    - src/cli/audit_phase_12_3_determinism_and_regression.ts
    - src/cli/audit_phase_12_4_5_dossier.ts
    - src/cli/audit_phase_12_4_falsification.ts
    - src/cli/audit_phase_12_7_generalization.ts
    - src/cli/audit_phase_12_7_v2_discovery.ts
    - src/cli/audit_phase_12_7_v3_minimal_search.ts
    - src/cli/audit_phase_12_7_v4_hub_vs_authority.ts

[REJECT_SMALL] src/client.ts
  Members: 1
  Depth: 2
  Internal Edges: 0
  External Edges: 2
  Cohesion: 0.000
  Target Concentration: 0.500
  Member Files:
    - src/client.ts

[WRAPPER] src/core
  Members: 243
  Depth: 2
  Internal Edges: 412
  External Edges: 149
  Cohesion: 0.734
  Target Concentration: 0.550
  Member Files:
    - src/core/AiOrchestrator.ts
    - src/core/analysis/analyzers/BoundaryAnalyzer.ts
    - src/core/analysis/analyzers/BoundaryGraphBuilder.ts
    - src/core/analysis/analyzers/BoundaryGuardAnalyzer.ts
    - src/core/analysis/analyzers/CycleAnalyzer.ts
    - src/core/analysis/analyzers/DeadEndAnalyzer.ts
    - src/core/analysis/analyzers/DependencyPressureAnalyzer.ts
    - src/core/analysis/analyzers/FractureAnalyzer.ts
    - src/core/analysis/analyzers/IsolatedNodeAnalyzer.ts
    - src/core/analysis/analyzers/NecrosisAnalyzer.ts
    - src/core/analysis/analyzers/SchemaViolationAnalyzer.ts
    - src/core/analysis/ArchitectureAnalysisEngine.ts
    - src/core/analysis/ArchitectureHeaderPolicy.ts
    - src/core/analysis/ast/AstSymbolResolver.ts
    - src/core/analysis/ClusterBridgeAnalyzer.ts
    - src/core/analysis/ContractHeaderPolicy.ts
    - src/core/analysis/GraphViewBuilder.ts
    - src/core/analysis/intent/ActionCandidate.ts
    - src/core/analysis/intent/ArchitectMapGenerator.ts
    - src/core/analysis/intent/ArchitectureActionGenerator.ts

[REJECT_SMALL] src/explorer
  Members: 1
  Depth: 2
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/explorer/ArchitectureExplorer.ts

[REJECT_SMALL] src/extension.ts
  Members: 1
  Depth: 2
  Internal Edges: 0
  External Edges: 22
  Cohesion: 0.000
  Target Concentration: 0.591
  Member Files:
    - src/extension.ts

[REJECT_SMALL] src/main.ts
  Members: 1
  Depth: 2
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/main.ts

[REJECT_SMALL] src/rust_checker
  Members: 2
  Depth: 2
  Internal Edges: 1
  External Edges: 2
  Cohesion: 0.333
  Target Concentration: 0.500
  Member Files:
    - src/rust_checker/mod.rs
    - src/rust_checker/state_checker.rs

[REJECT_SMALL] src/server
  Members: 4
  Depth: 2
  Internal Edges: 0
  External Edges: 26
  Cohesion: 0.000
  Target Concentration: 0.731
  Member Files:
    - src/server/register-vscode-mock.ts
    - src/server/server.ts
    - src/server/standalone.ts
    - src/server/vscode.ts

[REJECT_SMALL] src/test-webview.ts
  Members: 1
  Depth: 2
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/test-webview.ts

[REJECT_SMALL] src/types
  Members: 2
  Depth: 2
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/types/metrology.ts
    - src/types/schema.ts

[REJECT_SMALL] src/utils
  Members: 7
  Depth: 2
  Internal Edges: 0
  External Edges: 4
  Cohesion: 0.000
  Target Concentration: 0.250
  Member Files:
    - src/utils/ChatExtractor.ts
    - src/utils/determinism.ts
    - src/utils/exclusionRules.ts
    - src/utils/hash_utils.ts
    - src/utils/Logger.ts
    - src/utils/SensitiveInfoMasker.ts
    - src/utils/visualHints.ts

[WRAPPER] src/vs
  Members: 85
  Depth: 2
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/vs/editor/browser/widget/multiDiffEditor/diffEditorItemTemplate.ts
    - src/vs/editor/common/cursor/cursorDeleteOperations.ts
    - src/vs/editor/common/services/model.ts
    - src/vs/editor/contrib/colorPicker/browser/hoverColorPicker/hoverColorPickerParticipant.ts
    - src/vs/editor/contrib/suggest/browser/suggest.ts
    - src/vs/platform/agentHost/electron-browser/localAgentHostService.ts
    - src/vs/platform/agentHost/node/claude/claudeAgentSession.ts
    - src/vs/platform/agentHost/node/codex/protocol/generated/v2/TurnPlanUpdatedNotification.ts
    - src/vs/platform/menubar/electron-main/menubar.ts
    - src/vs/server/node/remoteExtensionsScanner.ts
    - src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackHover.ts
    - src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackItemsBackend.ts
    - src/vs/sessions/contrib/providers/copilotChatSessions/browser/copilotChatSessionsChangesets.ts
    - src/vs/workbench/api/browser/extensionHost.contribution.ts
    - src/vs/workbench/api/browser/mainThreadMessageService.ts
    - src/vs/workbench/api/common/extHost.protocol.ts
    - src/vs/workbench/browser/codeeditor.ts
    - src/vs/workbench/browser/parts/notifications/notificationsToasts.ts
    - src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.ts
    - src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentSessionProjectionActions.ts

[REJECT_SMALL] src/webview
  Members: 1
  Depth: 2
  Internal Edges: 0
  External Edges: 27
  Cohesion: 0.000
  Target Concentration: 0.741
  Member Files:
    - src/webview/CanvasPanel.ts

[REJECT_SMALL] src/core/AiOrchestrator.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/AiOrchestrator.ts

[REJECT_SMALL] src/core/AnomalyCollector.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/AnomalyCollector.ts

[REJECT_SMALL] src/core/ArchitectureDSL.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/ArchitectureDSL.ts

[REJECT_SMALL] src/core/benchmark
  Members: 2
  Depth: 3
  Internal Edges: 1
  External Edges: 12
  Cohesion: 0.077
  Target Concentration: 0.833
  Member Files:
    - src/core/benchmark/BenchmarkGraphGenerator.ts
    - src/core/benchmark/BenchmarkHarness.ts

[REJECT_SMALL] src/core/BillingManager.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/BillingManager.ts

[REJECT_SMALL] src/core/BlacklistOrchestrator.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 4
  Cohesion: 0.000
  Target Concentration: 0.750
  Member Files:
    - src/core/BlacklistOrchestrator.ts

[REJECT_SMALL] src/core/canvas-engine
  Members: 10
  Depth: 3
  Internal Edges: 14
  External Edges: 14
  Cohesion: 0.500
  Target Concentration: 0.857
  Member Files:
    - src/core/canvas-engine/CanvasEngine.ts
    - src/core/canvas-engine/Intent.ts
    - src/core/canvas-engine/PhaseGate.ts
    - src/core/canvas-engine/RenderProtocol.ts
    - src/core/canvas-engine/RuleEngine.ts
    - src/core/canvas-engine/ScenarioRunner.ts
    - src/core/canvas-engine/SpatialRuleBook.ts
    - src/core/canvas-engine/StateManager.ts
    - src/core/canvas-engine/ValidationHarness.ts
    - src/core/canvas-engine/VisualRuleBook.ts

[REJECT_SMALL] src/core/CDPManager.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 5
  Cohesion: 0.000
  Target Concentration: 0.200
  Member Files:
    - src/core/CDPManager.ts

[REJECT_SMALL] src/core/ClusterBuilder.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/ClusterBuilder.ts

[REJECT_SMALL] src/core/ClusterHierarchy.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/ClusterHierarchy.ts

[REJECT_SMALL] src/core/collaboration
  Members: 17
  Depth: 3
  Internal Edges: 14
  External Edges: 38
  Cohesion: 0.269
  Target Concentration: 0.316
  Member Files:
    - src/core/collaboration/AccountManager.ts
    - src/core/collaboration/ArchitectureIndexBuilder.ts
    - src/core/collaboration/BoundaryGuard.ts
    - src/core/collaboration/CollaborationTransport.ts
    - src/core/collaboration/CompareEngine.ts
    - src/core/collaboration/CompareProjection.ts
    - src/core/collaboration/EdgeGenerator.ts
    - src/core/collaboration/HarvestEngine.ts
    - src/core/collaboration/HarvestProjection.ts
    - src/core/collaboration/HarvestSessionManager.ts
    - src/core/collaboration/IdentityManager.ts
    - src/core/collaboration/MountManager.ts
    - src/core/collaboration/ReferenceVerifier.ts
    - src/core/collaboration/RemoteLayerProjector.ts
    - src/core/collaboration/RestCollaborationTransport.ts
    - src/core/collaboration/RuntimeInitializer.ts
    - src/core/collaboration/SessionManager.ts

[REJECT_SMALL] src/core/CommandInterceptor.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/CommandInterceptor.ts

[REJECT_SMALL] src/core/CommunityDetector.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/CommunityDetector.ts

[REJECT_SMALL] src/core/ConfigScanner.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/ConfigScanner.ts

[REJECT_SMALL] src/core/ControlSystem.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 3
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/ControlSystem.ts

[REJECT_SMALL] src/core/CppScanner.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/CppScanner.ts

[REJECT_SMALL] src/core/DatabaseEngine.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/core/DatabaseEngine.ts

[REJECT_SMALL] src/core/DataPipeline.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 25
  Cohesion: 0.000
  Target Concentration: 0.760
  Member Files:
    - src/core/DataPipeline.ts

[REJECT_SMALL] src/core/DebuggerSystem.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 3
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/DebuggerSystem.ts

[REJECT_SMALL] src/core/DirectChatScraper.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 2
  Cohesion: 0.000
  Target Concentration: 0.500
  Member Files:
    - src/core/DirectChatScraper.ts

[REJECT_SMALL] src/core/DirectoryTreeBuilder.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/DirectoryTreeBuilder.ts

[REJECT_SMALL] src/core/EdgeBuilder.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 3
  Cohesion: 0.000
  Target Concentration: 0.667
  Member Files:
    - src/core/EdgeBuilder.ts

[REJECT_SMALL] src/core/EdgeCodeRefactorer.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/core/EdgeCodeRefactorer.ts

[REJECT_SMALL] src/core/ExternalReferenceSemantics.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/core/ExternalReferenceSemantics.ts

[REJECT_SMALL] src/core/FailurePropagator.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/FailurePropagator.ts

[REJECT_SMALL] src/core/FileScanner.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 5
  Cohesion: 0.000
  Target Concentration: 0.200
  Member Files:
    - src/core/FileScanner.ts

[REJECT_SMALL] src/core/filterSnapshot.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 2
  Cohesion: 0.000
  Target Concentration: 0.500
  Member Files:
    - src/core/filterSnapshot.ts

[REJECT_SMALL] src/core/FlowchartGenerator.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 3
  Cohesion: 0.000
  Target Concentration: 0.667
  Member Files:
    - src/core/FlowchartGenerator.ts

[REJECT_SMALL] src/core/FlowScanner.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/core/FlowScanner.ts

[REJECT_SMALL] src/core/GeminiParser.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 3
  Cohesion: 0.000
  Target Concentration: 0.333
  Member Files:
    - src/core/GeminiParser.ts

[REJECT_SMALL] src/core/GhostClassifier.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 4
  Cohesion: 0.000
  Target Concentration: 0.750
  Member Files:
    - src/core/GhostClassifier.ts

[REJECT_SMALL] src/core/GhostExpander.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 4
  Cohesion: 0.000
  Target Concentration: 0.750
  Member Files:
    - src/core/GhostExpander.ts

[REJECT_SMALL] src/core/GhostPolicy.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/GhostPolicy.ts

[REJECT_SMALL] src/core/GraphAnalyzer.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 2
  Cohesion: 0.000
  Target Concentration: 0.500
  Member Files:
    - src/core/GraphAnalyzer.ts

[REJECT_SMALL] src/core/graphBuilder.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/graphBuilder.ts

[REJECT_SMALL] src/core/GraphModel.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 3
  Cohesion: 0.000
  Target Concentration: 0.667
  Member Files:
    - src/core/GraphModel.ts

[REJECT_SMALL] src/core/GridSystem.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 3
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/GridSystem.ts

[REJECT_SMALL] src/core/JavaScanner.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/JavaScanner.ts

[REJECT_SMALL] src/core/JsTsScanner.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/JsTsScanner.ts

[REJECT_SMALL] src/core/JVMAuditor.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/JVMAuditor.ts

[REJECT_SMALL] src/core/KotlinScanner.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/KotlinScanner.ts

[REJECT_SMALL] src/core/LayoutEngine.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 2
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/LayoutEngine.ts

[REJECT_SMALL] src/core/LogicAnalyzer.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 2
  Cohesion: 0.000
  Target Concentration: 0.500
  Member Files:
    - src/core/LogicAnalyzer.ts

[REJECT_SMALL] src/core/MarkdownScanner.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/MarkdownScanner.ts

[REJECT_SMALL] src/core/metrology
  Members: 25
  Depth: 3
  Internal Edges: 13
  External Edges: 10
  Cohesion: 0.565
  Target Concentration: 0.900
  Member Files:
    - src/core/metrology/__tests__/AgreementMatrixBuilder.test.ts
    - src/core/metrology/__tests__/AmplificationTracker.test.ts
    - src/core/metrology/AgreementMatrixBuilder.ts
    - src/core/metrology/AmplificationTracker.ts
    - src/core/metrology/BenchmarkSnapshotter.ts
    - src/core/metrology/BlindSpotMapper.ts
    - src/core/metrology/CostProfiler.ts
    - src/core/metrology/index.ts
    - src/core/metrology/PropertyRegistry.ts
    - src/core/metrology/Reengineering/__tests__/AmplificationPathAnalyzer.test.ts
    - src/core/metrology/Reengineering/__tests__/FalsePositiveFilterLayer.test.ts
    - src/core/metrology/Reengineering/__tests__/ValidationFanoutAnalyzer.test.ts
    - src/core/metrology/Reengineering/__tests__/ValidationLayerGuards.test.ts
    - src/core/metrology/Reengineering/AmplificationPathAnalyzer.ts
    - src/core/metrology/Reengineering/FalsePositiveFilterLayer.ts
    - src/core/metrology/Reengineering/RecoverabilityLayer.ts
    - src/core/metrology/Reengineering/ValidationFanoutAnalyzer.ts
    - src/core/metrology/Reengineering/ValidationLayerGuards.ts
    - src/core/metrology/Reengineering/VirtualEdgeLimiter.ts
    - src/core/metrology/Verification/__tests__/DeterministicHashVerifier.test.ts

[REJECT_SMALL] src/core/NodeBuilder.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 4
  Cohesion: 0.000
  Target Concentration: 0.750
  Member Files:
    - src/core/NodeBuilder.ts

[REJECT_SMALL] src/core/PbSessionWatcher.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/core/PbSessionWatcher.ts

[REJECT_SMALL] src/core/PhaseManager.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/core/PhaseManager.ts

[REJECT_SMALL] src/core/projection
  Members: 2
  Depth: 3
  Internal Edges: 1
  External Edges: 2
  Cohesion: 0.333
  Target Concentration: 1.000
  Member Files:
    - src/core/projection/ProjectionLayer.ts
    - src/core/projection/RuleStore.ts

[REJECT_SMALL] src/core/ProjectMetadata.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 2
  Cohesion: 0.000
  Target Concentration: 0.500
  Member Files:
    - src/core/ProjectMetadata.ts

[REJECT_SMALL] src/core/PromptLogger.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/PromptLogger.ts

[REJECT_SMALL] src/core/PythonScanner.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/PythonScanner.ts

[REJECT_SMALL] src/core/ReferenceResolver.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 2
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/ReferenceResolver.ts

[REJECT_SMALL] src/core/RendererCore.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 4
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/RendererCore.ts

[REJECT_SMALL] src/core/resolvers
  Members: 2
  Depth: 3
  Internal Edges: 1
  External Edges: 5
  Cohesion: 0.167
  Target Concentration: 0.400
  Member Files:
    - src/core/resolvers/LanguageResolver.ts
    - src/core/resolvers/TypeScriptResolver.ts

[REJECT_SMALL] src/core/RuleEngine.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/core/RuleEngine.ts

[REJECT_SMALL] src/core/RustScanner.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/RustScanner.ts

[REJECT_SMALL] src/core/ScannerRegistry.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/ScannerRegistry.ts

[REJECT_SMALL] src/core/ShellScanner.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/ShellScanner.ts

[REJECT_SMALL] src/core/simulation
  Members: 4
  Depth: 3
  Internal Edges: 3
  External Edges: 5
  Cohesion: 0.375
  Target Concentration: 0.800
  Member Files:
    - src/core/simulation/SimulationSession.ts
    - src/core/simulation/SimulationTargetSelector.ts
    - src/core/simulation/TopologyMutator.ts
    - src/core/simulation/TopologyOverlay.ts

[REJECT_SMALL] src/core/SnapshotSystem.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 5
  Cohesion: 0.000
  Target Concentration: 0.800
  Member Files:
    - src/core/SnapshotSystem.ts

[REJECT_SMALL] src/core/SqlScanner.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/SqlScanner.ts

[REJECT_SMALL] src/core/StateAuditPipeline.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 5
  Cohesion: 0.000
  Target Concentration: 0.800
  Member Files:
    - src/core/StateAuditPipeline.ts

[REJECT_SMALL] src/core/SymbolIndex.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 2
  Cohesion: 0.000
  Target Concentration: 0.500
  Member Files:
    - src/core/SymbolIndex.ts

[REJECT_SMALL] src/core/SynapseIgnore.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/SynapseIgnore.ts

[REJECT_SMALL] src/core/transaction
  Members: 4
  Depth: 3
  Internal Edges: 2
  External Edges: 5
  Cohesion: 0.286
  Target Concentration: 1.000
  Member Files:
    - src/core/transaction/CommitManager.ts
    - src/core/transaction/ExecutionLayer.ts
    - src/core/transaction/ProjectStateSerializer.ts
    - src/core/transaction/VerificationLayer.ts

[REJECT_SMALL] src/core/TransitionGrammar.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/TransitionGrammar.ts

[REJECT_SMALL] src/core/validation
  Members: 3
  Depth: 3
  Internal Edges: 2
  External Edges: 7
  Cohesion: 0.222
  Target Concentration: 0.429
  Member Files:
    - src/core/validation/ArchitectureAuditor.ts
    - src/core/validation/ValidationContext.ts
    - src/core/validation/ValidationEngine.ts

[REJECT_SMALL] src/core/VirtualDebugger.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 5
  Cohesion: 0.000
  Target Concentration: 0.400
  Member Files:
    - src/core/VirtualDebugger.ts

[REJECT_SMALL] src/core/VisibleGraphResolver.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 2
  Cohesion: 0.000
  Target Concentration: 0.500
  Member Files:
    - src/core/VisibleGraphResolver.ts

[REJECT_SMALL] src/core/VscdbAdapter.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/core/VscdbAdapter.ts

[REJECT_SMALL] src/core/WebviewInterceptor.ts
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 1
  Cohesion: 0.000
  Target Concentration: 1.000
  Member Files:
    - src/core/WebviewInterceptor.ts

[REJECT_SMALL] src/vs/editor
  Members: 5
  Depth: 3
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/vs/editor/browser/widget/multiDiffEditor/diffEditorItemTemplate.ts
    - src/vs/editor/common/cursor/cursorDeleteOperations.ts
    - src/vs/editor/common/services/model.ts
    - src/vs/editor/contrib/colorPicker/browser/hoverColorPicker/hoverColorPickerParticipant.ts
    - src/vs/editor/contrib/suggest/browser/suggest.ts

[REJECT_SMALL] src/vs/platform
  Members: 4
  Depth: 3
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/vs/platform/agentHost/electron-browser/localAgentHostService.ts
    - src/vs/platform/agentHost/node/claude/claudeAgentSession.ts
    - src/vs/platform/agentHost/node/codex/protocol/generated/v2/TurnPlanUpdatedNotification.ts
    - src/vs/platform/menubar/electron-main/menubar.ts

[REJECT_SMALL] src/vs/server
  Members: 1
  Depth: 3
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/vs/server/node/remoteExtensionsScanner.ts

[REJECT_SMALL] src/vs/sessions
  Members: 3
  Depth: 3
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackHover.ts
    - src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackItemsBackend.ts
    - src/vs/sessions/contrib/providers/copilotChatSessions/browser/copilotChatSessionsChangesets.ts

[WRAPPER] src/vs/workbench
  Members: 72
  Depth: 3
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/vs/workbench/api/browser/extensionHost.contribution.ts
    - src/vs/workbench/api/browser/mainThreadMessageService.ts
    - src/vs/workbench/api/common/extHost.protocol.ts
    - src/vs/workbench/browser/codeeditor.ts
    - src/vs/workbench/browser/parts/notifications/notificationsToasts.ts
    - src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.ts
    - src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentSessionProjectionActions.ts
    - src/vs/workbench/contrib/chat/browser/agentSessions/experiments/unifiedQuickAccess.ts
    - src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationModelManager.ts
    - src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationWidget.ts
    - src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackEditorActions.ts
    - src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackEditorContribution.ts
    - src/vs/workbench/contrib/chat/browser/tools/clientToolSetsContribution.ts
    - src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatPlanReviewPart.ts
    - src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatToolConfirmationSubPart.ts
    - src/vs/workbench/contrib/chat/browser/widget/input/modePickerActionItem.ts
    - src/vs/workbench/contrib/chat/browser/widgetHosts/chatQuick.ts
    - src/vs/workbench/contrib/chat/browser/widgetHosts/viewPane/chatViewPane.ts
    - src/vs/workbench/contrib/chat/test/browser/planReviewFeedbackService.test.ts
    - src/vs/workbench/contrib/codeEditor/browser/editorSettingsMigration.ts

[REJECT_SMALL] src/vs/workbench/api
  Members: 3
  Depth: 4
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/vs/workbench/api/browser/extensionHost.contribution.ts
    - src/vs/workbench/api/browser/mainThreadMessageService.ts
    - src/vs/workbench/api/common/extHost.protocol.ts

[REJECT_SMALL] src/vs/workbench/browser
  Members: 2
  Depth: 4
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/vs/workbench/browser/codeeditor.ts
    - src/vs/workbench/browser/parts/notifications/notificationsToasts.ts

[REJECT_SMALL] src/vs/workbench/contrib
  Members: 46
  Depth: 4
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.ts
    - src/vs/workbench/contrib/chat/browser/agentSessions/experiments/agentSessionProjectionActions.ts
    - src/vs/workbench/contrib/chat/browser/agentSessions/experiments/unifiedQuickAccess.ts
    - src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationModelManager.ts
    - src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationWidget.ts
    - src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackEditorActions.ts
    - src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackEditorContribution.ts
    - src/vs/workbench/contrib/chat/browser/tools/clientToolSetsContribution.ts
    - src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatPlanReviewPart.ts
    - src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatToolConfirmationSubPart.ts
    - src/vs/workbench/contrib/chat/browser/widget/input/modePickerActionItem.ts
    - src/vs/workbench/contrib/chat/browser/widgetHosts/chatQuick.ts
    - src/vs/workbench/contrib/chat/browser/widgetHosts/viewPane/chatViewPane.ts
    - src/vs/workbench/contrib/chat/test/browser/planReviewFeedbackService.test.ts
    - src/vs/workbench/contrib/codeEditor/browser/editorSettingsMigration.ts
    - src/vs/workbench/contrib/debug/browser/debugHover.ts
    - src/vs/workbench/contrib/editTelemetry/browser/editStats/aiStatsStatusBar.ts
    - src/vs/workbench/contrib/extensions/browser/extensions.contribution.ts
    - src/vs/workbench/contrib/format/browser/format.contribution.ts
    - src/vs/workbench/contrib/inlineChat/browser/inlineChatWidget.ts

[REJECT_SMALL] src/vs/workbench/services
  Members: 19
  Depth: 4
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/vs/workbench/services/assignment/common/assignmentService.ts
    - src/vs/workbench/services/extensions/common/abstractExtensionService.ts
    - src/vs/workbench/services/host/electron-browser/nativeHostService.ts
    - src/vs/workbench/services/keybinding/browser/keyboardLayouts/dk.win.ts
    - src/vs/workbench/services/keybinding/browser/keyboardLayouts/en-intl.darwin.ts
    - src/vs/workbench/services/keybinding/browser/keyboardLayouts/en-uk.win.ts
    - src/vs/workbench/services/keybinding/browser/keyboardLayouts/en.linux.ts
    - src/vs/workbench/services/keybinding/browser/keyboardLayouts/es.darwin.ts
    - src/vs/workbench/services/keybinding/browser/keyboardLayouts/layout.contribution.darwin.ts
    - src/vs/workbench/services/keybinding/browser/keyboardLayouts/no.win.ts
    - src/vs/workbench/services/keybinding/browser/keyboardLayouts/pt-br.win.ts
    - src/vs/workbench/services/keybinding/browser/keyboardLayouts/sv.win.ts
    - src/vs/workbench/services/languageDetection/browser/languageDetectionWebWorker.ts
    - src/vs/workbench/services/languageDetection/browser/languageDetectionWorkerServiceImpl.ts
    - src/vs/workbench/services/policies/browser/accountPolicyGateContribution.ts
    - src/vs/workbench/services/textMate/browser/backgroundTokenization/textMateWorkerTokenizerController.ts
    - src/vs/workbench/services/textMate/browser/backgroundTokenization/threadedBackgroundTokenizerFactory.ts
    - src/vs/workbench/services/textMate/browser/backgroundTokenization/worker/textMateTokenizationWorker.worker.ts
    - src/vs/workbench/services/userDataProfile/browser/settingsResource.ts

[REJECT_SMALL] src/vs/workbench/workbench.common.main.ts
  Members: 1
  Depth: 4
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/vs/workbench/workbench.common.main.ts

[REJECT_SMALL] src/vs/workbench/workbench.web.main.ts
  Members: 1
  Depth: 4
  Internal Edges: 0
  External Edges: 0
  Cohesion: 0.000
  Target Concentration: 0.000
  Member Files:
    - src/vs/workbench/workbench.web.main.ts

