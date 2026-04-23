// done_when criterion evaluation engine (rule-based + automated command, v1.2)
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync, execSync } from "node:child_process";
import { parse } from "yaml";

export type ResolvedBy = "ref" | "inference" | "manual";
export type RefKind = "command" | "file-exists" | "file-contains" | "eval-ref";

export interface DoneWhenRef {
  index: number;
  kind: RefKind;
  value: string;
}

export interface CriterionResult {
  criterion: string;
  passed: boolean;
  reason: string;
  skipped?: boolean;
  resolved_by?: ResolvedBy;
  ref_kind?: RefKind;
}

export interface EvaluateOptions {
  scope?: "workspace" | "shared";
}

// File existence pattern: "X 파일 존재", "X 존재", "X file exists", etc.
const FILE_EXISTENCE_PATTERN = /^(.+?)\s*(?:파일\s*)?존재$/;
const FILE_EXISTENCE_EN = /^(.+?)\s+(?:file\s+)?exists?$/i;

// Test-related pattern
const TEST_PATTERN = /테스트\s*통과|test.*pass|tests?\s+pass/i;
const SAFE_COMMAND_CLAUSE_PATTERNS: Array<{ regex: RegExp; render: string }> = [
  {
    regex: /\bcargo\s+clippy\s+--all-targets\s+--\s+-D\s+warnings\b/i,
    render: "cargo clippy --all-targets -- -D warnings",
  },
  {
    regex: /\bcargo\s+test\s+--all-targets\b/i,
    render: "cargo test --all-targets",
  },
  { regex: /\bcargo\s+test\b/i, render: "cargo test" },
  { regex: /\bcargo\s+build\b/i, render: "cargo build" },
  { regex: /\bcargo\s+check\b/i, render: "cargo check" },
  { regex: /\bcargo\s+fmt\s+--check\b/i, render: "cargo fmt --check" },
  { regex: /\bnpm\s+test\b/i, render: "npm test" },
  { regex: /\bnpm\s+run\s+lint\b/i, render: "npm run lint" },
  { regex: /\bnpm\s+run\s+build\b/i, render: "npm run build" },
  // Rev.5 Q1 (Codex) + §5.2 (Claude): phrase-level allowlist expanded to
  // match the backtick-prefix allowlist below (pnpm / yarn / bun / pytest /
  // go test). Previously the same command was auto-detected only when
  // backticked, so equivalent prose fell through to manual.
  { regex: /\bpnpm\s+test\b/i, render: "pnpm test" },
  { regex: /\bpnpm\s+run\s+lint\b/i, render: "pnpm run lint" },
  { regex: /\bpnpm\s+run\s+build\b/i, render: "pnpm run build" },
  { regex: /\byarn\s+test\b/i, render: "yarn test" },
  { regex: /\byarn\s+lint\b/i, render: "yarn lint" },
  { regex: /\byarn\s+build\b/i, render: "yarn build" },
  { regex: /\bbun\s+test\b/i, render: "bun test" },
  { regex: /\bbun\s+run\s+lint\b/i, render: "bun run lint" },
  { regex: /\bbun\s+run\s+build\b/i, render: "bun run build" },
  { regex: /\bpytest\b/i, render: "pytest" },
  { regex: /\bgo\s+test\b/i, render: "go test" },
];
const SAFE_COMMAND_SUCCESS_HINT =
  /succeeds?|passes?|is clean|all clean|green|통과|성공|clean|\bexit 0\b|without warnings|validated|passes CI/i;
const BACKTICK_COMMAND_RE = /`([^`]+)`/g;
const PATH_TOKEN_RE =
  /(?:\.[\w-]+\/|[\w-]+\/|)(?:[\w.-]+\/)*[\w.-]+\.(?:md|ya?ml|json|toml|rs|ts|js|sh|txt|conf|sql|sqlite|db|lock)/gi;

function unique(items: string[]): string[] {
  return [...new Set(items)];
}

function isGitIgnored(projectDir: string, relPath: string): boolean {
  try {
    execFileSync("git", ["check-ignore", "-q", relPath], {
      cwd: projectDir,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function extractMentionedPaths(criterion: string): string[] {
  return unique(Array.from(criterion.matchAll(PATH_TOKEN_RE), (m) => m[0]));
}

function detectMissingLocalOnlyPaths(
  criterion: string,
  projectDir: string,
): string[] {
  return extractMentionedPaths(criterion).filter((relPath) => {
    const absPath = join(projectDir, relPath);
    return !existsSync(absPath) && isGitIgnored(projectDir, relPath);
  });
}

function inferCommandClauses(criterion: string): string[] {
  const inferred: string[] = [];

  if (SAFE_COMMAND_SUCCESS_HINT.test(criterion)) {
    for (const { regex, render } of SAFE_COMMAND_CLAUSE_PATTERNS) {
      if (regex.test(criterion)) inferred.push(render);
    }
  }

  for (const match of criterion.matchAll(BACKTICK_COMMAND_RE)) {
    const command = match[1].trim();
    if (
      SAFE_COMMAND_SUCCESS_HINT.test(criterion) &&
      /^(?:cargo|npm|pnpm|yarn|bun|pytest|go\s+test|node\s+-e\b)/i.test(command)
    ) {
      inferred.push(command);
    }
  }

  return unique(inferred);
}

function runInferredCommands(
  criterion: string,
  commands: string[],
  projectDir: string,
): CriterionResult {
  try {
    for (const command of commands) {
      execSync(command, { cwd: projectDir, stdio: "ignore" });
    }
    return {
      criterion,
      passed: true,
      reason: `Inferred command clause(s) succeeded: ${commands.join("; ")}`,
      resolved_by: "inference",
    };
  } catch (error) {
    return {
      criterion,
      passed: false,
      reason: `Inferred command clause failed (${(error as Error).message}): ${commands.join("; ")}`,
      resolved_by: "inference",
    };
  }
}

function runRef(
  ref: DoneWhenRef,
  criterion: string,
  projectDir: string,
  evals?: Array<{
    name: string;
    type: string;
    command?: string;
    pass_criteria?: string;
  }>,
): CriterionResult {
  switch (ref.kind) {
    case "command":
      return runRefCommand(ref, criterion, projectDir);
    case "file-exists":
      return runRefFileExists(ref, criterion, projectDir);
    case "file-contains":
      return runRefFileContains(ref, criterion, projectDir);
    case "eval-ref":
      return runRefEvalRef(ref, criterion, projectDir, evals);
    // other kinds are added in Tasks 4–6
    default:
      return {
        criterion,
        passed: false,
        reason: `Unsupported ref kind: ${ref.kind}`,
        resolved_by: "manual",
      };
  }
}

function runRefCommand(
  ref: DoneWhenRef,
  criterion: string,
  projectDir: string,
): CriterionResult {
  try {
    execSync(ref.value, {
      cwd: projectDir,
      timeout: 180000,
      stdio: "pipe",
    });
    return {
      criterion,
      passed: true,
      reason: `Ref command succeeded: ${ref.value}`,
      resolved_by: "ref",
      ref_kind: "command",
    };
  } catch (error) {
    const detail = (
      (error as { stderr?: Buffer; stdout?: Buffer }).stderr
        ? (error as { stderr: Buffer }).stderr.toString()
        : (error as Error).message
    ).slice(0, 256);
    return {
      criterion,
      passed: false,
      reason: `Ref command failed (${detail.trim()}): ${ref.value}`,
      resolved_by: "ref",
      ref_kind: "command",
    };
  }
}

function runRefFileExists(
  ref: DoneWhenRef,
  criterion: string,
  projectDir: string,
): CriterionResult {
  const absPath = join(projectDir, ref.value);
  const exists = existsSync(absPath);
  return {
    criterion,
    passed: exists,
    reason: exists
      ? `Ref file exists: ${ref.value}`
      : `Ref file missing: ${ref.value}`,
    resolved_by: "ref",
    ref_kind: "file-exists",
  };
}

function runRefFileContains(
  ref: DoneWhenRef,
  criterion: string,
  projectDir: string,
): CriterionResult {
  const sep = ref.value.indexOf("::");
  if (sep < 0) {
    return {
      criterion,
      passed: false,
      reason: `Ref value must use 'path::substring' format: ${ref.value}`,
      resolved_by: "ref",
      ref_kind: "file-contains",
    };
  }
  const relPath = ref.value.slice(0, sep);
  const substring = ref.value.slice(sep + 2);
  const absPath = join(projectDir, relPath);
  if (!existsSync(absPath)) {
    return {
      criterion,
      passed: false,
      reason: `Ref file-contains target missing: ${relPath}`,
      resolved_by: "ref",
      ref_kind: "file-contains",
    };
  }
  const content = readFileSync(absPath, "utf-8");
  const contained = content.includes(substring);
  return {
    criterion,
    passed: contained,
    reason: contained
      ? `Ref file-contains matched: ${relPath} contains substring`
      : `Ref file-contains: substring not found in ${relPath}`,
    resolved_by: "ref",
    ref_kind: "file-contains",
  };
}

function runRefEvalRef(
  ref: DoneWhenRef,
  criterion: string,
  projectDir: string,
  evals?: Array<{
    name: string;
    type: string;
    command?: string;
    pass_criteria?: string;
  }>,
): CriterionResult {
  const entry = evals?.find((e) => e.name === ref.value);
  if (!entry) {
    return {
      criterion,
      passed: false,
      reason: `Ref eval-ref target missing in mission.evals[]: ${ref.value}`,
      resolved_by: "ref",
      ref_kind: "eval-ref",
    };
  }
  if (entry.type === "llm-eval" || entry.type === "llm-judge") {
    const override = loadLlmEvalOverride(projectDir, ref.value);
    if (override) {
      return {
        criterion,
        passed: override.passed,
        reason: `Ref eval-ref ${ref.value}: ${override.reason}`,
        resolved_by: "ref",
        ref_kind: "eval-ref",
      };
    }
    return {
      criterion,
      passed: false,
      reason: `Ref eval-ref ${ref.value}: awaiting LLM verdict — record in .mission/evals/${ref.value}.result.yaml`,
      resolved_by: "ref",
      ref_kind: "eval-ref",
    };
  }
  if (entry.type === "automated" && entry.command) {
    try {
      execSync(entry.command, { cwd: projectDir, stdio: "ignore" });
      return {
        criterion,
        passed: true,
        reason: `Ref eval-ref ${ref.value}: automated command succeeded (${entry.command})`,
        resolved_by: "ref",
        ref_kind: "eval-ref",
      };
    } catch (error) {
      return {
        criterion,
        passed: false,
        reason: `Ref eval-ref ${ref.value}: command failed (${(error as Error).message})`,
        resolved_by: "ref",
        ref_kind: "eval-ref",
      };
    }
  }
  return {
    criterion,
    passed: false,
    reason: `Ref eval-ref ${ref.value}: unsupported eval type '${entry.type}' (requires automated/llm-eval/llm-judge)`,
    resolved_by: "ref",
    ref_kind: "eval-ref",
  };
}

// Load external override for LLM/subjective evaluations.
// If `.mission/evals/<name>.result.yaml` exists, use that result.
// Format: { passed: bool, reason?: string, evaluated_by?: string, evaluated_at?: string }
function loadLlmEvalOverride(
  projectDir: string,
  evalName: string,
): { passed: boolean; reason: string } | null {
  const resultPath = join(
    projectDir,
    ".mission",
    "evals",
    `${evalName}.result.yaml`,
  );
  if (!existsSync(resultPath)) return null;
  try {
    const data = parse(readFileSync(resultPath, "utf-8")) as {
      passed?: unknown;
      reason?: unknown;
      evaluated_by?: unknown;
      evaluated_at?: unknown;
    } | null;
    if (!data || typeof data.passed !== "boolean") {
      return {
        passed: false,
        reason: `Override file format error (${resultPath}): 'passed: true|false' required`,
      };
    }
    const parts: string[] = [data.passed ? "Verdict: PASS" : "Verdict: FAIL"];
    if (typeof data.evaluated_by === "string")
      parts.push(`by ${data.evaluated_by}`);
    if (typeof data.evaluated_at === "string")
      parts.push(`@ ${data.evaluated_at}`);
    if (typeof data.reason === "string" && data.reason) parts.push(data.reason);
    return { passed: data.passed, reason: parts.join(" — ") };
  } catch (err) {
    return {
      passed: false,
      reason: `Override file parse error (${resultPath}): ${(err as Error).message}`,
    };
  }
}

export function evaluateCriterion(
  criterion: string,
  projectDir: string,
  evals?: Array<{
    name: string;
    type: string;
    command?: string;
    pass_criteria?: string;
  }>,
  options: EvaluateOptions = {},
  ref?: DoneWhenRef,
): CriterionResult {
  // Explicit ref — trust-by-explicit-authoring wins over shared-scope heuristics.
  // Order: ref > shared-scope skip > evals/inference chain (IMP-10 §PATCH, v1.21.1).
  if (ref) {
    return runRef(ref, criterion, projectDir, evals);
  }

  if (options.scope === "shared") {
    const missingLocalOnly = detectMissingLocalOnlyPaths(criterion, projectDir);
    if (missingLocalOnly.length > 0) {
      return {
        criterion,
        passed: true,
        skipped: true,
        reason: `Shared-mode skip: references missing gitignored local-only artifact(s): ${missingLocalOnly.join(", ")}`,
        resolved_by: "inference",
      };
    }
  }

  // 0. Check if evals array has an explicit automated command or LLM evaluation
  if (evals) {
    const llmEval = evals.find(
      (e) =>
        e.name === criterion &&
        (e.type === "llm-eval" || e.type === "llm-judge"),
    );
    if (llmEval) {
      const override = loadLlmEvalOverride(projectDir, criterion);
      if (override) {
        return {
          criterion,
          passed: override.passed,
          reason: override.reason,
          resolved_by: "inference",
        };
      }
      return {
        criterion,
        passed: false,
        reason: `Awaiting LLM evaluation (pass_criteria: ${llmEval.pass_criteria}) — record verdict in .mission/evals/${criterion}.result.yaml`,
        resolved_by: "inference",
      };
    }

    const matchingEval = evals.find(
      (e) => e.name === criterion && e.type === "automated" && e.command,
    );
    if (matchingEval && matchingEval.command) {
      try {
        execSync(matchingEval.command, { cwd: projectDir, stdio: "ignore" });
        return {
          criterion,
          passed: true,
          reason: `Automated command succeeded: ${matchingEval.command}`,
          resolved_by: "inference",
        };
      } catch (error) {
        return {
          criterion,
          passed: false,
          reason: `Automated command failed (${(error as Error).message}): ${matchingEval.command}`,
          resolved_by: "inference",
        };
      }
    }
  }

  // 1. File existence check
  const fileMatch =
    criterion.match(FILE_EXISTENCE_PATTERN) ??
    criterion.match(FILE_EXISTENCE_EN);
  if (fileMatch) {
    const fileName = fileMatch[1].trim();
    const filePath = join(projectDir, fileName);
    const exists = existsSync(filePath);
    return {
      criterion,
      passed: exists,
      reason: exists ? `${fileName} found` : `${fileName} not found`,
      resolved_by: "inference",
    };
  }

  // 2. Test-related (rule-based: recommend manual check if no explicit command)
  const inferredCommands = inferCommandClauses(criterion);
  if (inferredCommands.length > 0) {
    return runInferredCommands(criterion, inferredCommands, projectDir);
  }

  // 3. Test-related (rule-based: recommend manual check if no explicit command)
  if (TEST_PATTERN.test(criterion)) {
    return {
      criterion,
      passed: false,
      reason:
        "Manual verification required: check npm test results (or add automated eval to mission.yaml)",
      resolved_by: "manual",
    };
  }

  // 4. Fallback: cannot auto-evaluate
  return {
    criterion,
    passed: false,
    reason: "Cannot auto-evaluate — manual verification required",
    resolved_by: "manual",
  };
}

export function evaluateAllCriteria(
  criteria: string[],
  projectDir: string,
  evals?: Array<{
    name: string;
    type: string;
    command?: string;
    pass_criteria?: string;
  }>,
  options: EvaluateOptions = {},
  refs?: DoneWhenRef[],
): CriterionResult[] {
  const refByIndex = new Map<number, DoneWhenRef>();
  if (refs) {
    for (const r of refs) refByIndex.set(r.index, r);
  }
  return criteria.map((c, i) =>
    evaluateCriterion(c, projectDir, evals, options, refByIndex.get(i)),
  );
}
