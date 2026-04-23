import Ajv, { type ErrorObject } from "ajv";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(
  readFileSync(resolve(__dirname, "mission.schema.json"), "utf-8"),
);
const historySchema = JSON.parse(
  readFileSync(resolve(__dirname, "mission-history.schema.json"), "utf-8"),
);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  // Non-fatal notices emitted by the pre-validation normalization layer.
  // Populated by validateHistory() when normalizeHistoryData replaces a
  // malformed delta block (null / array / string) with an empty delta, or
  // when an added/modified/removed subfield is null-coerced. Callers may
  // ignore warnings for strict backward compatibility, or surface them for
  // adopter diagnostics. Introduced in v1.21.2 (Rev.5 Q2 — Codex); strict
  // fail is deferred to v1.22.0 §MINOR.
  warnings?: string[];
}

const ajv = new (Ajv as unknown as typeof Ajv.default)({ allErrors: true });
const validateMissionFn = ajv.compile(schema);
const validateHistoryFn = ajv.compile(historySchema);

function describeBlockShape(block: unknown): string {
  if (block === null) return "null";
  if (Array.isArray(block)) return "array";
  return typeof block;
}

function normalizeDeltaBlock(
  block: unknown,
  context?: { warnings: string[]; path: string },
): unknown {
  if (!block || typeof block !== "object" || Array.isArray(block)) {
    if (context && block !== undefined) {
      context.warnings.push(
        `${context.path}: replaced non-object (${describeBlockShape(block)}) with empty delta (legacy sparse ledger tolerance)`,
      );
    }
    return { added: [], modified: [], removed: [] };
  }
  const obj = block as Record<string, unknown>;
  const normalized: Record<string, unknown> = { ...obj };
  for (const field of ["added", "modified", "removed"] as const) {
    if (obj[field] === null) {
      if (context) {
        context.warnings.push(
          `${context.path}.${field}: replaced null with empty array (legacy sparse ledger tolerance)`,
        );
      }
      normalized[field] = [];
    } else if (obj[field] === undefined) {
      normalized[field] = [];
    }
  }
  return normalized;
}

// Legacy/adopter compatibility: older mission-history.yaml ledgers may omit the
// `changes.*` arrays entirely, or omit one of added/modified/removed on an
// entry. normalizeHistoryData backfills the missing arrays to empty lists
// before validation so progressive ledgers remain readable by newer
// mission-spec versions. Existing wrong-typed values are preserved so schema
// validation still catches genuine type errors.
//
// v1.21.2 (Rev.5 Q2 — Codex): when `warnings` is provided, coercions of
// null/array/string blocks and null subfields push human-readable notices
// into the accumulator. Callers that want the legacy silent behaviour can
// continue to call normalizeHistoryData(data) with no warnings arg.
export function normalizeHistoryData(
  data: unknown,
  warnings?: string[],
): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const root = data as Record<string, unknown>;
  if (!Array.isArray(root.timeline)) return data;

  return {
    ...root,
    timeline: root.timeline.map((entry, i) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return entry;
      }
      const obj = entry as Record<string, unknown>;
      const changesCtx = warnings
        ? { warnings, path: `timeline[${i}].changes` }
        : undefined;
      const deltaCtx = warnings
        ? { warnings, path: `timeline[${i}].done_when_delta` }
        : undefined;
      return {
        ...obj,
        changes: normalizeDeltaBlock(obj.changes, changesCtx),
        done_when_delta: normalizeDeltaBlock(obj.done_when_delta, deltaCtx),
      };
    }),
  };
}

function formatErrors(errors: ErrorObject[] | null | undefined): string[] {
  return (errors ?? []).map((err: ErrorObject) => {
    const path = err.instancePath || "/";
    return `${path}: ${err.message}`;
  });
}

export function validateMission(data: unknown): ValidationResult {
  if (data === null || data === undefined || typeof data !== "object") {
    return { valid: false, errors: ["Input must be a non-null object"] };
  }

  const valid = validateMissionFn(data);
  return { valid, errors: valid ? [] : formatErrors(validateMissionFn.errors) };
}

export function validateHistory(data: unknown): ValidationResult {
  if (data === null || data === undefined || typeof data !== "object") {
    return { valid: false, errors: ["Input must be a non-null object"] };
  }

  const warnings: string[] = [];
  const valid = validateHistoryFn(normalizeHistoryData(data, warnings));
  const result: ValidationResult = {
    valid,
    errors: valid ? [] : formatErrors(validateHistoryFn.errors),
  };
  if (warnings.length > 0) result.warnings = warnings;
  return result;
}
