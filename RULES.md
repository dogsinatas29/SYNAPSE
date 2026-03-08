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
