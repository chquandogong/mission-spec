import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  mkdirSync,
  appendFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync, spawnSync } from "node:child_process";
import { stringify } from "yaml";

let tempDir: string;

const scriptPath = resolve(
  __dirname,
  "..",
  "..",
  "scripts",
  "validate-history-commits.js",
);

function git(args: string[]) {
  return execFileSync("git", args, {
    cwd: tempDir,
    encoding: "utf-8",
  }).trim();
}

function writeMission(version = "1.0.0") {
  writeFileSync(
    join(tempDir, "mission.yaml"),
    stringify({
      mission: {
        title: "History Validation Test",
        goal: "Keep mission-history linked to git",
        done_when: ["done"],
        version,
      },
    }),
  );
}

function writeHistory(relatedCommits?: string[]) {
  writeFileSync(
    join(tempDir, "mission-history.yaml"),
    stringify({
      meta: {
        mission_id: "history-validation-test",
        tracking_since: "2026-04-14",
        total_revisions: 1,
        latest_version: "1.0.0",
      },
      timeline: [
        {
          change_id: "MSC-2026-04-14-001",
          semantic_version: "1.0.0",
          date: "2026-04-14",
          author: "tester",
          change_type: "enhancement",
          persistence: "permanent",
          intent: "initial entry",
          changes: { added: ["src/core.ts"], modified: [], removed: [] },
          done_when_delta: { added: [], modified: [], removed: [] },
          impact_scope: {},
          breaking: false,
          ...(relatedCommits ? { related_commits: relatedCommits } : {}),
        },
      ],
    }),
  );
}

function commitAll(message: string) {
  git(["add", "."]);
  git(["commit", "-m", message, "--quiet"]);
  return git(["rev-parse", "--short=7", "HEAD"]);
}

function runValidator() {
  return spawnSync("node", [scriptPath], {
    cwd: tempDir,
    encoding: "utf-8",
  });
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "ms-history-commits-"));
  git(["init", "--quiet"]);
  git(["config", "user.name", "Test User"]);
  git(["config", "user.email", "test@example.com"]);
  mkdirSync(join(tempDir, "src"), { recursive: true });
  writeMission();
  writeFileSync(join(tempDir, "src", "core.ts"), "export const value = 1;\n");
  writeHistory();
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("validate-history-commits", () => {
  it("passes when all committed implementation changes are recorded in history", () => {
    commitAll("initial history-backed commit");

    appendFileSync(join(tempDir, "src", "core.ts"), "export const nextValue = 2;\n");
    const implementationSha = commitAll("feat: add next value");

    writeHistory([implementationSha]);
    commitAll("docs: record related commits");

    const result = runValidator();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("mission-history commit 검증 통과");
  });

  it("fails when a committed implementation change is missing from related_commits", () => {
    commitAll("initial history-backed commit");

    appendFileSync(join(tempDir, "src", "core.ts"), "export const nextValue = 2;\n");
    const implementationSha = commitAll("feat: add next value");

    const result = runValidator();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("history에 기록되지 않은 관련 commit");
    expect(result.stderr).toContain(implementationSha);
  });

  it("fails pre-commit style when impactful staged changes exist without mission-history.yaml", () => {
    commitAll("initial history-backed commit");

    appendFileSync(join(tempDir, "src", "core.ts"), "export const stagedOnly = 3;\n");
    git(["add", "src/core.ts"]);

    const result = runValidator();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("mission-history.yaml이 함께 staged되지 않았습니다");
  });

  it("passes staged checks when mission-history.yaml is staged with the impactful changes", () => {
    commitAll("initial history-backed commit");

    appendFileSync(join(tempDir, "src", "core.ts"), "export const stagedOnly = 3;\n");
    writeFileSync(
      join(tempDir, "mission-history.yaml"),
      stringify({
        meta: {
          mission_id: "history-validation-test",
          tracking_since: "2026-04-14",
          total_revisions: 1,
          latest_version: "1.0.0",
        },
        timeline: [
          {
            change_id: "MSC-2026-04-14-001",
            semantic_version: "1.0.0",
            date: "2026-04-14",
            author: "tester",
            change_type: "enhancement",
            persistence: "permanent",
            intent: "initial entry",
            decision: "staged history update present",
            changes: { added: ["src/core.ts"], modified: [], removed: [] },
            done_when_delta: { added: [], modified: [], removed: [] },
            impact_scope: {},
            breaking: false,
          },
        ],
      }),
    );
    git(["add", "src/core.ts", "mission-history.yaml"]);

    const result = runValidator();
    expect(result.status).toBe(0);
  });

  it("allows the latest HEAD commit to change code and mission-history together", () => {
    commitAll("initial history-backed commit");

    appendFileSync(join(tempDir, "src", "core.ts"), "export const headOnly = 4;\n");
    writeFileSync(
      join(tempDir, "mission-history.yaml"),
      stringify({
        meta: {
          mission_id: "history-validation-test",
          tracking_since: "2026-04-14",
          total_revisions: 1,
          latest_version: "1.0.0",
        },
        timeline: [
          {
            change_id: "MSC-2026-04-14-001",
            semantic_version: "1.0.0",
            date: "2026-04-14",
            author: "tester",
            change_type: "enhancement",
            persistence: "permanent",
            intent: "head commit updates code and history together",
            changes: {
              added: ["src/core.ts"],
              modified: ["mission-history.yaml"],
              removed: [],
            },
            done_when_delta: { added: [], modified: [], removed: [] },
            impact_scope: {},
            breaking: false,
          },
        ],
      }),
    );
    git(["add", "src/core.ts", "mission-history.yaml"]);
    git(["commit", "-m", "feat: code and history together", "--quiet"]);

    const result = runValidator();
    expect(result.status).toBe(0);
  });

  it("fails once a code+history commit is no longer HEAD and is still missing from related_commits", () => {
    commitAll("initial history-backed commit");

    appendFileSync(join(tempDir, "src", "core.ts"), "export const headOnly = 4;\n");
    writeFileSync(
      join(tempDir, "mission-history.yaml"),
      stringify({
        meta: {
          mission_id: "history-validation-test",
          tracking_since: "2026-04-14",
          total_revisions: 1,
          latest_version: "1.0.0",
        },
        timeline: [
          {
            change_id: "MSC-2026-04-14-001",
            semantic_version: "1.0.0",
            date: "2026-04-14",
            author: "tester",
            change_type: "enhancement",
            persistence: "permanent",
            intent: "head commit updates code and history together",
            changes: {
              added: ["src/core.ts"],
              modified: ["mission-history.yaml"],
              removed: [],
            },
            done_when_delta: { added: [], modified: [], removed: [] },
            impact_scope: {},
            breaking: false,
          },
        ],
      }),
    );
    git(["add", "src/core.ts", "mission-history.yaml"]);
    const sameCommitSha = commitAll("feat: code and history together");

    writeFileSync(
      join(tempDir, "mission-history.yaml"),
      stringify({
        meta: {
          mission_id: "history-validation-test",
          tracking_since: "2026-04-14",
          total_revisions: 1,
          latest_version: "1.0.0",
        },
        timeline: [
          {
            change_id: "MSC-2026-04-14-001",
            semantic_version: "1.0.0",
            date: "2026-04-14",
            author: "tester",
            change_type: "enhancement",
            persistence: "permanent",
            intent: "later history-only follow-up",
            changes: {
              added: ["src/core.ts"],
              modified: ["mission-history.yaml"],
              removed: [],
            },
            done_when_delta: { added: [], modified: [], removed: [] },
            impact_scope: {},
            breaking: false,
          },
        ],
      }),
    );
    git(["add", "mission-history.yaml"]);
    commitAll("docs: history-only follow-up");

    const result = runValidator();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("history에 기록되지 않은 관련 commit");
    expect(result.stderr).toContain(sameCommitSha);
  });
});
