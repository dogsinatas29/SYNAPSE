const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../../mile_stone/v0.3.34.45.md');

const contentToAppend = `
---

### 6. Phase 5.5-B 추출 프로토콜 확정 (Projection Equivalence)
- **핵심 목표:** 도구(Tool)의 종속을 피하고, 투영 동등성(Projection Equivalence)을 확보한다.
- **프로토콜 명세 (Requirement):**
  1. **AST-level Extraction:** 단순 텍스트 정규식이 아닌 구문 트리 수준에서 명시적 정적 의존성(Explicit Static Dependency)만을 추출한다.
  2. **Internal Resolution:** 추출된 참조 문자열(예: \`<linux/sched.h>\` 또는 \`'vs/base/common/uri'\`)을 프로젝트 내부의 물리적 파일 절대 경로로 완벽히 해소(Resolution)해야만 Edge로 인정한다.
  3. **External Pruning:** 해소되지 않는 외부 의존성은 모두 버린다.
- **구현(Implementation) 방침:**
  - 도구 특정 금지: Tree-sitter는 현재의 유력한 후보일 뿐, libclang이나 컴파일러 API 등 무엇을 쓰든 위 요구사항을 만족하고 결과가 같다면 무방하다.
  - 다음 단계: 
    1. TS 추출기 하드코딩 제거 (명령어 인수 기반).
    2. Linux AST 추출 및 Resolution 가능성(POC) 검증 우선 수행.
    3. 동일 밀도의 프로토콜이 양립 가능함이 입증되면 전체 스캔으로 확대.
`;

fs.appendFileSync(filePath, contentToAppend, 'utf8');
console.log('Appended Projection Equivalence to milestone document successfully.');
