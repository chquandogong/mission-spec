// Generates CHANGELOG.md from mission-history.yaml.
// Idempotent: same history → same output. Keep-a-Changelog-style sections.
// Usage: node scripts/generate-changelog.js [--output CHANGELOG.md]

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { parse } from "yaml";

const projectDir = process.cwd();
const historyPath = join(projectDir, "mission-history.yaml");

if (!existsSync(historyPath)) {
  console.error("mission-history.yaml not found in " + projectDir);
  process.exit(1);
}

const args = process.argv.slice(2);
const outputIdx = args.indexOf("--output");
const requestedOutput = outputIdx >= 0 ? args[outputIdx + 1] : null;
const outputPath =
  requestedOutput
    ? isAbsolute(requestedOutput)
      ? requestedOutput
      : resolve(projectDir, requestedOutput)
    : join(projectDir, "CHANGELOG.md");

const history = parse(readFileSync(historyPath, "utf-8"));
const timeline = Array.isArray(history?.timeline) ? history.timeline : [];

function renderList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function renderSection(heading, items) {
  if (!items || items.length === 0) return "";
  return `### ${heading}\n\n${renderList(items)}\n`;
}

function renderEntry(entry) {
  const version = entry.semantic_version ?? "UNRELEASED";
  const date = entry.date ?? "";
  const breakingTag = entry.breaking ? " — BREAKING" : "";
  const header = `## [${version}] - ${date}${breakingTag}`;

  const intent = entry.intent ? `_${entry.intent}_\n` : "";

  const added = entry.changes?.added ?? [];
  const modified = entry.changes?.modified ?? [];
  const removed = entry.changes?.removed ?? [];

  const sections = [
    renderSection("Added", added),
    renderSection("Changed", modified),
    renderSection("Removed", removed),
  ]
    .filter(Boolean)
    .join("\n");

  const parts = [header];
  if (intent) parts.push(intent);
  if (sections) parts.push(sections);

  return parts.join("\n").trimEnd();
}

const head = [
  "# Changelog",
  "",
  "All notable changes to this project are recorded here.",
  "This file is generated from `mission-history.yaml` — do not edit by hand.",
  "Run `npm run changelog` to regenerate.",
  "",
  "The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),",
  "and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).",
  "",
].join("\n");

const body = timeline.map(renderEntry).join("\n\n");
const content = head + body + "\n";

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, content);
console.log(`Wrote ${outputPath} (${timeline.length} entries)`);
