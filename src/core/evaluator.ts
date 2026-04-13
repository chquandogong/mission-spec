// done_when 조건 평가 엔진 (rule-based + automated command, v1.2)
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { parse } from "yaml";

export interface CriterionResult {
  criterion: string;
  passed: boolean;
  reason: string;
}

// 파일 존재 패턴: "X 파일 존재", "X 존재", "X file exists" 등
const FILE_EXISTENCE_PATTERN = /^(.+?)\s*(?:파일\s*)?존재$/;
const FILE_EXISTENCE_EN = /^(.+?)\s+(?:file\s+)?exists?$/i;

// 테스트 관련 패턴
const TEST_PATTERN = /테스트\s*통과|test.*pass|tests?\s+pass/i;

// LLM/주관 평가의 외부 판정 오버라이드 로드.
// `.mission/evals/<name>.result.yaml` 이 존재하면 그 결과를 사용.
// 형식: { passed: bool, reason?: string, evaluated_by?: string, evaluated_at?: string }
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
        reason: `오버라이드 파일 형식 오류 (${resultPath}): 'passed: true|false' 필수`,
      };
    }
    const parts: string[] = [data.passed ? "판정: PASS" : "판정: FAIL"];
    if (typeof data.evaluated_by === "string")
      parts.push(`by ${data.evaluated_by}`);
    if (typeof data.evaluated_at === "string")
      parts.push(`@ ${data.evaluated_at}`);
    if (typeof data.reason === "string" && data.reason) parts.push(data.reason);
    return { passed: data.passed, reason: parts.join(" — ") };
  } catch (err) {
    return {
      passed: false,
      reason: `오버라이드 파일 파싱 실패 (${resultPath}): ${(err as Error).message}`,
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
  // 0. evals 배열에 명시적인 자동화 명령 또는 LLM 검증이 있는지 확인
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
        reason: `LLM 검증 대기 (pass_criteria: ${llmEval.pass_criteria}) — .mission/evals/${criterion}.result.yaml 에 판정을 기록하세요`,
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
          reason: `자동화 명령 성공: ${matchingEval.command}`,
        };
      } catch (error) {
        return {
          criterion,
          passed: false,
          reason: `자동화 명령 실패 (${(error as Error).message}): ${matchingEval.command}`,
        };
      }
    }
  }

  // 1. 파일 존재 체크
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
      reason: exists ? `${fileName} 존재 확인` : `${fileName} 미발견`,
    };
  }

  // 2. 테스트 관련 (rule-based: 명시적 명령이 없으면 수동 확인 권고)
  if (TEST_PATTERN.test(criterion)) {
    return {
      criterion,
      passed: false,
      reason:
        "수동 확인 필요: npm test 실행 결과를 확인하세요 (또는 mission.yaml에 automated eval 추가)",
    };
  }

  // 3. 기타: 자동 평가 불가
  return {
    criterion,
    passed: false,
    reason: "자동 평가 불가 — 수동 확인 필요",
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
