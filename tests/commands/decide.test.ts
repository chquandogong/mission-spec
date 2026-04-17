import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { generateMdrDraft } from "../../src/commands/decide.js";

let tempDir: string;

function writeFile(rel: string, content: string) {
  const full = join(tempDir, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "ms-decide-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("generateMdrDraft", () => {
  it("assigns MDR-001 when no prior MDRs exist", () => {
    const result = generateMdrDraft({
      title: "Adopt TDD",
      projectDir: tempDir,
    });
    expect(result.nextMdrNumber).toBe(1);
    expect(result.suggestedPath).toMatch(/MDR-001-adopt-tdd\.md$/);
    expect(result.markdown).toContain("# MDR-001: Adopt TDD");
  });

  it("auto-increments MDR number from existing files", () => {
    writeFile(".mission/decisions/MDR-001-x.md", "# MDR-001");
    writeFile(".mission/decisions/MDR-004-y.md", "# MDR-004");
    writeFile(".mission/decisions/MDR-002-z.md", "# MDR-002");

    const result = generateMdrDraft({
      title: "New Decision",
      projectDir: tempDir,
    });
    expect(result.nextMdrNumber).toBe(5);
    expect(result.suggestedPath).toMatch(/MDR-005-new-decision\.md$/);
  });

  it("ignores non-MDR files in decisions directory", () => {
    writeFile(".mission/decisions/MDR-001-x.md", "# MDR-001");
    writeFile(".mission/decisions/README.md", "# notes");
    writeFile(".mission/decisions/draft.txt", "scratch");

    const result = generateMdrDraft({
      title: "X",
      projectDir: tempDir,
    });
    expect(result.nextMdrNumber).toBe(2);
  });

  it("zero-pads MDR number to 3 digits", () => {
    // Simulate 99 existing MDRs
    for (let i = 1; i <= 99; i++) {
      const n = String(i).padStart(3, "0");
      writeFile(`.mission/decisions/MDR-${n}-x.md`, `# MDR-${n}`);
    }
    const result = generateMdrDraft({
      title: "Y",
      projectDir: tempDir,
    });
    expect(result.nextMdrNumber).toBe(100);
    expect(result.suggestedPath).toMatch(/MDR-100-y\.md$/);
  });

  it("slugifies title — lowercase, spaces→hyphens, strip punctuation", () => {
    const result = generateMdrDraft({
      title: "Adopt TDD + Remove Orchestration!",
      projectDir: tempDir,
    });
    expect(result.slug).toBe("adopt-tdd-remove-orchestration");
  });

  it("preserves Unicode letters in the generated slug and path", () => {
    const result = generateMdrDraft({
      title: "의존성 정책 변경",
      projectDir: tempDir,
    });
    expect(result.slug).toBe("의존성-정책-변경");
    expect(result.suggestedPath).toMatch(/MDR-001-의존성-정책-변경\.md$/u);
  });

  it("counts existing MDR files whose slugs contain Unicode letters", () => {
    writeFile(".mission/decisions/MDR-004-의존성-정책-변경.md", "# MDR-004");

    const result = generateMdrDraft({
      title: "New Decision",
      projectDir: tempDir,
    });
    expect(result.nextMdrNumber).toBe(5);
    expect(result.suggestedPath).toMatch(/MDR-005-new-decision\.md$/);
  });

  it("falls back to a stable slug when title punctuation removes all tokens", () => {
    const result = generateMdrDraft({
      title: "!!!",
      projectDir: tempDir,
    });
    expect(result.slug).toBe("decision");
    expect(result.suggestedPath).toMatch(/MDR-001-decision\.md$/);
  });

  it("fills provided sections and leaves placeholders for missing ones", () => {
    const result = generateMdrDraft({
      title: "Minimal Deps",
      context: "External deps increase maintenance burden.",
      decision: "Allow only ajv and yaml at runtime.",
      projectDir: tempDir,
    });
    expect(result.markdown).toContain(
      "External deps increase maintenance burden.",
    );
    expect(result.markdown).toContain("Allow only ajv and yaml at runtime.");
    // Rationale / Consequences / Alternatives absent → placeholder retained
    expect(result.markdown).toMatch(/## Rationale\s*\n\s*\[/);
    expect(result.markdown).toMatch(/## Consequences\s*\n\s*\[/);
  });

  it("defaults status to Proposed and uses today's date when not given", () => {
    const today = new Date().toISOString().slice(0, 10);
    const result = generateMdrDraft({
      title: "Z",
      projectDir: tempDir,
    });
    expect(result.markdown).toContain(`**Date:** ${today}`);
    expect(result.markdown).toContain("**Status:** Proposed");
  });

  it("accepts explicit status / version / author overrides", () => {
    const result = generateMdrDraft({
      title: "Z",
      status: "Active",
      version: "1.13.1",
      author: "Dr. QUAN",
      projectDir: tempDir,
    });
    expect(result.markdown).toContain("**Status:** Active");
    expect(result.markdown).toContain("**Version:** 1.13.1");
    expect(result.markdown).toContain("**Author:** Dr. QUAN");
  });

  it("throws when title is empty", () => {
    expect(() =>
      generateMdrDraft({ title: "   ", projectDir: tempDir }),
    ).toThrow(/title/);
  });
});
