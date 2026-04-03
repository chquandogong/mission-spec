---
name: ms-eval
description: >
  mission.yaml의 done_when 기준 대비 현재 프로젝트 상태를 평가합니다.
  "미션 평가해줘", "done_when 체크", "완료 조건 확인" 등의 요청에 트리거됩니다.
user-invocable: true
allowed-tools:
  - Read
  - Bash(node *)
  - Bash(npm *)
  - Glob
  - Grep
---

# /ms:eval — done_when 기준 평가

## 동작

1. 현재 디렉토리의 `mission.yaml`을 읽고 스키마 검증합니다.
2. `done_when` 목록의 각 조건을 rule-based로 평가합니다:
   - **파일 존재 체크**: "X 파일 존재", "X exists" → 해당 파일이 프로젝트에 있는지 확인
   - **테스트 통과**: "테스트 통과", "tests pass" → `npm test` 실행 결과 확인
   - **기타**: 자동 평가 불가 → 수동 확인 필요로 표시
3. 결과를 체크리스트 형태로 출력합니다.

## 실행 방법

```bash
node -e "
import { evaluateMission } from '${CLAUDE_PLUGIN_ROOT}/dist/commands/eval.js';
const r = evaluateMission('.');
console.log(r.summary);
r.criteria.forEach(c => {
  const icon = c.passed ? '[x]' : '[ ]';
  console.log(icon + ' ' + c.criterion);
  if (!c.passed) console.log('  → ' + c.reason);
});
"
```

## 출력 형식

```
3/5 criteria passed
[x] package.json 존재
[x] README.md 파일 존재
[ ] 모든 테스트 통과
  → 수동 확인 필요: npm test 실행 결과를 확인하세요
[x] src/index.ts 존재
[ ] 배포 완료
  → 자동 평가 불가 — 수동 확인 필요
```

## 테스트 조건 직접 확인

"테스트 통과" 조건이 있으면 직접 `npm test`를 실행하여 결과를 확인하고, 통과 여부를 사용자에게 알려줍니다.

## 주의

- `mission.yaml`이 없으면 에러를 반환합니다.
- 스키마가 유효하지 않으면 에러를 반환합니다.
- v1은 rule-based eval만 지원합니다 (LLM-as-judge 없음).
