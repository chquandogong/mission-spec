# Mission Spec

[![GitHub](https://img.shields.io/github/license/chquandogong/mission-spec)](https://github.com/chquandogong/mission-spec)

AI 에이전트 워크플로를 위한 **task contract layer**. Orchestration framework가 아닌, 기존 하네스 위에서 작동하는 portable한 run-scoped task contract입니다.

**Repository:** https://github.com/chquandogong/mission-spec

## 핵심 파이프라인

```
자연어 → mission.yaml draft → eval scaffold → run report
```

## 5분 설치 가이드

### 방법 1: Claude Code Plugin으로 설치 (권장)

```bash
# Claude Code CLI에서 플러그인 설치
claude plugin add github:chquandogong/mission-spec
```

설치 후 Claude Code에서 바로 사용 가능합니다:

- `/ms:init` — 자연어 → mission.yaml 초안 자동 생성
- `/ms:eval` — done_when 기준 대비 현재 상태 평가
- `/ms:status` — 미션 진행 상황 요약
- `/ms:report` — run report 생성 (markdown)

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

### Mission 초안 생성 (`/ms:init`)

프로젝트 디렉토리에서 자연어로 목표를 입력하면 `mission.yaml` 초안이 자동 생성됩니다.

```typescript
import { generateMissionDraft } from 'mission-spec';

const result = generateMissionDraft({
  goal: '사용자 인증 시스템을 구현한다',
  projectDir: '.',
});
console.log(result.yaml);
```

### 진행 상황 평가 (`/ms:eval`)

```typescript
import { evaluateMission } from 'mission-spec/commands/eval';

const result = evaluateMission('.');
console.log(result.summary); // "3/5 criteria passed"
```

### 상태 요약 (`/ms:status`)

```typescript
import { getMissionStatus } from 'mission-spec/commands/status';

const status = getMissionStatus('.');
console.log(status.markdown);
```

### 리포트 생성 (`/ms:report`)

```typescript
import { generateMissionReport } from 'mission-spec/commands/report';

const report = generateMissionReport('.');
console.log(report.markdown);
```

## mission.yaml 형식

```yaml
mission:
  title: "미션 제목" # 필수
  goal: "미션 목표"   # 필수
  done_when:          # 필수
    - "완료 조건 1"
    - "완료 조건 2"
  constraints:        # 선택
    - "제약 조건"
  approvals:          # 선택
    - gate: "review"
      approver: "human"
  execution_hints:    # 선택 (advisory only)
    topology: "sequential"
```

전체 스키마: [`src/schema/mission.schema.json`](src/schema/mission.schema.json)

## Cross-Platform 변환

```bash
node scripts/convert-platforms.js mission.yaml
```

생성 파일:
- `.cursorrules` — Cursor용
- `AGENTS.md` — Codex용
- `opencode.toml` — OpenCode용

검증만:
```bash
node scripts/convert-platforms.js --verify
```

## 테스트

```bash
npm test          # 전체 테스트 실행
npm run test:watch # watch 모드
```

## 설계 원칙

1. **Task Contract Only** — orchestration, runtime, capability는 건드리지 않음
2. **execution_hints는 suggestion** — 런타임이 무시할 수 있어야 함
3. **기존 워크플로에 녹아들기** — GitHub Issue/PR, CI/CD와 자연스럽게 통합
4. **Zero Dependencies** — Node.js + Ajv + yaml만 사용
5. **TDD First** — 모든 코드는 테스트 먼저

## 라이선스

MIT
