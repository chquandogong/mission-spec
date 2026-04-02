import Ajv, { type ErrorObject } from 'ajv';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(
  readFileSync(resolve(__dirname, 'mission.schema.json'), 'utf-8'),
);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const ajv = new (Ajv as unknown as typeof Ajv.default)({ allErrors: true });
const validate = ajv.compile(schema);

export function validateMission(data: unknown): ValidationResult {
  if (data === null || data === undefined || typeof data !== 'object') {
    return { valid: false, errors: ['Input must be a non-null object'] };
  }

  const valid = validate(data);

  if (valid) {
    return { valid: true, errors: [] };
  }

  const errors = (validate.errors ?? []).map((err: ErrorObject) => {
    const path = err.instancePath || '/';
    return `${path}: ${err.message}`;
  });

  return { valid: false, errors };
}
