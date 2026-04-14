import { diffArchitectureFromGit } from "../dist/core/arch-diff.js";

const ref = process.argv[2] || "HEAD~1";
const projectDir = process.cwd();

try {
  const result = diffArchitectureFromGit(projectDir, ref);
  console.log(result.markdown);
  if (!result.hasDiff) {
    console.log("\nNo architecture changes detected.");
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Architecture diff failed: ${message}`);
  process.exit(1);
}
