// YAML/JSON parsing + schema validation utility
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
    design_refs?: {
      architecture?: string;
      api_surface?: string;
      type_definitions?: string;
      component_protocol?: string;
    };
    lineage?: {
      initial_version: string;
      initial_date?: string;
      total_revisions?: number;
      history: string;
    };
    done_when_refs?: Array<{
      index: number;
      kind: "command" | "file-exists" | "file-contains" | "eval-ref";
      value: string;
    }>;
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

  const refErrors = checkDoneWhenRefsInvariants(doc);
  if (refErrors.length > 0) {
    throw new Error(`Schema validation failed: ${refErrors.join(", ")}`);
  }

  return doc as MissionDocument;
}

export function checkDoneWhenRefsInvariants(missionData: unknown): string[] {
  const errors: string[] = [];
  const obj = missionData as {
    mission?: {
      done_when?: unknown;
      evals?: unknown;
      done_when_refs?: unknown;
    };
  };
  const mission = obj?.mission;
  if (!mission) return errors;
  const refs = mission.done_when_refs;
  if (!Array.isArray(refs) || refs.length === 0) return errors;

  const doneWhen = Array.isArray(mission.done_when) ? mission.done_when : [];
  const evalsArr = Array.isArray(mission.evals) ? mission.evals : [];
  const evalNames = new Set(
    evalsArr
      .map((e) =>
        e && typeof e === "object" ? (e as { name?: unknown }).name : undefined,
      )
      .filter((n): n is string => typeof n === "string"),
  );

  const seen = new Set<number>();
  for (const raw of refs) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as { index?: unknown; kind?: unknown; value?: unknown };
    if (typeof r.index !== "number") continue;
    if (r.index >= doneWhen.length) {
      errors.push(
        `/mission/done_when_refs: index ${r.index} out of range (done_when.length = ${doneWhen.length})`,
      );
    }
    if (seen.has(r.index)) {
      errors.push(`/mission/done_when_refs: duplicate index ${r.index}`);
    }
    seen.add(r.index);
    if (
      r.kind === "eval-ref" &&
      typeof r.value === "string" &&
      !evalNames.has(r.value)
    ) {
      errors.push(
        `/mission/done_when_refs: eval-ref value '${r.value}' not found in mission.evals[].name`,
      );
    }
  }
  return errors;
}
