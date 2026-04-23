import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify } from "yaml";
import { loadHistory } from "../../src/core/history.js";

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "ms-history-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("loadHistory warnings (v1.21.2 Rev.5 Q2 — Codex)", () => {
  it("emits [mission-history] warnings when the ledger has a null changes block", () => {
    writeFileSync(
      join(tempDir, "mission-history.yaml"),
      stringify({
        meta: {
          mission_id: "m",
          total_revisions: 1,
          latest_version: "1.0.0",
        },
        timeline: [
          {
            change_id: "c1",
            semantic_version: "1.0.0",
            date: "2026-04-01",
            author: "t",
            change_type: "initial",
            persistence: "permanent",
            intent: "x",
            changes: null,
            done_when_delta: {},
            impact_scope: {},
            breaking: false,
          },
        ],
      }),
    );

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const history = loadHistory(tempDir);
    expect(history).not.toBeNull();
    const messages = warnSpy.mock.calls.map((args) => String(args[0]));
    expect(messages.some((m) => m.startsWith("[mission-history]"))).toBe(true);
    expect(messages.join(" ")).toMatch(/timeline\[0\]\.changes/);
    warnSpy.mockRestore();
  });

  it("does not emit warnings for a well-formed ledger", () => {
    writeFileSync(
      join(tempDir, "mission-history.yaml"),
      stringify({
        meta: {
          mission_id: "m",
          total_revisions: 1,
          latest_version: "1.0.0",
        },
        timeline: [
          {
            change_id: "c1",
            semantic_version: "1.0.0",
            date: "2026-04-01",
            author: "t",
            change_type: "initial",
            persistence: "permanent",
            intent: "x",
            changes: { added: [], modified: [], removed: [] },
            done_when_delta: { added: [], modified: [], removed: [] },
            impact_scope: {},
            breaking: false,
          },
        ],
      }),
    );

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    loadHistory(tempDir);
    const missionWarnings = warnSpy.mock.calls
      .map((args) => String(args[0]))
      .filter((m) => m.startsWith("[mission-history]"));
    expect(missionWarnings).toEqual([]);
    warnSpy.mockRestore();
  });

  it("returns null when mission-history.yaml is missing", () => {
    const history = loadHistory(tempDir);
    expect(history).toBeNull();
  });
});
