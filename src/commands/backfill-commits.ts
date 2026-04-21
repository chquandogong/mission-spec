// ms-backfill-commits — scan empty related_commits arrays and propose git SHAs.
// Pure function; dry-run by default, `{ apply: true }` writes in-place via
// regex-based text replacement (preserves YAML comments and formatting).
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { loadHistory } from "../core/history.js";

export interface CommitCandidate {
  sha: string;
  subject: string;
  date: string;
}

export interface BackfillProposal {
  change_id: string;
  revision_date: string;
  semantic_version: string;
  candidates: CommitCandidate[];
  status: "auto-apply" | "ambiguous" | "no-candidates";
}

export interface BackfillResult {
  proposals: BackfillProposal[];
  applied: number;
  skipped: number;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function enumerateCommits(projectDir: string): CommitCandidate[] {
  let out: string;
  try {
    out = execFileSync("git", ["log", "--format=%h%x09%cs%x09%s"], {
      cwd: projectDir,
      encoding: "utf-8",
    });
  } catch {
    // git log failed — empty repo, not a git repo, or git not installed.
    // Gracefully degrade: no candidates for any entry.
    return [];
  }
  return out
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [sha, date, ...rest] = line.split("\t");
      return { sha, date, subject: rest.join("\t") };
    });
}

export function backfillRelatedCommits(
  projectDir: string,
  options: { apply?: boolean } = {},
): BackfillResult {
  const history = loadHistory(projectDir);
  if (!history) {
    throw new Error(
      `mission-spec backfill-commits: mission-history.yaml not found in ${projectDir}`,
    );
  }

  const commits = enumerateCommits(projectDir);

  const proposals: BackfillProposal[] = [];
  for (const entry of history.timeline ?? []) {
    if (!Array.isArray(entry.related_commits)) continue;
    if (entry.related_commits.length > 0) continue;

    const start = addDays(entry.date, -1);
    const end = addDays(entry.date, 1);
    const candidates = commits.filter((c) => c.date >= start && c.date <= end);
    const status: BackfillProposal["status"] =
      candidates.length === 1
        ? "auto-apply"
        : candidates.length === 0
          ? "no-candidates"
          : "ambiguous";
    proposals.push({
      change_id: entry.change_id,
      revision_date: entry.date,
      semantic_version: entry.semantic_version,
      candidates,
      status,
    });
  }

  let applied = 0;
  const skipped = proposals.filter((p) => p.status !== "auto-apply").length;

  if (options.apply) {
    const historyPath = join(projectDir, "mission-history.yaml");
    let text = readFileSync(historyPath, "utf-8");
    for (const p of proposals) {
      if (p.status !== "auto-apply") continue;
      // Tolerate YAML serializer variations: optional list-item prefix, optional
      // quote style, any indentation. change_id must be on its own line.
      const escapedId = p.change_id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const anchorPattern = new RegExp(
        `^\\s*-?\\s*change_id:\\s*["']?${escapedId}["']?\\s*$`,
        "m",
      );
      const anchorMatch = text.match(anchorPattern);
      if (!anchorMatch || anchorMatch.index === undefined) continue;
      const anchorIdx = anchorMatch.index;
      // Find nearest subsequent related_commits: [] line (any indentation).
      const region = text.slice(anchorIdx, anchorIdx + 2048);
      const emptyPattern = /^(\s*)related_commits:\s*\[\]\s*$/m;
      const match = region.match(emptyPattern);
      if (!match || match.index === undefined) continue;
      const indent = match[1];
      const replacement = `${indent}related_commits: ["${p.candidates[0].sha}"]`;
      const absoluteIdx = anchorIdx + match.index;
      text =
        text.slice(0, absoluteIdx) +
        replacement +
        text.slice(absoluteIdx + match[0].length);
      applied++;
    }
    writeFileSync(historyPath, text);
  }

  return { proposals, applied, skipped };
}
