# Antigravity & SYNAPSE: DTR 사고 제어 및 캔버스 물리 규칙 (Rules.md)

## 1. DTR(Deep-Thinking Ratio)의 정의
**DTR**은 모델이 최종 응답을 내놓기 전, 내부적으로 수행하는 **'추론의 밀도와 깊이'**를 나타내는 핵심 지표다. 
- **연산적 정의:** $\text{DTR} = \frac{\text{Deep Reasoning Steps}}{\text{Total Inference Path}}$
- **목적:** 불필요한 토큰 낭비를 막고, 복잡한 논리 구간에서만 연산 자원을 폭발시켜 '정밀한 결과물'을 얻는 데 있다.

## 2. 사고 밀도(Logical Density: $\rho$)의 정의
**사고 밀도**는 SYNAPSE 캔버스 위에서 노드가 가지는 **'질량'**이자 **'시각적 에너지'**다.
- **정의:** 적은 토큰 수로 얼마나 깊은 논리 단계(Step)를 함축하고 있는지를 나타낸다.
- **수식:** $\rho = \frac{\text{Logic Steps}}{\text{Token Count}} \times \text{DTR}$
- **시각적 상관관계:** 밀도가 높을수록 노드는 더 강한 빛(Glow)을 내며, 캔버스 중심부로 향하는 강한 중력을 가진다.

## 3. DTR 제어 및 운용 규칙 (The Valve Rules)

### 3.1 상황별 DTR 밸브 운용
LLM은 인입되는 요청의 성격에 따라 실시간으로 DTR 밸브를 조절한다.
- **Low Mode (DTR 0.1 ~ 0.3):** 단순 구문 수정, 변수명 변경, 보일러플레이트 작성. 
  - *규칙:* 고민하지 말고 즉시 KISS(Keep It Simple, Stupid) 원칙에 따른 최소 코드를 출력할 것.
- **Mid Mode (DTR 0.4 ~ 0.6):** 일반 비즈니스 로직, 단위 테스트, API 연동.
  - *규칙:* 흐름의 모순이 없는지 한 차례 검증 후 출력할 것.
- **High Mode (DTR 0.7 ~ 0.95):** 커널 디버깅, 아키텍처 설계, 보안 취약점 분석.
  - *규칙:* 모든 추론 경로를 시뮬레이션하고, 오답 확률이 높은 경로는 'Think@n' 전략으로 조기 차단(Early Halt)할 것.

### 3.2 SYNAPSE 캔버스 렌더링 규칙
DTR 수치는 SYNAPSE 캔버스의 물리 엔진에 직접 피드백된다.
- **Glow Rule:** DTR 0.7 이상의 결과물은 반드시 보라색(#8A2BE2) 네온 발광 효과를 가진 노드로 생성한다.
- **Gravity Rule:** 고밀도 노드는 캔버스 중앙으로 모이고, 관련 저밀도 노드들을 자식 노드로 강제 정렬(Clustering)시킨다.
- **Tension Rule:** 추론 확신도와 DTR이 높을수록 노드 간 엣지(Edge)의 두께를 굵게 처리하여 '강한 논리'임을 시각화한다.

## 4. 사용자 강제 제어 (Manual Override)
사용자가 `Rules.md` 내의 임계값(Threshold)을 수정하거나, 인터페이스를 통해 밸브를 수동 조절할 경우, 모델은 현재의 자가 판단보다 **사용자의 입력을 최우선 순위**로 두어 사고의 깊이를 즉시 변경한다.

## 5. 문서 관리 규정 (Documentation Shelf Rules)
시냅스 캔버스의 **Documentation Shelf**는 프로젝트의 지식 자산을 관리하는 신성한 수납 영역이다. 불필요한 노드로 인한 정보 오염을 방지하기 위해 다음 규칙을 준수한다.

- **명시적 채택 및 범위 제한 원칙:** `GEMINI.md` 내에서 📄 아이콘이 붙거나 `파일:` 키워드로 명시된 문서만 캔버스에 노출한다. 단, 대상 문서는 반드시 **프로젝트 루트** 또는 **`Doc/` 폴더** 내에 존재해야 한다.
- **초기 시각화 제어:** `Documentation Shelf` 및 `Intelligent Context Vault` 클러스터는 시각적 인지 부하 감소를 위해 **기본적으로 접힘(Collapsed) 상태**로 렌더링한다. 필요 시 사용자가 마우스로 확장할 수 있다.
- **자동 노드 중첩 방지 (Anti-Overlap):** 노드 로드 시 또는 배치 시, 노드 간의 물리적 중첩을 자동으로 감지하여 최소 150px(X), 100px(Y) 이상의 간격을 유지하도록 자가 보정(Resolve Overlaps)한다.
- **데이터 위생 (Data Hygiene):** 대규모 문서 파싱 시 상위 20개의 헤더만 요약(Summary)에 포함하여 페이로드 크기를 최적화한다.
- **자동 제외 리스트:** `README.md`, `CHANGELOG.md` 등은 기본 배제(Node Diet)한다.
