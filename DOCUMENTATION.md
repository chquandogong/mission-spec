# Documentation Index

This repository has two public surfaces and one maintainer-facing audit surface. Use this index to avoid treating historical review notes as the current contract.

## Start Here

| Document | Purpose |
| --- | --- |
| [`README.md`](README.md) | Public product overview, install paths, API/CLI usage, and trust model. |
| [`README.ko.md`](README.ko.md) | Korean README locale. |
| [`README.zh.md`](README.zh.md) | Chinese README locale. |
| [`CHANGELOG.md`](CHANGELOG.md) | Generated release history from `mission-history.yaml`. |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Local setup, development workflow, registry rules, and release flow. |
| [`SECURITY.md`](SECURITY.md) | Security reporting and command-execution trust boundary. |
| [`SUPPORT.md`](SUPPORT.md) | Where to ask questions, file bugs, and request features. |

## Active Contract Assets

| Asset | Purpose |
| --- | --- |
| [`mission.yaml`](mission.yaml) | Current authoritative mission contract. |
| [`mission-history.yaml`](mission-history.yaml) | Structured change ledger for every meaningful revision. |
| [`.mission/CURRENT_STATE.md`](.mission/CURRENT_STATE.md) | Maintainer-facing current state dashboard. |
| [`.mission/decisions/`](.mission/decisions/) | MDRs: durable decision records and amendments. |
| [`.mission/snapshots/`](.mission/snapshots/) | Per-version `mission.yaml` snapshots. |
| [`.mission/architecture/`](.mission/architecture/) | Current architecture registry, computed extraction, and dependency graph. |
| [`.mission/interfaces/`](.mission/interfaces/) | Public API registry. |
| [`.mission/traceability/`](.mission/traceability/) | Requirements-to-tests traceability matrix. |
| [`.mission/reconstruction/`](.mission/reconstruction/) | Rebuild and reconstruction playbook. |
| [`.mission/evidence/`](.mission/evidence/) | Verification log and release evidence. |

## Maintainer References

| Document | Purpose |
| --- | --- |
| [`docs/internal/ARCHITECTURE.md`](docs/internal/ARCHITECTURE.md) | Human-readable architecture overview. |
| [`docs/internal/SETUP-GUIDE.md`](docs/internal/SETUP-GUIDE.md) | Maintainer setup notes. |
| [`docs/internal/STATUS.md`](docs/internal/STATUS.md) | Internal status notes. |
| [`docs/MISSION_VERSIONING_DEFINITIVE.md`](docs/MISSION_VERSIONING_DEFINITIVE.md) | Versioning policy reference. |
| [`docs/REPRODUCIBILITY_FINAL_CONSENSUS.md`](docs/REPRODUCIBILITY_FINAL_CONSENSUS.md) | Reproducibility decision context. |

## Review Archives

The `docs/claude-code/`, `docs/codex/`, and `docs/gemini/` folders contain historical review artifacts. They are useful for context, but they are not the active product contract. When they conflict with the active assets above, prefer `mission.yaml`, `mission-history.yaml`, MDRs, and the current registries.

## Documentation Rules

- Keep public behavior changes synchronized across `README.md`, `README.ko.md`, and `README.zh.md`.
- Keep generated files generated: run `npm run changelog`, `npm run metadata:sync`, and `npm run arch:sync` instead of hand-editing generated outputs.
- If a change touches user-visible behavior, update README and skills together.
- If a change touches contract semantics, record the reason in `mission-history.yaml` and add or amend an MDR when the decision is non-obvious.
