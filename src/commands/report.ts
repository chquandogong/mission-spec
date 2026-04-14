// ms-report — run report generation
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { loadAndValidateMission } from "../core/parser.js";
import { evaluateMission } from "./eval.js";
import { renderReport, type TraceEntry } from "../core/reporter.js";
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

  let traceability: TraceEntry[] | undefined;
  const tracePath = join(
    projectDir,
    ".mission",
    "traceability",
    "TRACE_MATRIX.yaml",
  );
  if (existsSync(tracePath)) {
    try {
      const traceData = parse(readFileSync(tracePath, "utf-8")) as {
        requirements?: Array<{
          criterion: string;
          eval_type: string;
          code?: string[];
          tests?: string[];
        }>;
      };
      if (traceData?.requirements) {
        traceability = traceData.requirements.map((r) => ({
          criterion: r.criterion,
          eval_type: r.eval_type,
          code: r.code ?? [],
          tests: r.tests ?? [],
        }));
      }
    } catch {
      // TRACE_MATRIX parse failure is non-fatal
    }
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
    traceability,
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
