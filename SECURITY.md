# Security Policy

## Supported Versions

Security fixes target the latest npm release and the `main` branch. Older releases may receive guidance, but fixes are normally shipped forward.

## Reporting a Vulnerability

Prefer GitHub private vulnerability reporting when it is available for this repository. If private reporting is unavailable, open a minimal GitHub issue that avoids exploit details and request a private channel.

Include:

- Affected version or commit SHA.
- Minimal reproduction steps.
- Impact assessment.
- Whether the issue requires a malicious `mission.yaml`, a malicious repository, or normal trusted-project usage.

## Command Execution Boundary

`mission-spec eval`, `mission-spec status`, and `mission-spec report` can execute commands declared in `mission.yaml` through `done_when_refs` and `evals[]`. Treat those commands like repository-owned build scripts:

- Run them only in repositories you trust.
- Use `mission-spec validate` for schema-only checks on untrusted repositories.
- Review `mission.yaml` before evaluating third-party projects.
- Do not store secrets in `mission.yaml`, `.mission/evals/*.result.yaml`, or generated reports.

## Release Integrity

The npm package is published from the release workflow with sigstore provenance. Verify a release with:

```bash
npm view mission-spec@<version> --json
```

Look for `dist.attestations.provenance`.
