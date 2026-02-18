# SYNAPSE Architecture & Discovery Rules (설계 및 발견 규칙)

This document defines the rules for how SYNAPSE discovers, parses, and visualizes the project architecture.
본 문서는 SYNAPSE가 프로젝트 아키텍처를 발견, 파싱 및 시각화하는 규칙을 정의합니다.

---

## 1. Node Inclusion Rules (노드 포함 규칙)
- **Real Path Priority (실제 경로 우선)**: Only files and folders that actually exist in the project root (e.g., `src/`, `prompts/`) are valid nodes.
  (프로젝트 루트에 실재하는 파일 및 폴더 경로만 노드로 인정합니다.)
- **Icon Standards (아이콘 표준)**: 
    - Folder nodes MUST be prefixed with the 📁 icon. (폴더 노드는 📁 아이콘을 사용합니다.)
    - File nodes MUST be prefixed with the 📄 icon. (파일 노드는 📄 아이콘을 사용합니다.)
- **Core Components (중추 컴포넌트)**: Critical system logic (e.g., `CanvasPanel.ts`, `BootstrapEngine.ts`) must always be placed in the top-level cluster.
  (시스템 핵심 로직은 항상 최상위 클러스터에 배치합니다.)

## 2. Exclusion & Refinement Rules (제외 및 정제 규칙)
- **Code Block Isolation (코드 블록 격리)**: Text inside multi-line code blocks using \`\`\` (backticks) or ~~~ (tildes) is excluded from scanning.
  (코드 블록 내부의 텍스트는 스캔 대상에서 제외합니다.)
- **Inline Code Protection (인라인 코드 보호)**: Filenames or technical terms wrapped in single backticks (\`...\`) are treated as plain text and do not trigger node creation.
  (인라인 코드로 감싸진 용어는 노드를 생성하지 않습니다.)
- **Comment Ignores (주석 무시)**: All text and directory structures inside HTML comments `<!-- ... -->` are ignored.
  (HTML 주석 내의 가이드 문구는 파싱하지 않습니다.)
- **Node Diet (최적화)**: Non-architectural documents and build artifacts are excluded from the canvas:
  (아래와 같은 파일들은 캔버스 렌더링에서 배제합니다.)
    - `README.md`, `README_KR.md`
    - `CHANGELOG.md`, `test_exclusion.js`
    - `.vsix` (Build files)
    - `.js.map` (Source maps)
    - `node_modules`, `.git`, `dist`, `build`, `ui` (Folders)

## 3. Edge & Flow Definitions (엣지 및 흐름 정의)
- **Execution Flow Priority (실행 흐름 우선)**: Connections (`-->`) should represent actual **'Execution Flow'** (data/logic movement) rather than simple static imports.
  (단순 참조보다 데이터가 실제로 이동하는 '실행 로직'을 중심으로 연결합니다.)
- **Layer Compliance (레이어 준수)**: Connections should follow the architectural layering:
  (노드 간 연결은 가급적 레이어 순서를 따릅니다.)
    - `Discovery` -> `Reasoning` -> `Action`
