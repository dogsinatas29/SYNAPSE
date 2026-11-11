# encoding: utf-8
# Gate 2 Static Audit Synthesis Report: Experiment B Structural Risk, Semantic Discordance & Safety Contract Gap Analysis

## 📋 Document Metadata
- **Document Title:** Gate 2 Static Audit Synthesis Report
- **Document Path:** `mile_stone/EXPERIMENT_B_GATE2_SYNTHESIS_REPORT.md`
- **Document Status:** `LOCKED_AUDIT_SYNTHESIS`
- **Target Baseline:** SYNAPSE v0.3.34.74 / Experiment B Static Code Review
- **Creation Timestamp:** 2026-10-21T10:35:00+09:00
- **Governing Directive:** `mile_stone/EXPERIMENT_B_V0_AUDIT_CLOSURE_DIRECTIVE.md` (v2026-10-21T10:20:00)
- **Primary Source Records:**
  - `mile_stone/EXPERIMENT_B_GATE2_AUDIT_EVIDENCE_PACKAGE.md` (Draft Record)
  - `mile_stone/EXPERIMENT_B_V0_EVIDENCE_GAP_REGISTER.md` (v2026-10-21T10:06:30)
  - `mile_stone/EXPERIMENT_B_DISCREPANCY_LEDGER_V1.5.md` (v2026-10-21T10:31:00)
- **Active Governance Boundaries:**
  - Strict Code Freeze: ACTIVE (`NO_CODE_MODIFICATION` on `src/**`, `ui/**`)
  - Execution Freeze: ACTIVE (`NO_PIPELINE_EXECUTION` on tests, scripts, pipelines)
  - Gate 1 Baseline Status: **`BLOCKED`** (Preserved)
  - Gate 2 Historical Determination: **`FAIL`** (Preserved)
  - Gate 3 Dynamic Verification Status: **`ON HOLD`** (Preserved)
  - Historical Record Preservation: This synthesis is an additive, versioned document; it does NOT overwrite or erase prior records.

---

## 1. Audit Scope & Exact File Version Boundaries

To prevent conflation between committed Git repository history and local working tree edits, the exact inspected file states are recorded:

| Audited Production File | Measured Working Tree SHA-256 | Git HEAD SHA-256 (`447fc2c`) | Working Tree Drift vs HEAD | Audit Scope Boundary |
| :--- | :---: | :---: | :---: | :--- |
| `src/core/SymbolIndex.ts` | `3473c3f4c599bb78df10898824ec50dded5774d726271a673fa20eb4153c5d65` | `3473c3f4c599bb78df10898824ec50dded5774d726271a673fa20eb4153c5d65` | Identical (0 lines) | Committed HEAD state inspected. |
| `src/core/ReferenceResolver.ts` | `cd70862a11117d2cb895e35d1cb9b262eaea82b776dcb9987934d71bd054ae0b` | `5fc1651cafd276316604ddfa4c579b248e12e772e0d8c2d326e470ac92cd7037` | **Diverged (+628 / -88 lines)** | **Uncommitted working tree inspected.** Does NOT prove historical Experiment B state. |
| `src/core/DataPipeline.ts` | `9abfad843de8d43a91dab802fb3445fe676f458a07b10c00d773589477a01bcb` | `9abfad843de8d43a91dab802fb3445fe676f458a07b10c00d773589477a01bcb` | Identical (0 lines) | Committed HEAD state inspected. |

> **Critical Provenance Caveat:**
> The Gate 2 audit evaluated `src/core/ReferenceResolver.ts` at hash `cd70862a...` (filesystem `mtime`: 2026-10-18 14:54:29 KST). This hash diverges from Git HEAD (`5fc1651c...`). While this establishes the exact byte identity of what was read during the static audit, **it does not constitute evidence that this exact code state was executed during the historical Experiment B run.** Historical execution causality remains unproven.

---

## 2. Independent Synthesis of Gate 2 Audit Items (V1, V2, V3)

### 2.1 Item V1: Structural Collision Risk in `SymbolIndex.ts`
- **Audit Target:** `src/core/SymbolIndex.ts` (Lines 29, 150–161).
- **Physical Code Facts (`FACT`):**
  1. Storage Structure: `private symbolToPath: Map<string, string> = new Map();` — exactly one path string is stored per symbol name without candidate partitioning or multi-candidate lists.
  2. Overwrite Logic:
     ```typescript
     const existing = this.symbolToPath.get(name);
     if (!existing) {
         this.symbolToPath.set(name, filePath);
     } else {
         const isHeader = (p: string) => /\.(h|hpp|hxx)$/i.test(p);
         const isSource = (p: string) => /\.(c|cpp|cc|rs)$/i.test(p);
         if (isHeader(existing) && isSource(filePath)) {
             this.symbolToPath.set(name, filePath);
         }
     }
     ```
  3. Overwrite Behavior: The map overwrites an existing entry **only** if the existing entry is a header and the incoming entry is a source file. Source-to-source collisions are settled by first-registration wins; header-to-source collisions overwrite.
- **Boundaries of the Determination:**
  - **Static Structure Risk:** **`PASS`** — The physical data structure and overwrite branches conclusively demonstrate that cross-module collisions occur when multiple files define identical symbol names.
  - **Historical Runtime Causality:** **`UNVERIFIED`** — Static code inspection does not establish whether the 4 historical Experiment B edges were generated specifically by this overwrite branch during that past run.

---

### 2.2 Item V2: Semantic Discordance between Callers and Callee Files
- **Audit Target:** 4 specific caller call-sites and callee file definitions in RustDesk workspace.
- **Physical Code Facts (`FACT`):**
  1. `flutter/windows/runner/win32_window.cpp`: Calls `pTaskbarList->Release()` (COM interface pointer `ITaskbarList3`). Callee `res/msi/CustomActions/FirewallRules.cpp` defines no global `Release()` function.
  2. `src/platform/windows.cc`: Calls `xpsFactory->Release()` and `jobStream->Release()` (COM interface pointers). Callee `res/msi/CustomActions/CustomActions.cpp` defines no global `Release()` function.
  3. `libs/clipboard/src/windows/wf_cliprdr.c`: Calls `Sleep(10)` (Win32 SDK function). Callee `res/msi/CustomActions/FirewallRules.cpp` defines no global `Sleep()` function.
  4. `libs/virtual_display/dylib/src/win10/IddController.c`: Calls `Sleep(1000)` (Win32 SDK function). Callee `res/msi/CustomActions/CustomActions.cpp` defines no global `Sleep()` function.
- **Boundaries of the Determination:**
  - **Static Context Discordance:** **`PASS`** — Conclusively establishes that the syntax and types at the call-sites are COM methods or Win32 SDK APIs and are completely discordant with the actual symbol definitions in the target MSI files.
  - **Historical Edge Generation Trajectory:** **`UNVERIFIED`** — Demonstrating that a call is a COM/Win32 API does not reconstruct the exact historical runtime parser/resolver step that generated the graph edge in Experiment B.

---

### 2.3 Item V3: Implementation Status of Proposed Safety Contract v2.5
- **Audit Target:** Audited production files (`SymbolIndex.ts`, `ReferenceResolver.ts`, `DataPipeline.ts`).
- **Audit Scope & Evidence Baseline:**
  - Audited against the normative requirements of `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` (v2.5 `PROPOSED`).
- **Physical Audit Findings (`FACT`):**
  1. Win32/COM System API Guard: Zero occurrences of `SYSTEM_API_GUARD` or any equivalent pre-lookup interception mechanism for Win32/COM SDK calls.
  2. Reference Tracking & Deterministic IDs: Zero occurrences of `referenceId` or any deterministic coordinate hashing formula in the resolver pipeline.
  3. Fallback Pruning Guards: Zero occurrences of `FALLBACK_PRUNED_REJECT` or any structured secondary fallback rejection logic.
  4. Multi-Candidate Partitioning: Zero candidate set partitioning logic; single-path storage remains unchanged.
  5. Scope Limitation: The audit strictly confirmed absence within the three examined production files (`SymbolIndex.ts`, `ReferenceResolver.ts`, `DataPipeline.ts`); it does not assert the absence of uninspected files or external plugins.
- **Boundaries of the Determination:**
  - **Contract Conformance:** **`FAIL`** — The safety mechanisms required by Contract v2.5 are completely unimplemented in the audited production code state.

---

## 3. Synthesis Evaluation Table

| Evaluation Item | Audited Dimension | Established Fact (`FACT`) | Historical Causality / Scope Limit | Individual Determination |
| :--- | :--- | :--- | :--- | :---: |
| **V1 (SymbolIndex)** | Static Storage & Overwrite Logic | Single-path Map; header $\to$ source overwrite rule confirmed. | Historical execution causality unproven. | **`PASS` (Static Risk Confirmed)** |
| **V2 (Source Context)** | Call-Site Semantics vs Callee | COM/Win32 calls bound to callee files lacking definitions. | Historical graph generation path unproven. | **`PASS` (Discordance Confirmed)** |
| **V3 (Contract v2.5)** | Safety Contract Implementation | 5 safety contract mechanisms absent in audited files. | Scope strictly bounded to 3 audited files. | **`FAIL` (Contract Not Present)** |
| **Gate 2 Overall** | Gate 2 Review Determination | V1 and V2 pass static risk, but V3 fails contract conformance. | Gate 2 fails; code freeze and execution freeze active. | **`FAIL` (Historical Status Preserved)** |

---

## 4. Preservation of Authoritative Governance

1. **Gate 2 Determination Remains `FAIL`:**
   - The overall determination of Gate 2 is **`FAIL`**. Synthesizing the static audit evidence does not alter, dilute, or overturn this failure record.

2. **No Execution Authorization:**
   - Publishing this synthesis report constitutes documentation closure for Gate 2 static review.
   - It **does not grant permission** to modify production code (`src/**`, `ui/**`), nor does it authorize test runners, scripts, or pipeline execution.

3. **Status Across Repository Gates:**
   - **Historical Experiment B:** `FAIL` (Preserved permanently).
   - **Gate 1 (V0 Baseline Audit):** `BLOCKED` (Preserved).
   - **Gate 2 (V1–V3 Static Audit):** `FAIL` (Preserved).
   - **Gate 3 (V4–V5 Dynamic Verification):** `ON HOLD` (Preserved).
   - **Code and Pipeline Freezes:** Fully active.
