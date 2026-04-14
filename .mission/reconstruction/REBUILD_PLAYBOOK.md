# Mission Spec — Reconstruction Playbook

> 이 문서는 소스코드 없이 Mission Spec 자산만으로 프로젝트를 처음부터 재구현할 때 참고하는 가이드입니다.
> Last updated: 2026-04-14 | Version: 1.7.0

## 전제 조건

- Node.js 20+
- npm
- 이 `.mission/` 디렉토리와 루트의 `mission.yaml`, `mission-history.yaml`에 접근 가능

## Phase 1: 의도와 제약 이해 (읽기만)

1. **`mission.yaml`** 읽기 — goal, constraints, done_when, evals 확인
2. **`.mission/decisions/MDR-001-task-contract-only.md`** 읽기 — "orchestration 하지 않음" 핵심 범위 결정
3. **`.mission/decisions/MDR-003-minimal-dependencies.md`** 읽기 — ajv + yaml만 사용
4. **`mission-history.yaml`의 `evolution_summary`** 읽기 — 8개 phase의 진화 경로 파악

## Phase 2: 아키텍처 파악 (읽기만)

5. **`.mission/architecture/ARCHITECTURE_CURRENT.yaml`** 읽기 — 11개 모듈의 id, path, responsibility, exports
6. **`.mission/architecture/DEPENDENCY_GRAPH.yaml`** 읽기 — 모듈 간 import 관계 (14 edges)
7. **`.mission/interfaces/API_REGISTRY.yaml`** 읽기 — public API 11개 함수, skill 4개, file contracts 5개
8. **`mission.yaml`의 `design_refs`** 확인 — architecture, api_surface, type_definitions 파일 위치

## Phase 3: 스캐폴딩

9. `npm init` — package.json 생성 (`type: "module"`)
10. `npm install ajv yaml` + `npm install -D typescript vitest @types/node`
11. `tsconfig.json` 생성 (ESM, strict, outDir: dist)
12. 디렉토리 구조 생성:
    ```
    src/schema/    → validator.ts, mission.schema.json, mission-history.schema.json
    src/core/      → parser.ts, evaluator.ts, reporter.ts, history.ts
    src/commands/   → init.ts, eval.ts, status.ts, report.ts
    src/adapters/   → platforms.ts
    src/index.ts
    ```

## Phase 4: 스키마 → 검증 (TDD)

13. `mission.schema.json` 작성 — ARCHITECTURE_CURRENT.yaml의 validator 모듈 참조
14. `tests/schema.test.ts` 먼저 작성 (RED)
15. `src/schema/validator.ts` 구현 — `validateMission()`, `validateHistory()`
16. `npm test` 통과 확인 (GREEN)

## Phase 5: 핵심 파이프라인 (TDD)

DEPENDENCY_GRAPH.yaml의 레이어 규칙을 따른다: schema → core → commands

17. `parser.ts` — YAML parse + validate
18. `evaluator.ts` — done_when 평가 규칙 (ARCHITECTURE_CURRENT.yaml의 evaluation_rules 참조)
19. `init.ts` → `eval.ts` → `status.ts` → `report.ts` 순서로 구현
20. `reporter.ts` — markdown 렌더링
21. `history.ts` — mission-history.yaml 로더
22. 각 단계마다 테스트 먼저, 구현 후

## Phase 6: 검증

23. **Traceability Matrix** (`.mission/traceability/TRACE_MATRIX.yaml`) 참조하여 모든 done_when → code → test 연결 확인
24. `evaluateMission('.')` 실행 — 9/9 criteria passed 확인
25. `node scripts/validate-schema.js` — 스키마 검증
26. `node scripts/convert-platforms.js --verify` — 크로스 플랫폼

## Phase 7: 크로스 플랫폼 + 플러그인

27. `src/adapters/platforms.ts` — Cursor, Codex, OpenCode 변환
28. `skills/ms-*/SKILL.md` 생성 — API_REGISTRY.yaml의 skill_surface 참조
29. `.claude-plugin/plugin.json` 생성

## 읽기 순서 요약

```
MDR-001 → mission.yaml → ARCHITECTURE_CURRENT.yaml → DEPENDENCY_GRAPH.yaml
→ API_REGISTRY.yaml → TRACE_MATRIX.yaml → mission-history.yaml (필요 시)
```

## 참고

- 이 playbook은 "동일한 아키텍처"를 재현하기 위한 것이며, "동일한 코드"를 재현하는 것은 Git의 영역입니다.
- 각 Phase의 세부 구현은 ARCHITECTURE_CURRENT.yaml의 모듈별 exports와 types를 참조하세요.
- 평가 규칙의 정규식 패턴은 ARCHITECTURE_CURRENT.yaml의 evaluator 모듈 evaluation_rules에 기록되어 있습니다.
