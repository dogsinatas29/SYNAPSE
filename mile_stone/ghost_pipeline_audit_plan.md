# encoding: utf-8
# SYNAPSE Ghost 검증 및 개선 계획 (Baseline Audit)

## 📅 작업 정보
- **상태:** 🚧 In-Progress
- **관련 마일스톤:** Pipeline Evidence Protocol 도입 이후
- **목표:** Ghost Checker 자체 검증 및 계층별(Resolver, Graph Builder) 책임 분리를 통한 런타임 증거 기반의 근본 원인 해결. 무작정 Resolver를 추가하지 않고 증거에 따라 구현 범위를 결정한다.

## 🧠 상세 설계 및 로직
### 검증 프로젝트 순서
1. **Axon (Rust)**: Rust Resolver 참조 추출 및 모듈 경로 검증
2. **RustDesk (Rust, Dart, C/C++)**: 언어별 문제 분리, Dart Resolver 및 외부 의존성 분류 검증
3. **Now in Android (Kotlin, Gradle)**: Kotlin 내부 연결성 및 빌드 설정 검증
4. **Chromium (다중 언어, 대규모)**: 대규모 참조 정확성, 심볼/파일 구분, 전체 파이프라인 무결성

### 계층별 검증 항목
- **Resolver**: 실제 소스 참조 추출 여부 및 대상 경로 정확성
- **Ghost Checker**: 내부 파일 / 외부 의존성 / 미확인 참조 구분 논리 일치 여부
- **Graph Builder**: 추출된 데이터의 정확한 노드/엣지 반영 및 유실 여부
- **Ghost 분류 및 레이어**: 고립 노드와 외부 참조의 올바른 분류
- **UI 및 부트스트랩**: 데이터 손실 및 잘못된 시각화 유무

## 🛠️ 기술적 변경 사항
- **진행 원칙**: 버전 번호를 먼저 부여하지 않으며, 각 단계의 통과 기준을 만족할 때마다 다음 단계로 이행한다.

## ⚠️ 예외 처리 및 주의 사항
- 맹목적인 Ghost 수치 감소 금지 (실제 외부 의존성은 유지).
- 동일한 형식으로 증거 기록 (소스 -> Resolver -> Checker -> Graph Builder -> 결과).
- 고립 노드가 무조건 오류는 아님. 실제 참조가 없는 파일일 수 있음.

## 📝 Post-Work Log
- (작업 진행하며 기록 예정)
