#!/usr/bin/env node
// Verify Mission Spec's Living Asset Registry shows active dogfooding (v1.0.0 #8
// restored via MDR-009 §V v1.21.12 owner).
//
// Proves that mission-spec uses its own tool to track itself: non-scaffolded
// registry + populated timeline + traceability (related_commits backfill
// discipline) + MDR archive + snapshot archive.
//
// Exit 0 when all thresholds met, exit 1 with first gap.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const projectDir = process.cwd();

function fail(msg) {
  console.error("dogfooding gap: " + msg);
  process.exit(1);
}

function assertMin(count, min, label) {
  if (count < min) fail(`${label} has ${count}, need ≥ ${min}`);
}

// 1. mission.yaml done_when populated
const missionPath = join(projectDir, "mission.yaml");
if (!existsSync(missionPath)) fail("mission.yaml not found");
const mission = parse(readFileSync(missionPath, "utf-8"));
const doneWhen = mission?.mission?.done_when ?? [];
assertMin(doneWhen.length, 1, "mission.yaml done_when entries");

// 2. mission-history.yaml timeline populated
const historyPath = join(projectDir, "mission-history.yaml");
if (!existsSync(historyPath)) fail("mission-history.yaml not found");
const history = parse(readFileSync(historyPath, "utf-8"));
const timeline = history?.timeline ?? [];
assertMin(timeline.length, 1, "mission-history.yaml timeline entries");

// 3. related_commits coverage — proof of backfill discipline (not just intent)
// Only counts entries that should have commits (persistence != "summarized").
const expectsCommit = timeline.filter((e) => e?.persistence !== "summarized");
const withCommits = expectsCommit.filter(
  (e) => Array.isArray(e?.related_commits) && e.related_commits.length > 0,
).length;
const coverage =
  expectsCommit.length > 0 ? (withCommits / expectsCommit.length) * 100 : 100;
// Threshold: latest entry may lack its own commit (commit hash unknown at
// commit time). 50% is the practical minimum for a living registry.
if (coverage < 50) {
  fail(
    `related_commits coverage ${coverage.toFixed(1)}% (${withCommits}/${expectsCommit.length}), need ≥ 50%`,
  );
}

// 4. .mission/decisions/ — at least one MDR
const decisionsDir = join(projectDir, ".mission/decisions");
const mdrs = existsSync(decisionsDir)
  ? readdirSync(decisionsDir).filter((f) => /^MDR-\d{3}-.*\.md$/.test(f)).length
  : 0;
assertMin(mdrs, 1, ".mission/decisions/ MDR files");

// 5. .mission/snapshots/ — at least one snapshot
const snapshotsDir = join(projectDir, ".mission/snapshots");
const snaps = existsSync(snapshotsDir)
  ? readdirSync(snapshotsDir).filter((f) =>
      /^\d{4}-\d{2}-\d{2}_v.*\.yaml$/.test(f),
    ).length
  : 0;
assertMin(snaps, 1, ".mission/snapshots/ snapshot files");

console.log(
  `dogfooding active: ${doneWhen.length} done_when, ${timeline.length} timeline entries (${coverage.toFixed(1)}% related_commits coverage), ${mdrs} MDRs, ${snaps} snapshots`,
);
