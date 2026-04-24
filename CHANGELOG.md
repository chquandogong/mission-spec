# Changelog

All notable changes to this project are recorded here.
This file is generated from `mission-history.yaml` — do not edit by hand.
Run `npm run changelog` to regenerate.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
## [1.21.11] - 2026-04-24
_권장 작업 5번 구현. mission.yaml의 `approvals[]` 블록 4 gates(schema_design / first_command / cross_platform / release)가 전부 pre-v1.0.0 릴리스 시점 맥락으로 현재 활성 가치 없는 stale 상태임을 정리. 블록 전체 제거 + 주석으로 이유 명시. 역사 기록은 v1.0.0 snapshot(immutable)에 보존._

### Changed

- mission.yaml: approvals[] 블록(4 entries) 제거 + 주석 기록 (원본은 v1.0.0 snapshot 참조 안내)
- mission.yaml: title + version 1.21.10 → 1.21.11 + lineage.total_revisions 58 → 59
- mission-history.yaml: 본 entry prepend + meta 갱신 + v1.21.10 related_commits 백필(fac1451)
- package.json + .claude-plugin/plugin.json + .claude-plugin/marketplace.json + package-lock.json: version 1.21.10 → 1.21.11
- .mission/ Version 헤더 + CURRENT_STATE Title + CHANGELOG.md: metadata:sync + changelog 자동 갱신
- .mission/evidence/VERIFICATION_LOG.yaml: v1.21.11 entry 추가
- .mission/CURRENT_STATE.md 최근 구현 섹션에 v1.21.11 bullet 추가 + version range v1.14.2 ~ v1.21.11
- .mission/snapshots/2026-04-24_v1.21.11_mission.yaml 신규

### Removed

- mission.yaml approvals[] 4 entries (schema_design / first_command / cross_platform / release)

## [1.21.10] - 2026-04-24
_권장 작업 4번 구현. README 3종(EN/KO/ZH)의 설치 가이드를 npm install primary로 재구성하고, done_when[5] '`README.md 존재`'를 'README가 npm install primary 설치 가이드 + 4 skill API 사용 예시 제공' functional contract로 복원한다. MDR-009 §V에서 v1.21.10 owner로 명시된 항목의 closure._

### Added

- scripts/verify-readme.js (신규 validator, 10 required markers 체크)
- mission.yaml evals[]: readme_install_guide_valid entry 추가
- .mission/snapshots/2026-04-24_v1.21.10_mission.yaml

### Changed

- README.md / README.ko.md / README.zh.md: 5-Minute Installation Guide 3 locale Method 1 → npm install primary로 재배치 (npx CLI + 라이브러리 API import + sigstore 검증 경로). 기존 Method 1(Claude Code Marketplace) → Method 2, Method 2(Source) → Method 3(기여자용 라벨), Method 3(Local plugin) → Method 4. MDR-007 trilingual 정합
- mission.yaml done_when[5]: 'README.md 존재' → 'README가 npm install primary 설치 가이드 + 4 skill API 사용 예시 제공'
- mission.yaml done_when_refs[5]: kind file-exists → eval-ref, value README.md → readme_install_guide_valid
- mission.yaml: title + version 1.21.9 → 1.21.10 + lineage.total_revisions 57 → 58
- mission-history.yaml: 본 entry prepend + meta 갱신 + v1.21.9 related_commits 백필(f929c2c)
- package.json + .claude-plugin/plugin.json + .claude-plugin/marketplace.json + package-lock.json: version 1.21.9 → 1.21.10
- .mission/ Version 헤더 + CURRENT_STATE Title + CHANGELOG.md: metadata:sync + changelog 자동 갱신
- .mission/evidence/VERIFICATION_LOG.yaml: v1.21.10 entry 추가 (ref_kind eval-ref 10 달성 기록)
- .mission/CURRENT_STATE.md 최근 구현 섹션에 v1.21.10 bullet 추가 + version range v1.14.2 ~ v1.21.10

## [1.21.9] - 2026-04-24
_v1.0.0 → v1.21.8 goal 진화 과정을 governance 문서로 공식 기록한다. 2026-04-23 self-audit에서 노출된 3 drift 축(goal wording / done_when 약화→복원 / distribution axis 전환)을 MDR-009로 통합. 권장 작업 3번 구현. MDR-005~008에 이은 다섯 번째 governance MDR._

### Added

- .mission/decisions/MDR-009-goal-evolution-v1.0.0-to-v1.21.8.md (신규 MDR, §I-§V 구조)
- .mission/snapshots/2026-04-24_v1.21.9_mission.yaml

### Changed

- mission.yaml: title + version 1.21.8 → 1.21.9 + lineage.total_revisions 56 → 57
- mission-history.yaml: 본 entry prepend + meta 갱신 + v1.21.8 related_commits 백필(ce41196)
- package.json + .claude-plugin/plugin.json + .claude-plugin/marketplace.json + package-lock.json: version 1.21.8 → 1.21.9
- .mission/ Version 헤더 + CURRENT_STATE Title + CHANGELOG.md: metadata:sync + changelog 자동 갱신
- .mission/evidence/VERIFICATION_LOG.yaml: v1.21.9 entry 추가
- .mission/CURRENT_STATE.md 최근 구현 섹션에 v1.21.9 bullet 추가 + version range v1.14.2 ~ v1.21.9

## [1.21.8] - 2026-04-24
_`.github/workflows/release.yml`의 `git fetch origin main --depth=1`이 tag가 origin/main tip이 아닐 때 merge-base --is-ancestor를 실패시키는 latent bug를 수정한다. v1.21.6 publish 시 최초 발현 (c3465d8이 origin/main HEAD, 2c06941이 tag → is-ancestor fail). `--depth=1` 제거로 해결. 이후 multi-commit-ahead tag 재시도 가능해짐._

### Added

- .mission/snapshots/2026-04-24_v1.21.8_mission.yaml

### Changed

- .github/workflows/release.yml: line 70 `git fetch origin main --depth=1` → `git fetch origin main` + 설명 주석 추가 (MSC-2026-04-24-001 참조 포함)
- mission.yaml: title + version 1.21.7 → 1.21.8 + lineage.total_revisions 55 → 56
- mission-history.yaml: 본 entry prepend + meta.total_revisions 55 → 56 + latest_version 1.21.7 → 1.21.8 + mission_title sync + v1.21.7 related_commits 백필(c3465d8)
- package.json + .claude-plugin/plugin.json + .claude-plugin/marketplace.json + package-lock.json: version 1.21.7 → 1.21.8
- .mission/ Version 헤더 + CURRENT_STATE Title + CHANGELOG.md: metadata:sync + changelog 자동 갱신
- .mission/evidence/VERIFICATION_LOG.yaml: v1.21.8 entry 추가 + v1.21.6 gap 기록
- .mission/CURRENT_STATE.md 최근 구현 섹션에 v1.21.8 bullet 추가 + version range v1.14.2 ~ v1.21.8

## [1.21.7] - 2026-04-23
_v1.21.6 self-dogfooding 후속. done_when[0..4]의 약화된 '파일 존재' 문구를 '기능 동작' 계약으로 복원하고, 각 인덱스를 해당 skill의 test file을 실행하는 신규 eval에 바인딩한다. 권장 작업 2번 구현. done_when 문구가 실질적 기능 주장을 담도록 계약의 의미적 수준을 올린다._

### Added

- .mission/snapshots/2026-04-23_v1.21.7_mission.yaml
- mission.yaml evals[]: ms_init_functional / ms_eval_functional / ms_status_functional / ms_report_functional / plugin_manifest_valid (5 신규 automated evals, 각각 npm test -- <test file> 서브셋 실행)

### Changed

- mission.yaml done_when[0..4]: 문구를 '파일 존재' → '기능 동작' 계약으로 재작성 (5 entries)
- mission.yaml done_when_refs[0..4]: file-exists → eval-ref로 kind 전환, value를 신규 evals[] 이름으로 바인딩 (5 entries)
- mission.yaml: title + version 1.21.6 → 1.21.7 + lineage.total_revisions 54 → 55
- mission-history.yaml: 본 entry prepend + meta.total_revisions 54 → 55 + latest_version 1.21.6 → 1.21.7 + mission_title sync + v1.21.6 related_commits 백필(2c06941)
- package.json + .claude-plugin/plugin.json + .claude-plugin/marketplace.json + package-lock.json: version 1.21.6 → 1.21.7
- .mission/ Version 헤더 + CURRENT_STATE Title + CHANGELOG.md: metadata:sync + changelog 자동 갱신
- .mission/evidence/VERIFICATION_LOG.yaml: v1.21.7 entry 추가 (ref_kind 분포 변화 기록)
- .mission/CURRENT_STATE.md 최근 구현 섹션에 v1.21.7 bullet 추가 + version range v1.14.2 ~ v1.21.7

## [1.21.6] - 2026-04-23
_자기 자신의 mission.yaml done_when 10개를 v1.21.0 IMP-10 `done_when_refs`로 explicit하게 바인딩한다. audit 결과 10개 criteria 전부 `resolved_by: "inference"`로 평가되고 있었다 — Mission Spec은 ms-status drift 경고로 adopter에게 inference-only 계약을 경고하면서 자기 자신엔 동일 기능을 적용하지 않는 self-dogfooding 구멍이 있었다._

### Added

- mission.yaml `done_when_refs:` block (10 entries, 1:1 done_when[] mapping)
- .mission/snapshots/2026-04-23_v1.21.6_mission.yaml

### Changed

- mission.yaml: title + version 1.21.5 → 1.21.6 + lineage.total_revisions 53 → 54 + done_when_refs 10 entries
- mission-history.yaml: 본 entry prepend + meta.total_revisions 53 → 54 + latest_version 1.21.5 → 1.21.6 + mission_title sync
- package.json + .claude-plugin/plugin.json + .claude-plugin/marketplace.json + package-lock.json: version 1.21.5 → 1.21.6
- .mission/ Version 헤더 + CURRENT_STATE Title + CHANGELOG.md: metadata:sync + changelog 자동 갱신
- .mission/evidence/VERIFICATION_LOG.yaml: v1.21.6 entry 추가 (10/10 ref resolution 확증)
- .mission/CURRENT_STATE.md 최근 구현 섹션에 v1.21.6 bullet + version range v1.14.2 ~ v1.21.6

## [1.21.5] - 2026-04-23
_Rev.6 3-vendor synthesis §7.4의 P1 6건 중 docs/config/MDR 성격의 3건(A/B/E)을 단일 §PATCH로 묶는다. Gemini Rev.6 Q4 지적(tarball disparity)에 대응해 `package.json`에 명시적 `files` whitelist 추가, 같은 Q4 관찰을 adopter가 README로 읽을 수 있게 trilingual 안내 섹션 추가, Claude/Gemini Rev.6에서 합의한 MDR-008 amendment(`§CURRENT_STATE` compaction rule + `§PHASE-BOUNDARY` signal 계층 + `v1.21.4 = phase boundary` 공식화)._

### Added

- .mission/snapshots/2026-04-23_v1.21.5_mission.yaml
- package.json `files` field (whitelist)
- README.md / README.ko.md / README.zh.md 신규 `## npm package vs repository (v1.21.5+)` 섹션 (trilingual, MDR-007 정합)
- .mission/decisions/MDR-008 amendment block (§CURRENT_STATE / §PHASE-BOUNDARY / §V1.21.4 / §COMPACTION / §FUTURE)

### Changed

- mission.yaml: title + version 1.21.5 + lineage.total_revisions 52 → 53
- mission-history.yaml: 본 entry prepend + meta.total_revisions 52 → 53 + latest_version 1.21.4 → 1.21.5 + mission_title sync
- package.json + .claude-plugin/plugin.json + .claude-plugin/marketplace.json + package-lock.json: version 1.21.4 → 1.21.5
- .mission/ Version 헤더 + CURRENT_STATE Title + CHANGELOG.md: metadata:sync + changelog 자동 갱신
- .mission/evidence/VERIFICATION_LOG.yaml: v1.21.5 entry 추가 (tarball slim 수치 포함)
- .mission/CURRENT_STATE.md 최근 구현 섹션에 v1.21.5 bullet 추가 + version range v1.14.2 ~ v1.21.5

## [1.21.4] - 2026-04-23
_F-1 tag push 실전 publish 과정에서 드러난 npm provenance validation 실패를 해결한다. `package.json`에 `repository`/`homepage`/`bugs` 필드를 추가해 sigstore provenance bundle이 요구하는 `repository.url` 매칭(GitHub Actions workflow source와 대조)을 가능하게 한다._

### Added

- .mission/snapshots/2026-04-23_v1.21.4_mission.yaml
- package.json: `repository` / `homepage` / `bugs` 필드 (npm provenance 요구사항)

### Changed

- mission.yaml: title + version + lineage.total_revisions 1.21.4로 bump
- mission-history.yaml: 본 entry prepend + meta.total_revisions 51 → 52 + latest_version 1.21.3 → 1.21.4 + mission_title sync
- package.json + .claude-plugin/plugin.json + .claude-plugin/marketplace.json + package-lock.json: version 1.21.3 → 1.21.4
- .mission/ Version 헤더 + CURRENT_STATE Title + CHANGELOG.md: metadata:sync + changelog 자동 갱신
- .mission/evidence/VERIFICATION_LOG.yaml: v1.21.4 entry 추가
- .mission/CURRENT_STATE.md 최근 구현 섹션에 v1.21.4 bullet 추가 + version range v1.14.2 ~ v1.21.4

## [1.21.3] - 2026-04-23
_F-1 cold-build gate 실전 dry-run 과정에서 표출된 Node.js 20 deprecation warning(2026-09-16 deadline)을 선제적으로 닫는다. `.github/workflows/`의 `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4` 총 7 pin을 `@v5`로 bump한다._

### Added

- .mission/snapshots/2026-04-23_v1.21.3_mission.yaml

### Changed

- .github/workflows/release.yml: actions/checkout@v4 → v5, actions/setup-node@v4 → v5
- .github/workflows/test.yml: actions/checkout@v4 → v5, actions/setup-node@v4 → v5, actions/upload-artifact@v4 → v5
- .github/workflows/pre-commit-parity.yml: actions/checkout@v4 → v5, actions/setup-node@v4 → v5
- mission.yaml: title + version + lineage.total_revisions 1.21.3으로 bump
- mission-history.yaml: 본 entry prepend + meta.total_revisions 50 → 51 + latest_version 1.21.2 → 1.21.3 + mission_title sync
- package.json + .claude-plugin/plugin.json + .claude-plugin/marketplace.json + package-lock.json: version 1.21.2 → 1.21.3
- .mission/ Version 헤더 + CURRENT_STATE Title + CHANGELOG.md: metadata:sync + changelog 자동 갱신
- .mission/evidence/VERIFICATION_LOG.yaml: v1.21.3 entry 추가 (F-1 실전 호출 기록 포함)
- .mission/CURRENT_STATE.md 최근 구현 섹션에 v1.21.3 bullet 추가 + version range v1.14.2 ~ v1.21.3

## [1.21.2] - 2026-04-23
_Rev.5 3-vendor independent reviews (Claude §5.2 / Codex Q1~Q3 / Gemini Q5)에서 수렴된 P1 fix 4건을 단일 §PATCH 번들로 처리한다.
(a) SAFE_COMMAND_CLAUSE_PATTERNS phrase-level allowlist를 backtick-prefix allowlist와 일치화하여 동일 커맨드가 backtick 여부에 따라 비대칭 auto-detect되던 Claude+Codex 동시 지적을 해소.
(b) normalizeHistoryData가 null/array/string block을 empty delta로 silent coerce하던 Codex 지적에 대해, 검증 verdict은 그대로 두고 ValidationResult.warnings 필드로 notice만 노출 (warning-only; strict fail은 v1.22.0 §MINOR로 이월).
(c) reconstruction-verifier.looksLikeRepoPath가 slash-less filename과 glob pattern을 silently 무시하던 Gemini 지적을 해소 — slash-less는 repo 스캔으로, glob은 간이 glob walker로 해결.
(d) templates/pre-commit 설치 주석의 `$_` (POSIX sh 엄격 모드에서 미정의) 제거, 명시적 경로 반복으로 교체 (Codex Q3).
_

### Added

- .mission/snapshots/2026-04-23_v1.21.2_mission.yaml
- tests/core/history.test.ts: loadHistory warnings emission 테스트 (3 tests)

### Changed

- src/core/evaluator.ts: SAFE_COMMAND_CLAUSE_PATTERNS 12 entry 확장 (pnpm/yarn/bun/pytest/go test/cargo fmt --check) + SAFE_COMMAND_SUCCESS_HINT에 exit 0/without warnings/validated/passes CI 추가
- src/schema/validator.ts: ValidationResult에 optional warnings 필드, normalizeHistoryData/normalizeDeltaBlock에 warnings accumulator param, validateHistory가 warnings 수집 및 반환
- src/core/history.ts: loadHistory가 warnings를 console.warn([mission-history] prefix)으로 emit
- src/core/reconstruction-verifier.ts: looksLikeRepoPath → classifyToken 리팩터 + slashlessFileExists + globHasMatch/globWalk/segmentToRegex 간이 glob 추가
- templates/pre-commit: Install 주석의 $_ 제거, 명시적 .git/hooks/pre-commit 경로 사용
- tests/commands/eval.test.ts: Rev.5 Q1 parity 6 tests (+36 → 42)
- tests/schema.test.ts: Rev.5 Q2 warnings 5 tests (+42 → 47)
- tests/core/reconstruction-verifier.test.ts: Rev.5 Q5 slash-less + glob 5 tests (+7 → 12)
- mission.yaml: title + version + lineage.total_revisions 1.21.2로 bump
- mission-history.yaml: 본 entry prepend + meta.total_revisions 49 → 50 + latest_version 1.21.1 → 1.21.2 + mission_title sync
- package.json + .claude-plugin/plugin.json + .claude-plugin/marketplace.json + package-lock.json: version 1.21.1 → 1.21.2
- .mission/ Version 헤더 + CURRENT_STATE.md Title: metadata:sync 자동 반영
- CHANGELOG.md: v1.21.2 entry 추가 (auto)
- .mission/traceability/TRACE_MATRIX.yaml: 350 → 369 tests (eval +6, schema +5, reconstruction +5, history +3)
- .mission/reconstruction/REBUILD_PLAYBOOK.md: 350 → 369 tests
- .mission/evidence/VERIFICATION_LOG.yaml: v1.21.2 entry 추가
- .mission/CURRENT_STATE.md 최근 구현 섹션에 v1.21.2 bullet 추가 + version range v1.14.2~v1.21.2
- .mission/interfaces/API_REGISTRY.yaml: ValidationResult 타입에 optional warnings 필드 반영

## [1.21.1] - 2026-04-23
_IMP-10 v1.21.0에서 도입한 `done_when_refs` ref dispatch가 `evaluateCriterion` 내에서 shared-scope skip 이후에 실행되어, 실 git repo + `scope: "shared"` + gitignored path 조건이 동시 성립하면 refs가 shared-skip에 선점되는 latent ordering 버그를 수정한다. Rev.5 Claude 단독 리뷰 §5.1 지적._

### Added

- .mission/snapshots/2026-04-23_v1.21.1_mission.yaml

### Changed

- src/core/evaluator.ts: evaluateCriterion 내 ref dispatch 블록과 shared-scope skip 블록 순서 swap (ref 우선)
- tests/commands/eval.test.ts: 'ref wins over shared-scope skip in a real git repo with gitignored path' regression test 추가 (+1, 349 → 350)
- mission.yaml: title + version + lineage.total_revisions를 1.21.1로 bump
- mission-history.yaml: 본 entry prepend + meta.total_revisions 48 → 49 + latest_version 1.21.0 → 1.21.1 + mission_title sync
- package.json + .claude-plugin/plugin.json + .claude-plugin/marketplace.json + package-lock.json: version 1.21.0 → 1.21.1
- .mission/ Version 헤더 + CURRENT_STATE.md Title: metadata:sync 자동 반영
- CHANGELOG.md: v1.21.1 entry 추가 (auto)
- .mission/traceability/TRACE_MATRIX.yaml: 349 → 350 tests (eval.test.ts +1)
- .mission/reconstruction/REBUILD_PLAYBOOK.md: 349 → 350 tests
- .mission/evidence/VERIFICATION_LOG.yaml: v1.21.1 entry 추가
- CURRENT_STATE.md 최근 구현 섹션에 v1.21.1 bullet 추가 + version range v1.14.2~v1.21.1

## [1.21.0] - 2026-04-22
_qmonster adopter review에서 드러난 prose-heavy done_when의 구조화 부재(shared eval 14/86 중 나머지 72개가 manual)를 해결하기 위해 mission.yaml에 optional `done_when_refs` sibling field를 도입한다. 각 ref는 done_when[index]에 대한 explicit validator 바인딩(command / file-exists / file-contains / eval-ref 4 kind)을 제공한다. refs가 있는 index는 그 결과가 truth이고, refs가 없는 index는 v1.20.0 inference fallback을 유지한다._

### Added

- .mission/snapshots/2026-04-22_v1.21.0_mission.yaml

### Changed

- src/schema/mission.schema.json: done_when_refs field 추가 (array of {index, kind, value})
- src/core/evaluator.ts: DoneWhenRef/ResolvedBy/RefKind types; runRef dispatcher + 4 kind helpers; CriterionResult에 resolved_by/ref_kind 추가; 모든 return path에 resolved_by 세팅; llm-eval awaiting의 resolved_by를 'inference'로 보정
- src/commands/eval.ts: evaluateMission이 mission.done_when_refs를 읽어 전달; DoneWhenRef import + 재수출
- src/commands/validate.ts: checkRefsInvariants 추가 (index range / duplicate / eval-ref orphan)
- src/commands/status.ts: detectDoneWhenDrift를 resolved_by='manual' 기반으로 재분류; detectRefsCoverage + ## refs coverage 섹션 추가; StatusResult에 refsCoverage 필드
- src/index.ts: DoneWhenRef/ResolvedBy/RefKind/CriterionResult 타입 재수출
- scripts/verify-registry.js: 3 drift axis + refsCount/refsByKind/refsCoverage ground truth 확장
- tests/schema.test.ts + tests/commands/{eval,validate,status}.test.ts + tests/bin/cli.test.ts + tests/scripts/verify-registry.test.ts: 총 +33 tests (316 → 349)
- .mission/architecture/{ARCHITECTURE_CURRENT,ARCHITECTURE_COMPUTED,DEPENDENCY_GRAPH}.yaml: done_when_refs 반영
- .mission/interfaces/API_REGISTRY.yaml: DoneWhenRef/ResolvedBy/RefKind/CriterionResult.resolved_by/ref_kind 반영
- .mission/traceability/TRACE_MATRIX.yaml: 24 test files, 349 cases로 업데이트
- .mission/reconstruction/REBUILD_PLAYBOOK.md: 349 tests / 25 public API + 3 types 반영
- .mission/CURRENT_STATE.md: 최근 구현 bullet + version range v1.14.2~v1.21.0
- .mission/evidence/VERIFICATION_LOG.yaml: v1.21.0 entry 추가
- README.md + README.ko.md + README.zh.md: 신규 Explicit gate linkage (v1.21.0+) 섹션 (MDR-007 trilingual)
- CHANGELOG.md: v1.21.0 entry 추가 (mission-history.yaml에서 자동 생성)
- mission.yaml + package.json + plugin.json + marketplace.json + package-lock.json: version 1.20.1 → 1.21.0

## [1.20.1] - 2026-04-22
_정적 검토에서 드러난 self-description drift를 정리하고, MDR-006 §PATCH 규칙에 맞게 docs-only correction을 v1.20.1로 정식 bump한다. ms-context skill의 Public API 표기를 실제 구현에 맞추고, README/CONTRIBUTING/API registry/CLI 주석이 현재 CLI surface와 저장소 pre-commit 동작을 정확히 반영하도록 수정한다. 동시에 CHANGELOG의 중복 [1.20.0] 섹션을 제거한다._

### Added

- .mission/snapshots/2026-04-22_v1.20.1_mission.yaml

### Changed

- skills/ms-context/SKILL.md + SKILL.ko.md + SKILL.zh.md: Public API를 `generateContext(projectDir) => ContextResult`로 정정
- README.md + README.ko.md + README.zh.md: 실제 CLI surface와 checked-in `.githooks/pre-commit` 동작 설명으로 정렬
- CONTRIBUTING.md + .mission/interfaces/API_REGISTRY.yaml: hook contract를 실제 저장소 동작(changelog, metadata sync, arch sync/verify 포함)과 일치시킴
- bin/mission-spec.js: 상단 지원 명령 주석을 현재 CLI help와 동일하게 정리
- mission.yaml: title + version + lineage.total_revisions를 1.20.1로 retag
- mission-history.yaml: 본 entry의 semantic_version 1.20.0 → 1.20.1 retag; meta.total_revisions 46 → 47; meta.latest_version 1.20.0 → 1.20.1; meta.mission_title v1.20.1 title 반영
- package.json + .claude-plugin/plugin.json + .claude-plugin/marketplace.json + package-lock.json: version 1.20.0 → 1.20.1
- .mission/ Version 헤더 + CURRENT_STATE.md Title: metadata:sync 자동 반영 (1.20.1)
- CHANGELOG.md: `npm run changelog`로 재생성 — 중복 [1.20.0] 섹션 제거, [1.20.1] 2026-04-22 엔트리 단일화
- CURRENT_STATE.md 최근 구현 섹션에 v1.20.1 retag bullet 추가

## [1.20.0] - 2026-04-21
_qmonster adopter review에서 드러난 현실 제약을 Mission Spec 쪽에서 흡수한다. sparse legacy history ledger를 backward-compatible하게 읽고, shared clone에서는 gitignored local-only artifact를 요구하는 criteria를 건너뛰며, prose/backticked command success clauses를 안전 범위에서 자동 평가해 adopter가 self-dogfooding 규범을 그대로 따라야만 하는 구조를 완화한다._

### Changed

- src/schema/validator.ts + src/core/history.ts: sparse legacy history normalization (`normalizeHistoryData`) 추가
- src/core/evaluator.ts + src/commands/eval.ts + src/commands/status.ts + src/index.ts: `EvaluateOptions` / shared-scope / safe inferred command clauses 지원
- bin/mission-spec.js: `eval --shared` / `status --shared` CLI surface 추가
- tests/schema.test.ts + tests/commands/{eval,status,validate}.test.ts + tests/bin/cli.test.ts: legacy history normalization, shared-mode skip, inferred command clause coverage 추가
- .mission/traceability/TRACE_MATRIX.yaml + REBUILD_PLAYBOOK.md + CURRENT_STATE.md + VERIFICATION_LOG.yaml: 316-test baseline + v1.20.0 adopter-compat 상태로 동기화
- .mission/interfaces/API_REGISTRY.yaml + .mission/architecture/ARCHITECTURE_CURRENT.yaml + docs/internal/{ARCHITECTURE,CLAUDE}.md: new signatures / evaluator behavior / shared-clone surface 반영
- README.md + README.ko.md + README.zh.md: shared mode usage와 legacy history normalization 안내 추가
- mission.yaml + mission-history.yaml + CHANGELOG.md + package.json + plugin.json + marketplace.json + package-lock.json: v1.20.0 release metadata 동기화

## [1.19.3] - 2026-04-21
_정밀 검토에서 드러난 self-description drift를 정식 PATCH로 정리한다. `backfill-commits --apply` 실제 실패를 수정하고, registry/evidence 메타데이터 drift를 기계적으로 잡도록 강화하며, `architecture_doc_freshness`를 실제 완료 게이트로 승격해 저장소가 주장하는 mission complete 상태와 실제 평가 기준을 일치시킨다._

### Changed

- bin/mission-spec.js: positional arg 해석을 non-flag 기반으로 수정해 `backfill-commits --apply` 경로 파싱 버그 해소
- tests/bin/cli.test.ts: `backfill-commits --apply` without projectDir 회귀 테스트 추가
- scripts/verify-registry.js + tests/scripts/verify-registry.test.ts: lineage.total_revisions drift + VERIFICATION_LOG top-entry version drift 감지 추가
- mission.yaml: version/title 1.19.3로 bump, lineage.total_revisions 45 반영, `architecture_doc_freshness`를 실제 done_when gate로 기록
- .mission/CURRENT_STATE.md + TRACE_MATRIX.yaml + REBUILD_PLAYBOOK.md + VERIFICATION_LOG.yaml + architecture_doc_freshness.result.yaml: 10/10 completion gate, 최신 evidence, 버전/설명 문구 정렬
- mission-history.yaml + CHANGELOG.md + package.json + plugin.json + marketplace.json + package-lock.json: 정식 PATCH revision 메타데이터로 동기화

## [1.19.2] - 2026-04-21
_v1.19.0에서 `createSnapshot(projectDir)` library API를 도입한 후 `scripts/snapshot-mission.js`의 로직이 API와 중복되어 있었음. 이를 thin wrapper로 리팩터 — 기존 self-hook 동작(mission.yaml 부재 시 silent exit 0, same-day dedup silent) 완전 보존하면서 내부 구현 중복 제거. v1.19.0 IMP-7 follow-up에 예고된 cleanup._

### Changed

- scripts/snapshot-mission.js: 57 → 33 lines. createSnapshot(cwd) import + delegate; mission.yaml 부재 silent-exit + same-day dedup silent 로직만 wrapper 본체에 유지. 내부 중복 제거 (yaml parse, filename 계산, dedup, copyFileSync 모두 library 측으로)
- mission.yaml + package.json + plugin.json + marketplace.json + package-lock.json: version 1.19.1 → 1.19.2
- mission-history.yaml: meta bump + 신규 timeline entry
- .mission/ Version 헤더 auto-synced to 1.19.2 via metadata:sync; CURRENT_STATE.md Title line + 최근 구현 bullet 추가

## [1.19.1] - 2026-04-21
_F-9 (Living Asset Registry 누적 크기 원칙) 미해결 거버넌스 축을 MDR-008으로 성문화. 기존 MDR-005(scope) / MDR-006(SemVer) / MDR-007(locale)에 이은 4번째 governance 축. qmonster B-3 IMP 시퀀스(v1.16.17~v1.19.0) 완료 후 남은 non-code follow-up 중 본 세션 내 완결 가능한 항목._

### Added

- .mission/decisions/MDR-008-living-asset-registry-retention-and-compaction-policy.md: 107 lines / 9 sections (Context / Decision § INVARIANT+TIMELINE+SNAPSHOTS+EVIDENCE+EVALS+DECISIONS / Rationale / Consequences / Alternatives Considered)

### Changed

- mission.yaml + package.json + plugin.json + marketplace.json + package-lock.json: version 1.19.0 → 1.19.1
- mission-history.yaml: meta bump + 신규 timeline entry
- .mission/ Version 헤더 auto-synced to 1.19.1 via metadata:sync; CURRENT_STATE.md Title line + 최근 구현 bullet 추가

## [1.19.0] - 2026-04-21
_mission.yaml 버전별 snapshot 생성을 portable library API + CLI subcommand로 노출. 기존 `scripts/snapshot-mission.js` 로직을 `createSnapshot(projectDir)` public API로 병행 제공 (script 자체는 self-hook 안정성 보호 차원에서 변경 안 함). qmonster B-3 IMP 시퀀스의 6번째 axis이자 최종 항목._

### Added

- src/commands/snapshot.ts: `SnapshotResult` interface (exported) + `createSnapshot(projectDir): SnapshotResult` helper (exported) + internal `formatDate` helper
- tests/commands/snapshot.test.ts: 7 신규 unit tests — 새 snapshot 생성 / 동일 버전 dedup / mission.yaml 부재 throw / version 필드 부재 throw / .mission/snapshots/ 자동 생성 / 반환 필드 정확성 / 파일명 형식
- tests/bin/cli.test.ts: 1 신규 integration test — `snapshot` subcommand 성공 시 'snapshot created' 출력 + 파일명 패턴 확인 (기존 11 유지, 총 12)
- bin/mission-spec.js: `snapshot` case + HELP 업데이트 + `createSnapshot` import
- src/index.ts: `createSnapshot` function + `SnapshotResult` type export 추가 (public API 24 → 25 functions)
- README.md + README.ko.md + README.zh.md: 신규 `## Snapshot on commit (v1.19.0+)` (EN) / `## 커밋 시 snapshot (v1.19.0+)` (KO) / `## 提交时快照（v1.19.0+）` (ZH) 섹션 (MDR-007 trilingual) — 2-step pre-commit hook 예시 포함
- docs/superpowers/specs/2026-04-21-imp7-snapshot-cli-design.md + docs/superpowers/plans/2026-04-21-imp7-snapshot-cli.md — brainstorming/writing-plans 산출물 (로컬 전용, docs/ gitignore)

### Changed

- .mission/architecture/ARCHITECTURE_CURRENT.yaml: `snapshot` 모듈 entry 추가 (modules 20 → 21) + index depends_on에 snapshot 추가
- .mission/architecture/DEPENDENCY_GRAPH.yaml: `snapshot` node 추가 (edges 없음 — 모듈이 src/ 내 다른 모듈에 의존하지 않음)
- .mission/interfaces/API_REGISTRY.yaml: `createSnapshot` function entry 추가 (public API 24 → 25)
- .mission/traceability/TRACE_MATRIX.yaml: `snapshot.test.ts` entry 신규 (cases 7); `cli.test.ts` cases 11 → 12 + 'snapshot subcommand (v1.19.0)' category; header total 296 → 304, files 23 → 24; version header v1.18.0 → v1.19.0
- .mission/reconstruction/REBUILD_PLAYBOOK.md: `npm test` 설명 296 → 304 tests, 23 → 24 files; 모듈 수 20 → 21; public API 24 → 25
- mission.yaml + package.json + plugin.json + marketplace.json + package-lock.json: version 1.18.0 → 1.19.0
- mission-history.yaml: meta bump + 신규 timeline entry
- .mission/ Version 헤더 auto-synced to 1.19.0 via metadata:sync; CURRENT_STATE.md Title line + 최근 구현 bullet 추가

## [1.18.0] - 2026-04-21
_adopter가 mission-history.yaml의 빈 related_commits 배열을 git log 날짜 매칭으로 retrofit할 수 있도록 `backfill-commits` CLI subcommand + `backfillRelatedCommits` public API를 제공. qmonster B-3 IMP 시퀀스의 5번째 axis — 이전 4개(v1.16.17/18/19/v1.17.0)와 달리 과거 이력의 traceability 공백을 소급 보완하는 repair 도구._

### Added

- src/commands/backfill-commits.ts: `CommitCandidate` + `BackfillProposal` + `BackfillResult` interfaces (all exported) + `backfillRelatedCommits(projectDir, options?)` helper (exported) + internal `addDays` + `enumerateCommits` helpers (git log 실패 graceful degrade)
- tests/commands/backfill-commits.test.ts: 9 신규 unit tests — empty timeline / already-populated skip / auto-apply / ambiguous / no-candidates classification / ±1 day window (before+after) / apply writes / apply safety(ambiguous NOT written)
- tests/bin/cli.test.ts: 1 신규 integration test — `backfill-commits` dry-run에서 'Scanning' + 'AUTO-APPLY' 출력 확인 (기존 10 유지, 총 11)
- bin/mission-spec.js: `backfill-commits` case + `--apply` 플래그 파싱 + HELP 업데이트 + `backfillRelatedCommits` import
- src/index.ts: `backfillRelatedCommits` function + `CommitCandidate`/`BackfillProposal`/`BackfillResult` type exports 추가 (public API 23 → 24 functions)
- README.md + README.ko.md + README.zh.md: 신규 `## Backfilling related_commits (v1.18.0+)` (EN) / `## related_commits 백필 (v1.18.0+)` (KO) / `## 回填 related_commits（v1.18.0+）` (ZH) 섹션 (MDR-007 trilingual)
- docs/superpowers/specs/2026-04-21-imp6-backfill-commits-design.md + docs/superpowers/plans/2026-04-21-imp6-backfill-commits.md — brainstorming/writing-plans 산출물 (로컬 전용, docs/ gitignore)

### Changed

- src/core/history.ts: `HistoryEntry` interface에 `related_commits?: string[]` 옵셔널 필드 추가 (TS 타입 보정 — YAML과 schema에는 이미 존재)
- .mission/architecture/ARCHITECTURE_CURRENT.yaml: `backfill-commits` 모듈 entry 추가 (modules 19 → 20) + index depends_on에 backfill-commits 추가
- .mission/architecture/DEPENDENCY_GRAPH.yaml: `backfill-commits` node 추가, `backfill-commits → history` edge 추가
- .mission/interfaces/API_REGISTRY.yaml: `backfillRelatedCommits` function entry 추가 (public API 23 → 24)
- .mission/traceability/TRACE_MATRIX.yaml: `backfill-commits.test.ts` entry 신규 (cases 9); `cli.test.ts` cases 10 → 11 + 'backfill-commits subcommand (v1.18.0)' category; header total 286 → 296, files 22 → 23; version header v1.17.0 → v1.18.0
- .mission/reconstruction/REBUILD_PLAYBOOK.md: `npm test` 설명 286 → 296 tests, 22 → 23 files; 모듈 수 19 → 20; public API 23 → 24
- mission.yaml + package.json + plugin.json + marketplace.json + package-lock.json: version 1.17.0 → 1.18.0
- mission-history.yaml: meta bump + 신규 timeline entry
- .mission/ Version 헤더 auto-synced to 1.18.0 via metadata:sync; CURRENT_STATE.md Title line + 최근 구현 bullet 추가

## [1.17.0] - 2026-04-21
_adopter가 mission.yaml + mission-history.yaml의 schema 무결성을 commit boundary에서 강제할 수 있도록 `validate` CLI subcommand + portable pre-commit hook template을 제공. qmonster B-3 IMP 시퀀스의 4번째 axis — 이전 3개(v1.16.17 scaffolding / v1.16.18 done_when drift / v1.16.19 meta staleness)는 모두 `ms-status` 출력 축 확장이었고, IMP-5는 처음으로 `ms-init` / install path를 확장._

### Added

- src/commands/validate.ts: `ValidateResult` interface (exported) + `validateProject(projectDir): ValidateResult` helper (exported) + internal `parseYaml` helper
- tests/commands/validate.test.ts: 7 신규 unit tests — mission.yaml 부재 / YAML parse error / schema invalid / history 부재 / 둘 다 valid / history schema invalid / history YAML parse error
- tests/bin/cli.test.ts: 2 신규 integration tests — `validate` subcommand valid (exit 0, 'schema valid' 출력) / invalid (exit 1, 'schema INVALID' 출력) (기존 8 유지, 총 10)
- templates/pre-commit: POSIX sh 5줄 — shebang + 주석 4줄 + `npx mission-spec validate` 본문. adopter는 `.git/hooks/`로 복사 + chmod +x. npm package에 자동 포함.
- bin/mission-spec.js: `validate` case + HELP 업데이트 + `validateProject` import
- src/index.ts: `validateProject` + `ValidateResult` type export 추가 (public API 22 → 23 functions)
- README.md + README.ko.md + README.zh.md: 신규 `## Pre-commit validation` (EN) / `## 커밋 전 검증` (KO) / `## 提交前校验` (ZH) 섹션 — 3개 언어 동시 추가 (MDR-007)
- skills/ms-init/SKILL.md + SKILL.ko.md + SKILL.zh.md: 신규 `## Post-init: install pre-commit hook (v1.17.0+)` 섹션 — 3개 언어 동시 추가 (MDR-007)
- docs/superpowers/specs/2026-04-21-imp5-schema-pre-commit-hook-design.md + docs/superpowers/plans/2026-04-21-imp5-schema-pre-commit-hook.md — brainstorming/writing-plans 산출물 (로컬 전용, docs/ gitignore)

### Changed

- .mission/architecture/ARCHITECTURE_CURRENT.yaml: `validate` 모듈 entry 추가 (modules 18 → 19) + index depends_on에 validate 추가
- .mission/architecture/DEPENDENCY_GRAPH.yaml: `validate` node 추가, `validate → validator` edge 추가
- .mission/interfaces/API_REGISTRY.yaml: `validateProject` function entry 추가 (public API 22 → 23)
- .mission/traceability/TRACE_MATRIX.yaml: `validate.test.ts` entry 신규 (cases 7); `cli.test.ts` cases 8 → 10 + 'validate subcommand (v1.17.0)' category; header total 277 → 286, files 21 → 22; version header v1.16.19 → v1.17.0
- .mission/reconstruction/REBUILD_PLAYBOOK.md: `npm test` 설명 277 → 286 tests, 21 → 22 files; 모듈 수 18 → 19; public API 22 → 23
- mission.yaml + package.json + plugin.json + marketplace.json + package-lock.json: version 1.16.19 → 1.17.0
- mission-history.yaml: meta bump + 신규 timeline entry
- .mission/ Version 헤더 auto-synced to 1.17.0 via metadata:sync; CURRENT_STATE.md Title line + 최근 구현 bullet 추가

## [1.16.19] - 2026-04-21
_`ms-status`에 meta staleness 경고 추가. 2026-04-21 qmonster 2차 감사에서 `mission_title`이 초기 phase값으로 fossilize되어 실제 진행 상태와 drift하는 패턴 + `tracking_mode`가 single-user를 선언하나 실제 contributor에는 AI 제공자가 포함되는 패턴을 확인. v1.16.17 scaffolded-but-empty + v1.16.18 done_when drift에 이은 `ms-status` health-check 서피스의 세 번째 axis._

### Added

- src/commands/status.ts: `MetaStaleness` interface (exported), `detectMetaStaleness(history, missionTitle)` helper (exported), `SINGLE_USER_TERMS` + `AI_CONTRIBUTOR_TERMS` module-const, `quoteTruncate` + `shortTruncate` truncate helpers (internal), `StatusResult.metaStaleness?: MetaStaleness[]` optional field, conditional `## meta staleness` markdown render
- tests/commands/status.test.ts: 10 신규 테스트 — Rule 1 detect (3) / Rule 1 skip-absent (8) / Rule 1 long-truncate (9) / Rule 2 detect (4) / Rule 2 skip-no-AI (6) / Rule 2 skip-no-keyword (7) / no-history undefined (1) / healthy empty-array (2) / both-rules order (5) / Rule 2 dedupe+sample (10) (기존 20 유지, 총 30)
- skills/ms-status/SKILL.md + SKILL.ko.md + SKILL.zh.md: `## meta staleness Section (v1.16.19+)` 섹션 3개 언어 동시 추가; `## Notes`/`## 주의`/`## 注意`에 omission + mission_id-non-goal bullets 2개씩 추가 (MDR-007 trilingual policy)
- docs/superpowers/specs/2026-04-21-imp4-meta-staleness-design.md + docs/superpowers/plans/2026-04-21-imp4-meta-staleness.md — brainstorming/writing-plans 산출물 (로컬 전용, docs/ gitignore)

### Changed

- src/core/history.ts: `MissionHistory.meta`에 `tracking_mode?: string` 필드 추가 (schema에는 이미 optional이었으나 TS 타입 누락 보정)
- .mission/traceability/TRACE_MATRIX.yaml: status.test.ts cases 20 → 30 + 'meta staleness (v1.16.19)' category; header total 267 → 277; version header v1.16.18 → v1.16.19
- .mission/reconstruction/REBUILD_PLAYBOOK.md: `npm test` 설명 267 → 277 tests
- mission.yaml + package.json + plugin.json + marketplace.json + package-lock.json: version 1.16.18 → 1.16.19
- mission-history.yaml: meta bump + 신규 timeline entry
- .mission/ Version 헤더 auto-synced to 1.16.19 via metadata:sync; CURRENT_STATE.md Title line + 최근 구현 bullet 추가

## [1.16.18] - 2026-04-21
_`ms-status`에 done_when drift 경고 추가. 2026-04-21 qmonster 2차 감사에서 ms-eval 0/50의 근본 원인 — done_when이 산문체로 작성되어 evaluator heuristic이 어느 경로에도 매칭 못 함 — 을 status 출력 단계에서 즉시 surface. v1.16.17 scaffolded-but-empty axis에 이어 `ms-status` health-check 서피스의 두 번째 axis._

### Added

- src/commands/status.ts: `detectDoneWhenDrift(criteria)` helper (module export), `formatDriftSample(entry)` helper (internal), `StatusResult.doneWhenDrift?: string[]` optional field, conditional `## done_when drift` markdown render (Scaffolding 다음에 위치)
- tests/commands/status.test.ts: 8 신규 테스트 — drift=0 no-section / TEST_PATTERN 포함 / llm-eval+automated 제외 / drift=1 inline-colon / drift=3 all-drift inline / drift=2 partial inline / drift=4 Sample + truncation + (+1 more) / drift=5 all-drift Sample + (+2 more) (기존 12 유지, 총 20)
- tests/commands/eval.test.ts: 1 신규 테스트 — marker-contract invariant (TEST_PATTERN + fallback path 양쪽 reason에 'manual verification required' 포함 lock). 기존 16 유지, 총 17.
- skills/ms-status/SKILL.md + SKILL.ko.md + SKILL.zh.md: `## done_when drift Section (v1.16.18+)` 섹션 3개 언어 동시 추가; `## Notes`에 omission bullet 1개씩 추가 (MDR-007 trilingual policy)
- docs/superpowers/specs/2026-04-21-imp3-done-when-drift-design.md + docs/superpowers/plans/2026-04-21-imp3-done-when-drift.md — brainstorming/writing-plans 산출물 (로컬 전용, docs/ gitignore)

### Changed

- .mission/traceability/TRACE_MATRIX.yaml: status.test.ts cases 12 → 20 + 'done_when drift (v1.16.18)' category; eval.test.ts cases 16 → 17 + 'marker-contract invariant (v1.16.18)' category; header total 258 → 267; version header v1.16.17 → v1.16.18
- .mission/reconstruction/REBUILD_PLAYBOOK.md: `npm test` 설명 258 → 267 tests
- mission.yaml + package.json + plugin.json + marketplace.json + package-lock.json: version 1.16.17 → 1.16.18
- mission-history.yaml: meta bump + 신규 timeline entry
- .mission/ Version 헤더 auto-synced to 1.16.18 via metadata:sync; CURRENT_STATE.md Title line + 최근 구현 bullet 추가

## [1.16.17] - 2026-04-21
_`ms-status`에 scaffolded-but-empty 디렉터리 경고 추가. qmonster 감사(2026-04-21, memory: project_qmonster_adoption.md §5 + recommendation 2)에서 확인된 anti-pattern — `.mission/decisions/`, `.claude/rules/` 등 scaffold 선언만 있고 비어 있는 폴더 — 를 adopter가 stale 상태로 방치하지 않도록 status 출력 단계에서 즉시 감지._

### Added

- src/commands/status.ts: `detectScaffoldedButEmpty(projectDir)` helper (exported), `ScaffoldingWarning` interface (exported), `StatusResult.scaffoldingWarnings?` optional field, markdown `## Scaffolding` section (조건부 렌더)
- tests/commands/status.test.ts: 4 신규 테스트 — empty decisions warn / empty snapshots warn / populated no-warn / absent no-warn (기존 8 유지, 총 12)
- skills/ms-status/SKILL.md + SKILL.ko.md + SKILL.zh.md: `## Scaffolding Section (v1.16.17+)` 섹션 3개 언어 동시 추가 (MDR-007 trilingual policy)

### Changed

- mission.yaml + package.json + plugin.json + marketplace.json + package-lock.json: version 1.16.16 → 1.16.17
- mission-history.yaml: meta bump + 신규 timeline entry
- .mission/ Version 헤더 auto-synced to 1.16.17 via metadata:sync; CURRENT_STATE.md Title line + 최근 구현 bullet 추가

## [1.16.16] - 2026-04-20
_README 'Who uses Mission Spec' 섹션에 qmonster를 첫 번째 adopter로 등재. 2026-04-20 qmonster audit에서 확인된 first-party dogfooding을 공식 기록 — placeholder `_(your project here)_`를 실체 있는 entry로 교체._

### Changed

- README.md (EN): 'Who uses Mission Spec' 섹션 placeholder `_(your project here)_` → qmonster entry 교체
- mission.yaml + package.json + plugin.json + marketplace.json + package-lock.json: version 1.16.15 → 1.16.16
- mission-history.yaml: meta bump
- .mission/ Version 헤더 auto-synced to 1.16.16 via metadata:sync

## [1.16.15] - 2026-04-18
_사용자가 최종 일관성 검토에서 지목한 2 issue 해소: (1) 3 README 모두 Usage 섹션에 `ms-decide` 예시 누락 — 설치/Providing 섹션에만 언급됨, (2) README.md(영문) + README.zh.md(중문)에 verify-registry bullet의 한국어 조각(`완료 조건`, `최근 구현`)이 번역 없이 노출됨._

### Changed

- README.md (EN): Usage 섹션에 ms-decide 블록 신설; Registry freshness bullet Korean-literal clarifying note 추가
- README.ko.md: Usage 섹션에 ms-decide 블록 신설; Registry freshness bullet 설명 확장 (Title + 완료 조건 + 최근 구현 + v1.16.13 --verify-live)
- README.zh.md: Usage 섹션에 ms-decide 블록 신설; Registry freshness bullet Korean-literal clarifying note + v1.16.13 --verify-live 추가
- mission.yaml + package.json + plugin.json + marketplace.json + package-lock.json: version 1.16.14 → 1.16.15
- mission-history.yaml: meta bump
- .mission/ Version 헤더 auto-synced to 1.16.15 via metadata:sync (16th D-3 invocation); CURRENT_STATE.md Title + 최근 구현 header via E-6 + F-4 machinery

## [1.16.14] - 2026-04-18
_오늘 사이클(2026-04-17 저녁 ~ 2026-04-18 새벽) 종결 시점의 전체 validator + test 성공 증거를 `.mission/evidence/VERIFICATION_LOG.yaml`에 기록. Codex Rev.2 §5와 Claude Rev.1 F-5가 지적한 'VERIFICATION_LOG trailing 12 releases' gap을 닫는 evidence-only 릴리스._

### Changed

- .mission/evidence/VERIFICATION_LOG.yaml: v1.16.14 entry 추가 (npm_test 254 passed / arch+plugin+metadata+registry+history+reconstruction+platforms 전수 green + evaluateMission 9/9 + today cycle summary note)
- mission.yaml + package.json + plugin.json + marketplace.json + package-lock.json: version 1.16.13 → 1.16.14
- mission-history.yaml: meta bump
- .mission/ Version 헤더 auto-synced to 1.16.14 via metadata:sync (15th D-3 invocation); CURRENT_STATE.md Title auto-sync via E-6 + 최근 구현 header via F-4 manual 1-line update

## [1.16.13] - 2026-04-18
_Close C-2 from PROJECT_REVIEW_SNAPSHOT_V1.16.7 Rev.4 (Codex Rev.2 §2, Medium) — mechanically tie CURRENT_STATE.md의 `완료 조건 (N/M PASS)` claim에 opt-in `--verify-live` 플래그로 `evaluateMission()` 실제 결과 비교. 기본은 fast mode 유지 (pre-commit 비용 보존); release gate는 opt-in 권고._

### Changed

- scripts/verify-registry.js: --verify-live 플래그, groundTruth() + check() async 승격, main() async wrapper, livePassed 필드 + CURRENT_STATE PASS 비교, 'live evaluator: N/M' 출력 라인
- tests/scripts/verify-registry.test.ts: +3 C-2 tests (default fast, --verify-live drift, --verify-live pass output); 21 → 24 tests
- .mission/reconstruction/REBUILD_PLAYBOOK.md: test count 251 → 254
- .mission/traceability/TRACE_MATRIX.yaml: inline 251 → 254; verify-registry.test cases 21 → 24 with 3 C-2 categories; 헤더 v1.16.11 → v1.16.13
- .mission/CURRENT_STATE.md: 최근 구현 list C-2 항목 추가 + header v1.16.12 → v1.16.13
- mission.yaml + package.json + plugin.json + marketplace.json + package-lock.json: version 1.16.12 → 1.16.13
- mission-history.yaml: meta bump
- .mission/ Version 헤더 auto-synced to 1.16.13 via metadata:sync (14th D-3 invocation); CURRENT_STATE.md Title auto-synced via E-6 + 최근 구현 header via F-4 manual edit

## [1.16.12] - 2026-04-18
_Close F-10 from PROJECT_REVIEW_SNAPSHOT_V1.16.7 Rev.4 (Gemini Rev.2 Bottom Line). Refresh README.md + README.ko.md + README.zh.md to reflect the 10-release closure cycle since v1.14.2 that Gemini Rev.2 Bottom Line pointed out as trailing._

### Changed

- README.md: 8 new Providing: bullets (metadata:sync/check, registry:check, cold-build gate, arch:verify deep-compare, package-lock drift, vitest determinism, MDR-005/006/007 series)
- README.ko.md: 동일 8 bullets 한국어 번역 유지
- README.zh.md: 동일 8 bullets 중문 번역 유지
- mission.yaml + package.json + plugin.json + marketplace.json + package-lock.json: version 1.16.11 → 1.16.12
- mission-history.yaml: meta bump
- .mission/ Version 헤더 auto-synced to 1.16.12 via metadata:sync (13th D-3 invocation); CURRENT_STATE.md Title + 최근 구현 header 갱신 via E-6 + F-4 machinery

## [1.16.11] - 2026-04-18
_Close F-3 from PROJECT_REVIEW_SNAPSHOT_V1.16.7 Rev.4 (Codex Rev.2 §3, Medium — Claude Rev.1 F-3와 교차 확증) — `arch:verify`의 package_exports subkey 비교를 shallow `!==`에서 재귀 deep-compare로 교체, Codex가 temp fixture로 재현한 `[object Object]` false-drift 제거._

### Changed

- scripts/generate-architecture.js: diffExportsLeaf 재귀 함수 추가; verifyCurrentMode의 subkey 비교가 deep-compare로 교체
- tests/scripts/generate-architecture.test.ts: +3 F-3 tests (nested pass, depth-2 drift, [object Object] regression); 14 → 17 tests
- .mission/reconstruction/REBUILD_PLAYBOOK.md: test count 248 → 251
- .mission/traceability/TRACE_MATRIX.yaml: inline 248 → 251; generate-architecture.test cases 14 → 17 with F-3 category; 헤더 v1.16.10 → v1.16.11
- .mission/CURRENT_STATE.md: 최근 구현 header v1.16.10 → v1.16.11 + deep-compare 항목 추가
- mission.yaml + package.json + plugin.json + marketplace.json + package-lock.json: version 1.16.10 → 1.16.11
- mission-history.yaml: meta bump
- .mission/ Version 헤더 auto-synced to 1.16.11 via metadata:sync (12th D-3 invocation); CURRENT_STATE.md Title 라인 auto-synced via v1.16.3 E-6 (v1.16.10 C-3 guard도 유효 — 다른 .mission 파일 untouched)

## [1.16.10] - 2026-04-18
_Close C-3 from PROJECT_REVIEW_SNAPSHOT_V1.16.7 Rev.4 (Codex Rev.2 §4, Medium) — restrict bump-metadata.js Title auto-sync to CURRENT_STATE.md only, eliminating the silent rewrite of any `- **Title:** X` line across .mission/ that Codex reproduced with NOTES.md._

### Changed

- scripts/bump-metadata.js: TITLE_SYNC_FILENAMES whitelist Set + basename import + computeUpdates()에 filename guard 추가
- tests/scripts/bump-metadata.test.ts: +2 C-3 tests (scope guard + still rewrites CURRENT_STATE)
- .mission/reconstruction/REBUILD_PLAYBOOK.md: test count 246 → 248
- .mission/traceability/TRACE_MATRIX.yaml: inline 246 → 248; bump-metadata.test cases 17 → 19 with C-3 category; 헤더 v1.16.9 → v1.16.10
- mission.yaml + package.json + plugin.json + marketplace.json + package-lock.json: version 1.16.9 → 1.16.10
- mission-history.yaml: meta bump
- .mission/ Version 헤더 auto-synced to 1.16.10 via metadata:sync (11th D-3 invocation); CURRENT_STATE.md Title 라인 auto-synced via v1.16.3 E-6 — 이 릴리스의 dogfood는 C-3 guard가 Title rewrite를 CURRENT_STATE.md로 제한하는지 확인 (다른 .mission/ 파일에 Title 라인 없음 → trivially green)

## [1.16.9] - 2026-04-18
_Close F-4 + C-4 from PROJECT_REVIEW_SNAPSHOT_V1.16.7 Rev.4 §8 item 2 — extend registry:check CURRENT_STATE coverage so (a) Title label is format-tolerant across locales (C-4), (b) existing-but-unlabeled CURRENT_STATE.md fails loud instead of silently passing (C-4), (c) `## 최근 구현 (vA ~ vB)` header is caught as stale when its upper bound trails package.json.version (F-4). Also refresh the CURRENT_STATE.md prose sections (최근 구현 / 직전 구현 / 다음 변경 후보) from the v1.14.0-era snapshot to the current v1.14.2 ~ v1.16.9 reality — the gap that Gemini Rev.2 Findings #2 specifically pinpointed._

### Changed

- scripts/verify-registry.js: TITLE_RE가 Title/제목/标题/タイトル 수용; CURRENT_STATE.md exists + no Title match인 경우 explicit failure; loadPackageVersion + compareSemver helper 추가; 최근 구현 (vA ~ vB) upper bound 검증 추가
- tests/scripts/verify-registry.test.ts: +7 tests (C-4 locale 4개 + F-4 3개); 전체 14 → 21 tests
- .mission/CURRENT_STATE.md: 최근 구현 (v1.14.0~v1.14.1) → (v1.14.2~v1.16.9) 헤더 + body 10 items 재작성; 직전 구현 (v1.13.x) → (v1.9.0~v1.14.1) 요약; 다음 변경 후보를 Rev.4 §8 남은 후속작업 7건으로 재구성
- .mission/reconstruction/REBUILD_PLAYBOOK.md: test count 239 → 246
- .mission/traceability/TRACE_MATRIX.yaml: inline 239 → 246; verify-registry.test cases 14 → 21 with 7 new C-4/F-4 categories; 헤더 v1.16.7 → v1.16.9
- mission.yaml + package.json + plugin.json + marketplace.json + package-lock.json: version 1.16.8 → 1.16.9
- mission-history.yaml: meta bump
- .mission/ Version 헤더 auto-synced to 1.16.9 via metadata:sync (10번째 D-3 invocation); CURRENT_STATE.md Title 라인 auto-synced via v1.16.3 E-6

## [1.16.8] - 2026-04-18
_Close C-1 from PROJECT_REVIEW_SNAPSHOT_V1.16.7 Rev.4 (Codex Rev.2 §1, High) — eliminate the order-dependent test flakiness introduced by the v1.16.6 E-7 concurrency refactor, so that `npm test` / `npm run test:coverage` return the same green signal across consecutive runs regardless of CPU warmth._

### Changed

- vitest.config.ts: added testTimeout: 15000 + hookTimeout: 15000 with explanatory comment pointing to Rev.4 Codex §1
- mission.yaml + package.json + plugin.json + marketplace.json + package-lock.json: version 1.16.7 → 1.16.8; mission.yaml title + lineage.total_revisions updated
- mission-history.yaml: meta.mission_title / total_revisions / latest_version bumped
- .mission/ Version headers auto-synced to 1.16.8 via metadata:sync (ninth real invocation of D-3 machinery); Title line auto-synced via v1.16.3 E-6 machinery

## [1.16.7] - 2026-04-17
_Close a post-v1.16.6 drift that the existing validator chain missed — package-lock.json was still pinned at 1.8.0 despite mission.yaml / package.json / plugin.json / marketplace.json all tracking 1.9.0 → 1.16.6 through the day. Also spread the v1.16.6 E-7 test.extend + describe.concurrent pattern to the remaining two subprocess-heavy test files._

### Changed

- src/core/plugin-validator.ts: new readPackageLockVersions() helper + 2 new drift checks in validateVersions() (root version + packages[""] version); module comment advertises package-lock as a drift axis
- tests/core/plugin-validator.test.ts: +2 tests (package.json vs package-lock.json root drift; package.json vs packages[""] drift) + writeLock() helper
- tests/scripts/bump-metadata.test.ts: migrated to base.extend<{ fx: Fixture }> + describe.concurrent + async execFile (v1.16.6 E-7 pattern applied)
- tests/scripts/generate-architecture.test.ts: same migration; writeTs/writeApiRegistry/writePackageJson now live on the fx fixture
- package-lock.json: 1.8.0 → 1.16.7 (both top-level version and packages[""].version; historical drift since v1.9.0 fully resolved)
- .mission/reconstruction/REBUILD_PLAYBOOK.md: test count 237 → 239
- .mission/traceability/TRACE_MATRIX.yaml: inline 237 → 239; plugin-validator.test cases 8 → 10 with 'package-lock.json drift (v1.16.7)' category; header v1.16.3 → v1.16.7
- mission.yaml + package.json + plugin.json + marketplace.json: version 1.16.6 → 1.16.7; mission.yaml title + lineage.total_revisions updated
- mission-history.yaml: meta.mission_title / total_revisions / latest_version bumped
- .mission/ Version headers auto-synced to 1.16.7 via metadata:sync (eighth real pre-commit invocation of D-3 machinery); Title line auto-synced via v1.16.3 E-6 machinery

## [1.16.6] - 2026-04-17
_Close E-7 from PROJECT_REVIEW_SNAPSHOT_V1.16.0_2026-04-17 §5.4 — reduce verify-registry.test.ts wall time from ~18s (serial subprocesses) to ~8s by switching to vitest's test.extend fixture pattern + describe.concurrent + async execFile._

### Changed

- tests/scripts/verify-registry.test.ts: migrated from shared `let tempDir` + beforeEach/afterEach to base.extend<{ fx: Fixture }> per-test fixture with writeFixture/writeStandardFixture/writePlaybook/writeTrace/writeMission/writeCurrentState helpers; runScript promisified; describe.concurrent enabled; all 14 test signatures now async with .rejects.toThrow for error paths
- mission.yaml + package.json + plugin.json + marketplace.json: version 1.16.5 → 1.16.6; mission.yaml title + lineage.total_revisions updated
- mission-history.yaml: meta.mission_title / total_revisions / latest_version bumped
- .mission/ Version headers auto-synced to 1.16.6 via metadata:sync (seventh real pre-commit invocation of D-3 machinery); Title line auto-synced via v1.16.3 E-6 machinery

## [1.16.5] - 2026-04-17
_Close E-2 from PROJECT_REVIEW_SNAPSHOT_V1.16.0_2026-04-17 — formalize the policy for REBUILD_PLAYBOOK.md language and PLAYBOOK_PATTERNS locale coupling in verify-registry.js, closing the final governance MDR of the v1.16 cycle._

### Added

- .mission/decisions/MDR-007-playbook-language-policy-and-locale-coupling-migration-trigger.md (≈110 lines; dogfood scaffold via generateMdrDraft, body authored manually)

### Changed

- scripts/verify-registry.js: 2-line comment above PLAYBOOK_PATTERNS pointing to MDR-007 (no functional change)
- mission.yaml + package.json + plugin.json + marketplace.json: version 1.16.4 → 1.16.5; mission.yaml title + lineage.total_revisions updated
- mission-history.yaml: meta.mission_title / total_revisions / latest_version bumped
- .mission/ Version headers auto-synced to 1.16.5 via metadata:sync (sixth real pre-commit invocation of D-3 machinery); Title line auto-synced via E-6 machinery from v1.16.3

## [1.16.4] - 2026-04-17
_Close E-3 from PROJECT_REVIEW_SNAPSHOT_V1.16.0_2026-04-17 — formalize the SemVer grade rule for meta-tooling / scripts-only changes, retiring the case-by-case judgment that produced the v1.14.3-vs-v1.15.0 inconsistency and that v1.16.1 / .2 / .3 silently already followed._

### Added

- .mission/decisions/MDR-006-semver-policy-for-meta-tooling-and-scripts-only-changes.md (≈120 lines; dogfood scaffold via generateMdrDraft, body authored manually)

### Changed

- mission.yaml + package.json + plugin.json + marketplace.json: version 1.16.3 → 1.16.4; mission.yaml title + lineage.total_revisions updated
- mission-history.yaml: meta.mission_title / total_revisions / latest_version bumped; this entry is the first written against MDR-006 with 'per MDR-006 §PATCH 6' grade
- .mission/ Version headers auto-synced to 1.16.4 via metadata:sync (fifth real pre-commit invocation of D-3 machinery); Title line auto-synced to v1.16.4 via the new E-6 machinery from v1.16.3

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
