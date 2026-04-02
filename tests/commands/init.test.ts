import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generateMissionDraft, type InitOptions } from '../../src/commands/init.js';

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'ms-init-'));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('generateMissionDraft', () => {
  it('generates valid YAML from a natural language goal', () => {
    const result = generateMissionDraft({
      goal: '로그인 페이지의 비밀번호 검증 버그를 수정한다',
      projectDir: tempDir,
    });
    expect(result.yaml).toContain('mission:');
    expect(result.yaml).toContain('title:');
    expect(result.yaml).toContain('goal:');
    expect(result.yaml).toContain('done_when:');
    expect(result.valid).toBe(true);
  });

  it('includes project context from package.json if available', () => {
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify({ name: 'my-app', description: 'A test app' }),
    );
    const result = generateMissionDraft({
      goal: 'API 엔드포인트 추가',
      projectDir: tempDir,
    });
    expect(result.yaml).toContain('goal:');
    expect(result.context.hasPackageJson).toBe(true);
  });

  it('includes project context from README if available', () => {
    writeFileSync(join(tempDir, 'README.md'), '# My Project\nA cool project');
    const result = generateMissionDraft({
      goal: '문서 업데이트',
      projectDir: tempDir,
    });
    expect(result.context.hasReadme).toBe(true);
  });

  it('works without any project context files', () => {
    const result = generateMissionDraft({
      goal: '새 프로젝트 시작',
      projectDir: tempDir,
    });
    expect(result.valid).toBe(true);
    expect(result.context.hasPackageJson).toBe(false);
    expect(result.context.hasReadme).toBe(false);
  });

  it('generates done_when criteria from the goal', () => {
    const result = generateMissionDraft({
      goal: '사용자 인증 시스템을 구현한다',
      projectDir: tempDir,
    });
    expect(result.parsed.mission.done_when.length).toBeGreaterThan(0);
  });

  it('passes schema validation', () => {
    const result = generateMissionDraft({
      goal: '데이터베이스 마이그레이션 스크립트 작성',
      projectDir: tempDir,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('accepts optional title override', () => {
    const result = generateMissionDraft({
      goal: '버그 수정',
      title: '커스텀 제목',
      projectDir: tempDir,
    });
    expect(result.yaml).toContain('커스텀 제목');
  });

  it('accepts optional constraints', () => {
    const result = generateMissionDraft({
      goal: 'API 리팩토링',
      constraints: ['기존 인터페이스 유지', '하위 호환성 보장'],
      projectDir: tempDir,
    });
    expect(result.yaml).toContain('constraints:');
    expect(result.yaml).toContain('기존 인터페이스 유지');
  });

  it('rejects empty goal', () => {
    expect(() =>
      generateMissionDraft({ goal: '', projectDir: tempDir }),
    ).toThrow();
  });
});
