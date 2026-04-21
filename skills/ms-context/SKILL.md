---
name: ms-context
description: >
  Synthesizes Mission Spec assets into a project context prompt for AI agents.
  Triggered by requests like "give me context", "project summary", "new agent briefing".
user-invocable: true
allowed-tools:
  - Read
  - Bash(node *)
  - Bash(npm *)
  - Glob
  - Grep
---

[English](SKILL.md) | [한국어](SKILL.ko.md) | [中文](SKILL.zh.md)

# ms-context — AI Agent Context Prompt Generation

## Behavior

1. Reads `mission.yaml` and extracts goal, constraints, and completion criteria.
2. Includes design document locations from `design_refs` if available.
3. Extracts evolution summary and latest changes from `mission-history.yaml`.
4. Collects key decision titles from `.mission/decisions/MDR-*.md`.
5. Renders module structure as a table from `.mission/architecture/ARCHITECTURE_CURRENT.yaml`.
6. Extracts public API list from `.mission/interfaces/API_REGISTRY.yaml`.
7. Combines all information into a single markdown output.

## How to Run

```bash
node -e "
import { generateContext } from '${CLAUDE_PLUGIN_ROOT}/dist/commands/context.js';
const c = generateContext('.');
console.log(c.markdown);
"
```

## Output Format

```markdown
# Project Context

## Mission: Mission Title

**Goal:** Mission goal
**Version:** 1.7.0

### Constraints

- Constraint 1

### Done When

- Completion criterion 1

## Design References

- **architecture:** `docs/internal/ARCHITECTURE.md`

## Evolution Summary

**Current Phase:** architecture-assetization — Architecture knowledge assetization
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

## Notes

- Returns an error if `mission.yaml` is missing.
- Each optional section (history, architecture, API, etc.) is automatically omitted if the corresponding file is missing.
- The output can be used as a system prompt or first message for a new AI agent.
- The `sections` array in the return value indicates which sections were included.
