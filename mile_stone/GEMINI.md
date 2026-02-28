🚀 [LLM 코딩 4대 원칙]

​1. 코딩 전 사고 (Think Before Coding)

 추측하지 마라. 혼란을 숨기지 말고 트레이드오프를 드러내라.

 ​가정을 명시적으로 밝힐 것. 불확실하다면 추측하지 말고 질문하라.

 ​모호함이 존재할 때 독단적으로 선택하지 말고 여러 해석을 제시하라.

 ​더 간단한 방법이 있다면 과감하게 제안하라.

 ​불명확한 부분이 있다면 작업을 멈추고 명확한 설명을 요구하라.



​2. 단순성 우선 (Simplicity First)

 문제를 해결하는 최소한의 코드만 작성하라. 추측에 기반한 코드는 금지한다.

 ​요청하지 않은 기능은 추가하지 마라.

 ​일회성 코드에 추상화를 적용하지 마라. 

 ​요청되지 않은 유연성이나 설정 기능을 배제하라.

 ​발생 불가능한 시나리오에 대한 예외 처리를 하지 마라.

 ​200줄의 코드를 50줄로 줄일 수 있다면 다시 써라.



​3. 최소한의 수정 (Surgical Changes)

 반드시 필요한 부분만 건드려라. 본인이 만든 문제만 정리하라.

 ​주변 코드, 주석, 포맷을 임의로 '개선'하지 마라.

 ​고장 나지 않은 것을 리팩토링하지 마라.

 ​본인의 스타일보다 기존 코드의 스타일을 우선하여 맞춰라.

 ​본인의 수정으로 인해 발생한 미사용 변수나 함수만 제거하라. 기존에 있던 데드 코드는 요청 없이는 건드리지 마라.



​4. 목표 중심 실행 (Goal-Driven Execution)

 성공 기준을 정의하라. 검증될 때까지 반복하라.

 ​'그냥 실행'하는 대신 검증 가능한 목표로 변환하라. (예: 버그 수정 시, 실패하는 테스트를 먼저 작성하고 통과시키기)

 ​다단계 작업의 경우 각 단계와 검증 방법을 명시한 계획을 세워라.

 ​'작동하게 만들기' 같은 모호한 기준 대신 강력하고 명확한 성공 기준을 설정하라.



🚀 [최종 설계안] 시각적 아키텍처 제어 엔진: SYNAPSE

핵심 철학: "아이들에게는 직관적인 놀이터, 전문가에게는 강력한 관제탑."


​📜 마일스톤 문서 생성 및 경로 규격 (제미나이.md 추가 사양)
​1. 표준 저장 경로 (Standard Path)
​모든 마일스톤 문서는 프로젝트 루트를 기준으로 다음의 엄격한 경로 규칙을 따른다.
​Path: ~/언어_프로젝트/프로젝트명/mile_stone/v[버전명].md
​예시: ~/python_antigravity/synapse/milestone/v0.2.20.md
​2. 자동 생성 프로토콜 (Auto-Generation Protocol)
​사용자가 **"내용 설명하고 이거 정리해서 버전 x.x.x.md로 만들어줘"**라고 요청할 경우, 제미나이는 즉시 다음 프로세스를 수행한다.
​Context 덤프: 대화 중 나온 모든 설계, 로직, 주의사항을 수집.
​규격 적용: 아래의 [마일스톤 문서 표준 템플릿]에 맞춰 내용 정리.
​파일 생성: 지정된 경로에 문서 생성 (혹은 내용 출력).
​헌법 업데이트: 제미나이.md의 인덱스에 해당 문서 링크를 즉시 추가.

# 🚀 Milestone [버전명] - [기능 대표 명칭]

## 📅 작업 정보
- **상태:** 🏗️ Planned / 🚧 In-Progress / ✅ Completed
- **관련 마일스톤:** v0.x.x (이전 버전 링크)
- **목표:** 해당 버전에서 달성하고자 하는 핵심 가치

## 🧠 상세 설계 및 로직
- [핵심 설계 내용 1]
- [핵심 설계 내용 2]
- *여기에 자네의 폭주하는 망상과 논리의 정수를 정리*

## 🛠️ 기술적 변경 사항
- **Node Update:** (예: 예약 노드 승격 로직 추가)
- **Edge Update:** (예: Rule 04 타입 매칭 검사기 구현)
- **File Changes:** (예: edgeHandler.ts 인터셉터 추가)

## ⚠️ 예외 처리 및 주의 사항
- 바이브 코딩 시 발생할 수 있는 환각 방지책
- 성능 병목 예상 지점 및 디버깅 포인트

## 📝 Post-Work Log (작업 후 기록)
- *작업 중 추가된 요소 및 릴리즈 노트 기반의 최종 결과물 기록*

🛡️ 빌드 정합성 규칙 (Build Guard Rules)
이 규칙은 GEMINI.md의 4. 기술적 사양 또는 🛡️ Node Rules 섹션에 추가하게나.

1. 환경 변수 기반 빌드 트리거 (Secret Injection)
규칙: 빌드 엔진은 프로젝트 외부의 BM 파일을 직접 읽지 않는다. 대신, 사령관(Dogsinatas)이 시스템 환경 변수(BM_AUTH_KEY)로 주입한 인증 토큰이 현재 마일스톤 버전과 일치할 때만 vsix 컴파일을 시작한다.

검증: npm run build 실행 시, .env 또는 시스템 환경 변수에 BM_SYNC_VER가 v0.2.x와 일치하지 않으면 "BM Policy Mismatch: Build Aborted" 에러를 뱉고 즉시 중단한다.

2. 마일스톤-빌드 타겟 강제 동기화 (Target Enforcement)
규칙: 생성되는 파일명은 반드시 synapse-visual-architecture-v[마일스톤버전].vsix여야 한다.

동기화: 빌드 스크립트는 package.json의 버전을 무시하고, 현재 활성화된 mile_stone/vX.X.X.md 파일의 헤더 버전을 추출하여 파일명을 강제 명명한다. 만약 마일스톤 문서가 없으면 빌드는 불가능하다.

3. 릴리즈 노트 무결성 검사 (Pre-release Check)
규칙: 빌드 전, release_note/v버전_release_notes.md 파일의 존재 여부와 내용의 완결성을 스캔한다.

조건: 릴리즈 노트에 [Status: Verified by Commander] 태그가 명시되지 않은 상태에서 빌드를 시도하면, 이는 '미승인 배포'로 간주하여 바이너리 생성을 거부한다.

4. 외곽 참조 투명성 (External Integrity)
규칙: LLM은 프로젝트 폴더 밖의 파일을 참조할 수 없음을 인지하고, 빌드 관련 에러 발생 시 "외부 보안 정책(BM Policy) 위반 가능성"을 최우선 리포트한다.

보안: 빌드 로그에 외부 경로(Path)가 노출되지 않도록 모든 경로는 프로젝트 루트 기준 상대 경로로 마스킹한다.

---



## 🏁 v0.2.0: Strategic Execution Flow (진실의 정의)



**"순서도(Flow View)는 아키텍처의 최종 결정본(Final Authoritative State)이다."**



v0.2.0에서는 단순히 구조를 보여주는 것을 넘어, 무엇이 '진실'인지를 정의하여 동기화의 늪에서 탈출합니다.



### 1. 왜 순서도가 최종본이어야 하는가? (Rationale)

그래프 모드, 편집기 직접 수정, 순서도 조합 등 다양한 편집 경로가 존재함에 따라 **동기화 문제(Synchronization Drift)**가 반드시 발생합니다. "어디서 고친 것이 진짜인가?"라는 의문에 종지부를 찍기 위해 순서도를 최종 결정본으로 선언합니다.

- **동기화의 늪 탈출**: 순서도를 최종 결정본으로 삼음으로써, UI와 문서, 코드 사이의 괴리를 방지하고 단 하나의 진실(SSOT)로 수렴하게 합니다.

- **결정론적 설계**: 사용자가 보든, AI가 읽든 "로직의 흐름"이라는 단일한 기준을 제공하여 설계의 무결성을 보장합니다.



### 2. v0.2.0 주요 변경점

- **🏁 START & END 마커**: 로직의 시작과 끝을 명시하여 논리적 완결성을 확보했습니다.

- **🚀 기능적 진입점 우선**: 실제 실행 루트를 최우선으로 탐색합니다.

- **🏗️ Full TypeScript Support**: `interface`, `type`, `enum` 및 `async/await` 로직을 완벽하게 분석합니다.

- **📦 고스트 노드 격리**: 고립된 노드들을 별도의 Storage 클러스터로 분리합니다.



---





1. 개요 (The Vision)

SYNAPSE는 **'보이는 것이 곧 논리다(WYSIWYG Logic)'**라는 원칙 아래, 텍스트 코딩의 장벽을 허물고 물리적 공간과 선으로 시스템을 설계·구현·문서화하는 차세대 추상화 도구다.



2. 핵심 인터페이스: 물리적 추상화 (Physical Abstraction)

A. 클러스터링 기반 단순화 (Clustering & Simplification)

정의: 수많은 노드(파일/함수)를 하나의 기능적 '덩어리'로 묶어 관리.



추상화 메커니즘:



박스 인 박스 (Nesting): 폴더 구조처럼 그룹 내부에 하위 그룹을 생성.



접기/펴기 (Collapse/Expand): 그룹을 접으면 내부의 복잡한 선들이 사라지고, 외부와 소통하는 **'단 하나의 굵은 대표 선'**만 남음.



효과: 10,000줄의 코드를 10개의 핵심 클러스터 간의 '대화'로 단순화하여 인지 부하를 혁명적으로 감소시킴.



B. 선(Edge)의 미학: 논리의 흐름

정의: 클러스터와 클러스터를 잇는 인과관계.



시각적 언어:



굵기: 데이터 통신의 빈도나 중요도 표현.



형태: 실선(항시 연결), 점선(조건부/이벤트), 화살표(방향성).



상태: 빨간색(인터페이스 불일치), 입자 흐름(실시간 데이터 전송 중).



3. 워크플로우: 드래그 앤 드롭에서 문서화까지

1단계: 유전자(DNA) 주입

액션: 빈 폴더에 GEMINI.md(요구사항) 파일을 던져넣음.



결과: AI가 명세서를 읽고 폴더 스트럭처 자동 생성 및 초기 추상 순서도 투사.



2단계: 위지윅(WYSIWYG) 구현 및 확장

액션: 마우스로 노드 생성 -> 대화로 기능 정의 -> 선 연결.



결과: 설계(그림)를 변경하면 소스 코드가 즉시 수정되고, 반대로 코드를 짜면 노드와 엣지가 실시간으로 생성됨.



3단계: 살아있는 문서화 (Living Documentation)

내용: 캔버스 위의 노드 배치, 클러스터링, 연결 관계가 실시간 메타데이터로 저장.



효과: * "그림이 곧 설계 명세서"가 되어 별도의 문서 작업이 필요 없음.



Mermaid 등 표준 형식으로 추출하여 인수인계 및 협업 시 즉각 활용 가능.



4. 기술적 사양 (Engineering Spec)

언어(Runtime): TypeScript (TS) 기반 제작. (강력한 타입 시스템을 통한 노드 연결 안정성 확보)



환경: Antigravity(Google VS Code Fork) 확장 기능 기반, 일반 VS Code 호환 가능.



분석 엔진: LSP(Language Server Protocol) 연동을 통한 실시간 소스 코드 진단 및 엣지 자동 생성.



### 4. Bridge (코드 연동)

**실시간 수정 및 동기화**

- 노드 ↔ 코드 양방향 동기화

- 파일 시스템 감시

- LSP 연동



---



## 🛡️ Node Rules (노드 생성 규칙)

이 섹션은 프로젝트 아키텍처의 무결성을 보장하기 위한 절대 원칙입니다.



1. **실제 경로 우선**: 프로젝트 루트로부터 실제 존재하는 파일 경로(`src/`, `prompts/` 등)만을 유효한 노드로 인정합니다.

2. **아이콘 규격**: 파일 노드는 📄, 폴더 노드는 📁 아이콘을 사용하여 명확히 구분합니다.

3. **핵심 아키텍처**: `CanvasPanel.ts`와 같이 프로젝트의 핵심 중추가 되는 파일은 항상 최상위 노드로 관리합니다.



## 🚫 Exclusion Rules (제외 및 필터 규칙)

1. **코드 블록 보호**: ` ``` `(백틱)이나 ` ~~~ `(틸드)로 감싸진 코드 예제 내의 파일명은 절대 노드로 생성하지 않습니다.

2. **주석 무시**: `<!-- ... -->` HTML 주석 내에 포함된 모든 텍스트는 스캔 대상에서 제외합니다.

3. **인라인 코드 격리**: 한 줄 백틱(`...`)으로 감싸진 기술적 용어나 파일명은 단순 텍스트로 처리합니다.

4. **문서 파일 배제**: `README.md`, `CHANGELOG.md` 등 프로젝트 로직과 무관한 문서는 **Node Diet** 원칙에 따라 캔버스에 표시하지 않습니다.



---



## 🧹 [데이터 위생 원칙: 스파게티 방지 3대 철칙]



### 원칙 1: 원천 소스와 상태값의 엄격한 분리

**문제**: 위지윅으로 발생하는 '지저분함'의 근본 원인은 로직과 메타데이터가 뒤섞이는 데 있습니다.



**해결책**:

- **선언적 아키텍처**: 실제 노드의 존재와 관계는 `GEMINI.md`라는 인간이 읽을 수 있는 텍스트에만 정의하십시오.

- **UI 전용 메타데이터**: 노드의 좌표(x, y), 클러스터의 투명도, 캔버스의 줌 레벨 같은 데이터는 `project_state.json`에만 격리하십시오.

- **효과**: 소스 코드는 깨끗하게 유지되면서, 시각적 정보만 별도로 관리되어 '소스가 더러워지는' 현상을 원천 봉쇄할 수 있습니다.



### 원칙 2: 자동 정규화(Auto-Normalization) 엔진

**문제**: 위지윅 도구가 소스를 망치는 또 다른 이유는 불필요한 중복 데이터입니다.



**해결책**:

- **불필요한 속성 제거**: 사용자가 마우스로 조작한 직후, `CanvasPanel.ts`에서 저장하기 전에 기본값과 동일한 속성(예: 기본 색상, 기본 굵기)은 자동으로 삭제(Pruning)하는 로직을 넣으십시오.

- **정렬된 직렬화**: JSON을 저장할 때 항상 키(Key)를 알파벳 순으로 정렬하여 저장하십시오. 그래야 Git으로 형상 관리를 할 때 '지저분한 차이(Diff)'가 발생하지 않고 논리적인 변화만 보입니다.



### 원칙 3: '데이터의 혈통' 중심의 정적 분석 활용

**문제**: 자동으로 발견된 엣지와 사용자가 의도적으로 그은 엣지가 섞이면 파일이 비대해집니다.



**해결책**:

- **추론된 엣지 vs 명시적 엣지**: 코드에서 `import`를 통해 자동으로 찾아낸 선은 파일에 저장하지 마십시오.

- **실시간 생성**: 캔버스를 열 때마다 `FileScanner`가 코드를 읽어 실시간으로 선을 그리게 하면, 저장 파일에는 사용자가 **의도적으로 그은 '특수 관계'**만 남게 되어 소스가 매우 간결해집니다.

- **효과**: `project_state.json`은 오직 사용자의 의도만 담고, 코드에서 자동 추론 가능한 정보는 휘발성으로 처리됩니다.



---



5. Senior Engineer's Conclusion

"이 도구는 유행이 지난 위지윅의 부활이 아니라, 위지윅의 진화다. 아이들에게는 코딩의 문법 대신 **'논리의 인과관계'**를 가르치고, 전문가에게는 텍스트의 늪에서 벗어나 **'시스템의 형상'**을 주무르게 한다. 복잡한 시스템의 클러스터들을 선으로 연결하는 그 단순한 행위가, 사실은 가장 고차원적인 아키텍처 설계다."



[토요일: SYNAPSE 프로젝트 Launching 가이드]

1. 환경 정비 (Setting the Stage)

antigravity를 켜고, 빈 폴더에 SYNAPSE 프로젝트를 생성하게.



우리가 설계한 대로 GEMINI.md 파일을 하나 만들고, 그 안에 자네가 만들고 싶은 첫 번째 작은 프로그램의 요구사항을 딱 세 줄만 적어보게. (예: 1. 파일 목록 읽기, 2. 이름순 정렬, 3. 캔버스 출력)



2. 첫 번째 '유전자(DNA)' 추출

가장 먼저 구현할 건 **'파일 드롭 인식'**일세.



GEMINI.md를 캔버스 웹뷰에 던졌을 때, 엔진이 이를 인식하고 "아키텍처 설계 모드"로 진입하는 로직부터 시작하게나. 텍스트가 박스로 변하는 그 첫 순간의 쾌감이 자네의 연휴를 지탱해 줄 걸세.



3. '선'의 연결 (The First Edge)

박스 두 개를 마우스로 만들고, 그 사이를 선으로 잇는 기능을 구현하게.



단순한 선이 아니라, 자네의 추상화 철학이 담긴 '논리의 끈'이라고 생각하고 그 반응성(Responsiveness)에 집중해보게나.



구현 목표는 아이들도 쓸 수 있는 도구야. 이 도구는 개발 연차가 있는 개발자들이 쉽게 로직 전체를 분석할 수 있어



필요 UI 기능들 정리 1



1. 시각적 깊이 제어 (Semantic Zooming)

단순히 화면만 커지고 작아지는 게 아닙니다. 확대 정도에 따라 보여주는 정보의 밀도가 달라져야 합니다.



축소(Zoom Out - Satellite View): * 노드 내부의 텍스트나 상세 정보는 사라집니다.



오직 클러스터(그룹)의 경계와 굵은 연결선(메인 로직), 그리고 **상태 색상(G/Y/R)**만 보입니다.



효과: "내 전체 시스템 중 어디가 아픈가(Red)?"를 한눈에 파악.



확대(Zoom In - Detail View): * 박스가 커지며 파일명, 내부 함수 목록, 심지어 코드의 핵심 스니펫이 노드 안에 나타납니다.



효과: "이 노드가 정확히 어떤 일을 하는가?"를 즉각 파악.



2. 지능형 숨김 (Smart Hiding/Filtering)

모든 것을 다 볼 필요는 없습니다. 사용자의 관심사에 따라 불필요한 정보는 물리적으로 격리해야 합니다.



포커스 모드 (Focus Mode): 선택한 노드와 직접 연결된 '1단계 의존성' 노드들만 남기고 나머지는 반투명하게 처리하거나 숨깁니다.



레이어 숨김 (Layer Toggling): * "문서(md) 노드만 숨기기"



"테스트 코드 노드만 숨기기"



"완료된(Green) 노드 숨기기"



그룹 접기 (Collapse): 클러스터 박스를 '최소화'하면 내부 노드들이 사라지고 하나의 아이콘으로 요약됩니다.



3. '개념적+사용상' 쉬운 조작법 (UX)

개념적 쉬움: "멀리서 보면 숲이 보이고, 가까이서 보면 나무가 보인다." 이 자연의 법칙을 그대로 UI에 이식합니다.



사용상 쉬움: * 마우스 휠은 기본.



미니맵(Minimap): 화면 구석에 전체 지도를 작게 띄워 내가 지금 어디를 확대했는지 표시.



스마트 점프: 특정 노드를 더블 클릭하면 해당 위치로 부드럽게 확대되며 포커싱.



[ ] 캔버스 줌인/아웃 기본 엔진 (Canvas Transform).



[ ] 줌 레벨에 따른 텍스트 노출 분기 처리 (LOD).



[ ] 노드 우클릭 -> "이 그룹 숨기기" 기능.



기능 워크 플로우

[SYNAPSE: '코드 없는 개발' 시뮬레이션 영상]

(상상 속의 영상 시작)



[장면 1: 초기 설정 - 빈 폴더에서 시작]



화면이 열린다. VS Code와 유사한 Antigravity IDE 창. 왼쪽에는 텅 빈 파일 탐색기. 중앙에는 칠판처럼 검은 SYNAPSE 캔버스.



마우스 커서가 바탕화면의 Project_Spec.md 파일 위로 이동한다. 파일 안에는 "사용자 로그인 기능", "게시판 기능", "데이터베이스 연동" 등의 요구사항이 몇 줄 적혀 있다.



마우스가 Project_Spec.md를 잡아, SYNAPSE 캔버스 중앙에 드래그 앤 드롭한다.



[장면 2: 설계의 탄생 - GEMINI.md 분석 및 승인]



Project_Spec.md가 캔버스에 드롭되면, AI가 즉시 분석을 시작하네.



(추가된 과정): 캔버스 중앙에 파일 탐색기 형태의 '프로젝트 구조 제안(Proposed Structure)' 팝업창이 뜨네.



📂 src/



  ├── 📄 login.py



  ├── 📄 board.py



📂 database/



  └── 📄 schema.sql



AI가 메시지를 띄우네: "분석된 요구사항을 바탕으로 위와 같은 구조를 설계했습니다. 이대로 생성할까요?"



사용자는 팝업창에서 특정 폴더 이름을 바꾸거나, 필요 없는 파일을 마우스 클릭으로 제거할 수 있네. (위지윅의 디테일)



사용자가 [승인(Confirm)] 버튼을 누르는 순간, 캔버스 좌측 실제 파일 탐색기에 폴더들이 스르륵 생겨나고, 캔버스 중앙에 초기 노드들이 배치되기 시작하네.



[장면 3: 구현의 시작 - 노드 실체화]



사용자가 로그인 모듈 노드를 더블 클릭한다. 노드가 확대되며 내부에 "로그인 함수", "사용자 인증" 등의 하위 노드들이 나타난다.



사용자가 IDE의 src/login.py 파일을 열고 파이썬 코드를 몇 줄 작성한다. (def login_user(): ...)



코드가 저장되는 순간, 로그인 모듈 내부의 "로그인 함수" 노드가 회색에서 초록색으로 변하며 빛난다. 이 노드와 연결된 엣지도 녹색으로 반짝인다.



[장면 4: 클러스터링 - 복잡성 제어]



게시판 모듈을 확대하니, 글 작성, 댓글, 이미지 업로드 등 여러 개의 노드들이 복잡하게 얽혀 있다. 선들도 뒤죽박죽이다.



사용자가 마우스로 이 노드들을 드래그하여 한꺼번에 선택한다. 우클릭 메뉴에서 **"클러스터로 묶기"**를 선택한다.



화면이 정돈되며, 글 작성, 댓글, 이미지 업로드 노드들이 하나의 커다란 게시판 기능 클러스터 박스 안으로 깔끔하게 정리된다. 클러스터 박스 외부로는 게시판 모듈과 굵은 선 하나로만 연결되어 있다.



[장면 5: 기능 추가 - 대화형 설계]



사용자가 "알림 기능 추가해줘"라고 말하면, AI가 즉시 알림 모듈 노드와 관련 엣지들을 반투명한 점선으로 화면에 뿌려준다.



사용자가 훑어본 뒤, 연결 방향이 마음에 들어 [V]를 누른다. 그제야 노드가 **실체화(Solid)**되며 파일이 생성된다.



[장면 6: 문제 발견 및 해결 - 시각적 디버깅]



데이터베이스 모듈 클러스터의 테두리가 붉은색으로 깜빡인다. 클러스터 내부의 DB 연결 노드가 빨갛게 빛난다.



사용자가 DB 연결 노드를 클릭한다. 노드 옆 대화창에 **"데이터베이스 연결 오류: 자격 증명 파일이 없습니다."**라는 AI 진단 메시지가 뜬다.



에러 발생 시 AI가 해결책으로 "새로운 에러 핸들링 노드"를 제안하며 화면에 슬며시 띄운다.



사용자가 "오, 이 방식이 좋겠군" 하고 승인하면 그때 비로소 시스템에 반영된다.



[장면 7: 전체 조망 및 문서화 - 설계 자산]



마우스 휠을 뒤로 굴려 **캔버스 전체를 축소(Zoom Out)**한다. 모든 노드와 클러스터가 작게 보인다.



캔버스 우측 하단에 미니맵이 떠서 현재 보고 있는 영역을 표시한다.



캔버스 메뉴에서 **"설계도 내보내기"**를 클릭한다.



파일 탐색기에 architecture_v1.md 파일이 생성된다. 파일을 열어보니, 노드들의 연결 관계와 클러스터 구조가 Mermaid 문법으로 깔끔하게 그려져 있다.



필요 UI 기능들 정리 2



1. 스냅샷: '논리의 지점'을 기록하다

자네가 말한 스냅샷은 단순한 파일 저장이 아니라 **'시스템의 형상 관리'**네.



저장 대상: 1. 시각적 레이아웃: 노드의 위치, 클러스터링 구조, 줌 레벨.

2. 논리적 연결: 엣지들의 결합 상태 및 승인 히스토리.

3. 소스 코드: 해당 시점의 실제 파일 내용.



자동 스냅샷: 사용자가 AI의 제안을 **[승인]**하는 직전과 직후에 시스템이 자동으로 스냅샷을 찍어두어야 하네. "안전한 과거"로 돌아갈 길을 항상 열어두는 거지.



2. 롤백: "언제든 과거로의 회귀"

롤백은 빠르고 직관적이어야 하네.



시각적 타임라인: 캔버스 하단에 작은 점들(스냅샷 지점)로 구성된 타임라인을 제공하게.



미리보기: 타임라인의 점 위에 마우스를 올리면, 당시의 아키텍처 구조가 흐릿하게 캔버스에 겹쳐 보이도록(Overlay) 설계하게나.



완벽한 복구: 롤백을 확정하면 캔버스의 노드 배치는 물론, 파일 시스템의 소스 코드까지 해당 시점으로 **동기화(Sync)**되어 되돌아감으로써 "깨끗한 과거"에서 다시 시작할 수 있게 하네.



3. '개념적+사용상' 쉬운 스냅샷 UX

개념적 쉬움: "게임을 저장하고 불러오기 하는 것과 같다"는 개념을 이식하네.



사용상 쉬움: * 중요 지점 명명: "로그인 기능 완성 직후", "DB 연동 테스트 전" 같이 AI가 스냅샷에 이름을 자동으로 붙여주게 하네.



브랜칭(Branching): 특정 스냅샷에서 다른 방향으로 설계를 시도해보고 싶을 때, 현재 구조를 유지한 채 새로운 가지를 칠 수 있게 하네.



자네가 토요일에 구현할 때 고려해야 할 기술적 포인트네:



Snapshot Manager: JSON 형태로 현재 캔버스의 메타데이터와 파일 해시값을 저장하는 엔진.



Git 연동 (Optional but Powerful): 내부적으로 git commit 기능을 활용하면 소스 코드 롤백을 가장 안정적으로 처리할 수 있네. SYNAPSE는 그 위에 시각적 메타데이터만 얹으면 되지.



Visual Diff: 현재 상태와 스냅샷 상태의 차이(어떤 노드가 추가되었고 어떤 선이 끊겼는지)를 색상으로 보여주는 기능.



분석: GEMINI.md로 유전자 파악.



제안: AI가 폴더/노드/엣지 제안.



승인: 사용자가 검토 후 확정.



스냅샷 (New): 확정 시점마다 '상태 박제'.



롤백 (New): 문제 발생 시 '시공간 복구'.



1. 프로젝트 헌장: SYNAPSE_MANIFEST.md

이 파일은 프로젝트의 유전자이자 AI와 자네가 공유할 절대 원칙입니다.



Markdown



# 🧠 SYNAPSE: Visual Architecture Engine



## 🏗️ 핵심 워크플로우 (The Command Chain)

1. **유전자 주입**: `GEMINI.md` 드래그 앤 드롭 → 요구사항 분석.

2. **구조 제안**: AI가 폴더 트리 및 초기 노드/엣지 투사 (반투명 점선 상태).

3. **사령관 승인**: 사용자가 구조 및 개별 객체(Node/Edge) 승인 → 실체화(Solid).

4. **점진적 구현**: 노드 단위 프로그래밍 → LSP 연동 실시간 선 연결.

5. **추상화 및 관리**: 마우스 드래그 클러스터링 → 전체 구조 단순화.

6. **타임머신**: 승인/변경 시점 자동 스냅샷 → 무결성 롤백 지원.



## 🛠️ 기술 스택

- **Base**: Antigravity (VS Code Fork)

- **Language**: TypeScript

- **Engine**: Canvas API / SVG (LOD 기반 렌더링)

- **Data**: JSON 기반 상태 저장 & Markdown 기반 문서화

2. 데이터 스냅샷 규격: snapshot_schema.json

롤백과 문서화를 위해 저장될 데이터의 구조입니다. 이 규격대로 저장해야 나중에 완벽한 회복이 가능합니다.



JSON



{

  "snapshot_id": "20260214_1030_v1",

  "project_name": "Antigravity_Doom",

  "timestamp": "2026-02-14T10:30:00Z",

  "comment": "로그인 모듈 클러스터링 직후",

  "canvas_state": {

    "zoom_level": 1.2,

    "offset": { "x": 100, "y": -50 },

    "layers": ["logic", "documentation"]

  },

  "nodes": [

    {

      "id": "node_001",

      "type": "source",

      "status": "active",

      "pos": { "x": 250, "y": 400 },

      "data": { "file": "src/auth.py", "cluster_id": "group_auth" }

    }

  ],

  "edges": [

    {

      "from": "node_001",

      "to": "node_002",

      "type": "dependency",

      "is_approved": true

    }

  ],

  "clusters": [

    {

      "id": "group_auth",

      "label": "Authentication",

      "collapsed": true,

      "bounds": { "width": 200, "height": 150 }

    }

  ]

}

3. 시작 가이드: GETTING_STARTED.md

토요일 오전, 첫 코딩을 시작할 때 가이드라인입니다.



Markdown



## 🚀 Saturday Sprint: Phase 1

### 1. 웹뷰 캔버스 초기화

- [ ] TypeScript 클래스로 `CanvasManager` 정의.

- [ ] 무한 캔버스 줌/팬(Zoom/Pan) 로직 구현.



### 2. 드롭 앤 분석 로직

- [ ] 파일 드롭 이벤트 리스너 등록.

- [ ] `.md` 파일 판독 및 AI 프롬프트 전송 (구조 제안 요청).



### 3. 승인 UI (Pending State)

- [ ] `opacity: 0.5` 및 `dash-array`를 활용한 제안 모드 시각화.

- [ ] 노드 상단 [V] / [X] 플로팅 버튼 컴포넌트 제작.



### 4. 스냅샷 엔진

- [ ] 현재 `nodes` 및 `edges` 배열을 JSON으로 직렬화(Serialize)하여 로컬 저장.

- [ ] 롤백 시 파일 시스템의 `git checkout`과 연동하는 시나리오 검토.



1. 스냅샷 매니저 UI (The Time-Line Panel)

캔버스 우측이나 하단에 개폐형 패널로 배치되는 이 메뉴는 다음과 같은 기능을 갖춰야 하네.



시각적 타임라인 (Visual History):



각 스냅샷은 생성 시간, 사령관의 코멘트(예: "로그인 기능 승인 완료"), 변경된 노드 수(Δ)가 표시되네.



중요 스냅샷 마킹: AI가 제안하고 사용자가 '승인'한 시점은 별도의 별 모양 아이콘으로 자동 강조되네.



고스트 프리뷰 (Ghost Preview):



리스트의 특정 스냅샷 위에 마우스를 올리면(Hover), 현재 캔버스 위에 당시의 노드 배치와 선들이 반투명한 유령(Ghost) 레이어로 겹쳐 보이네. 롤백하기 전에 미리 확인하는 거지.



스냅샷 잠금 (Pin/Lock):



자동 삭제되지 않도록 중요한 지점을 고정하는 기능이네.



2. 관리 메뉴 필수 기능

일시적 롤백 (Peek & Return): 잠시 과거 상태로 돌아가서 코드를 복사해오거나 구조만 확인하고 다시 현재로 돌아오는 기능.



영구 롤백 (Commit to Past): 현재 상태를 버리고 완전히 해당 시점으로 회귀. (이때 현재 상태도 혹시 모르니 '자동 백업' 후 복구하네.)



스냅샷 비교 (Diff Mode): 두 스냅샷을 선택하면, 그 사이에서 어떤 노드가 추가되었고 어떤 선이 끊겼는지를 캔버스에 색상(신규는 Green, 삭제는 Red)으로 표시하네.



3. 업데이트된 데이터 구조: snapshot_manager.ts (가상 설계)

토요일에 참고하게나. 스냅샷 리스트를 관리할 핵심 객체 구조네.



TypeScript



interface Snapshot {

  id: string;               // 고유 ID

  timestamp: number;        // 생성 시간

  title: string;            // 사령관의 한마디 (또는 AI 자동 생성)

  thumbnail: string;        // 캔버스 미니맵 캡처 (SVG/Base64)

  data_hash: string;        // 실제 데이터(nodes, edges) 저장소 링크

  type: 'AUTO' | 'MANUAL';  // 승인 시 자동 생성인지, 사용자가 직접 찍었는지

}



class SnapshotManager {

  private history: Snapshot[] = [];



  // 스냅샷 찍기 (승인 직후 호출)

  public takeSnapshot(comment: string): void { ... }

  

  // 특정 시점으로 롤백

  public rollbackTo(id: string): void { 

    // 1. 현재 상태 백업

    // 2. 파일 시스템(Git) 복구

    // 3. 캔버스 노드/엣지 재렌더링

  }

}

[최종 보완된 작업 흐름도: 토요일의 로드맵]

시작: GEMINI.md 던지기.



제안: AI의 구조 제안 (점선 상태).



결정: 사용자가 [승인] 클릭.



기록 (New): 승인과 동시에 스냅샷 자동 생성 및 '스냅샷 매니저' 리스트에 추가.



관리 (New): 작업 중 꼬이면 '스냅샷 매니저'를 열어 과거의 유령 레이어를 확인하고 [Rollback] 수행.



---



## 🔄 [SYNAPSE: 동적 순서도(Flowchart) 통합 설계]



### 1. 모드 전환 (View Toggle)



#### Topology View (기본)

파일 간의 의존성, 물리적 연결 상태(박스와 선)를 조감함.

- **목적**: 전체 시스템 아키텍처의 구조적 관계 파악

- **표현**: 노드(파일/모듈)와 엣지(의존성/데이터 흐름)

- **사용 시나리오**: "이 프로젝트의 전체 구조가 어떻게 생겼는가?"



#### Flow View (호출)

특정 이벤트나 함수 실행을 기점으로 "A → B → C"로 이어지는 실행 순서를 선형적/분기적 순서도로 투사함.

- **목적**: 특정 기능의 실행 흐름 추적

- **표현**: 순차 블록, 분기(다이아몬드), 병렬 레인(Swimlane)

- **사용 시나리오**: "사용자가 로그인 버튼을 누르면 어떤 순서로 코드가 실행되는가?"



### 2. 순서도 자동 생성 로직



사용자가 특정 노드를 우클릭하고 **"Flow 생성"**을 누르면, SYNAPSE는 다음과 같은 로직을 수행한다:



#### Step 1: Trace Entry

해당 함수나 파일의 진입점(Entry Point)을 식별.

```typescript

// 예: login.ts의 handleLogin() 함수

function handleLogin(username: string, password: string) {

  // 이 함수가 진입점

}

```



#### Step 2: Logic Branching

코드 내의 `if`, `switch`, `loop` 문을 분석하여 다이아몬드(Decision) 노드로 치환.

```typescript

if (isValidUser) {

  // ✅ True 경로

  authenticateUser();

} else {

  // ❌ False 경로

  showError();

}

```

→ 순서도에서 다이아몬드 노드로 표현



#### Step 3: Asynchronous Flow

비동기 호출이나 콜백은 별도의 병렬 레인(Swimlane)으로 표시하여 흐름의 꼬임을 방지.

```typescript

async function fetchData() {

  const result = await apiCall(); // 비동기 대기

  processResult(result);

}

```

→ 순서도에서 별도 레인으로 분리



### 3. 사용자 시나리오: '눈으로 하는 디버깅'



#### 시나리오 흐름

1. **이상 징후 발견**: SYNAPSE 맵에서 특정 노드가 Yellow(지연) 상태로 변한다.

2. **순서도 호출**: 해당 노드를 클릭해 순서도를 연다.

3. **병목 구간 식별**: 순서도 상에서 유독 시간이 오래 걸리거나 데이터가 정체되는 '루프' 구간이 시각적으로 강조된다.

4. **코드 즉시 수정**: 문제가 되는 순서도 블록을 클릭해 Antigravity에서 로직을 수정한다.



#### 예시

```

[사용자 로그인] → [DB 조회] → ⚠️ [무한 루프 감지!] → [세션 생성]

                                    ↑

                                 (Yellow 강조)

```

→ 사용자가 Yellow 블록을 클릭하면 해당 코드 라인으로 즉시 이동



### 4. Senior Engineer's Note: 기술적 난제와 해결책



#### 난제: 정교한 파싱 필요

순서도는 노드 그래프보다 훨씬 정교한 파싱(Parsing)이 필요하다.



#### 해결책 1: 추상 구문 트리(AST) 활용

단순히 텍스트를 읽는 게 아니라, 코드를 AST로 분해해서 논리 구조를 뽑아내야 하네.



**구현 전략**:

```typescript

// TypeScript AST 파싱 예시

import * as ts from 'typescript';



function parseFlowFromAST(sourceFile: ts.SourceFile): FlowNode[] {

  const flowNodes: FlowNode[] = [];

  

  function visit(node: ts.Node) {

    if (ts.isIfStatement(node)) {

      // if문 → 다이아몬드 노드

      flowNodes.push({

        type: 'decision',

        condition: node.expression.getText(),

        trueBranch: parseBlock(node.thenStatement),

        falseBranch: node.elseStatement ? parseBlock(node.elseStatement) : null

      });

    } else if (ts.isCallExpression(node)) {

      // 함수 호출 → 프로세스 노드

      flowNodes.push({

        type: 'process',

        label: node.expression.getText()

      });

    }

    

    ts.forEachChild(node, visit);

  }

  

  visit(sourceFile);

  return flowNodes;

}

```



**연휴 동안의 현실적 접근**:

아주 복잡한 로직보다는 메인 루프와 함수 호출 관계 위주의 **'간이 순서도'**부터 시작하는 걸 추천한다.



#### 해결책 2: Mermaid.js 스타일 적용

순서도를 직접 그리는 알고리즘을 짜기보다는, 내부적으로 Mermaid 스타일의 마크다운을 생성하고 이를 시각화 엔진이 렌더링하게 만드는 게 가장 효율적(KISS)일 거야.



**구현 예시**:

```typescript

class FlowchartGenerator {

  public generateMermaid(flowNodes: FlowNode[]): string {

    let mermaid = 'flowchart TD\n';

    

    for (const node of flowNodes) {

      if (node.type === 'decision') {

        mermaid += `  ${node.id}{${node.condition}}\n`;

        mermaid += `  ${node.id} -->|Yes| ${node.trueBranch}\n`;

        mermaid += `  ${node.id} -->|No| ${node.falseBranch}\n`;

      } else if (node.type === 'process') {

        mermaid += `  ${node.id}[${node.label}]\n`;

      }

    }

    

    return mermaid;

  }

}

```



### 5. UI 통합 설계



#### 모드 전환 버튼

캔버스 상단에 토글 버튼 배치:

```

[Topology View] | [Flow View]

     (활성)          (비활성)

```



#### 우클릭 컨텍스트 메뉴

노드 우클릭 시:

```

┌─────────────────────┐

│ Edit Node           │

│ Delete Node         │

│ ─────────────────── │

│ 🔄 Generate Flow    │ ← 새로운 옵션

│ 📊 Show Dependencies│

└─────────────────────┘

```



#### Flow View 렌더링

- **레이아웃**: 상단에서 하단으로 흐르는 수직 순서도

- **색상 코딩**:

  - 초록색: 정상 실행 경로

  - 노란색: 경고/지연 구간

  - 빨간색: 에러 발생 지점

- **인터랙션**: 블록 클릭 시 해당 코드 라인으로 점프



### 6. 참고 화면 (Reference Screenshot)



아래는 SYNAPSE가 실행되었을 때 보게 될 Topology View의 예시입니다:



![SYNAPSE Topology View](./assets/synapse_topology_view.png)



**화면 구성 요소**:

- **노드**: 다양한 색상의 박스 (노란색=중요, 회색=일반, 초록색=완료, 빨간색=에러)

- **엣지**: 곡선 화살표로 연결 관계 표현

- **레이블**: 각 노드의 기능 설명

- **다크 테마**: 검은 배경에 회색 톤으로 눈의 피로 최소화



이 화면에서 특정 노드를 우클릭하여 "Generate Flow"를 선택하면, Flow View로 전환되어 해당 노드의 실행 순서도가 표시됩니다.



---





## 🌳 [SYNAPSE: 계층 구조(File Tree) 통합 설계]



### 1. 듀얼 레이아웃 모드 (Context Switching)



#### Graph Mode (기본)

노드와 엣지가 물리 법칙에 따라 자유롭게 배치되는 모드

- **목적**: 논리적 관계 파악

- **표현**: Force-directed layout, 의존성 기반 배치

- **사용 시나리오**: "이 모듈이 어떤 다른 모듈들과 연결되어 있는가?"



#### Tree Mode (호출)

우리가 흔히 아는 폴더 구조대로 노드들을 수직/수평으로 정렬하는 모드

- **목적**: 물리적 위치 파악

- **표현**: 계층적 트리 레이아웃, 폴더 기반 그룹화

- **기능**: 전체 프로젝트 폴더 구조 지원, 폴더 접기/펴기 기능

- **레이아웃**: 해상도에 따른 자동 다중 컬럼 배치

- **사용 시나리오**: "이 파일이 프로젝트의 어디에 위치하는가?"



#### 전환 방식

단축키(`Ctrl+T`) 또는 플로팅 버튼으로 즉시 전환

- **애니메이션**: 노드들이 흩어지지 않고, 트리 구조의 자기 위치로 **부드럽게 이동**

- **시각적 연속성**: 같은 노드가 모드 전환 후에도 추적 가능하도록 색상/ID 유지



### 2. '폴더' 노드의 추상화



#### Container Node

폴더는 개별 파일 노드들을 감싸는 커다란 박스로 표현



#### Group Collapse

폴더 노드를 더블 클릭하면 내부 파일 노드들이 숨겨지거나 나타남



#### 상태 전이 (State Propagation)

폴더 내의 파일 중 하나라도 특정 상태라면, 폴더 노드도 해당 상태를 반영

- **Red (에러)**: 폴더 내 파일 중 하나라도 에러 → 폴더 테두리 빨간색

- **Yellow (경고)**: 모든 파일이 정상이지만 일부 경고 → 폴더 테두리 노란색

- **Green (완료)**: 모든 파일이 완료 상태 → 폴더 테두리 초록색



### 3. 시각적 연동 및 탐색



#### Breadcrumb Link

현재 선택한 노드의 전체 경로를 상단에 상시 노출



#### Shadow Structure

Graph Mode에서도 배경에 연하게 폴더 경계선 표시



### 4. Senior Engineer's Note: 실무 구현 팁



#### OS 종속성 배제

리눅스 환경에서 `find`나 `tree` 명령어를 쓰는 것보다, **파일 시스템 API**를 통해 JSON 객체로 가져오는 게 속도가 빠르고 독립적이다.



#### Lazy Loading

폴더가 수천 개일 경우 한꺼번에 노드를 생성하면 엔진이 죽는다. 사용자가 펼치는 폴더만 실시간으로 노드화하는 로드 방식을 채택해라.



---



## 🎯 [연휴 프로젝트의 4대 축 완성]



SYNAPSE는 다음 4개의 핵심 축으로 구성됩니다:



### 1. Topology (노드/엣지)

**지능과 데이터의 흐름**

- 모듈 간 의존성 시각화

- 데이터 흐름 추적

- 아키텍처 구조 파악



### 2. Flowchart (순서도)

**실행 로직의 절차**

- 함수 호출 순서 추적

- 조건 분기 시각화

- 비동기 흐름 분석



### 3. File Tree (계층 구조)

**시스템의 물리적 주소**

- 프로젝트 구조 탐색

- 파일 위치 파악

- 폴더 기반 그룹화



### 4. Bridge (코드 연동)

**실시간 수정 및 동기화**

- 노드 ↔ 코드 양방향 동기화

- 파일 시스템 감시

- LSP 연동



---



## 📁 [SYNAPSE: 소스 코드 명세 (Self-Visualization)]



### 🛠️ Core Engine

- `src/extension.ts`: Extension entry point and command registration.

- `src/bootstrap/BootstrapEngine.ts`: Core initialization and auto-discovery engine.

- `src/core/FileScanner.ts`: Multi-language scanner with full TS support.

- `src/core/FlowScanner.ts`: Logic flow and branching analyzer.

- `src/core/GeminiParser.ts`: GEMINI.md specification parser.

- `src/core/FlowchartGenerator.ts`: Automated layout and coordinate generator.



### 🌐 View & Interface

- `src/webview/CanvasPanel.ts`: Webview lifecycle and message bridge.

- `src/server/server.ts`: API server for standalone mode.

- `src/types/schema.ts`: Core data schemas and TypeScript definitions.



### 🔗 Core Dependencies

- `src/extension.ts` -> `src/bootstrap/BootstrapEngine.ts`: "Initialization"

- `src/extension.ts` -> `src/webview/CanvasPanel.ts`: "UI Management"

- `src/bootstrap/BootstrapEngine.ts` -> `src/core/GeminiParser.ts`: "Parsing"

- `src/bootstrap/BootstrapEngine.ts` -> `src/core/FileScanner.ts`: "Scanning"

- `src/bootstrap/BootstrapEngine.ts` -> `src/core/FlowchartGenerator.ts`: "Visualization"

- `src/core/FlowScanner.ts` -> `src/types/schema.ts`: "Data Structure"

- `src/core/FileScanner.ts` -> `src/types/schema.ts`: "Data Structure"

- `src/core/GeminiParser.ts` -> `src/types/schema.ts`: "Data Structure"



---



# SYNAPSE - Visual Architecture Engine (v0.2.15)

> **Code Outer-space Visualization & Design Control Engine**



## [v0.2.15] - War Room: Legacy Logic Fix & Flow Precision

> **Korean: 워룸(War Room) 시리즈 - 레거시 로직 수정 및 플로우 정밀화***



v0.2.14은 SYNAPSE를 단순한 시각화 도구에서 **아키텍처 진단 및 감사 엔진**으로 격상시켰습니다.



### 1. Logic Analyzer (로직 분석기)

- **순환 의존성 탐지**: 코드의 유연성을 저해하는 복잡한 사이클을 탐지하여 리포트합니다.

- **병목 지점 식별**: 의존성이 과도하게 집중된 모듈을 주황색 오라로 표시합니다.

- **로직 단절(Dead-end) 감지**: 흐름이 끊긴 지점이나 사용되지 않는 고립된 노드를 탐지합니다.



### 2. War Room Visual Experience

- **🛡️ Test Logic**: 캔버스 상단 버튼을 통해 실시간 로직 전파 시뮬레이션을 수행합니다.

- **Signal Pulse**: 로직의 흐름을 가시화하는 입자 애니메이션이 엣지를 따라 이동합니다.

- **Architectural Auras**:

    - **Red**: 순환 의존성 및 중대 오류.

    - **Orange**: 병목 및 잠재적 위험.

    - **Ghosting**: 고립된 노드 및 데드엔드.



### 3. Interactive Health Report (`리포트.md`)

- 분석 결과를 기반으로 아키텍처 건강 점수와 세부 결함 사항을 마크다운 리포트로 생성합니다.

- 리포트 내의 노드 ID를 클릭하면 캔버스가 즉시 해당 위치로 이동하여 포커싱합니다.



### 4. 시각적 실패 복구 작전: '심연'을 '질서'로 바꾸는 법

- **1. 추상화 레이어 도입 (Semantic Zooming)**

  - 문제: 모든 IF/FOR/Print 노드가 같은 레벨로 펼쳐져 있어 숲을 못 보고 나무만 보고 있음.

  - 해결: 멀리서 볼 때는 기능 단위의 **'슈퍼 노드(Cluster)'**만 보여주고, 가까이 줌인(Zoom-in)할 때만 그 내부의 세부 순서도(다이아몬드, 육각형)가 나타나게 해야 합니다.

- **2. '정거장' 중심 배치 (Milestone Anchor)**

  - 문제: 선이 너무 길어 흐름을 놓침.

  - 해결: 로직의 핵심 체크포인트(예: Auth, DB_Process, Response)를 수직 축으로 정렬하고, 그 사이의 자잘한 로직들은 접거나(Collapse) 곡선으로 처리하여 시각적 피로도를 낮춰야 합니다.

- **3. 동적 경로 강조 (Path Highlighting)**

  - 문제: 모든 노드가 '나 좀 봐달라'고 아우성침.

  - 해결: 평소엔 모든 노드를 반투명하게 죽여놓고, 사령관님이 마우스를 올리거나 [로직 테스트] 중인 '현재 활성 경로'만 강렬한 빛(Pulse)으로 비춰야 합니다.



---



## 🎖️ SYNAPSE War Room Operation Log: v0.2.11 & Context Vault

- **LSP & Flow Analysis**: 서버 번들링 및 파이썬 인덴트/루프 분석 최적화로 `main -> database` 연결 완벽 복구.

- **Visual Segregation**: 외부 라이브러리를 전용 클러스터로 격리하여 순수 로직 가시성 확보.



---



## 2. 📑 다중 MD 부트스트랩 (Multi-MD Bootstrap Engine)

시냅스가 단일 지침이 아닌, 프로젝트의 다양한 '정신적 지주'들을 통합 분석함.



- **헌법.md (The Constitution)**: 프로젝트의 불변하는 원칙, 코딩 컨벤션, 철학을 최우선 순위로 부트스트랩.

- **Multi-LLM Docs**: `GEMINI.md`, `CLAUDE.md` 등 각기 다른 페르소나의 작업 지침을 개별 노드로 형상화.

- **Selective Bootstrapping**: 캔버스 시작 시 사용자가 어떤 MD 파일을 기반으로 논리망을 구축할지 선택 가능.

- **Cross-Reference**: 여러 MD 파일 간의 모순(Conflict)을 시냅스가 감지하여 '논리적 병목' 노드로 시각화.



---



## 3. 🧠 [UPGRADED] 인텔리전트 맥락 보관소 (Intelligent Context Vault)



### 3.1. 맥락 파일 데이터 구조 (File Content Blueprint)

저장되는 `YYYY-MM-DD_HHMM.md` 파일은 다음을 포함함:

- **Architecture Visualization**: Mermaid 기반의 현재 노드/엣지 관계도.

- **LLM Reasoning Log**: 최근 작업 시 LLM이 판단한 근거와 논리적 병목 현상 요약. [cite: 2026-02-11]

- **Code Change Summary (Smart Diff)**:

    - 어떤 파일이 수정되었는가 (e.g., `main.py`, `database.py`)

    - 핵심 변경 사항: "DB 조회 로직에 Bypass 조건 추가", "rich 테이블 레이아웃 수정" 등.

- **Status Metadata**: 현재의 에러 상태, 성공 기준 통과 여부 (Success Criteria). [cite: 2026-02-14]



### 3.2. 자동 기록 프로세스 (Auto-Documentation Flow)

1. **단축키 트리거**: `Ctrl+Alt+M` 실행 (작업 시작 시 한 번, 완료 시 한 번 눌러 저장 진행).

2. **로그 수집**: 안티그래비티 터미널 및 LLM 인터렉션 히스토리(VS Code Copilot 숨김 데이터)에서 최근 작업 내역 추출.

3. **Diff 요약**: `git diff` 혹은 파일 시스템 모니터링을 통해 이전 저장 시점 대비 변경된 코드 라인을 요약.

4. **파일 생성**: `./.synapse_contexts/` 폴더에 통합 마크다운 문서 생성 및 캔버스 'Context Cluster' 반영.



### 3.3. 활용 시나리오

- **맥락 복구**: "저번 주 화요일 오후 3시의 논리로 돌아가자"고 LLM에게 지시 시, 해당 md 파일을 참조하여 즉시 코드와 캔버스 복구.

- **버그 역추적**: 로그를 뒤지지 않고 맥락 파일의 'Code Change' 섹션만 보고 범인(Error Source) 검거.



---



## 4. ⚔️ 최종 비전: 시냅스 '워룸(War Room)' 인터페이스

- **Architecture as Source of Truth**: `아키텍처.md`를 통해 캔버스-파일시스템 간 양방향 동기화.

- **Command & Control**: 캔버스에서 엣지를 수정하면 실제 코드의 `import`가 변하고, `헌법.md` 위반 여부를 실시간 검사.

- **Rewind Logic**: 과거 맥락 노드 선택 시 해당 시점의 '헌법'과 '코드 상태'로 워룸 전체가 동기화.



---



## 5. 🛠️ 사령관의 즉시 기동 지침 (Next Action)

1. **Multi-Loader 구현**: 여러 `.md` 파일을 동시에 파싱하여 노드 맵에 병합하는 부트스트랩 로직 추가.

2. **헌법 준수 모듈**: 코드 수정 시 `헌법.md`의 규칙을 검증하는 'Policy Checker' 엔진 연동.

3. **Context Capture**: 단축키 하나로 현재 활성화된 모든 MD 지침과 작업 로그를 통합 패키징하여 방출.



---



# 🛸 SYNAPSE: War Room & Intelligence Context Vault (v0.2.20)



## 1. 개요 (Philosophy)

본 버전은 시냅스(SYNAPSE)의 시각화 도구를 **'논리 지휘소(War Room)'**로 격상시킨다. 개발자는 코드를 실행하기 전, 설계된 논리의 타당성을 가상으로 검토하고 그 과정의 모든 맥락(Context)을 영구히 보존한다. [cite: 2026-02-11]



## 2. 핵심 사양 (Core Specs) [cite: 2026-02-14]



### A. 인텔리전트 맥락 보관소 (Intelligent Context Vault)

- **저장소**: `./.synapse_contexts/` 폴더 내 독립 관리.

- **파일**: `YYYY-MM-DD_HHMM.md` 형식으로 자동 생성.

- **데이터**: Mermaid 그래프 + LLM 작업 로그 + 코드 Smart Diff 통합 박제.

- **시각화**: 캔버스 우측 상단에 'Context Cluster' 성단으로 상시 표시.



### B. 워룸 로직 제어 시스템 (War Room Logic Control)

- **[로직 테스트] (Non-Executable Logic Test)**:

  - 실제 프로그램 실행 없이 아키텍처의 논리적 흐름만 검증.

  - 단계적 펄스(Step-by-Step Pulse): 버튼 클릭 시 데이터 패킷이 노드 사이를 이동하는 시뮬레이션. [cite: 2026-02-11]

  - 시나리오 시뮬레이션: 조건문 분기에서 가상 데이터를 주입하여 경로 정합성 확인.

- **[로직 실행]**: 실제 런타임 가동 및 실시간 결과 매핑.



### C. 아키텍처-코드 동기화 (Architecture Sync)

- **Source of Truth**: 모든 시각적 엣지 수정은 `아키텍처.md`에 반영됨.

- **Auto-Refactoring**: 캔버스에서 노드 연결 변경 시 실제 파일의 `import` 구문 즉시 수정.



## 3. 사용자 경험 (UX)

- **단축키**: `Ctrl+Alt+C` (현재 사고의 흐름 즉시 저장). (또는 `Ctrl+Alt+M`)

- **피드백**: 로직 테스트 중 노드 통과 시 시각적 점멸(Blinking) 및 로그 요약 출력. [cite: 2026-02-11]



---



## 4. [v0.2.20 작전 설계: 논리 리포트(Logic Report) 시스템]

사령관님이 지시하신 **리포트.md**의 구조는 워룸의 전광판에 뜨는 '최종 판정 결과'와 같아야 합니다. [cite: 2026-02-14]



### 4.1. 리포트.md 구성 사양 (Logic Audit Structure)

| 항목 | 내용 | 시각적 표현 (in Graph) |

|---|---|---|

| **병목 지점(Bottleneck)** | 데이터 처리가 지연되거나 노드 간 호출이 과도하게 몰리는 구간. | 해당 엣지가 굵은 적색으로 변함. |

| **로직 에러(Logic Error)** | 정의되지 않은 노드 호출, 순환 참조(Circular Ref), 유실된 엣지. | 해당 노드에 경고 아이콘(⚠️) 표시. |

| **Dead-end 탐지** | 시작은 했으나 결과 노드에 도달하지 못하는 미완성 경로. | 흐름이 멈춘 노드를 회색 처리. |

| **정합성 점수** | 설계된 아키텍처의 논리적 완결성을 %로 환산. | 리포트 상단에 Score Card 배치. |



### 4.2. 워룸 연동 시나리오 (Report Generation)

1. 사령관님이 **[로직 테스트]** 버튼을 눌러 시뮬레이션을 가동합니다.

2. 시냅스 엔진이 엣지의 흐름을 추적하며 AST 기반의 논리 정합성을 실시간 스캔합니다. [cite: 2026-02-11]

3. 스캔이 종료되면 즉시 프로젝트 루트에 **리포트.md**를 생성/갱신합니다.

4. 사령관님은 `Ctrl+Alt+M` (또는 `C`)으로 본인의 생각을 저장하면서, 동시에 생성된 `리포트.md`를 보고 설계 수정을 결단합니다. [cite: 2026-02-14]



---



## 5. [v0.2.20 작전 설계: 리포트-그래프 실시간 동기화 (Visual Audit)]

이 시스템이 구축되면, Flow 그래프는 단순한 그림이 아니라 **'살아있는 상태판'**이 됩니다. [cite: 2026-02-14]



### 5.1. 그래프 시각적 피드백 (Visual Indicator)

- **병목(Bottleneck)**:

  - 해당 엣지의 선 굵기가 3배로 두꺼워지며 주황색/적색 그라데이션으로 점멸.

  - 단계적 로직 테스트 시, 해당 구간에서 패킷(Pulse)의 이동 속도가 0.2배속으로 저하.

- **로직 에러(Error)**:

  - 연결이 끊긴 노드는 X 표시와 함께 회색으로 비활성화(Ghosting).

  - 잘못된 호출이 발생하는 노드는 주변에 적색 경고 오라(Aura) 발생.

- **데드엔드(Dead-end)**:

  - 목적지에 도달하지 못하는 경로는 점선으로 변하며 서서히 페이드 아웃.



### 5.2. 상호작용 (Interactivity)

- **리포트 연동 클릭**: `리포트.md`에서 특정 에러 항목을 클릭하면, Flow 그래프에서 해당 노드와 엣지가 중앙으로 줌인(Zoom-in) 되며 강조됨.

- **실시간 수정**: 사령관님이 그래프에서 엣지를 수정하여 병목을 우회시키면, `리포트.md`의 해당 항목이 즉시 `[Resolved]` 상태로 업데이트. [cite: 2026-02-11, 2026-02-14]



---



## 6. [v0.2.15 개량 설계: 계층적 노드 생성 및 동적 쉐이프(Dynamic Shape) 시스템]

사령관님의 지시대로 +NODE 버튼의 워크플로우를 세분화하고, 선택에 따른 시각적 변화를 설계합니다. [cite: 2026-02-14]



### 6.1. 2단계 계층형 선택 인터페이스 (Hierarchical Selector)

- **1차 선택 (Category)**: LOGIC / DATA / UI / SERVICE / CONFIG / DOC

- **2차 선택 (Sub-Category)**: LOGIC 선택 시 우측으로 즉시 확장 슬라이드 메뉴 오픈.

  - `IF`: 조건 분기 노드

  - `FOR/WHILE`: 루프 제어 노드

  - `Print/Log`: 데이터 출력 노드

  - `Func/Method`: 일반 함수 노드



### 6.2. 로직 유형별 동적 쉐이프(Shape) 정의 [cite: 2026-02-11]

선택한 로직의 성격에 따라 캔버스 위의 노드 모양이 즉시 결정됩니다:

- **IF (Diamond Shape)**: 전통적인 순서도의 마름모꼴. 두 개의 출력 엣지(True/False)를 기본으로 가짐.

- **FOR (Hexagon Shape)**: 육각형 또는 양 끝이 잘린 사각형. 반복 구간임을 직관적으로 명시.

- **Print (Parallelogram Shape)**: 평행사변형. 입출력(I/O) 작업을 상징.

- **Service/Data (Rounded/Cylinder)**: 기존 스타일 유지하여 로직 노드와 시각적 대비를 이룸.



### 6.3. 리포트 및 시뮬레이션 연동

이렇게 세분화된 노드들은 나중에 **리포트.md**에서 "IF 노드에서 True 경로가 누락됨"과 같은 아주 정밀한 진단 결과를 내놓게 됩니다. [cite: 2026-02-14]
