# Changelog

All notable changes to this project are recorded here.
This file is generated from `mission-history.yaml` — do not edit by hand.
Run `npm run changelog` to regenerate.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
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
_Architecture Assetization 완료 — 캡처/레지스트리/소비 계층을 닫아 Mission 자산만으로 현재 구조와 작업 맥락을 빠르게 복원할 수 있게 정리_

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
_Evaluator 확장성 + 스냅샷 자동화 — llm-eval 타입, 오버라이드 파일, mission-history 스키마, pre-commit 훅_

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
_Living Asset Registry 도입 — lineage 스키마, history 연동, 문서 정비_

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
_Claude Code marketplace 배포 준비, 제품 정체성을 portable task contract 도구로 확립_

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
_Codex/Gemini adversarial review 반영, 루트 API 정비_

### Added

- 루트 export API (src/index.ts)
- package.json exports 맵 (subpath import)
- evaluator automated eval 실행 로직 (execSync)

### Changed

- OpenCode 변환 TOML 배열 문법 수정
- conditional required fields for eval types 보강

## [1.1.0] - 2026-04-03 — BREAKING
_skill 이름 충돌 방지를 위한 ms-* prefix 및 /mission-spec: namespace 적용_

### Changed

- done_when: /ms:* → /mission-spec:ms-* 형식으로 통일
- approvals: /ms:init → /mission-spec:ms-init
- evals dogfood: /ms:eval → /mission-spec:ms-eval
- execution_hints: /ms:* → /mission-spec:ms-*
- constraint: dependency 설명에 ajv, yaml 명시 추가

## [1.0.0] - 2026-04-02 — BREAKING
_최초 릴리스 — 스키마, 4개 커맨드, 크로스 플랫폼 변환_

### Added

- mission.schema.json (JSON Schema Draft-07)
- ms-init, ms-eval, ms-status, ms-report 커맨드
- Cursor, Codex, OpenCode 플랫폼 변환
- README.md, 예제 3개 (bugfix, security, multi-agent)
- 테스트 suite (vitest)
