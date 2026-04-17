import { describe, expect, test as base } from "vitest";
import {
  mkdtempSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const projectRoot = resolve(__dirname, "..", "..");
const scriptPath = join(projectRoot, "scripts", "generate-architecture.js");

interface Fixture {
  tempDir: string;
  runScript: (args?: string[]) => Promise<string>;
  writeTs: (rel: string, body: string) => void;
  writeApiRegistry: (
    functionNames: string[],
    packageExports?: Record<string, Record<string, string>>,
  ) => void;
  writePackageJson: (
    exportsMap: Record<string, Record<string, string>>,
  ) => void;
}

const it = base.extend<{ fx: Fixture }>({
  fx: async ({}, use) => {
    const tempDir = mkdtempSync(join(tmpdir(), "ms-archgen-"));
    const writeTs = (rel: string, body: string) => {
      const full = join(tempDir, rel);
      mkdirSync(join(full, "..").replace(/\/[^/]+$/, ""), { recursive: true });
      writeFileSync(full, body);
    };
    const fx: Fixture = {
      tempDir,
      runScript: async (args: string[] = []): Promise<string> => {
        const { stdout } = await execFileAsync("node", [scriptPath, ...args], {
          cwd: tempDir,
          encoding: "utf-8",
        });
        return stdout;
      },
      writeTs,
      writeApiRegistry: (
        functionNames: string[],
        packageExports: Record<string, Record<string, string>> = {},
      ) => {
        mkdirSync(join(tempDir, ".mission", "interfaces"), { recursive: true });
        const exportLines: string[] = [];
        const exportKeys = Object.keys(packageExports);
        if (exportKeys.length > 0) {
          exportLines.push("  package_exports:");
          for (const key of exportKeys) {
            exportLines.push(`    "${key}":`);
            for (const [k, v] of Object.entries(packageExports[key])) {
              exportLines.push(`      ${k}: "${v}"`);
            }
          }
        }
        writeFileSync(
          join(tempDir, ".mission", "interfaces", "API_REGISTRY.yaml"),
          [
            "public_api:",
            ...exportLines,
            "  functions:",
            ...functionNames.map((name) => `    - name: ${name}`),
            "",
          ].join("\n"),
        );
      },
      writePackageJson: (
        exportsMap: Record<string, Record<string, string>>,
      ) => {
        writeFileSync(
          join(tempDir, "package.json"),
          JSON.stringify(
            { name: "fixture", version: "0.0.0", exports: exportsMap },
            null,
            2,
          ),
        );
      },
    };
    await use(fx);
    rmSync(tempDir, { recursive: true, force: true });
  },
});

describe.concurrent("generate-architecture script", () => {
  it("default mode writes ARCHITECTURE_COMPUTED.yaml with sorted module list", async ({ fx }) => {
    mkdirSync(join(fx.tempDir, "src/core"), { recursive: true });
    mkdirSync(join(fx.tempDir, "src/commands"), { recursive: true });
    fx.writeTs("src/core/parser.ts", "export function parse() {}\n");
    fx.writeTs(
      "src/commands/eval.ts",
      `import { parse } from "../core/parser.js";\nexport function runEval() { return parse(); }\n`,
    );

    const stdout = await fx.runScript();
    expect(stdout).toContain("Wrote");
    expect(stdout).toContain("2 modules");

    const computedPath = join(
      fx.tempDir,
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

  it("--check passes when computed is in sync", async ({ fx }) => {
    mkdirSync(join(fx.tempDir, "src/core"), { recursive: true });
    fx.writeTs("src/core/parser.ts", "export function parse() {}\n");

    await fx.runScript();
    const stdout = await fx.runScript(["--check"]);
    expect(stdout).toContain("in sync");
  });

  it("--check fails when src/ changed without regeneration", async ({ fx }) => {
    mkdirSync(join(fx.tempDir, "src/core"), { recursive: true });
    fx.writeTs("src/core/parser.ts", "export function parse() {}\n");
    await fx.runScript();

    fx.writeTs("src/core/evaluator.ts", "export function evaluate() {}\n");

    await expect(fx.runScript(["--check"])).rejects.toThrow();
  });

  it("--verify-current fails when ARCHITECTURE_CURRENT.yaml is missing a module", async ({ fx }) => {
    mkdirSync(join(fx.tempDir, "src/core"), { recursive: true });
    fx.writeTs("src/core/parser.ts", "export function parse() {}\n");
    fx.writeTs("src/core/evaluator.ts", "export function evaluate() {}\n");

    mkdirSync(join(fx.tempDir, ".mission", "architecture"), { recursive: true });
    writeFileSync(
      join(fx.tempDir, ".mission", "architecture", "ARCHITECTURE_CURRENT.yaml"),
      "modules:\n  - id: parser\n    path: src/core/parser.ts\n    depends_on: []\n",
    );

    await expect(fx.runScript(["--verify-current"])).rejects.toThrow();
  });

  it("--verify-current passes when module list + depends_on match", async ({ fx }) => {
    mkdirSync(join(fx.tempDir, "src/core"), { recursive: true });
    fx.writeTs("src/core/parser.ts", "export function parse() {}\n");
    fx.writeTs(
      "src/core/reader.ts",
      `import { parse } from "./parser.js";\nexport function read() { return parse(); }\n`,
    );

    mkdirSync(join(fx.tempDir, ".mission", "architecture"), { recursive: true });
    writeFileSync(
      join(fx.tempDir, ".mission", "architecture", "ARCHITECTURE_CURRENT.yaml"),
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
    const stdout = await fx.runScript(["--verify-current"]);
    expect(stdout).toContain("in sync");
  });

  it("--verify-current fails when path diverges", async ({ fx }) => {
    mkdirSync(join(fx.tempDir, "src/core"), { recursive: true });
    fx.writeTs("src/core/parser.ts", "export function parse() {}\n");

    mkdirSync(join(fx.tempDir, ".mission", "architecture"), { recursive: true });
    writeFileSync(
      join(fx.tempDir, ".mission", "architecture", "ARCHITECTURE_CURRENT.yaml"),
      "modules:\n  - id: parser\n    path: src/schema/parser.ts\n    depends_on: []\n",
    );

    await expect(fx.runScript(["--verify-current"])).rejects.toThrow();
  });

  it("--verify-current fails when ARCHITECTURE_CURRENT.yaml has extra depends_on entries", async ({ fx }) => {
    mkdirSync(join(fx.tempDir, "src/core"), { recursive: true });
    fx.writeTs("src/core/parser.ts", "export function parse() {}\n");
    fx.writeTs(
      "src/core/reader.ts",
      `import { parse } from "./parser.js";\nexport function read() { return parse(); }\n`,
    );

    mkdirSync(join(fx.tempDir, ".mission", "architecture"), { recursive: true });
    writeFileSync(
      join(fx.tempDir, ".mission", "architecture", "ARCHITECTURE_CURRENT.yaml"),
      [
        "modules:",
        "  - id: parser",
        "    path: src/core/parser.ts",
        "    depends_on: []",
        "  - id: reader",
        "    path: src/core/reader.ts",
        "    depends_on: [parser, ghost]",
        "",
      ].join("\n"),
    );
    await expect(fx.runScript(["--verify-current"])).rejects.toThrow();
  });

  it("--verify-current fails when API_REGISTRY.yaml public_api drifts from src/index.ts", async ({ fx }) => {
    mkdirSync(join(fx.tempDir, "src/core"), { recursive: true });
    fx.writeTs("src/core/parser.ts", "export function parse() {}\n");
    fx.writeTs("src/index.ts", `export { parse } from "./core/parser.js";\n`);

    mkdirSync(join(fx.tempDir, ".mission", "architecture"), { recursive: true });
    writeFileSync(
      join(fx.tempDir, ".mission", "architecture", "ARCHITECTURE_CURRENT.yaml"),
      [
        "modules:",
        "  - id: index",
        "    path: src/index.ts",
        "    depends_on: [parser]",
        "  - id: parser",
        "    path: src/core/parser.ts",
        "    depends_on: []",
        "",
      ].join("\n"),
    );
    fx.writeApiRegistry(["ghost"]);

    await expect(fx.runScript(["--verify-current"])).rejects.toThrow();
  });

  it("--verify-current fails when API_REGISTRY.yaml package_exports is missing a subpath present in package.json", async ({ fx }) => {
    mkdirSync(join(fx.tempDir, "src/core"), { recursive: true });
    fx.writeTs("src/core/parser.ts", "export function parse() {}\n");
    fx.writeTs("src/index.ts", `export { parse } from "./core/parser.js";\n`);

    fx.writePackageJson({
      ".": { import: "./dist/index.js" },
      "./commands/decide": { import: "./dist/commands/decide.js" },
    });

    mkdirSync(join(fx.tempDir, ".mission", "architecture"), { recursive: true });
    writeFileSync(
      join(fx.tempDir, ".mission", "architecture", "ARCHITECTURE_CURRENT.yaml"),
      [
        "modules:",
        "  - id: index",
        "    path: src/index.ts",
        "    depends_on: [parser]",
        "  - id: parser",
        "    path: src/core/parser.ts",
        "    depends_on: []",
        "",
      ].join("\n"),
    );
    // API_REGISTRY only lists "." — missing ./commands/decide
    fx.writeApiRegistry(["parse"], { ".": { import: "./dist/index.js" } });

    await expect(fx.runScript(["--verify-current"])).rejects.toThrow(
      /package_exports missing keys.*\.\/commands\/decide/,
    );
  });

  it("--verify-current fails when API_REGISTRY.yaml package_exports has a subpath not in package.json", async ({ fx }) => {
    mkdirSync(join(fx.tempDir, "src/core"), { recursive: true });
    fx.writeTs("src/core/parser.ts", "export function parse() {}\n");
    fx.writeTs("src/index.ts", `export { parse } from "./core/parser.js";\n`);

    fx.writePackageJson({ ".": { import: "./dist/index.js" } });

    mkdirSync(join(fx.tempDir, ".mission", "architecture"), { recursive: true });
    writeFileSync(
      join(fx.tempDir, ".mission", "architecture", "ARCHITECTURE_CURRENT.yaml"),
      [
        "modules:",
        "  - id: index",
        "    path: src/index.ts",
        "    depends_on: [parser]",
        "  - id: parser",
        "    path: src/core/parser.ts",
        "    depends_on: []",
        "",
      ].join("\n"),
    );
    // API_REGISTRY lists an extra ./commands/ghost not in package.json
    fx.writeApiRegistry(["parse"], {
      ".": { import: "./dist/index.js" },
      "./commands/ghost": { import: "./dist/commands/ghost.js" },
    });

    await expect(fx.runScript(["--verify-current"])).rejects.toThrow(
      /package_exports has extra keys.*\.\/commands\/ghost/,
    );
  });

  it("--verify-current passes when package_exports match package.json exports map", async ({ fx }) => {
    mkdirSync(join(fx.tempDir, "src/core"), { recursive: true });
    fx.writeTs("src/core/parser.ts", "export function parse() {}\n");
    fx.writeTs("src/index.ts", `export { parse } from "./core/parser.js";\n`);

    fx.writePackageJson({
      ".": { import: "./dist/index.js" },
      "./commands/decide": { import: "./dist/commands/decide.js" },
    });

    mkdirSync(join(fx.tempDir, ".mission", "architecture"), { recursive: true });
    writeFileSync(
      join(fx.tempDir, ".mission", "architecture", "ARCHITECTURE_CURRENT.yaml"),
      [
        "modules:",
        "  - id: index",
        "    path: src/index.ts",
        "    depends_on: [parser]",
        "  - id: parser",
        "    path: src/core/parser.ts",
        "    depends_on: []",
        "",
      ].join("\n"),
    );
    fx.writeApiRegistry(["parse"], {
      ".": { import: "./dist/index.js" },
      "./commands/decide": { import: "./dist/commands/decide.js" },
    });

    const stdout = await fx.runScript(["--verify-current"]);
    expect(stdout).toContain("in sync");
  });

  it("--verify-current fails when package_exports types path diverges (E-5)", async ({ fx }) => {
    mkdirSync(join(fx.tempDir, "src/core"), { recursive: true });
    fx.writeTs("src/core/parser.ts", "export function parse() {}\n");
    fx.writeTs("src/index.ts", `export { parse } from "./core/parser.js";\n`);

    fx.writePackageJson({
      "./commands/decide": {
        types: "./dist/commands/decide.d.ts",
        import: "./dist/commands/decide.js",
      },
    });

    mkdirSync(join(fx.tempDir, ".mission", "architecture"), { recursive: true });
    writeFileSync(
      join(fx.tempDir, ".mission", "architecture", "ARCHITECTURE_CURRENT.yaml"),
      [
        "modules:",
        "  - id: index",
        "    path: src/index.ts",
        "    depends_on: [parser]",
        "  - id: parser",
        "    path: src/core/parser.ts",
        "    depends_on: []",
        "",
      ].join("\n"),
    );
    fx.writeApiRegistry(["parse"], {
      "./commands/decide": {
        types: "./dist/commands/WRONG.d.ts",
        import: "./dist/commands/decide.js",
      },
    });

    await expect(fx.runScript(["--verify-current"])).rejects.toThrow(
      /package_exports\['\.\/commands\/decide'\]\.types/,
    );
  });

  it("--verify-current fails when package_exports import path diverges (E-5)", async ({ fx }) => {
    mkdirSync(join(fx.tempDir, "src/core"), { recursive: true });
    fx.writeTs("src/core/parser.ts", "export function parse() {}\n");
    fx.writeTs("src/index.ts", `export { parse } from "./core/parser.js";\n`);

    fx.writePackageJson({
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.js",
      },
    });

    mkdirSync(join(fx.tempDir, ".mission", "architecture"), { recursive: true });
    writeFileSync(
      join(fx.tempDir, ".mission", "architecture", "ARCHITECTURE_CURRENT.yaml"),
      [
        "modules:",
        "  - id: index",
        "    path: src/index.ts",
        "    depends_on: [parser]",
        "  - id: parser",
        "    path: src/core/parser.ts",
        "    depends_on: []",
        "",
      ].join("\n"),
    );
    fx.writeApiRegistry(["parse"], {
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/wrong.js",
      },
    });

    await expect(fx.runScript(["--verify-current"])).rejects.toThrow(
      /package_exports\['\.'\]\.import/,
    );
  });

  it("--verify-current fails when package_exports registry has extra subkey (E-5)", async ({ fx }) => {
    mkdirSync(join(fx.tempDir, "src/core"), { recursive: true });
    fx.writeTs("src/core/parser.ts", "export function parse() {}\n");
    fx.writeTs("src/index.ts", `export { parse } from "./core/parser.js";\n`);

    fx.writePackageJson({ ".": { import: "./dist/index.js" } });

    mkdirSync(join(fx.tempDir, ".mission", "architecture"), { recursive: true });
    writeFileSync(
      join(fx.tempDir, ".mission", "architecture", "ARCHITECTURE_CURRENT.yaml"),
      [
        "modules:",
        "  - id: index",
        "    path: src/index.ts",
        "    depends_on: [parser]",
        "  - id: parser",
        "    path: src/core/parser.ts",
        "    depends_on: []",
        "",
      ].join("\n"),
    );
    // Registry has a ghost `types` subkey that package.json does not declare
    fx.writeApiRegistry(["parse"], {
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.js",
      },
    });

    await expect(fx.runScript(["--verify-current"])).rejects.toThrow(
      /package_exports\['\.'\].*extra subkeys.*types/,
    );
  });
});
