// ms-report — run report 생성
import { loadAndValidateMission } from "../core/parser.js";
import { evaluateMission } from "./eval.js";
import { renderReport } from "../core/reporter.js";
import { loadHistory, type HistoryEntry } from "../core/history.js";

export interface ReportResult {
  markdown: string;
  passed: number;
  total: number;
  allPassed: boolean;
  timestamp: string;
  historyWarning?: string;
}

export function generateMissionReport(projectDir: string): ReportResult {
  const doc = loadAndValidateMission(projectDir);
  const m = doc.mission;

  const evalResult = evaluateMission(projectDir);
  const timestamp = new Date().toISOString();

  let recentChanges: HistoryEntry[] | undefined;
  let historyWarning: string | undefined;
  try {
    const history = loadHistory(projectDir);
    recentChanges = history?.timeline.slice(0, 3);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    historyWarning = `History unavailable: ${message}`;
  }

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
    recentChanges,
    historyWarning,
  });

  return {
    markdown,
    passed: evalResult.passed,
    total: evalResult.total,
    allPassed: evalResult.allPassed,
    timestamp,
    historyWarning,
  };
}
