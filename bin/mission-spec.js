#!/usr/bin/env node
// mission-spec CLI — dispatches to library functions. Supports:
//   mission-spec context [projectDir]
//   mission-spec status  [projectDir]
//   mission-spec eval    [projectDir]
//   mission-spec report  [projectDir]
//   mission-spec --version
//   mission-spec --help

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  generateContext,
  getMissionStatus,
  evaluateMission,
  generateMissionReport,
  validateProject,
  backfillRelatedCommits,
  createSnapshot,
} from "../dist/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadVersion() {
  const pkg = JSON.parse(
    readFileSync(join(__dirname, "..", "package.json"), "utf-8"),
  );
  return pkg.version;
}

const HELP = `Usage: mission-spec <command> [projectDir]

Commands:
  context          [dir]  Print AI-agent project context (mission + history + architecture + API)
  status           [dir]  Print mission progress summary (done_when checklist + evolution)
  eval             [dir]  Evaluate done_when criteria against current state
  report           [dir]  Generate run report (PASS/FAIL + traceability)
  validate         [dir]  Schema-check mission.yaml (+ mission-history.yaml if present); fast, for pre-commit
  backfill-commits [dir]  Scan empty related_commits arrays; propose git SHAs by ±1-day date match.
                          Dry-run by default; add --apply to write single-candidate proposals.
  snapshot         [dir]  Create a version snapshot of mission.yaml in .mission/snapshots/
                          (no-op if a snapshot for the current version already exists)

Options:
  --version       Print package version
  --help, -h      Show this message

projectDir defaults to the current working directory.

More on the library API and skill bundle: https://github.com/chquandogong/mission-spec
`;

const argv = process.argv.slice(2);

function resolveProjectDir(args) {
  const positional = args.find((arg) => !arg.startsWith("--"));
  return resolve(positional ?? process.cwd());
}

if (argv.length === 0) {
  process.stderr.write(HELP);
  process.exit(1);
}

const first = argv[0];

if (first === "--version" || first === "-v") {
  process.stdout.write(loadVersion() + "\n");
  process.exit(0);
}

if (first === "--help" || first === "-h") {
  process.stdout.write(HELP);
  process.exit(0);
}

const projectDir = resolveProjectDir(argv.slice(1));

try {
  switch (first) {
    case "context": {
      const r = generateContext(projectDir);
      process.stdout.write(r.markdown + "\n");
      break;
    }
    case "status": {
      const r = getMissionStatus(projectDir);
      process.stdout.write(r.markdown + "\n");
      break;
    }
    case "eval": {
      const r = evaluateMission(projectDir);
      process.stdout.write(r.summary + "\n");
      process.exit(r.allPassed ? 0 : 1);
      break;
    }
    case "report": {
      const r = generateMissionReport(projectDir);
      process.stdout.write(r.markdown + "\n");
      break;
    }
    case "validate": {
      const r = validateProject(projectDir);
      if (r.allValid) {
        const files = r.historyPresent
          ? "mission.yaml + mission-history.yaml"
          : "mission.yaml";
        process.stdout.write(`mission-spec: schema valid (${files})\n`);
        process.exit(0);
      }
      process.stderr.write("mission-spec: schema INVALID\n");
      if (!r.missionValid) {
        process.stderr.write("  mission.yaml:\n");
        for (const e of r.missionErrors) {
          process.stderr.write(`    - ${e}\n`);
        }
      }
      if (r.historyPresent && !r.historyValid) {
        process.stderr.write("  mission-history.yaml:\n");
        for (const e of r.historyErrors) {
          process.stderr.write(`    - ${e}\n`);
        }
      }
      process.exit(1);
      break;
    }
    case "backfill-commits": {
      const applyFlag = argv.includes("--apply");
      const r = backfillRelatedCommits(projectDir, { apply: applyFlag });
      const total = r.proposals.length;
      const autoApply = r.proposals.filter((p) => p.status === "auto-apply");
      const ambiguous = r.proposals.filter((p) => p.status === "ambiguous");
      const noCandidates = r.proposals.filter(
        (p) => p.status === "no-candidates",
      );
      if (!applyFlag) {
        process.stdout.write(
          "Scanning mission-history.yaml for entries with empty related_commits...\n\n",
        );
        process.stdout.write(`Found ${total} entries.\n\n`);
        if (total > 0) {
          process.stdout.write("Proposals:\n");
          for (const p of r.proposals) {
            process.stdout.write(
              `  ${p.change_id} (${p.revision_date}, v${p.semantic_version}):\n`,
            );
            if (p.status === "auto-apply") {
              const c = p.candidates[0];
              process.stdout.write(
                `    → AUTO-APPLY: ${c.sha} "${c.subject}"\n`,
              );
            } else if (p.status === "ambiguous") {
              process.stdout.write(
                `    ⚠ AMBIGUOUS: ${p.candidates.length} candidates\n`,
              );
              for (const c of p.candidates) {
                process.stdout.write(`      - ${c.sha} "${c.subject}"\n`);
              }
              process.stdout.write("    (edit related_commits manually)\n");
            } else {
              process.stdout.write(
                "    ✗ NO CANDIDATES: no commits in ±1-day window\n",
              );
            }
          }
          process.stdout.write(
            `\nSummary:\n  Auto-appliable (single candidate): ${autoApply.length}\n  Ambiguous (>1 candidate): ${ambiguous.length}\n  No candidates: ${noCandidates.length}\n`,
          );
          if (autoApply.length > 0) {
            process.stdout.write(
              `\nRun with --apply to write the ${autoApply.length} single-candidate proposals.\n`,
            );
          }
        }
        process.exit(0);
      }
      process.stdout.write(
        `Applying ${autoApply.length} single-candidate proposals to mission-history.yaml...\n\n`,
      );
      for (const p of autoApply) {
        process.stdout.write(
          `  ✓ ${p.change_id}: ["${p.candidates[0].sha}"]\n`,
        );
      }
      process.stdout.write(
        '\nWritten. Review:  git diff mission-history.yaml\nTo commit:       git add mission-history.yaml && git commit -m "chore: backfill related_commits via ms-backfill-commits"\n',
      );
      if (ambiguous.length + noCandidates.length > 0) {
        process.stdout.write(
          `\nSkipped:\n  ${ambiguous.length} ambiguous (multiple candidates — edit manually)\n  ${noCandidates.length} no candidates\n`,
        );
      }
      process.exit(0);
      break;
    }
    case "snapshot": {
      try {
        const r = createSnapshot(projectDir);
        const base = r.path.split("/").pop();
        if (r.created) {
          process.stdout.write(`mission-spec: snapshot created (${base})\n`);
        } else {
          process.stdout.write(
            `mission-spec: snapshot already exists for v${r.version} (${base})\n`,
          );
        }
        process.exit(0);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        process.stderr.write(`mission-spec snapshot failed: ${msg}\n`);
        process.exit(1);
      }
      break;
    }
    default: {
      process.stderr.write(`Unknown command: ${first}\n\n${HELP}`);
      process.exit(1);
    }
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`mission-spec ${first} failed: ${message}\n`);
  process.exit(1);
}
