#!/usr/bin/env node
// Sync .mission/ Version headers with package.json.version.
// Closes D-3 from PROJECT_REVIEW_V1.14.1_2026-04-17 — patch releases routinely
// left .mission/* headers stale (v1.14.0 → v1.14.1 drift observed in v1.14.1
// cross-review; manual syncs in v1.14.2/v1.14.3 proved the gap). This script
// replaces that manual step.
//
// Usage:
//   node scripts/bump-metadata.js            # dry-run: list drift, no writes
//   node scripts/bump-metadata.js --apply    # rewrite drifted headers
//   node scripts/bump-metadata.js --check    # exit 1 on drift (CI parity)
//
// Matches:    Version: X.Y.Z       in any .md/.yaml/.yml under .mission/
// Does not:   touch other files, create new headers, change Last-updated dates

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";

const projectDir = process.cwd();
const args = process.argv.slice(2);
const mode = args.includes("--apply")
  ? "apply"
  : args.includes("--check")
    ? "check"
    : "dry-run";

function loadVersion() {
  const pkgPath = join(projectDir, "package.json");
  if (!existsSync(pkgPath)) {
    throw new Error(`package.json not found at ${pkgPath}`);
  }
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  if (typeof pkg.version !== "string" || !/^\d+\.\d+\.\d+$/.test(pkg.version)) {
    throw new Error(
      `package.json version is not a semver triplet: ${JSON.stringify(pkg.version)}`,
    );
  }
  return pkg.version;
}

const VERSION_RE = /(Version:\s*)(\d+\.\d+\.\d+)/;

// Subdirectories under .mission/ whose Version fields are historical records
// (the version at the time of that artifact's creation), not the current
// project version. bump-metadata must leave them alone.
//   decisions/  — MDR "Version" field = the release that introduced the decision
//   snapshots/  — archived mission.yaml copies keyed by version
//   templates/  — placeholder text, not live metadata
//   evals/      — llm-eval verdicts scoped to the mission they verified
const EXCLUDE_SUBDIRS = new Set([
  "decisions",
  "snapshots",
  "templates",
  "evals",
]);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (EXCLUDE_SUBDIRS.has(entry)) continue;
      walk(full, out);
    } else if (/\.(md|ya?ml)$/i.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function computeUpdates(targetVersion) {
  const missionDir = join(projectDir, ".mission");
  const updates = [];
  for (const file of walk(missionDir).sort()) {
    const content = readFileSync(file, "utf-8");
    const m = content.match(VERSION_RE);
    if (!m) continue;
    if (m[2] === targetVersion) continue;
    const next = content.replace(VERSION_RE, `$1${targetVersion}`);
    updates.push({ file, from: m[2], to: targetVersion, next });
  }
  return updates;
}

function relative(file) {
  const prefix = projectDir.endsWith("/") ? projectDir : projectDir + "/";
  return file.startsWith(prefix) ? file.slice(prefix.length) : file;
}

let version;
try {
  version = loadVersion();
} catch (err) {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
}

const updates = computeUpdates(version);

if (mode === "check") {
  if (updates.length === 0) {
    process.stdout.write(
      `.mission/ Version headers in sync with package.json (${version}).\n`,
    );
    process.exit(0);
  }
  process.stderr.write(
    `.mission/ Version headers out of sync with package.json (${version}):\n`,
  );
  for (const u of updates) {
    process.stderr.write(`  - ${relative(u.file)}: ${u.from} → ${version}\n`);
  }
  process.stderr.write(
    "\nRun `node scripts/bump-metadata.js --apply` to fix.\n",
  );
  process.exit(1);
}

if (updates.length === 0) {
  process.stdout.write(
    `No changes needed; .mission/ Version headers already match ${version}.\n`,
  );
  process.exit(0);
}

if (mode === "dry-run") {
  process.stdout.write(
    `Would update ${updates.length} file(s) to version ${version}:\n`,
  );
  for (const u of updates) {
    process.stdout.write(`  - ${relative(u.file)}: ${u.from} → ${version}\n`);
  }
  process.stdout.write("\nRun with --apply to write changes.\n");
  process.exit(0);
}

// apply
for (const u of updates) {
  writeFileSync(u.file, u.next);
  process.stdout.write(`  ${relative(u.file)}: ${u.from} → ${version}\n`);
}
process.stdout.write(
  `\nUpdated ${updates.length} file(s) to version ${version}.\n`,
);
