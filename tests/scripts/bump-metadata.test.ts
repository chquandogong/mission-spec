import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtempSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

let tempDir: string;

const scriptPath = resolve(
  __dirname,
  "..",
  "..",
  "scripts",
  "bump-metadata.js",
);

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "ms-bumpmeta-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

function writePkg(version: string) {
  writeFileSync(
    join(tempDir, "package.json"),
    JSON.stringify({ name: "fixture", version }, null, 2),
  );
}

function writeMission(relPath: string, content: string) {
  const full = join(tempDir, ".mission", relPath);
  mkdirSync(resolve(full, ".."), { recursive: true });
  writeFileSync(full, content);
}

function runScript(args: string[] = []) {
  return execFileSync("node", [scriptPath, ...args], {
    cwd: tempDir,
    encoding: "utf-8",
    stdio: "pipe",
  });
}

describe("bump-metadata script", () => {
  it("dry-run (no flag) reports drift without writing", () => {
    writePkg("1.15.0");
    writeMission(
      "CURRENT_STATE.md",
      "> Last updated: 2026-04-17 | Version: 1.14.0\n\nbody\n",
    );

    const stdout = runScript();
    expect(stdout).toContain("Would update");
    expect(stdout).toContain("1.14.0 → 1.15.0");
    expect(stdout).toContain(".mission/CURRENT_STATE.md");

    const content = readFileSync(
      join(tempDir, ".mission/CURRENT_STATE.md"),
      "utf-8",
    );
    expect(content).toContain("1.14.0");
    expect(content).not.toContain("1.15.0");
  });

  it("--apply rewrites drifted Version headers across .md and .yaml files", () => {
    writePkg("1.15.0");
    writeMission(
      "CURRENT_STATE.md",
      "> Last updated: 2026-04-17 | Version: 1.14.0\n",
    );
    writeMission(
      "interfaces/API_REGISTRY.yaml",
      "# Last updated: 2026-04-17 | Version: 1.14.1\n\npublic_api: {}\n",
    );
    writeMission(
      "reconstruction/REBUILD_PLAYBOOK.md",
      "> Last updated: 2026-04-17 | Version: 1.14.2\n",
    );

    runScript(["--apply"]);

    expect(
      readFileSync(join(tempDir, ".mission/CURRENT_STATE.md"), "utf-8"),
    ).toContain("Version: 1.15.0");
    expect(
      readFileSync(
        join(tempDir, ".mission/interfaces/API_REGISTRY.yaml"),
        "utf-8",
      ),
    ).toContain("Version: 1.15.0");
    expect(
      readFileSync(
        join(tempDir, ".mission/reconstruction/REBUILD_PLAYBOOK.md"),
        "utf-8",
      ),
    ).toContain("Version: 1.15.0");
  });

  it("--check exits 0 when every .mission/ header matches package.json", () => {
    writePkg("1.15.0");
    writeMission("CURRENT_STATE.md", "> Version: 1.15.0\n");
    writeMission("interfaces/API_REGISTRY.yaml", "# Version: 1.15.0\n");

    const stdout = runScript(["--check"]);
    expect(stdout).toContain("in sync");
  });

  it("--check exits 1 on drift", () => {
    writePkg("1.15.0");
    writeMission("CURRENT_STATE.md", "> Version: 1.14.0\n");

    expect(() => runScript(["--check"])).toThrow();
  });

  it("is idempotent — second --apply reports no changes", () => {
    writePkg("1.15.0");
    writeMission("CURRENT_STATE.md", "> Version: 1.14.0\n");

    runScript(["--apply"]);
    const second = runScript(["--apply"]);
    expect(second).toContain("No changes needed");
  });

  it("skips files without a Version header", () => {
    writePkg("1.15.0");
    writeMission(
      "decisions/MDR-099-test.md",
      "# MDR-099: Test\n\nNo header here.\n",
    );

    const stdout = runScript();
    expect(stdout).toContain("No changes needed");
  });

  it("only touches .md and .yaml files (skips .txt, .json, etc.)", () => {
    writePkg("1.15.0");
    writeMission("notes.txt", "Version: 1.14.0\n"); // .txt — ignored
    writeMission("data.json", '{"version":"1.14.0"}\n'); // .json — ignored
    writeMission("real.md", "> Version: 1.14.0\n"); // .md — picked up

    runScript(["--apply"]);

    expect(
      readFileSync(join(tempDir, ".mission/notes.txt"), "utf-8"),
    ).toContain("1.14.0"); // untouched
    expect(
      readFileSync(join(tempDir, ".mission/data.json"), "utf-8"),
    ).toContain("1.14.0"); // untouched
    expect(readFileSync(join(tempDir, ".mission/real.md"), "utf-8")).toContain(
      "Version: 1.15.0",
    );
  });

  it("errors when package.json.version is not a valid semver triplet", () => {
    writePkg("not-a-version");
    writeMission("CURRENT_STATE.md", "> Version: 1.14.0\n");

    expect(() => runScript()).toThrow();
  });

  it("handles absence of .mission/ directory gracefully (no-op)", () => {
    writePkg("1.15.0");
    // no .mission/ at all

    const stdout = runScript();
    expect(stdout).toContain("No changes needed");
  });

  it("skips .mission/decisions/ — MDR Version fields are historical records", () => {
    writePkg("1.15.0");
    // MDR style body, mirrors real MDR-001 etc.
    writeMission(
      "decisions/MDR-001-example.md",
      "# MDR-001: Example\n\n**Date:** 2026-04-02\n**Version:** 1.0.0\n",
    );

    runScript(["--apply"]);

    const body = readFileSync(
      join(tempDir, ".mission/decisions/MDR-001-example.md"),
      "utf-8",
    );
    // MDR version must not be rewritten to current package.json version
    expect(body).toContain("**Version:** 1.0.0");
    expect(body).not.toContain("Version: 1.15.0");
  });

  it("skips .mission/snapshots/ and .mission/templates/ (historical + placeholder)", () => {
    writePkg("1.15.0");
    writeMission(
      "snapshots/2026-04-02_v1.0.0_mission.yaml",
      "# Version: 1.0.0\nmission: {}\n",
    );
    writeMission(
      "templates/MDR_TEMPLATE.md",
      "**Version:** X.Y.Z (placeholder)\n",
    );

    runScript(["--apply"]);

    expect(
      readFileSync(
        join(tempDir, ".mission/snapshots/2026-04-02_v1.0.0_mission.yaml"),
        "utf-8",
      ),
    ).toContain("# Version: 1.0.0");
    expect(
      readFileSync(
        join(tempDir, ".mission/templates/MDR_TEMPLATE.md"),
        "utf-8",
      ),
    ).toContain("**Version:** X.Y.Z");
  });

  // E-6 (PROJECT_REVIEW_SNAPSHOT_V1.16.0 §6): also sync the Title line in
  // CURRENT_STATE.md from mission.yaml.title. Before v1.16.3 this was a
  // manual step; v1.16.2 added a verifier (registry:check catches drift)
  // but the automation lived nowhere. This closes the loop.

  function writeMissionYaml(title: string) {
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
  }

  it("--apply rewrites drifted Title line in CURRENT_STATE.md (E-6)", () => {
    writePkg("1.15.0");
    writeMissionYaml("Mission Spec v1.15.0 — Fresh");
    writeMission(
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

    runScript(["--apply"]);

    const body = readFileSync(
      join(tempDir, ".mission/CURRENT_STATE.md"),
      "utf-8",
    );
    expect(body).toContain("- **Title:** Mission Spec v1.15.0 — Fresh");
    expect(body).not.toContain("Mission Spec v1.14.0 — Stale");
  });

  it("--check exits 1 when Title line drifts from mission.yaml (E-6)", () => {
    writePkg("1.15.0");
    writeMissionYaml("Mission Spec v1.15.0 — Fresh");
    writeMission(
      "CURRENT_STATE.md",
      [
        "> Version: 1.15.0",
        "- **Title:** Mission Spec v1.14.0 — Stale",
        "",
      ].join("\n"),
    );

    expect(() => runScript(["--check"])).toThrow();
  });

  it("--apply updates both Title and Version in a single pass (E-6)", () => {
    writePkg("1.16.0");
    writeMissionYaml("Mission Spec v1.16.0 — Bump");
    writeMission(
      "CURRENT_STATE.md",
      ["> Version: 1.14.0", "- **Title:** Mission Spec v1.14.0 — Old", ""].join(
        "\n",
      ),
    );

    const stdout = runScript(["--apply"]);
    expect(stdout).toContain("Version: 1.14.0 → 1.16.0");
    expect(stdout).toContain("Title:");

    const body = readFileSync(
      join(tempDir, ".mission/CURRENT_STATE.md"),
      "utf-8",
    );
    expect(body).toContain("Version: 1.16.0");
    expect(body).toContain("- **Title:** Mission Spec v1.16.0 — Bump");
  });

  it("graceful when mission.yaml is absent — Version sync still works (E-6)", () => {
    writePkg("1.15.0");
    // no mission.yaml
    writeMission(
      "CURRENT_STATE.md",
      ["> Version: 1.14.0", "- **Title:** anything goes", ""].join("\n"),
    );

    runScript(["--apply"]);
    const body = readFileSync(
      join(tempDir, ".mission/CURRENT_STATE.md"),
      "utf-8",
    );
    expect(body).toContain("Version: 1.15.0");
    // Title untouched because mission.yaml was not available
    expect(body).toContain("- **Title:** anything goes");
  });

  it("graceful when CURRENT_STATE.md has no Title line — no error (E-6)", () => {
    writePkg("1.15.0");
    writeMissionYaml("Mission Spec v1.15.0 — Fresh");
    writeMission("CURRENT_STATE.md", "> Version: 1.14.0\nno title line here\n");

    runScript(["--apply"]);
    const body = readFileSync(
      join(tempDir, ".mission/CURRENT_STATE.md"),
      "utf-8",
    );
    expect(body).toContain("Version: 1.15.0");
    // No Title line to update; file should still be valid
  });

  it("leaves Title line unchanged when already matching (E-6)", () => {
    writePkg("1.15.0");
    writeMissionYaml("Mission Spec v1.15.0 — Match");
    writeMission(
      "CURRENT_STATE.md",
      [
        "> Version: 1.15.0",
        "- **Title:** Mission Spec v1.15.0 — Match",
        "",
      ].join("\n"),
    );

    const stdout = runScript(["--apply"]);
    expect(stdout).toContain("No changes needed");
  });
});
