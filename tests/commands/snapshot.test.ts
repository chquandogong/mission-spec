import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { join, basename } from "node:path";
import { tmpdir } from "node:os";
import { stringify } from "yaml";
import { createSnapshot } from "../../src/commands/snapshot.js";

let tempDir: string;

function writeMission(version = "1.0.0") {
  writeFileSync(
    join(tempDir, "mission.yaml"),
    stringify({
      mission: {
        title: "Fixture",
        goal: "test",
        done_when: ["done"],
        version,
      },
    }),
  );
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "ms-snapshot-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("createSnapshot", () => {
  it("creates a new snapshot file when none exists", () => {
    writeMission("1.2.3");
    const r = createSnapshot(tempDir);
    expect(r.created).toBe(true);
    expect(r.version).toBe("1.2.3");
    expect(existsSync(r.path)).toBe(true);
    const snapshotText = readFileSync(r.path, "utf-8");
    const originalText = readFileSync(join(tempDir, "mission.yaml"), "utf-8");
    expect(snapshotText).toBe(originalText);
  });

  it("dedupes on existing version (returns created: false + existing path)", () => {
    writeMission("2.0.0");
    const first = createSnapshot(tempDir);
    expect(first.created).toBe(true);
    const second = createSnapshot(tempDir);
    expect(second.created).toBe(false);
    expect(second.path).toBe(first.path);
    expect(second.version).toBe("2.0.0");
  });

  it("throws when mission.yaml is absent", () => {
    expect(() => createSnapshot(tempDir)).toThrow(/not found/);
  });

  it("throws when mission.yaml has no version field", () => {
    writeFileSync(
      join(tempDir, "mission.yaml"),
      stringify({
        mission: {
          title: "t",
          goal: "g",
          done_when: ["d"],
        },
      }),
    );
    expect(() => createSnapshot(tempDir)).toThrow(/missing version field/);
  });

  it("auto-creates .mission/snapshots/ when absent", () => {
    writeMission("3.0.0");
    expect(existsSync(join(tempDir, ".mission", "snapshots"))).toBe(false);
    const r = createSnapshot(tempDir);
    expect(existsSync(join(tempDir, ".mission", "snapshots"))).toBe(true);
    expect(r.created).toBe(true);
  });

  it("returns accurate fields (version / date / path / created)", () => {
    writeMission("4.5.6");
    const r = createSnapshot(tempDir);
    expect(r.version).toBe("4.5.6");
    expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(r.path).toContain(".mission/snapshots/");
    expect(r.path.endsWith("_v4.5.6_mission.yaml")).toBe(true);
    expect(typeof r.created).toBe("boolean");
  });

  it("filename follows {date}_v{version}_mission.yaml format", () => {
    writeMission("9.9.9");
    const r = createSnapshot(tempDir);
    const name = basename(r.path);
    expect(name).toMatch(/^\d{4}-\d{2}-\d{2}_v9\.9\.9_mission\.yaml$/);
  });
});
