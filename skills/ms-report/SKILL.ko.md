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

[English](SKILL.md) | 한국어 | [中文](SKILL.zh.md)

# ms-report — Run Report 생성

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

## Recent Changes 섹션 (v1.5.0+)

`mission-history.yaml`이 프로젝트 루트에 존재하면, 리포트에 최근 3건의 변경 이력이 포함됩니다:

```markdown
## Recent Changes

### 1.5.0 (2026-04-08)

- **Intent:** Living Asset Registry 도입
- **Type:** enhancement | **Persistence:** permanent
- Added: src/core/history.ts, lineage 필드, ...
- Modified: ms-status, ms-report, ms-init, ...
```

## Traceability 섹션 (v1.7.0+)

`.mission/traceability/TRACE_MATRIX.yaml`이 프로젝트 루트에 존재하면, 리포트에 Traceability 표가 자동 포함됩니다:

```markdown
## Traceability

| Requirement              | Eval Type | Code                       | Tests                |
| ------------------------ | --------- | -------------------------- | -------------------- |
| schema_validation_passes | automated | scripts/validate-schema.js | tests/schema.test.ts |
```

TRACE_MATRIX가 없으면 이 섹션은 자동으로 생략됩니다.

## 주의

- 리포트에는 타임스탬프가 포함되어 각 실행을 구분할 수 있습니다.
- PASS는 모든 done_when이 충족된 경우에만 표시됩니다.
- `mission-history.yaml`이 없으면 Recent Changes 섹션이 생략됩니다.
- `mission-history.yaml`이 스키마에 맞지 않으면 (v1.6.0+) 실패 대신
  리포트에 `## History` 섹션으로 `History unavailable: ...` 경고를 표시하고
  나머지 평가는 정상 수행합니다. 반환값의 `historyWarning` 필드로도 전달됩니다.
- `llm-eval` / `llm-judge` 타입 criterion은 `.mission/evals/<name>.result.yaml`에 판정이 기록되어야 PASS로 집계됩니다 (ms-eval SKILL 참조).
