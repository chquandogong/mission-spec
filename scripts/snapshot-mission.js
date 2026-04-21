// Thin wrapper around createSnapshot() from dist/commands/snapshot.js.
// Preserves the script's silent-exit-on-missing-mission.yaml behavior (for
// mission-spec's own pre-commit hook which runs before mission.yaml exists
// on repo bootstrap). The library function throws in that case; the wrapper
// pre-checks and exits 0 instead.
//
// Output format matches the pre-v1.19.2 script:
//   - New snapshot → "New snapshot created: <basename>"
//   - Same-version dedup, different date → "Existing version snapshot retained: <basename>"
//   - Same-version dedup, same date → silent (no log)

import { existsSync } from "node:fs";
import { join } from "node:path";
import { createSnapshot } from "../dist/commands/snapshot.js";

const projectDir = process.cwd();
const missionPath = join(projectDir, "mission.yaml");

if (!existsSync(missionPath)) {
  process.exit(0);
}

try {
  const r = createSnapshot(projectDir);
  const basename = r.path.split("/").pop();
  const expectedToday = `${r.date}_v${r.version}_mission.yaml`;

  if (r.created) {
    console.log(`New snapshot created: ${basename}`);
  } else if (basename !== expectedToday) {
    console.log(`Existing version snapshot retained: ${basename}`);
  }
  // else: same-day, same-version dedup → silent (pre-v1.19.2 behavior)
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(msg);
  process.exit(1);
}
