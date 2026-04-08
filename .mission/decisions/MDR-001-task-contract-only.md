# MDR-001: Task Contract Only

**Date:** 2026-04-02
**Status:** Active
**Version:** 1.0.0
**Author:** Dr. QUAN

## Context

Mission Spec 설계 시 scope를 어디까지 잡을 것인가.
AI agent orchestration, scheduling, multi-agent coordination, runtime management까지
포함할 수도 있었다. 시장에는 이미 LangChain, CrewAI 등 orchestration 프레임워크가 존재한다.

## Decision

Mission Spec은 task contract layer만 구현한다.
"무엇을 해야 하는가"를 정의하는 YAML 스키마와 그 검증/보고 도구만 제공한다.
Orchestration, scheduling, runtime management는 scope 밖이다.

## Rationale

- Scope creep 방지 — 하나의 책임만 가진다
- 기존 도구(GitHub Issues, CI/CD, 각종 agent 프레임워크)와 조합하여 사용
- 복잡한 런타임 없이 YAML 스키마만으로 가치 전달
- 최소한의 dependency로 어떤 환경에서든 사용 가능

## Consequences

- `execution_hints`는 suggestion으로만 취급됨 — 런타임이 무시 가능
- multi-agent coordination은 사용자/런타임의 책임
- mission.yaml은 "무엇을 해야 하는가"만 정의, "어떻게"는 정의하지 않음
- 별도 UI, SaaS, 대시보드를 만들지 않음

## Alternatives Considered

- **Full orchestration framework** — 과설계, 기존 도구와 중복, dependency 폭증
- **Minimal schema only (eval 없이)** — 검증 불가능한 계약이 됨, dogfooding 불가
- **Runtime + contract 통합** — scope가 너무 크고 유지보수 부담 과다
