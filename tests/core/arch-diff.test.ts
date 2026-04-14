import { describe, it, expect } from "vitest";
import { diffArchitectures } from "../../src/core/arch-diff.js";

describe("diffArchitectures", () => {
  it("detects added modules", () => {
    const old = {
      modules: [
        { id: "parser", path: "src/parser.ts", responsibility: "parse" },
      ],
    };
    const cur = {
      modules: [
        { id: "parser", path: "src/parser.ts", responsibility: "parse" },
        {
          id: "history",
          path: "src/history.ts",
          responsibility: "load history",
        },
      ],
    };
    const result = diffArchitectures(old, cur, "v1", "v2");
    expect(result.hasDiff).toBe(true);
    expect(result.modules.added).toHaveLength(1);
    expect(result.modules.added[0].id).toBe("history");
    expect(result.markdown).toContain("## Modules Added");
    expect(result.markdown).toContain("history");
  });

  it("detects removed modules", () => {
    const old = {
      modules: [
        { id: "parser", path: "src/parser.ts", responsibility: "parse" },
        { id: "legacy", path: "src/legacy.ts", responsibility: "old stuff" },
      ],
    };
    const cur = {
      modules: [
        { id: "parser", path: "src/parser.ts", responsibility: "parse" },
      ],
    };
    const result = diffArchitectures(old, cur);
    expect(result.hasDiff).toBe(true);
    expect(result.modules.removed).toHaveLength(1);
    expect(result.modules.removed[0].id).toBe("legacy");
    expect(result.markdown).toContain("## Modules Removed");
  });

  it("detects changed module fields", () => {
    const old = {
      modules: [
        {
          id: "parser",
          path: "src/parser.ts",
          responsibility: "parse YAML",
          depends_on: ["validator"],
        },
      ],
    };
    const cur = {
      modules: [
        {
          id: "parser",
          path: "src/core/parser.ts",
          responsibility: "parse YAML + validate",
          depends_on: ["validator", "history"],
        },
      ],
    };
    const result = diffArchitectures(old, cur);
    expect(result.hasDiff).toBe(true);
    expect(result.modules.changed.length).toBeGreaterThanOrEqual(3);
    const fields = result.modules.changed.map((c) => c.field);
    expect(fields).toContain("path");
    expect(fields).toContain("responsibility");
    expect(fields).toContain("depends_on");
    expect(result.markdown).toContain("## Modules Changed");
  });

  it("detects added and removed dependency edges", () => {
    const old = {
      modules: [
        { id: "a", path: "a.ts", responsibility: "A", depends_on: ["b"] },
        { id: "b", path: "b.ts", responsibility: "B" },
      ],
    };
    const cur = {
      modules: [
        { id: "a", path: "a.ts", responsibility: "A", depends_on: ["c"] },
        { id: "c", path: "c.ts", responsibility: "C" },
      ],
    };
    const result = diffArchitectures(old, cur);
    expect(result.dependencies.added).toContainEqual({ from: "a", to: "c" });
    expect(result.dependencies.removed).toContainEqual({ from: "a", to: "b" });
    expect(result.markdown).toContain("## Dependencies Added");
    expect(result.markdown).toContain("## Dependencies Removed");
  });

  it("reports no diff for identical registries", () => {
    const data = {
      modules: [
        { id: "x", path: "x.ts", responsibility: "X", depends_on: ["y"] },
        { id: "y", path: "y.ts", responsibility: "Y" },
      ],
    };
    const result = diffArchitectures(data, data, "same", "same");
    expect(result.hasDiff).toBe(false);
    expect(result.modules.added).toHaveLength(0);
    expect(result.modules.removed).toHaveLength(0);
    expect(result.modules.changed).toHaveLength(0);
    expect(result.markdown).toContain("No changes detected");
  });

  it("handles empty old registry (all modules are new)", () => {
    const result = diffArchitectures(
      { modules: [] },
      {
        modules: [
          { id: "a", path: "a.ts", responsibility: "A" },
          { id: "b", path: "b.ts", responsibility: "B" },
        ],
      },
    );
    expect(result.hasDiff).toBe(true);
    expect(result.modules.added).toHaveLength(2);
    expect(result.modules.removed).toHaveLength(0);
  });

  it("handles null/undefined modules gracefully", () => {
    const result = diffArchitectures(
      {},
      { modules: [{ id: "a", path: "a.ts", responsibility: "A" }] },
    );
    expect(result.hasDiff).toBe(true);
    expect(result.modules.added).toHaveLength(1);
  });
});
