# encoding: utf-8
# Experiment B — V0 Audit Closure Directive

## 📋 Document Metadata
- **Document Title:** Experiment B — V0 Audit Closure Directive
- **Document Path:** `mile_stone/EXPERIMENT_B_V0_AUDIT_CLOSURE_DIRECTIVE.md`
- **Document Status:** `LOCKED_GOVERNANCE_DIRECTIVE`
- **Target Baseline:** SYNAPSE v0.3.34.74 / Experiment B Baseline & Audit Records
- **Effective Timestamp:** 2026-10-21T10:09:00+09:00
- **Last Revised:** 2026-10-21T10:20:00+09:00
- **Governing Reference Documents:**
  - `mile_stone/EXPERIMENT_B_V0_EVIDENCE_GAP_REGISTER.md` (v2026-10-21T10:06:30)
  - `mile_stone/EXPERIMENT_B_GATE2_AUDIT_EVIDENCE_PACKAGE.md`
  - `mile_stone/EXPERIMENT_B_CONTRACT_TEST_ALIGNMENT.md`
  - `mile_stone/EXPERIMENT_B_MINIMAL_VERIFICATION_PLAN.md` (v1.9.1)
  - `mile_stone/SYMBOL_RESOLUTION_SAFETY_CONTRACT.md` (v2.5 PROPOSED)
  - `mile_stone/UNIT_TEST_SPEC_V2.5.md` (v1.4 DRAFT)

> **Scope Note:** This directive fixes governance boundaries and records the current audit determinations. It does not independently re-verify the referenced artifacts, hashes, or prior audit findings. Those claims retain the evidence status and scope recorded in their respective source records.

---

## 1. Authoritative Audit Determinations

The following historical determinations are preserved as the current authoritative audit record. "Preserved" means the historical record is not overwritten; it does not prohibit a separately authorized reassessment based on new evidence.

| Evaluation Item | Current Determination | Substantive Audit Basis |
| :--- | :---: | :--- |
| **Historical Experiment B** | **`FAIL`** | The historical failure record is preserved. The reported naive pruning of four edges produced unresolved regressions. This directive does not independently reproduce that experiment or upgrade its evidence status. |
| **Gate 1 (V0 Baseline Audit)** | **`BLOCKED`** | The evidence register reports divergent internal timestamps (2026-10-05 vs 2026-10-18), no cross-referencing snapshot IDs in the examined artifacts, and insufficient proof of historical runtime isolation. Reassessment requires new independent evidence and formal review. |
| **Gate 2 (V1–V3 Static Audit)** | **`FAIL`** | Preserved from the existing Gate 2 audit record: V1 (single-Map header-to-source overwrite) and V2 (caller COM/Win32 context mismatch) were reported in static structure; V3 was reported as failing because Safety Contract v2.5 mechanisms were absent from the audited code state. This directive does not independently repeat that audit. |
| **Gate 3 (V4–V5 Verification)** | **`ON HOLD`** | Dynamic verification remains unapproved. The existence of a draft plan or test specification is not execution authorization. |

### 1.1 Historical Record Preservation and Reassessment
1. Existing `FAIL`, `BLOCKED`, and evidence-gap records must not be deleted, overwritten, or rewritten to imply that the original determination was different.
2. New evidence may be submitted for review under a separately authorized reassessment.
3. Any reassessment must be recorded as a new, versioned, append-only entry that identifies the evidence, scope, reviewer, criteria, and resulting determination.
4. A later determination does not retroactively erase the historical record. The record must retain both the original determination and the later reassessment, if any.

---

## 2. Universal Prohibition Boundaries

### 2.1 Strict Production Code Freeze — `NO_CODE_MODIFICATION`
- No modifications to production source code under `src/**` or `ui/**`.
- Refactoring, cleanup, formatting changes, and bug-fix attempts in production code are prohibited.
- This directive does not grant permission to modify any other code or configuration; any such action remains subject to the applicable existing authorization boundary.

### 2.2 Strict Execution Freeze — `NO_PIPELINE_EXECUTION`
- Do not run test runners (including `jest` or `ts-node`), dynamic diagnostic scripts, graph-generation pipelines, or live VS Code extension instances.
- Any execution requires a separate, explicit user authorization directive that identifies the permitted scope and commands.
- Approval of this document, another document, or a plan does not authorize execution.

### 2.3 Strict Audit Immutability — `NO_HISTORY_OVERWRITE`
- Preserve past failure records, evidence gaps, blocker determinations, and the evidence supporting them.
- Do not delete, overwrite, or rephrase historical records to simulate compliance.
- Audit registers and governance documents must use an append-only, versioned protocol. Corrections should be documented as dated amendments or new entries with traceability to the superseded text.

---

## 3. Strict Evidence Assessment Rules

### 3.1 `MATCH` — Bit-for-Bit Hash Equivalence
Use `MATCH` only when a SHA-256 comparison has actually been performed between two explicitly identified targets and the comparison result has been recorded. Record, at minimum:
- both target paths or artifact identifiers;
- the SHA-256 value for each target;
- the comparison result; and
- the comparison time or the traceable audit record containing it.

`MATCH` establishes byte identity only between the two compared targets at the time of comparison. It does not establish independent origin, historical runtime isolation, or the truth of the artifact’s contents.

### 3.2 `VERIFIED` — Independent Primary Evidence
Use `VERIFIED` only when the stated claim is supported by an independent origin and relevant primary evidence within an explicitly described investigation scope. Internal consistency, matching internal logs, or a document’s own assertion is not sufficient by itself.

### 3.3 `BLOCKED` — Insufficient or Inconclusive Evidence
If an essential input, raw edge-level dump, historical snapshot manifest, isolation proof, or other required evidence is missing or inconclusive, the relevant determination must remain `BLOCKED` unless the governing criteria define a more specific non-passing status.

Absence of evidence must not be promoted to `PASS` or `VERIFIED` by assumption or inference.

### 3.4 Observation Is Not Hash Matching
Commands such as `git status --short`, file timestamps, line counts, and internal JSON fields may support an observation, but they do not by themselves establish SHA-256 equivalence. Use a clearly defined observation label (for example, `OBSERVED`) for such facts. Do not label a row `MATCH` unless the hash-comparison requirements in §3.1 are satisfied.

### 3.5 No Retrospective Textual Proof
Editing Markdown documents or audit registers cannot retroactively prove historical execution integrity. Historical claims require relevant physical artifacts, traceable hashes, raw execution logs, or other primary evidence appropriate to the claim.

---

## 4. Permission Boundaries and Operational Protocol

### 4.1 Authority Principle
This directive defines governance boundaries, not assumptions about personal authority. No agent or reviewer may unilaterally relax or alter the criteria recorded here.

### 4.2 No Retrospective Substitution
This directive does not replace, erase, or retroactively alter prior audit findings. Reviewers must evaluate claims against explicit evidence and fixed criteria. Items with missing or ambiguous evidence must not be arbitrarily marked as passed.

### 4.3 Scope of Document Approvals
Approval of a document, plan, specification, or audit status is not approval to modify production code, run tests, execute a pipeline, or launch a live extension. Document approval signifies agreement with the document’s stated scope only.

### 4.4 Formal Dissent Protocol — Discrepancy Ledger
If a reviewer or engineer identifies an error, discrepancy, or divergence in the standards or recorded findings:
1. Do not silently alter the authoritative text.
2. Submit a separate Discrepancy Ledger (이견 목록) entry.
3. Identify the disputed claim, rationale, exact affected section, and available primary counter-evidence.
4. Distinguish observed facts from hypotheses and interpretations.
5. Record the review disposition as a new, traceable entry. Any approved amendment must preserve the prior version and its history.

---

## 5. Conditions for Subsequent Step Approvals
These are prerequisites for considering later work. Satisfying a checklist does not automatically grant approval to execute.

### 5.1 Prerequisites for Gate 2 (V1–V3) Formal Synthesis
- [ ] Preserve V1, V2, and V3 empirical findings without conflating static code structure with runtime causality.
- [ ] Cross-reference the Gate 2 audit hash `cd7086...` and explicitly record that the audited state was the uncommitted working tree, not Git HEAD `5fc165...`.
- [ ] Preserve the existing finding that Safety Contract v2.5 was not implemented in the audited code state, with the supporting evidence and scope referenced.
- [ ] Keep the historical Gate 2 `FAIL` determination distinct from any later synthesis or reassessment.

### 5.2 Prerequisites for Test Specification v1.5 Finalization
Resolve the five documented contract-test gaps at specification level:
- [ ] `CR-02.2` — direct physical include exception syntax.
- [ ] `CR-04.1` — deterministic formula for `referenceId`.
- [ ] `CR-04.2` — pipeline trace assertion format.
- [ ] `CR-06.2` — whole-graph $G_{\text{total}}$ zero-pollution assertion.
- [ ] `CR-07.2` — report semantic ranking invariance criteria.
- [ ] Keep existing baseline data separate from newly created or mocked test inputs.
- [ ] Record each resolution with traceability to the relevant contract requirement and test case.

### 5.3 Prerequisites for Future Gate 3 Execution Approval
- [ ] Define an unambiguous test-runner specification operating only in an isolated `scratch/` sandbox environment.
- [ ] Specify how the pre-run repository state and relevant input artifacts will be cryptographically sealed and recorded.
- [ ] Identify exact permitted commands, paths, expected outputs, and stop conditions.
- [ ] Obtain a separate, explicit user authorization directive approving execution.
- [ ] Do not infer execution permission from document approval, checklist completion, or a prior gate determination.

---

## 6. Audit Closure Status

### 6.1 Procedure Status
**Audit Procedure Status: `CLOSED` — Evidence Determination: `BLOCKED`**

The V0 audit procedure is closed for the evidence set currently recorded in the V0 Baseline Evidence Gap Register. This procedural closure means that the current evidence review has reached a documented stopping point. It does not mean that baseline provenance has been verified, that historical runtime isolation has been proven, that all evidence gaps have been resolved, or that Gate 1 has passed.

### 6.2 Continuing Determinations
- Gate 1 remains **`BLOCKED`**.
- Historical Experiment B remains **`FAIL`** in the preserved historical record.
- Gate 2 remains **`FAIL`** according to the existing audit record.
- Gate 3 remains **`ON HOLD`**.
- Strict Code Freeze and Execution Freeze remain active.

### 6.3 Reopening or Reassessment
The audit procedure may be reopened for a new evidence review only through a traceable, separately recorded authorization or governance decision. New evidence must be added without overwriting the existing record. Reopening the review does not itself authorize source-code modification, test execution, or pipeline execution.

All subsequent work must follow this sequence:

$$\text{Directive Anchor} \longrightarrow \text{Evidence Verification} \longrightarrow \text{Discrepancy Ledger} \longrightarrow \text{Explicit User Authorization}$$

*The sequence governs the order of review; it does not imply that every stage grants permission for the next stage automatically.*
