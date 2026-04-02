// YAML/JSON 파싱 유틸리티
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

export function parseMissionFile(filePath: string): unknown {
  const content = readFileSync(filePath, 'utf-8');
  return parse(content);
}
