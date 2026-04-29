---
name: ms-eval
description: >
  Evaluates the current project state against done_when criteria in mission.yaml.
  Triggered by requests like "evaluate mission", "check done_when", "verify completion criteria".
user-invocable: true
allowed-tools:
  - Read
  - Bash(node *)
  - Bash(npm *)
  - Glob
  - Grep
---

[English](SKILL.md) | [한국어](SKILL.ko.md) | [中文](SKILL.zh.md)

# ms-eval — done_when Criteria Evaluation

## Behavior

1. Reads `mission.yaml` from the current directory and validates the schema.
2. Evaluates each condition in the `done_when` list:
   - **Explicit gate linkage (v1.21.0+)**: If `mission.done_when_refs[]` binds the criterion's index, that ref wins over every heuristic. Supported ref kinds are `command`, `file-exists`, `file-contains`, and `eval-ref`.
     - `command`: run the shell command and pass on exit code 0.
     - `file-exists`: pass when the path exists.
     - `file-contains`: pass when `path::substring` is present in the file.
     - `eval-ref`: delegate to `mission.evals[].name`.
   - **Manual/LLM subjective eval linkage**: If `evals[].name` matches the criterion and `type: manual`, `llm-eval`, or `llm-judge`, looks up the override file at `.mission/evals/<name>.result.yaml`. Uses that verdict if present, otherwise marks as awaiting a recorded verdict.
   - **Automated eval linkage**: If `evals[].name` exactly matches the criterion and `type: automated`, runs the command.
   - **File existence check**: "X file exists", "X 존재" → checks if the file exists in the project.
   - **Test-related phrases**: Marks as manual verification required if no explicit automated eval exists.
   - **Other**: Cannot auto-evaluate → marks as manual verification required.
3. Outputs results as a checklist.

## How to Run

```bash
node -e "
import { evaluateMission } from '${CLAUDE_PLUGIN_ROOT}/dist/commands/eval.js';
const r = evaluateMission('.');
console.log(r.summary);
r.criteria.forEach(c => {
  const icon = c.passed ? '[x]' : '[ ]';
  console.log(icon + ' ' + c.criterion);
  if (!c.passed) console.log('  → ' + c.reason);
});
"
```

## Output Format

```
3/5 criteria passed
[x] package.json exists
[x] README.md file exists
[ ] All tests passing
  → Manual verification required: check npm test results
[x] src/index.ts exists
[ ] Deployment complete
  → Cannot auto-evaluate — manual verification required
```

## Manual/LLM Subjective Evaluation Override

For `manual`, `llm-eval`, or `llm-judge` type evals that cannot be mechanically evaluated, record external verdicts in `.mission/evals/<eval-name>.result.yaml`:

```yaml
# .mission/evals/subjective_quality.result.yaml
passed: true
reason: "Reviewed by 3 reviewers, all agreed"
evaluated_by: "human" # or "llm-claude", "llm-gpt5", etc.
evaluated_at: "2026-04-13"
```

- File exists + `passed: true` → PASS
- File exists + `passed: false` → FAIL (shows verdict reason)
- File missing → "Awaiting manual/LLM evaluation" (pending)
- Missing/invalid `passed` field → "format error"

## Notes

- Returns an error if `mission.yaml` is missing.
- Returns an error if schema is invalid.
- Prefer `done_when_refs[].kind: eval-ref` for durable criteria: keep `done_when` prose readable, and place the concrete command or external verdict contract in `evals[]`.
- `eval`, `status`, and `report` can execute shell commands declared in trusted `mission.yaml` files. Use `mission-spec validate` for schema-only checks on untrusted repositories.
- Automated eval is not executed if `evals[].name` does not match a `done_when` entry.
- `manual` / `llm-eval` / `llm-judge` type criteria remain pending until an override file is recorded.
- The `architecture_doc_freshness` eval (v1.7.0+) can verify freshness of design documents referenced by `design_refs`.
