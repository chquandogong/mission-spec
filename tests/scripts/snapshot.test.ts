import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  mkdirSync,
  readdirSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { stringify } from "yaml";

let tempDir: string;

const scriptPath = resolve(__dirname, "..", "..", "scripts", "snapshot-mission.js");

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "ms-snapshot-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("snapshot-mission", () => {
  it("creates a snapshot when no version snapshot exists yet", () => {
    writeFileSync(
      join(tempDir, "mission.yaml"),
      stringify({
        mission: {
          title: "Snapshot Test",
          goal: "Create archive",
          done_when: ["done"],
          version: "1.0.0",
        },
      }),
    );

    execFileSync("node", [scriptPath], { cwd: tempDir });

    const snapshotDir = join(tempDir, ".mission", "snapshots");
    const snapshots = readdirSync(snapshotDir).filter((name) =>
      name.endsWith("_v1.0.0_mission.yaml"),
    );
    expect(snapshots).toHaveLength(1);
  });

  it("does not create a second snapshot when the same version already exists", () => {
    writeFileSync(
      join(tempDir, "mission.yaml"),
      stringify({
        mission: {
          title: "Snapshot Test",
          goal: "Reuse archive",
          done_when: ["done"],
          version: "1.0.0",
        },
      }),
    );

    const snapshotDir = join(tempDir, ".mission", "snapshots");
    mkdirSync(snapshotDir, { recursive: true });
    writeFileSync(
      join(snapshotDir, "2026-04-08_v1.0.0_mission.yaml"),
      "mission:\n  version: 1.0.0\n",
    );

    execFileSync("node", [scriptPath], { cwd: tempDir });

    const snapshots = readdirSync(snapshotDir).filter((name) =>
      name.endsWith("_v1.0.0_mission.yaml"),
    );
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toBe("2026-04-08_v1.0.0_mission.yaml");
  });
});
