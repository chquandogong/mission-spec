// ms-context — project context prompt generation for AI agents
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { loadAndValidateMission } from "../core/parser.js";
import {
  loadHistory,
  getCurrentPhase,
  getLatestEntry,
} from "../core/history.js";

export interface ContextResult {
  markdown: string;
  sections: string[];
}

export function generateContext(projectDir: string): ContextResult {
  const sections: string[] = [];
  const lines: string[] = [];

  // 1. Mission Contract
  const doc = loadAndValidateMission(projectDir);
  const m = doc.mission;
  lines.push("# Project Context");
  lines.push("");
  lines.push(`## Mission: ${m.title}`);
  lines.push("");
  lines.push(`**Goal:** ${m.goal.trim()}`);
  if (m.version) lines.push(`**Version:** ${m.version}`);
  if (m.author) lines.push(`**Author:** ${m.author}`);
  lines.push("");

  if (m.constraints && m.constraints.length > 0) {
    lines.push("### Constraints");
    lines.push("");
    m.constraints.forEach((c) => lines.push(`- ${c}`));
    lines.push("");
  }

  lines.push("### Done When");
  lines.push("");
  m.done_when.forEach((d) => lines.push(`- ${d}`));
  lines.push("");
  sections.push("mission");

  // 2. Design Refs
  if (m.design_refs) {
    lines.push("## Design References");
    lines.push("");
    for (const [key, value] of Object.entries(m.design_refs)) {
      lines.push(`- **${key}:** \`${value}\``);
    }
    lines.push("");
    sections.push("design_refs");
  }

  // 3. History Summary
  try {
    const history = loadHistory(projectDir);
    if (history) {
      const phase = getCurrentPhase(history);
      const latest = getLatestEntry(history);

      lines.push("## Evolution Summary");
      lines.push("");
      if (phase) {
        lines.push(`**Current Phase:** ${phase.name} — ${phase.theme}`);
      }
      lines.push(`**Total Revisions:** ${history.meta.total_revisions}`);
      lines.push("");

      if (history.evolution_summary?.phases) {
        history.evolution_summary.phases.forEach((p) => {
          lines.push(`- **${p.name}** (${p.versions.join(", ")}): ${p.theme}`);
        });
        lines.push("");
      }

      if (latest) {
        lines.push("### Latest Change");
        lines.push("");
        lines.push(
          `- **Version:** ${latest.semantic_version} (${latest.date})`,
        );
        lines.push(`- **Intent:** ${latest.intent}`);
        if (latest.decision) {
          lines.push(`- **Decision:** ${latest.decision}`);
        }
        lines.push("");
      }
      sections.push("history");
    }
  } catch {
    // History unavailable — skip silently
  }

  // 4. MDR Summaries
  const decisionsDir = join(projectDir, ".mission", "decisions");
  if (existsSync(decisionsDir)) {
    try {
      const files = readdirSync(decisionsDir).filter(
        (f: string) => f.startsWith("MDR-") && f.endsWith(".md"),
      );
      if (files.length > 0) {
        lines.push("## Key Decisions (MDR)");
        lines.push("");
        files.forEach((f: string) => {
          const content = readFileSync(join(decisionsDir, f), "utf-8");
          const titleMatch = content.match(/^#\s+(.+)/m);
          const title = titleMatch ? titleMatch[1] : f;
          lines.push(`- **${f}:** ${title}`);
        });
        lines.push("");
        sections.push("decisions");
      }
    } catch {
      // decisions dir read failure — skip
    }
  }

  // 5. Architecture Registry
  const archPath = join(
    projectDir,
    ".mission",
    "architecture",
    "ARCHITECTURE_CURRENT.yaml",
  );
  if (existsSync(archPath)) {
    try {
      const archData = parse(readFileSync(archPath, "utf-8")) as {
        modules?: Array<{
          id: string;
          path: string;
          responsibility: string;
          depends_on?: string[];
        }>;
        data_flow?: { pipeline?: string };
      };
      if (archData?.modules) {
        lines.push("## Architecture");
        lines.push("");
        if (archData.data_flow?.pipeline) {
          lines.push(`**Pipeline:** ${archData.data_flow.pipeline}`);
          lines.push("");
        }
        lines.push("| Module | Path | Responsibility | Depends On |");
        lines.push("|---|---|---|---|");
        archData.modules.forEach((mod) => {
          const deps = mod.depends_on?.join(", ") || "-";
          lines.push(
            `| ${mod.id} | \`${mod.path}\` | ${mod.responsibility} | ${deps} |`,
          );
        });
        lines.push("");
        sections.push("architecture");
      }
    } catch {
      // Architecture registry parse failure — skip
    }
  }

  // 6. API Surface
  const apiPath = join(
    projectDir,
    ".mission",
    "interfaces",
    "API_REGISTRY.yaml",
  );
  if (existsSync(apiPath)) {
    try {
      const apiData = parse(readFileSync(apiPath, "utf-8")) as {
        public_api?: {
          functions?: Array<{ name: string; signature: string }>;
        };
      };
      if (apiData?.public_api?.functions) {
        lines.push("## Public API");
        lines.push("");
        apiData.public_api.functions.forEach((fn) => {
          lines.push(`- \`${fn.name}${fn.signature}\``);
        });
        lines.push("");
        sections.push("api");
      }
    } catch {
      // API registry parse failure — skip
    }
  }

  lines.push("---", `*Generated by ms-context — ${new Date().toISOString()}*`);

  return {
    markdown: lines.join("\n"),
    sections,
  };
}
