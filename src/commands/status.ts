// ms-status — 미션 진행 상황 요약
import { loadAndValidateMission } from "../core/parser.js";
import { evaluateMission } from "./eval.js";
import { loadHistory, getCurrentPhase } from "../core/history.js";

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
  markdown: string;
}

export function getMissionStatus(projectDir: string): StatusResult {
  const doc = loadAndValidateMission(projectDir);
  const m = doc.mission;

  const evalResult = evaluateMission(projectDir);

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
    markdown: md.join("\n"),
  };
}
