import { describe, expect, test as base } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const scriptPath = resolve(
  __dirname,
  "..",
  "..",
  "scripts",
  "verify-registry.js",
);

// E-7 (PROJECT_REVIEW_SNAPSHOT_V1.16.0 §5.4): this file's 14 tests each spawn
// a Node subprocess with a full TypeScript compiler init (~1s overhead per
// test). Before v1.16.6 they ran serial and dominated the suite at ~18s.
// `test.extend` gives each test its own tempDir and writer helpers, so
// `describe.concurrent` below can parallelize subprocesses safely without the
// shared-module-state race that `let tempDir` caused on the first attempt.
interface Fixture {
  tempDir: string;
  runScript: (args?: string[]) => Promise<string>;
  writeFixture: (rel: string, body: string) => void;
  writeStandardFixture: () => void;
  writePlaybook: (text: string) => void;
  writeTrace: (text: string) => void;
  writeMission: (title: string, doneWhen: string[]) => void;
  writeCurrentState: (text: string) => void;
}

const it = base.extend<{ fx: Fixture }>({
  fx: async ({}, use) => {
    const tempDir = mkdtempSync(join(tmpdir(), "ms-verifyreg-"));
    const writeFixture = (rel: string, body: string) => {
      const full = join(tempDir, rel);
      mkdirSync(resolve(full, ".."), { recursive: true });
      writeFileSync(full, body);
    };
    const fx: Fixture = {
      tempDir,
      // Async so multiple subprocesses can run in parallel when tests are
      // scheduled concurrently by describe.concurrent. A synchronous
      // execFileSync would block the whole test thread and serialize.
      runScript: async (args: string[] = []): Promise<string> => {
        const { stdout } = await execFileAsync("node", [scriptPath, ...args], {
          cwd: tempDir,
          encoding: "utf-8",
        });
        return stdout;
      },
      writeFixture,
      writeStandardFixture: () => {
        writeFixture("package.json", '{"name":"fx","version":"0.0.0"}\n');
        writeFixture("src/core/parser.ts", "export function parse() {}\n");
        writeFixture(
          "src/adapters/platforms.ts",
          [
            "export function convertToCursor() {}",
            "export function convertToCodex() {}",
            "",
          ].join("\n"),
        );
        writeFixture(
          "src/index.ts",
          'export { parse } from "./core/parser.js";\n',
        );
        writeFixture(
          "tests/foo.test.ts",
          [
            'import { describe, it } from "vitest";',
            'describe("foo", () => {',
            '  it("a", async () => {});',
            '  it("b", async () => {});',
            '  it("c", async () => {});',
            "});",
            "",
          ].join("\n"),
        );
        writeFixture("skills/ms-init/SKILL.md", "name: ms-init\n");
        writeFixture("skills/ms-eval/SKILL.md", "name: ms-eval\n");
      },
      writePlaybook: (text: string) =>
        writeFixture(".mission/reconstruction/REBUILD_PLAYBOOK.md", text),
      writeTrace: (text: string) =>
        writeFixture(".mission/traceability/TRACE_MATRIX.yaml", text),
      writeMission: (title: string, doneWhen: string[]) =>
        writeFixture(
          "mission.yaml",
          [
            "mission:",
            `  title: "${title}"`,
            `  version: "0.0.0"`,
            "  goal: x",
            "  constraints: []",
            "  done_when:",
            ...doneWhen.map((c) => `    - "${c}"`),
            "",
          ].join("\n"),
        ),
      writeCurrentState: (text: string) =>
        writeFixture(".mission/CURRENT_STATE.md", text),
    };
    await use(fx);
    rmSync(tempDir, { recursive: true, force: true });
  },
});

describe.concurrent("verify-registry script", () => {
  it("--list prints ground truth as JSON", async ({ fx }) => {
    fx.writeStandardFixture();
    const stdout = await fx.runScript(["--list"]);
    const truth = JSON.parse(stdout);
    expect(truth.moduleCount).toBe(3);
    expect(truth.skillCount).toBe(2);
    expect(truth.platformCount).toBe(2);
    expect(truth.testFileCount).toBe(1);
    expect(truth.testCount).toBe(3);
  });

  it("passes when REBUILD_PLAYBOOK and TRACE_MATRIX counts match ground truth", async ({
    fx,
  }: {
    fx: Fixture;
  }) => {
    fx.writeStandardFixture();
    fx.writePlaybook(
      [
        "# Playbook",
        "",
        "3개 모듈 registry, public API 1개 함수, skill 2개.",
        "2개 플랫폼 (Cursor, Codex).",
        "npm test — 현재 기준 3 tests 전수 통과 (1 test files).",
        "",
      ].join("\n"),
    );
    fx.writeTrace(
      [
        "# Trace",
        "requirements:",
        "  - criterion: command_test",
        "    tests:",
        "      - 'tests/ (총 3 tests across 1 files)'",
        "",
        "test_coverage:",
        "  - test_file: tests/foo.test.ts",
        "    cases: 3",
        "",
      ].join("\n"),
    );

    const stdout = await fx.runScript();
    expect(stdout).toContain("Registry freshness check passed");
  });

  it("detects drift when REBUILD_PLAYBOOK claims wrong module count", async ({
    fx,
  }: {
    fx: Fixture;
  }) => {
    fx.writeStandardFixture();
    fx.writePlaybook("# Playbook\n\n11개 모듈 registry.\n");
    fx.writeTrace("test_coverage: []\n");

    await expect(fx.runScript()).rejects.toThrow(
      /modules.*claims 11.*actual 3/s,
    );
  });

  it("detects drift when REBUILD_PLAYBOOK claims wrong test count", async ({
    fx,
  }: {
    fx: Fixture;
  }) => {
    fx.writeStandardFixture();
    fx.writePlaybook(
      "# Playbook\n\n현재 기준 999 tests 전수 통과 (1 test files).\n",
    );
    fx.writeTrace("test_coverage: []\n");

    await expect(fx.runScript()).rejects.toThrow(
      /tests.*claims 999.*actual 3/s,
    );
  });

  it("detects drift when TRACE_MATRIX inline count is wrong", async ({ fx }) => {
    fx.writeStandardFixture();
    fx.writePlaybook("# Playbook\n");
    fx.writeTrace(
      [
        "requirements:",
        "  - criterion: command_test",
        "    tests:",
        "      - 'tests/ (총 99 tests across 42 files)'",
        "test_coverage: []",
        "",
      ].join("\n"),
    );

    await expect(fx.runScript()).rejects.toThrow(
      /TRACE_MATRIX inline.*test count.*claims 99.*actual 3/s,
    );
  });

  it("detects drift when test_coverage.cases sum diverges from real test count", async ({
    fx,
  }: {
    fx: Fixture;
  }) => {
    fx.writeStandardFixture();
    fx.writePlaybook("# Playbook\n");
    fx.writeTrace(
      [
        "test_coverage:",
        "  - test_file: tests/foo.test.ts",
        "    cases: 99",
        "",
      ].join("\n"),
    );

    await expect(fx.runScript()).rejects.toThrow(/cases sum.*99.*actual 3/s);
  });

  it("graceful when both REBUILD_PLAYBOOK and TRACE_MATRIX are missing", async ({
    fx,
  }: {
    fx: Fixture;
  }) => {
    fx.writeStandardFixture();
    const stdout = await fx.runScript();
    expect(stdout).toContain("Registry freshness check passed");
  });

  it("errors when TRACE_MATRIX.yaml is malformed YAML", async ({ fx }) => {
    fx.writeStandardFixture();
    fx.writePlaybook("# Playbook\n");
    fx.writeTrace(":\n  this is: {[not valid yaml\n");

    await expect(fx.runScript()).rejects.toThrow(/TRACE_MATRIX.*parse error/s);
  });

  it("ignores patterns it does not recognize (does not falsely flag prose numbers)", async ({
    fx,
  }: {
    fx: Fixture;
  }) => {
    fx.writeStandardFixture();
    fx.writePlaybook(
      [
        "# Playbook",
        "",
        "Node.js 20+ required. The CI matrix is Node 20 and 22.",
        "Version 1.15.0 is the current release.",
        "",
      ].join("\n"),
    );
    fx.writeTrace("test_coverage: []\n");

    const stdout = await fx.runScript();
    expect(stdout).toContain("Registry freshness check passed");
  });

  // E-8 (PROJECT_REVIEW_SNAPSHOT_V1.16.0 §6) — extend file coverage beyond
  // REBUILD_PLAYBOOK + TRACE_MATRIX to include CURRENT_STATE.md's two fields
  // that can drift: the Title line (mirrors mission.yaml.title) and the
  // completion-condition count (mirrors mission.yaml.done_when.length).

  it("passes when CURRENT_STATE.md Title and completion count match mission.yaml (E-8)", async ({
    fx,
  }: {
    fx: Fixture;
  }) => {
    fx.writeStandardFixture();
    fx.writeMission("My Project v0.0.0 — Initial", [
      "foo_exists",
      "bar_passes",
      "baz_valid",
    ]);
    fx.writeCurrentState(
      [
        "# Current State",
        "",
        "> Last updated: 2026-04-17 | Version: 0.0.0",
        "",
        "## 현재 상태",
        "",
        "- **Title:** My Project v0.0.0 — Initial",
        "",
        "## 완료 조건 (3/3 PASS)",
        "",
      ].join("\n"),
    );

    const stdout = await fx.runScript();
    expect(stdout).toContain("Registry freshness check passed");
  });

  it("detects drift when CURRENT_STATE.md Title diverges from mission.yaml (E-8)", async ({
    fx,
  }: {
    fx: Fixture;
  }) => {
    fx.writeStandardFixture();
    fx.writeMission("My Project v1.0.0 — New", ["foo"]);
    fx.writeCurrentState(
      [
        "# Current State",
        "",
        "- **Title:** My Project v0.9.0 — Stale",
        "",
      ].join("\n"),
    );

    await expect(fx.runScript()).rejects.toThrow(
      /CURRENT_STATE\.md Title line/,
    );
  });

  it("detects drift when CURRENT_STATE.md completion-condition count diverges (E-8)", async ({
    fx,
  }: {
    fx: Fixture;
  }) => {
    fx.writeStandardFixture();
    fx.writeMission("X", ["a", "b", "c", "d", "e"]);
    fx.writeCurrentState(
      [
        "# Current State",
        "",
        "- **Title:** X",
        "",
        "## 완료 조건 (2/2 PASS)",
        "",
      ].join("\n"),
    );

    await expect(fx.runScript()).rejects.toThrow(
      /CURRENT_STATE\.md completion-condition count.*claims 2.*actual 5/s,
    );
  });

  it("detects absurdity when CURRENT_STATE.md claims PASS exceeds TOTAL (E-8)", async ({
    fx,
  }: {
    fx: Fixture;
  }) => {
    fx.writeStandardFixture();
    fx.writeMission("X", ["a", "b"]);
    fx.writeCurrentState(
      [
        "# Current State",
        "",
        "- **Title:** X",
        "",
        "## 완료 조건 (5/2 PASS)",
        "",
      ].join("\n"),
    );

    await expect(fx.runScript()).rejects.toThrow(
      /PASS \(5\) exceeds TOTAL \(2\)/,
    );
  });

  it("graceful when CURRENT_STATE.md is absent (E-8)", async ({ fx }) => {
    fx.writeStandardFixture();
    fx.writeMission("X", ["a"]);
    const stdout = await fx.runScript();
    expect(stdout).toContain("Registry freshness check passed");
  });
});
