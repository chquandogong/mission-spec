import Ajv, { type ErrorObject } from 'ajv';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(
  readFileSync(resolve(__dirname, 'mission.schema.json'), 'utf-8'),
);
const historySchema = JSON.parse(
  readFileSync(resolve(__dirname, 'mission-history.schema.json'), 'utf-8'),
);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const ajv = new (Ajv as unknown as typeof Ajv.default)({ allErrors: true });
const validateMissionFn = ajv.compile(schema);
const validateHistoryFn = ajv.compile(historySchema);

function normalizeDeltaBlock(block: unknown): unknown {
  if (!block || typeof block !== "object" || Array.isArray(block)) {
    return { added: [], modified: [], removed: [] };
  }
  const obj = block as Record<string, unknown>;
  return {
    ...obj,
    added: obj.added ?? [],
    modified: obj.modified ?? [],
    removed: obj.removed ?? [],
  };
}

// Legacy/adopter compatibility: older mission-history.yaml ledgers may omit the
// `changes.*` arrays entirely, or omit one of added/modified/removed on an
// entry. normalizeHistoryData backfills the missing arrays to empty lists
// before validation so progressive ledgers remain readable by newer
// mission-spec versions. Existing wrong-typed values are preserved so schema
// validation still catches genuine type errors.
export function normalizeHistoryData(data: unknown): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const root = data as Record<string, unknown>;
  if (!Array.isArray(root.timeline)) return data;

  return {
    ...root,
    timeline: root.timeline.map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return entry;
      }
      const obj = entry as Record<string, unknown>;
      return {
        ...obj,
        changes: normalizeDeltaBlock(obj.changes),
        done_when_delta: normalizeDeltaBlock(obj.done_when_delta),
      };
    }),
  };
}

function formatErrors(errors: ErrorObject[] | null | undefined): string[] {
  return (errors ?? []).map((err: ErrorObject) => {
    const path = err.instancePath || '/';
    return `${path}: ${err.message}`;
  });
}

export function validateMission(data: unknown): ValidationResult {
  if (data === null || data === undefined || typeof data !== 'object') {
    return { valid: false, errors: ['Input must be a non-null object'] };
  }

  const valid = validateMissionFn(data);
  return { valid, errors: valid ? [] : formatErrors(validateMissionFn.errors) };
}

export function validateHistory(data: unknown): ValidationResult {
  if (data === null || data === undefined || typeof data !== 'object') {
    return { valid: false, errors: ['Input must be a non-null object'] };
  }

  const valid = validateHistoryFn(normalizeHistoryData(data));
  return { valid, errors: valid ? [] : formatErrors(validateHistoryFn.errors) };
}
