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

# ms-status — 미션 진행 상황 요약

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

## Evolution 섹션 (v1.5.0+)

`mission-history.yaml`이 프로젝트 루트에 존재하면 출력에 Evolution 섹션이 추가됩니다:

```markdown
## Evolution

**Phase:** living-asset — Living Asset Registry 도입
**Revisions:** 5

- **initial-release** (1.0.0): 핵심 기능 구현
- **stabilization** (1.1.0): 이름 충돌 해소
- **hardening** (1.2.0): adversarial review 반영
- **marketplace-ready** (1.4.0): 배포 준비, 정체성 확립
- **living-asset** (1.5.0): Living Asset Registry 도입
```

반환값에 `phase`, `phaseTheme`, `totalRevisions` 필드가 추가됩니다.

## 주의

- `mission.yaml`이 없으면 에러를 반환합니다.
- constraints가 없으면 해당 섹션을 생략합니다.
- `mission-history.yaml`이 없으면 Evolution 섹션이 생략됩니다.
