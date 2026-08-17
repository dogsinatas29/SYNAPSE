# SYNAPSE Reasoning Report

## Graph Stats
- Nodes: 484
- Edges: 218

## Q1~Q8 Answers

### Q3: 무엇이 핵심이고 무엇이 부수적인가? (Core vs Utility)
**Summary**: Identified 2 Core Pillars, 0 Supporting nodes, and 0 Utilities.
**Confidence**: 0.9

#### Items:
- **src/core/GraphModel.ts** (Score: 3): [CORE PILLAR] State Owner, Participates in 1 critical pipelines
- **src/types/schema.ts** (Score: 3): [CORE PILLAR] State Owner, Participates in 1 critical pipelines

### Q5: 어디를 건드리면 무너지는가? (Blast Radius)
**Summary**: Identified structural blast radius for 4 nodes.
**Confidence**: 0.9

#### Items:
- **src/core/GraphModel.ts** (Score: 4): [CRITICAL] Classified as CORE.
- **src/types/schema.ts** (Score: 4): [CRITICAL] Classified as CORE.
- **src/core/canvas-engine/StateManager.ts** (Score: 1): [LOW] Classified as UTILITY.
- **src/core/PhaseManager.ts** (Score: 1): [LOW] Classified as UTILITY.

