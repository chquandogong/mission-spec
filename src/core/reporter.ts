// Report 생성기
import type { CriterionResult } from './evaluator.js';

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
}

export function renderReport(data: ReportData): string {
  const status = data.allPassed ? 'PASS' : 'FAIL';
  const lines: string[] = [
    `# Mission Report: ${data.title}`,
    '',
    `**Status:** ${status}`,
    `**Progress:** ${data.passed}/${data.total}`,
    `**Generated:** ${data.timestamp}`,
  ];

  if (data.author) lines.push(`**Author:** ${data.author}`);
  if (data.version) lines.push(`**Version:** ${data.version}`);

  lines.push('', '## Evaluation Results', '');

  data.criteria.forEach((c) => {
    const icon = c.passed ? '[x]' : '[ ]';
    lines.push(`- ${icon} ${c.criterion}`);
    if (!c.passed) lines.push(`  - ${c.reason}`);
  });

  lines.push('', '---', `Mission Spec Report — ${data.timestamp}`);

  return lines.join('\n');
}
