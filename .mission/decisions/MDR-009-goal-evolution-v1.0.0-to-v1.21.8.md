# MDR-009: Goal evolution v1.0.0 → v1.21.8 — Claude Code plugin to core library + skill bundle + npm distribution

**Date:** 2026-04-24
**Status:** Active
**Version:** 1.21.9
**Author:** Dr. QUAN

> **Dogfooding note:** The 2026-04-23 user-initiated self-audit ("최초 목표를 실제로 달성하는가?") triggered this MDR. MDR-009 is the fifth governance-cluster MDR after MDR-005 (scope) / MDR-006 (SemVer) / MDR-007 (locale) / MDR-008 (retention), closing the "what did we actually set out to build, and did we ship it?" gap that v1.21.6 (self-dogfooding `done_when_refs`) and v1.21.7 (functional contract restoration) restored operationally but did not document as a governance decision.

## Context

Mission Spec's stated goal has evolved materially between v1.0.0 (2026-04-02) and v1.21.8 (2026-04-24) without a formal governance record. Self-audit on 2026-04-23 surfaced three specific drift axes:

1. **Goal wording drift** — v1.0.0 stated "Claude Code plugin으로 구현 … cross-platform plugin으로 배포". v1.21.8 states "core library와 Claude Code skill bundle로 구현 … portable한 task contract 도구". The words "plugin"/"cross-platform plugin" are gone; "core library"/"portable"/"task contract" appeared.

2. **done_when weakening then partial restoration** — v1.0.0's 8 done_when entries were functional claims ("/ms:init 명령으로 자연어에서 mission.yaml 초안 자동 생성"). By v1.21.5 these had become artifact-existence claims ("skills/ms-init/SKILL.md 존재"). v1.21.7 restored 5 of them to functional claims bound to `evals[]` test-file subsets. 2 original entries remained deferred (5-minute install guide; self-dogfooding as an explicit criterion).

3. **Distribution axis change (implicit phase transition)** — MDR-008 §V1.21.4 amendment recognized v1.21.4 as a phase boundary (first-ever npm publish). But the substitution of "npm install" for "Claude Code plugin marketplace install" as the primary distribution path was never recorded as a goal-level decision — it was inferred after the fact.

No single MDR covers this evolution. Reading MDR-001 (task contract only) through MDR-008 (retention policy), an outside reader cannot reconstruct why "Claude Code plugin" became "core library + skill bundle + npm package" or why two v1.0.0 done_when items quietly disappeared.

## Decision

Adopt the following goal-evolution record as a governance commitment:

### §I — v1.0.0 stated goal (historical, preserved)

The v1.0.0 snapshot (`2026-04-02_v1.0.0_mission.yaml`) is the canonical record of original intent:

> "Mission Spec을 Claude Code plugin으로 구현한다. 핵심 파이프라인: 자연어 → mission draft 자동 생성 → eval scaffold → run report. 누구나(사람/AI) 쉽게 설치하여 사용할 수 있는 cross-platform plugin으로 배포한다."

8 done_when entries (functional):

1. `/ms:init` 명령으로 자연어에서 mission.yaml 초안 자동 생성
2. `/ms:eval` 명령으로 done_when 기준 대비 현재 상태 평가
3. `/ms:status` 명령으로 진행 상황 요약
4. `/ms:report` 명령으로 run report 생성
5. Claude Code plugin marketplace에 설치 가능
6. Cursor, Codex, OpenCode에서도 사용 가능 (cross-platform conversion)
7. README.md에 5분 이내 설치·사용 가이드 완성
8. 자체 mission.yaml로 dogfooding 완료 (이 파일 자체)

### §II — v1.21.8 stated goal (current, active)

> "Mission Spec을 core library와 Claude Code skill bundle로 구현한다. 핵심 파이프라인: 자연어 → mission draft 자동 생성 → eval scaffold → run report. 누구나(사람/AI) 쉽게 설치하여 사용할 수 있는 portable한 task contract 도구로 유지한다."

10 done_when entries (post-v1.21.7 restoration):

1. ms-init API가 자연어 goal에서 schema-valid mission.yaml draft를 반환 (functional)
2. ms-eval API가 done_when 기준별 pass/fail을 계산 (functional)
3. ms-status API가 진행 요약과 drift 경고를 markdown으로 반환 (functional)
4. ms-report API가 평가 결과 markdown 리포트를 생성 (functional)
5. plugin manifest가 plugin-validator 전체 체크 통과 (functional)
6. README.md 존재 (**weakened from v1.0.0 #7; restoration deferred**)
7. schema_validation_passes (functional, inherited)
8. command_test (functional, inherited)
9. cross_platform_verifies (functional, inherits v1.0.0 #6)
10. architecture_doc_freshness (added v1.19.3, functional)

### §III — Explicit mapping v1.0.0 → v1.21.8

| v1.0.0 # | v1.0.0 text                              | v1.21.8 status                                                                                               | Decision                                     |
| -------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| 1        | `/ms:init` 자연어 → mission draft        | **covered** as v1.21.8 #1                                                                                    | preserved as functional                      |
| 2        | `/ms:eval` done_when 평가                | **covered** as v1.21.8 #2                                                                                    | preserved as functional                      |
| 3        | `/ms:status` 진행 요약                   | **covered** as v1.21.8 #3                                                                                    | preserved as functional                      |
| 4        | `/ms:report` run report                  | **covered** as v1.21.8 #4                                                                                    | preserved as functional                      |
| 5        | Claude Code plugin marketplace 설치 가능 | **partial** — plugin manifest valid (v1.21.8 #5); marketplace install path preserved, npm install path added | distribution axis widened, not replaced      |
| 6        | Cursor, Codex, OpenCode cross-platform   | **covered** as v1.21.8 #9 (`cross_platform_verifies`)                                                        | preserved as functional                      |
| 7        | README 5분 이내 설치·사용 가이드         | **deferred** — v1.21.8 #6 is artifact-existence only ("README.md 존재")                                      | restoration target in v1.21.10 (권장 작업 4) |
| 8        | 자체 mission.yaml로 dogfooding 완료      | **deferred** — `dogfood_test` manual eval exists in `evals[]` but not bound to any `done_when[]` entry       | restoration candidate for v1.22.x            |

### §IV — Distribution axis decision

Primary distribution path evolved **additively, not substitutively**:

- v1.0.0 → v1.21.3: Claude Code plugin marketplace only (`/plugin install mission-spec@mission-spec`)
- v1.21.4+: npm registry also (`npm install mission-spec`, `npx mission-spec`) — F-1 gate closure
- v1.21.5+: two-track trust model documented in README (npm tarball slim vs repo full history)

The goal wording "cross-platform plugin" from v1.0.0 is superseded by "portable task contract 도구" in current. This recognizes that Mission Spec is not merely a plugin — it is a library (`mission-spec` npm package) with a Claude Code skill bundle shipped as one of several consumer surfaces.

### §V — Deferred item ownership

- **v1.0.0 #7 (5-minute install guide)** — owner: v1.21.10 §PATCH (권장 작업 4, trilingual README rework). restoration requires (a) README structural reorganization and (b) a new `evals[]` entry measuring README surface (e.g., section presence + command examples).
- **v1.0.0 #8 (자체 dogfooding)** — `dogfood_test` manual eval exists. restoration requires promoting it to an automated eval (or binding it to a new `done_when[]` entry that acknowledges its manual nature). deferred to v1.22.x or later as `dogfood_test` overlaps substantially with the already-functional `command_test` + `schema_validation_passes`.

## Rationale

1. **Honest self-description beats myth-making.** Mission Spec operates an adversarial 3-vendor review loop. Leaving the goal-drift un-documented created a gap that a reviewer (or adopter) could weaponize: "you say X but you've been shipping Y for 20 releases." MDR-009 records the evolution truthfully, neither celebrating the drift nor hiding it.

2. **Additive not substitutive framing for distribution.** v1.21.4's npm publish did not retire Claude Code plugin marketplace support — both install paths remain in README Methods 1-3. Framing it as "we added a path, preserved the original" is faithful to the code state and avoids implying a retirement that did not happen.

3. **Deferred items get explicit owners, not vague "future work".** §V names v1.21.10 and v1.22.x as owners for #7 and #8 respectively. This forces the follow-up into the living asset registry rather than leaving it in verbal limbo.

4. **done_when philosophy shift is recorded in-place.** MDR-004 already covers "done_when ↔ evals linking philosophy". MDR-009 does not override MDR-004 — it documents what that philosophy produced in practice (weakening then restoration), which is a different kind of record (evolution history, not policy).

5. **Goal wording change is NOT a new policy.** The wording shift ("plugin" → "core library + skill bundle") reflects the consumer-surface milestone chain across MDR-005/007/008. MDR-009 is retrospective documentation, not a prospective constraint.

## Consequences

- **v1.0.0 done_when gap is now tracked.** §III table gives adopters (and future maintainers) a clear audit: 6/8 covered as functional, 2/8 deferred with named owners. Closing this gap is measurable.

- **v1.21.10 and v1.22.x gain a named scope trigger.** Previously "README 5-min install guide" and "self-dogfooding as done_when entry" were noted in follow-up lists. MDR-009 §V formalizes them as MDR-referenced deliverables.

- **Goal wording in mission.yaml is authoritative for v1.21.8+.** Future reviewers comparing Mission Spec against v1.0.0 snapshot have §I/II/III as the reconciliation key — no guessing required.

- **Future goal wording changes trigger MDR-NNN+1.** MDR-009 establishes a precedent: goal wording changes (MDR trigger category 1) are recorded, not drifted. The next such change (e.g., if "Mission Spec becomes a CLI-first tool with optional skill bundle") would be MDR-010 or later.

- **No schema or code change.** MDR-009 is policy-only. No `mission.yaml`, `*.schema.json`, or `src/` edits are implied. §PATCH per MDR-006 (docs + MDR add).

## Alternatives Considered

- **Do nothing — accept goal drift as historical fact, document only in `mission-history.yaml`.** Rejected: `mission-history.yaml` entries are release-scoped, not decision-scoped. A reviewer asking "what was the v1.0.0 → v1.21.8 direction change?" would need to synthesize from 56 timeline entries. MDR-009 collapses that into one readable record.

- **Update the v1.0.0 snapshot to match current intent (retroactive rewrite).** Rejected: snapshots are immutable historical records. Rewriting v1.0.0 to match v1.21.8 destroys the evidence of evolution. MDR-008 §INVARIANT (reproducibility) forbids this.

- **Mark MDR-009 as "Proposed" until Rev.7 3-vendor synthesis reviews it.** Rejected: MDR-009 is a retrospective record of decisions ALREADY taken operationally (v1.21.4 npm publish, v1.21.7 done_when restoration). No forward-looking policy to ratify. Active on creation.

- **Split into two MDRs: one for goal wording, one for done_when restoration mapping.** Rejected: the wording change and done_when mapping are semantically the same decision (the framing of "what this tool is"). Splitting would create two MDRs that reference each other circularly. Single MDR with §I-§V sections is tighter.

- **Embed the v1.0.0 → v1.21.8 mapping into MDR-008 as another amendment.** Rejected: MDR-008 is about Living Asset Registry retention. Goal evolution is a distinct concern (MDR trigger 1 vs 2). Scope-creeping MDR-008 would break the 1-MDR-1-concern invariant established by MDR-005/006/007.

---

## Amendment — 2026-04-24 (v1.21.13): §V closure recording

**Trigger**: Both §V deferred items closed within the same session as MDR-009 creation. §V ownership table now has concrete completion evidence and should not claim "deferred" indefinitely.

### §V status update

| v1.0.0 #                | Original §V owner | Actual closure                                     | Evidence                                                                                                                                      |
| ----------------------- | ----------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 7 (5-min install guide) | v1.21.10 §PATCH   | **v1.21.10** (commit `fac1451`)                    | `scripts/verify-readme.js` + `evals[].readme_install_guide_valid` + `done_when[5]` rewording + README 3종 Method 1 npm install primary 재배치 |
| 8 (self-dogfooding)     | v1.22.x or later  | **v1.21.12** (commit `69736e6`, ahead of schedule) | `scripts/verify-dogfooding.js` + `evals[].dogfooding_active` + `done_when[10]` (신규 11번째 entry)                                            |

Both items are now **closed**. v1.0.0 원본 8 done_when 전수 (8/8) functional contract로 커버된 상태 — §III 표의 "deferred" 라벨 2건이 "covered"로 전환됐다.

### §V v1.22.x acceleration rationale

§V는 v1.0.0 #8 owner를 v1.22.x로 표기했으나 v1.21.12 세션 컨텍스트에서 앞당겨 실행됐다. 근거:

- **Session coherence** — v1.21.6~v1.21.11 6개 §PATCH가 self-dogfooding / 기능 계약 / governance / README 재배치를 한 줄에 닫았다. #8만 별도 MINOR/다른 세션으로 떼어낼 이유 부재
- **Overlap concern 재평가** — MDR-009 §V 초안은 `dogfood_test` manual eval이 `command_test` + `schema_validation_passes`와 overlap한다고 기록. 실제 설계 과정에서 `dogfooding_active` 자동 eval을 **Living Asset Registry 실사용 evidence** 축(timeline entries + related_commits 커버리지 + MDR 존재 + snapshot 존재) 기준으로 구성해 overlap 해소. 세 eval은 각자 다른 proposition을 증명:
  - `command_test` — unit test 통과 (소스 수준 correctness)
  - `schema_validation_passes` — mission.yaml 파싱 가능 (스키마 수준 correctness)
  - `dogfooding_active` — Living Asset Registry가 scaffolded 너머 실사용 evidence (운영 수준 활용도)
- **Maximal-clean ref_kind 상태** — v1.21.10 시점 ref_kind eval-ref:10 + file-exists:0 달성. v1.21.12에서 entry 하나 추가(10→11)하되 동일 분포(eval-ref:11) 유지 가능. 세션 외로 미루면 "v1.0.0 전수 커버 + 순수 eval-ref" 상태를 다음 release 후까지 지연 — 의미적 milestone 상실

### Precedent for future MDR §V acceleration

§V 이월 항목을 원래 owner 버전 도달 전에 앞당겨 실행하는 것은 허용되며, 그 경우 **본 amendment 패턴**(원 §V 미수정, 아래에 closure block 추가)을 따른다. §V 원본 표를 rewrite하는 것은 금지 — 이월 의사결정 자체가 audit trail의 일부이므로.

---

> MDR triggers (refer to `.mission/templates/MDR_TEMPLATE.md` for the full checklist):
>
> 1. `goal` direction changes
> 2. `constraints` policy changes
> 3. `done_when` evaluation philosophy changes
> 4. `evals` ↔ `done_when` linkage changes
> 5. public command surface / naming rule changes
> 6. cross-platform contract changes
>
> MDR-009 is triggered by category **(1) goal direction changes** — the goal wording has materially evolved v1.0.0 → v1.21.8 without prior formal record.
