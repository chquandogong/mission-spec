# Pull Request

## Summary

What changes and why. One paragraph is usually enough.

## Type of change

- [ ] Bug fix
- [ ] New feature (schema / command / skill / script)
- [ ] Refactor (no behavior change)
- [ ] Docs / trilingual sync
- [ ] Tests / coverage
- [ ] Chore / infra (CI, hooks, deps)

## Living Asset Registry updates

- [ ] `mission-history.yaml` entry added with correct `change_id`, `semantic_version`, `intent`, `decision`, `changes`, `done_when_delta`, `impact_scope`, `breaking`, `related_commits`
- [ ] If architecture shifted: `.mission/architecture/ARCHITECTURE_CURRENT.yaml` and `DEPENDENCY_GRAPH.yaml` updated
- [ ] If public API shifted: `.mission/interfaces/API_REGISTRY.yaml` updated
- [ ] If requirements↔tests mapping shifted: `.mission/traceability/TRACE_MATRIX.yaml` updated
- [ ] If a non-trivial design decision was made: new MDR added under `.mission/decisions/`
- [ ] `mission.yaml` version bumped following semver (if applicable)

## Verification

- [ ] `npm run build` passes
- [ ] `npm test` passes (all existing + new tests)
- [ ] `npm run lint` passes (0 errors)
- [ ] `node scripts/convert-platforms.js --verify` passes
- [ ] `node scripts/validate-history-commits.js` passes (also enforced by pre-commit)

## Breaking changes

If any, list them explicitly and explain the migration path. Add a note to the `mission-history.yaml` entry's `breaking: true` and `migration` fields.

## Related

- Closes #…
- Related MDR: MDR-…
- Related discussion: …
