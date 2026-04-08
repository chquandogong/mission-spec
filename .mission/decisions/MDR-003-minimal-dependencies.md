# MDR-003: 외부 Dependency 최소화

**Date:** 2026-04-02
**Status:** Active
**Version:** 1.0.0
**Author:** Dr. QUAN

## Context

Mission Spec 구현에 어떤 외부 라이브러리를 허용할 것인가.
JSON Schema 검증, YAML 파싱, 테스트 프레임워크, 빌드 도구 등 선택지가 많다.
일반적인 Node.js 프로젝트는 수십~수백 개의 dependency를 가진다.

## Decision

production dependency는 `ajv`(JSON Schema validator)와 `yaml`(YAML parser) 두 개만 허용한다.
나머지는 Node.js 표준 라이브러리만 사용한다.

## Rationale

- **Portability** — dependency가 적을수록 어떤 환경에서든 설치/실행이 쉬움
- **설치 부담 최소화** — npm install 시간 단축, lock file 복잡도 감소
- **보안 표면 축소** — supply chain attack 위험 감소
- **유지보수 부담 감소** — dependency 업데이트/호환성 관리 최소화
- mission.yaml의 핵심은 스키마이며, 복잡한 런타임이 필요 없음

## Consequences

- JSON Schema 검증은 ajv에 의존 (Draft-07)
- YAML 파싱은 yaml 패키지에 의존
- 그 외 기능(파일 I/O, 프로세스 실행 등)은 Node.js stdlib만 사용
- 복잡한 기능 요청 시 "dependency 추가 없이 가능한가?"를 먼저 검토
- dev dependency(typescript, vitest)는 이 제약의 대상이 아님

## Alternatives Considered

- **Zero dependency** — YAML 파싱과 JSON Schema 검증을 직접 구현해야 하므로 비현실적
- **풍부한 dependency 허용** — 기능은 빨리 붙지만 portability와 보안이 약화됨
- **Bundling으로 dependency 숨기기** — 실질적으로 dependency가 존재하며 업데이트 추적이 어려워짐
