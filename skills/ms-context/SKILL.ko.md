---
name: ms-context
description: >
  Mission Spec 자산을 종합하여 AI 에이전트를 위한 프로젝트 컨텍스트 프롬프트를 생성합니다.
  "컨텍스트 줘", "프로젝트 요약", "새 에이전트 브리핑" 등의 요청에 트리거됩니다.
user-invocable: true
allowed-tools:
  - Read
  - Bash(node *)
  - Bash(npm *)
  - Glob
  - Grep
---

[English](SKILL.md) | 한국어 | [中文](SKILL.zh.md)

# ms-context — AI 에이전트 컨텍스트 프롬프트 생성

## 동작

1. `mission.yaml`을 읽고 목표, 제약, 완료 조건을 추출합니다.
2. `design_refs`가 있으면 설계 문서 위치를 포함합니다.
3. `mission-history.yaml`에서 진화 요약과 최신 변경을 추출합니다.
4. `.mission/decisions/MDR-*.md`에서 핵심 결정 제목을 수집합니다.
5. `.mission/architecture/ARCHITECTURE_CURRENT.yaml`에서 모듈 구조를 테이블로 렌더합니다.
6. `.mission/interfaces/API_REGISTRY.yaml`에서 공개 API 목록을 추출합니다.
7. 모든 정보를 하나의 마크다운으로 조합하여 출력합니다.

## 실행 방법

```bash
node -e "
import { generateContext } from '${CLAUDE_PLUGIN_ROOT}/dist/commands/context.js';
const c = generateContext('.');
console.log(c.markdown);
"
```

## 출력 형식

```markdown
# Project Context

## Mission: 미션 제목

**Goal:** 미션 목표
**Version:** 1.7.0

### Constraints

- 제약 조건 1

### Done When

- 완료 조건 1

## Design References

- **architecture:** `docs/internal/ARCHITECTURE.md`

## Evolution Summary

**Current Phase:** architecture-assetization — 아키텍처 지식의 자산화
**Total Revisions:** 7

## Key Decisions (MDR)

- **MDR-001-task-contract-only.md:** MDR-001: Task Contract Only

## Architecture

| Module | Path                 | Responsibility        | Depends On |
| ------ | -------------------- | --------------------- | ---------- |
| parser | `src/core/parser.ts` | YAML parse + validate | validator  |

## Public API

- `generateContext(projectDir: string) => ContextResult`
```

## 주의

- `mission.yaml`이 없으면 에러를 반환합니다.
- 각 선택 섹션(history, architecture, API 등)은 해당 파일이 없으면 자동으로 생략됩니다.
- 출력은 새 AI 에이전트의 시스템 프롬프트 또는 첫 번째 메시지로 사용할 수 있습니다.
- 반환값의 `sections` 배열로 어떤 섹션이 포함되었는지 확인할 수 있습니다.
