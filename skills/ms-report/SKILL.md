---
name: ms-report
description: >
  Generates a markdown run report from mission execution results.
  Triggered by requests like "create report", "mission report", "run report".
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Bash(node *)
  - Bash(npm *)
  - Glob
  - Grep
---

[English](SKILL.md) | [한국어](SKILL.ko.md) | [中文](SKILL.zh.md)

# ms-report — Run Report Generation

## Behavior

1. Reads `mission.yaml` and validates the schema.
2. Performs a full evaluation of all done_when criteria.
3. Generates a detailed report with PASS/FAIL verdict.
4. Displays the report and optionally saves to file.

## How to Run

```bash
node -e "
import { generateMissionReport } from '${CLAUDE_PLUGIN_ROOT}/dist/commands/report.js';
const r = generateMissionReport('.');
console.log(r.markdown);
"
```

## Output Format

```markdown
# Mission Report: Mission Title

**Status:** PASS (or FAIL)
**Progress:** 4/5
**Generated:** 2026-04-02T12:00:00.000Z
**Author:** author-name
**Version:** 1.0.0

## Evaluation Results

- [x] Criterion 1
- [x] Criterion 2
- [ ] Criterion 3
  - Failure reason

---

Mission Spec Report — 2026-04-02T12:00:00.000Z
```

## Saving to File

Save the report to a file when the user requests:

```bash
node -e "
import { generateMissionReport } from '${CLAUDE_PLUGIN_ROOT}/dist/commands/report.js';
import { writeFileSync } from 'node:fs';
const r = generateMissionReport('.');
writeFileSync('mission-report.md', r.markdown);
console.log('Report saved to mission-report.md');
"
```

## Recent Changes Section (v1.5.0+)

If `mission-history.yaml` exists in the project root, the 3 most recent changes are included in the report:

```markdown
## Recent Changes

### 1.5.0 (2026-04-08)

- **Intent:** Introduce Living Asset Registry
- **Type:** enhancement | **Persistence:** permanent
- Added: src/core/history.ts, lineage field, ...
- Modified: ms-status, ms-report, ms-init, ...
```

## Traceability Section (v1.7.0+)

If `.mission/traceability/TRACE_MATRIX.yaml` exists in the project root, a Traceability table is automatically included in the report:

```markdown
## Traceability

| Requirement              | Eval Type | Code                       | Tests                |
| ------------------------ | --------- | -------------------------- | -------------------- |
| schema_validation_passes | automated | scripts/validate-schema.js | tests/schema.test.ts |
```

If TRACE_MATRIX is missing, this section is automatically omitted.

## Notes

- Reports include a timestamp to distinguish each run.
- PASS is shown only when all done_when criteria are met.
- Recent Changes section is omitted if `mission-history.yaml` is missing.
- If `mission-history.yaml` does not conform to the schema (v1.6.0+), instead of failing, the report shows a `## History` section with `History unavailable: ...` warning and proceeds with evaluation. Also available via the `historyWarning` field in the return value.
- `llm-eval` / `llm-judge` type criteria are counted as PASS only when a verdict is recorded in `.mission/evals/<name>.result.yaml` (see ms-eval SKILL).
