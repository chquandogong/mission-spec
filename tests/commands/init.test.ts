import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  generateMissionDraft,
  type InitOptions,
} from "../../src/commands/init.js";

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "ms-init-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("generateMissionDraft", () => {
  it("generates valid YAML from a natural language goal", () => {
    const result = generateMissionDraft({
      goal: "로그인 페이지의 비밀번호 검증 버그를 수정한다",
      projectDir: tempDir,
    });
    expect(result.yaml).toContain("mission:");
    expect(result.yaml).toContain("title:");
    expect(result.yaml).toContain("goal:");
    expect(result.yaml).toContain("done_when:");
    expect(result.valid).toBe(true);
  });

  it("includes project context from package.json if available", () => {
    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({ name: "my-app", description: "A test app" }),
    );
    const result = generateMissionDraft({
      goal: "API 엔드포인트 추가",
      projectDir: tempDir,
    });
    expect(result.yaml).toContain("goal:");
    expect(result.context.hasPackageJson).toBe(true);
    expect(result.context.hasNpmTestScript).toBe(false);
  });

  it("scaffolds an automated npm_test eval-ref when package.json has a test script", () => {
    writeFileSync(
      join(tempDir, "package.json"),
      JSON.stringify({
        name: "my-app",
        scripts: { test: "vitest run" },
      }),
    );
    const result = generateMissionDraft({
      goal: "verify that the payment flow works end to end",
      projectDir: tempDir,
    });
    expect(result.valid).toBe(true);
    expect(result.context.hasNpmTestScript).toBe(true);
    expect(result.parsed.mission.evals).toEqual([
      {
        name: "npm_test",
        type: "automated",
        command: "npm test",
        pass_criteria: "npm test exits with status 0",
      },
    ]);
    expect(result.parsed.mission.done_when_refs).toEqual([
      {
        index: result.parsed.mission.done_when.findIndex(
          (criterion) => criterion === "All unit tests passing",
        ),
        kind: "eval-ref",
        value: "npm_test",
      },
    ]);
  });

  it("includes project context from README if available", () => {
    writeFileSync(join(tempDir, "README.md"), "# My Project\nA cool project");
    const result = generateMissionDraft({
      goal: "문서 업데이트",
      projectDir: tempDir,
    });
    expect(result.context.hasReadme).toBe(true);
  });

  it("works without any project context files", () => {
    const result = generateMissionDraft({
      goal: "새 프로젝트 시작",
      projectDir: tempDir,
    });
    expect(result.valid).toBe(true);
    expect(result.context.hasPackageJson).toBe(false);
    expect(result.context.hasReadme).toBe(false);
  });

  it("generates done_when criteria from the goal", () => {
    const result = generateMissionDraft({
      goal: "사용자 인증 시스템을 구현한다",
      projectDir: tempDir,
    });
    expect(result.parsed.mission.done_when.length).toBeGreaterThan(0);
  });

  it("passes schema validation", () => {
    const result = generateMissionDraft({
      goal: "데이터베이스 마이그레이션 스크립트 작성",
      projectDir: tempDir,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("accepts optional title override", () => {
    const result = generateMissionDraft({
      goal: "버그 수정",
      title: "커스텀 제목",
      projectDir: tempDir,
    });
    expect(result.yaml).toContain("커스텀 제목");
  });

  it("accepts optional constraints", () => {
    const result = generateMissionDraft({
      goal: "API 리팩토링",
      constraints: ["기존 인터페이스 유지", "하위 호환성 보장"],
      projectDir: tempDir,
    });
    expect(result.yaml).toContain("constraints:");
    expect(result.yaml).toContain("기존 인터페이스 유지");
  });

  it("rejects empty goal", () => {
    expect(() =>
      generateMissionDraft({ goal: "", projectDir: tempDir }),
    ).toThrow();
  });

  describe("English-only inputs", () => {
    it("recognizes build/develop/design as implementation intent", () => {
      for (const verb of ["build", "develop", "design", "refactor"]) {
        const result = generateMissionDraft({
          goal: `${verb} a new authentication service`,
          projectDir: tempDir,
        });
        expect(
          result.parsed.mission.done_when.some((c) =>
            c.includes("Code implementation complete"),
          ),
        ).toBe(true);
      }
    });

    it("recognizes test/verify/validate/ensure as test intent", () => {
      for (const verb of ["test", "verify", "validate", "ensure"]) {
        const result = generateMissionDraft({
          goal: `${verb} that the payment flow works end to end`,
          projectDir: tempDir,
        });
        expect(
          result.parsed.mission.done_when.some((c) =>
            c.includes("All unit tests passing"),
          ),
        ).toBe(true);
      }
    });

    it("recognizes document/guide as documentation intent", () => {
      for (const verb of [
        "document",
        "write a guide for",
        "update the tutorial for",
      ]) {
        const result = generateMissionDraft({
          goal: `${verb} the deployment workflow`,
          projectDir: tempDir,
        });
        expect(
          result.parsed.mission.done_when.some((c) =>
            c.includes("documentation updated"),
          ),
        ).toBe(true);
      }
    });

    it("does not false-match substrings (prefix ≠ fix)", () => {
      const result = generateMissionDraft({
        goal: "Rename the prefix constant to avoid collisions",
        projectDir: tempDir,
      });
      // "prefix" contains "fix" but word-boundary match must not trigger.
      // The generic "npm test or core logic verification complete" fallback
      // should be present (since no test verb either).
      expect(
        result.parsed.mission.done_when.some((c) =>
          c.includes("npm test or core logic verification"),
        ),
      ).toBe(true);
    });

    it("is case-insensitive", () => {
      const result = generateMissionDraft({
        goal: "IMPLEMENT OAuth2 FLOW",
        projectDir: tempDir,
      });
      expect(
        result.parsed.mission.done_when.some((c) =>
          c.includes("Code implementation complete"),
        ),
      ).toBe(true);
    });

    it("still recognizes Korean implementation verbs after English expansion", () => {
      const result = generateMissionDraft({
        goal: "사용자 인증을 구현한다",
        projectDir: tempDir,
      });
      expect(
        result.parsed.mission.done_when.some((c) =>
          c.includes("Code implementation complete"),
        ),
      ).toBe(true);
    });
  });
});
