// ms-eval — evaluate current state against done_when criteria
import { loadAndValidateMission } from "../core/parser.js";
import {
  evaluateAllCriteria,
  type CriterionResult,
} from "../core/evaluator.js";

export { type CriterionResult } from "../core/evaluator.js";

export interface EvalResult {
  criteria: CriterionResult[];
  allPassed: boolean;
  passed: number;
  total: number;
  summary: string;
}

export function evaluateMission(projectDir: string): EvalResult {
  const doc = loadAndValidateMission(projectDir);
  const doneWhen = doc.mission.done_when;
  const evals = doc.mission.evals;

  const criteria = evaluateAllCriteria(doneWhen, projectDir, evals);
  const passed = criteria.filter((c) => c.passed).length;
  const total = criteria.length;
  const allPassed = passed === total;

  const summary = `${passed}/${total} criteria passed${allPassed ? " — mission complete!" : ""}`;

  return { criteria, allPassed, passed, total, summary };
}
