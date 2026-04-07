# Mission Spec Critical Review

> Snapshot note: 이 문서는 2026-04-07 기준 진단 스냅샷입니다. 이후 반영된 수정은 별도 커밋에서 해결되었을 수 있습니다.

Date: 2026-04-07
Reviewer: Codex
Scope: repository root, `src/`, `tests/`, `scripts/`, `skills/`, `docs/`

## Executive Summary

이 프로젝트는 작은 TypeScript 기반 Mission Spec 라이브러리로서는 일관성이 있습니다. `npm test`, `npm run build`, `node scripts/validate-schema.js`, `node scripts/convert-platforms.js --verify`는 모두 통과했습니다.

다만 "문서가 약속하는 제품"과 "현재 저장소가 실제로 제공하는 것" 사이의 간극은 큽니다. 특히 Claude Code marketplace plugin, 공개 import API, dogfooding 상태, 내부 아키텍처 문서는 현재 구현보다 앞서 있거나 일부는 사실과 다릅니다.

## What I Verified

실행한 검증:

- `npm test` -> 62/62 통과
- `npm run build` -> 성공
- `node scripts/validate-schema.js` -> 성공
- `node scripts/convert-platforms.js --verify` -> 성공
- `node -e "import('./dist/commands/eval.js').then(({ evaluateMission }) => console.log(JSON.stringify(evaluateMission('.'), null, 2)))"` -> 프로젝트 루트 `mission.yaml` 기준 `0/8 criteria passed`

이 결과는 "기본 라이브러리 기능은 동작한다"는 점은 뒷받침하지만, "프로젝트가 스스로 선언한 완료 상태에 도달했다"는 주장은 뒷받침하지 않습니다.

## Findings

### 1. README가 약속하는 공개 API가 실제 패키지 export와 맞지 않습니다

심각도: High

`README.md`는 `generateMissionDraft`를 루트 패키지에서 import할 수 있다고 안내합니다 (`README.md:71-79`). 하지만 실제 루트 export는 `validateMission`과 `parseMissionFile`뿐입니다 (`src/index.ts:1-3`).

또한 `README.md`는 `mission-spec/commands/eval`, `mission-spec/commands/status`, `mission-spec/commands/report` 같은 서브패스 import를 예시로 제시합니다 (`README.md:83-105`). 그런데 `package.json`에는 `exports` 맵이 없고 (`package.json:1-26`), 저장소 루트에도 `commands/` 디렉토리는 없으며 빌드 산출물은 `dist/commands/` 아래에만 생성됩니다. 따라서 README 예시는 배포 패키지 사용자 관점에서 그대로는 성립하지 않을 가능성이 높습니다. 이 판단은 파일 구조와 `package.json` 기준의 추론입니다.

영향:

- 설치 후 README 예제를 그대로 따라 하면 import 단계에서 막힐 수 있습니다.
- 문서 신뢰도가 크게 떨어집니다.

### 2. 프로젝트 자체 `mission.yaml`의 `evals`가 실제 평가 엔진에 연결되지 않습니다

심각도: High

평가 엔진은 `evals.find((e) => e.name === criterion && e.type === 'automated')` 조건으로만 자동화 명령을 실행합니다 (`src/core/evaluator.ts:24-31`). 즉 `eval.name`이 `done_when`의 개별 문구와 정확히 같아야 합니다.

그런데 프로젝트 루트 `mission.yaml`의 `done_when`은 `/mission-spec:ms-init 명령으로 ...` 같은 자연어 문장이고 (`mission.yaml:23-31`), `evals`의 이름은 `schema_validity`, `command_test`, `cross_platform`입니다 (`mission.yaml:47-62`). 둘은 서로 매핑되지 않습니다.

실제로 프로젝트 루트에서 `evaluateMission('.')`를 실행하면 `0/8 criteria passed`가 나왔고, 8개 항목 모두 `자동 평가 불가 — 수동 확인 필요`로 반환되었습니다.

영향:

- 저장소가 스스로 선언한 dogfooding 미션을 자동으로 검증하지 못합니다.
- `evals` 필드가 존재해도 현재 구현에서는 쉽게 휴면 설정이 됩니다.

### 3. 스킬 문서와 실제 평가 동작이 다릅니다

심각도: Medium

`skills/eval/SKILL.md`는 "테스트 통과" 조건이 있으면 `npm test`를 직접 실행해 통과 여부를 알려준다고 설명합니다 (`skills/eval/SKILL.md:20-23`, `skills/eval/SKILL.md:54-56`).

하지만 실제 구현은 테스트 관련 문구를 만나도 `npm test`를 실행하지 않습니다. 명시적으로 연결된 automated eval이 없으면 항상 실패로 두고 수동 확인을 요구합니다 (`src/core/evaluator.ts:62-68`).

영향:

- 사용자와 에이전트가 기대하는 평가 결과가 달라집니다.
- 스킬 문서를 신뢰하고 자동 평가를 기대하면 오판이 발생합니다.

### 4. "Claude Code plugin marketplace에 설치 가능" 주장은 구현 근거가 부족합니다

심각도: Medium

README는 marketplace 등록과 설치 후 `/mission-spec:ms-init`, `/mission-spec:ms-eval`, `/mission-spec:ms-status`, `/mission-spec:ms-report`를 바로 사용할 수 있다고 말합니다 (`README.md:17-38`).

하지만 실제 `.claude-plugin/plugin.json`은 메타데이터만 담고 있고 명령 선언이 없습니다 (`.claude-plugin/plugin.json:1-13`). 내부 문서는 `.claude-plugin/manifest.json`이 존재한다고 반복해서 서술하지만 (`docs/internal/ARCHITECTURE.md:177-178`, `docs/internal/CLAUDE.md:24-25`, `mission.yaml:94`), 저장소에는 그 파일이 없습니다.

`skills/*/SKILL.md`가 존재하므로 어떤 환경에서는 skill 기반 invocation이 가능할 수는 있습니다. 다만 현재 저장소만 기준으로는 README가 약속하는 "marketplace 설치 후 slash command 즉시 사용"을 충분히 입증하지 못합니다. 이 부분은 저장소 내부 근거를 바탕으로 한 추론입니다.

영향:

- 설치 경로와 실행 방식이 사용자 환경마다 달라질 수 있습니다.
- 문서대로 배포되었다고 보기 어렵습니다.

### 5. `docs/` 내부 문서 일부가 현재 저장소 상태와 어긋납니다

심각도: Medium

`docs/internal/ARCHITECTURE.md`는 `tsup`, `Claude Code Plugin SDK`, `ajv-formats`, `@vitest/coverage-v8`, `.claude-plugin/manifest.json`, `src/adapters/github.ts`를 현재 구성처럼 서술합니다 (`docs/internal/ARCHITECTURE.md:16-23`, `docs/internal/ARCHITECTURE.md:32-45`, `docs/internal/ARCHITECTURE.md:177-178`). 하지만 현재 `package.json`에는 해당 의존성이 없고 (`package.json:17-25`), 실제 파일 트리에도 `github.ts`와 `manifest.json`은 없습니다.

`docs/internal/CLAUDE.md`도 동일하게 `manifest.json`과 `src/adapters/github.ts`를 현재 구조로 적고 있습니다 (`docs/internal/CLAUDE.md:22-41`).

이 문서들이 "초기 설계 문서"라면 괜찮지만, 현행 구현 문서처럼 읽히기 때문에 오해를 부릅니다.

### 6. 기존 `docs/gemini/PROJECT_REVIEW.md`에는 검증 불가능하거나 사실과 다른 서술이 있습니다

심각도: Medium

기존 Gemini 리뷰는 `evals` 자동 실행 로직이 부재하다고 적습니다 (`docs/gemini/PROJECT_REVIEW.md:33-38`). 그러나 현재 구현에는 `execSync` 기반 automated eval 실행 로직이 이미 존재합니다 (`src/core/evaluator.ts:24-43`).

반대로 Gemini 리뷰는 `npm test`와 `ms:eval` 결과가 `62/62`로 일치한다고 적습니다 (`docs/gemini/PROJECT_REVIEW.md:58-60`). 실제 `evaluateMission('.')` 결과는 `0/8`이므로 이 문장은 현재 저장소 기준으로 사실이 아닙니다.

또한 문서 버전 표기는 `1.1.0`인데 (`docs/gemini/PROJECT_REVIEW.md:3-5`), 현재 패키지와 프로젝트 미션 버전은 `1.2.0`입니다 (`package.json:2-3`, `mission.yaml:5-8`).

영향:

- 기존 검토 문서를 근거로 의사결정하면 현재 상태를 잘못 판단할 수 있습니다.

## Strengths

- 스키마 검증 경계는 비교적 분명합니다. 필수/선택 필드와 조건부 필드 요구사항이 코드와 테스트에서 일관됩니다.
- 테스트는 현재 구현 범위를 안정적으로 고정하고 있습니다. 적어도 리포지토리 안의 핵심 라이브러리 동작은 회귀에 강합니다.
- OpenCode TOML 변환은 기존 Gemini 문서의 지적과 달리 현재는 배열과 멀티라인 문자열을 제대로 처리합니다 (`src/adapters/platforms.ts:47-65`, `tests/platforms.test.ts`).

## Recommendations

1. README를 즉시 현실화하십시오.
루트 export와 서브패스 import 예제를 실제 배포 형태에 맞게 수정하거나, 반대로 `exports`를 추가해 README 약속을 구현해야 합니다.

2. `done_when`과 `evals`의 연결 모델을 재설계하십시오.
현재처럼 `eval.name === criterion` 문자열 일치에 의존하지 말고, `done_when` 항목이 참조하는 eval id를 두거나 `evals` 자체를 독립적인 평가 단위로 집계하는 편이 안전합니다.

3. plugin/skill 문서를 단일한 현재 상태로 정리하십시오.
`plugin.json`, `marketplace.json`, `skills/*/SKILL.md`, `README.md`, `docs/internal/*`가 서로 다른 제품을 설명하고 있습니다. "현재 지원"과 "계획"을 분리해야 합니다.

4. dogfooding 기준을 다시 정의하십시오.
현재 `mission.yaml`은 사람이 읽기 좋은 완료 선언에는 적합하지만 자동 평가에는 거의 연결되지 않습니다. 자동 평가 가능한 `done_when` 또는 `evals` 중심 미션으로 바꿔야 self-hosting 검증이 가능합니다.

5. `docs/gemini/PROJECT_REVIEW.md`는 보관용으로 명시하거나 갱신하십시오.
현재 상태 보고서처럼 남겨두면 혼선을 만듭니다.

## Bottom Line

이 저장소는 "Mission Spec 코어 라이브러리"로 보면 꽤 안정적입니다. 그러나 "설치 가능한 Claude Code marketplace plugin"과 "자체 dogfooding까지 완료한 제품"으로 보기에는 문서와 메타데이터가 구현을 앞질러 있습니다.

가장 먼저 고칠 것은 기능보다 서술입니다. 지금은 코드보다 문서가 더 과감하게 약속하고 있습니다.
