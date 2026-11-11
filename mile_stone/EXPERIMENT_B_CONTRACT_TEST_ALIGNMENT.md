# encoding: utf-8
# Contract v2.5 vs Unit Test Spec v1.4 Alignment Matrix: Experiment B Safety & Verification

## 📋 Document Metadata
- **Document Title:** Safety Contract v2.5 vs Unit Test Spec v1.4 Alignment Matrix
- **Document Path:** `mile_stone/EXPERIMENT_B_CONTRACT_TEST_ALIGNMENT.md`
- **Document Status:** `SPECIFICATION_ALIGNMENT_DRAFT`
- **Contract Baseline:** `mile_stone/SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` (v2.5 `PROPOSED`)
- **Test Spec Baseline:** `mile_stone/UNIT_TEST_SPEC_V2.5.md` (v1.4 `DRAFT`)
- **Creation Timestamp:** 2026-10-20T10:42:30+09:00
- **Last Revised:** 2026-10-20T10:52:00+09:00
- **Alignment Verdict Axioms:**
  - `ALIGNED`: The requirement and test specification correspond unambiguously with complete fixtures, invariants, and assertions in Test Spec v1.4.
  - `GAP`: No corresponding test case exists in Test Spec v1.4 (`NONE`), or essential invariant assertions are missing from the test specification.
  - `AMBIGUOUS`: The requirement or expected outcome allows multiple contradictory interpretations.
  - `BLOCKED`: Specification alignment is established, but execution prerequisites (e.g., baseline graph snapshot, formula proof) are unverified/blocked.
- **Critical Governance Notice:**
  - **Spec Alignment $\neq$ Implementation $\neq$ Test Pass:** Mapping a contract rule to a test ID does NOT imply the test is written, executed, or passing.
  - Production Code (`src/`, `ui/`): **Strict Code Freeze Active** (Zero modifications).
  - Test Runners & Pipeline: **Execution Freeze Active** (Zero execution).
  - Gate 1 (V0): `BLOCKED` | Gate 2: `FAIL` (Preserved without modification).

---

## 1. Specification Baseline Hashes (Full 64-Hex SHA-256)
- **`SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` (v2.5):**
  `d4162ea591a26178676c71474a9f6f5be51def5e5ed8d95ca35641b090b737f1`
- **`UNIT_TEST_SPEC_V2.5.md` (v1.4):**
  `ecfb5ba8b10bdd714f56f735687fef731d16117c1ce811b31ea1ddd3cd948c30`

---

## 2. Atomic Alignment Matrix (15 Atomic Requirements)

| Contract Rule ID | Atomic Requirement & Status | Official Test ID (Spec v1.5) | Input Fixture in Spec | Expected Outcome (Invariants) | Failure Condition | Evidence Requirements | Verification Limits & Scope Boundary | Alignment Status |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **CR-01.1** | Win32 SDK Function Interception: Intercept `Sleep(DWORD)` prior to symbol table lookup. (`PROPOSED`) | **TC-EXP-B-02** | `Sleep(10)` in `wf_cliprdr.c` & `Sleep(1000)` in `IddController.c` | `systemApiEvaluation: 'CONFIRMED'`, `resolutionKind: 'unresolved'`, `fallbackReason: 'SYSTEM_API_GUARD'` | Edge created to `CustomActions.cpp` | AST token + rejection log `SYSTEM_API_GUARD` | AST pattern inspectable; runtime hook execution unverified | **`ALIGNED`** |
| **CR-01.2** | COM Interface Interception: Intercept `Release()` on COM interface pointers (`ITaskbarList3*`). (`PROPOSED`) | **TC-EXP-B-01A** / **TC-PRIO-02** | `pTaskbarList->Release()` in `win32_window.cpp` (COM context) | `systemApiEvaluation: 'CONFIRMED'`, `fallbackReason: 'SYSTEM_API_GUARD'`, 0 edges to `windows.cc` or `FirewallRules.cpp` | Edge created to `windows.cc` or `FirewallRules.cpp` | AST call-site + dual edge isolation diff (0 edges) | Static syntax inspectable; runtime type deduction unverified | **`ALIGNED`** |
| **CR-02.1** | Build Target Isolation: MSI build script files must be classified into `excludedFiles`. (`PROPOSED`) | **TC-INV-01** | Project files including MSI files (`FirewallRules.cpp`, `CustomActions.cpp`) | Partition $\text{discoveredFiles} = \text{target} \uplus \text{excluded} \uplus \text{nonTarget}$; MSI files in `excludedFiles` | MSI files leaked into `analysisTargetFiles` | File discovery partition dump | Path pattern inspectable; runtime FS scan unverified | **`ALIGNED`** |
| **CR-02.2** | Direct Physical `#include` Exception: Direct physical path `#include` of excluded header must resolve. (`PROPOSED`) | **TC-PRIO-04C** | `#include "FirewallRules.h"` in `CustomActions.cpp` + negative control | Direct include resolves to physical path; `resolutionKind: 'direct'`; negative control prevents symbol fallback | Unresolved or symbol-index fallback occurred | Physical existence + resolver decision dump | Dedicated test specified in Spec v1.5; execution freeze active | **`SPEC-ALIGNED`** |
| **CR-03.1** | Candidate 3-Fold Set Invariants: Projection, Exclusivity, and Completeness. (`PROPOSED`) | **TC-INV-02** (Cases 0, 1, 2, 4, 5) | 5-candidate pool with intentional set defect fixtures | 3 set invariants verified: 1) Projection $\equiv$, 2) Exclusivity $\cap \equiv \emptyset$, 3) Completeness $\cup \equiv S$ | Any of Cases 1, 2, 4, 5 fails to reject | Complete audit dump (`audit_tc_inv_02.json`) | Invariant logic inspectable; runtime test execution unverified | **`ALIGNED`** |
| **CR-03.2** | Candidate Partition Invariant: Disjoint partitioning into module boundaries. (`PROPOSED`) | **TC-INV-01** / **TC-INV-02** | Multi-candidate cross-module fixtures | Candidate partition matches module topology disjointly | Candidate belongs to multiple partitions | Partition log dump | Partition algorithm inspectable; runtime module topology unverified | **`ALIGNED`** |
| **CR-03.3** | Candidate Deduplication Invariant: Array uniqueness ($|\operatorname{Set}(S)| = |S|$). (`PROPOSED`) | **TC-INV-02** (Case 3) | Duplicate candidate array fixture ($[P1, P1, P2..]$) | Array uniqueness verified: $|\operatorname{Set}(S)| = |S|$; array duplication detected | Duplicate candidate retained in array | Array uniqueness dump | Dedicated uniqueness check inspectable; runtime execution unverified | **`ALIGNED`** |
| **CR-04.1** | Deterministic Reference ID Generation: Deterministic hashing of call-site coordinates. (`PROPOSED`) | **TC-INV-04A** | AST call-site stream + 7 canonicalization rules | `referenceId = sha256(canonical_bytes)` matches independent oracle | Non-deterministic, null, or divergence from oracle | Oracle digest comparison dump | Dedicated oracle test specified in Spec v1.5; canonicalization prerequisite enforced | **`SPEC-ALIGNED`** |
| **CR-04.2** | End-to-End Reference Causal Tracking: Reference ID preserved from scanner to final edge. (`PROPOSED`) | **TC-INV-04B** | 3 terminal fixtures (resolved, rejected, suppressed) | 1:1 binding: `referenceId` preserved across pipeline stages; rejected reference produces 0 edges | ID lost, mutated, or rejected ref produces edge | End-to-end trace correlation dump | Dedicated trace test specified in Spec v1.5; execution freeze active | **`SPEC-ALIGNED`** |
| **CR-05.1** | Secondary Fallback Elimination: Excluded candidate must not trigger unverified fallback. (`PROPOSED`) | **TC-PRIO-04B** / **TC-EXP-B-01B** | Excluded target with attempted secondary fallback to `firewall_stub.cc` / `windows.cc` | `resolutionKind: 'unresolved'`, `fallbackReason: 'FALLBACK_PRUNED_REJECT'`, `selectedTarget: null` | Secondary edge created to fallback target | `prunedFallbackProof` dump | Branch inspectable; runtime fallback suppression unverified | **`ALIGNED`** |
| **CR-05.2** | Disambiguation Failure Audit Logging: Mandatory `failureReason` when `isValidated === false`. (`PROPOSED`) | **TC-INV-03A** | Disambiguation proof with missing audit flag or schema defect | Contract Section 3 L131-140: $\text{isValidated} = \text{false} \iff \text{failureReason} \neq \text{null}$; explicit structured reason in `validationAudit` | `isValidated: false` with null reason | `validationAudit` payload dump (`audit_tc_inv_03a.json`) | Scope strictly matches Section 3 normative invariant; test assertion directly corresponds. | **`ALIGNED`** |
| **CR-06.1** | Structural Invariant: Normal structural edges ($488$) preserved under identical filter. (`PROPOSED`) | **TC-PIPE-01** (Sub-check) | Full RustDesk workspace under identical language/path filter | $|R_{\text{filtered}}| = 488$; Missing $= \emptyset$; Spurious $= \emptyset$ | Missing $> 0$ or Spurious $> 0$ | Full edge comparison table dump | Specification definition is ALIGNED in `TC-PIPE-01`, but execution prerequisite is BLOCKED due to unverified baseline snapshot `EV-V0-04`. | **`BLOCKED`** (Spec aligned, Execution blocked) |
| **CR-06.2** | Whole-Graph Zero Misbound Edge Invariant: Zero edges to MSI across total graph $G_{\text{total}}$. (`PROPOSED`) | **TC-EXP-B-03** | Resolved RustDesk total graph ($G_{\text{total}}$) | $\text{PollutionEdges} = 0$ (Zero edges to MSI `FirewallRules.cpp` / `CustomActions.cpp` across entire graph) | PollutionEdges $> 0$ | Total graph edge query assertion dump | Dedicated whole-graph test specified in Spec v1.5; execution prerequisite snapshot required | **`SPEC-ALIGNED`** |
| **CR-07.1** | Metric Invariant A5 (`238.5550`): Complexity metric preserved within tolerance. (`PROPOSED`) | **TC-PIPE-01** (Section 6) | `CONTROL_BRIDGE` (A5) detector evaluation | Metric value equals $238.5550 \pm 0.0001$ | Metric deviation $> 0.0001$ | Metric derivation trace dump | Snapshot-to-formula chain unproven $\to$ Value cannot be normative baseline. | **`BLOCKED`** (Formula & derivation chain unverified) |
| **CR-07.2** | Semantic Report Invariance: Core Node and Entry Point rankings must not regress. (`PROPOSED`) | **TC-PIPE-02** | Baseline vs comparison report + permitted-change policy | Core Node Top 10 & Entry Point ranking invariant; changes causal | Unapproved rank shift or unexplainable diff | Normalized report diff + causal mapping | Dedicated semantic test specified in Spec v1.5; execution freeze active | **`SPEC-ALIGNED`** |

---

## 3. Quantitative Alignment Summary & Gap Analysis (Spec v1.5 Revision)

### 3.1 Strict Breakdown of 15 Atomic Requirements
- **Total Atomic Requirements:** **15**
  - **`SPEC-ALIGNED`:** **13** (CR-01.1, CR-01.2, CR-02.1, CR-02.2, CR-03.1, CR-03.2, CR-03.3, CR-04.1, CR-04.2, CR-05.1, CR-05.2, CR-06.2, CR-07.2)
  - **`GAP`:** **0** (All 5 prior specification gaps successfully closed in Test Spec v1.5).
  - **`AMBIGUOUS`:** **0**
  - **`BLOCKED`:** **2**
    - CR-06.1: Aligned in `TC-PIPE-01`, but execution prerequisite is blocked due to unverified baseline snapshot `EV-V0-04`.
    - CR-07.1: Metric A5 derivation chain and input snapshot are unverified; value cannot serve as normative assertion.
- **Verification of Sum:** 13 (SPEC-ALIGNED) + 0 (GAP) + 0 (AMBIGUOUS) + 2 (BLOCKED) = 15. (100% specification alignment achieved).

### 3.2 Key Governance & Boundary Distinctions Preserved
1. **Specification Alignment != Runtime Verification:**
   - 13 requirements are aligned at the **specification design level** in `UNIT_TEST_SPEC_V2.5.md` v1.5. This does not assert that the production codebase satisfies them, nor does it imply test pass.
2. **Execution Freeze Maintained:**
   - All 19 test cases in Test Spec v1.5 remain strictly **`NOT RUN — EXECUTION FREEZE`**.
3. **Execution Blockers Preserved:**
   - CR-06.1 and CR-07.1 remain objectively classified as **`BLOCKED`** because their empirical prerequisites (baseline snapshot provenance and mathematical derivation chain) are unproven.

---

## 4. Governance & Synthesis
- **Contract Baseline:** `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` locked at v2.5 (`PROPOSED`).
- **Test Spec Baseline:** `UNIT_TEST_SPEC_V2.5.md` locked at v1.5 (`DRAFT`).
- **Gate Status:** Gate 1 remains `BLOCKED`; Gate 2 remains `FAIL`; Gate 3 remains `ON HOLD`.
- **Strict Freezes:** Strict Code Freeze (`NO_CODE_MODIFICATION`) and Execution Freeze (`NO_PIPELINE_EXECUTION`) remain actively enforced.
