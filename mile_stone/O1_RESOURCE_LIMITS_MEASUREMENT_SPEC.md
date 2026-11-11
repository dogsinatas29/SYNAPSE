# 🔬 O1 Resource Limits Measurement Specification (Draft v1.0.2)

> **Document Status:** `DRAFT_PENDING_DOCUMENT_REVIEW`  
> **Governance Notice:** 본 문서는 SYNAPSE P3-1 수집 경계 계약의 자원 제한 상한 결정을 위한 측정 프로토콜 및 증거 수집 기준을 정의하는 검토 초안이다. 본 문서의 작성 및 수정은 실측 실행 승인, 자원 상한 정책 확정, 또는 코드/실행 동결 해제를 의미하지 않는다.

---

## 1. Document Governance & Scope

### 1.1. 목적 및 문서의 성격
- **목적:** `P3-1 Ingestion Boundary Contract`의 5대 자원 제한값(`maxJsonBytes`, `maxParseDepth`, `maxStringLength`, `maxNodes`, `maxEdges`)에 대해, 실제 SYNAPSE 런타임 환경에서 허용 가능한 운영 기준선과 정책적 상한을 증거 기반으로 도출하기 위한 표준화된 측정 규격을 수립한다.
- **성격:** 본 규격은 "어떻게 측정하고, 어떤 지표를 수집하며, 어떠한 증거 체계로 검증할 것인가"를 규정하는 **측정 명세서(Measurement Specification)**이다.
- **정책 미확정 원칙:** 본 문서에 기재된 부하 구간, 반복 횟수, 수집 지표는 실측 설계를 위한 **측정 후보(Candidate Profile)**이며, 확정된 정책 상한이나 시스템 기본값이 아니다. 모든 제한값과 정책 상한은 `OPEN` 상태로 보존된다.

### 1.2. 승인 경계 3단계 분리 (Separation of Governance Boundaries)
본 명세는 다음 3단계 독립 거버넌스 승인 절차를 엄격히 준수한다:

```
[1단계] 측정 명세 검토 및 확정 (Document Review)
        상태: DRAFT_PENDING_DOCUMENT_REVIEW → SPECIFIED
        (측정 프로토콜, 지표, 부하 시나리오, 오류 분류 기준 확정)
          ↓
[2단계] 실측 실행 권한 승인 (Measurement Authorization)
        상태: NOT_GRANTED → EXECUTION_AUTHORIZED
        (실행 도구, 스크립트, 실행 명령, 측정 대상 프로젝트 범위 인가)
          ↓
[3단계] 측정 증거 심사 및 정책 상한 승인 (Policy Resolution)
        상태: OPEN → CLOSED_BY_POLICY
        (실측 원시 데이터 검증 후 DEFAULT 및 MAX 상한 최종 확정)
```

### 1.3. 시스템 동결 및 거버넌스 제약 (Frozen Invariants)
본 명세서의 작성, 검토 및 승인 전 단계에서 다음 거버넌스 동결 제약은 엄격히 유효하며 유지된다 (향후 독립된 거버넌스 승인 절차를 거치지 않고 임의 해제할 수 없음):
- `src/**`, `ui/**` 프로덕션 소스 코드 수정 일체 금지 (`Strict Code Freeze: ACTIVE`)
- 단위 테스트, 빌드, 프로파일러, 벤치마크 스크립트 실행 일체 금지 (`Execution Freeze: ACTIVE`)
- 구현 승인: `NOT_GRANTED`
- P3-1 Final Acceptance: `NOT_APPROVED`
- P3-2 Design Entry: `HOLD`
- O1 Resource Limits Policy: `OPEN`

---

## 2. Measurement Targets & Inspection Boundaries (5대 자원 제한 대상 및 검사 경계)

P3-1 수집 경계에서 파서 및 원장 생성 엔진의 안정성을 위협하는 5대 핵심 입력 벡터를 측정 대상으로 정의하고, 검사 경계 및 측정 단위를 분리한다.

### 2.1. 5대 자원 제한 정의 및 잠재적 위험
| 제한 필드 | 데이터 타입 | 측정 대상 물리량 | 잠재적 시스템 위험 (Failure Risks) | 정책 상태 |
|---|---|---|---|---|
| `maxJsonBytes` | 양의 정수 (Bytes) | 입력 `project_state.json`의 원본 UTF-8 바이트 크기 | UTF-8 디코딩/인코딩 시 버퍼 급증, 다중 객체 공존으로 인한 OOM(Out of Memory) 크래시 | `OPEN` |
| `maxParseDepth` | 양의 정수 (Depth) | JSON 중첩 컨테이너(객체 `{}` 및 배열 `[]`)의 최대 깊이 | JSON 파싱, 파싱 후 구조 검증, 재귀적 객체 순회, 직렬화 등 복수 단계에서의 스택 메모리 소진 및 콜스택 오버플로 | `OPEN` |
| `maxStringLength` | 양의 정수 (Code Units) | 개별 JSON 문자열 토큰(키 및 값)의 최대 길이 | 단일 토큰 선할당 메모리 DoS, 청크 디코딩 버퍼 과점, V8 문자열 힙 고갈 | `OPEN` |
| `maxNodes` | 양의 정수 (Count) | 최상위 `nodes` 배열에 포함된 노드 객체 총 개수 | AST 파싱 트리 객체 인스턴스 폭증, 구조 검증 및 정합성 재귀 탐색 비용 급증 | `OPEN` |
| `maxEdges` | 양의 정수 (Count) | 최상위 `edges` 배열에 포함된 엣지 객체 총 개수 | 대규모 연결선 배열 순회 오버헤드, JCS 정규화 및 바이트 직렬화 CPU 시간 초과 | `OPEN` |

> **주의:** 위 5개 필드의 기본값(`DEFAULT_INGESTION_LIMITS`)과 상한값(`MAX_INGESTION_LIMITS`)은 본 문서에서 임의로 확정하지 않으며, 3단계 정책 승인(`CLOSED_BY_POLICY`) 전까지 전량 `OPEN`으로 유지된다.

### 2.2. 검사 시점 및 측정 단위 매트릭스 (Inspection Boundary Matrix)
각 자원 제한의 실제 메모리 보호 효과는 검사 시점에 좌우되므로, 논리적 경계 규격과 실제 구현 검사 시점을 엄격히 분리한다:

| 제한 필드 | 측정 기준 단위 | 논리적 경계 규격 (Logical Boundary Rule) | 검사 시점 및 보호 효과 (Inspection Timing & Boundary) |
|---|---|---|---|
| `maxJsonBytes` | UTF-8 인코딩 바이트 수 | 원본 바이트 버퍼의 `byteLength <= maxJsonBytes` (경계값 포함 허용, 초과 시 거부) | **파싱 전 (Pre-parsing):** 원본 바이트 선제 검사를 통해 파서 진입 전 거대 페이로드 조기 차단 (`SPECIFIED`) |
| `maxParseDepth` | 중첩 컨테이너 계층 수 | - 루트 스칼라 원시값(Primitive): 깊이 0 (단, 설정 유효성 규칙과 독립)<br>- 루트 컨테이너(`{}` or `[]`): 깊이 1<br>- 자식 컨테이너 진입 시마다: 깊이 +1 누적 (객체·배열 동일 적용)<br>- `maxParseDepth = 0`은 어떠한 컨테이너도 불허하므로 `INVALID_LIMITS_CONFIG`로 거부<br>- 논리적 경계: `currentDepth <= maxParseDepth` 허용, 초과 데이터는 유효 입력 불인정 | **[UNSPECIFIED / IMPLEMENTATION_DEPENDENT (OPEN-O1-06)]** 파싱 중(Streaming/Recursive) 선제 검사는 파싱 단계의 스택 소비를 차단할 수 있으나, 파싱 직후 검사는 파싱 중의 자원 소비를 사전에 방지하지 못함. 현재 계약에서 어느 방식이 채택되었는지는 런타임 구현 검증 전까지 확정하지 않으며, 실측 전까지 특정 단계에서의 즉시 거부나 선제 보호 효과를 확정 서술하지 않음. |
| `maxStringLength` | JavaScript UTF-16 Code Unit | 디코딩된 JavaScript UTF-16 Code Unit 기준 `codeUnits <= maxStringLength` 허용 (키와 값 동일 적용) | **[UNSPECIFIED / IMPLEMENTATION_DEPENDENT (OPEN-O1-07)]** 원본 JSON의 이스케이프 표기(예: `\uXXXX` 6자)와 디코딩 후 실제 JavaScript UTF-16 Code Unit(1자)은 길이가 상이함. 파서가 디코딩 전에 선제 검사할 수 있다는 구현 증거가 확보되기 전까지는 선제 보호 효과를 주장하지 않으며, 실제 제한 대상이 디코딩 전 원시 토큰인지 디코딩 후 문자열인지는 구현 대조 항목으로 격리함. |
| `maxNodes` | 최상위 배열 요소 수 | - `nodes` 속성 부재, `null`, 또는 `!Array.isArray`: `INVALID_PROJECT_STATE_STRUCTURE` 거부<br>- 빈 배열(`[]`): 길이 0으로 정상 허용 (`nodes.length === 0 <= maxNodes`)<br>- 단순 요소 개수(`nodes.length <= maxNodes`) 허용 | **파싱 후 구조 검증 단계:** JSON 전체가 객체 트리로 파싱된 이후 최상위 `nodes` 배열의 길이를 계수하므로, 파싱 자체의 AST 메모리 폭증은 선제 차단하지 못함. 개별 원소의 유효 노드 규격 충족 여부는 후속 시맨틱 검증 단계에서 독립 판정함 (`SPECIFIED`). |
| `maxEdges` | 최상위 배열 요소 수 | - `edges` 속성 부재, `null`, 또는 `!Array.isArray`: `INVALID_PROJECT_STATE_STRUCTURE` 거부<br>- 빈 배열(`[]`): 길이 0으로 정상 허용 (`edges.length === 0 <= maxEdges`)<br>- 단순 요소 개수(`edges.length <= maxEdges`) 허용 | **파싱 후 구조 검증 단계:** JSON 전체가 객체 트리로 파싱된 이후 최상위 `edges` 배열의 길이를 계수하므로, 파싱 자체의 AST 메모리 폭증은 선제 차단하지 못함. 개별 원소의 유효 엣지 규격 충족 여부는 후속 시맨틱 검증 단계에서 독립 판정함 (`SPECIFIED`). |

---

## 3. Load Profiles & Scenarios (부하 프로파일 및 시나리오)

측정은 시스템의 선형적 한계점을 탐색하는 **단일 변수 점진적 자극(Single-Variable Profiles)**과 상호작용에 의한 물리 메모리 피크를 유발하는 **3대 복합 부하(Combinatorial Scenarios)**로 구분하여 설계한다.

### 3.1. 단일 변수 점진적 자극 구간 (Candidate Stimuli)
다음 구간은 시스템의 자원 반응 곡선을 도출하기 위한 실험적 자극 후보군이다 (승인된 제한값이 아님).

1. **JSON 바이트 크기 (`maxJsonBytes` 자극):**
   - 소형: 1 MB
   - 중형: 10 MB
   - 대형: 50 MB 이상 (대형 프로젝트 스냅샷 기준선)
2. **파싱 중첩 깊이 (`maxParseDepth` 자극):**
   - 얕은 중첩: 깊이 1 ~ 10
   - 중간 중첩: 깊이 20 ~ 50
   - 깊은 중첩: 깊이 50 ~ 100 (스택 오버플로 실패 경계 관측용)
3. **단일 문자열 길이 (`maxStringLength` 자극):**
   - 일반 토큰: 1 KB 미만
   - 중형 토큰: 10 KB ~ 100 KB
   - 거대 토큰: 1 MB (단일 필드 메모리 주입 한계 관측용)
4. **노드 개수 (`maxNodes` 자극):**
   - 1,000개 → 10,000개 → 50,000개 → 100,000개
5. **엣지 개수 (`maxEdges` 자극):**
   - 1,000개 → 20,000개 → 100,000개 → 200,000개

### 3.2. 3대 복합 부하 시나리오 (Combinatorial Scenarios)
단일 변수 측정으로는 포착할 수 없는 복합 메모리 압박과 GC 경합을 유발하는 시나리오이다.

- **시나리오 1: 대용량 데이터 및 깊은 중첩 (Large Payload + Deep Nesting)**
  - **입력 구성:** 대용량 JSON 바이트(예: 30MB+) 내에 최대 파싱 깊이에 근접하는 깊은 중첩 구조 혼합.
  - **상호작용 위험:** 재귀적 파싱 및 순회 스택이 유지된 상태에서 대규모 토큰 버퍼가 동시에 힙에 할당될 때의 힙/스택 복합 고갈 검증.
- **시나리오 2: 대규모 노드 및 고밀도 엣지 (Dense Graph: Scale Nodes + Scale Edges)**
  - **입력 구성:** 대규모 노드 수(예: 50,000개)와 노드당 참조가 집중된 고밀도 엣지(예: 150,000개) 동시 주입.
  - **상호작용 위험:** [IMPLEMENTATION_DEPENDENT / UNVERIFIED] 7단계 canonical 재파싱 객체 트리와 9단계 `nodeBytes`, `edgeBytes` 파생 버퍼가 메모리에 동시 공존할 때의 V8 힙 객체 급증 및 C++ ArrayBuffer 피크 검증. (설계 가설이며 실제 런타임 구현 검증 전까지 확정 사실로 간주하지 않음).
- **시나리오 3: 거대 문자열 및 복합 그래프 (Massive Strings + Full Graph)**
  - **입력 구성:** 다수의 중·대형 문자열 토큰(10KB~100KB)을 포함하는 노드/엣지 그래프.
  - **상호작용 위험:** [IMPLEMENTATION_DEPENDENT / UNVERIFIED] 청크 단위 디코딩 오버헤드 누적과 UTF-8 재인코딩 과정에서의 V8 내부 문자열 인스턴스 과점 및 힙 단편화 검증. (설계 가설이며 실제 런타임 구현 검증 전까지 확정 사실로 간주하지 않음).

---

## 4. Multi-Layer Memory Accounting (다계층 메모리 회계 모델)

단일 파이프라인 처리 주기 내에서 다수의 데이터 표현(텍스트, 바이트열, 객체 트리, 파생 버퍼)이 공존하므로, 메모리 지표를 **3대 런타임 관측 영역 + 1개 애플리케이션 논리 계층**으로 명확히 분류하고 중복 집계를 엄격히 금지한다.

### 4.1. 메모리 회계 관측 영역 분류 (Memory Accounting Classification)
1. **V8 힙 관측 영역 (V8 Managed Heap):**
   - `heapTotal`: V8 엔진이 OS로부터 할당받아 관리하는 총 JavaScript 힙 메모리 용량.
   - `heapUsed`: V8 힙 내에서 실제 활성 객체, 문자열, 클로저 등이 점유 중인 메모리 (`heapUsed ⊆ heapTotal`).
2. **C++ 외부 메모리 관측 영역 (Native Bindings & Buffers):**
   - `external`: V8 JavaScript 객체에 바인딩된 C++ 네이티브 객체 및 Buffer 메모리 통계.
   - `arrayBuffers`: `external` 통계 중에서 `ArrayBuffer` 및 `SharedArrayBuffer`를 위해 C++ 레벨에서 할당된 메모리 통계 (`arrayBuffers ⊆ external`).
3. **OS 상주 메모리 관측 영역 (OS Process Physical Memory):**
   - `rss` (Resident Set Size): 프로세스 전체가 실제 물리 메모리(RAM)에 상주하고 있는 총 바이트. OS 커널이 관리하는 resident page(물리 RAM 상주 페이지)의 크기를 관측하는 독립 관측값이다. C++ external 할당 통계의 모든 바이트가 반드시 RSS에 즉시 상주한다고 보장할 수 없으며, 양자는 측정 메커니즘과 관측 범위가 다른 독립 지표로 취급한다.
4. **애플리케이션 논리 계층 (Application Logical Buffers):**
   - `explicitBufferBytes_view_logical_sum`: `#private` 원장(`canonicalBytes`, `nodeBytes`, `edgeBytes`) 등 순수 `Uint8Array` 인스턴스들의 논리적 `.byteLength` 단순 산술 합계.
   - `explicitBufferBytes_unique_backing_store`: 동일한 Backing Store를 공유하는 뷰들의 중복을 제거한 고유 Backing Store 크기 합계.

### 4.2. 메모리 회계 모델 및 관계 다이어그램
```
[OS 프로세스 관측 영역: rss (Resident Set Size)]
  - 물리 RAM에 실제 상주하는 프로세스 페이지 관측값
  - V8 힙, C++ 외부 메모리, 런타임 스택 등이 물리적으로 이 공간에 상주함

[V8 힙 관측 영역]                    [C++ 외부 메모리 관측 영역]
  ┌─────────────────────────┐         ┌─────────────────────────┐
  │ heapTotal (확보 용량)    │         │ external (외부 C++ 메모리) │
  │   └── heapUsed (점유 중) │         │   └── arrayBuffers      │
  └─────────────────────────┘         └─────────────────────────┘

[애플리케이션 논리 계층 관측값]
  - explicitBufferBytes_view_logical_sum: 개별 Uint8Array 뷰들의 .byteLength 합산
  - explicitBufferBytes_unique_backing_store: 객체 동일성 기반 고유 Backing Store 크기 합산
  * 주의: 논리적 크기 합산은 객체 헤더 및 OS 페이지 정렬 오버헤드를 반영하지 못하므로
    물리 메모리 소비량(rss)과 직접 등치할 수 없음.
```

### 4.3. 중복 합산 금지 및 고유 Backing Store 회계 규칙 (C-01, R-01, R-10 반영)
1. **`arrayBuffers`와 `external` 합산 금지:** `arrayBuffers`는 `external`의 하위 통계이므로, `external + arrayBuffers`는 명백한 이중 계상(Double Counting)이다.
2. **`heapUsed`와 `heapTotal` 합산 금지:** `heapUsed`는 `heapTotal` 내부의 사용량 지표이므로 단순 합산할 수 없다.
3. **`external`과 `rss` 등치 및 합산 금지:** `external`은 런타임이 보고하는 할당 통계이고, `rss`는 OS가 보고하는 물리 상주 메모리이므로 측정 메커니즘과 범위가 완전히 다르다. 둘을 엄밀한 물리적 부분집합으로 전제하여 산술 합산(`rss + external`)하거나 상호 대체할 수 없다.
4. **`explicitBufferBytes`의 물리 메모리 등치 금지:** 논리적 버퍼 바이트의 크기를 실제 프로세스 물리 메모리 사용량으로 간주하지 않는다.
5. **고유 Backing Store 객체 식별 및 부분 합산 금지 규칙 (C-01, R-01, R-10):**
   - **지원 대상:** 고유 Backing Store 식별 대상은 표준 순수 `ArrayBuffer` 인스턴스(`view.buffer instanceof ArrayBuffer`)로 한정한다.
   - **동일성 식별:** 복수의 `Uint8Array` 뷰가 동일한 `ArrayBuffer`를 공유하는 경우, 객체 동일성(identity)을 기준으로 1회만 계산한다.
   - **부분 합산 금지 (All-or-Nothing Rule):** 측정 대상 버퍼 중 지원하지 않는 유형(`SharedArrayBuffer`, 비표준 네이티브 버퍼 등), 중도 Detached된 버퍼, 또는 식별 불가능한 대상이 단 하나라도 존재하는 경우, **일부 버퍼만 합산한 수치를 전체 크기처럼 기록하는 것을 엄격히 금지**하며 지표 전체를 **`"UNAVAILABLE"`**로 기록한다.
   - **미지원 처리:** 런타임 수집 환경에서 Backing Store 참조 추적 메커니즘이 구현되지 않았거나 관측 불가능한 경우 임의 추정치 없이 `UNAVAILABLE`로 처리한다.
6. **보고 규칙:** 종합 보고서에는 단일 "총 메모리" 합산치를 날조하지 않고, `heapUsed / heapTotal`, `external / arrayBuffers`, `rss`, `explicitBufferBytes_view_logical_sum`, `explicitBufferBytes_unique_backing_store`를 독립 계층 관측값으로 병렬 기록한다.

---

## 5. GC Observation Protocol (가비지 컬렉션 관측 프로토콜)

가비지 컬렉션(GC) 관측은 런타임 메모리 회수 효율성과 지연 시간(Latency)을 측정하기 위해 필수적이나, 관측 행위 자체가 런타임 성능을 왜곡하지 않도록 엄격한 수집 프로토콜을 적용한다.

### 5.1. `perf_hooks` 기반 관측 지표 및 한계 명시 (C-04 반영)
- **수집 방식:** Node.js 표준 내장 모듈 `perf_hooks`의 `PerformanceObserver`를 등록하여 V8 GC 이벤트를 비동기 통계로 수집한다.
- **수집 대상:** 실제 Node.js 런타임이 제공하는 `PerformanceEntry` 중 GC 관련 이벤트(Major GC, Minor GC 등 런타임 노출 이벤트)로 한정한다. (Incremental/Concurrent 실행 단계가 독립 이벤트로 노출되는지는 런타임 구현 검증 전까지 확정하지 않음).
- **수집 지표 및 상태 구분 규칙 (C-04):**
  - `gcPauseTotal`: **측정 구간 내 `PerformanceObserver`를 통해 수집된 GC `PerformanceEntry`의 `duration` 누적 합 ($ms$).**
  - `gcCount`: 수집된 GC 이벤트 총 횟수.
  - `gcPauseMax`: 수집된 GC 이벤트 중 단일 최대 `duration` ($ms$).
  - **정상 0 vs `UNAVAILABLE` 구분:**
    - GC 관측 기능이 정상 작동하였으나 측정 구간 동안 GC 이벤트가 전혀 발생하지 않은 경우: **정상적으로 관측된 `0`**으로 기록.
    - 런타임 환경에서 GC 관측 기능 자체가 지원되지 않거나 수집할 수 없는 경우: **`"UNAVAILABLE"`**로 기록. (관측되지 않았다는 사실을 GC가 발생하지 않았다는 사실로 왜곡 기록 금지).
- **관측 한계 및 Flush 완료 보장 금지 (Observer Limits & Flush Boundaries):**
  - **정지 시간 등치 보장 금지:** `gcPauseTotal`은 수집된 엔트리의 지속 시간 합산일 뿐이며, **실제 애플리케이션의 모든 정지 시간이나 완벽한 전체 Stop-the-World 시간을 대변한다고 보장하지 않는다.**
  - **Flush 마감의 한계:** 측정 블록 종료 시 비동기 큐에 대기 중인 이벤트를 회수하는 마감 절차(Flush)를 수행하더라도, **Flush 완료가 측정 구간 내 모든 GC 이벤트의 완전한 수집을 100% 보증하는 것은 아니다.**
  - **관측 지연 및 오버헤드:** `PerformanceObserver` 자체가 이벤트 큐를 경유하므로 발생하는 관측 지연(Lag) 및 미세 오버헤드를 결과의 한계로 기록한다. (Observer 활성화/비활성화 비교는 별도 측정 조건이며 현재 실행 동결 상태에서는 실행하지 않음).

### 5.2. 강제 GC (`--expose-gc`) 격리 및 원천 분리 원칙 (P1-6 반영)
- **옵션과 호출의 분리:** `--expose-gc` CLI 옵션은 런타임 환경에 `global.gc()` 함수를 노출하는 플래그일 뿐이며, 플래그 자체가 GC를 강제 실행하거나 힙을 재배치하는 것은 아니다.
- **기본 프로토콜 제외 사유:** 코드 내에서 `global.gc()`를 실제 호출하는 행위는 V8 엔진의 자연스러운 GC 스케줄링 타이밍과 힙 상태를 인위적으로 교란하므로, 기본 O1 측정 프로토콜에서는 `global.gc()` 호출을 원천 배제한다.
- **예외적 격리 승인:** 강제 GC는 누수 부재를 입증하는 수단이 될 수 없으며, 오직 '강제 GC 후 잔존 힙 메모리 관측(Post-Forced-GC Retained Memory Observation)'이라는 제한된 보조 진단 목적에 한해 별도의 명시적 거버넌스 승인이 있을 때만 격리 측정 조건으로 다룬다.
- **혼용 금지:** 강제 GC를 적용하여 얻은 지표를 자연 상태의 `gcPauseTotal` 또는 운영 응답 시간 측정 데이터와 혼합 집계하는 것을 엄격히 금지한다.

---

## 6. Environment & Reproducibility Baseline (실행 환경 및 재현성 기준선)

측정 결과의 과학적 신뢰성을 확보하기 위해, 실측 환경의 모든 하드웨어 및 소프트웨어 메타데이터는 오차 없이 기록되어야 한다.

### 6.1. 환경 메타데이터 필수 기록 항목 (P1-11, R-05 반영)
1. **운영체제:** OS 명칭, 커널 릴리즈 버전, 아키텍처 (`process.platform`, `os.release()`, `process.arch`)
2. **런타임 엔진:** Node.js 정확한 버전(`process.version`), V8 엔진 버전(`process.versions.v8`)
3. **하드웨어 및 시스템 메모리 사양:**
   - CPU 모델명, 물리 코어 및 논리 스레드 수
   - 시스템 총 물리 RAM 크기: `os.totalmem()` (하드웨어 장착 메모리 용량)
   - 측정 시작 시점의 시스템 Free Memory 관측값: `os.freemem()` (Node.js API가 반환하는 여유 메모리 스냅샷)
   - **주의:** `os.freemem()`은 모든 OS에서 동일한 의미의 "프로세스가 실제 즉시 할당 가능한 메모리(Available Memory)"를 대변하지 않으며, 두 지표는 단순 환경 메타데이터일 뿐 프로세스 가용 메모리 한도와 동일시할 수 없다.
4. **프로세스 실행 옵션:** Node.js 실행 인자 (`process.execArgv`), 힙 메모리 상한 설정값(`--max-old-space-size` 등)
5. **대상 입력 데이터 기준선 (Target Baseline):**
   - SYNAPSE 파이프라인 실제 출력물(`project_state.json`)의 원천 프로젝트 명칭(예: VSCode, Linux Kernel, RustDesk 등)
   - 원본 입력 파일의 바이트 크기 및 SHA-256 해시값

### 6.2. 반복 측정 및 프로세스 격리 경계 (P1-10, R-04 반영)
- **제안 설계값 (Proposed Baseline):** 개별 자극 시나리오당 **최소 5회 이상 반복 실행**을 제안 설계 기준으로 설정한다. (본 수치는 제안값이며, 승인된 정책이 아님).
- **프로세스 격리 전략 미확정 (`OPEN-O1-08`):** 동일 프로세스 내 반복 실행(In-Process)과 매회 신규 프로세스 실행(Isolated Process)은 런타임 캐시, 모듈 재할당, JIT 컴파일 상태가 상이한 서로 다른 측정 조건이다. 2단계 실행 승인 전까지 격리 전략은 `UNSPECIFIED`로 유지한다.
- **Cold/Warm 분류 보류 (`COLD/WARM_CLASSIFICATION: NOT_ESTABLISHED`):**
   - `iterationIndex = 1`: 단순 첫 번째 실행 회차.
   - `iterationIndex > 1`: 단순 후속 실행 회차.
   - 프로세스 격리 조건과 OS 캐시/JIT 상태가 통제되지 않은 상태에서 1회차를 절대적 Cold로, 후속 회차를 Warm으로 분류하는 것을 원천 금지하며, 두 결과를 동일 통계 모집단으로 단순 합산하지 않는다.

---

## 7. Failure Classification & Data Integrity (오류 분류 및 데이터 무결성)

부하 측정 중 발생하는 모든 실패 및 비정상 상태를 명확히 분류하고, 원인 불명의 종료나 비정상 데이터를 유효 측정값으로 왜곡하는 것을 원천 차단한다.

### 7.1. 실행 상태 및 결과 코드 분류 체계 (C-05, P1-3, P1-8, P1-9, R-03, R-09 반영)
| 결과 코드 (`resultCode`) | 상태 명칭 | 발생 조건 및 판정 기준 | 처리 및 유효성 규칙 |
|---|---|---|---|
| `STAT_OK` | 정상 완료 (Success) | 프로세스 정상 종료(종료 코드 0), 모든 메모리/GC 메트릭 수집 완료, 직렬화 전 무결성 검증 통과 | **유효 데이터 채택 (집계 대상)** |
| `ERR_OOM` | 메모리 고갈 확인 (Out of Memory) | V8 OOM 로그(`JavaScript heap out of memory`) 또는 OS 커널 OOM Killer 개입(`dmesg` OOM 이벤트 등)이 **독립적 증거로 확인된 경우** | **실패 기록.** 해당 부하 구간을 '특정 측정 환경 및 입력 조건에서 관측된 OOM 실패 경계($L_{\text{oom\_observed}}$)'로 국소 기록하되 절대 한계로 일반화 금지. 실패 직전 정상 완료 지점(Safe Frontier)과 분리 |
| `ERR_TIMEOUT` | 처리 시간 초과 (Timeout Exceeded) | 정의된 단일 실행 제한 시간 내에 처리가 완료되지 않고 중단된 상태. (예시로 제안된 60초는 **`PROPOSED_CANDIDATE`**이며 확정 정책이 아님) | **실패 기록.** 집계 배제 |
| `ERR_EXCEPTION` | 예외 발생 (Runtime Exception) | V8 콜스택 오버플로(`RangeError: Maximum call stack size exceeded`), 파서 내부 미처리 에러 등 예외 발생 | **실패 기록.** 스택 실패 경계 등의 특수 경계 데이터로 격리 보관 |
| `ERR_PROCESS_TERMINATED` | 원인 미상 프로세스 강제 종료 | OOM 증거가 확인되지 않은 SIGKILL, 비정상 프로세스 소멸 상태 | **실패 기록.** 원인 미확인 상태로 격리 분류하며 OOM으로 추측 단정 금지 |
| `ERR_ABORT` | 프로세스 비정상 중단 (Aborted) | SIGABRT 발생 등 비정상 크래시 상태 | **실패 기록.** 종료 원인 독립 조사 대상으로 격리 |
| `ERR_COLLECTOR_INTEGRITY_FAIL` | 수집기 내부 무결성 검사 실패 | **직렬화 전(Pre-serialization) 단계**에서 필수 수치 필드에 `NaN`, `undefined`, 음수 유입 등 비정상 데이터 감지 시 | **실패 기록 (C-05 반영).** 해당 회차 정상 집계 배제. 실패 레코드에 `failureReason`, 실패 필드, 위반 규칙을 첨부하여 기록. 재실행은 별도 실행 권한 인가 시에만 가능 |
| `ERR_DATA_LOSS` | 메트릭 파일 쓰기 손상 (Data Loss) | **직렬화 후(Post-serialization) 단계**에서 `raw_metrics.jsonl` 파일 I/O 쓰기 실패, 파일 잘림, JSON 파싱 구문 오류 발생 시 | **무효 판정 (Invalid).** 해당 회차 데이터 전량 폐기. 재실행은 별도 실행 권한 인가 시에만 가능 |

---

## 8. Evidence Contract & Governance Resolution Protocol (증거 계약 및 정책 종결 프로토콜)

### 8.1. 원시 증거 아티팩트 및 2계층 구조 (C-03, R-02, R-08, R-09 반영)
실측 실행 권한 승인 후 수집되는 증거는 재현성과 사후 감사 무결성을 보장하기 위해 다음 3대 파일로 영구 보존되어야 한다:

1. **원시 샘플 전용 로그 (`raw_samples.jsonl` — Sample Evidence):**
   - 측정 구간(`T_start` ~ `T_end`) 동안 주기적으로 폴링된 개별 샘플 원본 레코드.
   - 필수 필드:
     - `runId`: 측정 실행 식별자
     - `sampleIndex`: 0부터 시작하는 단조 증가 샘플 번호
     - `timestampMs`: 단조 증가 시간(monotonic time, `performance.now()`) 기준의 상대 시간 ($ms$)
     - `rss`, `heapUsed`, `heapTotal`, `external`, `arrayBuffers` (단위: Bytes)
     - `explicitBufferBytes_view_logical_sum` (단위: Bytes)
     - `explicitBufferBytes_unique_backing_store` (단위: Bytes 또는 `"UNAVAILABLE"`)
2. **회차별 메타 및 피크 요약 로그 (`raw_metrics.jsonl` — Peak Summary & Run Metrics):**
   - 회차별 메타데이터, 실행 결과 코드, 종료 시점 스냅샷 및 6대 피크 요약 구조체.
   - 필수 키 목록:
     - 메타데이터: `runId`, `scenarioId`, `iterationIndex`, `inputSha256`, `timestampStartMs`, `timestampEndMs`, `elapsedMs`, `resultCode`
     - 실패 기록 시 (`ERR_COLLECTOR_INTEGRITY_FAIL`): `failureReason`, `failedField`, `violatedRule`
     - 종료 시점 스냅샷: `final_rss`, `final_heapUsed`, `final_heapTotal`, `final_external`, `final_arrayBuffers`, `final_explicitBufferBytes_view_logical_sum`, `final_explicitBufferBytes_unique_backing_store`
     - GC 지표: `gcPauseTotal`, `gcCount`, `gcPauseMax` (수치 또는 `"UNAVAILABLE"`)
     - 6대 관측 샘플 피크 요약 구조체 (R-02 반영):
       - `rss_observed_sample_peak: { valueBytes: number, sampleIndex: number, timestampMs: number }`
       - `heapUsed_observed_sample_peak: { valueBytes: number, sampleIndex: number, timestampMs: number }`
       - `heapTotal_observed_sample_peak: { valueBytes: number, sampleIndex: number, timestampMs: number }`
       - `external_observed_sample_peak: { valueBytes: number, sampleIndex: number, timestampMs: number }`
       - `arrayBuffers_observed_sample_peak: { valueBytes: number, sampleIndex: number, timestampMs: number }`
       - `explicitBufferBytes_observed_sample_peak: { valueBytes: number, sampleIndex: number, timestampMs: number }`
   - **독립 검증 가능성:** 피크 요약이 `raw_samples.jsonl`의 실제 샘플 중 최대값인지, 샘플 타임스탬프가 측정 범위 내에 존재하는지를 사후 1:1 대조 검증할 수 있어야 한다.
3. **실행 환경 스냅샷 (`environment_manifest.json`):** Node.js 버전, OS 커널, 하드웨어 스펙(`totalmem`, `freemem`), 입력 파일 해시, 프로세스 실행 CLI 플래그 전수 덤프.
4. **통계 요약 보고서 (`measurement_summary.md`):** 시나리오별 평균, 표준편차, 관측 샘플 피크, GC 오버헤드 요약 테이블 및 오류 분류 로그.

### 8.2. 거버넌스 정책 종결 프로토콜 (Resolution Protocol)
실측 완료 후 O1 상태가 `CLOSED_BY_POLICY`로 승격되고 P3-1 및 P3-2로 이어지기 위한 4단계 종결 프로토콜을 규정한다:

```
[단계 1: 원시 증거 독립 감사]
  - 보고된 메트릭의 재현성, 다계층 메모리 중복 집계 배제 여부, 오류 분류 무결성 전수 검증.
  - 판정: PASS / FAIL (UNVERIFIED는 승인 불가).
    ↓
[단계 2: 정책 상한 제안서 제출]
  - 실측 피크치에 안전 마진을 반영한 기본값(DEFAULT) 및 운영 상한(MAX) 수치 제안.
  - (주의: 실측 완료 자체가 정책 상한을 자동 확정하지 않음).
    ↓
[단계 3: 거버넌스 정책 승인 (Policy Approval)]
  - 시스템 아키텍트/사용자의 공식 정책 심사 및 승인 결정.
  - 거버넌스 상태 전이: O1 상태가 OPEN → CLOSED_BY_POLICY 로 종결.
    ↓
[단계 4: P3-1 재심사 및 후속 마일스톤 연계]
  - P3-1 Final Acceptance 재심사 착수 (NOT_APPROVED 해제 여부 검토).
  - P3-2 Design Entry 보류(HOLD) 해제 검토.
```

- **상태 승격 금지 불변식:** 본 명세서의 완성 및 향후 실측 수행 완료는 그 자체로 `CLOSED_BY_POLICY`로 자동 전환되지 않으며, 반드시 단계 3의 명시적 거버넌스 정책 승인을 거쳐야만 종결된다.

---

## 9. Specification Checklist & Open Items Register

### 9.1. 명세 규격 내용 존재 및 기술 검토 대기 매트릭스
| 번호 | 요구 영역 | 내용 존재 상태 | 기술 검토 및 정확성 검증 상태 | 명세 내용 위치 |
|---|---|---|---|---|
| 1 | Measurement Targets | **PRESENT** | `PENDING_TECHNICAL_REVIEW` | 본 문서 2장 (5대 필드 물리량, 검사 경계 매트릭스) |
| 2 | Load Profiles & Scenarios | **PRESENT** | `PENDING_TECHNICAL_REVIEW` | 본 문서 3장 (5종 점진 자극 + 3대 복합 부하 및 구현 의존성 격리) |
| 3 | Multi-Layer Memory Accounting | **PRESENT** | `PENDING_TECHNICAL_REVIEW` | 본 문서 4장 (3개 관측 영역 + 1개 논리 계층 회계 모델, 고유 Backing Store 규칙) |
| 4 | GC Observation Protocol | **PRESENT** | `PENDING_TECHNICAL_REVIEW` | 본 문서 5장 (GC 관측 범위 한계, 정상 0 vs UNAVAILABLE, 강제 GC 격리) |
| 5 | Environment & Reproducibility | **PRESENT** | `PENDING_TECHNICAL_REVIEW` | 본 문서 6장 (환경 메타데이터 `totalmem`/`freemem` 구분, 프로세스 격리 미확정) |
| 6 | Failure Classification | **PRESENT** | `PENDING_TECHNICAL_REVIEW` | 본 문서 7장 (독립 증거 기반 OOM, 직렬화 전 수집기 무결성 실패 코드 등록) |
| 7 | Evidence Contract | **PRESENT** | `PENDING_TECHNICAL_REVIEW` | 본 문서 8.1절 (원시 샘플과 피크 요약 2계층 분리, 4대 아티팩트 보존 규격) |
| 8 | Governance Resolution Protocol | **PRESENT** | `PENDING_TECHNICAL_REVIEW` | 본 문서 8.2절 (실측 후 4단계 정책 승인 절차) |

### 9.2. 미결 항목 레지스터 (Open Items Register — 전량 보존)
| 항목 ID | 미결 항목 명칭 | 현재 상태 | 종결 선행 조건 |
|---|---|---|---|
| `OPEN-O1-01` | 5대 자원 제한 기본값 (`DEFAULT_INGESTION_LIMITS`) | `OPEN` | 실측 완료 후 제안 및 거버넌스 정책 승인 |
| `OPEN-O1-02` | 5대 자원 제한 상한값 (`MAX_INGESTION_LIMITS`) | `OPEN` | 실측 완료 후 제안 및 거버넌스 정책 승인 |
| `OPEN-O1-03` | 실측 실행 권한 및 도구 인가 (`Execution Authorization`) | `NOT_GRANTED` | 사용자 명시적 2단계 실행 권한 승인 |
| `OPEN-O1-04` | 실측 대상 공식 프로젝트 스냅샷 기준선 확정 | `OPEN` | 대상 프로젝트(VSCode/Linux 등) 파일 해시 인가 |
| `OPEN-O1-05` | P3-1 Final Acceptance 및 P3-2 진입 | `NOT_APPROVED` / `HOLD` | O1 정책 종결(`CLOSED_BY_POLICY`) 후 재심사 |
| `OPEN-O1-06` | `maxParseDepth` 검사 시점(파싱 중 vs 직후) 구현 확인 | `UNSPECIFIED` | 런타임 구현 코드 대조 확인 |
| `OPEN-O1-07` | `maxStringLength` 선제 검사 가능 여부 구현 확인 | `UNSPECIFIED` | 런타임 구현 코드 대조 확인 |
| `OPEN-O1-08` | 프로세스 격리 전략 및 Cold/Warm 체계 | `UNSPECIFIED / NOT_ESTABLISHED` | 2단계 실행 승인 시 격리 방식 확정 전까지 보류 |
| `OPEN-O1-09` | Backing Store 고유 식별 추적 지원 여부 | `UNSPECIFIED / NOT_VERIFIED` | 런타임 수집 환경의 추적기 구현 대조 확인 |
| `OPEN-O1-10` | 샘플링 정책 및 원시 샘플 증거 구조 | `OPEN / UNVERIFIED` | 샘플링 주기(10ms 등), 타임스탬프 동기화 및 관측 오버헤드 실측 확정 |
