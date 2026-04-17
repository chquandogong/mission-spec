#!/usr/bin/env node
// Sync .mission/ metadata with project state.
// D-3 (v1.15.0): Version headers ← package.json.version
// E-6 (v1.16.3): CURRENT_STATE.md Title line ← mission.yaml.mission.title
//
// Before v1.15.0, patch releases left .mission/* headers stale (v1.14.0 →
// v1.14.1 drift observed in v1.14.1 cross-review). Before v1.16.3, the Title
// line in CURRENT_STATE.md still needed manual editing (v1.16.2 registry:check
// flagged drift but did not fix it). This script now handles both.
//
// Usage:
//   node scripts/bump-metadata.js            # dry-run: list drift, no writes
//   node scripts/bump-metadata.js --apply    # rewrite drifted headers + title
//   node scripts/bump-metadata.js --check    # exit 1 on drift (CI parity)
//
// Matches:    Version: X.Y.Z       in any .md/.yaml/.yml under .mission/
//             - **Title:** …       in CURRENT_STATE.md (mission.yaml.title)
// Does not:   touch other files, create new headers, change Last-updated dates

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

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

// E-6: mission.yaml.title is the source of truth for CURRENT_STATE.md Title.
// Returns null if mission.yaml is absent or malformed so the Version sync
// still works in hand-rolled or partial fixtures.
function loadMissionTitle() {
  const missionPath = join(projectDir, "mission.yaml");
  if (!existsSync(missionPath)) return null;
  try {
    const parsed = parseYaml(readFileSync(missionPath, "utf-8"));
    const title = parsed?.mission?.title;
    return typeof title === "string" ? title : null;
  } catch {
    return null;
  }
}

const VERSION_RE = /(Version:\s*)(\d+\.\d+\.\d+)/;
const TITLE_RE = /^(\s*-\s*\*\*Title:\*\*\s+)(.+?)\s*$/m;

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

// A single file can accumulate multiple edits (Version + Title). We apply them
// sequentially in-memory, then emit one entry per (file, field) pair so the
// output still reports each drift separately, but the write is single-pass.
function computeUpdates(targetVersion, missionTitle) {
  const missionDir = join(projectDir, ".mission");
  const updates = [];
  for (const file of walk(missionDir).sort()) {
    const content = readFileSync(file, "utf-8");
    let next = content;
    const fileChanges = [];

    const vm = next.match(VERSION_RE);
    if (vm && vm[2] !== targetVersion) {
      next = next.replace(VERSION_RE, `$1${targetVersion}`);
      fileChanges.push({
        field: "Version",
        from: vm[2],
        to: targetVersion,
      });
    }

    // E-6: Title line applies only to files that carry one (currently just
    // CURRENT_STATE.md). TITLE_RE is intentionally conservative — it matches
    // `- **Title:** …` with optional leading whitespace, nothing else, so MDR
    // / snapshot bodies don't get rewritten even if they happen to quote a
    // title elsewhere. decisions/ / snapshots/ / templates/ / evals/ are also
    // excluded by EXCLUDE_SUBDIRS.
    if (missionTitle != null) {
      const tm = next.match(TITLE_RE);
      if (tm && tm[2].trim() !== missionTitle) {
        next = next.replace(TITLE_RE, `$1${missionTitle}`);
        fileChanges.push({
          field: "Title",
          from: tm[2].trim(),
          to: missionTitle,
        });
      }
    }

    for (const change of fileChanges) {
      updates.push({ file, next, ...change });
    }
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

const missionTitle = loadMissionTitle();
const updates = computeUpdates(version, missionTitle);

function formatLine(u) {
  return `${relative(u.file)} ${u.field}: ${u.from} → ${u.to}`;
}

if (mode === "check") {
  if (updates.length === 0) {
    process.stdout.write(
      `.mission/ Version headers in sync with package.json (${version}).\n`,
    );
    process.exit(0);
  }
  process.stderr.write(
    `.mission/ metadata out of sync with package.json / mission.yaml:\n`,
  );
  for (const u of updates) {
    process.stderr.write(`  - ${formatLine(u)}\n`);
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
  process.stdout.write(`Would update ${updates.length} entry(ies):\n`);
  for (const u of updates) {
    process.stdout.write(`  - ${formatLine(u)}\n`);
  }
  process.stdout.write("\nRun with --apply to write changes.\n");
  process.exit(0);
}

// apply — because a single file may appear in multiple `updates` entries
// (Version + Title), dedupe the writes by keeping only the *last* `next` per
// file (which has all edits applied), but still print every drift line.
const lastNextForFile = new Map();
for (const u of updates) lastNextForFile.set(u.file, u.next);
for (const [file, next] of lastNextForFile) writeFileSync(file, next);
for (const u of updates) {
  process.stdout.write(`  ${formatLine(u)}\n`);
}
process.stdout.write(
  `\nUpdated ${lastNextForFile.size} file(s) (${updates.length} field edit(s)) to match version ${version}.\n`,
);
