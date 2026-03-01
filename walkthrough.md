# SYNAPSE v0.2.20 Walkthrough - DTR & Edge Logic Fixes

## 🚀 개요
이번 버전에서는 **DTR(Deep-Thinking Ratio)** 기반의 AI 오케스트레이션과 시각적 장력을 구현하였으며, 사용자 피드백을 바탕으로 **엣지 삭제 및 수동 연결 유지 보수** 문제를 완벽히 해결했습니다.

## 🛠️ 주요 해결 사항

### 1. 엣지 삭제 및 수동 연결 영구 유지 (Persistence Fix)
- **문제**: 수동으로 만든 엣지가 새로고침 시 사라지거나, 소스 코드 내 import 문을 찾지 못할 경우 지워지지 않는 현상.
- **해결**: 
  - `CanvasPanel.ts`의 `handleSaveState`에서 엣지 배열을 병합하도록 수정하여 수동 엣지가 `project_state.json`에 영구 저장됩니다.
  - 소스 내 import 검색 실패 시에도 캔버스 논리 연결은 항상 삭제 가능하도록 'Bypass Mode'를 도입했습니다.

### 2. DTR (Inference Pressure) 시각화 및 제어
- **Vibration/Glow**: DTR 수치(Inference Pressure)에 따라 모든 엣지의 두께와 발광 강도가 실시간으로 조절됩니다. (0.7 이상 시 보라색 발광 고정)
- **Inference Params**: `AiOrchestrator`를 통한 Temperature/Top_P 자동 조율 및 적대적 시나리오 프롬프트 주입.

### 3. Python 및 가상 노드 지원 강화
- 확장자가 없는 테스트용 가상 노드(예: `TEST_NODE_DB`)를 Python 파일에 연결할 때 `import TEST_NODE_DB` 문이 정확히 주입/삭제되도록 정규표현식을 개선했습니다.

## 📺 검증 결과
- **컴파일**: ✅ Success (Webpack Bundled)
- **패키징**: [synapse-visual-architecture-v0.2.20.vsix](file:///home/dogsinatas/TypeScript_project/antigravity-extension-vis/synapse-visual-architecture-v0.2.20.vsix) 생성 완료.

---
**"시각적 아키텍처는 이제 실제 코드와 완벽히 동기화된 시스템의 심장박동으로 기능합니다."**
