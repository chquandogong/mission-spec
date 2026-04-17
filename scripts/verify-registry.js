#!/usr/bin/env node
// verify-registry — validate numeric claims embedded in .mission/ descriptive
// artefacts (REBUILD_PLAYBOOK.md, TRACE_MATRIX.yaml) against live source truth.
// Closes D-1 from PROJECT_REVIEW_V1.14.1_2026-04-17.
//
// Complements bump-metadata.js (D-3, which syncs Version headers):
//   - bump-metadata    → "Version: X.Y.Z" tokens in headers
//   - verify-registry  → embedded counts in prose/YAML body ("18개 모듈",
//                        "214 tests across 20 files", test_coverage.cases)
//
// Usage:
//   node scripts/verify-registry.js          # exit 1 on drift
//   node scripts/verify-registry.js --list   # print ground truth as JSON
//
// Ground truth sources:
//   moduleCount     extractArchitecture(projectDir).modules.length
//   apiCount        extractArchitecture(projectDir).public_api.functions.length
//   skillCount      skills/ms-* directories
//   platformCount   `export function convertTo*` in src/adapters/platforms.ts
//   testFileCount   tests/**/*.test.{ts,tsx}
//   testCount       sum of `it(` and `test(` calls in those files (regex)

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import ts from "typescript";
import { extractArchitecture } from "../dist/core/architecture-extractor.js";

const projectDir = process.cwd();
const args = process.argv.slice(2);

function walkFiles(dir, filter) {
  const out = [];
  function step(d) {
    if (!existsSync(d)) return;
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      const st = statSync(full);
      if (st.isDirectory()) step(full);
      else if (filter(entry)) out.push(full);
    }
  }
  step(dir);
  return out;
}

function countTestFiles(dir) {
  return walkFiles(dir, (name) => /\.test\.tsx?$/.test(name)).length;
}

// AST-based test counting — regex matched `it` in comments and string literals,
// producing an overcount (observed 226 vs vitest's 223 on real project). Using
// the TypeScript parser eliminates that false-positive class.
function countItCallsInFile(filePath) {
  const source = readFileSync(filePath, "utf-8");
  const sf = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  let count = 0;
  function visit(node) {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      if (
        ts.isIdentifier(expr) &&
        (expr.text === "it" || expr.text === "test")
      ) {
        count++;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return count;
}

function countItCalls(dir) {
  const files = walkFiles(dir, (name) => /\.test\.tsx?$/.test(name));
  return files.reduce((sum, f) => sum + countItCallsInFile(f), 0);
}

function countSkills() {
  const skillsDir = join(projectDir, "skills");
  if (!existsSync(skillsDir)) return 0;
  return readdirSync(skillsDir).filter((name) => {
    if (!name.startsWith("ms-")) return false;
    return statSync(join(skillsDir, name)).isDirectory();
  }).length;
}

function countPlatforms() {
  const p = join(projectDir, "src", "adapters", "platforms.ts");
  if (!existsSync(p)) return 0;
  const body = readFileSync(p, "utf-8");
  const matches = body.match(/export\s+function\s+convertTo\w+/g);
  return matches ? matches.length : 0;
}

function groundTruth() {
  let arch = { modules: [], public_api: { functions: [] } };
  try {
    arch = extractArchitecture(projectDir);
  } catch {
    // src/ absent in this cwd — leave arch as empty
  }
  return {
    moduleCount: arch.modules.length,
    apiCount: arch.public_api.functions.length,
    skillCount: countSkills(),
    platformCount: countPlatforms(),
    testFileCount: countTestFiles(join(projectDir, "tests")),
    testCount: countItCalls(join(projectDir, "tests")),
  };
}

const PLAYBOOK_PATTERNS = [
  {
    label: "REBUILD_PLAYBOOK modules",
    regex: /(\d+)개 모듈/,
    field: "moduleCount",
  },
  {
    label: "REBUILD_PLAYBOOK public API",
    regex: /public API (\d+)개 함수/,
    field: "apiCount",
  },
  {
    label: "REBUILD_PLAYBOOK skills",
    regex: /skill (\d+)개/,
    field: "skillCount",
  },
  {
    label: "REBUILD_PLAYBOOK platforms",
    regex: /(\d+)개 플랫폼/,
    field: "platformCount",
  },
  {
    label: "REBUILD_PLAYBOOK test files",
    regex: /\((\d+) test files?\)/,
    field: "testFileCount",
  },
  {
    label: "REBUILD_PLAYBOOK tests",
    regex: /현재 기준 (\d+) tests? 전수 통과/,
    field: "testCount",
  },
];

function check() {
  const playbookPath = join(
    projectDir,
    ".mission",
    "reconstruction",
    "REBUILD_PLAYBOOK.md",
  );
  const tracePath = join(
    projectDir,
    ".mission",
    "traceability",
    "TRACE_MATRIX.yaml",
  );
  const truth = groundTruth();
  const mismatches = [];

  if (existsSync(playbookPath)) {
    const body = readFileSync(playbookPath, "utf-8");
    for (const p of PLAYBOOK_PATTERNS) {
      const m = body.match(p.regex);
      if (!m) continue;
      const claim = parseInt(m[1], 10);
      const actual = truth[p.field];
      if (claim !== actual) {
        mismatches.push(`${p.label}: claims ${claim}, actual ${actual}`);
      }
    }
  }

  if (existsSync(tracePath)) {
    const body = readFileSync(tracePath, "utf-8");
    const inline = body.match(/총 (\d+) tests? across (\d+) files?/);
    if (inline) {
      const claimTests = parseInt(inline[1], 10);
      const claimFiles = parseInt(inline[2], 10);
      if (claimTests !== truth.testCount) {
        mismatches.push(
          `TRACE_MATRIX inline test count: claims ${claimTests}, actual ${truth.testCount}`,
        );
      }
      if (claimFiles !== truth.testFileCount) {
        mismatches.push(
          `TRACE_MATRIX inline file count: claims ${claimFiles}, actual ${truth.testFileCount}`,
        );
      }
    }

    let parsed = null;
    try {
      parsed = parse(body);
    } catch (err) {
      mismatches.push(
        `TRACE_MATRIX.yaml parse error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    if (parsed && Array.isArray(parsed.test_coverage)) {
      const entries = parsed.test_coverage.filter(
        (e) => e && typeof e.cases === "number",
      );
      if (entries.length > 0) {
        const sum = entries.reduce((s, e) => s + e.cases, 0);
        if (sum !== truth.testCount) {
          mismatches.push(
            `TRACE_MATRIX test_coverage.cases sum: ${sum}, actual ${truth.testCount}`,
          );
        }
      }
    }
  }

  return { mismatches, truth };
}

if (args.includes("--list")) {
  process.stdout.write(JSON.stringify(groundTruth(), null, 2) + "\n");
  process.exit(0);
}

const { mismatches, truth } = check();

if (mismatches.length === 0) {
  process.stdout.write(
    `Registry freshness check passed. Ground truth:\n` +
      `  modules: ${truth.moduleCount}\n` +
      `  public API: ${truth.apiCount}\n` +
      `  skills: ${truth.skillCount}\n` +
      `  platforms: ${truth.platformCount}\n` +
      `  test files: ${truth.testFileCount}\n` +
      `  tests: ${truth.testCount}\n`,
  );
  process.exit(0);
}

process.stderr.write(`Registry freshness drift detected:\n`);
for (const m of mismatches) {
  process.stderr.write(`  - ${m}\n`);
}
process.stderr.write(
  `\nGround truth: ${JSON.stringify(truth)}\n` +
    `\nUpdate REBUILD_PLAYBOOK.md / TRACE_MATRIX.yaml to match.\n`,
);
process.exit(1);
