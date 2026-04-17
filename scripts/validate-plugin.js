// Validates the Claude Code plugin manifest structure and version coherence.
// Used by CI and can be run locally via `npm run plugin:verify`.

import { validatePlugin } from "../dist/core/plugin-validator.js";

const projectDir = process.cwd();
const result = validatePlugin(projectDir);

if (result.warnings.length > 0) {
  for (const w of result.warnings) console.warn(`warning: ${w}`);
}

if (!result.valid) {
  console.error("Plugin manifest validation failed:");
  for (const err of result.errors) console.error(`  - ${err}`);
  process.exit(1);
}

console.log("Plugin manifest and skills structure are valid.");
