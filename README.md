English | [한국어](README.ko.md) | [中文](README.zh.md)

# Mission Spec

[![GitHub](https://img.shields.io/github/license/chquandogong/mission-spec)](https://github.com/chquandogong/mission-spec)

A **task contract layer** for AI agent workflows. Not an orchestration framework — a portable, run-scoped task contract that works on top of existing harnesses. Provides a TypeScript library, a Claude Code skill bundle, and a **Living Asset Registry**.

**Repository:** https://github.com/chquandogong/mission-spec

## Core Pipeline

```text
Natural language → mission.yaml draft → eval scaffold → run report
                          ↕
                 mission-history.yaml (change ledger)
```

## 5-Minute Installation Guide

### Method 1: Install from npm (Recommended since v1.21.4)

```bash
# As a dependency
npm install mission-spec

# As a dev-only tool
npm install --save-dev mission-spec

# Use the CLI without installing globally
npx mission-spec validate
npx mission-spec snapshot
npx mission-spec backfill-commits
```

Library API:

```typescript
import {
  generateMissionDraft,
  evaluateMission,
  getMissionStatus,
  generateMissionReport,
} from "mission-spec";
```

The package is published to npm with sigstore provenance — verify with `npm view mission-spec@<version> --json` (look for `dist.attestations`).

### Method 2: Install as a Claude Code Plugin

```bash
# Run inside Claude Code
/plugin marketplace add chquandogong/mission-spec
/plugin install mission-spec@mission-spec
```

After installation, the following skills are available:

- `/mission-spec:ms-init` — Natural language → mission.yaml draft auto-generation
- `/mission-spec:ms-eval` — Evaluate current state against done_when criteria
- `/mission-spec:ms-status` — Mission progress summary
- `/mission-spec:ms-report` — Generate run report (markdown)
- `/mission-spec:ms-context` — Generate project context prompt for AI agents (v1.7.0+)
- `/mission-spec:ms-decide` — Generate Mission Decision Record (MDR) draft from a natural-language decision description (v1.14.0+)

### Method 3: Install from Source (for contributors)

```bash
git clone https://github.com/chquandogong/mission-spec.git
cd mission-spec
npm install
npm run build
```

### Method 4: Link as a Local Plugin

```bash
# In your project directory
git clone https://github.com/chquandogong/mission-spec.git .mission-spec
cd .mission-spec && npm install && npm run build && cd ..
```

Add the plugin path to `.claude/settings.json`:

```json
{
  "plugins": [".mission-spec"]
}
```

## Usage

### Generate Mission Draft (`ms-init`)

```typescript
import { generateMissionDraft } from "mission-spec";

const result = generateMissionDraft({
  goal: "Implement user authentication system",
  projectDir: ".",
});

console.log(result.yaml);
```

### Evaluate Progress (`ms-eval`)

```typescript
import { evaluateMission } from "mission-spec";

const result = evaluateMission(".");
console.log(result.summary);
```

For a fresh clone or shared-repo review, use `evaluateMission(".", { scope: "shared" })`
or `npx mission-spec eval --shared`. Shared mode treats criteria that only reference
missing gitignored local-only artifacts as skipped passes.

### Status Summary (`ms-status`)

```typescript
import { getMissionStatus } from "mission-spec";

const status = getMissionStatus(".");
console.log(status.markdown);
```

`getMissionStatus(".", { scope: "shared" })` and `npx mission-spec status --shared`
apply the same shared-clone behavior to status/drift reporting.

### Generate Report (`ms-report`)

```typescript
import { generateMissionReport } from "mission-spec";

const report = generateMissionReport(".");
console.log(report.markdown);
```

### Generate AI Agent Context (`ms-context`)

```typescript
import { generateContext } from "mission-spec";

const ctx = generateContext(".");
console.log(ctx.markdown); // Unified prompt: mission + history + architecture + API
console.log(ctx.sections); // ["mission", "design_refs", "history", "decisions", "architecture", "api"]
```

### Draft a Mission Decision Record (`ms-decide`)

```typescript
import { generateMdrDraft } from "mission-spec";

const result = generateMdrDraft({
  title: "Adopt vendor-neutral platform adapter",
  projectDir: ".",
});

console.log(result.suggestedPath); // .mission/decisions/MDR-00N-adopt-vendor-neutral-platform-adapter.md
console.log(result.nextMdrNumber); // next available MDR number
console.log(result.markdown); // scaffold with Context / Decision / Rationale / Consequences / Alternatives sections
```

Filenames are slugified with Unicode NFC + `/u` flag so Korean, Chinese, and Japanese titles produce stable, collision-free paths (v1.14.1+).

Subpath imports are also available:

```typescript
import { evaluateMission } from "mission-spec/commands/eval";
```

Migration scripts require an explicit target schema version:

```bash
npm run migrate:dry-run -- <toVersion>
npm run migrate:apply -- <toVersion>
```

No migrators are registered yet; the registry remains empty until schema v2 is defined.

## mission.yaml Format

```yaml
mission:
  title: "Mission Title"
  goal: "Mission goal"
  done_when:
    - "Completion criterion 1"
    - "Completion criterion 2"
  constraints:
    - "Constraint"
  approvals:
    - gate: "review"
      approver: "human"
  execution_hints:
    topology: "sequential"
  design_refs: # v1.7.0+
    architecture: "docs/internal/ARCHITECTURE.md"
    api_surface: "src/index.ts"
    type_definitions: "src/core/parser.ts"
    component_protocol: "docs/internal/DATA_FLOW.md"
  lineage: # v1.5.0+
    initial_version: "1.0.0"
    initial_date: "2026-04-02"
    total_revisions: 3
    history: "mission-history.yaml"
```

Full schema: [`src/schema/mission.schema.json`](src/schema/mission.schema.json)

## Living Asset Registry (v1.5.0)

Manages mission.yaml change history as structured organizational assets.

### Structure

```
project-root/
├── mission.yaml                    # Current authoritative spec
├── mission-history.yaml            # Structured change ledger
└── .mission/
    ├── CURRENT_STATE.md            # Current state dashboard
    ├── snapshots/                  # Per-version mission.yaml archives
    ├── decisions/                  # MDR (Mission Decision Records)
    └── templates/                  # Change entry + MDR templates
```

### mission-history.yaml

Tracks intent, impact scope, and done_when changes in structured YAML:

```yaml
timeline:
  - change_id: "MSC-2026-04-08-001"
    semantic_version: "1.5.0"
    date: "2026-04-08"
    author: "Dr. QUAN"
    change_type: "enhancement"
    persistence: "permanent" # permanent | transient | experimental
    intent: "Introduce Living Asset Registry"
    done_when_delta: # Track done_when changes
      added: [".claude-plugin/plugin.json exists"]
      removed: []
    impact_scope:
      schema: true
      skills: true
```

### lineage Field

When creating a new mission with `ms-init`, the `lineage` field is automatically included:

```yaml
lineage:
  initial_version: "1.0.0"
  history: "mission-history.yaml"
```

### Tool Integration

- **ms-status**: Reads `mission-history.yaml` to display current phase and evolution summary
- **ms-report**: Includes the 3 most recent changes in the report
- **ms-init**: Automatically generates `lineage` + `version` for new missions

### History API

```typescript
import {
  loadHistory,
  getCurrentPhase,
  getLatestEntry,
  validateHistory,
} from "mission-spec";

const history = loadHistory("."); // Throws on schema error (v1.6.0+)
if (history) {
  console.log(getCurrentPhase(history)); // { name: "living-asset", theme: "..." }
  console.log(getLatestEntry(history)); // Latest timeline entry
}

// Validate arbitrary data against mission-history.yaml schema
const { valid, errors } = validateHistory(anyData);
```

## LLM/Subjective Evaluation (v1.6.0+)

For done_when criteria that cannot be evaluated mechanically, define them as `llm-eval` or `llm-judge` type evals and record external verdicts in `.mission/evals/<eval-name>.result.yaml`:

```yaml
# mission.yaml
done_when:
  - "subjective_quality"
evals:
  - name: "subjective_quality"
    type: "llm-eval" # or "llm-judge"
    pass_criteria: "UX is intuitive with no user confusion"
```

```yaml
# .mission/evals/subjective_quality.result.yaml
passed: true
reason: "Reviewed by 3 reviewers"
evaluated_by: "human" # or "llm-claude", "llm-gpt5", etc.
evaluated_at: "2026-04-13"
```

`ms-eval` reads the override file to confirm the verdict. If the file doesn't exist, the criterion remains in "Awaiting LLM evaluation" status.

## Snapshots and Pre-Commit Hooks (v1.6.0+)

Automatically archive per-version snapshots of `mission.yaml` to `.mission/snapshots/` whenever it changes:

```bash
# Manual snapshot
npm run snapshot

# Auto-snapshot on commit (one-time setup)
git config core.hooksPath .githooks
```

The snapshot script performs version-based dedup — if a snapshot for the same `version` already exists, it is skipped.

Additionally, `npm run validate:history-commits` cross-references `related_commits` in `mission-history.yaml` against actual Git history. This repository's checked-in `.githooks/pre-commit` currently performs:

- Snapshot generation + staging
- CHANGELOG regeneration + staging
- `.mission/` metadata header sync + staging
- Architecture snapshot sync/verify (when `dist/core` exists)
- `related_commits` coverage validation via `npm run validate:history-commits`

This validation also catches already-committed relevant commits missing from history. To avoid self-reference issues, two exceptions are made: the **bootstrap commit** that first introduced `mission-history.yaml`, and the **current HEAD commit** if it modifies `mission-history.yaml` alongside code. Once additional commits are pushed, the previous code+history commit becomes subject to validation again.

## Pre-commit validation (v1.17.0+)

Enforce `mission.yaml` + `mission-history.yaml` schema validity at commit time. Fast (no evaluator invocation) and deterministic — block commits that would introduce schema drift before they enter the repo.

Install (default `.git/hooks/`):

```bash
npm install --save-dev mission-spec
cp node_modules/mission-spec/templates/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Team-checked-in variant (`.githooks/` + `core.hooksPath`):

```bash
mkdir -p .githooks
cp node_modules/mission-spec/templates/pre-commit .githooks/pre-commit
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks
```

The shipped `templates/pre-commit` hook runs `npx mission-spec validate`, which also works as a standalone command for CI or manual invocation. This repository's own checked-in `.githooks/pre-commit` layers additional maintainer automation on top of that baseline.

Legacy `mission-history.yaml` entries that omit empty `changes.*` / `done_when_delta.*`
arrays are normalized before validation. Malformed types still fail.

## Backfilling related_commits (v1.18.0+)

Retrofit empty `related_commits: []` arrays in `mission-history.yaml` by matching git commits within a ±1-day date window of each revision date. Dry-run by default; `--apply` writes single-candidate proposals in-place.

```bash
# Inspect proposals (no writes)
npx mission-spec backfill-commits

# Apply unambiguous single-candidate proposals
npx mission-spec backfill-commits --apply
git add mission-history.yaml
git commit -m "chore: backfill related_commits via ms-backfill-commits"
```

Classification per entry:

- **auto-apply** — exactly 1 commit in window; written under `--apply`.
- **ambiguous** — ≥2 commits in window; listed but NOT written (edit manually).
- **no-candidates** — 0 commits in window; listed, nothing to do.

The tool NEVER overwrites already-populated `related_commits` arrays.

## Snapshot on commit (v1.19.0+)

Populate `.mission/snapshots/` with a per-version copy of `mission.yaml`. Idempotent per version — re-running with the same `mission.version` returns the existing snapshot (no duplicate files). Language-independent — works anywhere Node + mission-spec is installed.

```bash
# Standalone invocation
npx mission-spec snapshot
```

Minimal adopter hook example (combines v1.17.0 validate + v1.19.0 snapshot):

```sh
#!/bin/sh
set -e
npx mission-spec validate
npx mission-spec snapshot
git add .mission/snapshots/
```

Existing v1.17.0 adopters: edit your installed `.git/hooks/pre-commit` to add the `snapshot` + `git add` lines. The `templates/pre-commit` file shipped with the package is unchanged (still single-step validate) so `cp` re-installation is not forced.

## Explicit gate linkage (v1.21.0+)

`mission.yaml` supports an optional `done_when_refs` sibling field that binds each prose `done_when` criterion to an explicit validator. Four `kind`s are supported: `command` (POSIX shell, exit 0), `file-exists` (path), `file-contains` (`path::substring` format), and `eval-ref` (delegates to a `mission.evals[].name` entry). Each ref maps via `index` to the target `done_when` entry.

```yaml
mission:
  done_when:
    - "cargo test passes"
    - "README has an Installation section"
  done_when_refs:
    - index: 0
      kind: command
      value: "cargo test"
    - index: 1
      kind: file-contains
      value: "README.md::## Installation"
```

Bound indices run their validator directly (`resolved_by: "ref"`); unbound indices fall back to the v1.20.0 inference chain. `ms-status` surfaces a `## refs coverage` section when refs are present and reclassifies drift via `resolved_by === "manual"`, and `validateProject` enforces three invariants (index range, uniqueness, `eval-ref` orphan). Release grade: §MINOR per MDR-006.

## npm package vs repository (v1.21.5+)

The `mission-spec` npm package ships only runtime essentials: `bin/`, `dist/`, `skills/`, `.claude-plugin/`, `templates/`, and the three README locales.

**Not in the npm tarball** (intentional, to keep install size small):

- `.mission/` — Living Asset Registry (evolution history, MDRs, snapshots, traceability, reconstruction playbook, verification log)
- `mission-history.yaml` — full revision timeline with decisions and related commits
- Source TypeScript, tests, scripts

To inspect the evolution of Mission Spec itself, read `.mission/` and `mission-history.yaml` **in the repository** (https://github.com/chquandogong/mission-spec). The repo holds 50+ snapshots (v1.0.0 → current), 8 MDRs, and full architecture/API/traceability registries.

**Two-track trust model**: the npm tarball is provenance-signed (sigstore, verifiable with `npm view mission-spec@<version> --json`) so you can trust the build. The repository is where the contract's evolution is audited. The two are separated by design.

## Cross-Platform Conversion

```bash
node scripts/convert-platforms.js mission.yaml
```

Generated files (v1.14.0+ — 6 platforms):

- `.cursorrules` — Cursor
- `AGENTS.md` — Codex
- `opencode.toml` — OpenCode
- `.clinerules` — Cline (v1.14.0+)
- `.continuerules` — Continue (v1.14.0+)
- `.aider.conf.yml` + `.aider-mission.md` — Aider (v1.14.0+)

Verify-only mode:

```bash
node scripts/convert-platforms.js --verify
```

## Testing

```bash
npm test
npm run test:watch
npm run build
```

## Current Scope

- Providing: schema validation, mission draft generation, rule-based evaluation, status/report generation
- Providing: cross-platform conversion for Cursor, Codex, OpenCode, Cline, Continue, Aider (v1.14.0+)
- Providing: Claude Code skill files `ms-init`, `ms-eval`, `ms-status`, `ms-report`, `ms-context`, `ms-decide`
- Providing: CLI — `npx mission-spec <context|status|eval|report|validate|backfill-commits|snapshot>` (v1.12.0+, expanded in later releases)
- Providing: Living Asset Registry — `lineage` schema, `mission-history.yaml` change ledger, MDR, snapshots
- Providing: History API — `loadHistory()`, `getCurrentPhase()`, `getLatestEntry()`, `validateHistory()`
- Providing: LLM/subjective evaluation override (`llm-eval`, `llm-judge` + `.mission/evals/<name>.result.yaml`)
- Providing: Snapshot automation (`npm run snapshot`, `.githooks/pre-commit`)
- Providing: `design_refs` schema field + `architecture_delta` history field (v1.7.0+)
- Providing: Architecture Registry, Dependency Graph, API Registry, Traceability Matrix (under `.mission/`)
- Providing: Architecture/plugin drift detectors — `extractArchitecture()`, `validatePlugin()`, `arch:sync`/`check`/`verify` (v1.10.0+, v1.11.0+)
- Providing: MDR authoring helper — `ms-decide` skill + `generateMdrDraft()` (v1.14.0+)
- Providing: Schema migration infrastructure — `detectSchemaVersion()`, `registerMigration()`, `migrateMission()` + CLI wrappers `npm run migrate:dry-run -- <toVersion>` / `npm run migrate:apply -- <toVersion>` (v1.14.0+, registry empty until schema v2)
- Providing: Reconstruction verifier — `verifyReconstructionReferences()` + `reconstruction:verify [--cold-build]` (v1.14.0+)
- Providing: Release pipeline — `.github/workflows/{test,pre-commit-parity,release}.yml` (v1.9.0+, v1.13.0+)
- Providing: `.mission/` metadata auto-sync — `scripts/bump-metadata.js` syncs Version headers + CURRENT_STATE Title line from `mission.yaml` (`npm run metadata:sync` / `metadata:check`, v1.15.0+, v1.16.3+ Title, v1.16.10+ CURRENT_STATE-scoped filename guard)
- Providing: Registry freshness verifier — `scripts/verify-registry.js` checks embedded numeric claims in `REBUILD_PLAYBOOK.md`, `TRACE_MATRIX.yaml`, and `CURRENT_STATE.md` (Title line, completion count heading `완료 조건 (N/M PASS)`, and recent-releases heading `최근 구현 (vA ~ vB)` — Korean labels kept Korean-only per MDR-007, since `.mission/` is a maintainer-facing asset) against live source via TypeScript AST (`npm run registry:check`, v1.16.0+, v1.16.2+ CURRENT_STATE, v1.16.9+ locale-tolerant Title + version range, v1.16.13+ opt-in `--verify-live` mode ties claimed PASS to `evaluateMission()` result)
- Providing: Cold-build release gate — `reconstruction:verify --cold-build` runs `npm ci + build + test` in a tmp dir as a release workflow step, proving the tagged commit rebuilds from source alone (v1.16.1+)
- Providing: `arch:verify` deep-compare for nested conditional exports in `package.json.exports` (v1.14.3+ key-set, v1.16.2+ value shape, v1.16.11+ nested depth)
- Providing: `plugin-validator` `package-lock.json` drift detection — catches lockfile version pinned to an older release (v1.16.7+)
- Providing: `vitest.config.ts` deterministic test timeouts — `testTimeout: 15000` eliminates order-dependent concurrency flakiness under `describe.concurrent` (v1.16.8+)
- Providing: Governance MDR series — `MDR-005` meta-tooling scope (v1.14.2+), `MDR-006` SemVer grade policy (v1.16.4+), `MDR-007` playbook language Hold+Trigger (v1.16.5+)
- Not included: GitHub/PR integration runtime, separate orchestration framework, SaaS/UI

## Design Principles

1. **Task Contract Only** — Does not touch orchestration, runtime, or capabilities
2. **execution_hints are suggestions** — Runtime may ignore them
3. **Integrate into existing workflows** — Fits into existing environments rather than requiring a separate platform
4. **Minimal Dependencies** — Node.js + Ajv + yaml
5. **TDD First** — Tests lock down the current scope

## Who uses Mission Spec

This is an early-stage tool. If your project uses `mission.yaml` as a durable task contract, open a PR adding your project name + one-line use case below — adoption signals drive priority more than feature requests.

- [qmonster](https://github.com/chquandogong/qmonster) — Rust TUI for multi-CLI tmux observability; uses `mission.yaml` as the phase contract and `mission-history.yaml` as the 3-vendor (Claude / Codex / Gemini) adversarial-review ledger across 9 revisions (Phase 1 → 3B).

## License

MIT
