// /ms:report — run report 생성
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
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
  const missionPath = join(projectDir, 'mission.yaml');
  if (!existsSync(missionPath)) {
    throw new Error(`mission.yaml not found in ${projectDir}`);
  }
  const content = readFileSync(missionPath, 'utf-8');
  const doc = parse(content) as { mission: Record<string, unknown> };
  const m = doc.mission;

  const evalResult = evaluateMission(projectDir);
  const timestamp = new Date().toISOString();

  const markdown = renderReport({
    title: m.title as string,
    goal: (m.goal as string).trim(),
    author: m.author as string | undefined,
    version: m.version as string | undefined,
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
