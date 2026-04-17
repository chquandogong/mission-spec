import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { extractArchitecture } from "../../src/core/architecture-extractor.js";

let tempDir: string;

function writeTs(relPath: string, content: string) {
  const full = join(tempDir, relPath);
  mkdirSync(join(full, "..").replace(/\/[^/]+$/, ""), { recursive: true });
  writeFileSync(full, content);
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "ms-archx-"));
  mkdirSync(join(tempDir, "src"), { recursive: true });
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("architecture-extractor", () => {
  it("extracts modules from a single src/ file", () => {
    writeTs(
      "src/index.ts",
      `export function foo() { return 1; }\nexport type Bar = string;\n`,
    );

    const result = extractArchitecture(tempDir);
    expect(result.modules).toHaveLength(1);
    expect(result.modules[0].id).toBe("index");
    expect(result.modules[0].path).toBe("src/index.ts");
    expect(result.modules[0].exports).toContain("foo");
    expect(result.modules[0].exports).toContain("Bar");
  });

  it("derives layer from directory", () => {
    mkdirSync(join(tempDir, "src/schema"), { recursive: true });
    mkdirSync(join(tempDir, "src/core"), { recursive: true });
    mkdirSync(join(tempDir, "src/commands"), { recursive: true });
    mkdirSync(join(tempDir, "src/adapters"), { recursive: true });
    writeTs("src/schema/validator.ts", "export function validate() {}\n");
    writeTs("src/core/parser.ts", "export function parse() {}\n");
    writeTs("src/commands/init.ts", "export function init() {}\n");
    writeTs("src/adapters/x.ts", "export function convertX() {}\n");

    const result = extractArchitecture(tempDir);
    const byId = Object.fromEntries(result.modules.map((m) => [m.id, m]));
    expect(byId["validator"].layer).toBe("schema");
    expect(byId["parser"].layer).toBe("core");
    expect(byId["init"].layer).toBe("commands");
    expect(byId["x"].layer).toBe("adapters");
  });

  it("resolves relative imports to module IDs", () => {
    mkdirSync(join(tempDir, "src/core"), { recursive: true });
    mkdirSync(join(tempDir, "src/commands"), { recursive: true });
    writeTs("src/core/parser.ts", "export function parse() {}\n");
    writeTs(
      "src/commands/eval.ts",
      `import { parse } from "../core/parser.js";\nexport function runEval() { return parse(); }\n`,
    );

    const result = extractArchitecture(tempDir);
    const evalMod = result.modules.find((m) => m.id === "eval")!;
    expect(evalMod.depends_on).toContain("parser");
    expect(result.edges).toContainEqual({ from: "eval", to: "parser" });
  });

  it("ignores external imports (node:fs, yaml, ajv)", () => {
    writeTs(
      "src/index.ts",
      `import { readFileSync } from "node:fs";\nimport { parse } from "yaml";\nimport Ajv from "ajv";\nexport function x() {}\n`,
    );

    const result = extractArchitecture(tempDir);
    expect(result.modules[0].depends_on).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it("ignores .d.ts and .test.ts files", () => {
    writeTs("src/types.d.ts", "export type X = string;\n");
    writeTs("src/index.test.ts", "export function testX() {}\n");
    writeTs("src/index.ts", "export function real() {}\n");

    const result = extractArchitecture(tempDir);
    const ids = result.modules.map((m) => m.id);
    expect(ids).toContain("index");
    expect(ids).not.toContain("types");
  });

  it("detects named re-exports from other modules", () => {
    mkdirSync(join(tempDir, "src/core"), { recursive: true });
    writeTs(
      "src/core/parser.ts",
      "export function parse() {}\nexport type Parsed = { ok: boolean };\n",
    );
    writeTs(
      "src/index.ts",
      `export { parse } from "./core/parser.js";\nexport type { Parsed } from "./core/parser.js";\n`,
    );

    const result = extractArchitecture(tempDir);
    const index = result.modules.find((m) => m.id === "index")!;
    expect(index.exports).toContain("parse");
    expect(index.exports).toContain("Parsed");
    expect(index.depends_on).toContain("parser");
  });

  it("extracts public_api from src/index.ts", () => {
    mkdirSync(join(tempDir, "src/core"), { recursive: true });
    writeTs("src/core/parser.ts", "export function parse() {}\n");
    writeTs(
      "src/index.ts",
      `export { parse } from "./core/parser.js";\nexport type { Parsed } from "./core/parser.js";\n`,
    );

    const result = extractArchitecture(tempDir);
    expect(result.public_api.functions).toContain("parse");
    expect(result.public_api.types).toContain("Parsed");
  });

  it("sorts modules and edges deterministically", () => {
    mkdirSync(join(tempDir, "src/core"), { recursive: true });
    mkdirSync(join(tempDir, "src/commands"), { recursive: true });
    writeTs("src/core/b.ts", "export function b() {}\n");
    writeTs("src/core/a.ts", "export function a() {}\n");
    writeTs(
      "src/commands/z.ts",
      `import { a } from "../core/a.js";\nimport { b } from "../core/b.js";\nexport function z() { a(); b(); }\n`,
    );

    const result1 = extractArchitecture(tempDir);
    const result2 = extractArchitecture(tempDir);
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));

    const ids = result1.modules.map((m) => m.id);
    expect(ids).toEqual([...ids].sort());
  });
});
