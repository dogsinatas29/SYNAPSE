# SYNAPSE v0.3.32 Release Notes

> **"See the Invisible"**

Version 0.3.32 makes **collaboration nodes visible in Flow View**. Previously, client-contributed nodes were silently filtered out by the ghost status system, rendering them invisible in the execution flow. This release fixes the filter chain and introduces client-layer-aware rendering for multi-user collaboration.

---

## 🇬🇧 English

### New Features & Enhancements

* **Client Node Visibility in Flow View**:
  * Collaboration nodes from other users now appear in Flow View with **magenta (#ff00ff) border rendering** for visual distinction.
  * Client nodes bypass the `!isGhost` filter while remaining controlled by the existing `_isClientLayerVisible()` toggle.
  * The Client Layer ON/OFF toggle now correctly controls Flow View visibility for collaboration nodes.

* **Contribution Entity Graph (Phase 0 Validated)**:
  * Canonical identity `(filePath, userId)` validated as unique key across CompareResult and HarvestCandidate.
  * ContributionNode (`kind: compared | harvested`) and ContributionEdge (`relation: derived_from`) type definitions added.
  * Phase 0 identity validation passed with 1:1 lineage mapping confirmed.

### Bug Fixes

* **Ghost Filter Collision with Collaboration System**:
  * Fixed: Client nodes with `status='ghost'` were unconditionally removed by the Flow View filter (`!isGhost`), making 100% of collaboration nodes invisible.
  * Root cause: CanvasPanel marks other users' nodes as `ghost` by design, but Flow View treated `ghost` as "remove from existence" rather than "visual state".
  * Fix: Client nodes (`n.clientLayer || n.data?.clientLayer`) now bypass `!isGhost` and `n.type !== 'external'` checks.

* **`reasons` ReferenceError Crash in buildFlow**:
  * Fixed: An undefined `reasons` variable in the debug logging loop caused a `ReferenceError` that silently crashed `buildFlow()` when client nodes were present.
  * This masked all subsequent diagnostic logs (`client reachability`, `surviving client nodes`, `filteredNodes count`), making root cause analysis impossible.

* **Client Node Detection Filter Inconsistency**:
  * Fixed: `debugClientNodes` and `survivingClientNodes` used a narrower filter (`n.clientLayer` only) than `clientNodes` (`n.clientLayer || n.layer === "client" || n.data?.clientLayer`), causing zero-count logs even when client nodes existed.

### Known Issues

* **Orphan Node Layout**: Client nodes appear in Flow View but are disconnected from the main execution flow (START → ... → END). They render at their original canvas positions without being integrated into the flow graph topology.
* **Edge Connectivity Gap**: No edges exist from main graph nodes to client nodes. Client nodes form isolated subgraphs that BFS cannot reach from main roots.

---

## 🇰🇷 한국어

### 주요 기능 및 개선 사항

* **Flow View에서 클라이언트 노드 가시화**:
  * 다른 사용자가 기여한 협업 노드가 Flow View에서 **마젠타(#ff00ff) 테두리**로 시각적 구분되어 표시됩니다.
  * 클라이언트 노드는 `!isGhost` 필터를 우회하되, 기존 `_isClientLayerVisible()` 토글로 제어됩니다.
  * Client Layer ON/OFF 토글이 Flow View의 협업 노드 가시성을 올바르게 제어합니다.

* **Contribution Entity 그래프 (Phase 0 검증 완료)**:
  * `(filePath, userId)`가 CompareResult와 HarvestCandidate 전 구간에서 고유키로 검증되었습니다.
  * ContributionNode (`kind: compared | harvested`) 및 ContributionEdge (`relation: derived_from`) 타입 정의가 추가되었습니다.
  * Phase 0 항등 검증이 1:1 계통 매핑으로 통과되었습니다.

### 버그 수정

* **협업 시스템과 Ghost 필터 충돌**:
  * 수정: `status='ghost'`인 클라이언트 노드가 Flow View 필터(`!isGhost`)에 의해 무조건 제거되어, 협업 노드의 100%가 표시되지 않았습니다.
  * 근본 원인: CanvasPanel은 다른 사용자 노드를 의도적으로 `ghost`로 마킹하지만, Flow View는 `ghost`를 "존재에서 제거"로 처리했습니다.
  * 수정: 클라이언트 노드(`n.clientLayer || n.data?.clientLayer`)가 `!isGhost`와 `n.type !== 'external'` 체크를 우회합니다.

* **buildFlow 내 `reasons` ReferenceError 크래시**:
  * 수정: 디버그 로깅 루프에서 정의되지 않은 `reasons` 변수가 `ReferenceError`를 발생시켜, 클라이언트 노드가 존재할 때 `buildFlow()`가 무음으로 크래시되었습니다.
  * 이로 인해 이후 모든 진단 로그(`client reachability`, `surviving client nodes`, `filteredNodes count`)가 출력되지 않아 근본 원인 분석이 불가능했습니다.

* **클라이언트 노드 감지 필터 불일치**:
  * 수정: `debugClientNodes`와 `survivingClientNodes`가 `clientNodes`보다 좁은 필터(`n.clientLayer`만)를 사용하여, 클라이언트 노드가 존재하는데도 0개로 표시되었습니다.

### 알려진 이슈

* **고아 노드 레이아웃**: 클라이언트 노드가 Flow View에 표시되지만 메인 실행 흐름(START → ... → END)과 연결되지 않습니다. 원래 캔버스 위치에 독립 노드로 렌더링됩니다.
* **Edge 연결 부재**: 메인 그래프 노드에서 클라이언트 노드로의 edge가 존재하지 않아, 클라이언트 노드가 메인 roots에서 BFS로 도달 불가능한 고립 서브그래프를 형성합니다.

---

## 변경 파일 요약

| 파일 | 변경 내용 |
|------|----------|
| `ui/canvas-engine.js` | ghost 필터 우회, 마젠타 렌더링, 클라이언트 노드 필터 통일, ReferenceError 수정, 진단 로그 |
| `demo/canvas-engine.js` | ghost 필터 우회 (동일 패치) |
| `src/types/schema.ts` | ContributionNode, ContributionEdge 타입 정의 |
