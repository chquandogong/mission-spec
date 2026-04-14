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
  return text.split("\n").map((line) => line.trim()).filter(Boolean);
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
          `[${entry.change_id}] related_commits에 존재하지 않는 commit이 있습니다: ${sha}`,
        );
        continue;
      }

      if (resolvedByCommit.has(resolved)) {
        errors.push(
          `[${entry.change_id}] related_commits 중복 commit: ${sha} (이미 ${resolvedByCommit.get(resolved)}에 기록됨)`,
        );
      } else {
        resolvedByCommit.set(resolved, entry.change_id);
      }

      const timestamp = getCommitTimestamp(projectDir, resolved);
      if (timestamp < previousTimestamp) {
        errors.push(
          `[${entry.change_id}] related_commits 순서는 오래된 커밋 → 최신 커밋이어야 합니다: ${entry.related_commits.join(", ")}`,
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

  return shas.filter((sha) => {
    const changedFiles = getCommitChangedFiles(projectDir, sha);
    return !changedFiles.includes("mission-history.yaml");
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
    return { valid: true, errors: [], warnings: ["mission-history.yaml 없음"] };
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
      errors.push(`history에 기록되지 않은 관련 commit: ${getCommitLabel(projectDir, sha)}`);
    }
  }

  const stagedFiles = collectStagedFiles(projectDir);
  const impactfulStagedFiles = stagedFiles.filter(isImpactfulStagedFile);
  const historyStaged = stagedFiles.includes("mission-history.yaml");
  if (impactfulStagedFiles.length > 0 && !historyStaged) {
    errors.push(
      `계약/구조 관련 staged 변경이 있지만 mission-history.yaml이 함께 staged되지 않았습니다: ${impactfulStagedFiles.join(", ")}`,
    );
  }

  if (relevantGitCommits.length === 0) {
    warnings.push("검사 대상 commit이 없습니다.");
  }

  return { valid: errors.length === 0, errors, warnings };
}

function main() {
  const projectDir = process.cwd();

  try {
    execGit(projectDir, ["rev-parse", "--is-inside-work-tree"]);
  } catch {
    console.log("Git 저장소가 아니므로 history commit 검증을 건너뜁니다.");
    process.exit(0);
  }

  try {
    const result = validateHistoryCommits(projectDir);
    if (!result.valid) {
      console.error("mission-history commit 검증 실패:");
      result.errors.forEach((error) => console.error(`- ${error}`));
      process.exit(1);
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach((warning) => console.log(`WARN: ${warning}`));
    }
    console.log("mission-history commit 검증 통과");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`mission-history commit 검증 중 오류: ${message}`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main();
}
