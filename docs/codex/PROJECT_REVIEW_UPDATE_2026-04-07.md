# Mission Spec Critical Review Update

Date: 2026-04-07
Reviewer: Codex
Review Basis: repository state at commit `6551158`

## Summary

기존 [PROJECT_REVIEW.md](/home/chquan/projects/mission-spec/docs/codex/PROJECT_REVIEW.md)는 보존합니다. 이 문서는 그 이후 상태를 반영한 추가 업데이트입니다.

현재 `mission-spec`은 코어 라이브러리와 Claude Code skill bundle로서 안정적인 편입니다. `npm test`, `npm run build`, `npm run lint`, `node scripts/validate-schema.js`, `node scripts/convert-platforms.js --verify`는 모두 통과했고, 루트 `mission.yaml`을 `evaluateMission('.')`로 평가했을 때 `9/9 criteria passed`가 확인됐습니다.

다만 비판적으로 보면, 남은 이슈는 구현 자체보다 문서 계층의 정합성과 자동화 평가 경로의 테스트 부족에 집중됩니다.

## Re-Verification

직접 실행한 검증:

- `npm test` -> 63/63 통과
- `npm run build` -> 성공
- `npm run lint` -> 성공
- `node scripts/validate-schema.js` -> 성공
- `node scripts/convert-platforms.js --verify` -> 성공
- `evaluateMission('.')` -> `9/9 criteria passed — mission complete!`

## Updated Findings

### 1. `docs/` 내부 문서들은 여전히 서로 다른 현재를 설명합니다

심각도: High

현재 사용자용 README는 marketplace 설치, 라이브러리 사용법, 공개 범위를 비교적 명확히 설명합니다 (`README.md:17-30`, `README.md:59-103`, `README.md:151-156`).

하지만 `docs/` 내부에는 여전히 충돌이 있습니다.

- `docs/internal/SETUP-GUIDE.md`는 `ajv-formats`, `@vitest/coverage-v8` 설치를 안내하지만 (`docs/internal/SETUP-GUIDE.md:79-82`), 현재 `package.json`에는 없습니다 (`package.json:44-52`).
- `docs/internal/CLAUDE.md`는 주요 제약 설명에서 아직 `v1.3`이라고 적고 있습니다 (`docs/internal/CLAUDE.md:103`). 현재 실제 버전은 `1.4.0`입니다 (`package.json:3`, `mission.yaml:8`).
- `docs/gemini/PROJECT_REVIEW_V1.4.md`는 자동화 명령 실행 로직에 대한 테스트가 포함되어 안정성을 입증했다고 적지만 (`docs/gemini/PROJECT_REVIEW_V1.4.md:29-30`), 실제 eval 테스트에는 해당 경로의 성공/실패 검증이 없습니다 (`tests/commands/eval.test.ts:22-109`).

즉 README는 비교적 현실화됐지만, `docs/internal/*`와 일부 리뷰 문서는 현재 상태의 authoritative source로 쓰기 어렵습니다.

### 2. self-dogfooding은 통과하지만, 검증 의미는 기술 체크 중심입니다

심각도: Medium

현재 `mission.yaml`의 `done_when`은 다음 두 그룹으로 구성됩니다.

- 파일 존재 체크: `skills/ms-*/SKILL.md`, `.claude-plugin/plugin.json`, `README.md` (`mission.yaml:23-29`)
- automated eval 이름: `schema_validation_passes`, `command_test`, `cross_platform_verifies` (`mission.yaml:30-32`, `mission.yaml:48-63`)

이 덕분에 self-dogfooding은 안정적으로 통과합니다. 하지만 이 기준은 사용자 가치 검증보다 구현 산출물 존재 여부와 스크립트 통과 여부에 가깝습니다.

예를 들어 `goal`은 "자연어 -> mission draft 자동 생성 -> eval scaffold -> run report"를 말하지만 (`mission.yaml:10-13`), 현재 `done_when`은 그 기능을 직접 검증하지 않습니다. 이 차이는 시스템의 "운영 가능성"은 보여주지만, "사용자 관점 완성도"까지 직접 보장하지는 않습니다.

### 3. evaluator의 `execSync` 경로는 작동하지만 테스트가 부족합니다

심각도: Medium

현재 evaluator는 `eval.name === criterion`일 때 `execSync`로 automated eval을 실행합니다 (`src/core/evaluator.ts:24-42`). 이 경로는 실제 프로젝트 dogfooding에서 쓰이고 있고 작동합니다.

문제는 테스트입니다. `tests/commands/eval.test.ts`는 파일 존재, 요약, 스키마 오류, 테스트 관련 fallback을 커버하지만 (`tests/commands/eval.test.ts:22-109`), automated eval의 성공/실패 경로는 직접 검증하지 않습니다.

이건 회귀 위험이 있는 지점입니다. 현재 구조상 한두 개의 테스트만 추가해도 안정성이 크게 올라갑니다.

### 4. 공개 API와 skill naming은 이전보다 훨씬 정리됐습니다

심각도: Low

이전 리뷰와 달리 현재는 루트 export와 subpath export가 `package.json`에 명시되어 있고 (`package.json:8-29`), `src/index.ts`도 공개 함수를 재export합니다 (`src/index.ts:1-8`).

또한 skill 디렉토리명이 `skills/ms-init`, `skills/ms-eval`, `skills/ms-status`, `skills/ms-report`로 정리되어 `README`의 slash command 표현과도 더 자연스럽게 이어집니다 (`README.md:27-30`, `mission.yaml:24-27`).

이 부분은 더 이상 핵심 문제로 보지 않아도 됩니다.

## Recommendations

1. 기존 문서는 보존하되, `README.md` 또는 별도 `docs/CURRENT_STATE.md` 하나를 현재 authoritative source로 명시하십시오.

2. `docs/internal/SETUP-GUIDE.md`와 `docs/internal/CLAUDE.md`는 다음 수정 후보로 두십시오.
- `SETUP-GUIDE.md`: 실제 의존성 기준으로 업데이트 또는 archive 표기
- `CLAUDE.md`: `v1.4.0` 기준으로 버전 문구 정리

3. automated eval 경로 테스트를 추가하십시오.
- 성공 케이스 1개
- 실패 케이스 1개

4. self-dogfooding은 2계층으로 나누는 것이 좋습니다.
- 현재처럼 자동 판정 가능한 기술 기준
- 별도의 의미론적 milestone 또는 acceptance narrative

## Bottom Line

현재 프로젝트는 "문서가 과장하는 상태"에서 "코어 기능이 실제로 작동하는 상태"로 넘어왔습니다. 남은 리스크는 구현보다 문서 충돌과 테스트 공백입니다.

기존 문서를 archive로 유지하는 방향은 합리적입니다. 다만 앞으로는 새 문서 하나를 authoritative update로 삼아, 여러 리뷰 문서가 동시에 현재를 주장하지 않도록 관리하는 편이 좋습니다.
