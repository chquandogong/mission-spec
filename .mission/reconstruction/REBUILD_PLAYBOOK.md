# Mission Spec — Reconstruction Playbook

> 이 문서는 소스코드 없이 Mission Spec 자산만으로 프로젝트를 처음부터 재구현할 때 참고하는 가이드입니다.
> Last updated: 2026-04-17 | Version: 1.16.1

## 전제 조건

- Node.js 20+ (CI matrix는 Node 20, 22)
- npm
- 이 `.mission/` 디렉토리와 루트의 `mission.yaml`, `mission-history.yaml`에 접근 가능

## Phase 1: 의도와 제약 이해 (읽기만)

1. **`mission.yaml`** 읽기 — goal, constraints, done_when, evals 확인
2. **`.mission/decisions/MDR-001-task-contract-only.md`** — "orchestration 하지 않음" 핵심 범위
3. **`.mission/decisions/MDR-003-minimal-dependencies.md`** — ajv + yaml만 사용
4. **`.mission/decisions/MDR-005-meta-tooling-expansion-within-task-contract-scope.md`** (v1.14.2+) — meta-tooling 허용 경계 3범주 (integrity verifiers / living-asset maintainers / distribution surface) + 명시 금지 범위 (runtime / orchestration / SaaS)
5. **`mission-history.yaml`의 `evolution_summary.phases`** — 7개 phase(v1.0 → v1.7)의 진화 경로
6. **`mission-history.yaml`의 timeline v1.8 ~ v1.14.2 엔트리** — governance hardening + meta-tooling 확장의 문맥

## Phase 2: 아키텍처 파악 (읽기만)

7. **`.mission/architecture/ARCHITECTURE_CURRENT.yaml`** — 18개 모듈(hand-curated registry; src/ 실제 `.ts`는 19개 — `src/index.ts` barrel 포함)의 id, path, responsibility, exports
8. **`.mission/architecture/DEPENDENCY_GRAPH.yaml`** — 모듈 간 import 관계 (directed edges)
9. **`.mission/architecture/ARCHITECTURE_COMPUTED.yaml`** (v1.10+) — `extractArchitecture()` 자동 생성 결과 (hand-curated와 대칭 drift 검증 대상)
10. **`.mission/interfaces/API_REGISTRY.yaml`** — public API 22개 함수(type export 포함), skill 6개, file_contracts 다수(`.cursorrules`, `AGENTS.md`, `opencode.toml`, `plugin.json`, `SKILL.md`, `.clinerules`, `.continuerules`, `.aider.conf.yml`, `.aider-mission.md`), `package_exports` (라이브러리 subpath) 포함
11. **`mission.yaml`의 `design_refs`** — architecture, api_surface, type_definitions 파일 위치

## Phase 3: 스캐폴딩

12. `npm init` — `package.json` 생성 (`type: "module"`)
13. `npm install ajv yaml` + `npm install -D typescript vitest @vitest/coverage-v8 @types/node`
14. `tsconfig.json` (ESM, strict, `outDir: dist`)
15. `vitest.config.ts` — v8 provider, threshold `lines/statements/functions ≥ 80`, `branches ≥ 75`
16. 디렉토리 구조:

    ```
    src/schema/      validator.ts, mission.schema.json, mission-history.schema.json
    src/core/        parser.ts, evaluator.ts, reporter.ts, history.ts,
                     arch-diff.ts, architecture-extractor.ts,
                     plugin-validator.ts, migration.ts, reconstruction-verifier.ts
    src/commands/    init.ts, eval.ts, status.ts, report.ts, context.ts, decide.ts
    src/adapters/    platforms.ts
    src/index.ts     (barrel re-exports)
    bin/mission-spec.js   (v1.12.0+ CLI)
    ```

## Phase 4: 스키마 → 검증 (TDD)

17. `mission.schema.json` + `mission-history.schema.json` 작성 — ARCHITECTURE_CURRENT.yaml의 `validator` 모듈 exports 참조
18. `tests/schema.test.ts` 먼저 작성(RED, 35 tests)
19. `src/schema/validator.ts` 구현 — `validateMission()`, `validateHistory()`
20. `npm test` GREEN 확인

## Phase 5: 핵심 파이프라인 (TDD)

DEPENDENCY_GRAPH.yaml의 레이어 규칙: `schema → core → commands → adapters → index`.

21. `parser.ts` — YAML parse + schema validate
22. `evaluator.ts` — done_when 5-단계 평가 (llm-eval override → automated execSync → file-existence regex → test-pattern → fallback). `ARCHITECTURE_CURRENT.yaml` 의 `evaluation_rules` 참조
23. `history.ts` — `mission-history.yaml` 로더 + `getCurrentPhase()` / `getLatestEntry()`
24. `reporter.ts` — markdown 렌더링 (`TRACE_MATRIX.yaml` 연동 포함)
25. `init.ts` → `eval.ts` → `status.ts` → `report.ts` → `context.ts` → `decide.ts` 순서
26. 각 단계는 TDD (테스트 먼저)

## Phase 6: Meta-tooling (v1.7+, MDR-005 허용 3범주)

27. `arch-diff.ts` (v1.7) — 버전 간 architecture 차이 감지
28. `architecture-extractor.ts` (v1.10) — src/ 정규식 추출 → `ARCHITECTURE_COMPUTED.yaml`
29. `plugin-validator.ts` (v1.11) — `plugin.json` ↔ `marketplace.json` ↔ `SKILL.md` 일관성
30. `migration.ts` (v1.14) — BFS chain, schema v2 대비 기반 (registry 비어있음)
31. `reconstruction-verifier.ts` (v1.14) — REBUILD_PLAYBOOK 경로 참조 검증 (fast / `--cold-build` temp dir)

## Phase 7: 검증 (총 9+ 축)

32. `npm test` — 현재 기준 223 tests 전수 통과 (21 test files)
33. `npm run test:coverage` — stmts/branches/functions/lines ≥ 80/75/80/80 (현 baseline 93.95 / 83.59 / 95.52 / 93.95)
34. `node scripts/validate-schema.js` — 스키마 검증 (3 fixtures)
35. `node scripts/convert-platforms.js --verify` — 6개 플랫폼
36. `npm run plugin:verify` — plugin/skill 일관성
37. `npm run arch:verify` — ARCHITECTURE_CURRENT ↔ src/ + API_REGISTRY.public_api.functions 대칭 drift + package.json.exports ↔ API_REGISTRY.public_api.package_exports (v1.13.1+ 대칭화, v1.14.3+ exports-map)
38. `npm run metadata:check` (v1.15.0+) — `.mission/` Version 헤더가 package.json과 sync (D-3). 실패 시 `npm run metadata:sync`로 자동 수정
39. `npm run registry:check` (v1.16.0+) — REBUILD_PLAYBOOK + TRACE_MATRIX 본문의 수치(module/API/skill/platform/test counts)가 live source와 sync (D-1). TS AST 기반
40. `npm run reconstruction:verify` — playbook 경로 무결성 (선택: `--cold-build` — temp dir에서 `npm ci && build && test`)
41. `npm run validate:history-commits` — history ↔ git log cross-check (bootstrap + HEAD self-reference 예외)
42. `evaluateMission('.')` — 9/9 criteria passed 확인
43. **Traceability Matrix** (`.mission/traceability/TRACE_MATRIX.yaml`) 참조하여 모든 done_when → eval → code → test 연결 확인

## Phase 8: 크로스 플랫폼 + 플러그인

44. `src/adapters/platforms.ts` — 6개 플랫폼 변환 (Cursor, Codex, OpenCode, Cline, Continue, Aider) — v1.14.0+
45. `skills/ms-*/SKILL.md` + `SKILL.ko.md` + `SKILL.zh.md` (삼국어, v1.8.0+) — 6 skill: ms-init, ms-eval, ms-status, ms-report, ms-context, ms-decide
46. `.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json` 생성 — version은 `package.json` / `mission.yaml` 과 일치(`plugin-validator`가 자동 검증)

## Phase 9: CLI + Release Pipeline

47. `bin/mission-spec.js` (v1.12+) — dispatcher for `context | status | eval | report` + `--version` / `--help`
48. `.github/workflows/test.yml` — Node 20+22 matrix: build + lint + test:coverage + platforms verify + plugin:verify + arch:verify
49. `.github/workflows/pre-commit-parity.yml` — `validate-history-commits` + snapshot dedup + CHANGELOG determinism + arch:sync / verify + metadata:check + registry:check
50. `.github/workflows/release.yml` (v1.13+) — v\* 태그 → npm publish with provenance, ref-ancestry check (publish from origin/main only), 태그 ↔ package.json 일치 검증

## 읽기 순서 요약

```
MDR-001 + MDR-005 → mission.yaml → ARCHITECTURE_CURRENT.yaml → DEPENDENCY_GRAPH.yaml
→ API_REGISTRY.yaml → TRACE_MATRIX.yaml → mission-history.yaml (필요 시)
```

## 참고

- 이 playbook은 **동일한 아키텍처의 재현**을 위한 것이며, **동일한 코드의 재현**은 Git의 영역이다.
- 각 Phase의 세부 구현은 `ARCHITECTURE_CURRENT.yaml` 의 모듈별 exports/types를 참조.
- 평가 규칙의 정규식 패턴은 `evaluator` 모듈 entry의 `evaluation_rules` 필드에 기록됨.
- v1.9+ meta-tooling 확장은 MDR-005의 **허용 3범주**(integrity verifiers / living-asset maintainers / distribution surface)에 한하며, orchestration / runtime 로직 / SaaS는 여전히 `MDR-001` 금지 범위.
