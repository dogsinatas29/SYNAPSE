# MAINTENANCE_PROTOCOL.md

## Purpose

SYNAPSE의 장기 유지보수를 위한 정기 감사(Audit) 프로토콜.

본 프로토콜의 목적은 코드 수정이 아니다.

목적은 다음과 같다.

- 아키텍처 현황 파악
- GEMINI.md 최신화
- 아키텍처 드리프트 탐지
- 기술부채 식별
- 방치 코드 식별
- 성능 영향 요소 식별
- 리팩토링 우선순위 결정

---

# Core Philosophy

## Principle 1

현재 코드가 곧 설계라는 가정을 금지한다.

현재 구현은 다음 요소가 혼합된 결과물일 수 있다.

- 원래 설계
- 실험 코드
- 임시 우회 코드
- 디버그 코드
- 기술부채
- 중단된 작업

현재 구현은 진실이 아니다.

---

## Principle 2

GEMINI.md는 Source of Truth다.

다음 정보는 GEMINI.md를 기준으로 관리한다.

```text
TREE INDEX

FILE INDEX
```

GEMINI.md는 단순 문서가 아니다.

아키텍처 계약서(Architecture Contract)다.

---

## Principle 3

조사와 수정은 분리한다.

본 프로토콜은 문제를 발견하는 절차다.

실제 수정은 별도 마일스톤에서 수행한다.

---

## Principle 4

전수 수동 조사를 금지한다.

SYNAPSE는 대규모 코드베이스다.

모든 감사는 체계적으로 수행한다.

즉흥적인 탐색은 허용하지 않는다.

---

## Principle 5

증거 없는 삭제를 금지한다.

모든 삭제는 감사 결과를 근거로 수행한다.

---

# Artifact Policy

## Permanent Metadata

위치

```text
GEMINI.md
```

포함

```text
TREE INDEX

FILE INDEX
```

---

## Maintenance Reports

위치

```text
mt/<version>/
```

예시

```text
mt/v0.3.34.26/
```

생성 파일

```text
BASELINE.md

DEBUG_AUDIT_REPORT.md

PERFORMANCE_REPORT.md

ABANDONED_WORK_REPORT.md

ARCHITECTURE_DRIFT_REPORT.md

REFACTORING_ROADMAP.md
```

---

# Maintenance Workflow

---

# Phase 0 — Baseline Snapshot

## 목적

감사 시작 시점 고정.

---

## 작업

기록:

```text
Version

Branch

File Count

Directory Count

Node Count

Edge Count

Cluster Count

Report Timestamp
```

---

## 결과물

```text
mt/<version>/BASELINE.md
```

---

# Phase 1 — Tree Index Verification

## 목적

TREE INDEX와 실제 구조를 동기화한다.

---

## 작업

검증:

```text
신규 디렉토리

삭제 디렉토리

이동된 디렉토리

신규 레이어

폐기 레이어
```

---

## 결과

```text
GEMINI.md

TREE INDEX 최신화
```

---

# Phase 2 — File Index Verification

## 목적

FILE INDEX의 신뢰성을 복구한다.

---

## 작업

각 파일에 대해 검토

판정:

```text
UNCHANGED

UPDATED

LEGACY

ORPHANED

DELETED

UNKNOWN
```

---

## 결과

```text
GEMINI.md

FILE INDEX 최신화
```

---

# Phase 3 — Debug Layer Census

## 목적

디버그 계층 현황 파악.

정리 단계 아님.

조사 단계.

---

## 조사 대상

```text
console.log

DEBUG

VE_DIAG

FSM_DEBUG

HEATMAP_STATS

CLUSTER_WATCH

PROBE

TEMP_DEBUG

임시 진단 코드
```

---

## 분류

```text
ACTIVE

DISABLED

LEGACY

UNKNOWN
```

---

## 결과물

```text
mt/<version>/DEBUG_AUDIT_REPORT.md
```

---

# Phase 4 — Performance Baseline

## 목적

현재 성능 기준선 확보.

---

## 측정

```text
Project Load Time

Scan Time

Graph Build Time

Layout Time

Render Time

Memory Usage
```

---

## 결과물

```text
mt/<version>/PERFORMANCE_REPORT.md
```

---

# Phase 5 — Abandoned Work Census

## 목적

방치된 작업 발굴.

---

## 조사 대상

```text
TODO

FIXME

HACK

TEMP

Experimental

Draft

Disabled

Commented Block

Not Implemented
```

---

## 분류

```text
FINISH

DELETE

DEFER

INVESTIGATE
```

---

## 결과물

```text
mt/<version>/ABANDONED_WORK_REPORT.md
```

---

# Phase 6 — Architecture Drift Audit

## 목적

GEMINI.md와 실제 구현의 차이를 측정한다.

본 프로토콜의 핵심 단계.

---

## 감사 기준

비교:

```text
Expected Responsibility
VS
Actual Responsibility
```

---

예시

```text
AuthorityDetector.ts

Expected:
Authority Detection

Actual:
Authority Detection
Boundary Detection
Report Generation
Cache Management
```

결과:

```text
DRIFT
```

---

## 분류

```text
PASS

DRIFT

FAIL

GOD_FILE
```

---

## 판정 기준

### PASS

```text
파일 역할과 실제 구현이 일치
```

---

### DRIFT

```text
부가 책임 증가

경미한 책임 오염
```

---

### FAIL

```text
다중 책임

역할 경계 붕괴
```

---

### GOD_FILE

```text
과도한 책임 집중

대규모 분해 필요
```

---

## 결과물

```text
mt/<version>/ARCHITECTURE_DRIFT_REPORT.md
```

---

# Phase 7 — Technical Debt Prioritization

## 목적

기술부채 정리 우선순위 결정.

---

## P0

```text
GOD_FILE

핵심 엔진

성능 영향 큼

Architecture Contract 위반
```

---

## P1

```text
다중 책임

장기 방치

높은 변경 빈도
```

---

## P2

```text
Legacy

Orphaned

Unused
```

---

## P3

```text
Experimental

Future Work

Deferred Work
```

---

## 결과물

```text
mt/<version>/REFACTORING_ROADMAP.md
```

---

# Exit Criteria

다음 조건을 모두 만족해야 Maintenance Cycle 완료로 간주한다.

```text
TREE INDEX 최신화 완료

FILE INDEX 최신화 완료

DEBUG 감사 완료

성능 기준선 확보

방치 작업 분류 완료

Architecture Drift 감사 완료

기술부채 우선순위 결정 완료
```

---

# Out Of Scope

본 프로토콜은 감사 절차다.

다음 작업은 포함하지 않는다.

```text
실제 리팩토링

코드 삭제

모듈 분해

아키텍처 변경

기능 추가
```

해당 작업은 별도 마일스톤에서 수행한다.

---

# Expected Outcome

Maintenance Cycle 종료 시 다음 질문에 답할 수 있어야 한다.

```text
현재 구조는 무엇인가?

현재 인덱스는 신뢰 가능한가?

방치된 작업은 무엇인가?

디버그 계층은 얼마나 존재하는가?

설계 의도에서 벗어난 파일은 무엇인가?

가장 위험한 기술부채는 무엇인가?

다음 리팩토링 우선순위는 무엇인가?
```
