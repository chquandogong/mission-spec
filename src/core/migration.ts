// Schema migration infrastructure. Maintains a registry of pairwise migrators
// ("1" → "2" → "3" …) and applies them in sequence. Initially there are NO
// registered migrations — the machinery exists so that a future schema v2 can
// ship with a migrator without re-plumbing.
//
// Conceptual versioning:
//   - The current mission.yaml schema is schema_version "1" (implicit when
//     the field is absent).
//   - A future breaking schema change declares a new major (say "2") and
//     registers a migrator "1" → "2" that upgrades existing documents.

export type SchemaVersion = string;
export type MissionDocLike = Record<string, unknown>;
export type MigrationFn = (doc: MissionDocLike) => MissionDocLike;

export interface MigrationResult {
  migrated: MissionDocLike;
  applied: string[]; // list of "from->to" steps applied in order
  targetVersion: SchemaVersion;
}

const migrations = new Map<string, MigrationFn>();

function key(from: SchemaVersion, to: SchemaVersion): string {
  return `${from}->${to}`;
}

export function registerMigration(
  from: SchemaVersion,
  to: SchemaVersion,
  fn: MigrationFn,
): void {
  migrations.set(key(from, to), fn);
}

export function listMigrations(): { from: SchemaVersion; to: SchemaVersion }[] {
  return [...migrations.keys()]
    .map((k) => {
      const [from, to] = k.split("->");
      return { from, to };
    })
    .sort((a, b) => {
      const byFrom = a.from.localeCompare(b.from, undefined, { numeric: true });
      if (byFrom !== 0) return byFrom;
      return a.to.localeCompare(b.to, undefined, { numeric: true });
    });
}

// Test-only helper. Exported so tests can start from a clean registry.
export function resetMigrationsForTest(): void {
  migrations.clear();
}

export function detectSchemaVersion(doc: unknown): SchemaVersion {
  if (doc && typeof doc === "object") {
    const v = (doc as Record<string, unknown>)["schema_version"];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return "1";
}

function findPath(
  from: SchemaVersion,
  to: SchemaVersion,
): SchemaVersion[] | null {
  if (from === to) return [from];
  const visited = new Set<SchemaVersion>([from]);
  const queue: SchemaVersion[][] = [[from]];
  while (queue.length > 0) {
    const path = queue.shift()!;
    const tail = path[path.length - 1];
    for (const k of migrations.keys()) {
      const [src, dst] = k.split("->");
      if (src !== tail) continue;
      if (visited.has(dst)) continue;
      const next = [...path, dst];
      if (dst === to) return next;
      visited.add(dst);
      queue.push(next);
    }
  }
  return null;
}

export function migrateMission(
  doc: MissionDocLike,
  fromVersion: SchemaVersion | undefined,
  toVersion: SchemaVersion,
): MigrationResult {
  const from = fromVersion ?? detectSchemaVersion(doc);

  if (from === toVersion) {
    return {
      migrated: doc,
      applied: [],
      targetVersion: toVersion,
    };
  }

  const path = findPath(from, toVersion);
  if (!path) {
    throw new Error(
      `No migration path from schema_version ${from} to ${toVersion}. ` +
        `Registered migrations: ${
          listMigrations()
            .map((s) => `${s.from}->${s.to}`)
            .join(", ") || "(none)"
        }`,
    );
  }

  let current: MissionDocLike = JSON.parse(JSON.stringify(doc));
  const applied: string[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const step = key(path[i], path[i + 1]);
    const fn = migrations.get(step);
    if (!fn) {
      throw new Error(`Internal error: migrator missing for step ${step}`);
    }
    try {
      current = fn(current);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Migration step ${step} failed: ${message}`);
    }
    applied.push(step);
  }

  return {
    migrated: current,
    applied,
    targetVersion: toVersion,
  };
}
