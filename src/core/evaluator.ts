// done_when criterion evaluation engine (rule-based + automated command, v1.2)
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { parse } from "yaml";

export interface CriterionResult {
  criterion: string;
  passed: boolean;
  reason: string;
}

// File existence pattern: "X 파일 존재", "X 존재", "X file exists", etc.
const FILE_EXISTENCE_PATTERN = /^(.+?)\s*(?:파일\s*)?존재$/;
const FILE_EXISTENCE_EN = /^(.+?)\s+(?:file\s+)?exists?$/i;

// Test-related pattern
const TEST_PATTERN = /테스트\s*통과|test.*pass|tests?\s+pass/i;

// Load external override for LLM/subjective evaluations.
// If `.mission/evals/<name>.result.yaml` exists, use that result.
// Format: { passed: bool, reason?: string, evaluated_by?: string, evaluated_at?: string }
function loadLlmEvalOverride(
  projectDir: string,
  evalName: string,
): { passed: boolean; reason: string } | null {
  const resultPath = join(
    projectDir,
    ".mission",
    "evals",
    `${evalName}.result.yaml`,
  );
  if (!existsSync(resultPath)) return null;
  try {
    const data = parse(readFileSync(resultPath, "utf-8")) as {
      passed?: unknown;
      reason?: unknown;
      evaluated_by?: unknown;
      evaluated_at?: unknown;
    } | null;
    if (!data || typeof data.passed !== "boolean") {
      return {
        passed: false,
        reason: `Override file format error (${resultPath}): 'passed: true|false' required`,
      };
    }
    const parts: string[] = [data.passed ? "Verdict: PASS" : "Verdict: FAIL"];
    if (typeof data.evaluated_by === "string")
      parts.push(`by ${data.evaluated_by}`);
    if (typeof data.evaluated_at === "string")
      parts.push(`@ ${data.evaluated_at}`);
    if (typeof data.reason === "string" && data.reason) parts.push(data.reason);
    return { passed: data.passed, reason: parts.join(" — ") };
  } catch (err) {
    return {
      passed: false,
      reason: `Override file parse error (${resultPath}): ${(err as Error).message}`,
    };
  }
}

export function evaluateCriterion(
  criterion: string,
  projectDir: string,
  evals?: Array<{
    name: string;
    type: string;
    command?: string;
    pass_criteria?: string;
  }>,
): CriterionResult {
  // 0. Check if evals array has an explicit automated command or LLM evaluation
  if (evals) {
    const llmEval = evals.find(
      (e) =>
        e.name === criterion &&
        (e.type === "llm-eval" || e.type === "llm-judge"),
    );
    if (llmEval) {
      const override = loadLlmEvalOverride(projectDir, criterion);
      if (override) {
        return { criterion, passed: override.passed, reason: override.reason };
      }
      return {
        criterion,
        passed: false,
        reason: `Awaiting LLM evaluation (pass_criteria: ${llmEval.pass_criteria}) — record verdict in .mission/evals/${criterion}.result.yaml`,
      };
    }

    const matchingEval = evals.find(
      (e) => e.name === criterion && e.type === "automated" && e.command,
    );
    if (matchingEval && matchingEval.command) {
      try {
        execSync(matchingEval.command, { cwd: projectDir, stdio: "ignore" });
        return {
          criterion,
          passed: true,
          reason: `Automated command succeeded: ${matchingEval.command}`,
        };
      } catch (error) {
        return {
          criterion,
          passed: false,
          reason: `Automated command failed (${(error as Error).message}): ${matchingEval.command}`,
        };
      }
    }
  }

  // 1. File existence check
  const fileMatch =
    criterion.match(FILE_EXISTENCE_PATTERN) ??
    criterion.match(FILE_EXISTENCE_EN);
  if (fileMatch) {
    const fileName = fileMatch[1].trim();
    const filePath = join(projectDir, fileName);
    const exists = existsSync(filePath);
    return {
      criterion,
      passed: exists,
      reason: exists ? `${fileName} found` : `${fileName} not found`,
    };
  }

  // 2. Test-related (rule-based: recommend manual check if no explicit command)
  if (TEST_PATTERN.test(criterion)) {
    return {
      criterion,
      passed: false,
      reason:
        "Manual verification required: check npm test results (or add automated eval to mission.yaml)",
    };
  }

  // 3. Fallback: cannot auto-evaluate
  return {
    criterion,
    passed: false,
    reason: "Cannot auto-evaluate — manual verification required",
  };
}

export function evaluateAllCriteria(
  criteria: string[],
  projectDir: string,
  evals?: Array<{
    name: string;
    type: string;
    command?: string;
    pass_criteria?: string;
  }>,
): CriterionResult[] {
  return criteria.map((c) => evaluateCriterion(c, projectDir, evals));
}
