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

## Lab (Architectural Ecology Laboratory)
- v0.3.34.13에서 확립된 **Architectural Ecology Laboratory (아키텍처 생태계 실험실)** 프레임워크는 SYNAPSE의 영구적인 커뮤니티 품질 평가 표준으로 사용된다.
- 앞으로 어떠한 새로운 시그널(예: Function Call, Struct Ownership, Lock Dependency 등)을 도입하더라도, 단순히 "좋아 보인다"는 가정으로 채택하지 않는다.
- 반드시 이 실험실 프레임워크를 통과하여 **9대 물리 법칙 지표(Purity, Entropy, Stability, Retention, Intrusion, Erosion, Lineage, Dominance, Cohesion)**와 **객관적 상태 판독기(Strengthened, Isolated, Polluted, Dissolved, Fragmented)**를 통해 그 기여도와 오염도를 정량적으로 측정하고 수학적으로 증명해야 한다.
- **"실험체(Signal)보다 실험실(Laboratory)을 먼저 만들고 신뢰한다"**는 과학적 철학을 영구히 유지한다.

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

---

## 8. Language Rule (i18n)

### 8.1. 지원 언어 (Supported Languages)
- **`en` (영어)**: 글로벌 사용자를 위한 기본값 (Default)
- **`ko` (한국어)**: 한국 사용자 전용

*주의: 일본어(`ja`), 중국어(`zh-CN` 등), 유럽어 등 기타 언어는 관리 비용 증가를 이유로 현재 단계에서 추가하지 않는다.*

### 8.2. 언어 감지 우선순위 (Language Detection Priority)
1. **`vscode.env.language`**: VSCode가 인식하고 있는 에디터 언어를 최우선으로 사용한다. (예: `window.VSCODE_LANGUAGE`로 웹뷰에 주입)
2. **`navigator.language`**: 브라우저 환경 등에서 VSCode 언어 값을 알 수 없을 때 사용한다.
3. **`'en'` (Fallback)**: 위 두 가지에서 `ko` 계열을 감지하지 못한 경우 모두 영어로 처리한다.

### 8.3. 적용 범위 (Scope of Localization)
- **Phase 1 (정적 UI 우선)**:
  - `<button>`, `<label>`, `<h3>`, `<span>` 등 정적 마크업에 존재하는 메뉴 텍스트, 버튼, 패널 제목만 번역 대상으로 삼는다.
  - HTML 속성(`data-i18n`)을 활용하여 텍스트를 외부 분리(예: `i18n.js`의 `t(key)` 함수)한다.
- **제외 대상 (당분간 하드코딩 유지)**:
  - `alert()`, `confirm()`, `toast`, `notification` 등 브라우저 네이티브 알림 메시지
  - Runtime 메시지 (예: "Loading...", "Project Analyzing...")
  - Error 메시지 (예: "File not found", "Network error")
*이유: 모든 문자열을 한 번에 번역하면 회귀 버그(Regression) 위험과 리팩토링 비용이 너무 커지므로, 정적 UI부터 점진적으로 국제화 기반을 구축한다.*

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

---

# SYNAPSE Core Rule (Layout vs Visibility)

레이아웃 엔진은 절대 가시성 상태(Profile, Visibility)에 의존하여 계산을 수행하면 안 된다.

**금지 (접근 불가 상태값):**
```javascript
cluster.collapsed
cluster.visible
showExternalLayer
hideNodeModes
focusMode
```

**허용 (실제 데이터):**
```javascript
actual node count
actual descendants
actual edges
actual hierarchy
```

즉,
**Layout = Reality**
**Visibility = Presentation**
이어야 합니다.
(프로파일은 렌더링만 제한하며, 공간 배치는 항상 전체 그래프를 기준으로 계산된다)

## ROOT Structure
프로젝트 주요 디렉터리 구조 및 소스코드 현황입니다. (Active/Orphaned/Legacy 상태 포함, 마일스톤/릴리즈 노트 제외)
*Last Updated: v0.3.34.39 (2026-08-26)*

### 📂 Directory Tree
```text
.
├── package.json                          # VS Code 확장 메타데이터 및 의존성 관리
├── webpack.config.js                     # Webpack 빌드 설정
├── tsconfig.json                         # TypeScript 컴파일러 설정
├── build-guard.js                        # 마일스톤/릴리즈 노트 검증 및 배포 통제
├── RULES.md                              # 프로젝트 코딩 규칙
├── AGENTS.md                             # AI 에이전트 작업 제약
├── GEMINI.md                             # Gemini LLM 성능 제약 및 원칙
├── synapse.config.json                   # SYNAPSE 아키텍처 규칙 설정
├── .synapseignore                        # Gitignore-style 제외 패턴
├── .vscodeignore                         # VSIX 패키징 제외 패턴
├── README.md                             # 영어 프로젝트 문서
├── README.ko.md                          # 한국어 프로젝트 문서
├── LICENSE                               # 라이선스
├── .github/                              # GitHub 워크플로우
├── .vscode/                              # VS Code 설정
├── .backup/                              # 백업 파일
├── scripts/
│   └── create-account.js                 # 계정 생성 스크립트
├── ui/
│   ├── index.html                        # 캔버스 웹뷰 마크업
│   ├── synapse-theme.js                  # 웹뷰 테마 컬러/스타일
│   ├── i18n.js                           # 🟢 다국어 지원 (data-i18n)
│   ├── canvas-engine.js                  # 🟡 O(N) 순회 제거, RBush 최적화 (v0.3.33.1_fix2)
│   ├── webgl-renderer.js                 # 60FPS GPU 렌더러
│   ├── cluster-hierarchy.js              # 🟢 클러스터 계층/바운딩 연산 (v0.3.33)
│   ├── rbush.js                          # 🟢 2D 공간 인덱싱 (v0.3.33)
│   └── engine-core.js                    # 캔버스+WebGL 공통 코어
├── demo/
│   ├── index.html                        # 데모 페이지
│   ├── synapse-theme.js                  # 데모 테마
│   ├── canvas-engine.js                  # 데모 캔버스 엔진
│   ├── webgl-renderer.js                 # 데모 WebGL 렌더러
│   ├── engine-core.js                    # 데모 코어
│   └── data/                             # 데모 데이터
│       ├── accounts.json
│       ├── project_metadata.json
│       ├── project_state.json
│       ├── synapse_history.json
│       └── .server_info
├── assets/                               # 정적 리소스
├── dist/                                 # 빌드 출력
├── docs/                                 # 문서
├── resources/                            # 추가 리소스
├── src/
│   ├── extension.ts                      # VS Code Extension 진입점
│   ├── main.ts                           # 🟢 메인 진입점 (v0.3.34+)
│   ├── cli.ts                            # CLI 제어 인터페이스
│   ├── client.ts                         # 외부 클라이언트 연동
│   ├── test-webview.ts                   # 🟢 웹뷰 테스트 스크립트
│   ├── verify_v0.3.10.ts                 # v0.3.10 규격 검증
│   ├── types/
│   │   └── schema.ts                     # 노드/엣지/클러스터 타입 정의
│   ├── core/
│   │   ├── analysis/                     # 🟢 분석 엔진 (v0.3.34+)
│   │   │   ├── aggregation/              # 데이터 집계
│   │   │   ├── analyzers/                # 분석기 (BoundaryAnalyzer 등)
│   │   │   ├── ast/                      # AST 처리
│   │   │   ├── intent/                   # 인텐트 분석
│   │   │   ├── reasoning/                # 추론 엔진
│   │   │   ├── ArchitectureAnalysisEngine.ts  # 아키텍처 분석 엔진
│   │   │   ├── ArchitectureHeaderPolicy.ts    # 헤더 정책
│   │   │   ├── ClusterBridgeAnalyzer.ts       # 클러스터 브릿지 분석
│   │   │   ├── ContractHeaderPolicy.ts        # 계약 헤더 정책
│   │   │   ├── GraphViewBuilder.ts            # 그래프 뷰 빌더
│   │   │   ├── InterventionSimulator.ts       # 개입 시뮬레이터
│   │   │   ├── PlatformHeaderPolicy.ts        # 플랫폼 헤더 정책
│   │   │   ├── ReportExporter.ts              # 리포트 내보내기
│   │   │   ├── SemanticContext.ts             # 🟢 시맨틱 컨텍스트 (v0.3.34.38)
│   │   │   ├── TargetSelector.ts              # 타겟 선택기
│   │   │   └── types.ts                       # 분석 타입 정의
│   │   ├── ir/                           # 🟢 Intermediate Representation (v0.3.34+)
│   │   │   ├── evaluators/               # IR 평가기
│   │   │   ├── generators/               # IR 생성기 (BoundaryCandidateGenerator 등)
│   │   │   ├── models/                   # IR 모델 (GeneratorInterfaces, SemanticTypes)
│   │   │   ├── promoters/                # IR 승격 로직
│   │   │   └── ArchitectureIrBuilder.ts  # 아키텍처 IR 빌더
│   │   ├── reasoning/                    # 🟢 추론 파이프라인 (v0.3.34+)
│   │   │   ├── analysis/                 # 추론 분석
│   │   │   ├── analyzers/                # 추론 분석기
│   │   │   ├── answers/                  # 답변 생성기 (Q6BoundaryAggregator 등)
│   │   │   ├── builder/                  # 빌더
│   │   │   ├── builders/                 # 다중 빌더
│   │   │   ├── evidence/                 # 증거 처리
│   │   │   ├── model/                    # 추론 모델
│   │   │   ├── ontology/                 # 온톨로지
│   │   │   ├── pipeline/                 # 파이프라인
│   │   │   ├── rules/                    # 규칙 (boundary/ 등)
│   │   │   ├── signal/                   # 시그널 처리
│   │   │   ├── snapshot/                 # 스냅샷
│   │   │   └── ReasoningPipelineRunner.ts # 추론 파이프라인 실행기
│   │   ├── metrology/                    # 🟢 측정/메트릭 (v0.3.34+)
│   │   │   ├── __tests__/                # 메트로로지 테스트
│   │   │   ├── Reengineering/            # 리엔지니어링 메트릭
│   │   │   ├── Verification/             # 검증 메트릭
│   │   │   ├── AgreementMatrixBuilder.ts # 합의 행렬 빌더
│   │   │   ├── AmplificationTracker.ts   # 증폭 추적기
│   │   │   ├── BenchmarkSnapshotter.ts   # 벤치마크 스냅샷
│   │   │   ├── BlindSpotMapper.ts        # 블라인드 스팟 매퍼
│   │   │   ├── CostProfiler.ts           # 비용 프로파일러
│   │   │   ├── PropertyRegistry.ts       # 속성 레지스트리
│   │   │   └── index.ts                  # 메트로로지 진입점
│   │   ├── validation/                   # 🟢 검증 엔진 (v0.3.34+)
│   │   │   ├── ArchitectureAuditor.ts    # 아키텍처 감사
│   │   │   ├── ValidationContext.ts      # 검증 컨텍스트
│   │   │   ├── ValidationEngine.ts       # 검증 엔진
│   │   │   └── ValidationReportBuilder.ts # 검증 리포트 빌더
│   │   ├── resolvers/                    # 🟢 언어별 리졸버 (v0.3.34+)
│   │   │   ├── LanguageResolver.ts       # 언어 리졸버 인터페이스
│   │   │   └── TypeScriptResolver.ts     # TypeScript 리졸버
│   │   ├── canvas-engine/                # 캔버스 구동 도메인
│   │   │   ├── CanvasEngine.ts           # 캔버스 엔진
│   │   │   ├── Intent.ts                 # 인텐트
│   │   │   ├── PhaseGate.ts              # 페이즈 게이트
│   │   │   ├── RenderProtocol.ts         # 렌더 프로토콜
│   │   │   ├── RuleEngine.ts             # 규칙 엔진
│   │   │   ├── ScenarioRunner.ts         # 시나리오 실행기
│   │   │   ├── SpatialRuleBook.ts        # 공간 규칙
│   │   │   ├── StateManager.ts           # 상태 관리
│   │   │   ├── ValidationHarness.ts      # 검증 하네스
│   │   │   └── VisualRuleBook.ts         # 시각 규칙
│   │   ├── transaction/                  # 트랜잭션 무결성
│   │   │   ├── CommitManager.ts          # 커밋 관리
│   │   │   ├── ExecutionLayer.ts         # 실행 레이어
│   │   │   └── VerificationLayer.ts      # 검증 레이어
│   │   ├── projection/                   # 설계 규칙 투영
│   │   │   ├── ProjectionLayer.ts        # 투영 레이어
│   │   │   └── RuleStore.ts              # 규칙 저장소
│   │   ├── collaboration/                # 🔵 협업 시스템 (v0.3.30+)
│   │   │   ├── IdentityManager.ts        # ID/Role/Permission 관리
│   │   │   ├── SessionManager.ts         # 세션 생명주기
│   │   │   ├── RuntimeInitializer.ts     # 4단계 런타임 초기화
│   │   │   ├── CompareEngine.ts          # Harvest 비교 엔진
│   │   │   ├── HarvestSessionManager.ts  # Harvest 세션/락 관리
│   │   │   ├── RemoteLayerProjector.ts   # 무상태 프로젝터
│   │   │   ├── ArchitectureIndexBuilder.ts # 아키텍처 인덱스 빌더
│   │   │   ├── ReferenceVerifier.ts      # 참조 검증 (100+ 외부 라이브러리)
│   │   │   ├── HarvestEngine.ts          # Master Layer Materialization
│   │   │   ├── BoundaryGuard.ts          # 중앙 경계 보안
│   │   │   ├── MountManager.ts           # SSH 마운트 관리
│   │   │   ├── AccountManager.ts         # 계정 CRUD
│   │   │   ├── CollaborationTransport.ts # 전송 계층 인터페이스
│   │   │   └── RestCollaborationTransport.ts # REST 전송 구현
│   │   ├── reporting/                    # 🟢 리포트 파이프라인 (v0.3.34.38+)
│   │   │   ├── ArchitectReportBuilder.ts      # 아키텍트 리포트 빌더
│   │   │   ├── BoundaryAnalysisReportBuilder.ts # 🟢 바운더리 분석 리포트 (v0.3.34.39)
│   │   │   ├── ExecutiveReportBuilder.ts      # 경영진 리포트 빌더
│   │   │   ├── FrontierPartitioner.ts         # 프론티어 파티셔너
│   │   │   ├── InsightEngine.ts               # 🟢 인사이트 엔진 (v0.3.34.38 수정)
│   │   │   ├── OnboardingAnalyzer.ts          # 온보딩 분석기
│   │   │   ├── OnboardingReportBuilder.ts     # 온보딩 리포트 빌더
│   │   │   ├── ParetoFrontier.ts              # 파레토 프론티어 계산
│   │   │   ├── ReportBundleGenerator.ts       # 리포트 번들 생성
│   │   │   ├── RiskClassifier.ts              # 🟢 리스크 분류기 (v0.3.34.38 수정)
│   │   │   ├── RiskVectorBuilder.ts           # 리스크 벡터 빌더
│   │   │   ├── RootCauseAggregator.ts         # 🟢 루트cause 집계기 (v0.3.34.38 수정)
│   │   │   └── types.ts                       # 리포트 타입 정의
│   │   ├── simulation/                   # 🟢 What-if 시뮬레이터 (v0.3.34.30)
│   │   │   ├── ExecutiveReportDiffBuilder.ts  # 경영진 리포트 Diff
│   │   │   ├── SimulationSession.ts         # 시뮬레이션 세션
│   │   │   ├── SimulationTargetSelector.ts  # 시뮬레이션 타겟 선택
│   │   │   ├── TopologyMutator.ts           # 토폴로지 변이
│   │   │   └── TopologyOverlay.ts           # 토폴로지 오버레이
│   │   ├── benchmark/                    # 🟢 벤치마크 하네스
│   │   │   └── BenchmarkHarness.ts
│   │   ├── (Active) StateAuditPipeline.ts     # 오디트 파이프라인
│   │   ├── (Active) AnomalyCollector.ts       # 이상 징후 수집
│   │   ├── (Active) TransitionGrammar.ts      # 전이 문법
│   │   ├── (Active) FailurePropagator.ts      # 고장 전파 계산
│   │   ├── (Active) ProjectMetadata.ts        # 프로젝트 메타데이터
│   │   ├── (Active) SymbolIndex.ts            # Cross-file 레지스트리
│   │   ├── (Active) DataPipeline.ts           # 파일 스캔 → 그래프 추출
│   │   ├── (Active) RendererCore.ts           # 렌더러 생명주기
│   │   ├── (Active) RuleEngine.ts             # 핵심 규칙 검증
│   │   ├── (Active) GraphModel.ts             # 그래프 데이터 모델
│   │   ├── (Active) LayoutEngine.ts           # 🟡 레이아웃 엔진 (v0.3.33)
│   │   ├── (Active) BlacklistOrchestrator.ts  # 블랙리스트 필터
│   │   ├── (Active) FileScanner.ts            # 단일 파일 분석
│   │   ├── (Active) FlowScanner.ts            # 데이터 흐름 분석
│   │   ├── (Active) FlowchartGenerator.ts     # 플로우차트 생성
│   │   ├── (Active) LogicAnalyzer.ts          # 🟡 스키마 무결성 검증
│   │   ├── (Active) GeminiParser.ts           # 대화 데이터 파싱
│   │   ├── (Active) graphBuilder.ts           # 그래프 구조화
│   │   ├── (Active) DatabaseEngine.ts         # KV 스토리지
│   │   ├── (Active) PromptLogger.ts           # 세션 로그
│   │   ├── (Active) DebuggerSystem.ts         # 디버깅 트리거
│   │   ├── (Active) ControlSystem.ts          # 시스템 제어
│   │   ├── (Active) AiOrchestrator.ts         # AI 오케스트레이션
│   │   ├── (Active) PhaseManager.ts           # 페이즈 관리
│   │   ├── (Active) SnapshotSystem.ts         # 스냅샷 저장/복원
│   │   ├── (Active) GridSystem.ts             # 그리드 시스템
│   │   ├── (Active) VirtualDebugger.ts        # 🟡 가상 디버거
│   │   ├── (Active) EdgeCodeRefactorer.ts     # 엣지 코드 리팩터링
│   │   ├── (Active) PbSessionWatcher.ts       # Protobuf 세션 감시
│   │   ├── (Active) filterSnapshot.ts         # 스냅샷 필터링
│   │   ├── (Active) JVMAuditor.ts             # Java/Kotlin 분석
│   │   ├── (Active) ReportExporter.ts         # 🟡 리포트 내보내기
│   │   ├── (Active) VscdbAdapter.ts           # VS Code DB 어댑터
│   │   ├── (Active) SynapseIgnore.ts          # .synapseignore 파서
│   │   ├── (Active) ClusterBuilder.ts         # 클러스터 생성
│   │   ├── (Active) ClusterHierarchy.ts       # 클러스터 계층
│   │   ├── (Active) NodeBuilder.ts            # 노드 생성
│   │   ├── (Active) EdgeBuilder.ts            # 엣지 생성
│   │   ├── (Active) GraphAnalyzer.ts          # 그래프 분석
│   │   ├── (Active) CommunityDetector.ts      # 커뮤니티 감지
│   │   ├── (Active) DirectoryTreeBuilder.ts   # 디렉토리 트리
│   │   ├── (Active) ReferenceResolver.ts      # 참조 해결
│   │   ├── (Active) VisibleGraphResolver.ts   # 가시 그래프 해결
│   │   ├── (Active) GhostExpander.ts          # 고스트 확장
│   │   ├── (Active) GhostClassifier.ts        # 고스트 분류
│   │   ├── (Active) GhostPolicy.ts            # 고스트 정책
│   │   ├── (Active) ExternalReferenceSemantics.ts # 외부 참조 시맨틱
│   │   ├── (Active) ScannerRegistry.ts        # 스캐너 레지스트리
│   │   ├── (Active) CppScanner.ts             # C++ 스캐너
│   │   ├── (Active) JavaScanner.ts            # Java 스캐너
│   │   ├── (Active) KotlinScanner.ts          # Kotlin 스캐너
│   │   ├── (Active) PythonScanner.ts          # Python 스캐너
│   │   ├── (Active) RustScanner.ts            # Rust 스캐너
│   │   ├── (Active) JsTsScanner.ts            # JS/TS 스캐너
│   │   ├── (Active) MarkdownScanner.ts        # Markdown 스캐너
│   │   ├── (Active) ShellScanner.ts           # Shell 스캐너
│   │   ├── (Active) SqlScanner.ts             # SQL 스캐너
│   │   ├── (Active) ConfigScanner.ts          # Config 스캐너
│   │   ├── (Active) DiagnosticReporter.ts     # 진단 리포터
│   │   ├── (Active) BoundsDiagnosticReporter.ts # 바운즈 진단
│   │   ├── (Active) LayoutDiagnosticReporter.ts # 레이아웃 진단
│   │   ├── (Legacy) BillingManager.ts         # 과금 뼈대 (Lock)
│   │   ├── (Orphaned) WebviewInterceptor.ts   # 웹뷰 입출력 요격 (미사용)
│   │   ├── (Orphaned) CommandInterceptor.ts   # 명령어 요격 (미사용)
│   │   ├── (Orphaned) CDPManager.ts           # Chrome DevTools (미사용)
│   │   ├── (Orphaned) DirectChatScraper.ts    # 채팅 스크래퍼 (미사용)
│   │   └── (Orphaned) ArchitectureDSL.ts      # YAML DSL (미사용)
│   ├── cli/                              # 🟢 CLI 도구 모음 (v0.3.34+)
│   │   ├── ast_verification_engine.ts    # AST 검증 엔진
│   │   ├── audit_evidence.ts             # 감사 증거
│   │   ├── audit_gate_*.ts               # 감사 게이트 (G, I, J, K, L, M, N, O)
│   │   ├── audit_phase_*.ts              # Phase 12 감사 시리즈
│   │   ├── audit_pipeline.ts             # 감사 파이프라인
│   │   ├── b5_validation_layer.ts        # 🟢 B5 검증 레이어 (v0.3.34.39)
│   │   ├── BatchRunner.ts                # 배치 실행기
│   │   ├── community_edge_audit.ts       # 커뮤니티 엣지 감사
│   │   ├── core_metrics_lab.ts           # 핵심 메트릭 실험실
│   │   ├── generate_drift_report.ts      # 드리프트 리포트 생성
│   │   ├── generate_surgery_report.ts    # 🟢 수술 리포트 생성 (v0.3.34.39)
│   │   ├── ProjectAnalyzer.ts            # 프로젝트 분석기
│   │   ├── ReportVerifier.ts             # 리포트 검증기
│   │   ├── run_b5_bundle.ts              # B5 번들 실행
│   │   ├── run_census.ts                 # 센서스 실행
│   │   ├── run_placement_analysis.ts     # 배치 분석 실행
│   │   ├── run_signal_census.ts          # 시그널 센서스
│   │   ├── run_stability_report.ts       # 안정성 리포트
│   │   ├── run_synapse_actual_census.ts  # SYNAPSE 실제 센서스
│   │   ├── signal_laboratory.ts          # 시그널 실험실
│   │   ├── stage_a5_validator.ts         # A5 단계 검증기
│   │   ├── SummaryGenerator.ts           # 요약 생성기
│   │   └── verify_determinism.ts         # 결정론 검증
│   ├── vs/                               # 🟢 VS Code 호환 레이어 (v0.3.34+)
│   │   ├── editor/                       # 에디터 호환
│   │   ├── platform/                     # 플랫폼 호환
│   │   ├── server/                       # 서버 호환
│   │   ├── sessions/                     # 세션 호환
│   │   └── workbench/                    # 워크벤치 호환
│   ├── test/                             # 🔵 테스트 스위트 (v0.3.30+)
│   │   ├── __mocks__/
│   │   │   └── vscode.ts                 # VS Code API Mock
│   │   ├── phase1_validation.test.ts     # Phase 1 검증 (10 tests)
│   │   ├── phase2_validation.test.ts     # Phase 2 검증 (14 tests)
│   │   ├── security_integration.test.ts  # 보안 통합 테스트
│   │   └── security_regression.test.ts   # 보안 회귀 테스트
│   ├── analysis/
│   │   └── hintEngine.ts                 # 실시간 아키텍처 힌트
│   ├── bootstrap/
│   │   └── BootstrapEngine.ts            # 초기 로드 및 그래프 구성
│   ├── rust_checker/                     # Rust 프로젝트 분석
│   │   ├── mod.rs
│   │   ├── reporter.rs
│   │   └── state_checker.rs
│   ├── explorer/
│   │   └── ArchitectureExplorer.ts       # 아키텍처 탐색기
│   ├── server/
│   │   ├── server.ts                     # LSP 서버 메인
│   │   ├── standalone.ts                 # 독립 실행 모드
│   │   ├── vscode.ts                     # VS Code API mock
│   │   └── register-vscode-mock.ts       # vscode 모듈 전역 등록
│   ├── utils/
│   │   ├── ChatExtractor.ts              # 채팅 데이터 추출
│   │   ├── Logger.ts                     # 시스템 로깅
│   │   ├── SensitiveInfoMasker.ts        # 민감 정보 마스킹
│   │   ├── exclusionRules.ts             # 제외 규칙
│   │   └── visualHints.ts                # 시각 힌트
│   └── webview/
│       └── CanvasPanel.ts                # 🟡 웹뷰 캔버스 패널
├── mile_stone/                           # 마일스톤 문서
│   ├── v0.2.xx.md ~ v0.3.34.39.md        # 버전별 마일스톤
│   └── *_log.md                          # 작업 로그
├── release_note/                         # 릴리즈 노트
│   └── v*_release_notes.md
└── tools/                                # 보조 스크립트
    ├── compare.js
    ├── config-generator.js
    └── log-analyzer.js
```

### 🧪 TESTED Section (Generated Artifacts & Garbage)
런타임 또는 테스트 실행 중 생성되는 가비지/출력 디렉토리 목록입니다. (이 항목들은 Source of Truth 구성 요소가 아닙니다.)
```text
.
└── synapse_report/            ← [테스트/출력] 시냅스 리포트
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
| `ui/index.html` | 변경됨 | 캔버스 웹뷰 마크업 및 UI 요소. v0.3.33.1_fix에서 `LINES (No Badges)` 엣지 가시성 버튼 부활 |
| `ui/synapse-theme.js` | 유지 | 웹뷰 전용 UI 테마 컬러 및 스타일링 데이터 |
| `ui/i18n.js` | 🟢 Active | 정적 마크업 메뉴, 버튼, 패널 제목 다국어 지원 로직 (`data-i18n`) |
| `ui/canvas-engine.js` | 🟡 Active (v0.3.33.1_fix2) | O(N) 순회 병목 제거, 공간 인덱스(RBush) 최적화, Layout Graph = Visible Graph 동기화 오류 완전 제거 및 거대 맵 분리 배치 로직 확정 |
| `ui/cluster-hierarchy.js` | 🟢 Active (v0.3.33+) | 클러스터 계층 및 바운딩 연산 분리 로직 (통합 드래그/가시성 토글) |
| `ui/rbush.js` | 🟢 Active (v0.3.33+) | 2D 뷰포트 컬링용 공간 인덱싱 라이브러리 |
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
| `src/core/reporting/` | 🟢 Active | OnboardingReportBuilder, ExecutiveReportBuilder — 경영/신규 진입자를 위한 의존성 없는 순수 리포트 뷰 |
| `src/core/simulation/` | 🟢 Active | TopologyOverlay, SimulationSession, DiffBuilder — 기존 구조 파괴 없이 가상 Action과 Undo를 테스트하는 What-if 시뮬레이터 |
| `src/core/StateAuditPipeline.ts` | 🟢 Active | Anomaly, FSMAudit, Propagation을 연결하는 뷰/시뮬레이션 전단 오케스트레이터 |
| `src/core/FailurePropagator.ts` | 🟢 Active | 노드 고장에 따른 정적 파급 효과(Blast Radius) 연산기 (TopologyOverlay 참조 없음, IGraphView 추상화) |
| `src/core/ProjectMetadata.ts` | Active | Server-owned project boundary manager (싱글톤, UUID, 경로 검증, SymbolIndex 통합) |
| `src/core/SymbolIndex.ts` | Active | Cross-file registry (FolderTree + FileRegistry + FunctionCatalog, .synapseignore 필터링 + setIgnore() 연동) |
| `src/core/DataPipeline.ts` | Active | 물리 파일 시스템 스캔 → 노드/엣지/클러스터 추출, 📁 Root 클러스터를 통한 무소속 노드 물리 배정 및 초기 원형 분산 배치 |
| `src/core/RendererCore.ts` | Active | 렌더러 생명주기 관리 및 WebGL/Canvas 2D 전환 브릿지 |
| `src/core/RuleEngine.ts` | 🟡 Modified | 핵심 규칙 검증 엔진 (Phase/Rule/Mutation pipeline) + 블랙리스트 폴더(synapse_report 등) 자동 무시 처리 |
| `src/core/GraphModel.ts` | Active | 그래프 데이터 모델 (노드/엣지 CRUD, 직렬화) |
| `src/core/BlacklistOrchestrator.ts` | Active | 노이즈 폴더(`dist`, `node_modules` 등) O(1) 하이브리드 블랙리스트 필터 |
| `src/core/FileScanner.ts` | Active | 단일 파일 단위 소스 분석 및 의존성 추출 (크로스-워크스페이스 [SYNAPSE_NETWORK_LINK] 정규식 파싱 포함) |
| `src/core/FlowScanner.ts` | Active | 파일 간 데이터 흐름(Flow) 분석 엔진 |
| `src/core/FlowchartGenerator.ts` | Active | 분석 결과 → 계층형 레이아웃 플로우차트 생성 (DFS Rank 할당, Logic Inversion) |
| `src/core/LogicAnalyzer.ts` | 🟡 Modified | 스키마 무결성 검증 및 아키텍처 논리 분석 (LOGIC_REPORT.md 생성 폴더를 synapse_report로 격리) |
| `src/core/GeminiParser.ts` | Active | Gemini/Copilot 대화 데이터 파싱 전담 |
| `src/core/graphBuilder.ts` | Active | 스캔된 소스 → 그래프 구조화 빌더 |
| `src/core/DatabaseEngine.ts` | Active | VS Code globalState 기반 KV 스토리지 (billing_meta, managed_nodes) |
| `src/core/PromptLogger.ts` | Active | 세션/대화 로그 기록 엔진 (audit + session.md) |
| `src/core/DebuggerSystem.ts` | Active | 디버깅 트리거 아키텍처 및 진단 로그 |
| `src/core/ControlSystem.ts` | Active | 시스템 제어 명령어 및 피드백 루프 |
| `src/core/AiOrchestrator.ts` | Active | AI 에이전트 오케스트레이션 (PhaseGate/Mutation) |
| `src/core/PythonScanner.ts` | Active | 파이썬 소스 분석 스캐너 |
| `src/core/RustScanner.ts` | Active | Rust 소스 분석 스캐너 |
| `src/core/JsTsScanner.ts` | 🟢 Active | JavaScript/TypeScript 소스 분석 스캐너 |
| `src/core/MarkdownScanner.ts` | Active | 마크다운 문서 스캐너 |
| `src/core/PhaseManager.ts` | Active | Phase 상태 관리 및 전이 |
| `src/core/SnapshotSystem.ts` | Active | 프로젝트 상태 스냅샷 저장/복원 (v0.3.30: 버전/체크섬/메타데이터 업그레이드) |
| `src/core/GridSystem.ts` | Active | 캔버스 그리드 시스템 및 스냅 정렬 |
| `src/core/VirtualDebugger.ts` | 🟡 Modified | 가상 디버거 (런타임 상태 모니터링) + temp_target_state.json을 synapse_report로 격리 생성 |
| `src/core/EdgeCodeRefactorer.ts` | Active | 엣지 코드 리팩터링 검증 도구 |
| `src/core/PbSessionWatcher.ts` | Active | Protobuf 세션 파일 감시 및 추출 트리거 |
| `src/core/filterSnapshot.ts` | Active | 스냅샷 레이어/타입 기반 필터링 |
| `src/core/JVMAuditor.ts` | Active | Java 및 Kotlin 소스의 심층 구조적 무결성 분석 및 클래스 기반 로직 오디팅 |
| `src/core/ReportExporter.ts` | 🟡 Modified | 리포트 내보내기 (경로를 synapse_report로 격리) |
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
| `src/core/GhostClassifier.ts` | 🟢 Active | 고스트 노드 유형별 분류 로직 |
| `src/core/ExternalReferenceSemantics.ts` | 🟢 Active | 외부 참조 시맨틱 파악 모듈 |
| `src/core/ClusterBuilder.ts` | 🟡 Modified | 클러스터 생성기 + [CREATE_CLUSTER] 유령 클러스터 생성 추적용 정밀 프로브 주입 |
| `src/core/NodeBuilder.ts` | 🟡 Modified | 노드 생성기 + [REPORT_FILES] 특정 폴더 내부 노드 증발 여부 감시용 정밀 프로브 주입 |
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
| `src/webview/CanvasPanel.ts` | 🟡 Modified | 웹뷰 캔버스 패널 (LOGIC_REPORT.md 자동 열기 경로를 synapse_report 폴더로 수정 등 버그 픽스) |
| `src/test/__mocks__/vscode.ts` | Active | VS Code API Mock (테스트 환경) |
| `src/test/phase1_validation.test.ts` | Active | Phase 1 검증 (ProjectBoundary + SymbolIndex) — 10 tests |
| `src/test/phase2_validation.test.ts` | Active | Phase 2 검증 (Identity + Session + Runtime) — 14 tests |
| `src/test/security_integration.test.ts` | Active | 보안 검증 (Path Traversal, 권한 우회, SSE 오염 등) |
| `src/test/security_regression.test.ts` | Active | 보안 및 역호환성 회귀 검증 (계정 포맷 및 포트 충돌 방어) |
| `src/test/phase3_validation.test.ts` ~ `transport_validation.test.ts` | **Deleted** | 기존 Submission 기반 비동기식 테스트 영구 삭제 (v0.3.30 Harvest 통합) |
| `src/utils/SensitiveInfoMasker.ts` | Active | 로그 내 민감 정보(Secret, Token, Password 등) 자동 마스킹 유틸리티 |
| `tools/*` | 유지 | 성능 벤치마킹, 규격 파일 생성, 진단 로그 분석용 보조 스크립트 |

> **삭제된 파일**: `test_scan.ts`, `src/core/GhostNodeManager.ts`, `src/core/ContextVault.ts`, `src/core/collaboration/SubmissionManager.ts`, `src/test/phase3_validation.test.ts ~ transport_validation.test.ts` — 과거 일회성 테스트 스크립트 및 이전 리팩토링 과정에서 제거되어 현재 디스크에 존재하지 않습니다. (v0.3.33 리팩토링 기준)

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

## 🛑 렌더링 파이프라인 절대 불변 규칙 (v0.3.34.40 무한 리빌드 사태의 교훈)

과거 v0.3.34.40에서 발생했던 "마우스 이동 시 1919ms 멈춤 및 화면 증발 현상"의 근본 원인은 렌더 루프(`_performRender`) 내부의 방어 코드 설계 결함이었습니다. 이를 교훈 삼아 다음의 렌더링 로직은 **어떠한 상황에서도 절대 수정하거나 건드리지 않아야 합니다.**

### 1. `nodeMap` 사이즈 검사 로직 절대 변경 금지
- **과거의 재앙**: `this.nodes && this.nodeMap.size !== nodeCount` (노드 배열 내 중복 ID가 존재할 경우, 해시맵 특성상 사이즈가 영구적으로 어긋나 매 프레임 10만 개 캐시를 리빌드하는 무한 루프 지옥 발생)
- **현재의 철칙**: 캐시 맵의 최초 생성 여부를 판단할 때는 반드시 `this.nodeMap.size === 0`으로만 검사해야 합니다. 
- **금지 사항**: 어떠한 경우에도 `nodeMap.size`를 원본 배열의 `length`(혹은 `nodeCount`)와 직접 비교하여 리빌드를 유발하는 Fallback 방어 코드를 재도입해서는 안 됩니다.

### 2. `beginFrame()` 버퍼 클리어 위치 절대 고정
- **과거의 재앙**: GPU 프레임 버퍼를 초기화하는 `webglRenderer.beginFrame()`이 절전 모드의 조기 종료(Early Return) 조건보다 상단에 위치하여, 실제 갱신할 데이터가 없거나 렌더링이 취소된 잉여 프레임에서도 기존 화면을 하얗게 지워버리는(Disappearing) 시각적 파탄을 유발했습니다.
- **현재의 철칙**: `webglRenderer.beginFrame()`은 반드시 `if (!this.isDirty && !this.isAnimating && !this._isInteracting && !this.isDragging) return;` 형태의 조기 종료 방어선 **아래**에 위치해야 합니다.
- **금지 사항**: 화면 잔상이나 렌더링 갱신 버그가 의심된다고 해서 `beginFrame()` 호출 위치를 함수 최상단이나 조기 종료 검사 이전으로 끌어올리는 행위를 엄격히 금지합니다.

### 3. Dirty Flag 단일 진실 원칙 (Single Source of Truth)
- **철칙**: 그래프 재빌드는 반드시 `this.isGraphDataDirty` 플래그에 의해서만 수행되어야 합니다.
- **금지 사항**: `nodeMap.size !== nodeCount`, `visibleNodeCount !== ...` 등 렌더러가 스스로 상태를 추론하여 암묵적으로 `rebuildGraphData()`를 유발하는 조건식을 추가하지 마십시오. Dirty 상태는 이벤트가 선언하며, 렌더러가 추측하지 않습니다.

### 4. Render Loop 내부에서 Graph Rebuild 금지
- **철칙**: `_performRender()`는 오직 렌더링만 수행해야 합니다.
- **금지 사항**: `_performRender()` 내부에서 `rebuildGraphData()`나 `rebuildVisibleCache()`를 직접 호출하여 대규모 캐시 재생성을 유발하는 것을 엄격히 금지합니다. 10만 노드 60FPS(16ms) 예산을 지키기 위해 렌더 단계와 데이터 갱신 단계는 완벽히 분리되어야 합니다.

### 5. MouseMove 에서 O(N) 순회 금지
- **철칙**: `mousemove`, `pointermove`, `hover`, `tooltip`, `pick` 이벤트 처리 중에는 절대 O(N) 이상의 연산을 수행해서는 안 됩니다.
- **허용 사항**: 위치 검색은 반드시 `RBush` (Spatial Index), `Visible Cache`, `NodeMap Lookup` (O(1))만을 사용하십시오.
- **금지 사항**: `this.nodes.filter(...)`, `for (const node of this.nodes)` 등 전체 O(N) 순회를 마우스 이동 틱마다 수행하는 코드는 절대 작성 금지입니다 (수십~수백 ms 지연 유발).

### 6. Hover 는 Render 요청만 가능
- **철칙**: Hover 관련 이벤트는 오직 UI 상태 변경이므로 `requestRender()`만 호출할 수 있습니다.
- **금지 사항**: Hover 처리 중 `rebuildGraphData()`, `rebuildNodeMap()`, `rebuildEdgeCache()` 등 그래프 구조 갱신 로직을 트리거하지 마십시오.

### 7. Performance Budget (Linux Kernel 10만 노드 기준)
- **목표 지표**:
  - Render Frame: < 5ms
  - MouseMove: < 5ms
  - Pick: < 10ms
  - Hover Update: < 1ms
  - Graph Rebuild: Explicit Only (명시적 호출 시에만)
- **경고 기준**: 10ms 이상 (WARN) -> 30ms 이상 (ERROR) -> 100ms 이상 (CRITICAL)

### 8. Golden Benchmark (회귀 검증 기준)
**Linux Kernel 7.2-rc3**
- Nodes: 103313
- Edges: 138133
- Clusters: 2921

**Expected Behavior:**
- Bootstrap succeeds
- Fit View succeeds
- Pan works
- Zoom works
- Nodes remain visible
- Edges remain visible
- No disappearing artifacts
- No infinite rebuild loop
- No renderer freeze

*Any rendering change must pass this benchmark.*

### 9. Duplicate ID Policy
The renderer must **never** assume:
`nodeMap.size === nodes.length`

**Reason:**
- Map structures collapse duplicate IDs.
- Duplicate IDs are considered input-data problems, not renderer problems.
- The renderer must remain stable even if duplicate IDs exist.

## 🚨 RENDERING RED ZONE 🚨
The following systems are considered STABLE.
**DO NOT MODIFY** without reproducing the original bug first.

- `nodeMap.size === 0` bootstrap logic
- `beginFrame()` placement
- Dirty Flag ownership
- Render loop early return guard
- MouseMove hit-test pipeline
- Hover -> `requestRender` flow

**Any modification requires:**
1. Bug reproduction
2. Performance benchmark
3. Linux Kernel validation (100k+ Nodes, 130k+ Edges)
4. Regression verification
