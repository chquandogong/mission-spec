// Report 생성기
import type { CriterionResult } from "./evaluator.js";
import type { HistoryEntry } from "./history.js";

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
      lines.push(`### ${entry.semantic_version} (${entry.date})`);
      lines.push("");
      lines.push(`- **Intent:** ${entry.intent}`);
      lines.push(
        `- **Type:** ${entry.change_type} | **Persistence:** ${entry.persistence}`,
      );
      if (entry.breaking) lines.push("- **Breaking change**");
      if (entry.changes.added.length > 0) {
        lines.push(`- Added: ${entry.changes.added.join(", ")}`);
      }
      if (entry.changes.modified.length > 0) {
        lines.push(`- Modified: ${entry.changes.modified.join(", ")}`);
      }
      lines.push("");
    });
  }

  lines.push("---", `Mission Spec Report — ${data.timestamp}`);

  return lines.join("\n");
}
