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

---

## 🛡️ 빌드 정합성 규칙 (Build Guard Rules)

1. **환경 변수 기반 빌드 트리거 (Secret Injection)**
- **규칙**: 빌드 엔진은 프로젝트 외부의 BM 파일을 직접 읽지 않는다. 대신, 사령관(Dogsinatas)이 시스템 환경 변수(BM_AUTH_KEY)로 주입한 인증 토큰이 현재 마일스톤 버전과 일치할 때만 vsix 컴파일을 시작한다.
- **검증**: `npm run build` 실행 시, `.env` 또는 시스템 환경 변수에 `BM_SYNC_VER`가 `v0.2.x`와 일치하지 않으면 "BM Policy Mismatch: Build Aborted" 에러를 뱉고 즉시 중단한다.

2. **마일스톤-빌드 타겟 강제 동기화 (Target Enforcement)**
- **규칙**: 생성되는 파일명은 반드시 `synapse-visual-architecture-v[마일스톤버전].vsix`여야 한다.
- **동기화**: 빌드 스크립트는 `package.json`의 버전을 무시하고, 현재 활성화된 `mile_stone/vX.X.X.md` 파일의 헤더 버전을 추출하여 파일명을 강제 명명한다. 만약 마일스톤 문서가 없으면 빌드는 불가능하다.

3. **릴리즈 노트 무결성 검사 (Pre-release Check)**
- **규칙**: 빌드 전, `release_note/v버전_release_notes.md` 파일의 존재 여부와 내용의 완결성을 스캔한다.
- **조건**: 릴리즈 노트에 `[Status: Verified by Commander]` 태그가 명시되지 않은 상태에서 빌드를 시도하면, 이는 '미승인 배포'로 간주하여 바이너리 생성을 거부한다.

4. **외곽 참조 투명성 (External Integrity)**
- **규칙**: LLM은 프로젝트 폴더 밖의 파일을 참조할 수 없음을 인지하고, 빌드 관련 에러 발생 시 "외부 보안 정책(BM Policy) 위반 가능성"을 최우선 리포트한다.
- **보안**: 빌드 로그에 외부 경로(Path)가 노출되지 않도록 모든 경로는 프로젝트 루트 기준 상대 경로로 마스킹한다.
