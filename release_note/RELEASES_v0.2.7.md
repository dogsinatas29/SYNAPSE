# SYNAPSE Release Notes - v0.2.7

## 🛡️ Robust Architecture Hygiene

This release focuses on hardening the project bootstrapping process and ensuring a clean, accurate visualization of your architecture.

### [New] Deep Filtering Logic
The `GeminiParser` now implements a more sophisticated content filtering engine to prevent "ghost nodes" from appearing in your canvas. It automatically strips:
- **Tilde Code Blocks**: ` ~~~ ` logic examples are now correctly ignored.
- **Triple Backtick Blocks**: ` ``` ` nested code snippets are thoroughly filtered.
- **Inline Backticks**: Technical terms like `` `login.py` `` in sentences no longer trigger accidental node creation.
- **HTML Comments**: Template instructions within `<!-- ... -->` are hidden from the scanner.

### [New] Formal Node Rules in GEMINI.md
We've introduced a standardized section for `GEMINI.md` to help both humans and AI understand the project's boundaries:
- **🛡️ Node Rules**: Defines what qualifies as a valid node (real file paths, standard icons).
- **🚫 Exclusion Rules**: Explicitly lists items to be ignored (code blocks, comments, documentation files), enforcing the **Node Diet** principle.

---

## 🚀 Release v0.2.7 (한글)

### 🛡️ 더욱 강력해진 아키텍처 정화 (Architecture Hygiene)

이번 0.2.7 릴리즈는 프로젝트 초기화(Bootstrap) 과정을 더욱 견고하게 다듬어, 캔버스에 "유령 노드(Ghost Nodes)"가 생기지 않도록 하는 데 집중했습니다.

### [신규] 심층 필터링 로직 도입
`GeminiParser`에 더욱 정교한 콘텐츠 필터링 엔진이 탑재되었습니다. 다음 항목들을 분석 전 자동으로 제거합니다:
- **틸드 코드 블록 (~~~)**: 마크다운 예제 코드 내의 파일명이 노드로 오해받는 것을 방지합니다.
- **백틱 코드 블록 (```)**: 중첩된 코드 조각들을 완벽하게 필터링합니다.
- **인라인 백틱 (`...`)**: 문장 속의 `` `login.py` ``와 같은 기술 용어가 노드로 생성되는 것을 막습니다.
- **HTML 주석 (<!-- ... -->)**: 템플릿 안내문 등 주석 처리된 내용이 스캔되지 않도록 보호합니다.

### [신규] GEMINI.md 내 표준 노드 규칙 정의
사람과 AI 모두가 일관된 기준으로 프로젝트 구조를 이해할 수 있도록 `GEMINI.md`에 표준 섹션을 추가했습니다:
- **🛡️ Node Rules (노드 생성 규칙)**: 유효한 노드의 기준(실제 파일 경로, 아이콘 규격 등)을 정의합니다.
- **🚫 Exclusion Rules (제외 규칙)**: 스캔에서 제외할 항목들을 명시하여 **Node Diet** 원칙을 강제합니다.
