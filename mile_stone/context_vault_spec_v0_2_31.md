# 📑 Context Vault Sidecar Specification (v0.2.31)

## Overview
File-based context injection system for stateless LLM control using `.active_context.md`.

## Architecture
[Spec Files] → [Extractor] → .active_context.md → LLM

## Tag Format
<!-- @context
id: SPEC-001
targets: ["*.ts"]
override: true
quota: 200
-->

## Fields
- id: unique identifier
- targets: glob patterns
- override: override lower rules
- quota: max characters

## Extraction Logic
1. Match targets
2. Apply override priority
3. Clip by quota
4. Atomic write

## Output Layout
# ⚓ PROJECT_ANCHOR
## CRITICAL_OVERRIDES
## ACTIVE_CONSTRAINTS
## RELEVANT_SPEC_FRAGMENTS

## Principles
- Minimal context
- Deterministic output
- Constraints > suggestions
