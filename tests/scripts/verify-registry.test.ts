import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

let tempDir: string;

const scriptPath = resolve(
  __dirname,
  "..",
  "..",
  "scripts",
  "verify-registry.js",
);

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "ms-verifyreg-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

function runScript(args: string[] = []): string {
  return execFileSync("node", [scriptPath, ...args], {
    cwd: tempDir,
    encoding: "utf-8",
    stdio: "pipe",
  });
}

function writeFixture(rel: string, body: string) {
  const full = join(tempDir, rel);
  mkdirSync(resolve(full, ".."), { recursive: true });
  writeFileSync(full, body);
}

/**
 * Minimal but realistic fixture:
 *   - 2 src modules (index + core/parser)
 *   - 1 adapter (platforms.ts with 2 convertTo functions)
 *   - 1 test file with 3 tests
 *   - 2 skills (ms-init, ms-eval)
 *   - .mission/ REBUILD_PLAYBOOK + TRACE_MATRIX with claims
 *
 * Ground truth from this fixture:
 *   moduleCount=3 (parser, platforms, index), apiCount=1 (re-export),
 *   skillCount=2, platformCount=2, testFileCount=1, testCount=3
 */
function writeStandardFixture() {
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
  writeFixture("src/index.ts", 'export { parse } from "./core/parser.js";\n');
  writeFixture(
    "tests/foo.test.ts",
    [
      'import { describe, it } from "vitest";',
      'describe("foo", () => {',
      '  it("a", () => {});',
      '  it("b", () => {});',
      '  it("c", () => {});',
      "});",
      "",
    ].join("\n"),
  );
  writeFixture("skills/ms-init/SKILL.md", "name: ms-init\n");
  writeFixture("skills/ms-eval/SKILL.md", "name: ms-eval\n");
}

function writePlaybook(text: string) {
  writeFixture(".mission/reconstruction/REBUILD_PLAYBOOK.md", text);
}

function writeTrace(text: string) {
  writeFixture(".mission/traceability/TRACE_MATRIX.yaml", text);
}

describe("verify-registry script", () => {
  it("--list prints ground truth as JSON", () => {
    writeStandardFixture();
    const stdout = runScript(["--list"]);
    const truth = JSON.parse(stdout);
    expect(truth.moduleCount).toBe(3);
    expect(truth.skillCount).toBe(2);
    expect(truth.platformCount).toBe(2);
    expect(truth.testFileCount).toBe(1);
    expect(truth.testCount).toBe(3);
  });

  it("passes when REBUILD_PLAYBOOK and TRACE_MATRIX counts match ground truth", () => {
    writeStandardFixture();
    writePlaybook(
      [
        "# Playbook",
        "",
        "3개 모듈 registry, public API 1개 함수, skill 2개.",
        "2개 플랫폼 (Cursor, Codex).",
        "npm test — 현재 기준 3 tests 전수 통과 (1 test files).",
        "",
      ].join("\n"),
    );
    writeTrace(
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

    const stdout = runScript();
    expect(stdout).toContain("Registry freshness check passed");
  });

  it("detects drift when REBUILD_PLAYBOOK claims wrong module count", () => {
    writeStandardFixture();
    writePlaybook("# Playbook\n\n11개 모듈 registry.\n");
    writeTrace("test_coverage: []\n");

    expect(() => runScript()).toThrow(/modules.*claims 11.*actual 3/s);
  });

  it("detects drift when REBUILD_PLAYBOOK claims wrong test count", () => {
    writeStandardFixture();
    writePlaybook(
      "# Playbook\n\n현재 기준 999 tests 전수 통과 (1 test files).\n",
    );
    writeTrace("test_coverage: []\n");

    expect(() => runScript()).toThrow(/tests.*claims 999.*actual 3/s);
  });

  it("detects drift when TRACE_MATRIX inline count is wrong", () => {
    writeStandardFixture();
    writePlaybook("# Playbook\n");
    writeTrace(
      [
        "requirements:",
        "  - criterion: command_test",
        "    tests:",
        "      - 'tests/ (총 99 tests across 42 files)'",
        "test_coverage: []",
        "",
      ].join("\n"),
    );

    expect(() => runScript()).toThrow(
      /TRACE_MATRIX inline.*test count.*claims 99.*actual 3/s,
    );
  });

  it("detects drift when test_coverage.cases sum diverges from real test count", () => {
    writeStandardFixture();
    writePlaybook("# Playbook\n");
    writeTrace(
      [
        "test_coverage:",
        "  - test_file: tests/foo.test.ts",
        "    cases: 99",
        "",
      ].join("\n"),
    );

    expect(() => runScript()).toThrow(/cases sum.*99.*actual 3/s);
  });

  it("graceful when both REBUILD_PLAYBOOK and TRACE_MATRIX are missing", () => {
    writeStandardFixture();
    // No .mission/reconstruction or .mission/traceability files
    const stdout = runScript();
    expect(stdout).toContain("Registry freshness check passed");
  });

  it("errors when TRACE_MATRIX.yaml is malformed YAML", () => {
    writeStandardFixture();
    writePlaybook("# Playbook\n");
    writeTrace(":\n  this is: {[not valid yaml\n");

    expect(() => runScript()).toThrow(/TRACE_MATRIX.*parse error/s);
  });

  it("ignores patterns it does not recognize (does not falsely flag prose numbers)", () => {
    writeStandardFixture();
    writePlaybook(
      [
        "# Playbook",
        "",
        "Node.js 20+ required. The CI matrix is Node 20 and 22.",
        "Version 1.15.0 is the current release.",
        "",
      ].join("\n"),
    );
    writeTrace("test_coverage: []\n");

    // No matchable module/api/skill/platform/test patterns → should pass
    const stdout = runScript();
    expect(stdout).toContain("Registry freshness check passed");
  });
});
