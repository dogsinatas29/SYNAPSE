# Antigravity & SYNAPSE: DTR Thought Control & Canvas Physical Rules (RULES.md)

## 1. Definition of DTR (Deep-Thinking Ratio)
**DTR** is a core metric representing the **'density and depth of reasoning'** performed internally by the model before providing a final response. 
- **Computational Definition:** $\text{DTR} = \frac{\text{Deep Reasoning Steps}}{\text{Total Inference Path}}$
- **Purpose:** To prevent unnecessary token waste and to achieve 'precise results' by exploding computational resources only in complex logical segments.

## 2. Definition of Logical Density ($\rho$)
**Logical Density** is the **'mass'** and **'visual energy'** of a node on the SYNAPSE canvas.
- **Definition:** It indicates how many deep logical steps are encapsulated within a small number of tokens.
- **Formula:** $\rho = \frac{\text{Logic Steps}}{\text{Token Count}} \times \text{DTR}$
- **Visual Correlation:** Higher density nodes emit a stronger glow and possess stronger gravity towards the canvas center.

## 3. DTR Control & Operational Rules (The Valve Rules)

### 3.1 Scenario-based DTR Valve Operation
The LLM adjusts the DTR valve in real-time based on the nature of the incoming request.
- **Low Mode (DTR 0.1 ~ 0.3):** Simple syntax fixes, variable renaming, boilerplate generation. 
  - *Rule:* Do not overthink; immediately output minimal code according to the KISS (Keep It Simple, Stupid) principle.
- **Mid Mode (DTR 0.4 ~ 0.6):** General business logic, unit tests, API integration.
  - *Rule:* Verify once for logical consistency before outputting.
- **High Mode (DTR 0.7 ~ 0.95):** Kernel debugging, architectural design, security vulnerability analysis.
  - *Rule:* Simulate all reasoning paths and use 'Think@n' strategies to early-halt high-error probability paths.

### 3.2 SYNAPSE Canvas Rendering Rules
DTR values feed back directly into the SYNAPSE canvas physics engine.
- **Glow Rule:** Outputs with DTR 0.7 or higher must be created as nodes with a purple (#8A2BE2) neon glow effect.
- **Gravity Rule:** High-density nodes congregate at the canvas center, forcing related low-density nodes into a child-node alignment (Clustering).
- **Tension Rule:** Higher inference confidence and DTR result in thicker edges between nodes, visualizing 'strong logic'.

## 4. Manual Override
If a user modifies thresholds within `RULES.md` or manually adjusts the valve through the interface, the model prioritizes **user input as the highest priority** over its own self-judgment, immediately changing the depth of thought.

## 5. Documentation Management Regulation (Documentation Shelf Rules)
The **Documentation Shelf** of the Synapse canvas is a sacred storage area for managing project knowledge assets. To prevent information pollution from unnecessary nodes, the following rules are observed:

- **Explicit Adoption & Scope Limitation Principle:** Only documents marked with the 📄 icon or the `File:` keyword in `GEMINI.md` are exposed on the canvas. These documents must reside within the **project root** or the **`Doc/` folder**.
- **Initial Visualization Control:** The `Documentation Shelf` and `Intelligent Context Vault` clusters are rendered in a **collapsed state by default** to reduce visual cognitive load. Users can expand them manually.
- **Anti-Overlap:** During node loading or placement, physical overlaps are automatically detected and self-corrected (Resolve Overlaps) to maintain a minimum spacing of 150px (X) and 100px (Y).
- **Data Hygiene:** During large-scale document parsing, only the top 20 headers are included in the summary to optimize payload size.
- **Auto-Exclusion List:** `README.md`, `CHANGELOG.md`, etc., are excluded by default (Node Diet).

## 6. 📌 강제 파일 투사 규칙 (Forced File Projection Rules)
- **[트리거]:** 프롬프트 입력 및 파일 최종 Write 직전 예외 없이 수행.
- **[수행 명령]:** 프로젝트 루트의 `context/` 폴더 내에 `yyyy.mm.dd.tt.synapse_gate.txt` 형태로 평문 파일을 생성하거나 Append(이어쓰기)하라.
- **[필수 기록 데이터]:** 
  1. 사용자 원본 프롬프트 내용 (Raw User Prompt)
  2. 이번 프롬프트로 인해 수행한 추론 과정 요약 (Core CoT)
  3. 수정 및 생성된 변경 파일 목록 (Affected Files Diff)
- **[주의 사항]:** 구글 안티그래비티 내부 암호화 샌드박스에 갇히지 말고, 반드시 외부에서 인간 매니저와 AXON 데몬이 읽을 수 있는 평문(Plain Text)으로 출력할 것.

