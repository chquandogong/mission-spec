import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const COMMITTED_RELEVANT_PATHS = [
  "mission.yaml",
  "package.json",
  "README.md",
  ".claude-plugin",
  ".githooks",
  ".mission/CURRENT_STATE.md",
  ".mission/architecture",
  ".mission/interfaces",
  ".mission/traceability",
  ".mission/reconstruction",
  ".mission/evidence",
  ".mission/decisions",
  ".mission/templates",
  "docs/internal",
  "src",
  "skills",
  "scripts",
  "tests",
];

const IMPACTFUL_PATH_PREFIXES = [
  "mission.yaml",
  "package.json",
  "README.md",
  ".claude-plugin/",
  ".githooks/",
  ".mission/CURRENT_STATE.md",
  ".mission/architecture/",
  ".mission/interfaces/",
  ".mission/traceability/",
  ".mission/reconstruction/",
  ".mission/evidence/",
  ".mission/decisions/",
  ".mission/templates/",
  "docs/internal/",
  "src/",
  "skills/",
  "scripts/",
  "tests/",
];

const DERIVED_STAGED_PREFIXES = [".mission/snapshots/", ".mission/evals/"];

function execGit(projectDir, args) {
  return execFileSync("git", args, {
    cwd: projectDir,
    encoding: "utf-8",
  }).trim();
}

function lines(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function unique(items) {
  return [...new Set(items)];
}

function loadHistory(projectDir) {
  const historyPath = join(projectDir, "mission-history.yaml");
  if (!existsSync(historyPath)) return null;
  return parse(readFileSync(historyPath, "utf-8"));
}

function resolveCommit(projectDir, sha) {
  return execGit(projectDir, ["rev-parse", "--verify", `${sha}^{commit}`]);
}

function getCommitTimestamp(projectDir, sha) {
  return Number(execGit(projectDir, ["show", "-s", "--format=%ct", sha]));
}

function getCommitLabel(projectDir, sha) {
  return execGit(projectDir, ["show", "-s", "--format=%h %s", sha]);
}

function getCommitChangedFiles(projectDir, sha) {
  return lines(execGit(projectDir, ["show", "--name-only", "--format=", sha]));
}

function getHeadCommit(projectDir) {
  try {
    return execGit(projectDir, ["rev-parse", "--verify", "HEAD"]);
  } catch {
    return null;
  }
}

function getHistoryBootstrapCommit(projectDir) {
  const commits = lines(
    execGit(projectDir, [
      "log",
      "--diff-filter=A",
      "--format=%H",
      "--",
      "mission-history.yaml",
    ]),
  );
  return commits[0] ?? null;
}

function collectReferencedCommits(projectDir, history) {
  const errors = [];
  const resolvedByCommit = new Map();

  for (const entry of history.timeline ?? []) {
    if (!entry.related_commits) continue;

    let previousTimestamp = -Infinity;
    for (const sha of entry.related_commits) {
      let resolved;
      try {
        resolved = resolveCommit(projectDir, sha);
      } catch {
        errors.push(
          `[${entry.change_id}] related_commits contains non-existent commit: ${sha}`,
        );
        continue;
      }

      if (resolvedByCommit.has(resolved)) {
        errors.push(
          `[${entry.change_id}] duplicate commit in related_commits: ${sha} (already recorded in ${resolvedByCommit.get(resolved)})`,
        );
      } else {
        resolvedByCommit.set(resolved, entry.change_id);
      }

      const timestamp = getCommitTimestamp(projectDir, resolved);
      if (timestamp < previousTimestamp) {
        errors.push(
          `[${entry.change_id}] related_commits must be ordered oldest → newest: ${entry.related_commits.join(", ")}`,
        );
        break;
      }
      previousTimestamp = timestamp;
    }
  }

  return { commits: resolvedByCommit, errors };
}

function collectRelevantGitCommits(projectDir, trackingSince) {
  const args = ["log", "--format=%H"];
  if (trackingSince) {
    args.push(`--since=${trackingSince}T00:00:00`);
  }
  args.push("--", ...COMMITTED_RELEVANT_PATHS);

  const shas = unique(lines(execGit(projectDir, args)));
  const headCommit = getHeadCommit(projectDir);
  const historyBootstrapCommit = getHistoryBootstrapCommit(projectDir);

  return shas.filter((sha) => {
    if (sha === historyBootstrapCommit) {
      return false;
    }

    const changedFiles = getCommitChangedFiles(projectDir, sha);
    return !(
      sha === headCommit && changedFiles.includes("mission-history.yaml")
    );
  });
}

function isImpactfulStagedFile(filePath) {
  if (filePath === "mission-history.yaml") return false;
  if (DERIVED_STAGED_PREFIXES.some((prefix) => filePath.startsWith(prefix))) {
    return false;
  }
  return IMPACTFUL_PATH_PREFIXES.some(
    (prefix) => filePath === prefix || filePath.startsWith(prefix),
  );
}

function collectStagedFiles(projectDir) {
  return lines(execGit(projectDir, ["diff", "--cached", "--name-only", "--"]));
}

export function validateHistoryCommits(projectDir) {
  const history = loadHistory(projectDir);
  if (!history) {
    return {
      valid: true,
      errors: [],
      warnings: ["mission-history.yaml not found"],
    };
  }

  const errors = [];
  const warnings = [];

  const { commits: referencedCommits, errors: referenceErrors } =
    collectReferencedCommits(projectDir, history);
  errors.push(...referenceErrors);

  const relevantGitCommits = collectRelevantGitCommits(
    projectDir,
    history.meta?.tracking_since,
  );

  for (const sha of relevantGitCommits) {
    if (!referencedCommits.has(sha)) {
      errors.push(
        `Relevant commit not recorded in history: ${getCommitLabel(projectDir, sha)}`,
      );
    }
  }

  const stagedFiles = collectStagedFiles(projectDir);
  const impactfulStagedFiles = stagedFiles.filter(isImpactfulStagedFile);
  const historyStaged = stagedFiles.includes("mission-history.yaml");
  if (impactfulStagedFiles.length > 0 && !historyStaged) {
    errors.push(
      `Impactful staged changes found but mission-history.yaml is not staged: ${impactfulStagedFiles.join(", ")}`,
    );
  }

  if (relevantGitCommits.length === 0) {
    warnings.push("No relevant commits to validate.");
  }

  return { valid: errors.length === 0, errors, warnings };
}

function main() {
  const projectDir = process.cwd();

  try {
    execGit(projectDir, ["rev-parse", "--is-inside-work-tree"]);
  } catch {
    console.log("Not a git repository — skipping history commit validation.");
    process.exit(0);
  }

  try {
    const result = validateHistoryCommits(projectDir);
    if (!result.valid) {
      console.error("mission-history commit validation failed:");
      result.errors.forEach((error) => console.error(`- ${error}`));
      process.exit(1);
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach((warning) => console.log(`WARN: ${warning}`));
    }
    console.log("mission-history commit validation passed");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`mission-history commit validation error: ${message}`);
    process.exit(1);
  }
}

if (
  process.argv[1] &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href
) {
  main();
}
