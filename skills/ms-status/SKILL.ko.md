---
name: ms-status
description: >
  mission.yaml 기반 미션 진행 상황을 markdown으로 요약합니다.
  "미션 상태", "진행 상황", "어디까지 했어" 등의 요청에 트리거됩니다.
user-invocable: true
allowed-tools:
  - Read
  - Bash(node *)
  - Bash(npm *)
  - Glob
  - Grep
---

[English](SKILL.md) | 한국어 | [中文](SKILL.zh.md)

# ms-status — 미션 진행 상황 요약

## 동작

1. `mission.yaml`을 읽고 스키마 검증합니다.
2. 미션 메타데이터 (title, goal, constraints)를 추출합니다.
3. done_when 각 조건을 평가하여 진행률을 계산합니다.
4. Markdown 형식으로 요약을 출력합니다.

## 실행 방법

```bash
node -e "
import { getMissionStatus } from '${CLAUDE_PLUGIN_ROOT}/dist/commands/status.js';
const s = getMissionStatus('.');
console.log(s.markdown);
"
```

## 출력 형식

```markdown
# 미션 제목

**Goal:** 미션 목표 텍스트

**Progress:** 3/5

## Constraints

- 제약 조건 1
- 제약 조건 2

## Done When

- [x] 완료된 조건
- [ ] 미완료 조건
  - 실패 사유
```

## Evolution 섹션 (v1.5.0+)

`mission-history.yaml`이 프로젝트 루트에 존재하면 출력에 Evolution 섹션이 추가됩니다:

```markdown
## Evolution

**Phase:** living-asset — Living Asset Registry 도입
**Revisions:** 5

- **initial-release** (1.0.0): 핵심 기능 구현
- **stabilization** (1.1.0): 이름 충돌 해소
- **hardening** (1.2.0): adversarial review 반영
- **marketplace-ready** (1.4.0): 배포 준비, 정체성 확립
- **living-asset** (1.5.0): Living Asset Registry 도입
```

반환값에 `phase`, `phaseTheme`, `totalRevisions` 필드가 추가됩니다.

## Scaffolding 섹션 (v1.16.17+)

`.mission/decisions/` 또는 `.mission/snapshots/` 디렉터리가 **존재하지만 비어 있을 때**, 각 디렉터리에 대한 remediation 힌트와 함께 Scaffolding 섹션이 추가됩니다:

```markdown
## Scaffolding

- ⚠ `.mission/decisions/` exists but empty — run `ms-decide` to record material decisions as MDRs
- ⚠ `.mission/snapshots/` exists but empty — run `npm run snapshot` (or wire into pre-commit) to capture per-revision snapshots
```

배경: qmonster 채택 감사(2026-04-21)에서 adopter가 Living Asset Registry 디렉터리를 scaffold만 하고 populate하지 않아 "기록 계약은 충실하나 검증 계약은 비활성" 패턴이 재발하는 것을 확인했습니다. 경고는 **디렉터리가 존재할 때만** 발생하며, 아예 없는 경우는 opt-out으로 간주해 경고하지 않습니다. 반환값에서는 같은 데이터를 `scaffoldingWarnings: Array<{ path, hint }>` 필드로 제공합니다.

## done_when drift 섹션 (v1.16.18+)

현재 evaluator가 auto-evaluate할 수 없는 `done_when` 엔트리(`TEST_PATTERN`에 걸리지만 대응 `evals[]`가 없는 경로 + 최종 fallback 경로, 둘 다 reason에 "manual verification required"를 포함)가 하나라도 있으면 `## done_when drift` 섹션이 추가되어 해당 엔트리를 나열합니다.

**Layout — drift 1–3개 (inline colon):**

```markdown
## done_when drift

⚠ 2/5 done_when entries cannot be auto-evaluated:

- "design_refs documented"
- "API is well-designed"

Fix: add a matching entry to `evals[]`, or rewrite as a file-existence pattern (`X 존재` / `X exists`).
```

**Layout — drift > 3개 (Sample + more):**

```markdown
## done_when drift

⚠ 50/50 done_when entries cannot be auto-evaluated.

Sample:

- "Phase 3B: advisory rules carry suggested_command where an actionable CLI snippet…"
- "Phase 3B: Recommendation.is_strong flag set on context_pressure_warning…"
- "Phase 3B: cargo build + cargo test (~155 lib + ~16 integration) + cargo clippy…"
  (+47 more — run `ms-eval` for full list)

Fix: add a matching entry to `evals[]`, or rewrite as a file-existence pattern (`X 존재` / `X exists`).
```

배경: 2026-04-21 qmonster 2차 감사에서 반복 확인된 패턴 — adopter가 `done_when`을 산문체("Phase 3B: advisory rules carry suggested_command...")로 작성하면 evaluator heuristic이 매칭하지 못해 `ms-eval`이 0/N을 보고하고, verification contract는 형식적으로만 존재하게 됩니다. `ms-status` 출력에서 즉시 surface하면 adopter는 `evals[]`를 추가하거나 파일 존재 패턴으로 재작성하는 두 선택을 바로 인지합니다.

80자를 초과하는 Sample 엔트리는 가독성을 위해 77자 + `…`로 잘라 표시합니다. 원문 전체는 반환값 `doneWhenDrift: string[]` 필드로 제공됩니다.

## meta staleness 섹션 (v1.16.19+)

`mission-history.yaml`이 존재하고 아래 중 하나라도 `history.meta`와 live mission 상태 사이에 drift가 발생하면 `## meta staleness` 섹션이 추가되어 각 drift 필드를 field-specific hint와 함께 나열합니다.

- **Rule 1 — `mission_title` 불일치:** `history.meta.mission_title`(populated된 경우)이 `mission.yaml.title`과 strict `!==` (whitespace normalization 안 함) 기준으로 다름.
- **Rule 2 — `tracking_mode`의 single-user 선언 + AI contributor 공존:** `history.meta.tracking_mode`에 single-user 키워드(`single-user`, `solo`, `local-first`, `local only`, `personal`, ...) 포함 AND 어느 `timeline[].contributors[]` 항목이든 AI 제공자(`claude`, `codex`, `gemini`, `gpt`, `copilot`, `llm` — case-insensitive substring match) 언급.

출력 예시:

```markdown
## meta staleness

- ⚠ `mission_title` — history.meta.mission_title ("Qmonster v0.4.0 — planning foundation") differs from mission.yaml.title ("Qmonster v0.4.0 — Phase 3 complete + all gates remediated + Gemini review artifa…") — sync manually or via metadata:sync equivalent
- ⚠ `tracking_mode` — "local-first (single-user)" claims single-user but contributors include "Claude Code (main pane)", "Codex (codex:1:review, ...)", "Gemini (gemini:1:research, ...)" (+6 more) — update to reflect multi-agent workflow
```

배경: 2026-04-21 qmonster 감사에서 세 meta 필드가 초기 phase 값으로 굳어지고 실제 프로젝트만 진행하는 fossilization 패턴을 확인했습니다. `mission_id`는 project-scoped라 auto-detect 안 함 (주의 항목 참고). `mission_title`과 `tracking_mode`는 위 두 규칙으로 커버.

인용된 긴 값은 truncate됩니다 — title/mode는 117자 + `…` (120-char budget), contributor 이름은 77자 + `…` (80-char budget). 고유 AI contributor가 3명 초과 시 `(+N more)`로 접힙니다. 반환값은 원문 전체를 `metaStaleness: Array<{ field, hint }>` 필드로 제공합니다.

## 주의

- `mission.yaml`이 없으면 에러를 반환합니다.
- constraints가 없으면 해당 섹션을 생략합니다.
- `mission-history.yaml`이 없으면 Evolution 섹션이 생략됩니다.
- `mission-history.yaml`이 스키마에 맞지 않으면 (v1.6.0+) 실패 대신
  Evolution 섹션에 `History unavailable: ...` 경고만 표시하고 상태 평가는 정상 수행합니다.
  반환값의 `historyWarning` 필드로도 전달됩니다.
- scaffolded-but-empty 디렉터리가 하나도 없으면 Scaffolding 섹션은 생략됩니다.
- done_when의 모든 엔트리가 auto-evaluate 가능하면(evals[] 매칭 / 파일 존재 / 기타 "manual verification required"가 아닌 reason) done_when drift 섹션은 생략됩니다.
- `mission-history.yaml`이 없으면(`metaStaleness`가 `undefined`) 또는 history가 있고 두 규칙 모두 발생 안 하면(`metaStaleness`가 `[]`) meta staleness 섹션은 생략됩니다. Schema-invalid history도 `undefined`로 귀결 — `loadHistory`가 throw하고 `historyWarning`이 대신 세팅됩니다.
- `mission_id` drift는 auto-detect **안 함** — 필드가 project-scoped이고 네이밍 convention이 프로젝트마다 다름 (예: permanent `-planning` 식별자라면 false-positive). `mission_id`는 adopter가 수동 확인.
