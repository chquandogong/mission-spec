# Changelog

All notable changes to this project are recorded here.
This file is generated from `mission-history.yaml` — do not edit by hand.
Run `npm run changelog` to regenerate.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
## [1.16.3] - 2026-04-17
_Close E-6 from PROJECT_REVIEW_SNAPSHOT_V1.16.0_2026-04-17 — auto-sync CURRENT_STATE.md's Title line from mission.yaml.title via bump-metadata.js, promoting the v1.16.2 registry:check drift detector into a fix._

### Changed

- scripts/bump-metadata.js: new loadMissionTitle() reads mission.yaml via yaml parser; computeUpdates(version, missionTitle) now produces per-field change entries; apply loop dedupes writes by file; TITLE_RE added alongside VERSION_RE
- tests/scripts/bump-metadata.test.ts: +6 E-6 tests (Title rewrite on apply, check exits 1 on Title drift, Version+Title single pass, graceful mission.yaml absent, graceful no Title line, no-op when Title already matches)
- .mission/traceability/TRACE_MATRIX.yaml: bump-metadata.test cases 11 → 17; inline test count 231 → 237; header v1.16.2 → v1.16.3
- .mission/reconstruction/REBUILD_PLAYBOOK.md: test count 231 → 237
- mission.yaml + package.json + plugin.json + marketplace.json: version 1.16.2 → 1.16.3; mission.yaml title + lineage.total_revisions updated
- mission-history.yaml: meta.mission_title / total_revisions / latest_version bumped
- .mission/CURRENT_STATE.md: Title line AUTO-SYNCED to v1.16.3 via the new E-6 machinery itself (first dogfood — no manual edit this release)
- .mission/ Version headers auto-synced to 1.16.3 via metadata:sync (fourth real pre-commit invocation of D-3 machinery from v1.15.0)

## [1.16.2] - 2026-04-17
_Close E-5 and E-8 from PROJECT_REVIEW_SNAPSHOT_V1.16.0_2026-04-17 — extend the existing arch:verify and registry:check validators to catch two silent drift classes that the current (v1.16.1) verifiers miss._

### Changed

- scripts/generate-architecture.js: verifyCurrentMode package_exports check now includes subkey-set comparison and string-value comparison for every key common to pkg.exports and apiRegistry.public_api.package_exports; graceful handling for string-vs-object shape mismatches
- scripts/verify-registry.js: groundTruth reads mission.yaml for missionTitle + doneWhenCount; check() validates CURRENT_STATE.md Title line against mission.yaml title and 완료 조건 (N/M PASS) total against done_when length; also flags PASS > TOTAL absurdity
- tests/scripts/generate-architecture.test.ts: +3 E-5 tests (types path drift, import path drift, extra subkey)
- tests/scripts/verify-registry.test.ts: +5 E-8 tests (matching title+count pass, title drift, count drift, PASS>TOTAL absurdity, graceful absence)
- .mission/reconstruction/REBUILD_PLAYBOOK.md: test count 223 → 231
- .mission/traceability/TRACE_MATRIX.yaml: inline 223 → 231; test_coverage cases for generate-architecture 11 → 14 and verify-registry 9 → 14; category list expanded with E-5 and E-8 tags; header v1.16.0 → v1.16.2
- mission.yaml + package.json + plugin.json + marketplace.json: version 1.16.1 → 1.16.2; mission.yaml title + lineage.total_revisions updated
- mission-history.yaml: meta.mission_title / total_revisions / latest_version bumped
- .mission/CURRENT_STATE.md: Title line manually synced to v1.16.2 (E-6 stays partially open — validated now, still not auto-synced)
- .mission/ Version headers auto-synced to 1.16.2 via metadata:sync (third real pre-commit invocation of D-3 machinery from v1.15.0)

## [1.16.1] - 2026-04-17
_Close E-1 from PROJECT_REVIEW_SNAPSHOT_V1.16.0_2026-04-17 — promote reconstruction:cold-build from an opt-in local script to a blocking step in the release workflow, so every npm publish must first prove the tagged commit can rebuild from source in a clean environment._

### Changed

- .github/workflows/release.yml: new step 'Reconstruction cold-build gate' between arch:verify and Publish; runs `npm run reconstruction:cold-build` on every release path (tag push + workflow_dispatch dry-run and real publish)
- mission.yaml + package.json + plugin.json + marketplace.json: version 1.16.0 → 1.16.1; mission.yaml title + lineage.total_revisions updated
- mission-history.yaml: meta.mission_title / total_revisions / latest_version bumped
- .mission/ Version headers auto-synced to 1.16.1 via metadata:sync (second real pre-commit invocation of D-3 machinery from v1.15.0)

## [1.16.0] - 2026-04-17
_Close D-1 from PROJECT_REVIEW_V1.14.1_2026-04-17 — verify that numeric claims embedded in REBUILD_PLAYBOOK.md and TRACE_MATRIX.yaml stay synchronized with the live source (module/API/skill/platform/test counts)._

### Added

- scripts/verify-registry.js (TS-AST test counter, Korean-pattern playbook matcher, YAML test_coverage.cases sum, --list mode)
- tests/scripts/verify-registry.test.ts (9 tests: --list JSON output, matching claims pass, playbook module/test drift, TRACE_MATRIX inline drift, cases sum drift, graceful missing files, malformed YAML, unrelated numbers ignored)

### Changed

- package.json: scripts.registry:check + registry:list; version 1.15.0 → 1.16.0
- .github/workflows/pre-commit-parity.yml: new step 'npm run registry:check' after metadata:check
- .mission/reconstruction/REBUILD_PLAYBOOK.md: Phase 7 now lists 9+ verification axes (registry:check added as step 39); phase numbers renumbered to remove 42-43 collision; test count 214 → 223; test files 20 → 21
- .mission/traceability/TRACE_MATRIX.yaml: command_test aggregate 214 → 223; header '20 files / 214 tests' → '21 files / 223 tests'; verify-registry.test.ts entry added with 9 cases
- .mission/ 7 Version headers auto-synced to 1.16.0 via metadata:sync (first real pre-commit invocation of D-3 machinery from v1.15.0)
- .mission/CURRENT_STATE.md: Title line synced to v1.16.0
- mission.yaml + package.json + plugin.json + marketplace.json: version 1.15.0 → 1.16.0; mission.yaml title + lineage.total_revisions updated
- mission-history.yaml: meta bumped

## [1.15.0] - 2026-04-17
_Close D-3 from PROJECT_REVIEW_V1.14.1_2026-04-17 — automate .mission/ Version-header sync with package.json so patch releases cannot silently leave the descriptive layer stale again._

### Added

- scripts/bump-metadata.js (dry-run/apply/check modes; walks .mission/, excludes decisions+snapshots+templates+evals as historical)
- tests/scripts/bump-metadata.test.ts (11 tests: dry-run reporting, --apply rewrites, --check exit codes, idempotency, skip files without header, .md/.yaml filter, invalid semver error, missing .mission/ graceful, 3 exclusion cases for decisions/snapshots/templates)

### Changed

- package.json: scripts.metadata:check + metadata:sync; version 1.14.3 → 1.15.0
- .githooks/pre-commit: npm run metadata:sync + `git add -u .mission` between snapshot/changelog and arch:sync/verify
- .github/workflows/pre-commit-parity.yml: new step 'npm run metadata:check' after plugin:verify
- .mission/architecture/ARCHITECTURE_CURRENT.yaml: Version 1.14.0 → 1.15.0 (stale since v1.14.0 release; caught by first metadata:check dry-run)
- .mission/architecture/DEPENDENCY_GRAPH.yaml: Version 1.14.0 → 1.15.0 (same class of stale)
- .mission/{CURRENT_STATE.md, evidence/VERIFICATION_LOG.yaml, interfaces/API_REGISTRY.yaml, reconstruction/REBUILD_PLAYBOOK.md, traceability/TRACE_MATRIX.yaml}: Version 1.14.3 → 1.15.0 (applied via the new script — first dogfooding)
- .mission/CURRENT_STATE.md: Title line synced to v1.15.0 (not a Version header, manual edit)
- .mission/traceability/TRACE_MATRIX.yaml: command_test aggregate 203 → 214; header '19 files / 200 tests' → '20 files / 214 tests'; bump-metadata.test.ts entry added with 11 cases
- .mission/reconstruction/REBUILD_PLAYBOOK.md: Phase 7 now lists 8+ verification axes (metadata:check added); test count and file count updated
- mission.yaml + package.json + plugin.json + marketplace.json: version 1.14.3 → 1.15.0; mission.yaml title + lineage.total_revisions updated
- mission-history.yaml: meta bumped

## [1.14.3] - 2026-04-17
_Close D-2 from PROJECT_REVIEW_V1.14.1_2026-04-17 — extend arch:verify to detect drift between package.json.exports and API_REGISTRY.yaml.public_api.package_exports._

### Added

- tests/scripts/generate-architecture.test.ts: 3 new tests (missing key, extra key, matching case) + writePackageJson helper + writeApiRegistry second parameter for packageExports

### Changed

- scripts/generate-architecture.js: verifyCurrentMode now loads package.json and compares Object.keys(pkg.exports) with Object.keys(apiRegistry.public_api.package_exports); graceful skip when either is missing or not an object
- .mission/traceability/TRACE_MATRIX.yaml: command_test aggregate 200 → 203; generate-architecture.test.ts cases 8 → 11; new category 'package_exports missing/extra keys (v1.14.3 D-2)'; Version header 1.14.2 → 1.14.3
- .mission/{CURRENT_STATE.md, evidence/VERIFICATION_LOG.yaml, interfaces/API_REGISTRY.yaml, reconstruction/REBUILD_PLAYBOOK.md}: Version headers 1.14.2 → 1.14.3
- mission.yaml + package.json + plugin.json + marketplace.json: version 1.14.2 → 1.14.3; mission.yaml title + lineage.total_revisions updated
- mission-history.yaml: meta.mission_title / total_revisions / latest_version bumped

## [1.14.2] - 2026-04-17
_Close D-1 through D-5 from PROJECT_REVIEW_V1.14.1_2026-04-17 — Living Asset Registry descriptive-layer freshness, discovery-surface accuracy, and MDR-005 formalization of the meta-tooling boundary._

### Added

- .mission/decisions/MDR-005-meta-tooling-expansion-within-task-contract-scope.md (authored via generateMdrDraft() — first ms-decide dogfooding)
- docs/PROJECT_REVIEW_V1.14.1_2026-04-17.md (baseline review reframed from v1.8 → v1.14.1, introduces D-section with 5 open items)
- docs/claude-code/PROJECT_REVIEW_V1.14.1_2026-04-17.md (Claude Rev.2 — Codex reflection incorporated)
- docs/codex/PROJECT_REVIEW_V1.14.1_2026-04-17.md (Codex independent review)
- docs/gemini/review.md (Gemini surface-level review — kept as D-4 evidence, not as technical input)

### Changed

- README.md + README.ko.md + README.zh.md: skill list extended (+ ms-decide); Cross-Platform section listing 6 platforms with version tags; Current Scope covering CLI + MDR helper + drift detectors + migration + reconstruction verifier + release pipeline; Migration-script usage snippet added by maintainer
- .claude-plugin/marketplace.json: plugin description reworded to include 6 skills + CLI + 6 platforms + reconstruction verifier + all v1.14.0+ surfaces
- .mission/interfaces/API_REGISTRY.yaml: package_exports["./commands/decide"] added (was missing despite package.json having it since v1.14.0); Version header 1.14.0 → 1.14.2
- .mission/CURRENT_STATE.md: Version 1.14.1 → 1.14.2; Title line synced; recent-implementation section already covers v1.14.1 Unicode fix + MDR-005 + D-section close-out
- .mission/evidence/VERIFICATION_LOG.yaml: Version header 1.14.1 → 1.14.2
- .mission/reconstruction/REBUILD_PLAYBOOK.md: Version 1.7.0 → 1.14.2; module count 11 → 18 registry / 19 files; public API 11 → 22; skills 4 → 6; directory structure reflects 5 new core modules + 2 new commands + 3 extra adapters; 6-platform conversion replaces original 3; new Phase 6 (Meta-tooling) section added; verification phase expanded to 7+ axes; MDR-005 added to required reading
- .mission/traceability/TRACE_MATRIX.yaml: Version 1.7.0 → 1.14.2; schema.test.ts 33 → 35 cases; command_test aggregate 119 → 200; platforms.test.ts 14 → 21; MDR-005 decision_trace entry added (enforced_in: integrity verifiers / living-asset maintainers / distribution surface); test_coverage regenerated for current 19-file baseline
- mission-history.yaml: meta.mission_title / total_revisions / latest_version bumped; key_decisions extended with MDR-005 reference
- mission.yaml + package.json + plugin.json + marketplace.json: version 1.14.1 → 1.14.2; mission.yaml title + lineage.total_revisions updated

## [1.14.1] - 2026-04-17
_Fix ms-decide slug generation so it works on Korean/Chinese/Japanese titles — the exact case this trilingual project is most likely to hit._

### Added

- tests/commands/decide.test.ts: 3 new tests (Unicode slug preservation, Unicode-filename counting, punctuation-only fallback)

### Changed

- src/commands/decide.ts: Unicode-aware slugify with NFC normalization + 'decision' fallback; MDR_FILENAME regex broadened with /u flag
- .mission/CURRENT_STATE.md: synced to v1.14 state (title, goal, recent implementation section)
- .mission/evidence/VERIFICATION_LOG.yaml: updated with v1.14 test counts
- .mission/architecture/{ARCHITECTURE_CURRENT,DEPENDENCY_GRAPH}.yaml: header Last-updated 2026-04-17 | Version 1.14.1
- .mission/interfaces/API_REGISTRY.yaml: header Last-updated 2026-04-17 | Version 1.14.1
- mission.yaml + package.json + plugin.json + marketplace.json: version 1.14.0 → 1.14.1

## [1.14.0] - 2026-04-17
_Close the C-series from PROJECT_REVIEW_V1.8.0_2026-04-17 — long-term items: MDR authoring skill, platform breadth, schema migration infrastructure, reconstruction verification, adoption advisory._

### Added

- src/commands/decide.ts + tests/commands/decide.test.ts (9 tests: numbering, dedup, slugify, defaults, overrides)
- skills/ms-decide/SKILL.md + SKILL.ko.md + SKILL.zh.md (trilingual)
- src/adapters/platforms.ts: convertToCline, convertToContinue, convertToAider (+7 tests)
- src/core/migration.ts + tests/core/migration.test.ts (11 tests: version detection, identity, chained steps, throw-on-path, throw-on-fn-error, immutability, listMigrations)
- scripts/migrate-mission.js CLI (dry-run by default, --apply to overwrite)
- src/core/reconstruction-verifier.ts + tests (7 tests: happy, missing, prose-exemption, fenced-exemption, missing-playbook, custom-path, dedup)
- scripts/verify-reconstruction.js CLI (fast reference check; --cold-build for temp-dir ci+build+test)
- README 'Who uses Mission Spec' section (C-4 scaffold for human-driven adoption tracking)

### Changed

- src/index.ts: exported generateMdrDraft + 5 migration functions + verifyReconstructionReferences + 3 new platform converters
- package.json: bin entry kept; added migrate:dry-run/apply, reconstruction:verify/cold-build scripts; version 1.13.1 → 1.14.0; new ./commands/decide subpath export
- scripts/convert-platforms.js: generates 7 files total (3 originals + 3 new + .aider-mission.md); --verify covers all 6 platforms
- .mission/architecture/ARCHITECTURE_CURRENT.yaml: 4 new modules (decide, migration, reconstruction-verifier) + expanded platforms entry; surfaced by arch:verify
- .mission/architecture/DEPENDENCY_GRAPH.yaml: mirrored new nodes
- .mission/interfaces/API_REGISTRY.yaml: ms-decide skill registered; 5 migration functions + generateMdrDraft + verifyReconstructionReferences added; 4 new file_contracts (.clinerules, .continuerules, .aider.conf.yml, .aider-mission.md)
- mission.yaml: title and version bumped to v1.14.0

## [1.13.1] - 2026-04-17
_Tighten drift detection to be symmetric and harden the npm publish path against releases from non-main refs._

### Added

- tests/scripts/generate-architecture.test.ts: 2 new cases (extra depends_on phantom detection, API_REGISTRY ghost function detection)

### Changed

- scripts/generate-architecture.js: verifyCurrentMode now symmetric (detects both missing and extra depends_on) and validates API_REGISTRY.yaml public_api.functions against src/index.ts extractor output
- .github/workflows/release.yml: replaced 'Verify tag matches package.json' with 'Verify publish ref matches package.json and origin/main'; adds ref-type check and ancestry check via git merge-base
- mission.yaml + package.json + plugin.json + marketplace.json: version 1.13.0 → 1.13.1

## [1.13.0] - 2026-04-17
_Close the remaining B-series gaps — publish pipeline, historical entry i18n, and internal docs audit._

### Added

- .github/workflows/release.yml (tag-triggered npm publish with provenance, pre-flight tag coherence check)
- docs/internal/STATUS.md (gitignored freshness audit, classifies older notes as historical)

### Changed

- src/schema/mission-history.schema.json: added intent_ko + decision_ko optional fields with descriptions
- mission-history.yaml: translated intent/decision of v1.0.0–v1.7.0 entries to English; preserved Korean originals under intent_ko/decision_ko
- CONTRIBUTING.md: added 'Cutting a Release' section referencing release.yml and dry-run mode
- mission.yaml + package.json + plugin.json + marketplace.json: version 1.12.0 → 1.13.0

## [1.12.0] - 2026-04-17
_Ship a proper CLI (npx mission-spec <cmd>) and broaden ms-init heuristics to cover English-only inputs. Combined addresses B-4 and B-7 from the v1.8 review._

### Added

- bin/mission-spec.js (CLI dispatcher, Node shebang, executable)
- tests/bin/cli.test.ts (8 tests: help, --version, each subcommand, unknown command, cwd default)

### Changed

- package.json: bin field for mission-spec entry; version 1.11.0 → 1.12.0
- src/commands/init.ts: verb lists refactored to arrays; word-boundary regex for English; expanded from 4 to 25 English implementation verbs, 4 to 7 test verbs, 4 to 9 docs verbs
- tests/commands/init.test.ts: added English-only inputs describe block (6 tests)
- mission.yaml: title and version bumped to v1.12.0

## [1.11.0] - 2026-04-17
_Plugin manifest drift — close the last gap from Codex's v1.2 'documentation ahead of implementation' critique by mechanically verifying plugin.json, marketplace.json, and SKILL.md coherence._

### Added

- src/core/plugin-validator.ts
- scripts/validate-plugin.js (CLI wrapper, exits 1 on any error)
- tests/core/plugin-validator.test.ts (8 tests: happy path, each version drift type, SKILL frontmatter/name/description, trilingual missing, plugin.json missing fields, empty skill dir)

### Changed

- src/index.ts: export validatePlugin and PluginValidationResult type
- package.json: plugin:verify script; version 1.10.0 → 1.11.0
- .claude-plugin/plugin.json: version 1.8.0 → 1.11.0 (was pre-existing drift, caught by first run)
- .claude-plugin/marketplace.json: plugins[0].version 1.8.0 → 1.11.0 (same drift)
- .mission/architecture/ARCHITECTURE_CURRENT.yaml: added plugin-validator module (surfaced by arch:verify)
- .mission/architecture/DEPENDENCY_GRAPH.yaml: added plugin-validator node
- .mission/interfaces/API_REGISTRY.yaml: added validatePlugin public function
- .github/workflows/pre-commit-parity.yml: added plugin:verify step
- .github/workflows/test.yml: added plugin:verify step after platforms verify
- mission.yaml: title and version bumped to v1.11.0

## [1.10.0] - 2026-04-17
_Architecture drift — automate what was manual. Extract module list, dependency edges, and public API surface from src/ so ARCHITECTURE_CURRENT.yaml cannot silently fall out of sync with code._

### Added

- src/core/architecture-extractor.ts (regex-based extractor, deterministic sort)
- scripts/generate-architecture.js (default write / --check / --verify-current)
- tests/core/architecture-extractor.test.ts (8 tests: modules, layer, import resolution, external-skip, d.ts/test.ts exclusion, re-exports, public_api, determinism)
- tests/scripts/generate-architecture.test.ts (6 tests: default mode, --check pass/fail, --verify-current pass/fail/path-mismatch)
- .mission/architecture/ARCHITECTURE_COMPUTED.yaml (auto-generated baseline, 14 modules)

### Changed

- .mission/architecture/ARCHITECTURE_CURRENT.yaml: added architecture-extractor and index modules (surfaced by verify-current)
- .mission/architecture/DEPENDENCY_GRAPH.yaml: added architecture-extractor and index nodes
- .mission/interfaces/API_REGISTRY.yaml: added extractArchitecture public function
- src/index.ts: export extractArchitecture + related types
- package.json: add arch:sync, arch:check, arch:verify scripts; version 1.9.0 → 1.10.0
- .githooks/pre-commit: auto-run arch:sync + arch:verify after build exists
- .github/workflows/pre-commit-parity.yml: build dist/, verify arch:sync determinism, run arch:verify
- mission.yaml: title and version bumped to v1.10.0

## [1.9.0] - 2026-04-17
_Governance hardening — close the gaps between the v1.8 Living Asset Registry and a shippable open-source project (CI, license, contributor path, coverage floor)_

### Added

- LICENSE (MIT full text)
- CONTRIBUTING.md (dev workflow, mission-history conventions, PR checklist)
- CHANGELOG.md (generated from mission-history.yaml)
- .github/ISSUE_TEMPLATE/bug_report.md
- .github/ISSUE_TEMPLATE/feature_request.md
- .github/PULL_REQUEST_TEMPLATE.md
- .github/workflows/test.yml (Node 20 + 22 matrix, build + lint + test:coverage + platforms verify)
- .github/workflows/pre-commit-parity.yml (validate-history-commits + snapshot dedup check)
- scripts/generate-changelog.js (Keep-a-Changelog formatter, idempotent)
- tests/scripts/generate-changelog.test.ts (6 tests — format, BREAKING label, idempotency, missing history, empty subsections, absolute --output paths)

### Changed

- package.json: add changelog and test:coverage scripts; add @vitest/coverage-v8 devDependency; version 1.8.0 → 1.9.0
- vitest.config.ts: v8 coverage provider, thresholds lines=80 / functions=80 / branches=75 / statements=80
- mission.yaml: title and version bumped to v1.9.0
- .githooks/pre-commit: auto-regenerate CHANGELOG.md and git add before validate; Korean comment translated to English
- .github/workflows/pre-commit-parity.yml: added CHANGELOG determinism verification step (git diff --exit-code after regen)
- scripts/generate-changelog.js: --output handles absolute paths and auto-creates parent directories via mkdirSync(recursive: true)
- tests/scripts/generate-changelog.test.ts: added 6th test covering absolute --output paths with nested directory

## [1.8.0] - 2026-04-15
_Trilingual documentation (en/zh/ko) and English-only codebase — internationalize user-facing docs while unifying all source code, schemas, metadata, and error messages to English_

### Added

- README.ko.md (Korean README)
- README.zh.md (Chinese README)
- skills/ms-init/SKILL.ko.md, SKILL.zh.md
- skills/ms-eval/SKILL.ko.md, SKILL.zh.md
- skills/ms-status/SKILL.ko.md, SKILL.zh.md
- skills/ms-report/SKILL.ko.md, SKILL.zh.md
- skills/ms-context/SKILL.ko.md, SKILL.zh.md

### Changed

- README.md: rewritten in English with language switcher
- All 5 SKILL.md: rewritten in English with language switcher
- src/commands/init.ts: error messages and heuristic suggestions to English
- src/core/evaluator.ts: all evaluation reason strings to English
- src/core/history.ts: error message to English
- src/core/parser.ts, src/core/reporter.ts: comments to English
- src/schema/mission.schema.json: all field descriptions to English
- src/schema/mission-history.schema.json: descriptions to English
- package.json, plugin.json, marketplace.json: descriptions to English
- scripts/validate-history-commits.js: all messages to English
- tests/commands/eval.test.ts, tests/scripts/validate-history-commits.test.ts: expected strings updated
- src/commands/{status,report,context,eval}.ts, src/adapters/platforms.ts, src/core/arch-diff.ts: header comments to English
- scripts/{validate-schema,convert-platforms,snapshot-mission}.js: comments and console messages to English

## [1.7.0] - 2026-04-14
_Architecture Assetization complete — close the capture/registry/consumption layers so the current structure and work context can be quickly reconstructed from Mission assets alone._

### Added

- design_refs 스키마 필드 (mission.schema.json, DesignRefs definition)
- architecture_delta history 스키마 필드 (mission-history.schema.json)
- architecture_doc_freshness eval (mission.yaml, llm-eval 타입)
- .mission/architecture/ARCHITECTURE_CURRENT.yaml (11 모듈 registry)
- .mission/architecture/DEPENDENCY_GRAPH.yaml (14 edges directed graph)
- .mission/interfaces/API_REGISTRY.yaml (12 functions, 5 skills, 5 file contracts)
- .mission/traceability/TRACE_MATRIX.yaml (9 requirements, 4 MDR traces, 11 test files)
- src/commands/context.ts + generateContext public API + ./commands/context subpath export
- skills/ms-context/SKILL.md
- .mission/reconstruction/REBUILD_PLAYBOOK.md
- .mission/evidence/VERIFICATION_LOG.yaml
- .mission/evals/architecture_doc_freshness.result.yaml
- scripts/validate-history-commits.js
- tests/scripts/validate-history-commits.test.ts
- ArchitectureDelta, ModuleEntry, InterfaceChange TypeScript types
- src/core/arch-diff.ts + diffArchitectures/diffArchitectureFromGit public API
- scripts/architecture-diff.js (CLI: npm run arch-diff [ref])
- tests/core/arch-diff.test.ts (8 tests)

### Changed

- mission.yaml: design_refs 추가, architecture_doc_freshness eval 추가
- src/core/parser.ts: MissionDocument에 design_refs 필드
- src/core/history.ts: ArchitectureDelta 관련 타입 추가
- src/commands/report.ts + src/core/reporter.ts: TRACE_MATRIX 기반 Traceability 표 렌더링
- README.md: ms-context, design_refs, Living Asset Registry 범위 업데이트
- README.md: history validator의 bootstrap + HEAD self-reference 예외 규칙 명시
- docs/internal/ARCHITECTURE.md + docs/internal/CLAUDE.md: v1.7.0 구조 기준으로 동기화
- skills/ms-eval/SKILL.md + skills/ms-report/SKILL.md: architecture freshness / traceability 문서화
- .mission/CURRENT_STATE.md, ARCHITECTURE_CURRENT.yaml, DEPENDENCY_GRAPH.yaml, API_REGISTRY.yaml: Tier 3 완료 상태 반영
- .githooks/pre-commit + CHANGE_ENTRY_TEMPLATE + versioning docs: history commit validation 연결
- scripts/validate-history-commits.js: mission-history bootstrap commit과 현재 HEAD의 history-touching commit만 self-reference 예외 처리
- src/core/arch-diff.ts: invalid git ref는 empty-old fallback이 아니라 명시적 오류로 처리

## [1.6.0] - 2026-04-13
_Evaluator extensibility + snapshot automation — llm-eval type, override files, mission-history schema, pre-commit hook._

### Added

- scripts/snapshot-mission.js (버전 기반 dedup 스냅샷 스크립트)
- .githooks/pre-commit (스냅샷 자동 생성 훅)
- src/schema/mission-history.schema.json (strict JSON Schema)
- validateHistory() public API (src/schema/validator.ts, src/index.ts)
- llm-eval eval 타입 + .mission/evals/<name>.result.yaml 오버라이드 로더 (src/core/evaluator.ts)
- tests/scripts/snapshot.test.ts (스냅샷 스크립트 통합 테스트)

### Changed

- mission.schema.json: llm-eval enum + 조건부 pass_criteria 필수
- history.ts: loadHistory()가 schema validation 수행
- commands/status.ts + commands/report.ts: history 오류 시 historyWarning으로 graceful fallback
- core/reporter.ts: changes 필드 null-safe + ## History 경고 섹션
- package.json: snapshot 스크립트, build glob(*.schema.json)
- SKILL 파일 (ms-eval, ms-status, ms-report): 새 기능 문서화
- README.md: llm-eval + 스냅샷 훅 + validateHistory 가이드

## [1.5.0] - 2026-04-08
_Introduce the Living Asset Registry — lineage schema, history integration, documentation cleanup._

### Added

- src/core/history.ts (mission-history.yaml 로더)
- lineage 필드 (mission.schema.json, Lineage definition)
- mission-history.yaml (루트, 변경 원장)
- .mission/ 디렉토리 (snapshots, decisions, templates, CURRENT_STATE)
- MDR 4건 (task-contract-only, ms-prefix, minimal-deps, done-when-eval-linking)

### Changed

- ms-status: Evolution 섹션 추가 (phase, revisions, timeline)
- ms-report: Recent Changes 섹션 추가 (최근 3건)
- ms-init: lineage + version 자동 생성
- README.md, SKILL 파일 전체 업데이트

## [1.4.0] - 2026-04-07
_Prepare for Claude Code marketplace distribution; establish the product identity as a portable task-contract tool._

### Added

- .claude-plugin/plugin.json
- .claude-plugin/marketplace.json
- marketplace 설치 가이드 (README)

### Changed

- title: 'Claude Code Plugin 구현' → 'Core API + Claude Code Skills'
- goal: 'plugin으로 구현/배포' → 'core library + skill bundle, portable task contract 도구'
- done_when 전면 재작성 (선언적 → 검증 가능한 기술 기준)
- evals 이름: schema_validity→schema_validation_passes, cross_platform→cross_platform_verifies
- artifacts: .claude-plugin/manifest.json → .claude-plugin/plugin.json

## [1.2.0] - 2026-04-07
_Incorporate the Codex/Gemini adversarial review; tidy the root API surface._

### Added

- 루트 export API (src/index.ts)
- package.json exports 맵 (subpath import)
- evaluator automated eval 실행 로직 (execSync)

### Changed

- OpenCode 변환 TOML 배열 문법 수정
- conditional required fields for eval types 보강

## [1.1.0] - 2026-04-03 — BREAKING
_Apply ms-* prefix and /mission-spec: namespace to all skills to avoid name collisions._

### Changed

- done_when: /ms:* → /mission-spec:ms-* 형식으로 통일
- approvals: /ms:init → /mission-spec:ms-init
- evals dogfood: /ms:eval → /mission-spec:ms-eval
- execution_hints: /ms:* → /mission-spec:ms-*
- constraint: dependency 설명에 ajv, yaml 명시 추가

## [1.0.0] - 2026-04-02 — BREAKING
_Initial release — schema, 4 commands, cross-platform conversion._

### Added

- mission.schema.json (JSON Schema Draft-07)
- ms-init, ms-eval, ms-status, ms-report 커맨드
- Cursor, Codex, OpenCode 플랫폼 변환
- README.md, 예제 3개 (bugfix, security, multi-agent)
- 테스트 suite (vitest)
