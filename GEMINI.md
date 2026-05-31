# Principles
🚀 [LLM 코딩 원칙]
LLM Coding Principles: 
1. [Think Before Coding] 코딩 전 사고: 추측하지 마라. 요구사항이 모호하면 즉시 질문하고, 접근 방식과 트레이드오프(장단점)를 먼저 제시하라. 항상 가장 단순한 해결책부터 제안한다.
2. [Simplicity First] 단순성 우선: 코드는 최소한으로 짠다. 요청하지 않은 기능이나 추상화를 추가하지 마라. 코드의 가독성과 효율성만 유지한다.
3. [Minimal Changes] 최소한의 변경: 정밀 타격하라. 전체를 새로 쓰지 말고 필요한 부분만 정확히 수정한다. 기존 스타일을 유지하며, 내가 새로 만든 코드 중 사용되지 않는 것만 정리한다.
4. [Goal-Oriented Execution] 목표 중심 실행: 목표 → 계획 → 구현 → 검증 순서를 엄수한다. 검증 가능한 목표를 정의하고, 단계별 계획을 세우며, 성공 기준을 명확히 확인한다.
5. [No Hallucinated APIs] API 환각 금지: 존재하지 않는 API, 함수, 라이브러리를 날조하지 마라. 확실하지 않으면 반드시 질문한다.
6. [Stable Code Protection] 안정 코드 보호: 이미 검증된 코드는 건드리지 마라. 오직 직접적으로 요청받은 부분만 수정하며, 가능하면 변경 사항은 diff 형식으로 제시한다.
7. [Context Confirmation] 맥락 확인: 코드를 수정하기 전 반드시 맥락을 확인하라. 추측해서 때려 맞추지 말고, 누락된 코드나 파일이 있다면 당당하게 요청하라.
8. [Rendering Isolation] 뷰 격리: 그래프, 파일, 플로 뷰 간 전환 시 WebGL 상태(framebuffer, shader, buffer binding)를 강제 초기화하여 시각적 간섭을 차단하라.
9. 작업 시작 전 반드시 작업 계획서를 제출하고 승인을 받은 이후에 작업을 진행한다. 문서를 읽고 멋대로 다른 문서를 만들지 않는다. 문서를 읽고 멋대로 작업을 진행하지 않는다. 

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
🚀 [시냅스 작업 원칙]
1. 마일스톤별 md파일로 버전별 개발 구조로 작업방법을 확정. 
 - 마일스톤 문서를 읽어들이면 즉시 해당 버전에 대한 작업 계획(Implementation Plan)과 TODO 리스트를 작성할 것. 
 - 해당 작업 중 발생하는 모든 릴리즈 노트와 생성 결과물은 마일스톤의 버전을 따라 컴파일할 것
 - 컴파일로 생성된 파일명은 synapse-visual-architecture-마일스톤에 기재된버전명.vsix로 생성할 것. 

2. 릴리즈 노트는 release_note 폴더에서 별도 관리할 것 
 - 릴리즈 노트에 기록된 내용은 버전.md파일을 기반으로 작업한 내용 + 작업중 추가한 요소로 반영하고 릴리즈 노트가 완성되면 버전.md파일에 추가 작업 내용을 바로 기록할것
 - 릴리즈 노트의 파일 명은 v버전_release_notes.md로 통일할 것


📜 마일스톤 문서 생성 및 경로 규격 (제미나이.md 추가 사양)
1. 표준 저장 경로 (Standard Path)
- 모든 마일스톤 문서는 프로젝트 루트를 기준으로 다음의 엄격한 경로 규칙을 따른다.
Path: ~/언어_프로젝트/프로젝트명/mile_stone/v[버전명].md
예시: ~/python_antigravity/synapse/milestone/v0.2.20.md
2. 자동 생성 프로토콜 (Auto-Generation Protocol)
- 사용자가 **"내용 설명하고 이거 정리해서 버전 x.x.x.md로 만들어줘"**라고 요청할 경우, 제미나이는 즉시 다음 프로세스를 수행한다.
- 생성되는 모든 MD 파일 상단에 # encoding: utf-8을 명시하고, 저장 시 강제로 UTF-8(No BOM)로 지정
- Context 덤프: 대화 중 나온 모든 설계, 로직, 주의사항을 수집.
- 규격 적용: 아래의 [마일스톤 문서 표준 템플릿]에 맞춰 내용 정리.
- 파일 생성: 지정된 경로에 문서 생성 (혹은 내용 출력).
- 릴리즈 노트가 완료되면 해당 내용을 마일스톤버전 문서에 기록할 것. 

# 마일스톤 문서 표준 템플릿: # 
🚀 Milestone [버전명] - [기능 대표 명칭] 
## 📅 작업 정보 - **상태:** 🏗️ Planned / 🚧 In-Progress / ✅ Completed 
- **관련 마일스톤:** v0.x.x (이전 버전 링크) 
- **목표:** 해당 버전에서 달성하고자 하는 핵심 가치 
## 🧠 상세 설계 및 로직 
- [핵심 설계 내용 1] 
- [핵심 설계 내용 2] 
- *여기에 자네의 폭주하는 망상과 논리의 정수를 정리* 
## 🛠️ 기술적 변경 사항 - **Node Update:** (예: 예약 노드 승격 로직 추가) 
- **Edge Update:** (예: Rule 04 타입 매칭 검사기 구현) 
- **File Changes:** (예: edgeHandler.ts 인터셉터 추가) 
## ⚠️ 예외 처리 및 주의 사항 
- 바이브 코딩 시 발생할 수 있는 환각 방지책 
- 성능 병목 예상 지점 및 디버깅 포인트 
## 📝 Post-Work Log (작업 후 기록) - *작업 중 추가된 요소 및 릴리즈 노트 기반의 최종 결과물 기록*

## ROOT Structure
성능 최적화 이전의 프로젝트 주요 디렉터리 구조 및 수정 대상 소스코드의 원본 상태 기록입니다. (마일스톤, 릴리즈 노트, context 폴더 제외)

### 📂 Directory Tree
```text
.
├── package.json
├── webpack.config.js
├── tsconfig.json
├── build-guard.js
├── synapse.config.json (추가됨)
├── ui/
│   ├── index.html
│   ├── synapse-theme.js (최적화 완료)
│   ├── canvas-engine.js (2D 병목 및 버그 7종 최적화 완료)
│   ├── webgl-renderer.js (3D 렌더링 최적화 완료)
│   └── engine-core.js (추가됨)
├── demo/
│   ├── index.html
│   ├── synapse-theme.js
│   ├── canvas-engine.js (ui와 동기화 완료)
│   └── webgl-renderer.js (ui와 동기화 완료)
├── src/
│   ├── extension.ts
│   ├── cli.ts (추가됨)
│   ├── client.ts (추가됨)
│   ├── types/
│   │   └── schema.ts (추가됨)
│   ├── core/ (구조 대폭 확장)
│   │   ├── RendererCore.ts
│   │   ├── RuleEngine.ts
│   │   ├── GraphModel.ts (추가됨)
│   │   ├── BlacklistOrchestrator.ts (추가됨)
│   │   ├── WebviewInterceptor.ts (추가됨)
│   │   ├── FileScanner.ts / FlowScanner.ts (추가됨)
│   │   ├── transaction/ (CommitManager, ExecutionLayer 등 추가됨)
│   │   ├── projection/ (ProjectionLayer, RuleStore 추가됨)
│   │   └── canvas-engine/ (Intent, PhaseGate, StateManager, VisualRuleBook 등 추가됨)
│   ├── analysis/
│   │   └── hintEngine.ts (추가됨)
│   ├── bootstrap/
│   │   └── BootstrapEngine.ts (추가됨)
│   ├── rust_checker/ (Rust 스캐닝용 폴더 추가됨)
│   ├── explorer/
│   │   └── ArchitectureExplorer.ts
│   ├── server/
│   │   ├── server.ts
│   │   └── standalone.ts
│   ├── utils/ (ChatExtractor, Logger, exclusionRules 등 추가됨)
│   └── webview/
│       └── CanvasPanel.ts
└── tools/
    ├── compare.js
    ├── config-generator.js
    └── log-analyzer.js
```

### 📇 File Index (파일별 역할 설명)

기존 파일들의 역할에 새로 추가되거나 변경된 항목의 주석을 보강했습니다.

| 파일/폴더 경로 | 상태 | 주요 역할 및 기능 설명 |
| :--- | :--- | :--- |
| `package.json` | 유지 | VS Code 확장 프로그램의 메타데이터(기여 지점, 명령어 바인딩 등) 정의 및 패키지 관리 |
| `build-guard.js` | 유지 | 마일스톤 및 릴리즈 노트의 유효성(`Verified by Commander`)을 자동 검증하는 배포 통제 스크립트 |
| `synapse.config.json` | **신규** | 시냅스 아키텍처 규칙 및 설정 보관 파일 |
| `ui/canvas-engine.js` | **최적화** | O(N) 순회 병목 제거, sub-pixel 안티앨리어싱 보정, NaN 예외 처리, WebGL 수학적 패리티 동기화가 적용된 고성능 2D 엔진 |
| `ui/webgl-renderer.js` | **최적화** | 대규모 노드 그래프의 실시간 60FPS 유지를 위한 GPU 파이프라인 가속 렌더러 |
| `ui/engine-core.js` | **신규** | 캔버스 엔진과 WebGL 렌더러 간의 공통 코어 로직 및 상태 브릿지 역할 수행 |
| `src/extension.ts` | 변경 | VS Code Extension의 진입점, 확장 기능 활성화 및 이벤트 최초 등록 |
| `src/cli.ts` / `client.ts` | **신규** | 터미널 기반 CLI 제어 및 외부 클라이언트 시스템 연동 인터페이스 |
| `src/core/canvas-engine/` | **확장** | 캔버스 상태(StateManager), 렌더 프로토콜(RenderProtocol), 시각 룰북(VisualRuleBook) 등 캔버스 구동 도메인 물리 분리 |
| `src/core/transaction/` | **신규** | 엣지 생성, 삭제 등 아키텍처 상태 변경을 트랜잭션 단위로 묶어 무결성을 검증하고 커밋(CommitManager) |
| `src/core/projection/` | **신규** | 추상화된 설계 룰을 시각적 레이어에 투영하는 규칙 저장소 및 투영 엔진 |
| `src/core/BlacklistOrchestrator.ts` | **신규** | 노이즈 폴더(`dist`, `node_modules` 등)를 O(1) 매칭으로 필터링하는 하이브리드 블랙리스트 엔진 |
| `src/core/WebviewInterceptor.ts` | **신규** | VS Code 웹뷰와 코어 엔진 간의 메시징 및 UI 액션(드래그, 클릭 등) 이벤트 가로채기 핸들러 |
| `src/analysis/hintEngine.ts` | **신규** | 실시간 아키텍처 분석 및 진단 힌트(R1~R5 경고)를 캔버스에 제공하는 엔진 |
| `src/bootstrap/BootstrapEngine.ts` | **신규** | 초기 프로젝트 로드 시 디렉터리를 스캔하여 아키텍처 그래프를 자동 구성하는 부트스트랩 모듈 |
| `src/rust_checker/` | **신규** | Rust 언어 프로젝트의 소스 구조 분석 및 종속성 추출 모듈 |
| `src/utils/` | **신규** | 로거, 시각 힌트 유틸리티, 제외 규칙 정규식 관리 등 시스템 전역 공통 유틸리티 |
| `src/types/schema.ts` | **신규** | 노드, 엣지, 클러스터의 타입스크립트 인터페이스 및 데이터 스키마 정의 |
| `tools/*` | 유지 | 성능 벤치마킹, 규격 파일 생성, 진단 로그 분석용 보조 스크립트 모음 |

### 📄 소스파일 성능 최적화 이전 원본 상태 (Pre-Optimization Sources)

#### 1. 테마 정의 (`ui/synapse-theme.js` & `demo/synapse-theme.js`)
* 실선 스타일에서 `dash: [0, 0]` 패턴을 반환하고 있어 Canvas 2D에서 투명선으로 처리되는 문제가 있음.
```javascript
// ui/synapse-theme.js (Line 99-110)
EDGES: {
    DEPENDENCY: { color: '#ebdbb2', thickness: 2, icon: '🔗', dash: [0, 0] },
    REFERENCE: { color: '#928374', thickness: 1.5, icon: '🔗', dash: [4, 4] },
    DATA_FLOW: { color: '#83a598', thickness: 3, icon: '📊', dash: [0, 0] },
    EVENT: { color: '#fe8019', thickness: 2, icon: '⚡', dash: [0, 0] },
    CONDITIONAL: { color: '#d3869b', thickness: 1, icon: '❓', dash: [0, 0] },
    ORIGIN: { color: '#d65d0e', thickness: 1.5, icon: '📍' },
    API_CALL: { color: '#8ec07c', thickness: 2, icon: '🌐', dash: [4, 4] },
    DB_QUERY: { color: '#d3869b', thickness: 3, icon: '🛢️', dash: [0, 0] },
    LOOP: { color: '#fe8019', thickness: 2, icon: '🔁', dash: [2, 4] },
    HIGHLIGHTED: { color: '#fabd2f', thickness: 5, icon: '➤', dash: [0, 0] }
}

// ui/synapse-theme.js (Line 331)
dash: style.dash || [0, 0],
```

#### 2. Canvas 2D 렌더러 (`ui/canvas-engine.js` & `demo/canvas-engine.js`)
* 60FPS 렌더 루프 내부(O(1) 제약 구역)에서 배열 순회 메서드(`.every`)를 사용하여 프레임 비용 증가 발생.
```javascript
// ui/canvas-engine.js (Line 7687-7688) & demo/canvas-engine.js (Line 7664-7665)
const dashPattern = style.dashPattern || [];
this.ctx.setLineDash(dashPattern.every(v => v === 0) ? [] : dashPattern);
```

#### 3. WebGL 렌더러 (`ui/webgl-renderer.js` & `demo/webgl-renderer.js`)
* `style.dash`가 빈 배열(`[]`)로 올 경우, GPU 버퍼 업로드 시 `undefined`가 `NaN`으로 변환되어 WebGL 컨텍스트가 오염됨.
```javascript
// ui/webgl-renderer.js (Line 896-898) & demo/webgl-renderer.js (Line 896-898)
const styleDash = edgeStyle.dash || [0, 0];
dashData[dashCnt++] = styleDash[0];
dashData[dashCnt++] = styleDash[1];
```

### 🚀 성능 최적화 및 안정성 반영 상태 (Post-Optimization Sources)
실제 코드 리팩토링이 완료되어 프레임 루프 제약을 만족하고 WebGL 버퍼의 안정성이 구현된 상태입니다.

#### 1. 테마 정의 (`ui/synapse-theme.js` & `demo/synapse-theme.js`)
* 실선 스타일들의 테마 속성을 빈 배열(`[]`)로 정규화하였습니다.
```javascript
// ui/synapse-theme.js
EDGES: {
    DEPENDENCY: { color: '#ebdbb2', thickness: 2, icon: '🔗', dash: [] },
    REFERENCE: { color: '#928374', thickness: 1.5, icon: '🔗', dash: [4, 4] },
    DATA_FLOW: { color: '#83a598', thickness: 3, icon: '📊', dash: [] },
    EVENT: { color: '#fe8019', thickness: 2, icon: '⚡', dash: [] },
    CONDITIONAL: { color: '#d3869b', thickness: 1, icon: '❓', dash: [] },
    ORIGIN: { color: '#d65d0e', thickness: 1.5, icon: '📍' },
    API_CALL: { color: '#8ec07c', thickness: 2, icon: '🌐', dash: [4, 4] },
    DB_QUERY: { color: '#d3869b', thickness: 3, icon: '🛢️', dash: [] },
    LOOP: { color: '#fe8019', thickness: 2, icon: '🔁', dash: [2, 4] },
    HIGHLIGHTED: { color: '#fabd2f', thickness: 5, icon: '➤', dash: [] }
}

// getEdgeStyle
dash: style.dash || [],
```

#### 2. Canvas 2D 렌더러 (`ui/canvas-engine.js` & `demo/canvas-engine.js`)
* 핫 패스 내부에서 `.every()` 순회를 완전히 제거하고 O(1)로 직접 셋팅하도록 최적화했습니다.
```javascript
// ui/canvas-engine.js (Line 7687) & demo/canvas-engine.js (Line 7664)
this.ctx.setLineDash(style.dashPattern || []);
```

#### 3. WebGL 렌더러 (`ui/webgl-renderer.js` & `demo/webgl-renderer.js`)
* 빈 대시 배열이 들어오더라도 GPU 버퍼 packing 시 `0.0`으로 자동 폴백 처리하여 NaN 발생을 차단했습니다.
```javascript
// ui/webgl-renderer.js (Line 896-898) & demo/webgl-renderer.js (Line 896-898)
const styleDash = edgeStyle.dash && edgeStyle.dash.length > 0 ? edgeStyle.dash : [0, 0];
dashData[dashCnt++] = styleDash[0] !== undefined ? styleDash[0] : 0.0;
dashData[dashCnt++] = styleDash[1] !== undefined ? styleDash[1] : 0.0;
```


