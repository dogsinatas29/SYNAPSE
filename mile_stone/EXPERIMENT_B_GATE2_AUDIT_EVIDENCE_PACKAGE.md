# encoding: utf-8
# Gate 2 Audit Evidence Package: Experiment B Structural Risk & Safety Contract Review

## 📋 Document Metadata
- **Document Title:** Gate 2 Audit Evidence Package (Experiment B Static Audit)
- **Document Path:** `mile_stone/EXPERIMENT_B_GATE2_AUDIT_EVIDENCE_PACKAGE.md`
- **Document Status:** `AUDIT_RECORD_DRAFT_PENDING_EVIDENCE_REVIEW`
- **Audit Target Version:** SYNAPSE v0.3.34.74 (Targeting Experiment B Resolution)
- **Creation Timestamp:** 2026-10-20T10:20:00+09:00
- **Evidence Basis:** User-provided command logs, file SHA-256 verifications, and static control-flow audit
- **Independent Verification:** INCOMPLETE (Runtime causality unverified)
- **Production Source Modification:** STRICTLY FORBIDDEN (Strict Code Freeze active)
- **Runtime / Pipeline Validation:** NOT PERFORMED (ON HOLD)
- **Supersedes Prior Records:** NO (Append-only record; historical findings preserved)

---

## 1. Audit Scope & File Hash Verifications

### 1.1 Checked Files & SHA-256 Hashes
*Note: Hashes are verified based on user-provided execution logs and local read-only commands.*

| File Path | SHA-256 Hash | Audit Baseline Status |
| :--- | :--- | :--- |
| `src/core/SymbolIndex.ts` | `3473c3f4c599bb78df10898824ec50dded5774d726271a673fa20eb4153c5d65` | MATCH (No drift during audit) |
| `src/core/ReferenceResolver.ts` | `cd70862a11117d2cb895e35d1cb9b262eaea82b776dcb9987934d71bd054ae0b` | MATCH (No drift during audit) |
| `src/core/DataPipeline.ts` | `9abfad843de8d43a91dab802fb3445fe676f458a07b10c00d773589477a01bcb` | MATCH (No drift during audit) |
| `mile_stone/SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` | `d4162ea591a26178676c71474a9f6f5be51def5e5ed8d95ca35641b090b737f1` | MATCH (v2.5 PROPOSED) |
| `mile_stone/UNIT_TEST_SPEC_V2.5.md` | `ecfb5ba8b10bdd714f56f735687fef731d16117c1ce811b31ea1ddd3cd948c30` | MATCH (v1.4 DRAFT) |

---

## 2. Evidence Verification Item V1 — Structural Misbinding Risk in `SymbolIndex.ts`

### 2.1 Static Code Observations
1. **Physical Path:** `src/core/SymbolIndex.ts` (not nested under `src/core/analysis/pipeline/`).
2. **Single Path Storage:** Line 29:
   ```typescript
   private symbolToPath: Map<string, string> = new Map();
   ```
   Each symbol key maps strictly to a single `string` filepath, lacking candidate list or module-scoped partitions.
3. **Exact Overwrite Semantics:** Lines 150–161:
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
   - **Precision Correction:** The map does **NOT** blindly overwrite with the last visited file.
   - An existing entry is overwritten **ONLY** when the existing entry is a header (`.h/.hpp/.hxx`) and the incoming entry is a source file (`.c/.cpp/.cc/.rs`).
   - If both are source files, or if incoming is a header, incoming is ignored. Thus, registration order and extension hierarchy dictate the winner.

### 2.2 Verdict
- **Static Structure Risk:** `PASS` (The structure admits cross-module collisions when a common symbol name is defined in multiple source files).
- **Historical Runtime Causality:** `UNVERIFIED` (Static analysis does not prove whether the 4 Experiment B misbound edges were generated specifically through this overwrite branch during that run).

---

## 3. Evidence Verification Item V2 — Source Context & Misbound Edges

### 3.1 Separation of Evidence Types
To avoid conflating graph records with source definitions, two independent evidence bases are logged:
1. **Edge Evidence:** Historical edge records logged in Experiment B reports connecting Windows client files to MSI installer files.
2. **Source Context Evidence:** Direct inspection of caller call-sites and callee file symbol definitions.

### 3.2 Call-Site Context Analysis
1. **`flutter/windows/runner/win32_window.cpp`**:
   - Call: `pTaskbarList->Release()` (COM interface pointer `ITaskbarList3`).
   - Callee: `src/platform/windows/msi/FirewallRules.cpp`.
   - Inspection: `FirewallRules.cpp` defines no global `Release()` function.
2. **`src/platform/windows.cc`**:
   - Calls: `xpsFactory->Release()`, `jobStream->Release()` (COM interface pointers).
   - Callee: `src/platform/windows/msi/CustomActions.cpp`.
   - Inspection: `CustomActions.cpp` defines no global `Release()` function.
3. **`libs/clipboard/src/windows/wf_cliprdr.c`**:
   - Call: `Sleep(10)` (Win32 SDK function).
   - Callee: `src/platform/windows/msi/FirewallRules.cpp`.
   - Inspection: `FirewallRules.cpp` defines no global `Sleep()` function.
4. **`libs/virtual_display/dylib/src/win10/IddController.c`**:
   - Call: `Sleep(1000)` (Win32 SDK function).
   - Callee: `src/platform/windows/msi/CustomActions.cpp`.
   - Inspection: `CustomActions.cpp` defines no global `Sleep()` function.

### 3.3 Verdict
- **Source Context Semantic Check:** `PASS` (Confirmed that call-site semantics are COM/Win32 APIs and completely discordant with callee file contents).
- **Historical Generation Causality:** `UNVERIFIED` (Exact pipeline execution trace leading to edge emission is not verified from static source alone).

---

## 4. Evidence Verification Item V3 — Implementation Status of Proposed Contract v2.5

### 4.1 Search Results & Control-Flow Audit
A static search and control-flow review of `src/core/SymbolIndex.ts`, `src/core/ReferenceResolver.ts`, and `src/core/DataPipeline.ts` was performed.

| Identifier / Contract Requirement | Count in Code | Control-Flow Finding |
| :--- | :---: | :--- |
| `SYSTEM_API_GUARD` | 0 | No pre-lookup interception for Win32/COM APIs |
| `referenceId` | 0 | Reference tracking does not carry deterministic IDs |
| `FALLBACK_PRUNED_REJECT` | 0 | Fallback does not record structured rejection reasons |
| Partition Invariant / Multi-Candidate | 0 | `SymbolIndex` stores only 1 path per symbol |
| Equivalent Alternative Guards | 0 | No equivalent guard or boundary-check logic exists |

### 4.2 Precision Distinction
- Zero hits for specific identifier strings (`SYSTEM_API_GUARD`, etc.) indicates absence of named symbols.
- A thorough control-flow trace confirmed that **no equivalent mechanisms exist under different names** to reject external system APIs or partition symbol candidates.
- Classification: **Not Implemented against Proposed Design Baseline (v2.5)**.

### 4.3 Verdict
- **Contract Conformance:** `FAIL` (The required safety architecture is wholly absent in current production source).

---

## 5. Summary Evaluation Table

| Audit Step | Static Verification | Historical Runtime Causality | Conformance against Baseline | Status |
| :--- | :---: | :---: | :---: | :---: |
| **V1 (SymbolIndex Structure)** | Verified (`Map<string, string>`) | Unverified | N/A | **`PASS`** (Static Risk Confirmed) |
| **V2 (4 Edge Contexts)** | Verified (Context mismatch) | Unverified | N/A | **`PASS`** (Context Conflict Confirmed) |
| **V3 (Safety Contract v2.5)** | Verified (No implementation) | N/A | Not Implemented | **`FAIL`** (Contract Not Present) |
| **Gate 2 Overall** | Completed Static Audit | Unverified | Non-Compliant | **`FAIL`** (Gate 2 Incomplete/Failed) |

---

## 6. Governance & Invariants
- **Gate 2 Static Audit:** Complete, but overall result is `FAIL` due to V3 non-implementation.
- **Production Code:** Strict Code Freeze remains active (`src/`, `ui/` untouched).
- **Pipeline & Tests:** Execution remains strictly `ON HOLD`.
- **Next Permitted Step:** Triage V0 evidence gaps and align Contract v2.5 with Unit Test Spec v1.4 without modifying production source code.

---

## 7. Gate 2 V1 Static Evidence Traceability Spec: Semantic Evidence Gap Record

### 7.1 Verification Scope & Metadata
- **Evidence Source:** Code extract inspection and static code path tracing report (`ReferenceResolver.ts`, `SymbolIndex.ts`, `EdgeBuilder.ts`, `DataPipeline.ts`)
- **Verification Level:** Static review of user-provided and workspace code paths
- **Independent Verification:** `NOT_PERFORMED`
- **Execution Evidence:** `NOT_PERFORMED`
- **Finding Status:** Defect identified during static audit

### 7.2 Traceability Entry: G2-V1-A / B / C
- **Audit Target:** `src/core/SymbolIndex.ts`, `src/core/ReferenceResolver.ts`, `src/core/EdgeBuilder.ts`, `src/core/DataPipeline.ts`
- **Claim:** `VERIFIED_FUNCTION_CALL` provenance and `CALL` Edge registration represent an independently verified semantic function call relationship.
- **Evidence:**
  1. **Provenance Promotion Logic (`ReferenceResolver.ts:509–512`):**
     Promoted strictly on `resolutionKind !== 'unresolved'` after passing basic heuristic syntax filters (`garbageKeywords`, `toUpperCase`, `dslKeywords`). No AST definition matching, scope/namespace binding, or call-signature verification exists.
  2. **Candidate Count Semantics (`ReferenceResolver.ts:545–555`):**
     `candidateCount: 1` is injected as a hardcoded literal constant for all non-broadcast branches, reflecting single-target routing rather than empirical proof of definition uniqueness.
  3. **Edge Construction & Provenance Ingestion (`EdgeBuilder.ts:43–68, 195–208`):**
     `api_call` references are directly mapped to `CALL` edges based purely on string matching (`mappedType = 'CALL'`). Edge builder passes through `ref.provenance` without semantic filtering or validation gating.
- **Finding:**
  - `G2-V1-A (CONFIRMED — SEMANTIC EVIDENCE GAP)`: Disparity between provenance assertion (`VERIFIED_FUNCTION_CALL`) and actual proof level (mere non-unresolved resolution).
  - `G2-V1-B (CONFIRMED — EVIDENCE SEMANTICS MISMATCH)`: `candidateCount: 1` reflects branch routing structure, not evaluated candidate set uniqueness.
  - `G2-V1-C (CONFIRMED — SEMANTIC VALIDATION GAP)`: Absence of independent semantic validation prior to `CALL` edge materialization.
- **Impact:**
  Heuristic-based or insufficiently validated symbol selections may be materialized as `CALL` edges without independent semantic proof.
- **Closure Condition (3-Tier Structure):**
  1. **Contract:** Define the permissible Edge types and Provenance semantics according to the certainty levels of reference resolution.
  2. **Verification:** Formally establish that candidate uniqueness, semantic validation, and Edge registration criteria strictly conform to the defined contract.
  3. **Evidence:** Secure end-to-end traceability linking validation outputs with verifiable runtime/pipeline evidence.
- **Authorization Boundary:**
  `CODE_FREEZE: ACTIVE`, `EXECUTION_FREEZE: ACTIVE`. Production source modification, test execution, compilation, and pipeline execution remain strictly prohibited until explicit external governance authorization.

---

## 8. Gate 2 V1 Resolution Evidence Contracts (Draft Specification)

- **Document Status:** `DRAFT — SCOPE_REDEFINED_PENDING_REVIEW`
- **Scope Limit:** Normative specification of resolution criteria and evidence boundaries. Does not imply code changes, test execution, or gate status alteration.

### 8.1 Core Architectural Goal & Boundary Principles
- **Core Objective:** Exclude build, packaging, and tooling artifacts from the project architecture analysis graph while preserving valid architectural dependencies among genuine application source files.
- **Evidentiary Boundary:** The target of this specification is strictly bounded to preventing build-system contamination (e.g., Experiment B MSI misbindings) and safeguarding application source relationships. Full compiler-grade cross-file semantic typing is decoupled and treated as a separate evolutionary roadmap.
- **Verification Status:**
  ```text
  BUILD_SYSTEM_EXCLUSION: NOT ESTABLISHED
  SOURCE_RELATION_PRESERVATION: NOT ESTABLISHED
  ```

---

### 8.2 Category 1: Build Subsystem Exclusion & System API Boundary Contract (Direct Scope)

#### 8.2.1 Build Subsystem Exclusion & Symbol Isolation Principle (P1 Clarified & Ingestion-Guarded)
1. **Four-Tier File Classification Schema:**
   - `BUILD_INFRASTRUCTURE`: Build manifests, installer/MSI scripts, packaging configs, and CI tools representing infrastructure/deployment metadata.
   - `APPLICATION_SOURCE`: Genuine product runtime source files implementing application domain logic.
   - `BOUNDARY_ARTIFACT`: Interface or entry files bridging application code and build scripts (requires explicit verification before classification).
   - `UNCLASSIFIED`: Artifacts whose category is not definitively established by manifest or path evidence.
2. **Build Infrastructure Exclusion at Project-State Ingestion Boundary:**
   - **Node Registration Prohibition:** Files definitively classified as `BUILD_INFRASTRUCTURE` must NOT be registered into the application analysis node set ($V_{\text{app}}$) in `project_state.json`:
     $$V_{\text{build}} = \{v \mid \text{classification}(v) = \text{BUILD\_INFRASTRUCTURE}\}$$
     $$V_{\text{build}} \cap V_{\text{app}} = \varnothing$$
   - **Ingestion Exclusion Criterion:** Excluding symbols from `SymbolIndex` or suppressing edges downstream while allowing build files into `project_state.json` does NOT satisfy the build-system exclusion requirement. Node-level exclusion at ingestion boundary is a prerequisite.
3. **Fail-Safe Principle for `UNCLASSIFIED` Artifacts (Protection & Non-CALL Constraint):**
   - Files marked as `UNCLASSIFIED` must NOT be mechanically deleted, dropped, or assumed to be `BUILD_INFRASTRUCTURE` without definitive evidence (prohibiting disguise of classification failures as successful build exclusion).
   - Concurrently, they must NOT be arbitrarily promoted to `APPLICATION_SOURCE` or registered into the primary `SymbolIndex`.
   - **Bidirectional CALL Prohibition:** Whether an `UNCLASSIFIED` file acts as `source` (caller) or `target` (callee), any reference involving it must be held in a guarded, non-CALL state until classification evidence is established. It shall under no circumstances generate a standard internal `CALL` edge.
4. **Indexing Boundary Rule:** Symbols defined within `BUILD_INFRASTRUCTURE` files must NOT be registered into the primary application runtime symbol catalog (`SymbolIndex`).
5. **Contamination Prevention:** Application source files must never resolve identifiers to `BUILD_INFRASTRUCTURE` artifacts without dedicated external/build-layer qualification.
#### 8.2.2 System SDK / OS API Boundary Guard (P2 Clarified & Guarded)
1. **System Identifier Guard (Interception Boundary):** Common OS, Win32, and COM interface methods (e.g., `Release`, `Sleep`, `AddRef`, standard Win32 SDK symbols) serve as boundary guards. Identifier presence does not prove an external runtime call globally, but strictly prohibits automatic absorption into internal build/installer files absent explicit caller-callee binding proof.
2. **Internal Absorption Prohibition:** System SDK API invocations must NEVER be absorbed into internal workspace source or installer files based merely on coincident symbol name matching.
3. **Disposition of Undetermined Calls (`PENDING_CLASSIFICATION` Proposal):**
   - When a call matches system API identifiers but lacks definitive external binding or internal AST proof, its status is designated as `PENDING_CLASSIFICATION` (proposed normative evaluation state, not an established engine schema).
   - **Normative Invariant (CALL Prohibition):** Under no circumstances shall an undetermined or `PENDING_CLASSIFICATION` call materialize as a standard internal `CALL` edge.
   - **Proposed Handling Options `[PENDING ENGINE REVIEW]`:** Downstream engine handling options (e.g., retention as a provisional non-CALL reference vs total exclusion from application call-graph metrics) remain strictly non-normative proposals to prevent premature schema drift.
4. **Verification Flow for Category 1:**
   `[File Classification: App vs Build]` $\rightarrow$ `[Symbol Indexing Partition]` $\rightarrow$ `[SDK Boundary Interception]` $\rightarrow$ `[Build-Edge Suppression Proof]`
---

### 8.3 Category 2: Genuine Application Source Relationship Preservation Contract (Core Invariant)

#### 8.3.1 Invariant of Source Relationship Preservation
Exclusion of build artifacts must not cause collateral damage to genuine source dependencies. All valid call, include, and reference relationships between legitimate application source files must be preserved without loss.

#### 8.3.2 Justified Source Selection Rules & Baseline Verification Invariant (P3 Clarified)
1. **C/C++ Implementation vs Header Declarations (`JUSTIFIED_SINGLE_DEFINITION`):** Specific to C/C++, when resolving function calls across valid application source files, an implementation file (`.c`, `.cpp`, `.cc`) must be deterministically preferred over pure header declarations (`.h`, `.hpp`). Selection of an implementation file does not of itself prove the runtime validity of the call. *(Rust `.rs` files follow distinct module tree rules and are decoupled from C header rules).*
2. **Contextual Scope Integrity:** Where multiple valid application source definitions exist, language-specific scoping (imports, namespaces, local module declarations) must be evaluated before concluding ambiguity.
3. **Independent Disaggregation of Node and Edge Exclusions:**
   - **Node Exclusion Set ($V_{\text{build}}$):**
     $$V_{\text{build}} = \{v \mid \text{classification}(v) = \text{BUILD\_INFRASTRUCTURE}\}$$
   - **Edge Exclusion Set ($E_{\text{build}}$):**
     $$E_{\text{build}} = \{e \mid \text{source}(e) \in V_{\text{build}} \lor \text{target}(e) \in V_{\text{build}}\}$$
   - **Independence Invariant:** Node exclusion and edge suppression must be verified independently. Verification of node exclusion does not by itself prove complete elimination of edge contamination, nor does edge suppression prove node exclusion at ingestion boundary.
4. **Comparison Baseline Tri-Partition (`Pre-exclusion Application Subgraph`):**
   To verify that build exclusion does not collapse into an unconstrained relationship reconstruction project, baseline graph entities must strictly disaggregate into three mutually exclusive categories:
   - `VALID_BASELINE` ($E_{\text{valid,baseline}}$): Edges supported by existing verifiable import/AST evidence connecting genuine application domain files ($V_{\text{app}}$).
   - `UNVERIFIED_BASELINE` ($E_{\text{unverified,baseline}}$): Existing pre-exclusion edges lacking independent ground-truth evidence (isolated and reported, but neither assumed valid nor mechanically purged).
   - `BUILD_SYSTEM_EXCLUDED` ($V_{\text{build}}$, $E_{\text{build}}$): Build infrastructure node and edge sets targeted for exclusion.
   *Identity Matching Rule:* Edge identity between runs is determined strictly by the coordinate tuple `sourceId::targetId::type`.
5. **Dual Differential Verification Invariants:**
   Certification of source relationship preservation strictly requires simultaneous satisfaction of two independent conditions:
   - **Condition A (Spurious Edge Reduction):** A demonstrable reduction in invalid cross-boundary edges connecting application sources to build/installer artifacts:
     $$E_{\text{spurious,after}} < E_{\text{spurious,before}}$$
     *(Target: $E_{\text{spurious,after}} = 0$, reported with exact count of residual spurious edges).*
   - **Condition B (True-Positive Source Retention):** Complete preservation of verified application source edges without collateral loss:
     $$E_{\text{valid,baseline}} \subseteq E_{\text{valid,after}}$$
     *(Zero loss: $|E_{\text{valid,baseline}} \setminus E_{\text{valid,after}}| = 0$).*
   *Unless both Condition A and Condition B are empirically verified against the defined baseline, `SOURCE_RELATION_PRESERVATION` remains strictly `NOT ESTABLISHED`.*
---

### 8.4 Category 3: Decoupled General Semantic Engine Topics (Future Scope / Open Questions)

The following topics represent general static analysis engine enhancements that are decoupled from the immediate build-system exclusion objective and are strictly non-blocking for Gate 2 resolution:

1. **Compiler-Grade Cross-File AST Type Inference Engine:** Full syntactic call-graph type checking across heterogeneous multi-language boundaries is categorized as `FUTURE_ROADMAP`.
2. **Extended Graph Schema Edge Attributes:** Proposals for novel edge types (e.g., `HEURISTIC_CALL`, `EXTERNAL_LINK`) or sub-status attributes (`status: 'provisional'/'confirmed'`) remain classified as `PENDING COMPATIBILITY REVIEW` and will not gate current milestone resolution.
3. **Open Questions (`OPEN QUESTION`):**
   - *[OQ-BS-01]* What deterministic heuristic/manifest-driven boundary reliably segregates build/installation sources across diverse repository layouts without manual per-project configuration?
   - *[OQ-BS-02]* What is the minimal system API catalog required to eliminate Win32/COM misbindings without introducing significant memory/search overhead?
   - *[OQ-BS-03]* How can baseline graph metrics verify source preservation without running full external benchmark suites?

---

### 8.5 Governance & Freezes
- **Gate 1 Status:** `BLOCKED` (Preserved)
- **Gate 2 Status:** `FAIL` (Preserved)
- **Gate 3 Status:** `ON HOLD` (Preserved)
- **Code Freeze:** `ACTIVE` (`src/**`, `ui/**` strictly untouched)
- **Execution Freeze:** `ACTIVE` (No compilation, test runners, or pipeline execution)
- **Specification Status:** `DRAFT — SCOPE_REDEFINED_PENDING_REVIEW` (Aligned with core objective; execution unauthorized)
