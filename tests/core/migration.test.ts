import { describe, it, expect } from "vitest";
import {
  detectSchemaVersion,
  migrateMission,
  registerMigration,
  listMigrations,
  resetMigrationsForTest,
} from "../../src/core/migration.js";

describe("schema migration", () => {
  describe("detectSchemaVersion", () => {
    it("returns '1' when schema_version is absent", () => {
      expect(detectSchemaVersion({ mission: { title: "x", goal: "y" } })).toBe(
        "1",
      );
    });

    it("returns explicit schema_version when present", () => {
      expect(
        detectSchemaVersion({
          schema_version: "2",
          mission: { title: "x", goal: "y" },
        }),
      ).toBe("2");
    });

    it("returns '1' for null or non-object input (safe default)", () => {
      expect(detectSchemaVersion(null)).toBe("1");
      expect(detectSchemaVersion(undefined)).toBe("1");
      expect(detectSchemaVersion("string")).toBe("1");
    });
  });

  describe("migrateMission — identity and no-op paths", () => {
    it("returns the same document when from == to (identity path)", () => {
      const doc = { mission: { title: "x", goal: "y" } };
      const result = migrateMission(doc, "1", "1");
      expect(result.migrated).toEqual(doc);
      expect(result.applied).toEqual([]);
      expect(result.targetVersion).toBe("1");
    });

    it("uses detectSchemaVersion when fromVersion not specified", () => {
      const doc = { mission: { title: "x", goal: "y" } };
      const result = migrateMission(doc, undefined, "1");
      expect(result.applied).toEqual([]);
      expect(result.targetVersion).toBe("1");
    });
  });

  describe("registerMigration + dispatch", () => {
    it("applies a single registered migrator for direct step", () => {
      resetMigrationsForTest();
      registerMigration("1", "2", (doc: any) => ({
        ...doc,
        schema_version: "2",
        addedByMigration: true,
      }));

      const result = migrateMission(
        { mission: { title: "x", goal: "y" } },
        "1",
        "2",
      );
      expect(result.migrated).toMatchObject({
        schema_version: "2",
        addedByMigration: true,
        mission: { title: "x", goal: "y" },
      });
      expect(result.applied).toEqual(["1->2"]);
    });

    it("chains migrators across multiple steps (1 → 2 → 3)", () => {
      resetMigrationsForTest();
      registerMigration("1", "2", (doc: any) => ({ ...doc, step1: true }));
      registerMigration("2", "3", (doc: any) => ({ ...doc, step2: true }));

      const result = migrateMission(
        { mission: { title: "x", goal: "y" } },
        "1",
        "3",
      );
      expect(result.migrated).toMatchObject({ step1: true, step2: true });
      expect(result.applied).toEqual(["1->2", "2->3"]);
    });

    it("throws when no migration path exists", () => {
      resetMigrationsForTest();
      expect(() =>
        migrateMission({ mission: { title: "x", goal: "y" } }, "1", "9"),
      ).toThrow(/migration/i);
    });

    it("throws when migration function throws (wraps with context)", () => {
      resetMigrationsForTest();
      registerMigration("1", "2", () => {
        throw new Error("boom");
      });
      expect(() =>
        migrateMission({ mission: { title: "x", goal: "y" } }, "1", "2"),
      ).toThrow(/1->2.*boom/s);
    });

    it("does not mutate the input document", () => {
      resetMigrationsForTest();
      registerMigration("1", "2", (doc: any) => ({
        ...doc,
        schema_version: "2",
      }));
      const doc = { mission: { title: "x", goal: "y" } };
      migrateMission(doc, "1", "2");
      expect(doc).toEqual({ mission: { title: "x", goal: "y" } });
    });

    it("listMigrations returns all registered steps sorted", () => {
      resetMigrationsForTest();
      registerMigration("2", "3", () => ({}));
      registerMigration("1", "2", () => ({}));
      const listed = listMigrations();
      expect(listed).toEqual([
        { from: "1", to: "2" },
        { from: "2", to: "3" },
      ]);
    });
  });
});
