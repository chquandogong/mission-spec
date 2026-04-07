# Mission Spec

[![GitHub](https://img.shields.io/github/license/chquandogong/mission-spec)](https://github.com/chquandogong/mission-spec)

AI 에이전트 워크플로를 위한 **task contract layer**. Orchestration framework가 아닌, 기존 하네스 위에서 작동하는 portable한 run-scoped task contract입니다. 현재 저장소는 TypeScript 라이브러리와 Claude Code용 skill bundle을 함께 제공합니다.

**Repository:** https://github.com/chquandogong/mission-spec

## 핵심 파이프라인

```text
자연어 -> mission.yaml draft -> eval scaffold -> run report
```

## 5분 설치 가이드

### 방법 1: 소스에서 설치

```bash
git clone https://github.com/chquandogong/mission-spec.git
cd mission-spec
npm install
npm run build
```

### 방법 2: 프로젝트에 로컬 플러그인으로 연결

```bash
# 프로젝트 디렉토리에서
git clone https://github.com/chquandogong/mission-spec.git .mission-spec
cd .mission-spec
npm install
npm run build
cd ..
```

`.claude/settings.json`에 플러그인 경로를 추가합니다:

```json
{
  "plugins": [".mission-spec"]
}
```

이 저장소에 포함된 Claude Code skill file의 canonical name은 다음과 같습니다.

- `ms-init`
- `ms-eval`
- `ms-status`
- `ms-report`

호스트 환경에 따라 호출 시 플러그인 prefix가 붙을 수 있지만, 저장소 안에서 정의된 실제 skill name은 위 네 가지입니다.

## 사용법

### Mission 초안 생성 (`ms-init`)

```typescript
import { generateMissionDraft } from 'mission-spec';

const result = generateMissionDraft({
  goal: '사용자 인증 시스템을 구현한다',
  projectDir: '.',
});

console.log(result.yaml);
```

### 진행 상황 평가 (`ms-eval`)

```typescript
import { evaluateMission } from 'mission-spec';

const result = evaluateMission('.');
console.log(result.summary);
```

### 상태 요약 (`ms-status`)

```typescript
import { getMissionStatus } from 'mission-spec';

const status = getMissionStatus('.');
console.log(status.markdown);
```

### 리포트 생성 (`ms-report`)

```typescript
import { generateMissionReport } from 'mission-spec';

const report = generateMissionReport('.');
console.log(report.markdown);
```

필요하면 subpath import도 사용할 수 있습니다:

```typescript
import { evaluateMission } from 'mission-spec/commands/eval';
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
```

전체 스키마: [`src/schema/mission.schema.json`](src/schema/mission.schema.json)

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
- 미포함: GitHub/PR integration runtime, 별도 orchestration framework, SaaS/UI

## 설계 원칙

1. **Task Contract Only** — orchestration, runtime, capability는 건드리지 않음
2. **execution_hints는 suggestion** — 런타임이 무시할 수 있어야 함
3. **기존 워크플로에 녹아들기** — 별도 실행 플랫폼보다 기존 환경에 맞춤
4. **Minimal Dependencies** — Node.js + Ajv + yaml
5. **TDD First** — 테스트로 현재 범위를 고정

## 라이선스

MIT
