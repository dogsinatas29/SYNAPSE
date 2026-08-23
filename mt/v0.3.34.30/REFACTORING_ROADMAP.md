# Technical Debt Prioritization & Refactoring Roadmap (v0.3.34.30)

## Overview
This roadmap prioritizes the technical debt discovered during the `v0.3.34.30` Maintenance Audit Cycle across Architecture Drift, Debug Layers, Performance, and Abandoned Work.

## Priority 0 (P0) - Critical Architecture & Performance Risks
*Must be resolved before or during the next major feature cycle.*

1. **`RendererCore.ts` Dirty Flag Implementation**
   - **Reason:** Missing dirty status calculation (`TODO`) threatens CPU frame loop constraints. It forces O(1) validations to fail in static states.
   - **Action:** Implement state-driven recalculation and caching.

2. **Transaction Verification Safety**
   - **Reason:** `VerificationLayer.ts` is missing import resolution checks (`TODO`), creating a transaction safety gap in AST/Graph modifications.
   - **Action:** Implement dependency existence checks before committing transaction drafts.

## Priority 1 (P1) - High Frequency / Noise Pollution
*Should be addressed to improve developer experience and system observability.*

1. **Massive Debug Log Cleanup**
   - **Reason:** Over 550+ `console.log` and `[DEBUG]` statements pollute `ChatExtractor.ts`, `standalone.ts`, and `BootstrapEngine.ts`.
   - **Action:** Eradicate raw `console.log` statements. Integrate the existing `Logger.ts` across all layers and utilize strict Log Levels (`TRACE`, `DEBUG`, `INFO`).

2. **VSCode Provider Intents**
   - **Reason:** `VSCodeProvider.ts` has stubbed `executeDefinitionProvider`, etc., blocking IDE feature parity.
   - **Action:** Finalize LSP intent mappings.

## Priority 2 (P2) - Legacy & Structural Gaps
*Address when touching related modules.*

1. **Canvas Panel UI Completeness**
   - **Reason:** Node details sidebar and intent routing (`UPDATE_NODE_DATA`) are marked as `TODO` in `CanvasPanel.ts`.
   - **Action:** Finish standard structural UI logic.

## Priority 3 (P3) - Deferred / Experimental
*Backlogged for future architecture iterations.*

1. **AI Pipeline Enhancements**
   - **Reason:** `GeminiParser.ts` has a stub for actual AI API calls.
   - **Action:** Keep deferred until the pure deterministic logic is 100% hardened.

2. **Function-Level Projection**
   - **Reason:** `ProjectionLayer.ts` lacks function-level node extraction.
   - **Action:** Keep deferred.

## Summary
The system's core architecture (`v0.3.34.30`) is clean with **0 Architecture Drift**. The immediate focus must be shifted towards **Performance Guardrails (Dirty Flags)** and **Log Management (Noise Reduction)**.
