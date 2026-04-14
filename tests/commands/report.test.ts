import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify } from "yaml";
import {
  generateMissionReport,
  type ReportResult,
} from "../../src/commands/report.js";

let tempDir: string;

function writeMission(dir: string, mission: Record<string, unknown>) {
  writeFileSync(join(dir, "mission.yaml"), stringify({ mission }));
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "ms-report-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("generateMissionReport", () => {
  it("generates a markdown report", () => {
    writeMission(tempDir, {
      title: "Report Test",
      goal: "Generate a report",
      done_when: ["task completed"],
    });
    const result = generateMissionReport(tempDir);
    expect(result.markdown).toContain("# Mission Report: Report Test");
  });

  it("includes eval results in report", () => {
    writeMission(tempDir, {
      title: "Eval Report",
      goal: "Check evals",
      done_when: ["package.json 존재", "README.md 존재"],
    });
    writeFileSync(join(tempDir, "package.json"), "{}");
    const result = generateMissionReport(tempDir);
    expect(result.markdown).toContain("[x]");
    expect(result.markdown).toContain("[ ]");
    expect(result.passed).toBe(1);
    expect(result.total).toBe(2);
  });

  it("includes timestamp", () => {
    writeMission(tempDir, {
      title: "Timestamp",
      goal: "Check timestamp",
      done_when: ["done"],
    });
    const result = generateMissionReport(tempDir);
    expect(result.timestamp).toBeTruthy();
    expect(result.markdown).toContain("Generated:");
  });

  it("includes mission metadata", () => {
    writeMission(tempDir, {
      title: "Metadata",
      goal: "Check metadata",
      done_when: ["done"],
      version: "1.0.0",
      author: "tester",
    });
    const result = generateMissionReport(tempDir);
    expect(result.markdown).toContain("tester");
    expect(result.markdown).toContain("1.0.0");
  });

  it("shows overall status as PASS or FAIL", () => {
    writeMission(tempDir, {
      title: "Status Check",
      goal: "Check status",
      done_when: ["package.json 존재"],
    });
    writeFileSync(join(tempDir, "package.json"), "{}");
    const result = generateMissionReport(tempDir);
    expect(result.markdown).toContain("PASS");
    expect(result.allPassed).toBe(true);
  });

  it("shows FAIL when criteria not met", () => {
    writeMission(tempDir, {
      title: "Fail Check",
      goal: "Check fail",
      done_when: ["nonexistent.txt 존재"],
    });
    const result = generateMissionReport(tempDir);
    expect(result.markdown).toContain("FAIL");
    expect(result.allPassed).toBe(false);
  });

  it("throws when mission.yaml is missing", () => {
    expect(() => generateMissionReport(tempDir)).toThrow();
  });

  it("throws on schema-invalid mission.yaml", () => {
    writeFileSync(
      join(tempDir, "mission.yaml"),
      stringify({ mission: { title: "bad" } }),
    );
    expect(() => generateMissionReport(tempDir)).toThrow(/schema/i);
  });

  it("falls back gracefully when mission-history.yaml is invalid", () => {
    writeMission(tempDir, {
      title: "History Fallback",
      goal: "Report still works",
      done_when: ["condition 1"],
    });
    writeFileSync(join(tempDir, "mission-history.yaml"), "meta: {}\n");
    const result = generateMissionReport(tempDir);
    expect(result.historyWarning).toContain("History unavailable");
    expect(result.markdown).toContain("## History");
    expect(result.markdown).toContain("History unavailable");
  });

  it("renders traceability section when TRACE_MATRIX.yaml exists", () => {
    writeMission(tempDir, {
      title: "Trace Report",
      goal: "Test traceability",
      done_when: ["schema_validation_passes"],
      evals: [
        {
          name: "schema_validation_passes",
          type: "automated",
          command: 'node -e "process.exit(0)"',
          pass_criteria: "pass",
        },
      ],
    });
    mkdirSync(join(tempDir, ".mission", "traceability"), { recursive: true });
    writeFileSync(
      join(tempDir, ".mission", "traceability", "TRACE_MATRIX.yaml"),
      stringify({
        requirements: [
          {
            criterion: "schema_validation_passes",
            eval_type: "automated",
            code: ["scripts/validate-schema.js"],
            tests: ["tests/schema.test.ts"],
          },
        ],
      }),
    );
    const result = generateMissionReport(tempDir);
    expect(result.markdown).toContain("## Traceability");
    expect(result.markdown).toContain("schema_validation_passes");
    expect(result.markdown).toContain("scripts/validate-schema.js");
  });

  it("skips traceability section when TRACE_MATRIX.yaml does not exist", () => {
    writeMission(tempDir, {
      title: "No Trace",
      goal: "No trace matrix",
      done_when: ["README.md 존재"],
    });
    writeFileSync(join(tempDir, "README.md"), "# hi");
    const result = generateMissionReport(tempDir);
    expect(result.markdown).not.toContain("## Traceability");
  });

  it("renders recent changes when history uses empty arrays", () => {
    writeMission(tempDir, {
      title: "History Present",
      goal: "Report recent changes",
      done_when: ["condition 1"],
    });
    writeFileSync(
      join(tempDir, "mission-history.yaml"),
      stringify({
        meta: {
          mission_id: "m",
          total_revisions: 1,
          latest_version: "1.0.0",
        },
        timeline: [
          {
            change_id: "c1",
            semantic_version: "1.0.0",
            date: "2026-04-01",
            author: "tester",
            change_type: "initial",
            persistence: "permanent",
            intent: "first release",
            changes: { added: [], modified: [], removed: [] },
            done_when_delta: { added: [], modified: [], removed: [] },
            impact_scope: {},
            breaking: false,
          },
        ],
      }),
    );
    const result = generateMissionReport(tempDir);
    expect(result.markdown).toContain("## Recent Changes");
    expect(result.markdown).toContain("### 1.0.0 (2026-04-01)");
  });
});
