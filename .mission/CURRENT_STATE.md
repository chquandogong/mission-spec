# Mission Spec — Current State

> Last updated: 2026-04-15 | Version: 1.8.0

## 현재 상태

- **Title:** Mission Spec v1.8 — Internationalization
- **Phase:** internationalization
- **Author:** Dr. QUAN
- **Created:** 2026-04-01

## 현재 목표

Mission Spec을 core library와 Claude Code skill bundle로 구현.
누구나 쉽게 설치하여 사용할 수 있는 portable한 task contract 도구로 유지.
mission.yaml의 변경 이력을 Living Asset Registry로 관리.
문서 접근성은 다국어로 확장하되, 런타임/스키마/메타데이터는 일관된 영어 표면으로 유지.

## 핵심 제약 (활성)

1. Task contract layer만 구현 (orchestration 아님)
2. execution_hints는 suggestion (directive 아님)
3. 기존 워크플로에 녹아들 것 (별도 UI/SaaS 금지)
4. 외부 dependency 최소화 (ajv + yaml만)
5. TDD first
6. 한 번에 하나의 기능만

## 완료 조건 (9/9 PASS)

- [x] skills/ms-init/SKILL.md 존재
- [x] skills/ms-eval/SKILL.md 존재
- [x] skills/ms-status/SKILL.md 존재
- [x] skills/ms-report/SKILL.md 존재
- [x] .claude-plugin/plugin.json 존재
- [x] README.md 존재
- [x] schema_validation_passes
- [x] command_test
- [x] cross_platform_verifies

## 활성 임시 규칙

- (없음)

## 최근 구현 (v1.8.0)

- [x] `README.md`를 영어 기본 문서로 재작성하고 `README.ko.md`, `README.zh.md` 추가
- [x] 5개 skill 문서에 `SKILL.ko.md`, `SKILL.zh.md` 추가
- [x] 런타임 메시지, 스키마 설명, 패키지 메타데이터를 영어로 통일
- [x] `ms-init`의 한국어 입력 감지 정규식은 유지하여 기존 한국어 프롬프트 호환성 보존
- [x] `mission-history.yaml`, snapshot, 상태/검증 메타데이터를 `v1.8.0` 기준으로 동기화

## 이전 구현 (v1.7.0)

- [x] `design_refs` 스키마 필드 — 설계 문서 위치 포인터
- [x] `architecture_doc_freshness` llm-eval — 설계 문서 stale 자동 감지
- [x] `architecture_delta` history 스키마 필드 — 모듈/인터페이스 변경 추적
- [x] Architecture Registry (`.mission/architecture/ARCHITECTURE_CURRENT.yaml`)
- [x] Dependency Graph (`.mission/architecture/DEPENDENCY_GRAPH.yaml`)
- [x] API/Interface Registry (`.mission/interfaces/API_REGISTRY.yaml`)
- [x] Traceability Matrix (`.mission/traceability/TRACE_MATRIX.yaml`)
- [x] `ms-context`, Reconstruction Playbook, Verification Evidence Ledger, Architecture Diff, history commit validation

## 다음 변경 후보

- `ms-context` 출력을 clipboard/파일로 직접 내보내는 UX
- CI/CD에서 VERIFICATION_LOG 자동 갱신
- versioned architecture snapshots (`.mission/architecture/snapshots/`)

## 자기 검증

- [x] 이 spec만 보면 지금 무엇을 해야 하는지 알 수 있는가?
- [x] mission-history.yaml만 보면 왜 그렇게 바뀌었는지 알 수 있는가?
- [x] 특정 버전을 다시 꺼내 재실행할 수 있는가?
- [x] 임시 조치인지 영구 정책인지 구분되는가?
- [x] 코드를 읽지 않고도 모듈 구조를 알 수 있는가? (v1.7.0+)
- [x] 한국어/영어/중국어 사용자 모두 설치 문서를 따라갈 수 있는가? (v1.8.0+)
