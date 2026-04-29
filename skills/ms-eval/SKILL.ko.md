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

[English](SKILL.md) | 한국어 | [中文](SKILL.zh.md)

# ms-eval — done_when 기준 평가

## 동작

1. 현재 디렉토리의 `mission.yaml`을 읽고 스키마 검증합니다.
2. `done_when` 목록의 각 조건을 평가합니다:
   - **명시적 gate 연결 (v1.21.0+)**: `mission.done_when_refs[]`가 해당 criterion의 index를 바인딩하면 그 ref가 모든 heuristic보다 우선합니다. 지원 ref kind는 `command`, `file-exists`, `file-contains`, `eval-ref`입니다.
     - `command`: shell command를 실행하고 exit code 0이면 PASS.
     - `file-exists`: 경로가 존재하면 PASS.
     - `file-contains`: `path::substring` 형식으로 파일에 substring이 있으면 PASS.
     - `eval-ref`: `mission.evals[].name`으로 위임.
   - **Manual/LLM 주관 평가 연결**: `evals[].name`이 criterion과 같고 `type: manual`, `llm-eval`, `llm-judge`이면
     `.mission/evals/<name>.result.yaml` 오버라이드 파일을 조회. 파일이 있으면 그 판정을 사용, 없으면 기록된 verdict 대기로 표시.
   - **자동화 eval 연결**: `evals[].name`이 criterion과 정확히 같고 `type: automated`이면 해당 명령을 실행
   - **파일 존재 체크**: "X 파일 존재", "X exists" → 해당 파일이 프로젝트에 있는지 확인
   - **테스트 관련 문구**: 명시적 automated eval이 없으면 수동 확인 필요로 표시
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

## Manual/LLM 주관 평가 오버라이드

`manual`, `llm-eval`, `llm-judge` 타입의 eval은 기계적으로 판정할 수 없으므로,
외부 판정 결과를 `.mission/evals/<eval-name>.result.yaml`에 기록합니다:

```yaml
# .mission/evals/subjective_quality.result.yaml
passed: true
reason: "리뷰어 3인 판정, 모두 동의"
evaluated_by: "human" # 또는 "llm-claude", "llm-gpt5" 등
evaluated_at: "2026-04-13"
```

- 파일 존재 + `passed: true` → PASS
- 파일 존재 + `passed: false` → FAIL (판정 사유 함께 표시)
- 파일 없음 → "manual/LLM 검증 대기" (pending)
- `passed` 필드 누락/타입 오류 → "형식 오류"

## 주의

- `mission.yaml`이 없으면 에러를 반환합니다.
- 스키마가 유효하지 않으면 에러를 반환합니다.
- 지속 가능한 완료 조건에는 `done_when_refs[].kind: eval-ref`를 권장합니다. `done_when`은 사람이 읽기 좋은 문장으로 유지하고, 실제 command 또는 외부 verdict 계약은 `evals[]`에 둡니다.
- `eval`, `status`, `report`는 신뢰한 `mission.yaml`에 선언된 shell command를 실행할 수 있습니다. 신뢰하지 않는 저장소는 schema-only인 `mission-spec validate`를 먼저 사용하세요.
- `evals[].name`과 `done_when`이 연결되지 않으면 automated eval은 실행되지 않습니다.
- `manual` / `llm-eval` / `llm-judge` 타입은 오버라이드 파일이 기록될 때까지 pending 상태로 표시됩니다.
- `architecture_doc_freshness` eval (v1.7.0+)을 통해 `design_refs`가 가리키는 설계 문서의 최신성을 검증할 수 있습니다.
