import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { stringify } from "yaml";

let tempDir: string;

const scriptPath = resolve(
  __dirname,
  "..",
  "..",
  "scripts",
  "generate-changelog.js",
);

function writeMissionYaml(dir: string) {
  writeFileSync(
    join(dir, "mission.yaml"),
    stringify({
      mission: {
        title: "Fixture Mission",
        goal: "Test changelog",
        done_when: ["done"],
        version: "1.8.0",
      },
    }),
  );
}

function writeHistory(dir: string, timeline: unknown[]) {
  writeFileSync(
    join(dir, "mission-history.yaml"),
    stringify({
      meta: {
        mission_id: "fixture",
        mission_title: "Fixture Mission",
        tracking_since: "2026-04-01",
        tracking_mode: "semantic-version + commit-backed",
        total_revisions: timeline.length,
        latest_version: (timeline[0] as { semantic_version: string })
          .semantic_version,
      },
      timeline,
    }),
  );
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "ms-changelog-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("generate-changelog", () => {
  it("generates CHANGELOG.md with Keep-a-Changelog-style sections", () => {
    writeMissionYaml(tempDir);
    writeHistory(tempDir, [
      {
        change_id: "MSC-2026-04-15-001",
        semantic_version: "1.8.0",
        date: "2026-04-15",
        author: "Dr. QUAN",
        change_type: "enhancement",
        persistence: "permanent",
        intent: "Trilingual documentation",
        changes: {
          added: ["README.ko.md", "README.zh.md"],
          modified: ["README.md"],
          removed: [],
        },
        done_when_delta: { added: [], modified: [], removed: [] },
        impact_scope: { docs: true },
        breaking: false,
      },
      {
        change_id: "MSC-2026-04-14-001",
        semantic_version: "1.7.0",
        date: "2026-04-14",
        author: "Dr. QUAN",
        change_type: "enhancement",
        persistence: "permanent",
        intent: "Architecture Assetization",
        changes: {
          added: [".mission/architecture/ARCHITECTURE_CURRENT.yaml"],
          modified: [],
          removed: [],
        },
        done_when_delta: { added: [], modified: [], removed: [] },
        impact_scope: { schema: true },
        breaking: false,
      },
    ]);

    execFileSync("node", [scriptPath], { cwd: tempDir });

    const changelogPath = join(tempDir, "CHANGELOG.md");
    expect(existsSync(changelogPath)).toBe(true);
    const content = readFileSync(changelogPath, "utf-8");

    expect(content).toMatch(/^# Changelog/);
    expect(content).toContain("## [1.8.0] - 2026-04-15");
    expect(content).toContain("## [1.7.0] - 2026-04-14");
    expect(content).toContain("### Added");
    expect(content).toContain("README.ko.md");
    expect(content).toContain("### Changed");
    expect(content).toContain("README.md");

    const idx18 = content.indexOf("## [1.8.0]");
    const idx17 = content.indexOf("## [1.7.0]");
    expect(idx18).toBeGreaterThan(-1);
    expect(idx17).toBeGreaterThan(idx18);
  });

  it("marks breaking changes with BREAKING label", () => {
    writeMissionYaml(tempDir);
    writeHistory(tempDir, [
      {
        change_id: "MSC-2026-04-03-001",
        semantic_version: "1.1.0",
        date: "2026-04-03",
        author: "Dr. QUAN",
        change_type: "enhancement",
        persistence: "permanent",
        intent: "ms-* prefix adoption",
        changes: {
          added: [],
          modified: ["skills/init → skills/ms-init"],
          removed: [],
        },
        done_when_delta: { added: [], modified: [], removed: [] },
        impact_scope: { skills: true },
        breaking: true,
      },
    ]);

    execFileSync("node", [scriptPath], { cwd: tempDir });

    const content = readFileSync(join(tempDir, "CHANGELOG.md"), "utf-8");
    expect(content).toContain("BREAKING");
  });

  it("is idempotent — running twice yields identical output", () => {
    writeMissionYaml(tempDir);
    writeHistory(tempDir, [
      {
        change_id: "MSC-2026-04-15-001",
        semantic_version: "1.8.0",
        date: "2026-04-15",
        author: "Dr. QUAN",
        change_type: "enhancement",
        persistence: "permanent",
        intent: "Trilingual",
        changes: { added: ["X"], modified: [], removed: [] },
        done_when_delta: { added: [], modified: [], removed: [] },
        impact_scope: {},
        breaking: false,
      },
    ]);

    execFileSync("node", [scriptPath], { cwd: tempDir });
    const first = readFileSync(join(tempDir, "CHANGELOG.md"), "utf-8");
    execFileSync("node", [scriptPath], { cwd: tempDir });
    const second = readFileSync(join(tempDir, "CHANGELOG.md"), "utf-8");

    expect(second).toBe(first);
  });

  it("exits with error when mission-history.yaml is missing", () => {
    writeMissionYaml(tempDir);

    expect(() =>
      execFileSync("node", [scriptPath], { cwd: tempDir, stdio: "pipe" }),
    ).toThrow();
  });

  it("omits empty Added/Changed/Removed subsections", () => {
    writeMissionYaml(tempDir);
    writeHistory(tempDir, [
      {
        change_id: "MSC-2026-04-15-001",
        semantic_version: "1.8.0",
        date: "2026-04-15",
        author: "Dr. QUAN",
        change_type: "enhancement",
        persistence: "permanent",
        intent: "Only modified",
        changes: { added: [], modified: ["only-this.md"], removed: [] },
        done_when_delta: { added: [], modified: [], removed: [] },
        impact_scope: {},
        breaking: false,
      },
    ]);

    execFileSync("node", [scriptPath], { cwd: tempDir });
    const content = readFileSync(join(tempDir, "CHANGELOG.md"), "utf-8");

    expect(content).not.toContain("### Added");
    expect(content).not.toContain("### Removed");
    expect(content).toContain("### Changed");
  });
});
