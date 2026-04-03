// /mission-spec:ms-status — 미션 진행 상황 요약
import { loadAndValidateMission } from '../core/parser.js';
import { evaluateMission } from './eval.js';

export interface StatusResult {
  title: string;
  goal: string;
  constraints: string[];
  passed: number;
  total: number;
  progress: string;
  criteria: Array<{ criterion: string; passed: boolean; reason: string }>;
  markdown: string;
}

export function getMissionStatus(projectDir: string): StatusResult {
  const doc = loadAndValidateMission(projectDir);
  const m = doc.mission;

  const evalResult = evaluateMission(projectDir);

  const title = m.title;
  const goal = m.goal;
  const constraints = m.constraints ?? [];

  const md = [
    `# ${title}`,
    '',
    `**Goal:** ${goal.trim()}`,
    '',
    `**Progress:** ${evalResult.passed}/${evalResult.total}`,
    '',
  ];

  if (constraints.length > 0) {
    md.push('## Constraints', '');
    constraints.forEach((c) => md.push(`- ${c}`));
    md.push('');
  }

  md.push('## Done When', '');
  evalResult.criteria.forEach((c) => {
    const icon = c.passed ? '[x]' : '[ ]';
    md.push(`- ${icon} ${c.criterion}`);
    if (!c.passed) md.push(`  - ${c.reason}`);
  });

  return {
    title,
    goal: goal.trim(),
    constraints,
    passed: evalResult.passed,
    total: evalResult.total,
    progress: `${evalResult.passed}/${evalResult.total}`,
    criteria: evalResult.criteria,
    markdown: md.join('\n'),
  };
}
