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
//   node scripts/verify-registry.js               # exit 1 on drift (fast)
//   node scripts/verify-registry.js --list        # print ground truth as JSON
//   node scripts/verify-registry.js --verify-live # also run evaluateMission()
//                                                   and compare claimed PASS
//                                                   against live result (C-2)
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
const verifyLive = args.includes("--verify-live");

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

// F-4 helpers. Tiny semver compare that avoids pulling `semver` (MDR-003
// minimal-deps). Inputs are triplets; no prerelease / build metadata handling
// needed for our use case (CURRENT_STATE 헤더 version is always a plain
// X.Y.Z from mission.yaml / package.json).
function loadPackageVersion() {
  const p = join(projectDir, "package.json");
  if (!existsSync(p)) return null;
  try {
    const pkg = JSON.parse(readFileSync(p, "utf-8"));
    return typeof pkg.version === "string" ? pkg.version : null;
  } catch {
    return null;
  }
}

function compareSemver(a, b) {
  const [aA, aB, aC] = a.split(".").map((x) => parseInt(x, 10) || 0);
  const [bA, bB, bC] = b.split(".").map((x) => parseInt(x, 10) || 0);
  if (aA !== bA) return aA - bA;
  if (aB !== bB) return aB - bB;
  return aC - bC;
}

async function groundTruth() {
  let arch = { modules: [], public_api: { functions: [] } };
  try {
    arch = extractArchitecture(projectDir);
  } catch {
    // src/ absent in this cwd — leave arch as empty
  }

  // E-8: read mission.yaml for fields that CURRENT_STATE.md mirrors.
  let missionTitle = null;
  let doneWhenCount = null;
  let lineageTotalRevisions = null;
  // IMP-10: refs invariants — expose raw refs, done_when length, and eval
  // names so check() can run the 3 drift detectors that mirror
  // src/commands/validate.ts (index out-of-range / duplicate / eval-ref
  // orphan).
  let doneWhenRefs = [];
  let evalNames = [];
  const missionPath = join(projectDir, "mission.yaml");
  if (existsSync(missionPath)) {
    try {
      const parsed = parse(readFileSync(missionPath, "utf-8"));
      if (typeof parsed?.mission?.title === "string") {
        missionTitle = parsed.mission.title;
      }
      if (Array.isArray(parsed?.mission?.done_when)) {
        doneWhenCount = parsed.mission.done_when.length;
      }
      if (typeof parsed?.mission?.lineage?.total_revisions === "number") {
        lineageTotalRevisions = parsed.mission.lineage.total_revisions;
      }
      if (Array.isArray(parsed?.mission?.done_when_refs)) {
        doneWhenRefs = parsed.mission.done_when_refs;
      }
      if (Array.isArray(parsed?.mission?.evals)) {
        evalNames = parsed.mission.evals
          .map((e) => (e && typeof e === "object" ? e.name : undefined))
          .filter((n) => typeof n === "string");
      }
    } catch {
      // malformed mission.yaml — leave fields null, CURRENT_STATE checks skip.
    }
  }

  let historyTotalRevisions = null;
  const historyPath = join(projectDir, "mission-history.yaml");
  if (existsSync(historyPath)) {
    try {
      const parsed = parse(readFileSync(historyPath, "utf-8"));
      if (typeof parsed?.meta?.total_revisions === "number") {
        historyTotalRevisions = parsed.meta.total_revisions;
      }
    } catch {
      // malformed history — leave null, lineage checks skip.
    }
  }

  let latestVerificationVersion = null;
  const verificationPath = join(
    projectDir,
    ".mission",
    "evidence",
    "VERIFICATION_LOG.yaml",
  );
  if (existsSync(verificationPath)) {
    try {
      const parsed = parse(readFileSync(verificationPath, "utf-8"));
      const top = Array.isArray(parsed?.entries) ? parsed.entries[0] : null;
      if (typeof top?.version === "string") {
        latestVerificationVersion = top.version;
      }
    } catch {
      // malformed verification log — leave null, dedicated checks skip.
    }
  }

  // C-2 (v1.16.13): --verify-live opt-in imports evaluateMission from dist
  // and records the live PASS count so check() can compare against claimed
  // CURRENT_STATE.md value. Default (verifyLive=false) returns null, which
  // makes the live check skip — keeping the fast path for pre-commit.
  let livePassed = null;
  if (verifyLive && existsSync(missionPath)) {
    try {
      const mod = await import("../dist/index.js");
      if (typeof mod.evaluateMission === "function") {
        const result = mod.evaluateMission(projectDir);
        if (result && typeof result.passed === "number") {
          livePassed = result.passed;
        }
      }
    } catch {
      // dist/ missing or evaluateMission throws — leave null, treat as
      // "live check unavailable"; existing mismatches still emit normally.
    }
  }

  // IMP-10: refsByKind aggregates kind distribution (command / eval-ref / …)
  // for at-a-glance inspection; refsCoverage is "refs.length/done_when.length"
  // so stale refs vs unreferenced criteria are visible in --list output.
  const refsByKind = doneWhenRefs.reduce((acc, r) => {
    if (r && typeof r === "object" && typeof r.kind === "string") {
      acc[r.kind] = (acc[r.kind] ?? 0) + 1;
    }
    return acc;
  }, {});
  const refsCoverage = `${doneWhenRefs.length}/${doneWhenCount ?? 0}`;

  return {
    moduleCount: arch.modules.length,
    apiCount: arch.public_api.functions.length,
    skillCount: countSkills(),
    platformCount: countPlatforms(),
    testFileCount: countTestFiles(join(projectDir, "tests")),
    testCount: countItCalls(join(projectDir, "tests")),
    missionTitle,
    doneWhenCount,
    lineageTotalRevisions,
    historyTotalRevisions,
    latestVerificationVersion,
    livePassed,
    refsCount: doneWhenRefs.length,
    refsByKind,
    refsCoverage,
    // Raw refs + eval names passed through for check()'s drift detectors;
    // not part of the --list contract (numeric/string ground truth only),
    // but harmless for humans who inspect the JSON dump.
    doneWhenRefs,
    evalNames,
  };
}

// Korean-coupled by design — see MDR-007 (playbook language policy). Trigger
// conditions for migrating to YAML-frontmatter claims are enumerated there.
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

async function check() {
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
  const truth = await groundTruth();
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

  if (
    truth.lineageTotalRevisions != null &&
    truth.historyTotalRevisions != null &&
    truth.lineageTotalRevisions !== truth.historyTotalRevisions
  ) {
    mismatches.push(
      `mission.yaml lineage.total_revisions: claims ${truth.lineageTotalRevisions}, actual ${truth.historyTotalRevisions} (mission-history.yaml meta.total_revisions)`,
    );
  }

  // IMP-10: done_when_refs invariants (mirrors src/commands/validate.ts so
  // drift is caught by registry:check even if `validate` isn't run). Uses
  // the "collect all drifts then report" pattern already established above —
  // each violation pushes into mismatches without aborting the loop.
  const refs = Array.isArray(truth.doneWhenRefs) ? truth.doneWhenRefs : [];
  if (refs.length > 0) {
    const doneWhenLen =
      typeof truth.doneWhenCount === "number" ? truth.doneWhenCount : 0;
    const evalNameSet = new Set(
      Array.isArray(truth.evalNames) ? truth.evalNames : [],
    );
    const seen = new Set();
    for (const r of refs) {
      if (!r || typeof r !== "object" || typeof r.index !== "number") continue;
      if (r.index >= doneWhenLen) {
        mismatches.push(
          `mission.done_when_refs[${r.index}]: index out of range (done_when.length = ${doneWhenLen})`,
        );
      }
      if (seen.has(r.index)) {
        mismatches.push(`mission.done_when_refs: duplicate index ${r.index}`);
      }
      seen.add(r.index);
      if (r.kind === "eval-ref" && !evalNameSet.has(r.value)) {
        mismatches.push(
          `mission.done_when_refs: eval-ref value '${r.value}' not found in mission.evals[].name`,
        );
      }
    }
  }

  // E-8 (v1.16.2) + C-4/F-4 (v1.16.9): CURRENT_STATE.md content checks.
  // - Title line mirrors mission.yaml title. C-4: accept Title / 제목 / 标题 /
  //   タイトル labels; fail if CURRENT_STATE.md exists but no recognisable
  //   Title label found (silent-skip used to disable the detector).
  // - "완료 조건 (N/M PASS)" total must match done_when length (E-8).
  // - F-4: `## 최근 구현 (vA ~ vB)` header's upper bound must not trail
  //   package.json.version. MDR-007 says .mission/ is maintainer-facing and
  //   Korean-only, so the 최근 구현 label stays Korean-coupled by policy.
  const currentStatePath = join(projectDir, ".mission", "CURRENT_STATE.md");
  if (existsSync(currentStatePath)) {
    const body = readFileSync(currentStatePath, "utf-8");

    if (truth.missionTitle != null) {
      const titleMatch = body.match(
        /^\s*-\s*\*\*(?:Title|제목|标题|タイトル):\*\*\s*(.+?)\s*$/m,
      );
      if (!titleMatch) {
        mismatches.push(
          "CURRENT_STATE.md exists but no Title label found " +
            "(expected one of: `- **Title:** …`, `- **제목:** …`, " +
            "`- **标题:** …`, `- **タイトル:** …`).",
        );
      } else {
        const claim = titleMatch[1].trim();
        if (claim !== truth.missionTitle) {
          mismatches.push(
            `CURRENT_STATE.md Title line: claims "${claim}", actual "${truth.missionTitle}"`,
          );
        }
      }
    }

    if (truth.doneWhenCount != null) {
      const countMatch = body.match(/완료\s*조건\s*\((\d+)\/(\d+)\s*PASS\)/);
      if (countMatch) {
        const claimPass = parseInt(countMatch[1], 10);
        const claimTotal = parseInt(countMatch[2], 10);
        if (claimTotal !== truth.doneWhenCount) {
          mismatches.push(
            `CURRENT_STATE.md completion-condition count: claims ${claimTotal}, actual ${truth.doneWhenCount}`,
          );
        }
        if (claimPass > claimTotal) {
          mismatches.push(
            `CURRENT_STATE.md completion-condition count: PASS (${claimPass}) exceeds TOTAL (${claimTotal})`,
          );
        }
        // C-2 (v1.16.13): when --verify-live is passed, mechanically tie
        // claimPass to evaluateMission()'s actual result. Default keeps
        // registry:check fast (pre-commit runs without this flag); the
        // release gate can opt in.
        if (truth.livePassed != null) {
          if (claimPass !== truth.livePassed) {
            mismatches.push(
              `CURRENT_STATE.md completion-condition PASS: claims ${claimPass}, actual ${truth.livePassed} (live evaluateMission)`,
            );
          }
        }
      }
    }

    // F-4: version range of `## 최근 구현 (vA ~ vB)` must include current
    // package.json.version. If absent, skip (graceful). If upper bound
    // trails current, the section is stale by construction.
    const currentVersion = loadPackageVersion();
    if (currentVersion) {
      const recentMatch = body.match(
        /^##\s*최근\s*구현\s*\(v([\d.]+)\s*~\s*v([\d.]+)\)/m,
      );
      if (recentMatch) {
        const upperBound = recentMatch[2];
        if (compareSemver(upperBound, currentVersion) < 0) {
          mismatches.push(
            `CURRENT_STATE.md 최근 구현 header upper bound v${upperBound} is behind current package.json version v${currentVersion}`,
          );
        }
      }
    }
  }

  const currentVersion = loadPackageVersion();
  if (
    currentVersion &&
    truth.latestVerificationVersion != null &&
    truth.latestVerificationVersion !== currentVersion
  ) {
    mismatches.push(
      `VERIFICATION_LOG latest entry version: claims ${truth.latestVerificationVersion}, actual ${currentVersion} (package.json.version)`,
    );
  }

  return { mismatches, truth };
}

async function main() {
  if (args.includes("--list")) {
    const gt = await groundTruth();
    process.stdout.write(JSON.stringify(gt, null, 2) + "\n");
    process.exit(0);
  }

  const { mismatches, truth } = await check();

  if (mismatches.length === 0) {
    let line =
      `Registry freshness check passed. Ground truth:\n` +
      `  modules: ${truth.moduleCount}\n` +
      `  public API: ${truth.apiCount}\n` +
      `  skills: ${truth.skillCount}\n` +
      `  platforms: ${truth.platformCount}\n` +
      `  test files: ${truth.testFileCount}\n` +
      `  tests: ${truth.testCount}\n`;
    if (truth.livePassed != null && truth.doneWhenCount != null) {
      line += `  live evaluator: ${truth.livePassed}/${truth.doneWhenCount}\n`;
    }
    process.stdout.write(line);
    process.exit(0);
  }

  process.stderr.write(`Registry freshness drift detected:\n`);
  for (const m of mismatches) {
    process.stderr.write(`  - ${m}\n`);
  }
  process.stderr.write(
    `\nGround truth: ${JSON.stringify(truth)}\n` +
      `\nUpdate REBUILD_PLAYBOOK.md / TRACE_MATRIX.yaml / mission.yaml / VERIFICATION_LOG.yaml to match.\n`,
  );
  process.exit(1);
}

main();
