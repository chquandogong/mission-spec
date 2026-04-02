// /ms:status — 미션 진행 상황 요약
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
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
  const missionPath = join(projectDir, 'mission.yaml');
  if (!existsSync(missionPath)) {
    throw new Error(`mission.yaml not found in ${projectDir}`);
  }
  const content = readFileSync(missionPath, 'utf-8');
  const doc = parse(content) as { mission: Record<string, unknown> };
  const m = doc.mission;

  const evalResult = evaluateMission(projectDir);

  const title = m.title as string;
  const goal = m.goal as string;
  const constraints = (m.constraints as string[]) ?? [];

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
