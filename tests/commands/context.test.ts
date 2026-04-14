import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify } from "yaml";
import { generateContext } from "../../src/commands/context.js";

let tempDir: string;

function writeMission(dir: string, mission: Record<string, unknown>) {
  writeFileSync(join(dir, "mission.yaml"), stringify({ mission }));
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "ms-context-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("generateContext", () => {
  it("includes mission section with goal and done_when", () => {
    writeMission(tempDir, {
      title: "Test Mission",
      goal: "Build something",
      done_when: ["done 1", "done 2"],
      version: "1.0.0",
    });
    const result = generateContext(tempDir);
    expect(result.sections).toContain("mission");
    expect(result.markdown).toContain("## Mission: Test Mission");
    expect(result.markdown).toContain("Build something");
    expect(result.markdown).toContain("- done 1");
    expect(result.markdown).toContain("- done 2");
  });

  it("includes constraints when present", () => {
    writeMission(tempDir, {
      title: "Constrained",
      goal: "test",
      done_when: ["done"],
      constraints: ["no X", "no Y"],
    });
    const result = generateContext(tempDir);
    expect(result.markdown).toContain("### Constraints");
    expect(result.markdown).toContain("- no X");
  });

  it("includes design_refs when present", () => {
    writeMission(tempDir, {
      title: "With Refs",
      goal: "test",
      done_when: ["done"],
      design_refs: {
        architecture: "docs/ARCH.md",
        api_surface: "src/index.ts",
      },
    });
    const result = generateContext(tempDir);
    expect(result.sections).toContain("design_refs");
    expect(result.markdown).toContain("## Design References");
    expect(result.markdown).toContain("`docs/ARCH.md`");
  });

  it("includes architecture registry when present", () => {
    writeMission(tempDir, {
      title: "With Arch",
      goal: "test",
      done_when: ["done"],
    });
    mkdirSync(join(tempDir, ".mission", "architecture"), { recursive: true });
    writeFileSync(
      join(tempDir, ".mission", "architecture", "ARCHITECTURE_CURRENT.yaml"),
      stringify({
        modules: [
          {
            id: "parser",
            path: "src/core/parser.ts",
            responsibility: "YAML parse",
            depends_on: ["validator"],
          },
        ],
        data_flow: { pipeline: "parse → validate → evaluate" },
      }),
    );
    const result = generateContext(tempDir);
    expect(result.sections).toContain("architecture");
    expect(result.markdown).toContain("## Architecture");
    expect(result.markdown).toContain("parser");
    expect(result.markdown).toContain("parse → validate → evaluate");
  });

  it("includes MDR summaries when decisions directory exists", () => {
    writeMission(tempDir, {
      title: "With MDR",
      goal: "test",
      done_when: ["done"],
    });
    mkdirSync(join(tempDir, ".mission", "decisions"), { recursive: true });
    writeFileSync(
      join(tempDir, ".mission", "decisions", "MDR-001-test.md"),
      "# MDR-001: Test Decision\n\nSome rationale.",
    );
    const result = generateContext(tempDir);
    expect(result.sections).toContain("decisions");
    expect(result.markdown).toContain("## Key Decisions (MDR)");
    expect(result.markdown).toContain("MDR-001: Test Decision");
  });

  it("includes API surface when API_REGISTRY exists", () => {
    writeMission(tempDir, {
      title: "With API",
      goal: "test",
      done_when: ["done"],
    });
    mkdirSync(join(tempDir, ".mission", "interfaces"), { recursive: true });
    writeFileSync(
      join(tempDir, ".mission", "interfaces", "API_REGISTRY.yaml"),
      stringify({
        public_api: {
          functions: [
            {
              name: "evaluateMission",
              signature: "(dir: string) => EvalResult",
            },
          ],
        },
      }),
    );
    const result = generateContext(tempDir);
    expect(result.sections).toContain("api");
    expect(result.markdown).toContain("## Public API");
    expect(result.markdown).toContain("evaluateMission");
  });

  it("works with minimal mission (no optional sections)", () => {
    writeMission(tempDir, {
      title: "Minimal",
      goal: "test",
      done_when: ["done"],
    });
    const result = generateContext(tempDir);
    expect(result.sections).toEqual(["mission"]);
    expect(result.markdown).toContain("## Mission: Minimal");
    expect(result.markdown).not.toContain("## Architecture");
    expect(result.markdown).not.toContain("## Public API");
  });

  it("throws when mission.yaml is missing", () => {
    expect(() => generateContext(tempDir)).toThrow();
  });
});
