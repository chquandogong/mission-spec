---
name: ms-report
description: >
  미션 실행 결과를 markdown report로 생성합니다.
  "리포트 만들어줘", "미션 보고서", "run report" 등의 요청에 트리거됩니다.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Bash(node *)
  - Bash(npm *)
  - Glob
  - Grep
---

# /ms:report — Run Report 생성

## 동작

1. `mission.yaml`을 읽고 스키마 검증합니다.
2. done_when 전체 평가를 수행합니다.
3. PASS/FAIL 판정과 함께 상세 리포트를 생성합니다.
4. 리포트를 화면에 출력하고, 필요시 파일로 저장합니다.

## 실행 방법

```bash
node -e "
import { generateMissionReport } from '${CLAUDE_PLUGIN_ROOT}/dist/commands/report.js';
const r = generateMissionReport('.');
console.log(r.markdown);
"
```

## 출력 형식

```markdown
# Mission Report: 미션 제목

**Status:** PASS (또는 FAIL)
**Progress:** 4/5
**Generated:** 2026-04-02T12:00:00.000Z
**Author:** author-name
**Version:** 1.0.0

## Evaluation Results

- [x] 조건 1
- [x] 조건 2
- [ ] 조건 3
  - 실패 사유

---
Mission Spec Report — 2026-04-02T12:00:00.000Z
```

## 파일 저장

사용자가 요청하면 리포트를 파일로 저장합니다:

```bash
node -e "
import { generateMissionReport } from '${CLAUDE_PLUGIN_ROOT}/dist/commands/report.js';
import { writeFileSync } from 'node:fs';
const r = generateMissionReport('.');
writeFileSync('mission-report.md', r.markdown);
console.log('Report saved to mission-report.md');
"
```

## 주의

- 리포트에는 타임스탬프가 포함되어 각 실행을 구분할 수 있습니다.
- PASS는 모든 done_when이 충족된 경우에만 표시됩니다.
