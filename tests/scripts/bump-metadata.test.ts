import { describe, expect, test as base } from "vitest";
import {
  mkdtempSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const scriptPath = resolve(
  __dirname,
  "..",
  "..",
  "scripts",
  "bump-metadata.js",
);

interface Fixture {
  tempDir: string;
  runScript: (args?: string[]) => Promise<string>;
  writePkg: (version: string) => void;
  writeMission: (relPath: string, content: string) => void;
  writeMissionYaml: (title: string) => void;
}

const it = base.extend<{ fx: Fixture }>({
  fx: async ({}, use) => {
    const tempDir = mkdtempSync(join(tmpdir(), "ms-bumpmeta-"));
    const writePkg = (version: string) => {
      writeFileSync(
        join(tempDir, "package.json"),
        JSON.stringify({ name: "fixture", version }, null, 2),
      );
    };
    const writeMission = (relPath: string, content: string) => {
      const full = join(tempDir, ".mission", relPath);
      mkdirSync(resolve(full, ".."), { recursive: true });
      writeFileSync(full, content);
    };
    const fx: Fixture = {
      tempDir,
      runScript: async (args: string[] = []): Promise<string> => {
        const { stdout } = await execFileAsync("node", [scriptPath, ...args], {
          cwd: tempDir,
          encoding: "utf-8",
        });
        return stdout;
      },
      writePkg,
      writeMission,
      writeMissionYaml: (title: string) => {
        writeFileSync(
          join(tempDir, "mission.yaml"),
          [
            "mission:",
            `  title: "${title}"`,
            `  version: "1.15.0"`,
            "  goal: x",
            "  done_when: []",
            "",
          ].join("\n"),
        );
      },
    };
    await use(fx);
    rmSync(tempDir, { recursive: true, force: true });
  },
});

describe.concurrent("bump-metadata script", () => {
  it("dry-run (no flag) reports drift without writing", async ({ fx }) => {
    fx.writePkg("1.15.0");
    fx.writeMission(
      "CURRENT_STATE.md",
      "> Last updated: 2026-04-17 | Version: 1.14.0\n\nbody\n",
    );

    const stdout = await fx.runScript();
    expect(stdout).toContain("Would update");
    expect(stdout).toContain("1.14.0 → 1.15.0");
    expect(stdout).toContain(".mission/CURRENT_STATE.md");

    const content = readFileSync(
      join(fx.tempDir, ".mission/CURRENT_STATE.md"),
      "utf-8",
    );
    expect(content).toContain("1.14.0");
    expect(content).not.toContain("1.15.0");
  });

  it("--apply rewrites drifted Version headers across .md and .yaml files", async ({
    fx,
  }) => {
    fx.writePkg("1.15.0");
    fx.writeMission(
      "CURRENT_STATE.md",
      "> Last updated: 2026-04-17 | Version: 1.14.0\n",
    );
    fx.writeMission(
      "interfaces/API_REGISTRY.yaml",
      "# Last updated: 2026-04-17 | Version: 1.14.1\n\npublic_api: {}\n",
    );
    fx.writeMission(
      "reconstruction/REBUILD_PLAYBOOK.md",
      "> Last updated: 2026-04-17 | Version: 1.14.2\n",
    );

    await fx.runScript(["--apply"]);

    expect(
      readFileSync(join(fx.tempDir, ".mission/CURRENT_STATE.md"), "utf-8"),
    ).toContain("Version: 1.15.0");
    expect(
      readFileSync(
        join(fx.tempDir, ".mission/interfaces/API_REGISTRY.yaml"),
        "utf-8",
      ),
    ).toContain("Version: 1.15.0");
    expect(
      readFileSync(
        join(fx.tempDir, ".mission/reconstruction/REBUILD_PLAYBOOK.md"),
        "utf-8",
      ),
    ).toContain("Version: 1.15.0");
  });

  it("--check exits 0 when every .mission/ header matches package.json", async ({
    fx,
  }) => {
    fx.writePkg("1.15.0");
    fx.writeMission("CURRENT_STATE.md", "> Version: 1.15.0\n");
    fx.writeMission("interfaces/API_REGISTRY.yaml", "# Version: 1.15.0\n");

    const stdout = await fx.runScript(["--check"]);
    expect(stdout).toContain("in sync");
  });

  it("--check exits 1 on drift", async ({ fx }) => {
    fx.writePkg("1.15.0");
    fx.writeMission("CURRENT_STATE.md", "> Version: 1.14.0\n");

    await expect(fx.runScript(["--check"])).rejects.toThrow();
  });

  it("is idempotent — second --apply reports no changes", async ({ fx }) => {
    fx.writePkg("1.15.0");
    fx.writeMission("CURRENT_STATE.md", "> Version: 1.14.0\n");

    await fx.runScript(["--apply"]);
    const second = await fx.runScript(["--apply"]);
    expect(second).toContain("No changes needed");
  });

  it("skips files without a Version header", async ({ fx }) => {
    fx.writePkg("1.15.0");
    fx.writeMission(
      "decisions/MDR-099-test.md",
      "# MDR-099: Test\n\nNo header here.\n",
    );

    const stdout = await fx.runScript();
    expect(stdout).toContain("No changes needed");
  });

  it("only touches .md and .yaml files (skips .txt, .json, etc.)", async ({
    fx,
  }) => {
    fx.writePkg("1.15.0");
    fx.writeMission("notes.txt", "Version: 1.14.0\n"); // .txt — ignored
    fx.writeMission("data.json", '{"version":"1.14.0"}\n'); // .json — ignored
    fx.writeMission("real.md", "> Version: 1.14.0\n"); // .md — picked up

    await fx.runScript(["--apply"]);

    expect(
      readFileSync(join(fx.tempDir, ".mission/notes.txt"), "utf-8"),
    ).toContain("1.14.0"); // untouched
    expect(
      readFileSync(join(fx.tempDir, ".mission/data.json"), "utf-8"),
    ).toContain("1.14.0"); // untouched
    expect(
      readFileSync(join(fx.tempDir, ".mission/real.md"), "utf-8"),
    ).toContain("Version: 1.15.0");
  });

  it("errors when package.json.version is not a valid semver triplet", async ({
    fx,
  }) => {
    fx.writePkg("not-a-version");
    fx.writeMission("CURRENT_STATE.md", "> Version: 1.14.0\n");

    await expect(fx.runScript()).rejects.toThrow();
  });

  it("handles absence of .mission/ directory gracefully (no-op)", async ({
    fx,
  }) => {
    fx.writePkg("1.15.0");
    // no .mission/ at all

    const stdout = await fx.runScript();
    expect(stdout).toContain("No changes needed");
  });

  it("skips .mission/decisions/ — MDR Version fields are historical records", async ({
    fx,
  }) => {
    fx.writePkg("1.15.0");
    // MDR style body, mirrors real MDR-001 etc.
    fx.writeMission(
      "decisions/MDR-001-example.md",
      "# MDR-001: Example\n\n**Date:** 2026-04-02\n**Version:** 1.0.0\n",
    );

    await fx.runScript(["--apply"]);

    const body = readFileSync(
      join(fx.tempDir, ".mission/decisions/MDR-001-example.md"),
      "utf-8",
    );
    // MDR version must not be rewritten to current package.json version
    expect(body).toContain("**Version:** 1.0.0");
    expect(body).not.toContain("Version: 1.15.0");
  });

  it("skips .mission/snapshots/ and .mission/templates/ (historical + placeholder)", async ({
    fx,
  }) => {
    fx.writePkg("1.15.0");
    fx.writeMission(
      "snapshots/2026-04-02_v1.0.0_mission.yaml",
      "# Version: 1.0.0\nmission: {}\n",
    );
    fx.writeMission(
      "templates/MDR_TEMPLATE.md",
      "**Version:** X.Y.Z (placeholder)\n",
    );

    await fx.runScript(["--apply"]);

    expect(
      readFileSync(
        join(fx.tempDir, ".mission/snapshots/2026-04-02_v1.0.0_mission.yaml"),
        "utf-8",
      ),
    ).toContain("# Version: 1.0.0");
    expect(
      readFileSync(
        join(fx.tempDir, ".mission/templates/MDR_TEMPLATE.md"),
        "utf-8",
      ),
    ).toContain("**Version:** X.Y.Z");
  });

  it("--apply rewrites drifted Title line in CURRENT_STATE.md (E-6)", async ({
    fx,
  }) => {
    fx.writePkg("1.15.0");
    fx.writeMissionYaml("Mission Spec v1.15.0 — Fresh");
    fx.writeMission(
      "CURRENT_STATE.md",
      [
        "# Current State",
        "",
        "> Version: 1.15.0",
        "",
        "- **Title:** Mission Spec v1.14.0 — Stale",
        "",
      ].join("\n"),
    );

    await fx.runScript(["--apply"]);

    const body = readFileSync(
      join(fx.tempDir, ".mission/CURRENT_STATE.md"),
      "utf-8",
    );
    expect(body).toContain("- **Title:** Mission Spec v1.15.0 — Fresh");
    expect(body).not.toContain("Mission Spec v1.14.0 — Stale");
  });

  it("--check exits 1 when Title line drifts from mission.yaml (E-6)", async ({
    fx,
  }) => {
    fx.writePkg("1.15.0");
    fx.writeMissionYaml("Mission Spec v1.15.0 — Fresh");
    fx.writeMission(
      "CURRENT_STATE.md",
      [
        "> Version: 1.15.0",
        "- **Title:** Mission Spec v1.14.0 — Stale",
        "",
      ].join("\n"),
    );

    await expect(fx.runScript(["--check"])).rejects.toThrow();
  });

  it("--apply updates both Title and Version in a single pass (E-6)", async ({
    fx,
  }) => {
    fx.writePkg("1.16.0");
    fx.writeMissionYaml("Mission Spec v1.16.0 — Bump");
    fx.writeMission(
      "CURRENT_STATE.md",
      ["> Version: 1.14.0", "- **Title:** Mission Spec v1.14.0 — Old", ""].join(
        "\n",
      ),
    );

    const stdout = await fx.runScript(["--apply"]);
    expect(stdout).toContain("Version: 1.14.0 → 1.16.0");
    expect(stdout).toContain("Title:");

    const body = readFileSync(
      join(fx.tempDir, ".mission/CURRENT_STATE.md"),
      "utf-8",
    );
    expect(body).toContain("Version: 1.16.0");
    expect(body).toContain("- **Title:** Mission Spec v1.16.0 — Bump");
  });

  it("graceful when mission.yaml is absent — Version sync still works (E-6)", async ({
    fx,
  }) => {
    fx.writePkg("1.15.0");
    // no mission.yaml
    fx.writeMission(
      "CURRENT_STATE.md",
      ["> Version: 1.14.0", "- **Title:** anything goes", ""].join("\n"),
    );

    await fx.runScript(["--apply"]);
    const body = readFileSync(
      join(fx.tempDir, ".mission/CURRENT_STATE.md"),
      "utf-8",
    );
    expect(body).toContain("Version: 1.15.0");
    // Title untouched because mission.yaml was not available
    expect(body).toContain("- **Title:** anything goes");
  });

  it("graceful when CURRENT_STATE.md has no Title line — no error (E-6)", async ({
    fx,
  }) => {
    fx.writePkg("1.15.0");
    fx.writeMissionYaml("Mission Spec v1.15.0 — Fresh");
    fx.writeMission(
      "CURRENT_STATE.md",
      "> Version: 1.14.0\nno title line here\n",
    );

    await fx.runScript(["--apply"]);
    const body = readFileSync(
      join(fx.tempDir, ".mission/CURRENT_STATE.md"),
      "utf-8",
    );
    expect(body).toContain("Version: 1.15.0");
    // No Title line to update; file should still be valid
  });

  it("leaves Title line unchanged when already matching (E-6)", async ({
    fx,
  }) => {
    fx.writePkg("1.15.0");
    fx.writeMissionYaml("Mission Spec v1.15.0 — Match");
    fx.writeMission(
      "CURRENT_STATE.md",
      [
        "> Version: 1.15.0",
        "- **Title:** Mission Spec v1.15.0 — Match",
        "",
      ].join("\n"),
    );

    const stdout = await fx.runScript(["--apply"]);
    expect(stdout).toContain("No changes needed");
  });

  // C-3 (PROJECT_REVIEW_SNAPSHOT_V1.16.7 Rev.4, Codex §4) — Title auto-sync
  // must be scoped to CURRENT_STATE.md only. Before v1.16.10 TITLE_RE matched
  // any `- **Title:** X` line in any .mission file, silently corrupting them.
  // Fix: filename guard restricts Title rewrite to basename === CURRENT_STATE.md.

  it("does NOT rewrite Title in .mission files other than CURRENT_STATE.md (C-3)", async ({
    fx,
  }) => {
    fx.writePkg("1.15.0");
    fx.writeMissionYaml("Canonical Mission Title");
    fx.writeMission(
      "CURRENT_STATE.md",
      ["> Version: 1.15.0", "- **Title:** Canonical Mission Title", ""].join(
        "\n",
      ),
    );
    fx.writeMission(
      "NOTES.md",
      [
        "# Maintainer notes",
        "",
        "> Version: 1.15.0",
        "",
        "- **Title:** Draft note about something unrelated",
        "- Another bullet",
        "",
      ].join("\n"),
    );

    await fx.runScript(["--apply"]);

    const notes = readFileSync(join(fx.tempDir, ".mission/NOTES.md"), "utf-8");
    expect(notes).toContain(
      "- **Title:** Draft note about something unrelated",
    );
    expect(notes).not.toContain("- **Title:** Canonical Mission Title");
  });

  it("still rewrites Title in CURRENT_STATE.md when other .mission files have Title lines (C-3)", async ({
    fx,
  }) => {
    fx.writePkg("1.15.0");
    fx.writeMissionYaml("Fresh Title");
    fx.writeMission(
      "CURRENT_STATE.md",
      ["> Version: 1.15.0", "- **Title:** Stale Title", ""].join("\n"),
    );
    fx.writeMission(
      "ARBITRARY.md",
      "- **Title:** Irrelevant bullet in a different doc\n",
    );

    await fx.runScript(["--apply"]);

    const cs = readFileSync(
      join(fx.tempDir, ".mission/CURRENT_STATE.md"),
      "utf-8",
    );
    expect(cs).toContain("- **Title:** Fresh Title");
    const arbitrary = readFileSync(
      join(fx.tempDir, ".mission/ARBITRARY.md"),
      "utf-8",
    );
    expect(arbitrary).toContain(
      "- **Title:** Irrelevant bullet in a different doc",
    );
  });
});
