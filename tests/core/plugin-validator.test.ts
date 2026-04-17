import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { validatePlugin } from "../../src/core/plugin-validator.js";

let tempDir: string;

function writeFile(rel: string, content: string) {
  const full = join(tempDir, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

function writePkg(version: string) {
  writeFile("package.json", JSON.stringify({ name: "p", version }));
}

function writePlugin(version: string, extra: object = {}) {
  writeFile(
    ".claude-plugin/plugin.json",
    JSON.stringify({
      name: "mission-spec",
      version,
      description: "x",
      license: "MIT",
      ...extra,
    }),
  );
}

function writeMarketplace(version: string) {
  writeFile(
    ".claude-plugin/marketplace.json",
    JSON.stringify({
      name: "mission-spec",
      description: "x",
      plugins: [
        { name: "mission-spec", source: "./", description: "x", version },
      ],
    }),
  );
}

function writeMission(version: string) {
  writeFile(
    "mission.yaml",
    `mission:\n  title: t\n  goal: g\n  version: "${version}"\n  done_when: [x]\n`,
  );
}

function writeSkill(
  dir: string,
  frontmatter: Record<string, unknown>,
  suffix = "md",
) {
  const fm = Object.entries(frontmatter)
    .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join("\n");
  writeFile(`skills/${dir}/SKILL.${suffix}`, `---\n${fm}\n---\n\n# ${dir}\n`);
}

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "ms-plugin-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("plugin-validator", () => {
  it("passes when versions are consistent and skills are well-formed", () => {
    writePkg("1.10.0");
    writePlugin("1.10.0");
    writeMarketplace("1.10.0");
    writeMission("1.10.0");
    writeSkill("ms-init", { name: "ms-init", description: "do x" });
    writeSkill(
      "ms-init",
      { name: "ms-init", description: "do x (ko)" },
      "ko.md",
    );
    writeSkill(
      "ms-init",
      { name: "ms-init", description: "do x (zh)" },
      "zh.md",
    );

    const result = validatePlugin(tempDir);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("fails on version drift between package.json and plugin.json", () => {
    writePkg("1.10.0");
    writePlugin("1.8.0");
    writeMarketplace("1.10.0");
    writeMission("1.10.0");
    writeSkill("ms-init", { name: "ms-init", description: "x" });
    writeSkill("ms-init", { name: "ms-init", description: "x" }, "ko.md");
    writeSkill("ms-init", { name: "ms-init", description: "x" }, "zh.md");

    const result = validatePlugin(tempDir);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("plugin.json"))).toBe(true);
    expect(result.errors.some((e) => e.includes("1.10.0"))).toBe(true);
  });

  it("fails on version drift between package.json and marketplace.json[0]", () => {
    writePkg("1.10.0");
    writePlugin("1.10.0");
    writeMarketplace("1.8.0");
    writeMission("1.10.0");
    writeSkill("ms-init", { name: "ms-init", description: "x" });
    writeSkill("ms-init", { name: "ms-init", description: "x" }, "ko.md");
    writeSkill("ms-init", { name: "ms-init", description: "x" }, "zh.md");

    const result = validatePlugin(tempDir);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("marketplace.json"))).toBe(
      true,
    );
  });

  it("fails when a skill is missing its frontmatter name field", () => {
    writePkg("1.10.0");
    writePlugin("1.10.0");
    writeMarketplace("1.10.0");
    writeMission("1.10.0");
    writeFile(
      "skills/ms-init/SKILL.md",
      "---\ndescription: missing name\n---\n\nbody\n",
    );
    writeSkill("ms-init", { name: "ms-init", description: "x" }, "ko.md");
    writeSkill("ms-init", { name: "ms-init", description: "x" }, "zh.md");

    const result = validatePlugin(tempDir);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes("name"))).toBe(
      true,
    );
  });

  it("fails when skill name does not match its directory", () => {
    writePkg("1.10.0");
    writePlugin("1.10.0");
    writeMarketplace("1.10.0");
    writeMission("1.10.0");
    writeSkill("ms-init", { name: "init", description: "x" });
    writeSkill("ms-init", { name: "init", description: "x" }, "ko.md");
    writeSkill("ms-init", { name: "init", description: "x" }, "zh.md");

    const result = validatePlugin(tempDir);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.includes("ms-init") && e.includes("init")),
    ).toBe(true);
  });

  it("fails when a skill is missing its trilingual variant", () => {
    writePkg("1.10.0");
    writePlugin("1.10.0");
    writeMarketplace("1.10.0");
    writeMission("1.10.0");
    writeSkill("ms-init", { name: "ms-init", description: "x" });
    // missing .ko.md and .zh.md

    const result = validatePlugin(tempDir);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("SKILL.ko.md"))).toBe(true);
    expect(result.errors.some((e) => e.includes("SKILL.zh.md"))).toBe(true);
  });

  it("fails when plugin.json is missing required fields", () => {
    writePkg("1.10.0");
    writeFile(".claude-plugin/plugin.json", JSON.stringify({ name: "x" }));
    writeMarketplace("1.10.0");
    writeMission("1.10.0");
    writeSkill("ms-init", { name: "ms-init", description: "x" });
    writeSkill("ms-init", { name: "ms-init", description: "x" }, "ko.md");
    writeSkill("ms-init", { name: "ms-init", description: "x" }, "zh.md");

    const result = validatePlugin(tempDir);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("version"))).toBe(true);
    expect(result.errors.some((e) => e.includes("description"))).toBe(true);
  });

  it("fails when a skill directory has no SKILL.md at all", () => {
    writePkg("1.10.0");
    writePlugin("1.10.0");
    writeMarketplace("1.10.0");
    writeMission("1.10.0");
    mkdirSync(join(tempDir, "skills", "ms-init"), { recursive: true });

    const result = validatePlugin(tempDir);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("SKILL.md"))).toBe(true);
  });
});
