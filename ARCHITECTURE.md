# Mission Spec — 아키텍처 & 예상 작업 흐름

## 1. 무엇을 만드는가

**Mission Spec Claude Code Plugin** — 4개의 slash command:

| Command | 역할 | 입력 | 출력 |
|---------|------|------|------|
| `/ms:init` | 자연어 → mission.yaml 초안 | 프로젝트 컨텍스트 + 자연어 설명 | mission.yaml |
| `/ms:eval` | done_when 기준 평가 | mission.yaml + 현재 상태 | 체크리스트 + 점수 |
| `/ms:status` | 진행 상황 요약 | mission.yaml + git log | 상태 리포트 |
| `/ms:report` | 완료 보고서 | mission.yaml + eval 결과 | run-report.md |

## 2. 기술 스택

```
Language:    TypeScript (ESM)
Runtime:     Node.js 20+
Schema:      JSON Schema draft-07 (Ajv)
YAML:        yaml package
Testing:     Vitest
Bundling:    tsup (optional, for distribution)
Platform:    Claude Code Plugin SDK
```

### 왜 TypeScript인가
- Claude Code plugin은 Node.js 기반
- 타입 안전성이 schema validation과 자연스럽게 결합
- cross-platform 변환(Cursor, Codex)에 TS 생태계가 유리
- Harness paper의 polyglot ROI: TS 5/10 — 충분히 실용적

### 외부 Dependencies (최소)
```json
{
  "dependencies": {
    "ajv": "^8.x",
    "ajv-formats": "^3.x",
    "yaml": "^2.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vitest": "^2.x",
    "@vitest/coverage-v8": "^2.x",
    "tsup": "^8.x"
  }
}
```

## 3. Mission Spec Schema (핵심 deliverable)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://mission-spec.dev/schema/v1",
  "title": "Mission Spec",
  "description": "Task contract artifact for AI agent workflows",
  "type": "object",
  "required": ["mission"],
  "properties": {
    "mission": {
      "type": "object",
      "required": ["title", "goal", "done_when"],
      "properties": {
        "title": {
          "type": "string",
          "description": "작업 제목",
          "maxLength": 200
        },
        "goal": {
          "type": "string",
          "description": "이번 작업에서 달성해야 할 것"
        },
        "constraints": {
          "type": "array",
          "items": { "type": "string" },
          "description": "하면 안 되는 것들"
        },
        "done_when": {
          "type": "array",
          "items": { "type": "string" },
          "description": "완료 조건 체크리스트",
          "minItems": 1
        },
        "approvals": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["gate", "approver"],
            "properties": {
              "gate": { "type": "string" },
              "approver": { "type": "string" },
              "description": { "type": "string" }
            }
          },
          "description": "승인 게이트"
        },
        "evals": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["name", "type"],
            "properties": {
              "name": { "type": "string" },
              "type": { "type": "string", "enum": ["automated", "manual", "llm-judge"] },
              "command": { "type": "string" },
              "pass_criteria": { "type": "string" },
              "description": { "type": "string" }
            }
          }
        },
        "budget_hint": {
          "type": "object",
          "properties": {
            "max_tokens_per_session": { "type": "integer" },
            "max_parallel_agents": { "type": "integer" },
            "estimated_sessions": { "type": "integer" },
            "priority": { "type": "string" }
          },
          "description": "Advisory budget hints — 런타임이 무시 가능"
        },
        "execution_hints": {
          "type": "object",
          "properties": {
            "topology": { "type": "string" },
            "suggested_approach": { "type": "string" },
            "note": { "type": "string" }
          },
          "description": "Advisory only — 런타임이 무시 가능. directive가 아닌 suggestion"
        },
        "skills_needed": {
          "type": "array",
          "items": { "type": "string" }
        },
        "artifacts": {
          "type": "array",
          "items": { "type": "string" },
          "description": "예상 산출물"
        },
        "version": { "type": "string" },
        "author": { "type": "string" },
        "created": { "type": "string", "format": "date" }
      }
    }
  }
}
```

## 4. 사용할 도구·플러그인

### 구현 시 사용
| 도구 | 역할 | 설치 |
|------|------|------|
| Claude Code CLI | 메인 구현 AI | `npm i -g @anthropic-ai/claude-code` |
| Superpowers | TDD·코드리뷰·워크플로우 강제 | `/plugin install superpowers` |
| Compound Engineering | 복합 학습·plan 문서화 | `/plugin install compound-engineering` |
| Codex | 교차 검증·adversarial review | `npm i -g @openai/codex` |

### 구현 대상 (Mission Spec이 통합할 것)
| 통합 대상 | 방식 |
|-----------|------|
| GitHub Issue | mission.yaml ↔ Issue template 변환 |
| GitHub PR | mission eval 결과를 PR comment로 |
| CLAUDE.md | mission.yaml 참조를 CLAUDE.md에 추가 |
| CI/CD | `ms:eval` 을 CI step으로 실행 |

## 5. 예상 작업 흐름 (Claude Code 자율 실행)

```
Session 1 (45min)
├── CLAUDE.md 읽기
├── mission.yaml 읽기
├── Phase 1: Schema + CLI Skeleton
│   ├── package.json 초기화
│   ├── tsconfig.json
│   ├── mission.schema.json 작성
│   ├── validator.ts + test
│   ├── .claude-plugin/manifest.json
│   └── git commit
└── ✅ Codex 교차 검증

Session 2 (60min)
├── Phase 2: /ms:init Command
│   ├── init.test.ts (TDD: RED)
│   ├── init.ts 구현 (GREEN)
│   ├── 리팩토링 (REFACTOR)
│   └── git commit
├── 🔒 Approval Gate: schema_design
│   └── Telegram 알림 → 인간 리뷰
└── ✅ Codex 교차 검증

Session 3 (60min)
├── Phase 3: /ms:eval + /ms:status
│   ├── evaluator.ts (핵심 로직)
│   ├── eval.ts + status.ts
│   ├── tests
│   └── git commit
└── ✅ Codex 교차 검증

Session 4 (45min)
├── Phase 4: /ms:report
│   ├── reporter.ts
│   ├── report.ts
│   ├── tests
│   └── git commit
└── ✅ Codex 교차 검증

Session 5 (30min)
├── Phase 5: Cross-Platform
│   ├── platforms.ts
│   ├── convert-platforms.js
│   └── git commit
├── 🔒 Approval Gate: cross_platform
│   └── Codex adversarial review
└── ✅ 검증 완료

Session 6 (30min)
├── Phase 6: README + Dogfooding
│   ├── README.md
│   ├── examples/
│   ├── /ms:eval dogfooding
│   └── git commit
└── ✅ Self-eval 완료

Sessions 7-8 (60-90min)
├── Phase 7: Adversarial Review
│   ├── 전체 테스트
│   ├── 코드 리뷰
│   ├── Edge case 보강
│   └── git commit
├── 🔒 Approval Gate: release
│   └── 인간 최종 승인
└── 🎉 v1.0.0 태그 + 릴리스
```

## 6. Agent OS 로드맵

```
Now:     Mission Spec Plugin v1.0
         ↓
+1 mo:   Mission Spec + Auto-Generation (NL → YAML → eval)
         ↓
+3 mo:   Agent OS Core
         - mission-as-process
         - eval-as-exit-code
         - handoff-as-ipc
         ↓
+6 mo:   Multi-Agent Mission Coordination
         - 여러 AI가 하나의 mission 아래 협업
         - mission decomposition (상위 mission → 하위 mission)
         ↓
+12 mo:  Self-Improving Agent OS
         - eval 결과 → 다음 mission 자동 개선
         - compound learning at system level
```

## 7. 핵심 리스크 & 완화

| 리스크 | 확률 | 완화 |
|--------|------|------|
| Schema가 너무 복잡해짐 | 높음 | 필수 3개(title, goal, done_when)만 강제, 나머지 optional |
| /ms:init의 NL→YAML 품질 | 중간 | v1은 template 기반, v2에서 LLM-as-judge 추가 |
| Cross-platform 호환성 | 중간 | Cursor/Codex/OpenCode 각각 수동 테스트 |
| Scope creep → orchestration화 | 높음 | CLAUDE.md에 "orchestration 금지" 명시 |
| 장시간 자율 실행 중 drift | 중간 | mission.yaml 자체가 drift 방지 장치 (dogfooding) |
