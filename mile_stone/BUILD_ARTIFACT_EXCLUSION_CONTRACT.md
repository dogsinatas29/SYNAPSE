# encoding: utf-8
# 🏗️ Build Artifact & Packaging Exclusion Contract (v1.0 — Production Synchronized)

> **Document Status:** `ACTIVE_PRODUCTION_CONTRACT`  
> **Milestone Version:** `v0.3.34.74`  
> **Scope:** SYNAPSE Pipeline Ingestion, Symbol Resolution, and Downstream Report Isolation for Target Project Build Systems & Packaging Assets.

---

## 1. Core Principles & Invariants (핵심 설계 원칙)

### Principle 1: Ingestion Boundary Isolation ($V_{\text{build}} \cap V_{\text{app}} = \varnothing$)
- 분석 대상 프로젝트의 빌드 스크립트(`build.rs`, `CMakeLists.txt`, `Makefile`, `*.gradle` 등), 패키징/인스톨러 자산(`res/msi/**`, `installer/**`, `packaging/**` 등), 빌드 매니페스트(`Cargo.toml`, `package.json`, `pyproject.toml`, `tsconfig.json` 등)는 SYNAPSE 도메인 그래프 노드 집합($V_{\text{app}}$) 및 `SymbolIndex`에 등록되지 않는다.
- 구현 경계: [`src/utils/exclusionRules.ts`](file:///home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/utils/exclusionRules.ts) (`isBuildOrPackagingAsset`), [`src/bootstrap/BootstrapEngine.ts`](file:///home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/bootstrap/BootstrapEngine.ts), [`src/core/DataPipeline.ts`](file:///home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DataPipeline.ts).

### Principle 2: Metadata Preservation Precedence (복합 매니페스트 아키텍처 정보 보존)
- 빌드 매니페스트 파일(`Cargo.toml`, `package.json`, `pyproject.toml`, `setup.cfg`, `requirements*.txt`, `tsconfig.json`) 자체는 그래프 노드($V_{\text{app}}$)에서 제외하되, 그 내부의 **패키지 경계, 로컬 워크스페이스 크레이트/패키지 매핑, 외부 의존성 선언, 경로 별칭(`paths`)** 정보는 [`src/core/build/BuildMetadataAdapter.ts`](file:///home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/build/BuildMetadataAdapter.ts) 및 [`src/core/resolvers/TypeScriptResolver.ts`](file:///home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/resolvers/TypeScriptResolver.ts)가 디스크(`fs.readFileSync`)에서 직접 읽어 100% 보존한다.

### Principle 3: Zero Secondary Hijack & Genuine Source Relation Retention ($E_{\text{valid,baseline}} \subseteq E_{\text{valid,after}}$)
- 빌드/패키징 파일(`res/msi/CustomActions/*.cpp`, `build.rs` 등)이 `SymbolIndex`에 심볼을 등록하여 도메인 코드의 함수 호출을 가로채는 1차 오염을 원천 차단한다.
- COM/Win32/POSIX SDK 및 범용 생명주기 식별자(`Release`, `AddRef`, `QueryInterface`, `Sleep`, `CloseHandle`, `main`, `init`, `new` 등)가 전역 `SymbolIndex.lookupSymbol()`을 통해 무관한 단일 도메인 구현 파일로 전이 결합(Secondary Hijack)되는 현상을 차단한다 ([`src/core/SymbolIndex.ts`](file:///home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/SymbolIndex.ts)).

---

## 2. Classification & Exclusion Taxonomy (파이프라인 분류 및 처리 매트릭스)

| 분류 코드 | 대상 정의 및 예시 | 그래프 노드 ($V_{\text{app}}$) | `SymbolIndex` 등록 | `BuildMetadataAdapter` 소비 |
| :--- | :--- | :--- | :--- | :--- |
| `BUILD_SCRIPT` | `build.rs`, `Makefile`, `GNUmakefile`, `Kbuild`, `CMakeLists.txt`, `*.cmake`, `meson.build`, `meson_options.txt`, `SConstruct`, `SCsub`, `BUILD`, `BUILD.bazel`, `WORKSPACE`, `*.bzl`, `*.gradle`, `*.gradle.kts`, `Podfile`, `Fastfile`, `Justfile`, `Taskfile.yml` | **제외 (`EXCLUDED`)** | **제외 (`EXCLUDED`)** | 해당 없음 |
| `BUILD_TOOL_CONFIG` | `webpack.config.*`, `vite.config.*`, `rollup.config.*`, `esbuild.*`, `tsup.config.*`, `babel.config.*`, `.babelrc*`, `jest.config.*`, `vitest.config.*`, `playwright.config.*`, `cypress.config.*`, `tailwind.config.*`, `postcss.config.*`, `eslint.config.*`, `.eslintrc*`, `prettier.config.*`, `.prettierrc*`, `gulpfile.*`, `Gruntfile.*` | **제외 (`EXCLUDED`)** | **제외 (`EXCLUDED`)** | 해당 없음 |
| `PACKAGING_AND_CI` | `res/msi/**`, `installer/**`, `packaging/**`, `wix/**`, `nsis/**`, `innosetup/**`, `debian/**`, `rpm/**`, `flatpak/**`, `snap/**`, `.github/**`, `.circleci/**`, `.gitlab/**`, `ci/**`, `.cargo/**`, `.mvn/**`, `.gradle/**`, `cmake/**` | **제외 (`EXCLUDED`)** | **제외 (`EXCLUDED`)** | 해당 없음 |
| `BUILD_MANIFEST` | `Cargo.toml`, `Cargo.lock`, `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `pyproject.toml`, `poetry.lock`, `Pipfile`, `Pipfile.lock`, `setup.py`, `setup.cfg`, `requirements*.txt`, `tsconfig*.json`, `jsconfig.json`, `go.mod`, `go.sum`, `pom.xml`, `composer.json`, `Gemfile` | **제외 (`EXCLUDED`)** | **제외 (`EXCLUDED`)** | **디스크 직접 파싱 (`CONSUMED`)** |
| `SOURCE_OR_CONTRACT` | 도메인 소스 코드(`*.ts`, `*.rs`, `*.cpp`, `*.py`, `*.go`, `*.kt`, `*.java` 등) 및 타입/헤더 계약(`*.d.ts`, `*.h`, `*.hpp`) | **보존 (`PRESERVED`)** | **보존 (`PRESERVED`)** | 엔트리 타깃 매칭 (`existingNodeIds`) |

---

## 3. Pipeline Enforcement Boundaries (파이프라인 4중 방어 경계)

1. **Boundary 1 — Directory Walker & Ingestion Filter ([`exclusionRules.ts`](file:///home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/utils/exclusionRules.ts), [`BootstrapEngine.ts`](file:///home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/bootstrap/BootstrapEngine.ts), [`DataPipeline.ts`](file:///home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DataPipeline.ts)):**
   - `isBuildOrPackagingAsset(filePath)`를 통해 디렉터리 탐색 및 `DataPipeline.processFiles()` 진입 시점에 빌드/패키징/매니페스트 파일을 즉시 필터링한다.
2. **Boundary 2 — Symbol Index Isolation ([`SymbolIndex.ts`](file:///home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/SymbolIndex.ts)):**
   - `rebuildFromFiles()`, `addFunction()`, `addSymbol()`에서 `isBuildOrPackagingAsset()` 가드를 적용하고, `lookupSymbol()`에서 `SYSTEM_AND_UBIQUITOUS_SYMBOLS`의 무차별 전역 바인딩을 차단한다.
3. **Boundary 3 — Node Role Fallback & Edge Closure ([`NodeBuilder.ts`](file:///home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/NodeBuilder.ts)):**
   - `determineNodeRole()`에서 빌드/패키징 자산이 `NodeRole.RUNTIME`으로 폴백되지 않도록 `NodeRole.TOOLING` / `NodeRole.CONFIG`로 격리한다.
4. **Boundary 4 — Downstream Analyzer & Report Guard ([`VirtualDebugger.ts`](file:///home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/VirtualDebugger.ts), [`LogicAnalyzer.ts`](file:///home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/LogicAnalyzer.ts)):**
   - 기존 저장된 스냅샷(`project_state.json`)을 로드하여 분석할 때도 `isBuildOrPackagingAsset()` 노드를 제외하고, 간선 양 끝점 폐포 가드(`survivingNodeIdSet.has(e.from) && survivingNodeIdSet.has(e.to)`)를 강제하여 Dangling Edge를 0으로 유지한다.
