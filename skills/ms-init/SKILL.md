---
name: ms-init
description: >
  Automatically generates a mission.yaml draft from a natural language goal.
  Use when the user wants to start a mission or create a mission.yaml.
  Triggered by requests like "create a mission", "generate mission.yaml", "new task contract".
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

# ms-init — Natural Language → mission.yaml Draft Generation

## Behavior

1. Ask the user for a **mission goal** in natural language (skip if already provided).
2. The current implementation checks for `package.json` and `README.md`, and reads project name and description from `package.json`.
3. Heuristically derives **title** and **done_when** criteria from the goal.
4. If `package.json` has a `scripts.test` command, scaffolds an `evals[]` automated `npm_test` entry and a matching `done_when_refs[]` `eval-ref` binding for the generated test criterion.
5. Includes user-provided constraints in **constraints** if any.
6. Generates a `mission.yaml` draft and performs schema validation.

## mission.yaml Schema (Required Fields)

```yaml
mission:
  title: string # Required — Mission title
  goal: string # Required — Mission goal (natural language)
  done_when: # Required — Completion criteria (at least 1)
    - "Criterion 1"
    - "Criterion 2"
```

## Optional Fields

- `constraints`: Constraint list
- `approvals`: Approval gates (`gate`, `approver`: human|ai|codex|ci)
- `evals`: Evaluation items (automated → command+pass_criteria required, manual → description required)
- `budget_hint`: Resource hints (advisory)
- `execution_hints`: Execution hints (advisory only — runtime may ignore)
- `skills_needed`, `artifacts`, `version`, `author`
- `lineage`: Change history reference (`initial_version`, `history` required) — v1.5.0+

## Auto-Generated Fields (v1.5.0+)

`generateMissionDraft()` automatically includes:

- `version: "1.0.0"`
- `lineage.initial_version: "1.0.0"`
- `lineage.initial_date`: Current date
- `lineage.history: "mission-history.yaml"`

## Schema Validation

Schema validation is always performed after generation:

```bash
node -e "
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { validateMission } from '${CLAUDE_PLUGIN_ROOT}/dist/schema/validator.js';
const doc = parse(readFileSync('mission.yaml', 'utf-8'));
const r = validateMission(doc);
if (r.valid) console.log('mission.yaml: VALID');
else { console.error('INVALID:', r.errors.join(', ')); process.exit(1); }
"
```

## Post-init: install pre-commit hook (v1.17.0+)

After `ms-init` produces `mission.yaml`, install the schema-validation hook so subsequent edits cannot introduce schema drift:

```bash
npm install --save-dev mission-spec
cp node_modules/mission-spec/templates/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

The hook calls `npx mission-spec validate` which exits non-zero on any schema failure in `mission.yaml` or (if present) `mission-history.yaml`. It does NOT run the evaluator — it is fast enough for every commit.

## Notes

- `execution_hints` are **suggestions**, not directives. Runtime may ignore them.
- Operates rule-based only, with no external API calls.
- The library function `generateMissionDraft()` returns a YAML string without writing to disk.
