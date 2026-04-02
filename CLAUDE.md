# Mission Spec Plugin — Project CLAUDE.md

## 프로젝트 정체성

이 프로젝트는 **Mission Spec** — AI 에이전트 워크플로를 위한 task contract layer — 의 Claude Code plugin 구현입니다.

Mission Spec은 orchestration framework가 아닙니다. 기존 하네스·스킬·서브에이전트 위에서 작동하는 **portable한 run-scoped task contract**입니다.

핵심 가치: `자연어 → mission draft → eval scaffold → run report`

## 핵심 원칙

1. **Task Contract Only**: orchestration, runtime, capability는 건드리지 않는다. task-level contract만 다룬다.
2. **execution_hints는 suggestion**: 런타임이 무시할 수 있어야 한다. directive가 아닌 advisory.
3. **기존 워크플로에 녹아들기**: GitHub Issue/PR, CI/CD, 기존 CLAUDE.md와 자연스럽게 통합.
4. **Zero/Minimal Dependencies**: Node.js 표준 라이브러리 + Ajv(JSON Schema validator) + yaml(YAML parser)만 허용.
5. **TDD First**: 모든 코드는 테스트를 먼저 작성. RED → GREEN → REFACTOR.
6. **한 번에 하나**: scope creep 방지. 하나의 기능을 완성한 후 다음으로.

## 아키텍처

```
mission-spec/
├── .claude-plugin/
│   └── manifest.json          # Claude Code plugin manifest
├── src/
│   ├── schema/
│   │   ├── mission.schema.json  # Mission Spec JSON Schema
│   │   └── validator.ts         # Schema validation logic
│   ├── commands/
│   │   ├── init.ts              # /ms:init — NL → mission.yaml draft
│   │   ├── eval.ts              # /ms:eval — done_when 평가
│   │   ├── status.ts            # /ms:status — 진행 상황 요약
│   │   └── report.ts            # /ms:report — run report 생성
│   ├── core/
│   │   ├── parser.ts            # YAML/JSON 파싱
│   │   ├── evaluator.ts         # done_when 조건 평가 엔진
│   │   └── reporter.ts          # Report 생성기
│   └── adapters/
│       ├── github.ts            # GitHub Issue/PR 통합
│       └── platforms.ts         # Cross-platform 변환 (Cursor, Codex, etc.)
├── tests/
│   ├── schema.test.ts
│   ├── commands/
│   │   ├── init.test.ts
│   │   ├── eval.test.ts
│   │   ├── status.test.ts
│   │   └── report.test.ts
│   └── fixtures/
│       ├── valid-mission.yaml
│       ├── invalid-mission.yaml
│       └── complex-mission.yaml
├── examples/
│   ├── simple-bugfix.yaml
│   ├── security-review.yaml
│   └── multi-agent-refactor.yaml
├── scripts/
│   ├── validate-schema.js
│   └── convert-platforms.js
├── mission.yaml                 # Dogfooding: 이 프로젝트 자체의 Mission Spec
├── CLAUDE.md                    # 이 파일
├── package.json
├── tsconfig.json
└── README.md
```

## 빌드 & 테스트

```bash
npm install
npm run build
npm test
npm run lint
```

## 커밋 규칙

- feat: 새 기능
- fix: 버그 수정
- test: 테스트 추가/수정
- docs: 문서 수정
- refactor: 리팩토링
- 한 PR에 한 기능. 번들 금지.

## 작업 진행 방식

1. mission.yaml을 읽고 현재 phase 확인
2. 해당 phase의 done_when 기준 확인
3. 테스트 먼저 작성
4. 구현
5. /ms:eval로 done_when 체크
6. 다음 phase로

## 중요한 제약

- **이 프로젝트는 orchestration framework가 아닙니다**. LangGraph, CrewAI, OpenAI Agents SDK 같은 것을 만들지 마세요.
- **execution_hints에 orchestration 로직을 넣지 마세요**. hints는 advisory만.
- **외부 API 호출 없음**. LLM-as-judge eval은 Phase 2에서 추가. v1은 rule-based eval만.
- **mission.yaml 파일 형식이 핵심 deliverable입니다**. 코드보다 스키마가 중요합니다.

## Mission Spec JSON Schema 핵심 필드

```yaml
mission:
  title: string (required)
  goal: string (required)
  constraints: string[] (optional)
  done_when: string[] (required)
  approvals: Approval[] (optional)
  evals: Eval[] (optional)
  budget_hint: BudgetHint (optional)
  execution_hints: ExecutionHints (optional, advisory only)
  skills_needed: string[] (optional)
  artifacts: string[] (optional)
  version: string (optional)
  author: string (optional)
```
