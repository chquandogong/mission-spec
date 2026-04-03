---
name: ms-status
description: >
  mission.yaml 기반 미션 진행 상황을 markdown으로 요약합니다.
  "미션 상태", "진행 상황", "어디까지 했어" 등의 요청에 트리거됩니다.
user-invocable: true
allowed-tools:
  - Read
  - Bash(node *)
  - Bash(npm *)
  - Glob
  - Grep
---

# /mission-spec:ms-status — 미션 진행 상황 요약

## 동작

1. `mission.yaml`을 읽고 스키마 검증합니다.
2. 미션 메타데이터 (title, goal, constraints)를 추출합니다.
3. done_when 각 조건을 평가하여 진행률을 계산합니다.
4. Markdown 형식으로 요약을 출력합니다.

## 실행 방법

```bash
node -e "
import { getMissionStatus } from '${CLAUDE_PLUGIN_ROOT}/dist/commands/status.js';
const s = getMissionStatus('.');
console.log(s.markdown);
"
```

## 출력 형식

```markdown
# 미션 제목

**Goal:** 미션 목표 텍스트

**Progress:** 3/5

## Constraints
- 제약 조건 1
- 제약 조건 2

## Done When
- [x] 완료된 조건
- [ ] 미완료 조건
  - 실패 사유
```

## 주의

- `mission.yaml`이 없으면 에러를 반환합니다.
- constraints가 없으면 해당 섹션을 생략합니다.
