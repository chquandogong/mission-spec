---
name: ms-decide
description: >
  자연어로부터 새로운 Mission Decision Record(MDR) 초안을 생성합니다.
  사용자가 기록에 남길 만한 비자명한 아키텍처/정책/스코프 변경을 결정하려 할 때 사용합니다.
---

[English](SKILL.md) | [한국어](SKILL.ko.md) | [中文](SKILL.zh.md)

# ms-decide — 자연어 → MDR 초안 생성

## 동작

1. 사용자에게 **결정 제목**(필수)과 맥락 / 결정 / 근거 / 결과 / 대안에 대한 설명을 물어봅니다.
2. `.mission/decisions/`에서 기존 `MDR-NNN-*.md` 파일을 스캔하여 다음 번호(3자리 zero-pad)를 결정합니다.
3. 제목을 slug화(소문자, 하이픈, 구두점 제거)하여 파일명을 만듭니다.
4. `.mission/templates/MDR_TEMPLATE.md`를 채워 렌더링하며, 채워지지 않은 섹션에는 placeholder를 남깁니다.
5. 기본값: `Status: Proposed`, 오늘 날짜, `[target version]` / `[author]` placeholder.
6. markdown과 제안 경로를 반환합니다. **기본적으로 파일을 저장하지 않습니다** — 사용자가 편집 후 명시적으로 저장하도록 호출자가 제어합니다.

## MDR 작성 트리거 (MDR_TEMPLATE.md 기준)

1. `goal` 방향이 바뀌는 경우
2. `constraints` 정책이 바뀌는 경우
3. `done_when` 평가 철학이 바뀌는 경우
4. `evals` ↔ `done_when` 연결 방식이 바뀌는 경우
5. public command surface 또는 naming rule이 바뀌는 경우
6. cross-platform contract가 바뀌는 경우

변경이 위 6개에 해당하지 않으면 MDR 없이 `mission-history.yaml` 엔트리만 남겨도 충분합니다.

## 호출

라이브러리:

```ts
import { generateMdrDraft } from "mission-spec";

const { markdown, suggestedPath, nextMdrNumber } = generateMdrDraft({
  title: "결정론적 CHANGELOG 생성 도입",
  context: "CHANGELOG.md가 mission-history.yaml과 여러 번 어긋남",
  decision:
    "pre-commit 훅에서 mission-history.yaml로부터 CHANGELOG.md 자동 생성",
  projectDir: ".",
});
```

## 관련

- `.mission/decisions/` — MDR 아카이브
- `.mission/templates/MDR_TEMPLATE.md` — 이 skill이 채우는 기준 템플릿
- `mission-history.yaml`의 `related_decisions` 필드로 MDR ID 연결
