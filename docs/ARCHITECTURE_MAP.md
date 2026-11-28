# SYNAPSE Architecture Map & Reference Index

> **용도:** 본 문서는 코딩/검증 규칙(Rule)이 아닌 **프로젝트 구조 파악 및 맥락 확인용 참조 지도(Reference Map)**입니다.  
> **원칙:** 수정 작업 전 파일 위치와 상태를 확인할 때 참조하며, 코어 헌법(`GEMINI.md`)의 Context Confirmation 원칙을 지원합니다.

---

## 1. SYNAPSE 성숙도 레벨 및 아키텍처 계층 (v0.3.34.41+)

### 1.1 Validation 계층의 독립 (Independent Validation Tier)
Validation Engine은 Reporting의 하위 시스템이 아니라 엔진의 독립 계층으로 승격되었습니다[cite: 2]. 보고서가 결과를 단순히 "말하는" 것이 아니라, 결과를 "추적"할 수 있도록 근거(Provenance)를 제공합니다[cite: 2].

* **Validation Engine (연구자):**
  * `ValidationStudy`: 개별 가설 실험 및 붕괴 관측[cite: 2]
  * `ValidationClaim`: 증명된 명제[cite: 2]
  * `ValidationRegistry`: 다중 시나리오 상태 저장소[cite: 2]
  * `ValidationPipeline`: 시뮬레이션 및 데이터 주입 오케스트레이션[cite: 2]
  * `ProvenanceTracking`: `ValidationClaim` ↔ `ValidationStudy` ↔ `supportingStudyIds`를 연결하여 100% 격리된 로컬 증거(Strength, Quality) 산출[cite: 2]
* **Report Builder (출판사):**
  * 엔진이 증명한 `SUPPORTED` 상태의 데이터만을 선별하여 정제 후 렌더링 (레거시 Rule-based 추천 로직 완전 배제)[cite: 2]
* **Evidence Flow 진화:**
  * Legacy: `Scanner → Graph → Report`[cite: 2]
  * Current (v0.3.34.41+): `Scanner → Graph → Validation Study → Validation Claim → Report`[cite: 2]

### 1.2 성숙도 레벨 (Maturity Levels)
* **Level 1:** Static Inventory (단순 정적 목록) ✅ 통과[cite: 2]
* **Level 2:** Dependency Analysis (구조 관찰 및 원인 후보 제시) ✅ 통과[cite: 2]
* **Level 3:** Architectural Diagnostics (반복 검증된 가설) ✅ 도달[cite: 2]
* **Level 3.5:** Validation Engine (현재 상태) 📍[cite: 2]
* **Level 4:** Cross-Project Patterns (보편적 패턴 발견 — NestJS, AntennaPod, Linux Kernel 등 횡단 검증 필요)[cite: 2]
* **Level 5:** Decision Support (실제 작업 의사결정 및 자동 리팩토링 제안 — 보류)[cite: 2]

> *현재 위치: 숙련된 엔지니어가 검토를 전제로 작업 우선순위를 정하는 데는 신뢰할 수 있으나(Level 3.5), 보고서만 보고 바로 코드를 뜯어고치는 자동 의사결정 엔진(Level 5)은 아직 아님[cite: 2].*

### 1.3 핵심 기술 부채 (Tech Debt Backlog)
* [ ] **Cost Estimation Engine 부재:** 구조 변경 시 수정 파일 수 및 작업량 평가 지표 없음[cite: 2].
* [ ] **Risk Estimation Engine 부재:** 런타임 파괴, API 호환성 붕괴 등 기능적 위험성 평가 지표 없음[cite: 2].
* [ ] **Cross-Project Validation 확장:** 단일 데이터셋 과적합 방지 및 횡단 검증 확대[cite: 2].
* [ ] **Measured Evidence 체계:** 모의/시뮬레이션을 넘어선 실제 런타임 계측 증거 보강[cite: 2].

---

## 2. ROOT Structure (디렉터리 트리 및 산출물)
*Last Updated: v0.3.34.76 (2026-11-28)*

### 2.1 📂 Source Directory Tree (v0.3.34.76)
```text
.
├── .agents
│   ├── rules
│   │   ├── canvas-rendering.md
│   │   ├── core-pipeline-ssot.md
│   │   └── reporting-layer.md
│   └── skills
│       ├── edit-report
│       │   └── SKILL.md
│       ├── milestone-release
│       │   └── SKILL.md
│       └── synapse-validation
│           └── SKILL.md
├── demo
│   └── canvas-engine.js
├── docs
│   ├── ARCHITECTURE_MAP.md
│   └── determinism.md
├── scripts
│   ├── debug
│   │   └── debug_entrypoint_detector.ts
│   ├── validation
│   │   ├── godot_phase_b_allow_ids.json
│   │   ├── phase_b_transformer.ts
│   │   ├── resolver_trace_audit.ts
│   │   ├── simulate_l3_differential.ts
│   │   ├── simulate_path_normalization.ts
│   │   ├── simulate_role_classification.ts
│   │   ├── verify_phase_c_filter_cleanup.ts
│   │   └── vscode_phase_b_allow_ids.json
│   ├── audit_extension_clusters.ts
│   ├── create-account.js
│   ├── extension_discovery_audit.ts
│   ├── run-validation-pipeline.ts
│   ├── run_reasoning_on_real_graph.ts
│   ├── test_architecture_dependency_audit.ts
│   ├── test_architecture_verification_26.ts
│   ├── test_architecture_verification_27.ts
│   ├── test_architecture_verification_28_29.ts
│   ├── test_architecture_verification_30.ts
│   ├── test_generate.ts
│   ├── test_local_header.ts
│   ├── test_local_header2.ts
│   ├── test_regression.ts
│   ├── test_scope_resolver.ts
│   ├── test_session_bug.ts
│   ├── update_project_state.ts
│   ├── verify_anomaly_collector.ts
│   ├── verify_atomic_ssot_replacement.ts
│   ├── verify_layout_storage.ts
│   ├── verify_o2_pipeline.ts
│   ├── verify_partial_match_members.ts
│   └── verify_user_graph_storage.ts
├── src
│   ├── analysis
│   │   └── hintEngine.ts
│   ├── bootstrap
│   │   └── BootstrapEngine.ts
│   ├── cli
│   │   ├── BatchRunner.ts
│   │   ├── ProjectAnalyzer.ts
│   │   ├── ReportVerifier.ts
│   │   ├── SummaryGenerator.ts
│   │   ├── ast_verification_engine.ts
│   │   ├── audit_evidence.ts
│   │   ├── audit_gate_g.ts
│   │   ├── audit_gate_i.ts
│   │   ├── audit_gate_j.ts
│   │   ├── audit_gate_k.ts
│   │   ├── audit_gate_l.ts
│   │   ├── audit_gate_m.ts
│   │   ├── audit_gate_n_series.ts
│   │   ├── audit_gate_o_series.ts
│   │   ├── audit_phase_12_2_5_coordination_audit.ts
│   │   ├── audit_phase_12_2_6_5_service_investigation.ts
│   │   ├── audit_phase_12_2_6_revalidation.ts
│   │   ├── audit_phase_12_3_determinism_and_regression.ts
│   │   ├── audit_phase_12_4_5_dossier.ts
│   │   ├── audit_phase_12_4_falsification.ts
│   │   ├── audit_phase_12_5_final_report.ts
│   │   ├── audit_phase_12_7_generalization.ts
│   │   ├── audit_phase_12_7_v2_discovery.ts
│   │   ├── audit_phase_12_7_v3_minimal_search.ts
│   │   ├── audit_phase_12_7_v4_hub_vs_authority.ts
│   │   ├── audit_phase_12_7_v5_essence.ts
│   │   ├── audit_phase_12_7_v6_constraint_falsification.ts
│   │   ├── audit_phase_12_7_v7_constraint_taxonomy.ts
│   │   ├── audit_phase_12_adversarial.ts
│   │   ├── audit_phase_12_known_truth.ts
│   │   ├── audit_phase_12_known_truth_vscode.ts
│   │   ├── audit_pipeline.ts
│   │   ├── b5_validation_layer.ts
│   │   ├── community_edge_audit.ts
│   │   ├── core_metrics_lab.ts
│   │   ├── generate_drift_report.ts
│   │   ├── generate_surgery_report.ts
│   │   ├── run_b5_bundle.ts
│   │   ├── run_census.ts
│   │   ├── run_placement_analysis.ts
│   │   ├── run_signal_census.ts
│   │   ├── run_stability_report.ts
│   │   ├── run_synapse_actual_census.ts
│   │   ├── signal_laboratory.ts
│   │   ├── stage_a5_validator.ts
│   │   ├── test_bundle_generator.ts
│   │   ├── test_entry_point.ts
│   │   ├── test_o2_generation.ts
│   │   ├── test_o2_lineage.ts
│   │   └── verify_determinism.ts
│   ├── core
│   │   ├── analysis
│   │   │   ├── aggregation
│   │   │   ├── analyzers
│   │   │   ├── ast
│   │   │   ├── intent
│   │   │   ├── patterns
│   │   │   ├── pipeline
│   │   │   ├── providers
│   │   │   ├── reasoning
│   │   │   ├── semantic
│   │   │   ├── ArchitectureAnalysisEngine.ts
│   │   │   ├── ArchitectureHeaderPolicy.ts
│   │   │   ├── ClusterBridgeAnalyzer.ts
│   │   │   ├── ContractHeaderPolicy.ts
│   │   │   ├── GraphViewBuilder.ts
│   │   │   ├── InterventionSimulator.ts
│   │   │   ├── PlatformHeaderPolicy.ts
│   │   │   ├── ReportExporter.ts
│   │   │   ├── ScopeResolver.ts
│   │   │   ├── SemanticContext.ts
│   │   │   ├── TargetSelector.ts
│   │   │   └── types.ts
│   │   ├── benchmark
│   │   │   ├── BenchmarkGraphGenerator.ts
│   │   │   └── BenchmarkHarness.ts
│   │   ├── build
│   │   │   ├── BuildMetadataAdapter.ts
│   │   │   └── BuildMetadataTypes.ts
│   │   ├── canvas-engine
│   │   │   ├── CanvasEngine.ts
│   │   │   ├── Intent.ts
│   │   │   ├── PhaseGate.ts
│   │   │   ├── RenderProtocol.ts
│   │   │   ├── RuleEngine.ts
│   │   │   ├── ScenarioRunner.ts
│   │   │   ├── SpatialRuleBook.ts
│   │   │   ├── StateManager.ts
│   │   │   ├── ValidationHarness.ts
│   │   │   └── VisualRuleBook.ts
│   │   ├── collaboration
│   │   │   ├── AccountManager.ts
│   │   │   ├── ArchitectureIndexBuilder.ts
│   │   │   ├── BoundaryGuard.ts
│   │   │   ├── CollaborationTransport.ts
│   │   │   ├── CompareEngine.ts
│   │   │   ├── CompareProjection.ts
│   │   │   ├── EdgeGenerator.ts
│   │   │   ├── HarvestEngine.ts
│   │   │   ├── HarvestProjection.ts
│   │   │   ├── HarvestSessionManager.ts
│   │   │   ├── IdentityManager.ts
│   │   │   ├── MountManager.ts
│   │   │   ├── ReferenceVerifier.ts
│   │   │   ├── RemoteLayerProjector.ts
│   │   │   ├── RestCollaborationTransport.ts
│   │   │   ├── RuntimeInitializer.ts
│   │   │   └── SessionManager.ts
│   │   ├── ir
│   │   │   ├── evaluators
│   │   │   ├── generators
│   │   │   ├── models
│   │   │   ├── promoters
│   │   │   └── ArchitectureIrBuilder.ts
│   │   ├── layout
│   │   │   ├── LayoutStorage.ts
│   │   │   └── UserGraphStorage.ts
│   │   ├── metrology
│   │   │   ├── Reengineering
│   │   │   ├── Verification
│   │   │   ├── __tests__
│   │   │   ├── AgreementMatrixBuilder.ts
│   │   │   ├── AmplificationTracker.ts
│   │   │   ├── BenchmarkSnapshotter.ts
│   │   │   ├── BlindSpotMapper.ts
│   │   │   ├── CostProfiler.ts
│   │   │   ├── PropertyRegistry.ts
│   │   │   └── index.ts
│   │   ├── projection
│   │   │   ├── ProjectionLayer.ts
│   │   │   └── RuleStore.ts
│   │   ├── reasoning
│   │   │   ├── analysis
│   │   │   ├── analyzers
│   │   │   ├── answers
│   │   │   ├── builder
│   │   │   ├── builders
│   │   │   ├── evidence
│   │   │   ├── model
│   │   │   ├── ontology
│   │   │   ├── pipeline
│   │   │   ├── rules
│   │   │   ├── signal
│   │   │   ├── snapshot
│   │   │   └── ReasoningPipelineRunner.ts
│   │   ├── reporting
│   │   │   ├── ArchitectReportBuilder.ts
│   │   │   ├── BoundaryAnalysisReportBuilder.ts
│   │   │   ├── EvidenceViewerBuilder.ts
│   │   │   ├── FindingReportAdapter.ts
│   │   │   ├── FrontierPartitioner.ts
│   │   │   ├── InsightEngine.ts
│   │   │   ├── OnboardingAnalyzer.ts
│   │   │   ├── OnboardingReportBuilder.ts
│   │   │   ├── ParetoFrontier.ts
│   │   │   ├── ReportBundleGenerator.ts
│   │   │   ├── ReportContract.ts
│   │   │   ├── RiskClassifier.ts
│   │   │   ├── RiskVectorBuilder.ts
│   │   │   ├── RootCauseAggregator.ts
│   │   │   ├── RootCauseAggregator.ts.patch
│   │   │   ├── ValidationRenderer.ts
│   │   │   └── types.ts
│   │   ├── resolvers
│   │   │   ├── LanguageResolver.ts
│   │   │   └── TypeScriptResolver.ts
│   │   ├── simulation
│   │   │   ├── evidence
│   │   │   ├── propagation
│   │   │   ├── scenario
│   │   │   ├── state
│   │   │   ├── SimulationBoundaryResolver.ts
│   │   │   ├── SimulationProjectionBuilder.ts
│   │   │   ├── SimulationScopeResolver.ts
│   │   │   ├── SimulationSession.ts
│   │   │   ├── SimulationSnapshot.ts
│   │   │   ├── SimulationTargetSelector.ts
│   │   │   ├── TopologyMutator.ts
│   │   │   └── TopologyOverlay.ts
│   │   ├── transaction
│   │   │   ├── CommitManager.ts
│   │   │   ├── ExecutionLayer.ts
│   │   │   ├── ProjectStateSerializer.ts
│   │   │   └── VerificationLayer.ts
│   │   ├── validation
│   │   │   ├── AccuracyBenchmark.ts
│   │   │   ├── ArchitectureAuditor.ts
│   │   │   ├── BaselineTruthDataset.ts
│   │   │   ├── ValidationContext.ts
│   │   │   ├── ValidationEngine.ts
│   │   │   └── ValidationReportBuilder.ts
│   │   ├── AiOrchestrator.ts
│   │   ├── AnomalyCollector.ts
│   │   ├── ArchitectureDSL.ts
│   │   ├── BillingManager.ts
│   │   ├── BlacklistOrchestrator.ts
│   │   ├── BoundsDiagnosticReporter.ts
│   │   ├── CDPManager.ts
│   │   ├── ClusterBuilder.ts
│   │   ├── ClusterHierarchy.ts
│   │   ├── CommandInterceptor.ts
│   │   ├── CommunityDetector.ts
│   │   ├── ConfigScanner.ts
│   │   ├── ControlSystem.ts
│   │   ├── CppScanner.ts
│   │   ├── DataPipeline.ts
│   │   ├── DatabaseEngine.ts
│   │   ├── DebuggerSystem.ts
│   │   ├── DiagnosticReporter.ts
│   │   ├── DirectChatScraper.ts
│   │   ├── DirectoryTreeBuilder.ts
│   │   ├── EdgeBuilder.ts
│   │   ├── EdgeCodeRefactorer.ts
│   │   ├── ExternalReferenceSemantics.ts
│   │   ├── FailurePropagator.ts
│   │   ├── FileScanner.ts
│   │   ├── FlowScanner.ts
│   │   ├── FlowchartGenerator.ts
│   │   ├── GeminiParser.ts
│   │   ├── GhostClassifier.ts
│   │   ├── GhostExpander.ts
│   │   ├── GhostPolicy.ts
│   │   ├── GoScanner.ts
│   │   ├── GraphAnalyzer.ts
│   │   ├── GraphModel.ts
│   │   ├── GridSystem.ts
│   │   ├── JVMAuditor.ts
│   │   ├── JavaScanner.ts
│   │   ├── JsTsScanner.ts
│   │   ├── KotlinScanner.ts
│   │   ├── LayoutDiagnosticReporter.ts
│   │   ├── LayoutEngine.ts
│   │   ├── LogicAnalyzer.ts
│   │   ├── MarkdownScanner.ts
│   │   ├── NodeBuilder.ts
│   │   ├── PbSessionWatcher.ts
│   │   ├── PhaseManager.ts
│   │   ├── ProjectMetadata.ts
│   │   ├── PromptLogger.ts
│   │   ├── PythonScanner.ts
│   │   ├── ReferenceResolver.ts
│   │   ├── RendererCore.ts
│   │   ├── ReportExporter.ts
│   │   ├── RuleEngine.ts
│   │   ├── RustScanner.ts
│   │   ├── ScannerRegistry.ts
│   │   ├── ShellScanner.ts
│   │   ├── SnapshotSystem.ts
│   │   ├── SqlScanner.ts
│   │   ├── StateAuditPipeline.ts
│   │   ├── SymbolIndex.ts
│   │   ├── SynapseIgnore.ts
│   │   ├── TransitionGrammar.ts
│   │   ├── VirtualDebugger.ts
│   │   ├── VisibleGraphResolver.ts
│   │   ├── VscdbAdapter.ts
│   │   ├── WebviewInterceptor.ts
│   │   ├── filterSnapshot.ts
│   │   └── graphBuilder.ts
│   ├── explorer
│   │   └── ArchitectureExplorer.ts
│   ├── rust_checker
│   │   ├── mod.rs
│   │   ├── reporter.rs
│   │   └── state_checker.rs
│   ├── server
│   │   ├── register-vscode-mock.ts
│   │   ├── server.ts
│   │   ├── standalone.ts
│   │   └── vscode.ts
│   ├── test
│   │   ├── __mocks__
│   │   │   └── vscode.ts
│   │   ├── diagnostic_log_policy.test.ts
│   │   ├── intervention_stability.test.ts
│   │   ├── phase1_validation.test.ts
│   │   ├── phase2_validation.test.ts
│   │   ├── security_integration.test.ts
│   │   └── security_regression.test.ts
│   ├── types
│   │   ├── metrology.ts
│   │   └── schema.ts
│   ├── utils
│   │   ├── ChatExtractor.ts
│   │   ├── Logger.ts
│   │   ├── SensitiveInfoMasker.ts
│   │   ├── determinism.ts
│   │   ├── exclusionRules.ts
│   │   ├── hash_utils.ts
│   │   └── visualHints.ts
│   ├── vs
│   │   ├── base
│   │   │   └── common
│   │   ├── editor
│   │   │   ├── browser
│   │   │   ├── common
│   │   │   └── contrib
│   │   ├── platform
│   │   │   ├── agentHost
│   │   │   ├── menubar
│   │   │   └── registry.ts
│   │   ├── server
│   │   │   └── node
│   │   ├── sessions
│   │   │   └── contrib
│   │   └── workbench
│   │       ├── api
│   │       ├── browser
│   │       ├── contrib
│   │       ├── services
│   │       ├── api.ts
│   │       ├── workbench.common.main.ts
│   │       └── workbench.web.main.ts
│   ├── webview
│   │   └── CanvasPanel.ts
│   ├── cli.ts
│   ├── client.ts
│   ├── extension.ts
│   ├── main.ts
│   ├── test-webview.ts
│   └── verify_v0.3.10.ts
├── ui
│   ├── canvas-engine.js
│   ├── canvas-engine.js.orig
│   ├── canvas-engine.js.patch
│   ├── canvas-engine.js.rej
│   ├── cluster-hierarchy.js
│   ├── engine-core.js
│   ├── i18n.js
│   ├── index.html
│   ├── rbush.js
│   ├── synapse-theme.js
│   └── webgl-renderer.js
├── AGENTS.md
├── GEMINI.md
├── LICENSE
├── README.ko.md
├── README.md
├── REVISION_HISTORY.md
├── RULES.md
├── build-guard.js
├── package-lock.json
├── package.json
├── robots.txt
├── synapse-visual-architecture-v0.3.34.73_fix1.vsix
├── synapse-visual-architecture-v0.3.34.74.vsix
├── synapse-visual-architecture-v0.3.34.75.vsix
├── synapse-visual-architecture-v0.3.34.76.vsix
├── synapse.config.json
├── tsconfig.json
└── webpack.config.js
```[cite: 2]

### 2.2 🧪 TESTED Section (Generated Artifacts & Garbage)
런타임 또는 테스트 실행 중 생성되는 출력/격리 디렉토리 목록입니다 (Source of Truth 구성 요소 아님)[cite: 2]:
* `synapse_report/` — 시냅스 정규 리포트 출력[cite: 2]
* `scratch/` — 검증용 일회성 스크립트, 러너, 덤프 및 테스트 스크래치[cite: 2]

---

## 3. File Index (파일별 역할 및 상태 설명)

| 파일/폴더 경로 | 상태 | 주요 역할 및 기능 설명 |
| :--- | :--- | :--- |
| `src/core/build/` | 🟢 Active (v0.3.34.74) | 빌드 산출물 메타데이터 수집 어댑터 (`BuildMetadataAdapter.ts`, `BuildMetadataTypes.ts`)[cite: 2] |
| `src/core/analysis/ScopeResolver.ts` | 🟢 Active (v0.3.34.75) | Tier 3 선언적 범위 제외 해석기 (CLI > ENV > `.vscode/settings.json` JSONC > `synapse.config.json` First-Win, `parseJsonc()`, `buildPatternForTarget()`, `toggleScopeExclusion()`) |
| `src/core/layout/` | 🟢 Active (v0.3.34.75) | `LayoutStorage.ts`, `UserGraphStorage.ts` — UI 캔버스 좌표 분리 저장소 및 사용자 오버레이 레이어 저장소 (`project_state.json` 불변 격리) |
| `src/core/analysis/patterns/detectors/EntryPointDetector.ts` | 🟢 Active (v0.3.34.76) | O2 정적 의존성 루트(`STATIC DEPENDENCY ROOT`) 감지기 (`inDegree=0 && outDegree>0`); `NodeRole.TEST` 필터링 + `ScopeResolver` 기반 O2 후보 제외, Evidence `description` 정적 의존성 루트 문구 정합화 (`type: "EXECUTION_METRIC"` 호환 유지) |
| `src/core/analysis/patterns/detectors/SystemCoreDetector.ts` | 🟢 Active (v0.3.34.75) | 시스템 코어(A1) 감지기; 레거시 `testNodeRatio >= 0.8` 필터 제거, `ScopeResolver` Full-Match 제외 및 Partial-Match 메타데이터 기록, P90 컷오프 및 결정론적 2차 정렬 |
| `src/core/analysis/patterns/detectors/ChangeAmplifierDetector.ts` | 🟢 Active (v0.3.34.75) | 변경 증폭기(E2) 감지기; 레거시 `testNodeRatio >= 0.8` 필터 제거, `ScopeResolver` Full-Match 제외 및 Partial-Match 메타데이터 기록, P90 컷오프 및 결정론적 2차 정렬 |
| `src/core/reporting/FindingReportAdapter.ts` | 🟢 Active (v0.3.34.76) | E2, O2, A1~A5 정규 리포트 본문 렌더링, O2 제목(`Architecture Exploration Candidates (Static Dependency Roots)`)·Finding 리드·런타임 실행 진입점/최적 읽기 순서 비보장 `> Note:` 반영 (`onboarding.entry_points` 키 유지), Partial-Match `Scope Status` 렌더링, `toPrecision(3)` 가드 및 모수 비율 동기화 |
| `src/core/reporting/ReportBundleGenerator.ts` | 🟢 Active (v0.3.34.75) | 3대 정규 보고서(`ARCHITECT_REPORT`, `ONBOARDING_REPORT`, `SIMULATION_DEBUG`) 생성기; `Declared Scope Exclusions` / `Scope Exclusion Accounting` 헤더 렌더링 및 `context.workspaceRoot` 자동 보완 |
| `src/core/reporting/ReportContract.ts` | 🟢 Active (v0.3.34.76) | A1~O2 리포트 지원 패턴, 허용 증거, A1 controlScore 및 O2 `interpretationGuide`(정적 의존성 루트 정의 및 실행 진입점/최적 읽기 순서 비보장) 해석 가이드 명세 |
| `src/core/reporting/BoundaryAnalysisReportBuilder.ts` | 🟡 Diagnostic | 정규 계약을 우회하는 디버그/진단용 덤프 빌더 (`REJECTED_CANDIDATE` 기록 용도)[cite: 2] |
| `src/core/ReferenceResolver.ts` | 🟢 Active (v0.3.34.74) | 참조/심볼 해석기; Rust `Cargo.toml` 로컬 크레이트 경로 매핑 및 미초기화 서브모듈 방어[cite: 2] |
| `src/core/NodeBuilder.ts` | 🟢 Active (v0.3.34.75) | 노드 생성기; 루트 `tests/...` 경로를 포함한 세그먼트 기반 `NodeRole.TEST` 분류 보강 및 빌드 자산 격리 |
| `package.json` | 🟢 Active (v0.3.34.75) | VS Code 확장 메타데이터(`"version": "0.3.34"` 동결), `synapse.toggleScopeExclusion` 커맨드·탐색기 메뉴 등록, Jest `<rootDir>/src/test/**/*.test.ts` 한정 |
| `build-guard.js` | 유지 | 마일스톤 및 릴리즈 노트 유효성 자동 검증 배포 통제 스크립트[cite: 2] |
| `RULES.md` | 유지 | 프로젝트 코딩 규칙 및 아키텍처 제약 문서[cite: 2] |
| `synapse.config.json` | 유지 | 시냅스 아키텍처 규칙 및 `scopeExclusions` 설정 보관 파일 |
| `.synapseignore` | 유지 | Gitignore-style 제외 패턴; 프로젝트 스캔/분석/시각화에서 파일 필터링[cite: 2] |
| `.agents/rules/` | 🟢 Active (v0.3.34.76) | `AGENTS.md` 하네스 라우팅 도메인 불변 규칙 3종 (`canvas-rendering.md`, `core-pipeline-ssot.md`, `reporting-layer.md`) |
| `.agents/skills/` | 🟢 Active (v0.3.34.76) | `AGENTS.md` 하네스 라우팅 작업 워크플로우 스킬 3종 (`edit-report`, `milestone-release`, `synapse-validation`) |
| `ui/index.html` | 변경됨 | 캔버스 웹뷰 마크업 및 UI 요소 (`LINES (No Badges)` 엣지 가시성 버튼 포함)[cite: 2] |
| `ui/synapse-theme.js` | 유지 | 웹뷰 전용 UI 테마 컬러 및 스타일링 데이터[cite: 2] |
| `ui/i18n.js` | 🟢 Active | 정적 마크업 메뉴, 버튼, 패널 제목 다국어 지원 로직 (`data-i18n`)[cite: 2] |
| `ui/canvas-engine.js` | 🟢 Active (v0.3.34.75) | O(N) 순회 병목 제거, RBush 최적화, Layout Graph = Visible Graph 동기화 및 `reportBusyState` / `window.__setSynapseReportBusy` 리포트 중복 클릭 방지 가드 |
| `ui/cluster-hierarchy.js` | 🟢 Active | 클러스터 계층 및 바운딩 연산 분리 로직[cite: 2] |
| `ui/rbush.js` | 🟢 Active | 2D 뷰포트 컬링용 공간 인덱싱 라이브러리[cite: 2] |
| `ui/webgl-renderer.js` | 유지 | 대규모 노드 그래프 실시간 60FPS GPU 파이프라인 가속 렌더러[cite: 2] |
| `ui/engine-core.js` | 유지 | 캔버스 엔진 + WebGL 렌더러 간 공통 코어 로직 및 상태 브릿지[cite: 2] |
| `src/extension.ts` | 🟢 Active (v0.3.34.75) | VS Code Extension 진입점 및 탐색기 우클릭 분석 제외 토글 커맨드(`synapse.toggleScopeExclusion`, 다중 선택 지원) 등록 |
| `src/cli.ts` / `src/client.ts` | 유지 | 터미널 기반 CLI 제어 및 외부 클라이언트 연동 인터페이스[cite: 2] |
| `src/verify_v0.3.10.ts` | Standalone | v0.3.10 규격 검증용 독립 실행 스크립트[cite: 2] |
| `src/types/schema.ts` | 수정 | 노드, 엣지, 클러스터 타입스크립트 인터페이스 + `SubmissionSnapshot`/`ReviewState`/`RemoteEditAction`/`clientLayer` (v0.3.30)[cite: 2] |
| `src/core/canvas-engine/` | Active | `CanvasEngine`, `Intent`, `PhaseGate`, `StateManager`, `RuleEngine`, `VisualRuleBook`, `SpatialRuleBook`, `ValidationHarness`, `ScenarioRunner`, `RenderProtocol` (10개 파일)[cite: 2] |
| `src/core/transaction/` | Active | `CommitManager`, `ExecutionLayer`, `VerificationLayer`, `ProjectStateSerializer` — 상태 변경 트랜잭션 무결성 검증[cite: 2] |
| `src/core/projection/` | Active | `ProjectionLayer`, `RuleStore` — 추상화된 설계 룰을 시각적 레이어에 투영[cite: 2] |
| `src/core/reporting/` | 🟢 Active (v0.3.34.76) | `ReportBundleGenerator`, `FindingReportAdapter`, `ReportContract`, `EvidenceViewerBuilder` 중심의 3대 정규 보고서 파이프라인 (`OnboardingReportBuilder.ts`는 v0.3.34.71 이후 정규 온보딩 번들 경로 미호출, 파일·미사용 import만 잔존) |
| `src/core/simulation/` | 🟢 Active | `TopologyOverlay`, `SimulationSession`, `DiffBuilder` — 기존 구조 파괴 없이 가상 Action과 Undo를 테스트하는 What-if 시뮬레이터[cite: 2] |
| `src/core/StateAuditPipeline.ts` | 🟢 Active | Anomaly, FSMAudit, Propagation을 연결하는 뷰/시뮬레이션 전단 오케스트레이터[cite: 2] |
| `src/core/FailurePropagator.ts` | 🟢 Active | 노드 고장에 따른 정적 파급 효과(Blast Radius) 연산기 (`IGraphView` 추상화)[cite: 2] |
| `src/core/ProjectMetadata.ts` | Active | Server-owned project boundary manager (싱글톤, UUID, 경로 검증, `SymbolIndex` 통합)[cite: 2] |
| `src/core/SymbolIndex.ts` | Active | Cross-file registry (`FolderTree` + `FileRegistry` + `FunctionCatalog`, `.synapseignore` 필터링)[cite: 2] |
| `src/core/DataPipeline.ts` | 🟢 Active (v0.3.34.75) | 물리 파일 시스템 스캔 → 노드/엣지/클러스터 추출, `📁 Root` 배정 및 `diagnostic_log.txt` `SYNAPSE_WRITE_DIAGNOSTIC_LOG=1` Opt-In 가드(기본 OFF) |
| `src/core/RendererCore.ts` | Active | 렌더러 생명주기 관리 및 WebGL/Canvas 2D 전환 브릿지[cite: 2] |
| `src/core/RuleEngine.ts` | 🟡 Modified | 핵심 규칙 검증 엔진 + 블랙리스트 폴더(`synapse_report` 등) 자동 무시 처리[cite: 2] |
| `src/core/GraphModel.ts` | Active | 그래프 데이터 모델 (노드/엣지 CRUD, 직렬화)[cite: 2] |
| `src/core/BlacklistOrchestrator.ts` | Active | 노이즈 폴더(`dist`, `node_modules` 등) O(1) 하이브리드 블랙리스트 필터[cite: 2] |
| `src/core/FileScanner.ts` | Active | 단일 파일 단위 소스 분석 및 의존성 추출 (`[SYNAPSE_NETWORK_LINK]` 정규식 파싱 포함)[cite: 2] |
| `src/core/FlowScanner.ts` / `FlowchartGenerator.ts` | Active | 파일 간 데이터 흐름 분석 및 계층형 플로우차트 생성 (DFS Rank 할당, Logic Inversion)[cite: 2] |
| `src/core/LogicAnalyzer.ts` | 🟡 Modified | 스키마 무결성 검증 및 아키텍처 논리 분석 (`LOGIC_REPORT.md` 생성 폴더를 `synapse_report`로 격리)[cite: 2] |
| `src/core/GeminiParser.ts` / `ChatExtractor.ts` | Active | Gemini/Copilot 대화 데이터 파싱 및 추출 유틸리티[cite: 2] |
| `src/core/graphBuilder.ts` | Active | 스캔된 소스 → 그래프 구조화 빌더[cite: 2] |
| `src/core/DatabaseEngine.ts` | Active | VS Code `globalState` 기반 KV 스토리지 (`billing_meta`, `managed_nodes`)[cite: 2] |
| `src/core/PromptLogger.ts` | Active | 세션/대화 로그 기록 엔진 (`audit` + `session.md`)[cite: 2] |
| `src/core/DebuggerSystem.ts` / `ControlSystem.ts` | Active | 디버깅 트리거 아키텍처 및 시스템 제어 명령어 피드백 루프[cite: 2] |
| `src/core/AiOrchestrator.ts` | Active | AI 에이전트 오케스트레이션 (`PhaseGate`/`Mutation`)[cite: 2] |
| `src/core/*Scanner.ts` | Active | 언어별 소스 스캐너 (`PythonScanner`, `RustScanner`, `JsTsScanner`, `MarkdownScanner`, `CppScanner`, `GoScanner`, `JavaScanner`, `KotlinScanner`, `SqlScanner`, `ShellScanner`, `ConfigScanner`)[cite: 2] |
| `src/core/PhaseManager.ts` / `SnapshotSystem.ts` | Active | Phase 상태 전이 및 프로젝트 상태 스냅샷 저장/복원 (체크섬/메타데이터 포함)[cite: 2] |
| `src/core/GridSystem.ts` | Active | 캔버스 그리드 시스템 및 스냅 정렬[cite: 2] |
| `src/core/VirtualDebugger.ts` | 🟢 Active (v0.3.34.75) | 가상 디버거, `temp_target_state.json` `synapse_report` 격리 생성 및 `surgeryReportError` 오류 전파 |
| `src/core/EdgeCodeRefactorer.ts` / `PbSessionWatcher.ts` | Active | 엣지 코드 리팩터링 검증 도구 및 Protobuf 세션 파일 감시 트리거[cite: 2] |
| `src/core/filterSnapshot.ts` / `JVMAuditor.ts` | Active | 스냅샷 레이어 필터링 및 Java/Kotlin 클래스 기반 구조 무결성 오디팅[cite: 2] |
| `src/core/ReportExporter.ts` / `VscdbAdapter.ts` | Active | 리포트 내보내기(`synapse_report` 격리) 및 VS Code DB 어댑터[cite: 2] |
| `src/core/SynapseIgnore.ts` | Active | `.synapseignore` 로드/매칭/통합 파서[cite: 2] |
| `src/core/BillingManager.ts` | **Legacy** | 상용화 과금 뼈대 (Free node/session limit + Pro mode, 현재 Dev 강제 Pro)[cite: 2] |
| `src/core/WebviewInterceptor.ts` / `CommandInterceptor.ts` / `CDPManager.ts` / `DirectChatScraper.ts` / `ArchitectureDSL.ts` | **Orphaned** | 과거 Ghost Protocol, 와일드카드 요격, 하드카피 스크래퍼, YAML DSL 파서 (v0.3.10+ 미사용 격리)[cite: 2] |
| `src/core/collaboration/*` | Active | `IdentityManager`, `SessionManager`, `RuntimeInitializer`, `CompareEngine`, `HarvestSessionManager`, `RemoteLayerProjector`, `ArchitectureIndexBuilder`, `ReferenceVerifier`, `HarvestEngine`, `BoundaryGuard`, `MountManager`, `AccountManager`, `CollaborationTransport`, `RestCollaborationTransport`[cite: 2] |
| `src/core/GhostClassifier.ts` / `ExternalReferenceSemantics.ts` | 🟢 Active | 고스트 노드 유형 분류 및 외부 참조 시맨틱 파악 모듈[cite: 2] |
| `src/core/ClusterBuilder.ts` / `NodeBuilder.ts` | 🟡 Modified | 클러스터 생성기(유령 클러스터 프로브) 및 노드 생성기(`NodeRole.TEST` 태깅)[cite: 2] |
| `src/analysis/hintEngine.ts` / `src/bootstrap/BootstrapEngine.ts` | 🟢 Active (v0.3.34.75) | 실시간 진단 힌트(R1~R5) 및 SSoT(`project_state.json`) 단일 쓰기 소유권·Re-Bootstrap(`liteBootstrap`) 원자적 교체(`atomicSaveProjectState`) 엔진 |
| `src/rust_checker/` / `src/explorer/` | Active | Rust 프로젝트 종속성 분석기(`mod.rs`, `reporter.rs`, `state_checker.rs`) 및 아키텍처 탐색기[cite: 2] |
| `src/server/*` | Active | LSP 서버(`server.ts`), 독립 실행 모드(`standalone.ts`), VS Code API mock(`vscode.ts`, `register-vscode-mock.ts`)[cite: 2] |
| `src/utils/*` | Active | `Logger.ts`, `SensitiveInfoMasker.ts`, `determinism.ts`, `exclusionRules.ts`, `hash_utils.ts`, `visualHints.ts`[cite: 2] |
| `src/webview/CanvasPanel.ts` | 🟢 Active (v0.3.34.75) | 웹뷰 캔버스 패널; SSoT 쓰기 0건(Zero-Write), Re-Bootstrap 편집 차단 가드(`checkEditBlocked`), `workspaceRoot` 전달, `withProgress` 진행 알림·중복 실행 잠금(`_isGeneratingReport`), `surgeryReportError` 표출 |
| `src/test/*` | 🟢 Active (v0.3.34.75) | `diagnostic_log_policy.test.ts`, `intervention_stability.test.ts`, `phase1_validation.test.ts`, `phase2_validation.test.ts`, `security_integration.test.ts`, `security_regression.test.ts` (`6/6` 스위트, `40/40` 테스트) |

> **삭제 및 격리 이전된 파일:** `test_scan.ts`, `GhostNodeManager.ts`, `ContextVault.ts`, `SubmissionManager.ts`, `tools/*`, `phase3_validation.test.ts ~ transport_validation.test.ts` 등 삭제 완료, v0.3.34.74에서 임시 진단 스크립트 `scratch/`로 격리, v0.3.34.75에서 0바이트 무확장자 잔존 파일(`src/core/build/BuildMetadataAdapter`, `src/core/build/BuildMetadataTypes`, `src/core/reporting/ExecutiveReportBuilder`, `src/core/simulation/ExecutiveReportDiffBuilder`, `src/core/SynapseIgnore`) 정리 완료.

---

## 4. 성능 최적화 및 렌더러 안정성 반영 기록 (Reference)
* **테마 정규화 (`ui/synapse-theme.js` & `demo/synapse-theme.js`):** 실선 스타일의 `dash: [0, 0]` 투명선 문제를 빈 배열(`[]`)로 정규화 완료[cite: 2].
* **Canvas 2D 핫 패스 (`ui/canvas-engine.js` & `demo/canvas-engine.js`):** 60FPS 렌더 루프 내 `.every()` 순회를 제거하고 `this.ctx.setLineDash(style.dashPattern || [])` O(1) 직결 처리 완료[cite: 2].
* **WebGL 버퍼 NaN 차단 (`ui/webgl-renderer.js` & `demo/webgl-renderer.js`):** 빈 대시 배열(`[]`) 유입 시 `undefined → NaN` GPU 버퍼 오염을 막기 위해 `0.0` 폴백 가드 적용 완료[cite: 2].
