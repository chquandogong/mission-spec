// ms-snapshot — create a version snapshot of mission.yaml in .mission/snapshots/.
// Pure file I/O; no git interaction. Throws on error; caller (CLI) translates.
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

export interface SnapshotResult {
  created: boolean;
  path: string;
  version: string;
  date: string;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function createSnapshot(projectDir: string): SnapshotResult {
  const missionPath = join(projectDir, "mission.yaml");
  if (!existsSync(missionPath)) {
    throw new Error(`mission.yaml not found in ${projectDir}`);
  }

  const text = readFileSync(missionPath, "utf-8");
  let parsed: unknown;
  try {
    parsed = parse(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`mission.yaml parse error: ${msg}`);
  }

  const version = (parsed as { mission?: { version?: unknown } })?.mission
    ?.version;
  if (typeof version !== "string" || version.length === 0) {
    throw new Error("mission.yaml missing version field");
  }

  const date = formatDate(new Date());
  const snapshotDir = join(projectDir, ".mission", "snapshots");
  if (!existsSync(snapshotDir)) {
    mkdirSync(snapshotDir, { recursive: true });
  }

  const newName = `${date}_v${version}_mission.yaml`;
  const existing = readdirSync(snapshotDir).find((name) =>
    name.endsWith(`_v${version}_mission.yaml`),
  );
  if (existing) {
    return {
      created: false,
      path: join(snapshotDir, existing),
      version,
      date,
    };
  }

  const newPath = join(snapshotDir, newName);
  copyFileSync(missionPath, newPath);
  return { created: true, path: newPath, version, date };
}
