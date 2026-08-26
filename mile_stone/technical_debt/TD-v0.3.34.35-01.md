# TD-v0.3.34.35-01 - Object Array Canonicalization Audit

## Status

OPEN

## Category

Verification Debt

## Discovery Origin

v0.3.34.35 - Deterministic Stability Verification

## Summary

DeterministicHashVerifier currently performs canonicalization for:

- Object Key Sorting
- Primitive Array Sorting
- Timestamp Removal
- Runtime UUID Removal
- UTF-8 Canonical Stringification

However, SET-LIKE object arrays are not semantically canonicalized.

Examples:

- nodes[]
- edges[]
- clusters[]
- cluster_flows[]
- ghostEvidence[]
- boundaryEvidence[]
- architecturalFindings[]

These collections represent sets rather than ordered sequences.

## Current Behavior

Object arrays preserve runtime generation order.

Two semantically identical states may generate different hashes if object ordering differs.

Example:

Run A

```json
[
  {"id":"A"},
  {"id":"B"}
]
```

Run B

```json
[
  {"id":"B"},
  {"id":"A"}
]
```

Current implementation would produce different hashes.

## Risk Assessment

Risk Level: LOW

Reason:

- Deterministic Stability Verification achieved:
  - Hash Match Rate = 100%
  - Unexpected Drift = 0
  - N = 30 runs

Observed runtime behavior is currently deterministic.

No production failure has been observed.

## Non-Goals

This debt does not block:

- Governance Engine
- Priority Scoring
- Report Generation
- Virtual Debugger Operation

## Future Audit

Required before any future hash-hardening effort:

1. Inventory all serialized arrays.
2. Classify arrays as:
   - ORDERED
   - SET-LIKE
3. Identify stable identity keys.
4. Design semantic object-array canonicalization.

## Proposed Future Work

Possible approaches:

- Sort by id
- Sort by composite key
- Type-specific canonicalization strategy

Implementation deferred.

## Decision

Governance entry remains APPROVED.

This item is tracked as technical debt only.
