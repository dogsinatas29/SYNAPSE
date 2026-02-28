# SYNAPSE v0.2.14 Release Notes

## 🇬🇧 English
### New Features & Enhancements
* **Flowchart Geometric Shapes in Graph View**: 
  * The Graph View nodes now render in standard flowchart shapes rather than generic rectangles.
  * **Decision (If/Switch)** nodes and modules related to validation/checking (`valid_`, `checker`, `is_`) now render as **Diamonds** (`◈`).
  * **Loop (For/While)** nodes and modules related to iteration (`loop`, `iter`) now render as **Hexagons** (`↻`).
  * **Print (I/O)** nodes now render as **Parallelograms** (`🖨️`).
  * Semantic analysis of filenames natively integrates these shapes into your global architecture map, dramatically increasing readability and code flow comprehension.

## 🇰🇷 한국어
### 주요 기능 및 개선 사항
* **Graph View 내 순서도 기하학 도형 반영**: 
  * 이제 Graph View의 노드들이 단순한 직사각형을 넘어 표준 순서도 도형으로 렌더링됩니다.
  * **조건문(If/Switch)** 및 검증 관련 모듈(`valid_`, `checker`, `is_` 등)은 **다이아몬드(Diamond)** 도형(`◈`)으로 표시됩니다.
  * **반복문(For/While)** 및 반복 관련 모듈(`loop`, `iter` 등)은 **육각형(Hexagon)** 도형(`↻`)으로 표시됩니다.
  * **출력(Print)** 노드는 **평행사변형(Parallelogram)** 도형(`🖨️`)으로 표시됩니다.
  * 파일명의 의미론적 분석(Semantic Analysis)을 통해 글로벌 아키텍처 맵에 이러한 도형들이 자동 반영되어, 시각적 가독성과 코드 흐름 이해도를 획기적으로 향상시켰습니다.
