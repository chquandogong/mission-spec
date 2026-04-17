---
name: ms-decide
description: >
  Generates a new Mission Decision Record (MDR) draft from a natural language
  description of the decision. Use when the user is about to make a non-trivial
  architectural / policy / scope change that deserves a written record.
  Triggered by requests like "write an MDR", "document this decision",
  "new decision record", "MDR-005".
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

# ms-decide — Natural Language → MDR Draft Generation

## Behavior

1. Ask the user for the **decision title** (required) and any prose on context / decision / rationale / consequences / alternatives.
2. Scan `.mission/decisions/` for existing `MDR-NNN-*.md` files and pick the next available number (zero-padded to 3 digits).
3. Slugify the title (lowercase, hyphen-separated, punctuation stripped) for the filename.
4. Render `.mission/templates/MDR_TEMPLATE.md` with the provided fields; leave explicit placeholders for sections the user did not fill.
5. Default `Status: Proposed`, today's date, and `[target version]` / `[author]` placeholders when unspecified.
6. Return the markdown and the suggested path. **The skill does not write the file by default** — the caller decides when to persist, so the user can edit first.

## MDR Triggers (from MDR_TEMPLATE.md)

1. `goal` direction changes
2. `constraints` policy changes
3. `done_when` evaluation philosophy changes
4. `evals` ↔ `done_when` linkage changes
5. public command surface / naming rule changes
6. cross-platform contract changes

If the user's proposed change does not match any of these, ms-decide should still work, but flag whether a full MDR is warranted versus a simpler `mission-history.yaml` entry.

## Invocation

Library:

```ts
import { generateMdrDraft } from "mission-spec";

const { markdown, suggestedPath, nextMdrNumber } = generateMdrDraft({
  title: "Adopt deterministic CHANGELOG generation",
  context: "CHANGELOG.md drifted from mission-history.yaml several times.",
  decision:
    "Generate CHANGELOG.md from mission-history.yaml via pre-commit hook.",
  projectDir: ".",
});
```

CLI (v1.12.0+):

```bash
# No dedicated mission-spec subcommand yet — use node + inline:
node -e "import('mission-spec').then(m => m.generateMdrDraft({title: process.argv[1], projectDir: '.'}).markdown)" "Your decision title"
```

## Related

- `.mission/decisions/` — the authoritative MDR archive
- `.mission/templates/MDR_TEMPLATE.md` — the canonical template this skill fills
- `mission-history.yaml` `related_decisions` — link an MDR ID from a history entry once the MDR is committed
