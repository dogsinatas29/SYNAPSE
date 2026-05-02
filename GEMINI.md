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

