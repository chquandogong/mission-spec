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

  const valid = validateHistoryFn(data);
  return { valid, errors: valid ? [] : formatErrors(validateHistoryFn.errors) };
}
