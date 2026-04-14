// Report 생성기
import type { CriterionResult } from "./evaluator.js";
import type { HistoryEntry } from "./history.js";

export interface TraceEntry {
  criterion: string;
  eval_type: string;
  code: string[];
  tests: string[];
}

export interface ReportData {
  title: string;
  goal: string;
  author?: string;
  version?: string;
  criteria: CriterionResult[];
  passed: number;
  total: number;
  allPassed: boolean;
  timestamp: string;
  recentChanges?: HistoryEntry[];
  historyWarning?: string;
  traceability?: TraceEntry[];
}

export function renderReport(data: ReportData): string {
  const status = data.allPassed ? "PASS" : "FAIL";
  const lines: string[] = [
    `# Mission Report: ${data.title}`,
    "",
    `**Status:** ${status}`,
    `**Progress:** ${data.passed}/${data.total}`,
    `**Generated:** ${data.timestamp}`,
  ];

  if (data.author) lines.push(`**Author:** ${data.author}`);
  if (data.version) lines.push(`**Version:** ${data.version}`);

  lines.push("", "## Evaluation Results", "");

  data.criteria.forEach((c) => {
    const icon = c.passed ? "[x]" : "[ ]";
    lines.push(`- ${icon} ${c.criterion}`);
    if (!c.passed) lines.push(`  - ${c.reason}`);
  });

  if (data.recentChanges && data.recentChanges.length > 0) {
    lines.push("", "## Recent Changes", "");
    data.recentChanges.forEach((entry) => {
      const added = entry.changes?.added ?? [];
      const modified = entry.changes?.modified ?? [];
      lines.push(`### ${entry.semantic_version} (${entry.date})`);
      lines.push("");
      lines.push(`- **Intent:** ${entry.intent}`);
      lines.push(
        `- **Type:** ${entry.change_type} | **Persistence:** ${entry.persistence}`,
      );
      if (entry.breaking) lines.push("- **Breaking change**");
      if (added.length > 0) {
        lines.push(`- Added: ${added.join(", ")}`);
      }
      if (modified.length > 0) {
        lines.push(`- Modified: ${modified.join(", ")}`);
      }
      lines.push("");
    });
  }

  if (data.traceability && data.traceability.length > 0) {
    lines.push("", "## Traceability", "");
    lines.push("| Requirement | Eval Type | Code | Tests |");
    lines.push("|---|---|---|---|");
    data.traceability.forEach((t) => {
      lines.push(
        `| ${t.criterion} | ${t.eval_type} | ${t.code.join(", ")} | ${t.tests.join(", ")} |`,
      );
    });
  }

  if (data.historyWarning) {
    lines.push("", "## History", "", data.historyWarning);
  }

  lines.push("---", `Mission Spec Report — ${data.timestamp}`);

  return lines.join("\n");
}
