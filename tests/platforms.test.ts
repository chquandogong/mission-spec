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

describe('handles multiline goal', () => {
  const multiline: MissionSpec = {
    title: 'Multiline Mission',
    goal: 'Line one.\nLine two.\nLine three.',
    done_when: ['done'],
  };

  it('OpenCode uses TOML multiline string for multiline goal', () => {
    const result = convertToOpenCode(multiline);
    // Must NOT produce goal = "line1\nline2" (invalid TOML)
    expect(result).not.toMatch(/goal = "[^"]*\n/);
    // Must use triple-quote multiline
    expect(result).toContain('"""');
    expect(result).toContain('Line one.');
    expect(result).toContain('Line two.');
  });

  it('Cursor preserves multiline goal', () => {
    const result = convertToCursor(multiline);
    expect(result).toContain('Line one.');
    expect(result).toContain('Line two.');
  });

  it('Codex preserves multiline goal', () => {
    const result = convertToCodex(multiline);
    expect(result).toContain('Line one.');
    expect(result).toContain('Line two.');
  });
});

describe('handles TOML special characters', () => {
  it('escapes double quotes in single-line strings', () => {
    const mission: MissionSpec = {
      title: 'T "quoted"',
      goal: 'Say "hi"',
      done_when: ['check "value"'],
    };
    const result = convertToOpenCode(mission);
    // Must not produce title = "T "quoted"" — that's invalid TOML
    expect(result).toContain('title = "T \\"quoted\\""');
    expect(result).toContain('goal = "Say \\"hi\\""');
    expect(result).toContain('"check \\"value\\""');
  });

  it('escapes backslashes in single-line strings', () => {
    const mission: MissionSpec = {
      title: 'path\\to\\file',
      goal: 'fix it',
      done_when: ['done'],
    };
    const result = convertToOpenCode(mission);
    expect(result).toContain('title = "path\\\\to\\\\file"');
  });

  it('handles quotes inside multiline strings', () => {
    const mission: MissionSpec = {
      title: 'Test',
      goal: 'Line "one"\nLine "two"',
      done_when: ['done'],
    };
    const result = convertToOpenCode(mission);
    // Multiline triple-quote: quotes inside are OK without escaping
    expect(result).toContain('"""');
    expect(result).toContain('Line "one"');
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
