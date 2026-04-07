import { describe, it, expect } from 'vitest';
import {
  generateMissionDraft,
  evaluateMission,
  getMissionStatus,
  generateMissionReport,
  validateMission,
  parseMissionFile,
} from '../src/index.js';

describe('root exports', () => {
  it('exports public API from the package root', () => {
    expect(typeof generateMissionDraft).toBe('function');
    expect(typeof evaluateMission).toBe('function');
    expect(typeof getMissionStatus).toBe('function');
    expect(typeof generateMissionReport).toBe('function');
    expect(typeof validateMission).toBe('function');
    expect(typeof parseMissionFile).toBe('function');
  });
});
