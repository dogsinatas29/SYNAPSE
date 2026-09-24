# Phase 25: Structural vs Behavioral Delta Report (VSCode)

## 1. Engine Evolution Observation
이 보고서는 특정 생태계의 분석을 넘어, SYNAPSE 엔진이 1차원(Topology)에서 2차원(Semantic Layers)으로 진화했음을 증명하는 첫 번째 **Delta Analysis**입니다. 
"컴파일/타입 시스템의 결합(Structural)"과 "실제 실행 궤적의 결합(Behavioral)" 간의 차이를 정량화하여 아키텍처의 진짜 복잡도를 분리해냅니다.

## 2. 📉 Topology Delta (거시 지표 변화)

| Metric | Structural Profile | Behavioral Profile | Delta (Reduction) |
| :--- | :--- | :--- | :--- |
| **Valid Edges** | 102357 | 58826 | **-42.5%** |
| **Largest SCC Size** | 2699 | 174 | **-93.6%** |
| **Total DAG Nodes** | 11394 | 13976 | +2582 (파편화 증가) |

**해석 (Observation):**
Behavioral 모드 적용 시 Largest SCC가 엄청난 비율로 축소됩니다. 이는 VSCode의 거대한 상호 의존성(2600+ 노드) 중 상당수가 인터페이스 공유, 타입 참조 등 "실행과 무관한 정적 결합"에 의해 부풀려져 있었음을 시사합니다.

## 3. 📊 Stability Metrics (1급 지표: 유지율)

| Metric | Value | 설명 |
| :--- | :--- | :--- |
| **Hub Stability** | **10.0%** | Structural Top 20 허브 중 Behavioral Top 40 내에 생존한 비율 |
| **False Hub Rate** | **90.0%** | Structural에서는 거대한 허브였으나, 실행 관점에서는 허구가 된 비율 |

## 4. 🔄 Role Migration (역할의 이동)
정적 그래프에서는 시스템의 중심(Hub)으로 보였으나, 런타임/행위 관점에서는 단말(Victim/Leaf)에 가깝게 추락한 노드들입니다. **이들은 "단순 타입 레지스트리"이거나 "유틸리티"일 가능성이 매우 높습니다.**

- **src/vs/platform/agentHost/node/claude/roadmap.md**: Structural Hub (Reach: 4049) ➔ Behavioral Rank Dropped (Reach: 1, In: 0) - *Type Registry 착시 의심*
- **src/vs/workbench/workbench.common.main.ts**: Structural Hub (Reach: 3967) ➔ Behavioral Rank Dropped (Reach: 542, In: 0) - *Type Registry 착시 의심*
- **src/vs/platform/agentHost/node/agentHostServerMain.ts**: Structural Hub (Reach: 3915) ➔ Behavioral Rank Dropped (Reach: 585, In: 0) - *Type Registry 착시 의심*
- **src/vs/platform/agentHost/node/agentHostMain.ts**: Structural Hub (Reach: 3907) ➔ Behavioral Rank Dropped (Reach: 591, In: 0) - *Type Registry 착시 의심*
- **src/vs/platform/agentHost/node/codex/codexAgent.ts**: Structural Hub (Reach: 3795) ➔ Behavioral Rank Dropped (Reach: 573, In: 1) - *Type Registry 착시 의심*
- **src/vs/platform/agentHost/node/codex/codexAppServerClient.ts**: Structural Hub (Reach: 3746) ➔ Behavioral Rank Dropped (Reach: 13, In: 2) - *Type Registry 착시 의심*
- **src/vs/sessions/sessions.common.main.ts**: Structural Hub (Reach: 3616) ➔ Behavioral Rank Dropped (Reach: 542, In: 0) - *Type Registry 착시 의심*
- **src/vs/workbench/api/browser/extensionHost.contribution.ts**: Structural Hub (Reach: 3576) ➔ Behavioral Rank Dropped (Reach: 2, In: 0) - *Type Registry 착시 의심*
- **extensions/copilot/src/extension/extension/vscode-node/contributions.ts**: Structural Hub (Reach: 3533) ➔ Behavioral Rank Dropped (Reach: 1, In: 0) - *Type Registry 착시 의심*
- **src/vs/workbench/contrib/preferences/browser/preferences.contribution.ts**: Structural Hub (Reach: 3486) ➔ Behavioral Rank Dropped (Reach: 543, In: 0) - *Type Registry 착시 의심*
- **src/vs/sessions/contrib/chat/electron-browser/chat.contribution.ts**: Structural Hub (Reach: 3481) ➔ Behavioral Rank Dropped (Reach: 593, In: 0) - *Type Registry 착시 의심*
- **src/vs/workbench/api/node/extHostExtensionService.ts**: Structural Hub (Reach: 3479) ➔ Behavioral Rank Dropped (Reach: 41, In: 0) - *Type Registry 착시 의심*
- **src/vs/sessions/sessions.web.main.ts**: Structural Hub (Reach: 3474) ➔ Behavioral Rank Dropped (Reach: 542, In: 0) - *Type Registry 착시 의심*
- **src/vs/sessions/contrib/chat/browser/chatView.ts**: Structural Hub (Reach: 3473) ➔ Behavioral Rank Dropped (Reach: 545, In: 0) - *Type Registry 착시 의심*
- **src/vs/editor/editor.all.ts**: Structural Hub (Reach: 3470) ➔ Behavioral Rank Dropped (Reach: 1, In: 0) - *Type Registry 착시 의심*
- **src/vs/workbench/api/worker/extHostExtensionService.ts**: Structural Hub (Reach: 3464) ➔ Behavioral Rank Dropped (Reach: 31, In: 0) - *Type Registry 착시 의심*
- **src/vs/workbench/contrib/debug/browser/debug.contribution.ts**: Structural Hub (Reach: 3464) ➔ Behavioral Rank Dropped (Reach: 603, In: 0) - *Type Registry 착시 의심*
- **src/vs/workbench/api/common/extHostRequireInterceptor.ts**: Structural Hub (Reach: 3462) ➔ Behavioral Rank Dropped (Reach: 597, In: 0) - *Type Registry 착시 의심*

---

## 5. Composition Delta (Largest SCC 성분 변화)
가장 거대한 순환 의존성 덩어리(Largest SCC)가 어떻게 재편되었는가?

### Structural SCC Composition
- extensions/copilot/src: 832 nodes (30.8%)
- src/vs/workbench/contrib: 572 nodes (21.2%)
- src/vs/editor/contrib: 156 nodes (5.8%)
- src/vs/editor/common: 139 nodes (5.2%)
- src/vs/workbench/services: 98 nodes (3.6%)
- src/vs/base/browser: 87 nodes (3.2%)
- src/vs/editor/browser: 70 nodes (2.6%)
- extensions/typescript-language-features/src: 62 nodes (2.3%)
- src/vs/platform/agentHost: 42 nodes (1.6%)
- src/vs/platform/userDataSync: 29 nodes (1.1%)

### Behavioral SCC Composition
- extensions/copilot/src: 99 nodes (56.9%)
- src/vs/editor/common: 15 nodes (8.6%)
- src/vs/base/browser: 14 nodes (8.0%)
- src/vs/workbench/contrib: 10 nodes (5.7%)
- src/vs/platform/extensionManagement: 9 nodes (5.2%)
- src/vs/workbench/services: 7 nodes (4.0%)
- extensions/git/src: 6 nodes (3.4%)
- src/vs/platform/files: 1 nodes (0.6%)
- src/vs/platform/contextkey: 1 nodes (0.6%)
- src/vs/platform/quickinput: 1 nodes (0.6%)

---
*Report Generated by SYNAPSE Architecture Engine (Phase 25)*
