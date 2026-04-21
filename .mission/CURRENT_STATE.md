# Mission Spec — Current State

> Last updated: 2026-04-21 | Version: 1.20.0

## 현재 상태

- **Title:** Mission Spec v1.20.0 — adopter compatibility and shared-clone evaluation
- **Phase:** governed portability
- **Author:** Dr. QUAN
- **Created:** 2026-04-01

## 현재 목표

Mission Spec을 core library, CLI, Claude Code skill bundle로 유지한다.
누구나(사람/AI)가 설치해 기존 워크플로에 붙일 수 있는 portable한 task contract 도구로 유지한다.
mission.yaml의 변경 이력과 구조 자산을 Living Asset Registry로 관리한다.
문서 접근성은 다국어로 유지하되, 런타임/스키마/메타데이터는 일관된 영어 표면으로 유지한다.

## 핵심 제약 (활성)

1. Task contract layer만 구현 (orchestration 아님)
2. execution_hints는 suggestion (directive 아님)
3. 기존 워크플로에 녹아들 것 (별도 UI/SaaS 금지)
4. 외부 dependency 최소화 (ajv + yaml만)
5. TDD first
6. 한 번에 하나의 기능만

## 완료 조건 (10/10 PASS)

- [x] skills/ms-init/SKILL.md 존재
- [x] skills/ms-eval/SKILL.md 존재
- [x] skills/ms-status/SKILL.md 존재
- [x] skills/ms-report/SKILL.md 존재
- [x] .claude-plugin/plugin.json 존재
- [x] README.md 존재
- [x] schema_validation_passes
- [x] command_test
- [x] cross_platform_verifies
- [x] architecture_doc_freshness

## 활성 임시 규칙

- (없음)

## 최근 구현 (v1.14.2 ~ v1.20.0)

v1.16.x E-series + post-v1.16.6 Codex Rev.2 후속 closure + qmonster audit IMP 시퀀스 진입.

- [x] `MDR-005` ~ `MDR-007` 작성 — scope(005) + SemVer grade(006) + locale(007) 3축 governance 성문화
- [x] `scripts/verify-registry.js` (D-1) — REBUILD_PLAYBOOK / TRACE_MATRIX의 임베드 수치 주장을 TypeScript AST 기반으로 live source와 대조
- [x] `scripts/bump-metadata.js` (D-3, v1.16.3 E-6에서 Title 자동 sync 추가, v1.16.10 C-3에서 filename guard) — `.mission/` Version 헤더 + CURRENT_STATE.md Title 라인 자동 갱신 (Title은 CURRENT_STATE.md 전용으로 제한)
- [x] `arch:verify` 확장 (D-2 + E-5) — `package.json.exports` key-set 및 types/import value shape drift 감지
- [x] `registry:check` 확장 (E-8 + v1.16.9 C-4/F-4) — CURRENT_STATE.md의 Title + 완료 조건 + 최근 구현 version range 검증; Title 라벨은 Title/제목/标题/タイトル 4 locale 허용
- [x] release workflow cold-build gate (E-1) — release.yml에 `reconstruction:verify --cold-build` 단계 편입 (publish 직전)
- [x] `plugin-validator` 확장 (v1.16.7) — `package-lock.json`의 root / `packages[""]` 버전 drift 감지 (18 릴리스 동안 1.8.0 stale했던 lockfile을 감지하고 닫음)
- [x] 테스트 `test.extend` + `describe.concurrent` 리팩터 (E-7, v1.16.6~v1.16.7) — 서브프로세스 기반 3 test 파일의 wall time ~26s → ~11s 회복
- [x] `vitest.config.ts` `testTimeout/hookTimeout 15000ms` (C-1, v1.16.8) — E-7 concurrency가 유발한 order-dependent flakiness 해소, 5/5 consecutive runs 239/239
- [x] `scripts/bump-metadata.js` TITLE_SYNC_FILENAMES whitelist (C-3, v1.16.10) — Title auto-sync을 CURRENT_STATE.md에만 제한
- [x] `scripts/generate-architecture.js` deep-compare `diffExportsLeaf` (F-3, v1.16.11) — nested conditional exports의 모든 leaf path 재귀 비교, Codex가 재현한 `[object Object]` false-drift 제거
- [x] README.md (ko/zh/en) refresh (F-10, v1.16.12) — Gemini Rev.2 Bottom Line 반영, v1.15.0 ~ v1.16.11 feature surface 8 bullets 추가
- [x] `registry:check --verify-live` (C-2, v1.16.13) — opt-in flag가 `evaluateMission()` 호출 후 CURRENT_STATE의 claimPass와 비교. 기본은 fast mode, release gate는 opt-in 권고
- [x] `VERIFICATION_LOG.yaml` evidence close-out (v1.16.14) — Codex v1.14.1 이후 13 릴리스 만에 쌓인 evidence 공백 해소 (F-5 + Codex Rev.2 §5 지적 반영). 254/254 tests + 전 validator green 기록
- [x] README 3종 ms-decide Usage + Korean fragment fix (v1.16.15) — 3 언어 모두 Usage 섹션에 `ms-decide` 코드 예시 추가; EN/ZH README의 verify-registry bullet Korean literal strings는 clarifying note 부착 (MDR-007 정책 근거 명시)
- [x] README 'Who uses Mission Spec' qmonster entry (v1.16.16) — placeholder `_(your project here)_`를 qmonster (first-party dogfooding, Rust TUI) 등재로 교체. zero→one adoption signal 전환. KO/ZH trilingual 동기화는 IMP-6로 후속 처리
- [x] `ms-status` scaffolded-but-empty warning (v1.16.17) — `.mission/decisions/` / `.mission/snapshots/` 디렉터리가 존재하지만 비어 있을 때 remediation hint와 함께 `## Scaffolding` 섹션 추가. qmonster 감사 5번째 anti-pattern 대응 — "기록 계약 충실, 검증 계약 비활성" 패턴을 ms-status 출력 단계에서 즉시 감지. trilingual SKILL docs 동반 (MDR-007).
- [x] `ms-status` done_when drift warning (v1.16.18) — evaluator가 auto-evaluate할 수 없는 done_when 엔트리(reason에 "manual verification required" marker 포함)를 `## done_when drift` 섹션으로 surface. drift 1–3은 inline colon, drift > 3은 Sample + (+N more) + 80-char truncation. `detectDoneWhenDrift` helper + `StatusResult.doneWhenDrift?: string[]` 필드. marker-contract invariant 테스트(eval.test.ts)로 future silent-break 방지. qmonster B-3 IMP-3 실현 — adopter UX drift의 두 번째 axis. trilingual SKILL docs (MDR-007). superpowers brainstorming → writing-plans → executing-plans 워크플로우 dogfood.
- [x] `ms-status` meta staleness warning (v1.16.19) — `mission-history.yaml`의 `meta.mission_title`이 `mission.yaml.title`과 strict `!==` drift (Rule 1) + `meta.tracking_mode`가 single-user 키워드를 포함하면서 AI contributor(Claude/Codex/Gemini/GPT/Copilot/LLM)와 공존 (Rule 2) 시 `## meta staleness` 섹션으로 surface. `detectMetaStaleness` helper + `StatusResult.metaStaleness?: MetaStaleness[]` 필드. `SINGLE_USER_TERMS` + `AI_CONTRIBUTOR_TERMS` module-const + 120/80 char truncate helpers. `mission_id` drift는 non-goal(프로젝트별 naming convention). `MissionHistory.meta.tracking_mode?: string` TS 타입 보정 포함. qmonster B-3 IMP-4 실현 — adopter UX drift의 세 번째 axis. trilingual SKILL docs (MDR-007).
- [x] `mission-spec validate` CLI + portable pre-commit hook template (v1.17.0) — 신규 CLI subcommand `validate`는 `validateProject(projectDir)` 순수 함수(schema-only, evaluator 실행 없음)를 호출하여 `mission.yaml` + (존재 시) `mission-history.yaml`을 검증. `templates/pre-commit`은 POSIX sh 5줄짜리 portable hook으로 `npx mission-spec validate` 호출. adopter는 `cp node_modules/mission-spec/templates/pre-commit .git/hooks/ && chmod +x $_` 2 커맨드로 설치. qmonster B-3 IMP-5 실현 — schema drift를 commit boundary에서 차단하는 4번째 IMP 축 (IMP-3/4가 `ms-status` 출력 축이었다면 IMP-5는 install path 축). v1.16.x PATCH 계열 마감, v1.17.0 MINOR 진입 (§MDR-006).
- [x] `mission-spec backfill-commits` CLI + `backfillRelatedCommits` API (v1.18.0) — mission-history.yaml의 빈 `related_commits: []` 항목을 revision date의 ±1-day git log 매칭으로 retrofit. dry-run 기본, `--apply` 시 단일 후보 entry만 파일에 기록 (change_id anchor + strict regex로 manual curation 보호). `CommitCandidate` + `BackfillProposal` + `BackfillResult` types + `backfillRelatedCommits(projectDir, options?)` function. qmonster B-3 IMP-6 실현 — adopter traceability gap의 첫 retrofit/repair 도구 (이전 4개 IMP는 prevention; 이번은 cure). §MINOR (신규 CLI subcommand + 신규 public API function).
- [x] `mission-spec snapshot` CLI + `createSnapshot` API (v1.19.0) — `mission.yaml` 버전별 snapshot을 `.mission/snapshots/`에 생성. dedup(동일 version은 기존 파일 반환). 기존 `scripts/snapshot-mission.js` 로직을 library API로 병행 제공 (script 자체는 self-hook 안정성 보호 차원에서 변경 안 함 — 3-way divergence 의도적). `createSnapshot(projectDir): SnapshotResult` public API + `mission-spec snapshot` CLI + 2-step pre-commit hook 예시(README trilingual). qmonster B-3 IMP-7 실현 — IMP 시퀀스 6개 axis 중 최종. Forward-looking만 지원 (retroactive는 IMP-8 후보). §MINOR.
- [x] `MDR-008` 작성 (v1.19.1) — Living Asset Registry retention and compaction policy. MDR-005(scope) / MDR-006(SemVer) / MDR-007(locale)에 이은 4번째 거버넌스 축. 재현성 불변식 + 5 asset 타입(timeline / snapshots / evidence / evals / decisions) 별 retention rule. Compact-at-phase-transition manual trigger (future IMP-9 `mission-spec compact` 후보). Mission Spec 자체는 v1.19.0 시점 42 entries / 496 KB로 압축 임계 미도달 — 본 MDR은 향후 phase 경계에서 발동. §PATCH (docs/MDR 추가, consumer surface 영향 없음 — v1.14.2 MDR-005 릴리스 등급과 동일).
- [x] `scripts/snapshot-mission.js` refactor (v1.19.2) — 57→33 lines, `createSnapshot()` library wrapper로 전환. v1.19.0 IMP-7 follow-up cleanup. mission.yaml 부재 silent-exit + same-day dedup silent 동작 완전 보존(기존 2 tests unchanged 통과). 3-way divergence(script/CLI/library) 의도적 유지. 내부 중복 제거 — single source of truth는 `src/commands/snapshot.ts`. §PATCH (internal refactor, consumer surface 불변).
- [x] review follow-up hardening bundle (v1.19.3) — `mission-spec backfill-commits --apply` positional parsing 버그 수정, `scripts/verify-registry.js`에 `lineage.total_revisions`/VERIFICATION_LOG top-entry drift 감지 추가, `architecture_doc_freshness`를 `mission.yaml.done_when`의 실제 게이트로 승격. self-dogfooding 완료 기준이 9/9 → 10/10으로 강화됐고, `.mission/evals/architecture_doc_freshness.result.yaml` + evidence/current-state 자산을 함께 정식 revision으로 고정.
- [x] adopter-compat evaluation bundle (v1.20.0) — qmonster adopter review를 계기로 `validateHistory()` / `loadHistory()`가 sparse legacy `changes` / `done_when_delta` arrays를 normalize하고, `evaluateMission()` / `getMissionStatus()`는 `scope: "shared"` + CLI `--shared`로 missing gitignored local-only artifact를 skip/pass 처리한다. evaluator는 safe inferred command clause도 실행 가능해져 prose-heavy adopter contract를 일부 더 읽을 수 있다. qmonster 재검토 결과는 `validate` fail → pass, `eval --shared` 0/86 → 14/86. 남은 72개는 실제 prose/manual gate 문제다. §MINOR.

## 직전 구현 (v1.9.0 ~ v1.14.1)

- [x] 거버넌스 하드닝: LICENSE, CHANGELOG, CONTRIBUTING, CI 2종, coverage 80% floor (v1.9.0)
- [x] `architecture-extractor`, `plugin-validator`, CLI, release.yml, 대칭 drift detection, `ms-decide`, migration infra, reconstruction-verifier (v1.10~v1.14)
- [x] Unicode-aware slugify (v1.14.1)

## 다음 변경 후보

Rev.4 §8 code-actionable 항목(C-1 ~ C-3, F-3, F-4, F-10, C-4, C-2), review follow-up reconciliation(v1.19.3), adopter-compat baseline(v1.20.0)까지 반영 완료. 남은 축은 user-gated/adoption/future-feature 성격으로 좁혀졌다:

- **E-4** (3벤더 합의 최상위) — 외부 adopter 1+ 확보 — advocacy 영역, 주 단위 작업
- **F-1** (Claude Rev.1) — cold-build gate CI 실전 호출 (tag push — npm publish blast radius 때문에 사용자 결정)
- **IMP-8** — `mission-spec snapshot --retroactive` 후보 — 과거 revision snapshot 일괄 backfill (qmonster류 retrofit 수요 확인 시)
- **IMP-9** — `mission-spec compact` 후보 — MDR-008 compaction policy를 phase-boundary에서 도구화
- **IMP-10** — prose-heavy adopter를 위한 explicit gate linkage / shared-vs-local artifact modeling — qmonster shared eval이 14/86까지 개선됐지만 나머지 72개는 구조화 부재로 manual에 머무름
- **Rev.5** — 3벤더 재리뷰 (세션 분리 전제, baseline = v1.20.0 HEAD)

## 자기 검증

- [x] 이 spec만 보면 지금 무엇을 해야 하는지 알 수 있는가?
- [x] mission-history.yaml만 보면 왜 그렇게 바뀌었는지 알 수 있는가?
- [x] 특정 버전을 다시 꺼내 재실행할 수 있는가?
- [x] 임시 조치인지 영구 정책인지 구분되는가?
- [x] 코드를 읽지 않고도 모듈 구조를 알 수 있는가? (v1.7.0+)
- [x] 한국어/영어/중국어 사용자 모두 설치 문서를 따라갈 수 있는가? (v1.8.0+)
- [x] MDR 작성과 재구성 검증까지 Living Asset Registry 안에서 닫히는가? (v1.14.0+)
