// done_when 조건 평가 엔진 (rule-based + automated command, v1.2)
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

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

export function evaluateCriterion(
  criterion: string,
  projectDir: string,
  evals?: Array<{ name: string; type: string; command?: string; pass_criteria?: string }>,
): CriterionResult {
  // 0. evals 배열에 명시적인 자동화 명령이 있는지 확인
  if (evals) {
    const matchingEval = evals.find(
      (e) => e.name === criterion && e.type === 'automated' && e.command,
    );
    if (matchingEval && matchingEval.command) {
      try {
        execSync(matchingEval.command, { cwd: projectDir, stdio: 'ignore' });
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
      reason: '수동 확인 필요: npm test 실행 결과를 확인하세요 (또는 mission.yaml에 automated eval 추가)',
    };
  }

  // 3. 기타: 자동 평가 불가
  return {
    criterion,
    passed: false,
    reason: '자동 평가 불가 — 수동 확인 필요',
  };
}

export function evaluateAllCriteria(
  criteria: string[],
  projectDir: string,
  evals?: Array<{ name: string; type: string; command?: string; pass_criteria?: string }>,
): CriterionResult[] {
  return criteria.map((c) => evaluateCriterion(c, projectDir, evals));
}
