// ms-validate — schema-only validation of mission.yaml + mission-history.yaml
// Fast, deterministic, pre-commit-friendly. Does NOT run evaluateMission.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { validateMission, validateHistory } from "../schema/validator.js";

export interface ValidateResult {
  missionValid: boolean;
  missionErrors: string[];
  historyPresent: boolean;
  historyValid: boolean;
  historyErrors: string[];
  allValid: boolean;
}

function parseYaml(
  path: string,
  label: string,
): { value: unknown; error: string | null } {
  try {
    const text = readFileSync(path, "utf-8");
    return { value: parse(text), error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { value: null, error: `${label} parse error: ${msg}` };
  }
}

export function validateProject(projectDir: string): ValidateResult {
  const missionPath = join(projectDir, "mission.yaml");
  if (!existsSync(missionPath)) {
    return {
      missionValid: false,
      missionErrors: [`mission.yaml not found in ${projectDir}`],
      historyPresent: false,
      historyValid: true,
      historyErrors: [],
      allValid: false,
    };
  }

  const missionParse = parseYaml(missionPath, "mission.yaml");
  let missionValid = false;
  let missionErrors: string[] = [];
  if (missionParse.error) {
    missionErrors = [missionParse.error];
  } else {
    const r = validateMission(missionParse.value);
    missionValid = r.valid;
    missionErrors = [...r.errors];
    if (r.valid) {
      const refErrors = checkRefsInvariants(missionParse.value);
      if (refErrors.length > 0) {
        missionValid = false;
        missionErrors.push(...refErrors);
      }
    }
  }

  const historyPath = join(projectDir, "mission-history.yaml");
  const historyPresent = existsSync(historyPath);
  let historyValid = true;
  let historyErrors: string[] = [];
  if (historyPresent) {
    const historyParse = parseYaml(historyPath, "mission-history.yaml");
    if (historyParse.error) {
      historyValid = false;
      historyErrors = [historyParse.error];
    } else {
      const r = validateHistory(historyParse.value);
      historyValid = r.valid;
      historyErrors = r.errors;
    }
  }

  const allValid = missionValid && (!historyPresent || historyValid);
  return {
    missionValid,
    missionErrors,
    historyPresent,
    historyValid,
    historyErrors,
    allValid,
  };
}

function checkRefsInvariants(missionData: unknown): string[] {
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
