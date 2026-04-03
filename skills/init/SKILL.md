---
name: ms-init
description: >
  자연어 목표로부터 mission.yaml 초안을 자동 생성합니다.
  사용자가 미션을 시작하거나, mission.yaml을 만들고 싶어 할 때 사용합니다.
  "미션 만들어줘", "mission.yaml 생성", "새 작업 계약" 등의 요청에 트리거됩니다.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Bash(node *)
  - Bash(npm *)
  - Glob
  - Grep
---

# /ms:init — 자연어 → mission.yaml 초안 생성

## 동작

1. 사용자에게 자연어로 **미션 목표**를 물어봅니다 (이미 제공된 경우 생략).
2. 현재 프로젝트 컨텍스트를 수집합니다:
   - `package.json` (프로젝트 이름, 설명)
   - `README.md` (프로젝트 개요)
   - `git log --oneline -10` (최근 작업 방향)
3. 목표에서 **title**, **done_when** 조건을 도출합니다.
4. 사용자가 제공한 제약 조건이 있으면 **constraints**에 포함합니다.
5. `mission.yaml` 파일을 생성하고, 스키마 검증을 수행합니다.

## mission.yaml 스키마 (필수 필드)

```yaml
mission:
  title: string     # 필수 — 미션 제목
  goal: string      # 필수 — 미션 목표 (자연어)
  done_when:        # 필수 — 완료 조건 (1개 이상)
    - "조건 1"
    - "조건 2"
```

## 선택 필드

- `constraints`: 제약 조건 목록
- `approvals`: 승인 게이트 (`gate`, `approver`: human|ai|codex|ci)
- `evals`: 평가 항목 (automated → command+pass_criteria 필수, manual → description 필수)
- `budget_hint`: 리소스 힌트 (advisory)
- `execution_hints`: 실행 힌트 (advisory only — 런타임이 무시 가능)
- `skills_needed`, `artifacts`, `version`, `author`

## 스키마 검증

생성 후 반드시 스키마 검증을 수행합니다:

```bash
node -e "
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { validateMission } from '${CLAUDE_PLUGIN_ROOT}/dist/schema/validator.js';
const doc = parse(readFileSync('mission.yaml', 'utf-8'));
const r = validateMission(doc);
if (r.valid) console.log('mission.yaml: VALID');
else { console.error('INVALID:', r.errors.join(', ')); process.exit(1); }
"
```

## 주의

- `execution_hints`는 **suggestion**이지 directive가 아닙니다. 런타임이 무시 가능해야 합니다.
- 외부 API 호출 없이, rule-based로만 동작합니다.
- 기존 `mission.yaml`이 있으면 덮어쓰기 전 사용자에게 확인합니다.
