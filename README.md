# 🧠 SYNAPSE: LLM Logic Visualization Engine

> **Google Antigravity Extension**  
> "보이는 것이 곧 LLM의 논리다 (WYSIWYG Logic for AI)"

SYNAPSE는 **Google Antigravity**를 위해 구축된 차세대 확장 프로그램입니다. LLM(Large Language Model)이 생성하거나 분석한 복잡한 추론 논리를 물리적 공간과 노드-엣지 네트워크로 시각화하여, AI의 사고 과정을 직관적으로 설계, 구현, 문서화할 수 있게 돕습니다.

## 🚀 Key Features

- **🌐 Topology View**: 프로젝트의 폴더 구조 및 파일 간의 의존성을 노드-엣지 네트워크로 시각화.
- **🌳 Tree View**: 프로젝트 구조를 계층적으로 조감.
- **➡️ Flow View**: 특정 로직의 실행 흐름을 순서도로 투사.
- **🛡️ Node Diet (Smart Scanning)**: `.venv`, `node_modules` 등 불필요한 폴더를 자동으로 무시하여 핵심 소스에 집중.
- **📂 Auto Folder Clustering**: 디렉토리 구조에 기반한 자동 그룹화로 대규모 프로젝트 가독성 보장.
- **🔄 Deep Reset**: 엉망이 된 배치를 즉시 초기화하고 최신 필터로 재스캔하는 심층 초기화.
- **🎯 Scan Scope Control**: `GEMINI.md`에서 `Scan Paths`를 지정하여 원하는 영역만 정밀 스캔 가능.
- **🔍 Semantic Zooming (LOD)**: 수천 개의 노드도 성능 저하 없이 조작 가능한 단계별 상세도 제어.
- **💾 Persistence**: 모든 시각적 상태를 `project_state.json`에 영구 저장 및 Git 관리.
- **🛠️ Standalone Bridge**: VS Code 없이 브라우저 단독 구동 모드 지원.

## 🗂️ Language Support

SYNAPSE는 다국어 아키텍처 분석을 지원합니다:
- 🐍 **Python**: `.py` 파일 분석 및 가상환경 필터링 지원
- 🦀 **Rust**: `Cargo` 프로젝트 구조 및 `.rs` 로직 분석
- 🇨 **C / C++**: 헤더 및 소스 파일 의존성 분석 (ReDoS 방지 최적화 완료)
- 🐚 **Shell Script**: `.sh` 자동화 스크립트 흐름 및 함수 분석
- 🗄️ **SQL**: `.sql` 테이블 정의 및 스키마 시각화
- ⚙️ **Config (JSON/YAML/TOML)**: 인프라 설정 파일 간의 관계 분석 (The Glue)
- 📜 **TypeScript / JavaScript**: 기본 지원 및 폴더링 최적화

## 🛠️ Technology Stack

- **Base**: Antigravity (Advanced Agentic Coding IDE)
- **Language**: TypeScript
- **Engine**: HTML5 Canvas API (High Performance Rendering)
- **Scanner**: Regex-based Fast Multi-Language Scanner
- **Architecture**: Visual-First Design with LSP integration

### 🌐 Graph View
LLM의 추론 논리와 파일 간의 물리적 연결 상태를 노드-엣지 네트워크로 시각화합니다.
![Graph View](docs/media/synapse_graph_view.png)

### 🌳 Tree View
프로젝트의 폴더 구조와 파일 계층을 직관적으로 조감할 수 있습니다.
![Tree View](docs/media/synapse_tree_view.png)

### ➡️ Flow View
특정 이벤트나 함수의 로직 실행 흐름을 선형적인 순서도로 투사합니다.
![Flow View](docs/media/synapse_flow_view.png)

## 🛠️ Technology Stack

- **Base**: Antigravity (Advanced Agentic Coding IDE)
- **Language**: TypeScript
- **Engine**: HTML5 Canvas API (High Performance Rendering)
- **Architecture**: Visual-First Design with LSP integration

## 📦 Getting Started

1. **Repository Clone**
   ```bash
   git clone https://github.com/dogsinatas29/SYNAPSE.git
   ```

2. **Dependency Installation**
   ```bash
   npm install
   ```

3. **Development Server (VS Code Extension)**
   ```bash
   npm run watch
   # Then press F5 in VS Code to start extension development host
   ```

4. **Standalone Bridge Mode (New! 🚀)**
   VS Code 없이 브라우저에서 직접 엔진을 구동하고 싶을 때 사용합니다.
   ```bash
   # Terminal 1: API Server
   npm run dev:standalone

   # Terminal 2: UI Server
   npm run dev:ui
   ```
   - API Server: `http://localhost:3000`
   - UI Server: `http://localhost:8080`

5. **Installation (Production)**
    If you want to use the extension permanently without running the source code:
    ```bash
    # 1. Install vsce globally
    npm install -g @vscode/vsce

    # 2. Package the extension
    npx vsce package

    # 3. Install in VS Code
    # Open VS Code Extension tab -> Click '...' -> 'Install from VSIX...' -> Select the generated .vsix file
    ```

## 🎯 Usage Guide

### 🧱 Node Creation (New!)
- **Add Node**: 상단 툴바의 `Add Node` 버튼을 클릭하여 새 노드를 생성합니다.
- **Node Input**: 생성된 노드를 선택하고 이름을 변경할 수 있습니다.

### 🎨 Manual Edge Creation (WYSIWYG)

SYNAPSE의 핵심 기능인 **드래그 앤 드롭 엣지 생성**으로 코드 없이 아키텍처를 설계하세요!

#### 1. 노드 선택
- 캔버스에서 노드를 클릭하여 선택
- 선택된 노드 주변에 **4방향 연결 핸들** (상/하/좌/우)이 자동으로 나타남

#### 2. 엣지 생성 시작
- **Alt + 연결 핸들 클릭**으로 엣지 생성 모드 진입
- 마우스를 움직이면 **유령 엣지**(Ghost Edge)가 실시간으로 표시됨

#### 3. 타겟 선택
- 다른 노드나 클러스터로 드래그
- 유효한 타겟 위에 마우스를 올리면 유령 엣지가 **녹색**으로 변경

#### 4. 관계 타입 선택
- 마우스를 릴리즈하면 **엣지 타입 선택 메뉴** 표시
- 선택 가능한 타입:
  - 🔗 **Dependency**: 의존성 관계
  - 📞 **Call**: 함수 호출 관계
  - 📊 **Data Flow**: 데이터 흐름
  - ↔️ **Bidirectional**: 양방향 관계

#### 5. 자동 저장
- 타입 선택 시 `project_state.json`에 자동 저장
- Git으로 형상 관리 가능 (정규화된 JSON 형식)

### 📦 Clustering & Management

복잡한 노드들을 그룹화하여 관리하세요!

1.  **그룹 생성**:
    *   Shift/Ctrl + 클릭으로 여러 노드 선택
    *   툴바의 `Group` 버튼 클릭
    *   **이름 입력**: 팝업에서 그룹 이름을 지정
2.  **그룹 관리**:
    *   **이름 변경**: 그룹 헤더를 **더블 클릭**하여 이름 수정
    *   **접기/펴기**: 헤더 우측의 `[-]`/`[+]` 버튼으로 노드 숨기기/보이기
    *   **Smart Push**: 클러스터 영역 내 겹치는 노드 자동 재배치
3.  **그룹 해제**: 그룹 선택 후 `Ungroup` 버튼 클릭

### 💾 Snapshot & Rollback

중요한 설계 지점을 저장하고 복원하세요!

- **수동 스냅샷**: 툴바의 카메라 아이콘(Snapshot) 클릭
- **자동 스냅샷**: 주요 변경(그룹 생성, 해제 등) 시 자동 저장
- **롤백**: 시계 아이콘(History) 클릭 -> 원하는 시점의 되돌리기 버튼 클릭
    *   (브라우저 모드에서는 확인 창이 뜹니다)

## 🎥 Demo Video
https://www.youtube.com/watch?v=Va4vZWkqC8E
> *Click the image above to watch the full video on YouTube.*

## 🧹 Data Hygiene Principles

SYNAPSE는 "스파게티 데이터" 방지를 위한 3대 원칙을 따릅니다:

### 원칙 1: 원천 소스와 상태값의 분리
- **GEMINI.md**: 선언적 아키텍처 정의
- **project_state.json**: UI 메타데이터 (좌표, 줌 레벨)

### 원칙 2: 자동 정규화
- JSON 키 알파벳 순 정렬 → Git Diff 최소화
- 기본값과 동일한 속성 자동 제거

### 원칙 3: 휘발성 자동 엣지
- 코드 분석으로 발견된 엣지는 저장하지 않음
- 캔버스 로드 시마다 실시간 재생성
- `project_state.json`은 오직 사용자의 의도만 저장

## 📐 Philosophy

"아이들에게는 직관적인 놀이터, 전문가에게는 강력한 관제탑."  
복잡한 시스템을 선으로 연결하는 단순한 행위가 사실은 가장 고차원적인 아키텍처 설계라는 믿음으로 제작되었습니다.

---
Created by [dogsinatas29](https://github.com/dogsinatas29)
