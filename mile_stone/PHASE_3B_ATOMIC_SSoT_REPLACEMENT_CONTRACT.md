# [SYNAPSE Phase 3-B] 원자적 SSoT 교체 계약서 (Atomic SSoT Replacement Contract)

## 0. 거버넌스 및 상태
- **상태:** `PROPOSED DRAFT — PENDING MASTER APPROVAL`
- **선행 조건:** Phase 2 CLOSED, Phase 3-A CLOSED
- **코드 동결:** `Code Freeze: ACTIVE`, `Execution Freeze: ACTIVE`, `Implementation Authorization: NOT GRANTED`
- **목적:** 수집기(`BootstrapEngine`)의 재수집(Re-Bootstrap) 시 기존 `project_state.json`을 손상시키지 않고, 안전하게 새로운 SSoT로 원자적 교체(Atomic Swap)하는 엄격한 계약 확정.

---

## 1. 핵심 아키텍처 불변식 (Constitution)

1. **단일 소유권 (Single Ownership):** `project_state.json`에 대한 디스크 생성 및 기록 권한은 오직 `BootstrapEngine` 단 1개 모듈에만 존재하며, `CanvasPanel` 등 다른 모든 계층의 직접 쓰기는 영구히 0건이다.
2. **무조건적 원본 보존 (Zero In-place Mutation):** 기존 SSoT 파일은 신규 수집, 직렬화, 무결성 검증이 100% 완료될 때까지 디스크 상에서 절대 수정되거나 절단(Truncate)되지 않는다.
3. **실패 시 100% 무피해 롤백 (Zero-Impact on Failure):** 수집 중단, OOM, JSON 직렬화 오류, 디스크 풀(Full) 등 어떠한 예외가 발생하더라도 기존 SSoT는 1바이트도 손상되지 않고 유지된다.
4. **오버레이 영구 불변:** Re-Bootstrap은 오직 `project_state.json`만 원자적으로 교체하며, `user_graph.json`과 `layout.json`을 덮어쓰거나 삭제하지 않는다.

---

## 2. 5대 핵심 기술 계약

### 계약 1: 단일 소유권 및 진입 경로 제한
- `project_state.json`을 디스크에 쓰는 코드는 오직 `src/bootstrap/BootstrapEngine.ts`의 `serializeToFileAsync` 래퍼 단 1곳만 허용된다.
- `CanvasPanel.ts`는 UI 호스트로서 수집 명령 위임(`engine.liteBootstrap()`) 및 완료 후 메모리/웹뷰 동기화만 담당하며, 파일시스템 쓰기 API를 직접 호출하지 않는다.

### 계약 2: 동일 파일시스템 고유 임시 파일 작성
- **경로 규칙:** 반드시 대상 파일과 동일한 디렉터리(`synapse_data`) 내에 임시 파일을 생성하여, 다른 파티션/마운트 간 이동(EXDEV)에 따른 원자성 상실을 원천 방지한다.
- **파일명 규격:** `project_state.json.tmp.${Date.now()}.${process.pid}`
- **스트리밍 직렬화:** 대규모 그래프(Godot 9,800+ 노드, VS Code 14,000+ 노드) 직렬화 시 V8 최대 문자열 한계(512MB) 초과를 방지하기 위해 `ProjectStateSerializer.serializeToFileAsync`의 청킹 스트리밍을 임시 파일 디스크립터에 수행한다.

### 계약 3: 엄격한 사전 무결성 검증 (Pre-Replacement Validation)
원자적 교체(`renameSync`)를 수행하기 직전, 생성된 임시 파일에 대해 다음 3중 검증을 통과해야 한다:
1. **존재 및 크기 검증:** 임시 파일이 디스크에 실제 존재하며, `statSync(tempPath).size > 0` 바이트여야 함.
2. **종단 구문 검증 (Closing Bracket Check):** 스트리밍 직렬화가 도중에 크래시되지 않고 정상 종료되었는지 파일 끝의 닫는 중괄호(`}`)를 확인.
3. **파싱 유효성 검증:** 파일의 헤더 및 핵심 필드(`version: 1`, `nodes`, `edges`, `clusters`) 구조가 정상인지 최소 스키마 검증.
- 검증 중 단 1개라도 실패할 경우, 즉시 예외를 발생시키고 임시 파일을 안전하게 삭제(unlink)하며 기존 SSoT를 보존한다.

### 계약 4: 플랫폼별 원자적 교체 및 Windows 백오프 재시도
- **Linux / macOS:** POSIX 표준 `fs.renameSync(tempPath, targetPath)`를 호출하여 원자적 덮어쓰기(Atomic Inode Swap) 수행.
- **Windows 대응 백오프 재시도 (Phase 1 검증 패턴 재사용):**
  - Windows 환경에서 바이러스 백신, 검색 인덱서, 또는 파일 핸들 지연 해제로 인해 발생하는 `EBUSY`, `EPERM` 오류를 방지하기 위해 지수 백오프 재시도(50ms, 100ms, 200ms, 최대 5회)를 적용한다.
- **교체 실패 시 불변식:** `renameSync`가 최종 실패하면 임시 파일만 폐기하고 기존 `project_state.json`은 100% 무결하게 보존된다.

### 계약 5: 배타적 락(Exclusive Lock) 및 원자적 Commit 상태 전이
Re-Bootstrap 수행 중 웹뷰나 호스트의 비동기 편집이 경합(Race Condition)을 일으키지 않도록 배타적 생명주기를 확립한다:

```
[IDLE] 
  │
  ▼ Re-Bootstrap 요청 수신
[ACQUIRING_LOCK]
  │ 1. _isReBootstrapping = true 설정 (신규 오버레이 편집 진입 차단)
  │ 2. await this._overlayQueue (대기 중인 이전 오버레이 큐 완전 flush)
  ▼
[ISOLATED_BOOTSTRAP]
  │ 3. BootstrapEngine.liteBootstrap 실행 (임시 파일 작성 및 검증)
  ▼
  ├─ [실패 시] ──► 임시 파일 삭제, 메모리 보존, 락 해제, 사용자 에러 알림 ──► [IDLE 복귀]
  │
  ▼ [검증 성공 시]
[ATOMIC_COMMIT]
  │ 4. fs.renameSync (디스크 SSoT 원자적 교체)
  │ 5. canvasEngine.loadInitialState(fileState) (디스크 최신 SSoT로 메모리 교체)
  │ 6. sendProjectState(true) (웹뷰로 최신 렌더링 사본 푸시)
  │ 7. _isReBootstrapping = false 해제
  ▼
[IDLE 복귀]
```

---

## 3. 검증 가능한 수용 기준 (Acceptance Criteria)

1. **실패 주입 5종 내성 검증 (Failure Injection Tests):**
   - **시나리오 A (수집 도중 예외):** AST 파서 에러 주입 시 기존 `project_state.json`의 SHA-256 해시가 1바이트도 변하지 않아야 함.
   - **시나리오 B (직렬화 도중단):** 스트리밍 직렬화 도중 강제 중단 시 임시 파일만 남거나 정리되고 기존 SSoT 보존.
   - **시나리오 C (검증 실패):** 임시 파일 내용이 깨졌을 경우 교체 시도 차단 및 기존 SSoT 보존.
   - **시나리오 D (교체 권한 에러):** 대상 파일 쓰기 잠금 시 임시 파일 정리 및 기존 SSoT 보존.
   - **시나리오 E (웹뷰 푸시 실패):** IPC 통신 실패 시에도 디스크의 원자적 SSoT 교체는 무결하게 완료되어 있어야 함.
2. **동시성 락 검증:**
   - Re-Bootstrap 실행 도중 사용자 노드 수정(`patchNode`)이나 엣지 확정 이벤트가 인입될 경우, SSoT 교체가 끝날 때까지 대기(Queueing)되거나 안전하게 거부되어 이전 상태를 덮어쓰지 않아야 함.
3. **전체 저장소 단일 소유권 정적 감사:**
   - `src/` 전체에서 `project_state.json`에 대한 파일 쓰기 호출은 오직 `BootstrapEngine.ts` 내부의 단일 경로만 검출되어야 함 (`CanvasPanel.ts` = 0건).
4. **회귀 방지:**
   - Phase 1 LayoutStorage 테스트 100% 통과 (Criteria 1-7, 9).
   - Phase 2 UserGraphStorage 테스트 100% 통과 (19/19 Tests).
   - Phase A Member-Level Trace 2,230개 Assertion Zero-Diff 통과.

---

## 4. Phase 3 허용 변경 파일 범위 (엄격히 3개 한정)

1. `src/bootstrap/BootstrapEngine.ts` (임시 파일 작성, 3중 검증, 원자적 renameSync 교체)
2. `src/webview/CanvasPanel.ts` (`_isReBootstrapping` 배타적 락 및 Commit 상태 전이)
3. `scripts/verify_atomic_ssot_replacement.ts` (신규 검증 하네스: 5종 실패 주입 및 원자성 실측)

*※ `NodeBuilder.ts`, `DataPipeline.ts`, `schema.ts`, `LayoutStorage.ts`, `UserGraphStorage.ts`, `ui/canvas-engine.js`는 완전 동결(수정 금지)을 유지합니다.*
