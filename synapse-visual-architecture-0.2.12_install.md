# SYNAPSE v0.2.12 설치 가이드

## 📦 VSIX 설치 방법

### 방법 1: 터미널 (권장)
```bash
code --install-extension synapse-visual-architecture-0.2.12.vsix
```

### 방법 2: VS Code UI
1. 왼쪽 **Extensions** 패널 열기
2. 우측 상단 `…` → **Install from VSIX…**
3. `synapse-visual-architecture-0.2.12.vsix` 선택
4. 설치 완료 후 **Reload Window**

---

## ✅ 설치 후 테스트 항목

| 기능 | 단축키 | 확인 포인트 |
|------|--------|-------------|
| **Context 레코딩 켜기** | `CTRL+ALT+M` | 툴바 **⏺ REC** 버튼이 빨간색 **⏹ STOP**으로 깜빡이는지 확인 |
| **자동 파일 생성** | (레코딩 즉시) | `.synapse_contexts/YYYY-MM-DD_HHMM.md` 파일 실시간 생성 확인 |
| **Context 레코딩 끄기** | `CTRL+ALT+M` | 팝업 없이 변경 사항 저장 후 `✅ Context 저장 완료` 알림 확인 |
| **Intelligent Context Vault** | — | 캔버스 우측 🧠 마크가 있는 클러스터 생성 확인 및 실시간 노드 추가 확인 |
| **Multi-MD Bootstrap** | `CTRL+ALT+P` | MD 파일 QuickPick 목록 표시 확인 |

---

## 📁 패키지 정보

| 항목 | 값 |
|------|----|
| 파일 | `synapse-visual-architecture-0.2.12.vsix` |
| 빌드 | 2026-02-22 |
| 저장 폴더 | `.synapse_contexts/` (GEMINI.md 기준) |
| 핵심 업데이트 | 방해금지 토글 레코딩 + Intelligent Context Vault |
