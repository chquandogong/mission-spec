import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { stringify } from 'yaml';
import { generateMissionReport, type ReportResult } from '../../src/commands/report.js';

let tempDir: string;

function writeMission(dir: string, mission: Record<string, unknown>) {
  writeFileSync(join(dir, 'mission.yaml'), stringify({ mission }));
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'ms-report-'));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('generateMissionReport', () => {
  it('generates a markdown report', () => {
    writeMission(tempDir, {
      title: 'Report Test',
      goal: 'Generate a report',
      done_when: ['task completed'],
    });
    const result = generateMissionReport(tempDir);
    expect(result.markdown).toContain('# Mission Report: Report Test');
  });

  it('includes eval results in report', () => {
    writeMission(tempDir, {
      title: 'Eval Report',
      goal: 'Check evals',
      done_when: ['package.json 존재', 'README.md 존재'],
    });
    writeFileSync(join(tempDir, 'package.json'), '{}');
    const result = generateMissionReport(tempDir);
    expect(result.markdown).toContain('[x]');
    expect(result.markdown).toContain('[ ]');
    expect(result.passed).toBe(1);
    expect(result.total).toBe(2);
  });

  it('includes timestamp', () => {
    writeMission(tempDir, {
      title: 'Timestamp',
      goal: 'Check timestamp',
      done_when: ['done'],
    });
    const result = generateMissionReport(tempDir);
    expect(result.timestamp).toBeTruthy();
    expect(result.markdown).toContain('Generated:');
  });

  it('includes mission metadata', () => {
    writeMission(tempDir, {
      title: 'Metadata',
      goal: 'Check metadata',
      done_when: ['done'],
      version: '1.0.0',
      author: 'tester',
    });
    const result = generateMissionReport(tempDir);
    expect(result.markdown).toContain('tester');
    expect(result.markdown).toContain('1.0.0');
  });

  it('shows overall status as PASS or FAIL', () => {
    writeMission(tempDir, {
      title: 'Status Check',
      goal: 'Check status',
      done_when: ['package.json 존재'],
    });
    writeFileSync(join(tempDir, 'package.json'), '{}');
    const result = generateMissionReport(tempDir);
    expect(result.markdown).toContain('PASS');
    expect(result.allPassed).toBe(true);
  });

  it('shows FAIL when criteria not met', () => {
    writeMission(tempDir, {
      title: 'Fail Check',
      goal: 'Check fail',
      done_when: ['nonexistent.txt 존재'],
    });
    const result = generateMissionReport(tempDir);
    expect(result.markdown).toContain('FAIL');
    expect(result.allPassed).toBe(false);
  });

  it('throws when mission.yaml is missing', () => {
    expect(() => generateMissionReport(tempDir)).toThrow();
  });
});
