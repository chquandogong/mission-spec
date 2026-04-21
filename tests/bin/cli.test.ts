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
});
