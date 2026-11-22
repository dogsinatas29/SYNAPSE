# [SYNAPSE Phase 3-B] 원자적 SSoT 교체 계약서 (Revision 3: 최종안)
## Atomic SSoT Replacement Contract & Failure Recovery Protocol

## 0. 거버넌스 및 상태
- **문서 버전:** `Revision 3 (최종안)`
- **상태:** `PROPOSED DRAFT — PENDING MASTER APPROVAL`
- **선행 조건:** Phase 2 CLOSED, Phase 3-A CLOSED
- **코드 동결:** `Code Freeze: ACTIVE`, `Execution Freeze: ACTIVE`, `Implementation Authorization: NOT GRANTED`
- **목적:** 수집기(`BootstrapEngine`)의 재수집(Re-Bootstrap) 시 기존 `project_state.json`을 손상시키지 않고, 안전하게 새로운 SSoT로 원자적 교체(Atomic Swap)하는 엄격한 계약 확정.

---

## 1. 책임 소유권 분리 (Single Ownership)

| 책임 영역 | 담당 모듈 | 권한 및 역할 |
|:---|:---|:---|
| **SSoT 최종 통제 및 교체 권한** | `src/bootstrap/BootstrapEngine.ts` | **SSoT의 유일한 최종 승인자.** 임시 파일 경로 결정, 수집 조율, 3단계 스트리밍 완료 검사, 최종 원자적 `renameSync` 교체 통제. |
| **스트리밍 직렬화** | `src/core/transaction/ProjectStateSerializer.ts` | 기존 청킹 스트리밍 직렬화기(수정 없음). `BootstrapEngine`이 지정한 임시 파일 디스크립터에 안전하게 데이터 작성. |
| **메모리 및 웹뷰 동기화** | `src/webview/CanvasPanel.ts` | **SSoT 디스크 직접 쓰기 0건.** Re-Bootstrap 배타적 락(`_isReBootstrapping`) 관리, 디스크 최신 SSoT 메모리 로드, 웹뷰 푸시. |
| **사용자 편집 저장** | `src/core/layout/UserGraphStorage.ts` | `synapse_data/user_graph.json` 독립 저장소 관리. SSoT 디스크 쓰기 권한 없음. |

---

## 2. Commit Point 및 단계별 실패 복구 시맨틱 (Failure Semantics)

원자적 교체의 생명주기를 **COMMIT POINT (`renameSync`)**를 기준으로 엄격히 이원화한다:

```
[수집 시작] ──► [임시 파일 작성] ──► [스트리밍 완료 검사] ──► [RENAME (COMMIT POINT)] ──► [메모리 적재] ──► [웹뷰 푸시]
└──────────────── PRE-COMMIT FAILURE ────────────────┘            └─────────────── POST-COMMIT FAILURE ───────────────┘
          (기존 SSoT 100% 보존, 임시 파일 폐기)                         (디스크 SSoT 기준 메모리/웹뷰 재동기화)
```

| 실패 시점 | 실패 유형 | 시스템 동작 및 복구 불변식 |
|:---|:---|:---|
| **수집 파이프라인 오류** | `PRE_COMMIT_FAILURE` | 임시 파일 미생성. 기존 SSoT 100% 보존. 메모리 기준선 유지. 락 정상 해제. |
| **스트리밍 직렬화 오류** | `PRE_COMMIT_FAILURE` | 자신이 생성한 임시 파일 디스크립터 닫기 및 즉시 삭제(`unlinkSync`). 기존 SSoT 100% 보존. 락 정상 해제. |
| **스트리밍 완료 검사 실패** | `PRE_COMMIT_FAILURE` | 절단 파일 폐기. Rename 시도 원천 차단. 기존 SSoT 100% 보존. 락 정상 해제. |
| **`renameSync` 실행 실패** | `PRE_COMMIT_FAILURE` | 교체 미수행. 임시 파일 삭제. 기존 SSoT 100% 보존. 락 정상 해제. |
| **메모리 적재 실패** | `POST_COMMIT_FAILURE` | **신규 SSoT는 이미 디스크에 안전하게 Commit됨.** 디스크 SSoT 기준 최대 3회 재적재 시도. 최종 실패 시 락을 풀지 않고 `READ_ONLY_SAFE_MODE` 고정. |
| **웹뷰 Push (IPC) 실패** | `POST_COMMIT_FAILURE` | 디스크 SSoT는 이미 Commit됨. 웹뷰 재연결/재동기화 플래그 설정 및 사용자 알림. 락 해제. |

---

## 3. 5대 핵심 기술 계약

### 계약 1: 동일 파일시스템 배타적 임시 파일 작성
- **경로 규칙:** 파티션 간 이동(`EXDEV`)에 따른 원자성 훼손을 방지하기 위해 대상 파일과 동일한 디렉터리(`synapse_data`) 내에 생성.
- **고유 식별자:** `project_state.json.tmp.${Date.now()}.${process.pid}.${counter}`
- **배타적 생성:** 파일 생성 시 충돌 방지를 위해 `fs.openSync(tempPath, 'wx')` 플래그를 사용하며, 충돌 시 `counter`를 증가시켜 고유 식별자 재생성.
- **소유권 기반 정리:** 자신이 직접 생성한 임시 파일 경로만 추적하여 삭제하며, 타 프로세스나 이전 세션의 임시 파일을 임의로 삭제하지 않음.

### 계약 2: 스트리밍 완료 및 절단 방지 검사 (Streaming Completion & Truncation Check)
대용량 그래프(Godot 9,800+ 노드 등)에서 V8 메모리 초과를 유발하는 전체 파일 `JSON.parse`를 전면 금지하며, 본 검사는 "전체 JSON 구조 검증"이 아닌 **"스트리밍 정상 완료 및 파일 절단 여부 확인"**으로 엄격히 한정한다 (실제 구조적 무결성은 Serializer의 정상 실행 계약에 의존):
1. **Serializer 완료 검증:** `ProjectStateSerializer.serializeToFileAsync`가 내부 예외 없이 정상 종료되었는가.
2. **물리적 크기 검증:** `fs.statSync(tempPath).size > 0` (0 바이트 빈 파일 차단).
3. **Trailer 검사 (후행 공백 처리):** 전체 파일을 읽지 않고 파일의 마지막 64바이트만 버퍼로 읽은 뒤, 후행 공백(`\r`, `\n`, `\t`, ` `)을 트림하여 마지막 유효 토큰이 닫는 중괄호(`}`)인지 확인.
- 위 3단계 중 하나라도 불만족 시 `PRE_COMMIT_FAILURE`로 판정하고 즉시 교체를 중단한다.

### 계약 3: 원자적 교체 및 내구성(Durability) 동기화 시퀀스
플랫폼이 보장하지 못하는 동작을 성공으로 과장하지 않으며, 다음 5단계 절차를 엄격히 따른다:
```
[임시 파일 스트리밍 쓰기 완료]
         ↓
[임시 파일 fsyncSync(tempFd)] (임시 파일 데이터 디스크 플러시)
         ↓
[임시 파일 closeSync(tempFd)] (핸들 닫기)
         ↓
[fs.renameSync(tempPath, targetPath)]  <--- COMMIT POINT (상태: COMMITTED_DURABILITY_UNCONFIRMED)
         ↓
[부모 디렉터리 fsyncSync(dirFd)] (POSIX 환경 디렉터리 엔트리 플러시 시도)
         ↓
[상태 판정: COMMITTED]
```
- **Windows 및 비지원 플랫폼:** 부모 디렉터리 `fsync`가 지원되지 않거나 실패하더라도 파일 자체는 이미 원자적으로 교체되었으므로 롤백하지 않고 `COMMITTED_DURABILITY_UNCONFIRMED`로 정상 진행한다.

### 계약 4: Exclusive Lock (배타적 락) 선행 가드 및 거부 정책
Re-Bootstrap 실행 중 경합을 방지하기 위해 **모든 사용자 편집 진입점의 최상단에서 즉시 거부**한다:
1. **중복 요청 방지:** `_isReBootstrapping === true`일 경우 중복 Re-Bootstrap 요청 즉시 무시/거부.
2. **기존 큐 Flush:** `_isReBootstrapping = true` 설정 직후 `await this._overlayQueue;`를 호출하여 이전 대기 작업을 완전히 비움.
3. **메모리 선변경 원천 차단 (7대 진입점 선행 가드):**
   - 대상: `handleUpdateNodeData`, `handleDeleteNodes`, `handleRequestConfirmEdge`, `handleUpdateEdge`, `handleApproveNode`, `handleRejectNode`, `handleResetProjectState`
   - 각 핸들러의 **최상단(`canvasEngine.dispatch`나 메모리 변경 이전)**에 `if (this._isReBootstrapping) { vscode.window.showWarningMessage('프로젝트 재수집 중에는 캔버스를 편집할 수 없습니다.'); return; }`를 배치하여 메모리 선변경을 원천 차단.
4. **POST-COMMIT 실패 복구 정책:**
   - Commit 이후 메모리 적재나 웹뷰 동기화 실패 시, 락을 무조건 풀어서 이전 메모리 기준으로 편집이 재개되는 불일치를 차단함.
   - 최대 3회 디스크 재적재 재시도 후 최종 실패 시 락을 풀지 않고 `READ_ONLY_SAFE_MODE` 상태로 고정(편집 영구 차단 및 창 리로드 안내).

### 계약 5: 오버레이 데이터 자동 재적용 경로 (Zero-Regression)
Re-Bootstrap 후 사용자 편집 및 레이아웃 오버레이는 기존 검증 경로(`sendProjectState(true)`)를 통해 자동으로 재적용된다:
1. 디스크의 신규 SSoT를 로드하여 `canvasEngine.loadInitialState(fileState)` 실행.
2. `user_graph.json` 및 `layout.json` 파일은 덮어쓰거나 삭제하지 않고 보존.
3. `UserGraphStorage.createRenderingCopy(projectState, userGraph)`가 실행되어 기존 오버레이가 신규 SSoT 사본에 병합됨 (새 SSoT에 없는 고아 ID는 렌더링에서 제외하되 디스크에는 보존).
4. `LayoutStorage.loadLayout()` 좌표가 렌더링 사본에 적용되어 웹뷰로 전송.
- *신규 모듈이나 `UserGraphStorage.ts` 수정 없이 기존 코드 경로만으로 100% 보장.*

---

## 4. 검증 가능한 수용 기준 (Acceptance Criteria)

| 검증 항목 | 검증 시나리오 및 조건 | 합격 판정 기준 |
|:---|:---|:---|
| **시나리오 A: 수집 중단** | AST 파싱 단계에서 인위적 에러 주입 | `PRE_COMMIT_FAILURE` 판정, 기존 SSoT SHA-256 100% 동일, 임시 파일 0개 잔존 |
| **시나리오 B: 직렬화 중단** | 직렬화 스트리밍 중 강제 예외 주입 | `PRE_COMMIT_FAILURE` 판정, 기존 SSoT 100% 보존, 생성된 임시 파일 삭제 확인 |
| **시나리오 C: 절단 파일 검사** | 임시 파일 크기가 0이거나 Trailer(`}`) 미일치 시 | `PRE_COMMIT_FAILURE` 판정, `renameSync` 호출 0건, 기존 SSoT 보존 |
| **시나리오 D: 교체 오류** | 대상 SSoT 쓰기 잠금 상태에서 교체 시도 | 백오프 5회 재시도 후 안전 실패, 기존 SSoT 보존, 임시 파일 정리 |
| **시나리오 E: 배타적 선행 락 거부** | Re-Bootstrap 도중 7대 사용자 편집 호출 | `canvasEngine` 메모리 변경 0건, 편집 즉시 거부, Re-Bootstrap 정상 완료 |
| **시나리오 F: 단일 소유권 정적 감사** | `src/` 전체 SSoT 쓰기 정적 코드 검사 | 오직 `BootstrapEngine.ts` 1곳만 검출 (`CanvasPanel.ts` = 0건) |
| **시나리오 G: 오버레이 재적용 실측** | Re-Bootstrap 후 기존 노드 숨김/레이아웃 유지 | 재수집 완료 후 기존 `user_graph.json`, `layout.json` 오버레이 100% 복원 |
| **회귀 검증** | Phase 1 (Criteria 1-7, 9), Phase 2 (19 Tests), Phase A (2,230 checks) | 전원 100% PASS (회귀 결함 0건) |

---

## 5. Phase 3 허용 변경 파일 범위 (엄격히 3개 파일 한정)

1. `src/bootstrap/BootstrapEngine.ts` (임시 파일 배타적 생성, 스트리밍 연결, Trailer 절단 검사, 원자적 교체 및 fsync 동기화)
2. `src/webview/CanvasPanel.ts` (`_isReBootstrapping` 배타적 선행 가드 7개소 배치 및 POST-COMMIT 복구 상태 관리)
3. `scripts/verify_atomic_ssot_replacement.ts` (신규 검증 하네스: 5종 실패 주입, 배타적 선행 락 실측, 오버레이 재적용 검증)

*※ `NodeBuilder.ts`, `DataPipeline.ts`, `schema.ts`, `ProjectStateSerializer.ts`, `LayoutStorage.ts`, `UserGraphStorage.ts`, `ui/canvas-engine.js`는 완전 동결(수정 금지)을 유지합니다.*
