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
  context [dir]   Print AI-agent project context (mission + history + architecture + API)
  status  [dir]   Print mission progress summary (done_when checklist + evolution)
  eval    [dir]   Evaluate done_when criteria against current state
  report  [dir]   Generate run report (PASS/FAIL + traceability)

Options:
  --version       Print package version
  --help, -h      Show this message

projectDir defaults to the current working directory.

More on the library API and skill bundle: https://github.com/chquandogong/mission-spec
`;

const argv = process.argv.slice(2);

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

const projectDir = resolve(argv[1] ?? process.cwd());

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
