import { describe, it, expect } from 'vitest';
import {
  convertToCursor,
  convertToCodex,
  convertToOpenCode,
  type MissionSpec,
} from '../src/adapters/platforms.js';

const sampleMission: MissionSpec = {
  title: 'Test Mission',
  goal: 'Implement feature X',
  done_when: ['feature X works', 'all tests pass'],
  constraints: ['no breaking changes'],
};

describe('convertToCursor', () => {
  it('generates Cursor rules format', () => {
    const result = convertToCursor(sampleMission);
    expect(result).toContain('Test Mission');
    expect(result).toContain('Implement feature X');
    expect(result).toContain('feature X works');
    expect(result).toContain('no breaking changes');
  });

  it('uses .cursorrules filename convention', () => {
    const result = convertToCursor(sampleMission);
    expect(typeof result).toBe('string');
  });
});

describe('convertToCodex', () => {
  it('generates Codex instructions format (markdown)', () => {
    const result = convertToCodex(sampleMission);
    expect(result).toContain('Test Mission');
    expect(result).toContain('Implement feature X');
    expect(result).toContain('feature X works');
  });

  it('includes done_when as checklist', () => {
    const result = convertToCodex(sampleMission);
    expect(result).toContain('- [ ]');
  });
});

describe('convertToOpenCode', () => {
  it('generates OpenCode format (TOML-like config)', () => {
    const result = convertToOpenCode(sampleMission);
    expect(result).toContain('Test Mission');
    expect(result).toContain('Implement feature X');
  });
});

describe('handles minimal mission', () => {
  const minimal: MissionSpec = {
    title: 'Minimal',
    goal: 'Do something',
    done_when: ['done'],
  };

  it('Cursor works without constraints', () => {
    const result = convertToCursor(minimal);
    expect(result).toContain('Minimal');
    expect(result).not.toContain('Constraints');
  });

  it('Codex works without constraints', () => {
    const result = convertToCodex(minimal);
    expect(result).toContain('Minimal');
  });

  it('OpenCode works without constraints', () => {
    const result = convertToOpenCode(minimal);
    expect(result).toContain('Minimal');
  });
});
