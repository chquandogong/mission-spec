import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { stringify } from 'yaml';
import { getMissionStatus, type StatusResult } from '../../src/commands/status.js';

let tempDir: string;

function writeMission(dir: string, mission: Record<string, unknown>) {
  writeFileSync(join(dir, 'mission.yaml'), stringify({ mission }));
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'ms-status-'));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('getMissionStatus', () => {
  it('returns mission title and goal', () => {
    writeMission(tempDir, {
      title: 'My Mission',
      goal: 'Do something great',
      done_when: ['task done'],
    });
    const result = getMissionStatus(tempDir);
    expect(result.title).toBe('My Mission');
    expect(result.goal).toBe('Do something great');
  });

  it('shows progress as fraction', () => {
    writeMission(tempDir, {
      title: 'Progress',
      goal: 'Track progress',
      done_when: ['package.json 존재', 'missing.txt 존재'],
    });
    writeFileSync(join(tempDir, 'package.json'), '{}');
    const result = getMissionStatus(tempDir);
    expect(result.passed).toBe(1);
    expect(result.total).toBe(2);
    expect(result.progress).toBe('1/2');
  });

  it('includes constraints if present', () => {
    writeMission(tempDir, {
      title: 'Constrained',
      goal: 'Constrained mission',
      done_when: ['done'],
      constraints: ['no external deps', 'TDD only'],
    });
    const result = getMissionStatus(tempDir);
    expect(result.constraints).toEqual(['no external deps', 'TDD only']);
  });

  it('returns empty constraints when none specified', () => {
    writeMission(tempDir, {
      title: 'Simple',
      goal: 'Simple mission',
      done_when: ['done'],
    });
    const result = getMissionStatus(tempDir);
    expect(result.constraints).toEqual([]);
  });

  it('throws when mission.yaml is missing', () => {
    expect(() => getMissionStatus(tempDir)).toThrow();
  });

  it('returns markdown-formatted output', () => {
    writeMission(tempDir, {
      title: 'Markdown',
      goal: 'Test markdown',
      done_when: ['condition 1'],
    });
    const result = getMissionStatus(tempDir);
    expect(result.markdown).toContain('# Markdown');
    expect(result.markdown).toContain('condition 1');
  });
});
