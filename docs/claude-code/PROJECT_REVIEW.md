# Mission Spec Critical Review

> Snapshot: 2026-04-07, v1.3.0 기준. Reviewer: Claude Opus 4.6.

## 1. Executive Summary

Mission Spec v1.3.0은 이전 Codex/Gemini 리뷰 시점(v1.1.0~v1.2.0) 대비 상당한 개선이 이루어졌습니다.

- 63/63 테스트 통과, build clean, schema validation pass, platform verify pass
- dogfooding `evaluateMission('.')` 결과 **9/9 criteria passed**
- 루트 export API 정비 완료 (`src/index.ts`에서 6개 함수 export)
- `package.json` exports 맵 추가 (subpath import 지원)
- evaluator에 automated eval 실행 로직 추가 (`execSync` 기반)
- OpenCode 변환이 TOML 배열 문법으로 개선

이전 리뷰의 High 이슈 대부분이 해소되었으나, 몇 가지 잔여 이슈와 새로운 관찰이 있습니다.

## 2. Verification Results

실행한 검증:

| 검증                                         | 결과                |
| -------------------------------------------- | ------------------- |
| `npm run build`                              | 성공                |
| `npm test` (vitest)                          | 63/63 통과          |
| `node scripts/validate-schema.js`            | 3 fixtures 통과     |
| `node scripts/convert-platforms.js --verify` | 통과                |
| `evaluateMission('.')`                       | 9/9 criteria passed |
| `tsc --noEmit` (lint)                        | 성공                |

## 3. Previous Review Issues - Status

### Codex 리뷰 이슈 (v1.2.0 시점)

| #   | 이슈                                   | 현재 상태                                                                                 |
| --- | -------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | README API와 실제 export 불일치        | **해결됨.** `src/index.ts`에서 6개 함수 export, `package.json` exports 맵 추가            |
| 2   | done_when과 evals 연결 안 됨           | **해결됨.** mission.yaml의 done_when이 자동 평가 가능한 형태로 재설계                     |
| 3   | SKILL.md와 evaluator 동작 불일치       | **부분 해결.** `skills/eval/SKILL.md`가 현재 동작을 정확히 기술                           |
| 4   | plugin marketplace 설치 주장 근거 부족 | **개선됨.** `plugin.json`, `marketplace.json`, `skills/` 존재. 실제 설치 테스트 통과 확인 |
| 5   | docs/internal 문서와 현실 괴리         | **미해결.** `.gitignore`에 포함되어 공개되지 않으나, 내부적으로는 여전히 구식             |
| 6   | Gemini 리뷰 사실 오류                  | **완화.** archived 표기 추가됨                                                            |

### Gemini 리뷰 이슈 (v1.1.0 시점)

| #   | 이슈                           | 현재 상태                                                    |
| --- | ------------------------------ | ------------------------------------------------------------ |
| 1   | evals automated 실행 로직 부재 | **해결됨.** `evaluator.ts:24-43`에 `execSync` 기반 실행 추가 |
| 2   | NL 파싱이 단순함               | **개선됨.** 동사 기반 추론 로직 추가 (`init.ts:78-95`)       |
| 3   | OpenCode TOML 비표준           | **해결됨.** `tomlArray()` 함수로 TOML 배열 문법 사용         |

## 4. New Findings

### 4.1 version 불일치 (Severity: Medium)

`plugin.json:2`과 `package.json:3`은 `1.3.0`인데, `marketplace.json:13`도 `1.3.0`으로 일치합니다. 그러나 `mission.yaml:5`의 title은 "v1.3"이고 `mission.yaml:8`의 version도 `1.3.0`입니다. 현재는 정합적이나, 향후 버전 업 시 4곳을 동시에 수정해야 하므로 drift 위험이 있습니다.

**권고:** 버전을 단일 소스(package.json)에서 관리하고 나머지는 빌드 시 자동 동기화하거나, 문서에 "version source of truth는 package.json"임을 명시.

### 4.2 evaluator의 execSync는 보안 경계가 없음 (Severity: Medium)

`evaluator.ts:31`의 `execSync(matchingEval.command, { cwd: projectDir, stdio: 'ignore' })`는 mission.yaml에 정의된 임의의 셸 명령을 실행합니다. mission.yaml은 사용자가 직접 작성하는 파일이므로 현재 scope에서는 허용 가능하지만, 향후 외부 mission.yaml을 평가하는 시나리오가 생기면 command injection 위험이 됩니다.

**권고:** 현재는 "자신의 mission.yaml만 평가"라는 전제를 문서에 명시. 외부 미션 평가 기능 추가 시 sandbox/allowlist 검토.

### 4.3 skill 디렉토리명과 SKILL.md name 필드 불일치 (Severity: Low)

Claude Code 플러그인 시스템에서 skill ID는 디렉토리명에서 결정됩니다:

| 디렉토리         | SKILL.md `name` | 실제 호출 ID          |
| ---------------- | --------------- | --------------------- |
| `skills/init/`   | `ms-init`       | `mission-spec:init`   |
| `skills/eval/`   | `ms-eval`       | `mission-spec:eval`   |
| `skills/status/` | `ms-status`     | `mission-spec:status` |
| `skills/report/` | `ms-report`     | `mission-spec:report` |

SKILL.md의 `name: ms-init`은 실제 호출에 반영되지 않고, 디렉토리명 `init`이 skill ID가 됩니다. `/mission-spec:ms-init`은 작동하지 않고, `/mission-spec:init`이 올바른 호출입니다. 이는 README나 mission.yaml에서 참조할 때 혼란을 줄 수 있습니다.

**권고:** 디렉토리를 `ms-init/`, `ms-eval/` 등으로 변경하거나, 현재 디렉토리명 기준으로 문서를 통일. `name` 필드의 역할을 명확히 이해한 후 결정.

### 4.4 README에서 marketplace 설치 방법 제거됨 (Severity: Low)

이전 README에는 `/plugin marketplace add chquandogong/mission-spec` 방법이 있었으나 현재는 소스 설치와 로컬 플러그인 연결만 안내합니다. 실제로 marketplace를 통한 설치가 작동하는 상태이므로 해당 방법을 다시 포함하는 것이 유용합니다.

**권고:** marketplace 설치 방법을 README에 재추가하되, "실험적" 등의 표기로 현실적 기대치를 설정.

### 4.5 docs/internal 문서가 여전히 구식 (Severity: Low)

`.gitignore`에 포함되어 공개되지 않지만, 로컬에서 작업 시 `ARCHITECTURE.md`가 `manifest.json`, `tsup`, `github.ts` 등 존재하지 않는 파일/도구를 참조합니다. CLAUDE.md 심링크를 통해 Claude Code가 이 문서를 읽으면 잘못된 가정을 할 수 있습니다.

**권고:** `docs/internal/CLAUDE.md`를 현재 구현에 맞게 업데이트하거나, 심링크 대상을 별도의 최신 CLAUDE.md로 교체.

## 5. Architecture Assessment

### 5.1 모듈 구조

```
src/
  schema/           validator.ts, mission.schema.json
  core/             parser.ts, evaluator.ts, reporter.ts
  commands/         init.ts, eval.ts, status.ts, report.ts
  adapters/         platforms.ts
  index.ts          public API re-exports
skills/             Claude Code SKILL.md files
.claude-plugin/     plugin.json, marketplace.json
```

**평가:** 관심사 분리가 적절합니다. schema 검증 → 파싱 → 평가 → 보고의 파이프라인이 명확합니다. `core/`와 `commands/`의 분리로 라이브러리 사용과 CLI/skill 사용이 독립적입니다.

### 5.2 Schema 설계

JSON Schema draft-07 기반으로 `allOf` + `if/then`을 사용한 조건부 필수 필드가 잘 작동합니다:

- `automated` eval: `command` + `pass_criteria` 필수
- `manual` eval: `description` 필수
- `llm-judge` eval: `pass_criteria` 필수

`additionalProperties: false`는 엄격하지만, v1의 contract layer 성격에 적합합니다. 확장이 필요하면 스키마 버전을 올리는 것이 올바른 접근입니다.

### 5.3 Evaluator 설계

v1.3.0의 evaluator는 3단계 평가 체계를 갖습니다:

1. **evals 매칭**: `eval.name === criterion` && `type: automated` → `execSync` 실행
2. **파일 존재**: `"X 존재"` 패턴 → `existsSync` 확인
3. **수동 확인**: 위 두 가지에 해당하지 않으면 수동 확인 요구

이 설계의 핵심 제약은 **done_when 문구와 eval name의 문자열 일치**에 의존한다는 점입니다. 현재 mission.yaml은 이를 잘 활용하도록 재설계되었으나, 사용자가 자연어 서술형 done_when을 쓰면 자동 평가가 작동하지 않습니다.

### 5.4 Cross-Platform 변환

v1.3.0에서 OpenCode 변환이 개선되었습니다:

- TOML 배열 문법 (`tomlArray()`) 사용
- 멀티라인은 triple-quote (`"""`)
- 단일라인은 backslash/quote escaping

Cursor (markdown)와 Codex (markdown checklist) 변환은 단순하지만 적절합니다.

## 6. Test Coverage Assessment

| 테스트 파일         | 테스트 수 | 커버 영역                                  |
| ------------------- | --------- | ------------------------------------------ |
| `schema.test.ts`    | 15        | 스키마 검증 (valid/invalid, 조건부 필수)   |
| `init.test.ts`      | 9         | 미션 초안 생성 (컨텍스트, 제약, 빈 goal)   |
| `eval.test.ts`      | 9         | 평가 (파일 존재, 테스트 패턴, 스키마 무효) |
| `status.test.ts`    | 7         | 상태 요약 (진행률, constraints, markdown)  |
| `report.test.ts`    | 8         | 리포트 (PASS/FAIL, 메타데이터, 타임스탬프) |
| `platforms.test.ts` | 14        | 크로스 플랫폼 (멀티라인, 따옴표, 최소)     |
| `index.test.ts`     | 1         | 루트 export 확인                           |

**평가:** 핵심 기능에 대한 커버리지는 양호합니다. 개선 여지가 있는 부분:

- evaluator의 `execSync` 경로에 대한 테스트가 없음 (automated eval 실행 성공/실패)
- `loadAndValidateMission`의 에러 경로 테스트가 각 command 테스트에 분산되어 있음
- `deriveDoneWhenFromGoal`의 동사 패턴 매칭에 대한 직접 테스트가 없음 (init.test.ts에서 간접적으로만)

## 7. Dogfooding Assessment

현재 `mission.yaml`의 done_when은 자동 평가 가능하게 재설계되었습니다:

- 파일 존재 체크 6개: `skills/*/SKILL.md`, `.claude-plugin/plugin.json`, `README.md`
- automated eval 3개: `schema_validation_passes`, `command_test`, `cross_platform_verifies`

`evaluateMission('.')` 실행 시 9/9 통과. 이전 버전에서 0/8이었던 것과 대비하면 dogfooding이 실질적으로 작동합니다.

다만 이전 done_when의 의미론적 목표("자연어에서 mission.yaml 초안 자동 생성" 등)가 기술적 체크("skills/init/SKILL.md 존재")로 대체되었으므로, 기능적 완성도와 파일 존재 여부는 다른 차원의 검증이라는 점을 인지해야 합니다.

## 8. Recommendations

### Priority: High

1. **skill ID 혼란 해결**: 디렉토리명 vs SKILL.md name 필드 불일치를 해결하고, README/mission.yaml의 참조를 통일.

### Priority: Medium

2. **evaluator execSync 테스트 추가**: automated eval 실행 경로의 성공/실패 케이스를 테스트로 커버.
3. **docs/internal/CLAUDE.md 갱신**: 심링크로 Claude Code가 읽는 문서이므로 현재 구현과 일치시킴.
4. **버전 관리 자동화**: 4곳에 분산된 버전을 단일 소스에서 동기화하는 메커니즘 도입.

### Priority: Low

5. **README에 marketplace 설치 방법 재추가**: 실제 작동하는 경로이므로 문서화 가치 있음.
6. **evaluator 보안 경계 문서화**: "자신의 mission.yaml만 평가"라는 전제를 명시.

## 9. Bottom Line

v1.3.0은 이전 리뷰들의 핵심 지적을 대부분 반영한 안정적인 상태입니다. 코어 라이브러리의 기능, 테스트, dogfooding이 일관되며, 문서와 구현의 괴리도 크게 줄었습니다. 남은 작업은 skill ID 정리와 테스트 보강 수준으로, 구조적 문제라기보다 완성도 개선에 해당합니다.
