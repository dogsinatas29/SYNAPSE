# 🏛️ PROJECT ARCHITECTURE: MASTER HUB (v0.2.21 Sovereign Spec)

> **"One Truth, Distributed Execution."**
> 이 문서는 SYNAPSE의 중앙 관제탑이자 모든 모듈화된 명령 체계의 허브입니다.

---

## 🗺️ Documentation Orchestration (Modular Specs)
복잡도를 제어하기 위해 상세 설계는 다음 도메인 전문 문서로 분산 관리됩니다.

- [🧠 Core Engine (Rendering & Logic)](file:///home/dogsinatas/TypeScript_project/antigravity-extension-vis/core_synapse.md)
- [🎨 Visual Impact (Error Tracer & Logic)](file:///home/dogsinatas/TypeScript_project/antigravity-extension-vis/visual_impact.md)
- [📜 Reporting & Diagnosis](file:///home/dogsinatas/TypeScript_project/antigravity-extension-vis/reporting.md)
- [📦 Data Scheme & Persistence](file:///home/dogsinatas/TypeScript_project/antigravity-extension-vis/data_scheme.md)

---

## 🛰️ Sovereign Protocol: Hub & Worker Mapping
팀 기반 협업 및 자치 구역 설계를 위한 권한지도입니다.

### [HUB: HUB_MASTER]
- **OWNER**: Commander (Admin)
- **STATUS**: Authority
- **SCOPE**: Root, src/core/*, src/webview/*
- **RESOURCES**: [규약.md](file:///home/dogsinatas/TypeScript_project/antigravity-extension-vis/RULES.md)

### [HUB: HUB_001_GEMINI]
- **OWNER**: Gemini (Worker)
- **STATUS**: Active
- **SANDBOX**: /src/workers/gemini/
- **CLUSTER**: `CL_LOGIC_SCANNER`
- **NODES**: [N001, N002, N003]

---

## 🏗️ System Topology Overview
전체 시스템의 핵심 계층 구조입니다. 상세 내용은 각 모듈 문서를 참조하십시오.

```mermaid
flowchart TD
  subgraph cluster_src ["src"]
    node_src_cli_ts_1772842987428["cli.ts"]
    node_src_client_ts_1772842987428["client.ts"]
    node_src_extension_ts_1772842987428["extension.ts"]
  end
  subgraph cluster_src_bootstrap ["bootstrap"]
    node_src_bootstrap_BootstrapEngine_ts_1772842987428["BootstrapEngine.ts"]
  end
  subgraph cluster_src_core ["core"]
    node_src_core_AiOrchestrator_ts_1772842987428["AiOrchestrator.ts"]
    node_src_core_BillingManager_ts_1772842987428["BillingManager.ts"]
    node_src_core_DatabaseEngine_ts_1772842987428["DatabaseEngine.ts"]
    node_src_core_EdgeCodeRefactorer_ts_1772842987428["EdgeCodeRefactorer.ts"]
    node_src_core_FileScanner_ts_1772842987428["FileScanner.ts"]
    node_src_core_FlowScanner_ts_1772842987428["FlowScanner.ts"]
    node_src_core_FlowchartGenerator_ts_1772842987428["FlowchartGenerator.ts"]
    node_src_core_GeminiParser_ts_1772842987428["GeminiParser.ts"]
    node_src_core_LogicAnalyzer_ts_1772842987428["LogicAnalyzer.ts"]
    node_src_core_PromptLogger_ts_1772842987428["PromptLogger.ts"]
  end
  subgraph cluster_src_server ["server"]
    node_src_server_server_ts_1772842987428["server.ts"]
    node_src_server_standalone_ts_1772842987428["standalone.ts"]
  end
  subgraph cluster_src_test ["test"]
    node_src_test_FileScanner_test_ts_1772842987428["FileScanner.test.ts"]
    node_src_test_FlowchartGenerator_test_ts_1772842987428["FlowchartGenerator.test.ts"]
    node_src_test_GeminiParser_test_ts_1772842987428["GeminiParser.test.ts"]
    node_src_test_visualHints_test_ts_1772842987428["visualHints.test.ts"]
  end
  subgraph doc_shelf ["📚 Documentation Shelf"]
    node_GEMINI_md_1772842987428["GEMINI.md"]
    node_architecture_md_1772842987428["architecture.md"]
    node_core_synapse_md_1772842987428["core_synapse.md"]
    node_data_scheme_md_1772842987428["data_scheme.md"]
    node_reporting_md_1772842987428["reporting.md"]
    node_visual_impact.md_1772842987428["visual_impact.md"]
  end

  node_src_extension_ts_1772842987428 --> node_src_webview_CanvasPanel_ts_1772842987428
  node_src_extension_ts_1772842987428 --> node_src_bootstrap_BootstrapEngine_ts_1772842987428
  node_src_webview_CanvasPanel_ts_1772842987428 --> node_src_core_FileScanner_ts_1772842987428
  node_src_webview_CanvasPanel_ts_1772842987428 --> node_src_core_LogicAnalyzer_ts_1772842987428
  node_src_core_LogicAnalyzer_ts_1772842987428 --> node_src_types_schema_ts_1772842987428
  node_src_core_FlowchartGenerator_ts_1772842987428 --> node_src_types_schema_ts_1772842987428
```

---

## ⚠️ Operation Rules
1. **SSoT (Single Source of Truth)**: 모든 물리적 변화는 시냅스 캔버스에서 승인된 후 이 문서와 소스코드에 동시 각인됩니다.
2. **Modular Integrity**: 각 모듈 문서는 독립적으로 작동하되, 이 마스터 허브의 [Interface] 규약을 절대 준수해야 합니다.
3. **Audit Trail**: 모든 허브의 `Status` 변화는 스냅샷 히스토리에 영구 기록됩니다.
