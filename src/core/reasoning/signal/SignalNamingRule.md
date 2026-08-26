# Signal Naming Rule

Phase 13.1 (Signal Discovery Engine) 철학에 따라, **Signal은 아키텍처적 해석을 최소화하고 오직 '관측 가능한 행동(Observable Action)'만을 신호로 인정합니다.**

이 선을 지키지 못하면 SYNAPSE는 단순 AST 덤프기로 전락하거나(너무 로우레벨), 잘못된 룰셋을 강제하는 Authority 분석기(너무 하이레벨)로 회귀하게 됩니다.

## 🟢 좋은 예 (관측 가능한 기계적 행동)
- `write_access`
- `object_creation`
- `state_mutation`
- `lifecycle_control`
- `cross_boundary_reference`

## 🔴 나쁜 예 (인간의 주관적 해석 포함)
- `authority`
- `ownership`
- `coordination`
- `dominance`
- `architectural_core`

> **원칙:** Signal 아래로 내려가 AST 노드가 되지 말고, Signal 위로 올라가 Constraint(해석)가 되지 마라.
