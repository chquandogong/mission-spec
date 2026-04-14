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
3. Evaluates each done_when condition to calculate progress.
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

## Notes

- Returns an error if `mission.yaml` is missing.
- Omits the Constraints section if no constraints are defined.
- Omits the Evolution section if `mission-history.yaml` is missing.
- If `mission-history.yaml` does not conform to the schema (v1.6.0+), instead of failing, shows a `History unavailable: ...` warning in the Evolution section and proceeds with status evaluation. Also available via the `historyWarning` field in the return value.
