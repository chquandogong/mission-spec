# MDR-002: ms-\* Prefix 및 /mission-spec: Namespace 도입

**Date:** 2026-04-03
**Status:** Active
**Version:** 1.1.0
**Author:** Dr. QUAN

## Context

Claude Code marketplace에 플러그인을 등록할 때, skill 이름이 `init`, `eval`, `status`, `report`처럼
일반적인 단어이면 다른 플러그인과 이름이 충돌할 수 있다.
실제로 marketplace에는 이미 유사한 이름의 skill을 가진 플러그인들이 존재했다.

## Decision

모든 skill ID에 `ms-` prefix를 붙인다: `ms-init`, `ms-eval`, `ms-status`, `ms-report`.
커맨드 참조는 `/mission-spec:ms-*` 형식으로 통일한다.

## Rationale

- marketplace 이름 충돌 방지 — `ms-`는 Mission Spec의 약어로 고유성 확보
- `/mission-spec:ms-*` 형식은 Claude Code의 플러그인 namespace 규칙을 준수
- 일관된 naming으로 사용자 혼란 방지

## Consequences

- **Breaking change** — 기존 `/ms:init` 등의 호출이 `/mission-spec:ms-init`으로 변경됨
- mission.yaml의 done_when, approvals, evals, execution_hints 전체에 걸쳐 참조 업데이트 필요
- 향후 모든 새 skill도 `ms-` prefix를 따라야 함

## Alternatives Considered

- **Prefix 없이 유지** — 충돌 위험 잔존, marketplace 정책 위반 가능
- **`mission-` full prefix** — 너무 길어서 사용성 저하 (`mission-init` vs `ms-init`)
- **숫자 suffix** — 의미 없는 구분, 가독성 저하
