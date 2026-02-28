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
```bash
pwd
ls data/
```
현재 디렉토리와 data 폴더 확인
