import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
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

  it("emits 'manual verification required' marker on both TEST_PATTERN and fallback paths (marker-contract invariant)", () => {
    writeMission(tempDir, {
      title: "Marker Contract",
      goal: "Lock evaluator marker strings",
      done_when: [
        "cargo tests pass",
        "this is a totally novel prose condition with no heuristic match",
      ],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria).toHaveLength(2);
    const testPathReason = result.criteria[0].reason.toLowerCase();
    const fallbackReason = result.criteria[1].reason.toLowerCase();
    expect(testPathReason).toContain("manual verification required");
    expect(fallbackReason).toContain("manual verification required");
  });

  it("treats missing gitignored local-only artifacts as shared-mode skips", () => {
    execFileSync("git", ["init", "-q"], { cwd: tempDir });
    writeFileSync(join(tempDir, ".gitignore"), "/.docs/\n");
    writeMission(tempDir, {
      title: "Shared Clone",
      goal: "Remote clone should ignore local-only docs",
      done_when: [
        "Phase 0: .docs/final/review.md exists and was consumed by the reviewer",
      ],
    });

    const result = evaluateMission(tempDir, { scope: "shared" });
    expect(result.criteria[0].passed).toBe(true);
    expect(result.criteria[0].skipped).toBe(true);
    expect(result.criteria[0].reason).toContain("Shared-mode skip");
    expect(result.criteria[0].reason).toContain(".docs/final/review.md");
  });

  it("runs safe inferred command clauses from backticked prose when they signal success", () => {
    writeMission(tempDir, {
      title: "Inferred Command",
      goal: "Let adopters keep command prose in done_when",
      done_when: ['Validation command `node -e "process.exit(0)"` succeeds'],
    });

    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(true);
    expect(result.criteria[0].reason).toContain(
      "Inferred command clause(s) succeeded",
    );
    expect(result.criteria[0].reason).toContain('node -e "process.exit(0)"');
  });

  it("fails inferred command clause when extracted safe command exits non-zero", () => {
    writeMission(tempDir, {
      title: "Inferred Command Failure",
      goal: "Surface failing command prose",
      done_when: ['Validation command `node -e "process.exit(1)"` succeeds'],
    });

    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(false);
    expect(result.criteria[0].reason).toContain(
      "Inferred command clause failed",
    );
  });

  it("sets resolved_by=inference on file-existence passes", () => {
    writeMission(tempDir, {
      title: "T",
      goal: "G",
      done_when: ["README.md 파일 존재"],
    });
    writeFileSync(join(tempDir, "README.md"), "# Hi");
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(true);
    expect(result.criteria[0].resolved_by).toBe("inference");
  });

  it("sets resolved_by=manual on fallback", () => {
    writeMission(tempDir, {
      title: "T",
      goal: "G",
      done_when: ["something vague that cannot auto-evaluate"],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(false);
    expect(result.criteria[0].resolved_by).toBe("manual");
  });
});

describe("done_when_refs — command kind", () => {
  it("passes when command exits 0 (via direct evaluateMission read of mission.yaml)", () => {
    writeMission(tempDir, {
      title: "T",
      goal: "G",
      done_when: ["shell ok"],
      done_when_refs: [{ index: 0, kind: "command", value: "true" }],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(true);
    expect(result.criteria[0].resolved_by).toBe("ref");
    expect(result.criteria[0].ref_kind).toBe("command");
  });

  it("fails when command exits non-zero", () => {
    writeMission(tempDir, {
      title: "T",
      goal: "G",
      done_when: ["shell fail"],
      done_when_refs: [{ index: 0, kind: "command", value: "false" }],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(false);
    expect(result.criteria[0].resolved_by).toBe("ref");
    expect(result.criteria[0].ref_kind).toBe("command");
    expect(result.criteria[0].reason).toMatch(/command/i);
  });
});

describe("done_when_refs — file-exists kind", () => {
  it("passes when the referenced path exists", () => {
    writeFileSync(join(tempDir, "SECURITY.md"), "");
    writeMission(tempDir, {
      title: "T",
      goal: "G",
      done_when: ["security doc present"],
      done_when_refs: [{ index: 0, kind: "file-exists", value: "SECURITY.md" }],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(true);
    expect(result.criteria[0].ref_kind).toBe("file-exists");
  });

  it("fails when path missing", () => {
    writeMission(tempDir, {
      title: "T",
      goal: "G",
      done_when: ["security doc present"],
      done_when_refs: [{ index: 0, kind: "file-exists", value: "SECURITY.md" }],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(false);
    expect(result.criteria[0].ref_kind).toBe("file-exists");
  });
});

describe("done_when_refs — file-contains kind", () => {
  it("passes when file contains the substring after '::'", () => {
    writeFileSync(
      join(tempDir, "README.md"),
      "# Project\n\n## Installation\nnpm install foo",
    );
    writeMission(tempDir, {
      title: "T",
      goal: "G",
      done_when: ["readme has installation section"],
      done_when_refs: [
        {
          index: 0,
          kind: "file-contains",
          value: "README.md::## Installation",
        },
      ],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(true);
    expect(result.criteria[0].ref_kind).toBe("file-contains");
  });

  it("fails when substring absent", () => {
    writeFileSync(join(tempDir, "README.md"), "# Project\n");
    writeMission(tempDir, {
      title: "T",
      goal: "G",
      done_when: ["readme has installation section"],
      done_when_refs: [
        {
          index: 0,
          kind: "file-contains",
          value: "README.md::## Installation",
        },
      ],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(false);
    expect(result.criteria[0].ref_kind).toBe("file-contains");
  });

  it("fails with clear reason when value has no '::' separator", () => {
    writeMission(tempDir, {
      title: "T",
      goal: "G",
      done_when: ["bad ref"],
      done_when_refs: [{ index: 0, kind: "file-contains", value: "README.md" }],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(false);
    expect(result.criteria[0].reason).toMatch(/::/);
  });
});

describe("done_when_refs — eval-ref kind", () => {
  it("delegates to automated evals entry", () => {
    writeMission(tempDir, {
      title: "T",
      goal: "G",
      done_when: ["tests pass"],
      evals: [
        {
          name: "unit_tests",
          type: "automated",
          command: "true",
          pass_criteria: "exit 0",
        },
      ],
      done_when_refs: [{ index: 0, kind: "eval-ref", value: "unit_tests" }],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(true);
    expect(result.criteria[0].resolved_by).toBe("ref");
    expect(result.criteria[0].ref_kind).toBe("eval-ref");
  });

  it("delegates to llm-eval entry with override file", () => {
    mkdirSync(join(tempDir, ".mission", "evals"), { recursive: true });
    writeFileSync(
      join(tempDir, ".mission", "evals", "arch_review.result.yaml"),
      "passed: true\nreason: reviewed\n",
    );
    writeMission(tempDir, {
      title: "T",
      goal: "G",
      done_when: ["arch ok"],
      evals: [
        {
          name: "arch_review",
          type: "llm-eval",
          pass_criteria: "reviewer approval",
        },
      ],
      done_when_refs: [{ index: 0, kind: "eval-ref", value: "arch_review" }],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(true);
    expect(result.criteria[0].ref_kind).toBe("eval-ref");
  });

  it("fails when eval-ref value has no matching evals[] entry (orphan at runtime)", () => {
    writeMission(tempDir, {
      title: "T",
      goal: "G",
      done_when: ["tests pass"],
      done_when_refs: [{ index: 0, kind: "eval-ref", value: "nonexistent" }],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(false);
    expect(result.criteria[0].ref_kind).toBe("eval-ref");
    expect(result.criteria[0].reason).toMatch(/nonexistent/);
  });
});

describe("done_when_refs — partial coverage and overrides", () => {
  it("uses inference for indices with no ref (partial refs)", () => {
    writeFileSync(join(tempDir, "README.md"), "# Hi");
    writeMission(tempDir, {
      title: "T",
      goal: "G",
      done_when: ["README.md 파일 존재", "shell ok"],
      done_when_refs: [{ index: 1, kind: "command", value: "true" }],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(true);
    expect(result.criteria[0].resolved_by).toBe("inference");
    expect(result.criteria[1].passed).toBe(true);
    expect(result.criteria[1].resolved_by).toBe("ref");
  });

  it("ref result overrides inference that would have passed", () => {
    writeFileSync(join(tempDir, "README.md"), "# Hi");
    writeMission(tempDir, {
      title: "T",
      goal: "G",
      done_when: ["README.md 파일 존재"],
      done_when_refs: [{ index: 0, kind: "command", value: "false" }],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(false);
    expect(result.criteria[0].resolved_by).toBe("ref");
  });

  it("refs in shared scope still execute (command kind is not shared-skipped)", () => {
    writeMission(tempDir, {
      title: "T",
      goal: "G",
      done_when: [".mission/CURRENT_STATE.md exists"],
      done_when_refs: [{ index: 0, kind: "command", value: "true" }],
    });
    const result = evaluateMission(tempDir, { scope: "shared" });
    expect(result.criteria[0].passed).toBe(true);
    expect(result.criteria[0].resolved_by).toBe("ref");
  });
});
