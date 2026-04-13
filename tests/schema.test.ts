import { describe, it, expect } from "vitest";
import { validateMission } from "../src/schema/validator.js";
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
});
