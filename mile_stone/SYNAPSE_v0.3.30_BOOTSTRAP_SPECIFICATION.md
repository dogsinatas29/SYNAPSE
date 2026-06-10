# SYNAPSE v0.3.30

# BOOTSTRAP SPECIFICATION

---

# Status Legend

각 Principle에 붙는 상태 표시:

| Badge | Meaning |
|-------|---------|
| `[STATUS: COMPLETE]` | 목표 아키텍처와 v0.3.30 구현이 일치 |
| `[STATUS: PARTIAL]` | 핵심 엔진은 구현됐으나 UI/API/연동 누락 |
| `[STATUS: PLANNED]` | 설계만 존재, v0.3.30 미구현 |

---

# Development Constitution

All contributors, agents, assistants, and automated systems must follow these rules.

Violation of these rules is considered a specification failure.

---

## LLM Coding Principles

### 1. Think Before Coding

Do not guess.

If requirements are ambiguous:

* Stop
* Ask questions
* Present approaches
* Present tradeoffs

Always propose the simplest viable solution first.

---

### 2. Simplicity First

Implement the minimum solution required.

Do not introduce:

* Unrequested features
* Unrequested abstractions
* Unrequested optimizations

Maintain:

* Readability
* Predictability
* Efficiency

---

### 3. Minimal Changes

Perform precise modifications only.

Do not rewrite validated systems.

Modify only the requested scope.

Preserve existing architecture and style.

---

### 4. Goal-Oriented Execution

Every task follows:

```text
Goal
    ↓
Plan
    ↓
Implementation
    ↓
Validation
```

Skipping stages is prohibited.

---

### 5. No Hallucinated APIs

Do not invent:

* APIs
* Functions
* Libraries
* Framework Features

Unknown information must be requested.

---

### 6. Stable Code Protection

Validated code is protected.

Do not modify validated code unless explicitly requested.

Prefer minimal diffs.

---

### 7. Context Confirmation

Before modifying code:

* Confirm context
* Confirm files
* Confirm dependencies

Missing information must be requested.

Assumption-driven implementation is prohibited.

---

### 8. Rendering Isolation

When switching between:

* Graph View
* File View
* Flow View

Rendering state must be fully reset.

Reset:

* Framebuffer
* Shader State
* Buffer Bindings

Cross-view visual contamination is prohibited.

---

### 9. Approval Gate

Before implementation:

```text
Read Specification
        ↓
Create Plan
        ↓
Request Approval
        ↓
Receive Approval
        ↓
Implementation
```

Implementation without approval is prohibited.

Creating new documents without approval is prohibited.

Modifying architecture without approval is prohibited.

---

# Bootstrap Harness

Every Phase must satisfy:

```text
Read
        ↓
Understand
        ↓
Plan
        ↓
Implement
        ↓
Test
        ↓
Validate
        ↓
Phase Complete
```

A phase cannot advance until validation succeeds.

---

# Validation Gate

Failure at any validation step immediately blocks progression.

```text
Validation Fail
        ↓
Fix
        ↓
Retest
        ↓
Validate
        ↓
Continue
```

Proceeding with unresolved failures is prohibited.

---

# Mission

SYNAPSE는 분산 개발 환경에서 생성된 작업 결과를 시각화하고 검토하며 최종적으로 프로젝트에 반영하기 위한 협업 시스템이다.

SYNAPSE는 실시간 공동 편집 시스템이 아니다.

SYNAPSE는 제출(Submission) 기반 협업 시스템이다.

---

# Core Collaboration Principle

[STATUS: COMPLETE]

```text
Connect
=
Submission
```

Connect는 협업 시작이 아니다.

Connect는 작업 완료 후 제출을 의미한다.

Client는 자신의 작업을 완료한 후 제출한다.

Architect는 제출본을 검토한다.

검토가 완료되면 Harvest를 수행한다.

```text
Client Work
        ↓
Submission
        ↓
Review
        ↓
Verify
        ↓
Harvest
```

---

# Core Authority Principle

[STATUS: COMPLETE]

작업 권한은 역할(Role) 기반으로 결정된다.

```text
Member
=
Work
Submit
```

```text
Lead
=
Review
Verify
Remote Edit
Harvest
```

---

# Submission Principle

[STATUS: COMPLETE]

Submission Snapshot은 영구 보존되는 제출 기록이다.

```text
Submission Snapshot
=
Permanent Record
```

Snapshot은 변경되지 않는다.

Snapshot은 제출 당시 상태를 보존한다.

---

# Review Workspace Principle

[STATUS: PARTIAL]

Review는 Snapshot 자체를 수정하는 과정이 아니다.

```text
Submission Snapshot
        ↓
Review Workspace
```

Review Workspace는 검토 대상이다.

Review Workspace는 Remote Edit 대상이다.

Snapshot은 항상 불변으로 유지된다.

### Current Implementation (v0.3.30)
- ✅ `SubmissionManager` ReviewState 관리 (pending/review/approved/rejected)
- ✅ Snapshot immutability 강제
- ❌ Review Workspace UI (별도 Review 패널 없음)
- ❌ Remote Edit UI

---

# Review Principle

[STATUS: PARTIAL]

제출 이후 작업은 Review 상태로 진입한다.

```text
Submission
        ↓
Review
```

Review 단계에서 Architect는 Review Workspace를 대상으로:

* 제출 구조 확인
* 연결 관계 확인
* 참조 무결성 확인
* Remote Edit 수행

을 수행할 수 있다.

---

# Remote Edit Principle

[STATUS: PARTIAL]

Architect는 제출 이후 제한적 수정 권한을 가진다.

Remote Edit는:

* 잘못된 import 수정
* 파일명 수정
* 경로 수정
* 연결 수정

등의 통합 작업을 위한 기능이다.

Remote Edit는 개발을 대신하지 않는다.

Remote Edit는 Review 완료를 위한 수단이다.

Remote Edit는 Review Workspace에 적용된다.

Harvest는 수정된 Review Workspace를 반영한다.

### Current Implementation (v0.3.30)
- ✅ `SubmissionManager.applyRemoteEdit()` — 백엔드 엔진 구현됨
- ✅ Member frozen during review (`SubmissionManager`)
- ❌ REST API route (`POST /api/collab/submission/review`)
- ❌ Remote Edit UI panel
- ❌ VSCode command

---

# Visualization Principle

[STATUS: COMPLETE]

모든 제출은 시각화된다.

시각화는 검토를 위한 수단이다.

표현 대상:

* Folder Cluster
* Source Node
* Reference Edge
* Ghost Node
* Traffic Information
* Layer Information

---

# Layer Principle

[STATUS: PARTIAL]

Target Architecture
-------------------

모든 제출은 독립 Layer로 표시된다.

```text
Master Layer

Client Layer A

Client Layer B

Client Layer C
```

Harvest 전까지 Client Layer는 Master Layer에 영향을 주지 않는다.

Current Implementation (v0.3.30)
--------------------------------
| Area | Status |
|------|--------|
| ✅ `ai` / `user` / `external` functional layers | Classified by `RemoteLayerProjector` |
| ✅ Layer visibility toggle UI | ai / user / External — 세 개 토글 버튼 |
| ✅ External layer support | `showExternalLayer`, ghost/external 노드 필터링 |
| ❌ Dynamic per-client layers | Master/Client A/B/C 미구현 |
| ❌ Client-specific visibility | 접속 중인 클라이언트별 Layer 표시 없음 |

### Classification Detail
- **Node layer** (`RemoteLayerProjector.classifyNodeLayer`): `hasAtomicSignature`/docs/manual → `user`; `external://`/`ghost://` → `external`; else → `ai`
- **Cluster layer** (`RemoteLayerProjector.classifyClusterLayer`): `cluster_ghosts` → `external`; `folder_*`/`sys_*` → `ai`; else → `user`
- Edges have no layer — always visible.

---

# Verification Principle

[STATUS: COMPLETE]

Verify는 제출 구조를 검증한다.

Verify는 코드 실행을 검증하지 않는다.

검증 대상:

* 구조 무결성
* 참조 무결성
* 그래프 무결성
* UUID 무결성

Verify는 Harvest 이전에 수행된다.

---

# Harvest Principle

[STATUS: PARTIAL]

Target Architecture
-------------------

```text
Visible Client Layers (ON된 Layer만)
        ↓
Harvest
        ↓
Master Workspace (.synapse/master/)
```

Harvest는 승인된 결과를 프로젝트에 반영하는 과정이다.

Harvest는 Merge Engine이 아니다.

Harvest는 Conflict Resolver가 아니다.

Harvest는 Collection Engine이다.

```text
Approved Review Workspace
        ↓
Harvest
        ↓
Master Layer
```

Harvest는 승인된 파일과 폴더를 그대로 수집한다.

Current Implementation (v0.3.30)
--------------------------------
| Component | Status | Detail |
|-----------|--------|--------|
| `HarvestEngine.ts` | ✅ Implemented | File copy to `.synapse/master/`, snapshot preservation |
| Phase 7 tests (10) | ✅ All pass | Workspace creation, folder structure, exclusion logic |
| Phase 9 E2E | ✅ Passes | Full pipeline: submission → harvest → verify files |
| UI button | ❌ Not exposed | No harvest button in `index.html` |
| REST API route | ❌ Not exposed | No `POST /api/collab/harvest` in `standalone.ts` |
| VSCode command | ❌ Not exposed | No harvest handler in `CanvasPanel.ts` |

Harvest is **implemented and tested** but accessible only through internal code paths.
Exposing it via UI/API is deferred to next iteration (see `Future Work` below).

---

# Snapshot Preservation Principle

[STATUS: COMPLETE]

Harvest 이후에도 Snapshot은 삭제되지 않는다.

```text
Submission Snapshot
=
Permanent Record
```

Snapshot은:

* Audit
* Review History
* Verification History
* Harvest History

의 기준점으로 유지된다.

---

# Security Principle

[STATUS: COMPLETE]

모든 작업은 프로젝트 경계 내부에서만 수행된다.

금지:

* Directory Traversal
* Cross Project Access
* Session Spoofing
* Submission Snapshot Tampering

Remote Edit 역시 동일한 보안 경계를 따른다.

---

# Known Limitations (v0.3.30)

## No Deduplication
Submissions are merged into a single graph. If multiple submissions contain identical file paths, duplicate graph nodes may appear. No canonicalization or deduplication layer currently exists.

## No Per-Client Layer Separation
The layer system uses three functional categories (ai/user/external), not per-client layers. All submissions from all clients coexist in the same projection. There is no "Client Layer A / Client Layer B" separation in the visualization.

## No Harvest UI or API
Harvest is tested and functional as a backend service but cannot be triggered from the UI, REST API, or VSCode commands.

## No Session Close API
Sessions can be created and joined via REST, but there is no `POST /api/collab/session/close` endpoint. Session termination is only available programmatically.

## No Remote Edit API
`SubmissionManager` supports `applyRemoteEdit()`, but the REST endpoint (`POST /api/collab/submission/review`) is not exposed. Remote edit is only available through direct code paths.

---

# Phase Architecture

[STATUS: COMPLETE — REST transport, not SSH]

Phase 1 — Foundation

Phase 2 — Identity & Session Foundation

Phase 3 — REST Collaboration Transport / Submission Boundary

Phase 4 — Remote Layer Visualization

Phase 5 — Architecture Index Generation

Phase 6 — Reference Verification Layer

Phase 7 — Harvest Engine

Phase 8 — Boundary Enforcement

Phase 9 — Acceptance Test

---

# Complete Workflow

[STATUS: PARTIAL — Harvest step has no UI/API trigger yet]

```text
Client Work Complete
        ↓
Submission Snapshot
        ↓
Remote Layer Projection
        ↓
Architecture Index
        ↓
Architect Review
        ↓
Remote Edit (Optional)
        ↓
Verification
        ↓
Harvest
        ↓
Master Layer Update
```

---

# Infrastructure (v0.3.30)

## REST API Endpoints
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/login` | User login |
| POST | `/api/collab/session` | Create session |
| POST | `/api/collab/session/join` | Join session |
| POST | `/api/collab/submission` | Create submission |
| GET | `/api/collab/submission/:id` | Get review state |
| POST | `/api/admin/create-account` | Admin: create account |
| POST | `/api/admin/delete-account` | Admin: delete account |
| POST | `/api/admin/change-password` | Admin: change password |
| GET | `/api/admin/accounts` | Admin: list accounts |
| POST | `/api/admin/assign-role` | Admin: assign role |
| POST | `/api/analyze` | File analysis |
| POST | `/api/scan` | Flow scanning |
| POST | `/api/save-state` | Save project state |
| GET | `/api/history` | Get snapshot history |
| POST | `/api/snapshot` | Create snapshot |
| POST | `/api/rollback` | Rollback to snapshot |
| GET | `/health` | Health check |

## Canvas Engine
- **Source of Truth**: `ui/canvas-engine.js`
- `demo/canvas-engine.js` is a synchronized build artifact — must not be edited directly
- Sync mechanism: `npm run build` (`build-guard.js`) copies `ui/` → `demo/`

---

# Future Work

| Area | Target | Priority |
|------|--------|----------|
| **Harvest UI/API** | Harvest 버튼 (서버 전용), `POST /api/collab/harvest` 라우트, Layer 기반 Harvest 선택 | **High** |
| **Per-Client Visualization Layers** | 접속 중인 클라이언트가 Layer Visibility 패널에 동적 항목으로 표시, ON/OFF 토글 | **High** |
| **Client → Server Submission Flow** | 클라이언트가 Session Join → Submission → Server Layer 표시 전체 파이프라인 | **High** |
| **Deduplication / Canonicalization** | 동일 경로 중복 노드 방지, Submission 간 파일 병합 전략 | Medium |
| **SSH Transport** | REST 대체 또는 보완하는 SSH 기반 인증 전송 | Medium |
| **Token / Auth Hardening** | JWT 또는 세션 토큰 사용 (현재는 매 요청 평문 비밀번호) | Medium |
| **WebSocket / Event Layer** | Session/Review/Harvest 상태 변경 시 Push 알림 | Low |
| **ACL / Permission Layer** | 프로젝트/세션 단위 세분화된 접근 제어 | Low |
| **Remote Edit API** | `POST /api/collab/submission/review` HTTP 라우트 | Low |
| **Session Close API** | `POST /api/collab/session/close` HTTP 라우트 | Low |

---

# Final Product Goal

SYNAPSE는 코드 편집기가 아니다.

SYNAPSE는 제출된 작업을 시각적으로 검토하고 검증하며 안전하게 프로젝트에 반영하기 위한 Collaborative Harvest System이다.

