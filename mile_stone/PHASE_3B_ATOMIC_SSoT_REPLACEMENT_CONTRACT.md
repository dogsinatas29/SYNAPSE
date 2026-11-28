# [SYNAPSE Phase 3-B] 원자적 SSoT 교체 계약서 (Revision 7: 최종 승인안)
## Atomic SSoT Replacement Contract & Failure Recovery Protocol

## 0. 거버넌스 및 상태
- **문서 버전:** `Revision 7 (Final Implementation Contract — Closed)`
- **상태:** `APPROVED & IMPLEMENTED — CLOSED`
- **Phase 판정:** `PHASE 3-B: CLOSED`
- **선행 조건:** Phase 2 CLOSED, Phase 3-A CLOSED, Phase 3-B CLOSED
- **코드 동결:** `Code Freeze: ACTIVE — RE-FROZEN`, `Execution Freeze: ACTIVE — RE-FROZEN`, `Implementation Authorization: COMPLETED`
- **목적:** 수집기(`BootstrapEngine`)의 재수집(Re-Bootstrap) 시 기존 `project_state.json`을 손상시키지 않고, 안전하게 새로운 SSoT로 원자적 교체(Atomic Swap)하는 엄격한 계약 확정 및 구현 종결.

---

## 1. 책임 소유권 분리 (Single Ownership)

| 책임 영역 | 담당 모듈 | 권한 및 역할 |
|:---|:---|:---|
| **SSoT 최종 통제 및 교체 권한** | `src/bootstrap/BootstrapEngine.ts` | **SSoT의 유일한 최종 승인자.** 고유 임시 파일 경로 결정 및 애플리케이션 독점 관리, 수집 조율, 3단계 스트리밍 완료 검사, Windows 잠금 총 5회 백오프 재시도, 최종 원자적 `renameSync` 교체 통제. |
| **스트리밍 직렬화** | `src/core/transaction/ProjectStateSerializer.ts` | **동결 모듈 (수정 없음, 100% 호환).** `filePath`를 입력받아 내부에서 FD를 열고(`'w'`) 청킹 스트리밍 기록 후 완료 시 `closeSync` 수행. |
| **메모리 및 웹뷰 동기화** | `src/webview/CanvasPanel.ts` | **SSoT 디스크 직접 쓰기 0건.** Re-Bootstrap 배타적 락(`_isReBootstrapping`) 관리, 7대 편집 진입점 선행 가드, 디스크 최신 SSoT 메모리 로드, 호스트 측 메시지 게시 확인 기반 웹뷰 Stale 상태 분리 관리. |
| **사용자 편집 저장** | `src/core/layout/UserGraphStorage.ts` | **동결 모듈 (수정 없음).** `synapse_data/user_graph.json` 독립 저장소 관리. SSoT 디스크 쓰기 권한 없음. |

---

## 2. Commit Point 및 단계별 실패 복구 시맨틱 (Failure Semantics)

원자적 교체의 생명주기를 **COMMIT POINT (`renameSync`)**를 기준으로 엄격히 이원화한다:

```
[수집 시작] ──► [임시 파일 작성] ──► [스트리밍 완료 검사] ──► [RENAME (COMMIT POINT)] ──► [메모리 적재] ──► [웹뷰 푸시]
└──────────────── PRE-COMMIT FAILURE ────────────────┘            └─────────────── POST-COMMIT FAILURE ───────────────┘
          (기존 SSoT 100% 보존, 임시 파일 폐기)                         (디스크 SSoT 기준 메모리/웹뷰 분리 재동기화)
```

| 실패 시점 | 실패 유형 | 시스템 동작 및 복구 불변식 |
|:---|:---|:---|
| **수집 파이프라인 오류** | `PRE_COMMIT_FAILURE` | 임시 파일 미생성. 기존 SSoT 100% 보존. 메모리 기준선 유지. 락 정상 해제. |
| **스트리밍 직렬화 오류** | `PRE_COMMIT_FAILURE` | 생성 중이던 임시 파일 즉시 삭제(`unlinkSync`). 기존 SSoT 100% 보존. 락 정상 해제. |
| **스트리밍 완료 검사 실패** | `PRE_COMMIT_FAILURE` | 비정상 절단 파일 폐기. Rename 시도 원천 차단. 기존 SSoT 100% 보존. 락 정상 해제. |
| **`renameSync` 실행 실패** | `PRE_COMMIT_FAILURE` | Windows 잠금(EBUSY/EPERM) 총 5회(최초 1회 + 재시도 4회) 백오프 실패 시 교체 미수행. 임시 파일 삭제. 기존 SSoT 100% 보존. 락 정상 해제. |
| **메모리 적재 실패** | `POST_COMMIT_FAILURE` | **신규 SSoT는 이미 디스크에 안전하게 Commit됨.** 디스크 SSoT 기준 최대 3회 재적재 시도. 최종 실패 시 락을 해제하지 않고 `READ_ONLY_SAFE_MODE` 고정 (창 리로드 안내). |
| **웹뷰 Push (IPC) 실패** | `POST_COMMIT_FAILURE` | **디스크 SSoT 및 엔진 메모리는 정상 동기화됨.** `postMessage` 반환값 `false` 또는 IPC 예외 발생 시 `_isWebviewStale = true`로 유지하여 구버전 기반 사용자 편집 차단. 호스트 측 게시 확인 재완료 후에만 편집 허용. |

---

## 3. 5대 핵심 기술 계약

### 계약 1: 동일 파일시스템 배타적 임시 파일 작성 및 소유권 한계 명시
- **동결 Serializer 시그니처 및 FD 생명주기 호환:**
  - `ProjectStateSerializer.serializeToFileAsync(projectState: any, filePath: string): Promise<void>`
  - Serializer는 경로 문자열(`filePath`)을 받아 내부에서 `fs.openSync(filePath, 'w')`로 FD를 열고, 청킹 기록 후 `finally` 블록에서 `fs.closeSync(fd)`로 자체 닫기를 완료한다.
- **경로 규칙 및 파티션 격리:** 파티션 간 이동(`EXDEV`)에 따른 원자성 훼손을 방지하기 위해 대상 파일과 동일한 디렉터리(`synapse_data`) 내에 생성.
- **고유 식별자:** `project_state.json.tmp.${Date.now()}.${process.pid}.${counter}`
- **배타적 생성 절차 및 소유권 한계 명시 (P1-1 정정):**
  1. `BootstrapEngine`이 `fs.openSync(tempPath, 'wx')`로 임시 파일을 생성하여 **최초 생성 시점의 경로 중복을 방지**한다.
  2. **예약용 FD 즉시 닫기:** Serializer 호출 전에 `fs.closeSync(reserveFd)`로 예약용 디스크립터를 즉시 닫는다.
  3. **소유권 한계 및 TOCTOU 명시 (OS 잠금 한계):**
     - 임시 경로의 독점은 SYNAPSE 확장 호스트 애플리케이션 내부의 단일 실행 스코프 규칙에 의한 것이며, **운영체제나 파일시스템 수준에서 외부 프로세스의 경로 교체나 삭제를 방지하는 OS 파일 잠금(Lock)을 보장하는 것은 아니다.**
     - 예약 FD를 닫은 후 Serializer가 파일을 열기까지, 그리고 Serializer 완료 후 재개방하기까지의 시간차(TOCTOU)에 의해 외부 프로세스가 경로를 조작하는 행위는 본 절차만으로 원천 차단되지 않는다.
     - 경로 기반 정리(`unlinkSync`) 역시 외부 프로세스가 경로를 교체했다면 동일 경로의 다른 파일이 삭제될 수 있는 본질적 한계를 지닌다. 따라서 본 절차는 정상적인 단일 애플리케이션 환경을 전제로 한 안전장치(Sanity Check)이며, 외부 프로세스의 악의적 개입까지 완벽히 차단하는 보안 보장으로 확대 해석하지 않는다.
  4. **방어적 재검증 절차 (`lstatSync` 및 `fstatSync` 정정):**
     - 외부 프로세스 개입 위험을 완화하기 위해, Serializer 완료 후 파일을 다시 열기 전과 연 직후 다음 검증을 엄격히 수행한다:
       - `fs.existsSync(tempPath)`가 참인가.
       - `fs.lstatSync(tempPath).isFile() && !fs.lstatSync(tempPath).isSymbolicLink()`가 참인가 (심볼릭 링크 및 디렉터리 교체 탐지).
       - 파일 핸들 재개방(`tempFd = fs.openSync(tempPath, 'r+')`)이 정상 성공하는가.
       - 재개방된 파일 디스크립터에 대해 `fs.fstatSync(tempFd).isFile()`이 참인가 (실제 열린 파일 객체 검증).
  5. **엄격한 소유권 기반 정리:** 오류 발생 시 정리(`unlinkSync`)는 현재 인스턴스가 배타적으로 생성한 `tempPath`에 한해서만 수행한다.

### 계약 2: 스트리밍 완료 및 절단 방지 검사 (Streaming Completion & Truncation Check)
대용량 그래프(Godot 9,800+ 노드 등)에서 V8 메모리 초과를 유발하는 전체 파일 `JSON.parse`를 전면 금지하며, 본 검사는 "전체 JSON 구조 검증"이 아닌 **"스트리밍 정상 완료 및 파일 절단 여부 확인"**으로 엄격히 한정한다 (실제 구조적 무결성은 Serializer의 정상 실행 계약에 의존):
1. **Serializer 완료 검증:** `ProjectStateSerializer.serializeToFileAsync`가 내부 예외 없이 정상 종료(Promise resolve)되고 파일 디스크립터가 닫혔는가.
2. **물리적 크기 검증:** `fs.statSync(tempPath).size > 0` (0 바이트 빈 파일 차단).
3. **Trailer 검사 (후행 공백 처리):** 전체 파일을 메모리에 로드하지 않고 파일의 마지막 64바이트만 버퍼로 읽은 뒤, 후행 공백(`\r`, `\n`, `\t`, ` `)을 트림하여 마지막 유효 토큰이 닫는 중괄호(`}`)인지 확인.
- 위 3단계 중 하나라도 불만족 시 `PRE_COMMIT_FAILURE`로 판정하고 즉시 교체를 중단하며 임시 파일을 폐기한다.

### 계약 3: 원자적 교체, Windows 잠금 재시도 및 내구성 상태 전이
`COMMITTED`는 계약에서 정의한 파일 및 디렉터리 동기화 호출이 성공했다는 소프트웨어적 동기화 의미로 한정하며, 절대적인 물리적 하드웨어 전원 장애 내구성 보장으로 과장하지 않는다.

#### A. 실행 시퀀스 및 상태 전이
```
[임시 파일 스트리밍 쓰기 완료 (Serializer closeSync)]
         ↓
[임시 파일 lstatSync 확인 후 openSync('r+') -> fstatSync 확인 후 fsyncSync(tempFd) 플러시 시도 및 close]
         ↓
[fs.renameSync(tempPath, targetPath)]  <--- COMMIT POINT
         ↓
[부모 디렉터리 fsyncSync(dirFd) 시도 (POSIX)]
```

| 상황 | 최종 판정 | 설명 |
|:---|:---|:---|
| 임시 파일 동기화 실패, Rename 이전 | `NOT_COMMITTED` | 교체 미수행, 임시 파일 삭제, 기존 SSoT 100% 보존. |
| Rename 실패 (재시도 소진 포함) | `NOT_COMMITTED` | 교체 미수행, 임시 파일 삭제, 기존 SSoT 100% 보존. |
| Rename 성공, 부모 디렉터리 동기화 성공 | `COMMITTED` | POSIX 디렉터리 엔트리 동기화 완료. |
| Rename 성공, 부모 디렉터리 동기화 실패 또는 미지원 | `COMMITTED` (`[SSOT_DURABILITY_UNCONFIRMED]`) | 파일 자체는 성공적으로 원자적 교체 완료(COMMITTED). API 반환은 Promise&lt;void&gt;를 유지하며, 플랫폼 한계로 인한 디렉터리 엔트리 내구성 미확인은 호스트 진단 로그 분류로 처리하고 정상 진행. |

#### B. Windows 잠금 재시도 정책 명세
- **대상 오류 코드:** 타 프로세스(백신, 검색 인덱서, VS Code 파일 감시기)에 의한 일시적 파일 잠금인 `EBUSY`, `EPERM`으로 엄격 한정 (기타 `ENOENT`, `ENOSPC` 등 비일시적 오류는 재시도 없이 즉시 중단).
- **총 시도 횟수:** **최대 5회 (최초 시도 1회 + 재시도 4회)**.
- **백오프 대기 간격:** 총 4회의 대기가 순차 적용됨:
  1. 1차 시도 (최초 즉시 실행) -> 실패 시 50ms 대기
  2. 2차 시도 (재시도 1회차) -> 실패 시 100ms 대기
  3. 3차 시도 (재시도 2회차) -> 실패 시 200ms 대기
  4. 4차 시도 (재시도 3회차) -> 실패 시 400ms 대기
  5. 5차 시도 (재시도 4회차) -> 실패 시 최종 실패(`NOT_COMMITTED`) 판정
- **총 대기 시간 상한:** 750ms (50ms + 100ms + 200ms + 400ms).
- **최종 실패 시 조치:** 임시 파일 즉시 정리(`unlinkSync`), 기존 SSoT 100% 보존, 락 정상 해제.

### 계약 4: Exclusive Lock 선행 가드 및 호스트 측 메시지 게시 확인 완료 기준
Re-Bootstrap 실행 중 경합을 방지하고, 메모리-웹뷰 불일치를 방지하기 위해 엄격한 상태 분리 정책을 적용한다:
1. **중복 요청 방지:** `_isReBootstrapping === true`일 경우 중복 Re-Bootstrap 요청 즉시 무시/거부.
2. **기존 큐 Flush:** `_isReBootstrapping = true` 설정 직후 `await this._overlayQueue;`를 호출하여 이전 대기 작업을 완전히 비움.
3. **메모리 선변경 원천 차단 (7대 진입점 선행 가드):**
   - 대상 핸들러: `handleUpdateNodeData`, `handleDeleteNodes`, `handleRequestConfirmEdge`, `handleUpdateEdge`, `handleApproveNode`, `handleRejectNode`, `handleResetProjectState`
   - 각 핸들러의 **최상단(`canvasEngine.dispatch`나 메모리 변경 이전)**에 다음 선행 가드를 배치하여 메모리 선변경을 원천 차단:
     ```ts
     if (this._isReBootstrapping) {
         vscode.window.showWarningMessage('프로젝트 재수집 중에는 캔버스를 편집할 수 없습니다.');
         return;
     }
     if (this._isWebviewStale) {
         vscode.window.showWarningMessage('화면 동기화 진행 중입니다. 잠시 후 다시 시도해주세요.');
         return;
     }
     ```
4. **POST-COMMIT 실패 복구 및 호스트 측 메시지 게시 확인 완료 기준:**
   - **[메모리 동기화 실패 시]:** 신규 SSoT Commit 후 `canvasEngine.loadInitialState` 실패 시, 디스크 최신 SSoT 기준으로 최대 3회 재적재를 시도한다. 3회 모두 실패 시 락을 풀지 않고 `READ_ONLY_SAFE_MODE` 상태로 고정(편집 영구 차단 및 VS Code 창 리로드 안내).
   - **[용어 정의 및 한계]:** 완료 상태는 렌더러의 실제 DOM/WebGL 적용 완료(Rendering ACK)가 아니며, VS Code IPC를 통한 **"호스트 측 메시지 게시 확인 완료 (Host-side Message Post Confirmed)"**로 명확히 한정한다.
   - **[비동기 반환값 전수 검증]:**
     - VS Code `Webview.postMessage(message)`는 `Thenable<boolean>`을 반환한다.
     - `sendProjectState(true)` 청킹 시퀀스의 모든 호출(`projectStateChunkStart`, 모든 `projectStateNodesChunk`, 모든 `projectStateEdgesChunk`, `projectStateChunkEnd`)에 대해 `const ok = await this._panel.webview.postMessage(...)` 형태로 반환값을 확인한다.
     - **단 하나의 청크라도 `ok === false`를 반환하거나 예외가 발생하면 해당 전송을 즉시 "실패"로 판정한다.**
     - **모든 청크의 반환값이 `true`인 경우에만 "호스트 측 메시지 게시 확인 완료"로 판정한다.**
   - **[Stale 상태 지속 및 편집 차단]:**
     - 전송 실패 또는 패널 비활성(`!this._panel`) 시 `_isWebviewStale = true`가 유지되어 7대 선행 가드에서 사용자 편집이 엄격히 차단된다.
     - 웹뷰가 재연결되거나 포커스를 회복하여 `ready` 시그널이 트리거되고, 그에 따른 재전송에서 모든 청크의 `postMessage`가 `true`를 반환할 때에만 `_isWebviewStale = false`로 전환되어 편집 잠금이 안전하게 해제된다.

### 계약 5: 오버레이 데이터 자동 재적용 경로 (Zero-Regression & 실측 검증)
Re-Bootstrap 후 사용자 편집 및 레이아웃 오버레이는 기존 검증 경로(`sendProjectState(true)`)를 통해 자동으로 재적용된다:
1. 디스크의 신규 SSoT를 로드하여 `canvasEngine.loadInitialState(fileState)` 실행.
2. `user_graph.json` 및 `layout.json` 파일은 덮어쓰거나 삭제하지 않고 디스크에 보존.
3. `UserGraphStorage.createRenderingCopy(projectState, userGraph)`가 실행되어 기존 사용자 오버레이가 신규 SSoT 사본에 병합됨 (새 SSoT에 없는 고아 ID는 렌더링에서 제외하되 디스크에는 보존).
4. `LayoutStorage.loadLayout()` 좌표가 렌더링 사본에 적용되어 웹뷰로 전송.
- *신규 모듈이나 `UserGraphStorage.ts`, `LayoutStorage.ts` 수정 없이 기존 코드 경로 100% 보존.*
- *실제 구현 단계 검증 하네스(`verify_atomic_ssot_replacement.ts`)에서 위 호출 순서 및 오버레이 보존을 전수 실측 검증한다.*

---

## 4. 검증 가능한 수용 기준 (Acceptance Criteria)

| 검증 항목 | 검증 시나리오 및 조건 | 합격 판정 기준 |
|:---|:---|:---|
| **시나리오 A: 수집 중단** | AST 파싱 단계에서 인위적 에러 주입 | `PRE_COMMIT_FAILURE` 판정, 기존 SSoT SHA-256 100% 동일, 임시 파일 0개 잔존 |
| **시나리오 B: 직렬화 중단** | 직렬화 스트리밍 중 강제 예외 주입 | `PRE_COMMIT_FAILURE` 판정, 기존 SSoT 100% 보존, 생성된 임시 파일 삭제 확인 |
| **시나리오 C: 절단 파일 검사** | 임시 파일 크기가 0이거나 Trailer(`}`) 미일치 시 | `PRE_COMMIT_FAILURE` 판정, `renameSync` 호출 0건, 기존 SSoT 보존 |
| **시나리오 D: 교체 오류 및 백오프** | 대상 SSoT EBUSY 잠금 상태에서 교체 시도 | 총 5회(최초 1회 + 백오프 재시도 4회, 총 750ms) 시도 후 안전 실패, 기존 SSoT 보존, 임시 파일 정리 |
| **시나리오 E: 배타적 선행 락 거부** | Re-Bootstrap 도중 7대 사용자 편집 호출 | `canvasEngine` 메모리 변경 0건, 편집 즉시 거부, Re-Bootstrap 정상 완료 |
| **시나리오 F: 웹뷰 Stale 편집 차단** | `postMessage` 반환값 `false` 모의 주입 | 메모리 변경 0건, `_isWebviewStale` 유지되어 7대 선행 가드에 의해 편집 즉시 거부 |
| **시나리오 G: 단일 소유권 정적 감사** | `src/` 전체 SSoT 쓰기 정적 코드 검사 | 오직 `BootstrapEngine.ts` 1곳만 검출 (`CanvasPanel.ts` = 0건) |
| **시나리오 H: 오버레이 재적용 실측** | Re-Bootstrap 후 기존 노드 숨김/레이아웃 유지 | 재수집 완료 후 기존 `user_graph.json`, `layout.json` 오버레이 100% 복원 |
| **회귀 검증** | Phase 1 (Criteria 1-7, 9), Phase 2 (19 Tests), Phase A (2,230 checks) | 전원 100% PASS (회귀 결함 0건) |

---

## 5. Phase 3 허용 변경 파일 범위 (엄격히 3개 파일 한정)

1. `src/bootstrap/BootstrapEngine.ts` (임시 파일 배타적 생성 및 lstat/fstat 검증, 스트리밍 연결, Trailer 절단 검사, Windows 잠금 총 5회 지수 백오프 재시도, 원자적 교체 및 fsync 동기화)
2. `src/webview/CanvasPanel.ts` (`_isReBootstrapping` 및 `_isWebviewStale` 배타적 선행 가드 7개소 배치, `postMessage` boolean 반환값 검증 및 POST-COMMIT 메모리/웹뷰 분리 복구 상태 관리)
3. `scripts/verify_atomic_ssot_replacement.ts` (신규 검증 하네스: 5종 실패 주입, Windows 잠금 5회 재시도 실측, 배타적 선행 락 실측, 웹뷰 Stale 차단 실측, 오버레이 재적용 검증)

*※ `NodeBuilder.ts`, `DataPipeline.ts`, `schema.ts`, `ProjectStateSerializer.ts`, `LayoutStorage.ts`, `UserGraphStorage.ts`, `ui/canvas-engine.js`는 완전 동결(수정 금지)을 유지합니다.*
