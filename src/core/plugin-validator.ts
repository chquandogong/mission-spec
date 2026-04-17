// Plugin manifest validator — verifies the Claude Code plugin structure
// (plugin.json, marketplace.json, skills/*/SKILL.md) is coherent and that
// versions do not drift across package.json / plugin.json / marketplace.json /
// mission.yaml.
//
// Used by scripts/validate-plugin.js and CI. Not a true install-E2E (that
// needs Claude Code CLI), but closes the drift gap that prior adversarial
// reviews flagged as "documentation ahead of implementation".

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

export interface PluginValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function readMissionVersion(projectDir: string): string | null {
  const p = join(projectDir, "mission.yaml");
  if (!existsSync(p)) return null;
  const data = parseYaml(readFileSync(p, "utf-8")) as {
    mission?: { version?: string };
  };
  return data?.mission?.version ?? null;
}

function parseFrontmatter(md: string): Record<string, string> | null {
  if (!md.startsWith("---")) return null;
  const end = md.indexOf("\n---", 3);
  if (end < 0) return null;
  const block = md.slice(3, end).trim();
  const result: Record<string, string> = {};
  // Simple line-oriented parsing; sufficient for name/description.
  const lines = block.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const match = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (!match) {
      i++;
      continue;
    }
    const [, key, rawValue] = match;
    if (rawValue === ">" || rawValue === "|") {
      // Folded/literal block scalar — collect indented continuation lines.
      const folded: string[] = [];
      i++;
      while (i < lines.length && /^\s{2,}/.test(lines[i])) {
        folded.push(lines[i].trim());
        i++;
      }
      result[key] = folded.join(" ");
    } else {
      result[key] = rawValue.trim();
      i++;
    }
  }
  return result;
}

function validatePluginJson(
  projectDir: string,
  errors: string[],
): { version: string | null } {
  const path = join(projectDir, ".claude-plugin", "plugin.json");
  if (!existsSync(path)) {
    errors.push(".claude-plugin/plugin.json missing");
    return { version: null };
  }
  const data = readJson(path) as Record<string, unknown>;
  const required = ["name", "version", "description"];
  for (const field of required) {
    if (!data[field]) {
      errors.push(
        `.claude-plugin/plugin.json missing required field: ${field}`,
      );
    }
  }
  return { version: typeof data.version === "string" ? data.version : null };
}

function validateMarketplaceJson(
  projectDir: string,
  errors: string[],
): { version: string | null } {
  const path = join(projectDir, ".claude-plugin", "marketplace.json");
  if (!existsSync(path)) {
    errors.push(".claude-plugin/marketplace.json missing");
    return { version: null };
  }
  const data = readJson(path) as {
    name?: string;
    plugins?: { name?: string; version?: string; source?: string }[];
  };
  if (!data.name) errors.push(".claude-plugin/marketplace.json missing name");
  if (!Array.isArray(data.plugins) || data.plugins.length === 0) {
    errors.push(".claude-plugin/marketplace.json missing plugins[]");
    return { version: null };
  }
  const p0 = data.plugins[0];
  if (!p0.name)
    errors.push(".claude-plugin/marketplace.json plugins[0].name missing");
  if (!p0.source)
    errors.push(".claude-plugin/marketplace.json plugins[0].source missing");
  if (!p0.version)
    errors.push(".claude-plugin/marketplace.json plugins[0].version missing");
  return { version: p0.version ?? null };
}

function validateVersions(projectDir: string, errors: string[]) {
  const pkgPath = join(projectDir, "package.json");
  if (!existsSync(pkgPath)) {
    errors.push("package.json missing");
    return;
  }
  const pkg = readJson(pkgPath) as { version?: string };
  const pkgVersion = pkg.version;
  if (!pkgVersion) {
    errors.push("package.json missing version");
    return;
  }

  const plugin = validatePluginJson(projectDir, errors);
  const marketplace = validateMarketplaceJson(projectDir, errors);
  const missionVersion = readMissionVersion(projectDir);

  if (plugin.version && plugin.version !== pkgVersion) {
    errors.push(
      `version drift: package.json=${pkgVersion} but .claude-plugin/plugin.json=${plugin.version}`,
    );
  }
  if (marketplace.version && marketplace.version !== pkgVersion) {
    errors.push(
      `version drift: package.json=${pkgVersion} but .claude-plugin/marketplace.json plugins[0].version=${marketplace.version}`,
    );
  }
  if (missionVersion && missionVersion !== pkgVersion) {
    errors.push(
      `version drift: package.json=${pkgVersion} but mission.yaml mission.version=${missionVersion}`,
    );
  }
}

function validateSkills(projectDir: string, errors: string[]) {
  const skillsDir = join(projectDir, "skills");
  if (!existsSync(skillsDir)) return; // no skills directory is fine
  const entries = readdirSync(skillsDir).filter((name) =>
    statSync(join(skillsDir, name)).isDirectory(),
  );
  for (const dir of entries) {
    const skillPath = join(skillsDir, dir, "SKILL.md");
    if (!existsSync(skillPath)) {
      errors.push(`skills/${dir}/SKILL.md missing`);
      continue;
    }
    const content = readFileSync(skillPath, "utf-8");
    const fm = parseFrontmatter(content);
    if (!fm) {
      errors.push(
        `skills/${dir}/SKILL.md is missing frontmatter (--- ... ---)`,
      );
      continue;
    }
    if (!fm.name) {
      errors.push(`skills/${dir}/SKILL.md frontmatter missing name field`);
    } else if (fm.name !== dir) {
      errors.push(
        `skills/${dir}/SKILL.md frontmatter name '${fm.name}' does not match directory '${dir}'`,
      );
    }
    if (!fm.description) {
      errors.push(
        `skills/${dir}/SKILL.md frontmatter missing description field`,
      );
    }
    for (const lang of ["ko", "zh"]) {
      const variant = join(skillsDir, dir, `SKILL.${lang}.md`);
      if (!existsSync(variant)) {
        errors.push(
          `skills/${dir}/SKILL.${lang}.md missing (trilingual requirement)`,
        );
      }
    }
  }
}

export function validatePlugin(projectDir: string): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  validateVersions(projectDir, errors);
  validateSkills(projectDir, errors);
  return { valid: errors.length === 0, errors, warnings };
}
