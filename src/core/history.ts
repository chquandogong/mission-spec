// mission-history.yaml 로더
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

export interface HistoryEntry {
  change_id: string;
  semantic_version: string;
  date: string;
  author: string;
  contributors?: string[];
  change_type: string;
  persistence: string;
  intent: string;
  changes: { added: string[]; modified: string[]; removed: string[] };
  done_when_delta: { added: string[]; modified: string[]; removed: string[] };
  impact_scope: Record<string, boolean>;
  breaking: boolean;
  risk?: string;
}

export interface EvolutionPhase {
  name: string;
  versions: string[];
  date_range: string;
  theme: string;
  description: string;
}

export interface KeyDecision {
  decision: string;
  version: string;
  rationale: string;
  status: string;
  mdr?: string;
}

export interface MissionHistory {
  meta: {
    mission_id: string;
    mission_title: string;
    tracking_since: string;
    total_revisions: number;
    latest_version: string;
  };
  timeline: HistoryEntry[];
  evolution_summary?: {
    phases: EvolutionPhase[];
    identity_evolution?: Array<{ version: string; identity: string }>;
    done_when_evolution?: Array<{ version: string; style: string }>;
  };
  key_decisions?: KeyDecision[];
}

export function loadHistory(projectDir: string): MissionHistory | null {
  const historyPath = join(projectDir, "mission-history.yaml");
  if (!existsSync(historyPath)) return null;

  const content = readFileSync(historyPath, "utf-8");
  return parse(content) as MissionHistory;
}

export function getLatestEntry(history: MissionHistory): HistoryEntry | null {
  if (!history.timeline || history.timeline.length === 0) return null;
  return history.timeline[0];
}

export function getCurrentPhase(
  history: MissionHistory,
): EvolutionPhase | null {
  if (!history.evolution_summary?.phases) return null;
  const phases = history.evolution_summary.phases;
  return phases[phases.length - 1];
}
