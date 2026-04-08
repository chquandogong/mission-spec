// YAML/JSON 파싱 + 스키마 검증 유틸리티
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { validateMission } from "../schema/validator.js";

export interface MissionDocument {
  mission: {
    title: string;
    goal: string;
    done_when: string[];
    constraints?: string[];
    approvals?: Array<{ gate: string; approver: string; description?: string }>;
    evals?: Array<{
      name: string;
      type: string;
      command?: string;
      pass_criteria?: string;
      description?: string;
    }>;
    budget_hint?: Record<string, unknown>;
    execution_hints?: Record<string, unknown>;
    skills_needed?: string[];
    artifacts?: string[];
    version?: string;
    author?: string;
    created?: string;
    lineage?: {
      initial_version: string;
      initial_date?: string;
      total_revisions?: number;
      history: string;
    };
  };
}

export function parseMissionFile(filePath: string): unknown {
  const content = readFileSync(filePath, "utf-8");
  return parse(content);
}

export function loadAndValidateMission(projectDir: string): MissionDocument {
  const missionPath = join(projectDir, "mission.yaml");
  if (!existsSync(missionPath)) {
    throw new Error(`mission.yaml not found in ${projectDir}`);
  }
  const content = readFileSync(missionPath, "utf-8");
  const doc = parse(content);

  const result = validateMission(doc);
  if (!result.valid) {
    throw new Error(`Schema validation failed: ${result.errors.join(", ")}`);
  }

  return doc as MissionDocument;
}
