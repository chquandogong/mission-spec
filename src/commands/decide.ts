// ms-decide — generate a new MDR (Mission Decision Record) draft from
// natural-language inputs. Auto-increments the MDR number by scanning
// .mission/decisions/ and renders the template under .mission/templates/
// with the provided fields, leaving placeholders for missing ones.

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export interface DecideOptions {
  title: string;
  context?: string;
  decision?: string;
  rationale?: string;
  consequences?: string;
  alternatives?: string;
  status?: "Proposed" | "Active" | "Superseded" | "Deprecated";
  version?: string;
  author?: string;
  projectDir: string;
}

export interface DecideResult {
  markdown: string;
  suggestedPath: string;
  nextMdrNumber: number;
  slug: string;
}

const MDR_FILENAME = /^MDR-(\d+)-[\w-]+\.md$/;

function findNextMdrNumber(projectDir: string): number {
  const dir = join(projectDir, ".mission", "decisions");
  if (!existsSync(dir)) return 1;
  const numbers = readdirSync(dir)
    .map((name) => {
      const m = name.match(MDR_FILENAME);
      return m ? parseInt(m[1], 10) : null;
    })
    .filter((n): n is number => typeof n === "number" && !Number.isNaN(n));
  if (numbers.length === 0) return 1;
  return Math.max(...numbers) + 1;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function placeholder(key: string): string {
  switch (key) {
    case "context":
      return "[Why this decision was needed. What situation, what problem?]";
    case "decision":
      return "[What was decided. What was chosen / what was ruled out?]";
    case "rationale":
      return "[Why this decision was made. Core reasoning.]";
    case "consequences":
      return "[Outcomes of this decision — what it enables, what it constrains.]";
    case "alternatives":
      return "[Alternatives considered but not chosen, and why.]";
    default:
      return "[...]";
  }
}

function renderSection(
  heading: string,
  content: string | undefined,
  key: string,
): string {
  const body = content && content.trim() ? content.trim() : placeholder(key);
  return `## ${heading}\n\n${body}\n`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function generateMdrDraft(options: DecideOptions): DecideResult {
  const title = (options.title ?? "").trim();
  if (!title) {
    throw new Error("title is required to generate an MDR draft");
  }

  const nextMdrNumber = findNextMdrNumber(options.projectDir);
  const padded = String(nextMdrNumber).padStart(3, "0");
  const slug = slugify(title);
  const suggestedPath = join(
    ".mission",
    "decisions",
    `MDR-${padded}-${slug}.md`,
  );

  const status = options.status ?? "Proposed";
  const version = options.version ?? "[target version]";
  const author = options.author ?? "[author]";
  const date = todayIso();

  const header = [
    `# MDR-${padded}: ${title}`,
    "",
    `**Date:** ${date}`,
    `**Status:** ${status}`,
    `**Version:** ${version}`,
    `**Author:** ${author}`,
    "",
  ].join("\n");

  const sections = [
    renderSection("Context", options.context, "context"),
    renderSection("Decision", options.decision, "decision"),
    renderSection("Rationale", options.rationale, "rationale"),
    renderSection("Consequences", options.consequences, "consequences"),
    renderSection(
      "Alternatives Considered",
      options.alternatives,
      "alternatives",
    ),
  ].join("\n");

  const footer = [
    "---",
    "",
    "> MDR triggers (refer to `.mission/templates/MDR_TEMPLATE.md` for the full checklist):",
    ">",
    "> 1. `goal` direction changes",
    "> 2. `constraints` policy changes",
    "> 3. `done_when` evaluation philosophy changes",
    "> 4. `evals` ↔ `done_when` linkage changes",
    "> 5. public command surface / naming rule changes",
    "> 6. cross-platform contract changes",
    "",
  ].join("\n");

  const markdown = header + "\n" + sections + "\n" + footer;

  return { markdown, suggestedPath, nextMdrNumber, slug };
}
