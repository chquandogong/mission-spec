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

[English](SKILL.md) | 한국어 | [中文](SKILL.zh.md)

# ms-init — 자연어 → mission.yaml 초안 생성

## 동작

1. 사용자에게 자연어로 **미션 목표**를 물어봅니다 (이미 제공된 경우 생략).
2. 현재 구현은 `package.json`과 `README.md`의 존재 여부를 확인하고, `package.json`에서 프로젝트 이름과 설명을 읽습니다.
3. 목표에서 **title**, **done_when** 조건을 휴리스틱으로 도출합니다.
4. 사용자가 제공한 제약 조건이 있으면 **constraints**에 포함합니다.
5. `mission.yaml` 초안을 생성하고, 스키마 검증을 수행합니다.

## mission.yaml 스키마 (필수 필드)

```yaml
mission:
  title: string # 필수 — 미션 제목
  goal: string # 필수 — 미션 목표 (자연어)
  done_when: # 필수 — 완료 조건 (1개 이상)
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
- `lineage`: 변경 이력 참조 (`initial_version`, `history` 필수) — v1.5.0+

## 자동 생성 필드 (v1.5.0+)

`generateMissionDraft()`는 다음 필드를 자동으로 포함합니다:

- `version: "1.0.0"`
- `lineage.initial_version: "1.0.0"`
- `lineage.initial_date`: 현재 날짜
- `lineage.history: "mission-history.yaml"`

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

## Post-init: pre-commit hook 설치 (v1.17.0+)

`ms-init`으로 `mission.yaml`을 만든 뒤, 이후 수정이 스키마 drift를 유입시키지 못하도록 검증 hook을 설치합니다:

```bash
npm install --save-dev mission-spec
cp node_modules/mission-spec/templates/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Hook은 `npx mission-spec validate`를 호출하여 `mission.yaml` 또는 (존재 시) `mission-history.yaml`의 스키마가 깨지면 non-zero exit합니다. evaluator는 돌리지 않으므로 매 commit마다 실행해도 빠릅니다.

## 주의

- `execution_hints`는 **suggestion**이지 directive가 아닙니다. 런타임이 무시 가능해야 합니다.
- 외부 API 호출 없이, rule-based로만 동작합니다.
- 현재 라이브러리 함수 `generateMissionDraft()`는 파일을 직접 쓰지 않고 YAML 문자열을 반환합니다.
