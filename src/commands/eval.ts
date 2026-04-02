// /ms:eval — done_when 기준 대비 현재 상태 평가
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { evaluateAllCriteria, type CriterionResult } from '../core/evaluator.js';

export { type CriterionResult } from '../core/evaluator.js';

export interface EvalResult {
  criteria: CriterionResult[];
  allPassed: boolean;
  passed: number;
  total: number;
  summary: string;
}

function loadMission(projectDir: string): { mission: Record<string, unknown> } {
  const missionPath = join(projectDir, 'mission.yaml');
  if (!existsSync(missionPath)) {
    throw new Error(`mission.yaml not found in ${projectDir}`);
  }
  const content = readFileSync(missionPath, 'utf-8');
  return parse(content) as { mission: Record<string, unknown> };
}

export function evaluateMission(projectDir: string): EvalResult {
  const doc = loadMission(projectDir);
  const doneWhen = doc.mission.done_when as string[];

  const criteria = evaluateAllCriteria(doneWhen, projectDir);
  const passed = criteria.filter((c) => c.passed).length;
  const total = criteria.length;
  const allPassed = passed === total;

  const summary = `${passed}/${total} criteria passed${allPassed ? ' — mission complete!' : ''}`;

  return { criteria, allPassed, passed, total, summary };
}
