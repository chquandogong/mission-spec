# Mission Spec — Current State

> Last updated: 2026-04-20 | Version: 1.16.18

## 현재 상태

- **Title:** Mission Spec v1.16.18 — ms-status done_when drift warning
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

## 완료 조건 (9/9 PASS)

- [x] skills/ms-init/SKILL.md 존재
- [x] skills/ms-eval/SKILL.md 존재
- [x] skills/ms-status/SKILL.md 존재
- [x] skills/ms-report/SKILL.md 존재
- [x] .claude-plugin/plugin.json 존재
- [x] README.md 존재
- [x] schema_validation_passes
- [x] command_test
- [x] cross_platform_verifies

## 활성 임시 규칙

- (없음)

## 최근 구현 (v1.14.2 ~ v1.16.18)

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

## 직전 구현 (v1.9.0 ~ v1.14.1)

- [x] 거버넌스 하드닝: LICENSE, CHANGELOG, CONTRIBUTING, CI 2종, coverage 80% floor (v1.9.0)
- [x] `architecture-extractor`, `plugin-validator`, CLI, release.yml, 대칭 drift detection, `ms-decide`, migration infra, reconstruction-verifier (v1.10~v1.14)
- [x] Unicode-aware slugify (v1.14.1)

## 다음 변경 후보

Rev.4 §8 code-actionable 항목(C-1 ~ C-3, F-3, F-4, F-10, C-4, C-2)은 v1.16.8 ~ v1.16.13 사이에 전수 closure. 남은 축은 전부 non-code 또는 user-gated:

- **E-4** (3벤더 합의 최상위) — 외부 adopter 1+ 확보 — advocacy 영역, 주 단위 작업
- **F-1** (Claude Rev.1) — cold-build gate CI 실전 호출 (tag push — npm publish blast radius 때문에 사용자 결정)
- **F-9** — Living Asset Registry 누적 크기 원칙 (MDR-008 후보 — 새 거버넌스 축)
- **Rev.5** — 3벤더 재리뷰 (세션 분리 전제, Rev.4 §8 전수 closure baseline = v1.16.15 HEAD — README 3종 docs-refresh 반영)

## 자기 검증

- [x] 이 spec만 보면 지금 무엇을 해야 하는지 알 수 있는가?
- [x] mission-history.yaml만 보면 왜 그렇게 바뀌었는지 알 수 있는가?
- [x] 특정 버전을 다시 꺼내 재실행할 수 있는가?
- [x] 임시 조치인지 영구 정책인지 구분되는가?
- [x] 코드를 읽지 않고도 모듈 구조를 알 수 있는가? (v1.7.0+)
- [x] 한국어/영어/중국어 사용자 모두 설치 문서를 따라갈 수 있는가? (v1.8.0+)
- [x] MDR 작성과 재구성 검증까지 Living Asset Registry 안에서 닫히는가? (v1.14.0+)
