// ms-status — mission progress summary
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { loadAndValidateMission } from "../core/parser.js";
import { evaluateMission } from "./eval.js";
import type { EvaluateOptions } from "../core/evaluator.js";
import {
  loadHistory,
  getCurrentPhase,
  type MissionHistory,
} from "../core/history.js";

export interface ScaffoldingWarning {
  path: string;
  hint: string;
}

export interface MetaStaleness {
  field: string;
  hint: string;
}

export interface StatusResult {
  title: string;
  goal: string;
  constraints: string[];
  passed: number;
  total: number;
  progress: string;
  criteria: Array<{ criterion: string; passed: boolean; reason: string }>;
  phase?: string;
  phaseTheme?: string;
  totalRevisions?: number;
  historyWarning?: string;
  scaffoldingWarnings?: ScaffoldingWarning[];
  doneWhenDrift?: string[];
  metaStaleness?: MetaStaleness[];
  markdown: string;
}

const SINGLE_USER_TERMS = [
  "single-user",
  "single user",
  "solo",
  "local-first",
  "local only",
  "personal",
];

const AI_CONTRIBUTOR_TERMS = [
  "claude",
  "codex",
  "gemini",
  "gpt",
  "copilot",
  "llm",
];

function quoteTruncate(s: string): string {
  const safe = s.length > 120 ? `${s.slice(0, 117)}…` : s;
  return `"${safe}"`;
}

function shortTruncate(s: string): string {
  return s.length > 80 ? `${s.slice(0, 77)}…` : s;
}

// Paths that mission-spec scaffolds and expects the adopter to populate.
// Warning fires only when the directory EXISTS AND IS EMPTY — absent dirs
// are not warned (adopter chose not to use that facility).
const SCAFFOLDED_DIRS: Array<{ path: string; hint: string }> = [
  {
    path: ".mission/decisions",
    hint: "exists but empty — run `ms-decide` to record material decisions as MDRs",
  },
  {
    path: ".mission/snapshots",
    hint: "exists but empty — run `npm run snapshot` (or wire into pre-commit) to capture per-revision snapshots",
  },
];

export function detectScaffoldedButEmpty(
  projectDir: string,
): ScaffoldingWarning[] {
  const warnings: ScaffoldingWarning[] = [];
  for (const { path, hint } of SCAFFOLDED_DIRS) {
    const abs = join(projectDir, path);
    if (!existsSync(abs)) continue;
    try {
      if (!statSync(abs).isDirectory()) continue;
      const entries = readdirSync(abs).filter((f) => !f.startsWith("."));
      if (entries.length === 0) warnings.push({ path, hint });
    } catch {
      // Permission or transient IO errors: treat as no-warning (not mission-spec's job to block).
    }
  }
  return warnings;
}

export function detectDoneWhenDrift(
  criteria: Array<{ criterion: string; passed: boolean; reason: string }>,
): string[] {
  return criteria
    .filter((c) =>
      c.reason.toLowerCase().includes("manual verification required"),
    )
    .map((c) => c.criterion);
}

function formatDriftSample(entry: string): string {
  const truncated = entry.length > 80 ? `${entry.slice(0, 77)}…` : entry;
  return `"${truncated}"`;
}

export function detectMetaStaleness(
  history: MissionHistory | null,
  missionTitle: string,
): MetaStaleness[] {
  const warnings: MetaStaleness[] = [];
  if (!history) return warnings;

  // Rule 1: mission_title mismatch (strict !==; no whitespace normalization)
  const historyTitle = history.meta.mission_title;
  if (historyTitle !== undefined && historyTitle !== missionTitle) {
    warnings.push({
      field: "mission_title",
      hint: `history.meta.mission_title (${quoteTruncate(historyTitle)}) differs from mission.yaml.title (${quoteTruncate(missionTitle)}) — sync manually or via metadata:sync equivalent`,
    });
  }

  // Rule 2: tracking_mode claims single-user but contributors include AI
  const mode = history.meta.tracking_mode ?? "";
  const modeLower = mode.toLowerCase();
  const claimsSingleUser = SINGLE_USER_TERMS.some((t) => modeLower.includes(t));
  if (claimsSingleUser) {
    const aiContributors = new Set<string>();
    for (const entry of history.timeline ?? []) {
      for (const c of entry.contributors ?? []) {
        const cLower = c.toLowerCase();
        if (AI_CONTRIBUTOR_TERMS.some((t) => cLower.includes(t))) {
          aiContributors.add(c);
        }
      }
    }
    if (aiContributors.size > 0) {
      const sample = Array.from(aiContributors).slice(0, 3);
      const moreSuffix =
        aiContributors.size > 3 ? ` (+${aiContributors.size - 3} more)` : "";
      const sampleText = sample.map((s) => `"${shortTruncate(s)}"`).join(", ");
      warnings.push({
        field: "tracking_mode",
        hint: `${quoteTruncate(mode)} claims single-user but contributors include ${sampleText}${moreSuffix} — update to reflect multi-agent workflow`,
      });
    }
  }

  return warnings;
}

export function getMissionStatus(
  projectDir: string,
  options: EvaluateOptions = {},
): StatusResult {
  const doc = loadAndValidateMission(projectDir);
  const m = doc.mission;

  const evalResult = evaluateMission(projectDir, options);

  const title = m.title;
  const goal = m.goal;
  const constraints = m.constraints ?? [];

  const md = [
    `# ${title}`,
    "",
    `**Goal:** ${goal.trim()}`,
    "",
    `**Progress:** ${evalResult.passed}/${evalResult.total}`,
    "",
  ];

  if (constraints.length > 0) {
    md.push("## Constraints", "");
    constraints.forEach((c) => md.push(`- ${c}`));
    md.push("");
  }

  md.push("## Done When", "");
  evalResult.criteria.forEach((c) => {
    const icon = c.passed ? "[x]" : "[ ]";
    md.push(`- ${icon} ${c.criterion}`);
    if (!c.passed) md.push(`  - ${c.reason}`);
  });

  // Evolution summary from mission-history.yaml
  let phase: string | undefined;
  let phaseTheme: string | undefined;
  let totalRevisions: number | undefined;
  let historyWarning: string | undefined;
  let metaStaleness: MetaStaleness[] | undefined = undefined;

  try {
    const history = loadHistory(projectDir);
    if (history) {
      totalRevisions = history.meta.total_revisions;
      const currentPhase = getCurrentPhase(history);
      if (currentPhase) {
        phase = currentPhase.name;
        phaseTheme = currentPhase.theme;
      }

      md.push("", "## Evolution", "");
      if (currentPhase) {
        md.push(`**Phase:** ${currentPhase.name} — ${currentPhase.theme}`);
      }
      md.push(`**Revisions:** ${history.meta.total_revisions}`);

      if (history.evolution_summary?.phases) {
        md.push("");
        history.evolution_summary.phases.forEach((p) => {
          md.push(`- **${p.name}** (${p.versions.join(", ")}): ${p.theme}`);
        });
      }

      metaStaleness = detectMetaStaleness(history, title);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    historyWarning = `History unavailable: ${message}`;
    md.push("", "## Evolution", "", historyWarning);
  }

  const scaffoldingWarnings = detectScaffoldedButEmpty(projectDir);
  if (scaffoldingWarnings.length > 0) {
    md.push("", "## Scaffolding", "");
    scaffoldingWarnings.forEach((w) => {
      md.push(`- ⚠ \`${w.path}/\` ${w.hint}`);
    });
  }

  const doneWhenDrift = detectDoneWhenDrift(evalResult.criteria);
  if (doneWhenDrift.length > 0) {
    md.push("", "## done_when drift", "");
    const n = doneWhenDrift.length;
    const total = evalResult.total;
    if (n <= 3) {
      md.push(`⚠ ${n}/${total} done_when entries cannot be auto-evaluated:`);
      doneWhenDrift.forEach((entry) =>
        md.push(`- ${formatDriftSample(entry)}`),
      );
    } else {
      md.push(
        `⚠ ${n}/${total} done_when entries cannot be auto-evaluated.`,
        "",
        "Sample:",
      );
      doneWhenDrift
        .slice(0, 3)
        .forEach((entry) => md.push(`- ${formatDriftSample(entry)}`));
      md.push(`(+${n - 3} more — run \`ms-eval\` for full list)`);
    }
    md.push(
      "",
      "Fix: add a matching entry to `evals[]`, or rewrite as a file-existence pattern (`X 존재` / `X exists`).",
    );
  }

  if (metaStaleness && metaStaleness.length > 0) {
    md.push("", "## meta staleness", "");
    metaStaleness.forEach((m) => md.push(`- ⚠ \`${m.field}\` — ${m.hint}`));
  }

  return {
    title,
    goal: goal.trim(),
    constraints,
    passed: evalResult.passed,
    total: evalResult.total,
    progress: `${evalResult.passed}/${evalResult.total}`,
    criteria: evalResult.criteria,
    phase,
    phaseTheme,
    totalRevisions,
    historyWarning,
    scaffoldingWarnings,
    doneWhenDrift,
    metaStaleness,
    markdown: md.join("\n"),
  };
}
