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

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  type Dirent,
} from "node:fs";
import { join, isAbsolute } from "node:path";

export interface ReconstructionResult {
  valid: boolean;
  missing: string[];
  checkedPaths: string[]; // deduplicated list of paths the playbook referenced
}

export interface ReconstructionOptions {
  playbookPath?: string; // default ".mission/reconstruction/REBUILD_PLAYBOOK.md"
}

// Directories to scan recursively when resolving slash-less filenames
// against the repo. Kept conservative: the scan is limited to well-known
// source / doc / asset trees so a slash-less prose word that happens to
// collide with an unrelated file deep inside node_modules or dist is not
// treated as "found". The project root itself is scanned non-recursively
// (top-level files only) in slashlessFileExists. Adopters can rely on
// these conventional locations, or use the full repo-relative path in
// the playbook for anything outside them.
const SLASHLESS_SCAN_ROOTS = [
  "src",
  "scripts",
  "tests",
  "bin",
  "templates",
  "skills",
  ".mission",
  ".claude-plugin",
  ".githooks",
];
const KNOWN_EXTENSIONS =
  /\.(md|ya?ml|json|toml|rs|ts|tsx|js|jsx|mjs|cjs|sh|py|go|rb|lock|txt|conf)$/i;

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

type Classification =
  | { kind: "path"; value: string }
  | { kind: "slashless"; value: string }
  | { kind: "glob"; value: string }
  | { kind: "skip" };

// A conservative heuristic. v1.21.2 §PATCH (Rev.5 Q5 — Gemini):
//   - slash-less filenames with a known extension are now resolved against
//     the repo tree instead of being silently ignored.
//   - glob patterns (*, ?, []) are expanded against the repo tree instead
//     of being silently ignored.
//
// False negatives (missed path mentions) remain acceptable; false positives
// (flagging prose as drift) make the verifier noisy and get disabled.
function classifyToken(token: string): Classification {
  const t = token.trim();
  if (!t) return { kind: "skip" };
  if (isAbsolute(t)) return { kind: "skip" }; // environmental, not repo
  if (/\s/.test(t)) return { kind: "skip" }; // command-like
  if (/[()=<>;,]/.test(t)) return { kind: "skip" }; // code/identifier syntax
  if (t.includes("://")) return { kind: "skip" }; // URL
  if (/[*?[\]]/.test(t)) return { kind: "glob", value: t }; // glob pattern
  if (!t.includes("/")) {
    // Slash-less: only claim this as a repo reference if it has a known
    // code/doc extension AND a non-dot leading character. Dot-prefixed
    // slash-less tokens (`.ts`, `.aider.conf.yml`, `.cursorrules`) are
    // either bare extensions or adopter config patterns documented by
    // name — treat them as prose, not paths. Bare prose words like
    // "Rev.5" or "config" also stay out of the candidate set.
    if (t.startsWith(".")) return { kind: "skip" };
    if (KNOWN_EXTENSIONS.test(t)) return { kind: "slashless", value: t };
    return { kind: "skip" };
  }
  return { kind: "path", value: t };
}

function slashlessFileExists(projectDir: string, filename: string): boolean {
  // 1) top-level file (non-recursive) — matches adopter root conventions
  //    for e.g. README.md, AGENTS.md, opencode.toml.
  if (existsSync(join(projectDir, filename))) return true;
  // 2) recursive scan within the conservative code/test/doc subtrees.
  for (const root of SLASHLESS_SCAN_ROOTS) {
    const rootAbs = join(projectDir, root);
    if (!existsSync(rootAbs)) continue;
    if (scanDirForFilename(rootAbs, filename)) return true;
  }
  return false;
}

// Shallow-recursive scan for an exact filename match. Bail early once a
// match is found. Keeps the scan bounded — we don't descend into node_modules
// or .git, and we don't walk the entire tree every time; each slash-less
// lookup is individually memoized via `presentCache` in the caller.
function scanDirForFilename(root: string, filename: string): boolean {
  const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "coverage"]);
  let entries: Dirent[];
  try {
    entries = readdirSync(root, { withFileTypes: true }) as Dirent[];
  } catch {
    return false;
  }
  for (const entry of entries) {
    if (entry.isFile() && entry.name === filename) return true;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith(".")) continue;
    if (scanDirForFilename(join(root, entry.name), filename)) return true;
  }
  return false;
}

// Minimal glob support — enough to expand patterns like
// `src/commands/*.ts` or `skills/ms-*/SKILL.md`. We split on slashes and
// walk directories, treating '*' as "anything but slash", '?' as "single
// char but slash", and character classes `[abc]` literally. This avoids a
// dependency on fast-glob / minimatch for one internal verifier.
function globHasMatch(projectDir: string, pattern: string): boolean {
  const segments = pattern.split("/").filter((s) => s.length > 0);
  if (segments.length === 0) return false;
  return globWalk(projectDir, segments, 0);
}

function globWalk(baseAbs: string, segments: string[], i: number): boolean {
  if (i >= segments.length) return existsSync(baseAbs);
  const seg = segments[i];
  const isLast = i === segments.length - 1;
  const regex = segmentToRegex(seg);
  let entries: Dirent[];
  try {
    entries = readdirSync(baseAbs, { withFileTypes: true }) as Dirent[];
  } catch {
    return false;
  }
  for (const entry of entries) {
    if (!regex.test(entry.name)) continue;
    const nextAbs = join(baseAbs, entry.name);
    if (isLast) {
      try {
        statSync(nextAbs);
        return true;
      } catch {
        // ignore and keep walking
      }
    } else if (entry.isDirectory()) {
      if (globWalk(nextAbs, segments, i + 1)) return true;
    }
  }
  return false;
}

function segmentToRegex(seg: string): RegExp {
  let out = "^";
  let i = 0;
  while (i < seg.length) {
    const ch = seg[i];
    if (ch === "*") {
      out += "[^/]*";
    } else if (ch === "?") {
      out += "[^/]";
    } else if (ch === "[") {
      const close = seg.indexOf("]", i);
      if (close < 0) {
        out += "\\[";
      } else {
        out += seg.slice(i, close + 1);
        i = close;
      }
    } else if (/[.+^${}()|\\]/.test(ch)) {
      out += "\\" + ch;
    } else {
      out += ch;
    }
    i += 1;
  }
  out += "$";
  return new RegExp(out);
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

  const candidates = new Map<string, Classification>();
  for (const token of tokens) {
    const classification = classifyToken(token);
    if (classification.kind === "skip") continue;
    const normalized =
      classification.kind === "path"
        ? classification.value.replace(/^\.?\//, "")
        : classification.value;
    if (!candidates.has(normalized)) {
      candidates.set(normalized, { ...classification, value: normalized });
    }
  }

  const missing: string[] = [];
  const checkedPaths: string[] = [];
  for (const [candidate, classification] of candidates) {
    checkedPaths.push(candidate);
    let present = false;
    if (classification.kind === "path") {
      present = existsSync(join(projectDir, candidate));
    } else if (classification.kind === "slashless") {
      present = slashlessFileExists(projectDir, candidate);
    } else if (classification.kind === "glob") {
      present = globHasMatch(projectDir, candidate);
    }
    if (!present) missing.push(candidate);
  }

  return {
    valid: missing.length === 0,
    missing: missing.sort(),
    checkedPaths: checkedPaths.sort(),
  };
}
