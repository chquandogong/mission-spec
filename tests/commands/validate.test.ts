import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify } from "yaml";
import { validateProject } from "../../src/commands/validate.js";

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "ms-validate-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("validateProject", () => {
  it("reports mission.yaml not found", () => {
    const r = validateProject(tempDir);
    expect(r.allValid).toBe(false);
    expect(r.missionValid).toBe(false);
    expect(r.missionErrors.join("\n")).toMatch(/not found/);
    expect(r.historyPresent).toBe(false);
  });

  it("reports mission.yaml YAML parse error", () => {
    writeFileSync(join(tempDir, "mission.yaml"), "mission: [\n  unterminated");
    const r = validateProject(tempDir);
    expect(r.missionValid).toBe(false);
    expect(r.missionErrors.join("\n")).toMatch(/parse error/);
    expect(r.allValid).toBe(false);
  });

  it("reports mission.yaml schema invalid", () => {
    writeFileSync(
      join(tempDir, "mission.yaml"),
      stringify({ mission: { title: "missing done_when and goal" } }),
    );
    const r = validateProject(tempDir);
    expect(r.missionValid).toBe(false);
    expect(r.missionErrors.length).toBeGreaterThan(0);
    expect(r.allValid).toBe(false);
  });

  it("treats absent mission-history.yaml as valid when mission.yaml is valid", () => {
    writeFileSync(
      join(tempDir, "mission.yaml"),
      stringify({
        mission: {
          title: "t",
          goal: "g",
          done_when: ["done"],
        },
      }),
    );
    const r = validateProject(tempDir);
    expect(r.missionValid).toBe(true);
    expect(r.historyPresent).toBe(false);
    expect(r.historyValid).toBe(true);
    expect(r.historyErrors).toEqual([]);
    expect(r.allValid).toBe(true);
  });

  it("accepts valid mission.yaml + valid mission-history.yaml", () => {
    writeFileSync(
      join(tempDir, "mission.yaml"),
      stringify({
        mission: {
          title: "t",
          goal: "g",
          done_when: ["done"],
        },
      }),
    );
    writeFileSync(
      join(tempDir, "mission-history.yaml"),
      stringify({
        meta: {
          mission_id: "t",
          total_revisions: 0,
          latest_version: "1.0.0",
        },
        timeline: [],
      }),
    );
    const r = validateProject(tempDir);
    expect(r.missionValid).toBe(true);
    expect(r.historyPresent).toBe(true);
    expect(r.historyValid).toBe(true);
    expect(r.allValid).toBe(true);
  });

  it("reports schema-invalid mission-history.yaml independently of valid mission.yaml", () => {
    writeFileSync(
      join(tempDir, "mission.yaml"),
      stringify({
        mission: {
          title: "t",
          goal: "g",
          done_when: ["done"],
        },
      }),
    );
    writeFileSync(
      join(tempDir, "mission-history.yaml"),
      stringify({ meta: {} }),
    );
    const r = validateProject(tempDir);
    expect(r.missionValid).toBe(true);
    expect(r.historyPresent).toBe(true);
    expect(r.historyValid).toBe(false);
    expect(r.historyErrors.length).toBeGreaterThan(0);
    expect(r.allValid).toBe(false);
  });

  it("reports mission-history.yaml YAML parse error", () => {
    writeFileSync(
      join(tempDir, "mission.yaml"),
      stringify({
        mission: {
          title: "t",
          goal: "g",
          done_when: ["done"],
        },
      }),
    );
    writeFileSync(join(tempDir, "mission-history.yaml"), "meta: {\n  broken");
    const r = validateProject(tempDir);
    expect(r.missionValid).toBe(true);
    expect(r.historyPresent).toBe(true);
    expect(r.historyValid).toBe(false);
    expect(r.historyErrors.join("\n")).toMatch(/parse error/);
    expect(r.allValid).toBe(false);
  });
});
