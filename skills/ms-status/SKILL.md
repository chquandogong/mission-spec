---
name: ms-status
description: >
  Summarizes mission progress as markdown based on mission.yaml.
  Triggered by requests like "mission status", "progress", "how far along".
user-invocable: true
allowed-tools:
  - Read
  - Bash(node *)
  - Bash(npm *)
  - Glob
  - Grep
---

[English](SKILL.md) | [한국어](SKILL.ko.md) | [中文](SKILL.zh.md)

# ms-status — Mission Progress Summary

## Behavior

1. Reads `mission.yaml` and validates the schema.
2. Extracts mission metadata (title, goal, constraints).
3. Evaluates each done_when condition to calculate progress. If `done_when_refs[]` is present, bound entries are reported as `resolved_by: "ref"` with a `ref_kind`.
4. Outputs a summary in Markdown format.

## How to Run

```bash
node -e "
import { getMissionStatus } from '${CLAUDE_PLUGIN_ROOT}/dist/commands/status.js';
const s = getMissionStatus('.');
console.log(s.markdown);
"
```

## Output Format

```markdown
# Mission Title

**Goal:** Mission goal text

**Progress:** 3/5

## Constraints

- Constraint 1
- Constraint 2

## Done When

- [x] Completed criterion
- [ ] Incomplete criterion
  - Failure reason
```

## Evolution Section (v1.5.0+)

If `mission-history.yaml` exists in the project root, an Evolution section is added to the output:

```markdown
## Evolution

**Phase:** living-asset — Introduce Living Asset Registry
**Revisions:** 5

- **initial-release** (1.0.0): Core feature implementation
- **stabilization** (1.1.0): Resolve name conflicts
- **hardening** (1.2.0): Reflect adversarial review
- **marketplace-ready** (1.4.0): Release preparation, identity established
- **living-asset** (1.5.0): Introduce Living Asset Registry
```

The return value includes `phase`, `phaseTheme`, and `totalRevisions` fields.

## Scaffolding Section (v1.16.17+)

If `.mission/decisions/` or `.mission/snapshots/` **exists but is empty**, a Scaffolding section is appended with a remediation hint per directory:

```markdown
## Scaffolding

- ⚠ `.mission/decisions/` exists but empty — run `ms-decide` to record material decisions as MDRs
- ⚠ `.mission/snapshots/` exists but empty — run `npm run snapshot` (or wire into pre-commit) to capture per-revision snapshots
```

Rationale: the qmonster adoption audit (2026-04-21) surfaced a recurring pattern — adopters scaffold Living Asset Registry directories but never populate them, leaving the recording contract faithful and the verification contract inert. Warning fires **only when a directory is present**; absent directories are treated as an opt-out and do not warn. The return value exposes the same data via the `scaffoldingWarnings: Array<{ path, hint }>` field.

## done_when drift Section (v1.16.18+)

If any `done_when` entry cannot be auto-evaluated by the current evaluator (`resolved_by === "manual"`), a `## done_when drift` section is appended listing the unevaluable entries.

**Layout — drift 1 to 3 entries (inline colon):**

```markdown
## done_when drift

⚠ 2/5 done_when entries cannot be auto-evaluated:

- "design_refs documented"
- "API is well-designed"

Fix: add a matching entry to `evals[]`, or rewrite as a file-existence pattern (`X 존재` / `X exists`).
```

**Layout — drift > 3 entries (Sample + more):**

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

Rationale: the 2026-04-21 qmonster audit (2nd pass) surfaced a recurring pattern — adopters write `done_when` as narrative prose ("Phase 3B: advisory rules carry suggested_command...") that no evaluator heuristic can score, so `ms-eval` reports 0/N despite the verification contract being syntactically present. Surfacing the drift at `ms-status` gives the adopter a direct signal to either add `done_when_refs[]` / `evals[]` entries or rewrite conditions as file-existence patterns.

Sample entries longer than 80 characters are truncated to 77 + `…` for readability. The return value exposes the full, untruncated list via `doneWhenDrift: string[]`.

## refs coverage Section (v1.21.0+)

When at least one criterion is resolved through `done_when_refs[]`, `ms-status` appends a `## refs coverage` section. It reports how many `done_when` entries are explicitly bound, summarizes `ref_kind` counts, and lists unbound indices that still rely on inference fallback.

```markdown
## refs coverage

done_when 3/5 bound via done_when_refs (eval-ref 2, file-contains 1). 2개는 inference fallback 중: [index 3], [index 4]
```

Use this section as a contract-quality signal: `eval-ref` bindings are usually the most maintainable because prose remains in `done_when` while concrete validation stays in `evals[]`.

## meta staleness Section (v1.16.19+)

If `mission-history.yaml` is present AND any of the following drifts between `history.meta` and live mission state, a `## meta staleness` section is appended listing each drifted field with a field-specific hint:

- **Rule 1 — `mission_title` mismatch:** `history.meta.mission_title` (if populated) differs from `mission.yaml.title` (strict `!==`, no whitespace normalization).
- **Rule 2 — `tracking_mode` single-user claim with AI contributors:** `history.meta.tracking_mode` contains a single-user keyword (`single-user`, `solo`, `local-first`, `local only`, `personal`, ...) AND any `timeline[].contributors[]` entry mentions an AI provider (`claude`, `codex`, `gemini`, `gpt`, `copilot`, `llm` — case-insensitive substring match).

Example output:

```markdown
## meta staleness

- ⚠ `mission_title` — history.meta.mission_title ("Qmonster v0.4.0 — planning foundation") differs from mission.yaml.title ("Qmonster v0.4.0 — Phase 3 complete + all gates remediated + Gemini review artifa…") — sync manually or via metadata:sync equivalent
- ⚠ `tracking_mode` — "local-first (single-user)" claims single-user but contributors include "Claude Code (main pane)", "Codex (codex:1:review, ...)", "Gemini (gemini:1:research, ...)" (+6 more) — update to reflect multi-agent workflow
```

Rationale: the 2026-04-21 qmonster audit surfaced three meta fields that fossilize at early-phase values while the project advances. `mission_id` is project-scoped and not auto-detected (see Notes). `mission_title` and `tracking_mode` are covered by the two rules above.

Long quoted values are truncated — titles/modes to 117 chars + `…` (120-char budget), contributor names to 77 + `…` (80-char budget). Unique AI contributors beyond 3 collapse into `(+N more)`. The return value exposes the full data via `metaStaleness: Array<{ field, hint }>`.

## Notes

- Returns an error if `mission.yaml` is missing.
- Omits the Constraints section if no constraints are defined.
- Omits the Evolution section if `mission-history.yaml` is missing.
- If `mission-history.yaml` does not conform to the schema (v1.6.0+), instead of failing, shows a `History unavailable: ...` warning in the Evolution section and proceeds with status evaluation. Also available via the `historyWarning` field in the return value.
- Omits the Scaffolding section if no scaffolded-but-empty directories are detected.
- Omits the done_when drift section if every criterion is auto-evaluable (resolved via `evals[]`, file-existence match, or otherwise not marked "manual verification required").
- Omits the meta staleness section when `mission-history.yaml` is absent (`metaStaleness` stays `undefined`) or when history is present and neither rule fires (`metaStaleness` is `[]`). Schema-invalid history also yields `undefined` because `loadHistory` throws and `historyWarning` is set instead.
- `mission_id` drift is NOT auto-detected — the field is project-scoped and naming conventions vary (e.g., permanent `-planning` identifiers would false-positive). Adopters review `mission_id` manually.
