# 🛡️ [VISUAL IMPACT] LOGIC_REPORT.md - Actionable Architecture Report

Generated At: 2026. 7. 27. 오후 11:20:39
분석 대상 노드 (Analyzed Nodes): 223개
분석 대상 엣지 (Analyzed Edges): 613개
총 발견 항목 (Raw Findings): 473개

## 🚀 Executive Summary (Recommended Investigation Order)
1. 🔥 **Critical Intervention**: N/A
2. ⚡ **Quick Win**: N/A
3. 🚀 **Highest ROI Intervention**: [Edges: 502 cut] (ROI: 0, AIG: 0.0%, Cost: 810)
4. **Largest SCC**: N/A
5. **Strongest Cluster Bridge**: `folder_src` ↔ `folder_src_core` (Strength: 1781)
6. **Highest Risk Hub**: [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22) (Stability: 100.0%)

## ⚔️ Top 20 Interventions (Demolition Simulation)

### #1 Target [T1] (Rank: 1)
- **Reason**: Strong Cluster Bridge: folder_src -> folder_src_core (Strength: 1781)
- **Edges to Cut**: 502개
- **Absolute SCC Reduction**: 0 (0 → 0)
- **AIG**: 0.0%
- **Structural Cost**: 810 (Files: 124, Clusters: 10)
- **Confidence**: 79% (Min: 20%)
- **Adjusted ROI**: 0
- **AST Microscope**: 🔍 Low Confidence (Min: 20%) - Requires AST Verification
- **Decision**: ❌ Discard (Low ROI / Low Confidence)

### #2 Target [T1] (Rank: 2)
- **Reason**: Strong Cluster Bridge: folder_src -> folder_src_core_collaboration (Strength: 232)
- **Edges to Cut**: 70개
- **Absolute SCC Reduction**: 0 (0 → 3)
- **AIG**: 0.0%
- **Structural Cost**: 146 (Files: 24, Clusters: 5)
- **Confidence**: 81% (Min: 20%)
- **Adjusted ROI**: 0
- **AST Microscope**: 🔍 Low Confidence (Min: 20%) - Requires AST Verification
- **Decision**: ❌ Discard (Low ROI / Low Confidence)

### #3 Target [T1] (Rank: 3)
- **Reason**: Strong Cluster Bridge: folder_src -> folder_src_core_analysis (Strength: 201)
- **Edges to Cut**: 71개
- **Absolute SCC Reduction**: 0 (0 → 0)
- **AIG**: 0.0%
- **Structural Cost**: 139 (Files: 27, Clusters: 6)
- **Confidence**: 65% (Min: 20%)
- **Adjusted ROI**: 0
- **AST Microscope**: 🔍 Low Confidence (Min: 20%) - Requires AST Verification
- **Decision**: ❌ Discard (Low ROI / Low Confidence)

### #4 Target [T1] (Rank: 4)
- **Reason**: Strong Cluster Bridge: folder_src_core -> folder_src_core_analysis (Strength: 172)
- **Edges to Cut**: 54개
- **Absolute SCC Reduction**: 0 (0 → 0)
- **AIG**: 0.0%
- **Structural Cost**: 98 (Files: 24, Clusters: 4)
- **Confidence**: 70% (Min: 20%)
- **Adjusted ROI**: 0
- **AST Microscope**: 🔍 Low Confidence (Min: 20%) - Requires AST Verification
- **Decision**: ❌ Discard (Low ROI / Low Confidence)

### #5 Target [T1] (Rank: 5)
- **Reason**: Strong Cluster Bridge: folder_src -> folder_src_core_canvas_engine (Strength: 169)
- **Edges to Cut**: 39개
- **Absolute SCC Reduction**: 0 (0 → 3)
- **AIG**: 0.0%
- **Structural Cost**: 85 (Files: 19, Clusters: 5)
- **Confidence**: 81% (Min: 20%)
- **Adjusted ROI**: 0
- **AST Microscope**: 🔍 Low Confidence (Min: 20%) - Requires AST Verification
- **Decision**: ❌ Discard (Low ROI / Low Confidence)

### #6 Target [T1] (Rank: 6)
- **Reason**: Strong Cluster Bridge: folder_src_core -> folder_src_core_canvas_engine (Strength: 161)
- **Edges to Cut**: 36개
- **Absolute SCC Reduction**: 0 (0 → 3)
- **AIG**: 0.0%
- **Structural Cost**: 73 (Files: 17, Clusters: 3)
- **Confidence**: 83% (Min: 20%)
- **Adjusted ROI**: 0
- **AST Microscope**: 🔍 Low Confidence (Min: 20%) - Requires AST Verification
- **Decision**: ❌ Discard (Low ROI / Low Confidence)

### #7 Target [T1] (Rank: 7)
- **Reason**: Strong Cluster Bridge: folder_src -> folder_src_utils (Strength: 158)
- **Edges to Cut**: 39개
- **Absolute SCC Reduction**: 0 (0 → 3)
- **AIG**: 0.0%
- **Structural Cost**: 135 (Files: 41, Clusters: 8)
- **Confidence**: 94% (Min: 20%)
- **Adjusted ROI**: 0
- **AST Microscope**: 🔍 Low Confidence (Min: 20%) - Requires AST Verification
- **Decision**: ❌ Discard (Low ROI / Low Confidence)

### #8 Target [T1] (Rank: 8)
- **Reason**: Strong Cluster Bridge: folder_root -> folder_src (Strength: 144)
- **Edges to Cut**: 70개
- **Absolute SCC Reduction**: 0 (0 → 3)
- **AIG**: 0.0%
- **Structural Cost**: 205 (Files: 55, Clusters: 5)
- **Confidence**: 24% (Min: 20%)
- **Adjusted ROI**: 0
- **AST Microscope**: 🔍 Low Confidence (Min: 20%) - Requires AST Verification
- **Decision**: ❌ Discard (Low ROI / Low Confidence)

### #9 Target [T1] (Rank: 9)
- **Reason**: Strong Cluster Bridge: folder_src_core -> folder_src_utils (Strength: 134)
- **Edges to Cut**: 33개
- **Absolute SCC Reduction**: 0 (0 → 3)
- **AIG**: 0.0%
- **Structural Cost**: 114 (Files: 36, Clusters: 6)
- **Confidence**: 94% (Min: 20%)
- **Adjusted ROI**: 0
- **AST Microscope**: 🔍 Low Confidence (Min: 20%) - Requires AST Verification
- **Decision**: ❌ Discard (Low ROI / Low Confidence)

### #10 Target [T1] (Rank: 10)
- **Reason**: Strong Cluster Bridge: folder_root -> folder_src_core (Strength: 132)
- **Edges to Cut**: 64개
- **Absolute SCC Reduction**: 0 (0 → 3)
- **AIG**: 0.0%
- **Structural Cost**: 185 (Files: 51, Clusters: 3)
- **Confidence**: 25% (Min: 20%)
- **Adjusted ROI**: 0
- **AST Microscope**: 🔍 Low Confidence (Min: 20%) - Requires AST Verification
- **Decision**: ❌ Discard (Low ROI / Low Confidence)

### #11 Target [T3] (Rank: 11)
- **Reason**: Massive Hub Fan-out from src/core/DataPipeline.ts (25 edges)
- **Edges to Cut**: 25개
- **Absolute SCC Reduction**: 0 (0 → 3)
- **AIG**: 0.0%
- **Structural Cost**: 86 (Files: 26, Clusters: 5)
- **Confidence**: 88% (Min: 20%)
- **Adjusted ROI**: 0
- **AST Microscope**: 🔍 Low Confidence (Min: 20%) - Requires AST Verification
- **Decision**: ❌ Discard (Low ROI / Low Confidence)

### #12 Target [T3] (Rank: 12)
- **Reason**: Massive Hub Fan-out from src/bootstrap/BootstrapEngine.ts (25 edges)
- **Edges to Cut**: 25개
- **Absolute SCC Reduction**: 0 (0 → 3)
- **AIG**: 0.0%
- **Structural Cost**: 82 (Files: 26, Clusters: 3)
- **Confidence**: 97% (Min: 20%)
- **Adjusted ROI**: 0
- **AST Microscope**: 🔍 Low Confidence (Min: 20%) - Requires AST Verification
- **Decision**: ❌ Discard (Low ROI / Low Confidence)

### #13 Target [T3] (Rank: 13)
- **Reason**: Massive Hub Fan-out from src/webview/CanvasPanel.ts (23 edges)
- **Edges to Cut**: 23개
- **Absolute SCC Reduction**: 0 (0 → 3)
- **AIG**: 0.0%
- **Structural Cost**: 82 (Files: 24, Clusters: 6)
- **Confidence**: 86% (Min: 20%)
- **Adjusted ROI**: 0
- **AST Microscope**: 🔍 Low Confidence (Min: 20%) - Requires AST Verification
- **Decision**: ❌ Discard (Low ROI / Low Confidence)

### #14 Target [T3] (Rank: 14)
- **Reason**: Massive Hub Fan-out from src/server/standalone.ts (21 edges)
- **Edges to Cut**: 21개
- **Absolute SCC Reduction**: 0 (0 → 3)
- **AIG**: 0.0%
- **Structural Cost**: 74 (Files: 22, Clusters: 5)
- **Confidence**: 92% (Min: 20%)
- **Adjusted ROI**: 0
- **AST Microscope**: 🔍 Low Confidence (Min: 20%) - Requires AST Verification
- **Decision**: ❌ Discard (Low ROI / Low Confidence)

### #15 Target [T3] (Rank: 15)
- **Reason**: Massive Hub Fan-out from src/extension.ts (21 edges)
- **Edges to Cut**: 21개
- **Absolute SCC Reduction**: 0 (0 → 3)
- **AIG**: 0.0%
- **Structural Cost**: 74 (Files: 22, Clusters: 5)
- **Confidence**: 93% (Min: 20%)
- **Adjusted ROI**: 0
- **AST Microscope**: 🔍 Low Confidence (Min: 20%) - Requires AST Verification
- **Decision**: ❌ Discard (Low ROI / Low Confidence)

3. **Largest SCC (Raw Runtime)**: `0 nodes`
4. **Highest Complexity Hotspot**: *(Coming in v0.3.34.8 - AST Microscope)*
5. **Recommended Investigation Order**:
   - **Priority 1**: Strongest Bridge (Assess module boundary independence)
   - **Priority 2**: Largest SCC (Evaluate breaking dependency cycles)
   - **Priority 3**: Highest Risk Hub (Resolve dependency bottlenecks)

## 🏛️ Macro Architecture (Graph)

## 📊 Runtime Graph Audit
- **Runtime Nodes:** 196
- **SCC Size (A - All):** 0
- **SCC Size (B - No Unknown):** undefined
- **SCC Size (C - No Type Only):** undefined
- **SCC Size (D - No Framework):** undefined
- **SCC Size (E - Strict Runtime):** undefined

## 🎯 Hub Stability Index (Top 10)
- `GraphModel.ts`: 42 -> 42 (100.0%)
- `Logger.ts`: 33 -> 33 (100.0%)
- `BootstrapEngine.ts`: 32 -> 32 (100.0%)
- `DataPipeline.ts`: 28 -> 28 (100.0%)
- `CanvasPanel.ts`: 26 -> 26 (100.0%)
- `standalone.ts`: 21 -> 21 (100.0%)
- `FileScanner.ts`: 20 -> 20 (100.0%)
- `RuleEngine.ts`: 15 -> 15 (100.0%)
- `ProjectMetadata.ts`: 14 -> 14 (100.0%)
- `BenchmarkHarness.ts`: 12 -> 12 (100.0%)

## 🔗 Cluster Coupling Breakdown (Top 10 Bridges)
*Precise analysis of coupling strength and density between subsystems.*

### #1 `folder_src` ↔ `folder_src_core`
- **Coupling Strength**: `1781`
- **Coupling Density**: `502 edges`
- **Directionality**: `Outbound: 502 | Inbound: 0`
- **Edge Distribution**:
  - Function Calls: 232 (46%)
  - Inheritance: 38 (8%)
  - Constructors: 49 (10%)
  - Type Only: 133 (26%)
  - Unknown/Other: 50 (10%)

### #2 `folder_src` ↔ `folder_src_core_collaboration`
- **Coupling Strength**: `232`
- **Coupling Density**: `70 edges`
- **Directionality**: `Outbound: 70 | Inbound: 0`
- **Edge Distribution**:
  - Function Calls: 46 (66%)
  - Inheritance: 2 (3%)
  - Constructors: 1 (1%)
  - Type Only: 14 (20%)
  - Unknown/Other: 7 (10%)

### #3 `folder_src` ↔ `folder_src_core_analysis`
- **Coupling Strength**: `201`
- **Coupling Density**: `71 edges`
- **Directionality**: `Outbound: 71 | Inbound: 0`
- **Edge Distribution**:
  - Function Calls: 24 (34%)
  - Inheritance: 8 (11%)
  - Constructors: 2 (3%)
  - Type Only: 33 (46%)
  - Unknown/Other: 4 (6%)

### #4 `folder_src_core` ↔ `folder_src_core_analysis`
- **Coupling Strength**: `172`
- **Coupling Density**: `54 edges`
- **Directionality**: `Outbound: 54 | Inbound: 0`
- **Edge Distribution**:
  - Function Calls: 20 (37%)
  - Inheritance: 8 (15%)
  - Constructors: 2 (4%)
  - Type Only: 20 (37%)
  - Unknown/Other: 4 (7%)

### #5 `folder_src` ↔ `folder_src_core_canvas_engine`
- **Coupling Strength**: `169`
- **Coupling Density**: `39 edges`
- **Directionality**: `Outbound: 39 | Inbound: 0`
- **Edge Distribution**:
  - Function Calls: 10 (26%)
  - Inheritance: 3 (8%)
  - Constructors: 11 (28%)
  - Type Only: 7 (18%)
  - Unknown/Other: 8 (21%)

### #6 `folder_src_core` ↔ `folder_src_core_canvas_engine`
- **Coupling Strength**: `161`
- **Coupling Density**: `36 edges`
- **Directionality**: `Outbound: 36 | Inbound: 0`
- **Edge Distribution**:
  - Function Calls: 9 (25%)
  - Inheritance: 3 (8%)
  - Constructors: 11 (31%)
  - Type Only: 7 (19%)
  - Unknown/Other: 6 (17%)

### #7 `folder_src` ↔ `folder_src_utils`
- **Coupling Strength**: `158`
- **Coupling Density**: `39 edges`
- **Directionality**: `Outbound: 39 | Inbound: 0`
- **Edge Distribution**:
  - Function Calls: 37 (95%)
  - Constructors: 1 (3%)
  - Unknown/Other: 1 (3%)

### #8 `folder_root` ↔ `folder_src`
- **Coupling Strength**: `144`
- **Coupling Density**: `70 edges`
- **Directionality**: `Outbound: 70 | Inbound: 0`
- **Edge Distribution**:
  - Function Calls: 2 (3%)
  - Unknown/Other: 68 (97%)

### #9 `folder_src_core` ↔ `folder_src_utils`
- **Coupling Strength**: `134`
- **Coupling Density**: `33 edges`
- **Directionality**: `Outbound: 32 | Inbound: 1`
- **Edge Distribution**:
  - Function Calls: 31 (94%)
  - Constructors: 1 (3%)
  - Unknown/Other: 1 (3%)

### #10 `folder_root` ↔ `folder_src_core`
- **Coupling Strength**: `132`
- **Coupling Density**: `64 edges`
- **Directionality**: `Outbound: 64 | Inbound: 0`
- **Edge Distribution**:
  - Function Calls: 2 (3%)
  - Unknown/Other: 62 (97%)

Test Status: ❌ Fail (Visual Indicator: Red-out)

## 💀 Architecture Violations & Fractures
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ConfigScanner`](command:synapse.focusNode?%22src%2Fcore%2FConfigScanner.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'FileScanner' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`FileScanner`](command:synapse.focusNode?%22src%2Fcore%2FFileScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('FileScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`FileScanner`](command:synapse.focusNode?%22src%2Fcore%2FFileScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('typescript')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`TypeScriptResolver`](command:synapse.focusNode?%22src%2Fcore%2Fresolvers%2FTypeScriptResolver.ts%22) ↔ [`typescript`](command:synapse.focusNode?%22typescript%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`types`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Ftypes.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`GhostClassifier`](command:synapse.focusNode?%22src%2Fcore%2FGhostClassifier.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ScannerRegistry`](command:synapse.focusNode?%22src%2Fcore%2FScannerRegistry.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`AstSymbolResolver`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Fast%2FAstSymbolResolver.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('crypto')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`AccountManager`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FAccountManager.ts%22) ↔ [`crypto`](command:synapse.focusNode?%22crypto%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphModel')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CommitManager`](command:synapse.focusNode?%22src%2Fcore%2Ftransaction%2FCommitManager.ts%22) ↔ [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ArchitectureIndexBuilder')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) ↔ [`ArchitectureIndexBuilder`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FArchitectureIndexBuilder.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ShellScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`ShellScanner`](command:synapse.focusNode?%22src%2Fcore%2FShellScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ClusterBuilder')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2c`](command:synapse.focusNode?%22verify_step2c.ts%22) ↔ [`ClusterBuilder`](command:synapse.focusNode?%22src%2Fcore%2FClusterBuilder.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`StateManager`](command:synapse.focusNode?%22src%2Fcore%2Fcanvas-engine%2FStateManager.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GeminiParser')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`extension`](command:synapse.focusNode?%22src%2Fextension.ts%22) ↔ [`GeminiParser`](command:synapse.focusNode?%22src%2Fcore%2FGeminiParser.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CommunityDetector`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FCommunityDetector.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('JsTsScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_registry_runtime`](command:synapse.focusNode?%22verify_registry_runtime.ts%22) ↔ [`JsTsScanner`](command:synapse.focusNode?%22src%2Fcore%2FJsTsScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('TarjanSCC')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`test_hygiene`](command:synapse.focusNode?%22test_hygiene.ts%22) ↔ [`TarjanSCC`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FTarjanSCC.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('RuleEngine')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`VisualRuleBook`](command:synapse.focusNode?%22src%2Fcore%2Fcanvas-engine%2FVisualRuleBook.ts%22) ↔ [`RuleEngine`](command:synapse.focusNode?%22src%2Fcore%2FRuleEngine.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`RemoteLayerProjector`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FRemoteLayerProjector.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'SnapshotSystem' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`SnapshotSystem`](command:synapse.focusNode?%22src%2Fcore%2FSnapshotSystem.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('SnapshotSystem')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`SnapshotSystem`](command:synapse.focusNode?%22src%2Fcore%2FSnapshotSystem.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('CommitManager')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`StateManager`](command:synapse.focusNode?%22src%2Fcore%2Fcanvas-engine%2FStateManager.ts%22) ↔ [`CommitManager`](command:synapse.focusNode?%22src%2Fcore%2Ftransaction%2FCommitManager.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('RuleEngine')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`RuleEngine`](command:synapse.focusNode?%22src%2Fcore%2FRuleEngine.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('types')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CommunityDetector`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FCommunityDetector.ts%22) ↔ [`types`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Ftypes.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`JavaScanner`](command:synapse.focusNode?%22src%2Fcore%2FJavaScanner.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphModel')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2g5_regression`](command:synapse.focusNode?%22verify_step2g5_regression.ts%22) ↔ [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('assert')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2g_regression`](command:synapse.focusNode?%22verify_step2g_regression.ts%22) ↔ [`assert`](command:synapse.focusNode?%22assert%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('FileScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`FileScanner`](command:synapse.focusNode?%22src%2Fcore%2FFileScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('exclusionRules')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`exclusionRules`](command:synapse.focusNode?%22src%2Futils%2FexclusionRules.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('NodeBuilder')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_architecture`](command:synapse.focusNode?%22verify_architecture.ts%22) ↔ [`NodeBuilder`](command:synapse.focusNode?%22src%2Fcore%2FNodeBuilder.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('crypto')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`DirectChatScraper`](command:synapse.focusNode?%22src%2Fcore%2FDirectChatScraper.ts%22) ↔ [`crypto`](command:synapse.focusNode?%22crypto%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`SqlScanner`](command:synapse.focusNode?%22src%2Fcore%2FSqlScanner.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ScannerRegistry')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_bootstrap_integration`](command:synapse.focusNode?%22verify_bootstrap_integration.ts%22) ↔ [`ScannerRegistry`](command:synapse.focusNode?%22src%2Fcore%2FScannerRegistry.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2e`](command:synapse.focusNode?%22verify_step2e.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'ControlSystem' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`ControlSystem`](command:synapse.focusNode?%22src%2Fcore%2FControlSystem.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ControlSystem')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`ControlSystem`](command:synapse.focusNode?%22src%2Fcore%2FControlSystem.ts%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'http' (Layer user -> external). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`http`](command:synapse.focusNode?%22http%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('http')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`http`](command:synapse.focusNode?%22http%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`GraphViewBuilder`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2FGraphViewBuilder.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BlacklistOrchestrator`](command:synapse.focusNode?%22src%2Fcore%2FBlacklistOrchestrator.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ArchitectureIndexBuilder`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FArchitectureIndexBuilder.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('RuleEngine')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`exclusionRules`](command:synapse.focusNode?%22src%2Futils%2FexclusionRules.ts%22) ↔ [`RuleEngine`](command:synapse.focusNode?%22src%2Fcore%2FRuleEngine.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Y')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`FileScanner`](command:synapse.focusNode?%22src%2Fcore%2FFileScanner.ts%22) ↔ [`Y`](command:synapse.focusNode?%22Y%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ConfigScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`step4_verify`](command:synapse.focusNode?%22step4_verify.ts%22) ↔ [`ConfigScanner`](command:synapse.focusNode?%22src%2Fcore%2FConfigScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('TarjanSCC')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`InterventionSimulator`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2FInterventionSimulator.ts%22) ↔ [`TarjanSCC`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FTarjanSCC.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('http')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CDPManager`](command:synapse.focusNode?%22src%2Fcore%2FCDPManager.ts%22) ↔ [`http`](command:synapse.focusNode?%22http%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ReferenceVerifier`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FReferenceVerifier.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Unsupported Language] 연결된 노드 중 일부가 분석 지원 대상 언어가 아닙니다 (.ts, .js, .py, .md 권장).**: [`fix_cluster`](command:synapse.focusNode?%22fix_cluster.sh%22) ↔ [`ts`](command:synapse.focusNode?%22ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ts')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`fix_cluster`](command:synapse.focusNode?%22fix_cluster.sh%22) ↔ [`ts`](command:synapse.focusNode?%22ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('assert')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2i2_regression`](command:synapse.focusNode?%22verify_step2i2_regression.ts%22) ↔ [`assert`](command:synapse.focusNode?%22assert%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('FileScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_cluster_builder`](command:synapse.focusNode?%22verify_cluster_builder.ts%22) ↔ [`FileScanner`](command:synapse.focusNode?%22src%2Fcore%2FFileScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('RustScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`RustScanner`](command:synapse.focusNode?%22src%2Fcore%2FRustScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('JsTsScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`step4_verify`](command:synapse.focusNode?%22step4_verify.ts%22) ↔ [`JsTsScanner`](command:synapse.focusNode?%22src%2Fcore%2FJsTsScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('RuntimeInitializer')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) ↔ [`RuntimeInitializer`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FRuntimeInitializer.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('SnapshotSystem')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`extension`](command:synapse.focusNode?%22src%2Fextension.ts%22) ↔ [`SnapshotSystem`](command:synapse.focusNode?%22src%2Fcore%2FSnapshotSystem.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CycleAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Fanalyzers%2FCycleAnalyzer.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('PhaseManager')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`PhaseManager`](command:synapse.focusNode?%22src%2Fcore%2FPhaseManager.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ArchitectureAnalysisEngine`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2FArchitectureAnalysisEngine.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('crypto')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CompareProjection`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FCompareProjection.ts%22) ↔ [`crypto`](command:synapse.focusNode?%22crypto%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphModel')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`StateManager`](command:synapse.focusNode?%22src%2Fcore%2Fcanvas-engine%2FStateManager.ts%22) ↔ [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`RustScanner`](command:synapse.focusNode?%22src%2Fcore%2FRustScanner.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('RuleEngine')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`graph_diff_audit`](command:synapse.focusNode?%22graph_diff_audit.ts%22) ↔ [`RuleEngine`](command:synapse.focusNode?%22src%2Fcore%2FRuleEngine.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('visualHints')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`FlowchartGenerator`](command:synapse.focusNode?%22src%2Fcore%2FFlowchartGenerator.ts%22) ↔ [`visualHints`](command:synapse.focusNode?%22src%2Futils%2FvisualHints.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('JavaScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`JavaScanner`](command:synapse.focusNode?%22src%2Fcore%2FJavaScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`DataPipeline`](command:synapse.focusNode?%22src%2Fcore%2FDataPipeline.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('SynapseIgnore')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) ↔ [`SynapseIgnore`](command:synapse.focusNode?%22src%2Fcore%2FSynapseIgnore.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ReferenceVerifier')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) ↔ [`ReferenceVerifier`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FReferenceVerifier.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CompareEngine`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FCompareEngine.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('PythonScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_registry_runtime`](command:synapse.focusNode?%22verify_registry_runtime.ts%22) ↔ [`PythonScanner`](command:synapse.focusNode?%22src%2Fcore%2FPythonScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ConfigScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`ConfigScanner`](command:synapse.focusNode?%22src%2Fcore%2FConfigScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CppScanner`](command:synapse.focusNode?%22src%2Fcore%2FCppScanner.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('FlowScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`server`](command:synapse.focusNode?%22src%2Fserver%2Fserver.ts%22) ↔ [`FlowScanner`](command:synapse.focusNode?%22src%2Fcore%2FFlowScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`GeminiParser`](command:synapse.focusNode?%22src%2Fcore%2FGeminiParser.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('graphBuilder')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CommitManager`](command:synapse.focusNode?%22src%2Fcore%2Ftransaction%2FCommitManager.ts%22) ↔ [`graphBuilder`](command:synapse.focusNode?%22src%2Fcore%2FgraphBuilder.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('AiOrchestrator')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`extension`](command:synapse.focusNode?%22src%2Fextension.ts%22) ↔ [`AiOrchestrator`](command:synapse.focusNode?%22src%2Fcore%2FAiOrchestrator.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BoundaryGuard`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FBoundaryGuard.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ArchitectureAnalysisEngine`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2FArchitectureAnalysisEngine.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`FileScanner`](command:synapse.focusNode?%22src%2Fcore%2FFileScanner.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`RuntimeInitializer`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FRuntimeInitializer.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`EdgeGenerator`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FEdgeGenerator.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('assert')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2i4_regression`](command:synapse.focusNode?%22verify_step2i4_regression.ts%22) ↔ [`assert`](command:synapse.focusNode?%22assert%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`JVMAuditor`](command:synapse.focusNode?%22src%2Fcore%2FJVMAuditor.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('TarjanSCC')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`TargetSelector`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2FTargetSelector.ts%22) ↔ [`TarjanSCC`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FTarjanSCC.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphModel')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2i4_regression`](command:synapse.focusNode?%22verify_step2i4_regression.ts%22) ↔ [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GeminiParser')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) ↔ [`GeminiParser`](command:synapse.focusNode?%22src%2Fcore%2FGeminiParser.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('express')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) ↔ [`express`](command:synapse.focusNode?%22express%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'FlowchartGenerator' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`FlowchartGenerator`](command:synapse.focusNode?%22src%2Fcore%2FFlowchartGenerator.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('FlowchartGenerator')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`FlowchartGenerator`](command:synapse.focusNode?%22src%2Fcore%2FFlowchartGenerator.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('MarkdownScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`MarkdownScanner`](command:synapse.focusNode?%22src%2Fcore%2FMarkdownScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('CppScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`CppScanner`](command:synapse.focusNode?%22src%2Fcore%2FCppScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('InterventionSimulator')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ReasoningEngine`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FReasoningEngine.ts%22) ↔ [`InterventionSimulator`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2FInterventionSimulator.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('crypto')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CompareEngine`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FCompareEngine.ts%22) ↔ [`crypto`](command:synapse.focusNode?%22crypto%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('SynapseIgnore')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`MountManager`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FMountManager.ts%22) ↔ [`SynapseIgnore`](command:synapse.focusNode?%22src%2Fcore%2FSynapseIgnore.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`SchemaViolationAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Fanalyzers%2FSchemaViolationAnalyzer.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('types')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`DependencyPressureAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Fanalyzers%2FDependencyPressureAnalyzer.ts%22) ↔ [`types`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Ftypes.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('types')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`DeadEndAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Fanalyzers%2FDeadEndAnalyzer.ts%22) ↔ [`types`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Ftypes.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('RuntimeInitializer')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`extension`](command:synapse.focusNode?%22src%2Fextension.ts%22) ↔ [`RuntimeInitializer`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FRuntimeInitializer.ts%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'RuleEngine' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`RuleEngine`](command:synapse.focusNode?%22src%2Fcore%2FRuleEngine.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('RuleEngine')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`RuleEngine`](command:synapse.focusNode?%22src%2Fcore%2FRuleEngine.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('RuleEngine')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ValidationHarness`](command:synapse.focusNode?%22src%2Fcore%2Fcanvas-engine%2FValidationHarness.ts%22) ↔ [`RuleEngine`](command:synapse.focusNode?%22src%2Fcore%2FRuleEngine.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphAnalyzer')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2g_determinism`](command:synapse.focusNode?%22verify_step2g_determinism.ts%22) ↔ [`GraphAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2FGraphAnalyzer.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ProjectionLayer')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`StateManager`](command:synapse.focusNode?%22src%2Fcore%2Fcanvas-engine%2FStateManager.ts%22) ↔ [`ProjectionLayer`](command:synapse.focusNode?%22src%2Fcore%2Fprojection%2FProjectionLayer.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('DirectoryTreeBuilder')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_architecture`](command:synapse.focusNode?%22verify_architecture.ts%22) ↔ [`DirectoryTreeBuilder`](command:synapse.focusNode?%22src%2Fcore%2FDirectoryTreeBuilder.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphModel')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`SessionManager`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FSessionManager.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('crypto')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`EdgeBuilder`](command:synapse.focusNode?%22src%2Fcore%2FEdgeBuilder.ts%22) ↔ [`crypto`](command:synapse.focusNode?%22crypto%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphModel')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`extension`](command:synapse.focusNode?%22src%2Fextension.ts%22) ↔ [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`TypeScriptResolver`](command:synapse.focusNode?%22src%2Fcore%2Fresolvers%2FTypeScriptResolver.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`LogicAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2FLogicAnalyzer.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('FileScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_architecture`](command:synapse.focusNode?%22verify_architecture.ts%22) ↔ [`FileScanner`](command:synapse.focusNode?%22src%2Fcore%2FFileScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ProjectMetadata')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BoundaryGuard`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FBoundaryGuard.ts%22) ↔ [`ProjectMetadata`](command:synapse.focusNode?%22src%2Fcore%2FProjectMetadata.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('LayoutEngine')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2g_determinism`](command:synapse.focusNode?%22verify_step2g_determinism.ts%22) ↔ [`LayoutEngine`](command:synapse.focusNode?%22src%2Fcore%2FLayoutEngine.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('node')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`server`](command:synapse.focusNode?%22src%2Fserver%2Fserver.ts%22) ↔ [`node`](command:synapse.focusNode?%22node%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`DataPipeline`](command:synapse.focusNode?%22src%2Fcore%2FDataPipeline.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('BootstrapEngine')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`baseline_capture`](command:synapse.focusNode?%22baseline_capture.ts%22) ↔ [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'BootstrapEngine' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'VirtualDebugger' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`VirtualDebugger`](command:synapse.focusNode?%22src%2Fcore%2FVirtualDebugger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('VirtualDebugger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`VirtualDebugger`](command:synapse.focusNode?%22src%2Fcore%2FVirtualDebugger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('assert')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2g_determinism`](command:synapse.focusNode?%22verify_step2g_determinism.ts%22) ↔ [`assert`](command:synapse.focusNode?%22assert%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ReasoningEngine`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FReasoningEngine.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_node_builder`](command:synapse.focusNode?%22verify_node_builder.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('BenchmarkHarness')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`extension`](command:synapse.focusNode?%22src%2Fextension.ts%22) ↔ [`BenchmarkHarness`](command:synapse.focusNode?%22src%2Fcore%2Fbenchmark%2FBenchmarkHarness.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphModel')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2g_determinism`](command:synapse.focusNode?%22verify_step2g_determinism.ts%22) ↔ [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('BlacklistOrchestrator')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`extension`](command:synapse.focusNode?%22src%2Fextension.ts%22) ↔ [`BlacklistOrchestrator`](command:synapse.focusNode?%22src%2Fcore%2FBlacklistOrchestrator.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ProjectMetadata')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`SessionManager`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FSessionManager.ts%22) ↔ [`ProjectMetadata`](command:synapse.focusNode?%22src%2Fcore%2FProjectMetadata.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('FileScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2c`](command:synapse.focusNode?%22verify_step2c.ts%22) ↔ [`FileScanner`](command:synapse.focusNode?%22src%2Fcore%2FFileScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GhostPolicy')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2i2_regression`](command:synapse.focusNode?%22verify_step2i2_regression.ts%22) ↔ [`GhostPolicy`](command:synapse.focusNode?%22src%2Fcore%2FGhostPolicy.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('SensitiveInfoMasker')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`PromptLogger`](command:synapse.focusNode?%22src%2Fcore%2FPromptLogger.ts%22) ↔ [`SensitiveInfoMasker`](command:synapse.focusNode?%22src%2Futils%2FSensitiveInfoMasker.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`HarvestProjection`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FHarvestProjection.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ProjectMetadata')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CompareEngine`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FCompareEngine.ts%22) ↔ [`ProjectMetadata`](command:synapse.focusNode?%22src%2Fcore%2FProjectMetadata.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('FileScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`step4_verify`](command:synapse.focusNode?%22step4_verify.ts%22) ↔ [`FileScanner`](command:synapse.focusNode?%22src%2Fcore%2FFileScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('crypto')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`SessionManager`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FSessionManager.ts%22) ↔ [`crypto`](command:synapse.focusNode?%22crypto%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('RuleEngine')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`StateManager`](command:synapse.focusNode?%22src%2Fcore%2Fcanvas-engine%2FStateManager.ts%22) ↔ [`RuleEngine`](command:synapse.focusNode?%22src%2Fcore%2FRuleEngine.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ClusterBuilder')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_architecture`](command:synapse.focusNode?%22verify_architecture.ts%22) ↔ [`ClusterBuilder`](command:synapse.focusNode?%22src%2Fcore%2FClusterBuilder.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphModel')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`Intent`](command:synapse.focusNode?%22src%2Fcore%2Fcanvas-engine%2FIntent.ts%22) ↔ [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('LayoutEngine')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2g5_regression`](command:synapse.focusNode?%22verify_step2g5_regression.ts%22) ↔ [`LayoutEngine`](command:synapse.focusNode?%22src%2Fcore%2FLayoutEngine.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ClusterBridgeAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2FClusterBridgeAnalyzer.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('MarkdownScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`step4_verify`](command:synapse.focusNode?%22step4_verify.ts%22) ↔ [`MarkdownScanner`](command:synapse.focusNode?%22src%2Fcore%2FMarkdownScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`PythonScanner`](command:synapse.focusNode?%22src%2Fcore%2FPythonScanner.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('JavaScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_registry_runtime`](command:synapse.focusNode?%22verify_registry_runtime.ts%22) ↔ [`JavaScanner`](command:synapse.focusNode?%22src%2Fcore%2FJavaScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('SqlScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`SqlScanner`](command:synapse.focusNode?%22src%2Fcore%2FSqlScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphAnalyzer')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2e`](command:synapse.focusNode?%22verify_step2e.ts%22) ↔ [`GraphAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2FGraphAnalyzer.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('DirectoryTreeBuilder')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_cluster_builder`](command:synapse.focusNode?%22verify_cluster_builder.ts%22) ↔ [`DirectoryTreeBuilder`](command:synapse.focusNode?%22src%2Fcore%2FDirectoryTreeBuilder.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('exclusionRules')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`GeminiParser`](command:synapse.focusNode?%22src%2Fcore%2FGeminiParser.ts%22) ↔ [`exclusionRules`](command:synapse.focusNode?%22src%2Futils%2FexclusionRules.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('BillingManager')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`extension`](command:synapse.focusNode?%22src%2Fextension.ts%22) ↔ [`BillingManager`](command:synapse.focusNode?%22src%2Fcore%2FBillingManager.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('BootstrapEngine')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_bootstrap_integration`](command:synapse.focusNode?%22verify_bootstrap_integration.ts%22) ↔ [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('SymbolIndex')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`extension`](command:synapse.focusNode?%22src%2Fextension.ts%22) ↔ [`SymbolIndex`](command:synapse.focusNode?%22src%2Fcore%2FSymbolIndex.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ReferenceVerifier`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FReferenceVerifier.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphModel')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ScenarioRunner`](command:synapse.focusNode?%22src%2Fcore%2Fcanvas-engine%2FScenarioRunner.ts%22) ↔ [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('LayoutEngine')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2g4_regression`](command:synapse.focusNode?%22verify_step2g4_regression.ts%22) ↔ [`LayoutEngine`](command:synapse.focusNode?%22src%2Fcore%2FLayoutEngine.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('foo')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_registry_runtime`](command:synapse.focusNode?%22verify_registry_runtime.ts%22) ↔ [`foo`](command:synapse.focusNode?%22foo%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('CommunityDetector')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2h_regression`](command:synapse.focusNode?%22verify_step2h_regression.ts%22) ↔ [`CommunityDetector`](command:synapse.focusNode?%22src%2Fcore%2FCommunityDetector.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체(') || trimmed')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`EdgeCodeRefactorer`](command:synapse.focusNode?%22src%2Fcore%2FEdgeCodeRefactorer.ts%22) ↔ [`) || trimmed`](command:synapse.focusNode?%22)%20%7C%7C%20trimmed%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('EdgeCodeRefactorer')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ExecutionLayer`](command:synapse.focusNode?%22src%2Fcore%2Ftransaction%2FExecutionLayer.ts%22) ↔ [`EdgeCodeRefactorer`](command:synapse.focusNode?%22src%2Fcore%2FEdgeCodeRefactorer.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`FlowchartGenerator`](command:synapse.focusNode?%22src%2Fcore%2FFlowchartGenerator.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('types')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ReasoningEngine`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FReasoningEngine.ts%22) ↔ [`types`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Ftypes.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`FileScanner`](command:synapse.focusNode?%22src%2Fcore%2FFileScanner.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`AccountManager`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FAccountManager.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('types')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`SchemaViolationAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Fanalyzers%2FSchemaViolationAnalyzer.ts%22) ↔ [`types`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Ftypes.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('RestCollaborationTransport')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) ↔ [`RestCollaborationTransport`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FRestCollaborationTransport.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('DataPipeline')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`graph_diff_audit`](command:synapse.focusNode?%22graph_diff_audit.ts%22) ↔ [`DataPipeline`](command:synapse.focusNode?%22src%2Fcore%2FDataPipeline.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CDPManager`](command:synapse.focusNode?%22src%2Fcore%2FCDPManager.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ProjectMetadata')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`RuntimeInitializer`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FRuntimeInitializer.ts%22) ↔ [`ProjectMetadata`](command:synapse.focusNode?%22src%2Fcore%2FProjectMetadata.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`NecrosisAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Fanalyzers%2FNecrosisAnalyzer.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`InterventionSimulator`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2FInterventionSimulator.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('DirectoryTreeBuilder')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2c`](command:synapse.focusNode?%22verify_step2c.ts%22) ↔ [`DirectoryTreeBuilder`](command:synapse.focusNode?%22src%2Fcore%2FDirectoryTreeBuilder.ts%22)
- 🔴 **[Unsupported Language] 연결된 노드 중 일부가 분석 지원 대상 언어가 아닙니다 (.ts, .js, .py, .md 권장).**: [`mod`](command:synapse.focusNode?%22src%2Frust_checker%2Fmod.rs%22) ↔ [`state_checker`](command:synapse.focusNode?%22src%2Frust_checker%2Fstate_checker.rs%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'PhaseManager' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`PhaseManager`](command:synapse.focusNode?%22src%2Fcore%2FPhaseManager.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('PhaseManager')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`PhaseManager`](command:synapse.focusNode?%22src%2Fcore%2FPhaseManager.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`RemoteLayerProjector`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FRemoteLayerProjector.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Unsupported Language] 연결된 노드 중 일부가 분석 지원 대상 언어가 아닙니다 (.ts, .js, .py, .md 권장).**: [`fix_cluster`](command:synapse.focusNode?%22fix_cluster.sh%22) ↔ [`cluster_id`](command:synapse.focusNode?%22cluster_id%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('cluster_id')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`fix_cluster`](command:synapse.focusNode?%22fix_cluster.sh%22) ↔ [`cluster_id`](command:synapse.focusNode?%22cluster_id%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('FileScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_node_builder`](command:synapse.focusNode?%22verify_node_builder.ts%22) ↔ [`FileScanner`](command:synapse.focusNode?%22src%2Fcore%2FFileScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('AccountManager')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) ↔ [`AccountManager`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FAccountManager.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`DependencyClassifier`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FDependencyClassifier.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('FileScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`graph_diff_audit`](command:synapse.focusNode?%22graph_diff_audit.ts%22) ↔ [`FileScanner`](command:synapse.focusNode?%22src%2Fcore%2FFileScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GeminiParser')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`server`](command:synapse.focusNode?%22src%2Fserver%2Fserver.ts%22) ↔ [`GeminiParser`](command:synapse.focusNode?%22src%2Fcore%2FGeminiParser.ts%22)
- 🔴 **[Unsupported Language] 연결된 노드 중 일부가 분석 지원 대상 언어가 아닙니다 (.ts, .js, .py, .md 권장).**: [`fix_cluster`](command:synapse.focusNode?%22fix_cluster.sh%22) ↔ [`position`](command:synapse.focusNode?%22position%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('position')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`fix_cluster`](command:synapse.focusNode?%22fix_cluster.sh%22) ↔ [`position`](command:synapse.focusNode?%22position%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('node')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`extension`](command:synapse.focusNode?%22src%2Fextension.ts%22) ↔ [`node`](command:synapse.focusNode?%22node%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('CppScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`step4_verify`](command:synapse.focusNode?%22step4_verify.ts%22) ↔ [`CppScanner`](command:synapse.focusNode?%22src%2Fcore%2FCppScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('SymbolIndex')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) ↔ [`SymbolIndex`](command:synapse.focusNode?%22src%2Fcore%2FSymbolIndex.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`HarvestSessionManager`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FHarvestSessionManager.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('types')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`DependencyClassifier`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FDependencyClassifier.ts%22) ↔ [`types`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Ftypes.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`InterventionEngine`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FInterventionEngine.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`InterventionSimulator`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2FInterventionSimulator.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('PhaseManager')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`PhaseGate`](command:synapse.focusNode?%22src%2Fcore%2Fcanvas-engine%2FPhaseGate.ts%22) ↔ [`PhaseManager`](command:synapse.focusNode?%22src%2Fcore%2FPhaseManager.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체(')) type = ')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`FileScanner`](command:synapse.focusNode?%22src%2Fcore%2FFileScanner.ts%22) ↔ [`)) type = `](command:synapse.focusNode?%22))%20type%20%3D%20%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('cors')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) ↔ [`cors`](command:synapse.focusNode?%22cors%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('crypto')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`DataPipeline`](command:synapse.focusNode?%22src%2Fcore%2FDataPipeline.ts%22) ↔ [`crypto`](command:synapse.focusNode?%22crypto%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('NodeBuilder')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_node_builder`](command:synapse.focusNode?%22verify_node_builder.ts%22) ↔ [`NodeBuilder`](command:synapse.focusNode?%22src%2Fcore%2FNodeBuilder.ts%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'GridSystem' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`GridSystem`](command:synapse.focusNode?%22src%2Fcore%2FGridSystem.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GridSystem')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`GridSystem`](command:synapse.focusNode?%22src%2Fcore%2FGridSystem.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('SnapshotSystem')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`SnapshotSystem`](command:synapse.focusNode?%22src%2Fcore%2FSnapshotSystem.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`VirtualDebugger`](command:synapse.focusNode?%22src%2Fcore%2FVirtualDebugger.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'SynapseIgnore' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`SynapseIgnore`](command:synapse.focusNode?%22src%2Fcore%2FSynapseIgnore.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('SynapseIgnore')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`SynapseIgnore`](command:synapse.focusNode?%22src%2Fcore%2FSynapseIgnore.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('RustScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_registry_runtime`](command:synapse.focusNode?%22verify_registry_runtime.ts%22) ↔ [`RustScanner`](command:synapse.focusNode?%22src%2Fcore%2FRustScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('FlowchartGenerator')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`FlowchartGenerator`](command:synapse.focusNode?%22src%2Fcore%2FFlowchartGenerator.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphModel')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ReasoningEngine`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FReasoningEngine.ts%22) ↔ [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('KotlinScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`step4_verify`](command:synapse.focusNode?%22step4_verify.ts%22) ↔ [`KotlinScanner`](command:synapse.focusNode?%22src%2Fcore%2FKotlinScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('SymbolIndex')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`RuntimeInitializer`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FRuntimeInitializer.ts%22) ↔ [`SymbolIndex`](command:synapse.focusNode?%22src%2Fcore%2FSymbolIndex.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('DataPipeline')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`DataPipeline`](command:synapse.focusNode?%22src%2Fcore%2FDataPipeline.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('types')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`InterventionEngine`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FInterventionEngine.ts%22) ↔ [`types`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Ftypes.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`GhostExpander`](command:synapse.focusNode?%22src%2Fcore%2FGhostExpander.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('CommunityDetector')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`InterventionEngine`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FInterventionEngine.ts%22) ↔ [`CommunityDetector`](command:synapse.focusNode?%22src%2Fcore%2FCommunityDetector.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('SymbolIndex')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2i3_regression`](command:synapse.focusNode?%22verify_step2i3_regression.ts%22) ↔ [`SymbolIndex`](command:synapse.focusNode?%22src%2Fcore%2FSymbolIndex.ts%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'RenderProtocol' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`RenderProtocol`](command:synapse.focusNode?%22src%2Fcore%2Fcanvas-engine%2FRenderProtocol.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('RenderProtocol')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`RenderProtocol`](command:synapse.focusNode?%22src%2Fcore%2Fcanvas-engine%2FRenderProtocol.ts%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'schema' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('assert')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2g4_regression`](command:synapse.focusNode?%22verify_step2g4_regression.ts%22) ↔ [`assert`](command:synapse.focusNode?%22assert%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ProjectMetadata`](command:synapse.focusNode?%22src%2Fcore%2FProjectMetadata.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('LayoutEngine')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2g_regression`](command:synapse.focusNode?%22verify_step2g_regression.ts%22) ↔ [`LayoutEngine`](command:synapse.focusNode?%22src%2Fcore%2FLayoutEngine.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('PbSessionWatcher')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`extension`](command:synapse.focusNode?%22src%2Fextension.ts%22) ↔ [`PbSessionWatcher`](command:synapse.focusNode?%22src%2Fcore%2FPbSessionWatcher.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ShellScanner`](command:synapse.focusNode?%22src%2Fcore%2FShellScanner.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Unsupported Language] 연결된 노드 중 일부가 분석 지원 대상 언어가 아닙니다 (.ts, .js, .py, .md 권장).**: [`state_checker`](command:synapse.focusNode?%22src%2Frust_checker%2Fstate_checker.rs%22) ↔ [`project_state_json`](command:synapse.focusNode?%22project_state_json%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('project_state_json')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`state_checker`](command:synapse.focusNode?%22src%2Frust_checker%2Fstate_checker.rs%22) ↔ [`project_state_json`](command:synapse.focusNode?%22project_state_json%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'client' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`client`](command:synapse.focusNode?%22src%2Fclient.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphAnalyzer')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2f`](command:synapse.focusNode?%22verify_step2f.ts%22) ↔ [`GraphAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2FGraphAnalyzer.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`IsolatedNodeAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Fanalyzers%2FIsolatedNodeAnalyzer.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('net')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`MountManager`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FMountManager.ts%22) ↔ [`net`](command:synapse.focusNode?%22net%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`NodeBuilder`](command:synapse.focusNode?%22src%2Fcore%2FNodeBuilder.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('FileScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_registry_runtime`](command:synapse.focusNode?%22verify_registry_runtime.ts%22) ↔ [`FileScanner`](command:synapse.focusNode?%22src%2Fcore%2FFileScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ShellScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`step4_verify`](command:synapse.focusNode?%22step4_verify.ts%22) ↔ [`ShellScanner`](command:synapse.focusNode?%22src%2Fcore%2FShellScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`TypeScriptResolver`](command:synapse.focusNode?%22src%2Fcore%2Fresolvers%2FTypeScriptResolver.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ReasoningEngine`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FReasoningEngine.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('net')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CDPManager`](command:synapse.focusNode?%22src%2Fcore%2FCDPManager.ts%22) ↔ [`net`](command:synapse.focusNode?%22net%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('assert')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2h_regression`](command:synapse.focusNode?%22verify_step2h_regression.ts%22) ↔ [`assert`](command:synapse.focusNode?%22assert%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('foo')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`TypeScriptResolver`](command:synapse.focusNode?%22src%2Fcore%2Fresolvers%2FTypeScriptResolver.ts%22) ↔ [`foo`](command:synapse.focusNode?%22foo%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`TargetSelector`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2FTargetSelector.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`extension`](command:synapse.focusNode?%22src%2Fextension.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('assert')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2g5_regression`](command:synapse.focusNode?%22verify_step2g5_regression.ts%22) ↔ [`assert`](command:synapse.focusNode?%22assert%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('vscode-languageserver-textdocument')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`server`](command:synapse.focusNode?%22src%2Fserver%2Fserver.ts%22) ↔ [`vscode-languageserver-textdocument`](command:synapse.focusNode?%22vscode-languageserver-textdocument%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('FileScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2i2_regression`](command:synapse.focusNode?%22verify_step2i2_regression.ts%22) ↔ [`FileScanner`](command:synapse.focusNode?%22src%2Fcore%2FFileScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('SessionManager')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) ↔ [`SessionManager`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FSessionManager.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BoundaryGuardAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Fanalyzers%2FBoundaryGuardAnalyzer.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('node')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`client`](command:synapse.focusNode?%22src%2Fclient.ts%22) ↔ [`node`](command:synapse.focusNode?%22node%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('crypto')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`SnapshotSystem`](command:synapse.focusNode?%22src%2Fcore%2FSnapshotSystem.ts%22) ↔ [`crypto`](command:synapse.focusNode?%22crypto%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('crypto')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CDPManager`](command:synapse.focusNode?%22src%2Fcore%2FCDPManager.ts%22) ↔ [`crypto`](command:synapse.focusNode?%22crypto%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ArchitectureIndexBuilder`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FArchitectureIndexBuilder.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('HarvestSessionManager')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) ↔ [`HarvestSessionManager`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FHarvestSessionManager.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('types')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`SmellDetector`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FSmellDetector.ts%22) ↔ [`types`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Ftypes.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('KotlinScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`KotlinScanner`](command:synapse.focusNode?%22src%2Fcore%2FKotlinScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ExecutionLayer')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CanvasEngine`](command:synapse.focusNode?%22src%2Fcore%2Fcanvas-engine%2FCanvasEngine.ts%22) ↔ [`ExecutionLayer`](command:synapse.focusNode?%22src%2Fcore%2Ftransaction%2FExecutionLayer.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('graphBuilder')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`graph_diff_audit`](command:synapse.focusNode?%22graph_diff_audit.ts%22) ↔ [`graphBuilder`](command:synapse.focusNode?%22src%2Fcore%2FgraphBuilder.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ScannerRegistry')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`step4_verify`](command:synapse.focusNode?%22step4_verify.ts%22) ↔ [`ScannerRegistry`](command:synapse.focusNode?%22src%2Fcore%2FScannerRegistry.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('JsTsScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`JsTsScanner`](command:synapse.focusNode?%22src%2Fcore%2FJsTsScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ProjectMetadata')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`HarvestEngine`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FHarvestEngine.ts%22) ↔ [`ProjectMetadata`](command:synapse.focusNode?%22src%2Fcore%2FProjectMetadata.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ProjectMetadata')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`RemoteLayerProjector`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FRemoteLayerProjector.ts%22) ↔ [`ProjectMetadata`](command:synapse.focusNode?%22src%2Fcore%2FProjectMetadata.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`HarvestEngine`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FHarvestEngine.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'CanvasEngine' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`CanvasEngine`](command:synapse.focusNode?%22src%2Fcore%2Fcanvas-engine%2FCanvasEngine.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('CanvasEngine')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`CanvasEngine`](command:synapse.focusNode?%22src%2Fcore%2Fcanvas-engine%2FCanvasEngine.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`MountManager`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FMountManager.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'GraphModel' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphModel')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('NodeBuilder')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`TarjanSCC`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FTarjanSCC.ts%22) ↔ [`NodeBuilder`](command:synapse.focusNode?%22src%2Fcore%2FNodeBuilder.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ScannerRegistry')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`ScannerRegistry`](command:synapse.focusNode?%22src%2Fcore%2FScannerRegistry.ts%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'LogicAnalyzer' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`LogicAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2FLogicAnalyzer.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('LogicAnalyzer')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`LogicAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2FLogicAnalyzer.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('types')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BoundaryGuardAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Fanalyzers%2FBoundaryGuardAnalyzer.ts%22) ↔ [`types`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Ftypes.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('HarvestEngine')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) ↔ [`HarvestEngine`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FHarvestEngine.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`WebviewInterceptor`](command:synapse.focusNode?%22src%2Fcore%2FWebviewInterceptor.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('types')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`NecrosisAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Fanalyzers%2FNecrosisAnalyzer.ts%22) ↔ [`types`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Ftypes.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphAnalyzer')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2g_regression`](command:synapse.focusNode?%22verify_step2g_regression.ts%22) ↔ [`GraphAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2FGraphAnalyzer.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`LanguageResolver`](command:synapse.focusNode?%22src%2Fcore%2Fresolvers%2FLanguageResolver.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'EdgeCodeRefactorer' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`EdgeCodeRefactorer`](command:synapse.focusNode?%22src%2Fcore%2FEdgeCodeRefactorer.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('EdgeCodeRefactorer')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`EdgeCodeRefactorer`](command:synapse.focusNode?%22src%2Fcore%2FEdgeCodeRefactorer.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphModel')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2f`](command:synapse.focusNode?%22verify_step2f.ts%22) ↔ [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphModel')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`baseline_capture`](command:synapse.focusNode?%22baseline_capture.ts%22) ↔ [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('PythonScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`PythonScanner`](command:synapse.focusNode?%22src%2Fcore%2FPythonScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('assert')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2i5_regression`](command:synapse.focusNode?%22verify_step2i5_regression.ts%22) ↔ [`assert`](command:synapse.focusNode?%22assert%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('RustScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`step4_verify`](command:synapse.focusNode?%22step4_verify.ts%22) ↔ [`RustScanner`](command:synapse.focusNode?%22src%2Fcore%2FRustScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphModel')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2h_regression`](command:synapse.focusNode?%22verify_step2h_regression.ts%22) ↔ [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('IdentityManager')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) ↔ [`IdentityManager`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FIdentityManager.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('graphBuilder')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`graphBuilder`](command:synapse.focusNode?%22src%2Fcore%2FgraphBuilder.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('FlowScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) ↔ [`FlowScanner`](command:synapse.focusNode?%22src%2Fcore%2FFlowScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CompareProjection`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FCompareProjection.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`HarvestSessionManager`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FHarvestSessionManager.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'ClusterBridgeAnalyzer' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`ClusterBridgeAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2FClusterBridgeAnalyzer.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ClusterBuilder`](command:synapse.focusNode?%22src%2Fcore%2FClusterBuilder.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`SmellDetector`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FSmellDetector.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ClusterHierarchy`](command:synapse.focusNode?%22src%2Fcore%2FClusterHierarchy.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`TarjanSCC`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FTarjanSCC.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('TargetSelector')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ReasoningEngine`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FReasoningEngine.ts%22) ↔ [`TargetSelector`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2FTargetSelector.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('JVMAuditor')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`JVMAuditor`](command:synapse.focusNode?%22src%2Fcore%2FJVMAuditor.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('crypto')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) ↔ [`crypto`](command:synapse.focusNode?%22crypto%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('exclusionRules')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`graph_diff_audit`](command:synapse.focusNode?%22graph_diff_audit.ts%22) ↔ [`exclusionRules`](command:synapse.focusNode?%22src%2Futils%2FexclusionRules.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`filterSnapshot`](command:synapse.focusNode?%22src%2Fcore%2FfilterSnapshot.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('MountManager')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) ↔ [`MountManager`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FMountManager.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphModel')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ExecutionLayer`](command:synapse.focusNode?%22src%2Fcore%2Ftransaction%2FExecutionLayer.ts%22) ↔ [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ProjectMetadata')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`ProjectMetadata`](command:synapse.focusNode?%22src%2Fcore%2FProjectMetadata.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ScannerRegistry')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_registry_runtime`](command:synapse.focusNode?%22verify_registry_runtime.ts%22) ↔ [`ScannerRegistry`](command:synapse.focusNode?%22src%2Fcore%2FScannerRegistry.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('types')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`FractureAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Fanalyzers%2FFractureAnalyzer.ts%22) ↔ [`types`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Ftypes.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphModel')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`TargetSelector`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2FTargetSelector.ts%22) ↔ [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('BoundaryGuard')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) ↔ [`BoundaryGuard`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FBoundaryGuard.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('DataPipeline')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`test_hygiene`](command:synapse.focusNode?%22test_hygiene.ts%22) ↔ [`DataPipeline`](command:synapse.focusNode?%22src%2Fcore%2FDataPipeline.ts%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'GeminiParser' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`GeminiParser`](command:synapse.focusNode?%22src%2Fcore%2FGeminiParser.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GeminiParser')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`GeminiParser`](command:synapse.focusNode?%22src%2Fcore%2FGeminiParser.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`SymbolIndex`](command:synapse.focusNode?%22src%2Fcore%2FSymbolIndex.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphModel')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2g_regression`](command:synapse.focusNode?%22verify_step2g_regression.ts%22) ↔ [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`VirtualDebugger`](command:synapse.focusNode?%22src%2Fcore%2FVirtualDebugger.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphModel')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2g4_regression`](command:synapse.focusNode?%22verify_step2g4_regression.ts%22) ↔ [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('crypto')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`EdgeGenerator`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FEdgeGenerator.ts%22) ↔ [`crypto`](command:synapse.focusNode?%22crypto%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`SynapseIgnore`](command:synapse.focusNode?%22src%2Fcore%2FSynapseIgnore.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('crypto')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`HarvestProjection`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FHarvestProjection.ts%22) ↔ [`crypto`](command:synapse.focusNode?%22crypto%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GhostExpander')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2i4_regression`](command:synapse.focusNode?%22verify_step2i4_regression.ts%22) ↔ [`GhostExpander`](command:synapse.focusNode?%22src%2Fcore%2FGhostExpander.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('assert')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2i3_regression`](command:synapse.focusNode?%22verify_step2i3_regression.ts%22) ↔ [`assert`](command:synapse.focusNode?%22assert%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'RendererCore' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`RendererCore`](command:synapse.focusNode?%22src%2Fcore%2FRendererCore.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('RendererCore')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`RendererCore`](command:synapse.focusNode?%22src%2Fcore%2FRendererCore.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`DependencyPressureAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Fanalyzers%2FDependencyPressureAnalyzer.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`JsTsScanner`](command:synapse.focusNode?%22src%2Fcore%2FJsTsScanner.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('SqlScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`step4_verify`](command:synapse.focusNode?%22step4_verify.ts%22) ↔ [`SqlScanner`](command:synapse.focusNode?%22src%2Fcore%2FSqlScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`FlowchartGenerator`](command:synapse.focusNode?%22src%2Fcore%2FFlowchartGenerator.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`FractureAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Fanalyzers%2FFractureAnalyzer.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('RuleEngine')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CanvasEngine`](command:synapse.focusNode?%22src%2Fcore%2Fcanvas-engine%2FCanvasEngine.ts%22) ↔ [`RuleEngine`](command:synapse.focusNode?%22src%2Fcore%2FRuleEngine.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ProjectMetadata')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`graph_diff_audit`](command:synapse.focusNode?%22graph_diff_audit.ts%22) ↔ [`ProjectMetadata`](command:synapse.focusNode?%22src%2Fcore%2FProjectMetadata.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('CanvasEngine')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`DataPipeline`](command:synapse.focusNode?%22src%2Fcore%2FDataPipeline.ts%22) ↔ [`CanvasEngine`](command:synapse.focusNode?%22src%2Fcore%2Fcanvas-engine%2FCanvasEngine.ts%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'Logger' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ProjectMetadata')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) ↔ [`ProjectMetadata`](command:synapse.focusNode?%22src%2Fcore%2FProjectMetadata.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('BootstrapEngine')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`test_scan`](command:synapse.focusNode?%22test_scan.ts%22) ↔ [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GraphViewBuilder')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`TarjanSCC`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FTarjanSCC.ts%22) ↔ [`GraphViewBuilder`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2FGraphViewBuilder.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CompareEngine`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FCompareEngine.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ReferenceResolver')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2i3_regression`](command:synapse.focusNode?%22verify_step2i3_regression.ts%22) ↔ [`ReferenceResolver`](command:synapse.focusNode?%22src%2Fcore%2FReferenceResolver.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체(')) type = ')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`PythonScanner`](command:synapse.focusNode?%22src%2Fcore%2FPythonScanner.ts%22) ↔ [`)) type = `](command:synapse.focusNode?%22))%20type%20%3D%20%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`AiOrchestrator`](command:synapse.focusNode?%22src%2Fcore%2FAiOrchestrator.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`KotlinScanner`](command:synapse.focusNode?%22src%2Fcore%2FKotlinScanner.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('crypto')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`StateManager`](command:synapse.focusNode?%22src%2Fcore%2Fcanvas-engine%2FStateManager.ts%22) ↔ [`crypto`](command:synapse.focusNode?%22crypto%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('GeminiParser')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) ↔ [`GeminiParser`](command:synapse.focusNode?%22src%2Fcore%2FGeminiParser.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('LogicAnalyzer')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`extension`](command:synapse.focusNode?%22src%2Fextension.ts%22) ↔ [`LogicAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2FLogicAnalyzer.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('EdgeBuilder')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2i5_regression`](command:synapse.focusNode?%22verify_step2i5_regression.ts%22) ↔ [`EdgeBuilder`](command:synapse.focusNode?%22src%2Fcore%2FEdgeBuilder.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('crypto')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ProjectMetadata`](command:synapse.focusNode?%22src%2Fcore%2FProjectMetadata.ts%22) ↔ [`crypto`](command:synapse.focusNode?%22crypto%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`DeadEndAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Fanalyzers%2FDeadEndAnalyzer.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('NodeBuilder')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_step2c`](command:synapse.focusNode?%22verify_step2c.ts%22) ↔ [`NodeBuilder`](command:synapse.focusNode?%22src%2Fcore%2FNodeBuilder.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('RuleEngine')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`extension`](command:synapse.focusNode?%22src%2Fextension.ts%22) ↔ [`RuleEngine`](command:synapse.focusNode?%22src%2Fcore%2FRuleEngine.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`VisibleGraphResolver`](command:synapse.focusNode?%22src%2Fcore%2FVisibleGraphResolver.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('types')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CycleAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Fanalyzers%2FCycleAnalyzer.ts%22) ↔ [`types`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Ftypes.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ChatExtractor')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`extension`](command:synapse.focusNode?%22src%2Fextension.ts%22) ↔ [`ChatExtractor`](command:synapse.focusNode?%22src%2Futils%2FChatExtractor.ts%22)
- 🔴 **[Layer Gravity Violation] 'CanvasPanel' -> 'DebuggerSystem' (Layer user -> ai). 역행은 금지됩니다.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`DebuggerSystem`](command:synapse.focusNode?%22src%2Fcore%2FDebuggerSystem.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('DebuggerSystem')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) ↔ [`DebuggerSystem`](command:synapse.focusNode?%22src%2Fcore%2FDebuggerSystem.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('NodeBuilder')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_cluster_builder`](command:synapse.focusNode?%22verify_cluster_builder.ts%22) ↔ [`NodeBuilder`](command:synapse.focusNode?%22src%2Fcore%2FNodeBuilder.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('crypto')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BenchmarkGraphGenerator`](command:synapse.focusNode?%22src%2Fcore%2Fbenchmark%2FBenchmarkGraphGenerator.ts%22) ↔ [`crypto`](command:synapse.focusNode?%22crypto%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`HarvestEngine`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FHarvestEngine.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('CanvasPanel')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`BenchmarkHarness`](command:synapse.focusNode?%22src%2Fcore%2Fbenchmark%2FBenchmarkHarness.ts%22) ↔ [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`MarkdownScanner`](command:synapse.focusNode?%22src%2Fcore%2FMarkdownScanner.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('types')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`IsolatedNodeAnalyzer`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Fanalyzers%2FIsolatedNodeAnalyzer.ts%22) ↔ [`types`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Ftypes.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('RuleEngine')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`SpatialRuleBook`](command:synapse.focusNode?%22src%2Fcore%2Fcanvas-engine%2FSpatialRuleBook.ts%22) ↔ [`RuleEngine`](command:synapse.focusNode?%22src%2Fcore%2FRuleEngine.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('PythonScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`step4_verify`](command:synapse.focusNode?%22step4_verify.ts%22) ↔ [`PythonScanner`](command:synapse.focusNode?%22src%2Fcore%2FPythonScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('Logger')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`IdentityManager`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FIdentityManager.ts%22) ↔ [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('JavaScanner')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`step4_verify`](command:synapse.focusNode?%22step4_verify.ts%22) ↔ [`JavaScanner`](command:synapse.focusNode?%22src%2Fcore%2FJavaScanner.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ClusterBuilder')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`verify_cluster_builder`](command:synapse.focusNode?%22verify_cluster_builder.ts%22) ↔ [`ClusterBuilder`](command:synapse.focusNode?%22src%2Fcore%2FClusterBuilder.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('RenderProtocol')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`RendererCore`](command:synapse.focusNode?%22src%2Fcore%2FRendererCore.ts%22) ↔ [`RenderProtocol`](command:synapse.focusNode?%22src%2Fcore%2Fcanvas-engine%2FRenderProtocol.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('CompareEngine')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) ↔ [`CompareEngine`](command:synapse.focusNode?%22src%2Fcore%2Fcollaboration%2FCompareEngine.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('types')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`TarjanSCC`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FTarjanSCC.ts%22) ↔ [`types`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Ftypes.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('ProjectMetadata')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`extension`](command:synapse.focusNode?%22src%2Fextension.ts%22) ↔ [`ProjectMetadata`](command:synapse.focusNode?%22src%2Fcore%2FProjectMetadata.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('http')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`tier_b5_soak`](command:synapse.focusNode?%22scratch%2Ftier_b5_soak.ts%22) ↔ [`http`](command:synapse.focusNode?%22http%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('schema')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`ArchitectureDSL`](command:synapse.focusNode?%22src%2Fcore%2FArchitectureDSL.ts%22) ↔ [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22)
- 🔴 **[Boundary Violation] 타 클러스터의 내부 구현체('SnapshotSystem')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.**: [`baseline_capture`](command:synapse.focusNode?%22baseline_capture.ts%22) ↔ [`SnapshotSystem`](command:synapse.focusNode?%22src%2Fcore%2FSnapshotSystem.ts%22)

## 🔥 Top 10 Super Hubs (Bottlenecks)
*전체 23개의 병목 중 상위 10개*
- 🟠 [`schema`](command:synapse.focusNode?%22src%2Ftypes%2Fschema.ts%22) (집중도: 62)
- 🟠 [`GraphModel`](command:synapse.focusNode?%22src%2Fcore%2FGraphModel.ts%22) (집중도: 36)
- 🟠 [`Logger`](command:synapse.focusNode?%22src%2Futils%2FLogger.ts%22) (집중도: 33)
- 🟠 [`types`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Ftypes.ts%22) (집중도: 17)
- 🟠 [`crypto`](command:synapse.focusNode?%22crypto%22) (집중도: 15)
- 🟠 [`RuleEngine`](command:synapse.focusNode?%22src%2Fcore%2FRuleEngine.ts%22) (집중도: 15)
- 🟠 [`FileScanner`](command:synapse.focusNode?%22src%2Fcore%2FFileScanner.ts%22) (집중도: 14)
- 🟠 [`ProjectMetadata`](command:synapse.focusNode?%22src%2Fcore%2FProjectMetadata.ts%22) (집중도: 12)
- 🟠 [`assert`](command:synapse.focusNode?%22assert%22) (집중도: 9)
- 🟠 [`PhaseManager`](command:synapse.focusNode?%22src%2Fcore%2FPhaseManager.ts%22) (집중도: 9)

## 🚀 High Blast Radius Modules (Fan-out)
*전체 8개의 Fan-out 모듈 중 상위 10개 (변경 시 영향도 최대)*
- 🟡 [`BootstrapEngine`](command:synapse.focusNode?%22src%2Fbootstrap%2FBootstrapEngine.ts%22) (Fan-out: 25)
- 🟡 [`DataPipeline`](command:synapse.focusNode?%22src%2Fcore%2FDataPipeline.ts%22) (Fan-out: 25)
- 🟡 [`CanvasPanel`](command:synapse.focusNode?%22src%2Fwebview%2FCanvasPanel.ts%22) (Fan-out: 23)
- 🟡 [`extension`](command:synapse.focusNode?%22src%2Fextension.ts%22) (Fan-out: 21)
- 🟡 [`standalone`](command:synapse.focusNode?%22src%2Fserver%2Fstandalone.ts%22) (Fan-out: 21)
- 🟡 [`step4_verify`](command:synapse.focusNode?%22step4_verify.ts%22) (Fan-out: 12)
- 🟡 [`BenchmarkHarness`](command:synapse.focusNode?%22src%2Fcore%2Fbenchmark%2FBenchmarkHarness.ts%22) (Fan-out: 11)
- 🟡 [`ReasoningEngine`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FReasoningEngine.ts%22) (Fan-out: 8)

## 🔄 Top Circular Dependency Clusters (Legacy)
*총 1개의 원시(Raw) 순환 참조가 **1개의 핵심 군집**으로 압축되었습니다.*

### Cluster #1 (중복도: 1회)
- **관련 모듈**: [`InterventionSimulator`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2FInterventionSimulator.ts%22) ↔ [`TarjanSCC`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Freasoning%2FTarjanSCC.ts%22) ↔ [`types`](command:synapse.focusNode?%22src%2Fcore%2Fanalysis%2Ftypes.ts%22)
- **대표 경로 예시**:
  - `순환 의존성 발견: types -> InterventionSimulator -> TarjanSCC -> types`

## 🏗️ Relevant Structural Defects (Isolated/DeadEnd)
*총 49개의 구조 결함 중 시스템 영향도가 높은(Layer>0 등) 상위 항목만 표시합니다.*

- 우선순위가 높은(치명적인) 구조 결함은 발견되지 않았습니다.


---
*이 리포트는 SYNAPSE Unified Architecture Analysis Engine에 의해 자동 생성되었습니다.*