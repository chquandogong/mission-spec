import {
  readFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const projectDir = process.cwd();
const missionPath = join(projectDir, "mission.yaml");

if (!existsSync(missionPath)) {
  process.exit(0);
}

const content = readFileSync(missionPath, "utf-8");
const missionData = parse(content);
const version = missionData?.mission?.version;

if (!version) {
  console.error("mission.yaml is missing the version field.");
  process.exit(1);
}

const dateObj = new Date();
const year = dateObj.getFullYear();
const month = String(dateObj.getMonth() + 1).padStart(2, "0");
const day = String(dateObj.getDate()).padStart(2, "0");
const date = `${year}-${month}-${day}`;

const snapshotName = `${date}_v${version}_mission.yaml`;
const snapshotDir = join(projectDir, ".mission", "snapshots");
const snapshotPath = join(snapshotDir, snapshotName);

if (!existsSync(snapshotDir)) {
  mkdirSync(snapshotDir, { recursive: true });
}

const existingSnapshot = readdirSync(snapshotDir).find((name) =>
  name.endsWith(`_v${version}_mission.yaml`),
);

if (existingSnapshot) {
  if (existingSnapshot !== snapshotName) {
    console.log(`Existing version snapshot retained: ${existingSnapshot}`);
  }
  process.exit(0);
}

if (!existsSync(snapshotPath)) {
  console.log(`New snapshot created: ${snapshotName}`);
  copyFileSync(missionPath, snapshotPath);
  // Staging is handled by the caller (e.g., pre-commit hook).
  // This script does not modify git state.
}
