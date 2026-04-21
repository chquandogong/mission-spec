export { validateMission, validateHistory } from "./schema/validator.js";
export type { ValidationResult } from "./schema/validator.js";
export { parseMissionFile } from "./core/parser.js";
export { loadAndValidateMission } from "./core/parser.js";
export { generateMissionDraft } from "./commands/init.js";
export { evaluateMission } from "./commands/eval.js";
export type { EvaluateOptions } from "./commands/eval.js";
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
export { generateMdrDraft } from "./commands/decide.js";
export type { DecideOptions, DecideResult } from "./commands/decide.js";
export {
  detectSchemaVersion,
  migrateMission,
  registerMigration,
  listMigrations,
} from "./core/migration.js";
export type {
  SchemaVersion,
  MigrationFn,
  MigrationResult,
} from "./core/migration.js";
export { verifyReconstructionReferences } from "./core/reconstruction-verifier.js";
export type {
  ReconstructionResult,
  ReconstructionOptions,
} from "./core/reconstruction-verifier.js";
export {
  loadHistory,
  getLatestEntry,
  getCurrentPhase,
} from "./core/history.js";
export { validateProject } from "./commands/validate.js";
export type { ValidateResult } from "./commands/validate.js";
export { backfillRelatedCommits } from "./commands/backfill-commits.js";
export type {
  CommitCandidate,
  BackfillProposal,
  BackfillResult,
} from "./commands/backfill-commits.js";
export { createSnapshot } from "./commands/snapshot.js";
export type { SnapshotResult } from "./commands/snapshot.js";
