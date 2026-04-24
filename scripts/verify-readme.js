#!/usr/bin/env node
// Verify README install + usage surface for the done_when[5] functional contract
// (MDR-009 §V deferred item, restored in v1.21.10).
//
// Checks the English README.md only (trilingual KO/ZH are enforced structurally
// by MDR-007 locale coupling at commit time; registry:check watches content drift).
//
// Exit 0 on all checks green, exit 1 with the first missing marker on fail.

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const projectDir = process.cwd();
const readmePath = join(projectDir, "README.md");

if (!existsSync(readmePath)) {
  console.error("README.md not found at " + readmePath);
  process.exit(1);
}

const content = readFileSync(readmePath, "utf-8");

// Required markers. Each entry is [label, substring]. Fail on first miss.
const required = [
  // Install guide surface — npm primary (post-v1.21.4)
  ["5-minute install guide header", "## 5-Minute Installation Guide"],
  ["npm install command", "npm install mission-spec"],
  ["npx CLI example", "npx mission-spec"],
  ["sigstore provenance note", "sigstore provenance"],
  ["Claude Code plugin path", "/plugin install mission-spec@mission-spec"],
  // Usage surface — 4 primary skill APIs
  ["Usage section", "## Usage"],
  ["ms-init mention", "ms-init"],
  ["ms-eval mention", "ms-eval"],
  ["ms-status mention", "ms-status"],
  ["ms-report mention", "ms-report"],
];

const missing = [];
for (const [label, marker] of required) {
  if (!content.includes(marker)) {
    missing.push(`${label} (expected substring: "${marker}")`);
  }
}

if (missing.length > 0) {
  console.error("README surface drift:");
  for (const m of missing) console.error("  - " + m);
  process.exit(1);
}

console.log(
  `README install/usage surface valid: ${required.length} markers present`,
);
