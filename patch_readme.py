import re

with open('README.ko.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace report logic block
pattern_report = re.compile(r"#### 보고서 생성 로직.*?#### 🧹 Clear Debug — 디버그 초기화", re.DOTALL)
replacement_report = """#### 증거 기반 보고서 생성 (Evidence-Backed Report Generation)

SYNAPSE 보고서는 근거 없는 아키텍처적 가정이 아니라, 구조적 관찰과 추적 가능한 증거(Evidence)를 바탕으로 생성됩니다.

보고서 파이프라인은 다음과 같은 명시적인 증거 계약을 따릅니다:

**질문(Question) → 필수 용어(Required Vocabulary) → 허용된 증거(Allowed Evidence) → 지원 패턴(Supporting Pattern) → 지원 메트릭(Supporting Metric) → 주장(Claim)**

각 단계는 정의된 책임을 갖습니다:

- **Question:** 조사 중인 아키텍처적 질문을 정의합니다.
- **Required Vocabulary:** 관찰을 표현하는 데 필요한 개념을 정의합니다.
- **Allowed Evidence:** 결과를 뒷받침할 수 있는 증거를 제한합니다.
- **Supporting Pattern:** 평가되는 구조적 패턴을 정의합니다.
- **Supporting Metric:** 패턴 결과에 대해 측정 가능한 근거를 제공합니다.
- **Claim:** 가용한 증거에 의해 뒷받침되는 결론만을 제시합니다.

발견된 구조가 자동으로 아키텍처적 결함을 의미하지는 않습니다. 높은 연결성(Connectivity), 중심성(Centrality), 또는 의존성 집중만으로 해당 컴포넌트가 잘못 설계되었다고 단정할 수 없습니다.

SYNAPSE는 관찰된 구조와 해석을 명확히 구분합니다. 증거가 불충분할 경우, 보고서는 의도를 추론하거나 시정 조치를 권고하는 대신 그 한계를 있는 그대로 보존해야 합니다.

#### 보고서의 책임 (Report Responsibilities)

- **Virtual Debug:** 구조적 관찰, 검증 결과 및 이를 뒷받침하는 증거를 추적합니다.
- **Architect:** 숙련된 엔지니어가 시스템 구조, 핵심 노드, 경계 및 의존성 관계를 이해할 수 있도록 돕습니다.
- **Onboarding:** 새로운 기여자가 가용한 증거의 범위 내에서 진입점과 주요 구조 영역을 탐색할 수 있도록 안내합니다.

보고서는 분석 파이프라인에서 검증된 결과만을 제시합니다. 독자가 보고된 결론을 뒷받침하는 관찰 및 메트릭으로 다시 추적할 수 있도록 상세 증거는 항상 검사 가능한 상태로 유지되어야 합니다.

#### 🧹 Clear Debug — 디버그 초기화"""

content = pattern_report.sub(replacement_report, content)

# Replace Inference pressure block
pattern_pressure = re.compile(r"### 인퍼런스 압력 \(Inference Pressure\).*?---\n", re.DOTALL)
replacement_pressure = """### 인퍼런스 압력 (Inference Pressure)

Verify 시스템은 구조적 측정의 기준선으로 **인퍼런스 압력**을 계산합니다:

압력 = `criticalIssues / totalAnalyzedNodes × 100`

> ℹ️ **검증 범위**: 현재 특정 오픈소스 아키텍처(VSCode, Godot, AntennaPod, Linux Kernel 등 최대 7만 노드)에서만 검증되었습니다. 인퍼런스 압력은 검증된 범위 내에서의 상대적인 계산 지표로 기능할 뿐이며, 모든 생태계에 대한 척도 독립적(scale-invariant)인 건전성 보증을 의미하지 않습니다.

---
"""

content = pattern_pressure.sub(replacement_pressure, content)

with open('README.ko.md', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch successfully applied via regex!")
