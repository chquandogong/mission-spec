import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify } from "yaml";
import { evaluateMission, type EvalResult } from "../../src/commands/eval.js";

let tempDir: string;

function writeMission(dir: string, mission: Record<string, unknown>) {
  writeFileSync(join(dir, "mission.yaml"), stringify({ mission }));
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "ms-eval-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("evaluateMission", () => {
  it("returns evaluation results for each done_when criterion", () => {
    writeMission(tempDir, {
      title: "Test Mission",
      goal: "Test goal",
      done_when: ["파일 생성 완료", "테스트 통과"],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria).toHaveLength(2);
    expect(result.criteria[0].criterion).toBe("파일 생성 완료");
    expect(result.criteria[1].criterion).toBe("테스트 통과");
  });

  it("marks file-existence checks as passed when file exists", () => {
    writeMission(tempDir, {
      title: "File Check",
      goal: "Check files",
      done_when: ["README.md 파일 존재"],
    });
    writeFileSync(join(tempDir, "README.md"), "# Hello");
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(true);
  });

  it("marks file-existence checks as failed when file missing", () => {
    writeMission(tempDir, {
      title: "File Check",
      goal: "Check files",
      done_when: ["README.md 파일 존재"],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(false);
  });

  it("reports overall pass when all criteria pass", () => {
    writeMission(tempDir, {
      title: "All Pass",
      goal: "All pass",
      done_when: ["package.json 존재"],
    });
    writeFileSync(join(tempDir, "package.json"), "{}");
    const result = evaluateMission(tempDir);
    expect(result.allPassed).toBe(true);
  });

  it("reports overall fail when any criterion fails", () => {
    writeMission(tempDir, {
      title: "Partial",
      goal: "Partial",
      done_when: ["package.json 존재", "missing.txt 존재"],
    });
    writeFileSync(join(tempDir, "package.json"), "{}");
    const result = evaluateMission(tempDir);
    expect(result.allPassed).toBe(false);
  });

  it("throws when mission.yaml is missing", () => {
    expect(() => evaluateMission(tempDir)).toThrow();
  });

  it("provides a summary string", () => {
    writeMission(tempDir, {
      title: "Summary Test",
      goal: "Test summary",
      done_when: ["조건 1", "조건 2"],
    });
    const result = evaluateMission(tempDir);
    expect(result.summary).toContain("0/2");
  });

  it("runs automated eval when criterion matches eval name", () => {
    writeMission(tempDir, {
      title: "Automated Eval",
      goal: "Run command",
      done_when: ["command_test"],
      evals: [
        {
          name: "command_test",
          type: "automated",
          command: 'node -e "process.exit(0)"',
          pass_criteria: "command exits 0",
        },
      ],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(true);
    expect(result.criteria[0].reason).toContain("Automated command succeeded");
  });

  it("reports automated eval failure when command exits non-zero", () => {
    writeMission(tempDir, {
      title: "Automated Eval Failure",
      goal: "Run command",
      done_when: ["command_test"],
      evals: [
        {
          name: "command_test",
          type: "automated",
          command: 'node -e "process.exit(1)"',
          pass_criteria: "command exits 0",
        },
      ],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(false);
    expect(result.criteria[0].reason).toContain("Automated command failed");
  });

  it("throws on schema-invalid mission.yaml", () => {
    // mission with no done_when → schema invalid
    writeFileSync(
      join(tempDir, "mission.yaml"),
      stringify({ mission: { title: "bad" } }),
    );
    expect(() => evaluateMission(tempDir)).toThrow(/schema/i);
  });

  it("marks llm-eval criterion as pending when no override file exists", () => {
    writeMission(tempDir, {
      title: "LLM Eval",
      goal: "Subjective check",
      done_when: ["subjective_quality"],
      evals: [
        {
          name: "subjective_quality",
          type: "llm-eval",
          pass_criteria: "UX feels intuitive",
        },
      ],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(false);
    expect(result.criteria[0].reason).toContain("Awaiting LLM evaluation");
    expect(result.criteria[0].reason).toContain("UX feels intuitive");
    expect(result.criteria[0].reason).toContain(
      ".mission/evals/subjective_quality.result.yaml",
    );
  });

  it("marks llm-judge criterion as pending via the same path", () => {
    writeMission(tempDir, {
      title: "LLM Judge",
      goal: "Judge check",
      done_when: ["judgement"],
      evals: [
        {
          name: "judgement",
          type: "llm-judge",
          pass_criteria: "score >= 0.8",
        },
      ],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(false);
    expect(result.criteria[0].reason).toContain("Awaiting LLM evaluation");
  });

  it("uses override file to mark llm-eval criterion as passed", () => {
    writeMission(tempDir, {
      title: "LLM Eval Override",
      goal: "Subjective check",
      done_when: ["subjective_quality"],
      evals: [
        {
          name: "subjective_quality",
          type: "llm-eval",
          pass_criteria: "UX feels intuitive",
        },
      ],
    });
    mkdirSync(join(tempDir, ".mission", "evals"), { recursive: true });
    writeFileSync(
      join(tempDir, ".mission", "evals", "subjective_quality.result.yaml"),
      stringify({
        passed: true,
        reason: "리뷰어 3인 판정",
        evaluated_by: "human",
        evaluated_at: "2026-04-13",
      }),
    );
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(true);
    expect(result.criteria[0].reason).toContain("PASS");
    expect(result.criteria[0].reason).toContain("human");
    expect(result.criteria[0].reason).toContain("2026-04-13");
    expect(result.criteria[0].reason).toContain("리뷰어 3인 판정");
  });

  it("uses override file to mark llm-eval criterion as failed", () => {
    writeMission(tempDir, {
      title: "LLM Eval Override Fail",
      goal: "Subjective check",
      done_when: ["subjective_quality"],
      evals: [
        {
          name: "subjective_quality",
          type: "llm-eval",
          pass_criteria: "UX feels intuitive",
        },
      ],
    });
    mkdirSync(join(tempDir, ".mission", "evals"), { recursive: true });
    writeFileSync(
      join(tempDir, ".mission", "evals", "subjective_quality.result.yaml"),
      stringify({ passed: false, reason: "재작업 필요" }),
    );
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(false);
    expect(result.criteria[0].reason).toContain("FAIL");
    expect(result.criteria[0].reason).toContain("재작업 필요");
  });

  it("flags override file missing the 'passed' field as invalid", () => {
    writeMission(tempDir, {
      title: "LLM Eval Bad Override",
      goal: "Subjective check",
      done_when: ["subjective_quality"],
      evals: [
        {
          name: "subjective_quality",
          type: "llm-eval",
          pass_criteria: "UX feels intuitive",
        },
      ],
    });
    mkdirSync(join(tempDir, ".mission", "evals"), { recursive: true });
    writeFileSync(
      join(tempDir, ".mission", "evals", "subjective_quality.result.yaml"),
      stringify({ reason: "forgot the passed field" }),
    );
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(false);
    expect(result.criteria[0].reason).toContain("format error");
  });

  it("detects test-related criteria with npm test check", () => {
    writeMission(tempDir, {
      title: "Test Check",
      goal: "Run tests",
      done_when: ["모든 테스트 통과"],
    });
    // npm test는 실행 불가한 temp dir이므로 pending으로 표시
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(false);
    expect(result.criteria[0].reason).toBeTruthy();
  });
});
