# Contributing to Mission Spec

Thanks for your interest in contributing! Mission Spec is a **task contract layer** for AI agent workflows (not an orchestration framework). This guide covers local setup, development workflow, and the mandatory change-tracking conventions that keep the Living Asset Registry honest.

## Quick Start

```bash
git clone https://github.com/chquandogong/mission-spec.git
cd mission-spec
npm install
npm run build
npm test              # 119 tests should pass
git config core.hooksPath .githooks   # enable pre-commit validation
```

## Development Workflow

### 1. Test-Driven Development (MDR-001, MDR-003)

Mission Spec's mission.yaml itself requires TDD (see the `constraints` field). In practice:

- **Write the test first** under `tests/` (vitest). Use existing patterns in `tests/commands/*.test.ts`.
- Run `npm run test:watch` while iterating.
- Only add source code that a test drives into existence.
- Keep external dependencies minimal — `ajv` and `yaml` are the only allowed runtime deps (MDR-003). Propose any addition via an MDR.

### 2. Schema changes (mission.yaml, mission-history.yaml)

Schemas live under `src/schema/`. When changing them:

1. Update the JSON Schema file.
2. Update the corresponding TypeScript types in `src/core/parser.ts` or `src/core/history.ts`.
3. Add/modify fixtures in `tests/fixtures/` and corresponding tests in `tests/schema.test.ts`.
4. If the change is breaking (removing a field, narrowing a type), document it in a new MDR (`.mission/decisions/MDR-00X-*.md`) using `.mission/templates/MDR_TEMPLATE.md`.

### 3. Recording changes — `mission-history.yaml`

Any commit touching IMPACTFUL paths **must** also update `mission-history.yaml`. IMPACTFUL paths (enforced by `scripts/validate-history-commits.js`):

```
mission.yaml, package.json, README.md,
.claude-plugin/, .githooks/,
.mission/CURRENT_STATE.md, .mission/architecture/, .mission/interfaces/,
.mission/traceability/, .mission/reconstruction/, .mission/evidence/,
.mission/decisions/, .mission/templates/,
docs/internal/,
src/, skills/, scripts/, tests/
```

Template: `.mission/templates/CHANGE_ENTRY_TEMPLATE.yaml`. Minimum required fields:

- `change_id`: `MSC-YYYY-MM-DD-NNN` (NNN = daily sequence)
- `semantic_version`: follow semver — breaking=major, feature=minor, fix=patch
- `date`, `author`, `contributors`
- `change_type`: `enhancement` | `fix` | `refactor` | `docs` | `test` | `chore`
- `persistence`: `permanent` | `transient` | `experimental`
- `intent`: one-sentence reason
- `decision`: what approach was chosen and why
- `changes`: `added` / `modified` / `removed` with file-level granularity
- `done_when_delta`: track which done_when criteria moved
- `impact_scope`: which subsystems are touched (schema/skills/api/tests/docs/runtime)
- `breaking`: boolean
- `related_commits`: SHAs (short form OK) in chronological order

Commit messages should be conventional (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`).

### 4. Pre-commit hook

The pre-commit hook (`.githooks/pre-commit`) runs:

1. `npm run snapshot` — auto-archive `mission.yaml` to `.mission/snapshots/<date>_v<version>_mission.yaml` (dedup by version)
2. `npm run changelog` — regenerate `CHANGELOG.md`
3. `npm run metadata:sync` — sync `.mission/` Version headers from repo metadata
4. `npm run arch:sync` + `npm run arch:verify` — refresh and verify architecture registry when `dist/core` exists
5. `npm run validate:history-commits` — verify that all IMPACTFUL commits have matching `related_commits` entries in history

Two exceptions prevent self-reference cycles:

- **Bootstrap commit** (the one that first added `mission-history.yaml`)
- **HEAD commit** when it modifies `mission-history.yaml` alongside code (valid for the currently-being-made commit only)

If validation fails, **never bypass with `--no-verify`**. Fix the history entry instead.

### 5. Architecture Registry

When you change module boundaries, dependencies, or public API:

- Update `.mission/architecture/ARCHITECTURE_CURRENT.yaml`
- Update `.mission/architecture/DEPENDENCY_GRAPH.yaml`
- Update `.mission/interfaces/API_REGISTRY.yaml`
- Update `.mission/traceability/TRACE_MATRIX.yaml` if requirements↔tests mapping shifts
- Add an `architecture_delta` block to your `mission-history.yaml` entry

Tip: `npm run arch-diff HEAD~1` shows what changed vs. last version.

## Pull Request Checklist

- [ ] Tests added/updated and `npm test` passes (all 119+ tests)
- [ ] `npm run build` and `npm run lint` clean (0 errors)
- [ ] `npm run snapshot` and `npm run validate:history-commits` pass (pre-commit enforces)
- [ ] `mission-history.yaml` updated if IMPACTFUL paths were touched
- [ ] If scope changed, a new MDR added under `.mission/decisions/`
- [ ] `node scripts/convert-platforms.js --verify` passes (Cursor/Codex/OpenCode exports intact)
- [ ] README or SKILL.md updated if user-facing behavior changed (trilingual: en + ko + zh)

## Decision Records (MDR)

Non-obvious architectural decisions go under `.mission/decisions/MDR-00X-<slug>.md` using `.mission/templates/MDR_TEMPLATE.md`. Existing MDRs to read before proposing changes:

- MDR-001: Task Contract Only — no orchestration, no runtime
- MDR-002: `ms-*` prefix for all Claude Code skills
- MDR-003: Minimal dependencies (ajv + yaml only)
- MDR-004: `done_when` criteria must align with `eval.name` for automated checks

## Reporting Issues

- **Bugs**: `.github/ISSUE_TEMPLATE/bug_report.md`
- **Features**: `.github/ISSUE_TEMPLATE/feature_request.md`
- For design-level changes that would alter scope, open a discussion first so it can be captured as an MDR rather than a late-stage PR revision.

## Cutting a Release (maintainers)

```bash
# 1. Bump versions together (all four must agree — enforced by plugin:verify):
#    mission.yaml, package.json, .claude-plugin/plugin.json, .claude-plugin/marketplace.json
# 2. Add a mission-history.yaml entry for the new version
# 3. Commit with standard pre-commit hooks (auto-generates CHANGELOG + snapshot)
# 4. Tag and push
git tag v1.X.Y
git push origin main v1.X.Y
```

The tag push triggers `.github/workflows/release.yml`, which verifies the tag matches `package.json`, runs full CI (build/lint/test/coverage/platforms/plugin/arch), and publishes to npm with provenance attestation. Requires `NPM_TOKEN` secret in repo settings.

To test the publish pipeline without actually publishing, use `Actions → release → Run workflow` with `dry_run: true`.

## License

By contributing, you agree that your contributions will be licensed under the MIT License (see `LICENSE`).
