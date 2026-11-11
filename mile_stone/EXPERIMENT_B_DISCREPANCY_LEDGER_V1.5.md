# encoding: utf-8
# Discrepancy Ledger: Test Spec v1.5 Independent Verification & Contract Traceability Audit

## 📋 Document Metadata
- **Document Title:** Discrepancy Ledger: Test Spec v1.5 Independent Verification
- **Document Path:** `mile_stone/EXPERIMENT_B_DISCREPANCY_LEDGER_V1.5.md`
- **Document Status:** `LOCKED_AUDIT_LEDGER`
- **Audit Target:** `mile_stone/UNIT_TEST_SPEC_V2.5.md` (v1.5) & `mile_stone/EXPERIMENT_B_CONTRACT_TEST_ALIGNMENT.md`
- **Governing Directive:** `mile_stone/EXPERIMENT_B_V0_AUDIT_CLOSURE_DIRECTIVE.md` (v2026-10-21T10:20:00)
- **Audit Execution Timestamp:** 2026-10-21T10:31:00+09:00
- **Auditor Role:** Independent Verification & Evidence Reviewer (Read-Only)
- **Active Controls:** Strict Code Freeze (`NO_CODE_MODIFICATION`), Execution Freeze (`NO_PIPELINE_EXECUTION`)

---

## 1. Physical Verification of Document Integrity (Level 1)

Empirical read-only filesystem commands were executed to establish exact byte and line count identity:

| Target File | Measured Line Count | Measured SHA-256 Checksum | Historical Baseline Comparison Target | Status |
| :--- | :---: | :---: | :--- | :---: |
| `mile_stone/UNIT_TEST_SPEC_V2.5.md` | **827 lines** | `34de1c742ec042914af8c208bc1afc6f4fecdf4b3ef033fbda76bbf746e2d4dd` | Promoted from v1.4 (`ecfb5ba8b...`, 549 lines) to v1.5. Previous hash preserved in `EXPERIMENT_B_GATE2_AUDIT_EVIDENCE_PACKAGE.md` & `EXPERIMENT_B_V0_EVIDENCE_GAP_REGISTER.md`. | **`CONFIRMED`** |
| `mile_stone/EXPERIMENT_B_CONTRACT_TEST_ALIGNMENT.md` | **89 lines** | `758961e6b2117ca42a40b5b1b0e525dabb28fc7f1b3e198e95d08b991660b1cc` | Reconciled against Test Spec v1.5 (13 SPEC-ALIGNED, 2 BLOCKED). | **`CONFIRMED`** |

*Finding:* Line count is exactly 827 lines (trailing single newline); SHA-256 matches bit-for-bit. Prior v1.4 hash (`ecfb5ba8...`) is strictly preserved across existing audit registries without retrospective overwriting.

---

## 2. Independent Three-Way Verification of the 5 New Test Cases (Level 4)

Each of the 5 newly added test cases in `UNIT_TEST_SPEC_V2.5.md` was cross-checked against `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` (v2.5) and `EXPERIMENT_B_CONTRACT_TEST_ALIGNMENT.md`:

### 2.1 `TC-PRIO-04C` (CR-02.2: Direct Physical `#include` Exception)
- **Contract Cross-Reference:** Section 4 (`direct` path resolution) & Section 3 Layer 1 (`resolutionKind: 'direct'`).
- **Separation from Symbol Fallback:**
  - Positive Case: Asserts `#include "FirewallRules.h"` resolves physically to `FirewallRules.h` under `resolutionKind: 'direct'` despite being in `excludedFiles` (`res/msi/**`).
  - Negative Control: Asserts that when the physical header is missing, the resolver strictly rejects fallback to `FirewallRules.cpp` (`FALLBACK_PRUNED_REJECT` or `unresolved`).
- **Audit Verification Verdict:** **`PASS (Specification-Level)`** — Physical include exception is strictly decoupled from symbol-index fallback.

### 2.2 `TC-INV-04A` (CR-04.1: Deterministic `referenceId` Construction)
- **Contract Cross-Reference:** Contract Section 3 Layer 1 defines reference records, but the explicit formula `sha256(file:line:col:name)` and its canonicalization rules were missing in Contract v2.5.
- **Specification Defense & Pre-Execution Boundary:**
  - `TC-INV-04A` defines an independent test oracle for `referenceId = sha256(canonical_bytes)`.
  - **Explicit Blocker Rule:** Explicitly states that unless the 7 canonicalization rules (absolute vs relative file path, `/` normalization, UTF-8/NFC, 1-based coordinates, `:` escaping, symbol name vs spelling, lowercase hex) are definitively fixed in the contract, the test execution outcome is **`BLOCKED`**.
- **Audit Verification Verdict:** **`PASS (Specification-Level)`** — Prevents premature `PASS` by enforcing `BLOCKED` boundary until canonicalization decisions are standardized.

### 2.3 `TC-INV-04B` (CR-04.2: End-to-End Reference Traceability & Causal Chain)
- **Contract Cross-Reference:** Section 3 Layer 2 (`DiagnosticTraceEvent`, `evidenceRefs`).
- **Observability & Cardinality Constraints:**
  - Asserts preservation of `referenceId` across scanner $\to$ resolver $\to$ final graph edge/suppression.
  - Rejects false causal claims based on coincidentally matching symbol names.
  - **Non-1:1 Cardinality:** Explicitly asserts that rejected/suppressed references produce **0 edges**, disallowing naive enforcement of a universal 1-ref-to-1-edge invariant.
- **Audit Verification Verdict:** **`PASS (Specification-Level)`** — Causal traceability is rigorously specified without false cardinality assumptions.

### 2.4 `TC-EXP-B-03` (CR-06.2: Whole-Graph Zero Misbound-Edge Invariant $G_{\text{total}}$)
- **Contract Cross-Reference:** Section 1, Section 6 (`Release`, `Sleep` defect scope).
- **Whole-Graph vs Caller Scope & Snapshot Provenance:**
  - Requires exhaustive enumeration of all edges in declared $G_{\text{total}}$, asserting $\text{PollutionEdges} \equiv 0$ against `FirewallRules.cpp` and `CustomActions.cpp`.
  - **Provenance Barrier:** Explicitly mandates that if snapshot provenance is unverified (such as `EV-V0-04`), the test outcome is **`BLOCKED`**, strictly prohibiting the overturning of historical Experiment B `FAIL`.
- **Audit Verification Verdict:** **`PASS (Specification-Level)`** — Decouples whole-graph enumeration from historical baseline legitimacy.

### 2.5 `TC-PIPE-02` (CR-07.2: Architecture Report Semantic Invariance)
- **Contract Cross-Reference:** `GEMINI.md` Report Impact Verification Rule.
- **Predeclared Permitted-Change Policy:**
  - Defines protected outputs: Core Node Top 10 and Entry Point rankings.
  - Enforces a 3-way pre-execution classification: 1) Expected Consequence, 2) Protected Invariant Violation, 3) Unresolved Difference.
  - Prohibits retrofitting explanations after seeing results or passing tests simply because scores moved favorably.
- **Audit Verification Verdict:** **`PASS (Specification-Level)`** — Controlled semantic comparison protocol established with pre-declared boundaries.

---

## 3. Discrepancy Ledger Table

In accordance with the Formal Dissent Protocol (§4.4 of Directive), all observed divergences, scope limitations, and unverified items are ledgered below:

| Ledger ID | Category | Item / Location | Observed Finding & Nature of Discrepancy | Impact & Handling Rule | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **DISC-V1.5-01** | Scope Limitation | Contract v2.5 vs `TC-INV-04A` | `referenceId` canonicalization rules (relative vs absolute path, 1-based indexing, delimiter escaping) are defined as test prerequisites in `TC-INV-04A`, but are not yet formally written into `SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` v2.5 text. | Handled by `TC-INV-04A` specification boundary: any test execution is strictly **`BLOCKED`** pending formal contract amendment. Zero false pass risk. | **`RECORDED / BLOCKED`** |
| **DISC-V1.5-02** | Evidence Status | Contract Alignment Matrix | Table in `EXPERIMENT_B_CONTRACT_TEST_ALIGNMENT.md` displays `CR-01.1~05.2` as `SPEC-ALIGNED` (13) and `CR-06.1, 07.1` as `BLOCKED` (2). | Specification alignment does not equal implementation readiness or test execution pass. `EXECUTION FREEZE` applies to all 19 cases. | **`CONFIRMED / GOVERNED`** |
| **DISC-V1.5-03** | Baseline Precondition | `TC-EXP-B-03` & `TC-PIPE-01` | Baseline snapshots (`EV-V0-04`, `EV-V0-05`, A5 derivation chain) remain `BLOCKED` in V0 Evidence Gap Register. | Both tests explicitly state that unverified baseline provenance blocks historical compliance claims. Experiment B `FAIL` preserved. | **`PRESERVED / BLOCKED`** |
| **DISC-V1.5-04** | Evidence Attribution & Verification | `project_state.json` Pairwise Hash Attribution | • **Step 8266:** `MEASURED — PAIRWISE MATCH NOT ESTABLISHED` for EV-V0-01 (external original hashed at `26d86f...`; scratch backup path omitted from hash array). For EV-V0-02, both paths were hashed confirming historical `MATCH` (`c5cba4...`).<br>• **Current Verification (2026-10-22):** Direct read-only execution hashed both EV-V0-01 paths concurrently, confirming byte-for-byte `MATCH` (`26d86f...`).<br>• **Governance Impact:** Current byte match confirms no drift between the two files, but origin provenance and historical runtime isolation remain unverified. Gate 1 remains **`BLOCKED`**. | Separation strictly enforced: historical execution logs do not retroactively inherit current checks. Gate 1 remains `BLOCKED`. | **`RECORDED / GOVERNED`** |
| **DISC-V1.5-05** | Audit Scope Boundary | Gate 2 Document Phrase Audit | `deep_consistency_audit.js` verified cross-document text and phrase alignment across milestone markdown files; it did not independently re-verify production AST control flow or historical causality. | V1/V2/V3 findings remain historical static audit records; phrase check confirms documentation alignment only, not engine re-verification. | **`RECORDED / GOVERNED`** |

---

## 4. Verification Summary & Gate 2 Prerequisite Readiness

1. **Step 1 (Independent Verification) Determination:** **`PASSED`**
   - File length (827 lines), SHA-256 (`34de1c74...`), and suite structure (19 cases: 6 + 6 + 5 + 2) verified.
   - All 5 new test cases accurately embody the safety contract, negative controls, and pre-execution blocker boundaries.
   - Historical v1.4 checksums and past audit failure records remain 100% intact.

2. **Step 2 (Discrepancy Ledger) Determination:** **`RECORDED`**
   - Three operational scope boundaries recorded in Section 3 above. No silent modifications or retroactive overrides occurred.

3. **Prerequisite for Step 3 (Gate 2 Static Audit Synthesis):**
   - Step 1 and Step 2 are completed and recorded.
   - Gate 2 static audit synthesis may be formally initiated **only upon separate explicit authorization**, preserving V1/V2 static findings, V3 un-implemented failure, and the historical Gate 2 `FAIL` determination.
