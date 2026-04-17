// Verifies that .mission/reconstruction/REBUILD_PLAYBOOK.md references only
// repo paths that actually exist. Default mode is fast (just reference check).
// Opt in to --cold-build to additionally copy the repo to a temp dir and run
// npm ci + npm run build + npm test there (slow: tens of seconds).

import { cpSync, existsSync, mkdtempSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { verifyReconstructionReferences } from "../dist/core/reconstruction-verifier.js";

const projectDir = process.cwd();
const args = process.argv.slice(2);
const coldBuild = args.includes("--cold-build");

const refs = verifyReconstructionReferences(projectDir);
if (!refs.valid) {
  console.error("REBUILD_PLAYBOOK.md references paths that do not exist:");
  for (const m of refs.missing) console.error(`  - ${m}`);
  console.error(
    "\nEither create these files or update the playbook to reflect current layout.",
  );
  process.exit(1);
}
console.log(
  `Reconstruction references: ${refs.checkedPaths.length} paths checked, all exist.`,
);

if (!coldBuild) {
  console.log(
    "Skipping cold-build verification (pass --cold-build to also build + test in a temp dir).",
  );
  process.exit(0);
}

// --cold-build mode: prove the repo can rebuild from source without dist/
// or node_modules committed. Approximates "clone fresh → build → test".
console.log(
  "\nCold build: copying repo to temp dir (excluding node_modules, dist, coverage)...",
);
const tmp = mkdtempSync(join(tmpdir(), "ms-cold-"));
try {
  const EXCLUDE = new Set([
    "node_modules",
    "dist",
    "coverage",
    ".git",
    ".mission/snapshots", // derived
  ]);
  cpSync(projectDir, tmp, {
    recursive: true,
    filter: (src) => {
      const rel = src.replace(projectDir + "/", "");
      for (const excluded of EXCLUDE) {
        if (rel === excluded || rel.startsWith(excluded + "/")) return false;
      }
      return true;
    },
  });

  console.log(`Copied to ${tmp}. Running npm ci...`);
  execFileSync("npm", ["ci", "--no-audit", "--no-fund"], {
    cwd: tmp,
    stdio: "inherit",
  });

  console.log("Running npm run build...");
  execFileSync("npm", ["run", "build"], { cwd: tmp, stdio: "inherit" });

  console.log("Running npm test...");
  execFileSync("npm", ["test", "--silent"], { cwd: tmp, stdio: "inherit" });

  console.log(
    "\nCold build + test succeeded. Playbook + current repo reconstructs to a passing state.",
  );
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nCold build failed: ${message}`);
  process.exit(1);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
