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


# Persistence Philosophy

## File System First

SYNAPSE는 Database 중심 시스템이 아니다.

SYNAPSE의 Source Of Truth는 파일 시스템이다.

예:

Master Layer

Submission Snapshot

Harvest Report

Project Files

모두 파일로 존재한다.

---

## Database Free Principle

v0.3.x 기준으로 DB는 도입하지 않는다.

사용하지 않는 대상:

* SQLite
* PostgreSQL
* MySQL
* MongoDB
* Redis

---

## Persistence Strategy

모든 상태는 파일로 저장한다.

예:

.synapse/ (또는 data/ 및 VSCode Global Storage)

├── accounts.json
├── project_metadata.json
├── project_state.json
├── synapse_history.json
└── .server_info

---

## Graph Model

SYNAPSE의 실질적인 데이터 모델은 DB가 아니라 그래프이다.

예:

Node

* Task
* Layer
* File
* Remote Client (사용자)

Edge

* DependsOn
* Owns
* Modifies
* Harvests

---

## Canvas First

SYNAPSE의 주 UI는 VSCode Canvas이다.

상태 조회는 DB Query가 아니라 그래프 탐색으로 수행한다.

---

## Scale Assumption

목표:

10명 이하

권장 최대:

20명 이하

---

## Node Scale

SYNAPSE는 사용자 수보다 그래프 규모를 우선 고려한다.

예상:

1,000 Nodes

5,000 Nodes

10,000 Nodes

규모는 충분히 허용 가능하다.

---

## Non Goal

수백 명 동시 접속

수천 명 동시 접속

분산 DB

샤딩

클러스터링

은 목표가 아니다.

---

## Final Definition

SYNAPSE는 Database 기반 협업 시스템이 아니다.

SYNAPSE는 파일 시스템과 그래프를 Source Of Truth로 사용하는 협업 시스템이다.

## ROOT Structure
프로젝트 주요 디렉터리 구조 및 소스코드 현황입니다. (Active/Orphaned/Legacy 상태 포함, 마일스톤/릴리즈 노트 제외)

### 📂 Directory Tree
```text
.
├── package.json
├── webpack.config.js
├── tsconfig.json
├── build-guard.js
├── test_scan.ts
├── RULES.md
├── synapse.config.json
├── .synapseignore
├── .vscodeignore
├── .github/
├── .vscode/
├── .backup/
├── scripts/
│   └── create-account.js
├── ui/
│   ├── index.html
│   ├── synapse-theme.js
│   ├── canvas-engine.js
│   ├── webgl-renderer.js
│   └── engine-core.js
├── demo/
│   ├── index.html
│   ├── synapse-theme.js
│   ├── canvas-engine.js
│   ├── webgl-renderer.js
│   ├── engine-core.js
│   └── data/
│       ├── accounts.json
│       ├── project_metadata.json
│       ├── project_state.json
│       ├── synapse_history.json
│       └── .server_info            ← 🟢 Added
├── assets/
├── backup_md/
├── context/
├── data/
├── dist/
├── docs/
├── resources/
├── scratch/
├── src/
│   ├── extension.ts
│   ├── cli.ts
│   ├── client.ts
│   ├── verify_v0.3.10.ts
│   ├── types/
│   │   └── schema.ts
│   ├── core/
│   │   ├── canvas-engine/
│   │   │   ├── CanvasEngine.ts
│   │   │   ├── Intent.ts
│   │   │   ├── PhaseGate.ts
│   │   │   ├── RenderProtocol.ts
│   │   │   ├── RuleEngine.ts
│   │   │   ├── ScenarioRunner.ts
│   │   │   ├── SpatialRuleBook.ts
│   │   │   ├── StateManager.ts
│   │   │   ├── ValidationHarness.ts
│   │   │   └── VisualRuleBook.ts
│   │   ├── transaction/
│   │   │   ├── CommitManager.ts
│   │   │   ├── ExecutionLayer.ts
│   │   │   └── VerificationLayer.ts
│   │   ├── projection/
│   │   │   ├── ProjectionLayer.ts
│   │   │   └── RuleStore.ts
│   │   ├── collaboration/          ← 🔵 Active (v0.3.30+)
│   │   │   ├── IdentityManager.ts
│   │   │   ├── SessionManager.ts
│   │   │   ├── RuntimeInitializer.ts
│   │   │   ├── CompareEngine.ts
│   │   │   ├── CompareProjection.ts    ← 🟢 Added
│   │   │   ├── EdgeGenerator.ts        ← 🟢 Added
│   │   │   ├── HarvestSessionManager.ts
│   │   │   ├── HarvestProjection.ts    ← 🟢 Added
│   │   │   ├── RemoteLayerProjector.ts
│   │   │   ├── ArchitectureIndexBuilder.ts
│   │   │   ├── ReferenceVerifier.ts
│   │   │   ├── HarvestEngine.ts
│   │   │   ├── BoundaryGuard.ts
│   │   │   ├── MountManager.ts
│   │   │   ├── AccountManager.ts
│   │   │   ├── CollaborationTransport.ts
│   │   │   └── RestCollaborationTransport.ts
│   │   ├── (Active) ProjectMetadata.ts
│   │   ├── (Active) SymbolIndex.ts
│   │   ├── (Active) DataPipeline.ts
│   │   ├── (Active) RendererCore.ts
│   │   ├── (Active) RuleEngine.ts
│   │   ├── (Active) GraphModel.ts
│   │   ├── (Active) BlacklistOrchestrator.ts
│   │   ├── (Active) FileScanner.ts
│   │   ├── (Active) FlowScanner.ts
│   │   ├── (Active) FlowchartGenerator.ts
│   │   ├── (Active) LogicAnalyzer.ts
│   │   ├── (Active) GeminiParser.ts
│   │   ├── (Active) graphBuilder.ts
│   │   ├── (Active) DatabaseEngine.ts
│   │   ├── (Active) PromptLogger.ts
│   │   ├── (Active) DebuggerSystem.ts
│   │   ├── (Active) ControlSystem.ts
│   │   ├── (Active) AiOrchestrator.ts
│   │   ├── (Active) PhaseManager.ts
│   │   ├── (Active) SnapshotSystem.ts
│   │   ├── (Active) GridSystem.ts
│   │   ├── (Active) VirtualDebugger.ts
│   │   ├── (Active) EdgeCodeRefactorer.ts
│   │   ├── (Active) PbSessionWatcher.ts
│   │   ├── (Active) filterSnapshot.ts
│   │   ├── (Active) JVMAuditor.ts
│   │   ├── (Active) ReportExporter.ts
│   │   ├── (Active) VscdbAdapter.ts
│   │   ├── (Active) SynapseIgnore.ts
│   │   ├── (Legacy) BillingManager.ts
│   │   ├── (Orphaned) WebviewInterceptor.ts
│   │   ├── (Orphaned) CommandInterceptor.ts
│   │   ├── (Orphaned) CDPManager.ts
│   │   ├── (Orphaned) DirectChatScraper.ts
│   │   ├── (Orphaned) ArchitectureDSL.ts
│   │   ├── (Deleted) GhostNodeManager.ts     ← 디스크에 없음
│   │   └── (Deleted) ContextVault.ts          ← 디스크에 없음
│   ├── test/                                  ← 🔵 Active (v0.3.30+)
│   │   ├── __mocks__/
│   │   │   └── vscode.ts
│   │   ├── phase1_validation.test.ts
│   │   ├── phase2_validation.test.ts
│   │   ├── security_integration.test.ts
│   │   └── security_regression.test.ts
│   ├── analysis/
│   │   └── hintEngine.ts
│   ├── bootstrap/
│   │   └── BootstrapEngine.ts
│   ├── rust_checker/
│   │   ├── mod.rs
│   │   ├── reporter.rs
│   │   └── state_checker.rs
│   ├── explorer/
│   │   └── ArchitectureExplorer.ts
│   ├── server/
│   │   ├── server.ts
│   │   ├── standalone.ts
│   │   ├── vscode.ts
│   │   └── register-vscode-mock.ts
│   ├── utils/
│   │   ├── ChatExtractor.ts
│   │   ├── Logger.ts
│   │   ├── SensitiveInfoMasker.ts
│   │   ├── exclusionRules.ts
│   │   └── visualHints.ts
│   └── webview/
│       └── CanvasPanel.ts
├── mile_stone/
│   ├── v0.2.xx.md ~ v0.3.29.md (버전별 마일스톤 문서 모음)
│   ├── v0.3.30.md (현행) + phase 1-9 상세 명세
│   └── ... (작업 기록 및 설계 문서)
├── release_note/
│   └── v*_release_notes.md
└── tools/
    ├── compare.js
    ├── config-generator.js
    └── log-analyzer.js
```

### 📇 File Index (파일별 역할 설명)

기존 파일들의 역할에 새로 추가되거나 변경된 항목의 주석을 보강했습니다.

| 파일/폴더 경로 | 상태 | 주요 역할 및 기능 설명 |
| :--- | :--- | :--- |
| `package.json` | 유지 | VS Code 확장 프로그램 메타데이터(기여 지점, 명령어 바인딩) 정의 및 패키지 관리 |
| `build-guard.js` | 유지 | 마일스톤 및 릴리즈 노트 유효성 자동 검증 배포 통제 스크립트 |
| `RULES.md` | 유지 | 프로젝트 코딩 규칙 및 아키텍처 제약 문서 |
| `synapse.config.json` | 유지 | 시냅스 아키텍처 규칙 및 설정 보관 파일 |
| `.synapseignore` | 유지 | Gitignore-style 제외 패턴; 프로젝트 스캔/분석/시각화에서 파일 필터링 |
| `ui/canvas-engine.js` | 유지 | O(N) 순회 병목 제거, sub-pixel 안티앨리어싱, NaN 방지, WebGL 수학적 패리티 동기화 적용 2D 엔진 + v0.3.30 Client Layer System (register/sync/visibility toggle UI) |
| `ui/webgl-renderer.js` | 유지 | 대규모 노드 그래프 실시간 60FPS GPU 파이프라인 가속 렌더러 |
| `ui/engine-core.js` | 유지 | 캔버스 엔진 + WebGL 렌더러 간 공통 코어 로직 및 상태 브릿지 |
| `src/extension.ts` | 유지 | VS Code Extension 진입점, 확장 활성화 및 이벤트 최초 등록 |
| `src/cli.ts` | 유지 | 터미널 기반 CLI 제어 인터페이스 |
| `src/client.ts` | 유지 | 외부 클라이언트 시스템 연동 인터페이스 |
| `src/verify_v0.3.10.ts` | Standalone | v0.3.10 규격 검증용 독립 실행 스크립트 |
| `src/types/schema.ts` | 수정 | 노드, 엣지, 클러스터 타입스크립트 인터페이스 + SubmissionSnapshot/ReviewState/RemoteEditAction + Node/Cluster.clientLayer + SubmissionSnapshot.clientUsername (v0.3.30) |
| `src/core/canvas-engine/` | Active | CanvasEngine, Intent, PhaseGate, StateManager, RuleEngine, VisualRuleBook, SpatialRuleBook, ValidationHarness, ScenarioRunner, RenderProtocol — 캔버스 구동 도메인 물리 분리 (10개 파일) |
| `src/core/transaction/` | Active | CommitManager, ExecutionLayer, VerificationLayer — 아키텍처 상태 변경 트랜잭션 무결성 검증 및 커밋 |
| `src/core/projection/` | Active | ProjectionLayer, RuleStore — 추상화된 설계 룰을 시각적 레이어에 투영 |
| `src/core/ProjectMetadata.ts` | Active | Server-owned project boundary manager (싱글톤, UUID, 경로 검증, SymbolIndex 통합) |
| `src/core/SymbolIndex.ts` | Active | Cross-file registry (FolderTree + FileRegistry + FunctionCatalog, .synapseignore 필터링 + setIgnore() 연동) |
| `src/core/DataPipeline.ts` | Active | 물리 파일 시스템 스캔 → 노드/엣지/클러스터 추출, 📁 Root 클러스터를 통한 무소속 노드 물리 배정 및 초기 원형 분산 배치 |
| `src/core/RendererCore.ts` | Active | 렌더러 생명주기 관리 및 WebGL/Canvas 2D 전환 브릿지 |
| `src/core/RuleEngine.ts` | Active | 핵심 규칙 검증 엔진 (Phase/Rule/Mutation pipeline) |
| `src/core/GraphModel.ts` | Active | 그래프 데이터 모델 (노드/엣지 CRUD, 직렬화) |
| `src/core/BlacklistOrchestrator.ts` | Active | 노이즈 폴더(`dist`, `node_modules` 등) O(1) 하이브리드 블랙리스트 필터 |
| `src/core/FileScanner.ts` | Active | 단일 파일 단위 소스 분석 및 의존성 추출 (크로스-워크스페이스 [SYNAPSE_NETWORK_LINK] 정규식 파싱 포함) |
| `src/core/FlowScanner.ts` | Active | 파일 간 데이터 흐름(Flow) 분석 엔진 |
| `src/core/FlowchartGenerator.ts` | Active | 분석 결과 → 계층형 레이아웃 플로우차트 생성 (DFS Rank 할당, Logic Inversion) |
| `src/core/LogicAnalyzer.ts` | Active | 스키마 무결성 검증 및 아키텍처 논리 분석 (detectSchemaViolations) |
| `src/core/GeminiParser.ts` | Active | Gemini/Copilot 대화 데이터 파싱 전담 |
| `src/core/graphBuilder.ts` | Active | 스캔된 소스 → 그래프 구조화 빌더 |
| `src/core/DatabaseEngine.ts` | Active | VS Code globalState 기반 KV 스토리지 (billing_meta, managed_nodes) |
| `src/core/PromptLogger.ts` | Active | 세션/대화 로그 기록 엔진 (audit + session.md) |
| `src/core/DebuggerSystem.ts` | Active | 디버깅 트리거 아키텍처 및 진단 로그 |
| `src/core/ControlSystem.ts` | Active | 시스템 제어 명령어 및 피드백 루프 |
| `src/core/AiOrchestrator.ts` | Active | AI 에이전트 오케스트레이션 (PhaseGate/Mutation) |
| `src/core/PhaseManager.ts` | Active | Phase 상태 관리 및 전이 |
| `src/core/SnapshotSystem.ts` | Active | 프로젝트 상태 스냅샷 저장/복원 (v0.3.30: 버전/체크섬/메타데이터 업그레이드) |
| `src/core/GridSystem.ts` | Active | 캔버스 그리드 시스템 및 스냅 정렬 |
| `src/core/VirtualDebugger.ts` | Active | 가상 디버거 (런타임 상태 모니터링) |
| `src/core/EdgeCodeRefactorer.ts` | Active | 엣지 코드 리팩터링 검증 도구 |
| `src/core/PbSessionWatcher.ts` | Active | Protobuf 세션 파일 감시 및 추출 트리거 |
| `src/core/filterSnapshot.ts` | Active | 스냅샷 레이어/타입 기반 필터링 |
| `src/core/JVMAuditor.ts` | Active | Java 및 Kotlin 소스의 심층 구조적 무결성 분석 및 클래스 기반 로직 오디팅 |
| `src/core/ReportExporter.ts` | Active | 리포트 내보내기 |
| `src/core/VscdbAdapter.ts` | Active | VS Code DB 어댑터 |
| `src/core/SynapseIgnore.ts` | Active | Gitignore-style 패턴 파서; `.synapseignore` 로드/매칭/통합 |
| `src/core/BillingManager.ts` | **Legacy** | 상용화 과금 뼈대. Free node/session limit + Pro mode. 모든 과금 UX 주석 Lock. Dev 강제 Pro |
| `src/core/WebviewInterceptor.ts` | **Orphaned** | (Ghost Protocol) Point 1&7 웹뷰 입출력 요격. HTML setter 후킹 + CDP Fallback. 857라인 완전 구현, v0.3.10+ 미사용 |
| `src/core/CommandInterceptor.ts` | **Orphaned** | (Wildcard) `antigravity.*`/`gemini.*` 전수 요격 + 재귀 인자 스캐너. v0.3.10에서 `activate()` 비활성화 |
| `src/core/CDPManager.ts` | **Orphaned** | (Ghost Protocol) Chrome DevTools Protocol 브릿지. Runtime.evaluate JS 주입 + acquireVsCodeApi 후킹. 350+라인 완전 구현 |
| `src/core/DirectChatScraper.ts` | **Orphaned** | 채팅 UI 하드카피 스크래퍼. 포커스 9단계 Fallback + 클립보드 백업/화자파싱. v0.2.41 PbExtractor로 교체 |
| `src/core/ArchitectureDSL.ts` | **Orphaned** | YAML 5-Line DSL → 그래프 변환 파서. v0.2.18.1 완성, 파일 스캐닝 방식으로 대체 |
| `src/core/collaboration/IdentityManager.ts` | Active | Identity + Role + Permission 체계 (enum Permission, ProjectRole, ROLE_PERMISSIONS) — member role permissions → empty (JoinSession/LeaveSession etc. 제거) |
| `src/core/collaboration/SessionManager.ts` | Active | CollaborationSession 생명주기 (created → open → active → closing → closed) — joinSession/leaveSession에서 IdentityManager.hasPermission() 검증 제거 |
| `src/core/collaboration/RuntimeInitializer.ts` | Active | 4단계 Runtime startup (ProjectMetadata → SymbolIndex → Identity → Session) → ready |
| `src/core/collaboration/SubmissionManager.ts` | **Deleted** | 기존 SubmissionSnapshot 구조 폐기로 완전 삭제 |
| `src/core/collaboration/CompareEngine.ts` | Active | Harvest 세션 비교 엔진 (SHA256 해시 검증 및 Layer 가시성 필터링) |
| `src/core/collaboration/HarvestSessionManager.ts` | Active | Harvest 세션 및 접속 클라이언트들의 파일 시스템 락(Lock) 전역 상태 관리 |
| `src/core/collaboration/RemoteLayerProjector.ts` | Active | Stateless projector: 파일 집합 → ProjectionResult (Node/Cluster Layer 분류, Visibility) + clientLayer 태깅 |
| `src/core/collaboration/ArchitectureIndexBuilder.ts` | Active | 파일 집합 → ArchitectureIndex (ProjectTree + FolderTree + SourceFileRegistry + FunctionCatalog) |
| `src/core/collaboration/ReferenceVerifier.ts` | Active | ArchitectureIndex → ReferenceGraph + VerificationReport (참조 분석, 100+ 다국어 외부 라이브러리 화이트리스트 검증, Ghost Projection) |
| `src/core/collaboration/HarvestEngine.ts` | Active | Approved Workspace → Master Layer 물리적 Materialization + LayerHarvestInput + harvest path traversal 방어 (resolvedTarget.startsWith) |
| `src/core/collaboration/BoundaryGuard.ts` | Active | 중앙 경계 보안 (Project/Session/Harvest Isolation, Cache Cleanup) |
| `src/core/collaboration/MountManager.ts` | Active | SSH 기반 클라이언트 프로젝트 폴더 마운트 관리 (mount/unmount/scan, validateMountPath) — v0.3.30 신규 |
| `src/core/collaboration/AccountManager.ts` | Active | 계정 CRUD, 비밀번호 해싱, getAllAccounts/getUsernameByUserId + SSH mount 필드 (sshHost/sshPort/sshMountPath/sshKey) |
| `src/core/collaboration/CollaborationTransport.ts` | Active | 추상 전송 계층 (WebSocket/REST 공통 인터페이스) |
| `src/core/collaboration/RestCollaborationTransport.ts` | Active | REST 전송 구현체 |
| `src/analysis/hintEngine.ts` | Active | 실시간 아키텍처 분석 및 진단 힌트(R1~R5 경고) 캔버스 제공 |
| `src/bootstrap/BootstrapEngine.ts` | Active | 초기 로드 시 디렉터리 스캔 → 아키텍처 그래프 자동 구성 |
| `src/rust_checker/` | Active | Rust 프로젝트 소스 구조 분석 및 종속성 추출 (mod.rs + reporter.rs + state_checker.rs) |
| `src/explorer/ArchitectureExplorer.ts` | Active | 아키텍처 탐색기 (트리/그래프 뷰 전환) |
| `src/server/server.ts` | Active | LSP 서버 메인 프로세스 |
| `src/server/standalone.ts` | Active | 독립 실행 모드 (`--root`/`--port` CLI, auth 미들웨어, 세션/토큰 관리, MountManager+SSH 마운트, per-client state, `/api/state` 병합, BoundaryGuard/SynapseIgnore 통합, 다수 신규 API 엔드포인트) |
| `src/server/vscode.ts` | Active | VS Code API mock 미니멀 구현체 |
| `src/server/register-vscode-mock.ts` | Active | vscode 모듈 전역 등록 (standalone 부트 전) |
| `src/utils/ChatExtractor.ts` | Active | 채팅 데이터 추출 유틸리티 |
| `src/utils/Logger.ts` | Active | 시스템 전역 로깅 유틸리티 — standalone 모드 지원 (try/catch vscode require, console.log 폴백) |
| `src/utils/exclusionRules.ts` | Active | 제외 규칙 정규식 관리 |
| `src/utils/visualHints.ts` | Active | 시각 힌트(배지, 컬러) 유틸리티 |
| `src/webview/CanvasPanel.ts` | Active | 웹뷰 캔버스 패널 (수동 노드 확장자 동적 추론, 스키마 검증 False Positive 회피, 삭제 경로 보정, 서버/계정 관리 상태 동기화) |
| `test_scan.ts` | Active | 파일 스캔 및 분석 파이프라인의 로컬 테스트 독립 실행 스크립트 |
| `src/test/__mocks__/vscode.ts` | Active | VS Code API Mock (테스트 환경) |
| `src/test/phase1_validation.test.ts` | Active | Phase 1 검증 (ProjectBoundary + SymbolIndex) — 10 tests |
| `src/test/phase2_validation.test.ts` | Active | Phase 2 검증 (Identity + Session + Runtime) — 14 tests |
| `src/test/security_integration.test.ts` | Active | 보안 검증 (Path Traversal, 권한 우회, SSE 오염 등) |
| `src/test/security_regression.test.ts` | Active | 보안 및 역호환성 회귀 검증 (계정 포맷 및 포트 충돌 방어) |
| `src/test/phase3_validation.test.ts` ~ `transport_validation.test.ts` | **Deleted** | 기존 Submission 기반 비동기식 테스트 영구 삭제 (v0.3.30 Harvest 통합) |
| `src/utils/SensitiveInfoMasker.ts` | Active | 로그 내 민감 정보(Secret, Token, Password 등) 자동 마스킹 유틸리티 |
| `tools/*` | 유지 | 성능 벤치마킹, 규격 파일 생성, 진단 로그 분석용 보조 스크립트 |

> **삭제된 파일**: `src/core/GhostNodeManager.ts`, `src/core/ContextVault.ts` — 이전 ROOT Structure에 Active로 기재되어 있었으나 현재 디스크에 존재하지 않습니다. (v0.3.30 이전 리팩토링 과정에서 제거)

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

## 🏗️ Node & Cluster Lifecycle Rules (버퍼 → 리저브드 → 마스터)

SYNAPSE에서 수동으로 생성되는 노드와 클러스터의 상태 전이 규칙은 아키텍처의 무결성과 물리 엔진 레이아웃(겹침 방지)을 유지하기 위해 엄격하게 관리됩니다.

### 1. 🟢 버퍼 노드 생성 (Buffer State)
- **트리거**: 사용자가 UI 캔버스에서 더블클릭 혹은 메뉴를 통해 수동으로 제네릭 노드(파일)를 생성할 때.
- **처리 위치**: `src/webview/CanvasPanel.ts` 내 `handleCreateManualNode` 함수
- **규칙 명세**:
  - 생성된 노드는 물리적 파일 시스템에 아직 온전히 코드로 반영되지 않은 "고립된 아이디어"로 간주되어, 기본적으로 **`sys_cluster_buffer`** (버퍼 클러스터)에 할당됩니다.
  - 사용자가 확장자를 생략했을 경우, 프로젝트 내 가장 빈번한 확장자(예: TypeScript 프로젝트면 `.ts`)를 동적으로 추론하여 자동 할당합니다.

### 2. 🟡 리저브드 승격 (Reserved Promotion)
- **트리거**: 고립되어 있던 버퍼 상태의 노드가 다른 노드와 **엣지(Edge)로 연결**되는 순간.
- **처리 위치**: `src/webview/CanvasPanel.ts` 내 웹뷰로부터 `pushEdge` 메시지를 수신하는 블록의 `promoteToReserved` 함수
- **규칙 명세**:
  - 시스템은 엣지가 연결되는 즉시 해당 노드가 단순한 메모장 수준을 넘어 실제 아키텍처 흐름에 개입(참여)했다고 판단합니다.
  - 노드의 소속을 `sys_cluster_buffer`에서 **`sys_cluster_reserved`** (내부 보류/대기 상태)로 즉시 승격(Promote)시킵니다.
  - 이 변경 사항은 인메모리 엔진(`canvasEngine.dispatch`)과 물리적 상태(`project_state.json`) 양쪽(SSoT)에 동시 반영되어 정합성을 유지합니다.

### 3. 🔵 마스터 팩킹 및 특수 클러스터 분류 (Master Packing & Remote Ghost)
- **트리거**: 소스 코드가 작성되어 스캐너(`FileScanner`)가 파일을 읽어들인 뒤, 그래프 파이프라인(`DataPipeline`)을 거쳐 월드 맵에 배치될 때.
- **처리 위치**: `src/core/DataPipeline.ts` 클러스터링 및 레이아웃 물리 배정 파트
- **규칙 명세**:
  - **📁 Root 클러스터 동적 생성**: 폴더 경로가 없어 소속 클러스터를 배정받지 못한 최상위 루트 파일(`__unclustered__`)들은 과거 레이아웃 계산 단계에서 제외되어 좌표 `(0,0)`에 무한히 겹쳐 쌓이는 치명적 버그를 유발했습니다. 파이프라인은 이를 방어하기 위해 런타임에 동적으로 **`📁 Root`** 클러스터를 생성하여 무소속 노드들을 강제 편입시키고 정상적인 물리 팩킹(World Packing) 궤도에 올려놓습니다.
  - **🌐 Remote Ghost 클러스터 격리**: `[SYNAPSE_NETWORK_LINK]` 매크로 등으로 식별된 외부 워크스페이스 의존성(원격 파일) 노드들은 일반 에러 노드로 섞이지 않도록 **`cluster_ghost_network_remote`**라는 전용 특수 클러스터 공간에 격리 할당되어 시각적 명확성을 보장합니다.
