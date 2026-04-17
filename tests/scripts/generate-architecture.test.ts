import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  cpSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

let tempDir: string;

const projectRoot = resolve(__dirname, "..", "..");
const scriptPath = join(projectRoot, "scripts", "generate-architecture.js");
const distDir = join(projectRoot, "dist");

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "ms-archgen-"));
  // We run the real script (to keep its yaml/node_modules resolution working)
  // but point process.cwd() at tempDir. The script reads ./src and writes to
  // ./.mission/architecture inside cwd, so this isolates the fixture.
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

function writeTs(rel: string, body: string) {
  const full = join(tempDir, rel);
  mkdirSync(join(full, "..").replace(/\/[^/]+$/, ""), { recursive: true });
  writeFileSync(full, body);
}

function runScript(args: string[] = []) {
  return execFileSync("node", [scriptPath, ...args], {
    cwd: tempDir,
    encoding: "utf-8",
    stdio: "pipe",
  });
}

describe("generate-architecture script", () => {
  it("default mode writes ARCHITECTURE_COMPUTED.yaml with sorted module list", () => {
    mkdirSync(join(tempDir, "src/core"), { recursive: true });
    mkdirSync(join(tempDir, "src/commands"), { recursive: true });
    writeTs("src/core/parser.ts", "export function parse() {}\n");
    writeTs(
      "src/commands/eval.ts",
      `import { parse } from "../core/parser.js";\nexport function runEval() { return parse(); }\n`,
    );

    const stdout = runScript();
    expect(stdout).toContain("Wrote");
    expect(stdout).toContain("2 modules");

    const computedPath = join(
      tempDir,
      ".mission",
      "architecture",
      "ARCHITECTURE_COMPUTED.yaml",
    );
    expect(existsSync(computedPath)).toBe(true);
    const content = readFileSync(computedPath, "utf-8");
    expect(content).toContain("id: eval");
    expect(content).toContain("id: parser");
    expect(content).toMatch(/DO NOT EDIT BY HAND/);
  });

  it("--check passes when computed is in sync", () => {
    mkdirSync(join(tempDir, "src/core"), { recursive: true });
    writeTs("src/core/parser.ts", "export function parse() {}\n");

    runScript();
    const stdout = runScript(["--check"]);
    expect(stdout).toContain("in sync");
  });

  it("--check fails when src/ changed without regeneration", () => {
    mkdirSync(join(tempDir, "src/core"), { recursive: true });
    writeTs("src/core/parser.ts", "export function parse() {}\n");
    runScript();

    writeTs("src/core/evaluator.ts", "export function evaluate() {}\n");

    expect(() => runScript(["--check"])).toThrow();
  });

  it("--verify-current fails when ARCHITECTURE_CURRENT.yaml is missing a module", () => {
    mkdirSync(join(tempDir, "src/core"), { recursive: true });
    writeTs("src/core/parser.ts", "export function parse() {}\n");
    writeTs("src/core/evaluator.ts", "export function evaluate() {}\n");

    mkdirSync(join(tempDir, ".mission", "architecture"), { recursive: true });
    writeFileSync(
      join(tempDir, ".mission", "architecture", "ARCHITECTURE_CURRENT.yaml"),
      "modules:\n  - id: parser\n    path: src/core/parser.ts\n    depends_on: []\n",
    );

    expect(() => runScript(["--verify-current"])).toThrow();
  });

  it("--verify-current passes when module list + depends_on match", () => {
    mkdirSync(join(tempDir, "src/core"), { recursive: true });
    writeTs("src/core/parser.ts", "export function parse() {}\n");
    writeTs(
      "src/core/reader.ts",
      `import { parse } from "./parser.js";\nexport function read() { return parse(); }\n`,
    );

    mkdirSync(join(tempDir, ".mission", "architecture"), { recursive: true });
    writeFileSync(
      join(tempDir, ".mission", "architecture", "ARCHITECTURE_CURRENT.yaml"),
      [
        "modules:",
        "  - id: parser",
        "    path: src/core/parser.ts",
        "    depends_on: []",
        "  - id: reader",
        "    path: src/core/reader.ts",
        "    depends_on: [parser]",
        "",
      ].join("\n"),
    );

    const stdout = runScript(["--verify-current"]);
    expect(stdout).toContain("in sync");
  });

  it("--verify-current fails when path diverges", () => {
    mkdirSync(join(tempDir, "src/core"), { recursive: true });
    writeTs("src/core/parser.ts", "export function parse() {}\n");

    mkdirSync(join(tempDir, ".mission", "architecture"), { recursive: true });
    writeFileSync(
      join(tempDir, ".mission", "architecture", "ARCHITECTURE_CURRENT.yaml"),
      "modules:\n  - id: parser\n    path: src/schema/parser.ts\n    depends_on: []\n",
    );

    expect(() => runScript(["--verify-current"])).toThrow();
  });
});
