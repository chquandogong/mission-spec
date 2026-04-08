# Mission Spec — Current State

> Last updated: 2026-04-08 | Version: 1.4.0

## 현재 상태

- **Title:** Mission Spec v1.4 — Core API + Claude Code Skills
- **Phase:** marketplace-ready
- **Author:** Dr. QUAN
- **Created:** 2026-04-01

## 현재 목표

Mission Spec을 core library와 Claude Code skill bundle로 구현.
누구나 쉽게 설치하여 사용할 수 있는 portable한 task contract 도구.

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

## 다음 변경 후보

- mission-history.yaml 기반 ms-status/ms-report 연동
- lineage 필드 스키마 추가 검토

## 자기 검증

- [x] 이 spec만 보면 지금 무엇을 해야 하는지 알 수 있는가?
- [x] mission-history.yaml만 보면 왜 그렇게 바뀌었는지 알 수 있는가?
- [x] 특정 버전을 다시 꺼내 재실행할 수 있는가?
- [x] 임시 조치인지 영구 정책인지 구분되는가?
