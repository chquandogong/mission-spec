import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { stringify } from "yaml";

const projectRoot = resolve(__dirname, "..", "..");
const binPath = join(projectRoot, "bin", "mission-spec.js");

let tempDir: string;

function writeFile(rel: string, body: string) {
  const full = join(tempDir, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, body);
}

function writeMission() {
  writeFile(
    "mission.yaml",
    stringify({
      mission: {
        title: "CLI Fixture",
        goal: "test cli",
        done_when: ["skills/ms-init/SKILL.md exists"],
        version: "1.0.0",
      },
    }),
  );
}

function runCli(args: string[], opts: { expectFail?: boolean } = {}) {
  try {
    return execFileSync("node", [binPath, ...args], {
      cwd: tempDir,
      encoding: "utf-8",
      stdio: "pipe",
    });
  } catch (e: unknown) {
    if (opts.expectFail) {
      return (
        ((e as { stdout?: string }).stdout ?? "") +
        ((e as { stderr?: string }).stderr ?? "")
      );
    }
    throw e;
  }
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "ms-cli-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("mission-spec CLI", () => {
  it("prints help when invoked with no args", () => {
    const output = runCli([], { expectFail: true });
    expect(output).toContain("mission-spec");
    expect(output).toContain("context");
    expect(output).toContain("status");
    expect(output).toContain("eval");
  });

  it("prints help with --help", () => {
    const output = runCli(["--help"]);
    expect(output).toContain("Usage");
    expect(output).toContain("context");
  });

  it("prints version with --version", () => {
    const output = runCli(["--version"]);
    expect(output).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("`context .` prints the generated context markdown", () => {
    writeMission();
    mkdirSync(join(tempDir, "skills/ms-init"), { recursive: true });
    writeFile("skills/ms-init/SKILL.md", "# ms-init\n");

    const output = runCli(["context", "."]);
    expect(output).toContain("# Project Context");
    expect(output).toContain("CLI Fixture");
  });

  it("`context` defaults projectDir to cwd", () => {
    writeMission();
    mkdirSync(join(tempDir, "skills/ms-init"), { recursive: true });
    writeFile("skills/ms-init/SKILL.md", "# ms-init\n");

    const output = runCli(["context"]);
    expect(output).toContain("# Project Context");
    expect(output).toContain("CLI Fixture");
  });

  it("`status .` prints a progress summary", () => {
    writeMission();
    mkdirSync(join(tempDir, "skills/ms-init"), { recursive: true });
    writeFile("skills/ms-init/SKILL.md", "# ms-init\n");

    const output = runCli(["status", "."]);
    expect(output).toContain("CLI Fixture");
    expect(output.toLowerCase()).toMatch(/goal|done/);
  });

  it("`eval .` prints the done_when evaluation result", () => {
    writeMission();
    mkdirSync(join(tempDir, "skills/ms-init"), { recursive: true });
    writeFile("skills/ms-init/SKILL.md", "# ms-init\n");

    const output = runCli(["eval", "."]);
    expect(output).toMatch(/\d+\/\d+ criteria passed/);
  });

  it("exits non-zero on unknown subcommand", () => {
    const output = runCli(["not-a-command"], { expectFail: true });
    expect(output).toContain("not-a-command");
  });

  it("validate subcommand exits 0 with 'schema valid' line on a valid project", () => {
    writeMission();
    const out = runCli(["validate"]);
    expect(out).toContain("mission-spec: schema valid");
    expect(out).toContain("mission.yaml");
  });

  it("validate subcommand exits 1 with 'schema INVALID' on a schema-broken mission.yaml", () => {
    writeFile(
      "mission.yaml",
      stringify({ mission: { title: "missing goal + done_when" } }),
    );
    const combined = runCli(["validate"], { expectFail: true });
    expect(combined).toContain("mission-spec: schema INVALID");
    expect(combined).toContain("mission.yaml:");
  });

  it("snapshot subcommand exits 0 and prints 'snapshot created' on a valid project", () => {
    writeMission();
    const out = runCli(["snapshot"]);
    expect(out).toContain("mission-spec: snapshot created");
    expect(out).toMatch(/\d{4}-\d{2}-\d{2}_v1\.0\.0_mission\.yaml/);
  });

  it("backfill-commits dry-run prints proposals on a git-initialized project", () => {
    writeMission();
    execFileSync("git", ["init", "-q"], { cwd: tempDir });
    execFileSync("git", ["config", "user.email", "t@t"], { cwd: tempDir });
    execFileSync("git", ["config", "user.name", "T"], { cwd: tempDir });
    execFileSync("git", ["config", "commit.gpgsign", "false"], {
      cwd: tempDir,
    });
    writeFile("work.txt", "x");
    execFileSync("git", ["add", "."], { cwd: tempDir });
    const iso = "2026-01-01T12:00:00+00:00";
    execFileSync("git", ["commit", "-q", "-m", "feat: v1.0.0 — foo"], {
      cwd: tempDir,
      env: {
        ...process.env,
        GIT_AUTHOR_DATE: iso,
        GIT_COMMITTER_DATE: iso,
      },
    });
    writeFile(
      "mission-history.yaml",
      stringify({
        meta: {
          mission_id: "t",
          total_revisions: 1,
          latest_version: "1.0.0",
        },
        timeline: [
          {
            change_id: "MSC-2026-01-01-001",
            semantic_version: "1.0.0",
            change_sequence: 1,
            date: "2026-01-01",
            author: "t",
            change_type: "feature",
            persistence: "permanent",
            intent: "x",
            changes: { added: [], modified: [], removed: [] },
            done_when_delta: { added: [], modified: [], removed: [] },
            impact_scope: {},
            breaking: false,
            related_commits: [],
          },
        ],
      }),
    );
    const out = runCli(["backfill-commits"]);
    expect(out).toContain("Scanning mission-history.yaml");
    expect(out).toContain("AUTO-APPLY");
  });
});
