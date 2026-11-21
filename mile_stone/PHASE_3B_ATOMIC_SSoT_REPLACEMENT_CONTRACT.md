# [SYNAPSE Phase 3-B] 원자적 SSoT 교체 계약서 (Revision 2: 보완본)
## Atomic SSoT Replacement Contract & Failure Semantics

## 0. 거버넌스 및 상태
- **문서 버전:** `Revision 2 (보완본)`
- **상태:** `PROPOSED DRAFT — PENDING MASTER APPROVAL`
- **선행 조건:** Phase 2 CLOSED, Phase 3-A CLOSED
- **코드 동결:** `Code Freeze: ACTIVE`, `Execution Freeze: ACTIVE`, `Implementation Authorization: NOT GRANTED`
- **목적:** 수집기(`BootstrapEngine`)의 재수집(Re-Bootstrap) 시 기존 `project_state.json`을 손상시키지 않고, 안전하게 새로운 SSoT로 원자적 교체(Atomic Swap)하는 엄격한 계약 확정.

---

## 1. 책임 소유권 분리 (Single Ownership)

| 책임 영역 | 담당 모듈 | 권한 및 역할 |
|:---|:---|:---|
| **SSoT 최종 통제 및 교체 권한** | `src/bootstrap/BootstrapEngine.ts` | **SSoT의 유일한 최종 승인자.** 임시 파일 경로 결정, 수집 조율, 무결성 사전 검증, 최종 원자적 `renameSync` 교체 통제. |
| **스트리밍 직렬화** | `src/core/transaction/ProjectStateSerializer.ts` | 기존 청킹 스트리밍 직렬화기(수정 없음). `BootstrapEngine`이 지정한 임시 파일 디스크립터에 안전하게 데이터 작성. |
| **메모리 및 웹뷰 동기화** | `src/webview/CanvasPanel.ts` | **SSoT 디스크 직접 쓰기 0건.** Re-Bootstrap 배타적 락(`_isReBootstrapping`) 관리, 디스크 최신 SSoT 메모리 로드, 웹뷰 푸시. |
| **사용자 편집 저장** | `src/core/layout/UserGraphStorage.ts` | `synapse_data/user_graph.json` 독립 저장소 관리. SSoT 디스크 쓰기 권한 없음. |

---

## 2. Commit Point 및 단계별 실패 처리 시맨틱 (Failure Semantics)

원자적 교체의 생명주기를 **COMMIT POINT (`renameSync`)**를 기준으로 엄격히 이원화한다:

```
[수집 시작] ──► [임시 파일 작성] ──► [사전 무결성 검증] ──► [RENAME (COMMIT POINT)] ──► [메모리 적재] ──► [웹뷰 푸시]
└──────────────── PRE-COMMIT FAILURE ────────────────┘            └─────────────── POST-COMMIT FAILURE ───────────────┘
          (기존 SSoT 100% 보존, 임시 파일 폐기)                         (디스크 SSoT 기준 메모리/웹뷰 재동기화)
```

| 실패 시점 | 실패 유형 | 시스템 동작 및 복구 불변식 |
|:---|:---|:---|
| **수집 파이프라인 오류** | `PRE_COMMIT_FAILURE` | 임시 파일 미생성. 기존 SSoT 100% 보존. 메모리 기준선 유지. |
| **스트리밍 직렬화 오류** | `PRE_COMMIT_FAILURE` | 자신이 생성한 임시 파일 디스크립터 닫기 및 즉시 삭제(`unlinkSync`). 기존 SSoT 100% 보존. |
| **사전 무결성 검증 실패** | `PRE_COMMIT_FAILURE` | 임시 파일 즉시 삭제. Rename 시도 원천 차단. 기존 SSoT 100% 보존. |
| **`renameSync` 실행 실패** | `PRE_COMMIT_FAILURE` | 교체 미수행. 임시 파일 삭제. 기존 SSoT 100% 보존. |
| **메모리 적재 실패** | `POST_COMMIT_FAILURE` | **신규 SSoT는 이미 디스크에 안전하게 Commit됨.** 디스크의 최신 SSoT를 기준으로 `canvasEngine` 재적재 시도. |
| **웹뷰 Push (IPC) 실패** | `POST_COMMIT_FAILURE` | 디스크 SSoT는 이미 Commit됨. 웹뷰 재연결/재동기화 플래그 설정 및 사용자 알림. |

---

## 3. 5대 핵심 기술 계약

### 계약 1: 동일 파일시스템 배타적 임시 파일 작성
- **경로 규칙:** 파티션 간 이동(`EXDEV`)에 따른 원자성 훼손을 방지하기 위해 대상 파일과 동일한 디렉터리(`synapse_data`) 내에 생성.
- **고유 식별자:** `project_state.json.tmp.${Date.now()}.${process.pid}.${counter}`
- **배타적 생성:** 파일 생성 시 충돌 방지를 위해 `fs.openSync(tempPath, 'wx')` 플래그를 사용하며, 충돌 시 `counter`를 증가시켜 고유 식별자 재생성.
- **소유권 기반 정리:** 자신이 직접 생성한 임시 파일 경로만 추적하여 삭제하며, 타 프로세스나 이전 세션의 임시 파일을 임의로 삭제하지 않음.

### 계약 2: 스트리밍 직렬화와의 메모리 안전 검증 (Memory-Safe Validation)
대용량 그래프(Godot 9,800+ 노드 등)에서 V8 메모리 초과를 유발하는 전체 파일 `JSON.parse`를 전면 금지하고, 가장 단순하고 안전한 3단계 검증을 적용한다:
1. **Serializer 완료 검증:** `ProjectStateSerializer.serializeToFileAsync`가 예외 없이 정상 종료되고 파일 디스크립터가 안전하게 닫혔는가.
2. **물리적 크기 검증:** `fs.statSync(tempPath).size > 0` (0 바이트 절단 파일 차단).
3. **Trailer 검증 (파일 끝부분 종단 검증):** 전체 파일을 읽지 않고, 파일의 마지막 32바이트만 읽어 스트리밍 직렬화가 정상 종료를 알리는 닫는 중괄호(`}`)로 끝났는지 확인.
- 위 3단계 중 하나라도 불만족 시 `PRE_COMMIT_FAILURE`로 처리하고 교체를 즉시 중단한다.

### 계약 3: 원자적 교체 및 내구성(Durability) 상태 구분
- **플랫폼별 교체:**
  - Linux / macOS: `fs.renameSync(tempPath, targetPath)` 원자적 교체.
  - Windows: 백신/인덱서 잠금에 대응하여 Phase 1 검증 백오프(50ms, 100ms, 200ms, 최대 5회) 재시도.
- **내구성 상태 명시:**
  - `NOT_COMMITTED`: Rename 이전 실패 (기존 SSoT 유지).
  - `COMMITTED_DURABILITY_UNCONFIRMED`: Rename은 성공했으나 OS 디렉터리 플러시가 미완료된 상태 (일반적인 Node.js 파일시스템 기본 상태).
  - `COMMITTED`: Rename 완료 및 파일 동기화 확인.
  - *플랫폼이나 파일시스템이 보장하지 못하는 동작을 성공으로 과장하지 않는다.*

### 계약 4: Exclusive Lock (배타적 락) 및 단순 거부 정책
Re-Bootstrap 실행 중 경합을 방지하기 위해 **단순 명확한 "신규 편집 거부" 정책**을 채택한다:
1. **진입 조건:** `_isReBootstrapping === true`일 경우 중복 Re-Bootstrap 요청 즉시 무시/거부.
2. **기존 큐 Flush:** `_isReBootstrapping = true` 설정 직후 `await this._overlayQueue;`를 호출하여 이전 대기 작업을 완전히 비움.
3. **신규 편집 즉시 거부:** Re-Bootstrap 수행 중 웹뷰나 외부에서 들어오는 모든 사용자 편집(`saveOverlayAndPush`)은 대기 큐에 쌓지 않고 **즉시 실행 거부**하며 안내 알림(`vscode.window.showWarningMessage('프로젝트 재수집 중에는 캔버스를 편집할 수 없습니다.')`)을 표시.
4. **무조건적 해제:** 성공, 실패, 예외 어느 경우에도 `finally` 블록에서 `_isReBootstrapping = false`를 보장.

### 계약 5: 오버레이 데이터 보존
- Re-Bootstrap은 오직 `project_state.json`만 디스크에서 원자적으로 교체한다.
- `user_graph.json`과 `layout.json`은 덮어쓰거나 삭제하지 않고 보존한다.
- 수집 완료 후 새로운 SSoT를 기준으로 `UserGraphStorage.createRenderingCopy`를 실행하여, 기존 사용자의 오버레이(레이아웃 위치 등)가 새로운 SSoT에 자연스럽게 재적용되도록 한다.

---

## 4. 검증 가능한 수용 기준 (Acceptance Criteria)

| 검증 항목 | 검증 시나리오 및 조건 | 합격 판정 기준 |
|:---|:---|:---|
| **시나리오 A: 수집 중단** | AST 파싱 단계에서 인위적 에러 주입 | `PRE_COMMIT_FAILURE` 판정, 기존 SSoT SHA-256 100% 동일, 임시 파일 0개 잔존 |
| **시나리오 B: 직렬화 중단** | 직렬화 스트리밍 중 강제 예외 주입 | `PRE_COMMIT_FAILURE` 판정, 기존 SSoT 100% 보존, 생성된 임시 파일 삭제 확인 |
| **시나리오 C: 무결성 검증 실패** | 임시 파일 크기가 0이거나 Trailer(`}`) 미일치 시 | `PRE_COMMIT_FAILURE` 판정, `renameSync` 호출 0건, 기존 SSoT 보존 |
| **시나리오 D: 교체 오류** | 대상 SSoT 쓰기 잠금 상태에서 교체 시도 | 백오프 5회 재시도 후 안전 실패, 기존 SSoT 보존, 임시 파일 정리 |
| **시나리오 E: 배타적 락 거부** | Re-Bootstrap 도중 `saveOverlayAndPush` 호출 | 신규 편집 즉시 거부(0 writes), 경고 메시지 표시, Re-Bootstrap 정상 완료 |
| **시나리오 F: 단일 소유권 정적 감사** | `src/` 전체 SSoT 쓰기 정적 코드 검사 | 오직 `BootstrapEngine.ts` 1곳만 검출 (`CanvasPanel.ts` = 0건) |
| **회귀 검증** | Phase 1 (Criteria 1-7, 9), Phase 2 (19 Tests), Phase A (2,230 checks) | 전원 100% PASS (회귀 결함 0건) |

---

## 5. Phase 3 허용 변경 파일 범위 (엄격히 3개 파일 한정)

1. `src/bootstrap/BootstrapEngine.ts` (임시 파일 배타적 생성, 스트리밍 연결, Trailer 검증, 원자적 교체)
2. `src/webview/CanvasPanel.ts` (`_isReBootstrapping` 배타적 락 도입 및 신규 편집 즉시 거부 가드)
3. `scripts/verify_atomic_ssot_replacement.ts` (신규 검증 하네스: 5종 실패 주입 및 배타적 락 실측)

*※ `NodeBuilder.ts`, `DataPipeline.ts`, `schema.ts`, `ProjectStateSerializer.ts`, `LayoutStorage.ts`, `UserGraphStorage.ts`, `ui/canvas-engine.js`는 완전 동결(수정 금지)을 유지합니다.*
