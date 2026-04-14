# Mission Spec

[![GitHub](https://img.shields.io/github/license/chquandogong/mission-spec)](https://github.com/chquandogong/mission-spec)

AI 에이전트 워크플로를 위한 **task contract layer**. Orchestration framework가 아닌, 기존 하네스 위에서 작동하는 portable한 run-scoped task contract입니다. TypeScript 라이브러리와 Claude Code용 skill bundle, 그리고 **Living Asset Registry**를 함께 제공합니다.

**Repository:** https://github.com/chquandogong/mission-spec

## 핵심 파이프라인

```text
자연어 → mission.yaml draft → eval scaffold → run report
                  ↕
         mission-history.yaml (변경 원장)
```

## 5분 설치 가이드

### 방법 1: Claude Code Marketplace에서 설치 (권장)

```bash
# Claude Code 안에서 실행
/plugin marketplace add chquandogong/mission-spec
/plugin install mission-spec@mission-spec
```

설치 후 다음 skill을 바로 사용할 수 있습니다:

- `/mission-spec:ms-init` — 자연어 → mission.yaml 초안 자동 생성
- `/mission-spec:ms-eval` — done_when 기준 대비 현재 상태 평가
- `/mission-spec:ms-status` — 미션 진행 상황 요약
- `/mission-spec:ms-report` — run report 생성 (markdown)
- `/mission-spec:ms-context` — AI 에이전트를 위한 프로젝트 컨텍스트 프롬프트 생성 (v1.7.0+)

### 방법 2: 소스에서 설치

```bash
git clone https://github.com/chquandogong/mission-spec.git
cd mission-spec
npm install
npm run build
```

### 방법 3: 프로젝트에 로컬 플러그인으로 연결

```bash
# 프로젝트 디렉토리에서
git clone https://github.com/chquandogong/mission-spec.git .mission-spec
cd .mission-spec && npm install && npm run build && cd ..
```

`.claude/settings.json`에 플러그인 경로를 추가합니다:

```json
{
  "plugins": [".mission-spec"]
}
```

## 사용법

### Mission 초안 생성 (`ms-init`)

```typescript
import { generateMissionDraft } from "mission-spec";

const result = generateMissionDraft({
  goal: "사용자 인증 시스템을 구현한다",
  projectDir: ".",
});

console.log(result.yaml);
```

### 진행 상황 평가 (`ms-eval`)

```typescript
import { evaluateMission } from "mission-spec";

const result = evaluateMission(".");
console.log(result.summary);
```

### 상태 요약 (`ms-status`)

```typescript
import { getMissionStatus } from "mission-spec";

const status = getMissionStatus(".");
console.log(status.markdown);
```

### 리포트 생성 (`ms-report`)

```typescript
import { generateMissionReport } from "mission-spec";

const report = generateMissionReport(".");
console.log(report.markdown);
```

### AI 에이전트 컨텍스트 생성 (`ms-context`)

```typescript
import { generateContext } from "mission-spec";

const ctx = generateContext(".");
console.log(ctx.markdown); // mission + history + architecture + API 통합 프롬프트
console.log(ctx.sections); // ["mission", "design_refs", "history", "decisions", "architecture", "api"]
```

필요하면 subpath import도 사용할 수 있습니다:

```typescript
import { evaluateMission } from "mission-spec/commands/eval";
```

## mission.yaml 형식

```yaml
mission:
  title: "미션 제목"
  goal: "미션 목표"
  done_when:
    - "완료 조건 1"
    - "완료 조건 2"
  constraints:
    - "제약 조건"
  approvals:
    - gate: "review"
      approver: "human"
  execution_hints:
    topology: "sequential"
  design_refs: # v1.7.0+
    architecture: "docs/internal/ARCHITECTURE.md"
    api_surface: "src/index.ts"
    type_definitions: "src/core/parser.ts"
    component_protocol: "docs/internal/DATA_FLOW.md"
  lineage: # v1.5.0+
    initial_version: "1.0.0"
    initial_date: "2026-04-02"
    total_revisions: 3
    history: "mission-history.yaml"
```

전체 스키마: [`src/schema/mission.schema.json`](src/schema/mission.schema.json)

## Living Asset Registry (v1.5.0)

mission.yaml의 변경 이력을 구조화하여 회사 자산으로 관리합니다.

### 구조

```
project-root/
├── mission.yaml                    # 현재 authoritative spec
├── mission-history.yaml            # 구조화된 변경 원장
└── .mission/
    ├── CURRENT_STATE.md            # 현재 상태 대시보드
    ├── snapshots/                  # 버전별 mission.yaml 원본
    ├── decisions/                  # MDR (Mission Decision Records)
    └── templates/                  # 변경 항목 + MDR 템플릿
```

### mission-history.yaml

변경의 의도, 영향 범위, 완료 조건 변화를 구조화된 YAML로 추적합니다:

```yaml
timeline:
  - change_id: "MSC-2026-04-08-001"
    semantic_version: "1.5.0"
    date: "2026-04-08"
    author: "Dr. QUAN"
    change_type: "enhancement"
    persistence: "permanent" # permanent | transient | experimental
    intent: "Living Asset Registry 도입"
    done_when_delta: # 완료 조건의 변화 추적
      added: [".claude-plugin/plugin.json 존재"]
      removed: []
    impact_scope:
      schema: true
      skills: true
```

### lineage 필드

`ms-init`으로 새 mission을 생성하면 `lineage` 필드가 자동으로 포함됩니다:

```yaml
lineage:
  initial_version: "1.0.0"
  history: "mission-history.yaml"
```

### 도구 연동

- **ms-status**: `mission-history.yaml`을 읽어 현재 phase와 진화 요약을 출력
- **ms-report**: 최근 3건의 변경 이력을 리포트에 포함
- **ms-init**: 새 mission 생성 시 `lineage` + `version` 자동 생성

### History API

```typescript
import {
  loadHistory,
  getCurrentPhase,
  getLatestEntry,
  validateHistory,
} from "mission-spec";

const history = loadHistory("."); // schema 오류 시 throw (v1.6.0+)
if (history) {
  console.log(getCurrentPhase(history)); // { name: "living-asset", theme: "..." }
  console.log(getLatestEntry(history)); // 최신 timeline 항목
}

// 임의 데이터를 mission-history.yaml 스키마로 검증
const { valid, errors } = validateHistory(anyData);
```

## LLM/주관 평가 (v1.6.0+)

`done_when` 조건 중 기계적으로 판정하기 어려운 항목은 `llm-eval` 또는 `llm-judge` 타입 eval로 정의하고, 외부 판정을 `.mission/evals/<eval-name>.result.yaml`에 기록합니다:

```yaml
# mission.yaml
done_when:
  - "subjective_quality"
evals:
  - name: "subjective_quality"
    type: "llm-eval" # 또는 "llm-judge"
    pass_criteria: "UX가 직관적이고 사용자 혼란 없음"
```

```yaml
# .mission/evals/subjective_quality.result.yaml
passed: true
reason: "리뷰어 3인 판정"
evaluated_by: "human" # 또는 "llm-claude", "llm-gpt5" 등
evaluated_at: "2026-04-13"
```

`ms-eval`은 오버라이드 파일을 읽어 판정을 확정합니다. 파일이 없으면 `LLM 검증 대기` 상태로 유지됩니다.

## 스냅샷 및 pre-commit 훅 (v1.6.0+)

`mission.yaml`이 변경될 때마다 버전별 스냅샷을 `.mission/snapshots/`에 자동으로 아카이브할 수 있습니다:

```bash
# 수동 스냅샷 생성
npm run snapshot

# 커밋 시 자동 스냅샷 (한 번만 설정)
git config core.hooksPath .githooks
```

스냅샷 스크립트는 버전 기반 dedup을 수행 — 같은 `version`의 스냅샷이 이미 있으면 생성하지 않습니다.

또한 `npm run validate:history-commits`로 `mission-history.yaml`의 `related_commits`와 실제 Git 이력을 대조할 수 있습니다. 현재 pre-commit 훅은 다음 두 가지를 함께 수행합니다.

- 새 버전 snapshot 생성 및 스테이징
- contract 관련 staged 변경이 있는데 `mission-history.yaml`이 빠졌는지 검사

이 검증은 이미 커밋된 관련 commit이 history에 누락됐는지도 잡아냅니다. 단, `mission-history.yaml`을 함께 수정한 consolidation commit 자체는 self-reference 문제를 피하기 위해 예외 처리합니다.

## Cross-Platform 변환

```bash
node scripts/convert-platforms.js mission.yaml
```

생성 파일:

- `.cursorrules` - Cursor용
- `AGENTS.md` - Codex용
- `opencode.toml` - OpenCode용

검증만 수행하려면:

```bash
node scripts/convert-platforms.js --verify
```

## 테스트

```bash
npm test
npm run test:watch
npm run build
```

## 현재 범위

- 제공 중: schema validation, mission draft generation, rule-based evaluation, status/report generation
- 제공 중: cross-platform conversion for Cursor, Codex, OpenCode
- 제공 중: Claude Code skill files `ms-init`, `ms-eval`, `ms-status`, `ms-report`
- 제공 중: Living Asset Registry — `lineage` 스키마, `mission-history.yaml` 변경 원장, MDR, 스냅샷
- 제공 중: history API — `loadHistory()`, `getCurrentPhase()`, `getLatestEntry()`, `validateHistory()`
- 제공 중: LLM/주관 평가 오버라이드 (`llm-eval`, `llm-judge` + `.mission/evals/<name>.result.yaml`)
- 제공 중: 스냅샷 자동화 (`npm run snapshot`, `.githooks/pre-commit`)
- 제공 중: `design_refs` 스키마 필드 + `architecture_delta` history 필드 (v1.7.0+)
- 제공 중: Architecture Registry, Dependency Graph, API Registry, Traceability Matrix (`.mission/` 하위)
- 미포함: GitHub/PR integration runtime, 별도 orchestration framework, SaaS/UI

## 설계 원칙

1. **Task Contract Only** — orchestration, runtime, capability는 건드리지 않음
2. **execution_hints는 suggestion** — 런타임이 무시할 수 있어야 함
3. **기존 워크플로에 녹아들기** — 별도 실행 플랫폼보다 기존 환경에 맞춤
4. **Minimal Dependencies** — Node.js + Ajv + yaml
5. **TDD First** — 테스트로 현재 범위를 고정

## 라이선스

MIT
