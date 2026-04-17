// Reconstruction verifier — checks that .mission/reconstruction/REBUILD_PLAYBOOK.md
// refers to only files and paths that actually exist in the current repo.
// Catches the common drift where the playbook lists a long-gone src/ module
// or an unreachable .mission/ path.
//
// The deeper sense of "reconstruction" — rebuilding from scratch following
// the playbook — is not fully mechanizable in one script, so this verifier
// covers the tractable half (reference integrity). A cold-build mode is
// available at the CLI (npm ci + build + test in a temp dir) for extra
// confidence, but it is opt-in because it takes tens of seconds.

import { existsSync, readFileSync } from "node:fs";
import { join, isAbsolute } from "node:path";

export interface ReconstructionResult {
  valid: boolean;
  missing: string[];
  checkedPaths: string[]; // deduplicated list of paths the playbook referenced
}

export interface ReconstructionOptions {
  playbookPath?: string; // default ".mission/reconstruction/REBUILD_PLAYBOOK.md"
}

// Matches `foo` inline spans, but excludes content inside ```fenced blocks```.
function extractInlineBackticks(markdown: string): string[] {
  const lines = markdown.split("\n");
  let inFence = false;
  const out: string[] = [];
  for (const line of lines) {
    const fenceMatch = /^(\s*)(```+)/.exec(line);
    if (fenceMatch) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const re = /`([^`]+)`/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line))) {
      out.push(m[1]);
    }
  }
  return out;
}

// A conservative heuristic: a token is treated as a repo path only if it
// contains a slash (so bare filenames like "parser.ts" in prose are ignored),
// is not absolute, contains no whitespace / code syntax / URL scheme, and
// contains no glob metacharacters (skills/ms-*/SKILL.md is glob, not a path).
// False negatives (missed path mentions) are acceptable; false positives
// (flagging prose as drift) make the verifier noisy and get disabled.
function looksLikeRepoPath(token: string): boolean {
  const t = token.trim();
  if (!t) return false;
  if (!t.includes("/")) return false; // bare filenames are prose
  if (isAbsolute(t)) return false; // environmental, not repo
  if (/\s/.test(t)) return false; // command-like
  if (/[()=<>;,]/.test(t)) return false; // code/identifier syntax
  if (t.includes("://")) return false; // URL
  if (/[*?\[\]]/.test(t)) return false; // glob pattern, not a concrete path
  return true;
}

export function verifyReconstructionReferences(
  projectDir: string,
  options: ReconstructionOptions = {},
): ReconstructionResult {
  const relPlaybook =
    options.playbookPath ?? ".mission/reconstruction/REBUILD_PLAYBOOK.md";
  const playbookPath = join(projectDir, relPlaybook);
  if (!existsSync(playbookPath)) {
    throw new Error(`REBUILD_PLAYBOOK.md not found at ${playbookPath}`);
  }

  const content = readFileSync(playbookPath, "utf-8");
  const tokens = extractInlineBackticks(content);

  const candidates = new Set<string>();
  for (const token of tokens) {
    if (looksLikeRepoPath(token)) {
      candidates.add(token.replace(/^\.?\//, ""));
    }
  }

  const missing: string[] = [];
  const checkedPaths: string[] = [];
  for (const candidate of candidates) {
    checkedPaths.push(candidate);
    if (!existsSync(join(projectDir, candidate))) {
      missing.push(candidate);
    }
  }

  return {
    valid: missing.length === 0,
    missing: missing.sort(),
    checkedPaths: checkedPaths.sort(),
  };
}
