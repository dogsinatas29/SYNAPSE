---
trigger: glob
description: "SYNAPSE 캔버스, WebGL/2D 렌더러, 레이아웃 엔진 및 노드 라이프사이클 수정 시 자동 적용되는 성능·안정성 불변 규칙"
globs: "ui/**, demo/**, src/core/canvas-engine/**, src/webview/**, src/core/LayoutEngine.ts, src/core/RendererCore.ts"
---

# Canvas & Rendering Pipeline Rules

## 1. Frame Loop & CPU Budget Constraints (60FPS / 16ms 예산)
LLM은 **CPU는 희소하고, GPU는 가용하며, 반복은 위험하고, 상태(State)만이 유일한 트리거**임을 전제한다[cite: 3, 6].

* **Frame Loop O(1) 강제:** 매 프레임 실행 경로(`render` / `update`) 내부에 `for` / `while` 루프, `map` / `filter` / `reduce`, 동적 객체 할당(`new`, `push`, 배열 리사이징), 상태 비의존 재계산을 엄격히 금지한다[cite: 3, 6]. 사전 할당(Pre-allocate), 메모리 재사용, 캐시 및 Dirty Flag만 사용한다[cite: 3, 6].
* **CPU 연산 오프로드:** 매 프레임 반복되는 시각·변환 연산은 GPU(WebGL Shader/Buffer)로 넘긴다[cite: 3, 6].
* **뷰 격리 (Rendering Isolation):** 그래프, 파일, 플로 뷰 간 전환 시 WebGL 상태(`framebuffer`, `shader`, `buffer binding`)를 강제 초기화하여 시각적 간섭을 차단한다[cite: 3, 6].
* **승인 전 필수 체크리스트:**
  - [ ] 프레임 경로(`_performRender` 등) 내 루프 없음[cite: 3, 6]
  - [ ] 상태 비의존 중복 계산 없음[cite: 3, 6]
  - [ ] 핫 패스(Hot Path) 내 동적 객체 할당 없음[cite: 3, 6]
  - [ ] 상태 변경 기반 업데이트만 사용 (폴링 금지)[cite: 3, 6]

---

## 2. SYNAPSE Core Rule (Layout vs Visibility)
레이아웃 엔진은 절대 가시성 상태(Profile, Visibility)에 의존하여 공간 배치를 계산해서는 안 된다[cite: 3, 6].

* **금지 (접근 불가 상태값):**
  `cluster.collapsed`, `cluster.visible`, `showExternalLayer`, `hideNodeModes`, `focusMode`[cite: 3, 6]
* **허용 (실제 데이터):**
  `actual node count`, `actual descendants`, `actual edges`, `actual hierarchy`[cite: 3, 6]
* **불변 원칙:** **Layout = Reality**, **Visibility = Presentation** (프로파일은 렌더링 표시 여부만 제한하며, 좌표와 공간 배치는 항상 전체 그래프를 기준으로 계산한다)[cite: 3, 6].

---

## 3. 렌더링 파이프라인 절대 불변 규칙 (v0.3.34.40 무한 리빌드 사태의 교훈)
과거 v0.3.34.40에서 발생했던 마우스 이동 시 1919ms 멈춤 및 화면 증발 현상을 방지하기 위해 다음 9가지 규칙은 어떠한 경우에도 어기지 않는다[cite: 3, 6].

1. **`nodeMap` 사이즈 검사 로직 절대 변경 금지:** 캐시 맵 최초 생성 여부는 반드시 `this.nodeMap.size === 0`으로만 검사한다 (`nodeMap.size !== nodeCount` 비교 방어 코드 재도입 절대 금지)[cite: 3, 6].
2. **`beginFrame()` 버퍼 클리어 위치 절대 고정:** `webglRenderer.beginFrame()`은 반드시 `if (!this.isDirty && !this.isAnimating && !this._isInteracting && !this.isDragging) return;` 조기 종료 방어선 **아래**에 위치해야 한다[cite: 3, 6].
3. **Dirty Flag 단일 진실 원칙:** 그래프 재빌드는 반드시 `this.isGraphDataDirty` 플래그에 의해서만 수행한다 (렌더러가 사이즈 차이를 추론해 암묵적 리빌드 유발 금지)[cite: 3, 6].
4. **Render Loop 내부에서 Graph Rebuild 금지:** `_performRender()` 내부에서 `rebuildGraphData()`나 `rebuildVisibleCache()`를 직접 호출하지 않는다[cite: 3, 6].
5. **MouseMove 에서 O(N) 순회 금지:** `mousemove`, `pointermove`, `hover`, `tooltip`, `pick` 이벤트 처리 중에는 반드시 `RBush` (Spatial Index), `Visible Cache`, `NodeMap Lookup (O(1))`만 사용한다[cite: 3, 6].
6. **Hover 는 Render 요청만 가능:** Hover 처리 중 그래프 구조 갱신 로직을 트리거하지 않고 `requestRender()`만 호출한다[cite: 3, 6].
7. **Duplicate ID Policy:** Map 구조는 중복 ID를 병합하므로 렌더러는 절대 `nodeMap.size === nodes.length`를 가정하지 않는다[cite: 3, 6].
8. **Performance Budget (Linux Kernel 10만 노드 기준):**
   * Render Frame `< 5ms` / MouseMove `< 5ms` / Pick `< 10ms` / Hover Update `< 1ms` / Graph Rebuild: `Explicit Only`[cite: 3, 6]
   * 경고 임계치: `10ms WARN` → `30ms ERROR` → `100ms CRITICAL`[cite: 3, 6]
9. **Golden Benchmark (회귀 검증 기준):**
   * **Linux Kernel 7.2-rc3** (`Nodes: 103,313`, `Edges: 138,133`, `Clusters: 2,921`) — Bootstrap, Fit View, Pan, Zoom 성공 및 화면 증발·무한 리빌드·렌더러 프리징 없음[cite: 3, 6].

### 🚨 RENDERING RED ZONE 🚨
다음 시스템은 `STABLE` 상태이며, **원본 버그 재현 + 성능 벤치마크 + Linux Kernel 10만 노드 검증** 없이는 절대 수정하지 않는다[cite: 3, 6]:
* `nodeMap.size === 0` bootstrap logic[cite: 3, 6]
* `beginFrame()` placement[cite: 3, 6]
* Dirty Flag ownership[cite: 3, 6]
* Render loop early return guard[cite: 3, 6]
* MouseMove hit-test pipeline[cite: 3, 6]
* Hover -> `requestRender` flow[cite: 3, 6]

---

## 4. Node & Cluster Lifecycle Rules (버퍼 → 리저브드 → 마스터)

* **🟢 버퍼 노드 생성 (Buffer State):** 사용자가 UI 캔버스에서 수동으로 제네릭 노드를 생성할 때(`CanvasPanel.ts` 내 `handleCreateManualNode`), 기본적으로 `sys_cluster_buffer`에 할당하며 확장자 생략 시 프로젝트 내 최빈도 확장자를 동적 추론한다[cite: 3, 6].
* **🟡 리저브드 승격 (Reserved Promotion):** 버퍼 노드가 다른 노드와 엣지로 연결되는 순간(`CanvasPanel.ts` 내 `promoteToReserved`), 소속을 `sys_cluster_reserved`로 즉시 승격시킨다[cite: 3, 6]. 구조적 소속 변경은 SSoT(`project_state.json`)에 반영하되, **캔버스 노드 좌표(위치 정보)는 분리된 `LayoutStorage`에만 기록**하여 불필요한 SSoT 덮어쓰기를 방지한다[cite: 6].
* **🔵 마스터 팩킹 및 특수 클러스터 분류:** `DataPipeline.ts` 배정 시 폴더 경로가 없는 최상위 루트 파일(`__unclustered__`)은 런타임에 동적 생성한 `📁 Root` 클러스터에 편입해 `(0,0)` 중첩을 방지하고, `[SYNAPSE_NETWORK_LINK]` 원격 파일은 `cluster_ghost_network_remote`에 격리한다[cite: 3, 6].
