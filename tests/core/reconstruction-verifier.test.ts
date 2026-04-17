import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { verifyReconstructionReferences } from "../../src/core/reconstruction-verifier.js";

let tempDir: string;

function writeFile(rel: string, content: string) {
  const full = join(tempDir, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

function writePlaybook(content: string) {
  writeFile(".mission/reconstruction/REBUILD_PLAYBOOK.md", content);
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "ms-recon-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("verifyReconstructionReferences", () => {
  it("passes when every backtick-quoted path in the playbook exists", () => {
    writeFile("src/schema/validator.ts", "");
    writeFile(".mission/decisions/MDR-001-x.md", "");
    writeFile("mission.yaml", "mission:\n  title: x\n");
    writePlaybook(
      [
        "# Playbook",
        "Refer to `src/schema/validator.ts` and `.mission/decisions/MDR-001-x.md`.",
        "Also read `mission.yaml`.",
      ].join("\n"),
    );

    const result = verifyReconstructionReferences(tempDir);
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.checkedPaths.length).toBeGreaterThan(0);
  });

  it("fails and lists every missing path referenced by the playbook", () => {
    writeFile("src/schema/validator.ts", "");
    writePlaybook(
      [
        "# Playbook",
        "Read `src/schema/validator.ts` (exists).",
        "Also `src/ghost.ts` and `.mission/phantom/X.md` (do not exist).",
      ].join("\n"),
    );

    const result = verifyReconstructionReferences(tempDir);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("src/ghost.ts");
    expect(result.missing).toContain(".mission/phantom/X.md");
    expect(result.missing).not.toContain("src/schema/validator.ts");
  });

  it("ignores non-path backticks (commands, code snippets)", () => {
    writeFile("src/x.ts", "");
    writePlaybook(
      [
        "# Playbook",
        "Run `npm install` then `npm test`.",
        "Edit `src/x.ts`.",
        "Use `parseMissionFile()` or `type X = string`.",
      ].join("\n"),
    );

    const result = verifyReconstructionReferences(tempDir);
    expect(result.valid).toBe(true);
    // `src/x.ts` is the only repo path, others are commands / identifiers
    expect(result.checkedPaths).toContain("src/x.ts");
    expect(result.checkedPaths).not.toContain("npm install");
  });

  it("treats ```fenced code blocks``` contents as exempt from path checking", () => {
    writeFile("src/x.ts", "");
    writePlaybook(
      [
        "# Playbook",
        "Edit `src/x.ts`.",
        "```",
        "src/phantom-in-fence.ts",
        "```",
      ].join("\n"),
    );

    const result = verifyReconstructionReferences(tempDir);
    expect(result.valid).toBe(true);
  });

  it("fails when the playbook itself is missing", () => {
    expect(() => verifyReconstructionReferences(tempDir)).toThrow(
      /REBUILD_PLAYBOOK\.md/,
    );
  });

  it("accepts a custom playbook path override", () => {
    writeFile("custom/BOOK.md", "Refer to `src/x.ts`.");
    writeFile("src/x.ts", "");
    const result = verifyReconstructionReferences(tempDir, {
      playbookPath: "custom/BOOK.md",
    });
    expect(result.valid).toBe(true);
  });

  it("deduplicates multiple references to the same path", () => {
    writeFile("src/x.ts", "");
    writePlaybook(
      "Read `src/x.ts` first. Then revisit `src/x.ts`. Again `src/x.ts`.",
    );
    const result = verifyReconstructionReferences(tempDir);
    expect(result.checkedPaths.filter((p) => p === "src/x.ts").length).toBe(1);
  });
});
