#!/usr/bin/env node
// Cross-platform mission.yaml 변환 스크립트
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';

const args = process.argv.slice(2);
const verify = args.includes('--verify');
const inputFile = args.find((a) => !a.startsWith('--')) ?? 'mission.yaml';

try {
  const content = readFileSync(resolve(inputFile), 'utf-8');
  const doc = parse(content);
  const m = doc.mission;

  if (!m || !m.title || !m.goal || !m.done_when) {
    console.error('Invalid mission.yaml: missing required fields');
    process.exit(1);
  }

  const mission = {
    title: m.title,
    goal: typeof m.goal === 'string' ? m.goal.trim() : String(m.goal),
    done_when: m.done_when,
    constraints: m.constraints,
  };

  // Dynamic import for ESM compatibility
  const { convertToCursor, convertToCodex, convertToOpenCode } = await import(
    '../dist/adapters/platforms.js'
  );

  const cursor = convertToCursor(mission);
  const codex = convertToCodex(mission);
  const opencode = convertToOpenCode(mission);

  if (verify) {
    let ok = true;
    if (!cursor.includes(mission.title)) { console.error('Cursor: missing title'); ok = false; }
    if (!codex.includes(mission.title)) { console.error('Codex: missing title'); ok = false; }
    if (!opencode.includes(mission.title)) { console.error('OpenCode: missing title'); ok = false; }
    if (ok) {
      console.log('All platform conversions verified successfully');
    } else {
      process.exit(1);
    }
  } else {
    writeFileSync('.cursorrules', cursor);
    writeFileSync('AGENTS.md', codex);
    writeFileSync('opencode.toml', opencode);
    console.log('Generated: .cursorrules, AGENTS.md, opencode.toml');
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
