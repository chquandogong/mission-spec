#!/usr/bin/env node
// mission.yaml schema 검증 스크립트
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { parse } from 'yaml';

const { validateMission } = await import('../src/schema/validator.js');

const fixturesDir = resolve('tests/fixtures');
const files = readdirSync(fixturesDir).filter((f) => f.endsWith('.yaml'));

let allValid = true;

for (const file of files) {
  const filePath = join(fixturesDir, file);
  const content = readFileSync(filePath, 'utf-8');
  const doc = parse(content);
  const result = validateMission(doc);

  const isExpectedInvalid = file.includes('invalid');

  if (isExpectedInvalid) {
    if (result.valid) {
      console.error(`FAIL: ${file} should be invalid but passed`);
      allValid = false;
    } else {
      console.log(`OK: ${file} — correctly rejected`);
    }
  } else {
    if (result.valid) {
      console.log(`OK: ${file} — valid`);
    } else {
      console.error(`FAIL: ${file} — ${result.errors.join(', ')}`);
      allValid = false;
    }
  }
}

if (allValid) {
  console.log('\nAll schema validations passed');
} else {
  console.error('\nSome validations failed');
  process.exit(1);
}
