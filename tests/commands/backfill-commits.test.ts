import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { stringify } from "yaml";
import { backfillRelatedCommits } from "../../src/commands/backfill-commits.js";

let tempDir: string;

function gitInit() {
  execFileSync("git", ["init", "-q"], { cwd: tempDir });
  execFileSync("git", ["config", "user.email", "t@t"], { cwd: tempDir });
  execFileSync("git", ["config", "user.name", "T"], { cwd: tempDir });
  execFileSync("git", ["config", "commit.gpgsign", "false"], { cwd: tempDir });
}

function commitAt(date: string, subject: string, marker: string) {
  writeFileSync(join(tempDir, `f-${marker}`), marker);
  execFileSync("git", ["add", "."], { cwd: tempDir });
  const iso = `${date}T12:00:00+00:00`;
  execFileSync("git", ["commit", "-q", "-m", subject], {
    cwd: tempDir,
    env: {
      ...process.env,
      GIT_AUTHOR_DATE: iso,
      GIT_COMMITTER_DATE: iso,
    },
  });
  return execFileSync("git", ["rev-parse", "--short=7", "HEAD"], {
    cwd: tempDir,
    encoding: "utf-8",
  }).trim();
}

function writeHistory(
  entries: Array<{
    change_id: string;
    date: string;
    semantic_version: string;
    related_commits?: string[];
  }>,
) {
  const timeline = entries.map((e) => ({
    change_id: e.change_id,
    semantic_version: e.semantic_version,
    change_sequence: 1,
    date: e.date,
    author: "t",
    change_type: "feature",
    persistence: "permanent",
    intent: "x",
    changes: { added: [], modified: [], removed: [] },
    done_when_delta: { added: [], modified: [], removed: [] },
    impact_scope: {},
    breaking: false,
    related_commits: e.related_commits ?? [],
  }));
  writeFileSync(
    join(tempDir, "mission-history.yaml"),
    stringify({
      meta: {
        mission_id: "t",
        total_revisions: entries.length,
        latest_version: entries[0]?.semantic_version ?? "1.0.0",
      },
      timeline,
    }),
  );
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "ms-backfill-"));
  gitInit();
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("backfillRelatedCommits", () => {
  it("returns empty proposals when timeline is empty", () => {
    writeHistory([]);
    const r = backfillRelatedCommits(tempDir);
    expect(r.proposals).toEqual([]);
    expect(r.applied).toBe(0);
    expect(r.skipped).toBe(0);
  });

  it("skips entries that already have non-empty related_commits", () => {
    commitAt("2026-04-10", "feat: v1.0.0 — foo", "a");
    writeHistory([
      {
        change_id: "MSC-2026-04-10-001",
        date: "2026-04-10",
        semantic_version: "1.0.0",
        related_commits: ["abc1234"],
      },
    ]);
    const r = backfillRelatedCommits(tempDir);
    expect(r.proposals).toEqual([]);
  });

  it("classifies single matching commit as auto-apply", () => {
    const sha = commitAt("2026-04-10", "feat: v1.0.0 — foo", "a");
    writeHistory([
      {
        change_id: "MSC-2026-04-10-001",
        date: "2026-04-10",
        semantic_version: "1.0.0",
      },
    ]);
    const r = backfillRelatedCommits(tempDir);
    expect(r.proposals).toHaveLength(1);
    expect(r.proposals[0].status).toBe("auto-apply");
    expect(r.proposals[0].candidates).toHaveLength(1);
    expect(r.proposals[0].candidates[0].sha).toBe(sha);
  });

  it("classifies 3 matches in window as ambiguous", () => {
    commitAt("2026-04-09", "feat: v1.0.0 — first", "a");
    commitAt("2026-04-10", "feat: v1.0.0 — second", "b");
    commitAt("2026-04-11", "feat: v1.0.0 — third", "c");
    writeHistory([
      {
        change_id: "MSC-2026-04-10-001",
        date: "2026-04-10",
        semantic_version: "1.0.0",
      },
    ]);
    const r = backfillRelatedCommits(tempDir);
    expect(r.proposals).toHaveLength(1);
    expect(r.proposals[0].status).toBe("ambiguous");
    expect(r.proposals[0].candidates).toHaveLength(3);
  });

  it("classifies 0 matches as no-candidates", () => {
    commitAt("2026-04-05", "feat: v0.9.0 — unrelated", "a");
    writeHistory([
      {
        change_id: "MSC-2026-04-20-001",
        date: "2026-04-20",
        semantic_version: "1.0.0",
      },
    ]);
    const r = backfillRelatedCommits(tempDir);
    expect(r.proposals).toHaveLength(1);
    expect(r.proposals[0].status).toBe("no-candidates");
    expect(r.proposals[0].candidates).toHaveLength(0);
  });

  it("matches commit dated 1 day BEFORE revision date (window lower bound)", () => {
    const sha = commitAt("2026-04-09", "feat: v1.0.0 — day-before", "a");
    writeHistory([
      {
        change_id: "MSC-2026-04-10-001",
        date: "2026-04-10",
        semantic_version: "1.0.0",
      },
    ]);
    const r = backfillRelatedCommits(tempDir);
    expect(r.proposals[0].status).toBe("auto-apply");
    expect(r.proposals[0].candidates[0].sha).toBe(sha);
  });

  it("matches commit dated 1 day AFTER revision date (window upper bound)", () => {
    const sha = commitAt("2026-04-11", "feat: v1.0.0 — day-after", "a");
    writeHistory([
      {
        change_id: "MSC-2026-04-10-001",
        date: "2026-04-10",
        semantic_version: "1.0.0",
      },
    ]);
    const r = backfillRelatedCommits(tempDir);
    expect(r.proposals[0].status).toBe("auto-apply");
    expect(r.proposals[0].candidates[0].sha).toBe(sha);
  });

  it("apply mode writes single-candidate SHA into the file", () => {
    const sha = commitAt("2026-04-10", "feat: v1.0.0 — foo", "a");
    writeHistory([
      {
        change_id: "MSC-2026-04-10-001",
        date: "2026-04-10",
        semantic_version: "1.0.0",
      },
    ]);
    const before = readFileSync(join(tempDir, "mission-history.yaml"), "utf-8");
    expect(before).toContain("related_commits: []");
    const r = backfillRelatedCommits(tempDir, { apply: true });
    expect(r.applied).toBe(1);
    const after = readFileSync(join(tempDir, "mission-history.yaml"), "utf-8");
    expect(after).toContain(`related_commits: ["${sha}"]`);
    expect(after).not.toContain("related_commits: []");
  });

  it("apply mode does NOT write ambiguous entries (safety)", () => {
    commitAt("2026-04-09", "feat: v1.0.0 — first", "a");
    commitAt("2026-04-10", "feat: v1.0.0 — second", "b");
    writeHistory([
      {
        change_id: "MSC-2026-04-10-001",
        date: "2026-04-10",
        semantic_version: "1.0.0",
      },
    ]);
    const r = backfillRelatedCommits(tempDir, { apply: true });
    expect(r.applied).toBe(0);
    expect(r.skipped).toBe(1);
    const after = readFileSync(join(tempDir, "mission-history.yaml"), "utf-8");
    expect(after).toContain("related_commits: []");
  });
});
