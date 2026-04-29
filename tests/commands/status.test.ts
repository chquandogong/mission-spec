import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { stringify } from "yaml";
import {
  getMissionStatus,
  type StatusResult,
} from "../../src/commands/status.js";

let tempDir: string;

function writeMission(dir: string, mission: Record<string, unknown>) {
  writeFileSync(join(dir, "mission.yaml"), stringify({ mission }));
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "ms-status-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("getMissionStatus", () => {
  it("returns mission title and goal", () => {
    writeMission(tempDir, {
      title: "My Mission",
      goal: "Do something great",
      done_when: ["task done"],
    });
    const result = getMissionStatus(tempDir);
    expect(result.title).toBe("My Mission");
    expect(result.goal).toBe("Do something great");
  });

  it("shows progress as fraction", () => {
    writeMission(tempDir, {
      title: "Progress",
      goal: "Track progress",
      done_when: ["package.json 존재", "missing.txt 존재"],
    });
    writeFileSync(join(tempDir, "package.json"), "{}");
    const result = getMissionStatus(tempDir);
    expect(result.passed).toBe(1);
    expect(result.total).toBe(2);
    expect(result.progress).toBe("1/2");
  });

  it("includes constraints if present", () => {
    writeMission(tempDir, {
      title: "Constrained",
      goal: "Constrained mission",
      done_when: ["done"],
      constraints: ["no external deps", "TDD only"],
    });
    const result = getMissionStatus(tempDir);
    expect(result.constraints).toEqual(["no external deps", "TDD only"]);
  });

  it("returns empty constraints when none specified", () => {
    writeMission(tempDir, {
      title: "Simple",
      goal: "Simple mission",
      done_when: ["done"],
    });
    const result = getMissionStatus(tempDir);
    expect(result.constraints).toEqual([]);
  });

  it("throws when mission.yaml is missing", () => {
    expect(() => getMissionStatus(tempDir)).toThrow();
  });

  it("throws on schema-invalid mission.yaml", () => {
    writeFileSync(
      join(tempDir, "mission.yaml"),
      stringify({ mission: { title: "bad" } }),
    );
    expect(() => getMissionStatus(tempDir)).toThrow(/schema/i);
  });

  it("returns markdown-formatted output", () => {
    writeMission(tempDir, {
      title: "Markdown",
      goal: "Test markdown",
      done_when: ["condition 1"],
    });
    const result = getMissionStatus(tempDir);
    expect(result.markdown).toContain("# Markdown");
    expect(result.markdown).toContain("condition 1");
  });

  it("falls back gracefully when mission-history.yaml is invalid", () => {
    writeMission(tempDir, {
      title: "History Fallback",
      goal: "Status still works",
      done_when: ["condition 1"],
    });
    writeFileSync(join(tempDir, "mission-history.yaml"), "meta: {}\n");
    const result = getMissionStatus(tempDir);
    expect(result.progress).toBe("0/1");
    expect(result.historyWarning).toContain("History unavailable");
    expect(result.markdown).toContain("History unavailable");
  });

  it("loads legacy mission-history.yaml entries that omit changes subfields", () => {
    writeMission(tempDir, {
      title: "Legacy History",
      goal: "Status stays readable for adopters",
      done_when: ["package.json 존재"],
    });
    writeFileSync(join(tempDir, "package.json"), "{}");
    writeFileSync(
      join(tempDir, "mission-history.yaml"),
      stringify({
        meta: {
          mission_id: "legacy",
          mission_title: "Legacy History",
          total_revisions: 1,
          latest_version: "1.0.0",
        },
        timeline: [
          {
            change_id: "MSC-2026-01-01-001",
            semantic_version: "1.0.0",
            date: "2026-01-01",
            author: "t",
            change_type: "fix",
            persistence: "permanent",
            intent: "legacy entry",
            changes: { modified: ["mission.yaml"] },
            done_when_delta: { modified: [] },
            impact_scope: {},
            breaking: false,
          },
        ],
        evolution_summary: {
          phases: [
            {
              name: "bootstrap",
              versions: ["1.0.0"],
              date_range: "2026-01-01",
              theme: "legacy",
              description: "legacy adopter fixture",
            },
          ],
        },
      }),
    );

    const result = getMissionStatus(tempDir);
    expect(result.historyWarning).toBeUndefined();
    expect(result.phase).toBe("bootstrap");
    expect(result.markdown).toContain("**Revisions:** 1");
  });

  it("warns about scaffolded-but-empty .mission/decisions with remediation hint", () => {
    writeMission(tempDir, {
      title: "Scaffolded Empty",
      goal: "Detect empty decisions dir",
      done_when: ["done"],
    });
    mkdirSync(join(tempDir, ".mission", "decisions"), { recursive: true });
    const result = getMissionStatus(tempDir);
    expect(result.scaffoldingWarnings).toEqual([
      expect.objectContaining({
        path: ".mission/decisions",
        hint: expect.stringContaining("ms-decide"),
      }),
    ]);
    expect(result.markdown).toContain(".mission/decisions");
    expect(result.markdown).toContain("ms-decide");
  });

  it("warns about scaffolded-but-empty .mission/snapshots with snapshot hint", () => {
    writeMission(tempDir, {
      title: "Empty Snapshots",
      goal: "Detect empty snapshots dir",
      done_when: ["done"],
    });
    mkdirSync(join(tempDir, ".mission", "snapshots"), { recursive: true });
    const result = getMissionStatus(tempDir);
    const paths = (result.scaffoldingWarnings ?? []).map((w) => w.path);
    expect(paths).toContain(".mission/snapshots");
    const snapshotWarning = result.scaffoldingWarnings?.find(
      (w) => w.path === ".mission/snapshots",
    );
    expect(snapshotWarning?.hint).toMatch(/snapshot/i);
  });

  it("does not warn when scaffolded dirs have content", () => {
    writeMission(tempDir, {
      title: "Populated",
      goal: "No warnings when populated",
      done_when: ["done"],
    });
    const decisionsDir = join(tempDir, ".mission", "decisions");
    mkdirSync(decisionsDir, { recursive: true });
    writeFileSync(join(decisionsDir, "MDR-001-test.md"), "# MDR-001");
    const result = getMissionStatus(tempDir);
    expect(result.scaffoldingWarnings ?? []).toEqual([]);
  });

  it("does not warn when scaffolded dirs are absent (only warn if declared-but-empty)", () => {
    writeMission(tempDir, {
      title: "No Dirs",
      goal: "No warnings when scaffold never created",
      done_when: ["done"],
    });
    const result = getMissionStatus(tempDir);
    expect(result.scaffoldingWarnings ?? []).toEqual([]);
  });

  it("omits the done_when drift section when no drift detected", () => {
    writeMission(tempDir, {
      title: "No drift",
      goal: "All criteria resolvable",
      done_when: ["package.json 존재"],
    });
    writeFileSync(join(tempDir, "package.json"), "{}");
    const result = getMissionStatus(tempDir);
    expect(result.doneWhenDrift ?? []).toEqual([]);
    expect(result.markdown).not.toContain("## done_when drift");
  });

  it("includes TEST_PATTERN criterion (unresolved test-pass prose) in doneWhenDrift", () => {
    writeMission(tempDir, {
      title: "Test-pattern drift",
      goal: "Verify drift inclusion",
      done_when: ["cargo tests pass"],
    });
    const result = getMissionStatus(tempDir);
    expect(result.doneWhenDrift).toEqual(["cargo tests pass"]);
  });

  it("omits shared-mode local-only criteria from done_when drift by marking them skipped", () => {
    execFileSync("git", ["init", "-q"], { cwd: tempDir });
    writeFileSync(join(tempDir, ".gitignore"), "/.docs/\n");
    writeMission(tempDir, {
      title: "Shared Drift",
      goal: "Shared clone should not drift on local docs",
      done_when: [
        "Phase 0: .docs/final/review.md exists and was consumed by the reviewer",
      ],
    });

    const result = getMissionStatus(tempDir, { scope: "shared" });
    expect(result.doneWhenDrift ?? []).toEqual([]);
    expect(result.markdown).not.toContain("## done_when drift");
    expect(result.markdown).toContain("Phase 0: .docs/final/review.md exists");
  });

  it("renders drift=1 with inline colon layout (partial, 1/N form)", () => {
    writeMission(tempDir, {
      title: "Drift 1",
      goal: "Single prose entry",
      done_when: ["package.json 존재", "build is good"],
    });
    writeFileSync(join(tempDir, "package.json"), "{}");
    const result = getMissionStatus(tempDir);
    expect(result.doneWhenDrift).toEqual(["build is good"]);
    expect(result.markdown).toContain("## done_when drift");
    expect(result.markdown).toContain(
      "⚠ 1/2 done_when entries cannot be auto-evaluated:",
    );
    expect(result.markdown).toContain('- "build is good"');
    expect(result.markdown).not.toContain("(+");
    expect(result.markdown).not.toContain("Sample:");
    expect(result.markdown).toContain(
      "Fix: add a matching entry to `evals[]`, or rewrite as a file-existence pattern (`X 존재` / `X exists`).",
    );
  });

  it("renders drift=3 with inline colon layout (all-drift, 3/3 form, no Sample header)", () => {
    writeMission(tempDir, {
      title: "Drift 3 all",
      goal: "Three prose, all drift",
      done_when: ["alpha is awesome", "beta is better", "gamma is great"],
    });
    const result = getMissionStatus(tempDir);
    expect(result.doneWhenDrift).toEqual([
      "alpha is awesome",
      "beta is better",
      "gamma is great",
    ]);
    expect(result.markdown).toContain(
      "⚠ 3/3 done_when entries cannot be auto-evaluated:",
    );
    expect(result.markdown).toContain('- "alpha is awesome"');
    expect(result.markdown).toContain('- "beta is better"');
    expect(result.markdown).toContain('- "gamma is great"');
    expect(result.markdown).not.toContain("Sample:");
    expect(result.markdown).not.toContain("(+");
  });

  it("renders drift=2 partial with inline colon layout (2/5 form)", () => {
    writeMission(tempDir, {
      title: "Drift 2 partial",
      goal: "Two prose out of five",
      done_when: [
        "package.json 존재",
        "README.md 존재",
        "AGENTS.md 존재",
        "design_refs documented",
        "API is well-designed",
      ],
    });
    writeFileSync(join(tempDir, "package.json"), "{}");
    writeFileSync(join(tempDir, "README.md"), "readme");
    writeFileSync(join(tempDir, "AGENTS.md"), "agents");
    const result = getMissionStatus(tempDir);
    expect(result.doneWhenDrift).toEqual([
      "design_refs documented",
      "API is well-designed",
    ]);
    expect(result.markdown).toContain(
      "⚠ 2/5 done_when entries cannot be auto-evaluated:",
    );
    expect(result.markdown).toContain('- "design_refs documented"');
    expect(result.markdown).toContain('- "API is well-designed"');
  });

  it("renders drift=4 partial with Sample layout + (+1 more) + 80-char truncation", () => {
    const longEntry =
      "Phase 3B: advisory rules carry suggested_command where an actionable CLI snippet exists and covers the full rule surface without regressions";
    writeMission(tempDir, {
      title: "Drift 4 Sample",
      goal: "Four prose out of ten",
      done_when: [
        "package.json 존재",
        "README.md 존재",
        "AGENTS.md 존재",
        "CHANGELOG.md 존재",
        "GEMINI.md 존재",
        "CLAUDE.md 존재",
        longEntry,
        "beta is better",
        "gamma is great",
        "delta is deeper",
      ],
    });
    [
      "package.json",
      "README.md",
      "AGENTS.md",
      "CHANGELOG.md",
      "GEMINI.md",
      "CLAUDE.md",
    ].forEach((f) => writeFileSync(join(tempDir, f), "x"));
    const result = getMissionStatus(tempDir);
    expect(result.doneWhenDrift).toEqual([
      longEntry,
      "beta is better",
      "gamma is great",
      "delta is deeper",
    ]);
    expect(result.markdown).toContain(
      "⚠ 4/10 done_when entries cannot be auto-evaluated.",
    );
    expect(result.markdown).toContain("Sample:");
    const truncatedSample = `"${longEntry.slice(0, 77)}…"`;
    expect(result.markdown).toContain(truncatedSample);
    expect(result.markdown).toContain('- "beta is better"');
    expect(result.markdown).toContain('- "gamma is great"');
    expect(result.markdown).not.toContain('- "delta is deeper"');
    expect(result.markdown).toContain(
      "(+1 more — run `ms-eval` for full list)",
    );
    expect(result.doneWhenDrift?.[0]).toBe(longEntry);
  });

  it("renders drift=5 all-drift with Sample layout + (+2 more) + N/N fraction", () => {
    writeMission(tempDir, {
      title: "Drift 5 all",
      goal: "Five prose, all drift",
      done_when: [
        "alpha is awesome",
        "beta is better",
        "gamma is great",
        "delta is deeper",
        "epsilon is excellent",
      ],
    });
    const result = getMissionStatus(tempDir);
    expect(result.doneWhenDrift).toHaveLength(5);
    expect(result.markdown).toContain(
      "⚠ 5/5 done_when entries cannot be auto-evaluated.",
    );
    expect(result.markdown).toContain("Sample:");
    expect(result.markdown).toContain('- "alpha is awesome"');
    expect(result.markdown).toContain('- "beta is better"');
    expect(result.markdown).toContain('- "gamma is great"');
    expect(result.markdown).not.toContain('- "delta is deeper"');
    expect(result.markdown).not.toContain('- "epsilon is excellent"');
    expect(result.markdown).toContain(
      "(+2 more — run `ms-eval` for full list)",
    );
  });

  it("excludes manual, llm-eval, and automated evals[] matches from doneWhenDrift", () => {
    writeMission(tempDir, {
      title: "Evals exclusion",
      goal: "Verify eval-backed entries are not flagged",
      done_when: ["human_review", "verdict_from_llm", "build_passes"],
      evals: [
        {
          name: "human_review",
          type: "manual",
          description: "maintainer signs off",
        },
        {
          name: "verdict_from_llm",
          type: "llm-eval",
          pass_criteria: "subjective verdict",
        },
        {
          name: "build_passes",
          type: "automated",
          command: "true",
          pass_criteria: "exit 0",
        },
      ],
    });
    const result = getMissionStatus(tempDir);
    expect(result.doneWhenDrift ?? []).toEqual([]);
  });

  it("detects mission_title mismatch between history.meta and mission.yaml.title (Rule 1)", () => {
    writeMission(tempDir, {
      title: "Current Title",
      goal: "g",
      done_when: ["package.json 존재"],
    });
    writeFileSync(join(tempDir, "package.json"), "{}");
    writeFileSync(
      join(tempDir, "mission-history.yaml"),
      stringify({
        meta: {
          mission_id: "test",
          mission_title: "Old Stale Title",
          total_revisions: 0,
          latest_version: "1.0.0",
        },
        timeline: [],
      }),
    );
    const result = getMissionStatus(tempDir);
    expect(result.metaStaleness).toHaveLength(1);
    expect(result.metaStaleness?.[0].field).toBe("mission_title");
    expect(result.metaStaleness?.[0].hint).toContain("Current Title");
    expect(result.metaStaleness?.[0].hint).toContain("Old Stale Title");
    expect(result.markdown).toContain("## meta staleness");
    expect(result.markdown).toContain("- ⚠ `mission_title` —");
  });

  it("skips Rule 1 when history.meta.mission_title is absent (schema-optional field)", () => {
    writeMission(tempDir, {
      title: "Current Title",
      goal: "g",
      done_when: ["package.json 존재"],
    });
    writeFileSync(join(tempDir, "package.json"), "{}");
    writeFileSync(
      join(tempDir, "mission-history.yaml"),
      stringify({
        meta: {
          mission_id: "test",
          total_revisions: 0,
          latest_version: "1.0.0",
        },
        timeline: [],
      }),
    );
    const result = getMissionStatus(tempDir);
    expect(result.metaStaleness).toEqual([]);
    expect(result.markdown).not.toContain("## meta staleness");
  });

  it("detects tracking_mode drift when single-user claim + AI contributors (Rule 2)", () => {
    writeMission(tempDir, {
      title: "Same Title",
      goal: "g",
      done_when: ["package.json 존재"],
    });
    writeFileSync(join(tempDir, "package.json"), "{}");
    writeFileSync(
      join(tempDir, "mission-history.yaml"),
      stringify({
        meta: {
          mission_id: "test",
          mission_title: "Same Title",
          tracking_mode: "local-first (single-user)",
          total_revisions: 1,
          latest_version: "1.0.0",
        },
        timeline: [
          {
            change_id: "c1",
            semantic_version: "1.0.0",
            change_sequence: 1,
            date: "2026-01-01",
            author: "Dr. QUAN",
            contributors: ["Claude Code (main pane)", "Dr. QUAN"],
            change_type: "initial",
            persistence: "permanent",
            intent: "i",
            changes: { added: [], modified: [], removed: [] },
            done_when_delta: { added: [], modified: [], removed: [] },
            impact_scope: {},
            breaking: false,
          },
        ],
      }),
    );
    const result = getMissionStatus(tempDir);
    expect(result.metaStaleness).toHaveLength(1);
    expect(result.metaStaleness?.[0].field).toBe("tracking_mode");
    expect(result.metaStaleness?.[0].hint).toContain("single-user");
    expect(result.metaStaleness?.[0].hint).toContain("Claude Code (main pane)");
    expect(result.markdown).toContain("- ⚠ `tracking_mode` —");
  });

  it("skips Rule 2 when tracking_mode claims single-user but no AI contributors", () => {
    writeMission(tempDir, {
      title: "Same Title",
      goal: "g",
      done_when: ["package.json 존재"],
    });
    writeFileSync(join(tempDir, "package.json"), "{}");
    writeFileSync(
      join(tempDir, "mission-history.yaml"),
      stringify({
        meta: {
          mission_id: "test",
          mission_title: "Same Title",
          tracking_mode: "solo",
          total_revisions: 1,
          latest_version: "1.0.0",
        },
        timeline: [
          {
            change_id: "c1",
            semantic_version: "1.0.0",
            change_sequence: 1,
            date: "2026-01-01",
            author: "Dr. QUAN",
            contributors: ["Dr. QUAN", "Jane Doe"],
            change_type: "initial",
            persistence: "permanent",
            intent: "i",
            changes: { added: [], modified: [], removed: [] },
            done_when_delta: { added: [], modified: [], removed: [] },
            impact_scope: {},
            breaking: false,
          },
        ],
      }),
    );
    const result = getMissionStatus(tempDir);
    expect(result.metaStaleness).toEqual([]);
  });

  it("skips Rule 2 when tracking_mode has no single-user keyword (healthy mode string)", () => {
    writeMission(tempDir, {
      title: "Same Title",
      goal: "g",
      done_when: ["package.json 존재"],
    });
    writeFileSync(join(tempDir, "package.json"), "{}");
    writeFileSync(
      join(tempDir, "mission-history.yaml"),
      stringify({
        meta: {
          mission_id: "test",
          mission_title: "Same Title",
          tracking_mode: "semantic-version + commit-backed",
          total_revisions: 1,
          latest_version: "1.0.0",
        },
        timeline: [
          {
            change_id: "c1",
            semantic_version: "1.0.0",
            change_sequence: 1,
            date: "2026-01-01",
            author: "Dr. QUAN",
            contributors: ["Dr. QUAN", "Claude Code"],
            change_type: "initial",
            persistence: "permanent",
            intent: "i",
            changes: { added: [], modified: [], removed: [] },
            done_when_delta: { added: [], modified: [], removed: [] },
            impact_scope: {},
            breaking: false,
          },
        ],
      }),
    );
    const result = getMissionStatus(tempDir);
    expect(result.metaStaleness).toEqual([]);
  });

  it("truncates long mission_title in hint (>120 chars → 117 + ellipsis)", () => {
    const longTitle = "A".repeat(150);
    writeMission(tempDir, {
      title: longTitle,
      goal: "g",
      done_when: ["package.json 존재"],
    });
    writeFileSync(join(tempDir, "package.json"), "{}");
    writeFileSync(
      join(tempDir, "mission-history.yaml"),
      stringify({
        meta: {
          mission_id: "test",
          mission_title: "Short title",
          total_revisions: 0,
          latest_version: "1.0.0",
        },
        timeline: [],
      }),
    );
    const result = getMissionStatus(tempDir);
    expect(result.metaStaleness).toHaveLength(1);
    const hint = result.metaStaleness?.[0].hint ?? "";
    expect(hint).toContain("A".repeat(117) + "…");
    expect(hint).not.toContain("A".repeat(150));
  });

  it("leaves metaStaleness undefined when mission-history.yaml is absent", () => {
    writeMission(tempDir, {
      title: "No History",
      goal: "g",
      done_when: ["package.json 존재"],
    });
    writeFileSync(join(tempDir, "package.json"), "{}");
    const result = getMissionStatus(tempDir);
    expect(result.metaStaleness).toBeUndefined();
    expect(result.markdown).not.toContain("## meta staleness");
  });

  it("returns empty metaStaleness when history is present and fully healthy", () => {
    writeMission(tempDir, {
      title: "Healthy Title",
      goal: "g",
      done_when: ["package.json 존재"],
    });
    writeFileSync(join(tempDir, "package.json"), "{}");
    writeFileSync(
      join(tempDir, "mission-history.yaml"),
      stringify({
        meta: {
          mission_id: "test",
          mission_title: "Healthy Title",
          tracking_mode: "semantic-version + commit-backed",
          total_revisions: 1,
          latest_version: "1.0.0",
        },
        timeline: [
          {
            change_id: "c1",
            semantic_version: "1.0.0",
            change_sequence: 1,
            date: "2026-01-01",
            author: "Dr. QUAN",
            contributors: ["Dr. QUAN"],
            change_type: "initial",
            persistence: "permanent",
            intent: "i",
            changes: { added: [], modified: [], removed: [] },
            done_when_delta: { added: [], modified: [], removed: [] },
            impact_scope: {},
            breaking: false,
          },
        ],
      }),
    );
    const result = getMissionStatus(tempDir);
    expect(result.metaStaleness).toEqual([]);
    expect(result.markdown).not.toContain("## meta staleness");
  });

  it("reports both rules in declaration order when both fire", () => {
    writeMission(tempDir, {
      title: "Actual Title",
      goal: "g",
      done_when: ["package.json 존재"],
    });
    writeFileSync(join(tempDir, "package.json"), "{}");
    writeFileSync(
      join(tempDir, "mission-history.yaml"),
      stringify({
        meta: {
          mission_id: "test",
          mission_title: "Stale Title",
          tracking_mode: "local-first (single-user)",
          total_revisions: 1,
          latest_version: "1.0.0",
        },
        timeline: [
          {
            change_id: "c1",
            semantic_version: "1.0.0",
            change_sequence: 1,
            date: "2026-01-01",
            author: "Dr. QUAN",
            contributors: ["Dr. QUAN", "Claude Code (main pane)"],
            change_type: "initial",
            persistence: "permanent",
            intent: "i",
            changes: { added: [], modified: [], removed: [] },
            done_when_delta: { added: [], modified: [], removed: [] },
            impact_scope: {},
            breaking: false,
          },
        ],
      }),
    );
    const result = getMissionStatus(tempDir);
    expect(result.metaStaleness).toHaveLength(2);
    expect(result.metaStaleness?.[0].field).toBe("mission_title");
    expect(result.metaStaleness?.[1].field).toBe("tracking_mode");
  });

  it("dedupes and samples AI contributors (first 3 + (+N more) when >3 unique)", () => {
    writeMission(tempDir, {
      title: "Same Title",
      goal: "g",
      done_when: ["package.json 존재"],
    });
    writeFileSync(join(tempDir, "package.json"), "{}");
    writeFileSync(
      join(tempDir, "mission-history.yaml"),
      stringify({
        meta: {
          mission_id: "test",
          mission_title: "Same Title",
          tracking_mode: "solo",
          total_revisions: 5,
          latest_version: "1.0.0",
        },
        timeline: [
          {
            change_id: "c1",
            semantic_version: "1.0.0",
            change_sequence: 1,
            date: "2026-01-01",
            author: "Dr. QUAN",
            contributors: [
              "Claude Opus 4.7",
              "Codex (review)",
              "Gemini (research)",
              "GPT-4 (peer)",
              "Copilot (suggest)",
              "Claude Opus 4.7",
            ],
            change_type: "initial",
            persistence: "permanent",
            intent: "i",
            changes: { added: [], modified: [], removed: [] },
            done_when_delta: { added: [], modified: [], removed: [] },
            impact_scope: {},
            breaking: false,
          },
        ],
      }),
    );
    const result = getMissionStatus(tempDir);
    expect(result.metaStaleness).toHaveLength(1);
    const hint = result.metaStaleness?.[0].hint ?? "";
    expect(hint).toContain("(+2 more)");
    expect(hint).toContain('"Claude Opus 4.7"');
    expect(hint).toContain('"Codex (review)"');
    expect(hint).toContain('"Gemini (research)"');
    expect(hint).not.toContain('"GPT-4 (peer)"');
    expect(hint).not.toContain('"Copilot (suggest)"');
  });
});

describe("ms-status — IMP-10 refs integration", () => {
  it("reclassifies drift via resolved_by=manual, not marker string", () => {
    writeMission(tempDir, {
      title: "T",
      goal: "G",
      done_when: ["vague prose criterion that cannot be auto-evaluated"],
    });
    const result = getMissionStatus(tempDir);
    expect(result.doneWhenDrift).toBeDefined();
    expect(result.doneWhenDrift?.[0]).toMatch(/vague prose/);
  });

  it("renders refs coverage section when done_when_refs present", () => {
    writeFileSync(join(tempDir, "README.md"), "# Hi");
    writeMission(tempDir, {
      title: "T",
      goal: "G",
      done_when: ["README.md 파일 존재", "shell ok"],
      done_when_refs: [{ index: 1, kind: "command", value: "true" }],
    });
    const result = getMissionStatus(tempDir);
    expect(result.markdown).toMatch(/## refs coverage/);
    expect(result.markdown).toMatch(/1\/2/);
    expect(result.markdown).toMatch(/command/);
  });

  it("omits refs coverage section when no refs", () => {
    writeFileSync(join(tempDir, "README.md"), "# Hi");
    writeMission(tempDir, {
      title: "T",
      goal: "G",
      done_when: ["README.md 파일 존재"],
    });
    const result = getMissionStatus(tempDir);
    expect(result.markdown).not.toMatch(/## refs coverage/);
  });
});
