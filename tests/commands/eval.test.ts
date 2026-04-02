import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { stringify } from 'yaml';
import { evaluateMission, type EvalResult } from '../../src/commands/eval.js';

let tempDir: string;

function writeMission(dir: string, mission: Record<string, unknown>) {
  writeFileSync(join(dir, 'mission.yaml'), stringify({ mission }));
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'ms-eval-'));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('evaluateMission', () => {
  it('returns evaluation results for each done_when criterion', () => {
    writeMission(tempDir, {
      title: 'Test Mission',
      goal: 'Test goal',
      done_when: ['파일 생성 완료', '테스트 통과'],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria).toHaveLength(2);
    expect(result.criteria[0].criterion).toBe('파일 생성 완료');
    expect(result.criteria[1].criterion).toBe('테스트 통과');
  });

  it('marks file-existence checks as passed when file exists', () => {
    writeMission(tempDir, {
      title: 'File Check',
      goal: 'Check files',
      done_when: ['README.md 파일 존재'],
    });
    writeFileSync(join(tempDir, 'README.md'), '# Hello');
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(true);
  });

  it('marks file-existence checks as failed when file missing', () => {
    writeMission(tempDir, {
      title: 'File Check',
      goal: 'Check files',
      done_when: ['README.md 파일 존재'],
    });
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(false);
  });

  it('reports overall pass when all criteria pass', () => {
    writeMission(tempDir, {
      title: 'All Pass',
      goal: 'All pass',
      done_when: ['package.json 존재'],
    });
    writeFileSync(join(tempDir, 'package.json'), '{}');
    const result = evaluateMission(tempDir);
    expect(result.allPassed).toBe(true);
  });

  it('reports overall fail when any criterion fails', () => {
    writeMission(tempDir, {
      title: 'Partial',
      goal: 'Partial',
      done_when: ['package.json 존재', 'missing.txt 존재'],
    });
    writeFileSync(join(tempDir, 'package.json'), '{}');
    const result = evaluateMission(tempDir);
    expect(result.allPassed).toBe(false);
  });

  it('throws when mission.yaml is missing', () => {
    expect(() => evaluateMission(tempDir)).toThrow();
  });

  it('provides a summary string', () => {
    writeMission(tempDir, {
      title: 'Summary Test',
      goal: 'Test summary',
      done_when: ['조건 1', '조건 2'],
    });
    const result = evaluateMission(tempDir);
    expect(result.summary).toContain('0/2');
  });

  it('detects test-related criteria with npm test check', () => {
    writeMission(tempDir, {
      title: 'Test Check',
      goal: 'Run tests',
      done_when: ['모든 테스트 통과'],
    });
    // npm test는 실행 불가한 temp dir이므로 pending으로 표시
    const result = evaluateMission(tempDir);
    expect(result.criteria[0].passed).toBe(false);
    expect(result.criteria[0].reason).toBeTruthy();
  });
});
