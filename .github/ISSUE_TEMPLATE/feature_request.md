---
name: Feature request
about: Suggest an enhancement or new capability
title: "[FEATURE] "
labels: enhancement
assignees: ""
---

## Problem / motivation

What problem does this solve? Which real workflow is blocked or awkward today?

## Proposed approach

What should mission-spec do? Be concrete — new schema field, new command, new skill, new script, etc.

## Scope check (important)

mission-spec is deliberately a **task contract layer only** (MDR-001). It does not do orchestration, runtime, or platform-specific runners. If your request crosses that line, please explain why it still belongs here rather than in a downstream harness.

## Alternatives considered

What else did you think about? Why is the proposed approach better?

## Impact

- [ ] Breaking schema change (requires MDR and major version bump)
- [ ] New skill or command (user-facing)
- [ ] New runtime dependency (requires MDR — see MDR-003)
- [ ] Non-breaking, additive only

## Related

- Existing MDRs: …
- Related issues / PRs: …
- External references: …
