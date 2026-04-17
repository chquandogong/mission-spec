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

### Method 1: Install from Claude Code Marketplace (Recommended)

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

### Method 2: Install from Source

```bash
git clone https://github.com/chquandogong/mission-spec.git
cd mission-spec
npm install
npm run build
```

### Method 3: Link as a Local Plugin

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

### Status Summary (`ms-status`)

```typescript
import { getMissionStatus } from "mission-spec";

const status = getMissionStatus(".");
console.log(status.markdown);
```

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

Subpath imports are also available:

```typescript
import { evaluateMission } from "mission-spec/commands/eval";
```

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

Additionally, `npm run validate:history-commits` cross-references `related_commits` in `mission-history.yaml` against actual Git history. The pre-commit hook performs both:

- Generates and stages new version snapshots
- Validates that contract-related staged changes include `mission-history.yaml`

This validation also catches already-committed relevant commits missing from history. To avoid self-reference issues, two exceptions are made: the **bootstrap commit** that first introduced `mission-history.yaml`, and the **current HEAD commit** if it modifies `mission-history.yaml` alongside code. Once additional commits are pushed, the previous code+history commit becomes subject to validation again.

## Cross-Platform Conversion

```bash
node scripts/convert-platforms.js mission.yaml
```

Generated files:

- `.cursorrules` - For Cursor
- `AGENTS.md` - For Codex
- `opencode.toml` - For OpenCode

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
- Providing: cross-platform conversion for Cursor, Codex, OpenCode
- Providing: Claude Code skill files `ms-init`, `ms-eval`, `ms-status`, `ms-report`
- Providing: Living Asset Registry — `lineage` schema, `mission-history.yaml` change ledger, MDR, snapshots
- Providing: History API — `loadHistory()`, `getCurrentPhase()`, `getLatestEntry()`, `validateHistory()`
- Providing: LLM/subjective evaluation override (`llm-eval`, `llm-judge` + `.mission/evals/<name>.result.yaml`)
- Providing: Snapshot automation (`npm run snapshot`, `.githooks/pre-commit`)
- Providing: `design_refs` schema field + `architecture_delta` history field (v1.7.0+)
- Providing: Architecture Registry, Dependency Graph, API Registry, Traceability Matrix (under `.mission/`)
- Not included: GitHub/PR integration runtime, separate orchestration framework, SaaS/UI

## Design Principles

1. **Task Contract Only** — Does not touch orchestration, runtime, or capabilities
2. **execution_hints are suggestions** — Runtime may ignore them
3. **Integrate into existing workflows** — Fits into existing environments rather than requiring a separate platform
4. **Minimal Dependencies** — Node.js + Ajv + yaml
5. **TDD First** — Tests lock down the current scope

## Who uses Mission Spec

This is an early-stage tool. If your project uses `mission.yaml` as a durable task contract, open a PR adding your project name + one-line use case below — adoption signals drive priority more than feature requests.

- _(your project here)_

## License

MIT
