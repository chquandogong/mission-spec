import { describe, it, expect } from 'vitest';
import { validateMission } from '../src/schema/validator.js';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { resolve } from 'node:path';

function loadFixture(name: string): unknown {
  const content = readFileSync(resolve(__dirname, 'fixtures', name), 'utf-8');
  return parse(content);
}

describe('validateMission', () => {
  it('accepts a valid minimal mission', () => {
    const result = validateMission(loadFixture('valid-mission.yaml'));
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('accepts a complex mission with all optional fields', () => {
    const result = validateMission(loadFixture('complex-mission.yaml'));
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects a mission missing required fields (goal, done_when)', () => {
    const result = validateMission(loadFixture('invalid-mission.yaml'));
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects null input', () => {
    const result = validateMission(null);
    expect(result.valid).toBe(false);
  });

  it('rejects empty object', () => {
    const result = validateMission({});
    expect(result.valid).toBe(false);
  });

  it('rejects mission with empty title', () => {
    const result = validateMission({
      mission: { title: '', goal: 'test', done_when: ['test'] },
    });
    expect(result.valid).toBe(false);
  });

  it('rejects mission with empty done_when array', () => {
    const result = validateMission({
      mission: { title: 'test', goal: 'test', done_when: [] },
    });
    expect(result.valid).toBe(false);
  });

  it('rejects mission with invalid approver type', () => {
    const result = validateMission({
      mission: {
        title: 'test',
        goal: 'test',
        done_when: ['done'],
        approvals: [{ gate: 'g1', approver: 'invalid_type' }],
      },
    });
    expect(result.valid).toBe(false);
  });

  it('rejects mission with unknown top-level properties', () => {
    const result = validateMission({
      mission: { title: 'test', goal: 'test', done_when: ['done'] },
      extra_field: true,
    });
    expect(result.valid).toBe(false);
  });
});
