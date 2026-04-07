# Mission Spec Project Critical Review & Verification Report

> Archived note: 이 문서는 v1.1.0 시점의 외부 리뷰 스냅샷입니다. 현재 저장소의 authoritative review는 `docs/codex/PROJECT_REVIEW.md`를 기준으로 봅니다.

**Date:** 2026-04-07
**Version:** 1.1.0 (Dogfooding)
**Reviewer:** Gemini CLI

---

## 1. Executive Summary

Mission Spec은 AI 에이전트 워크플로를 위한 **Task Contract Layer**로서, 명확한 철학과 아키텍처를 기반으로 구현되었습니다. 
본 프로젝트는 "Task Contract Only", "Zero Dependencies", "TDD First"라는 핵심 원칙을 충실히 따르고 있으며, 
자체 `mission.yaml`을 통한 dogfooding으로 실효성을 증명하고 있습니다.

현재 v1.1.0 상태는 스키마 정의와 기본적인 CLI 명령(init, eval, status, report)이 안정적으로 작동하며, 
62개의 테스트 케이스를 통해 높은 신뢰성을 확보하고 있습니다.

---

## 2. Critical Analysis (비판적 검토)

### 2.1 아키텍처 및 설계 원칙 (Principles)
- **Task Contract Only**: 프로젝트가 Orchestration framework(LangGraph, CrewAI 등)로 확장되지 않고, 작업 계약서(`mission.yaml`)에 집중하고 있는 점이 매우 긍정적입니다. 
- **Zero/Minimal Dependencies**: `ajv`와 `yaml` 외에 외부 의존성을 배제하여 이식성을 극대화했습니다. 
- **Execution Hints**: `execution_hints`를 advisory로 정의하여 런타임의 자율성을 존중하는 설계는 AI 에이전트 환경에 적합합니다.

### 2.2 핵심 구성 요소 분석 (Core Components)

#### 2.2.1 Schema (`mission.schema.json`)
- **강점**: JSON Schema draft-07을 사용하여 `mission` 객체를 엄격하게 정의했습니다. `allOf`, `if`/`then`을 활용한 조건부 필수 필드 설정이 매우 정교합니다.
- **약점**: `additionalProperties: false`로 인해 향후 확장 시 스키마 수정이 필수적입니다. (의도된 설계라면 적절함)

#### 2.2.2 Evaluator (`evaluator.ts`)
- **현황**: 현재 v1 수준의 rule-based 평가 엔진입니다. 파일 존재 여부와 단순한 "test pass" 패턴 매칭만 지원합니다.
- **비판**: 
  - `evals` 배열에 정의된 `automated` 커맨드를 실제로 실행하는 로직이 아직 부재합니다. 
  - `llm-judge` 타입에 대한 실제 LLM 연동이 없어, 대부분의 정교한 조건은 "수동 확인 필요"로 분류됩니다.
  - **제언**: 차기 버전에서 `child_process`를 통한 `command` 실행 및 LLM API 연동이 필수적입니다.

#### 2.2.3 Init Command (`init.ts`)
- **현황**: 자연어 목표(`goal`)에서 제목과 완료 조건을 추출하는 휴리스틱 로직입니다.
- **비판**: 현재의 `deriveDoneWhenFromGoal`은 목표의 첫 줄을 그대로 사용하고 "모든 테스트 통과"를 추가하는 수준입니다. 
  - **제언**: 더 정교한 NL 파싱이 필요하며, 프로젝트 컨텍스트(README 등)를 더 깊게 반영해야 합니다.

#### 2.2.4 Cross-Platform (`platforms.ts`)
- **현황**: Cursor, Codex, OpenCode 지원.
- **비판**: `convertToOpenCode`에서 TOML 배열 대신 `item_1`, `item_2` 식의 커스텀 키를 사용하는 것은 표준성 면에서 아쉽습니다. `yaml` 라이브러리를 이미 사용 중이므로, TOML 라이브러리 추가 없이도 더 나은 표현 방식을 고민할 필요가 있습니다.

---

## 3. Verification (검증 결과)

### 3.1 테스트 결과
- **Total Tests**: 62
- **Passed**: 62 (100%)
- **Test Quality**: TDD 원칙에 따라 Edge case(invalid yaml, missing files 등)를 잘 커버하고 있습니다.

### 3.2 Dogfooding 검증
- 프로젝트 루트의 `mission.yaml`은 프로젝트 자체의 목표를 정확히 기술하고 있습니다.
- `npm test` 및 `ms:eval` 실행 시 현재 진행 상황이 62/62로 완벽히 일치함을 확인했습니다.

### 3.3 문서화 검토 (`docs/internal/`)
- `ARCHITECTURE.md`: 실제 코드와 일치하는 아키텍처 가이드 제공.
- `BOOTSTRAP-PROMPT.md`: 자율 실행을 위한 훌륭한 프롬프트 엔지니어링 결과물.
- `CLAUDE.md`: 프로젝트의 identity와 제약을 명확히 명시.
- **주의**: 내부 문서에서 제안된 로직(예: 복잡한 NL 파싱)이 실제 코드(init.ts)보다 앞서 있는 경우가 발견되었습니다. 이는 "Living Document"로서의 특성이기도 하지만, 구현과의 Gap을 인지해야 합니다.

---

## 4. Final Recommendations (최종 제언)

1. **Evaluator 강화 (Priority: High)**: `mission.schema.json`에 정의된 `evals`의 `automated` 커맨드를 실제로 실행하고 결과를 반영하는 기능을 추가하십시오.
2. **NL Engine 업그레이드 (Priority: Medium)**: `/mission-spec:ms-init` 시 단순히 텍스트를 자르는 것이 아니라, 목표 내의 '동사+목적어'를 추출하여 더 구체적인 `done_when` 리스트를 생성하도록 개선하십시오.
3. **OpenCode 포맷 표준화 (Priority: Low)**: OpenCode(TOML) 변환 시 배열 형식을 지원하여 범용성을 높이십시오.
4. **CI 통합**: `/mission-spec:ms-eval`을 GitHub Action 등 CI 단계에 추가하여 PR 시마다 미션 달성률을 자동으로 체크하도록 구성하십시오.

---

**결론**: Mission Spec은 AI 에이전트 시대의 필수적인 '작업 계약' 인프라로서 매우 견고한 출발점에 서 있습니다. 핵심 원칙을 유지하면서 평가 엔진의 자율성을 점진적으로 높여간다면, 강력한 Agent OS의 초석이 될 것입니다.
