#!/usr/bin/env node
// Cross-platform mission.yaml conversion script
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

const args = process.argv.slice(2);
const verify = args.includes("--verify");
const inputFile = args.find((a) => !a.startsWith("--")) ?? "mission.yaml";

try {
  const content = readFileSync(resolve(inputFile), "utf-8");
  const doc = parse(content);
  const m = doc.mission;

  if (!m || !m.title || !m.goal || !m.done_when) {
    console.error("Invalid mission.yaml: missing required fields");
    process.exit(1);
  }

  const mission = {
    title: m.title,
    goal: typeof m.goal === "string" ? m.goal.trim() : String(m.goal),
    done_when: m.done_when,
    constraints: m.constraints,
  };

  // Dynamic import for ESM compatibility
  const {
    convertToCursor,
    convertToCodex,
    convertToOpenCode,
    convertToCline,
    convertToContinue,
    convertToAider,
  } = await import("../dist/adapters/platforms.js");

  const cursor = convertToCursor(mission);
  const codex = convertToCodex(mission);
  const opencode = convertToOpenCode(mission);
  const cline = convertToCline(mission);
  const continueRules = convertToContinue(mission);
  const aider = convertToAider(mission);

  if (verify) {
    let ok = true;
    const firstGoalLine = mission.goal.split("\n")[0];
    const mustContain = [
      ["Cursor", cursor],
      ["Codex", codex],
      ["OpenCode", opencode],
      ["Cline", cline],
      ["Continue", continueRules],
      ["Aider (context)", aider.context],
    ];
    for (const [name, content] of mustContain) {
      if (!content.includes(mission.title)) {
        console.error(`${name}: missing title`);
        ok = false;
      }
      if (!content.includes(firstGoalLine)) {
        console.error(`${name}: missing goal`);
        ok = false;
      }
    }
    if (
      !aider.conf.includes("read:") ||
      !aider.conf.includes(aider.referencedContextPath)
    ) {
      console.error("Aider: conf does not reference context file");
      ok = false;
    }
    // Check that OpenCode doesn't have bare newlines inside double-quoted strings
    const badToml = opencode.match(/= "[^"]*\n/);
    if (badToml) {
      console.error(
        "OpenCode: invalid TOML — bare newline in double-quoted string",
      );
      ok = false;
    }
    // Check for unescaped double quotes inside single-line TOML strings
    // Skip triple-quoted lines (""") which are valid multiline syntax
    for (const line of opencode.split("\n")) {
      const m = line.match(/^(\w+) = "(.+)"$/);
      if (m && !line.includes('"""')) {
        const inner = m[2];
        const unescaped = inner.replace(/\\"/g, "");
        if (unescaped.includes('"')) {
          console.error(`OpenCode: unescaped quote in: ${line}`);
          ok = false;
        }
      }
    }
    if (ok) {
      console.log("All platform conversions verified successfully");
    } else {
      process.exit(1);
    }
  } else {
    writeFileSync(".cursorrules", cursor);
    writeFileSync("AGENTS.md", codex);
    writeFileSync("opencode.toml", opencode);
    writeFileSync(".clinerules", cline);
    writeFileSync(".continuerules", continueRules);
    writeFileSync(".aider.conf.yml", aider.conf);
    writeFileSync(aider.referencedContextPath, aider.context);
    console.log(
      "Generated: .cursorrules, AGENTS.md, opencode.toml, .clinerules, .continuerules, .aider.conf.yml, .aider-mission.md",
    );
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
