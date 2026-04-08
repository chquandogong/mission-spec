# MDR-004: done_when을 검증 가능한 기술 기준으로 전환

**Date:** 2026-04-07
**Status:** Active
**Version:** 1.4.0
**Author:** Dr. QUAN

## Context

v1.0.0~v1.2.0의 done_when은 선언적 문장이었다:

- "/ms:init 명령으로 자연어에서 mission.yaml 초안 자동 생성"
- "Claude Code plugin marketplace에 설치 가능"

이 형식은 사람이 읽기는 좋지만, `evaluateMission('.')`으로 자동 평가할 때
rule-based evaluator가 판별하기 어려웠다. 대부분이 "자동 평가 불가"로 분류되어
dogfooding의 가치가 제한적이었다.

## Decision

done_when 항목을 두 가지 검증 가능한 형식으로 전면 전환한다:

1. **파일 존재 검사**: `"skills/ms-init/SKILL.md 존재"` — evaluator가 파일 존재 여부로 판별
2. **automated eval 이름 참조**: `"schema_validation_passes"` — evals[].name과 매칭하여 명령 실행

## Rationale

- **Self-dogfooding** — mission.yaml 자체로 `evaluateMission('.')`을 실행하면 9/9 criteria가 자동 판정됨
- **자동화 친화** — CI/CD에서 mission spec 준수 여부를 자동 검증 가능
- **명확한 완료 기준** — "가능"이나 "완성"같은 모호한 표현 대신 binary pass/fail
- evaluator의 3가지 판별 로직(파일 존재, eval 매칭, 테스트 패턴)과 정확히 맞물림

## Consequences

- 기존 선언적 done_when 8개 항목이 모두 제거되고 9개 기술 기준으로 교체됨
- done_when 작성 시 evaluator의 판별 패턴을 인지해야 함
- evals[].name과 done_when 항목의 정확한 일치가 필요
- 사람이 읽을 때는 기술적이어서 goal 필드를 함께 봐야 의도 파악 가능

## Alternatives Considered

- **선언적 유지 + manual eval** — dogfooding 가치 제한, 자동화 불가
- **LLM-as-judge** — v1에서는 rule-based만 구현, LLM judge는 향후 과제
- **done_when과 evals 완전 분리** — 연결이 없으면 evals의 존재 이유가 약화됨
