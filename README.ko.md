[English](README.md) | 한국어 | [中文](README.zh.md)

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
- `/mission-spec:ms-decide` — 자연어 결정 설명으로부터 MDR(Mission Decision Record) 초안 생성 (v1.14.0+)

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

fresh clone 또는 공유 저장소 리뷰에서는 `evaluateMission(".", { scope: "shared" })`
또는 `npx mission-spec eval --shared`를 사용할 수 있습니다. shared mode는
missing gitignored local-only artifact만 가리키는 criterion을 skip/pass 처리합니다.

### 상태 요약 (`ms-status`)

```typescript
import { getMissionStatus } from "mission-spec";

const status = getMissionStatus(".");
console.log(status.markdown);
```

`getMissionStatus(".", { scope: "shared" })`와 `npx mission-spec status --shared`도
같은 shared-clone 동작을 status/drift 보고에 적용합니다.

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

### MDR 초안 생성 (`ms-decide`)

```typescript
import { generateMdrDraft } from "mission-spec";

const result = generateMdrDraft({
  title: "Vendor-neutral 플랫폼 어댑터 채택",
  projectDir: ".",
});

console.log(result.suggestedPath); // .mission/decisions/MDR-00N-vendor-neutral-...md
console.log(result.nextMdrNumber); // 다음 MDR 번호
console.log(result.markdown); // Context / Decision / Rationale / Consequences / Alternatives 섹션 스캐폴드
```

파일명은 Unicode NFC + `/u` 플래그로 slugify되어 한글/중문/일문 제목도 안정적으로 파일명 생성 (v1.14.1+).

필요하면 subpath import도 사용할 수 있습니다:

```typescript
import { evaluateMission } from "mission-spec/commands/eval";
```

Migration 스크립트는 목표 schema 버전을 명시해야 합니다:

```bash
npm run migrate:dry-run -- <toVersion>
npm run migrate:apply -- <toVersion>
```

아직 등록된 migrator는 없으며, schema v2가 정의될 때까지 registry는 비어 있습니다.

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

이 검증은 이미 커밋된 관련 commit이 history에 누락됐는지도 잡아냅니다. 단, self-reference 문제를 피하기 위해 `mission-history.yaml`을 **처음 도입한 bootstrap commit 1건**과, **현재 HEAD가 `mission-history.yaml`을 함께 수정한 경우**만 예외 처리합니다. 이후 다른 commit이 쌓이면, 그 이전 code+history 동시 commit도 다시 검사 대상이 됩니다.

## 커밋 전 검증 (v1.17.0+)

`mission.yaml` + `mission-history.yaml`의 스키마 무결성을 commit 시점에 강제합니다. evaluator 호출 없이 스키마만 검사하므로 빠르고 deterministic — 스키마 drift가 repo에 유입되기 전 commit을 차단.

기본 설치 (`.git/hooks/`):

```bash
npm install --save-dev mission-spec
cp node_modules/mission-spec/templates/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

팀 공유 변형 (`.githooks/` + `core.hooksPath`):

```bash
mkdir -p .githooks
cp node_modules/mission-spec/templates/pre-commit .githooks/pre-commit
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks
```

Hook은 `npx mission-spec validate`를 호출하며, 같은 명령을 CI / 수동 검증에 독립적으로 사용할 수도 있습니다.

비어 있는 `changes.*` / `done_when_delta.*` 배열을 생략한 legacy
`mission-history.yaml` entry는 validation 전에 normalize합니다. 타입이 잘못된 값은
계속 실패합니다.

## related_commits 백필 (v1.18.0+)

`mission-history.yaml`의 빈 `related_commits: []` 항목을 각 revision date의 ±1-day 범위 git commit과 매칭해 채워 넣습니다. 기본은 dry-run, `--apply` 시 단일 후보 엔트리를 파일에 직접 기록.

```bash
# 제안만 확인 (쓰지 않음)
npx mission-spec backfill-commits

# 단일 후보 엔트리를 일괄 적용
npx mission-spec backfill-commits --apply
git add mission-history.yaml
git commit -m "chore: backfill related_commits via ms-backfill-commits"
```

엔트리별 분류:

- **auto-apply** — window 내 commit이 정확히 1개; `--apply` 시 기록.
- **ambiguous** — window 내 commit이 2개 이상; 나열하되 기록하지 않음 (수동 편집 필요).
- **no-candidates** — window 내 commit이 0개; 나열하되 작업 없음.

이미 채워진 `related_commits` 배열은 **절대 덮어쓰지 않습니다**.

## 커밋 시 snapshot (v1.19.0+)

`.mission/snapshots/`에 `mission.yaml`의 버전별 사본을 생성합니다. `mission.version`별 idempotent — 같은 버전으로 재호출하면 기존 snapshot을 반환(중복 생성 없음). 언어 독립적 — Node + mission-spec 설치된 어느 프로젝트에서도 동작.

```bash
# 단독 호출
npx mission-spec snapshot
```

2-step pre-commit hook (v1.17.0 validate + v1.19.0 snapshot 결합):

```sh
#!/bin/sh
set -e
npx mission-spec validate
npx mission-spec snapshot
git add .mission/snapshots/
```

기존 v1.17.0 adopter는 설치된 `.git/hooks/pre-commit`에 `snapshot` + `git add` 두 줄만 추가. 패키지에 포함된 `templates/pre-commit` 파일은 그대로(단일 validate 호출) 유지되므로 `cp` 재설치는 필요 없음.

## Cross-Platform 변환

```bash
node scripts/convert-platforms.js mission.yaml
```

생성 파일 (v1.14.0+ — 6개 플랫폼):

- `.cursorrules` — Cursor용
- `AGENTS.md` — Codex용
- `opencode.toml` — OpenCode용
- `.clinerules` — Cline용 (v1.14.0+)
- `.continuerules` — Continue용 (v1.14.0+)
- `.aider.conf.yml` + `.aider-mission.md` — Aider용 (v1.14.0+)

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
- 제공 중: cross-platform conversion for Cursor, Codex, OpenCode, Cline, Continue, Aider (v1.14.0+)
- 제공 중: Claude Code skill files `ms-init`, `ms-eval`, `ms-status`, `ms-report`, `ms-context`, `ms-decide`
- 제공 중: CLI — `npx mission-spec <context|status|eval|report>` (v1.12.0+)
- 제공 중: Living Asset Registry — `lineage` 스키마, `mission-history.yaml` 변경 원장, MDR, 스냅샷
- 제공 중: history API — `loadHistory()`, `getCurrentPhase()`, `getLatestEntry()`, `validateHistory()`
- 제공 중: LLM/주관 평가 오버라이드 (`llm-eval`, `llm-judge` + `.mission/evals/<name>.result.yaml`)
- 제공 중: 스냅샷 자동화 (`npm run snapshot`, `.githooks/pre-commit`)
- 제공 중: `design_refs` 스키마 필드 + `architecture_delta` history 필드 (v1.7.0+)
- 제공 중: Architecture Registry, Dependency Graph, API Registry, Traceability Matrix (`.mission/` 하위)
- 제공 중: Architecture/plugin drift detector — `extractArchitecture()`, `validatePlugin()`, `arch:sync`/`check`/`verify` (v1.10.0+, v1.11.0+)
- 제공 중: MDR 작성 보조 — `ms-decide` skill + `generateMdrDraft()` (v1.14.0+)
- 제공 중: Schema migration 인프라 — `detectSchemaVersion()`, `registerMigration()`, `migrateMission()` + CLI wrapper `npm run migrate:dry-run -- <toVersion>` / `npm run migrate:apply -- <toVersion>` (v1.14.0+, schema v2까지 registry 비어있음)
- 제공 중: Reconstruction verifier — `verifyReconstructionReferences()` + `reconstruction:verify [--cold-build]` (v1.14.0+)
- 제공 중: Release pipeline — `.github/workflows/{test,pre-commit-parity,release}.yml` (v1.9.0+, v1.13.0+)
- 제공 중: `.mission/` 메타데이터 auto-sync — `scripts/bump-metadata.js`가 Version 헤더와 CURRENT_STATE Title 라인을 `mission.yaml`에서 자동 동기화 (`npm run metadata:sync` / `metadata:check`, v1.15.0+, v1.16.3+ Title, v1.16.10+ CURRENT_STATE 전용 filename guard)
- 제공 중: Registry freshness verifier — `scripts/verify-registry.js`가 `REBUILD_PLAYBOOK.md`, `TRACE_MATRIX.yaml`, `CURRENT_STATE.md`(Title 라인 + `완료 조건 (N/M PASS)` 완료 조건 카운트 + `최근 구현` version range 헤더)를 TypeScript AST 기반으로 live source와 대조 (`npm run registry:check`, v1.16.0+, v1.16.2+ CURRENT_STATE, v1.16.9+ locale-tolerant Title + version range, v1.16.13+ opt-in `--verify-live` 모드는 claimed PASS를 `evaluateMission()` 결과와 mechanically tie)
- 제공 중: Cold-build release gate — `reconstruction:verify --cold-build`가 release workflow 단계로 실행되어 태그된 커밋이 소스만으로 재구성 가능한지 증명 (v1.16.1+)
- 제공 중: `arch:verify` deep-compare — `package.json.exports`의 nested conditional exports 구조 재귀 비교 (v1.14.3+ key-set, v1.16.2+ value shape, v1.16.11+ nested depth)
- 제공 중: `plugin-validator` `package-lock.json` drift 감지 — lockfile이 과거 릴리스 버전에 머물러 있는 경우 포착 (v1.16.7+)
- 제공 중: `vitest.config.ts` deterministic test timeout — `testTimeout: 15000`이 `describe.concurrent`의 order-dependent flakiness 제거 (v1.16.8+)
- 제공 중: Governance MDR series — `MDR-005` meta-tooling 범위 (v1.14.2+), `MDR-006` SemVer 등급 정책 (v1.16.4+), `MDR-007` playbook 언어 Hold+Trigger (v1.16.5+)
- 미포함: GitHub/PR integration runtime, 별도 orchestration framework, SaaS/UI

## 설계 원칙

1. **Task Contract Only** — orchestration, runtime, capability는 건드리지 않음
2. **execution_hints는 suggestion** — 런타임이 무시할 수 있어야 함
3. **기존 워크플로에 녹아들기** — 별도 실행 플랫폼보다 기존 환경에 맞춤
4. **Minimal Dependencies** — Node.js + Ajv + yaml
5. **TDD First** — 테스트로 현재 범위를 고정

## 라이선스

MIT
