// Migrates mission.yaml between schema versions using registered migrators.
// Usage:
//   node scripts/migrate-mission.js <toVersion> [--apply]
//
// Default is dry-run: prints detected fromVersion, target, chain of steps,
// and the diff between current and migrated YAML. Pass --apply to overwrite
// mission.yaml in place.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse, stringify } from "yaml";
import {
  detectSchemaVersion,
  migrateMission,
  listMigrations,
} from "../dist/core/migration.js";

const projectDir = process.cwd();
const missionPath = join(projectDir, "mission.yaml");
const args = process.argv.slice(2);
const toVersion = args.find((a) => !a.startsWith("--"));
const apply = args.includes("--apply");

if (!toVersion) {
  console.error(
    "Usage: node scripts/migrate-mission.js <toVersion> [--apply]\n\n" +
      "Registered migrations: " +
      (listMigrations()
        .map((s) => `${s.from}->${s.to}`)
        .join(", ") || "(none)") +
      "\n\n" +
      "No migrations registered yet — the machinery exists so that when a\n" +
      "future schema v2 ships, registerMigration('1', '2', fn) will make\n" +
      "existing mission.yaml files upgradeable without re-plumbing.",
  );
  process.exit(1);
}

if (!existsSync(missionPath)) {
  console.error(`mission.yaml not found at ${missionPath}`);
  process.exit(1);
}

const before = readFileSync(missionPath, "utf-8");
const doc = parse(before);
const from = detectSchemaVersion(doc);

console.log(`Detected schema_version: ${from}`);
console.log(`Target schema_version:   ${toVersion}`);

try {
  const result = migrateMission(doc, from, toVersion);
  console.log(
    `Migration steps applied: ${result.applied.length === 0 ? "(none — already at target)" : result.applied.join(", ")}`,
  );
  if (from === toVersion) {
    console.log("No migration needed.");
    process.exit(0);
  }
  const after = stringify(result.migrated);
  if (apply) {
    writeFileSync(missionPath, after);
    console.log(`Wrote migrated mission.yaml to ${missionPath}`);
  } else {
    console.log("\n--- dry run: migrated YAML preview ---");
    console.log(after);
    console.log("--- end of preview ---");
    console.log("\nRe-run with --apply to overwrite mission.yaml in place.");
  }
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Migration failed: ${message}`);
  process.exit(1);
}
