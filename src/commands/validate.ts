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
    missionErrors = r.errors;
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
