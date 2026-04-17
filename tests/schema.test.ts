import { describe, it, expect } from "vitest";
import { validateMission, validateHistory } from "../src/schema/validator.js";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { resolve } from "node:path";

function loadFixture(name: string): unknown {
  const content = readFileSync(resolve(__dirname, "fixtures", name), "utf-8");
  return parse(content);
}

describe("validateMission", () => {
  it("accepts a valid minimal mission", () => {
    const result = validateMission(loadFixture("valid-mission.yaml"));
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("accepts a complex mission with all optional fields", () => {
    const result = validateMission(loadFixture("complex-mission.yaml"));
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects a mission missing required fields (goal, done_when)", () => {
    const result = validateMission(loadFixture("invalid-mission.yaml"));
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects null input", () => {
    const result = validateMission(null);
    expect(result.valid).toBe(false);
  });

  it("rejects empty object", () => {
    const result = validateMission({});
    expect(result.valid).toBe(false);
  });

  it("rejects mission with empty title", () => {
    const result = validateMission({
      mission: { title: "", goal: "test", done_when: ["test"] },
    });
    expect(result.valid).toBe(false);
  });

  it("rejects mission with empty done_when array", () => {
    const result = validateMission({
      mission: { title: "test", goal: "test", done_when: [] },
    });
    expect(result.valid).toBe(false);
  });

  it("rejects mission with invalid approver type", () => {
    const result = validateMission({
      mission: {
        title: "test",
        goal: "test",
        done_when: ["done"],
        approvals: [{ gate: "g1", approver: "invalid_type" }],
      },
    });
    expect(result.valid).toBe(false);
  });

  it("rejects automated eval without command", () => {
    const result = validateMission({
      mission: {
        title: "test",
        goal: "test",
        done_when: ["done"],
        evals: [{ name: "e", type: "automated" }],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("command"))).toBe(true);
  });

  it("accepts automated eval with command and pass_criteria", () => {
    const result = validateMission({
      mission: {
        title: "test",
        goal: "test",
        done_when: ["done"],
        evals: [
          {
            name: "e",
            type: "automated",
            command: "npm test",
            pass_criteria: "all pass",
          },
        ],
      },
    });
    expect(result.valid).toBe(true);
  });

  it("accepts manual eval without command", () => {
    const result = validateMission({
      mission: {
        title: "test",
        goal: "test",
        done_when: ["done"],
        evals: [{ name: "e", type: "manual", description: "check it" }],
      },
    });
    expect(result.valid).toBe(true);
  });

  it("rejects manual eval without description", () => {
    const result = validateMission({
      mission: {
        title: "test",
        goal: "test",
        done_when: ["done"],
        evals: [{ name: "e", type: "manual" }],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("description"))).toBe(true);
  });

  it("rejects llm-judge eval without pass_criteria", () => {
    const result = validateMission({
      mission: {
        title: "test",
        goal: "test",
        done_when: ["done"],
        evals: [{ name: "e", type: "llm-judge" }],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("pass_criteria"))).toBe(true);
  });

  it("accepts llm-judge eval with pass_criteria", () => {
    const result = validateMission({
      mission: {
        title: "test",
        goal: "test",
        done_when: ["done"],
        evals: [
          { name: "e", type: "llm-judge", pass_criteria: "score >= 0.8" },
        ],
      },
    });
    expect(result.valid).toBe(true);
  });

  it("rejects mission with unknown top-level properties", () => {
    const result = validateMission({
      mission: { title: "test", goal: "test", done_when: ["done"] },
      extra_field: true,
    });
    expect(result.valid).toBe(false);
  });

  it("accepts mission with valid lineage", () => {
    const result = validateMission({
      mission: {
        title: "test",
        goal: "test",
        done_when: ["done"],
        lineage: {
          initial_version: "1.0.0",
          initial_date: "2026-04-02",
          total_revisions: 4,
          history: "mission-history.yaml",
        },
      },
    });
    expect(result.valid).toBe(true);
  });

  it("accepts mission with minimal lineage (required fields only)", () => {
    const result = validateMission({
      mission: {
        title: "test",
        goal: "test",
        done_when: ["done"],
        lineage: {
          initial_version: "1.0.0",
          history: "mission-history.yaml",
        },
      },
    });
    expect(result.valid).toBe(true);
  });

  it("rejects lineage missing required field (history)", () => {
    const result = validateMission({
      mission: {
        title: "test",
        goal: "test",
        done_when: ["done"],
        lineage: {
          initial_version: "1.0.0",
        },
      },
    });
    expect(result.valid).toBe(false);
  });

  it("rejects lineage with unknown properties", () => {
    const result = validateMission({
      mission: {
        title: "test",
        goal: "test",
        done_when: ["done"],
        lineage: {
          initial_version: "1.0.0",
          history: "mission-history.yaml",
          unknown_field: true,
        },
      },
    });
    expect(result.valid).toBe(false);
  });

  it("accepts llm-eval type in evals", () => {
    const result = validateMission({
      mission: {
        title: "test",
        goal: "test",
        done_when: ["done"],
        evals: [
          { name: "e", type: "llm-eval", pass_criteria: "UX feels good" },
        ],
      },
    });
    expect(result.valid).toBe(true);
  });

  it("rejects llm-eval without pass_criteria", () => {
    const result = validateMission({
      mission: {
        title: "test",
        goal: "test",
        done_when: ["done"],
        evals: [{ name: "e", type: "llm-eval" }],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("pass_criteria"))).toBe(true);
  });

  it("accepts mission with design_refs", () => {
    const result = validateMission({
      mission: {
        title: "test",
        goal: "test",
        done_when: ["done"],
        design_refs: {
          architecture: "docs/ARCHITECTURE.md",
          api_surface: "src/index.ts",
        },
      },
    });
    expect(result.valid).toBe(true);
  });

  it("accepts mission with empty design_refs", () => {
    const result = validateMission({
      mission: {
        title: "test",
        goal: "test",
        done_when: ["done"],
        design_refs: {},
      },
    });
    expect(result.valid).toBe(true);
  });

  it("rejects design_refs with unknown properties", () => {
    const result = validateMission({
      mission: {
        title: "test",
        goal: "test",
        done_when: ["done"],
        design_refs: { unknown_field: "path" },
      },
    });
    expect(result.valid).toBe(false);
  });
});

describe("validateHistory", () => {
  it("accepts a minimal valid history", () => {
    const result = validateHistory({
      meta: {
        mission_id: "m1",
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
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("accepts the project's own mission-history.yaml", () => {
    const content = readFileSync(
      resolve(__dirname, "..", "mission-history.yaml"),
      "utf-8",
    );
    const result = validateHistory(parse(content));
    expect(result.valid).toBe(true);
  });

  it("rejects history missing meta", () => {
    const result = validateHistory({ timeline: [] });
    expect(result.valid).toBe(false);
  });

  it("rejects history missing timeline", () => {
    const result = validateHistory({
      meta: { mission_id: "m", total_revisions: 0, latest_version: "1.0.0" },
    });
    expect(result.valid).toBe(false);
  });

  it("rejects timeline entry with invalid persistence enum", () => {
    const result = validateHistory({
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
          author: "t",
          change_type: "initial",
          persistence: "bogus",
          intent: "",
          changes: {},
          done_when_delta: {},
          impact_scope: {},
          breaking: false,
        },
      ],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects history with sparse changes objects", () => {
    const result = validateHistory({
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
          author: "t",
          change_type: "initial",
          persistence: "permanent",
          intent: "x",
          changes: {},
          done_when_delta: {},
          impact_scope: {},
          breaking: false,
        },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("added"))).toBe(true);
  });

  it("rejects null input", () => {
    const result = validateHistory(null);
    expect(result.valid).toBe(false);
  });

  it("accepts timeline entry with architecture_delta", () => {
    const result = validateHistory({
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
          author: "t",
          change_type: "enhancement",
          persistence: "permanent",
          intent: "add history loader",
          changes: {
            added: ["src/core/history.ts"],
            modified: [],
            removed: [],
          },
          done_when_delta: { added: [], modified: [], removed: [] },
          impact_scope: { api: true },
          breaking: false,
          architecture_delta: {
            modules_added: [
              {
                path: "src/core/history.ts",
                role: "mission-history.yaml loader",
                depends_on: ["src/schema/validator.ts"],
                depended_by: ["src/commands/status.ts"],
              },
            ],
            interfaces_changed: [
              {
                module: "src/commands/status.ts",
                added_fields: ["historyWarning?: string"],
                reason: "graceful fallback",
              },
            ],
          },
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it("rejects architecture_delta with unknown module fields", () => {
    const result = validateHistory({
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
          author: "t",
          change_type: "enhancement",
          persistence: "permanent",
          intent: "test",
          changes: { added: [], modified: [], removed: [] },
          done_when_delta: { added: [], modified: [], removed: [] },
          impact_scope: {},
          breaking: false,
          architecture_delta: {
            modules_added: [
              { path: "x.ts", role: "test", unknown_field: true },
            ],
          },
        },
      ],
    });
    expect(result.valid).toBe(false);
  });

  it("accepts empty related_commits (transient — for the commit that introduces the entry itself, backfilled by a follow-on)", () => {
    const result = validateHistory({
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
          author: "t",
          change_type: "enhancement",
          persistence: "permanent",
          intent: "test",
          changes: { added: [], modified: [], removed: [] },
          done_when_delta: { added: [], modified: [], removed: [] },
          impact_scope: {},
          breaking: false,
          related_commits: [],
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it("rejects related_commits entries with invalid sha format", () => {
    const result = validateHistory({
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
          author: "t",
          change_type: "enhancement",
          persistence: "permanent",
          intent: "test",
          changes: { added: [], modified: [], removed: [] },
          done_when_delta: { added: [], modified: [], removed: [] },
          impact_scope: {},
          breaking: false,
          related_commits: ["not-a-sha"],
        },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("related_commits"))).toBe(true);
  });
});
