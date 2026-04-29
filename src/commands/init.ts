// ms-init — natural language → mission.yaml draft auto-generation
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { stringify } from "yaml";
import { validateMission } from "../schema/validator.js";

export interface InitOptions {
  goal: string;
  title?: string;
  constraints?: string[];
  projectDir: string;
}

export interface ProjectContext {
  hasPackageJson: boolean;
  hasReadme: boolean;
  hasNpmTestScript: boolean;
  projectName?: string;
  projectDescription?: string;
}

export interface InitResult {
  yaml: string;
  parsed: { mission: MissionData };
  valid: boolean;
  errors: string[];
  context: ProjectContext;
}

interface MissionData {
  title: string;
  goal: string;
  done_when: string[];
  constraints?: string[];
  evals?: Array<{
    name: string;
    type: "automated";
    command: string;
    pass_criteria: string;
  }>;
  done_when_refs?: Array<{
    index: number;
    kind: "eval-ref";
    value: string;
  }>;
  version?: string;
  lineage?: {
    initial_version: string;
    initial_date: string;
    total_revisions: number;
    history: string;
  };
}

function detectProjectContext(projectDir: string): ProjectContext {
  const ctx: ProjectContext = {
    hasPackageJson: false,
    hasReadme: false,
    hasNpmTestScript: false,
  };

  const pkgPath = join(projectDir, "package.json");
  if (existsSync(pkgPath)) {
    ctx.hasPackageJson = true;
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      ctx.projectName = pkg.name;
      ctx.projectDescription = pkg.description;
      ctx.hasNpmTestScript = typeof pkg.scripts?.test === "string";
    } catch {
      // malformed package.json — ignore
    }
  }

  const readmePath = join(projectDir, "README.md");
  if (existsSync(readmePath)) {
    ctx.hasReadme = true;
  }

  return ctx;
}

function deriveTitleFromGoal(goal: string): string {
  // Use first sentence as title, truncate to 50 chars
  const firstLine = goal.split("\n")[0].trim();
  if (firstLine.length <= 50) return firstLine;
  return firstLine.slice(0, 47) + "...";
}

// Heuristic vocabulary — Korean + English. Patterns are word-boundaried for
// English to avoid false matches inside longer identifiers (e.g. `fix` inside
// `prefix`). Korean is CJK so word boundaries are not enforced there.
const IMPLEMENTATION_VERBS_EN = [
  "implement",
  "add",
  "create",
  "write",
  "build",
  "develop",
  "make",
  "design",
  "refactor",
  "update",
  "fix",
  "improve",
  "enhance",
  "deploy",
  "migrate",
  "integrate",
  "ship",
  "release",
  "port",
  "rewrite",
  "introduce",
  "expose",
  "wire",
  "scaffold",
  "extract",
  "implement",
];

const TEST_VERBS_EN = [
  "test",
  "verify",
  "validate",
  "assert",
  "check",
  "ensure",
  "cover",
];

const DOCS_VERBS_EN = [
  "doc",
  "docs",
  "readme",
  "guide",
  "tutorial",
  "manual",
  "explain",
  "describe",
  "document",
];

function matchesAny(text: string, kWords: string[], eWords: string[]): boolean {
  // Korean: plain substring match (CJK has no word boundaries).
  for (const k of kWords) {
    if (text.includes(k)) return true;
  }
  // English: word-boundary match, case-insensitive.
  const pattern = new RegExp(
    `\\b(?:${[...new Set(eWords)].join("|")})\\b`,
    "i",
  );
  return pattern.test(text);
}

function deriveDoneWhenFromGoal(goal: string): string[] {
  const criteria: string[] = [];
  const goalText = goal.trim();
  const firstLine = goalText.split("\n")[0].trim();

  // 1. Core objective
  criteria.push(firstLine);

  // 2. Verb-based inference (implementation intent)
  if (
    matchesAny(
      goalText,
      ["구현", "개발", "작성", "추가", "생성"],
      IMPLEMENTATION_VERBS_EN,
    )
  ) {
    criteria.push("Code implementation complete and verified");
  }

  // 3. Test/verification
  if (matchesAny(goalText, ["테스트", "검증"], TEST_VERBS_EN)) {
    criteria.push("All unit tests passing");
  } else {
    criteria.push("npm test or core logic verification complete");
  }

  // 4. Documentation
  if (matchesAny(goalText, ["문서", "가이드"], DOCS_VERBS_EN)) {
    criteria.push("README.md or related documentation updated");
  }

  return criteria;
}

function addEvalScaffold(missionData: MissionData, context: ProjectContext) {
  if (!context.hasNpmTestScript) return;
  const testIndex = missionData.done_when.findIndex(
    (criterion) =>
      criterion === "All unit tests passing" ||
      criterion === "npm test or core logic verification complete",
  );
  if (testIndex < 0) return;

  missionData.evals = [
    {
      name: "npm_test",
      type: "automated",
      command: "npm test",
      pass_criteria: "npm test exits with status 0",
    },
  ];
  missionData.done_when_refs = [
    {
      index: testIndex,
      kind: "eval-ref",
      value: "npm_test",
    },
  ];
}

export function generateMissionDraft(options: InitOptions): InitResult {
  if (!options.goal || options.goal.trim() === "") {
    throw new Error("goal is required");
  }

  const context = detectProjectContext(options.projectDir);

  const title = options.title ?? deriveTitleFromGoal(options.goal);
  const doneWhen = deriveDoneWhenFromGoal(options.goal);

  const missionData: MissionData = {
    title,
    goal: options.goal.trim(),
    done_when: doneWhen,
  };

  addEvalScaffold(missionData, context);

  if (options.constraints && options.constraints.length > 0) {
    missionData.constraints = options.constraints;
  }

  const today = new Date().toISOString().slice(0, 10);
  missionData.version = "1.0.0";
  missionData.lineage = {
    initial_version: "1.0.0",
    initial_date: today,
    total_revisions: 1,
    history: "mission-history.yaml",
  };

  const doc = { mission: missionData };
  const yamlStr = stringify(doc);

  const validation = validateMission(doc);

  return {
    yaml: yamlStr,
    parsed: doc,
    valid: validation.valid,
    errors: validation.errors,
    context,
  };
}
