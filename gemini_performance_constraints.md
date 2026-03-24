
# Gemini Performance Constraints (LLM Coding Rules)

## Purpose
Prevent performance degradation caused by naive code generation in CPU-bound and frame-based environments.

---

## 1. Frame Loop Constraints

### Rule
Any code executed per frame MUST be O(1).

### Forbidden
- for / while loops
- map / filter / reduce
- dynamic allocations (new, push, etc.)
- repeated calculations

### Allowed
- direct state access
- constant-time operations only

---

## 2. Recalculation Prohibition

### Rule
Do NOT recompute values unless state has changed.

### Required Pattern
- Use cached values
- Use dirty flags

---

## 3. State-Driven Execution

### Rule
All updates must be triggered by state changes, NOT loops.

### Forbidden
- polling-based updates
- unconditional recomputation

---

## 4. CPU Budget Protection

### Rule
CPU must NOT handle repetitive visual or transform computations.

### Move to GPU if:
- operation runs every frame
- same logic repeated
- output is visual

---

## 5. Allocation Constraints

### Rule
No object creation inside hot paths.

### Forbidden
- new objects per frame
- array resizing inside loops

### Required
- pre-allocate
- reuse memory

---

## 6. LLM Forbidden Patterns

The following patterns MUST NOT appear:

- loop inside render/update
- repeated calculation of same value
- allocation inside loop/frame
- state-independent recomputation
- hidden O(n) operations

---

## 7. Review Checklist (Mandatory)

Before approval, verify:

- [ ] No loops in frame path
- [ ] No repeated calculations
- [ ] No allocations in hot path
- [ ] State-driven updates only
- [ ] CPU workload minimized

---

## Final Principle

LLM must assume:
- CPU is scarce
- GPU is available
- repetition is dangerous
- state is the only trigger
