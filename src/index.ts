export { validateMission, validateHistory } from "./schema/validator.js";
export type { ValidationResult } from "./schema/validator.js";
export { parseMissionFile } from "./core/parser.js";
export { loadAndValidateMission } from "./core/parser.js";
export { generateMissionDraft } from "./commands/init.js";
export { evaluateMission } from "./commands/eval.js";
export { getMissionStatus } from "./commands/status.js";
export { generateMissionReport } from "./commands/report.js";
export { generateContext } from "./commands/context.js";
export {
  diffArchitectures,
  diffArchitectureFromGit,
} from "./core/arch-diff.js";
export { extractArchitecture } from "./core/architecture-extractor.js";
export type {
  ExtractedArchitecture,
  ExtractedModule,
  ExtractedEdge,
} from "./core/architecture-extractor.js";
export { validatePlugin } from "./core/plugin-validator.js";
export type { PluginValidationResult } from "./core/plugin-validator.js";
export {
  loadHistory,
  getLatestEntry,
  getCurrentPhase,
} from "./core/history.js";
