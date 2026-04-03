// /mission-spec:ms-report — run report 생성
import { loadAndValidateMission } from '../core/parser.js';
import { evaluateMission } from './eval.js';
import { renderReport } from '../core/reporter.js';

export interface ReportResult {
  markdown: string;
  passed: number;
  total: number;
  allPassed: boolean;
  timestamp: string;
}

export function generateMissionReport(projectDir: string): ReportResult {
  const doc = loadAndValidateMission(projectDir);
  const m = doc.mission;

  const evalResult = evaluateMission(projectDir);
  const timestamp = new Date().toISOString();

  const markdown = renderReport({
    title: m.title,
    goal: m.goal.trim(),
    author: m.author,
    version: m.version,
    criteria: evalResult.criteria,
    passed: evalResult.passed,
    total: evalResult.total,
    allPassed: evalResult.allPassed,
    timestamp,
  });

  return {
    markdown,
    passed: evalResult.passed,
    total: evalResult.total,
    allPassed: evalResult.allPassed,
    timestamp,
  };
}
