const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../../mile_stone/v0.3.34.45.md');

const contentToAppend = `
---

### 4. Phase 5.5-B 추출 프로토콜 보완 (Edge Semantic Equivalence)
- **0순위 규칙 추가 (Edge Semantic Equivalence):** 
  - 추출 방법(AST)보다 중요한 것은 관측 대상의 **의미 일치**이다. 
  - TS의 \`import\`(모듈 의존성)와 C의 \`#include\`(전처리 의존성)가 과연 동일한 아키텍처 의존성(Architectural Dependency)을 표현하는가? 이 의미적 동치성이 증명되어야만 Cross-Project 비교가 성립한다.
- **blastRadius 보류 (Phase 5.5-C로 이동):**
  - 현재 목표는 \`fanIn\`과 \`fanOut\` 두 축의 독립성 증명에 집중한다. SYNAPSE 외부에서 측정된 적 없는 \`blastRadius\`는 B 단계에서 완전히 배제한다.

### 5. 추출기 작성 시작 (VS Code Sample)
- 대상: VS Code \`src/vs/base\`, \`src/vs/platform\`
- 목적: AST 기반 정규화된 파일 단위 \`fanIn\`, \`fanOut\` 추출 파이프라인(Edge Semantic Equivalence 검증용) 구축.
`;

fs.appendFileSync(filePath, contentToAppend, 'utf8');
console.log('Appended Edge Semantic Equivalence to milestone document successfully.');
