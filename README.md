# Mission Spec

AI 에이전트 워크플로를 위한 **task contract layer**. Orchestration framework가 아닌, 기존 하네스 위에서 작동하는 portable한 run-scoped task contract입니다.

## 핵심 파이프라인

```
자연어 → mission.yaml draft → eval scaffold → run report
```

## 5분 설치 가이드

### 1. 설치

```bash
git clone <repo-url>
cd mission-spec
npm install
npm run build
```

### 2. Mission 초안 생성 (`/ms:init`)

프로젝트 디렉토리에서 자연어로 목표를 입력하면 `mission.yaml` 초안이 자동 생성됩니다.

```typescript
import { generateMissionDraft } from 'mission-spec';

const result = generateMissionDraft({
  goal: '사용자 인증 시스템을 구현한다',
  projectDir: '.',
});
console.log(result.yaml);
```

### 3. 진행 상황 평가 (`/ms:eval`)

```typescript
import { evaluateMission } from 'mission-spec/commands/eval';

const result = evaluateMission('.');
console.log(result.summary); // "3/5 criteria passed"
```

### 4. 상태 요약 (`/ms:status`)

```typescript
import { getMissionStatus } from 'mission-spec/commands/status';

const status = getMissionStatus('.');
console.log(status.markdown);
```

### 5. 리포트 생성 (`/ms:report`)

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

전체 스키마: `src/schema/mission.schema.json`

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
