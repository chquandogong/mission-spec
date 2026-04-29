# Support

## Where to Go

| Need | Use |
| --- | --- |
| Bug report | [Bug report template](https://github.com/chquandogong/mission-spec/issues/new?template=bug_report.md) |
| Feature request | [Feature request template](https://github.com/chquandogong/mission-spec/issues/new?template=feature_request.md) |
| Security issue | Follow [`SECURITY.md`](SECURITY.md) |
| Contributor setup | Read [`CONTRIBUTING.md`](CONTRIBUTING.md) |
| Current docs map | Read [`DOCUMENTATION.md`](DOCUMENTATION.md) |

## Scope

Mission Spec is a task contract layer. It does not provide a hosted service, a workflow orchestrator, or platform-specific runtime execution beyond evaluating the contract declared in `mission.yaml`.

Good support requests include:

- Minimal `mission.yaml` fragments that reproduce the issue.
- CLI command and output.
- Node.js version and install method.
- Whether the issue happens in npm usage, source clone usage, or Claude Code plugin usage.

Please keep one issue focused on one behavior. Larger design changes should explain the affected contract surface and whether an MDR is likely needed.
