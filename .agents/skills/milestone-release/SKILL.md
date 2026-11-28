---
name: milestone-release
description: "SYNAPSE 마일스톤 문서(UTF-8 No BOM) 생성, 릴리즈 노트 작성, .vsix 패키징 및 UI 다국어(i18n) 배포 표준 공정"
---

🚀 Milestone & Release Workflow (/milestone-release)

본 스킬은 버전별 마일스톤 문서 작성, 릴리즈 노트 관리, .vsix 확장 프로그램 패키징 및 UI 다국어(i18n) 적용 시 준수해야 할 표준 공정입니다.

1. 버전별 개발 및 패키징 원칙

마일스톤 기반 개발 확정:

마일스톤 문서를 읽어들이면 즉시 해당 버전에 대한 작업 계획(Implementation Plan)과 TODO 리스트를 작성한다.

버전 동기화 컴파일:

해당 작업 중 발생하는 모든 릴리즈 노트와 빌드 산출물은 마일스톤 문서에 기재된 버전을 따른다.

컴파일로 생성되는 확장 프로그램 패키지 파일명은 반드시 synapse-visual-architecture-[마일스톤_버전명].vsix 형식으로 생성한다.

배포 통제 스크립트(build-guard.js)의 유효성 검증을 통과해야 한다.

2. 릴리즈 노트 관리 규격

저장 위치 및 파일명:

릴리즈 노트는 프로젝트 루트의 release_note/ 폴더에서 별도 관리한다.

파일명은 반드시 v[버전]_release_notes.md로 통일한다.

양방향 동기화:

릴리즈 노트에는 v[버전].md 마일스톤 문서를 기반으로 작업한 내용과 작업 중 추가된 요소를 모두 반영한다.

릴리즈 노트가 완성되면 추가된 작업 내용을 해당 마일스톤 문서(mile_stone/v[버전].md)의 Post-Work Log에 즉시 기록한다.

3. 마일스톤 문서 생성 및 경로 규격

3.1 표준 저장 경로 (Standard Path)

모든 마일스톤 문서는 프로젝트 루트를 기준으로 엄격한 경로 규칙을 따른다:

Path: ~/언어_프로젝트/프로젝트명/mile_stone/v[버전명].md

(주의: 기존 문서 일부의 milestone 오타 대신 실제 프로젝트 표준 디렉토리인 mile_stone/을 사용한다.)

3.2 자동 생성 프로토콜 (Auto-Generation Protocol)

사용자가 "내용 설명하고 이거 정리해서 버전 x.x.x.md로 만들어줘"라고 요청할 경우 즉시 다음 절차를 수행한다:

인코딩 강제: 생성되는 모든 .md 파일 최상단에 # encoding: utf-8을 명시하고, 파일 저장 시 반드시 UTF-8 (No BOM) 형식으로 저장한다.

Context 덤프: 대화 중 도출된 모든 설계, 로직, 예외 처리 및 주의사항을 누락 없이 수집한다.

표준 템플릿 적용: 아래 템플릿 규격에 맞춰 문서를 생성하고, 릴리즈 노트 완료 시 내용을 동기화한다.

3.3 마일스톤 문서 표준 템플릿

# encoding: utf-8
🚀 Milestone [버전명] - [기능 대표 명칭]

## 📅 작업 정보
- **상태:** 🏗️ Planned / 🚧 In-Progress / ✅ Completed
- **관련 마일스톤:** v0.x.x (이전 버전 링크)
- **목표:** 해당 버전에서 달성하고자 하는 핵심 가치

## 🧠 상세 설계 및 로직
- [핵심 설계 내용 1]
- [핵심 설계 내용 2]

## 🛠️ 기술적 변경 사항
- **Node Update:** (예: 예약 노드 승격 로직 추가)
- **Edge Update:** (예: Rule 04 타입 매칭 검사기 구현)
- **File Changes:** (예: edgeHandler.ts 인터셉터 추가)

## ⚠️ 예외 처리 및 주의 사항
- 바이브 코딩 시 발생할 수 있는 환각 방지책
- 성능 병목 예상 지점 및 디버깅 포인트

## 📝 Post-Work Log (작업 후 기록)
- *작업 중 추가된 요소 및 릴리즈 노트 기반의 최종 결과물 기록*


4. UI 다국어(i18n) 배포 규칙

4.1 지원 언어 (Supported Languages)

en (영어): 글로벌 사용자를 위한 기본값 (Default)

ko (한국어): 한국 사용자 전용

(주의: 일본어(ja), 중국어(zh-CN), 유럽어 등 기타 언어는 관리 비용 증가를 이유로 현재 단계에서 추가하지 않는다.)

4.2 언어 감지 우선순위

vscode.env.language: VS Code가 인식하고 있는 에디터 언어를 최우선 사용한다 (window.VSCODE_LANGUAGE로 웹뷰 주입).

navigator.language: 브라우저 환경 등에서 VS Code 언어 값을 알 수 없을 때 사용한다.

'en' (Fallback): 위 두 가지에서 ko 계열을 감지하지 못한 경우 모두 영어로 처리한다.

4.3 적용 범위 (Scope of Localization)

포함 대상 (정적 UI 우선): <button>, <label>, <h3>, <span> 등 정적 마크업의 메뉴 텍스트, 버튼, 패널 제목만 HTML 속성(data-i18n) 및 i18n.js의 t(key) 함수로 분리한다.

제외 대상 (하드코딩 유지): alert(), confirm(), toast, notification 등 네이티브 알림 메시지, Runtime 메시지("Loading...", "Project Analyzing..."), Error 메시지("File not found", "Network error").
