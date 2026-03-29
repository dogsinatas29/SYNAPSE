# SYNAPSE 디버깅 가이드

## 현재 상황
캔버스가 "Loading project..." 상태에서 멈춰있음

## 체크리스트

### 1. Extension Development Host에서 프로젝트 폴더가 열려있는가?
- [ ] Extension Development Host 창 확인
- [ ] 왼쪽 Explorer에 파일들이 보이는가?
- [ ] 만약 비어있다면: `File` → `Open Folder` → 이 프로젝트 폴더 선택

### 2. Webview Developer Tools 콘솔 확인
Extension Development Host 창에서:
- `Ctrl+Shift+P` → `Developer: Open Webview Developer Tools`
- Console 탭에서 다음 로그 확인:

**정상적인 경우:**
```
[SYNAPSE] Initializing...
[SYNAPSE] VS Code API available: true
[SYNAPSE] Running in VS Code webview
[SYNAPSE] Requesting project state from extension
[SYNAPSE] Received message: projectState
[SYNAPSE] Loading project state
[SYNAPSE] Loaded project state with 3 nodes
```

**문제가 있는 경우:**
- `[SYNAPSE] VS Code API available: false` → vscode API가 주입되지 않음
- `[SYNAPSE] Requesting...` 후 아무 응답 없음 → Extension이 메시지를 받지 못함
- 에러 메시지 → 구체적인 에러 확인

### 3. Extension 콘솔 확인
원래 Antigravity 창 (Extension Development Host가 아닌)에서:
- `View` → `Output` 패널 열기
- 드롭다운에서 "Extension Host" 선택
- `Sending project state to webview:` 로그 확인

### 4. 파일 경로 확인
```bash
ls -la /home/dogsinatas/TypeScript_project/antigravity-extension-vis/data/project_state.json
```
파일이 존재하고 읽을 수 있는지 확인

## 해결 방법

### 방법 1: 프로젝트 폴더 열기
Extension Development Host 창에서:
1. `File` → `Open Folder`
2. `/home/dogsinatas/TypeScript_project/antigravity-extension-vis` 선택
3. `Ctrl+Shift+P` → `SYNAPSE: Open Canvas`

### 방법 2: Extension 재시작
1. Extension Development Host 창 닫기
2. 원래 창에서 F5 다시 누르기
3. 새 창에서 폴더 열고 Canvas 열기

### 방법 3: 수동으로 workspace 확인
Extension Development Host 창에서 터미널 열고:
## 대화 히스토리 복구 가이드 (Antigravity 전용)

### 현상
`.pb` 파일은 `~/.gemini/antigravity/conversations/`에 존재하지만, IDE UI(Sidebar)에서 대화 목록이 사라진 경우.

### 해결 방법: 플랜 B (더미 세션 재주입 전략)
이 방법은 데이터베이스(SQLite)를 직접 건드리지 않고 안전하게 대화를 복구하는 실전용 정공법입니다.

1.  **과거 데이터 확인**: 복구하고 싶은 원본 파일(`Target_Old.pb`)을 안전한 곳에 복사해둡니다.
2.  **새 세션 생성**: Antigravity IDE UI에서 'New Chat'을 눌러 아무 내용이나 입력하고 새 대화를 하나 만듭니다.
3.  **새 파일 식별**: `~/.gemini/antigravity/conversations/` 디렉터리에서 방금 생성된 가장 최신의 `.pb` 파일 이름(`Dummy_New.pb`)을 확인합니다.
4.  **IDE 종료**: Antigravity IDE를 완전히 종료합니다.
5.  **파일 치환 (Overwrite)**:
    *   생성된 `Dummy_New.pb`를 삭제하거나 이름을 바꿉니다.
    *   복구할 원본 파일 `Target_Old.pb`의 이름을 `Dummy_New.pb`로 변경하여 그 위치에 넣습니다.
6.  **IDE 재시작**: IDE를 다시 열면, Sidebar의 새 대화 목록 클릭 시 과거의 대화 내용이 로드됩니다.

> [!TIP]
> **SYNAPSE 감사 로그 확인**:
> 위 방법이 번거롭다면, 프로젝트 루트의 `.synapse_contexts/` 폴더를 확인하세요. SYNAPSE는 이미 **LOB Sniffer**를 통해 해당 바이너리 대화를 텍스트로 추출하여 실시간으로 저장하고 있습니다.
